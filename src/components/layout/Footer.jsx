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
          
          {/* Company */}
          <div className={styles.linkSection}>
            <h3>Company</h3>
            <ul>
              <li><a href="/about" onClick={(e) => { e.preventDefault(); setActivePolicyType('about'); }}>About Us</a></li>
              <li>
                <a
                  href="/contact"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onNavigate) onNavigate('contact');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Contact Us
                </a>
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
