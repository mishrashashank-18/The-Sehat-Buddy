import React from 'react';
import Container from '../layout/Container';
import HeroStats from './HeroStats';
import { useData } from '../../context/useData';
import styles from './Hero.module.css';

const DEFAULT_HERO_IMAGE = 'https://res.cloudinary.com/nehlbmp2/image/upload/v1792239399/sehatbuddy/hero/i3g2e9ptcdydfnfeqf9c.jpg';

const Hero = () => {
  const { heroContent } = useData();

  return (
    <section className={styles.heroSection}>
      <Container className={styles.container}>
        <div className={styles.contentWrapper}>
          <div className={styles.textContent}>
            <div className={styles.badge}>
              {heroContent?.badge || 'Your Health Partner, Every Step of the Way'}
            </div>
            
            <h1 className={styles.title}>
              {heroContent?.titleLine1 || 'Find Doctors, Book'}<br />
              {heroContent?.titleLine2 || 'Appointments & Take'}<br />
              <span className={styles.highlight}>{heroContent?.titleHighlight || 'Care of Your Health'}</span>
            </h1>
            
            <p className={styles.description}>
              {heroContent?.description || 'The Sehat Buddy is your one-stop platform to consult doctors, book tests, surgeries and explore trusted healthcare services – anytime, anywhere.'}
            </p>
            
            <HeroStats />
          </div>
          
          <div className={styles.imageContent}>
            <div className={styles.dotsPattern}></div>
            <div className={styles.imageShape}>
              <img
                src={heroContent?.heroImage || DEFAULT_HERO_IMAGE}
                alt="Happy Indian family at hospital reception"
                className={styles.heroImg}
                onError={(e) => {
                  e.target.src = DEFAULT_HERO_IMAGE;
                }}
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default Hero;
