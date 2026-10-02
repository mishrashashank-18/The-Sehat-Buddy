import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Container from '../layout/Container';
import SectionHeader from '../common/SectionHeader';
import DoctorCard from './DoctorCard';
import { doctors } from '../../data/doctors';
import styles from './PopularDoctors.module.css';

const PopularDoctors = () => {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = direction === 'left' ? -300 : 300;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className={styles.section}>
      <Container>
        <SectionHeader title="Popular Doctors" linkText="View All Doctors" />
        
        <div className={styles.carouselContainer}>
          <button className={`${styles.navButton} ${styles.leftNav}`} onClick={() => scroll('left')}>
            <ChevronLeft size={24} />
          </button>
          
          <div className={styles.carousel} ref={scrollRef}>
            {doctors.map(doctor => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
          
          <button className={`${styles.navButton} ${styles.rightNav}`} onClick={() => scroll('right')}>
            <ChevronRight size={24} />
          </button>
        </div>
      </Container>
    </section>
  );
};

export default PopularDoctors;
