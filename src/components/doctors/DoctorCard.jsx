import React from 'react';
import { Star } from 'lucide-react';
import styles from './DoctorCard.module.css';

const DoctorCard = ({ doctor }) => {
  return (
    <div className={styles.card}>
      <div className={styles.imageWrapper}>
        <img src={doctor.image} alt={doctor.name} className={styles.image} />
      </div>
      <div className={styles.info}>
        <h3 className={styles.name}>{doctor.name}</h3>
        <p className={styles.specialty}>{doctor.specialty}</p>
        <p className={styles.experience}>{doctor.experience}</p>
        
        <div className={styles.rating}>
          <Star size={14} className={styles.starIcon} fill="#FACC15" color="#FACC15" />
          <span className={styles.score}>{doctor.rating}</span>
          <span className={styles.reviews}>({doctor.reviews} reviews)</span>
        </div>
        
        <div className={styles.price}>₹{doctor.price}</div>
        
        <a href="#" className={styles.bookLink}>Book Appointment</a>
      </div>
    </div>
  );
};

export default DoctorCard;
