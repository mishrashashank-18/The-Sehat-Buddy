import React from 'react';
import { ExternalLink, FileText } from 'lucide-react';
import styles from './ArticleCard.module.css';

const ArticleCard = ({ article, onNavigate }) => {
  const handleClick = (e) => {
    if (article?.pdfUrl) {
      window.open(article.pdfUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    if (article?.link && article.link.trim()) {
      let targetUrl = article.link.trim();
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://') && !targetUrl.startsWith('/')) {
        targetUrl = `https://${targetUrl}`;
      }
      if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      } else if (targetUrl.startsWith('/')) {
        window.location.href = targetUrl;
      }
      return;
    }

    if (onNavigate) {
      onNavigate('coming-soon', 'articles');
    }
  };

  return (
    <div
      className={styles.card}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
      title={article?.pdfUrl ? `View PDF: ${article.title} (${article.pdfSize || '1MB'})` : article?.link ? `Read article: ${article.title} (${article.link})` : `Read article: ${article.title}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e);
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div 
            className={styles.tag} 
            style={{ 
              backgroundColor: article.categoryBg,
              color: article.categoryColor
            }}
          >
            {article.category}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {article?.pdfUrl && (
              <span className={styles.pdfBadge} title="PDF Document Attached">
                <FileText size={11} />
                <span>PDF {article.pdfSize ? `(${article.pdfSize})` : ''}</span>
              </span>
            )}
            {article?.link && !article?.pdfUrl && (
              <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }} title={`External link: ${article.link}`}>
                <ExternalLink size={12} />
              </span>
            )}
          </div>
        </div>
        <h3 className={styles.title}>{article.title}</h3>
        <p className={styles.readTime}>{article.readTime}</p>
      </div>
    </div>
  );
};

export default ArticleCard;
