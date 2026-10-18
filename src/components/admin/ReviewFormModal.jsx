import React, { useState } from 'react';
import { X, Star, Save, Building2, Stethoscope, Check } from 'lucide-react';
import { useData } from '../../context/useData';
import styles from './DoctorFormModal.module.css';

const ReviewFormModal = ({ reviewToEdit, onClose, onSave }) => {
  const { hospitals, doctors } = useData();

  // Determine initial target type and IDs
  const initialTargetType = reviewToEdit?.targetType === 'doctor' ? 'doctor' : 'hospital';
  const initialTargetName = reviewToEdit?.targetName || '';
  
  // Find matching ID if available
  let initialTargetId = reviewToEdit?.targetId || '';
  if (!initialTargetId && initialTargetName) {
    if (initialTargetType === 'doctor') {
      const matchDoc = doctors.find(d => d.name === initialTargetName);
      if (matchDoc) initialTargetId = matchDoc.id || matchDoc._id;
    } else {
      const matchHosp = hospitals.find(h => h.name === initialTargetName);
      if (matchHosp) initialTargetId = matchHosp.id || matchHosp._id;
    }
  }

  // If new review and no selection yet, pre-select first item
  if (!initialTargetId) {
    if (initialTargetType === 'doctor' && doctors.length > 0) {
      initialTargetId = doctors[0].id || doctors[0]._id;
    } else if (hospitals.length > 0) {
      initialTargetId = hospitals[0].id || hospitals[0]._id;
    }
  }

  const [formData, setFormData] = useState({
    patientName: reviewToEdit?.patientName || '',
    patientCity: reviewToEdit?.patientCity || 'Bengaluru',
    targetType: initialTargetType,
    targetId: initialTargetId,
    targetName: initialTargetName || (initialTargetType === 'doctor' ? doctors[0]?.name : hospitals[0]?.name) || '',
    rating: reviewToEdit?.rating !== undefined ? Number(reviewToEdit.rating) : 5,
    title: reviewToEdit?.title || '',
    comment: reviewToEdit?.comment || '',
    treatment: reviewToEdit?.treatment || (initialTargetType === 'doctor' ? (doctors[0]?.specialization || doctors[0]?.specialty || '') : ''),
    insuranceUsed: reviewToEdit?.insuranceUsed || 'Star Health',
    isVerified: reviewToEdit?.isVerified !== undefined ? reviewToEdit.isVerified : true,
    status: reviewToEdit?.status || 'approved'
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
        treatment: prev.treatment || (defaultDoc ? (defaultDoc.specialization || defaultDoc.specialty || '') : '')
      }));
    } else {
      const defaultHosp = hospitals[0];
      setFormData(prev => ({
        ...prev,
        targetType: 'hospital',
        targetId: defaultHosp ? (defaultHosp.id || defaultHosp._id) : '',
        targetName: defaultHosp ? defaultHosp.name : ''
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
      targetName: doc ? doc.name : '',
      treatment: prev.treatment || (doc ? (doc.specialization || doc.specialty || '') : '')
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.patientName.trim() || !formData.comment.trim() || !formData.targetName.trim()) {
      alert('Please fill in Patient Name, select a valid Doctor or Hospital, and enter Review Comment.');
      return;
    }
    onSave(formData);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingRight: '40px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Star size={22} color="#b45309" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
              {reviewToEdit ? 'Edit Public Review' : 'Add Verified Patient Review'}
            </h2>
            <p style={{ fontSize: '0.86rem', color: '#64748b', margin: 0 }}>
              First select between Doctor or Hospital, then pick the specific profile to add a review for.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* STEP 1: CHOOSE TARGET TYPE (DOCTOR VS HOSPITAL) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e293b' }}>
              1. Choose Review Target *
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
                <span>Hospital Review</span>
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
                <span>Doctor Review</span>
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

          {/* PATIENT INFO */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Patient / Reviewer Name *</label>
              <input
                type="text"
                placeholder="e.g. Ramesh Kumar"
                value={formData.patientName}
                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                required
                style={{ border: '1.5px solid #cbd5e1', borderRadius: '10px', padding: '10px 14px', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>City</label>
              <input
                type="text"
                placeholder="e.g. Bengaluru, Delhi, Mumbai"
                value={formData.patientCity}
                onChange={(e) => setFormData({ ...formData, patientCity: e.target.value })}
                style={{ border: '1.5px solid #cbd5e1', borderRadius: '10px', padding: '10px 14px', outline: 'none' }}
              />
            </div>
          </div>

          {/* RATING & MODERATION */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Rating (1-5)</label>
              <select
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                style={{ border: '1.5px solid #cbd5e1', borderRadius: '10px', padding: '10px 14px', outline: 'none' }}
              >
                <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
                <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
                <option value="3">⭐⭐⭐ (3 Stars)</option>
                <option value="2">⭐⭐ (2 Stars)</option>
                <option value="1">⭐ (1 Star)</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Moderation Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={{ border: '1.5px solid #cbd5e1', borderRadius: '10px', padding: '10px 14px', outline: 'none' }}
              >
                <option value="approved">Approved (Public)</option>
                <option value="pending">Pending Review</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Insurance Used</label>
              <input
                type="text"
                value={formData.insuranceUsed}
                onChange={(e) => setFormData({ ...formData, insuranceUsed: e.target.value })}
                placeholder="e.g. Star Health, HDFC ERGO"
                style={{ border: '1.5px solid #cbd5e1', borderRadius: '10px', padding: '10px 14px', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Treatment / Consultation / Surgery</label>
            <input
              type="text"
              value={formData.treatment}
              onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
              placeholder="e.g. Total Knee Replacement, Cardiac Consultation"
              style={{ border: '1.5px solid #cbd5e1', borderRadius: '10px', padding: '10px 14px', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Review Headline</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Outstanding 100% Cashless Surgery Support"
              style={{ border: '1.5px solid #cbd5e1', borderRadius: '10px', padding: '10px 14px', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Review Comment *</label>
            <textarea
              rows={4}
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              placeholder="Share details of the doctor consultation, clinical expertise, or hospital cashless admission experience..."
              required
              style={{ border: '1.5px solid #cbd5e1', borderRadius: '10px', padding: '10px 14px', outline: 'none', fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              id="isVerifiedCheck"
              checked={formData.isVerified}
              onChange={(e) => setFormData({ ...formData, isVerified: e.target.checked })}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label htmlFor="isVerifiedCheck" style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', cursor: 'pointer' }}>
              Mark as Verified Patient Review
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '14px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ background: '#f1f5f9', border: 'none', borderRadius: '10px', padding: '10px 20px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
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
                fontWeight: 700,
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Save size={16} />
              <span>{reviewToEdit ? 'Save Changes' : 'Create Review'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewFormModal;
