import React from 'react';
import styles from './FeatureItem.module.css';

const FeatureItem = ({ feature }) => {
  const Icon = feature.icon;
  
  return (
    <div className={styles.item}>
      <div className={styles.iconWrapper}>
        <Icon size={24} className={styles.icon} />
      </div>
      <h4 className={styles.title}>{feature.title}</h4>
      <p className={styles.description}>{feature.description}</p>
    </div>
  );
};

export default FeatureItem;
