import React from 'react';
import styles from './ServiceCard.module.css';

const ServiceCard = ({ service }) => {
  return (
    <div className={styles.card} style={{ backgroundColor: service.bgTint, borderColor: service.bgTint }}>
      <div 
        className={styles.iconWrapper} 
        style={{ backgroundColor: service.iconTint }}
      >
        <img src={service.iconPath} alt={service.title} className={styles.iconImg} />
      </div>
      <h3 className={styles.title}>{service.title}</h3>
      <p className={styles.subtitle}>{service.subtitle}</p>
    </div>
  );
};

export default ServiceCard;
