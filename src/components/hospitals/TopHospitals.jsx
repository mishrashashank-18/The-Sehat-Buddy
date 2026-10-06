import React from 'react';
import { MapPin, Star, Bed, ShieldCheck } from 'lucide-react';
import Container from '../layout/Container';
import SectionHeader from '../common/SectionHeader';
import { useData } from '../../context/useData';
import styles from './TopHospitals.module.css';

const TopHospitals = ({ onNavigate }) => {
  const { hospitals } = useData();

  return (
    <section id="hospitals-section" className={styles.section}>
      <Container>
        <SectionHeader
          title="Top Partner Hospitals"
          linkText={`Explore All Hospitals (${hospitals.length})`}
          onLinkClick={() => {
            if (onNavigate) {
              onNavigate('find-hospitals');
            }
          }}
        />

        <div className={styles.grid}>
          {hospitals.slice(0, 4).map((hospital) => (
            <div
              key={hospital.id || hospital._id}
              className={styles.card}
              onClick={() => onNavigate && onNavigate('hospital-profile', hospital.id || hospital._id)}
              style={{ cursor: 'pointer' }}
            >
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
                    <ShieldCheck size={14} color="#2563EB" />
                    <span>Verified Partner</span>
                  </div>
                  <button
                    className={styles.viewDetailsBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onNavigate) {
                        onNavigate('hospital-profile', hospital.id || hospital._id);
                      }
                    }}
                  >
                    View Center
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default TopHospitals;
