import React from 'react';
import { ArrowRight } from 'lucide-react';
import styles from './SectionHeader.module.css';

const SectionHeader = ({ title, linkText, linkHref = '#', onLinkClick }) => {
  return (
    <div className={styles.header}>
      <h2 className={styles.title}>{title}</h2>
      {linkText && (
        <a 
          href={linkHref} 
          className={styles.link}
          onClick={(e) => {
            if (onLinkClick) {
              e.preventDefault();
              onLinkClick(e);
            }
          }}
        >
          {linkText} <ArrowRight className={styles.icon} size={18} />
        </a>
      )}
    </div>
  );
};

export default SectionHeader;
