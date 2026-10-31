import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Check, X } from 'lucide-react';
import styles from './PopularDoctorActionButtons.module.css';

/**
 * High-performance, zero-flicker Popular Doctor Action Buttons.
 * - Button 1: Green Tick (✓) - Explicitly sets isStarDoctor = true ("Mark as Popular")
 * - Button 2: Red Cross (✕) - Explicitly sets isStarDoctor = false ("Remove from Popular")
 * - Strictly idempotent: clicking ✓ repeatedly or ✕ repeatedly never inverts or toggles state
 * - Request sequence tracking prevents stale/out-of-order network responses from overwriting newer user clicks
 * - Monotonic timestamp tracking ensures backend MongoDB database convergence
 * - Fixed side-by-side dimensions without dynamic remounting to prevent layout shifts
 * - Instant optimistic UI update with graceful rollback if the network request fails
 */

// Monotonically increasing client timestamp generator prevents collision and clock skew issues
let lastClientTimestamp = 0;
const getMonotonicTimestamp = (baseTimestamp = 0) => {
  const now = Date.now();
  lastClientTimestamp = Math.max(now, lastClientTimestamp + 1, Number(baseTimestamp || 0) + 1);
  return lastClientTimestamp;
};

const PopularDoctorActionButtons = React.memo(({
  doctor,
  isPopular,
  onSetPopular,
  onToggle,
  showToast,
  disabled = false
}) => {
  const docId = String(doctor?._id || doctor?.id || '');
  const serverPopular = isPopular !== undefined ? Boolean(isPopular) : Boolean(doctor?.isStarDoctor);
  const serverStarTs = Number(doctor?.starUpdatedAt || 0);

  // Local optimistic state for instant UI response without flashing
  const [currentPopular, setCurrentPopular] = useState(serverPopular);
  const [isPending, setIsPending] = useState(false);

  // Ref tracking latest user intended state across rapid clicks (prevents stale closures)
  const latestPopularRef = useRef(serverPopular);
  const lastUserActionTimestampRef = useRef(0);
  const latestAppliedStarTsRef = useRef(serverStarTs);
  const activeSequenceRef = useRef(0);
  const inFlightCountRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Synchronize with external prop updates only when there are no pending in-flight user mutations
  // and protect against stale parent props / out-of-order broadcasts
  useEffect(() => {
    if (inFlightCountRef.current === 0) {
      if (serverStarTs > latestAppliedStarTsRef.current) {
        latestAppliedStarTsRef.current = serverStarTs;
        latestPopularRef.current = serverPopular;
        setCurrentPopular(serverPopular);
      } else if (lastUserActionTimestampRef.current === 0) {
        latestAppliedStarTsRef.current = Math.max(latestAppliedStarTsRef.current, serverStarTs);
        latestPopularRef.current = serverPopular;
        setCurrentPopular(serverPopular);
      }
    }
  }, [serverPopular, serverStarTs]);

  const handleAction = useCallback(async (e, targetValue) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled || !docId) return;

    // Strict idempotency: if user clicks an already active state and no request is in-flight, do nothing
    if (latestPopularRef.current === targetValue && inFlightCountRef.current === 0) {
      return;
    }

    // Increment request sequence counter, record action timestamp, and increment in-flight count
    const currentSeq = ++activeSequenceRef.current;
    const now = Date.now();
    lastUserActionTimestampRef.current = now;
    latestAppliedStarTsRef.current = Math.max(now, latestAppliedStarTsRef.current + 1);
    inFlightCountRef.current += 1;

    // Explicit, non-toggle assignment
    latestPopularRef.current = targetValue;

    // Instant optimistic update
    setCurrentPopular(targetValue);
    setIsPending(true);

    // Instant optimistic toast notification with zero network latency delay
    const isHospitalContext = Boolean(onSetPopular);
    if (showToast) {
      showToast(
        targetValue
          ? (isHospitalContext ? `⭐ ${doctor?.name || 'Doctor'} marked as Hospital Star Doctor!` : `⭐ ${doctor?.name || 'Doctor'} marked as Popular Doctor!`)
          : (isHospitalContext ? `Removed ${doctor?.name || 'Doctor'} from Hospital Star Doctors.` : `Removed ${doctor?.name || 'Doctor'} from Popular Doctors.`),
        'success',
        2500
      );
    }

    const clientTimestamp = getMonotonicTimestamp(doctor?.starUpdatedAt);
    const extraPayload = { starMutationTimestamp: clientTimestamp };

    try {
      if (onSetPopular) {
        await onSetPopular(targetValue, extraPayload);
      } else if (onToggle) {
        await onToggle(docId, targetValue, extraPayload);
      }

      // If a newer click occurred while this network request was in-flight, discard this completion
      if (currentSeq !== activeSequenceRef.current || !isMountedRef.current) {
        return;
      }
    } catch (err) {
      // If a newer click occurred, do not rollback older state
      if (currentSeq !== activeSequenceRef.current || !isMountedRef.current) {
        return;
      }

      // Rollback to server state on genuine API failure of the latest request
      lastUserActionTimestampRef.current = 0;
      latestPopularRef.current = serverPopular;
      setCurrentPopular(serverPopular);

      if (showToast) {
        showToast(err.message || 'Failed to update popular doctor status', 'error', 4000);
      }
    } finally {
      inFlightCountRef.current = Math.max(0, inFlightCountRef.current - 1);
      if (inFlightCountRef.current === 0 && isMountedRef.current) {
        setIsPending(false);
        lastUserActionTimestampRef.current = 0;
        latestAppliedStarTsRef.current = Math.max(latestAppliedStarTsRef.current, Number(doctor?.starUpdatedAt || 0));
        setCurrentPopular(latestPopularRef.current);
      }
    }
  }, [disabled, docId, serverPopular, doctor?.name, doctor?.starUpdatedAt, onSetPopular, onToggle, showToast]);

  const isHospitalContext = Boolean(onSetPopular);

  return (
    <div className={styles.popularBtnGroup} role="group" aria-label="Popular Doctor Controls">
      {/* Button 1: Green Tick (✓) */}
      <button
        type="button"
        disabled={disabled}
        className={`${styles.popularActionBtn} ${styles.popularTickBtn} ${currentPopular ? styles.popularTickActive : ''}`}
        onClick={(e) => handleAction(e, true)}
        aria-busy={isPending}
        aria-pressed={currentPopular}
        title={isHospitalContext ? "Feature as Hospital Star Doctor" : "Mark as Popular"}
      >
        <Check size={14} strokeWidth={2.8} />
      </button>

      {/* Button 2: Red Cross (✕) */}
      <button
        type="button"
        disabled={disabled}
        className={`${styles.popularActionBtn} ${styles.popularCrossBtn} ${!currentPopular ? styles.popularCrossActive : ''}`}
        onClick={(e) => handleAction(e, false)}
        aria-busy={isPending}
        aria-pressed={!currentPopular}
        title={isHospitalContext ? "Remove from Hospital Star Doctors" : "Remove from Popular"}
      >
        <X size={14} strokeWidth={2.8} />
      </button>
    </div>
  );
}, (prevProps, nextProps) => {
  const prevPopular = prevProps.isPopular !== undefined ? Boolean(prevProps.isPopular) : Boolean(prevProps.doctor?.isStarDoctor);
  const nextPopular = nextProps.isPopular !== undefined ? Boolean(nextProps.isPopular) : Boolean(nextProps.doctor?.isStarDoctor);

  return (
    String(prevProps.doctor?._id || prevProps.doctor?.id) === String(nextProps.doctor?._id || nextProps.doctor?.id) &&
    prevPopular === nextPopular &&
    Number(prevProps.doctor?.starUpdatedAt || 0) === Number(nextProps.doctor?.starUpdatedAt || 0) &&
    prevProps.doctor?.name === nextProps.doctor?.name &&
    prevProps.disabled === nextProps.disabled
  );
});

PopularDoctorActionButtons.displayName = 'PopularDoctorActionButtons';
export default PopularDoctorActionButtons;
