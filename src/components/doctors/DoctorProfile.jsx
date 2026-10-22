import React, { useState, useRef, useMemo } from 'react';
import { 
  ArrowLeft, Star, MapPin, Building2, Briefcase, 
  GraduationCap, Phone, X, Play, ChevronDown, HelpCircle, ShieldCheck,
  Award, CheckCircle2, MessageSquare, Trophy, Calendar, HeartPulse, Stethoscope, FileText,
  Clock, Globe, Printer, Check, Sparkles, Video, CreditCard, ArrowRight,
  History, Milestone, CalendarClock, ExternalLink
} from 'lucide-react';
import { useData } from '../../context/useData';
import { matchesId } from '../../context/DataContext';
import Container from '../layout/Container';
import WriteReviewModal from '../reviews/WriteReviewModal';
import { api, API_BASE } from '../../services/api';
import styles from './DoctorProfile.module.css';

// Local date string helper matching clinic calendar time (YYYY-MM-DD)
export const getLocalDateString = (d = new Date()) => {
  const dateObj = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return '';
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// FAQ Illustration & Icons matching design reference
const DoctorFaqIllustration = () => (
  <svg width="124" height="96" viewBox="0 0 130 100" fill="none" xmlns="http://www.w3.org/2000/svg">
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

const FaqCalendarIcon = () => (
  <svg width="32" height="32" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="6" width="28" height="26" rx="6" fill="#FFFFFF" stroke="#0284c7" strokeWidth="2" />
    <path d="M4 13H32" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
    <path d="M4 11C4 8.23858 6.23858 6 9 6H27C29.7614 6 32 8.23858 32 11V13H4V11Z" fill="#0284c7" />
    <rect x="9" y="3" width="3" height="5" rx="1.5" fill="#0369a1" />
    <rect x="24" y="3" width="3" height="5" rx="1.5" fill="#0369a1" />
    <circle cx="10" cy="18" r="1.5" fill="#94a3b8" />
    <circle cx="16" cy="18" r="1.5" fill="#94a3b8" />
    <circle cx="22" cy="18" r="1.5" fill="#94a3b8" />
    <circle cx="10" cy="23" r="1.5" fill="#94a3b8" />
    <circle cx="16" cy="23" r="1.5" fill="#94a3b8" />
    <circle cx="26" cy="26" r="6" fill="#ef4444" stroke="#FFFFFF" strokeWidth="1.5" />
    <path d="M26 23V29M23 26H29" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const FaqDocumentIcon = () => (
  <svg width="32" height="32" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 6C7 4.89543 7.89543 4 9 4H20L29 13V30C29 31.1046 28.1046 32 27 32H9C7.89543 32 7 31.1046 7 30V6Z" fill="#f0f9ff" stroke="#0284c7" strokeWidth="2" strokeLinejoin="round" />
    <path d="M20 4V13H29" stroke="#0284c7" strokeWidth="2" strokeLinejoin="round" fill="#e0f2fe" />
    <path d="M12 18H24M12 22H24M12 26H19" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const FaqShieldLockIcon = () => (
  <svg width="32" height="32" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 4L7 8V16C7 23.5 11.5 29.5 18 32C24.5 29.5 29 23.5 29 16V8L18 4Z" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2" strokeLinejoin="round" />
    <rect x="13.5" y="17" width="9" height="7" rx="1.5" fill="#0284c7" />
    <path d="M15 17V14.5C15 12.8431 16.3431 11.5 18 11.5C19.6569 11.5 21 12.8431 21 14.5V17" stroke="#0284c7" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="18" cy="20" r="1" fill="#FFFFFF" />
  </svg>
);

const FaqRescheduleIcon = () => (
  <svg width="32" height="32" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="18" cy="18" r="15" fill="#f0fdfa" />
    <path d="M27 17C26.5 12 22.5 8 17.5 8C12.8 8 9 11.2 8 15.5" stroke="#0d9488" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M23.5 18H27.5V14" stroke="#0d9488" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 19C9.5 24 13.5 28 18.5 28C23.2 28 27 24.8 28 20.5" stroke="#0d9488" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M12.5 18H8.5V22" stroke="#0d9488" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const FaqInsuranceIcon = () => (
  <svg width="32" height="32" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="5" width="20" height="26" rx="4" fill="#FFFFFF" stroke="#0284c7" strokeWidth="2" />
    <rect x="11" y="3" width="10" height="4" rx="1.5" fill="#0284c7" />
    <rect x="15" y="11" width="2" height="6" rx="1" fill="#ef4444" />
    <rect x="13" y="13" width="6" height="2" rx="1" fill="#ef4444" />
    <line x1="10" y1="20" x2="21" y2="20" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="10" y1="24" x2="18" y2="24" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M27 18L21 20.5V26C21 29.5 23.5 32 27 33C30.5 32 33 29.5 33 26V20.5L27 18Z" fill="#10b981" stroke="#FFFFFF" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M24.5 25.5L26.5 27.5L29.5 24" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SocialInstagramIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const SocialFacebookIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const SocialLinkedinIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
  </svg>
);

const SocialTwitterXIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const SocialYoutubeIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

// Helper to format experience stably as a consistent number + string
export const formatDoctorExperience = (exp) => {
  if (exp === undefined || exp === null || exp === '') return '15+ Years';
  const num = parseInt(String(exp).replace(/\D/g, ''), 10);
  return `${!isNaN(num) && num > 0 ? num : 15}+ Years`;
};

// Helper to extract biography content (custom doctor about or fallback) for responsive display
export const getBioItems = (doc) => {
  if (!doc) return [];
  const name = doc.name ? (doc.name.startsWith('Dr.') ? doc.name : `Dr. ${doc.name}`) : 'The Doctor';
  const spec = doc.specialty || doc.specialization || 'Consultant Specialist';
  const exp = formatDoctorExperience(doc.experience);
  const hosp = doc.hospital || 'Apollo Hospital & Heart Center';

  // 1. If doctor has custom about text from dashboard/database, preserve and use their exact paragraphs
  if (doc.about && doc.about.trim().length > 0) {
    const customParas = doc.about.trim().split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    if (customParas.length > 0) {
      return customParas;
    }
  }

  // 2. Default fallback clinical paragraphs when no custom about is set
  return [
    `${name} is a Senior Consultant in ${spec} with over ${exp} of clinical practice at ${hosp}, recognized for diagnostic precision and compassionate patient care.`,
    `Specializing in personalized therapeutic regimens, preventative screening, and minimally invasive clinical interventions, ${name} is dedicated to empowering patients through transparent medical guidance.`,
    `With extensive expertise in managing complex clinical cases, ${name} integrates evidence-based protocols with tailored treatment plans to ensure optimal long-term health outcomes.`,
    `${name} maintains active privileges across leading healthcare institutions, participating in advanced medical forums and clinical research to bring modern treatment methodologies to everyday practice.`
  ];
};

export const getBioSentences = (doc) => getBioItems(doc);
export const getComprehensiveBio = (doc) => getBioItems(doc);

// Dedicated Timeline Symbol Icon (Vertical connected milestone track)
const TimelineSymbolIcon = ({ size = 18, color = '#4f46e5', className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2.2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    style={{ flexShrink: 0 }}
  >
    <line x1="12" y1="2" x2="12" y2="22" />
    <circle cx="12" cy="5" r="2.2" fill="#ede9fe" />
    <circle cx="12" cy="12" r="2.2" fill="#ede9fe" />
    <circle cx="12" cy="19" r="2.2" fill="#ede9fe" />
  </svg>
);

// Helper for authentic, verified patient reviews (shared in real-time with Doctor Dashboard)
export const getDoctorVerifiedReviews = (doc, liveReviews) => {
  if (!doc) return [];
  const cleanDocName = (doc.name || '').toLowerCase().replace(/^dr\.?\s*/i, '').trim();
  const dId = String(doc.id || '');
  const dMongoId = String(doc._id || '');

  // 1. Strictly real-time verified patient reviews for this doctor
  const matched = (liveReviews || []).filter(r => {
    if (r.status === 'rejected') return false;
    const cleanTargetName = (r.targetName || '').toLowerCase().replace(/^dr\.?\s*/i, '').trim();
    const rTargetId = String(r.targetId || '');
    const rDoctorId = String(r.doctorId || '');
    const rDoctorName = (r.doctorName || '').toLowerCase().replace(/^dr\.?\s*/i, '').trim();

    // Match by Doctor ID or Name
    if (rDoctorId && (rDoctorId === dId || (dMongoId && rDoctorId === dMongoId))) return true;
    if (rDoctorName && cleanDocName && (rDoctorName.includes(cleanDocName) || cleanDocName.includes(rDoctorName))) return true;

    if (r.targetType === 'doctor') {
      if (rTargetId && (rTargetId === dId || (dMongoId && rTargetId === dMongoId))) return true;
      if (cleanTargetName && cleanDocName && (cleanTargetName.includes(cleanDocName) || cleanDocName.includes(cleanTargetName))) return true;
    }

    return false;
  });

  return matched;
};

const DoctorReelCard = ({ reelItem, idx, onOpen }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const rawUrl = typeof reelItem === 'object' ? (reelItem.url || '') : reelItem;
  const coverPhoto = typeof reelItem === 'object' ? (reelItem.coverPhoto || '') : '';

  const videoSrc = useMemo(() => {
    if (!rawUrl) return '';
    if (rawUrl.endsWith('.mp4') || rawUrl.endsWith('.webm') || rawUrl.includes('res.cloudinary.com')) {
      return rawUrl;
    }
    return `${API_BASE}/reel-video?url=${encodeURIComponent(rawUrl)}`;
  }, [rawUrl]);

  const handleMouseEnter = () => {
    if (videoRef.current && !videoError) {
      setHasStarted(true);
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn('Doctor reel hover play error:', err);
            setIsPlaying(false);
          });
      }
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div
      className={styles.reelCard}
      onClick={() => onOpen(reelItem)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title="Hover to preview, click to watch in full view"
      style={{
        background: 'linear-gradient(145deg, #090d16 0%, #1e293b 100%)'
      }}
    >
      {coverPhoto ? (
        <img
          src={coverPhoto}
          alt={`Instagram Reel ${idx + 1}`}
          className={styles.reelCoverImg}
          loading="lazy"
          style={{
            opacity: isPlaying ? 0 : 1,
            transition: 'opacity 0.25s ease'
          }}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      ) : (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at 50% 38%, rgba(225, 48, 108, 0.22), transparent 70%), linear-gradient(160deg, #0b1120 0%, #0f172a 50%, #1e293b 100%)',
          padding: '20px',
          textAlign: 'center',
          userSelect: 'none',
          opacity: isPlaying ? 0 : 1,
          transition: 'opacity 0.25s ease'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(225, 48, 108, 0.95) 0%, rgba(247, 119, 55, 0.95) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 8px 24px rgba(225, 48, 108, 0.45)',
            marginBottom: '12px'
          }}>
            <Play size={24} fill="#ffffff" color="#ffffff" style={{ marginLeft: '3px' }} />
          </div>
          <span style={{
            color: '#ffffff',
            fontSize: '0.86rem',
            fontWeight: 700,
            letterSpacing: '0.02em',
            marginBottom: '4px'
          }}>
            Reel {idx + 1}
          </span>
          <span style={{
            color: '#94a3b8',
            fontSize: '0.72rem',
            fontWeight: 500
          }}>
            Hover to Preview
          </span>
        </div>
      )}

      {videoSrc && !videoError && (
        <video
          ref={videoRef}
          src={videoSrc}
          poster={coverPhoto}
          muted
          playsInline
          loop
          preload="metadata"
          className={styles.reelHoverVideo}
          style={{
            opacity: isPlaying ? 1 : (hasStarted ? 0.85 : 0),
            transition: 'opacity 0.25s ease',
            zIndex: 1
          }}
          onError={() => setVideoError(true)}
        />
      )}

      <div className={styles.reelGradientScrim} style={{ zIndex: 2 }} />

      <div className={styles.reelTopBadge} style={{ zIndex: 3 }}>
        <SocialInstagramIcon size={14} />
        <span>{isPlaying ? 'Playing' : 'Reel'}</span>
      </div>

      <div
        className={`${styles.reelPlayOverlay} ${isPlaying ? styles.reelPlayingOverlayHidden : ''}`}
        style={{ zIndex: 3 }}
      >
        <div className={styles.reelPlayBtn}>
          <Play size={24} fill="#ffffff" color="#ffffff" style={{ marginLeft: '3px' }} />
        </div>
      </div>

      {isPlaying && (
        <div className={styles.reelHoverPlayingIndicator}>
          <span className={styles.reelPulseDot} />
          <span>Playing on hover</span>
        </div>
      )}
    </div>
  );
};

const DoctorProfile = ({ doctorId, onNavigate }) => {
  const { doctors, updateDoctor, syncDoctorLocally, refreshDoctors, reviews, refreshReviews, faqs } = useData();

  const fallbackDoctor = React.useMemo(() => {
    try {
      const docUser = localStorage.getItem('doctor_user');
      if (docUser) {
        const parsed = JSON.parse(docUser);
        if (matchesId(parsed, doctorId) || String(parsed._id) === String(doctorId) || String(parsed.id) === String(doctorId)) {
          return parsed;
        }
      }
    } catch {}
    return null;
  }, [doctorId]);

  const doctor = doctors.find(d => 
    matchesId(d, doctorId) ||
    String(d.id) === String(doctorId) || 
    String(d._id) === String(doctorId) ||
    (d.email && String(doctorId).includes('@') && d.email.toLowerCase() === String(doctorId).toLowerCase())
  ) || fallbackDoctor || ((String(doctorId) === '1' || doctorId === 'default' || !doctorId) ? (doctors.find(d => (d.email || '').includes('rahul')) || doctors[0]) : null);

  // Live fetching on mount to guarantee fresh credentials even after hard reload (safe read-only local sync)
  React.useEffect(() => {
    if (!doctorId) return;
    api.getDoctorById(doctorId).then(freshDoc => {
      if (freshDoc && (freshDoc._id || freshDoc.id)) {
        if (syncDoctorLocally) {
          syncDoctorLocally(freshDoc);
        }
      }
    }).catch(() => {
      refreshDoctors?.();
    });
  }, [doctorId, syncDoctorLocally]);

  // Real-time synchronization listener for database changes & cross-tab broadcasts
  React.useEffect(() => {
    const handleDbChange = (e) => {
      const payload = e.detail;
      if (payload?.collection === 'doctors') {
        const matchesCurrent = (
          (payload.docId && matchesId({ _id: payload.docId, id: payload.docId }, doctorId)) ||
          (payload.fullDocument && matchesId(payload.fullDocument, doctorId))
        );
        if (matchesCurrent) {
          if (payload.fullDocument) {
            syncDoctorLocally?.(payload.fullDocument);
          } else {
            api.getDoctorById(doctorId).then(freshDoc => {
              if (freshDoc) syncDoctorLocally?.(freshDoc);
            });
          }
        }
      }
    };
    window.addEventListener('sehat_db_change', handleDbChange);
    return () => window.removeEventListener('sehat_db_change', handleDbChange);
  }, [doctorId, syncDoctorLocally]);

  // Restore scroll position on refresh
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const scrollKey = `sehat_doc_profile_scroll_${doctorId || 'default'}`;

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const isReload = (() => {
      try {
        const navEntries = performance.getEntriesByType('navigation');
        if (navEntries && navEntries.length > 0) {
          return navEntries[0].type === 'reload';
        }
        return performance.navigation.type === 1;
      } catch {
        return false;
      }
    })();

    if (isReload) {
      const saved = sessionStorage.getItem(scrollKey);
      if (saved !== null) {
        const top = parseInt(saved, 10);
        if (!isNaN(top) && top > 0) {
          const restore = () => {
            const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
            const target = Math.min(top, maxScroll);
            window.scrollTo({ top: target, behavior: 'instant' });
          };
          requestAnimationFrame(restore);
          const t1 = setTimeout(restore, 80);
          const t2 = setTimeout(restore, 200);
          return () => {
            clearTimeout(t1);
            clearTimeout(t2);
          };
        }
      }
    } else {
      sessionStorage.setItem(scrollKey, '0');
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    const handleBeforeUnload = () => {
      sessionStorage.setItem(scrollKey, String(window.scrollY || 0));
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    let scrollTimer;
    const handleScroll = () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        sessionStorage.setItem(scrollKey, String(window.scrollY || 0));
      }, 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimer);
    };
  }, [doctorId]);

  const [activeReel, setActiveReel] = useState(null);
  const [reelVideoError, setReelVideoError] = useState(false);
  const [activeVideo, setActiveVideo] = useState(null);

  const handleOpenReel = (reelItem) => {
    setReelVideoError(false);
    setActiveReel(reelItem);
  };

  // Trigger official Instagram Embed SDK on pop up open to ensure interactive reel playback
  React.useEffect(() => {
    if (activeReel) {
      if (!window.instgrm) {
        const script = document.createElement('script');
        script.src = 'https://www.instagram.com/embed.js';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          if (window.instgrm?.Embeds) {
            window.instgrm.Embeds.process();
          }
        };
        document.body.appendChild(script);
      } else if (window.instgrm?.Embeds) {
        window.instgrm.Embeds.process();
      }
    }
  }, [activeReel]);

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);

  // Auto-open write review modal if arriving from login redirect
  React.useEffect(() => {
    if (localStorage.getItem('open_write_review') === 'true') {
      setIsWriteReviewOpen(true);
      localStorage.removeItem('open_write_review');
    }
  }, [doctorId]);

  // Booking interaction states
  const [consultationType, setConsultationType] = useState('In-Clinic Visit');
  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('04:00 PM');



  // Modal patient inputs
  const [patientName, setPatientName] = useState(() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u)?.name || '' : '';
    } catch { return ''; }
  });
  const [patientEmail, setPatientEmail] = useState(() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u)?.email || '' : '';
    } catch { return ''; }
  });
  const [patientPhone, setPatientPhone] = useState(() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u)?.phone || '' : '';
    } catch { return ''; }
  });
  const [symptoms, setSymptoms] = useState('');
  const [bookingStatus, setBookingStatus] = useState(null); // 'loading', 'success', 'error'
  const [expandedFaq, setExpandedFaq] = useState(null);

  // Doctor's available slots & schedule from database
  const configuredSlots = React.useMemo(() => {
    if (Array.isArray(doctor?.availableSlots) && doctor.availableSlots.length > 0) {
      return doctor.availableSlots;
    }
    return ['04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'];
  }, [doctor?.availableSlots]);

  const configuredDays = React.useMemo(() => {
    if (Array.isArray(doctor?.scheduleDays) && doctor.scheduleDays.length > 0) {
      return doctor.scheduleDays;
    }
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  }, [doctor?.scheduleDays]);

  // Helper to resolve specific slots for any date (Date-wise > Day-wise > Default Standard)
  const resolveSlotsForDate = React.useCallback((dateObj) => {
    const dayNameShort = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const dateStr = getLocalDateString(dateObj);
    
    // 1. Date-wise check (highest priority override)
    const dateCustom = doctor?.dateWiseSlots?.[dateStr];
    if (dateCustom !== undefined && dateCustom !== null) {
      if (dateCustom === 'off' || dateCustom?.isOff === true || (Array.isArray(dateCustom) && dateCustom.length === 0)) {
        return { isWorkingDay: false, slots: [], statusText: 'Off / Leave', isCustom: true };
      }
      const customList = Array.isArray(dateCustom) ? dateCustom : (Array.isArray(dateCustom?.slots) ? dateCustom.slots : []);
      if (customList.length > 0) {
        return { isWorkingDay: true, slots: customList, statusText: `${customList.length} Slots`, isCustom: true };
      }
    }

    // 2. Day-wise check (Mon, Tue, etc.)
    const dayCustom = doctor?.dayWiseSlots?.[dayNameShort];
    if (dayCustom !== undefined && dayCustom !== null) {
      if (dayCustom === 'off' || dayCustom?.isOff === true || (Array.isArray(dayCustom) && dayCustom.length === 0)) {
        return { isWorkingDay: false, slots: [], statusText: 'Off', isCustom: true };
      }
      const customList = Array.isArray(dayCustom) ? dayCustom : (Array.isArray(dayCustom?.slots) ? dayCustom.slots : []);
      if (customList.length > 0) {
        return { isWorkingDay: true, slots: customList, statusText: `${customList.length} Slots`, isCustom: true };
      }
    }

    // 3. Fallback to standard scheduleDays and availableSlots
    const isWorkingDay = configuredDays.some(cd => cd.toLowerCase().startsWith(dayNameShort.toLowerCase()));
    return {
      isWorkingDay,
      slots: isWorkingDay ? configuredSlots : [],
      statusText: isWorkingDay ? `${configuredSlots.length} Slots` : 'Off',
      isCustom: false
    };
  }, [doctor?.dateWiseSlots, doctor?.dayWiseSlots, configuredDays, configuredSlots]);

  // Dynamic 3 upcoming appointment days with real live available slot count
  const dateOptions = React.useMemo(() => {
    const dates = [
      new Date(),
      new Date(Date.now() + 86400000),
      new Date(Date.now() + 172800000)
    ];

    return dates.map((d, index) => {
      const dayNameShort = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayLabel = index === 0 ? 'Today' : (index === 1 ? 'Tomorrow' : dayNameShort);
      const dateStr = getLocalDateString(d);
      
      const resolved = resolveSlotsForDate(d);
      const booked = (doctor?.slots_booked && doctor.slots_booked[dateStr]) || [];
      const freeSlots = resolved.isWorkingDay ? resolved.slots.filter(s => !booked.includes(s)) : [];

      let slotsLabel = 'No Slots';
      if (!resolved.isWorkingDay) {
        slotsLabel = resolved.statusText || 'Off';
      } else if (freeSlots.length > 0) {
        slotsLabel = `${freeSlots.length} Slots`;
      } else {
        slotsLabel = 'Booked';
      }

      return {
        day: dayLabel,
        date: `${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' })}`,
        label: `${dayLabel}, ${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' })}`,
        dateStr,
        fullDate: d,
        isWorkingDay: resolved.isWorkingDay,
        freeSlots,
        allSlots: resolved.slots,
        slots: slotsLabel,
        slotsCount: `${freeSlots.length} slots available`
      };
    });
  }, [resolveSlotsForDate, doctor?.slots_booked]);

  // Current day's slots with booked status
  const currentDaySlots = React.useMemo(() => {
    const activeDateObj = dateOptions[selectedDateIdx] || dateOptions[0];
    if (!activeDateObj) return [];
    const booked = (doctor?.slots_booked && doctor.slots_booked[activeDateObj.dateStr]) || [];
    const dayConfiguredSlots = activeDateObj.allSlots || configuredSlots;
    
    return dayConfiguredSlots.map(slot => ({
      time: slot,
      isBooked: booked.includes(slot),
      isOff: !activeDateObj.isWorkingDay
    }));
  }, [dateOptions, selectedDateIdx, configuredSlots, doctor?.slots_booked]);

  // Automatically keep selectedTimeSlot valid
  React.useEffect(() => {
    const validSlots = currentDaySlots.filter(s => !s.isBooked && !s.isOff);
    if (validSlots.length > 0) {
      if (!selectedTimeSlot || !validSlots.some(s => s.time === selectedTimeSlot)) {
        setSelectedTimeSlot(validSlots[0].time);
      }
    } else {
      setSelectedTimeSlot('');
    }
  }, [currentDaySlots, selectedDateIdx]);

  // Stable bio sentence management with clean More/Less toggle (flicker-free)
  const [visibleSentenceCount, setVisibleSentenceCount] = useState(2);

  const leftColRef = React.useRef(null);
  const bookingColRef = React.useRef(null);
  const aboutTextRef = React.useRef(null);

  const allBioSentences = React.useMemo(() => {
    return getBioSentences(doctor);
  }, [doctor]);

  React.useEffect(() => {
    // Check if there's a pending booking after login
    const pending = localStorage.getItem('pendingBooking');
    const token = localStorage.getItem('token');
    
    if (pending && token) {
      const parsed = JSON.parse(pending);
      if (String(parsed.docId) === String(doctorId)) {
        processBooking(parsed.slotDate, parsed.slotTime, parsed.consultationType);
      }
      localStorage.removeItem('pendingBooking');
    }

    // Auto-open booking modal if arriving from "Book Now"
    if (localStorage.getItem('autoOpenBooking') === 'true') {
      setShowBookingModal(true);
      localStorage.removeItem('autoOpenBooking');
    }
  }, [doctorId]);


  const handleBookNow = () => {
    setShowBookingModal(true);
  };

  const processBooking = async (slotDate, slotTime, type = consultationType) => {
    setBookingStatus('loading');
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_BASE}/user/book-appointment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          docId: doctor?.id || doctor?._id,
          slotDate: slotDate || dateOptions[selectedDateIdx].dateStr,
          slotTime: slotTime || selectedTimeSlot,
          consultationType: type,
          patientName: patientName.trim() || 'Patient',
          patientPhone: patientPhone.trim(),
          patientEmail: patientEmail.trim(),
          symptoms: symptoms.trim() || 'General Consultation'
        })
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        const targetDate = slotDate || dateOptions[selectedDateIdx].dateStr;
        const targetTime = slotTime || selectedTimeSlot;
        const currentBooked = { ...(doctor?.slots_booked || {}) };
        const dayBooked = [...(currentBooked[targetDate] || [])];
        if (!dayBooked.includes(targetTime)) {
          dayBooked.push(targetTime);
        }
        currentBooked[targetDate] = dayBooked;
        if (doctor?.id || doctor?._id) {
          updateDoctor(doctor.id || doctor._id, { slots_booked: currentBooked });
        }
        setBookingStatus('success');
      } else {
        alert(data.message || 'Failed to book appointment');
        setBookingStatus(null);
        setShowBookingModal(false);
      }
    } catch {
      alert('An error occurred while booking. Please try again.');
      setBookingStatus(null);
      setShowBookingModal(false);
    }
  };

  const submitBooking = async (e) => {
    e.preventDefault();
    const chosenDateObj = dateOptions[selectedDateIdx] || dateOptions[0];
    const chosenDate = chosenDateObj.dateStr;
    const chosenTime = selectedTimeSlot;

    if (!chosenDate || !chosenTime) {
      alert('Please select date and time');
      return;
    }

    setBookingStatus('loading');
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_BASE}/user/book-appointment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          docId: doctor?.id || doctor?._id,
          slotDate: chosenDate,
          slotTime: chosenTime,
          consultationType: consultationType,
          patientName: patientName.trim() || 'Guest Patient',
          patientPhone: patientPhone.trim() || '',
          patientEmail: patientEmail.trim() || '',
          symptoms: symptoms.trim() || 'General Consultation'
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        const createdApt = data.data;
        const aptId = createdApt?._id || `SB-${Math.floor(10000 + Math.random() * 90000)}`;
        const newBooking = {
          id: aptId,
          appointmentId: aptId,
          docId: doctor.id || doctor._id,
          doctorName: doctor.name,
          doctorSpecialty: doctor.specialty || doctor.specialization,
          doctorHospital: doctor.hospital || 'Apollo Hospital & Heart Center',
          patientName: patientName.trim() || 'Guest Patient',
          patientPhone: patientPhone.trim() || '',
          patientEmail: patientEmail.trim() || '',
          symptoms: symptoms.trim() || 'General Consultation',
          slotDate: chosenDate,
          dateLabel: chosenDateObj.label,
          slotTime: chosenTime,
          consultationType: consultationType,
          fee: doctor.price || doctor.fees || 800,
          status: 'Confirmed',
          bookedAt: new Date().toISOString()
        };

        try {
          const existing = JSON.parse(localStorage.getItem('sehat_buddy_appointments') || '[]');
          existing.unshift(newBooking);
          localStorage.setItem('sehat_buddy_appointments', JSON.stringify(existing));
        } catch {}

        const currentBooked = { ...(doctor?.slots_booked || {}) };
        const dayBooked = [...(currentBooked[chosenDate] || [])];
        if (!dayBooked.includes(chosenTime)) {
          dayBooked.push(chosenTime);
        }
        currentBooked[chosenDate] = dayBooked;
        if (doctor?.id || doctor?._id) {
          updateDoctor(doctor.id || doctor._id, { slots_booked: currentBooked });
        }

        setBookingStatus('success');
      } else {
        alert(data.message || 'Failed to book appointment');
        setBookingStatus(null);
      }
    } catch (err) {
      console.error('Booking failed:', err);
      alert('An error occurred while booking. Please try again.');
      setBookingStatus(null);
    }
  };

  if (!doctor) {
    return (
      <div className={styles.pageWrapper}>
        <Container>
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <h2>Doctor Not Found</h2>
            <button onClick={() => onNavigate('find-doctors')} className={styles.backBtn}>
              Back to Doctors
            </button>
          </div>
        </Container>
      </div>
    );
  }

  // Generate procedure / qualification tags matching the design
  const getDoctorTags = (doc) => {
    if (Array.isArray(doc?.tags) && doc.tags.length > 0) {
      return Array.from(new Set(doc.tags.filter(Boolean)));
    }
    const list = [];
    if (doc?.degree || doc?.qualifications) {
      const parts = (doc.degree || doc.qualifications).split(/[,/]+/).map(s => s.trim()).filter(Boolean);
      list.push(...parts);
    }
    const spec = (doc?.specialty || doc?.specialization || '').toLowerCase();
    if (spec.includes('dent') || spec.includes('paedo')) {
      list.push('BDS', 'MDS - Paedodontics', 'Implantologist', 'Pediatric Dentist', 'Cosmetic/Aesthetic Dentist', 'Preventive Dentistry', 'Dental Surgeon');
    } else if (spec.includes('cardio')) {
      list.push('Interventional Cardiologist', 'Angioplasty Specialist', 'Echocardiography', 'Heart Failure Care', 'Preventive Cardiology', 'Chest Pain Specialist');
    } else if (spec.includes('derma')) {
      list.push('Clinical Dermatology', 'Cosmetic/Aesthetic Specialist', 'Laser Therapeutics', 'Trichology', 'Cutaneous Surgeon', 'Acne & Skin Care');
    } else if (spec.includes('ortho')) {
      list.push('Joint Replacement', 'Arthroscopy Specialist', 'Robotic Knee Surgery', 'Sports Medicine', 'Trauma Surgeon', 'Spine Rehabilitation');
    } else if (spec.includes('pedia')) {
      list.push('Pediatric Intensive Care', 'Neonatology', 'Child Growth & Development', 'Vaccination Specialist', 'Pediatric Allergy Care');
    } else if (spec.includes('gyne') || spec.includes('obs')) {
      list.push('High-Risk Obstetrics', 'Laparoscopic Surgeon', 'Infertility Specialist', 'Women Hormonal Health', 'Maternal Fetal Care');
    } else if (spec.includes('neuro')) {
      list.push('Stroke Rehabilitation', 'Neurocritical Care', 'Electrophysiology', 'Headache & Migraine Specialist', 'Epilepsy Care');
    } else if (spec.includes('uro')) {
      list.push('Robotic Urological Surgery', 'Kidney Stone Specialist', 'Endourology', 'Renal Transplant', 'Prostate Care');
    } else {
      list.push('Consultant Physician', 'Clinical Diagnostics', 'Preventive Healthcare', 'Chronic Disease Management', 'Health Wellness');
    }
    return Array.from(new Set(list)).slice(0, 7);
  };

  const doctorTags = React.useMemo(() => {
    return getDoctorTags(doctor);
  }, [doctor?.tags, doctor?.degree, doctor?.qualifications, doctor?.specialty, doctor?.specialization]);

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
        // Extract the shortcode from /reel/SHORTCODE, /reels/SHORTCODE, /p/SHORTCODE, or /tv/SHORTCODE
        const match = url.match(/instagram\.com\/(?:reel|reels|p|tv|share\/reel)\/([^/?#&]+)/i);
        if (match && match[1]) {
          const shortcode = match[1];
          return `https://www.instagram.com/reel/${shortcode}/embed/`;
        }
        if (!url.includes('/embed')) {
          const cleanUrl = url.split('?')[0].replace(/\/$/, '');
          return `${cleanUrl}/embed/`;
        }
      }
      return url;
    } catch {
      return url;
    }
  };

  const isAdmin = React.useMemo(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u.role === 'admin' || u.isAdmin || u.type === 'admin') return true;
      }
      if (localStorage.getItem('admin_logged_in') === 'true') return true;
    } catch {
      return false;
    }
    return false;
  }, []);

  const doctorReviews = React.useMemo(() => {
    return getDoctorVerifiedReviews(doctor, reviews);
  }, [doctor, reviews]);

  const avgRating = React.useMemo(() => {
    if (doctorReviews.length === 0) return '0';
    const total = doctorReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0);
    return (total / doctorReviews.length).toFixed(1);
  }, [doctorReviews]);

  const displayReviewsText = React.useMemo(() => {
    const count = doctorReviews.length;
    return `${count} patient review${count === 1 ? '' : 's'}`;
  }, [doctorReviews.length]);

  return (
    <div className={styles.pageWrapper}>
      <Container>
        {/* Top Back Navigation Button */}
        <button onClick={() => window.history.back()} className={styles.backBtn}>
          <ArrowLeft size={18} /> Back
        </button>

        {/* UNIFIED DOCTOR MASTER CARD: Merges Doctor Profile, Highlights, About & Booking into One Cohesive Card */}
        <div className={styles.unifiedDoctorCard}>
          {/* LEFT: Main Profile, Highlights & About */}
          <div className={styles.unifiedMainCol} ref={leftColRef}>
            <div className={styles.heroTopRow}>
              <div className={styles.heroAvatarCol}>
                <div className={styles.heroAvatarWrap}>
                  <img 
                    src={doctor.image} 
                    alt={doctor.name}
                    className={styles.heroAvatarImg}
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80';
                    }} 
                  />
                </div>

                {/* Social Profile Icons Below Doctor Photo */}
                {(doctor.instagram || doctor.facebook || doctor.linkedin || doctor.twitter || doctor.youtube) && (
                  <div className={styles.heroSocialLinks}>
                    {doctor.instagram && (
                      <a
                        href={doctor.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${styles.socialIconBtn} ${styles.socialInstagram}`}
                        title="Visit Instagram Profile"
                        aria-label="Instagram Profile"
                      >
                        <SocialInstagramIcon size={18} />
                      </a>
                    )}
                    {doctor.facebook && (
                      <a
                        href={doctor.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${styles.socialIconBtn} ${styles.socialFacebook}`}
                        title="Visit Facebook Profile"
                        aria-label="Facebook Profile"
                      >
                        <SocialFacebookIcon size={18} />
                      </a>
                    )}
                    {doctor.linkedin && (
                      <a
                        href={doctor.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${styles.socialIconBtn} ${styles.socialLinkedin}`}
                        title="Visit LinkedIn Profile"
                        aria-label="LinkedIn Profile"
                      >
                        <SocialLinkedinIcon size={18} />
                      </a>
                    )}
                    {doctor.twitter && (
                      <a
                        href={doctor.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${styles.socialIconBtn} ${styles.socialTwitter}`}
                        title="Visit Twitter/X Profile"
                        aria-label="Twitter/X Profile"
                      >
                        <SocialTwitterXIcon size={15} />
                      </a>
                    )}
                    {doctor.youtube && (
                      <a
                        href={doctor.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${styles.socialIconBtn} ${styles.socialYoutube}`}
                        title="Visit YouTube Channel"
                        aria-label="YouTube Channel"
                      >
                        <SocialYoutubeIcon size={18} />
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div className={styles.heroInfoWrap}>
                <div className={styles.heroNameRatingRow}>
                  <h1 className={styles.heroDoctorName}>{doctor.name}</h1>
                  <div className={styles.heroRatingBadge}>
                    <Star size={14} fill="#eab308" color="#eab308" />
                    <span className={styles.heroRatingVal}>{avgRating}</span>
                    <span className={styles.heroRatingDivider}>|</span>
                    <span className={styles.heroReviewsCount}>
                      {displayReviewsText}
                    </span>
                  </div>
                </div>

                <div className={styles.heroJobTitle}>
                  {doctor.jobTitle || 'Senior consultant'}
                </div>

                <div className={styles.heroSpecialtyRow}>
                  <span className={styles.heroSpecialtyPill}>
                    {doctor.specialty || doctor.specialization || 'Consultant Specialist'}
                  </span>
                  <span className={styles.heroVerifiedPill}>
                    <CheckCircle2 size={13} color="#059669" />
                    Verified
                  </span>
                </div>

                {/* Tags / Degrees / Clinical Focus */}
                <div className={styles.heroTagsWrap}>
                  {doctorTags.map((tag, idx) => (
                    <span key={`${tag}-${idx}`} className={styles.heroTagPill}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom 3-Column Highlights Row */}
            <div className={styles.heroHighlightsRow}>
              <div className={styles.heroHighlightItem}>
                <div className={styles.heroHighlightIconWrap}>
                  <Briefcase size={18} />
                </div>
                <div>
                  <span className={styles.heroHighlightLabel}>Experience</span>
                  <strong className={styles.heroHighlightVal}>
                    {formatDoctorExperience(doctor.experience)}
                  </strong>
                </div>
              </div>

              <div className={styles.heroHighlightItem}>
                <div className={styles.heroHighlightIconWrap}>
                  <Building2 size={18} />
                </div>
                <div>
                  <span className={styles.heroHighlightLabel}>Hospital</span>
                  <strong className={styles.heroHighlightVal}>
                    {doctor.hospital || 'Apollo Hospital & Heart Center'}
                  </strong>
                </div>
              </div>

              <div className={styles.heroHighlightItem}>
                <div className={styles.heroHighlightIconWrap}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <span className={styles.heroHighlightLabel}>Registration</span>
                  <div className={styles.heroRegValWrap}>
                    <strong className={styles.heroHighlightVal}>
                      {doctor.licenseNumber || `DMC-2009-${String(doctor.id || doctor._id || '44182').slice(-5).toUpperCase()}`}
                    </strong>
                    <span className={styles.heroRegVerifiedTag}>Verified</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Integrated About Section with Rich Clinical Bio & Credentials Footer */}
            <div className={styles.unifiedAboutSection}>
              <div className={styles.aboutTopBlock} style={{ position: 'relative' }}>
                <h3 className={styles.sectionHeading}>
                  About {doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`}
                </h3>
                <div className={styles.aboutTextContent} ref={aboutTextRef}>
                  {(() => {
                    if (allBioSentences.length === 0) return null;

                    const countToShow = isAboutExpanded
                      ? allBioSentences.length
                      : Math.min(allBioSentences.length, Math.max(1, visibleSentenceCount || 1));

                    const displayedSentences = allBioSentences.slice(0, countToShow);
                    const hasMore = allBioSentences.length > countToShow;

                    return (
                      <>
                        <div className={styles.aboutParasWrap}>
                          {displayedSentences.map((sentence, sIdx) => (
                            <p key={sIdx}>{sentence}</p>
                          ))}
                        </div>
                        {(hasMore || isAboutExpanded) && allBioSentences.length > 1 && (
                          <button
                            type="button"
                            className={styles.readMoreBtn}
                            onClick={() => setIsAboutExpanded(!isAboutExpanded)}
                            aria-expanded={isAboutExpanded}
                          >
                            <span>{isAboutExpanded ? 'Less' : 'More'}</span>
                            <ChevronDown
                              size={14}
                              className={`${styles.readMoreChevron} ${isAboutExpanded ? styles.readMoreChevronOpen : ''}`}
                            />
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Verified Clinical Credentials & Practice Standard (Anchored dynamically to balance column height) */}
              <div className={styles.aboutMetaFooter}>
                <div className={styles.aboutMetaItem}>
                  <div className={styles.aboutMetaIcon}>
                    <GraduationCap size={15} />
                  </div>
                  <div className={styles.aboutMetaContent}>
                    <span className={styles.aboutMetaLabel}>Qualifications</span>
                    <span className={styles.aboutMetaValue} title={doctor.degree || doctor.qualifications || 'MBBS, MD'}>
                      {doctor.degree || doctor.qualifications || 'MBBS, MD'}
                    </span>
                  </div>
                </div>

                <div className={styles.aboutMetaItem}>
                  <div className={styles.aboutMetaIcon}>
                    <Stethoscope size={15} />
                  </div>
                  <div className={styles.aboutMetaContent}>
                    <span className={styles.aboutMetaLabel}>Specialization</span>
                    <span className={styles.aboutMetaValue} title={doctor.specialty || doctor.specialization || 'Consultant Specialist'}>
                      {doctor.specialty || doctor.specialization || 'Consultant Specialist'}
                    </span>
                  </div>
                </div>

                <div className={styles.aboutMetaItem}>
                  <div className={styles.aboutMetaIcon}>
                    <CalendarClock size={15} />
                  </div>
                  <div className={styles.aboutMetaContent}>
                    <span className={styles.aboutMetaLabel}>OPD Schedule</span>
                    <span className={styles.aboutMetaValue} title={doctor.availableDays || 'Mon – Sat (Scheduled Slots)'}>
                      {doctor.availableDays || 'Mon – Sat (Scheduled Slots)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Consultation & Booking Panel */}
          <div className={styles.unifiedBookingCol} ref={bookingColRef}>
            {/* Consultation Fee Card */}
            <div className={styles.feeCard}>
              <div className={styles.feeCardLeft}>
                <div className={styles.feeCardHeader}>
                  <CreditCard size={14} color="#0284c7" />
                  <span className={styles.feeCardLabel}>CONSULTATION FEE</span>
                </div>
                <div className={styles.feePriceRow}>
                  <span className={styles.feeCurrency}>₹</span>
                  <span className={styles.feeAmount}>{doctor.price || doctor.fees || 800}</span>
                  <span className={styles.feeSub}>/ visit</span>
                </div>
              </div>
              <div className={styles.feeCardRight}>
                <span className={styles.feeVerifiedTag}>
                  <CheckCircle2 size={12} color="#059669" />
                  <span>100% Cashless TPA</span>
                </span>
                <span className={styles.feePayTag}>Pay at clinic or online</span>
              </div>
            </div>

            {/* Select Consultation Type */}
            <div className={styles.bookingSection}>
              <div className={styles.sectionHeaderRow}>
                <label className={styles.bookingSectionLabel}>Consultation Mode</label>
                <span className={styles.instantTag}>Instant Confirmation</span>
              </div>
              <div className={styles.consultTypeToggleGroup}>
                <button 
                  type="button" 
                  className={`${styles.consultTypeBtn} ${consultationType === 'In-Clinic Visit' ? styles.consultTypeActive : ''}`}
                  onClick={() => setConsultationType('In-Clinic Visit')}
                >
                  <Building2 size={14} />
                  <span>In-Clinic Visit</span>
                </button>
                <button 
                  type="button" 
                  className={`${styles.consultTypeBtn} ${consultationType === 'Video Consultation' ? styles.consultTypeActive : ''}`}
                  onClick={() => setConsultationType('Video Consultation')}
                >
                  <Video size={14} />
                  <span>Video Call</span>
                </button>
              </div>
            </div>

            {/* Select Date & Time */}
            <div className={styles.bookingSection}>
              <label className={styles.bookingSectionLabel}>Select Appointment Date</label>
              <div className={styles.dateSlotsGroup}>
                {dateOptions.map((opt, idx) => (
                  <button 
                    key={idx} 
                    type="button"
                    className={`${styles.dateSlotCard} ${selectedDateIdx === idx ? styles.dateSlotCardActive : ''}`}
                    onClick={() => setSelectedDateIdx(idx)}
                  >
                    <span className={styles.dateSlotDayName}>{opt.day}</span>
                    <span className={styles.dateSlotDateNum}>{opt.date}</span>
                    <span className={`${styles.dateSlotPill} ${selectedDateIdx === idx ? styles.dateSlotPillActive : ''}`}>
                      {opt.slots}
                    </span>
                  </button>
                ))}
              </div>

              <div className={styles.timeSlotsHeader}>
                <Clock size={13} color="#475569" />
                <span>Available Slots for {dateOptions[selectedDateIdx]?.day || 'Today'}</span>
              </div>
              <div className={styles.timeSlotsGrid}>
                {dateOptions[selectedDateIdx]?.isWorkingDay === false ? (
                  <div style={{ gridColumn: '1 / -1', padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: '0.82rem', textAlign: 'center' }}>
                    Doctor is off duty on this day. Please choose another date.
                  </div>
                ) : currentDaySlots.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: '0.82rem', textAlign: 'center' }}>
                    No slots configured for this day.
                  </div>
                ) : currentDaySlots.filter(s => !s.isBooked).length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', padding: '12px 14px', background: '#fff1f2', borderRadius: '8px', border: '1px dashed #fecdd3', color: '#e11d48', fontSize: '0.82rem', textAlign: 'center' }}>
                    All slots are fully booked for this day. Please select another date.
                  </div>
                ) : (
                  currentDaySlots.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={item.isBooked}
                      className={`${styles.timeSlotPill} ${selectedTimeSlot === item.time ? styles.timeSlotPillActive : ''}`}
                      onClick={() => !item.isBooked && setSelectedTimeSlot(item.time)}
                      title={item.isBooked ? 'Slot already booked' : `Select ${item.time}`}
                      style={item.isBooked ? { opacity: 0.45, textDecoration: 'line-through', cursor: 'not-allowed', background: '#f1f5f9' } : {}}
                    >
                      {item.time}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Book Appointment CTA Button */}
            <div className={styles.bookingCtaWrapper}>
              <button 
                type="button" 
                className={styles.bookAppointmentBtn}
                onClick={handleBookNow}
              >
                <span>Book Appointment</span>
                <ArrowRight size={16} />
              </button>
              <div className={styles.bookingGuaranteesRow}>
                <span className={styles.guaranteeItem}>
                  <CheckCircle2 size={12} color="#059669" />
                  <span>Instant Confirmation</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTIONS: Credentials, Media, FAQs, Reviews */}
        <div className={styles.bottomSectionsCol}>

            {/* Credentials, Honors & Clinical Experience */}
            {(() => {
              const default4Awards = [
                'Best Cardiologist of the Year - National Healthcare Summit (2023)',
                'Excellence in Interventional Cardiology - Cardiological Society of India (2020)',
                'Distinguished Clinical Researcher Award - Indian Council of Medical Research (2018)',
                'Excellence in Patient Care & Clinical Service - Apollo Healthcare (2022)'
              ];
              const isRahulDoc = matchesId(doctor, '1') || (doctor?.name && doctor.name.toLowerCase().includes('rahul verma'));
              const awardsList = Array.isArray(doctor?.awards) 
                ? doctor.awards 
                : (isRahulDoc ? default4Awards : []);

              const defaultCerts = [
                'Fellow of the American College of Cardiology (FACC)',
                'Fellow of Society for Cardiovascular Angiography & Interventions (FSCAI)',
                'Advanced Cardiac Life Support (ACLS) Certified Provider',
                'Post-Doctoral Fellowship in Complex Coronary Angioplasty (P-DF)'
              ];
              const certificationsList = Array.isArray(doctor?.certifications) 
                ? doctor.certifications 
                : (isRahulDoc ? defaultCerts : []);

              const defaultMemberships = [
                'Cardiological Society of India (CSI) - Life Member',
                'Indian Medical Association (IMA) - Senior Member',
                'European Society of Cardiology (ESC) - Fellow Member',
                'Association of Physicians of India (API) - Registered Member'
              ];
              const membershipsList = Array.isArray(doctor?.memberships) 
                ? doctor.memberships 
                : (isRahulDoc ? defaultMemberships : []);

              const default4Timeline = [
                'Senior Consultant Interventional Cardiologist - Apollo Hospital (2018 – Present)',
                'Associate Consultant Cardiology - Fortis Healthcare (2014 – 2018)',
                'Chief Resident in Cardiology - All India Institute of Medical Sciences (2011 – 2014)',
                'Clinical Fellow in Interventional Cardiology - AIIMS New Delhi (2009 – 2011)'
              ];
              const timelineList = Array.isArray(doctor?.careerExperience) 
                ? doctor.careerExperience 
                : (isRahulDoc ? default4Timeline : []);

              const parseAwardItem = (text) => {
                let title = typeof text === 'string' ? text : (text?.title || '');
                let subtitle = '';
                let tag = '';

                if (typeof text === 'object' && text !== null) {
                  title = text.title || text.name || '';
                  subtitle = text.organization || text.subtitle || '';
                  tag = text.year || text.tag || '';
                }

                if (typeof text === 'string') {
                  if (text.includes(' - ')) {
                    const parts = text.split(' - ');
                    title = parts[0].trim();
                    subtitle = parts.slice(1).join(' - ').trim();
                  }
                  if (subtitle.includes('(') && subtitle.includes(')')) {
                    const match = subtitle.match(/\((.*?)\)/);
                    if (match) {
                      tag = match[1].trim();
                      subtitle = subtitle.replace(/\(.*?\)/, '').trim();
                    }
                  } else if (title.includes('(') && title.includes(')')) {
                    const match = title.match(/\((.*?)\)/);
                    if (match) {
                      tag = match[1].trim();
                      title = title.replace(/\(.*?\)/, '').trim();
                    }
                  }

                  if (!tag) {
                    const yearMatch = title.match(/\b((?:19|20)\d{2})\b/);
                    if (yearMatch) {
                      tag = yearMatch[1];
                      title = title.replace(/\b((?:19|20)\d{2})\b/, '').trim();
                    }
                  }
                }

                if (!subtitle) {
                  subtitle = 'National Healthcare Recognition';
                }
                return { title, subtitle, tag };
              };

              const parseCertItem = (text) => {
                let title = text;
                let tag = 'Certified';
                if (text.includes('(') && text.includes(')')) {
                  const match = text.match(/\((.*?)\)/);
                  if (match) {
                    tag = match[1].trim();
                    title = text.replace(/\(.*?\)/, '').trim();
                  }
                }
                return { title, subtitle: 'Accredited Medical Board', tag };
              };

              const parseMembershipItem = (text) => {
                let title = text;
                let tag = 'Active Member';
                if (text.includes(' - ')) {
                  const parts = text.split(' - ');
                  title = parts[0].trim();
                  tag = parts.slice(1).join(' - ').trim();
                }
                return { title, subtitle: 'Official Medical Council', tag };
              };

              const parseTimelineItem = (text) => {
                const isPresent = text.toLowerCase().includes('present');
                let title = text;
                let hospital = doctor.hospital || 'Apollo Hospital';
                let years = '2018 – Present';
                if (text.includes(' - ')) {
                  const parts = text.split(' - ');
                  title = parts[0].trim();
                  const rest = parts.slice(1).join(' - ').trim();
                  if (rest.includes('(')) {
                    const idx = rest.indexOf('(');
                    hospital = rest.slice(0, idx).trim();
                    years = rest.slice(idx).replace(/[()]/g, '').trim();
                  } else {
                    hospital = rest;
                  }
                }
                return { title, hospital, years, isPresent };
              };

              return (
                <div className={styles.credentialsCard}>
                  <div className={styles.credentialsHeader}>
                    <div className={styles.credentialsHeaderLeft}>
                      <h3 className={styles.credentialsTitle}>
                        <Award size={22} color="#2563eb" />
                        Credentials, Honors & Clinical Experience
                      </h3>
                      <p className={styles.credentialsSubtitle}>
                        Verified clinical certifications, institutional awards, professional memberships, and hospital timeline of Dr. {doctor.name ? doctor.name.replace(/^Dr\.\s*/i, '') : 'Rahul Verma'}.
                      </p>
                    </div>
                    <div className={styles.verifiedHeaderBadge}>
                      <ShieldCheck size={16} /> 100% Verified Credentials
                    </div>
                  </div>

                  <div className={styles.credentialsGrid}>
                    {/* Left Column: Awards & Honors + Memberships */}
                    <div className={styles.credCol}>
                      {/* Awards & Honors */}
                      <div className={styles.credBlock}>
                        <h4 className={styles.credBlockTitle}>
                          <Award size={18} color="#d97706" />
                          Awards & Honors ({awardsList.length})
                        </h4>
                        <div className={styles.credList}>
                          {awardsList.length === 0 ? (
                            <div style={{ padding: '12px 14px', fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                              No awards or honors listed yet.
                            </div>
                          ) : (
                            awardsList.map((award, idx) => {
                            const parsed = parseAwardItem(award);
                            return (
                              <div key={idx} className={styles.awardItemPill}>
                                <div className={styles.awardIconWrap}>
                                  <Trophy size={16} />
                                </div>
                                <div className={styles.credItemTextWrap}>
                                  <div className={styles.credItemTitle}>{parsed.title}</div>
                                  <div className={styles.credItemSubRow}>
                                    <span className={styles.credItemSub}>{parsed.subtitle}</span>
                                    {parsed.tag && <span className={styles.yearChip}>{parsed.tag}</span>}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                          )}
                        </div>
                      </div>

                      {/* Professional Medical Memberships */}
                      <div className={styles.credBlock}>
                        <h4 className={styles.credBlockTitle}>
                          <CheckCircle2 size={18} color="#059669" />
                          Professional Medical Memberships ({membershipsList.length})
                        </h4>
                        <div className={styles.credList}>
                          {membershipsList.length === 0 ? (
                            <div style={{ padding: '12px 14px', fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                              No professional memberships listed yet.
                            </div>
                          ) : (
                            membershipsList.map((mem, idx) => {
                            const parsed = parseMembershipItem(mem);
                            return (
                              <div key={idx} className={styles.membershipItemPill}>
                                <div className={styles.membershipIconWrap}>
                                  <CheckCircle2 size={16} />
                                </div>
                                <div className={styles.credItemTextWrap}>
                                  <div className={styles.credItemTitle}>{parsed.title}</div>
                                  <div className={styles.credItemSubRow}>
                                    <span className={styles.credItemSub}>{parsed.subtitle}</span>
                                    {parsed.tag && <span className={styles.memberTierChip}>{parsed.tag}</span>}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Certificates & Fellowships + Career Experience */}
                    <div className={styles.credCol}>
                      {/* Certificates & Fellowships */}
                      <div className={styles.credBlock}>
                        <h4 className={styles.credBlockTitle}>
                          <GraduationCap size={18} color="#2563eb" />
                          Certificates & Fellowships ({certificationsList.length})
                        </h4>
                        <div className={styles.credList}>
                          {certificationsList.length === 0 ? (
                            <div style={{ padding: '12px 14px', fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                              No certificates or fellowships listed yet.
                            </div>
                          ) : (
                            certificationsList.map((cert, idx) => {
                            const parsed = parseCertItem(cert);
                            const getCertIcon = (i) => {
                              if (i === 0) return <GraduationCap size={16} />;
                              if (i === 1) return <FileText size={16} />;
                              if (i === 2) return <HeartPulse size={16} />;
                              return <Stethoscope size={16} />;
                            };
                            return (
                              <div key={idx} className={styles.certItemPill}>
                                <div className={styles.certIconWrap}>
                                  {getCertIcon(idx)}
                                </div>
                                <div className={styles.credItemTextWrap}>
                                  <div className={styles.credItemTitle}>{parsed.title}</div>
                                  <div className={styles.credItemSubRow}>
                                    <span className={styles.credItemSub}>{parsed.subtitle}</span>
                                    {parsed.tag && <span className={styles.certCodeChip}>{parsed.tag}</span>}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                          )}
                        </div>
                      </div>

                      {/* Career Experience & Hospital Timeline */}
                      <div className={styles.credBlock}>
                        <h4 className={styles.credBlockTitle}>
                          <TimelineSymbolIcon size={18} color="#4f46e5" />
                          Career Experience & Hospital Timeline ({timelineList.length})
                        </h4>
                        <div className={styles.timelineListContainer}>
                          {timelineList.length === 0 ? (
                            <div style={{ padding: '12px 14px', fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                              No career experience entries listed yet.
                            </div>
                          ) : (
                            timelineList.map((item, idx) => {
                            const parsed = parseTimelineItem(item);
                            const isPresent = parsed.isPresent || (idx === 0 && !timelineList.some(t => t.toLowerCase().includes('present')));
                            const getTimelineCardIcon = (i, isPres) => {
                              if (isPres || i === 0) return <Clock size={16} />;
                              if (i === 1) return <Milestone size={16} />;
                              if (i === 2) return <History size={16} />;
                              return <CalendarClock size={16} />;
                            };
                            return (
                              <div key={idx} className={styles.timelineRow}>
                                {/* Left Vertical Timeline Track */}
                                <div className={styles.timelineTrackCol}>
                                  {/* Top connecting line segment */}
                                  <div
                                    className={`${styles.timelineLineTop} ${
                                      idx === 0
                                        ? styles.timelineLineHidden
                                        : idx === 1 && timelineList[0]?.toLowerCase().includes('present')
                                        ? styles.timelineLineSolid
                                        : styles.timelineLineDotted
                                    }`}
                                  />

                                  {/* Node: Double circle for present, single circle for rest */}
                                  <div className={styles.timelineNodeWrap}>
                                    {isPresent ? (
                                      <div className={styles.timelineDoubleCircle} title="Current Role (Present)">
                                        <div className={styles.timelineDoubleCircleInner} />
                                      </div>
                                    ) : (
                                      <div className={styles.timelineSingleCircle} title="Previous Role" />
                                    )}
                                  </div>

                                  {/* Bottom connecting line / tail */}
                                  {idx < timelineList.length - 1 ? (
                                    <div className={isPresent ? styles.timelineLineSolid : styles.timelineLineDotted} />
                                  ) : (
                                    <div className={styles.timelineTailDotted} />
                                  )}
                                </div>

                                {/* Right Timeline Card */}
                                <div className={styles.timelineCard}>
                                  <div className={styles.timelineIconWrap}>
                                    {getTimelineCardIcon(idx, isPresent)}
                                  </div>
                                  <div className={styles.credItemTextWrap}>
                                    <div className={styles.credItemTitle}>{parsed.title}</div>
                                    <div className={styles.credItemSubRow}>
                                      <span className={styles.credItemSub}>{parsed.hospital}</span>
                                      {isPresent ? (
                                        <span className={styles.presentBadge}>
                                          <Clock size={11} /> Present
                                        </span>
                                      ) : (
                                        <span className={styles.timelineYearChip}>
                                          <Calendar size={11} /> {parsed.years}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Instagram Reels Section */}
            {(() => {
              const rawReels = Array.isArray(doctor.reels) ? doctor.reels : [];
              const parsedReels = rawReels
                .map((r) => {
                  let url = '';
                  let customCover = '';

                  if (typeof r === 'string') {
                    url = r.trim();
                  } else if (r && typeof r === 'object') {
                    url = (r.url || r.link || '').trim();
                    customCover = (r.coverPhoto || r.cover || r.image || r.thumbnail || '').trim();
                  }

                  if (!url && !customCover) return null;

                  let shortcode = '';
                  const match = url.match(/instagram\.com\/(?:reel|reels|p|tv|share\/reel)\/([^/?#&]+)/i);
                  if (match && match[1]) {
                    shortcode = match[1];
                  }

                  const embedUrl = shortcode ? `https://www.instagram.com/reel/${shortcode}/embed/` : getEmbedUrl(url);

                  return {
                    url,
                    shortcode,
                    embedUrl,
                    coverPhoto: customCover || ''
                  };
                })
                .filter(Boolean)
                .slice(0, 5);

              if (parsedReels.length === 0) return null;

              return (
                <div className={styles.mediaSection}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#db2777',
                        border: '1px solid #fbcfe8'
                      }}>
                        <SocialInstagramIcon size={20} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                          Instagram Reels
                        </h3>
                        <p style={{ margin: '2px 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                          Clinical guidance, health reels, and treatment walkthroughs
                        </p>
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#db2777',
                      background: '#fdf2f8',
                      padding: '4px 12px',
                      borderRadius: '100px',
                      border: '1px solid #fbcfe8'
                    }}>
                      {parsedReels.length} Reel{parsedReels.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className={styles.reelsGrid}>
                    {parsedReels.map((reelItem, idx) => (
                      <DoctorReelCard
                        key={idx}
                        reelItem={reelItem}
                        idx={idx}
                        onOpen={handleOpenReel}
                      />
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* YouTube Videos Section */}
            {doctor.youtube_videos && Array.isArray(doctor.youtube_videos) && doctor.youtube_videos.length > 0 && (
              <div className={styles.mediaSection}>
                <h3>Educational Videos</h3>
                <div className={styles.youtubeGrid}>
                  {doctor.youtube_videos.slice(0, 2).map((video, idx) => {
                    if (!video) return null;
                    const embedUrl = getEmbedUrl(video);
                    return (
                      <div key={idx} className={styles.youtubeCard} onClick={() => setActiveVideo(embedUrl)}>
                        <iframe 
                          src={embedUrl} 
                          title={`YouTube ${idx + 1}`} 
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        ></iframe>
                        <div className={styles.reelOverlay}>
                          <Play size={60} color="white" opacity={0.9} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* FAQs Section */}
            <div className={styles.faqCard}>
              <div className={styles.faqLayoutGrid}>
                {/* Left Column: Context, Illustration & Clinic Support */}
                <div className={styles.faqSidebarCol}>
                  <div className={styles.faqIllustrationWrap}>
                    <DoctorFaqIllustration />
                  </div>

                  <div className={styles.faqHeaderTextWrap}>
                    <div className={styles.faqSectionBadge}>
                      <HelpCircle size={14} color="#0284c7" />
                      <span>PATIENT HELP & FAQS</span>
                    </div>
                    <h3 className={styles.faqMainTitle}>
                      Frequently Asked Questions
                    </h3>
                    <p className={styles.faqSubtitle}>
                      Find quick answers regarding appointment booking, clinic consultations, and cashless insurance coverage.
                    </p>
                    <div className={styles.faqVerifiedPill}>
                      <ShieldCheck size={14} color="#15803d" />
                      <span>Verified by {doctor?.hospital ? `${doctor.hospital}` : 'Hospital Administration'}</span>
                    </div>
                  </div>

                  {/* Dedicated Support Card */}
                  <div className={styles.faqSupportCard}>
                    <div className={styles.faqSupportHeader}>
                      <div className={styles.faqSupportIconWrap}>
                        <MessageSquare size={18} color="#2563eb" />
                      </div>
                      <div>
                        <h4 className={styles.faqSupportTitle}>Have a Specific Question?</h4>
                        <p className={styles.faqSupportSub}>Our clinic care desk can assist with bookings or cashless claims.</p>
                      </div>
                    </div>
                    <div className={styles.faqSupportActions}>
                      <a href="tel:+919876543210" className={styles.faqSupportPhoneBtn}>
                        <Phone size={14} />
                        <span>Call Clinic Desk: +91 98765 43210</span>
                      </a>
                      <div className={styles.faqSupportHours}>
                        <Clock size={12} color="#64748b" />
                        <span>Mon – Sat • 8:00 AM – 8:00 PM</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Interactive Accordions */}
                <div className={styles.faqAccordionCol}>
                  <div className={styles.faqList}>
                    {(() => {
                      const defaultDoctorFaqs = [
                        {
                          category: 'Booking & Schedule',
                          icon: <FaqCalendarIcon />,
                          q: `How can I book an appointment with ${doctor?.name ? (doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`) : 'the doctor'}?`,
                          steps: [
                            'Open The Sehat Buddy platform on web or mobile app',
                            'Select consultation type (In-Clinic Visit or Video Consultation)',
                            'Choose your preferred consultation date and available appointment slot',
                            'Review patient details, enter your symptoms, and proceed with instant confirmation'
                          ],
                          note: "Once completed, your appointment will be booked, and you'll receive instant confirmation via SMS and WhatsApp."
                        },
                        {
                          category: 'Clinic Preparation',
                          icon: <FaqDocumentIcon />,
                          q: 'What do I need to show at the clinic?',
                          a: 'Please carry a valid government photo ID (Aadhar Card, PAN Card, or Passport), your health insurance policy e-card if claiming cashless coverage, and any previous doctor prescriptions, discharge summaries, or diagnostic reports related to your consultation.'
                        },
                        {
                          category: 'Privacy & Security',
                          icon: <FaqShieldLockIcon />,
                          q: 'Is my consultation private with the doctor?',
                          a: 'Yes, 100%. All consultations, patient notes, medical records, and discussions are strictly confidential and protected under standard healthcare privacy regulations.'
                        },
                        {
                          category: 'Rescheduling Policy',
                          icon: <FaqRescheduleIcon />,
                          q: `Can I reschedule my appointment with ${doctor?.name ? (doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`) : 'the doctor'}?`,
                          a: 'Yes, you can easily reschedule or cancel your appointment prior to your slot time through your patient account dashboard or by reaching out to our support care desk.'
                        },
                        {
                          category: 'Cashless Insurance',
                          icon: <FaqInsuranceIcon />,
                          q: `Does ${doctor?.name ? (doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`) : 'the doctor'} accept health insurance or cashless claims?`,
                          a: 'Yes, consultations and any recommended clinical procedures or treatments performed at our partner hospitals qualify for 100% cashless mediclaim pre-authorization with all leading insurance TPAs.'
                        }
                      ];

                      const defaultIcons = [
                        <FaqCalendarIcon />,
                        <FaqDocumentIcon />,
                        <FaqShieldLockIcon />,
                        <FaqRescheduleIcon />,
                        <FaqInsuranceIcon />
                      ];

                      const defaultCategories = [
                        'Booking & Schedule',
                        'Clinic Preparation',
                        'Privacy & Security',
                        'Rescheduling Policy',
                        'Cashless Insurance'
                      ];

                      const specificDoctorFaqs = (faqs || [])
                        .filter(f => f.isActive && f.targetType === 'doctor' && (
                          (f.targetId && (String(f.targetId) === String(doctor.id || doctor._id))) ||
                          (f.targetName && doctor.name && f.targetName.toLowerCase() === doctor.name.toLowerCase())
                        ))
                        .map((f, i) => ({
                          icon: defaultIcons[i % defaultIcons.length],
                          category: f.category || defaultCategories[i % defaultCategories.length] || 'Doctor FAQ',
                          q: f.question,
                          a: f.answer
                        }));

                      const embeddedDocFaqs = (Array.isArray(doctor?.faqs) && doctor.faqs.length > 0)
                        ? doctor.faqs.map((f, i) => ({
                            icon: defaultIcons[(specificDoctorFaqs.length + i) % defaultIcons.length],
                            category: f.category || defaultCategories[(specificDoctorFaqs.length + i) % defaultCategories.length] || 'General FAQ',
                            q: f.q || f.question,
                            a: f.a || f.answer,
                            steps: f.steps,
                            note: f.note
                          }))
                        : (specificDoctorFaqs.length > 0 ? [] : defaultDoctorFaqs);

                      const faqsToRender = [...specificDoctorFaqs, ...embeddedDocFaqs];

                      return faqsToRender.map((faq, idx) => {
                        const isOpen = expandedFaq === idx;
                        return (
                          <div key={idx} className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ''}`}>
                            <button
                              type="button"
                              className={styles.faqQuestionBtn}
                              onClick={() => setExpandedFaq(isOpen ? null : idx)}
                              aria-expanded={isOpen}
                            >
                              <div className={styles.faqItemIconWrap}>
                                {faq.icon}
                              </div>
                              <div className={styles.faqQuestionTextWrap}>
                                {faq.category && (
                                  <span className={styles.faqCategoryBadge}>{faq.category}</span>
                                )}
                                <span className={styles.faqQuestionText}>{faq.q}</span>
                              </div>
                              <div className={styles.faqChevronWrap}>
                                <ChevronDown
                                  size={19}
                                  className={`${styles.faqChevron} ${isOpen ? styles.faqChevronOpen : ''}`}
                                />
                              </div>
                            </button>
                            {isOpen && (
                              <div className={styles.faqAnswer}>
                                {Array.isArray(faq.steps) && faq.steps.length > 0 && (
                                  <div className={styles.faqStepsContainer}>
                                    {faq.steps.map((step, sIdx) => (
                                      <div key={sIdx} className={styles.faqStepRow}>
                                        <span className={styles.faqStepNumBadge}>{sIdx + 1}</span>
                                        <span className={styles.faqStepText}>{step}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {faq.a && <p className={styles.faqAnswerText}>{faq.a}</p>}
                                {faq.note && (
                                  <div className={styles.faqNoteBox}>
                                    <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0 }} />
                                    <span>{faq.note}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Verified Patient Reviews */}
            <div className={styles.reviewsCard}>
              <div className={styles.reviewsHeader}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span className={styles.categoryBadge}>Patient Experiences</span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                    Patient Reviews & Feedback
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#64748b' }}>
                    Authentic ratings and verified recovery stories from patients treated by {doctor.name}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                  <div className={styles.ratingSummary}>
                    <div className={styles.ratingScoreBig}>
                      {doctorReviews.length > 0
                        ? (doctorReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / doctorReviews.length).toFixed(1)
                        : '0'}
                    </div>
                    <div>
                      <div className={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={16}
                            fill={doctorReviews.length > 0 && s <= Math.round(Number(avgRating)) ? 'currentColor' : '#e2e8f0'}
                            color={doctorReviews.length > 0 && s <= Math.round(Number(avgRating)) ? 'currentColor' : '#cbd5e1'}
                          />
                        ))}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                        {doctorReviews.length > 0 ? `Based on ${doctorReviews.length} verified patient ratings` : 'No patient ratings yet'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={styles.writeReviewBtn}
                    onClick={() => setIsWriteReviewOpen(true)}
                  >
                    <Star size={16} fill="currentColor" />
                    <span>Write a Review</span>
                  </button>
                </div>
              </div>

              {doctorReviews.length > 0 ? (
                <div className={styles.reviewsGrid}>
                  {doctorReviews.map((rev) => (
                    <div key={rev.id || rev._id} className={styles.reviewItemCard}>
                      <div>
                        <div className={styles.reviewTop}>
                          <div>
                            <div className={styles.reviewerName}>
                              <span>{rev.patientName}</span>
                              {rev.isVerified && (
                                <span title="Verified Patient Experience" style={{ display: 'inline-flex', alignItems: 'center', color: '#059669' }}>
                                  <CheckCircle2 size={15} />
                                </span>
                              )}
                            </div>
                            {rev.patientCity && <div className={styles.reviewerCity}>{rev.patientCity}</div>}
                          </div>

                          <div style={{ display: 'flex', gap: '2px', color: '#f59e0b' }}>
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                size={14}
                                fill={s <= Number(rev.rating) ? 'currentColor' : '#e2e8f0'}
                                color={s <= Number(rev.rating) ? 'currentColor' : '#cbd5e1'}
                              />
                            ))}
                          </div>
                        </div>

                        {rev.title && (
                          <h4 style={{ margin: '12px 0 6px', fontSize: '0.98rem', fontWeight: 700, color: '#0f172a' }}>
                            {rev.title}
                          </h4>
                        )}

                        <p className={styles.reviewComment}>{rev.comment}</p>
                      </div>

                      <div className={styles.reviewTags}>
                        {rev.treatment && (
                          <span className={styles.reviewTagPill}>
                            🩺 {rev.treatment}
                          </span>
                        )}
                        {rev.insuranceUsed && (
                          <span className={styles.reviewTagPill}>
                            🛡️ {rev.insuranceUsed} Cashless
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '36px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#2563eb' }}>
                    <Star size={24} />
                  </div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', color: '#0f172a', fontWeight: 700 }}>
                    Patient Reviews
                  </h4>
                  <p style={{ margin: '0 0 16px 0', fontSize: '0.88rem', color: '#64748b', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
                    Share your experience with Dr. {doctor.name || 'this doctor'} to help other patients.
                  </p>
                  <button
                    type="button"
                    className={styles.writeReviewBtn}
                    onClick={() => setIsWriteReviewOpen(true)}
                  >
                    <Star size={16} fill="currentColor" />
                    <span>Write the First Review</span>
                  </button>
                </div>
              )}
            </div>
        </div>
      </Container>

      {/* Reel Pop up Modal on Same Page - Clean Native Video Player */}
      {activeReel && (() => {
        const rawTarget = typeof activeReel === 'object' ? (activeReel.url || activeReel.embedUrl) : activeReel;
        const isDirect = rawTarget && (rawTarget.includes('cloudinary.com') || /\.(mp4|webm|mov)(\?.*)?$/i.test(rawTarget));
        const coverSrc = typeof activeReel === 'object' ? (activeReel.coverPhoto || activeReel.primaryCover || '') : '';
        const modalVideoSrc = isDirect ? rawTarget : `${API_BASE}/reel-video?url=${encodeURIComponent(rawTarget)}`;

        return (
          <div className={styles.modalOverlay} onClick={() => setActiveReel(null)}>
            <div 
              className={styles.modalContent} 
              onClick={e => e.stopPropagation()} 
              style={{ 
                maxWidth: '430px', 
                width: '92%', 
                background: '#000000',
                borderRadius: '20px', 
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
                position: 'relative',
                padding: 0
              }}
            >
              {/* Floating Close Button */}
              <button 
                type="button" 
                onClick={() => setActiveReel(null)} 
                aria-label="Close"
                title="Close"
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  zIndex: 30,
                  background: 'rgba(0, 0, 0, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#ffffff',
                  backdropFilter: 'blur(6px)',
                  transition: 'all 0.2s'
                }}
              >
                <X size={20} />
              </button>

              <div style={{ width: '100%', height: '76vh', maxHeight: '680px', minHeight: '480px', background: '#000000', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <video
                  key={modalVideoSrc}
                  src={modalVideoSrc}
                  poster={coverSrc}
                  autoPlay
                  playsInline
                  controls
                  controlsList="nodownload"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    background: '#000000',
                    display: 'block'
                  }}
                />
              </div>
            </div>
          </div>
        );
      })()}

      {/* Video Modal */}
      {activeVideo && (
        <div className={styles.modalOverlay} onClick={() => setActiveVideo(null)}>
          <div className={styles.modalContent} style={{ aspectRatio: '16/9', width: '90%', maxWidth: '900px', height: 'auto' }} onClick={e => e.stopPropagation()}>
            <button className={styles.closeModal} onClick={() => setActiveVideo(null)}>
              <X size={30} />
            </button>
            <iframe src={`${activeVideo}?autoplay=1`} title="YouTube Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div className={styles.modalOverlay} onClick={() => !bookingStatus && setShowBookingModal(false)}>
          <div className={styles.bookingModalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.75rem', color: 'var(--color-heading)', marginBottom: '8px' }}>Confirm Appointment</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={doctor.image} alt={doctor.name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #2563eb' }} />
                  <div>
                    <h4 style={{ margin: 0, color: 'var(--color-heading)' }}>{doctor.name}</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                      {consultationType} • {dateOptions[selectedDateIdx]?.label} at {selectedTimeSlot}
                    </p>
                  </div>
                </div>
              </div>
              {!bookingStatus && (
                <button className={styles.closeModal} onClick={() => setShowBookingModal(false)} style={{ position: 'relative', top: '0', right: '0', padding: '8px', background: '#F3F4F6', borderRadius: '50%' }}>
                  <X size={20} color="#666" />
                </button>
              )}
            </div>
            
            {bookingStatus === 'success' ? (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <div style={{ color: '#10B981', marginBottom: '20px', background: '#D1FAE5', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '12px', color: 'var(--color-heading)' }}>Booking Confirmed!</h3>
                <p style={{ color: '#4B5563', marginBottom: '30px', fontSize: '1.05rem', lineHeight: '1.6' }}>
                  Your {consultationType.toLowerCase()} with <strong>Dr. {doctor.name.replace('Dr. ', '')}</strong> has been successfully scheduled for <strong>{dateOptions[selectedDateIdx]?.label} at {selectedTimeSlot}</strong>.
                </p>
                <button 
                  onClick={() => {
                    setShowBookingModal(false);
                    setBookingStatus(null);
                  }}
                  style={{ width: '100%', padding: '14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '1.05rem' }}
                >
                  Return to Profile
                </button>
              </div>
            ) : (
              <form onSubmit={submitBooking}>
                <h4 style={{ marginBottom: '16px', color: '#2563eb', borderBottom: '1px solid #E5E7EB', paddingBottom: '8px' }}>Patient Details</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151', fontSize: '0.95rem' }}>Full Name *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Rahul Sharma"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '1rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151', fontSize: '0.95rem' }}>Phone Number *</label>
                    <input 
                      type="tel" 
                      inputMode="numeric"
                      required 
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '1rem' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151', fontSize: '0.95rem' }}>Email Address *</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="your.email@example.com"
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                    style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '1rem' }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151', fontSize: '0.95rem' }}>Symptoms or Reason for Visit</label>
                  <textarea 
                    rows="3" 
                    placeholder="Briefly describe your symptoms or reason for consulting the doctor..."
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '1rem', resize: 'vertical' }}
                  />
                </div>

                <div style={{ background: '#F9FAFB', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#4B5563' }}>Consultation Mode</span>
                    <span style={{ fontWeight: '600' }}>{consultationType}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#4B5563' }}>Appointment Slot</span>
                    <span style={{ fontWeight: '600' }}>{dateOptions[selectedDateIdx]?.label} at {selectedTimeSlot}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #D1D5DB', paddingTop: '8px', marginTop: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#111827' }}>Total Consultation Fee</span>
                    <span style={{ fontWeight: '700', color: '#2563eb', fontSize: '1.2rem' }}>₹{doctor.price || doctor.fees}</span>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={bookingStatus === 'loading'}
                  style={{ width: '100%', padding: '14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '1.05rem' }}
                >
                  {bookingStatus === 'loading' ? 'Confirming Appointment...' : 'Confirm Appointment'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Write Review Modal */}
      {isWriteReviewOpen && (
        <WriteReviewModal
          isOpen={isWriteReviewOpen}
          onClose={() => setIsWriteReviewOpen(false)}
          onSuccess={() => {
            setIsWriteReviewOpen(false);
            if (typeof refreshReviews === 'function') {
              refreshReviews();
            }
          }}
          onNavigate={onNavigate}
          targetType="doctor"
          targetId={doctor._id || doctor.id}
          targetName={doctor.name}
        />
      )}
    </div>
  );
};

export default DoctorProfile;
