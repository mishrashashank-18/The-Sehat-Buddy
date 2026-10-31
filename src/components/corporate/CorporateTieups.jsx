import React from 'react';
import Container from '../layout/Container';
import { useData } from '../../context/useData';
import styles from './CorporateTieups.module.css';

const CorporateTieups = () => {
  const { corporateTieups, heroContent } = useData();

  const tieups = Array.isArray(corporateTieups) ? corporateTieups : [];
  if (tieups.length === 0) return null;

  // Ensure enough elements for a continuous smooth scroll even with few items
  let baseList = [...tieups];
  while (baseList.length < 10) {
    baseList = [...baseList, ...tieups];
  }
  const marqueeTieups = [...baseList, ...baseList];

  const badgeText = (heroContent?.corporateBadge && heroContent.corporateBadge !== 'ENTERPRISE HEALTHCARE NETWORK')
    ? heroContent.corporateBadge
    : 'OUR PARTNERS';

  const titleText = (heroContent?.corporateTitle && heroContent.corporateTitle !== 'Corporate Tie-ups & Partners')
    ? heroContent.corporateTitle
    : 'We work with the best partners';

  return (
    <section id="corporate-tieups-section" className={styles.section}>
      <Container>
        <div className={styles.header}>
          <span className={styles.topBadge}>{badgeText}</span>
          <h2 className={styles.title}>{titleText}</h2>
        </div>

        <div className={styles.marqueeWrapper}>
          <div className={styles.marqueeTrack}>
            {marqueeTieups.map((corp, index) => (
              <div
                key={`${corp.id || corp._id || index}-${index}`}
                className={styles.cardItem}
                title={corp.name}
              >
                <div className={styles.card}>
                  {corp.logo ? (
                    <img
                      src={corp.logo}
                      alt={corp.name || 'Partner logo'}
                      className={styles.logoImg}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.parentElement?.querySelector(`.${styles.fallbackBadge}`);
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className={styles.fallbackBadge}
                    style={{
                      display: corp.logo ? 'none' : 'flex',
                      color: corp.color || '#1E293B',
                      backgroundColor: corp.bgColor || '#F8FAFC'
                    }}
                  >
                    <span className={styles.fallbackText}>{corp.name || corp.logoText}</span>
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

export default CorporateTieups;
