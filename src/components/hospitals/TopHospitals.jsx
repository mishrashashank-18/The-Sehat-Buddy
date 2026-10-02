import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Star, Bed, ShieldCheck } from 'lucide-react';
import Container from '../layout/Container';
import SectionHeader from '../common/SectionHeader';
import { useData } from '../../context/useData';
import styles from './TopHospitals.module.css';

const TopHospitals = () => {
  const { hospitals } = useData();
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = direction === 'left' ? -340 : 340;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section id="hospitals-section" className={styles.section}>
      <Container>
        <SectionHeader
          title="Top Partner Hospitals"
          linkText={`Explore All Hospitals (${hospitals.length})`}
        />

        <div className={styles.carouselContainer}>
          <button
            className={`${styles.navButton} ${styles.leftNav}`}
            onClick={() => scroll('left')}
            aria-label="Previous"
          >
            <ChevronLeft size={24} />
          </button>

          <div className={styles.carousel} ref={scrollRef}>
            {hospitals.map((hospital) => (
              <div key={hospital.id} className={styles.card}>
                <div className={styles.imageWrapper}>
                  <img
                    src={hospital.image}
                    alt={hospital.name}
                    className={styles.image}
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  <div className={styles.cityBadge}>
                    <MapPin size={12} /> {hospital.city}
                  </div>
                  {hospital.emergency24x7 && (
                    <div className={styles.emergencyTag}>
                      24/7 Emergency
                    </div>
                  )}
                </div>

                <div className={styles.info}>
                  <div className={styles.titleRow}>
                    <h3 className={styles.name}>{hospital.name}</h3>
                    <div className={styles.rating}>
                      <Star size={13} fill="#FACC15" color="#FACC15" />
                      <span>{hospital.rating}</span>
                    </div>
                  </div>

                  <p className={styles.address}>{hospital.address}</p>

                  <div className={styles.featuresRow}>
                    <span className={styles.featurePill}>
                      <Bed size={13} /> {hospital.totalBeds} Beds
                    </span>
                    {hospital.establishedYear && (
                      <span className={styles.featurePill}>
                        Est. {hospital.establishedYear}
                      </span>
                    )}
                  </div>

                  {hospital.specialties && hospital.specialties.length > 0 && (
                    <div className={styles.specialtiesWrap}>
                      {hospital.specialties.slice(0, 3).map((spec) => (
                        <span key={spec} className={styles.specialtyTag}>{spec}</span>
                      ))}
                      {hospital.specialties.length > 3 && (
                        <span className={styles.specialtyTagMore}>+{hospital.specialties.length - 3}</span>
                      )}
                    </div>
                  )}

                  <div className={styles.cardBottom}>
                    <div className={styles.verifiedBadge}>
                      <ShieldCheck size={14} color="#0E7C6B" />
                      <span>Verified Partner</span>
                    </div>
                    <button className={styles.viewDetailsBtn}>
                      View Center
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            className={`${styles.navButton} ${styles.rightNav}`}
            onClick={() => scroll('right')}
            aria-label="Next"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </Container>
    </section>
  );
};

export default TopHospitals;
