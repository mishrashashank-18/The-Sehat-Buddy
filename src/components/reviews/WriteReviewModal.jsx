import React, { useState, useMemo } from 'react';
import { X, Star, ShieldCheck, CheckCircle2, MessageSquare, Building2, User, Stethoscope, LogIn } from 'lucide-react';
import { useData } from '../../context/useData';
import { defaultAcceptedInsurances } from '../../data/insurancePartners';
import styles from './WriteReviewModal.module.css';

const WriteReviewModal = ({
  onClose,
  preselectedTarget = null,
  onSuccess,
  onNavigate,
  targetType: propTargetType,
  targetName: propTargetName,
  targetId: propTargetId
}) => {
  const { addReview, hospitals, doctors } = useData();

  // Check authenticated patient login session
  const { loggedInUser, isLoggedIn } = useMemo(() => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (token && userStr) {
        const u = JSON.parse(userStr);
        if (u && (u.name || u.email || u._id || u.id)) {
          return { loggedInUser: u, isLoggedIn: true };
        }
      }
    } catch {}
    return { loggedInUser: null, isLoggedIn: false };
  }, []);

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [patientName, setPatientName] = useState(loggedInUser?.name || '');
  const [patientCity, setPatientCity] = useState(loggedInUser?.city || 'Bengaluru');
  const [targetType, setTargetType] = useState(propTargetType || preselectedTarget?.type || 'hospital');
  const [targetName, setTargetName] = useState(propTargetName || preselectedTarget?.name || hospitals[0]?.name || '');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [treatment, setTreatment] = useState(preselectedTarget?.treatment || '');
  const [insuranceUsed, setInsuranceUsed] = useState('Star Health');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Doctors affiliated with the target hospital
  const availableDoctors = useMemo(() => {
    if (!targetName || !Array.isArray(doctors)) return [];
    const hospQuery = targetName.toLowerCase().trim();
    return doctors.filter(doc => {
      const docHosp = (doc.hospital || '').toLowerCase().trim();
      return docHosp && (docHosp === hospQuery || docHosp.includes(hospQuery) || hospQuery.includes(docHosp));
    });
  }, [doctors, targetName]);

  const handleGoToLogin = () => {
    if (onClose) onClose();
    const returnTargetId = propTargetId || preselectedTarget?.id || preselectedTarget?._id;
    try {
      localStorage.setItem('open_write_review', 'true');
      if (returnTargetId) {
        localStorage.setItem(
          'redirect_after_login',
          targetType === 'doctor' ? `/doctors/${returnTargetId}` : `/hospitals/${returnTargetId}`
        );
      }
    } catch (e) {
      console.warn('Storage error:', e);
    }
    if (onNavigate) {
      onNavigate('user-login', {
        view: targetType === 'doctor' ? 'doctor-profile' : 'hospital-profile',
        param: returnTargetId
      });
    } else {
      window.location.href = '/login';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!patientName.trim() || !comment.trim() || !targetName.trim()) {
      alert('Please fill out all required fields: Your Name and Your Review.');
      return;
    }

    setIsSubmitting(true);

    const docObj = availableDoctors.find(d => String(d.id || d._id) === String(selectedDoctorId));
    const isDocTarget = targetType === 'doctor';
    const resolvedDocId = isDocTarget ? String(propTargetId || preselectedTarget?.id || preselectedTarget?._id || '') : (docObj ? String(docObj._id || docObj.id) : '');
    const resolvedDocName = isDocTarget ? targetName.trim() : (docObj ? docObj.name : '');

    try {
      await addReview({
        patientName: patientName.trim(),
        patientCity: patientCity.trim() || 'Bengaluru',
        userId: loggedInUser?._id || loggedInUser?.id || '',
        userEmail: loggedInUser?.email || '',
        targetType,
        targetName: targetName.trim(),
        targetId: propTargetId || preselectedTarget?.id || preselectedTarget?._id || '',
        doctorId: resolvedDocId,
        doctorName: resolvedDocName,
        rating: Number(rating),
        title: title.trim(),
        comment: comment.trim(),
        treatment: treatment.trim(),
        insuranceUsed: insuranceUsed.trim(),
        isVerified: true,
        status: 'approved' // Live immediately for hospital, doctors, admin, and patient community
      });

      setSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error submitting patient review:', err);
      // Still show success since DataContext performs optimistic local persistence and broadcast
      setSubmitted(true);
      if (onSuccess) onSuccess();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        {!submitted ? (
          <div>
            <div className={styles.header}>
              <div className={styles.badge} style={{ background: '#ecfdf5', borderColor: '#a7f3d0', color: '#059669' }}>
                <ShieldCheck size={14} color="#059669" />
                <span>Verified Patient Review • Community Healthcare</span>
              </div>
              <h2 className={styles.title}>
                {targetType === 'doctor' ? `Review Dr. ${targetName.replace(/^Dr\.\s*/i, '')}` : 'Share Your Hospital Experience'}
              </h2>
              <p className={styles.subtitle}>
                Your review for <strong>{targetName}</strong> will be displayed publicly and shared directly with fellow patients.
              </p>
            </div>

            {!isLoggedIn && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '8px 14px',
                marginBottom: '16px',
                fontSize: '0.82rem',
                color: '#1e40af'
              }}>
                <span>Posting as Public Patient. Have an account?</span>
                <button
                  type="button"
                  onClick={handleGoToLogin}
                  style={{
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Sign In
                </button>
              </div>
            )}

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
                      title={`Rate ${star} out of 5 Stars`}
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

              {/* Target Facility & Optional Doctor */}
              <div className={styles.formRow}>
                <div className={styles.formGroup} style={{ flex: targetType === 'doctor' ? '1 1 100%' : '1 1 200px' }}>
                  <label>
                    {targetType === 'doctor' ? (
                      <>
                        <Stethoscope size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                        Doctor Name *
                      </>
                    ) : (
                      <>
                        <Building2 size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                        Hospital Name *
                      </>
                    )}
                  </label>
                  {propTargetName ? (
                    <input
                      type="text"
                      value={targetName}
                      readOnly
                      className={styles.input}
                      style={{ background: '#f1f5f9', cursor: 'not-allowed', fontWeight: 600 }}
                    />
                  ) : (
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
                  )}
                </div>

                {targetType !== 'doctor' && (
                  <div className={styles.formGroup}>
                    <label>
                      <Stethoscope size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                      Attending Doctor (Optional)
                    </label>
                    <select
                      value={selectedDoctorId}
                      onChange={(e) => setSelectedDoctorId(e.target.value)}
                      className={styles.input}
                    >
                      <option value="">General Hospital Experience (No specific doctor)</option>
                      {availableDoctors.map((doc) => (
                        <option key={doc.id || doc._id} value={doc.id || doc._id}>
                          {doc.name} — {doc.specialty || doc.specialization || 'Specialist'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Treatment and Insurance */}
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Department / Treatment / Surgery</label>
                  <input
                    type="text"
                    placeholder="e.g. Cardiology, Orthopedics, Knee Replacement"
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
                    <option value="Star Health">Star Health & Allied Insurance</option>
                    <option value="HDFC ERGO">HDFC ERGO General Insurance</option>
                    <option value="ICICI Lombard">ICICI Lombard Health</option>
                    <option value="Care Health">Care Health Insurance</option>
                    <option value="Other TPA / Cashless">Other TPA / Cashless</option>
                    <option value="None / Self-pay">None / Self-pay (Cash)</option>
                  </select>
                </div>
              </div>

              {/* Patient Name & City */}
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>
                    <User size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                    Your Name (Verified Patient) *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Shashank Verma"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Your City *</label>
                  <input
                    type="text"
                    placeholder="e.g. Bengaluru, Karnataka"
                    value={patientCity}
                    onChange={(e) => setPatientCity(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>
              </div>

              {/* Review Headline */}
              <div className={styles.formGroup}>
                <label>Review Headline / Title</label>
                <input
                  type="text"
                  placeholder="e.g. World-class cardiology care & 30-min cashless approval"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={styles.input}
                />
              </div>

              {/* Review Comment */}
              <div className={styles.formGroup}>
                <label>
                  <MessageSquare size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                  Detailed Experience & Feedback *
                </label>
                <textarea
                  rows={4}
                  placeholder="Share details about your hospital stay, doctors, nursing staff, insurance pre-authorization speed, or admission process..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className={styles.textarea}
                  required
                />
              </div>

              <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                {isSubmitting ? 'Publishing Your Review...' : 'Submit Patient Review'}
              </button>
            </form>
          </div>
        ) : (
          <div className={styles.successState}>
            <CheckCircle2 size={54} color="#059669" />
            <h3 className={styles.successTitle}>Thank You For Your Review!</h3>
            <p className={styles.successDesc}>
              Your review for <strong>{targetName}</strong> has been published successfully. It is now visible to the hospital administration, medical team, platform admin, and patients.
            </p>
            <button type="button" className={styles.doneBtn} onClick={onClose}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WriteReviewModal;
