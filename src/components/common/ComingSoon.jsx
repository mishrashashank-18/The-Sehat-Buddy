import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle,
  ArrowLeft,
  ShieldCheck,
  Stethoscope,
  Building2,
  FlaskConical,
  Activity,
  HeartPulse,
  Users,
  Baby,
  Heart,
  PhoneCall,
  FileText,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import Container from '../layout/Container';
import { api } from '../../services/api';
import styles from './ComingSoon.module.css';

// SVG Vector Illustrations matching user's visual reference
const LeftIllustration = () => (
  <svg
    viewBox="0 0 240 240"
    className={styles.heroIllustration}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Soft circle backdrop */}
    <circle cx="120" cy="120" r="95" fill="#eff6ff" />
    <circle cx="120" cy="120" r="85" fill="#dbeafe" opacity="0.6" />

    {/* Sparkles / Plus signs */}
    <text x="35" y="60" fontSize="16" fill="#1e293b" fontWeight="bold">+</text>
    <text x="25" y="145" fontSize="16" fill="#1e293b" fontWeight="bold">+</text>
    <text x="80" y="215" fontSize="16" fill="#1e293b" fontWeight="bold">+</text>
    <text x="210" y="165" fontSize="16" fill="#1e293b" fontWeight="bold">+</text>
    {/* Blue sparkle star */}
    <path d="M175 45 Q178 55 188 58 Q178 61 175 71 Q172 61 162 58 Q172 55 175 45 Z" fill="#2563eb" />

    {/* Stethoscope Left */}
    <g transform="translate(30, 70)">
      <path d="M15 15 C15 5 25 0 35 12 C45 25 45 45 35 60 C25 75 15 65 15 50" fill="none" stroke="#2563eb" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="15" cy="15" r="4" fill="#2563eb" />
      <circle cx="45" cy="15" r="4" fill="#2563eb" />
      <path d="M15 15 C15 35 30 50 30 65 C30 85 45 95 60 90" fill="none" stroke="#2563eb" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="63" cy="90" r="7" fill="#ffffff" stroke="#2563eb" strokeWidth="3" />
      <circle cx="63" cy="90" r="2.5" fill="#2563eb" />
    </g>

    {/* Calendar / Checklist */}
    <g transform="translate(100, 75)">
      <rect x="0" y="10" width="70" height="78" rx="8" fill="#ffffff" stroke="#1e293b" strokeWidth="2.5" />
      <rect x="12" y="4" width="7" height="12" rx="3.5" fill="#2563eb" stroke="#1e293b" strokeWidth="1.5" />
      <rect x="51" y="4" width="7" height="12" rx="3.5" fill="#2563eb" stroke="#1e293b" strokeWidth="1.5" />
      <path d="M0 26 H70" stroke="#1e293b" strokeWidth="2" />
      <rect x="10" y="34" width="10" height="10" rx="2" fill="#ffffff" stroke="#1e293b" strokeWidth="1.5" />
      <path d="M26 39 H60" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
      <rect x="10" y="49" width="10" height="10" rx="2" fill="#ffffff" stroke="#1e293b" strokeWidth="1.5" />
      <path d="M26 54 H60" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
      <rect x="10" y="64" width="10" height="10" rx="2" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" />
      <path d="M12 69 L15 72 L20 66" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M26 69 H52" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
    </g>

    {/* ID Card Badge */}
    <g transform="translate(25, 150)">
      <rect x="0" y="0" width="65" height="52" rx="6" fill="#ffffff" stroke="#1e293b" strokeWidth="2.5" />
      <circle cx="16" cy="18" r="8" fill="#f87171" stroke="#1e293b" strokeWidth="1.5" />
      <path d="M9 31 C9 26 13 25 16 25 C19 25 23 26 23 31" fill="#f87171" stroke="#1e293b" strokeWidth="1.5" />
      <line x1="30" y1="14" x2="55" y2="14" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
      <line x1="30" y1="21" x2="55" y2="21" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
      <line x1="30" y1="28" x2="50" y2="28" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
      <rect x="25" y="38" width="16" height="5" rx="2" fill="#2563eb" stroke="#1e293b" strokeWidth="1.5" />
    </g>

    {/* Medical Cross Shield */}
    <g transform="translate(100, 160)">
      <path d="M28 0 C45 0 56 6 56 22 C56 42 28 56 28 56 C28 56 0 42 0 22 C0 6 11 0 28 0 Z" fill="#eff6ff" stroke="#1e293b" strokeWidth="2.5" />
      <path d="M28 14 V36 M17 25 H39" stroke="#10b981" strokeWidth="4.5" strokeLinecap="round" />
    </g>
  </svg>
);

const RightIllustration = () => (
  <svg
    viewBox="0 0 240 240"
    className={styles.heroIllustration}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Soft circle backdrop */}
    <circle cx="120" cy="120" r="95" fill="#eff6ff" />
    <circle cx="120" cy="120" r="85" fill="#dbeafe" opacity="0.6" />

    {/* Sparkles / Plus signs */}
    <text x="45" y="40" fontSize="16" fill="#1e293b" fontWeight="bold">+</text>
    <text x="25" y="150" fontSize="14" fill="#1e293b" fontWeight="bold">+</text>
    <text x="195" y="90" fontSize="16" fill="#1e293b" fontWeight="bold">+</text>
    <text x="130" y="220" fontSize="16" fill="#1e293b" fontWeight="bold">+</text>
    <path d="M190 190 Q193 200 203 203 Q193 206 190 216 Q187 206 177 203 Q187 200 190 190 Z" fill="#ef4444" />

    {/* Chat bubbles */}
    <g transform="translate(30, 85)">
      <path d="M15 15 H65 C70 15 74 19 74 24 V52 C74 57 70 61 65 61 H28 L15 70 V24 C15 19 19 15 24 15 Z" fill="#ffffff" stroke="#1e293b" strokeWidth="2.5" />
      <path d="M0 0 H55 C60 0 64 4 64 9 V32 C64 37 60 41 55 41 H20 L8 50 V9 C8 4 12 0 17 0 Z" fill="#3b82f6" stroke="#1e293b" strokeWidth="2.5" />
      <line x1="16" y1="12" x2="48" y2="12" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="16" y1="20" x2="38" y2="20" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
    </g>

    {/* Stethoscope Right */}
    <g transform="translate(105, 55)">
      <path d="M30 15 C30 0 50 0 65 15 C75 25 75 55 60 70 C45 85 30 100 45 130 C50 140 65 145 75 140" fill="none" stroke="#2563eb" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M30 15 C15 25 5 45 15 65 C25 85 45 100 45 130" fill="none" stroke="#2563eb" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="28" cy="14" r="4" fill="#2563eb" />
      <circle cx="67" cy="14" r="4" fill="#2563eb" />
      <circle cx="78" cy="140" r="9" fill="#ffffff" stroke="#2563eb" strokeWidth="3.5" />
      <circle cx="78" cy="140" r="3.5" fill="#2563eb" />
      <line x1="75" y1="5" x2="80" y2="0" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
      <line x1="88" y1="15" x2="95" y2="12" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
      <line x1="83" y1="28" x2="90" y2="30" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
    </g>

    {/* Heart ECG Shield */}
    <g transform="translate(48, 145)">
      <path d="M32 0 C50 0 64 7 64 25 C64 48 32 64 32 64 C32 64 0 48 0 25 C0 7 14 0 32 0 Z" fill="#eff6ff" stroke="#1e293b" strokeWidth="2.5" />
      <path d="M32 40 C32 40 18 30 18 20 C18 15 22 11 27 12 C30 13 32 16 32 16 C32 16 34 13 37 12 C42 11 46 15 46 20 C46 30 32 40 32 40 Z" fill="#ef4444" stroke="#1e293b" strokeWidth="1.5" />
      <path d="M19 22 H24 L27 16 L31 28 L35 18 L38 23 H45" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

// 5 Upcoming Services from user's reference image
const UPCOMING_SERVICES = [
  {
    key: 'lab-tests',
    title: 'Lab Tests',
    subtitle: 'Book lab tests & health packages',
    heroSubtitle: 'Our new Lab Tests & Diagnostics is on the way!',
    icon: FlaskConical,
    bgTint: '#f5f3ff',
    iconBg: '#ede9fe',
    iconColor: '#7c3aed'
  },
  {
    key: 'surgeries',
    title: 'Surgeries',
    subtitle: 'Advanced surgical care',
    heroSubtitle: 'Our new Advanced Surgeries service is on the way!',
    icon: Activity,
    bgTint: '#fff1f2',
    iconBg: '#ffe4e6',
    iconColor: '#e11d48'
  },
  {
    key: 'senior-care',
    title: 'Senior Care',
    subtitle: 'Compassionate care for elders',
    heroSubtitle: 'Our new Senior & Elder Care is on the way!',
    icon: Heart,
    bgTint: '#fffbeb',
    iconBg: '#fef3c7',
    iconColor: '#d97706'
  },
  {
    key: 'women-care',
    title: 'Women Care',
    subtitle: 'Complete care for women',
    heroSubtitle: 'Our new Women’s Health & Care is on the way!',
    icon: HeartPulse,
    bgTint: '#fdf2f8',
    iconBg: '#fce7f3',
    iconColor: '#db2777'
  },
  {
    key: 'kid-care',
    title: 'Kid Care',
    subtitle: 'Special care for children',
    heroSubtitle: 'Our new Pediatric & Kid Care is on the way!',
    icon: Baby,
    bgTint: '#f0fdf4',
    iconBg: '#dcfce7',
    iconColor: '#16a34a'
  }
];

const FEATURE_DATA = {
  'lab-tests': {
    title: 'Lab Tests & Diagnostic Health Packages',
    heroSubtitle: 'Our new Lab Tests & Diagnostics is on the way!',
    category: 'Pathology & Diagnostics',
    badge: 'Launching Soon in Bengaluru & NCR',
    icon: FlaskConical,
    description: 'We are partnering with top NABL-accredited diagnostic chains and local labs to bring convenient home blood sample collection, whole-body preventive health checkups, and verified digital reports delivered straight to your account within 24 hours.',
    highlights: [
      'Certified Phlebotomists for Free Home Sample Collection',
      '100% NABL & CAP Accredited Pathology Labs',
      'Guaranteed Digital Smart Reports within 24 Hours',
      'Up to 60% Savings on Comprehensive Health Packages'
    ]
  },
  'surgeries': {
    title: 'Advanced Surgeries & Daycare Procedures',
    heroSubtitle: 'Our new Advanced Surgeries service is on the way!',
    category: 'Surgical & Hospitalization',
    badge: 'In Active Onboarding',
    icon: Activity,
    description: 'From minimally invasive laparoscopic procedures to specialized orthopedic, cataract, cardiac, and bariatric surgeries. The Sehat Buddy is assembling top surgical teams, verified NABH hospitals, and dedicated care coordinators for a hassle-free surgical journey.',
    highlights: [
      'Complete Cashless Insurance Assistance & Pre-Authorizations',
      'Senior Surgeons with 15+ Years Clinical Experience',
      'Complimentary Hospital Pick-up & Drop for Patients',
      'Post-Operative Recovery Follow-ups & Diet Guidance'
    ]
  },
  'senior-care': {
    title: 'Elder & Senior Companion Care',
    heroSubtitle: 'Our new Senior & Elder Care is on the way!',
    category: 'Geriatric Healthcare',
    badge: 'Coming Soon',
    icon: Heart,
    description: 'Compassionate, reliable healthcare tailored for elderly parents and seniors. Regular doctor checkups, at-home nursing visits, monthly medicine delivery, and 24x7 emergency medical response.',
    highlights: [
      'Dedicated Care Coordinator for Every Senior Patient',
      'Monthly Prescription Medication Refills & Home Delivery',
      'At-Home Vitals Monitoring & Experienced Physiotherapists',
      '24/7 Priority Emergency Ambulance & Hospital Admission'
    ]
  },
  'women-care': {
    title: 'Comprehensive Women’s Health & Wellness',
    heroSubtitle: 'Our new Women’s Health & Care is on the way!',
    category: 'Gynecology & Maternity',
    badge: 'In Development',
    icon: HeartPulse,
    description: 'Holistic healthcare designed for every chapter of a woman’s life — preventive screenings, confidential gynecological consultations, PCOS/PCOD care, prenatal roadmaps, and menopause support.',
    highlights: [
      'Confidential Consultations with Senior Gynecologists',
      'Personalized Maternity & Prenatal Care Roadmaps',
      'Custom Hormone, Thyroid & PCOS Wellness Packages',
      'Safe, Empathetic, Judgment-Free Tele-Consultations'
    ]
  },
  'kid-care': {
    title: 'Pediatric Care & Child Wellness',
    heroSubtitle: 'Our new Pediatric & Kid Care is on the way!',
    category: 'Pediatrics & Neonatal',
    badge: 'Coming Soon',
    icon: Baby,
    description: 'Trusted healthcare for newborns, toddlers, and young adults. Verified pediatricians, immunization trackers, developmental milestone assessments, and urgent care support.',
    highlights: [
      'Verified Pediatricians & Pediatric Specialists',
      'Automated Vaccination Reminders & Digital Health Records',
      'Child Growth & Developmental Milestone Assessments',
      '24x7 Urgent Pediatric Tele-Consultation Hotline'
    ]
  },
  'care-services': {
    title: 'At-Home Nursing & Specialized Care Services',
    heroSubtitle: 'Our new At-Home Nursing service is on the way!',
    category: 'Care Beyond Clinics',
    badge: 'Expanding Network',
    icon: Users,
    description: 'Professional medical care delivered directly to your doorstep. Verified home nurses, geriatric attendants, post-operative wound dressing, and medical equipment rental.',
    highlights: [
      'Background-Verified Licensed Nurses & Attendants',
      'Medical Equipment Rental (Oxygen, ICU Beds, Wheelchairs)',
      'Physiotherapy & Rehabilitation Sessions at Home',
      'Short-term & Long-term Personalized Care Plans'
    ]
  },
  'all-services': {
    title: 'All Healthcare Services & Directory',
    heroSubtitle: 'Our new healthcare suite is on the way!',
    category: 'Service Suite',
    badge: 'Coming Soon',
    icon: Sparkles,
    description: 'We are expanding our full digital healthcare suite to include verified pharmacy home delivery, urgent ambulance dispatch, wellness plans, and comprehensive health monitoring.',
    highlights: [
      'Express Medicine Delivery from Licensed Pharmacies',
      '24x7 Emergency Ambulance Tracking & Dispatch',
      'Preventive Annual Health Subscriptions for Families',
      'Integrated Electronic Health Records (ABHA / ABDM)'
    ]
  },
  'articles': {
    title: 'Health Content, Wellness Tips & Patient Guides',
    heroSubtitle: 'Our new Medical Knowledge Base is on the way!',
    category: 'Medical Knowledge Base',
    badge: 'Under Editorial Review',
    icon: FileText,
    description: 'Our team of medical specialists is currently reviewing and compiling comprehensive patient guides, preventive wellness advice, and diet regimens to help you take charge of your health.',
    highlights: [
      'Clinically Reviewed by Practicing Medical Specialists',
      'Actionable Nutrition & Lifestyle Guidance',
      'Step-by-Step Patient Symptom Guides & Awareness',
      'Free Weekly Wellness Digest Delivered to Your Inbox'
    ]
  },
  'provider-support': {
    title: 'Doctor & Hospital Provider Support',
    heroSubtitle: 'Our new Provider Portal is on the way!',
    category: 'Provider Network',
    badge: 'Portal Upgrade in Progress',
    icon: PhoneCall,
    description: 'Our dedicated provider relations team is launching enhanced self-service credentialing, automated appointment reconciliation, and 24x7 technical assistance for healthcare partners.',
    highlights: [
      'Dedicated Provider Relations Account Manager',
      'Fast-track Doctor & Hospital Directory Onboarding',
      'Real-time Appointment Slot & Patient Queue Management',
      'Cashless Insurance & Corporate Billing Support'
    ]
  },
  'about': {
    title: 'About The Sehat Buddy',
    heroSubtitle: 'Our new company story is on the way!',
    category: 'Our Mission & Story',
    badge: 'Company Profile',
    icon: HeartPulse,
    description: 'The Sehat Buddy is India’s patient-first healthcare navigator. We bridge the gap between patients, verified doctors, and accredited hospitals — ensuring quality healthcare is transparent, accessible, and affordable.',
    highlights: [
      '25,000+ Verified Doctors Across 40+ Specialties',
      '1,200+ Accredited Hospitals & Clinics Connected',
      'Dedicated Patient Care Navigators for End-to-End Guidance',
      '100% Transparent Consultations with No Hidden Fees'
    ]
  },
  'contact': {
    title: 'Contact Us & Patient Helpline',
    heroSubtitle: 'Our new Patient Support Center is on the way!',
    category: 'Customer Support',
    badge: 'We are here for you',
    icon: PhoneCall,
    description: 'Need assistance finding a specialist, scheduling priority hospital admission, or managing your booking? Our healthcare coordination desk is available 24 hours a day, 7 days a week.',
    highlights: [
      '24x7 Patient Care Helpline: +91 98765 43210',
      'Official Email: support@thesehatbuddy.com / thesehatbuddy@gmail.com',
      'Corporate Office: Indiranagar, Bengaluru, Karnataka 560038',
      'Average Support Response Time: Under 15 Minutes'
    ]
  },
  'privacy': {
    title: 'Patient Privacy Policy & Data Protection',
    heroSubtitle: 'Our updated Trust & Privacy center is on the way!',
    category: 'Security & Compliance',
    badge: 'Legal & Compliance',
    icon: ShieldCheck,
    description: 'Your health records and personal information are protected by military-grade 256-bit AES encryption. We fully comply with India’s Digital Personal Data Protection Act (DPDPA) and never sell your data.',
    highlights: [
      '256-Bit End-to-End Encryption for All Medical Records',
      'Strict Consent-Based Sharing with Consulting Doctors',
      'Compliant with ABDM & DPDP Healthcare Standards',
      'Instant Right to Access, Correct, or Delete Your Records'
    ]
  },
  'terms': {
    title: 'Terms & Conditions of Service',
    heroSubtitle: 'Our updated Terms of Service is on the way!',
    category: 'Terms of Use',
    badge: 'Legal Agreement',
    icon: FileText,
    description: 'Transparent terms governing patient appointments, provider listings, telemedicine guidelines, and user rights across The Sehat Buddy platform.',
    highlights: [
      'Free Cancellation & Easy Rescheduling for Appointments',
      'Strict Zero-Tolerance Policy for Fake Doctor Profiles',
      'Transparent Pricing with Direct Clinic Payment Option',
      'Ethical Tele-Consultation & Electronic Prescription Compliance'
    ]
  },
  'cities': {
    title: 'More Cities Launching Soon',
    heroSubtitle: 'Our nationwide city expansion is on the way!',
    category: 'Expansion Network',
    badge: 'Nationwide Expansion',
    icon: Building2,
    description: 'We are currently live across Bengaluru, Delhi NCR, and Mumbai, and actively onboarding premier hospitals and clinics across Hyderabad, Chennai, Pune, Kolkata, and tier-2 healthcare hubs.',
    highlights: [
      'Hyderabad & Chennai Network Launching Q4',
      'Tier-2 District Specialty Hospital Partnerships',
      'Multi-Lingual Patient Navigation in 8 Indian Languages',
      'Regional Ambulance & Emergency Care Coverage'
    ]
  }
};

const ComingSoon = ({ featureKey = 'feature', onNavigate }) => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [selectedKey, setSelectedKey] = useState(featureKey);

  // Keep selectedKey in sync with prop if it changes
  React.useEffect(() => {
    if (featureKey) {
      setSelectedKey(featureKey);
    }
  }, [featureKey]);

  // Normalize key
  const normalizedKey = String(selectedKey).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
  
  // Lookup or construct default
  const data = FEATURE_DATA[normalizedKey] || {
    title: normalizedKey
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ') || 'Exciting Healthcare Service',
    heroSubtitle: 'Our new website is on the way!',
    category: 'Healthcare Service',
    badge: 'Coming Soon',
    icon: Sparkles,
    description: 'We are building a seamless digital experience to bring expert healthcare right to your fingertips. Stay tuned!',
    highlights: [
      'Verified Healthcare Providers & Standardized Pricing',
      'Seamless Mobile & Web Booking Experience',
      '24/7 Dedicated Patient Assistance',
      'Priority Access for Registered Sehat Buddy Members'
    ]
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await api.subscribeNewsletter(email.trim(), 'coming-soon', normalizedKey);
      setIsSubscribed(true);
      setEmail('');
      setTimeout(() => setIsSubscribed(false), 8000);
    } catch (err) {
      console.error('Subscription error:', err);
      setIsSubscribed(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectService = (key) => {
    setSelectedKey(key);
    if (onNavigate) {
      onNavigate('coming-soon', key);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <Container>
        {/* HERO BANNER - Exact replication of user's provided artwork */}
        <section className={styles.heroBanner}>
          <div className={styles.heroIllustrationWrapper}>
            <LeftIllustration />
          </div>

          <div className={styles.heroCenterContent}>
            <span className={styles.heroPillBadge}>REVEALING VERY SOON</span>
            <h1 className={styles.heroMainTitle}>COMING SOON</h1>
            <h2 className={styles.heroSubtitle}>
              {data.heroSubtitle || 'Our new website is on the way!'}
            </h2>
            <p className={styles.heroDescription}>
              We are building a seamless digital experience to bring expert healthcare right to your fingertips. Stay tuned!
            </p>

            {isSubscribed ? (
              <div className={styles.subscribedMessage}>
                <CheckCircle size={18} />
                <span>You're on the launch list! We'll notify you as soon as this launches.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className={styles.heroForm}>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.heroEmailInput}
                  required
                />
                <button type="submit" className={styles.heroLaunchBtn}>
                  Notify Me When We Launch
                </button>
              </form>
            )}
          </div>

          <div className={styles.heroIllustrationWrapper}>
            <RightIllustration />
          </div>
        </section>
      </Container>
    </div>
  );
};

export default ComingSoon;
