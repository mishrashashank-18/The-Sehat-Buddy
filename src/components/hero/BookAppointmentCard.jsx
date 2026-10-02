import React from 'react';
import { Calendar } from 'lucide-react';
import Button from '../common/Button';
import styles from './BookAppointmentCard.module.css';

const BookAppointmentCard = ({ className = '' }) => {
  return (
    <div className={`${styles.card} ${className}`}>
      <div className={styles.headerInfo}>
        <div className={styles.iconWrapper}>
          <Calendar size={20} className={styles.icon} />
        </div>
        <div>
          <h3 className={styles.title}>Book Appointment</h3>
          <p className={styles.subtitle}>in just a few clicks</p>
        </div>
      </div>
      <Button className={styles.button}>Book Now</Button>
    </div>
  );
};

export default BookAppointmentCard;
