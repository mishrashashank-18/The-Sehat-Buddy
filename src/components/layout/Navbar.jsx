import React from 'react';
import { HeartPulse, ChevronDown, MapPin } from 'lucide-react';
import Container from './Container';
import Button from '../common/Button';
import styles from './Navbar.module.css';

const Navbar = ({ onNavigate, currentView = 'site' }) => {
  const scrollTo = (id) => {
    if (currentView !== 'site') {
      onNavigate('site');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className={styles.navbar}>
      <Container className={styles.container}>
        <div className={styles.logoGroup} onClick={() => onNavigate('site')} style={{ cursor: 'pointer' }}>
          <div className={styles.logoIcon}>
            <HeartPulse size={36} color="var(--color-primary)" strokeWidth={2.5} />
          </div>
          <div className={styles.logoText}>
            <h1>The Sehat Buddy</h1>
            <p>Your Health. Our Priority.</p>
          </div>
        </div>

        <ul className={styles.navLinks}>
          <li><a href="#" className={currentView === 'site' ? styles.active : ''} onClick={(e) => { e.preventDefault(); onNavigate('site'); }}>Home</a></li>
          <li><a href="#" className={currentView === 'find-doctors' ? styles.active : ''} onClick={(e) => { e.preventDefault(); onNavigate('find-doctors'); }}>Find Doctors</a></li>
          <li><a href="#hospitals-section" onClick={(e) => { e.preventDefault(); scrollTo('hospitals-section'); }}>Hospitals</a></li>
          <li><a href="#services-section" onClick={(e) => { e.preventDefault(); scrollTo('services-section'); }}>Services</a></li>
          <li><a href="#health-content-section" onClick={(e) => { e.preventDefault(); scrollTo('health-content-section'); }}>Health Content</a></li>
          <li>
            <a href="#" className={styles.withDropdown}>
              Care Services <ChevronDown size={16} />
            </a>
          </li>
        </ul>

        <div className={styles.actions}>
          <div className={styles.locationPill}>
            <MapPin size={16} className={styles.locationIcon} />
            <span>Bengaluru</span>
            <ChevronDown size={16} className={styles.chevron} />
          </div>

          <Button onClick={() => onNavigate && onNavigate('user-login')}>Login / Sign Up</Button>
        </div>
      </Container>
    </nav>
  );
};

export default Navbar;
