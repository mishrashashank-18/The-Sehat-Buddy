import React from 'react';
import styles from './ServiceCard.module.css';

const ServiceCard = ({ service, onNavigate }) => {
  const title = (service.title || '').toLowerCase().trim();
  const isAvailable = title.includes('doctor') || title.includes('hospital');

  const handleClick = () => {
    if (!onNavigate || !isAvailable) return;
    if (title.includes('doctor')) {
      onNavigate('find-doctors');
    } else if (title.includes('hospital')) {
      onNavigate('find-hospitals');
    }
  };

  return (
    <div
      className={`${styles.card} ${!isAvailable ? styles.comingSoonCard : ''}`}
      onClick={isAvailable ? handleClick : undefined}
      style={{
        backgroundColor: service.bgTint,
        borderColor: service.bgTint,
        cursor: isAvailable ? 'pointer' : 'default'
      }}
      title={isAvailable ? `Click to explore ${service.title}` : `${service.title} (Coming Soon)`}
      role={isAvailable ? 'button' : undefined}
      tabIndex={isAvailable ? 0 : undefined}
      onKeyDown={isAvailable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      } : undefined}
    >
      {!isAvailable && (
        <span className={styles.comingSoonBadge}>Coming Soon</span>
      )}
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
