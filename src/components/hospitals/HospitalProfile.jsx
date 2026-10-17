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
  HelpCircle
} from 'lucide-react';
import { useData } from '../../context/useData';
import Container from '../layout/Container';
import HospitalDirections from './HospitalDirections';
import HospitalInsuranceModal from '../insurance/HospitalInsuranceModal';
import WriteReviewModal from '../reviews/WriteReviewModal';
import SpecialitiesProceduresSection from '../specialities/SpecialitiesProceduresSection';
import styles from './HospitalProfile.module.css';

const DEFAULT_REELS = [
  'https://www.instagram.com/reel/DeArmJdSQa6/?stkn=MWhjZGczNGhyandlbA==',
  'https://www.instagram.com/reel/DeAA8evMsBS/?stkn=cDQ0YXFpOG5kaDc1',
  'https://www.instagram.com/reel/DdrR6vApDBK/?stkn=MXV6Yzg4NzM3cDdlbw==',
  'https://www.instagram.com/reel/DdmEKEvTVC5/?utm_source=ig_web_copy_link&stkn=NTc4MTIwNjQ2YQ==',
  'https://www.instagram.com/reel/DdeXVmDohij/?stkn=b2RzcXFveTY2azZv'
];

const DEFAULT_VIDEOS = [
  'https://www.youtube.com/watch?v=zCCD52Pty4A',
  'https://www.youtube.com/watch?v=FN3MFhYPWWo',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
  'https://www.youtube.com/watch?v=JGwWNGJdvx8'
];

const HospitalProfile = ({ hospitalId, onNavigate }) => {
  const { hospitals, doctors, reviews } = useData();
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

  const hospital = hospitals.find(h => String(h.id || h._id) === String(hospitalId)) || hospitals[0];

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
          <div className={styles.imageCol}>
            <div className={styles.imageWrapper}>
              <img
                src={hospital.image}
                alt={hospital.name}
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=800&q=80';
                }}
              />

              {hospital.city && (
                <div className={styles.cityBadge}>
                  <MapPin size={13} /> {hospital.city}
                </div>
              )}
            </div>

            <div className={styles.contactBox}>
              {hospital.phone && (
                <a href={`tel:${hospital.phone}`} className={styles.contactItem}>
                  <Phone size={16} />
                  <span>{hospital.phone}</span>
                </a>
              )}
              {hospital.email && (
                <a href={`mailto:${hospital.email}`} className={styles.contactItem}>
                  <Mail size={16} />
                  <span>{hospital.email}</span>
                </a>
              )}
              {hospital.establishedYear && (
                <div className={styles.contactItem} style={{ color: '#64748b' }}>
                  <Calendar size={16} />
                  <span>Established in {hospital.establishedYear}</span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.infoCol}>
            <div className={styles.headerRow}>
              <div className={styles.titleSection}>
                <h1>{hospital.name}</h1>
                <div className={styles.verifiedPill}>
                  <ShieldCheck size={15} /> Verified Healthcare Partner
                </div>
              </div>
              <div className={styles.rating}>
                <Star size={16} fill="#EAB308" color="#EAB308" />
                <span>{hospital.rating || '4.8'}</span>
                <span style={{ fontSize: '0.8rem', opacity: 0.8, fontWeight: 500 }}>
                  ({hospital.reviews || '50+'})
                </span>
              </div>
            </div>

            <div className={styles.locationActionRow}>
              <div className={styles.addressRow}>
                <MapPin size={18} />
                <span>{hospital.address}</span>
              </div>
              <div className={styles.headerActionsStack}>
                <button
                  type="button"
                  className={styles.insuranceBtn}
                  onClick={() => setIsInsuranceModalOpen(true)}
                  title="Search all available insurances in this hospital"
                >
                  <ShieldCheck size={16} />
                  <span>Insurance</span>
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
                      <span>Getting your location...</span>
                    </>
                  ) : (
                    <>
                      <Navigation size={16} />
                      <span>📍 Get Directions</span>
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
              <div className={styles.statPill}>
                <Bed size={16} />
                <span>{hospital.totalBeds || 400} Inpatient Beds</span>
              </div>
              {hospital.emergency24x7 && (
                <div className={styles.statPill}>
                  <ShieldCheck size={16} />
                  <span>24x7 Trauma & ER Ready</span>
                </div>
              )}
              {hospital.establishedYear && (
                <div className={styles.statPill}>
                  <Calendar size={16} />
                  <span>Est. {hospital.establishedYear}</span>
                </div>
              )}
            </div>

            {hospital.specialties && hospital.specialties.length > 0 && (
              <div className={styles.specialtiesSection}>
                <div className={styles.sectionSubLabel}>Departments & Key Specialties</div>
                <div className={styles.specialtiesWrap}>
                  {hospital.specialties.map((spec, i) => (
                    <span key={i} className={styles.specBadge}>{spec}</span>
                  ))}
                </div>
              </div>
            )}

            {hospital.description && (
              <div className={styles.aboutBox}>
                <div className={styles.sectionSubLabel}>About This Facility</div>
                <p>{hospital.description}</p>
              </div>
            )}
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
              <h3 className={styles.faqTitle}>Frequently asked questions (FAQs)</h3>
              <p className={styles.faqSubtitle}>
                Essential answers regarding 100% cashless mediclaim, patient admission, specialists, and visiting policies at {hospital.name}.
              </p>
            </div>

            <div className={styles.faqList}>
              {[
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
                return (
                  <div key={idx} className={styles.faqItem}>
                    <button
                      type="button"
                      className={styles.faqQuestionBtn}
                      onClick={() => setExpandedHospitalFaq(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        size={18}
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
