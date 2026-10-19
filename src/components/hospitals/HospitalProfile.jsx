import React, { useState } from 'react';
import {
  ArrowLeft,
  Star,
  MapPin,
  Bed,
  ShieldCheck,
  Phone,
  Mail,
  Calendar,
  Play,
  X,
  Stethoscope,
  Briefcase,
  GraduationCap,
  Video,
  Sparkles,
  Navigation,
  Loader2,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  CreditCard,
  Edit3,
  ChevronDown,
  HelpCircle,
  CheckSquare
} from 'lucide-react';
import { useData } from '../../context/useData';
import Container from '../layout/Container';
import HospitalDirections from './HospitalDirections';
import HospitalInsuranceModal from '../insurance/HospitalInsuranceModal';
import WriteReviewModal from '../reviews/WriteReviewModal';
import SpecialitiesProceduresSection from '../specialities/SpecialitiesProceduresSection';
import styles from './HospitalProfile.module.css';

// Hospital FAQ Illustration & Category Icons matching design reference
const HospitalFaqIllustration = () => (
  <svg width="130" height="100" viewBox="0 0 130 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="65" cy="54" r="38" fill="#e0f2fe" />
    <path d="M16 96H114" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
    <path d="M42 96C42 80 48 72 65 72C82 72 88 80 88 96H42Z" fill="#ffffff" stroke="#0284c7" strokeWidth="2" />
    <path d="M57 72L65 83L73 72" fill="#0d9488" />
    <path d="M54 72L65 88L76 72" stroke="#0284c7" strokeWidth="2" fill="none" />
    <rect x="60" y="60" width="10" height="14" fill="#ffedd5" />
    <path d="M50 78C50 86 54 91 58 91L59 93" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M80 78C80 86 76 91 72 91L71 93" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" fill="none" />
    <circle cx="59" cy="94" r="2.5" fill="#94a3b8" />
    <ellipse cx="65" cy="46" rx="20" ry="22" fill="#6c3b24" />
    <ellipse cx="65" cy="48" rx="14" ry="15" fill="#ffedd5" />
    <path d="M51 44C51 36 57 32 65 32C73 32 79 36 79 44C79 40 73 36 65 37C57 36 51 40 51 44Z" fill="#6c3b24" />
    <path d="M51 44C53 50 54 56 53 62" stroke="#6c3b24" strokeWidth="3" strokeLinecap="round" />
    <path d="M79 44C77 50 76 56 77 62" stroke="#6c3b24" strokeWidth="3" strokeLinecap="round" />
    <ellipse cx="60" cy="47" rx="1.5" ry="2" fill="#1e293b" />
    <ellipse cx="70" cy="47" rx="1.5" ry="2" fill="#1e293b" />
    <path d="M62 53C63.5 56 66.5 56 68 53" stroke="#e11d48" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="57" cy="51" r="2" fill="#fda4af" opacity="0.6" />
    <circle cx="73" cy="51" r="2" fill="#fda4af" opacity="0.6" />
    <g transform="translate(6, 12)">
      <rect x="0" y="4" width="22" height="20" rx="4" fill="#ffffff" stroke="#0284c7" strokeWidth="1.5" />
      <path d="M0 8C0 5.79 1.79 4 4 4H18C20.21 4 22 5.79 22 8V9H0V8Z" fill="#0284c7" />
      <rect x="4" y="2" width="2" height="3" rx="1" fill="#0369a1" />
      <rect x="16" y="2" width="2" height="3" rx="1" fill="#0369a1" />
      <circle cx="5" cy="13" r="1" fill="#94a3b8" />
      <circle cx="11" cy="13" r="1" fill="#94a3b8" />
      <circle cx="17" cy="13" r="1" fill="#94a3b8" />
      <circle cx="5" cy="17" r="1" fill="#94a3b8" />
      <circle cx="11" cy="17" r="1" fill="#94a3b8" />
      <circle cx="19" cy="20" r="4.5" fill="#0284c7" stroke="#ffffff" strokeWidth="1.2" />
      <path d="M19 18V22M17 20H21" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
    </g>
    <circle cx="24" cy="74" r="8" fill="#10b981" />
    <path d="M21 74L23 76L27 72" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <g transform="translate(94, 12)">
      <rect x="0" y="0" width="24" height="18" rx="5" fill="#0d9488" />
      <path d="M5 18L2 22L9 18H5Z" fill="#0d9488" />
      <circle cx="6" cy="9" r="1.5" fill="#ffffff" />
      <circle cx="12" cy="9" r="1.5" fill="#ffffff" />
      <circle cx="18" cy="9" r="1.5" fill="#ffffff" />
    </g>
    <g transform="translate(100, 36)">
      <rect x="0" y="0" width="22" height="15" rx="4" fill="#f0f9ff" stroke="#bae6fd" strokeWidth="1" />
      <path d="M4 15L2 18L8 15H4Z" fill="#f0f9ff" />
      <line x1="5" y1="5" x2="17" y2="5" stroke="#7dd3fc" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="5" y1="9" x2="13" y2="9" stroke="#7dd3fc" strokeWidth="1.5" strokeLinecap="round" />
    </g>
  </svg>
);

const FaqCreditCardIcon = () => (
  <svg width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="8" width="27" height="18" rx="4" fill="#fbbf24" stroke="#d97706" strokeWidth="1.8" />
    <path d="M3 13H30" stroke="#92400e" strokeWidth="2.5" />
    <rect x="6" y="18" width="7" height="4" rx="1" fill="#fef3c7" />
    <g transform="translate(18, 17)">
      <path d="M8 1L2 3.8V8.5C2 12 4.5 14.5 8 15.5C11.5 14.5 14 12 14 8.5V3.8L8 1Z" fill="#14b8a6" stroke="#0f766e" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M5.5 8.5L7.2 10.2L10.5 7" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

const FaqDocumentIcon = () => (
  <svg width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 5C8 3.89543 8.89543 3 10 3H20L28 11V31C28 32.1046 27.1046 33 26 33H10C8.89543 33 8 32.1046 8 31V5Z" fill="#f0f9ff" stroke="#0284c7" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M20 3V11H28" stroke="#0284c7" strokeWidth="1.8" strokeLinejoin="round" fill="#bae6fd" />
    <line x1="12" y1="16" x2="24" y2="16" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
    <line x1="12" y1="21" x2="24" y2="21" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
    <line x1="12" y1="26" x2="19" y2="26" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const FaqEmergencySirenIcon = () => (
  <svg width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 24H26V27C26 27.5523 25.5523 28 25 28H11C10.4477 28 10 27.5523 10 27V24Z" fill="#1e40af" stroke="#172554" strokeWidth="1.5" />
    <path d="M11 24C11 18.5 13.5 13 18 13C22.5 13 25 18.5 25 24H11Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="1.6" />
    <path d="M18 15V21" stroke="#fca5a5" strokeWidth="2" strokeLinecap="round" />
    <line x1="18" y1="7" x2="18" y2="10" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
    <line x1="9" y1="11" x2="11.5" y2="13.5" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
    <line x1="27" y1="11" x2="24.5" y2="13.5" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
    <line x1="6" y1="19" x2="9" y2="20" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
    <line x1="30" y1="19" x2="27" y2="20" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const FaqDoctorAvatarIcon = () => (
  <svg width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="18" cy="14" rx="8" ry="9" fill="#fed7aa" />
    <path d="M10 13C10 8 13.5 6 18 6C22.5 6 26 8 26 13C26 11 24 9 18 9C12 9 10 11 10 13Z" fill="#78350f" />
    <path d="M8 32C8 26 12 23 18 23C24 23 28 26 28 32H8Z" fill="#ffffff" stroke="#0284c7" strokeWidth="1.8" />
    <path d="M15 23L18 28L21 23" fill="#0d9488" />
    <path d="M13 25C13 28 15 30 17 30M23 25C23 28 21 30 19 30" stroke="#0f172a" strokeWidth="1.4" strokeLinecap="round" fill="none" />
    <circle cx="18" cy="30" r="1.5" fill="#94a3b8" />
    <circle cx="15.5" cy="14" r="1" fill="#1e293b" />
    <circle cx="20.5" cy="14" r="1" fill="#1e293b" />
  </svg>
);

const FaqShieldCheckIcon = () => (
  <svg width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 4L7 8.5V17C7 24.5 11.5 30.5 18 32C24.5 30.5 29 24.5 29 17V8.5L18 4Z" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2" strokeLinejoin="round" />
    <path d="M12.5 17.5L16.5 21.5L23.5 14" stroke="#0284c7" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const FaqMapPinIcon = () => (
  <svg width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 8L11 5L19 9L26 5L32 8V28L26 25L19 29L11 25L4 28V8Z" fill="#e2f5ea" stroke="#059669" strokeWidth="1.6" strokeLinejoin="round" />
    <line x1="11" y1="5" x2="11" y2="25" stroke="#059669" strokeWidth="1.2" strokeDasharray="2 2" />
    <line x1="19" y1="9" x2="19" y2="29" stroke="#059669" strokeWidth="1.2" strokeDasharray="2 2" />
    <g transform="translate(12, 6)">
      <path d="M6 0C2.68629 0 0 2.68629 0 6C0 10.5 6 16 6 16C6 16 12 10.5 12 6C12 2.68629 9.31371 0 6 0Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="1.2" />
      <circle cx="6" cy="6" r="2.5" fill="#ffffff" />
    </g>
  </svg>
);

const FAQ_ICONS = [
  FaqCreditCardIcon,
  FaqDocumentIcon,
  FaqEmergencySirenIcon,
  FaqDoctorAvatarIcon,
  FaqShieldCheckIcon,
  FaqMapPinIcon
];

const HospitalProfile = ({ hospitalId, onNavigate }) => {
  const { hospitals, doctors, reviews, faqs } = useData();
  const [activeReel, setActiveReel] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);
  const [activePhoto, setActivePhoto] = useState(null);
  const [isInsuranceModalOpen, setIsInsuranceModalOpen] = useState(false);
  const [isWriteReviewModalOpen, setIsWriteReviewModalOpen] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState('overview');
  const [expandedHospitalFaq, setExpandedHospitalFaq] = useState(null);

  const scrollToHospitalSection = (sectionId, tabKey) => {
    setActiveProfileTab(tabKey);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const hospital = hospitals.find(h => 
    String(h.id) === String(hospitalId) || 
    String(h._id) === String(hospitalId) ||
    (h.email && String(hospitalId).includes('@') && h.email.toLowerCase() === String(hospitalId).toLowerCase())
  ) || hospitals[0];

  // Map & Directions state
  const [showDirections, setShowDirections] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const handleGetDirections = () => {
    setLocationError(null);

    if (!hospital?.latitude || !hospital?.longitude) {
      setLocationError('Location coordinates are currently unavailable for this hospital.');
      return;
    }

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        });
        setIsLocating(false);
        setShowDirections(true);
      },
      (err) => {
        setIsLocating(false);
        console.warn('[HospitalProfile] Geolocation error:', err);
        let message = 'Unable to get your location. Please check browser permissions.';
        if (err.code === 1) {
          message = 'Location permission was denied. Please allow location access in your browser to get directions.';
        } else if (err.code === 2) {
          message = 'Position unavailable. Please check your network or device GPS.';
        } else if (err.code === 3) {
          message = 'Location request timed out. Please try again.';
        }
        setLocationError(message);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  };

  const getEmbedUrl = (url) => {
    if (!url) return '';
    try {
      if (url.includes('youtu.be/') || url.includes('youtube.com/watch') || url.includes('youtube.com/shorts/')) {
        let videoId = '';
        if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
        else if (url.includes('youtube.com/watch?v=')) videoId = url.split('v=')[1].split('&')[0];
        else if (url.includes('youtube.com/shorts/')) videoId = url.split('shorts/')[1].split('?')[0];
        return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
      }
      if (url.includes('instagram.com')) {
        if (!url.includes('/embed')) {
          const cleanUrl = url.split('?')[0].replace(/\/$/, '');
          return `${cleanUrl}/embed`;
        }
      }
      return url;
    } catch {
      return url;
    }
  };

  if (!hospital) {
    return (
      <div className={styles.pageWrapper}>
        <Container>
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <h2>Hospital Center Not Found</h2>
            <button onClick={() => onNavigate('site')} className={styles.backBtn}>
              Back to Home
            </button>
          </div>
        </Container>
      </div>
    );
  }

  // Collect reels: ONLY show real videos added by hospital/admin (max 5), NO dummy video padding
  const displayReels = (Array.isArray(hospital.reels)
    ? hospital.reels.filter(r => typeof r === 'string' && r.trim().length > 0)
    : []
  ).slice(0, 5);

  // Collect YouTube videos: ONLY show real videos added by hospital/admin (max 5), NO dummy video padding
  const displayVideos = (Array.isArray(hospital.youtube_videos)
    ? hospital.youtube_videos.filter(v => typeof v === 'string' && v.trim().length > 0)
    : []
  ).slice(0, 5);

  // Resolve star doctors
  let starDoctorsList = [];
  if (Array.isArray(hospital.star_doctors) && hospital.star_doctors.length > 0) {
    starDoctorsList = hospital.star_doctors.map(sd => {
      if (typeof sd === 'object' && sd !== null && (sd._id || sd.id || sd.name)) {
        return {
          ...sd,
          id: sd._id || sd.id,
          specialty: sd.specialization || sd.specialty || 'Specialist',
          price: sd.fees || sd.price || 750,
          experience: typeof sd.experience === 'number' ? `${sd.experience}+ Years Experience` : (sd.experience || '10+ Years Experience')
        };
      }
      
      const sdString = String(sd).toLowerCase().trim();
      let matched = doctors.find(d => String(d.id || d._id || d.email).toLowerCase().trim() === sdString);
      
      // If not in global doctors, check if it's a hospital staff doctor
      if (!matched && hospital.staff_doctors) {
        const staffDoc = hospital.staff_doctors.find(staff => {
          if (typeof staff === 'string') return staff.toLowerCase().trim() === sdString;
          return staff.email?.toLowerCase().trim() === sdString;
        });
        
        if (staffDoc) {
          const sEmail = (typeof staffDoc === 'string' ? staffDoc : staffDoc.email).toLowerCase().trim();
          matched = {
            id: sEmail,
            _id: sEmail,
            name: typeof staffDoc === 'object' && staffDoc.name ? staffDoc.name : ('Dr. ' + sEmail.split('@')[0].replace(/[._-]/g, ' ')),
            email: sEmail,
            specialty: 'Hospital Staff Physician',
            specialization: 'Hospital Staff Physician',
            hospital: hospital.name,
            image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=150&q=80',
            price: 700,
            experience: '8+ Years Experience',
            rating: 4.8
          };
        }
      }
      
      return matched;
    }).filter(Boolean);
  }

  return (
    <div className={styles.pageWrapper}>
      <Container>
        <button onClick={() => onNavigate ? onNavigate('site') : window.history.back()} className={styles.backBtn}>
          <ArrowLeft size={18} /> Back to Hospitals
        </button>

        {/* Hospital Hero Card */}
        <div className={styles.profileCard} id="hospital-overview">
          {/* Left Column: Image & Contact Info */}
          <div className={styles.imageCol}>
            <div className={styles.imageWrapper}>
              <img
                src={hospital.image}
                alt={hospital.name}
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=800&q=80';
                }}
              />
              <div className={styles.cityBadge}>
                <MapPin size={13} /> {hospital.city || 'Bengaluru'}, {hospital.state || 'Karnataka'}
              </div>
            </div>

            <div className={styles.contactBox}>
              <a href={`tel:${hospital.phone || '+9118001023222'}`} className={styles.contactItem}>
                <Phone size={17} className={styles.contactIcon} />
                <span>Call <strong>{hospital.phone || '+91 1800 102 3222'}</strong></span>
              </a>
              <a href={`mailto:${hospital.email || 'info@manipalhd.com'}`} className={styles.contactItem}>
                <Mail size={17} className={styles.contactIcon} />
                <span>Email <strong>{hospital.email || 'info@manipalhd.com'}</strong></span>
              </a>
              <div className={styles.contactItem}>
                <Calendar size={17} className={styles.contactIcon} />
                <span>Est. <strong>{hospital.establishedYear || '2000'}</strong></span>
              </div>
            </div>
          </div>

          {/* Right Column: Details, Actions, Specialties & About */}
          <div className={styles.infoCol}>
            <div className={styles.headerRow}>
              <div className={styles.titleSection}>
                <h1 className={styles.hospitalTitle}>{hospital.name}</h1>
                <div className={styles.verifiedPill}>
                  <ShieldCheck size={15} /> Verified Healthcare Partner
                </div>
              </div>
              <div className={styles.rating}>
                <Star size={16} fill="#EAB308" color="#EAB308" />
                <span>{hospital.rating || '4.8'}</span>
                <span className={styles.reviewCount}>
                  ({hospital.reviews || '50+'})
                </span>
              </div>
            </div>

            <div className={styles.locationActionRow}>
              <div className={styles.addressRow}>
                <MapPin size={17} className={styles.addressPinIcon} />
                <span>{hospital.address || '98, HAL Old Airport Road, Kodihalli, Bengaluru, Karnataka 560017'}</span>
              </div>
              <div className={styles.headerActionsStack}>
                <button
                  type="button"
                  className={styles.insuranceBtn}
                  onClick={() => setIsInsuranceModalOpen(true)}
                  title="Search all available insurances in this hospital"
                >
                  <CheckSquare size={16} />
                  <span>Insurance Accepted</span>
                </button>
                <button
                  type="button"
                  className={styles.getDirectionsBtn}
                  onClick={handleGetDirections}
                  disabled={isLocating}
                  title="Get directions to this hospital"
                >
                  {isLocating ? (
                    <>
                      <Loader2 size={16} className={styles.spinIcon} />
                      <span>Locating...</span>
                    </>
                  ) : (
                    <>
                      <Navigation size={15} style={{ transform: 'rotate(45deg)' }} />
                      <span>Get Directions</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {locationError && (
              <div className={styles.directionsError}>
                <span>⚠️ {locationError}</span>
              </div>
            )}

            <div className={styles.statsRow}>
              <div className={styles.statPillBeds}>
                <Bed size={16} />
                <span>{hospital.totalBeds || 100} Inpatient Beds</span>
              </div>
              <div className={styles.statPillEmergency}>
                <Clock size={16} />
                <span>24x7 Trauma & ER Ready</span>
              </div>
              <div className={styles.statPillEst}>
                <Calendar size={16} />
                <span>Est. {hospital.establishedYear || 2000}</span>
              </div>
            </div>

            <div className={styles.specialtiesSection}>
              <div className={styles.sectionSubLabel}>DEPARTMENTS & KEY SPECIALTIES</div>
              <div className={styles.specialtiesWrap}>
                {(hospital.specialties && hospital.specialties.length > 0
                  ? hospital.specialties
                  : ['Cardiology', 'Neurology', 'Orthopedics', 'Nephrology', 'General Surgery']
                ).map((spec, i) => {
                  const paletteClasses = [
                    styles.specLavender,
                    styles.specBlue,
                    styles.specPeach,
                    styles.specSky,
                    styles.specIndigo,
                    styles.specMint,
                    styles.specRose
                  ];
                  return (
                    <span key={i} className={`${styles.specBadge} ${paletteClasses[i % paletteClasses.length]}`}>
                      {spec}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className={styles.aboutBox}>
              <div className={styles.sectionSubLabel}>ABOUT THIS FACILITY</div>
              <p>
                {hospital.description ||
                  `${hospital.name} is a major multispecialty hospital in ${hospital.city || 'Bengaluru'} providing comprehensive medical and surgical core across a wide range of specialties. The hospital provides emergency and critical-care services and is part of the hospital network. Its location makes it accessible to several central and eastern neighbourhoods.`}
              </p>
            </div>
          </div>
        </div>

        {/* Practo-style Sticky Sub-Nav */}
        <div className={styles.practoNavWrap}>
          <button
            type="button"
            className={`${styles.practoNavTab} ${activeProfileTab === 'overview' ? styles.practoNavTabActive : ''}`}
            onClick={() => scrollToHospitalSection('hospital-overview', 'overview')}
          >
            Overview
          </button>

          {starDoctorsList.length > 0 && (
            <button
              type="button"
              className={`${styles.practoNavTab} ${activeProfileTab === 'doctors' ? styles.practoNavTabActive : ''}`}
              onClick={() => scrollToHospitalSection('hospital-doctors', 'doctors')}
            >
              Doctors ({starDoctorsList.length})
            </button>
          )}

          <button
            type="button"
            className={`${styles.practoNavTab} ${activeProfileTab === 'specialities' ? styles.practoNavTabActive : ''}`}
            onClick={() => scrollToHospitalSection('hospital-specialities', 'specialities')}
          >
            Specialities & Procedures
          </button>

          {(displayVideos.length > 0 || displayReels.length > 0) && (
            <button
              type="button"
              className={`${styles.practoNavTab} ${activeProfileTab === 'media' ? styles.practoNavTabActive : ''}`}
              onClick={() => scrollToHospitalSection('hospital-media', 'media')}
            >
              Videos & Shorts ({displayVideos.length + displayReels.length})
            </button>
          )}

          {Array.isArray(hospital.photos) && hospital.photos.length > 0 && (
            <button
              type="button"
              className={`${styles.practoNavTab} ${activeProfileTab === 'photos' ? styles.practoNavTabActive : ''}`}
              onClick={() => scrollToHospitalSection('hospital-photos', 'photos')}
            >
              Photos ({hospital.photos.length})
            </button>
          )}

          <button
            type="button"
            className={`${styles.practoNavTab} ${activeProfileTab === 'faqs' ? styles.practoNavTabActive : ''}`}
            onClick={() => scrollToHospitalSection('hospital-faqs', 'faqs')}
          >
            FAQs
          </button>

          <button
            type="button"
            className={`${styles.practoNavTab} ${activeProfileTab === 'reviews' ? styles.practoNavTabActive : ''}`}
            onClick={() => scrollToHospitalSection('hospital-reviews', 'reviews')}
          >
            Patient Stories
          </button>
        </div>

        {/* SECTION 1: STAR DOCTORS */}
        <section className={styles.sectionBlock} id="hospital-doctors">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <h2>
                <Sparkles size={24} color="#f59e0b" />
                Star Doctors & Clinical Leaders
              </h2>
              <p>Top-rated medical consultants, department heads, and board-certified surgeons.</p>
            </div>
            <span className={styles.countTag}>{starDoctorsList.length} Doctors</span>
          </div>

          <div className={styles.doctorsGrid}>
            {starDoctorsList.map((doc, idx) => (
              <div key={doc.id || doc._id || idx} className={styles.doctorCard}>
                <div className={styles.docImageWrapper}>
                  <img
                    src={doc.image}
                    alt={doc.name}
                    className={styles.docImage}
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80';
                    }}
                  />
                  <div className={styles.starBadge}>
                    <Star size={12} fill="white" color="white" /> Star Doctor
                  </div>
                </div>

                <div className={styles.docCardBody}>
                  <div className={styles.docNameRow}>
                    <h3 className={styles.docName}>{doc.name}</h3>
                    <div className={styles.docRating}>
                      <Star size={12} fill="#EAB308" color="#EAB308" />
                      <span>{doc.rating || 4.8}</span>
                    </div>
                  </div>

                  <span className={styles.docSpecialty}>{doc.specialty || doc.specialization || 'Medical Specialist'}</span>

                  <div className={styles.docDegree} title={doc.qualifications || doc.degree || 'MBBS'}>
                    <GraduationCap size={13} style={{ flexShrink: 0, marginRight: 4 }} />
                    <span className={styles.docDegreeText}>
                      {doc.qualifications || doc.degree || 'MBBS'}
                    </span>
                  </div>

                  <div className={styles.docExperience}>
                    <Briefcase size={14} color="#2563eb" style={{ flexShrink: 0 }} />
                    <span className={styles.docExperienceText}>{doc.experience || '8+ Years Experience'}</span>
                  </div>

                  <div className={styles.docFooter}>
                    <div className={styles.docFee}>
                      ₹{doc.price || doc.fees || 700}
                      <span> / consult</span>
                    </div>
                    <button
                      className={styles.viewDocBtn}
                      onClick={() => onNavigate && onNavigate('doctor-profile', doc.id || doc._id)}
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 2: SPECIALITIES & CLINICAL PROCEDURES */}
        <div id="hospital-specialities" style={{ margin: '24px 0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.04)', border: '1px solid #e2e8f0' }}>
          <SpecialitiesProceduresSection onNavigate={onNavigate} />
        </div>

        {/* SECTION 3: INSTAGRAM REELS (UP TO 5, CENTER ALIGNED) */}
        {displayReels.length > 0 && (
          <section className={styles.sectionBlock} id="hospital-media">
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleGroup}>
                <h2>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e1306c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                  Instagram Reels & Facility Shorts
                </h2>
                <p>Explore patient journeys, behind-the-scenes care, and health advice directly from our center.</p>
              </div>
              <span className={styles.countTag}>{displayReels.length} Reel{displayReels.length > 1 ? 's' : ''}</span>
            </div>

            <div className={styles.reelsGrid} data-count={displayReels.length}>
              {displayReels.map((reelUrl, idx) => {
                const embedUrl = getEmbedUrl(reelUrl);
                return (
                  <div
                    key={idx}
                    className={styles.reelCard}
                    onClick={() => setActiveReel(embedUrl)}
                    title="Click to play full reel"
                  >
                    <iframe
                      src={embedUrl}
                      title={`Instagram Reel ${idx + 1}`}
                      scrolling="no"
                      allowTransparency="true"
                    />
                    <div className={styles.reelIndexBadge}>Reel #{idx + 1}</div>
                    <div className={styles.reelOverlay}>
                      <div className={styles.playCircle}>
                        <Play size={26} fill="currentColor" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION 3: YOUTUBE VIDEOS (UP TO 5, CENTER ALIGNED) */}
        {displayVideos.length > 0 && (
          <section className={styles.sectionBlock}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleGroup}>
                <h2>
                  <Video size={24} color="#ef4444" />
                  Featured YouTube Videos & Medical Tours
                </h2>
                <p>Virtual facility walkthroughs, specialist interviews, and advanced treatment showcases.</p>
              </div>
              <span className={styles.countTag}>{displayVideos.length} Video{displayVideos.length > 1 ? 's' : ''}</span>
            </div>

            <div className={styles.youtubeGrid} data-count={displayVideos.length}>
              {displayVideos.map((videoUrl, idx) => {
                const embedUrl = getEmbedUrl(videoUrl);
                return (
                  <div
                    key={idx}
                    className={styles.youtubeCard}
                    onClick={() => setActiveVideo(embedUrl)}
                    title="Click to watch full video"
                  >
                    <iframe
                      src={embedUrl}
                      title={`YouTube Video ${idx + 1}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                    <div className={styles.reelOverlay}>
                      <div className={styles.ytPlayCircle}>
                        <Play size={28} fill="white" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
        {/* SECTION 4: INTERIOR & EXTERIOR GALLERY */}
        {Array.isArray(hospital.photos) && hospital.photos.length > 0 && (
          <section className={styles.sectionBlock} id="hospital-photos">
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleGroup}>
                <h2>
                  <Camera size={24} color="#059669" />
                  Facility Showcase: Interior & Exterior Gallery
                </h2>
                <p>High-resolution walkthrough of our clinical facilities, operation theaters, patient suites, and exterior campus.</p>
              </div>
              <span className={styles.countTag}>{hospital.photos.length} Photo{hospital.photos.length > 1 ? 's' : ''}</span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '20px'
            }}>
              {hospital.photos.map((item, idx) => {
                const imgUrl = typeof item === 'string' ? item : item.url;
                const title = typeof item === 'object' && item.title ? item.title : `Facility View #${idx + 1}`;
                const category = typeof item === 'object' && item.category ? item.category : 'facility';

                return (
                  <div
                    key={idx}
                    onClick={() => setActivePhoto({ url: imgUrl, title, category })}
                    style={{
                      position: 'relative',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      background: '#0f172a',
                      aspectRatio: '4 / 3',
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.08)';
                    }}
                  >
                    <img
                      src={imgUrl}
                      alt={title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      background: 'rgba(0, 0, 0, 0.65)',
                      color: 'white',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      backdropFilter: 'blur(4px)'
                    }}>
                      {category}
                    </div>
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.85))',
                      color: 'white',
                      padding: '16px 12px 10px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {title}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION 5: FREQUENTLY ASKED QUESTIONS (FAQS) */}
        <section className={styles.sectionBlock} id="hospital-faqs">
          <div className={styles.faqCard}>
            <div className={styles.faqHeader}>
              <div className={styles.faqIllustrationWrap}>
                <HospitalFaqIllustration />
              </div>
              <div className={styles.faqHeaderTextWrap}>
                <h3 className={styles.faqTitle}>
                  <HelpCircle size={28} className={styles.faqTitleIcon} />
                  Frequently asked questions (FAQs)
                </h3>
                <p className={styles.faqSubtitle}>
                  Essential answers regarding 100% cashless mediclaim, patient admission, specialists, and visiting policies at {hospital.name}.
                </p>
              </div>
            </div>

            <div className={styles.faqList}>
              {[
                ...((faqs || [])
                  .filter(f => f.isActive && f.targetType === 'hospital' && (
                    (f.targetId && String(f.targetId) === String(hospital.id || hospital._id)) ||
                    (f.targetName && hospital.name && (
                      f.targetName.toLowerCase().includes(hospital.name.toLowerCase()) ||
                      hospital.name.toLowerCase().includes(f.targetName.toLowerCase())
                    ))
                  ))
                  .map(f => ({
                    q: f.question,
                    a: f.answer
                  }))
                ),
                {
                  q: `How does 100% cashless insurance pre-authorization work at ${hospital.name}?`,
                  steps: [
                    `Visit the Cashless Insurance Helpdesk at ${hospital.name} or start cashless verification on The Sehat Buddy`,
                    'Present your valid health insurance policy copy / digital card and patient government photo ID',
                    'Our hospital TPA coordinator submits your electronic pre-authorization within 30 minutes',
                    'Once approved by your insurer, your treatment begins with zero upfront cash deposit'
                  ],
                  note: 'Our hospital TPA desk coordinates directly with all leading insurance providers for paperless, cashless settlement.'
                },
                {
                  q: `What documents are required for patient admission at ${hospital.name}?`,
                  a: "Please carry the patient's valid photo ID (Aadhar Card, Passport, or Voter ID), health insurance e-card / policy document, doctor's admission recommendation note, and all relevant diagnostic reports, blood tests, or imaging scans."
                },
                {
                  q: `Is 24x7 emergency and trauma care available at ${hospital.name}?`,
                  a: `Yes, ${hospital.name} is fully equipped with 24x7 emergency triage, ICU, emergency trauma surgical teams, diagnostic imaging, and dedicated ambulance services. Call ${hospital.phone || 'our helpline'} for immediate emergency assistance.`
                },
                {
                  q: `Can I consult star doctors and board-certified surgeons at ${hospital.name}?`,
                  a: `Yes, ${hospital.name} features eminent medical consultants, heads of surgery, and specialists. You can view their profiles, consultation fees, and schedule direct appointments right on this page.`
                },
                {
                  q: `Which health insurance companies and TPAs are accepted at ${hospital.name}?`,
                  a: `${hospital.name} is empaneled with all major public and private health insurance providers and TPAs including Star Health, Care Health, HDFC ERGO, ICICI Lombard, Niva Bupa, Bajaj Allianz, Medi Assist, Paramount TPA, and more.`
                },
                {
                  q: `How do I get directions to ${hospital.name}?`,
                  a: "Click the 'Get Directions' button in the location section above to open GPS navigation and view turn-by-turn routes from your current location."
                }
              ].map((faq, idx) => {
                const isOpen = expandedHospitalFaq === idx;
                const FaqIcon = FAQ_ICONS[idx % FAQ_ICONS.length];
                return (
                  <div key={idx} className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ''}`}>
                    <button
                      type="button"
                      className={styles.faqQuestionBtn}
                      onClick={() => setExpandedHospitalFaq(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                    >
                      <div className={styles.faqQuestionLeft}>
                        <div className={styles.faqIconWrap}>
                          <FaqIcon />
                        </div>
                        <span className={styles.faqQuestionText}>{faq.q}</span>
                      </div>
                      <ChevronDown
                        size={20}
                        className={`${styles.faqChevron} ${isOpen ? styles.faqChevronOpen : ''}`}
                      />
                    </button>
                    {isOpen && (
                      <div className={styles.faqAnswer}>
                        {Array.isArray(faq.steps) && (
                          <ol className={styles.faqStepsList}>
                            {faq.steps.map((step, sIdx) => (
                              <li key={sIdx}>{step}</li>
                            ))}
                          </ol>
                        )}
                        {faq.a && <p>{faq.a}</p>}
                        {faq.note && <p className={styles.faqNote}>{faq.note}</p>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 7: VERIFIED PATIENT REVIEWS */}
        <section className={styles.sectionBlock} id="hospital-reviews">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <h2>
                <Star size={24} color="#f59e0b" />
                Verified Patient Reviews & Experiences
              </h2>
              <p>Real feedback from patients treated at {hospital.name}.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsWriteReviewModalOpen(true)}
              style={{
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 18px',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Edit3 size={15} /> Write a Review
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {reviews
              .filter(r => r.status !== 'rejected')
              .filter(r => 
                (r.targetName && hospital?.name && r.targetName.toLowerCase().includes(hospital.name.toLowerCase())) ||
                r.targetType === 'hospital'
              )
              .slice(0, 4)
              .map((rev) => (
                <div
                  key={rev.id || rev._id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{rev.patientName}</strong>
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block' }}>{rev.patientCity}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} size={14} fill={s <= Number(rev.rating) ? '#f59e0b' : '#e2e8f0'} color={s <= Number(rev.rating) ? '#f59e0b' : '#cbd5e1'} />
                      ))}
                    </div>
                  </div>

                  {rev.treatment && (
                    <span style={{ fontSize: '0.75rem', background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '4px', width: 'fit-content', fontWeight: 600 }}>
                      Treatment: {rev.treatment}
                    </span>
                  )}

                  {rev.title && <strong style={{ fontSize: '0.95rem', color: '#1e293b' }}>{rev.title}</strong>}

                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569', lineHeight: 1.55 }}>
                    {rev.comment}
                  </p>

                  {rev.insuranceUsed && rev.insuranceUsed !== 'None' && rev.insuranceUsed !== 'None / Self-pay' && (
                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '8px', fontSize: '0.78rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ShieldCheck size={13} />
                      <span>Cashless via {rev.insuranceUsed}</span>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </section>
      </Container>

      {/* Photo Modal */}
      {activePhoto && (
        <div className={styles.modalOverlay} onClick={() => setActivePhoto(null)}>
          <div
            style={{
              position: 'relative',
              maxWidth: '900px',
              width: '90%',
              background: '#0f172a',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className={styles.closeModal} onClick={() => setActivePhoto(null)}>
              <X size={26} />
            </button>
            <img
              src={activePhoto.url}
              alt={activePhoto.title}
              style={{ width: '100%', maxHeight: '75vh', objectFit: 'contain', display: 'block' }}
            />
            <div style={{ padding: '16px 20px', background: '#0f172a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{activePhoto.title}</h4>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'capitalize' }}>
                  Category: {activePhoto.category} View
                </span>
              </div>
              <span style={{ fontSize: '0.8rem', background: '#2563eb', padding: '3px 10px', borderRadius: '100px' }}>
                {hospital.name}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Reel Popup Modal */}
      {activeReel && (
        <div className={styles.modalOverlay} onClick={() => setActiveReel(null)}>
          <div className={styles.modalContentReel} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeModal} onClick={() => setActiveReel(null)}>
              <X size={26} />
            </button>
            <iframe
              src={activeReel}
              title="Instagram Reel Player"
              scrolling="no"
              allowTransparency="true"
            />
          </div>
        </div>
      )}

      {/* Video Popup Modal */}
      {activeVideo && (
        <div className={styles.modalOverlay} onClick={() => setActiveVideo(null)}>
          <div className={styles.modalContentVideo} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeModal} onClick={() => setActiveVideo(null)}>
              <X size={28} />
            </button>
            <iframe
              src={`${activeVideo}?autoplay=1`}
              title="YouTube Player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Directions & Road Route Map Modal */}
      {showDirections && userLocation && (
        <HospitalDirections
          hospital={hospital}
          userLocation={userLocation}
          onClose={() => setShowDirections(false)}
        />
      )}

      {/* Cashless Insurances Accepted by this Hospital Modal */}
      {isInsuranceModalOpen && (
        <HospitalInsuranceModal
          hospital={hospital}
          onClose={() => setIsInsuranceModalOpen(false)}
        />
      )}

      {/* Write Hospital Review Modal */}
      {isWriteReviewModalOpen && (
        <WriteReviewModal
          preselectedTarget={{ type: 'hospital', name: hospital.name }}
          onClose={() => setIsWriteReviewModalOpen(false)}
          onSuccess={() => setIsWriteReviewModalOpen(false)}
        />
      )}
    </div>
  );
};

export default HospitalProfile;
