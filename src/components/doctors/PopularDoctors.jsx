import React, { useEffect, useMemo } from 'react';
import Container from '../layout/Container';
import SectionHeader from '../common/SectionHeader';
import DoctorCard from './DoctorCard';
import { useData } from '../../context/useData';
import { isDoctorProfileEligibleForListing } from '../../utils/doctorProfileCompletion';
import styles from './PopularDoctors.module.css';

const PopularDoctors = ({ onNavigate }) => {
  const { doctors, refreshDoctors } = useData();

  // Fetch immediately if doctors list is empty
  useEffect(() => {
    if (!doctors || doctors.length === 0) {
      refreshDoctors?.();
    }
  }, [doctors, refreshDoctors]);

  // Strictly show ONLY doctors marked as Star in admin dashboard who have completed >=80% profile
  const displayDoctors = useMemo(() => {
    const allDocs = Array.isArray(doctors) ? doctors : [];
    return allDocs.filter(doc => Boolean(doc.isStarDoctor) && isDoctorProfileEligibleForListing(doc));
  }, [doctors]);

  // Count total publicly listed doctors (>=80% profile completed)
  const totalEligibleCount = useMemo(() => {
    const allDocs = Array.isArray(doctors) ? doctors : [];
    return allDocs.filter(doc => isDoctorProfileEligibleForListing(doc)).length;
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

  // If no doctor is marked as star, do not show popular doctors section
  if (displayDoctors.length === 0) {
    return null;
  }

  return (
    <section id="doctors-section" className={styles.section}>
      <Container>
        <SectionHeader
          title="Popular Doctors"
          linkText={`View All Doctors (${totalEligibleCount})`}
          onLinkClick={() => onNavigate('find-doctors')}
        />

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
      </Container>
    </section>
  );
};

export default PopularDoctors;
