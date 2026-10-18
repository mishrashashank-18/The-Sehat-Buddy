import React from 'react';
import Container from '../layout/Container';
import SectionHeader from '../common/SectionHeader';
import DoctorCard from './DoctorCard';
import { useData } from '../../context/useData';
import styles from './PopularDoctors.module.css';

const PopularDoctors = ({ onNavigate }) => {
  const { doctors } = useData();

  // Filter doctors that have been starred by Admin
  const starDoctors = (doctors || []).filter(doc => Boolean(doc.isStarDoctor));

  // If any doctors are starred by admin, display those in Popular Doctors!
  // Fall back to all doctors if no doctors have been starred yet
  const displayDoctors = starDoctors.length > 0 ? starDoctors : (doctors && doctors.length > 0 ? doctors : []);

  // Duplicate doctors for seamless infinite marquee loop (running left)
  const marqueeDoctors = displayDoctors.length > 0
    ? (displayDoctors.length < 5
        ? [...displayDoctors, ...displayDoctors, ...displayDoctors, ...displayDoctors]
        : [...displayDoctors, ...displayDoctors])
    : [];

  return (
    <section id="doctors-section" className={styles.section}>
      <Container>
        <SectionHeader
          title="Popular Doctors"
          linkText={`View All Doctors (${doctors?.length || displayDoctors.length})`}
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
