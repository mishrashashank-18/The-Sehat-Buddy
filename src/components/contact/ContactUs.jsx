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
  ExternalLink,
  Loader2,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import Container from '../layout/Container';
import PolicyViewerModal from '../common/PolicyViewerModal';
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
  const [activePolicyType, setActivePolicyType] = useState(null);

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
      setErrorMsg('Please write your message or query.');
      return;
    }

    setLoading(true);
    try {
      if (api.submitInquiry) {
        await api.submitInquiry(formData);
      }
      setSuccessMsg(`Thank you, ${formData.name}! Your inquiry has been received. Our care desk will get in touch shortly.`);
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
    <div className={styles.singlePageWrapper}>
      <Container className={styles.containerFlex}>
        {/* Top Compact Bar */}
        <div className={styles.topBar}>
          <div className={styles.breadcrumbRow}>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('site')}
              className={styles.breadBtn}
            >
              Home
            </button>
            <ChevronRight size={13} className={styles.breadIcon} />
            <span className={styles.breadActive}>Contact Us</span>
            <span className={styles.dotDivider}>•</span>
            <span className={styles.topPageTitle}>Healthcare Coordination & Care Desk</span>
          </div>

          <div className={styles.statusPill}>
            <span className={styles.livePulse} />
            <span className={styles.statusText}>24/7 Live Patient Support Active</span>
          </div>
        </div>

        {/* Main Content: 2-Panel Side-by-Side Console */}
        <div className={styles.mainConsole}>
          {/* Left Column: Direct Communication Channels (2 Main Blocks) */}
          <div className={styles.leftColumn}>
            <div className={styles.columnIntro}>
              <h1 className={styles.heroHeading}>We're Here for You & Your Family</h1>
              <p className={styles.heroSubtext}>
                Reach our dedicated care coordinators directly for emergency hospital beds, specialist consults, or cashless insurance queries.
              </p>
            </div>

            <div className={styles.channelStack}>
              {/* Main Block 1: 24/7 Phone Helplines & Emergency */}
              <div className={`${styles.mainBlockCard} ${styles.blockHelpline}`}>
                <div className={styles.blockHeader}>
                  <div className={`${styles.blockIconWrap} ${styles.iconEmerald}`}>
                    <PhoneCall size={20} />
                  </div>
                  <div className={styles.blockTitleWrap}>
                    <div className={styles.blockTitleRow}>
                      <h3 className={styles.blockTitle}>24/7 Helplines & Admissions</h3>
                      <span className={styles.tagEmerald}>24x7 Live Desk</span>
                    </div>
                    <p className={styles.blockDesc}>
                      Instant voice triage, emergency ICU bed allocations, and priority doctor consultations.
                    </p>
                  </div>
                </div>

                <div className={styles.phonesGrid}>
                  {/* Phone 1: Emergency */}
                  <div className={styles.phoneItem}>
                    <span className={styles.phoneLabel}>Helpline & Emergency Admissions</span>
                    <div className={styles.phoneActionRow}>
                      <a href={`tel:${primaryPhone.number.replace(/\s+/g, '')}`} className={styles.phoneLink}>
                        {primaryPhone.number}
                      </a>
                      <div className={styles.phoneBtns}>
                        <a href={`tel:${primaryPhone.number.replace(/\s+/g, '')}`} className={`${styles.actionBtn} ${styles.btnPrimaryEmerald}`}>
                          <PhoneCall size={12} />
                          <span>Call Now</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopy(primaryPhone.number, 'p1')}
                          className={styles.actionBtnSecondary}
                          title="Copy Number"
                        >
                          {copiedId === 'p1' ? <Check size={13} color="#059669" /> : <Copy size={13} />}
                          <span>{copiedId === 'p1' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Phone 2: Appointments */}
                  <div className={styles.phoneItem}>
                    <span className={styles.phoneLabel}>Specialist Care & Appointments</span>
                    <div className={styles.phoneActionRow}>
                      <a href={`tel:${secondaryPhone.number.replace(/\s+/g, '')}`} className={styles.phoneLink}>
                        {secondaryPhone.number}
                      </a>
                      <div className={styles.phoneBtns}>
                        <a href={`tel:${secondaryPhone.number.replace(/\s+/g, '')}`} className={`${styles.actionBtn} ${styles.btnPrimaryBlue}`}>
                          <CalendarClock size={12} />
                          <span>Call Desk</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopy(secondaryPhone.number, 'p2')}
                          className={styles.actionBtnSecondary}
                          title="Copy Number"
                        >
                          {copiedId === 'p2' ? <Check size={13} color="#2563eb" /> : <Copy size={13} />}
                          <span>{copiedId === 'p2' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.blockFooterPill}>
                  <span>⚡ Zero Waiting Time</span>
                  <span className={styles.pillDot}>•</span>
                  <span>🏥 Priority Bed Allocation across 40+ Network Hospitals</span>
                </div>
              </div>

              {/* Main Block 2: Digital Concierge & Online Support */}
              <div className={`${styles.mainBlockCard} ${styles.blockDigital}`}>
                <div className={styles.blockHeader}>
                  <div className={`${styles.blockIconWrap} ${styles.iconGreen}`}>
                    <MessageSquare size={20} />
                  </div>
                  <div className={styles.blockTitleWrap}>
                    <div className={styles.blockTitleRow}>
                      <h3 className={styles.blockTitle}>Digital Care Desk & Concierge</h3>
                      <span className={styles.tagGreen}>Fast Digital Response</span>
                    </div>
                    <p className={styles.blockDesc}>
                      Direct chat for cashless pre-authorization, claim guidance, and clinical route assistance.
                    </p>
                  </div>
                </div>

                <div className={styles.digitalGrid}>
                  {/* WhatsApp Quick CTA */}
                  <div className={styles.digitalItem}>
                    <div className={styles.digitalLabelRow}>
                      <span className={styles.phoneLabel}>Instant WhatsApp Concierge</span>
                      <span className={styles.replyBadge}>Avg Reply &lt; 5 mins</span>
                    </div>
                    <a
                      href={`https://wa.me/${primaryPhone.number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hello Sehat Buddy Care Desk, I would like to inquire about healthcare services.')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${styles.actionBtn} ${styles.btnWhatsAppFull}`}
                    >
                      <MessageSquare size={14} />
                      <span>Chat on WhatsApp</span>
                      <ExternalLink size={13} style={{ marginLeft: 'auto' }} />
                    </a>
                  </div>

                  {/* Email Support */}
                  <div className={styles.digitalItem}>
                    <span className={styles.phoneLabel}>Patient & Enterprise Email Desks</span>
                    <div className={styles.emailActionRow}>
                      <div className={styles.emailList}>
                        <a href={`mailto:${primaryEmail.email}`} className={styles.emailLink}>
                          {primaryEmail.email}
                        </a>
                        {secondaryEmail?.email && secondaryEmail.email !== primaryEmail.email && (
                          <a href={`mailto:${secondaryEmail.email}`} className={styles.emailLinkSecondary}>
                            {secondaryEmail.email}
                          </a>
                        )}
                      </div>
                      <div className={styles.phoneBtns}>
                        <a href={`mailto:${primaryEmail.email}`} className={`${styles.actionBtn} ${styles.btnPrimaryIndigo}`}>
                          <Mail size={12} />
                          <span>Email</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopy(primaryEmail.email, 'e1')}
                          className={styles.actionBtnSecondary}
                          title="Copy Email"
                        >
                          {copiedId === 'e1' ? <Check size={13} color="#4f46e5" /> : <Copy size={13} />}
                          <span>{copiedId === 'e1' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.hubFooterBar}>
                  <span className={styles.hubItem}>
                    <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    {workingHours} (24x7 ER)
                  </span>
                  <span className={styles.pillDot}>•</span>
                  <span className={styles.hubItem}>
                    <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    Bengaluru Healthcare Hub
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Send Message Form */}
          <div className={styles.rightColumn}>
            <div className={styles.formCard}>
              <div className={styles.formHeader}>
                <div className={styles.formBadge}>
                  <Send size={15} color="#2563eb" />
                </div>
                <div>
                  <h2 className={styles.formTitle}>Send Us a Message</h2>
                  <p className={styles.formSubtitle}>
                    Submit your query and an assigned healthcare coordinator will contact you promptly.
                  </p>
                </div>
              </div>

              {successMsg && (
                <div className={styles.successBanner}>
                  <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0 }} />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className={styles.errorBanner}>
                  <AlertTriangle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className={styles.formElement}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.inputLabel}>
                      Full Name <span className={styles.reqStar}>*</span>
                    </label>
                    <input
                      type="text"
                      className={styles.textInput}
                      placeholder="e.g. Rahul Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.inputLabel}>
                      Email Address <span className={styles.reqStar}>*</span>
                    </label>
                    <input
                      type="email"
                      className={styles.textInput}
                      placeholder="e.g. rahul@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.inputLabel}>Phone Number (Optional)</label>
                    <input
                      type="tel"
                      className={styles.textInput}
                      placeholder="e.g. +91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.inputLabel}>Inquiry Category</label>
                    <select
                      className={styles.selectInput}
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {INQUIRY_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.inputLabel}>Priority Level</label>
                  <div className={styles.priorityRow}>
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
                  <div className={styles.emergencyNotice}>
                    <AlertTriangle size={15} color="#b91c1c" style={{ flexShrink: 0 }} />
                    <span>
                      For immediate life-threatening emergencies, dial <strong>108 / 112</strong> or call our 24/7 Helpline <strong>{primaryPhone.number}</strong>.
                    </span>
                  </div>
                )}

                <div className={styles.formGroup} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label className={styles.inputLabel}>
                    Message / Medical Query <span className={styles.reqStar}>*</span>
                  </label>
                  <textarea
                    rows={3}
                    className={styles.textareaInput}
                    placeholder="Describe how our care desk can assist you with beds, doctors, or treatments..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={styles.submitButton}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className={styles.spinIcon} />
                      <span>Submitting Inquiry...</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Submit Message</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Single-Page Bottom Strip */}
        <div className={styles.bottomStrip}>
          <div className={styles.bottomLeft}>
            <span>© 2026 The Sehat Buddy. Your Health, Our Priority.</span>
          </div>

          <div className={styles.bottomCenter}>
            <ShieldCheck size={14} color="#059669" />
            <span>National Emergency Medical Triage: <strong>Dial 108 / 112</strong></span>
          </div>

          <div className={styles.bottomRight}>
            <button
              type="button"
              className={styles.policyLink}
              onClick={() => setActivePolicyType('privacy')}
            >
              Privacy Policy
            </button>
            <span className={styles.linkSep}>•</span>
            <button
              type="button"
              className={styles.policyLink}
              onClick={() => setActivePolicyType('terms')}
            >
              Terms & Conditions
            </button>
          </div>
        </div>
      </Container>

      {/* Policy Viewer Modal */}
      {activePolicyType && (
        <PolicyViewerModal
          isOpen={Boolean(activePolicyType)}
          onClose={() => setActivePolicyType(null)}
          type={activePolicyType}
        />
      )}
    </div>
  );
}
