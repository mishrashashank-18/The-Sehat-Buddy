import React from 'react';
import { useData } from '../../context/useData';
import logoImg from '../../assets/images/logo.png';
import Container from './Container';
import { DEFAULT_SOCIAL_LINKS } from '../../data/branding';
import { SocialIcon } from '../common/SocialIcon';
import styles from './Footer.module.css';

const CURRENT_YEAR = new Date().getFullYear();

const Footer = ({ onNavigate }) => {
  const { branding } = useData();

  const socialLinks = Array.isArray(branding?.socialLinks) && branding.socialLinks.length > 0
    ? branding.socialLinks
    : DEFAULT_SOCIAL_LINKS;

  const activeLinks = socialLinks.filter(item => item.enabled !== false);

  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.grid}>
          <div className={styles.brandSection}>
            <div className={styles.logoGroup} onClick={() => onNavigate && onNavigate('site')} style={{ cursor: 'pointer' }}>
              {branding?.showLogo !== false && branding?.logoType !== 'none' && (
                <div className={styles.logoIcon}>
                  <img
                    src={branding?.logoType === 'image' && branding?.logoImage ? branding.logoImage : logoImg}
                    alt={branding?.siteName || 'The Sehat Buddy'}
                    style={{ height: '26px', maxWidth: '120px', objectFit: 'contain' }}
                  />
                </div>
              )}
              <div className={styles.logoText}>
                <h2>{branding?.siteName || 'The Sehat Buddy'}</h2>
                {branding?.showTagline !== false && branding?.tagline && (
                  <p>{branding.tagline}</p>
                )}
              </div>
            </div>
            <p className={styles.description}>
              {branding?.siteName || 'The Sehat Buddy'} is your one-stop platform to consult doctors, book tests, surgeries and explore trusted healthcare services.
            </p>
            {activeLinks.length > 0 && (
              <div className={styles.socialLinks}>
                {activeLinks.map((item) => {
                  const hasUrl = Boolean(item.url && item.url.trim() && item.url !== '#');
                  return (
                    <a
                      key={item.id || item.platform}
                      href={hasUrl ? item.url : '#'}
                      target={hasUrl ? '_blank' : undefined}
                      rel={hasUrl ? 'noopener noreferrer' : undefined}
                      onClick={(e) => {
                        if (!hasUrl) {
                          e.preventDefault();
                          onNavigate && onNavigate('coming-soon', `social-${item.platform}`);
                        }
                      }}
                      aria-label={item.label || item.platform || 'Social Link'}
                      title={item.label || item.platform}
                    >
                      <SocialIcon platform={item.platform} size={20} />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className={styles.linkSection}>
            <h3>For Patients</h3>
            <ul>
              <li><a href="/doctors" onClick={(e) => { e.preventDefault(); onNavigate && onNavigate('find-doctors'); }}>Find Doctors</a></li>
              <li><a href="/doctors" onClick={(e) => { e.preventDefault(); onNavigate && onNavigate('find-doctors'); }}>Book Appointments</a></li>
              <li><a href="/services/lab-tests" onClick={(e) => { e.preventDefault(); onNavigate && onNavigate('coming-soon', 'lab-tests'); }}>Lab Tests</a></li>
              <li><a href="/hospitals?tab=surgeries" onClick={(e) => { e.preventDefault(); if (onNavigate) { onNavigate('hospitals'); } else { window.history.pushState({}, '', '/hospitals?tab=surgeries'); window.dispatchEvent(new PopStateEvent('popstate')); } window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Surgeries & Specialities</a></li>
            </ul>
          </div>
          
          <div className={styles.linkSection}>
            <h3>For Providers</h3>
            <ul>
              <li><a href="/doctor" onClick={(e) => { e.preventDefault(); onNavigate && onNavigate('doctor'); }}>Doctor Portal</a></li>
              <li><a href="/hospital" onClick={(e) => { e.preventDefault(); onNavigate && onNavigate('hospital'); }}>Hospital Dashboard</a></li>
              <li><a href="/admin" onClick={(e) => { e.preventDefault(); onNavigate && onNavigate('admin'); }}>Admin Console</a></li>
              <li><a href="/support" onClick={(e) => { e.preventDefault(); onNavigate && onNavigate('coming-soon', 'provider-support'); }}>Provider Support</a></li>
            </ul>
          </div>
          
          <div className={styles.linkSection}>
            <h3>Company</h3>
            <ul>
              <li><a href="/about" onClick={(e) => { e.preventDefault(); onNavigate && onNavigate('coming-soon', 'about'); }}>About Us</a></li>
              <li><a href="/contact" onClick={(e) => { e.preventDefault(); onNavigate && onNavigate('coming-soon', 'contact'); }}>Contact Us</a></li>
              <li><a href="/privacy" onClick={(e) => { e.preventDefault(); onNavigate && onNavigate('coming-soon', 'privacy'); }}>Privacy Policy</a></li>
              <li><a href="/terms" onClick={(e) => { e.preventDefault(); onNavigate && onNavigate('coming-soon', 'terms'); }}>Terms & Conditions</a></li>
            </ul>
          </div>
        </div>
        
        <div className={styles.bottomBar}>
          <p>&copy; {CURRENT_YEAR} The Sehat Buddy. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
