import React, { useState, useCallback } from 'react';

/**
 * Hospital Home Status Control (Running on Home Page / Hidden from Home Page).
 * - Single source of truth: Renders directly from props (hospital.showOnHome !== false).
 * - Strictly idempotent: Writes an explicit boolean value (!isRunning).
 * - In-flight protection: Disables the button while a mutation is in progress to prevent double-fires.
 * - Single toast per user action on success/failure.
 */
const HospitalHomeStatusControl = React.memo(({
  hospital,
  onToggle,
  showToast
}) => {
  const hospId = String(hospital?._id || hospital?.id || '');
  const isRunning = hospital?.showOnHome !== false;
  const [isPending, setIsPending] = useState(false);

  const handleClick = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isPending || !hospId) return;

    // Explicit boolean target based on single source of truth
    const targetVal = !isRunning;
    const clientTimestamp = Date.now();

    setIsPending(true);

    try {
      if (onToggle) {
        await onToggle(hospId, targetVal, { homeMutationTimestamp: clientTimestamp });
      }

      if (showToast) {
        showToast(
          targetVal
            ? `⚡ ${hospital?.name || 'Hospital'} is now Running on the homepage marquee.`
            : `⏸️ ${hospital?.name || 'Hospital'} is now Hidden from the homepage marquee.`,
          'success',
          2500
        );
      }
    } catch (err) {
      if (showToast) {
        showToast(err?.message || 'Failed to update homepage visibility', 'error', 3000);
      }
    } finally {
      setIsPending(false);
    }
  }, [hospId, isRunning, hospital?.name, isPending, onToggle, showToast]);

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
        disabled={isPending}
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
          cursor: isPending ? 'not-allowed' : 'pointer',
          opacity: isPending ? 0.75 : 1,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isRunning ? '0 1px 3px rgba(22, 163, 74, 0.3)' : 'none',
          transition: 'background-color 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease',
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

  return (
    String(prevH?._id || prevH?.id) === String(nextH?._id || nextH?.id) &&
    (prevH?.showOnHome !== false) === (nextH?.showOnHome !== false) &&
    Number(prevH?.homeUpdatedAt || 0) === Number(nextH?.homeUpdatedAt || 0) &&
    prevH?.name === nextH?.name &&
    prevProps.onToggle === nextProps.onToggle &&
    prevProps.showToast === nextProps.showToast
  );
});

export default HospitalHomeStatusControl;
