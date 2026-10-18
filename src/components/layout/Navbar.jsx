import React, { useState, useEffect, useRef } from 'react';
import { HeartPulse, ChevronDown, MapPin, Check, Menu, X } from 'lucide-react';
import { useData } from '../../context/useData';
import Container from './Container';
import styles from './Navbar.module.css';

const CITIES = [
  'Bengaluru',
  'Delhi NCR',
  'Mumbai',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune'
];

const CARE_SERVICES = [
  { name: 'Senior Care', desc: 'Elderly assistance & nursing', icon: '👴' },
  { name: "Women's Health", desc: 'Gynecology & maternal wellness', icon: '🌸' },
  { name: 'Kid Care', desc: 'Pediatric care & vaccinations', icon: '👶' },
  { name: 'Surgeries & Procedures', desc: 'Minimally invasive operations', icon: '🏥' },
  { name: 'Lab Tests & Diagnostics', desc: 'Home blood test packages', icon: '🧪' }
];

const Navbar = ({ onNavigate, currentView = 'site' }) => {
  const { branding } = useData();
  const [selectedCity, setSelectedCity] = useState(() => {
    return localStorage.getItem('selectedCity') || 'Bengaluru';
  });
  const [isCityOpen, setIsCityOpen] = useState(false);
  const [isCareOpen, setIsCareOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  const cityDropdownRef = useRef(null);
  const careDropdownRef = useRef(null);
  const token = localStorage.getItem('token');

  // Compute active tab from currentView
  const getActiveTab = () => {
    if (currentView === 'find-doctors' || currentView.startsWith('doctor-profile:')) {
      return 'doctors';
    }
    if (currentView === 'find-hospitals' || currentView.startsWith('hospital-profile:')) {
      return 'hospitals';
    }
    return 'home';
  };

  const [activeTab, setActiveTab] = useState(getActiveTab);

  useEffect(() => {
    setActiveTab(getActiveTab());
  }, [currentView]);

  useEffect(() => {
    if (token) {
      fetch('http://localhost:5000/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setUser(data.data);
          }
        })
        .catch(() => {});
    }
  }, [token]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target)) {
        setIsCityOpen(false);
      }
      if (careDropdownRef.current && !careDropdownRef.current.contains(e.target)) {
        setIsCareOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCity = (city) => {
    setSelectedCity(city);
    localStorage.setItem('selectedCity', city);
    setIsCityOpen(false);
  };

  const handleGoHome = (e) => {
    if (e) e.preventDefault();
    setActiveTab('home');
    setIsMobileMenuOpen(false);
    if (currentView !== 'site') {
      onNavigate('site');
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFindDoctors = (e) => {
    if (e) e.preventDefault();
    setActiveTab('doctors');
    setIsMobileMenuOpen(false);
    onNavigate('find-doctors');
  };

  const handleHospitals = (e) => {
    if (e) e.preventDefault();
    setActiveTab('hospitals');
    setIsMobileMenuOpen(false);
    onNavigate('find-hospitals');
  };

  const handleScrollToSection = (sectionId, tabKey) => {
    setActiveTab(tabKey);
    setIsMobileMenuOpen(false);
    setIsCareOpen(false);

    if (currentView !== 'site') {
      onNavigate('site');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 250);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <nav className={styles.navbar}>
      <Container className={styles.container}>
        {/* Brand Logo & Tagline */}
        <div className={styles.logoGroup} onClick={handleGoHome}>
          {branding?.showLogo !== false && branding?.logoType !== 'none' && (
            <div className={styles.logoIcon}>
              {branding?.logoType === 'image' && branding?.logoImage ? (
                <img
                  src={branding.logoImage}
                  alt={branding?.siteName || 'Logo'}
                  className={styles.customLogoImg}
                />
              ) : (
                <HeartPulse size={34} color="#2563EB" strokeWidth={2.4} />
              )}
            </div>
          )}
          <div className={styles.logoText}>
            <h1>{branding?.siteName || 'The Sehat Buddy'}</h1>
            {branding?.showTagline !== false && branding?.tagline && (
              <p>{branding.tagline}</p>
            )}
          </div>
        </div>

        {/* Center Navigation Links */}
        <ul className={styles.navLinks}>
          <li className={styles.navItem}>
            <button
              type="button"
              className={`${styles.navLink} ${activeTab === 'home' || currentView === 'site' ? styles.active : ''}`}
              onClick={handleGoHome}
            >
              Home
            </button>
          </li>

          <li className={styles.navItem}>
            <button
              type="button"
              className={`${styles.navLink} ${activeTab === 'doctors' || currentView === 'find-doctors' ? styles.active : ''}`}
              onClick={handleFindDoctors}
            >
              Find Doctors
            </button>
          </li>

          <li className={styles.navItem}>
            <button
              type="button"
              className={`${styles.navLink} ${activeTab === 'hospitals' || currentView === 'find-hospitals' ? styles.active : ''}`}
              onClick={handleHospitals}
            >
              Hospitals
            </button>
          </li>

          <li className={styles.navItem}>
            <button
              type="button"
              className={`${styles.navLink} ${activeTab === 'services' ? styles.active : ''}`}
              onClick={() => handleScrollToSection('services-section', 'services')}
            >
              Services
            </button>
          </li>

          <li className={styles.navItem}>
            <button
              type="button"
              className={`${styles.navLink} ${activeTab === 'health-content' ? styles.active : ''}`}
              onClick={() => handleScrollToSection('health-content-section', 'health-content')}
            >
              Health Content
            </button>
          </li>

          {/* Care Services with Dropdown */}
          <li className={styles.navItem} ref={careDropdownRef}>
            <button
              type="button"
              className={`${styles.navLink} ${styles.dropdownTrigger} ${activeTab === 'care-services' ? styles.active : ''}`}
              onClick={() => setIsCareOpen(!isCareOpen)}
              onMouseEnter={() => setIsCareOpen(true)}
              aria-expanded={isCareOpen}
            >
              <span>Care Services</span>
              <ChevronDown
                size={14}
                className={`${styles.dropdownChevron} ${isCareOpen ? styles.chevronOpen : ''}`}
              />
            </button>

            {isCareOpen && (
              <div
                className={styles.dropdownMenu}
                onMouseLeave={() => setIsCareOpen(false)}
              >
                <div className={styles.dropdownHeader}>Specialized Healthcare</div>
                {CARE_SERVICES.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={styles.dropdownItem}
                    onClick={() => handleScrollToSection('services-section', 'care-services')}
                  >
                    <span className={styles.itemIcon}>{item.icon}</span>
                    <div className={styles.itemContent}>
                      <span className={styles.itemTitle}>{item.name}</span>
                      <span className={styles.itemDesc}>{item.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </li>
        </ul>

        {/* Right Actions */}
        <div className={styles.actions}>
          {/* Location Selector Pill */}
          <div className={styles.locationWrapper} ref={cityDropdownRef}>
            <button
              type="button"
              className={styles.locationPill}
              onClick={() => setIsCityOpen(!isCityOpen)}
              aria-label="Select location"
            >
              <MapPin size={16} className={styles.locationIcon} />
              <span className={styles.cityName}>{selectedCity}</span>
              <ChevronDown
                size={14}
                className={`${styles.chevron} ${isCityOpen ? styles.chevronOpen : ''}`}
              />
            </button>

            {isCityOpen && (
              <div className={styles.cityDropdownMenu}>
                <div className={styles.cityDropdownHeader}>Select Location</div>
                {CITIES.map((city) => (
                  <button
                    key={city}
                    type="button"
                    className={`${styles.cityDropdownItem} ${selectedCity === city ? styles.cityActive : ''}`}
                    onClick={() => handleSelectCity(city)}
                  >
                    <span>{city}</span>
                    {selectedCity === city && <Check size={14} className={styles.cityCheckIcon} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Auth or Profile */}
          {user && user.name ? (
            <div className={styles.userSection}>
              <span className={styles.userGreeting}>Hi, {user.name.split(' ')[0]}</span>
              <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={styles.loginBtn}
              onClick={() => onNavigate && onNavigate('user-login')}
            >
              Login / Sign Up
            </button>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            className={styles.mobileToggleBtn}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </Container>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className={styles.mobileMenu}>
          <div className={styles.mobileNavLinks}>
            <button
              type="button"
              className={`${styles.mobileNavLink} ${activeTab === 'home' ? styles.mobileActive : ''}`}
              onClick={handleGoHome}
            >
              Home
            </button>
            <button
              type="button"
              className={`${styles.mobileNavLink} ${activeTab === 'doctors' ? styles.mobileActive : ''}`}
              onClick={handleFindDoctors}
            >
              Find Doctors
            </button>
            <button
              type="button"
              className={`${styles.mobileNavLink} ${activeTab === 'hospitals' ? styles.mobileActive : ''}`}
              onClick={handleHospitals}
            >
              Hospitals
            </button>
            <button
              type="button"
              className={`${styles.mobileNavLink} ${activeTab === 'services' ? styles.mobileActive : ''}`}
              onClick={() => handleScrollToSection('services-section', 'services')}
            >
              Services
            </button>
            <button
              type="button"
              className={`${styles.mobileNavLink} ${activeTab === 'health-content' ? styles.mobileActive : ''}`}
              onClick={() => handleScrollToSection('health-content-section', 'health-content')}
            >
              Health Content
            </button>

            <div className={styles.mobileCareSection}>
              <div className={styles.mobileCareHeading}>Care Services</div>
              {CARE_SERVICES.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={styles.mobileCareItem}
                  onClick={() => handleScrollToSection('services-section', 'care-services')}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </button>
              ))}
            </div>

            <div className={styles.mobileLocationRow}>
              <MapPin size={16} color="#64748B" />
              <select
                value={selectedCity}
                onChange={(e) => handleSelectCity(e.target.value)}
                className={styles.mobileCitySelect}
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {user ? (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#1e293b', padding: '0 4px' }}>
                  Hi, {user.name}
                </span>
                <button
                  type="button"
                  className={styles.logoutBtn}
                  onClick={() => {
                    localStorage.removeItem('token');
                    setUser(null);
                    setIsMobileMenuOpen(false);
                    if (onNavigate) onNavigate('site');
                  }}
                  style={{ width: '100%', textAlign: 'center' }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                type="button"
                className={styles.mobileLoginBtn}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (onNavigate) onNavigate('user-login');
                }}
              >
                Login / Sign Up
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
