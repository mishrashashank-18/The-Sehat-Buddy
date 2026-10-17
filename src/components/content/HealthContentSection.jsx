import React from 'react';
import Container from '../layout/Container';
import SectionHeader from '../common/SectionHeader';
import ArticleCard from './ArticleCard';
import NewsletterCard from './NewsletterCard';
import { useData } from '../../context/useData';
import styles from './HealthContentSection.module.css';

const HealthContentSection = ({ onNavigate }) => {
  const { articles } = useData();

  return (
    <section id="health-content-section" className={styles.section}>
      <Container>
        <SectionHeader
          title="Health Content & Tips"
          linkText={`View All Articles (${articles?.length || 0})`}
          onLinkClick={() => onNavigate && onNavigate('coming-soon', 'articles')}
        />
        
        <div className={styles.grid}>
          {articles?.map(article => (
            <ArticleCard key={article.id} article={article} onNavigate={onNavigate} />
          ))}
          <NewsletterCard />
        </div>
      </Container>
    </section>
  );
};

export default HealthContentSection;
