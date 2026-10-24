import React, { useEffect, useMemo } from 'react';
import Container from '../layout/Container';
import SectionHeader from '../common/SectionHeader';
import DoctorCard from './DoctorCard';
import { useData } from '../../context/useData';
import styles from './PopularDoctors.module.css';

const PopularDoctors = ({ onNavigate }) => {
  const { doctors, refreshDoctors } = useData();

  // Fetch immediately if doctors list is empty
  useEffect(() => {
    if (!doctors || doctors.length === 0) {
      refreshDoctors?.();
    }
  }, [doctors, refreshDoctors]);

  // Prioritize star doctors at the front of Popular Doctors while keeping all active doctors visible
  const displayDoctors = useMemo(() => {
    const active = (doctors || []).filter(doc => doc.available !== false);
    return [...active].sort((a, b) => {
      if (Boolean(a.isStarDoctor) && !Boolean(b.isStarDoctor)) return -1;
      if (!Boolean(a.isStarDoctor) && Boolean(b.isStarDoctor)) return 1;
      return 0;
    });
  }, [doctors]);

  // Duplicate doctors for seamless infinite marquee loop (running left)
  const marqueeDoctors = useMemo(() => {
    return displayDoctors.length > 0
      ? (displayDoctors.length < 5
          ? [...displayDoctors, ...displayDoctors, ...displayDoctors, ...displayDoctors]
          : [...displayDoctors, ...displayDoctors])
      : [];
  }, [displayDoctors]);

  return (
    <section id="doctors-section" className={styles.section}>
      <Container>
        <SectionHeader
          title="Popular Doctors"
          linkText={`View All Doctors (${doctors?.length || displayDoctors.length})`}
          onLinkClick={() => onNavigate('find-doctors')}
        />

        {displayDoctors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 0', color: '#64748b' }}>
            <p style={{ margin: 0, fontSize: '0.95rem' }}>Loading doctors from directory...</p>
          </div>
        ) : (
          <div className={styles.marqueeWrapper}>
            <div className={styles.marqueeTrackLeft}>
              {marqueeDoctors.map((doctor, idx) => (
                <div
                  key={`${doctor.id || doctor._id || doctor.name}-${idx}`}
                  className={styles.cardItem}
                >
                  <DoctorCard doctor={doctor} onNavigate={onNavigate} />
                </div>
              ))}
            </div>
          </div>
        )}
      </Container>
    </section>
  );
};

export default PopularDoctors;
