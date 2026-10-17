import React from 'react';
import styles from './ArticleCard.module.css';

const ArticleCard = ({ article, onNavigate }) => {
  return (
    <div
      className={styles.card}
      onClick={() => onNavigate && onNavigate('coming-soon', 'articles')}
      style={{ cursor: 'pointer' }}
      title={`Read article: ${article.title}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onNavigate && onNavigate('coming-soon', 'articles');
        }
      }}
    >
      <div className={styles.imageWrapper}>
        <img
          src={article.image}
          alt={article.title}
          className={styles.image}
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=600&q=80';
          }}
        />
      </div>
      <div className={styles.content}>
        <div 
          className={styles.tag} 
          style={{ 
            backgroundColor: article.categoryBg,
            color: article.categoryColor
          }}
        >
          {article.category}
        </div>
        <h3 className={styles.title}>{article.title}</h3>
        <p className={styles.readTime}>{article.readTime}</p>
      </div>
    </div>
  );
};

export default ArticleCard;
