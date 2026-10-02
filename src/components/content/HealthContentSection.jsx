import React from 'react';
import Container from '../layout/Container';
import SectionHeader from '../common/SectionHeader';
import ArticleCard from './ArticleCard';
import NewsletterCard from './NewsletterCard';
import { useData } from '../../context/useData';
import styles from './HealthContentSection.module.css';

const HealthContentSection = () => {
  const { articles } = useData();

  return (
    <section id="health-content-section" className={styles.section}>
      <Container>
        <SectionHeader title="Health Content & Tips" linkText={`View All Articles (${articles?.length || 0})`} />
        
        <div className={styles.grid}>
          {articles?.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))}
          <NewsletterCard />
        </div>
      </Container>
    </section>
  );
};

export default HealthContentSection;
