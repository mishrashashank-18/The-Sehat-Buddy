import React from 'react';
import Container from '../layout/Container';
import SectionHeader from '../common/SectionHeader';
import ServiceCard from './ServiceCard';
import { useData } from '../../context/useData';
import styles from './ServicesSection.module.css';

const ServicesSection = () => {
  const { services } = useData();

  return (
    <section id="services-section" className={styles.section}>
      <Container>
        <SectionHeader title="Explore Top Services" linkText={`View All Services (${services?.length || 0})`} />
        <div className={styles.grid}>
          {services?.map(service => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </Container>
    </section>
  );
};

export default ServicesSection;
