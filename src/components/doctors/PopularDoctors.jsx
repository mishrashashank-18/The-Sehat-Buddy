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

  // When doctors are marked as Star in admin dashboard, strictly show ONLY those star doctors in Popular Doctors.
  // Fallback to active doctors only if no doctor has been marked star yet.
  const displayDoctors = useMemo(() => {
    const allDocs = Array.isArray(doctors) ? doctors : [];
    const starDoctors = allDocs.filter(doc => Boolean(doc.isStarDoctor));
    if (starDoctors.length > 0) {
      return starDoctors;
    }
    return allDocs.filter(doc => doc.available !== false);
  }, [doctors]);

  // Generate seamless marquee cards: exactly two identical halves for smooth infinite runLeft (-50%) loop
  const marqueeDoctors = useMemo(() => {
    if (displayDoctors.length === 0) return [];
    let half = [...displayDoctors];
    while (half.length < 6) {
      half = [...half, ...displayDoctors];
    }
    return [...half, ...half];
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
