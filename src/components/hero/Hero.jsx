import React from 'react';
import Container from '../layout/Container';
import HeroStats from './HeroStats';
import styles from './Hero.module.css';
import heroFamily from '../../assets/images/hero-family.jpg';

const Hero = () => {
  return (
    <section className={styles.heroSection}>
      <Container className={styles.container}>
        <div className={styles.contentWrapper}>
          <div className={styles.textContent}>
            <div className={styles.badge}>
              Your Health Partner, Every Step of the Way
            </div>
            
            <h1 className={styles.title}>
              Find Doctors, Book<br />
              Appointments & Take<br />
              Care of <span className={styles.highlight}>Your Health</span>
            </h1>
            
            <p className={styles.description}>
              The Sehat Buddy is your one-stop platform to consult doctors, book tests, surgeries and explore trusted healthcare services – anytime, anywhere.
            </p>
            
            <HeroStats />
          </div>
          
          <div className={styles.imageContent}>
            <img src={heroFamily} alt="Happy Indian family" className={styles.heroImg} />
          </div>
        </div>
      </Container>
    </section>
  );
};

export default Hero;
