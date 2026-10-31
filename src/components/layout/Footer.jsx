import React, { useState, useEffect, useRef } from 'react';
import Container from './Container';
import logoImg from '../../assets/images/logo.png';
import { useData } from '../../context/useData';
import { DEFAULT_SOCIAL_LINKS } from '../../data/branding';
import { SocialIcon } from '../common/SocialIcon';
import { 
  ChevronUp, 
  ChevronDown, 
  Phone, 
  Mail, 
  Clock, 
  Copy, 
  Check, 
  Headphones,
  Settings
} from 'lucide-react';
import PolicyViewerModal from '../common/PolicyViewerModal';
import styles from './Footer.module.css';

const CURRENT_YEAR = new Date().getFullYear();

const Footer = ({ onNavigate }) => {
  const { branding, contactInfo } = useData();

  // Contact dropdown popover state
  const [isContactOpen, setIsContactOpen] = useState(false);
  const contactDropdownRef = useRef(null);

  // Policy Viewer Modal state ('privacy' | 'terms' | null)
  const [activePolicyType, setActivePolicyType] = useState(null);

  // Admin status check (for showing dashboard shortcut)
  const [isAdmin, setIsAdmin] = useState(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u.role === 'admin' || u.isAdmin || u.type === 'admin') return true;
      }
      if (localStorage.getItem('admin_logged_in') === 'true' || localStorage.getItem('admin_token')) return true;
    } catch {
      return false;
    }
    return false;
  });

  useEffect(() => {
    const checkAdmin = () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const u = JSON.parse(userStr);
          if (u.role === 'admin' || u.isAdmin || u.type === 'admin') {
            setIsAdmin(true);
            return;
          }
        }
        if (localStorage.getItem('admin_logged_in') === 'true' || localStorage.getItem('admin_token')) {
          setIsAdmin(true);
          return;
        }
        setIsAdmin(false);
      } catch {
        setIsAdmin(false);
      }
    };
    window.addEventListener('storage', checkAdmin);
    window.addEventListener('focus', checkAdmin);
    return () => {
      window.removeEventListener('storage', checkAdmin);
      window.removeEventListener('focus', checkAdmin);
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contactDropdownRef.current && !contactDropdownRef.current.contains(e.target)) {
        setIsContactOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [copiedId, setCopiedId] = useState(null);

  const phones = Array.isArray(contactInfo?.phones) ? contactInfo.phones : [];
  const emails = Array.isArray(contactInfo?.emails) ? contactInfo.emails : [];
  const workingHours = contactInfo?.workingHours || 'Mon – Sat: 8:00 AM – 8:00 PM';

  const handleCopy = (text, id, e) => {
    if (e) e.stopPropagation();
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const socialLinks = Array.isArray(branding?.socialLinks)
    ? branding.socialLinks
    : DEFAULT_SOCIAL_LINKS;

  // Only display social icons that are enabled AND have a valid non-empty URL configured.
  const activeLinks = socialLinks.filter(item => {
    if (item.enabled === false) return false;
    const cleanUrl = (item.url || '').trim();
    return Boolean(cleanUrl && cleanUrl !== '#');
  });

  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.grid}>
          {/* Brand Section */}
          <div className={styles.brandSection}>
            <div className={styles.logoGroup} onClick={() => onNavigate && onNavigate('site')} style={{ cursor: 'pointer' }}>
              {branding?.showLogo !== false && branding?.logoType !== 'none' && (
                <div className={styles.logoIcon}>
                  <img
                    src={branding?.logoType === 'image' && branding?.logoImage ? branding.logoImage : logoImg}
                    alt={branding?.siteName || 'The Sehat Buddy'}
                    style={{ height: '26px', maxWidth: '120px', objectFit: 'contain' }}
                  />
                </div>
              )}
              <div className={styles.logoText}>
                <h2>{branding?.siteName || 'The Sehat Buddy'}</h2>
                {branding?.showTagline !== false && branding?.tagline && (
                  <p>{branding.tagline}</p>
                )}
              </div>
            </div>
            <p className={styles.description}>
              {branding?.siteName || 'The Sehat Buddy'} is your one-stop platform to consult doctors, book tests, surgeries and explore trusted healthcare services.
            </p>
            {activeLinks.length > 0 && (
              <div className={styles.socialLinks}>
                {activeLinks.map((item) => {
                  const hasUrl = Boolean(item.url && item.url.trim() && item.url !== '#');
                  return (
                    <a
                      key={item.id || item.platform}
                      href={hasUrl ? item.url : '#'}
                      target={hasUrl ? '_blank' : undefined}
                      rel={hasUrl ? 'noopener noreferrer' : undefined}
                      onClick={(e) => {
                        if (!hasUrl) {
                          e.preventDefault();
                          onNavigate && onNavigate('coming-soon', `social-${item.platform}`);
                        }
                      }}
                      aria-label={item.label || item.platform || 'Social Link'}
                      title={item.label || item.platform}
                    >
                      <SocialIcon platform={item.platform} size={20} />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* For Patients */}
          <div className={styles.linkSection}>
            <h3>For Patients</h3>
            <ul>
              <li>
                <a
                  href="/doctors"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onNavigate) onNavigate('find-doctors');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Find Doctors
                </a>
              </li>
              <li>
                <a
                  href="/hospitals"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onNavigate) onNavigate('find-hospitals');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Find Hospitals
                </a>
              </li>
              <li>
                <a
                  href="/coming-soon/lab-tests"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onNavigate) onNavigate('coming-soon', 'lab-tests');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Lab Tests
                </a>
              </li>
              <li>
                <a
                  href="/coming-soon/surgeries"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onNavigate) onNavigate('coming-soon', 'surgeries');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Surgeries
                </a>
              </li>
            </ul>
          </div>
          
          {/* Company with Interactive Real-Time Contact Dropdown */}
          <div className={styles.linkSection}>
            <h3>Company</h3>
            <ul>
              <li><a href="/about" onClick={(e) => { e.preventDefault(); onNavigate && onNavigate('coming-soon', 'about'); }}>About Us</a></li>
              
              {/* Contact Us Dropdown beside/on Contact Us in Footer */}
              <li className={styles.contactDropdownWrapper} ref={contactDropdownRef}>
                <button
                  type="button"
                  className={`${styles.footerContactTrigger} ${isContactOpen ? styles.footerContactTriggerActive : ''}`}
                  onClick={() => setIsContactOpen(!isContactOpen)}
                  aria-expanded={isContactOpen}
                  title="View Platform Contact Helplines & Desks"
                >
                  <span>Contact Us</span>
                  {isContactOpen ? (
                    <ChevronDown size={14} className={styles.footerChevron} />
                  ) : (
                    <ChevronUp size={14} className={styles.footerChevron} />
                  )}
                </button>

                {/* Popover Menu that opens above the footer link */}
                {isContactOpen && (
                  <div className={styles.footerContactPopover}>
                    {/* Header */}
                    <div className={styles.contactHeaderRow}>
                      <div className={styles.contactHeaderTitle}>
                        <Headphones size={15} style={{ color: '#2563eb' }} />
                        <span>Platform Helplines & Support</span>
                      </div>
                      {isAdmin && (
                        <button
                          type="button"
                          className={styles.adminDashboardLink}
                          onClick={() => {
                            setIsContactOpen(false);
                            if (onNavigate) {
                              onNavigate('admin', 'contact');
                            } else {
                              window.location.href = '/admin?tab=contact';
                            }
                          }}
                          title="Open Admin Dashboard to edit contact information"
                        >
                          <Settings size={12} />
                          <span>Edit in Admin</span>
                        </button>
                      )}
                    </div>

                    {/* Section 1: Phone Numbers */}
                    <div className={styles.contactSection}>
                      <div className={styles.contactSectionHeader}>
                        <span className={styles.contactSectionTitle}>
                          <Phone size={13} /> Direct Helplines
                        </span>
                      </div>

                      {/* Phone List */}
                      <div className={styles.contactList}>
                        {phones.length === 0 ? (
                          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '4px 0' }}>No helpline numbers configured.</p>
                        ) : (
                          phones.map((phone) => (
                            <div key={phone.id} className={styles.contactItemCard}>
                              <div className={styles.contactIconCirclePhone}>
                                <Phone size={15} />
                              </div>
                              <div className={styles.contactItemInfo}>
                                <div className={styles.contactItemLabelRow}>
                                  <span className={styles.contactItemLabel}>{phone.label}</span>
                                  {phone.isPrimary && <span className={styles.primaryPill}>Primary</span>}
                                </div>
                                <a href={`tel:${phone.number.replace(/\s+/g, '')}`} className={styles.contactItemValueLink}>
                                  {phone.number}
                                </a>
                              </div>
                              <div className={styles.contactItemActions}>
                                <button
                                  type="button"
                                  className={`${styles.contactActionBtn} ${copiedId === phone.id ? styles.contactActionBtnSuccess : ''}`}
                                  onClick={(e) => handleCopy(phone.number, phone.id, e)}
                                  title={copiedId === phone.id ? 'Copied!' : 'Copy Phone Number'}
                                >
                                  {copiedId === phone.id ? <Check size={14} /> : <Copy size={14} />}
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Section 2: Email Addresses */}
                    <div className={styles.contactSection}>
                      <div className={styles.contactSectionHeader}>
                        <span className={styles.contactSectionTitle}>
                          <Mail size={13} /> Email Desks
                        </span>
                      </div>

                      {/* Email List */}
                      <div className={styles.contactList}>
                        {emails.length === 0 ? (
                          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '4px 0' }}>No email addresses configured.</p>
                        ) : (
                          emails.map((em) => (
                            <div key={em.id} className={styles.contactItemCard}>
                              <div className={styles.contactIconCircleMail}>
                                <Mail size={15} />
                              </div>
                              <div className={styles.contactItemInfo}>
                                <div className={styles.contactItemLabelRow}>
                                  <span className={styles.contactItemLabel}>{em.label}</span>
                                  {em.isPrimary && <span className={styles.primaryPill}>Primary</span>}
                                </div>
                                <a href={`mailto:${em.email}`} className={styles.contactItemValueLink}>
                                  {em.email}
                                </a>
                              </div>
                              <div className={styles.contactItemActions}>
                                <button
                                  type="button"
                                  className={`${styles.contactActionBtn} ${copiedId === em.id ? styles.contactActionBtnSuccess : ''}`}
                                  onClick={(e) => handleCopy(em.email, em.id, e)}
                                  title={copiedId === em.id ? 'Copied!' : 'Copy Email Address'}
                                >
                                  {copiedId === em.id ? <Check size={14} /> : <Copy size={14} />}
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Section 3: Operating Hours */}
                    <div className={styles.contactHoursBox}>
                      <div className={styles.contactHoursText}>
                        <Clock size={13} color="#64748b" />
                        <span>Hours: <strong>{workingHours}</strong></span>
                      </div>
                    </div>
                  </div>
                )}
              </li>

              <li><a href="/privacy" onClick={(e) => { e.preventDefault(); setActivePolicyType('privacy'); }}>Privacy Policy</a></li>
              <li><a href="/terms" onClick={(e) => { e.preventDefault(); setActivePolicyType('terms'); }}>Terms & Conditions</a></li>
            </ul>
          </div>
        </div>
        
        <div className={styles.bottomBar}>
          <p>&copy; {CURRENT_YEAR} The Sehat Buddy. All rights reserved.</p>
        </div>
      </Container>

      {/* In-App Legal Policy & Compliance Document Viewer (Protected View, No Downloads) */}
      <PolicyViewerModal
        isOpen={Boolean(activePolicyType)}
        type={activePolicyType || 'privacy'}
        onClose={() => setActivePolicyType(null)}
      />
    </footer>
  );
};

export default Footer;
