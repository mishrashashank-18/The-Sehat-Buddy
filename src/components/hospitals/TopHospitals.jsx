import React from 'react';
import { MapPin, Star, Bed, ShieldCheck } from 'lucide-react';
import Container from '../layout/Container';
import SectionHeader from '../common/SectionHeader';
import { useData } from '../../context/useData';
import styles from './TopHospitals.module.css';

const TopHospitals = ({ onNavigate }) => {
  const { hospitals, reviews } = useData();

  const displayHospitals = hospitals && hospitals.length > 0 ? hospitals : [];
  // Duplicate hospitals for seamless infinite marquee loop (running right)
  const marqueeHospitals = displayHospitals.length > 0
    ? (displayHospitals.length < 5
        ? [...displayHospitals, ...displayHospitals, ...displayHospitals, ...displayHospitals]
        : [...displayHospitals, ...displayHospitals])
    : [];

  return (
    <section id="hospitals-section" className={styles.section}>
      <Container>
        <SectionHeader
          title="Top Partner Hospitals"
          linkText={`Explore All Hospitals (${displayHospitals.length})`}
          onLinkClick={() => {
            if (onNavigate) {
              onNavigate('find-hospitals');
            }
          }}
        />

        <div className={styles.marqueeWrapper}>
          <div className={styles.marqueeTrackRight}>
            {marqueeHospitals.map((hospital, idx) => (
              <div
                key={`${hospital.id || hospital._id || hospital.name}-${idx}`}
                className={styles.cardItem}
              >
                <div
                  className={styles.card}
                  onClick={() => {
                    localStorage.setItem('autoOpenHospitalBooking', 'true');
                    if (onNavigate) {
                      onNavigate('hospital-profile', hospital.id || hospital._id);
                    }
                  }}
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
                        <span>{(() => {
                          const hospReviews = (reviews || []).filter(r => r.status !== 'rejected' && (
                            (r.targetId && (r.targetId === hospital.id || r.targetId === hospital._id)) ||
                            (r.targetName && hospital.name && (r.targetName.toLowerCase() === hospital.name.toLowerCase() || hospital.name.toLowerCase().includes(r.targetName.toLowerCase())))
                          ));
                          return hospReviews.length > 0
                            ? (hospReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / hospReviews.length).toFixed(1)
                            : (hospital.rating || '4.8');
                        })()}</span>
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
                      <div className={styles.btnGroup}>
                        <button
                          className={styles.bookVisitBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            localStorage.setItem('autoOpenHospitalBooking', 'true');
                            if (onNavigate) {
                              onNavigate('hospital-profile', hospital.id || hospital._id);
                            }
                          }}
                        >
                          Book Visit
                        </button>
                        <button
                          className={styles.viewDetailsBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            localStorage.setItem('autoOpenHospitalBooking', 'true');
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
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
};

export default TopHospitals;
