import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { useData } from '../../context/useData';
import styles from './NewsletterCard.module.css';

const NewsletterCard = () => {
  const { heroContent } = useData();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setEmail('');
    setSubscribed(true);
    setTimeout(() => setSubscribed(false), 3000);
  };

  return (
    <div className={styles.card}>
      <h3 className={styles.title} style={{ whiteSpace: 'pre-line' }}>
        {heroContent?.newsletterTitle || 'Stay updated with\nhealth tips & offers'}
      </h3>
      <p className={styles.subtitle}>
        {heroContent?.newsletterSubtitle || 'Subscribe to our newsletter'}
      </p>
      
      <div className={styles.envelopeWrapper}>
        <Mail size={48} className={styles.envelopeIcon} strokeWidth={1} />
      </div>
      
      {subscribed ? (
        <div style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.9rem', textAlign: 'center', marginTop: '10px' }}>
          ✓ Thank you for subscribing!
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="email"
            placeholder="Enter your email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className={styles.button}>Subscribe</button>
        </form>
      )}
    </div>
  );
};

export default NewsletterCard;
