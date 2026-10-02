import React from 'react';
import styles from './ArticleCard.module.css';

const ArticleCard = ({ article }) => {
  return (
    <div className={styles.card}>
      <div className={styles.imageWrapper}>
        <img src={article.image} alt={article.title} className={styles.image} />
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
