import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * High-performance, zero-flicker Hospital Home Status Control (Running on Home Page / Hidden from Home Page).
 * - Zero visual jumping: Strictly stable 88px x 28px button layout
 * - Instant 0ms optimistic UI update across container, icon, text, and button
 * - Request sequence tracking prevents stale/out-of-order network responses from reverting newer user actions
 * - Monotonic timestamp tracking guarantees backend database convergence
 * - Ref-tracked latest intent avoids stale closures during rapid consecutive clicks
 * - Protects against background polling and SSE overwriting in-flight user interactions
 * - Graceful rollback with error toast only on genuine failure of the latest request
 */
let lastHospitalClientTimestamp = 0;
const getMonotonicHospitalTimestamp = (baseTimestamp = 0) => {
  const now = Date.now();
  lastHospitalClientTimestamp = Math.max(now, lastHospitalClientTimestamp + 1, Number(baseTimestamp || 0) + 1);
  return lastHospitalClientTimestamp;
};

const HospitalHomeStatusControl = React.memo(({
  hospital,
  onToggle,
  showToast
}) => {
  const hospId = String(hospital?._id || hospital?.id || '');
  const serverRunning = hospital?.showOnHome !== false;

  // Local optimistic state for instant UI response without flashing
  const [isRunning, setIsRunning] = useState(serverRunning);

  // Ref tracking latest user intended state across rapid clicks (prevents stale closures)
  const latestRunningRef = useRef(serverRunning);
  const lastUserActionTimestampRef = useRef(0);
  const activeSequenceRef = useRef(0);
  const inFlightCountRef = useRef(0);
  const isMountedRef = useRef(true);
  const onToggleRef = useRef(onToggle);
  onToggleRef.current = onToggle;
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Synchronize with external prop updates only when there are no pending in-flight user mutations
  // and protect against stale parent props / out-of-order broadcasts within a 3.5s grace window
  useEffect(() => {
    if (inFlightCountRef.current === 0) {
      const timeSinceUserAction = Date.now() - (lastUserActionTimestampRef.current || 0);
      if (timeSinceUserAction < 3500 && serverRunning !== latestRunningRef.current) {
        return;
      }
      latestRunningRef.current = serverRunning;
      setIsRunning(serverRunning);
    }
  }, [serverRunning]);

  const handleClick = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!hospId) return;

    // Increment request sequence counter, record action timestamp, and increment in-flight count
    const currentSeq = ++activeSequenceRef.current;
    lastUserActionTimestampRef.current = Date.now();
    inFlightCountRef.current += 1;

    // Deterministically toggle based on latest intent ref (never stale)
    const nextVal = !latestRunningRef.current;
    latestRunningRef.current = nextVal;

    // Instant optimistic update — UI reflects new state immediately
    setIsRunning(nextVal);

    const clientTimestamp = getMonotonicHospitalTimestamp(hospital?.homeUpdatedAt);

    try {
      if (onToggleRef.current) {
        await onToggleRef.current(hospId, nextVal, { homeMutationTimestamp: clientTimestamp });
      }

      // If a newer click occurred while this network request was in-flight, discard this completion
      if (currentSeq !== activeSequenceRef.current || !isMountedRef.current) {
        return;
      }

      if (showToastRef.current) {
        showToastRef.current(
          nextVal
            ? `⚡ ${hospital?.name || 'Hospital'} is now Running on the homepage marquee.`
            : `⏸️ ${hospital?.name || 'Hospital'} is now Hidden from the homepage marquee.`,
          'success',
          2500
        );
      }
    } catch (err) {
      // If a newer click occurred, do not rollback older state
      if (currentSeq !== activeSequenceRef.current || !isMountedRef.current) {
        return;
      }

      // Rollback to server state on genuine API failure of the latest request
      lastUserActionTimestampRef.current = 0;
      latestRunningRef.current = serverRunning;
      setIsRunning(serverRunning);

      if (showToastRef.current) {
        showToastRef.current(err.message || 'Failed to update homepage visibility', 'error', 3000);
      }
    } finally {
      inFlightCountRef.current = Math.max(0, inFlightCountRef.current - 1);
    }
  }, [hospId, hospital?.homeUpdatedAt, hospital?.name, serverRunning]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 12px',
      background: isRunning ? '#f0fdf4' : '#f8fafc',
      border: `1px solid ${isRunning ? '#bbf7d0' : '#e2e8f0'}`,
      borderRadius: '8px',
      margin: '10px 0 12px',
      transition: 'background-color 0.2s ease, border-color 0.2s ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '1rem', width: '20px', textAlign: 'center', display: 'inline-block' }}>
          {isRunning ? '⚡' : '⏸️'}
        </span>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isRunning ? '#15803d' : '#64748b' }}>
              {isRunning ? 'Running on Home Page' : 'Hidden from Home Page'}
            </span>
            <span style={{ fontSize: '0.62rem', background: '#e0e7ff', color: '#4338ca', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
              Admin Only
            </span>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
            {isRunning ? 'Active in homepage carousel marquee' : 'Not featured on homepage carousel'}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleClick}
        style={{
          width: '88px',
          height: '28px',
          minWidth: '88px',
          maxWidth: '88px',
          boxSizing: 'border-box',
          background: isRunning ? '#16a34a' : '#94a3b8',
          color: '#ffffff',
          border: 'none',
          borderRadius: '20px',
          padding: '0 10px',
          fontSize: '0.74rem',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isRunning ? '0 1px 3px rgba(22, 163, 74, 0.3)' : 'none',
          transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
          userSelect: 'none',
          whiteSpace: 'nowrap'
        }}
        title="Toggle home page marquee display (Admin only)"
      >
        <span>{isRunning ? '✓ Running' : '✕ Hidden'}</span>
      </button>
    </div>
  );
}, (prevProps, nextProps) => {
  const prevH = prevProps.hospital;
  const nextH = nextProps.hospital;

  // Custom memo comparator prevents unnecessary re-renders while accurately detecting relevant prop changes
  return (
    String(prevH?._id || prevH?.id) === String(nextH?._id || nextH?.id) &&
    (prevH?.showOnHome !== false) === (nextH?.showOnHome !== false) &&
    Number(prevH?.homeUpdatedAt || 0) === Number(nextH?.homeUpdatedAt || 0) &&
    prevH?.name === nextH?.name
  );
});

export default HospitalHomeStatusControl;
