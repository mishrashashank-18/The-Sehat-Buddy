import React from 'react';
import styles from './ServiceCard.module.css';

const ServiceCard = ({ service, onNavigate }) => {
  const handleClick = () => {
    if (!onNavigate) return;
    const title = (service.title || '').toLowerCase().trim();
    if (title.includes('doctor')) {
      onNavigate('find-doctors');
    } else if (title.includes('hospital')) {
      onNavigate('find-hospitals');
    } else if (title.includes('lab') || title.includes('test')) {
      onNavigate('coming-soon', 'lab-tests');
    } else if (title.includes('surg')) {
      onNavigate('coming-soon', 'surgeries');
    } else if (title.includes('senior') || title.includes('elder')) {
      onNavigate('coming-soon', 'senior-care');
    } else if (title.includes('women')) {
      onNavigate('coming-soon', 'women-care');
    } else if (title.includes('kid') || title.includes('child') || title.includes('pediatric')) {
      onNavigate('coming-soon', 'kid-care');
    } else {
      const slug = service.title ? service.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'feature';
      onNavigate('coming-soon', slug);
    }
  };

  return (
    <div
      className={styles.card}
      onClick={handleClick}
      style={{ backgroundColor: service.bgTint, borderColor: service.bgTint, cursor: 'pointer' }}
      title={`Click to explore ${service.title}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
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
