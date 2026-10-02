import React from 'react';
import Container from '../layout/Container';
import SectionHeader from '../common/SectionHeader';
import ServiceCard from './ServiceCard';
import { services } from '../../data/services';
import styles from './ServicesSection.module.css';

const ServicesSection = () => {
  return (
    <section className={styles.section}>
      <Container>
        <SectionHeader title="Explore Top Services" linkText="View All Services" />
        <div className={styles.grid}>
          {services.map(service => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </Container>
    </section>
  );
};

export default ServicesSection;
