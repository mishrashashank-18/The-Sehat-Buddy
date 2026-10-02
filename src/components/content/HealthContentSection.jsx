import React from 'react';
import Container from '../layout/Container';
import SectionHeader from '../common/SectionHeader';
import ArticleCard from './ArticleCard';
import NewsletterCard from './NewsletterCard';
import { articles } from '../../data/articles';
import styles from './HealthContentSection.module.css';

const HealthContentSection = () => {
  return (
    <section className={styles.section}>
      <Container>
        <SectionHeader title="Health Content & Tips" linkText="View All Articles" />
        
        <div className={styles.grid}>
          {articles.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))}
          <NewsletterCard />
        </div>
      </Container>
    </section>
  );
};

export default HealthContentSection;
