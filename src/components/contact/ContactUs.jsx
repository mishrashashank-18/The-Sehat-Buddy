import React, { useState } from 'react';
import {
  PhoneCall,
  CalendarClock,
  Mail,
  Building2,
  Clock,
  MapPin,
  Send,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2
} from 'lucide-react';
import Container from '../layout/Container';
import { useData } from '../../context/useData';
import { api } from '../../services/api';
import styles from './ContactUs.module.css';

const INQUIRY_CATEGORIES = [
  'Doctor Appointment & Consultation',
  'Hospital Admission & Bed Availability',
  'Insurance & Cashless TPA Desk',
  'Surgeries & Treatment Estimates',
  'Lab Tests & Health Packages',
  'Hospital or Clinic Tie-up',
  'General Inquiries & Feedback'
];

const FAQS_LIST = [
  {
    q: 'How quickly does your healthcare desk respond to inquiries?',
    a: 'For emergency and urgent inquiries submitted via our 24/7 helpline, support is immediate. Standard digital inquiries submitted through this form are typically answered within 1 to 2 business hours.'
  },
  {
    q: 'Can I book a priority hospital bed through Sehat Buddy?',
    a: 'Yes. Our direct enterprise network connects with leading accredited partner hospitals. Use our 24/7 helpline or the Hospital Admission category above for immediate live bed coordination.'
  },
  {
    q: 'How does cashless insurance coverage work at partner hospitals?',
    a: 'All our accredited partner hospitals feature dedicated Cashless Insurance & TPA desks supporting 40+ leading public and private insurance providers. Bring your policy e-card for on-the-spot pre-authorization.'
  },
  {
    q: 'How can a hospital or clinician join The Sehat Buddy network?',
    a: 'Registered healthcare institutions can select "Hospital or Clinic Tie-up" in the contact form or register directly via our Hospital Portal to start the clinical verification workflow.'
  }
];

export default function ContactUs({ onNavigate }) {
  const { contactInfo, branding } = useData();

  const phones = Array.isArray(contactInfo?.phones) && contactInfo.phones.length > 0
    ? contactInfo.phones
    : [
        { id: 'phone-1', label: 'Helpline & Emergency', number: '+91 98765 43210', isPrimary: true },
        { id: 'phone-2', label: 'Appointments Desk', number: '+91 80000 12345', isPrimary: false }
      ];

  const emails = Array.isArray(contactInfo?.emails) && contactInfo.emails.length > 0
    ? contactInfo.emails
    : [
        { id: 'email-1', label: 'Patient Support', email: 'support@thesehatbuddy.com', isPrimary: true },
        { id: 'email-2', label: 'General Inquiries', email: 'contact@thesehatbuddy.com', isPrimary: false }
      ];

  const workingHours = contactInfo?.workingHours || 'Mon – Sat: 8:00 AM – 8:00 PM';

  const primaryPhone = phones.find(p => p.isPrimary) || phones[0];
  const secondaryPhone = phones.find(p => !p.isPrimary) || phones[1] || phones[0];
  const primaryEmail = emails.find(e => e.isPrimary) || emails[0];
  const secondaryEmail = emails.find(e => !e.isPrimary) || emails[1] || emails[0];

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: INQUIRY_CATEGORIES[0],
    priority: 'Normal',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [openFaq, setOpenFaq] = useState(0);

  const handleCopy = (text, id) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!formData.message.trim()) {
      setErrorMsg('Please write your message or medical query.');
      return;
    }

    setLoading(true);
    try {
      if (api.submitInquiry) {
        await api.submitInquiry(formData);
      }
      setSuccessMsg(`Thank you, ${formData.name}! Your inquiry has been received. Our healthcare care team will contact you shortly.`);
      setFormData({
        name: '',
        email: '',
        phone: '',
        category: INQUIRY_CATEGORIES[0],
        priority: 'Normal',
        message: ''
      });
    } catch (err) {
      setErrorMsg(err.message || 'Unable to submit your inquiry at this moment. Please call our 24/7 helpline.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <Container>
          <div className={styles.breadcrumb}>
            <button type="button" onClick={() => onNavigate && onNavigate('site')} className={styles.breadLink}>
              Home
            </button>
            <span className={styles.breadSep}>/</span>
            <span className={styles.breadCurrent}>Contact Us</span>
          </div>

          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>
              <HeadphonesIcon size={14} /> 24/7 Patient & Partner Support
            </span>
            <h1 className={styles.heroTitle}>We're Here to Help You and Your Family</h1>
            <p className={styles.heroSubtitle}>
              Whether you need priority hospital admissions, consultations with top clinicians, cashless insurance guidance, or enterprise tie-ups — our dedicated healthcare care desk is ready.
            </p>
          </div>
        </Container>
      </section>

      {/* Quick Helplines Grid */}
      <section className={styles.cardsSection}>
        <Container>
          <div className={styles.cardsGrid}>
            {/* Helpline 1 */}
            <div className={styles.contactCard}>
              <div className={`${styles.cardIconCircle} ${styles.bgEmerald}`}>
                <PhoneCall size={22} color="#059669" />
              </div>
              <div className={styles.cardTagRow}>
                <span className={styles.cardLabel}>{primaryPhone.label || 'Helpline & Emergency'}</span>
                <span className={`${styles.statusBadge} ${styles.statusActive}`}>24x7 Active</span>
              </div>
              <a href={`tel:${primaryPhone.number.replace(/\s+/g, '')}`} className={styles.cardValue}>
                {primaryPhone.number}
              </a>
              <div className={styles.cardActionRow}>
                <a href={`tel:${primaryPhone.number.replace(/\s+/g, '')}`} className={styles.cardActionBtnPrimary}>
                  <PhoneCall size={13} />
                  <span>Call Now</span>
                </a>
                <button
                  type="button"
                  onClick={() => handleCopy(primaryPhone.number, 'p1')}
                  className={styles.cardActionBtnSecondary}
                  title="Copy Phone Number"
                >
                  {copiedId === 'p1' ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                  <span>{copiedId === 'p1' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Helpline 2 */}
            <div className={styles.contactCard}>
              <div className={`${styles.cardIconCircle} ${styles.bgBlue}`}>
                <CalendarClock size={22} color="#2563eb" />
              </div>
              <div className={styles.cardTagRow}>
                <span className={styles.cardLabel}>{secondaryPhone.label || 'Appointments Desk'}</span>
                <span className={`${styles.statusBadge} ${styles.statusBlue}`}>Doctor Care</span>
              </div>
              <a href={`tel:${secondaryPhone.number.replace(/\s+/g, '')}`} className={styles.cardValue}>
                {secondaryPhone.number}
              </a>
              <div className={styles.cardActionRow}>
                <a href={`tel:${secondaryPhone.number.replace(/\s+/g, '')}`} className={styles.cardActionBtnPrimary}>
                  <PhoneCall size={13} />
                  <span>Call Desk</span>
                </a>
                <button
                  type="button"
                  onClick={() => handleCopy(secondaryPhone.number, 'p2')}
                  className={styles.cardActionBtnSecondary}
                  title="Copy Phone Number"
                >
                  {copiedId === 'p2' ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                  <span>{copiedId === 'p2' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Email 1 */}
            <div className={styles.contactCard}>
              <div className={`${styles.cardIconCircle} ${styles.bgIndigo}`}>
                <Mail size={22} color="#4f46e5" />
              </div>
              <div className={styles.cardTagRow}>
                <span className={styles.cardLabel}>{primaryEmail.label || 'Patient Support'}</span>
                <span className={`${styles.statusBadge} ${styles.statusIndigo}`}>Avg &lt; 2 hrs</span>
              </div>
              <a href={`mailto:${primaryEmail.email}`} className={styles.cardValue} style={{ fontSize: '1.05rem' }}>
                {primaryEmail.email}
              </a>
              <div className={styles.cardActionRow}>
                <a href={`mailto:${primaryEmail.email}`} className={styles.cardActionBtnPrimary}>
                  <Mail size={13} />
                  <span>Email Us</span>
                </a>
                <button
                  type="button"
                  onClick={() => handleCopy(primaryEmail.email, 'e1')}
                  className={styles.cardActionBtnSecondary}
                  title="Copy Email Address"
                >
                  {copiedId === 'e1' ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                  <span>{copiedId === 'e1' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Email 2 */}
            <div className={styles.contactCard}>
              <div className={`${styles.cardIconCircle} ${styles.bgPurple}`}>
                <Building2 size={22} color="#7c3aed" />
              </div>
              <div className={styles.cardTagRow}>
                <span className={styles.cardLabel}>{secondaryEmail.label || 'Hospital & Enterprise'}</span>
                <span className={`${styles.statusBadge} ${styles.statusPurple}`}>Partnerships</span>
              </div>
              <a href={`mailto:${secondaryEmail.email}`} className={styles.cardValue} style={{ fontSize: '1.05rem' }}>
                {secondaryEmail.email}
              </a>
              <div className={styles.cardActionRow}>
                <a href={`mailto:${secondaryEmail.email}`} className={styles.cardActionBtnPrimary}>
                  <Mail size={13} />
                  <span>Partner Desk</span>
                </a>
                <button
                  type="button"
                  onClick={() => handleCopy(secondaryEmail.email, 'e2')}
                  className={styles.cardActionBtnSecondary}
                  title="Copy Email Address"
                >
                  {copiedId === 'e2' ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                  <span>{copiedId === 'e2' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Main 2-Column Section: Form + Details */}
      <section className={styles.mainSection}>
        <Container>
          <div className={styles.twoColumnGrid}>
            {/* Left Column: Form */}
            <div className={styles.formContainer}>
              <div className={styles.formHeader}>
                <div className={styles.formIconBadge}>
                  <MessageSquare size={20} color="#2563eb" />
                </div>
                <div>
                  <h2 className={styles.formTitle}>Send Us a Message</h2>
                  <p className={styles.formSubtitle}>
                    Fill out the form below and an assigned healthcare coordinator will get back to you immediately.
                  </p>
                </div>
              </div>

              {successMsg && (
                <div className={styles.successBox}>
                  <CheckCircle2 size={20} color="#16a34a" style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Message Sent Successfully</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>{successMsg}</p>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className={styles.errorBox}>
                  <AlertTriangle size={20} color="#dc2626" style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Unable to Submit</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>{errorMsg}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.fieldRow}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>
                      Full Name <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="e.g. Rahul Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>
                      Email Address <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="email"
                      className={styles.input}
                      placeholder="e.g. rahul@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Phone Number (Optional)</label>
                    <input
                      type="tel"
                      className={styles.input}
                      placeholder="e.g. +91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Inquiry Category</label>
                    <select
                      className={styles.select}
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {INQUIRY_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Priority Level</label>
                  <div className={styles.priorityPills}>
                    {['Normal', 'Urgent', 'Medical Emergency'].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFormData({ ...formData, priority: p })}
                        className={`${styles.priorityPill} ${formData.priority === p ? styles.priorityPillActive : ''} ${p === 'Medical Emergency' && formData.priority === p ? styles.priorityPillEmergency : ''}`}
                      >
                        {p === 'Medical Emergency' ? '🚨 ' : p === 'Urgent' ? '⚡ ' : '📋 '}
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {formData.priority === 'Medical Emergency' && (
                  <div className={styles.emergencyWarning}>
                    <AlertTriangle size={18} color="#b91c1c" />
                    <span>
                      <strong>Notice:</strong> For life-threatening clinical emergencies requiring instant triage, please dial <strong>108 / 112</strong> or call our 24/7 Helpline at <strong>{primaryPhone.number}</strong> immediately.
                    </span>
                  </div>
                )}

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>
                    Message / Medical Query <span className={styles.required}>*</span>
                  </label>
                  <textarea
                    rows={5}
                    className={styles.textarea}
                    placeholder="Tell us more about how our clinical and patient desk can assist you..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={styles.submitBtn}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Sending Your Message...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Submit Message</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right Column: Platform Assistance & Physical Hub */}
            <div className={styles.infoContainer}>
              {/* Timing Card */}
              <div className={styles.infoCard}>
                <div className={styles.infoHeader}>
                  <Clock size={20} color="#2563eb" />
                  <h3 className={styles.infoTitle}>Operational Timings</h3>
                </div>
                <div className={styles.timingList}>
                  <div className={styles.timingItem}>
                    <span className={styles.timingLabel}>Standard Support Desk:</span>
                    <span className={styles.timingVal}>{workingHours}</span>
                  </div>
                  <div className={styles.timingItem}>
                    <span className={styles.timingLabel}>Emergency Medical Helpline:</span>
                    <span className={styles.timingValBadge}>24 Hours / 7 Days Uninterrupted</span>
                  </div>
                  <div className={styles.timingItem}>
                    <span className={styles.timingLabel}>Cashless Pre-Auth Desk:</span>
                    <span className={styles.timingVal}>Mon – Sun: 24x7 In-Hospital Desk</span>
                  </div>
                </div>
              </div>

              {/* Physical Hub Location */}
              <div className={styles.infoCard}>
                <div className={styles.infoHeader}>
                  <MapPin size={20} color="#2563eb" />
                  <h3 className={styles.infoTitle}>Healthcare Coordination Hub</h3>
                </div>
                <p className={styles.infoDesc}>
                  Headquartered in the technology and healthcare capital of India, orchestrating clinical networks and cashless priority hospital beds across major metropolitan centers.
                </p>
                <div className={styles.locationPill}>
                  <MapPin size={15} color="#059669" />
                  <span>Bengaluru, Karnataka 560076, India</span>
                </div>
              </div>

              {/* Direct WhatsApp Channel */}
              <div className={`${styles.infoCard} ${styles.whatsappCard}`}>
                <div className={styles.infoHeader}>
                  <MessageSquare size={20} color="#16a34a" />
                  <h3 className={styles.infoTitle}>Instant WhatsApp Assistance</h3>
                </div>
                <p className={styles.infoDesc}>
                  Connect directly with a patient care representative via WhatsApp for quick questions on appointment availability and hospital routes.
                </p>
                <a
                  href={`https://wa.me/${primaryPhone.number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hello Sehat Buddy Team, I would like to inquire about healthcare services.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.whatsappBtn}
                >
                  <span>Chat on WhatsApp</span>
                  <ExternalLink size={15} />
                </a>
              </div>

              {/* Quick Navigation Shortcuts */}
              <div className={styles.quickShortcuts}>
                <h4 className={styles.shortcutsTitle}>Quick Navigation</h4>
                <div className={styles.shortcutBtns}>
                  <button
                    type="button"
                    onClick={() => onNavigate && onNavigate('find-doctors')}
                    className={styles.shortcutBtn}
                  >
                    <span>Browse Verified Doctors</span>
                    <ArrowRight size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate && onNavigate('find-hospitals')}
                    className={styles.shortcutBtn}
                  >
                    <span>Explore Partner Hospitals</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Frequently Asked Questions */}
      <section className={styles.faqSection}>
        <Container>
          <div className={styles.faqHeader}>
            <span className={styles.faqBadge}>COMMON QUESTIONS</span>
            <h2 className={styles.faqTitle}>Frequently Asked Questions</h2>
            <p className={styles.faqSubtitle}>
              Find quick answers to common inquiries regarding appointments, hospital beds, and clinical coordination.
            </p>
          </div>

          <div className={styles.faqGrid}>
            {FAQS_LIST.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className={`${styles.faqCard} ${isOpen ? styles.faqCardOpen : ''}`}
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                >
                  <div className={styles.faqQuestionRow}>
                    <h3 className={styles.faqQuestion}>{faq.q}</h3>
                    <div className={styles.faqChevron}>
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>
                  {isOpen && (
                    <div className={styles.faqAnswer}>
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Container>
      </section>
    </div>
  );
}

function HeadphonesIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  );
}
