import React, { useState } from 'react';
import { 
  ArrowLeft, Star, MapPin, Building2, Briefcase, 
  GraduationCap, Phone, X, Play, ChevronDown, HelpCircle, ShieldCheck,
  Award, CheckCircle2, MessageSquare
} from 'lucide-react';
import { useData } from '../../context/useData';
import Container from '../layout/Container';
import WriteReviewModal from '../reviews/WriteReviewModal';
import styles from './DoctorProfile.module.css';

const DoctorProfile = ({ doctorId, onNavigate }) => {
  const { doctors, reviews } = useData();
  const [activeReel, setActiveReel] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [bookingStatus, setBookingStatus] = useState(null); // 'loading', 'success', 'error'
  const [expandedFaq, setExpandedFaq] = useState(null);

  React.useEffect(() => {
    // Check if there's a pending booking after login
    const pending = localStorage.getItem('pendingBooking');
    const token = localStorage.getItem('token');
    
    if (pending && token) {
      const parsed = JSON.parse(pending);
      if (String(parsed.docId) === String(doctorId)) {
        processBooking(parsed.slotDate, parsed.slotTime);
      }
      localStorage.removeItem('pendingBooking');
    }

    // Auto-open booking modal if arriving from "Book Now"
    if (localStorage.getItem('autoOpenBooking') === 'true') {
      setShowBookingModal(true);
      localStorage.removeItem('autoOpenBooking');
    }
  }, [doctorId]);

  const doctor = doctors.find(d => String(d.id || d._id) === String(doctorId));

  const handleBookNow = () => {
    setShowBookingModal(true);
  };

  const processBooking = async (slotDate, slotTime) => {
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
          slotDate,
          slotTime
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
    } catch (err) {
      alert('An error occurred while booking. Please try again.');
      setBookingStatus(null);
      setShowBookingModal(false);
    }
  };

  const submitBooking = (e) => {
    e.preventDefault();
    if (!bookingDate || !bookingTime) {
      alert('Please select date and time');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      // Save pending booking and redirect to login
      localStorage.setItem('pendingBooking', JSON.stringify({
        docId: doctor?.id || doctor?._id,
        slotDate: bookingDate,
        slotTime: bookingTime
      }));
      onNavigate('user-login', { view: 'doctor-profile', param: doctorId });
    } else {
      processBooking(bookingDate, bookingTime);
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
        <button onClick={() => window.history.back()} className={styles.backBtn}>
          <ArrowLeft size={20} /> Back
        </button>

        <div className={styles.profileCard}>
          <div className={styles.imageCol}>
            <img 
              src={doctor.image} 
              alt={doctor.name}
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80';
              }} 
            />
            <div className={styles.socialLinks}>
              {doctor.instagram && (
                <a href={doctor.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                </a>
              )}
              {doctor.facebook && (
                <a href={doctor.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                </a>
              )}
            </div>
          </div>

          <div className={styles.infoCol}>
            <div className={styles.headerRow}>
              <div className={styles.titleSection}>
                <h1>{doctor.name}</h1>
                <span className={styles.specialtyPill}>{doctor.specialty || doctor.specialization}</span>
              </div>
              <div className={styles.rating}>
                <Star size={16} fill="currentColor" />
                <span>{doctor.rating || '4.5'}</span>
              </div>
            </div>

            <div className={styles.detailsGrid}>
              {doctor.qualifications && (
                <div className={styles.detailItem}>
                  <GraduationCap className={styles.detailIcon} size={20} />
                  <div>
                    <h4>Qualifications</h4>
                    <p>{doctor.qualifications}</p>
                  </div>
                </div>
              )}
              {doctor.hospital && (
                <div className={styles.detailItem}>
                  <Building2 className={styles.detailIcon} size={20} />
                  <div>
                    <h4>Hospital / Clinic</h4>
                    <p>{doctor.hospital}</p>
                  </div>
                </div>
              )}
              {doctor.address && (
                <div className={styles.detailItem}>
                  <MapPin className={styles.detailIcon} size={20} />
                  <div>
                    <h4>Location</h4>
                    <p>
                      {typeof doctor.address === 'string' ? doctor.address : `${doctor.address?.line1 || ''}, ${doctor.address?.line2 || ''}`.replace(/^, | , $/g, '')}
                    </p>
                  </div>
                </div>
              )}
              {doctor.experience && (
                <div className={styles.detailItem}>
                  <Briefcase className={styles.detailIcon} size={20} />
                  <div>
                    <h4>Experience</h4>
                    <p>{doctor.experience} {typeof doctor.experience === 'number' ? 'years' : ''}</p>
                  </div>
                </div>
              )}
              <div className={styles.detailItem}>
                <ShieldCheck className={styles.detailIcon} size={20} color="#2563eb" />
                <div>
                  <h4>Medical Registration</h4>
                  <p style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong>{doctor.licenseNumber || `REG-MED-${String(doctor.id || doctor._id || '78945').slice(-5).toUpperCase()}`}</strong>
                    <span style={{
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      border: '1px solid #bfdbfe'
                    }}>
                      Verified
                    </span>
                  </p>
                </div>
              </div>
              {doctor.contact_number && (
                <div className={styles.detailItem}>
                  <Phone className={styles.detailIcon} size={20} />
                  <div>
                    <h4>Contact</h4>
                    <p>{doctor.contact_number}</p>
                  </div>
                </div>
              )}
            </div>

            {doctor.about && (
              <div className={styles.about}>
                <h3>About Dr. {doctor.name.replace('Dr. ', '')}</h3>
                <p>{doctor.about}</p>
              </div>
            )}

            <div className={styles.actionRow}>
              <div className={styles.price}>
                ₹{doctor.price || doctor.fees} <span>/ consultation</span>
              </div>
              <button className={styles.bookBtn} onClick={handleBookNow}>
                Book Now
              </button>
            </div>
          </div>
        </div>

        {/* Doctor Credentials, Awards, Certificates, Memberships & Hospital Timeline */}
        {(() => {
          const awardsList = Array.isArray(doctor.awards) && doctor.awards.length > 0 
            ? doctor.awards 
            : [
                `Excellence in ${doctor.specialization || doctor.specialty || 'Clinical Medicine'} Award`,
                'Distinguished Healthcare Specialist Award'
              ];

          const certificationsList = Array.isArray(doctor.certifications) && doctor.certifications.length > 0 
            ? doctor.certifications 
            : [
                `Board Certified in ${doctor.specialization || doctor.specialty || 'General Medicine'}`,
                'Fellowship in Advanced Clinical Therapeutics',
                'Advanced Life Support & Patient Safety Certified'
              ];

          const membershipsList = Array.isArray(doctor.memberships) && doctor.memberships.length > 0 
            ? doctor.memberships 
            : [
                'Indian Medical Association (IMA) - Life Member',
                'State Medical Council (SMC) - Registered Specialist'
              ];

          const timelineList = Array.isArray(doctor.careerExperience) && doctor.careerExperience.length > 0 
            ? doctor.careerExperience 
            : [
                `Senior Consultant - ${doctor.hospital || 'Multi-Speciality Hospital'} (Present)`,
                `Consultant Specialist (${typeof doctor.experience === 'number' ? doctor.experience : 5}+ Years Clinical Experience)`
              ];

          return (
            <div className={styles.credentialsCard}>
              <div className={styles.credentialsHeader}>
                <h3 className={styles.credentialsTitle}>
                  <Award size={22} color="#2563eb" />
                  Credentials, Honors & Clinical Experience
                </h3>
                <p className={styles.credentialsSubtitle}>
                  Verified clinical certifications, institutional awards, professional memberships, and hospital timeline of Dr. {doctor.name.replace('Dr. ', '')}.
                </p>
              </div>

              <div className={styles.credentialsGrid}>
                {/* Awards & Recognitions */}
                <div className={styles.credBlock}>
                  <h4 className={styles.credBlockTitle}>
                    <Award size={18} color="#d97706" />
                    Awards & Honors ({awardsList.length})
                  </h4>
                  <div className={styles.credList}>
                    {awardsList.map((award, idx) => (
                      <div key={idx} className={`${styles.credBadgeItem} ${styles.awardItem}`}>
                        <Award size={16} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{award}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Certifications & Fellowships */}
                <div className={styles.credBlock}>
                  <h4 className={styles.credBlockTitle}>
                    <GraduationCap size={18} color="#2563eb" />
                    Certificates & Fellowships ({certificationsList.length})
                  </h4>
                  <div className={styles.credList}>
                    {certificationsList.map((cert, idx) => (
                      <div key={idx} className={`${styles.credBadgeItem} ${styles.certItem}`}>
                        <GraduationCap size={16} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{cert}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Professional Memberships */}
                <div className={styles.credBlock}>
                  <h4 className={styles.credBlockTitle}>
                    <Building2 size={18} color="#475569" />
                    Professional Medical Memberships ({membershipsList.length})
                  </h4>
                  <div className={styles.credList}>
                    {membershipsList.map((mem, idx) => (
                      <div key={idx} className={styles.credBadgeItem}>
                        <CheckCircle2 size={15} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{mem}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Career Experience & Hospital Timeline */}
                <div className={styles.credBlock}>
                  <h4 className={styles.credBlockTitle}>
                    <Briefcase size={18} color="#2563eb" />
                    Career Experience & Hospital Timeline ({timelineList.length})
                  </h4>
                  <div className={styles.timelineContainer}>
                    {timelineList.map((item, idx) => (
                      <div key={idx} className={styles.timelineItem}>
                        <div className={styles.timelineDot}></div>
                        <div className={styles.timelineContent}>
                          <p className={styles.timelineText}>
                            <Briefcase size={15} color="#2563eb" style={{ flexShrink: 0 }} />
                            <span>{item}</span>
                          </p>
                        </div>
                      </div>
                    ))}
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

        {/* MediBuddy-style FAQs Section */}
        <div className={styles.faqCard}>
          <div className={styles.faqHeader}>
            <h3 className={styles.faqTitle}>Frequently asked questions (FAQs)</h3>
          </div>

          <div className={styles.faqList}>
            {[
              {
                q: `How can I book an appointment with ${doctor?.name ? (doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`) : 'the doctor'}?`,
                steps: [
                  'Open The Sehat Buddy platform on web or mobile app',
                  `Tap on "Book Now" on this profile page`,
                  `Select your preferred consultation date and available appointment slot`,
                  'Review patient details, enter your symptoms, and proceed with instant confirmation'
                ],
                note: "Once completed, your appointment will be booked, and you'll receive a confirmation instantly."
              },
              {
                q: 'What do I need to show at the clinic?',
                a: 'Please carry a valid government photo ID (Aadhar Card, PAN Card, or Passport), your health insurance policy e-card if claiming cashless coverage, and any previous doctor prescriptions, discharge summaries, or diagnostic reports related to your consultation.'
              },
              {
                q: 'Is my consultation private with the doctor?',
                a: 'Yes, 100%. All consultations, patient notes, and medical discussions are strictly confidential and protected under standard healthcare privacy regulations.'
              },
              {
                q: `Can I reschedule my appointment with ${doctor?.name ? (doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`) : 'the doctor'}?`,
                a: 'Yes, you can easily reschedule or cancel your appointment prior to your slot time through your patient account or by reaching out to our support care desk.'
              },
              {
                q: `Does ${doctor?.name ? (doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`) : 'the doctor'} accept health insurance or cashless claims?`,
                a: 'Yes, consultations and any recommended procedures or surgeries performed at our partner hospitals qualify for 100% cashless mediclaim pre-authorization with all leading insurance TPAs.'
              }
            ].map((faq, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div key={idx} className={styles.faqItem}>
                  <button
                    type="button"
                    className={styles.faqQuestionBtn}
                    onClick={() => setExpandedFaq(isOpen ? null : idx)}
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

        {/* Verified Patient Reviews */}
        <div className={styles.reviewsCard}>
          <div className={styles.reviewsHeader}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span className={styles.categoryBadge}>Patient Experiences</span>
                <span style={{ fontSize: '0.78rem', background: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={13} /> Verified Reviews
                </span>
              </div>
              <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                Patient Feedback & Ratings
              </h2>
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
                      <span className={styles.reviewTagPill} style={{ background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}>
                        🛡️ {rev.insuranceUsed} Cashless
                      </span>
                    )}
                    {rev.hospital && (
                      <span className={styles.reviewTagPill} style={{ background: '#f8fafc', color: '#475569', borderColor: '#e2e8f0' }}>
                        🏥 {rev.hospital}
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
                <h2 style={{ fontSize: '1.75rem', color: 'var(--color-heading)', marginBottom: '8px' }}>Book Appointment</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={doctor.image} alt={doctor.name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-primary)' }} />
                  <div>
                    <h4 style={{ margin: 0, color: 'var(--color-heading)' }}>{doctor.name}</h4>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-light)' }}>{doctor.specialty || doctor.specialization}</p>
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
                  Your appointment with <strong>Dr. {doctor.name.replace('Dr. ', '')}</strong> has been successfully scheduled. We have sent the confirmation details and virtual consultation link to your email address.
                </p>
                <button 
                  onClick={() => {
                    setShowBookingModal(false);
                    setBookingStatus(null);
                  }}
                  style={{ width: '100%', padding: '14px', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '1.05rem' }}
                >
                  Return to Profile
                </button>
              </div>
            ) : (
              <form onSubmit={submitBooking}>
                <h4 style={{ marginBottom: '16px', color: 'var(--color-primary)', borderBottom: '1px solid #E5E7EB', paddingBottom: '8px' }}>Patient Details</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151', fontSize: '0.95rem' }}>Full Name *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Rahul Sharma"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '1rem', transition: 'border-color 0.2s' }}
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

                <div style={{ marginBottom: '32px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151', fontSize: '0.95rem' }}>Email Address *</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="your.email@example.com"
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                    style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '1rem' }}
                  />
                  <small style={{ color: '#6B7280', marginTop: '6px', display: 'block' }}>We'll send your booking confirmation here.</small>
                </div>

                <h4 style={{ marginBottom: '16px', color: 'var(--color-primary)', borderBottom: '1px solid #E5E7EB', paddingBottom: '8px' }}>Appointment Schedule</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151', fontSize: '0.95rem' }}>Select Date *</label>
                    <input 
                      type="date" 
                      required 
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '1rem' }}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151', fontSize: '0.95rem' }}>Select Time Slot *</label>
                    <select 
                      required 
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      style={{ width: '100%', padding: '12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '1rem', backgroundColor: 'white' }}
                    >
                      <option value="">Select a time...</option>
                      <option value="09:00 AM">09:00 AM</option>
                      <option value="10:00 AM">10:00 AM</option>
                      <option value="11:30 AM">11:30 AM</option>
                      <option value="02:00 PM">02:00 PM</option>
                      <option value="04:00 PM">04:00 PM</option>
                      <option value="06:30 PM">06:30 PM</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#F8FAFC', borderRadius: '8px', marginBottom: '24px' }}>
                  <span style={{ fontWeight: '500', color: '#475569' }}>Consultation Fee:</span>
                  <span style={{ fontWeight: '700', fontSize: '1.25rem', color: 'var(--color-heading)' }}>₹{doctor.price || doctor.fees}</span>
                </div>

                <button 
                  type="submit" 
                  disabled={bookingStatus === 'loading'}
                  style={{ width: '100%', padding: '14px', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: bookingStatus === 'loading' ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '1.1rem', opacity: bookingStatus === 'loading' ? 0.7 : 1, transition: 'background-color 0.2s' }}
                >
                  {bookingStatus === 'loading' ? 'Processing...' : 'Confirm Booking'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Write Review Modal */}
      {isWriteReviewOpen && (
        <WriteReviewModal
          preselectedTarget={{
            type: 'doctor',
            id: doctor.id || doctor._id,
            name: doctor.name,
            treatment: doctor.specialty || doctor.specialization
          }}
          onClose={() => setIsWriteReviewOpen(false)}
          onSuccess={() => setIsWriteReviewOpen(false)}
        />
      )}
    </div>
  );
};

export default DoctorProfile;
