import React, { useState, useMemo } from 'react';
import { X, HelpCircle, Save, Building2, Stethoscope, Check, Tag } from 'lucide-react';
import { useData } from '../../context/useData';
import styles from './DoctorFormModal.module.css';

const FAQ_CATEGORIES = [
  'Hospitals & Admissions',
  'Doctors & Consultations',
  'Insurance & Cashless',
  'Surgeries & Procedures',
  'General'
];

const FaqFormModal = ({ faqToEdit, onClose, onSave }) => {
  const { doctors, hospitals, faqs } = useData();

  // Determine initial target type and values
  const initialTargetType = faqToEdit?.targetType === 'doctor' ? 'doctor' : 'hospital';
  const initialTargetName = faqToEdit?.targetName || '';
  
  let initialTargetId = faqToEdit?.targetId || '';
  if (!initialTargetId && initialTargetName) {
    if (initialTargetType === 'doctor') {
      const matchDoc = doctors.find(d => d.name === initialTargetName);
      if (matchDoc) initialTargetId = matchDoc.id || matchDoc._id;
    } else {
      const matchHosp = hospitals.find(h => h.name === initialTargetName);
      if (matchHosp) initialTargetId = matchHosp.id || matchHosp._id;
    }
  }

  // If new FAQ, pre-select first target
  if (!initialTargetId) {
    if (initialTargetType === 'doctor' && doctors.length > 0) {
      initialTargetId = doctors[0].id || doctors[0]._id;
    } else if (hospitals.length > 0) {
      initialTargetId = hospitals[0].id || hospitals[0]._id;
    }
  }

  const initialCategory = faqToEdit?.category || (initialTargetType === 'doctor' ? 'Doctors & Consultations' : 'Hospitals & Admissions');
  const isInitialCustom = Boolean(initialCategory && !FAQ_CATEGORIES.includes(initialCategory));

  const [isCustomCategory, setIsCustomCategory] = useState(isInitialCustom);
  const [customCategory, setCustomCategory] = useState(isInitialCustom ? initialCategory : '');

  // Extract previously used custom categories across all FAQs
  const existingCustomCategories = useMemo(() => {
    const set = new Set();
    (faqs || []).forEach(f => {
      const cat = (f?.category || '').trim();
      if (cat && !FAQ_CATEGORIES.includes(cat)) {
        set.add(cat);
      }
    });
    if (isInitialCustom && initialCategory) {
      set.add(initialCategory.trim());
    }
    return Array.from(set);
  }, [faqs, isInitialCustom, initialCategory]);

  const [formData, setFormData] = useState({
    targetType: initialTargetType,
    targetId: initialTargetId,
    targetName: initialTargetName || (initialTargetType === 'doctor' ? doctors[0]?.name : hospitals[0]?.name) || '',
    category: initialCategory,
    question: faqToEdit?.question || '',
    answer: faqToEdit?.answer || '',
    order: faqToEdit?.order !== undefined ? faqToEdit.order : 0,
    isActive: faqToEdit?.isActive !== undefined ? faqToEdit.isActive : true
  });

  // Switch between Hospital and Doctor
  const handleTypeChange = (newType) => {
    if (newType === 'doctor') {
      const defaultDoc = doctors[0];
      setFormData(prev => ({
        ...prev,
        targetType: 'doctor',
        targetId: defaultDoc ? (defaultDoc.id || defaultDoc._id) : '',
        targetName: defaultDoc ? defaultDoc.name : '',
        category: isCustomCategory ? prev.category : 'Doctors & Consultations'
      }));
    } else {
      const defaultHosp = hospitals[0];
      setFormData(prev => ({
        ...prev,
        targetType: 'hospital',
        targetId: defaultHosp ? (defaultHosp.id || defaultHosp._id) : '',
        targetName: defaultHosp ? defaultHosp.name : '',
        category: isCustomCategory ? prev.category : 'Hospitals & Admissions'
      }));
    }
  };

  const handleHospitalSelect = (e) => {
    const selectedId = e.target.value;
    const hosp = hospitals.find(h => String(h.id || h._id) === String(selectedId));
    setFormData(prev => ({
      ...prev,
      targetId: selectedId,
      targetName: hosp ? hosp.name : ''
    }));
  };

  const handleDoctorSelect = (e) => {
    const selectedId = e.target.value;
    const doc = doctors.find(d => String(d.id || d._id) === String(selectedId));
    setFormData(prev => ({
      ...prev,
      targetId: selectedId,
      targetName: doc ? doc.name : ''
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.question.trim() || !formData.answer.trim()) {
      alert('Please provide both question and answer');
      return;
    }
    if (!formData.targetName) {
      alert(`Please select a specific ${formData.targetType === 'doctor' ? 'Doctor' : 'Hospital'}`);
      return;
    }

    const finalCategory = isCustomCategory ? customCategory.trim() : formData.category;
    if (!finalCategory) {
      alert('Please select or specify a category for this FAQ');
      return;
    }

    onSave({
      ...formData,
      category: finalCategory
    });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingRight: '40px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <HelpCircle size={22} color="#2563eb" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
              {faqToEdit ? 'Modify FAQ' : 'Add New FAQ'}
            </h2>
            <p style={{ fontSize: '0.86rem', color: '#64748b', margin: 0 }}>
              First select between Doctor or Hospital, then pick the specific profile to add an FAQ for.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* STEP 1: CHOOSE TARGET TYPE (DOCTOR VS HOSPITAL) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e293b' }}>
              1. Choose FAQ Target *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                type="button"
                onClick={() => handleTypeChange('hospital')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  border: formData.targetType === 'hospital' ? '2px solid #2563eb' : '1.5px solid #cbd5e1',
                  background: formData.targetType === 'hospital' ? '#eff6ff' : '#ffffff',
                  color: formData.targetType === 'hospital' ? '#1d4ed8' : '#475569',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <Building2 size={20} color={formData.targetType === 'hospital' ? '#2563eb' : '#64748b'} />
                <span>Hospital FAQ</span>
                {formData.targetType === 'hospital' && <Check size={16} color="#2563eb" style={{ marginLeft: 'auto' }} />}
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('doctor')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  border: formData.targetType === 'doctor' ? '2px solid #7c3aed' : '1.5px solid #cbd5e1',
                  background: formData.targetType === 'doctor' ? '#f5f3ff' : '#ffffff',
                  color: formData.targetType === 'doctor' ? '#6d28d9' : '#475569',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <Stethoscope size={20} color={formData.targetType === 'doctor' ? '#7c3aed' : '#64748b'} />
                <span>Doctor FAQ</span>
                {formData.targetType === 'doctor' && <Check size={16} color="#7c3aed" style={{ marginLeft: 'auto' }} />}
              </button>
            </div>
          </div>

          {/* STEP 2: SELECT SPECIFIC HOSPITAL OR DOCTOR */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>
              {formData.targetType === 'hospital' ? '2. Select Specific Hospital *' : '2. Select Specific Doctor *'}
            </label>
            
            {formData.targetType === 'hospital' ? (
              <select
                value={formData.targetId}
                onChange={handleHospitalSelect}
                required
                style={{
                  border: '1.5px solid #2563eb',
                  borderRadius: '10px',
                  padding: '11px 14px',
                  outline: 'none',
                  fontSize: '0.92rem',
                  background: '#f8fafc',
                  fontWeight: 600,
                  color: '#0f172a'
                }}
              >
                <option value="">-- Choose Hospital ({hospitals.length} available) --</option>
                {hospitals.map(h => (
                  <option key={h.id || h._id} value={h.id || h._id}>
                    {h.name} {h.city ? `(${h.city})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={formData.targetId}
                onChange={handleDoctorSelect}
                required
                style={{
                  border: '1.5px solid #7c3aed',
                  borderRadius: '10px',
                  padding: '11px 14px',
                  outline: 'none',
                  fontSize: '0.92rem',
                  background: '#f8fafc',
                  fontWeight: 600,
                  color: '#0f172a'
                }}
              >
                <option value="">-- Choose Doctor ({doctors.length} available) --</option>
                {doctors.map(d => (
                  <option key={d.id || d._id} value={d.id || d._id}>
                    {d.name} — {d.specialization || d.specialty || 'Doctor'} {d.hospital ? `(${d.hospital})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Tag size={14} color="#2563eb" /> FAQ Category *
              </label>
              <button
                type="button"
                onClick={() => {
                  const nextState = !isCustomCategory;
                  setIsCustomCategory(nextState);
                  if (nextState && !customCategory && formData.category && !FAQ_CATEGORIES.includes(formData.category)) {
                    setCustomCategory(formData.category);
                  }
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {isCustomCategory ? '← Choose standard category' : '+ Add custom category'}
              </button>
            </div>

            {!isCustomCategory ? (
              <select
                value={formData.category}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setIsCustomCategory(true);
                  } else {
                    setFormData({ ...formData, category: e.target.value });
                  }
                }}
                style={{
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontSize: '0.92rem',
                  outline: 'none',
                  background: '#ffffff'
                }}
              >
                <optgroup label="Standard Categories">
                  {FAQ_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </optgroup>
                {existingCustomCategories.length > 0 && (
                  <optgroup label="Saved Custom Categories">
                    {existingCustomCategories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </optgroup>
                )}
                <option value="__custom__">+ Add Custom Category...</option>
              </select>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="e.g. Teleconsultation & Video Visits, Lab Tests & Diagnostics..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  autoFocus
                  required
                  style={{
                    border: '1.5px solid #2563eb',
                    background: '#f0f7ff',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    fontSize: '0.92rem',
                    outline: 'none'
                  }}
                />
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  This custom category will be assigned to this FAQ and will automatically appear in category filter options.
                </span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Question *</label>
            <input
              type="text"
              placeholder={formData.targetType === 'doctor' ? "e.g. How do I book an OPD consultation with Dr. Sarthak?" : "e.g. What is the pre-authorization procedure for cashless admission at Manipal Hospital?"}
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
              rows={4}
              placeholder="Provide a clear, patient-friendly answer... (Press Ctrl+Enter to save)"
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
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
