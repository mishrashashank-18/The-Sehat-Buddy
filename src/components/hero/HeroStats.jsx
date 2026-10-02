import React from 'react';
import { ShieldCheck, UserPlus, Clock } from 'lucide-react';
import styles from './HeroStats.module.css';

const HeroStats = () => {
  return (
    <div className={styles.statsContainer}>
      <div className={styles.statItem}>
        <ShieldCheck className={styles.icon} size={28} strokeWidth={1.5} />
        <div className={styles.textGroup}>
          <span className={styles.label}>Trusted by</span>
          <span className={styles.value}>10M+ Users</span>
        </div>
      </div>
      
      <div className={styles.divider}></div>
      
      <div className={styles.statItem}>
        <UserPlus className={styles.icon} size={28} strokeWidth={1.5} />
        <div className={styles.textGroup}>
          <span className={styles.value}>25,000+</span>
          <span className={styles.label}>Expert Doctors</span>
        </div>
      </div>
      
      <div className={styles.divider}></div>
      
      <div className={styles.statItem}>
        <Clock className={styles.icon} size={28} strokeWidth={1.5} />
        <div className={styles.textGroup}>
          <span className={styles.label}>Quick</span>
          <span className={styles.value}>Appointments</span>
        </div>
      </div>
    </div>
  );
};

export default HeroStats;
