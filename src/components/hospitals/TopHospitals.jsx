import React from 'react';
import { MapPin, Star, Bed, ShieldCheck, Building2 } from 'lucide-react';
import Container from '../layout/Container';
import SectionHeader from '../common/SectionHeader';
import { useData } from '../../context/useData';
import { getHospitalRatingStats } from '../../utils/hospitalReviewUtils';
import styles from './TopHospitals.module.css';

const TopHospitals = ({ onNavigate }) => {
  const { hospitals, reviews } = useData();

  const allHospitals = hospitals && hospitals.length > 0 ? hospitals : [];
  const totalHospitalsCount = allHospitals.filter(h => !h.publicationStatus || h.publicationStatus === 'published').length || allHospitals.length;

  const displayHospitals = allHospitals.filter(
    h => (!h.publicationStatus || h.publicationStatus === 'published') && (h.showOnHome !== false)
  );
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
          linkText={`Explore All Hospitals (${totalHospitalsCount})`}
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
                    {hospital.image ? (
                      <img
                        src={hospital.image}
                        alt={hospital.name}
                        className={styles.image}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      style={{
                        display: hospital.image ? 'none' : 'flex',
                        width: '100%',
                        height: '100%',
                        minHeight: '180px',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                        color: '#94a3b8'
                      }}
                    >
                      <Building2 size={44} color="#94a3b8" />
                    </div>
                    <div className={styles.cityBadge}>
                      <MapPin size={12} /> {hospital.city}
                    </div>
                  </div>

                  <div className={styles.info}>
                    <div className={styles.titleRow}>
                      <h3 className={styles.name}>{hospital.name}</h3>
                      <div className={styles.rating}>
                        <Star size={13} fill="#FACC15" color="#FACC15" />
                        <span>{getHospitalRatingStats(hospital, reviews).ratingDisplay}</span>
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
