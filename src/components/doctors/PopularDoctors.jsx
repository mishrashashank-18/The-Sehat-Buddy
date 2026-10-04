import React from 'react';
import Container from '../layout/Container';
import SectionHeader from '../common/SectionHeader';
import DoctorCard from './DoctorCard';
import { useData } from '../../context/useData';
import styles from './PopularDoctors.module.css';

const PopularDoctors = ({ onNavigate }) => {
  const { doctors } = useData();

  // Remove Dr. Pooja Malhotra from this specific section
  const displayDoctors = doctors.filter(doctor => !doctor.name.includes('Pooja Malhotra'));

  return (
    <section id="doctors-section" className={styles.section}>
      <Container>
        <SectionHeader title="Popular Doctors" linkText={`View All Doctors (${displayDoctors.length})`} onLinkClick={() => onNavigate('find-doctors')} />
        
        <div className={styles.grid}>
          {displayDoctors.map(doctor => (
            <DoctorCard key={doctor.id} doctor={doctor} onNavigate={onNavigate} />
          ))}
        </div>
      </Container>
    </section>
  );
};

export default PopularDoctors;
