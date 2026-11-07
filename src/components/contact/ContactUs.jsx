import React, { useState } from 'react';
import {
  Star,
  Phone,
  PhoneCall,
  Send,
  User,
  Mail,
  LayoutGrid,
  MessageSquare,
  Lock,
  Building2,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ShieldCheck
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

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80';

export default function ContactUs({ onNavigate }) {
  const { contactInfo } = useData();

  // Dynamic values from Admin Control
  const topBadge = contactInfo?.topBadge || 'Verified Healthcare Concierge';
  const statusBadge = contactInfo?.statusBadge || '24/7 Live Patient Support Active';
  const pageTitle = contactInfo?.title || "We're Here for You & Your Family";
  const pageSubtitle = contactInfo?.subtitle || 'Reach our care coordinators directly for emergency hospital beds, specialist consults, or cashless insurance queries.';

  const helplineLabel = contactInfo?.helplineLabel || 'Helpline & Emergency';
  const helplineStatus = contactInfo?.helplineStatus || '24x7 Active';
  const helplineNumber = contactInfo?.helphoneNumber || contactInfo?.helplineNumber || (contactInfo?.phones?.[0]?.number) || '+91 98765 4321';
  const helphoneNumber = helplineNumber;
  const helplineDesc = contactInfo?.helplineDesc || 'Direct 24/7 hotline for critical triage, live ICU & inpatient bed reservations across accredited partner hospitals.';

  const primaryEmail = contactInfo?.emails?.find(e => e.isPrimary)?.email || contactInfo?.emails?.[0]?.email || contactInfo?.email || 'contactus@thesehatbuddy.com';
  const emailLabel = contactInfo?.emails?.find(e => e.isPrimary)?.label || contactInfo?.emails?.[0]?.label || 'Patient Support & Inquiries';

  const liveImage = contactInfo?.image !== undefined ? contactInfo.image : DEFAULT_IMAGE;
  const photoBadge = contactInfo?.photoBadge || '40+ Network Hospitals • Bengaluru Care Hub';

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
  const [copied, setCopied] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [activePolicyType, setActivePolicyType] = useState(null);

  const handleCopy = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(helphoneNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyEmail = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(primaryEmail);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
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
    const cleanPhoneDigits = (formData.phone || '').replace(/\D/g, '').slice(0, 10);
    if (formData.phone && cleanPhoneDigits.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
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
      setSuccessMsg(`Thank you, ${formData.name}! Your inquiry has been sent to our care desk at contactus@thesehatbuddy.com. An acknowledgment has been dispatched to your email, and our care desk will contact you promptly.`);
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
        {/* Top Header Section with Badges & Full-width Title */}
        <div className={styles.topSection}>
          <div className={styles.badgeRow}>
            <div className={styles.topBadge}>
              <Star size={13} className={styles.starIcon} />
              <span>{topBadge}</span>
            </div>

            <div className={styles.statusBadge}>
              <span className={styles.greenPulseDot} />
              <span>{statusBadge}</span>
            </div>
          </div>

          <h1 className={styles.pageTitle}>{pageTitle}</h1>
          <p className={styles.pageSubtitle}>{pageSubtitle}</p>
        </div>

        {/* Two-Column Master Grid */}
        <div className={styles.masterGrid}>
          {/* LEFT COLUMN: Helpline Card + Showcase Photo */}
          <div className={styles.leftColumn}>
            {/* Helpline & Emergency Card */}
            <div className={styles.helplineCard}>
              <div className={styles.helplineHeader}>
                <div className={styles.helplineIconWrap}>
                  <Phone size={18} />
                </div>
                <span className={styles.helplineTitle}>{helplineLabel}</span>
                <span className={styles.helplineTag}>{helplineStatus}</span>
              </div>

              <p className={styles.helplineDesc}>{helplineDesc}</p>

              <div className={styles.helplineActionRow}>
                <a href={`tel:${helphoneNumber.replace(/\s+/g, '')}`} className={styles.phoneLink}>
                  <Phone size={18} className={styles.phoneLinkIcon} />
                  <span>{helphoneNumber}</span>
                </a>
                <span className={styles.vDivider} />
                <a href={`tel:${helphoneNumber.replace(/\s+/g, '')}`} className={styles.btnCallNow}>
                  <Phone size={13} />
                  <span>Call Now</span>
                </a>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={styles.btnCopy}
                  title="Copy Phone Number"
                >
                  {copied ? <Check size={13} color="#059669" /> : <Copy size={13} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Support & Inquiries Email Card */}
            <div className={styles.helplineCard} style={{ marginTop: '14px' }}>
              <div className={styles.helplineHeader}>
                <div className={styles.helplineIconWrap} style={{ background: '#ecfdf5', color: '#059669' }}>
                  <Mail size={18} />
                </div>
                <span className={styles.helplineTitle}>{emailLabel}</span>
                <span className={styles.helplineTag} style={{ background: '#dcfce7', color: '#15803d' }}>Official</span>
              </div>

              <p className={styles.helplineDesc}>
                Official desk for patient inquiries, consultations, partner tie-ups, and corporate healthcare solutions.
              </p>

              <div className={styles.helplineActionRow}>
                <a href={`mailto:${primaryEmail}`} className={styles.phoneLink}>
                  <Mail size={18} className={styles.phoneLinkIcon} />
                  <span>{primaryEmail}</span>
                </a>
                <span className={styles.vDivider} />
                <a href={`mailto:${primaryEmail}`} className={styles.btnCallNow} style={{ background: '#059669' }}>
                  <Mail size={13} />
                  <span>Email Now</span>
                </a>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className={styles.btnCopy}
                  title="Copy Email Address"
                >
                  {copiedEmail ? <Check size={13} color="#059669" /> : <Copy size={13} />}
                  <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Showcase Photo Card */}
            {Boolean(liveImage) && (
              <div className={styles.photoCard}>
                <img
                  src={liveImage}
                  alt="Hospital Care Network"
                  className={styles.photoImg}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div className={styles.photoBadge}>
                  <Building2 size={13} />
                  <span>{photoBadge}</span>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Send Us a Message Card */}
          <div className={styles.rightCard}>
            <div className={styles.formHeader}>
              <div className={styles.sendIconWrap}>
                <Send size={18} color="#2563eb" />
              </div>
              <div className={styles.formHeaderContent}>
                <h2 className={styles.formTitle}>Send Us a Message</h2>
                <p className={styles.formSubtitle}>
                  Submit your query and an assigned healthcare coordinator will contact you promptly.
                </p>
              </div>
            </div>

            {successMsg && (
              <div className={styles.successBanner}>
                <CheckCircle2 size={15} color="#16a34a" style={{ flexShrink: 0 }} />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className={styles.errorBanner}>
                <AlertTriangle size={15} color="#dc2626" style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.formBody}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.fieldLabel}>
                    Full Name <span className={styles.reqStar}>*</span>
                  </label>
                  <div className={styles.inputWrap}>
                    <User size={15} className={styles.inputIcon} />
                    <input
                      type="text"
                      className={styles.inputField}
                      placeholder="e.g. Rahul Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.fieldLabel}>
                    Email Address <span className={styles.reqStar}>*</span>
                  </label>
                  <div className={styles.inputWrap}>
                    <Mail size={15} className={styles.inputIcon} />
                    <input
                      type="email"
                      className={styles.inputField}
                      placeholder="e.g. rahul@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.fieldLabel}>Phone Number (Optional)</label>
                  <div className={styles.inputWrap}>
                    <Phone size={15} className={styles.inputIcon} />
                    <input
                      type="tel"
                      className={styles.inputField}
                      placeholder="e.g. 98765 43210 (10 digits)"
                      value={formData.phone}
                      maxLength={10}
                      inputMode="numeric"
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setFormData({ ...formData, phone: val });
                      }}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.fieldLabel}>Inquiry Category</label>
                  <div className={styles.inputWrap}>
                    <LayoutGrid size={15} className={styles.inputIcon} />
                    <select
                      className={styles.selectField}
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {INQUIRY_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.fieldLabel}>Priority Level</label>
                <div className={styles.priorityRow}>
                  {['Normal', 'Urgent', 'Medical Emergency'].map(p => {
                    const isActive = formData.priority === p;
                    const isEmergency = p === 'Medical Emergency';
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFormData({ ...formData, priority: p })}
                        className={`${styles.priorityChip} ${isActive ? styles.priorityChipActive : ''} ${isEmergency && isActive ? styles.priorityChipEmergency : ''}`}
                      >
                        <span className={styles.chipIcon}>
                          {isEmergency ? '🚨' : p === 'Urgent' ? '⚡' : '📄'}
                        </span>
                        <span>{p}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {formData.priority === 'Medical Emergency' && (
                <div className={styles.emergencyNotice}>
                  <AlertTriangle size={13} color="#b91c1c" style={{ flexShrink: 0 }} />
                  <span>
                    For life-threatening emergencies, dial <strong>108 / 112</strong> or call our 24/7 Helpline <strong>{helphoneNumber}</strong>.
                  </span>
                </div>
              )}

              <div className={styles.formGroupTextarea}>
                <label className={styles.fieldLabel}>
                  Message / Medical Query <span className={styles.reqStar}>*</span>
                </label>
                <div className={styles.textareaWrap}>
                  <MessageSquare size={15} className={styles.textareaIcon} />
                  <textarea
                    rows={5}
                    className={styles.textareaField}
                    placeholder="Describe how our care desk can assist you with beds, doctors, or treatments..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className={styles.actionRow}>
                <button
                  type="submit"
                  disabled={loading}
                  className={styles.submitBtn}
                >
                  {loading ? (
                    <>
                      <Loader2 size={15} className={styles.spinIcon} />
                      <span>Submitting Inquiry...</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Submit Message</span>
                    </>
                  )}
                </button>

                <div className={styles.encryptionNote}>
                  <Lock size={12} color="#64748b" />
                  <span>Encrypted &amp; strictly confidential</span>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Bottom Legal & Emergency Triage Strip */}
        <div className={styles.bottomBar}>
          <div className={styles.bottomLeft}>
            <span>&copy; 2026 The Sehat Buddy. Your Health, Our Priority.</span>
          </div>

          <div className={styles.bottomCenter}>
            <ShieldCheck size={14} color="#059669" />
            <span>National Emergency Medical Triage: <strong style={{ color: '#dc2626' }}>Dial 108 / 112</strong></span>
          </div>

          <div className={styles.bottomRight}>
            <button
              type="button"
              className={styles.policyLink}
              onClick={() => setActivePolicyType('privacy')}
            >
              Privacy Policy
            </button>
            <span className={styles.linkDivider}>|</span>
            <button
              type="button"
              className={styles.policyLink}
              onClick={() => setActivePolicyType('terms')}
            >
              Terms &amp; Conditions
            </button>
            <span className={styles.linkDivider}>|</span>
            <button
              type="button"
              className={styles.policyLink}
              onClick={() => {
                if (onNavigate) onNavigate('about');
                else window.location.href = '/about';
              }}
            >
              About Us
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
