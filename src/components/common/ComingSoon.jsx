import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle,
  ArrowLeft,
  Mail,
  ShieldCheck,
  Stethoscope,
  Building2,
  Clock,
  FlaskConical,
  Activity,
  HeartPulse,
  Users,
  Baby,
  Heart,
  PhoneCall,
  FileText
} from 'lucide-react';
import Container from '../layout/Container';
import styles from './ComingSoon.module.css';

const FEATURE_DATA = {
  'lab-tests': {
    title: 'Lab Tests & Diagnostic Health Packages',
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

  // Normalize key
  const normalizedKey = String(featureKey).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
  
  // Lookup or construct default
  const data = FEATURE_DATA[normalizedKey] || {
    title: normalizedKey
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ') || 'Exciting Healthcare Feature',
    category: 'Healthcare Service',
    badge: 'Feature in Development',
    icon: Sparkles,
    description: 'We are actively developing this feature with verified medical practitioners and hospital partners. It will be available on The Sehat Buddy very soon.',
    highlights: [
      'Verified Healthcare Providers & Standardized Pricing',
      'Seamless Mobile & Web Booking Experience',
      '24/7 Dedicated Patient Assistance',
      'Priority Access for Registered Sehat Buddy Members'
    ]
  };

  const IconComponent = data.icon || Sparkles;

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSubscribed(true);
    setEmail('');
    setTimeout(() => setIsSubscribed(false), 5000);
  };

  return (
    <div className={styles.pageContainer}>
      <Container>
        <div className={styles.card}>
          <div className={styles.topAccentBar}></div>

          {/* Badge Row */}
          <div className={styles.badgeRow}>
            <span className={styles.comingSoonBadge}>
              <Sparkles size={14} />
              {data.badge || 'Coming Soon'}
            </span>
            <span className={styles.categoryBadge}>
              <IconComponent size={14} />
              {data.category}
            </span>
          </div>

          {/* Header Title & Description */}
          <div className={styles.headerText}>
            <h1 className={styles.title}>{data.title}</h1>
            <p className={styles.description}>{data.description}</p>
          </div>

          {/* Highlights Section */}
          {Array.isArray(data.highlights) && data.highlights.length > 0 && (
            <div className={styles.highlightsSection}>
              <div className={styles.highlightsTitle}>What to Expect with This Feature</div>
              <div className={styles.highlightsGrid}>
                {data.highlights.map((highlight, idx) => (
                  <div key={idx} className={styles.highlightItem}>
                    <CheckCircle size={18} className={styles.highlightIcon} />
                    <span className={styles.highlightText}>{highlight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notify Me Box */}
          <div className={styles.notifyBox}>
            <h3 className={styles.notifyTitle}>Be the first to know when this launches</h3>
            <p className={styles.notifyDesc}>
              Enter your email to receive early access, exclusive introductory packages, and updates.
            </p>

            {isSubscribed ? (
              <div className={styles.subscribedMessage}>
                <CheckCircle size={18} />
                <span>You're on the early-access list! We'll notify you as soon as this feature goes live.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className={styles.notifyForm}>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.notifyInput}
                  required
                />
                <button type="submit" className={styles.notifyBtn}>
                  Notify Me
                </button>
              </form>
            )}
          </div>

          {/* Active Features Navigation */}
          <div className={styles.activeFeaturesRow}>
            <p className={styles.activeFeaturesTitle}>
              Need immediate healthcare consultation? These services are fully live right now:
            </p>
            <div className={styles.activeButtonsGroup}>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('site')}
                className={styles.secondaryBtn}
              >
                <ArrowLeft size={16} />
                Back to Home
              </button>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('find-doctors')}
                className={styles.primaryBtn}
              >
                <Stethoscope size={16} />
                Find Doctors
              </button>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('find-hospitals')}
                className={styles.primaryBtn}
              >
                <Building2 size={16} />
                Explore Hospitals
              </button>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default ComingSoon;
