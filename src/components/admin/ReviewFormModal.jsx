import React, { useState } from 'react';
import { X, Star, Save, Check } from 'lucide-react';
import { useData } from '../../context/useData';
import styles from './DoctorFormModal.module.css';

const ReviewFormModal = ({ reviewToEdit, onClose, onSave }) => {
  const { hospitals } = useData();

  const [formData, setFormData] = useState({
    patientName: reviewToEdit?.patientName || '',
    patientCity: reviewToEdit?.patientCity || 'Bengaluru',
    targetType: reviewToEdit?.targetType || 'hospital',
    targetName: reviewToEdit?.targetName || hospitals[0]?.name || '',
    rating: reviewToEdit?.rating !== undefined ? Number(reviewToEdit.rating) : 5,
    title: reviewToEdit?.title || '',
    comment: reviewToEdit?.comment || '',
    treatment: reviewToEdit?.treatment || '',
    insuranceUsed: reviewToEdit?.insuranceUsed || 'Star Health',
    isVerified: reviewToEdit?.isVerified !== undefined ? reviewToEdit.isVerified : true,
    status: reviewToEdit?.status || 'approved'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.patientName.trim() || !formData.comment.trim() || !formData.targetName.trim()) {
      alert('Please fill in Patient Name, Target Name, and Review Comment.');
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
            {reviewToEdit ? 'Edit Public Review' : 'Add Verified Patient Review'}
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
            Moderate, modify, or add patient ratings and surgery testimonials.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Patient Name *</label>
              <input
                type="text"
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
                value={formData.patientCity}
                onChange={(e) => setFormData({ ...formData, patientCity: e.target.value })}
                style={{ border: '1.5px solid #cbd5e1', borderRadius: '10px', padding: '10px 14px', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Target Category *</label>
              <select
                value={formData.targetType}
                onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                style={{ border: '1.5px solid #cbd5e1', borderRadius: '10px', padding: '10px 14px', outline: 'none' }}
              >
                <option value="hospital">Hospital</option>
                <option value="surgery">Surgery / Procedure</option>
                <option value="doctor">Specialist Doctor</option>
                <option value="platform">Platform</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Target Name *</label>
              <input
                type="text"
                value={formData.targetName}
                onChange={(e) => setFormData({ ...formData, targetName: e.target.value })}
                required
                style={{ border: '1.5px solid #cbd5e1', borderRadius: '10px', padding: '10px 14px', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Rating (1-5)</label>
              <select
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                style={{ border: '1.5px solid #cbd5e1', borderRadius: '10px', padding: '10px 14px', outline: 'none' }}
              >
                <option value="5">5 Stars (Excellent)</option>
                <option value="4">4 Stars (Good)</option>
                <option value="3">3 Stars (Average)</option>
                <option value="2">2 Stars (Poor)</option>
                <option value="1">1 Star (Terrible)</option>
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
                placeholder="e.g. Star Health"
                style={{ border: '1.5px solid #cbd5e1', borderRadius: '10px', padding: '10px 14px', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Treatment / Surgery Name</label>
            <input
              type="text"
              value={formData.treatment}
              onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
              placeholder="e.g. Total Knee Replacement, Laparoscopic Surgery"
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
              style={{ background: '#2563eb', border: 'none', borderRadius: '10px', padding: '10px 24px', fontWeight: 700, color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
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
