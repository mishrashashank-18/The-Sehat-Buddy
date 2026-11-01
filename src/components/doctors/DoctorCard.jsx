import React from 'react';
import { Star, User } from 'lucide-react';
import { useData } from '../../context/useData';
import { getDoctorVerifiedReviews, formatDoctorExperience } from './DoctorProfile';
import styles from './DoctorCard.module.css';

const DoctorCard = ({ doctor, onNavigate, showBookNow }) => {
  const { reviews } = useData();

  const doctorReviews = React.useMemo(() => {
    return getDoctorVerifiedReviews(doctor, reviews);
  }, [doctor, reviews]);

  const avgRating = React.useMemo(() => {
    if (doctorReviews.length === 0) return '0';
    const total = doctorReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0);
    return (total / doctorReviews.length).toFixed(1);
  }, [doctorReviews]);

  const reviewCount = doctorReviews.length;

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    localStorage.setItem('autoOpenBooking', 'true');
    if (onNavigate) {
      onNavigate('doctor-profile', doctor.id || doctor._id);
    }
  };

  const handleBookNowClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    localStorage.setItem('autoOpenBooking', 'true');
    if (onNavigate) {
      onNavigate('doctor-profile', doctor.id || doctor._id);
    }
  };

  return (
    <div className={styles.card} onClick={handleClick} style={{ cursor: 'pointer' }}>
      <div className={styles.imageWrapper}>
        {doctor.image ? (
          <img
            src={doctor.image}
            alt={doctor.name}
            className={styles.image}
            onError={(e) => {
              e.target.style.display = 'none';
              if (e.target.nextElementSibling) {
                e.target.nextElementSibling.style.display = 'flex';
              }
            }}
          />
        ) : null}
        <div
          className={styles.image}
          style={{
            display: doctor.image ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f1f5f9',
            color: '#94a3b8'
          }}
        >
          <User size={48} color="#94a3b8" />
        </div>
      </div>
      <div className={styles.info}>
        <h3 className={styles.name}>{doctor.name}</h3>
        <p className={styles.specialty}>{doctor.specialty || doctor.specialization}</p>
        <p className={styles.experience}>
          {formatDoctorExperience(doctor.experience)}
          {doctor.hospital ? " • " + doctor.hospital : ""}
        </p>
        
        <div className={styles.rating}>
          <Star size={14} className={styles.starIcon} fill={reviewCount > 0 ? '#FACC15' : '#E2E8F0'} color={reviewCount > 0 ? '#FACC15' : '#CBD5E1'} />
          <span className={styles.score}>{avgRating}</span>
          <span className={styles.reviews}>({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})</span>
        </div>
        
        <div className={styles.priceRow}>
          <div className={styles.price}>₹{doctor.price || doctor.fees}</div>
          {showBookNow ? (
            <button className={styles.bookLink} onClick={handleBookNowClick}>Book Now</button>
          ) : (
            <button className={styles.bookLink} onClick={handleClick}>View Profile</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorCard;
