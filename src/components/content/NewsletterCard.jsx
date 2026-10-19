import React, { useState } from 'react';
import { Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useData } from '../../context/useData';
import { api } from '../../services/api';
import styles from './NewsletterCard.module.css';

const NewsletterCard = () => {
  const { heroContent } = useData();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || loading) return;

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await api.subscribeNewsletter(email.trim(), 'newsletter');
      if (response && response.success) {
        setSubscribed(true);
        setEmail('');
        setTimeout(() => setSubscribed(false), 8000);
      } else {
        setErrorMessage(response?.message || 'Subscription failed. Please check your email.');
      }
    } catch (err) {
      console.error('Newsletter subscription error:', err);
      setErrorMessage(err.message || 'Could not subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
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
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '10px',
          padding: '12px 14px',
          color: '#ffffff',
          fontWeight: 600,
          fontSize: '0.84rem',
          textAlign: 'center',
          marginTop: 'auto',
          lineHeight: '1.4'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
            <CheckCircle2 size={16} color="#86efac" />
            <span style={{ color: '#86efac', fontWeight: 700 }}>Subscribed!</span>
          </div>
          <span style={{ fontSize: '0.78rem', opacity: 0.95 }}>
            Check your inbox for a confirmation email from Brevo.
          </span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="email"
            placeholder="Enter your email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
          {errorMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: '#fca5a5',
              fontSize: '0.75rem',
              marginTop: '6px'
            }}>
              <AlertCircle size={12} />
              <span>{errorMessage}</span>
            </div>
          )}
          <button 
            type="submit" 
            className={styles.button}
            disabled={loading}
            style={{ opacity: loading ? 0.75 : 1, width: loading ? '100px' : undefined }}
          >
            {loading ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Loader2 size={12} className={styles.spinning} /> Sending...
              </span>
            ) : 'Subscribe'}
          </button>
        </form>
      )}
    </div>
  );
};

export default NewsletterCard;
