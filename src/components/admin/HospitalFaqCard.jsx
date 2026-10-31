import React, { memo } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  ExternalLink,
  Edit3,
  Trash2,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown
} from 'lucide-react';
import styles from './AdminHospitalEditPage.module.css';

const HospitalFaqCard = memo(function HospitalFaqCard({
  faq,
  index = 0,
  total = 1,
  isHospitalView,
  faqIconsList = [],
  onEdit,
  onDelete,
  onPreview,
  onMoveFirst,
  onMoveUp,
  onMoveDown,
  onMoveLast,
  isReordering = false
}) {
  const isCustomIcon = faq.icon && (
    faq.icon.startsWith('http') ||
    faq.icon.startsWith('data:image') ||
    faq.icon.startsWith('/') ||
    faq.icon.includes('.')
  );
  const matchedIcon = faqIconsList.find(i => i.id === faq.icon);
  const IconComp = matchedIcon ? matchedIcon.icon : HelpCircle;
  const faqId = faq.id || faq._id;

  return (
    <div className={styles.faqAdminCard} data-faq-id={faqId}>
      <div className={styles.faqAdminHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: isCustomIcon ? '#f8fafc' : (matchedIcon?.bg || '#eff6ff'),
            color: isCustomIcon ? '#2563eb' : (matchedIcon?.color || '#2563eb'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            {isCustomIcon ? (
              <img src={faq.icon} alt="FAQ icon" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
            ) : (
              <IconComp size={16} />
            )}
          </div>
          <span className={styles.faqAdminQuestion}>{faq.question}</span>
        </div>
        <span className={styles.faqAdminCategory}>{faq.category || 'General'}</span>
      </div>

      <p className={styles.faqAdminAnswer}>{faq.answer}</p>

      {faq.note && (
        <div style={{ fontSize: '0.78rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={14} />
          <span>{faq.note}</span>
        </div>
      )}

      <div className={styles.faqAdminActions} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        {/* Order sequence controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              color: '#475569',
              background: '#f8fafc',
              padding: '3px 8px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title={`Current position: #${index + 1} of ${total}`}
          >
            <span style={{ color: '#2563eb' }}>#{index + 1}</span> of {total}
          </span>

          {!isHospitalView && total > 1 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                disabled={index === 0}
                onClick={() => onMoveFirst && onMoveFirst(faq)}
                className={styles.iconBtn}
                title="Put First (Move to top #1)"
                style={{
                  color: index === 0 ? '#94a3b8' : '#2563eb',
                  background: index === 0 ? '#f8fafc' : '#eff6ff',
                  borderColor: index === 0 ? '#e2e8f0' : '#bfdbfe',
                  opacity: index === 0 ? 0.5 : 1,
                  cursor: index === 0 ? 'not-allowed' : 'pointer',
                  padding: '5px 9px'
                }}
              >
                <ChevronsUp size={14} />
                <span>Put First</span>
              </button>

              <button
                type="button"
                disabled={index === 0}
                onClick={() => onMoveUp && onMoveUp(faq)}
                className={styles.iconBtn}
                title="Move up one position"
                style={{
                  opacity: index === 0 ? 0.5 : 1,
                  cursor: index === 0 ? 'not-allowed' : 'pointer',
                  padding: '5px 8px'
                }}
              >
                <ArrowUp size={14} />
              </button>

              <button
                type="button"
                disabled={index === total - 1}
                onClick={() => onMoveDown && onMoveDown(faq)}
                className={styles.iconBtn}
                title="Move down one position"
                style={{
                  opacity: index === total - 1 ? 0.5 : 1,
                  cursor: index === total - 1 ? 'not-allowed' : 'pointer',
                  padding: '5px 8px'
                }}
              >
                <ArrowDown size={14} />
              </button>

              <button
                type="button"
                disabled={index === total - 1}
                onClick={() => onMoveLast && onMoveLast(faq)}
                className={styles.iconBtn}
                title="Put Last (Move to bottom)"
                style={{
                  color: index === total - 1 ? '#94a3b8' : '#475569',
                  opacity: index === total - 1 ? 0.5 : 1,
                  cursor: index === total - 1 ? 'not-allowed' : 'pointer',
                  padding: '5px 9px'
                }}
              >
                <ChevronsDown size={14} />
                <span>Put Last</span>
              </button>
            </div>
          )}
        </div>

        {/* Existing Edit / Delete / Preview Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
          {isHospitalView ? (
            <button
              type="button"
              className={styles.faqPreviewBtn}
              onClick={() => onPreview && onPreview(faq)}
            >
              <ExternalLink size={13} />
              <span>Preview Full FAQ</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => onEdit && onEdit(faq)}
              >
                <Edit3 size={14} />
                <span>Edit</span>
              </button>
              <button
                type="button"
                className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                onClick={() => onDelete && onDelete(faqId)}
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

export default HospitalFaqCard;
