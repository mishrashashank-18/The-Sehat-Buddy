import React from 'react';
import Container from '../layout/Container';
import SectionHeader from '../common/SectionHeader';
import ServiceCard from './ServiceCard';
import { useData } from '../../context/useData';
import styles from './ServicesSection.module.css';

const ServicesSection = ({ onNavigate }) => {
  const { services } = useData();

  return (
    <section id="services-section" className={styles.section}>
      <Container>
        <SectionHeader
          title="Explore Top Services"
        />
        <div className={styles.grid}>
          {services?.map(service => (
            <ServiceCard key={service.id} service={service} onNavigate={onNavigate} />
          ))}
        </div>
      </Container>
    </section>
  );
};

export default ServicesSection;
