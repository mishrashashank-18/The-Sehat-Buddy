import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  Building2,
  Star,
  MapPin,
  Bed,
  ShieldCheck,
  Phone,
  Mail,
  Calendar,
  Play,
  X,
  VolumeX,
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
  CheckSquare,
  ExternalLink,
  MessageSquare,
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2
} from 'lucide-react';
import { useData } from '../../context/useData';
import { isDoctorInStarList, isDoctorAffiliatedWithHospital, matchesId } from '../../context/DataContext';
import { getHospitalVerifiedReviews, getHospitalRatingStats } from '../../utils/hospitalReviewUtils';
import Container from '../layout/Container';
import HospitalDirections from './HospitalDirections';
import HospitalInsuranceModal from '../insurance/HospitalInsuranceModal';
import HospitalBookingModal from './HospitalBookingModal';
import WriteReviewModal from '../reviews/WriteReviewModal';
import { getAuthenticatedPatient } from '../../utils/patientAuth';
import SpecialitiesProceduresSection from '../specialities/SpecialitiesProceduresSection';
import { getDoctorVerifiedReviews } from '../doctors/DoctorProfile';
import ExpandableReviewComment from '../common/ExpandableReviewComment';
import { API_BASE } from '../../services/api';
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

const FaqClockIcon = () => (
  <svg width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="18" cy="18" r="14" fill="#eff6ff" stroke="#2563eb" strokeWidth="2" />
    <polyline points="18,10 18,18 23,21" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const FaqBedIcon = () => (
  <svg width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="14" width="24" height="12" rx="2" fill="#e0e7ff" stroke="#4f46e5" strokeWidth="1.8" />
    <path d="M6 26V30M30 26V30M6 18V9" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="12" r="2.5" fill="#4f46e5" />
  </svg>
);

const FaqPhoneIcon = () => (
  <svg width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="18" cy="18" r="14" fill="#dcfce7" stroke="#16a34a" strokeWidth="2" />
    <path d="M23 21.5c-1.2 1.2-3 1.5-5.5-0.5s-1.8-4.2-0.5-5.5l1.5-1.5c0.4-0.4 0.9-0.4 1.3 0l1.8 1.8c0.4 0.4 0.4 0.9 0 1.3l-0.8 0.8c0.8 1.5 1.7 2.4 3.2 3.2l0.8-0.8c0.4-0.4 0.9-0.4 1.3 0l1.8 1.8c0.4 0.4 0.4 0.9 0 1.3l-2 2z" fill="#16a34a" />
  </svg>
);

const FaqHeartIcon = () => (
  <svg width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="18" cy="18" r="14" fill="#ffe4e6" stroke="#e11d48" strokeWidth="2" />
    <path d="M18 24l-6.5-6.5a4 4 0 0 1 5.6-5.6l.9.9.9-.9a4 4 0 0 1 5.6 5.6L18 24z" fill="#e11d48" />
  </svg>
);

const FaqHelpCircleIcon = () => (
  <svg width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="18" cy="18" r="14" fill="#f1f5f9" stroke="#475569" strokeWidth="2" />
    <text x="18" y="24" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#475569">?</text>
  </svg>
);

const FAQ_ICONS = [
  FaqCreditCardIcon,
  FaqDocumentIcon,
  FaqEmergencySirenIcon,
  FaqDoctorAvatarIcon,
  FaqShieldCheckIcon,
  FaqMapPinIcon,
  FaqClockIcon,
  FaqBedIcon,
  FaqPhoneIcon,
  FaqHeartIcon,
  FaqHelpCircleIcon
];

const FAQ_ICON_MAP = {
  'credit-card': FaqCreditCardIcon,
  'document': FaqDocumentIcon,
  'emergency': FaqEmergencySirenIcon,
  'doctor': FaqDoctorAvatarIcon,
  'shield': FaqShieldCheckIcon,
  'clock': FaqClockIcon,
  'bed': FaqBedIcon,
  'phone': FaqPhoneIcon,
  'heart': FaqHeartIcon,
  'help-circle': FaqHelpCircleIcon
};

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

const formatSocialUrl = (url, platform) => {
  if (!url) return '#';
  const trimmed = String(url).trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (trimmed.startsWith('@')) {
    const handle = trimmed.slice(1);
    return platform === 'instagram'
      ? `https://www.instagram.com/${handle}`
      : `https://www.facebook.com/${handle}`;
  }
  return `https://${trimmed}`;
};

const getInstagramEmbedUrl = (url) => {
  if (!url) return '';
  const match = String(url).match(/instagram\.com\/(?:reel|reels|p|tv|share\/reel)\/([^/?#&]+)/i);
  if (match && match[1]) {
    return `https://www.instagram.com/reel/${match[1]}/embed/`;
  }
  const clean = String(url).split('?')[0].replace(/\/+$/, '');
  return `${clean}/embed/`;
};

const isDirectVideoUrl = (url) => {
  if (!url) return false;
  return (
    String(url).includes('cloudinary.com') ||
    /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(String(url))
  );
};

const HospitalReelCard = ({ reelItem, idx, onOpen }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const isHoveredRef = useRef(false);
  const leaveTimerRef = useRef(null);
  const [directVideoUrl, setDirectVideoUrl] = useState('');

  const rawUrl = typeof reelItem === 'object' ? (reelItem.url || '') : reelItem;
  const coverPhoto = typeof reelItem === 'object' ? (reelItem.coverPhoto || '') : '';
  const shortcodeMatch = String(rawUrl).match(/instagram\.com\/(?:reel|reels|p|tv|share\/reel)\/([^/?#&]+)/i);
  const shortcode = shortcodeMatch ? shortcodeMatch[1] : '';
  const effectiveCover = coverPhoto || (rawUrl ? `${API_BASE}/reel-cover?url=${encodeURIComponent(rawUrl)}` : '');

  const isDirect = isDirectVideoUrl(rawUrl);

  useEffect(() => {
    let active = true;
    if (!rawUrl) return;
    if (isDirect) {
      setDirectVideoUrl(rawUrl);
      return;
    }
    fetch(`${API_BASE}/reel-video?json=true&url=${encodeURIComponent(rawUrl)}`)
      .then(r => r.json())
      .then(data => {
        if (active && data.success && data.videoUrl) {
          setDirectVideoUrl(data.videoUrl);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, [rawUrl, isDirect]);

  const videoSrc = directVideoUrl || (isDirect ? rawUrl : `${API_BASE}/reel-video?url=${encodeURIComponent(rawUrl)}`);

  const handleMouseEnter = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    isHoveredRef.current = true;
    if (videoRef.current && !videoError) {
      setHasStarted(true);
      if (!isPlaying) {
        setIsLoading(true);
      }
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            if (isHoveredRef.current) {
              setIsPlaying(true);
            } else if (videoRef.current) {
              videoRef.current.pause();
              setIsPlaying(false);
            }
          })
          .catch((err) => {
            if (err.name !== 'AbortError') {
              console.warn('Reel hover preview autoplay error:', err);
            }
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    }
  };

  const handleMouseLeave = () => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    leaveTimerRef.current = setTimeout(() => {
      isHoveredRef.current = false;
      if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
        setIsLoading(false);
      }
    }, 120);
  };

  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  return (
    <div
      className={styles.reelCard}
      onClick={() => onOpen(reelItem)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title="Hover to preview, click to watch with sound"
      style={{
        background: 'linear-gradient(145deg, #090d16 0%, #1e293b 100%)',
        position: 'relative'
      }}
    >
      {/* Background/Cover Image (visible when paused) */}
      {effectiveCover && (
        <img
          src={effectiveCover}
          alt="Instagram Reel"
          className={styles.reelCoverImg}
          loading="eager"
          style={{
            opacity: isPlaying ? 0 : 1,
            transition: 'opacity 0.25s ease',
            pointerEvents: 'none',
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      )}

      {/* Hover Video Element */}
      {videoSrc && !videoError && (
        <video
          ref={videoRef}
          src={videoSrc}
          poster={coverPhoto || effectiveCover}
          muted
          playsInline
          loop
          preload="auto"
          className={styles.reelHoverVideo}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isPlaying ? 1 : 0,
            transition: 'opacity 0.3s ease',
            zIndex: 1,
            pointerEvents: 'none'
          }}
          onPlay={() => setIsPlaying(true)}
          onError={() => setVideoError(true)}
        />
      )}

      {/* Gradient shadow scrim overlay */}
      <div className={styles.reelGradientScrim} style={{ zIndex: 2, pointerEvents: 'none' }} />

      {/* Top Badge: Instagram Tag / Playing Status */}
      <div className={styles.reelTopBadge} style={{ zIndex: 3, pointerEvents: 'none' }}>
        <SocialInstagramIcon size={14} />
        <span>{isPlaying ? 'Playing' : 'Reel'}</span>
      </div>
    </div>
  );
};

// Robust Modal Video Player component for HospitalProfile with reliable sound handling
const HospitalReelModalPlayer = ({ activeReel, onClose }) => {
  const videoRef = useRef(null);
  const [videoError, setVideoError] = useState(false);
  const [directVideoUrl, setDirectVideoUrl] = useState('');
  const [isMuted, setIsMuted] = useState(false);

  const rawTarget = typeof activeReel === 'object' ? (activeReel.url || activeReel.embedUrl) : activeReel;
  const isDirect = isDirectVideoUrl(rawTarget);
  const coverSrc = typeof activeReel === 'object' 
    ? (activeReel.coverPhoto || activeReel.primaryCover || '') 
    : (rawTarget ? `${API_BASE}/reel-cover?url=${encodeURIComponent(rawTarget)}` : '');

  useEffect(() => {
    let active = true;
    if (!rawTarget) return;
    if (isDirect) {
      setDirectVideoUrl(rawTarget);
      return;
    }
    fetch(`${API_BASE}/reel-video?json=true&url=${encodeURIComponent(rawTarget)}`)
      .then(r => r.json())
      .then(data => {
        if (active && data.success && data.videoUrl) {
          setDirectVideoUrl(data.videoUrl);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, [rawTarget, isDirect]);

  const modalVideoSrc = directVideoUrl || (isDirect ? rawTarget : `${API_BASE}/reel-video?url=${encodeURIComponent(rawTarget)}`);

  const toggleMute = useCallback((e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (videoRef.current) {
      const nextMuted = !videoRef.current.muted;
      videoRef.current.muted = nextMuted;
      if (!nextMuted) {
        videoRef.current.volume = 1;
        videoRef.current.play().catch(() => {});
      }
      setIsMuted(nextMuted);
    }
  }, []);

  const handleVideoClick = useCallback(() => {
    if (isMuted && videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.volume = 1;
      setIsMuted(false);
    }
  }, [isMuted]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, toggleMute]);

  useEffect(() => {
    setVideoError(false);
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.volume = 1;
      const p = videoRef.current.play();
      if (p !== undefined) {
        p.then(() => {
          setIsMuted(false);
        }).catch(() => {
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
            videoRef.current.play().catch(() => {});
          }
        });
      }
    }
  }, [modalVideoSrc]);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
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
        {/* Close button */}
        <button 
          type="button" 
          onClick={onClose} 
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

        <div 
          onClick={handleVideoClick}
          style={{ width: '100%', height: '76vh', maxHeight: '680px', minHeight: '480px', background: '#000000', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {(!videoError && modalVideoSrc && (modalVideoSrc.includes('.mp4') || modalVideoSrc.includes('cloudinary.com') || modalVideoSrc.startsWith('blob:'))) ? (
            <>
              <video
                ref={videoRef}
                key={modalVideoSrc}
                src={modalVideoSrc}
                poster={coverSrc}
                playsInline
                preload="auto"
                controls
                controlsList="nodownload"
                onVolumeChange={() => {
                  if (videoRef.current) {
                    setIsMuted(videoRef.current.muted || videoRef.current.volume === 0);
                  }
                }}
                onError={() => setVideoError(true)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  background: '#000000',
                  display: 'block'
                }}
              />

              {isMuted && (
                <button
                  type="button"
                  onClick={toggleMute}
                  style={{
                    position: 'absolute',
                    bottom: '68px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 25,
                    background: 'rgba(15, 23, 42, 0.9)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    borderRadius: '9999px',
                    padding: '8px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(8px)',
                    letterSpacing: '0.02em',
                    userSelect: 'none'
                  }}
                >
                  <VolumeX size={18} color="#f43f5e" />
                  <span>Tap to Unmute</span>
                </button>
              )}
            </>
          ) : (
            <iframe
              src={(() => {
                const match = String(rawTarget).match(/instagram\.com\/(?:reel|reels|p|tv|share\/reel)\/([^/?#&]+)/i);
                return match ? `https://www.instagram.com/reel/${match[1]}/embed/` : getEmbedUrl(rawTarget);
              })()}
              title="Instagram Reel Player"
              scrolling="no"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              style={{ width: '100%', height: '100%', border: 'none', background: '#000000' }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const HospitalProfile = ({ hospitalId, onNavigate }) => {
  const { hospitals, doctors, reviews, refreshReviews, deleteReview, faqs, faqSymbols = [], user } = useData();

  const isAdmin = useMemo(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u.role === 'admin' || u.isAdmin || u.type === 'admin') return true;
      }
      if (localStorage.getItem('admin_logged_in') === 'true') return true;
      if (localStorage.getItem('admin_token')) return true;
    } catch {
      return false;
    }
    return false;
  }, []);

  const [deletingReviewId, setDeletingReviewId] = useState(null);

  const handleDeleteReview = async (rev) => {
    const revId = rev._id || rev.id;
    if (!window.confirm(`Are you sure you want to permanently delete this review by ${rev.patientName || 'this patient'}?`)) {
      return;
    }
    try {
      setDeletingReviewId(revId);
      await deleteReview(rev);
      if (typeof refreshReviews === 'function') {
        refreshReviews();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete review');
    } finally {
      setDeletingReviewId(null);
    }
  };
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
        document.body.appendChild(script);
      } else {
        try {
          window.instgrm.Embeds.process();
        } catch {
          // ignore
        }
      }
    }
  }, [activeReel]);
  const hospital = hospitals.find(h => 
    String(h.id) === String(hospitalId) || 
    String(h._id) === String(hospitalId) ||
    (h.email && String(hospitalId).includes('@') && h.email.toLowerCase() === String(hospitalId).toLowerCase())
  ) || hospitals[0];

  // Gallery Photos for Slider & Showcase
  const defaultFacilityPhotos = useMemo(() => [
    {
      url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80',
      title: 'Executive Reception & Outpatient Lounge',
      category: 'Reception'
    },
    {
      url: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1200&q=80',
      title: 'Advanced Intensive Care Unit (ICU)',
      category: 'Critical Care'
    },
    {
      url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80',
      title: 'Ultra-Modern Modular Operation Theater',
      category: 'Operation Theater'
    },
    {
      url: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=1200&q=80',
      title: 'Inpatient Deluxe Suite & Patient Care',
      category: 'Inpatient Suite'
    },
    {
      url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80',
      title: 'Diagnostic Imaging, MRI & Radiology Center',
      category: 'Radiology'
    }
  ], []);

  const allHospitalPhotos = useMemo(() => {
    const list = [];
    if (hospital?.image) {
      list.push({
        url: hospital.image,
        title: `${hospital?.name || 'Hospital'} - Main Campus & Exterior`,
        category: 'Exterior'
      });
    }

    if (Array.isArray(hospital?.photos) && hospital.photos.length > 0) {
      hospital.photos.forEach((item, idx) => {
        const url = typeof item === 'string' ? item : item.url;
        if (!url || (hospital?.image && url === hospital.image)) return;
        list.push({
          url,
          title: (typeof item === 'object' && item.title) ? item.title : `Facility View #${idx + 1}`,
          category: (typeof item === 'object' && item.category) ? item.category : 'Facility'
        });
      });
    }

    return list;
  }, [hospital]);

  const [activePhotoIndex, setActivePhotoIndex] = useState(null);
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

  // Keyboard navigation for photo lightbox
  useEffect(() => {
    if (activePhotoIndex === null) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActivePhotoIndex(null);
      } else if (e.key === 'ArrowLeft') {
        setActivePhotoIndex(prev => {
          if (prev === null) return null;
          return (prev - 1 + allHospitalPhotos.length) % allHospitalPhotos.length;
        });
      } else if (e.key === 'ArrowRight') {
        setActivePhotoIndex(prev => {
          if (prev === null) return null;
          return (prev + 1) % allHospitalPhotos.length;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePhotoIndex, allHospitalPhotos.length]);

  // Map & Directions state
  const [showDirections, setShowDirections] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // Hospital appointment booking state
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [preselectedDept, setPreselectedDept] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showReviewLoginPrompt, setShowReviewLoginPrompt] = useState(false);

  const handleOpenBooking = (dept = null) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    let userObj = null;
    try {
      const u = localStorage.getItem('user');
      if (u) userObj = JSON.parse(u);
    } catch {}

    if (!token && !userObj && !user) {
      setPreselectedDept(dept);
      setShowLoginPrompt(true);
      return;
    }
    setPreselectedDept(dept);
    setIsBookingModalOpen(true);
  };

  const handleOpenWriteReview = () => {
    const { isLoggedIn } = getAuthenticatedPatient();
    if (!isLoggedIn) {
      setShowReviewLoginPrompt(true);
      return;
    }
    setIsWriteReviewModalOpen(true);
  };

  // About facility expansion state
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);

  // Auto-open booking modal or write review modal if arriving with pending action
  React.useEffect(() => {
    if (localStorage.getItem('autoOpenHospitalBooking') === 'true') {
      setIsBookingModalOpen(true);
      localStorage.removeItem('autoOpenHospitalBooking');
    }
    if (localStorage.getItem('open_write_review') === 'true') {
      const { isLoggedIn } = getAuthenticatedPatient();
      if (isLoggedIn) {
        setIsWriteReviewModalOpen(true);
      }
      localStorage.removeItem('open_write_review');
    }
  }, [hospitalId]);

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


  // Filtered reviews belonging strictly to this hospital
  const hospitalReviews = useMemo(() => {
    return getHospitalVerifiedReviews(hospital, reviews);
  }, [reviews, hospital]);

  const { avg: avgRating, reviewsText: reviewsCountText } = useMemo(() => {
    return getHospitalRatingStats(hospital, reviews);
  }, [reviews, hospital]);

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

  // Collect reels: ONLY show real videos added by hospital/admin, NO dummy video padding
  const rawHospitalReels = Array.isArray(hospital.reels)
    ? hospital.reels
    : (typeof hospital.reels === 'string' && hospital.reels.trim()
        ? (hospital.reels.includes('http') ? hospital.reels.trim().split(/\s+/).filter(u => u.startsWith('http')) : hospital.reels.split(',').map(s => s.trim()).filter(Boolean))
        : []);
  const parsedReels = rawHospitalReels
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
    .filter(Boolean);

  // Collect YouTube videos: ONLY show real videos added by hospital/admin, NO dummy video padding
  const rawHospitalVideos = Array.isArray(hospital.youtube_videos)
    ? hospital.youtube_videos
    : (typeof hospital.youtube_videos === 'string' && hospital.youtube_videos.trim()
        ? (hospital.youtube_videos.includes('http') ? hospital.youtube_videos.trim().split(/\s+/).filter(u => u.startsWith('http')) : hospital.youtube_videos.split(',').map(s => s.trim()).filter(Boolean))
        : []);

  const displayVideos = rawHospitalVideos
    .map(v => {
      if (typeof v === 'string') return v.trim() ? { url: v.trim(), coverPhoto: '' } : null;
      if (v && typeof v === 'object') {
        const url = (v.url || '').trim();
        const coverPhoto = (v.coverPhoto || '').trim();
        return url ? { url, coverPhoto } : null;
      }
      return null;
    })
    .filter(Boolean);

  // Alias for nav tab usage
  const displayReels = parsedReels;

  // Resolve star doctors for this hospital center (all designated star doctors)
  let starDoctorsList = [];
  if (Array.isArray(hospital?.star_doctors) && hospital.star_doctors.length > 0) {
    starDoctorsList = hospital.star_doctors.map(sd => {
      if (!sd) return null;

      // 1. Check if matching doctor exists in global doctors collection
      const matchedGlobal = (doctors || []).find(d => isDoctorInStarList(d, [sd]));
      if (matchedGlobal) {
        return {
          ...matchedGlobal,
          id: matchedGlobal._id || matchedGlobal.id,
          _id: matchedGlobal._id || matchedGlobal.id,
          specialty: matchedGlobal.specialization || matchedGlobal.specialty || 'Specialist',
          price: matchedGlobal.fees || matchedGlobal.price || 750,
          experience: typeof matchedGlobal.experience === 'number' ? `${matchedGlobal.experience}+ Years Experience` : (matchedGlobal.experience || '10+ Years Experience')
        };
      }

      // 2. If sd is already a populated doctor object from backend
      if (typeof sd === 'object' && sd !== null && (sd._id || sd.id || sd.name)) {
        return {
          ...sd,
          id: sd._id || sd.id,
          _id: sd._id || sd.id,
          specialty: sd.specialization || sd.specialty || 'Specialist',
          price: sd.fees || sd.price || 750,
          experience: typeof sd.experience === 'number' ? `${sd.experience}+ Years Experience` : (sd.experience || '10+ Years Experience')
        };
      }

      // 3. Fallback: check hospital staff_doctors
      if (hospital.staff_doctors) {
        const staffDoc = hospital.staff_doctors.find(staff => {
          if (typeof staff === 'string') return staff.toLowerCase().trim() === String(sd).toLowerCase().trim();
          return (staff.email && String(sd).toLowerCase().trim() === staff.email.toLowerCase().trim()) ||
                 (staff.name && String(sd).toLowerCase().trim() === staff.name.toLowerCase().trim());
        });
        if (staffDoc) {
          const sEmail = (typeof staffDoc === 'string' ? staffDoc : staffDoc.email).toLowerCase().trim();
          return {
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

      return null;
    }).filter(Boolean);
  }

  // Fallback: If no explicit star doctors were selected, display doctors affiliated with this hospital
  if (starDoctorsList.length === 0 && doctors && doctors.length > 0 && hospital) {
    starDoctorsList = doctors
      .filter(d => isDoctorAffiliatedWithHospital(d, hospital))
      .map(matchedGlobal => ({
        ...matchedGlobal,
        id: matchedGlobal._id || matchedGlobal.id,
        _id: matchedGlobal._id || matchedGlobal.id,
        specialty: matchedGlobal.specialization || matchedGlobal.specialty || 'Specialist',
        price: matchedGlobal.fees || matchedGlobal.price || 750,
        experience: typeof matchedGlobal.experience === 'number' ? `${matchedGlobal.experience}+ Years Experience` : (matchedGlobal.experience || '10+ Years Experience')
      }));
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
            <div
              className={styles.imageWrapper}
              onClick={() => {
                if (allHospitalPhotos.length > 0) setActivePhotoIndex(0);
              }}
              title={allHospitalPhotos.length > 0 ? "Click to view all facility photos" : "No photos uploaded yet"}
              role={allHospitalPhotos.length > 0 ? "button" : undefined}
              tabIndex={allHospitalPhotos.length > 0 ? 0 : undefined}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && allHospitalPhotos.length > 0) {
                  e.preventDefault();
                  setActivePhotoIndex(0);
                }
              }}
            >
              {hospital.image ? (
                <img
                  src={hospital.image}
                  alt={hospital.name}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                style={{
                  display: hospital.image ? 'none' : 'flex',
                  width: '100%',
                  height: '100%',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  color: '#94a3b8',
                  gap: '8px'
                }}
              >
                <Building2 size={48} color="#94a3b8" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>No facility photo uploaded</span>
              </div>

              {/* Plus Option to open photo popup and slide photos */}
              {allHospitalPhotos.length > 0 && (
                <button
                  type="button"
                  className={styles.photoPlusBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePhotoIndex(0);
                  }}
                  aria-label="View all photos"
                  title="View all photos"
                >
                  <div className={styles.photoPlusIconCircle}>
                    <Plus size={14} strokeWidth={2.8} />
                  </div>
                  <span className={styles.photoPlusText}>{allHospitalPhotos.length} Photos</span>
                </button>
              )}

              <div className={styles.cityBadge}>
                <MapPin size={13} /> {hospital.city ? hospital.city.replace(/,\s*Karnataka,\s*Karnataka/gi, ', Karnataka').replace(/,\s*Karnataka/gi, '') + ', Karnataka' : 'Bengaluru, Karnataka'}
              </div>
            </div>

            {/* Official Social Media Links Below Hospital Image */}
            {(hospital.instagram || hospital.facebook) && (
              <div className={styles.heroSocialLinks}>
                {hospital.instagram && (
                  <a
                    href={formatSocialUrl(hospital.instagram, 'instagram')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles.socialIconBtn} ${styles.socialInstagram}`}
                    title="Visit Official Instagram Profile"
                    aria-label="Instagram Profile"
                  >
                    <SocialInstagramIcon size={19} />
                  </a>
                )}
                {hospital.facebook && (
                  <a
                    href={formatSocialUrl(hospital.facebook, 'facebook')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles.socialIconBtn} ${styles.socialFacebook}`}
                    title="Visit Official Facebook Page"
                    aria-label="Facebook Page"
                  >
                    <SocialFacebookIcon size={19} />
                  </a>
                )}
              </div>
            )}

            <div className={styles.contactCard}>
              <a href={`tel:${hospital.phone || '+9118001023222'}`} className={styles.contactItem} title="Call Emergency & Helpdesk">
                <div className={styles.contactIconCirclePhone}>
                  <Phone size={15} />
                </div>
                <div className={styles.contactItemText}>
                  <span className={styles.contactLabel}>Hospital Helpdesk</span>
                  <strong>{hospital.phone || '+91 1800 102 3222'}</strong>
                </div>
              </a>
              <a href={`mailto:${hospital.email || 'info@manipalhd.com'}`} className={styles.contactItem} title="Send Email Enquiry">
                <div className={styles.contactIconCircleMail}>
                  <Mail size={15} />
                </div>
                <div className={styles.contactItemText}>
                  <span className={styles.contactLabel}>Enquiry Desk</span>
                  <strong>{hospital.email || 'info@manipalhd.com'}</strong>
                </div>
              </a>
              <div className={styles.contactItem}>
                <div className={styles.contactIconCircleClock}>
                  <Clock size={15} />
                </div>
                <div className={styles.contactItemText}>
                  <span className={styles.contactLabel}>Availability</span>
                  <strong>24x7 Emergency Ready</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Details, Actions, Specialties & About */}
          <div className={styles.infoCol}>
            <div className={styles.headerRow}>
              <div className={styles.titleSection}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <h1 className={styles.hospitalTitle}>{hospital.name}</h1>
                  {user?.role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => onNavigate && onNavigate('admin-edit-hospital', hospital.id || hospital._id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        border: '1px solid #bfdbfe',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                      title="Edit Hospital details in Admin Panel"
                    >
                      <Edit3 size={13} />
                      <span>Edit (Admin)</span>
                    </button>
                  )}
                </div>
                <div className={styles.verifiedPill}>
                  <ShieldCheck size={15} /> {hospital.isVerified !== false ? 'Verified Healthcare Partner' : 'Standard Healthcare Listing'}
                </div>
              </div>
              <div className={styles.rating}>
                <Star size={16} fill="#EAB308" color="#EAB308" />
                <span>{avgRating}</span>
                <span className={styles.reviewCount}>
                  ({reviewsCountText})
                </span>
              </div>
            </div>

            <div className={styles.locationActionRow}>
              <div className={styles.infoLeftBlock}>
                <div className={styles.addressRow}>
                  <div className={styles.addressPinWrapper}>
                    <MapPin size={15} />
                  </div>
                  <span>{hospital.address || '98, HAL Old Airport Road, Kodihalli, Bengaluru, Karnataka 560017'}</span>
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
                    <span>{hospital.emergency24x7 !== false ? '24x7 Trauma & ER Ready' : 'Emergency Restricted'}</span>
                  </div>
                  <div className={styles.statPillEst}>
                    <Calendar size={16} />
                    <span>Est. {hospital.establishedYear || 2000}</span>
                  </div>
                </div>
              </div>

              <div className={styles.headerActionsStack}>
                <button
                  type="button"
                  className={styles.bookHospitalBtn}
                  onClick={() => handleOpenBooking(null)}
                  title="Book appointment or hospital visit at this medical center"
                >
                  <Calendar size={15} />
                  <span>Book Appointment</span>
                </button>
                <button
                  type="button"
                  className={styles.insuranceBtn}
                  onClick={() => setIsInsuranceModalOpen(true)}
                  title="Search all available insurances in this hospital"
                >
                  <CheckSquare size={15} />
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
                      <Loader2 size={15} className={styles.spinIcon} />
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

            <div className={styles.specialtiesSection}>
              <div className={styles.sectionSubLabel}>DEPARTMENTS & KEY SPECIALTIES</div>
              <div className={styles.specialtiesWrap}>
                {(hospital.specialties && hospital.specialties.length > 0
                  ? hospital.specialties
                  : (hospital.specialities && hospital.specialities.length > 0
                      ? hospital.specialities
                      : ['Cardiology', 'Neurology', 'Orthopedics', 'Nephrology', 'General Surgery'])
                ).map((spec, i) => (
                  <span
                    key={i}
                    className={styles.modernSpecBadge}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleOpenBooking(spec)}
                    title={`Click to book appointment in ${spec}`}
                  >
                    <Stethoscope size={13} className={styles.specIcon} />
                    <span>{spec}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.aboutBox}>
              <div className={styles.sectionSubLabel}>ABOUT THIS FACILITY</div>
              {(() => {
                const aboutText = hospital.description ||
                  `${hospital.name} is a major multispecialty hospital in ${hospital.city || 'Bengaluru'} providing comprehensive medical and surgical care across a wide range of specialties. The hospital provides emergency and critical-care services and is part of the hospital network. Its location makes it accessible to several central and eastern neighbourhoods.`;

                const paragraphs = aboutText.trim().split(/\n\s*\n/).filter(Boolean);
                const isLong = aboutText.length > 200 || paragraphs.length > 1;

                return (
                  <>
                    <div className={`${styles.aboutTextWrap} ${!isAboutExpanded && isLong ? styles.aboutTextClamped : ''}`}>
                      {paragraphs.map((p, pIdx) => (
                        <p key={pIdx} style={pIdx > 0 ? { marginTop: '8px' } : undefined}>
                          {p}
                        </p>
                      ))}
                    </div>
                    {isLong && (
                      <button
                        type="button"
                        className={styles.aboutMoreBtn}
                        onClick={() => setIsAboutExpanded(!isAboutExpanded)}
                        aria-expanded={isAboutExpanded}
                      >
                        <span>{isAboutExpanded ? 'Show Less' : '+ More'}</span>
                        <ChevronDown
                          size={14}
                          className={`${styles.aboutChevron} ${isAboutExpanded ? styles.aboutChevronOpen : ''}`}
                        />
                      </button>
                    )}
                  </>
                );
              })()}
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
        {starDoctorsList.length > 0 && (
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
                      {(() => {
                        const docRevs = getDoctorVerifiedReviews(doc, reviews);
                        const score = docRevs.length > 0
                          ? (docRevs.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / docRevs.length).toFixed(1)
                          : (Number(doc.rating) > 0 ? Number(doc.rating).toFixed(1) : '0');
                        return (
                          <div className={styles.docRating}>
                            <Star size={12} fill={docRevs.length > 0 ? "#EAB308" : "#E2E8F0"} color={docRevs.length > 0 ? "#EAB308" : "#CBD5E1"} />
                            <span>{score}</span>
                          </div>
                        );
                      })()}
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
        )}

        {/* SECTION 2: SPECIALITIES & CLINICAL PROCEDURES */}
        <div id="hospital-specialities">
          <SpecialitiesProceduresSection onNavigate={onNavigate} />
        </div>

        {/* SECTION 3: INSTAGRAM REELS */}
        {parsedReels.length > 0 && (
          <div className={styles.mediaSection} id="hospital-media">
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
                <HospitalReelCard
                  key={idx}
                  reelItem={reelItem}
                  idx={idx}
                  onOpen={handleOpenReel}
                />
              ))}
            </div>
          </div>
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
              {displayVideos.map((videoItem, idx) => {
                const videoUrl = typeof videoItem === 'string' ? videoItem : videoItem.url;
                const coverPhoto = typeof videoItem === 'object' ? videoItem.coverPhoto : '';
                const embedUrl = getEmbedUrl(videoUrl);
                return (
                  <div
                    key={idx}
                    className={styles.youtubeCard}
                    onClick={() => setActiveVideo(embedUrl)}
                    title="Click to watch full video"
                  >
                    {coverPhoto ? (
                      <img
                        src={coverPhoto}
                        alt={`YouTube Video ${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <iframe
                        src={embedUrl}
                        title={`YouTube Video ${idx + 1}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    )}
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
        {/* SECTION 5: FREQUENTLY ASKED QUESTIONS (FAQS) */}
        <section className={styles.sectionBlock} id="hospital-faqs">
          <div className={styles.faqCard}>
            <div className={styles.faqLayoutGrid}>
              {/* Left Column: Context, Illustration & Hospital Support */}
              <div className={styles.faqSidebarCol}>
                <div className={styles.faqIllustrationWrap}>
                  <HospitalFaqIllustration />
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
                    Essential answers regarding 100% cashless mediclaim, patient admission, specialists, and visiting policies at {hospital.name}.
                  </p>
                  <div className={styles.faqVerifiedPill}>
                    <ShieldCheck size={14} color="#15803d" />
                    <span>Verified by {hospital.name}</span>
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
                      <p className={styles.faqSupportSub}>Our hospital care desk can assist with admissions, insurance or appointments.</p>
                    </div>
                  </div>
                  <div className={styles.faqSupportActions}>
                    <a href={`tel:${hospital.phone || '+911800123456'}`} className={styles.faqSupportPhoneBtn}>
                      <Phone size={14} />
                      <span>Call Hospital: {hospital.phone || '+91 1800 123 456'}</span>
                    </a>
                    <div className={styles.faqSupportHours}>
                      <Clock size={12} color="#64748b" />
                      <span>24x7 Helpline Available</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Accordions */}
              <div className={styles.faqAccordionCol}>
                <div className={styles.faqList}>
                  {(() => {
                    const defaultHospitalFaqCategories = [
                      'Cashless Insurance',
                      'Admission & Documents',
                      'Emergency Care',
                      'Star Doctors',
                      'Insurance & TPAs',
                      'Directions & Location'
                    ];

                    const faqsToRender = (faqs || [])
                      .filter(f => f.isActive && f.targetType === 'hospital' && (
                        (f.targetId && String(f.targetId) === String(hospital.id || hospital._id)) ||
                        (f.targetName && hospital.name && (
                          f.targetName.toLowerCase().includes(hospital.name.toLowerCase()) ||
                          hospital.name.toLowerCase().includes(f.targetName.toLowerCase())
                        ))
                      ))
                      .sort((a, b) => {
                        const orderA = a.order !== undefined && a.order !== null ? Number(a.order) : 999999;
                        const orderB = b.order !== undefined && b.order !== null ? Number(b.order) : 999999;
                        if (orderA !== orderB) return orderA - orderB;
                        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                      })
                      .map((f, i) => ({
                        category: f.category || defaultHospitalFaqCategories[i % defaultHospitalFaqCategories.length] || 'Hospital FAQ',
                        q: f.question,
                        a: f.answer,
                        icon: f.icon,
                        image: f.image,
                        steps: f.steps,
                        note: f.note
                      }));

                    if (faqsToRender.length === 0) return null;

                    return faqsToRender.map((faq, idx) => {
                      const isOpen = expandedHospitalFaq === idx;
                      const customSrc = faq.image || (faq.icon && (faq.icon.startsWith('http') || faq.icon.startsWith('data:image') || faq.icon.startsWith('/') || faq.icon.includes('.')) ? faq.icon : '');
                      const matchingDbSymbol = (!customSrc && faq.icon) ? faqSymbols.find(s => s.key === faq.icon) : null;

                      const FaqIcon = customSrc
                        ? () => <img src={customSrc} alt="FAQ Icon" style={{ width: '26px', height: '26px', objectFit: 'contain' }} />
                        : (matchingDbSymbol && (matchingDbSymbol.imageUrl || matchingDbSymbol.svg)
                          ? () => <img src={matchingDbSymbol.imageUrl || matchingDbSymbol.svg} alt={matchingDbSymbol.name} style={{ width: '26px', height: '26px', objectFit: 'contain' }} />
                          : ((faq.icon && FAQ_ICON_MAP[faq.icon]) ? FAQ_ICON_MAP[faq.icon] : FAQ_ICONS[idx % FAQ_ICONS.length]));
                      return (
                        <div key={idx} className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ''}`}>
                          <button
                            type="button"
                            className={styles.faqQuestionBtn}
                            onClick={() => setExpandedHospitalFaq(isOpen ? null : idx)}
                            aria-expanded={isOpen}
                          >
                            <div className={styles.faqItemIconWrap}>
                              <FaqIcon />
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
        </section>

        {/* SECTION 7: VERIFIED PATIENT REVIEWS */}
        <section className={styles.sectionBlock} id="hospital-reviews">
          <div className={styles.sectionHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
            <div className={styles.sectionTitleGroup}>
              <h2>
                <Star size={24} color="#f59e0b" />
                Verified Patient Reviews & Experiences
              </h2>
              <p>Real feedback from patients treated at {hospital.name}.</p>
            </div>
            <button
              type="button"
              className={styles.writeReviewBtn}
              onClick={handleOpenWriteReview}
              style={{
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#ffffff',
                border: 'none',
                padding: '9px 18px',
                borderRadius: '10px',
                fontSize: '0.86rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                transition: 'all 0.2s ease'
              }}
            >
              <Edit3 size={15} />
              <span>Write a Review</span>
            </button>
          </div>

          {/* Rating Summary Bar */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '20px 24px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            flexWrap: 'wrap',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{avgRating}</span>
              <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 600 }}>/ 5</span>
            </div>
            <div>
              <div style={{ display: 'flex', gap: '3px', marginBottom: '4px' }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <Star
                    key={s}
                    size={18}
                    fill={hospitalReviews.length > 0 && s <= Math.round(Number(avgRating)) ? '#f59e0b' : '#e2e8f0'}
                    color={hospitalReviews.length > 0 && s <= Math.round(Number(avgRating)) ? '#f59e0b' : '#cbd5e1'}
                  />
                ))}
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748b', fontWeight: 600 }}>
                {hospitalReviews.length > 0 
                  ? `Based on ${hospitalReviews.length} verified patient review${hospitalReviews.length === 1 ? '' : 's'}`
                  : 'No patient reviews yet (0 Reviews)'}
              </div>
            </div>
          </div>

          {hospitalReviews.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center', background: '#f8fafc', borderRadius: '14px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
              <p style={{ margin: '0 0 12px', fontSize: '0.95rem' }}>No patient reviews yet for {hospital.name}.</p>
              <button
                type="button"
                onClick={handleOpenWriteReview}
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Be the first to leave a review
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {hospitalReviews.map((rev) => (
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

                  <ExpandableReviewComment
                    comment={rev.comment}
                    maxLength={220}
                    style={{ margin: 0, fontSize: '0.88rem', color: '#475569', lineHeight: 1.55 }}
                  />

                  {rev.insuranceUsed && rev.insuranceUsed !== 'None' && rev.insuranceUsed !== 'None / Self-pay' && (
                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '8px', fontSize: '0.78rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ShieldCheck size={13} />
                      <span>Cashless via {rev.insuranceUsed}</span>
                    </div>
                  )}

                  {isAdmin && (
                    <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => handleDeleteReview(rev)}
                        disabled={deletingReviewId === (rev._id || rev.id)}
                        style={{
                          background: '#fef2f2',
                          border: '1px solid #fecaca',
                          borderRadius: '6px',
                          padding: '5px 10px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          color: '#dc2626',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="Delete this review permanently as Administrator"
                      >
                        <Trash2 size={13} />
                        {deletingReviewId === (rev._id || rev.id) ? 'Deleting...' : 'Delete Review (Admin)'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </Container>

      {/* Photo Lightbox Slider Modal */}
      {activePhotoIndex !== null && allHospitalPhotos[activePhotoIndex] && (() => {
        const currentPhoto = allHospitalPhotos[activePhotoIndex];
        const totalPhotos = allHospitalPhotos.length;

        const handlePrev = (e) => {
          if (e) e.stopPropagation();
          setActivePhotoIndex((prev) => (prev - 1 + totalPhotos) % totalPhotos);
        };

        const handleNext = (e) => {
          if (e) e.stopPropagation();
          setActivePhotoIndex((prev) => (prev + 1) % totalPhotos);
        };

        return (
          <div
            className={styles.photoLightboxOverlay}
            onClick={() => setActivePhotoIndex(null)}
            role="dialog"
            aria-modal="true"
          >
            <div
              className={styles.photoLightboxContainer}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Header Bar */}
              <div className={styles.lightboxHeader}>
                <div className={styles.lightboxTitleInfo}>
                  <div className={styles.lightboxHospitalName}>
                    {hospital.name}
                  </div>
                  <div className={styles.lightboxCounterBadge}>
                    <ImageIcon size={14} />
                    <span>{activePhotoIndex + 1} / {totalPhotos}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.lightboxCloseBtn}
                  onClick={() => setActivePhotoIndex(null)}
                  aria-label="Close photo viewer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Stage with Navigation Arrows and Current Image */}
              <div className={styles.lightboxStage}>
                {totalPhotos > 1 && (
                  <button
                    type="button"
                    className={`${styles.lightboxArrowBtn} ${styles.arrowPrev}`}
                    onClick={handlePrev}
                    aria-label="Previous photo"
                  >
                    <ChevronLeft size={28} />
                  </button>
                )}

                <div className={styles.lightboxImageWrap}>
                  <img
                    key={currentPhoto.url}
                    src={currentPhoto.url}
                    alt={currentPhoto.title || hospital.name}
                    className={styles.lightboxMainImage}
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=1200&q=80';
                    }}
                  />
                  {currentPhoto.category && (
                    <div className={styles.lightboxCategoryBadge}>
                      {currentPhoto.category}
                    </div>
                  )}
                </div>

                {totalPhotos > 1 && (
                  <button
                    type="button"
                    className={`${styles.lightboxArrowBtn} ${styles.arrowNext}`}
                    onClick={handleNext}
                    aria-label="Next photo"
                  >
                    <ChevronRight size={28} />
                  </button>
                )}
              </div>

              {/* Bottom Bar: Title & Thumbnails */}
              <div className={styles.lightboxFooter}>
                <div className={styles.lightboxCaptionRow}>
                  <h4 className={styles.lightboxPhotoTitle}>{currentPhoto.title}</h4>
                </div>

                {totalPhotos > 1 && (
                  <div className={styles.lightboxThumbStrip}>
                    {allHospitalPhotos.map((photo, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`${styles.thumbBtn} ${idx === activePhotoIndex ? styles.thumbBtnActive : ''}`}
                        onClick={() => setActivePhotoIndex(idx)}
                        aria-label={`Jump to photo ${idx + 1}`}
                      >
                        <img src={photo.url} alt="" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Reel Popup Modal - Clean Native Video Player (No Instagram Style) */}
      {activeReel && (
        <HospitalReelModalPlayer
          activeReel={activeReel}
          onClose={() => setActiveReel(null)}
        />
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

      {/* Hospital Appointment Booking Modal */}
      {isBookingModalOpen && (
        <HospitalBookingModal
          hospital={hospital}
          preselectedDepartment={preselectedDept}
          onNavigate={onNavigate}
          onClose={() => {
            setIsBookingModalOpen(false);
            setPreselectedDept(null);
          }}
          onGetDirections={handleGetDirections}
        />
      )}

      {/* Booking Login Prompt Dialog Modal */}
      {showLoginPrompt && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(5px)',
          zIndex: 11000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '440px',
            width: '100%',
            padding: '26px',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Calendar size={28} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
              Please Log In to Book
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 20px', lineHeight: 1.5 }}>
              To book an appointment at <strong>{hospital.name}</strong>, please sign in or register with your Sehat Buddy account first. Once logged in, you will be able to complete your booking.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowLoginPrompt(false)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '8px',
                  background: '#ffffff',
                  color: '#334155',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLoginPrompt(false);
                  if (onNavigate) {
                    onNavigate('user-login', { view: 'hospital-profile', param: hospital.id || hospital._id });
                  } else {
                    window.location.href = '/login';
                  }
                }}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  background: '#2563eb',
                  color: '#ffffff',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Log In / Sign Up
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Login Suggestion Prompt Modal */}
      {showReviewLoginPrompt && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(5px)',
          zIndex: 11000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '440px',
            width: '100%',
            padding: '26px',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              border: '1px solid #fde68a'
            }}>
              <Star size={28} color="#d97706" fill="#fde68a" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
              Please Log In to Write a Review
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 20px', lineHeight: 1.5 }}>
              To ensure all patient ratings, hospital experiences, and cashless feedback are genuine and trustworthy, please log in or register before posting a review for <strong>{hospital.name}</strong>.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowReviewLoginPrompt(false)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '8px',
                  background: '#ffffff',
                  color: '#334155',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowReviewLoginPrompt(false);
                  try {
                    localStorage.setItem('open_write_review', 'true');
                    localStorage.setItem('redirect_after_login', `/hospitals/${hospital.id || hospital._id}`);
                  } catch (e) {
                    console.warn(e);
                  }
                  if (onNavigate) {
                    onNavigate('user-login', { view: 'hospital-profile', param: hospital.id || hospital._id });
                  } else {
                    window.location.href = '/login';
                  }
                }}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  color: '#ffffff',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                }}
              >
                Log In to Review
              </button>
            </div>
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
          preselectedTarget={{ type: 'hospital', name: hospital.name, id: hospital.id || hospital._id }}
          targetId={hospital.id || hospital._id}
          targetName={hospital.name}
          targetType="hospital"
          onNavigate={onNavigate}
          onClose={() => setIsWriteReviewModalOpen(false)}
          onSuccess={() => setIsWriteReviewModalOpen(false)}
        />
      )}
    </div>
  );
};

export default HospitalProfile;
