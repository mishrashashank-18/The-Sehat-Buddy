import React, { useState } from 'react';
import { X, HelpCircle, Save, Check } from 'lucide-react';
import styles from './DoctorFormModal.module.css'; // Reuse existing sleek modal styles

const FAQ_CATEGORIES = [
  'Insurance & Cashless',
  'Surgeries & Procedures',
  'Hospitals & Admissions',
  'Doctors & Consultations',
  'General'
];

const FaqFormModal = ({ faqToEdit, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    question: faqToEdit?.question || '',
    answer: faqToEdit?.answer || '',
    category: faqToEdit?.category || 'General',
    order: faqToEdit?.order !== undefined ? faqToEdit.order : 0,
    isActive: faqToEdit?.isActive !== undefined ? faqToEdit.isActive : true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.question.trim() || !formData.answer.trim()) {
      alert('Please provide both question and answer');
      return;
    }
    onSave(formData);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={20} />
        </button>

        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
            {faqToEdit ? 'Modify FAQ' : 'Add New FAQ'}
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
            Configure questions and answers displayed in the public FAQ section.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>FAQ Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              style={{
                border: '1.5px solid #cbd5e1',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '0.92rem',
                outline: 'none'
              }}
            >
              {FAQ_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Question *</label>
            <input
              type="text"
              placeholder="e.g. How does 100% cashless insurance work for surgeries?"
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              required
              style={{
                border: '1.5px solid #cbd5e1',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '0.92rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Detailed Answer *</label>
            <textarea
              rows={5}
              placeholder="Provide a clear, detailed answer for patients..."
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              required
              style={{
                border: '1.5px solid #cbd5e1',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '0.92rem',
                outline: 'none',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Display Order</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                style={{
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontSize: '0.92rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
              <input
                type="checkbox"
                id="faqIsActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="faqIsActive" style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', cursor: 'pointer' }}>
                Visible on Website
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 20px',
                fontSize: '0.92rem',
                fontWeight: 600,
                color: '#475569',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                background: '#2563eb',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 24px',
                fontSize: '0.92rem',
                fontWeight: 700,
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Save size={16} />
              <span>{faqToEdit ? 'Save Changes' : 'Create FAQ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FaqFormModal;
