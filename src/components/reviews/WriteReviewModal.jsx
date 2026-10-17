import React, { useState } from 'react';
import { X, Star, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useData } from '../../context/useData';
import { defaultAcceptedInsurances } from '../../data/insurancePartners';
import styles from './WriteReviewModal.module.css';

const WriteReviewModal = ({ onClose, preselectedTarget = null, onSuccess }) => {
  const { addReview, hospitals } = useData();

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [patientName, setPatientName] = useState('');
  const [patientCity, setPatientCity] = useState('Bengaluru');
  const [targetType, setTargetType] = useState(preselectedTarget?.type || 'hospital');
  const [targetName, setTargetName] = useState(preselectedTarget?.name || hospitals[0]?.name || '');
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [treatment, setTreatment] = useState(preselectedTarget?.treatment || '');
  const [insuranceUsed, setInsuranceUsed] = useState('Star Health');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!patientName.trim() || !comment.trim() || !targetName.trim()) {
      alert('Please fill out all required fields.');
      return;
    }

    addReview({
      patientName: patientName.trim(),
      patientCity: patientCity.trim(),
      targetType,
      targetName: targetName.trim(),
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

        {!submitted ? (
          <div>
            <div className={styles.header}>
              <div className={styles.badge}>
                <ShieldCheck size={14} color="#059669" />
                <span>Verified Patient Experience</span>
              </div>
              <h2 className={styles.title}>Share Your Healthcare Experience</h2>
              <p className={styles.subtitle}>
                Help thousands of patients make informed choices regarding hospitals, surgeries, and cashless insurance support.
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
