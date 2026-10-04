import React from 'react';
import { Star } from 'lucide-react';
import styles from './DoctorCard.module.css';

const DoctorCard = ({ doctor, onNavigate, showBookNow }) => {
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
        <img
          src={doctor.image}
          alt={doctor.name}
          className={styles.image}
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80';
          }}
        />
      </div>
      <div className={styles.info}>
        <h3 className={styles.name}>{doctor.name}</h3>
        <p className={styles.specialty}>{doctor.specialty || doctor.specialization}</p>
        <p className={styles.experience}>
          {doctor.experience} {typeof doctor.experience === 'number' ? 'years' : ''}
          {doctor.hospital ? " • " + doctor.hospital : ""}
        </p>
        
        <div className={styles.rating}>
          <Star size={14} className={styles.starIcon} fill="#FACC15" color="#FACC15" />
          <span className={styles.score}>{doctor.rating || '4.5'}</span>
          <span className={styles.reviews}>({doctor.reviews || '10+'} reviews)</span>
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
