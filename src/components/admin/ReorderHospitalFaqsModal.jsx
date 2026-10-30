import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  GripVertical,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  Loader2
} from 'lucide-react';

export default function ReorderHospitalFaqsModal({
  isOpen,
  onClose,
  faqs = [],
  hospitalName = 'Hospital',
  onSaveOrder
}) {
  const [items, setItems] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setItems([...faqs]);
      setSaveSuccess(false);
    }
  }, [isOpen, faqs]);

  if (!isOpen) return null;

  const moveItem = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(targetIdx, 0, moved);
    setItems(next);
  };

  const moveToFirst = (index) => {
    if (index === 0) return;
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.unshift(moved);
    setItems(next);
  };

  const moveToLast = (index) => {
    if (index === items.length - 1) return;
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.push(moved);
    setItems(next);
  };

  const moveToPosition = (fromIndex, toPosition) => {
    const toIndex = toPosition - 1;
    if (toIndex === fromIndex || toIndex < 0 || toIndex >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setItems(next);
  };

  const handleReverseOrder = () => {
    setItems([...items].reverse());
  };

  const handleReset = () => {
    setItems([...faqs]);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const orderedWithRanks = items.map((item, idx) => ({
        ...item,
        order: idx + 1
      }));
      await onSaveOrder(orderedWithRanks);
      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error('Failed to save reordered FAQs:', err);
      alert('Failed to save FAQ order: ' + (err.message || 'Please try again.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) onClose();
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '740px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            background: '#f8fafc'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #bfdbfe'
              }}
            >
              <ArrowUpDown size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                Change Order of Hospital FAQs
              </h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                Change which FAQs to put first and which to put last for {hospitalName}.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Toolbar */}
        <div
          style={{
            padding: '12px 24px',
            background: '#ffffff',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>
            Total FAQs to order: <strong style={{ color: '#2563eb' }}>{items.length}</strong>
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleReverseOrder}
              disabled={items.length < 2 || isSaving}
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#475569',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <ArrowUpDown size={12} />
              <span>Reverse All</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={isSaving}
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#64748b',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Reorderable List */}
        <div
          style={{
            padding: '16px 24px',
            overflowY: 'auto',
            maxHeight: 'calc(90vh - 200px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          {items.map((faq, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === items.length - 1;

            return (
              <div
                key={String(faq.id || faq._id || idx)}
                style={{
                  border: isFirst ? '1.5px solid #93c5fd' : isLast ? '1.5px solid #cbd5e1' : '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  background: isFirst ? '#f0f7ff' : '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Drag / Grip Indicator */}
                <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                  <GripVertical size={16} />
                </div>

                {/* Position Badge */}
                <div
                  style={{
                    minWidth: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: isFirst ? '#2563eb' : isLast ? '#475569' : '#eff6ff',
                    color: isFirst || isLast ? '#ffffff' : '#2563eb',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: isFirst || isLast ? 'none' : '1px solid #bfdbfe'
                  }}
                  title={isFirst ? 'First FAQ displayed' : isLast ? 'Last FAQ displayed' : `Position #${idx + 1}`}
                >
                  #{idx + 1}
                </div>

                {/* Question Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: '#0f172a',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '380px'
                      }}
                      title={faq.question}
                    >
                      {faq.question}
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        background: '#f1f5f9',
                        color: '#475569',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}
                    >
                      {faq.category || 'General'}
                    </span>
                    {isFirst && (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          background: '#dbeafe',
                          color: '#1d4ed8',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          textTransform: 'uppercase'
                        }}
                      >
                        Top / First
                      </span>
                    )}
                    {isLast && (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          background: '#f1f5f9',
                          color: '#475569',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          textTransform: 'uppercase'
                        }}
                      >
                        Bottom / Last
                      </span>
                    )}
                  </div>
                </div>

                {/* Direct Rank Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Pos:</label>
                  <select
                    value={idx + 1}
                    onChange={(e) => moveToPosition(idx, Number(e.target.value))}
                    disabled={isSaving}
                    style={{
                      padding: '4px 6px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      background: '#ffffff',
                      cursor: 'pointer'
                    }}
                  >
                    {items.map((_, pIdx) => (
                      <option key={pIdx} value={pIdx + 1}>
                        {pIdx + 1} {pIdx === 0 ? '(First)' : pIdx === items.length - 1 ? '(Last)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Move Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    disabled={isFirst || isSaving}
                    onClick={() => moveToFirst(idx)}
                    title="Put First (Move to top)"
                    style={{
                      background: isFirst ? '#f8fafc' : '#eff6ff',
                      border: `1px solid ${isFirst ? '#e2e8f0' : '#bfdbfe'}`,
                      color: isFirst ? '#94a3b8' : '#2563eb',
                      padding: '5px 8px',
                      borderRadius: '6px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: isFirst ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      opacity: isFirst ? 0.45 : 1
                    }}
                  >
                    <ChevronsUp size={13} />
                    <span>First</span>
                  </button>

                  <button
                    type="button"
                    disabled={isFirst || isSaving}
                    onClick={() => moveItem(idx, -1)}
                    title="Move up one position"
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      color: isFirst ? '#94a3b8' : '#334155',
                      padding: '5px 7px',
                      borderRadius: '6px',
                      cursor: isFirst ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      opacity: isFirst ? 0.45 : 1
                    }}
                  >
                    <ArrowUp size={14} />
                  </button>

                  <button
                    type="button"
                    disabled={isLast || isSaving}
                    onClick={() => moveItem(idx, 1)}
                    title="Move down one position"
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      color: isLast ? '#94a3b8' : '#334155',
                      padding: '5px 7px',
                      borderRadius: '6px',
                      cursor: isLast ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      opacity: isLast ? 0.45 : 1
                    }}
                  >
                    <ArrowDown size={14} />
                  </button>

                  <button
                    type="button"
                    disabled={isLast || isSaving}
                    onClick={() => moveToLast(idx)}
                    title="Put Last (Move to bottom)"
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      color: isLast ? '#94a3b8' : '#475569',
                      padding: '5px 8px',
                      borderRadius: '6px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: isLast ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      opacity: isLast ? 0.45 : 1
                    }}
                  >
                    <ChevronsDown size={13} />
                    <span>Last</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Tip: Click <strong>First</strong> or <strong>Last</strong> on any question to immediately reposition it.
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                padding: '8px 18px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.86rem',
                color: '#475569',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              style={{
                background: saveSuccess ? '#059669' : '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '8px 20px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.86rem',
                cursor: isSaving ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving Order...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>Order Applied!</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Save & Apply Order</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
