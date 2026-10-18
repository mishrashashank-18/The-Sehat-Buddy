import React, { useState } from 'react';
import { 
  ArrowLeft, Star, MapPin, Building2, Briefcase, 
  GraduationCap, Phone, X, Play, ChevronDown, HelpCircle, ShieldCheck,
  Award, CheckCircle2, MessageSquare, Trophy, Calendar, HeartPulse, Stethoscope, FileText
} from 'lucide-react';
import { useData } from '../../context/useData';
import Container from '../layout/Container';
import WriteReviewModal from '../reviews/WriteReviewModal';
import styles from './DoctorProfile.module.css';

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

const DoctorProfile = ({ doctorId, onNavigate }) => {
  const { doctors, reviews, faqs } = useData();
  const [activeReel, setActiveReel] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);

  // Booking interaction states
  const [consultationType, setConsultationType] = useState('In-Clinic Visit');
  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('04:00 PM');

  // Modal patient inputs
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [bookingStatus, setBookingStatus] = useState(null); // 'loading', 'success', 'error'
  const [expandedFaq, setExpandedFaq] = useState(null);

  // Dynamic 3 upcoming appointment days
  const dateOptions = React.useMemo(() => {
    const d0 = new Date();
    const d1 = new Date(Date.now() + 86400000);
    const d2 = new Date(Date.now() + 172800000);
    return [
      {
        label: `Today, ${d0.getDate()} ${d0.toLocaleDateString('en-US', { month: 'short' })}`,
        dateStr: d0.toISOString().split('T')[0],
        slotsCount: '3 slots available'
      },
      {
        label: `Tomorrow, ${d1.getDate()} ${d1.toLocaleDateString('en-US', { month: 'short' })}`,
        dateStr: d1.toISOString().split('T')[0],
        slotsCount: '4 slots available'
      },
      {
        label: `${d2.toLocaleDateString('en-US', { weekday: 'short' })}, ${d2.getDate()} ${d2.toLocaleDateString('en-US', { month: 'short' })}`,
        dateStr: d2.toISOString().split('T')[0],
        slotsCount: '8 slots'
      }
    ];
  }, []);

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

  const doctor = doctors.find(d => 
    String(d.id) === String(doctorId) || 
    String(d._id) === String(doctorId) ||
    (d.email && String(doctorId).includes('@') && d.email.toLowerCase() === String(doctorId).toLowerCase())
  );

  const handleBookNow = () => {
    setShowBookingModal(true);
  };

  const processBooking = async (slotDate, slotTime, type = consultationType) => {
    setBookingStatus('loading');
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch('http://localhost:5000/api/user/book-appointment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          docId: doctor?.id || doctor?._id,
          slotDate: slotDate || dateOptions[selectedDateIdx].dateStr,
          slotTime: slotTime || selectedTimeSlot,
          consultationType: type
        })
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
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

  const submitBooking = (e) => {
    e.preventDefault();
    const chosenDate = dateOptions[selectedDateIdx]?.dateStr;
    const chosenTime = selectedTimeSlot;

    if (!chosenDate || !chosenTime) {
      alert('Please select date and time');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      // Save pending booking and redirect to login
      localStorage.setItem('pendingBooking', JSON.stringify({
        docId: doctor?.id || doctor?._id,
        slotDate: chosenDate,
        slotTime: chosenTime,
        consultationType
      }));
      onNavigate('user-login', { view: 'doctor-profile', param: doctorId });
    } else {
      processBooking(chosenDate, chosenTime);
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
    const list = [];
    if (doc.degree || doc.qualifications) {
      const parts = (doc.degree || doc.qualifications).split(/[,/]+/).map(s => s.trim()).filter(Boolean);
      list.push(...parts);
    }
    const spec = (doc.specialty || doc.specialization || '').toLowerCase();
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

  const doctorTags = getDoctorTags(doctor);

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

  const doctorReviews = (reviews || []).filter(r => {
    if (r.targetType === 'doctor' && r.status !== 'rejected') {
      const dName = (doctor?.name || '').toLowerCase();
      const tName = (r.targetName || '').toLowerCase();
      const dId = String(doctor?.id || doctor?._id || '');
      const rTargetId = String(r.targetId || '');
      return (
        (rTargetId && rTargetId === dId) ||
        (tName && dName && (tName.includes(dName) || dName.includes(tName)))
      );
    }
    return false;
  });

  return (
    <div className={styles.pageWrapper}>
      <Container>
        {/* Top Back Navigation Button */}
        <button onClick={() => window.history.back()} className={styles.backBtn}>
          <ArrowLeft size={18} /> Back
        </button>

        {/* TOP SECTION: Left (Hero + About) & Right (Booking Card) */}
        <div className={styles.topSectionGrid}>
          {/* LEFT: Hero Profile Card + About Card */}
          <div className={styles.topLeftCol}>
            {/* Doctor Hero Profile Card */}
            <div className={styles.heroCard}>
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
                      <span className={styles.heroRatingVal}>{doctor.rating || '4.8'}</span>
                      <span className={styles.heroRatingDivider}>|</span>
                      <span className={styles.heroReviewsCount}>
                        {doctorReviews.length > 0 ? `${doctorReviews.length}+` : (doctor.reviewsCount || doctor.reviews || '120+')} patient reviews
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
                      <span key={idx} className={styles.heroTagPill}>{tag}</span>
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
                      {doctor.experience ? (typeof doctor.experience === 'number' ? `${doctor.experience}+ Years` : doctor.experience) : '15+ Years'}
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
            </div>

            {/* About Card */}
            <div className={styles.aboutCard}>
              <h3 className={styles.sectionHeading}>
                About {doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`}
              </h3>
              <div className={styles.aboutTextContent}>
                {doctor.about && doctor.about.trim() ? (
                  doctor.about.split(/\n\s*\n/).map((para, pIdx) => (
                    <p key={pIdx}>{para}</p>
                  ))
                ) : (
                  <>
                    <p>
                      {`${doctor.name} is a Senior Consultant with over ${doctor.experience || '15'} years of extensive clinical experience in ${doctor.specialty || doctor.specialization || 'specialized medicine'}. Recognized for distinguished patient care, comprehensive diagnostic evaluations, and advanced treatment methodologies.`}
                    </p>
                    <p>
                      Specializing in personalized healthcare regimens, preventative therapies, and modern clinical techniques, {doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`} maintains active privileges across leading healthcare institutions with a patient-centric commitment.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Consultation & Booking Card */}
          <div className={styles.topRightCol}>
            <div className={styles.bookingCard}>
              {/* Consultation Fee */}
              <div className={styles.feeSection}>
                <span className={styles.feeLabel}>Consultation Fee</span>
                <div className={styles.feePriceRow}>
                  <span className={styles.feeAmount}>₹{doctor.price || doctor.fees || 800}</span>
                  <span className={styles.feeSub}>/ consultation</span>
                </div>
              </div>

              <div className={styles.sidebarDivider} />

              {/* Select Consultation Type */}
              <div className={styles.bookingSection}>
                <label className={styles.bookingSectionLabel}>Select Consultation Type</label>
                <div className={styles.consultTypeToggleGroup}>
                  <button 
                    type="button" 
                    className={`${styles.consultTypeBtn} ${consultationType === 'In-Clinic Visit' ? styles.consultTypeActive : ''}`}
                    onClick={() => setConsultationType('In-Clinic Visit')}
                  >
                    In-Clinic Visit
                  </button>
                  <button 
                    type="button" 
                    className={`${styles.consultTypeBtn} ${consultationType === 'Video Consultation' ? styles.consultTypeActive : ''}`}
                    onClick={() => setConsultationType('Video Consultation')}
                  >
                    Video Consultation
                  </button>
                </div>
              </div>

              {/* Select Date & Time */}
              <div className={styles.bookingSection}>
                <label className={styles.bookingSectionLabel}>Select Date & Time</label>
                <div className={styles.dateSlotsGroup}>
                  {dateOptions.map((opt, idx) => (
                    <div 
                      key={idx} 
                      className={`${styles.dateSlotCard} ${selectedDateIdx === idx ? styles.dateSlotCardActive : ''}`}
                      onClick={() => setSelectedDateIdx(idx)}
                    >
                      <span className={styles.dateSlotDayText}>{opt.label}</span>
                      <span className={`${styles.dateSlotCountText} ${selectedDateIdx === idx ? styles.dateSlotCountActive : ''}`}>
                        {opt.slotsCount}
                      </span>
                    </div>
                  ))}
                </div>

                <div className={styles.timeSlotsHeader}>Time-slots</div>
                <div className={styles.timeSlotsGrid}>
                  {['04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'].map((slot, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`${styles.timeSlotPill} ${selectedTimeSlot === slot ? styles.timeSlotPillActive : ''}`}
                      onClick={() => setSelectedTimeSlot(slot)}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Book Appointment CTA */}
              <button 
                type="button" 
                className={styles.bookAppointmentBtn}
                onClick={handleBookNow}
              >
                Book Appointment
              </button>

              <p className={styles.bookingCardNote}>
                No booking fee • Instant confirmation
              </p>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTIONS: Credentials, Media, FAQs, Reviews */}
        <div className={styles.bottomSectionsCol}>

            {/* Credentials, Honors & Clinical Experience */}
            {(() => {
              const awardsList = Array.isArray(doctor.awards) && doctor.awards.length > 0 
                ? doctor.awards 
                : (doctor.awards !== undefined && Array.isArray(doctor.awards) ? doctor.awards : [
                    'Best Cardiologist of the Year - National Healthcare Summit (2023)',
                    'Excellence in Interventional Cardiology - Cardiological Society of India (2020)',
                    'Distinguished Clinical Researcher Award (2018)'
                  ]);

              const certificationsList = Array.isArray(doctor.certifications) && doctor.certifications.length > 0 
                ? doctor.certifications 
                : (doctor.certifications !== undefined && Array.isArray(doctor.certifications) ? doctor.certifications : [
                    'Fellow of the American College of Cardiology (FACC)',
                    'Fellow of Society for Cardiovascular Angiography & Interventions (FSCAI)',
                    'Advanced Cardiac Life Support (ACLS) Certified Provider',
                    'Post-Doctoral Fellowship in Complex Coronary Angioplasty'
                  ]);

              const membershipsList = Array.isArray(doctor.memberships) && doctor.memberships.length > 0 
                ? doctor.memberships 
                : (doctor.memberships !== undefined && Array.isArray(doctor.memberships) ? doctor.memberships : [
                    'Cardiological Society of India (CSI) - Life Member',
                    'Indian Medical Association (IMA)',
                    'European Society of Cardiology (ESC)',
                    'Association of Physicians of India (API)'
                  ]);

              const timelineList = Array.isArray(doctor.careerExperience) && doctor.careerExperience.length > 0 
                ? doctor.careerExperience 
                : (doctor.careerExperience !== undefined && Array.isArray(doctor.careerExperience) ? doctor.careerExperience : [
                    'Senior Consultant Interventional Cardiologist - Apollo Hospital (2018 – Present)',
                    'Associate Consultant Cardiology - Fortis Healthcare (2014 – 2018)',
                    'Chief Resident in Cardiology All India Institute of Medical Sciences (2011 – 2014)'
                  ]);

              return (
                <div className={styles.credentialsCard}>
                  <div className={styles.credentialsHeader}>
                    <h3 className={styles.credentialsTitle}>
                      <Award size={24} color="#1d4ed8" />
                      Credentials, Honors & Clinical Experience
                    </h3>
                    <p className={styles.credentialsSubtitle}>
                      Verified clinical certifications, institutional awards, professional memberships, and hospital timeline of Dr. {doctor.name ? doctor.name.replace(/^Dr\.\s*/i, '') : 'Rahul Verma'}.
                    </p>
                  </div>

                  <div className={styles.credentialsGrid}>
                    {/* Awards & Honors (Top-Left) */}
                    <div className={styles.credBlock}>
                      <h4 className={styles.credBlockTitle}>
                        <Award size={19} color="#d97706" />
                        Awards & Honors ({awardsList.length})
                      </h4>
                      <div className={styles.credList}>
                        {awardsList.map((award, idx) => {
                          const getAwardIcon = (i) => {
                            if (i === 0) return <Trophy size={18} color="#2b1704" />;
                            if (i === 1) return <Award size={18} color="#2b1704" />;
                            return <Award size={18} color="#2b1704" />;
                          };

                          const renderAwardText = (text) => {
                            if (text.includes(' - ')) {
                              const parts = text.split(' - ');
                              return (
                                <span>
                                  <strong>{parts[0]}</strong> - {parts.slice(1).join(' - ')}
                                </span>
                              );
                            }
                            if (text.includes(' (')) {
                              const pIdx = text.indexOf(' (');
                              return (
                                <span>
                                  <strong>{text.slice(0, pIdx)}</strong> {text.slice(pIdx)}
                                </span>
                              );
                            }
                            return <span><strong>{text}</strong></span>;
                          };

                          return (
                            <div key={idx} className={styles.awardItemPill}>
                              <div className={styles.awardIconWrap}>
                                {getAwardIcon(idx)}
                              </div>
                              <div>{renderAwardText(award)}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Certificates & Fellowships (Top-Right) */}
                    <div className={styles.credBlock}>
                      <h4 className={styles.credBlockTitle}>
                        <GraduationCap size={20} color="#0f172a" />
                        Certificates & Fellowships ({certificationsList.length})
                      </h4>
                      <div className={styles.credList}>
                        {certificationsList.map((cert, idx) => {
                          const toneClass = styles[`certTone${idx % 4}`];
                          const getCertIcon = (i) => {
                            if (i === 0) return <GraduationCap size={18} color="#93c5fd" />;
                            if (i === 1) return <FileText size={18} color="#a7f3d0" />;
                            if (i === 2) return <HeartPulse size={18} color="#99f6e4" />;
                            return <Stethoscope size={18} color="#99f6e4" />;
                          };

                          const renderCertText = (text) => {
                            const prefixes = ['Fellow of', 'Advanced Cardiac', 'Post-Doctoral', 'Board Certified in', 'Fellowship in'];
                            for (const pref of prefixes) {
                              if (text.toLowerCase().startsWith(pref.toLowerCase())) {
                                const boldPart = text.slice(0, pref.length);
                                const rest = text.slice(pref.length);
                                return <span><strong>{boldPart}</strong>{rest}</span>;
                              }
                            }
                            const words = text.split(' ');
                            if (words.length > 2) {
                              return <span><strong>{words.slice(0, 2).join(' ')}</strong> {words.slice(2).join(' ')}</span>;
                            }
                            return <span><strong>{text}</strong></span>;
                          };

                          return (
                            <div key={idx} className={`${styles.certItemPill} ${toneClass}`}>
                              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                                {getCertIcon(idx)}
                              </div>
                              <div>{renderCertText(cert)}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Professional Medical Memberships (Bottom-Left) */}
                    <div className={styles.credBlock}>
                      <h4 className={styles.credBlockTitle}>
                        <CheckCircle2 size={19} color="#0d9488" />
                        Professional Medical Memberships ({membershipsList.length})
                      </h4>
                      <div className={styles.credList}>
                        {membershipsList.map((mem, idx) => (
                          <div key={idx} className={styles.membershipItemPill}>
                            <CheckCircle2 size={17} color="#0d9488" style={{ flexShrink: 0 }} />
                            <span>{mem}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Career Experience & Hospital Timeline (Bottom-Right) */}
                    <div className={styles.credBlock}>
                      <h4 className={styles.credBlockTitle}>
                        <Building2 size={19} color="#2563eb" />
                        Career Experience & Hospital Timeline ({timelineList.length})
                      </h4>
                      <div className={styles.timelineWrapper}>
                        <div className={styles.timelineConnector}></div>
                        {timelineList.map((item, idx) => {
                          const isPresent = item.toLowerCase().includes('present');
                          let roleTitle = item;
                          let hospitalAndYear = '';

                          if (item.includes(' - ')) {
                            const parts = item.split(' - ');
                            roleTitle = parts[0];
                            hospitalAndYear = parts.slice(1).join(' - ');
                          } else if (item.includes('(')) {
                            const idxP = item.indexOf('(');
                            roleTitle = item.slice(0, idxP).trim();
                            hospitalAndYear = item.slice(idxP);
                          }

                          const icon = idx % 2 === 1 
                            ? <Calendar size={16} color="#2563eb" style={{ flexShrink: 0 }} /> 
                            : <Building2 size={16} color="#2563eb" style={{ flexShrink: 0 }} />;

                          return (
                            <div key={idx} className={styles.timelineRow}>
                              <div className={`${styles.timelineNode} ${idx === 0 ? styles.timelineNodeActive : ''}`}></div>
                              <div className={styles.timelineCard}>
                                {icon}
                                <div style={{ flex: 1 }}>
                                  <strong className={styles.timelineJobTitle}>{roleTitle}</strong>
                                  {hospitalAndYear && (
                                    <span> {item.includes(' - ') ? `- ${hospitalAndYear}` : hospitalAndYear}</span>
                                  )}
                                  {isPresent && (
                                    <span className={styles.presentBadge}>Present</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Instagram Reels Section */}
            {doctor.reels && Array.isArray(doctor.reels) && doctor.reels.length > 0 && (
              <div className={styles.mediaSection}>
                <h3>Instagram Reels</h3>
                <div className={styles.reelsGrid}>
                  {doctor.reels.slice(0, 5).map((reel, idx) => {
                    if (!reel) return null;
                    const embedUrl = getEmbedUrl(reel);
                    return (
                      <div key={idx} className={styles.reelCard} onClick={() => setActiveReel(embedUrl)}>
                        <iframe src={embedUrl} title={`Reel ${idx + 1}`} scrolling="no" allowTransparency="true"></iframe>
                        <div className={styles.reelOverlay}>
                          <Play size={40} color="white" opacity={0.8} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
              <div className={styles.faqHeader}>
                <div className={styles.faqIllustrationWrap}>
                  <DoctorFaqIllustration />
                </div>
                <div className={styles.faqHeaderTextWrap}>
                  <h3 className={styles.faqTitle}>
                    <span className={styles.faqTitleIcon}>
                      <HelpCircle size={24} color="#0284c7" />
                    </span>
                    Frequently asked questions (FAQs)
                  </h3>
                  <p className={styles.faqSubtitle}>
                    Helpful answers regarding appointments, clinic consultations, and cashless healthcare.
                  </p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '6px', background: '#f0f9ff', padding: '3px 10px', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                    <ShieldCheck size={13} color="#0284c7" />
                    <span style={{ fontSize: '0.74rem', color: '#0369a1', fontWeight: 600 }}>
                      Verified & maintained by {doctor?.hospital ? `${doctor.hospital} Administration` : 'The Sehat Buddy Medical Board'}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.faqList}>
                {(() => {
                  const defaultDoctorFaqs = [
                    {
                      icon: <FaqCalendarIcon />,
                      q: `How can I book an appointment with ${doctor?.name ? (doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`) : 'the doctor'}?`,
                      steps: [
                        'Open The Sehat Buddy platform on web or mobile app',
                        `Select consultation type (In-Clinic or Video) on the booking card`,
                        `Choose your preferred consultation date and available appointment slot`,
                        'Review patient details, enter your symptoms, and proceed with instant confirmation'
                      ],
                      note: "Once completed, your appointment will be booked, and you'll receive a confirmation instantly."
                    },
                    {
                      icon: <FaqDocumentIcon />,
                      q: 'What do I need to show at the clinic?',
                      a: 'Please carry a valid government photo ID (Aadhar Card, PAN Card, or Passport), your health insurance policy e-card if claiming cashless coverage, and any previous doctor prescriptions, discharge summaries, or diagnostic reports related to your consultation.'
                    },
                    {
                      icon: <FaqShieldLockIcon />,
                      q: 'Is my consultation private with the doctor?',
                      a: 'Yes, 100%. All consultations, patient notes, and medical discussions are strictly confidential and protected under standard healthcare privacy regulations.'
                    },
                    {
                      icon: <FaqRescheduleIcon />,
                      q: `Can I reschedule my appointment with ${doctor?.name ? (doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`) : 'the doctor'}?`,
                      a: 'Yes, you can easily reschedule or cancel your appointment prior to your slot time through your patient account or by reaching out to our support care desk.'
                    },
                    {
                      icon: <FaqInsuranceIcon />,
                      q: `Does ${doctor?.name ? (doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`) : 'the doctor'} accept health insurance or cashless claims?`,
                      a: 'Yes, consultations and any recommended procedures or surgeries performed at our partner hospitals qualify for 100% cashless mediclaim pre-authorization with all leading insurance TPAs.'
                    }
                  ];

                  const defaultIcons = [
                    <FaqCalendarIcon />,
                    <FaqDocumentIcon />,
                    <FaqShieldLockIcon />,
                    <FaqRescheduleIcon />,
                    <FaqInsuranceIcon />
                  ];

                  const specificDoctorFaqs = (faqs || [])
                    .filter(f => f.isActive && f.targetType === 'doctor' && (
                      (f.targetId && (String(f.targetId) === String(doctor.id || doctor._id))) ||
                      (f.targetName && doctor.name && f.targetName.toLowerCase() === doctor.name.toLowerCase())
                    ))
                    .map((f, i) => ({
                      icon: defaultIcons[i % defaultIcons.length],
                      q: f.question,
                      a: f.answer
                    }));

                  const embeddedDocFaqs = (Array.isArray(doctor?.faqs) && doctor.faqs.length > 0)
                    ? doctor.faqs.map((f, i) => ({
                        icon: defaultIcons[(specificDoctorFaqs.length + i) % defaultIcons.length],
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
                          <span className={styles.faqQuestionText}>{faq.q}</span>
                          <div className={styles.faqChevronWrap}>
                            <ChevronDown
                              size={20}
                              className={`${styles.faqChevron} ${isOpen ? styles.faqChevronOpen : ''}`}
                            />
                          </div>
                        </button>
                        {isOpen && (
                          <div className={styles.faqAnswer}>
                            {Array.isArray(faq.steps) && faq.steps.length > 0 && (
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
                  });
                })()}
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
                        : (doctor.rating || '4.9')}
                    </div>
                    <div>
                      <div className={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={16} fill="currentColor" color="currentColor" />
                        ))}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                        Based on {doctorReviews.length > 0 ? doctorReviews.length : (doctor.reviewsCount || doctor.reviews || '50+')} patient ratings
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={styles.writeReviewBtn}
                    onClick={() => setIsWriteReviewOpen(true)}
                  >
                    <MessageSquare size={16} />
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
                    <MessageSquare size={24} />
                  </div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', color: '#0f172a', fontWeight: 700 }}>
                    No Patient Reviews Yet
                  </h4>
                  <p style={{ margin: '0 0 16px 0', fontSize: '0.88rem', color: '#64748b', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
                    Have you consulted with {doctor.name}? Share your medical experience to help other patients make informed health decisions.
                  </p>
                  <button
                    type="button"
                    className={styles.writeReviewBtn}
                    onClick={() => setIsWriteReviewOpen(true)}
                  >
                    <MessageSquare size={16} />
                    <span>Write the First Review</span>
                  </button>
                </div>
              )}
            </div>
        </div>
      </Container>

      {/* Reel Modal */}
      {activeReel && (
        <div className={styles.modalOverlay} onClick={() => setActiveReel(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button className={styles.closeModal} onClick={() => setActiveReel(null)}>
              <X size={30} />
            </button>
            <iframe src={activeReel} title="Instagram Reel" scrolling="no" allowTransparency="true"></iframe>
          </div>
        </div>
      )}

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
                      required 
                      placeholder="+91 9876543210"
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
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
          targetType="doctor"
          targetId={doctor.id || doctor._id}
          targetName={doctor.name}
        />
      )}
    </div>
  );
};

export default DoctorProfile;
