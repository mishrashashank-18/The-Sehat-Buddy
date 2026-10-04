import React from 'react';
import { ShieldCheck, UserPlus, Clock } from 'lucide-react';
import { useData } from '../../context/useData';
import styles from './HeroStats.module.css';

const HeroStats = () => {
  const { heroContent } = useData();
  const stats = heroContent?.stats || [
    { id: 1, label: 'Trusted by', value: '10M+ Users' },
    { id: 2, label: 'Expert Doctors', value: '25,000+' },
    { id: 3, label: 'Quick', value: 'Appointments' }
  ];

  return (
    <div className={styles.statsContainer}>
      <div className={styles.statItem}>
        <ShieldCheck className={styles.icon} size={28} strokeWidth={1.5} />
        <div className={styles.textGroup}>
          <span className={styles.label}>{stats[0]?.label || 'Trusted by'}</span>
          <span className={styles.value}>{stats[0]?.value || '10M+ Users'}</span>
        </div>
      </div>
      
      <div className={styles.divider}></div>
      
      <div className={styles.statItem}>
        <UserPlus className={styles.icon} size={28} strokeWidth={1.5} />
        <div className={styles.textGroup}>
          <span className={styles.value}>{stats[1]?.value || '25,000+'}</span>
          <span className={styles.label}>{stats[1]?.label || 'Expert Doctors'}</span>
        </div>
      </div>
      
      <div className={styles.divider}></div>
      
      <div className={styles.statItem}>
        <Clock className={styles.icon} size={28} strokeWidth={1.5} />
        <div className={styles.textGroup}>
          <span className={styles.label}>{stats[2]?.label || 'Quick'}</span>
          <span className={styles.value}>{stats[2]?.value || 'Appointments'}</span>
        </div>
      </div>
    </div>
  );
};

export default HeroStats;
