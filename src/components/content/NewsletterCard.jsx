import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import Button from '../common/Button';
import styles from './NewsletterCard.module.css';

const NewsletterCard = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle subscription
    setEmail('');
  };

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Stay updated with<br/>health tips & offers</h3>
      <p className={styles.subtitle}>Subscribe to our newsletter</p>
      
      <div className={styles.envelopeWrapper}>
        <Mail size={48} className={styles.envelopeIcon} strokeWidth={1} />
      </div>
      
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
    </div>
  );
};

export default NewsletterCard;
