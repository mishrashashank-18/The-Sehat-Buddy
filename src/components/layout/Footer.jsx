import React from 'react';
import { HeartPulse } from 'lucide-react';
import Container from './Container';
import styles from './Footer.module.css';

const CURRENT_YEAR = new Date().getFullYear();

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.grid}>
          <div className={styles.brandSection}>
            <div className={styles.logoGroup}>
              <div className={styles.logoIcon}>
                <HeartPulse size={24} color="var(--color-primary)" />
              </div>
              <div className={styles.logoText}>
                <h2>The Sehat Buddy</h2>
                <p>Your Health. Our Priority.</p>
              </div>
            </div>
            <p className={styles.description}>
              The Sehat Buddy is your one-stop platform to consult doctors, book tests, surgeries and explore trusted healthcare services.
            </p>
            <div className={styles.socialLinks}>
              <a href="https://www.facebook.com/profile.php?id=61594704587784" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </a>
              <a href="#" aria-label="Twitter">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
              </a>
              <a href="https://www.instagram.com/thesehatbuddy/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              <a href="https://www.linkedin.com/company/the-sehat-buddy/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
              </a>
            </div>
          </div>
          
          <div className={styles.linkSection}>
            <h3>For Patients</h3>
            <ul>
              <li><a href="#">Find Doctors</a></li>
              <li><a href="#">Book Appointments</a></li>
              <li><a href="#">Lab Tests</a></li>
              <li><a href="#">Surgeries</a></li>
            </ul>
          </div>
          
          <div className={styles.linkSection}>
            <h3>For Providers</h3>
            <ul>
              <li><a href="/doctor" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/doctor'); window.dispatchEvent(new PopStateEvent('popstate')); }}>Doctor Portal</a></li>
              <li><a href="/hospital" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/hospital'); window.dispatchEvent(new PopStateEvent('popstate')); }}>Hospital Dashboard</a></li>
              <li><a href="/admin" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/admin'); window.dispatchEvent(new PopStateEvent('popstate')); }}>Admin Console</a></li>
              <li><a href="#">Provider Support</a></li>
            </ul>
          </div>
          
          <div className={styles.linkSection}>
            <h3>Company</h3>
            <ul>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Contact Us</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms & Conditions</a></li>
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
