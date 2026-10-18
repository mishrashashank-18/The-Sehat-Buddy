import React, { useState } from 'react';
import { X, Star, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useData } from '../../context/useData';
import { defaultAcceptedInsurances } from '../../data/insurancePartners';
import styles from './WriteReviewModal.module.css';

const WriteReviewModal = ({ onClose, preselectedTarget = null, onSuccess, targetType: propTargetType, targetName: propTargetName, targetId: propTargetId }) => {
  const { addReview, hospitals } = useData();

  const isAdmin = (() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u.role === 'admin' || u.isAdmin || u.type === 'admin') return true;
      }
      if (localStorage.getItem('admin_logged_in') === 'true') return true;
    } catch {
      return false;
    }
    return false;
  })();

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [patientName, setPatientName] = useState('');
  const [patientCity, setPatientCity] = useState('Bengaluru');
  const [targetType, setTargetType] = useState(propTargetType || preselectedTarget?.type || 'doctor');
  const [targetName, setTargetName] = useState(propTargetName || preselectedTarget?.name || hospitals[0]?.name || '');
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [treatment, setTreatment] = useState(preselectedTarget?.treatment || '');
  const [insuranceUsed, setInsuranceUsed] = useState('Star Health');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Review writing is restricted to administrators.');
      return;
    }
    if (!patientName.trim() || !comment.trim() || !targetName.trim()) {
      alert('Please fill out all required fields.');
      return;
    }

    addReview({
      patientName: patientName.trim(),
      patientCity: patientCity.trim(),
      targetType,
      targetName: targetName.trim(),
      targetId: propTargetId || preselectedTarget?.id || '',
      rating: Number(rating),
      title: title.trim(),
      comment: comment.trim(),
      treatment: treatment.trim(),
      insuranceUsed: insuranceUsed.trim(),
      isVerified: true,
      status: 'approved'
    });

    setSubmitted(true);
    if (onSuccess) onSuccess();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        {!isAdmin ? (
          <div style={{ textAlign: 'center', padding: '36px 16px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <ShieldCheck size={28} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>
              Admin Authorization Required
            </h2>
            <p style={{ fontSize: '0.90rem', color: '#64748b', margin: '0 auto 24px auto', maxWidth: '380px', lineHeight: 1.55 }}>
              Patient review submission and publishing is restricted to authorized hospital administrators and patient care moderators. Public reviews are closed.
            </p>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#0f172a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 24px',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Close Window
            </button>
          </div>
        ) : !submitted ? (
          <div>
            <div className={styles.header}>
              <div className={styles.badge} style={{ background: '#fef3c7', borderColor: '#fde68a', color: '#b45309' }}>
                <ShieldCheck size={14} color="#b45309" />
                <span>Admin Portal • Verified Patient Review</span>
              </div>
              <h2 className={styles.title}>Add Verified Patient Review</h2>
              <p className={styles.subtitle}>
                Publish verified clinical experiences and insurance settlement testimonials for {targetName || 'healthcare specialists'}.
              </p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              {/* Rating Selector */}
              <div className={styles.ratingRow}>
                <label className={styles.ratingLabel}>Your Overall Rating *</label>
                <div className={styles.starsWrap}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={styles.starBtn}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      <Star
                        size={30}
                        fill={(hoverRating || rating) >= star ? '#f59e0b' : '#e2e8f0'}
                        color={(hoverRating || rating) >= star ? '#f59e0b' : '#cbd5e1'}
                      />
                    </button>
                  ))}
                  <span className={styles.ratingScore}>{rating} / 5 Stars</span>
                </div>
              </div>

              {/* Review Category */}
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Review Type *</label>
                  <select
                    value={targetType}
                    onChange={(e) => {
                      setTargetType(e.target.value);
                      if (e.target.value === 'hospital' && hospitals.length > 0) {
                        setTargetName(hospitals[0].name);
                      }
                    }}
                    className={styles.input}
                  >
                    <option value="hospital">Hospital Experience</option>
                    <option value="surgery">Surgery / Procedure</option>
                    <option value="doctor">Specialist Doctor</option>
                    <option value="platform">The Sehat Buddy Platform</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Hospital or Doctor / Surgery Name *</label>
                  {targetType === 'hospital' ? (
                    <select
                      value={targetName}
                      onChange={(e) => setTargetName(e.target.value)}
                      className={styles.input}
                      required
                    >
                      {hospitals.map((h) => (
                        <option key={h.id || h._id} value={h.name}>
                          {h.name} ({h.city || 'Bengaluru'})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. Apollo Hospital or Dr. Vivek Jawali"
                      value={targetName}
                      onChange={(e) => setTargetName(e.target.value)}
                      className={styles.input}
                      required
                    />
                  )}
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Treatment / Surgery Undergone</label>
                  <input
                    type="text"
                    placeholder="e.g. Robotic Knee Replacement, Angioplasty"
                    value={treatment}
                    onChange={(e) => setTreatment(e.target.value)}
                    className={styles.input}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Insurance Provider Used</label>
                  <select
                    value={insuranceUsed}
                    onChange={(e) => setInsuranceUsed(e.target.value)}
                    className={styles.input}
                  >
                    {defaultAcceptedInsurances.map((ins, i) => (
                      <option key={i} value={ins}>{ins}</option>
                    ))}
                    <option value="Other TPA">Other Insurance / TPA</option>
                    <option value="None / Self-pay">None / Self-pay</option>
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Your Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Sunil Sharma"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>City *</label>
                  <input
                    type="text"
                    placeholder="e.g. Bengaluru, Delhi"
                    value={patientCity}
                    onChange={(e) => setPatientCity(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Review Headline / Title</label>
                <input
                  type="text"
                  placeholder="e.g. Smooth 100% Cashless Surgery Experience"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Detailed Experience & Feedback *</label>
                <textarea
                  rows={4}
                  placeholder="Share details about the doctors, hospital facilities, insurance pre-authorization speed, nursing staff, etc."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className={styles.textarea}
                  required
                />
              </div>

              <button type="submit" className={styles.submitBtn}>
                Submit Verified Review
              </button>
            </form>
          </div>
        ) : (
          <div className={styles.successState}>
            <CheckCircle2 size={54} color="#059669" />
            <h3 className={styles.successTitle}>Thank You For Your Review!</h3>
            <p className={styles.successDesc}>
              Your feedback has been published and will help other patients looking for trustworthy healthcare and cashless facilities.
            </p>
            <button type="button" className={styles.doneBtn} onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WriteReviewModal;
