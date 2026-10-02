import React from 'react';
import Container from '../layout/Container';
import FeatureItem from './FeatureItem';
import { features } from '../../data/features';
import { Play } from 'lucide-react';
import styles from './WhyChooseSection.module.css';
import whyDoctor from '../../assets/images/why-doctor.png';

const WhyChooseSection = () => {
  return (
    <section className={styles.section}>
      <Container>
        <div className={styles.wrapper}>
          <div className={styles.leftContent}>
            <div className={styles.imageContainer}>
              <img src={whyDoctor} alt="Doctor" className={styles.image} />
              <div className={styles.playButtonWrapper}>
                <div className={styles.playButton}>
                  <Play size={20} className={styles.playIcon} fill="currentColor" />
                </div>
                <span className={styles.playText}>Watch how<br/>Sehat Buddy<br/>works for you</span>
              </div>
            </div>
          </div>
          
          <div className={styles.rightContent}>
            <h2 className={styles.title}>Why Choose The Sehat Buddy?</h2>
            <div className={styles.featuresGrid}>
              {features.map((feature, index) => (
                <React.Fragment key={feature.id}>
                  <FeatureItem feature={feature} />
                  {index < features.length - 1 && <div className={styles.divider}></div>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default WhyChooseSection;
