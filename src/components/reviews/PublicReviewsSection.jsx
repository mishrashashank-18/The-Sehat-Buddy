import React, { useState } from 'react';
import {
  Star,
  ShieldCheck,
  CheckCircle2,
  Edit3,
  ThumbsUp,
  MapPin,
  Building2,
  Sparkles
} from 'lucide-react';
import { useData } from '../../context/useData';
import Container from '../layout/Container';
import WriteReviewModal from './WriteReviewModal';
import styles from './PublicReviewsSection.module.css';

const PublicReviewsSection = () => {
  const { reviews } = useData();
  const [activeFilter, setActiveFilter] = useState('all');
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);

  // Filter approved reviews only for public display
  const approvedReviews = reviews.filter(r => r.status !== 'rejected');

  const filteredReviews = approvedReviews.filter(rev => {
    if (activeFilter === 'all') return true;
    return rev.targetType === activeFilter;
  });

  const avgRating = approvedReviews.length > 0
    ? (approvedReviews.reduce((sum, r) => sum + Number(r.rating || 5), 0) / approvedReviews.length).toFixed(1)
    : '4.9';

  return (
    <section className={styles.sectionWrap} id="reviews-section">
      <Container>
        {/* Header */}
        <div className={styles.headerRow}>
          <div>
            <div className={styles.badge}>
              <Sparkles size={14} color="#f59e0b" />
              <span>Real Stories, Verified Outcomes</span>
            </div>
            <h2 className={styles.title}>Public Patient Reviews & Experiences</h2>
            <p className={styles.subtitle}>
              Hear directly from patients and families who experienced seamless surgical treatments and cashless admissions.
            </p>
          </div>

          <button
            type="button"
            className={styles.writeReviewBtn}
            onClick={() => setIsWriteModalOpen(true)}
          >
            <Edit3 size={17} />
            <span>Write a Patient Review</span>
          </button>
        </div>

        {/* Rating Metrics Bar */}
        <div className={styles.metricsBar}>
          <div className={styles.metricItem}>
            <div className={styles.starsGroup}>
              <span className={styles.metricScore}>{avgRating}</span>
              <div className={styles.stars}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={18} fill="#f59e0b" color="#f59e0b" />
                ))}
              </div>
            </div>
            <span className={styles.metricSub}>Average Patient Rating</span>
          </div>

          <div className={styles.metricDivider} />

          <div className={styles.metricItem}>
            <span className={styles.metricScore}>{approvedReviews.length}+</span>
            <span className={styles.metricSub}>Verified Public Reviews</span>
          </div>

          <div className={styles.metricDivider} />

          <div className={styles.metricItem}>
            <span className={styles.metricScoreSuccess}>100%</span>
            <span className={styles.metricSub}>Cashless TPA Support</span>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filterTabs}>
          <button
            type="button"
            className={`${styles.filterBtn} ${activeFilter === 'all' ? styles.filterBtnActive : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All Experiences ({approvedReviews.length})
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${activeFilter === 'hospital' ? styles.filterBtnActive : ''}`}
            onClick={() => setActiveFilter('hospital')}
          >
            Hospitals
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${activeFilter === 'surgery' ? styles.filterBtnActive : ''}`}
            onClick={() => setActiveFilter('surgery')}
          >
            Surgeries & Procedures
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${activeFilter === 'doctor' ? styles.filterBtnActive : ''}`}
            onClick={() => setActiveFilter('doctor')}
          >
            Specialist Doctors
          </button>
        </div>

        {/* Reviews Grid */}
        <div className={styles.reviewsGrid}>
          {filteredReviews.map((rev) => (
            <div key={rev.id || rev._id} className={styles.reviewCard}>
              <div className={styles.cardTop}>
                <div className={styles.authorGroup}>
                  <div className={styles.avatar}>
                    {rev.patientName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className={styles.authorNameRow}>
                      <span className={styles.authorName}>{rev.patientName}</span>
                      {rev.isVerified && (
                        <span className={styles.verifiedTag}>
                          <CheckCircle2 size={12} /> Verified Patient
                        </span>
                      )}
                    </div>
                    <span className={styles.authorCity}>
                      <MapPin size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 2 }} />
                      {rev.patientCity || 'Bengaluru'}
                    </span>
                  </div>
                </div>

                <div className={styles.ratingStars}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={14}
                      fill={s <= Number(rev.rating) ? '#f59e0b' : '#e2e8f0'}
                      color={s <= Number(rev.rating) ? '#f59e0b' : '#cbd5e1'}
                    />
                  ))}
                </div>
              </div>

              {/* Target info badge */}
              <div className={styles.targetBadge}>
                <Building2 size={13} color="#2563eb" />
                <span>{rev.targetName}</span>
                {rev.treatment && <span className={styles.treatmentPill}>• {rev.treatment}</span>}
              </div>

              {rev.title && <h4 className={styles.reviewTitle}>{rev.title}</h4>}
              <p className={styles.reviewText}>{rev.comment}</p>

              {/* Insurance info footer */}
              {rev.insuranceUsed && rev.insuranceUsed !== 'None' && rev.insuranceUsed !== 'None / Self-pay' && (
                <div className={styles.insFooter}>
                  <ShieldCheck size={14} color="#059669" />
                  <span>Settled via Cashless: <strong>{rev.insuranceUsed}</strong></span>
                </div>
              )}
            </div>
          ))}
        </div>
      </Container>

      {/* Write Review Modal */}
      {isWriteModalOpen && (
        <WriteReviewModal
          onClose={() => setIsWriteModalOpen(false)}
          onSuccess={() => setIsWriteModalOpen(false)}
        />
      )}
    </section>
  );
};

export default PublicReviewsSection;
