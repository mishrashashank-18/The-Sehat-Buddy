import React, { memo } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  ExternalLink,
  Edit3,
  Trash2
} from 'lucide-react';
import styles from './AdminHospitalEditPage.module.css';

const HospitalFaqCard = memo(function HospitalFaqCard({
  faq,
  isHospitalView,
  faqIconsList = [],
  onEdit,
  onDelete,
  onPreview
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

      <div className={styles.faqAdminActions}>
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
  );
});

export default HospitalFaqCard;
