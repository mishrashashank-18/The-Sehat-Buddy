import React from 'react';
import { Building2, ShieldCheck, Users } from 'lucide-react';
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

  const badgeText = heroContent?.corporateBadge || 'ENTERPRISE HEALTHCARE NETWORK';
  const titleText = heroContent?.corporateTitle || 'Corporate Tie-ups & Partners';
  const subtitleText = heroContent?.corporateSubtitle || 'Trusted by leading enterprises for priority admissions, comprehensive annual checkups, and cashless corporate benefits.';
  const statText = heroContent?.corporateStat || '2.5M+ Corporate Lives Covered';

  return (
    <section id="corporate-tieups-section" className={styles.section}>
      <Container>
        <div className={styles.headerRow}>
          <div className={styles.headerInfo}>
            <div className={styles.topBadge}>
              <Building2 size={14} />
              <span>{badgeText}</span>
            </div>
            <h2 className={styles.title}>{titleText}</h2>
            <p className={styles.subtitle}>
              {subtitleText}
            </p>
          </div>
          <div className={styles.statsPill}>
            <Users size={16} color="var(--color-primary)" />
            <span><strong>{statText.split(' ')[0]}</strong> {statText.substring(statText.indexOf(' ') + 1)}</span>
          </div>
        </div>

        <div className={styles.marqueeWrapper}>
          <div className={styles.marqueeTrack}>
            {marqueeTieups.map((corp, index) => (
              <div
                key={`${corp.id}-${index}`}
                className={styles.cardItem}
              >
                <div className={styles.card}>
                  <div className={styles.cardTop}>
                    <div
                      className={styles.logoBadge}
                      style={{ backgroundColor: corp.bgColor, color: corp.color }}
                    >
                      {corp.logo ? (
                        <img
                          src={corp.logo}
                          alt={corp.name || 'Company logo'}
                          className={styles.logoImg}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const fallback = e.target.parentElement?.querySelector(`.${styles.logoText}`);
                            if (fallback) fallback.style.display = 'inline';
                          }}
                        />
                      ) : null}
                      <span
                        className={styles.logoText}
                        style={{ display: corp.logo ? 'none' : 'inline' }}
                      >
                        {corp.logoText}
                      </span>
                    </div>
                    {corp.category && <span className={styles.categoryTag}>{corp.category}</span>}
                  </div>

                  <h3 className={styles.companyName}>{corp.name}</h3>
                  <p className={styles.benefitText}>{corp.benefit}</p>

                  <div className={styles.cardBottom}>
                    <div className={styles.verifiedPartner}>
                      <ShieldCheck size={14} color="#16a34a" />
                      <span>Corporate Tie-up</span>
                    </div>
                    {corp.employeesCovered && (
                      <span className={styles.empCovered}>
                        {corp.employeesCovered} Employees
                      </span>
                    )}
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
