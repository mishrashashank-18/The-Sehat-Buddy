import React, { useState } from 'react';
import {
  PhoneCall,
  Send,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ChevronRight,
  ShieldCheck,
  Clock,
  MapPin,
  Sparkles,
  Loader2,
  Lock
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
  const { contactInfo } = useData();

  const phones = Array.isArray(contactInfo?.phones) && contactInfo.phones.length > 0
    ? contactInfo.phones
    : [
        { id: 'phone-1', label: 'Helpline & Emergency', number: '+91 98765 43210', isPrimary: true },
        { id: 'phone-2', label: 'Appointments Desk', number: '+91 80000 12345', isPrimary: false }
      ];

  const primaryPhone = phones.find(p => p.isPrimary) || phones[0];

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

        {/* Unified Master Console Canvas */}
        <div className={styles.masterCanvas}>
          {/* Left Hero & Helpline Panel */}
          <div className={styles.leftPanel}>
            <div className={styles.leftGlowEffect} />

            <div className={styles.leftPanelContent}>
              <div className={styles.introBadge}>
                <Sparkles size={13} color="#38bdf8" />
                <span>24/7 Verified Healthcare Concierge</span>
              </div>

              <h1 className={styles.heroHeading}>We're Here for You & Your Family</h1>
              <p className={styles.heroSubtext}>
                Reach our dedicated care coordinators directly for emergency hospital beds, specialist consults, or cashless insurance queries.
              </p>

              {/* Helpline & Emergency Card */}
              <div className={styles.helplineCard}>
                <div className={styles.channelTop}>
                  <div className={styles.iconWrap}>
                    <PhoneCall size={18} />
                  </div>
                  <div className={styles.channelMeta}>
                    <span className={styles.channelLabel}>{primaryPhone.label || 'Helpline & Emergency'}</span>
                    <span className={styles.tagEmerald}>24x7 Active</span>
                  </div>
                </div>

                <div className={styles.cardMiddle}>
                  <p className={styles.channelDesc}>
                    Direct 24/7 hotline for critical triage, live ICU & inpatient bed reservations across accredited partner hospitals.
                  </p>
                  <div className={styles.featurePills}>
                    <span className={styles.featurePill}>⚡ Zero Waiting Time</span>
                    <span className={styles.featurePill}>🏥 Live Bed Sync</span>
                  </div>
                </div>

                <div className={styles.channelBody}>
                  <a href={`tel:${primaryPhone.number.replace(/\s+/g, '')}`} className={styles.phoneLink}>
                    {primaryPhone.number}
                  </a>
                  <div className={styles.btnRow}>
                    <a href={`tel:${primaryPhone.number.replace(/\s+/g, '')}`} className={styles.btnCallNow}>
                      <PhoneCall size={13} />
                      <span>Call Now</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopy(primaryPhone.number, 'p1')}
                      className={styles.btnCopy}
                      title="Copy Number"
                    >
                      {copiedId === 'p1' ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                      <span>{copiedId === 'p1' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Trust Indicators Strip */}
              <div className={styles.trustStrip}>
                <div className={styles.trustItem}>
                  <Clock size={12} color="#38bdf8" />
                  <span>Immediate Triage</span>
                </div>
                <span className={styles.trustDot}>•</span>
                <div className={styles.trustItem}>
                  <ShieldCheck size={12} color="#34d399" />
                  <span>40+ Network Hospitals</span>
                </div>
                <span className={styles.trustDot}>•</span>
                <div className={styles.trustItem}>
                  <MapPin size={12} color="#a78bfa" />
                  <span>Bengaluru Hub</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className={styles.rightPanel}>
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
                <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0 }} />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className={styles.errorBanner}>
                <AlertTriangle size={16} color="#dc2626" style={{ flexShrink: 0 }} />
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
                  <AlertTriangle size={14} color="#b91c1c" style={{ flexShrink: 0 }} />
                  <span>
                    For life-threatening emergencies, dial <strong>108 / 112</strong> or call our 24/7 Helpline <strong>{primaryPhone.number}</strong>.
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

              <div className={styles.actionFooter}>
                <button
                  type="submit"
                  disabled={loading}
                  className={styles.submitButton}
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

                <div className={styles.privacyNote}>
                  <Lock size={12} color="#64748b" />
                  <span>Encrypted & strictly confidential</span>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Single-Page Bottom Strip */}
        <div className={styles.bottomStrip}>
          <div className={styles.bottomLeft}>
            <span>© 2026 The Sehat Buddy. Your Health, Our Priority.</span>
          </div>

          <div className={styles.bottomCenter}>
            <ShieldCheck size={13} color="#059669" />
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
