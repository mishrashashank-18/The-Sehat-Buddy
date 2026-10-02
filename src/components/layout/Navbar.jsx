import React from 'react';
import { HeartPulse, ChevronDown, MapPin } from 'lucide-react';
import Container from './Container';
import Button from '../common/Button';
import styles from './Navbar.module.css';

const Navbar = () => {
  return (
    <nav className={styles.navbar}>
      <Container className={styles.container}>
        <div className={styles.logoGroup}>
          <div className={styles.logoIcon}>
            <HeartPulse size={36} color="var(--color-primary)" strokeWidth={2.5} />
          </div>
          <div className={styles.logoText}>
            <h1>The Sehat Buddy</h1>
            <p>Your Health. Our Priority.</p>
          </div>
        </div>

        <ul className={styles.navLinks}>
          <li><a href="#" className={styles.active}>Home</a></li>
          <li><a href="#">Find Doctors</a></li>
          <li><a href="#">Hospitals</a></li>
          <li><a href="#">Lab Tests</a></li>
          <li><a href="#">Surgeries</a></li>
          <li><a href="#">Health Content</a></li>
          <li>
            <a href="#" className={styles.withDropdown}>
              Care Services <ChevronDown size={16} />
            </a>
          </li>
        </ul>

        <div className={styles.actions}>
          <div className={styles.locationPill}>
            <MapPin size={16} className={styles.locationIcon} />
            <span>Delhi, India</span>
            <ChevronDown size={16} className={styles.chevron} />
          </div>
          <Button>Login / Sign Up</Button>
        </div>
      </Container>
    </nav>
  );
};

export default Navbar;
