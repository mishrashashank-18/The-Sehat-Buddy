import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle,
  Plus,
  Trash2,
  FileText,
  HelpCircle,
  Upload,
  UploadCloud,
  Loader2,
  Layers,
  ShieldCheck,
  X,
  Play,
  Video,
  Building2,
  Users,
  ExternalLink,
  Save,
  Check,
  Phone,
  Mail,
  Clock,
  Edit2,
  Image as ImageIcon,
  RefreshCw
} from 'lucide-react';
import { useData } from '../../context/useData';
import { api } from '../../services/api';
import styles from './FrontPageEditor.module.css';

const heroFamily = 'https://res.cloudinary.com/nehlbmp2/image/upload/v1792239399/sehatbuddy/hero/i3g2e9ptcdydfnfeqf9c.jpg';

const isValidHex = (hex) => typeof hex === 'string' && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex.trim());

const DEFAULT_HERO_PRESETS = [];

const AVAILABLE_ICONS = [
  'ShieldCheck',
  'CalendarCheck',
  'MessageSquareText',
  'Award',
  'HeartPulse',
  'Clock',
  'Sparkles',
  'ThumbsUp',
  'Activity'
];

const getEmbedUrl = (url, autoplay = true) => {
  if (!url) return '';
  let videoId = '';
  try {
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split(/[?#&]/)[0];
    } else if (url.includes('youtube.com/watch')) {
      const u = new URL(url.startsWith('http') ? url : `https://${url}`);
      videoId = u.searchParams.get('v');
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('youtube.com/embed/')[1]?.split(/[?#&]/)[0];
    } else if (url.includes('youtube.com/shorts/')) {
      videoId = url.split('youtube.com/shorts/')[1]?.split(/[?#&]/)[0];
    }
  } catch (e) {
    console.error('Error parsing video URL', e);
  }

  if (videoId) {
    const autoplayVal = autoplay ? '1' : '0';
    return `https://www.youtube.com/embed/${videoId}?autoplay=${autoplayVal}&rel=0&enablejsapi=1&playsinline=1`;
  }
  return url;
};

// Isolated, memoized row component with local staged draft state and card-level Save
const CorporatePartnerRow = React.memo(({
  corp,
  onSave,
  onDelete,
  showToast
}) => {
  const corpId = corp.id !== undefined && corp.id !== null ? corp.id : corp._id;

  const [draft, setDraft] = useState({
    name: corp.name || '',
    logo: corp.logo || '',
    website: corp.website || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  useEffect(() => {
    setDraft({
      name: corp.name || '',
      logo: corp.logo || '',
      website: corp.website || ''
    });
  }, [corp.name, corp.logo, corp.website]);

  const hasChanges = (
    (draft.name || '').trim() !== (corp.name || '').trim() ||
    (draft.logo || '') !== (corp.logo || '') ||
    (draft.website || '').trim() !== (corp.website || '').trim()
  );

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.name.match(/\.(png|jpe?g|svg|webp|ico)$/i)) {
      showToast('Please upload a valid image file (PNG, JPG, SVG, WebP).');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Logo file size exceeds 5MB limit.');
      e.target.value = '';
      return;
    }

    e.target.value = '';
    setIsUploadingLogo(true);

    try {
      // If there was an old Cloudinary logo, delete it to prevent orphaned files
      const oldLogo = draft.logo || corp.logo;
      if (oldLogo && (oldLogo.includes('cloudinary.com') || oldLogo.includes('res.cloudinary.com'))) {
        api.deleteImage(oldLogo).catch(err => console.warn('Failed to delete old logo from Cloudinary:', err));
      }

      const uploadedUrl = await api.uploadImage(file, 'sehatbuddy/corporate');
      if (uploadedUrl) {
        setDraft(prev => ({ ...prev, logo: uploadedUrl }));
        showToast('Logo uploaded to Cloudinary! Click "Save" on card to publish.');
      } else {
        throw new Error('Upload returned no URL');
      }
    } catch (err) {
      showToast(`Upload failed: ${err.message || 'Server error'}`);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleLogoRemove = async () => {
    const oldLogo = draft.logo || corp.logo;
    if (oldLogo && (oldLogo.includes('cloudinary.com') || oldLogo.includes('res.cloudinary.com'))) {
      await api.deleteImage(oldLogo).catch(err => console.warn('Failed to delete logo from Cloudinary:', err));
    }
    setDraft(prev => ({ ...prev, logo: '' }));
    try {
      await onSave(corpId, { ...draft, logo: '' });
      showToast('Corporate logo removed and deleted from Cloudinary.');
    } catch {
      showToast('Logo removed from card draft. Click "Save" to apply.');
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await onSave(corpId, draft);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2200);
    } catch (err) {
      // handled by onSave
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.itemRowCard} style={{ alignItems: 'center' }}>
      {/* Sleek Partner Card Preview matching the new homepage style */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <div
          style={{
            width: '160px',
            height: '62px',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden'
          }}
          title={draft.name || 'Partner Logo Preview'}
        >
          {isUploadingLogo ? (
            <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>Uploading...</span>
          ) : draft.logo ? (
            <img
              src={draft.logo}
              alt={draft.name || 'Partner logo'}
              style={{ maxWidth: '100%', maxHeight: '42px', objectFit: 'contain', display: 'block' }}
            />
          ) : (
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
              {draft.name || 'No Logo'}
            </span>
          )}
        </div>

        <div className={styles.corpLogoUploadWrap}>
          <label
            className={styles.corpUploadIconBtn}
            title="Upload partner logo to Cloudinary (PNG, SVG, JPG, WebP)"
            style={{
              opacity: isUploadingLogo ? 0.6 : 1,
              pointerEvents: isUploadingLogo ? 'none' : 'auto'
            }}
          >
            <Upload size={11} />
            <span>{isUploadingLogo ? 'Uploading...' : (draft.logo ? 'Change' : 'Upload Logo')}</span>
            <input
              type="file"
              accept="image/*,.png,.jpg,.jpeg,.svg,.webp"
              style={{ display: 'none' }}
              disabled={isUploadingLogo}
              onChange={handleLogoUpload}
            />
          </label>
          {draft.logo && (
            <button
              type="button"
              className={styles.corpRemoveIconBtn}
              onClick={handleLogoRemove}
              title="Remove logo"
              disabled={isUploadingLogo}
            >
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      <div className={styles.itemInputGroup} style={{ gridTemplateColumns: '1.2fr 1fr' }}>
        <div className={styles.formGroup}>
          <label>Company / Partner Name *</label>
          <input
            type="text"
            required
            value={draft.name}
            onChange={(e) => setDraft(prev => ({ ...prev, name: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSave();
              }
            }}
            placeholder="e.g. Microsoft, Flipkart, Swiggy"
          />
        </div>

        <div className={styles.formGroup}>
          <label>Company Website URL (Optional)</label>
          <input
            type="url"
            value={draft.website}
            onChange={(e) => setDraft(prev => ({ ...prev, website: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSave();
              }
            }}
            placeholder="e.g. https://www.microsoft.com"
          />
        </div>
      </div>

      {/* Card Actions: Save & Delete */}
      <div className={styles.cardActionsCol}>
        <button
          type="button"
          className={`${styles.saveCardBtn} ${hasChanges ? styles.saveCardBtnActive : ''} ${justSaved ? styles.saveCardBtnSuccess : ''}`}
          onClick={handleSave}
          disabled={isSaving}
          title={hasChanges ? "Save changes to Cloudinary & Database" : "Click to save card"}
        >
          {isSaving ? (
            <>
              <Loader2 size={13} className={styles.saveCardSpinner} />
              <span>Saving...</span>
            </>
          ) : justSaved ? (
            <>
              <Check size={13} />
              <span>Saved!</span>
            </>
          ) : (
            <>
              <Save size={13} />
              <span>Save</span>
            </>
          )}
        </button>

        <button
          type="button"
          className={styles.deleteRowBtn}
          onClick={() => onDelete(corpId, draft.name || corp.name)}
          title="Delete corporate partner from database and Cloudinary"
          disabled={isSaving}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
});

const FrontPageEditor = ({ showToast, initialSubTab, hideSubTabs = false }) => {
  const {
    heroContent,
    updateHeroContent,
    services,
    addService,
    updateService,
    deleteService,
    features,
    addFeature,
    updateFeature,
    deleteFeature,
    articles,
    addArticle,
    updateArticle,
    deleteArticle,
    corporateTieups,
    addCorporateTieup,
    updateCorporateTieup,
    deleteCorporateTieup,
    deleteAllCorporateTieups,
    saveCorporateTieupsNow,
    resetFrontPageDefaults,
    contactInfo,
    updateContactInfo,
    refreshContactInfo
  } = useData();

  // Active sub-tab: 'hero' | 'services' | 'why' | 'articles' | 'corporate' | 'contact'
  const [subTab, setSubTabState] = useState(() => {
    if (initialSubTab) return initialSubTab;
    try {
      const saved = localStorage.getItem('sehat_admin_frontpage_subtab');
      if (saved) return saved;
    } catch {}
    return 'hero';
  });

  useEffect(() => {
    if (initialSubTab) {
      setSubTabState(initialSubTab);
    }
  }, [initialSubTab]);

  useEffect(() => {
    if (subTab === 'contact' && typeof refreshContactInfo === 'function') {
      refreshContactInfo();
    }
  }, [subTab, refreshContactInfo]);

  // Contact Helplines & Support Editor State
  const [isAddingPhone, setIsAddingPhone] = useState(false);
  const [newPhoneLabel, setNewPhoneLabel] = useState('');
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [newPhonePrimary, setNewPhonePrimary] = useState(false);
  const [editingPhoneId, setEditingPhoneId] = useState(null);
  const [editPhoneLabel, setEditPhoneLabel] = useState('');
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [editPhonePrimary, setEditPhonePrimary] = useState(false);

  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const [newEmailLabel, setNewEmailLabel] = useState('');
  const [newEmailAddress, setNewEmailAddress] = useState('');
  const [newEmailPrimary, setNewEmailPrimary] = useState(false);
  const [editingEmailId, setEditingEmailId] = useState(null);
  const [editEmailLabel, setEditEmailLabel] = useState('');
  const [editEmailAddress, setEditEmailAddress] = useState('');
  const [editEmailPrimary, setEditEmailPrimary] = useState(false);

  // Contact Us Page Full Management State
  const [contactTopBadgeInput, setContactTopBadgeInput] = useState(contactInfo?.topBadge || 'Verified Healthcare Concierge');
  const [contactStatusBadgeInput, setContactStatusBadgeInput] = useState(contactInfo?.statusBadge || '24/7 Live Patient Support Active');
  const [contactTitleInput, setContactTitleInput] = useState(contactInfo?.title || "We're Here for You & Your Family");
  const [contactSubtitleInput, setContactSubtitleInput] = useState(contactInfo?.subtitle || "Reach our care coordinators directly for emergency hospital beds, specialist consults, or cashless insurance queries.");

  const [helplineLabelInput, setHelplineLabelInput] = useState(contactInfo?.helplineLabel || 'Helpline & Emergency');
  const [helplineStatusInput, setHelplineStatusInput] = useState(contactInfo?.helplineStatus || '24x7 Active');
  const [helphoneNumberInput, setHelphoneNumberInput] = useState(contactInfo?.helphoneNumber || (contactInfo?.phones?.[0]?.number) || '+91 98765 4321');
  const [helplineDescInput, setHelplineDescInput] = useState(contactInfo?.helplineDesc || 'Direct 24/7 hotline for critical triage, live ICU & inpatient bed reservations across accredited partner hospitals.');

  const [photoBadgeInput, setPhotoBadgeInput] = useState(contactInfo?.photoBadge || '40+ Network Hospitals • Bengaluru Care Hub');
  const [uploadingContactPhoto, setUploadingContactPhoto] = useState(false);
  const [isDeletingContactPhoto, setIsDeletingContactPhoto] = useState(false);
  const [contactPhotoProgress, setContactPhotoProgress] = useState(0);
  const contactPhotoRef = useRef(null);

  const DEFAULT_CONTACT_IMAGE = 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80';

  useEffect(() => {
    if (contactInfo?.topBadge) setContactTopBadgeInput(contactInfo.topBadge);
    if (contactInfo?.statusBadge) setContactStatusBadgeInput(contactInfo.statusBadge);
    if (contactInfo?.title) setContactTitleInput(contactInfo.title);
    if (contactInfo?.subtitle) setContactSubtitleInput(contactInfo.subtitle);
    if (contactInfo?.helplineLabel) setHelplineLabelInput(contactInfo.helplineLabel);
    if (contactInfo?.helplineStatus) setHelplineStatusInput(contactInfo.helplineStatus);
    if (contactInfo?.helphoneNumber || contactInfo?.phones?.[0]?.number) {
      setHelphoneNumberInput(contactInfo.helphoneNumber || contactInfo.phones[0].number);
    }
    if (contactInfo?.helplineDesc) setHelplineDescInput(contactInfo.helplineDesc);
    if (contactInfo?.photoBadge) setPhotoBadgeInput(contactInfo.photoBadge);
  }, [
    contactInfo?.topBadge,
    contactInfo?.statusBadge,
    contactInfo?.title,
    contactInfo?.subtitle,
    contactInfo?.helplineLabel,
    contactInfo?.helplineStatus,
    contactInfo?.helphoneNumber,
    contactInfo?.phones,
    contactInfo?.helplineDesc,
    contactInfo?.photoBadge
  ]);

  const handleUploadContactPhoto = async (file) => {
    if (!file) return;
    const isImage = file.type?.startsWith('image/') || file.name.match(/\.(png|jpg|jpeg|webp|svg)$/i);
    if (!isImage) {
      if (showToast) showToast('Please select a valid image (PNG, JPG, WEBP).', 'error');
      return;
    }

    try {
      setUploadingContactPhoto(true);
      setContactPhotoProgress(10);

      const oldUrl = contactInfo?.image;
      const uploadedUrl = await api.uploadImage(file, 'sehatbuddy/contact', (pct) => setContactPhotoProgress(pct));
      if (!uploadedUrl) throw new Error('Upload failed - no URL returned');

      const updated = {
        ...(contactInfo || {}),
        image: uploadedUrl
      };

      await updateContactInfo(updated);

      if (oldUrl && (oldUrl.includes('cloudinary.com') || oldUrl.includes('res.cloudinary.com')) && oldUrl !== uploadedUrl) {
        api.deleteImage(oldUrl).catch(err => console.warn('Failed to delete old contact photo:', err));
      }

      if (showToast) showToast('Contact Us showcase photo uploaded to Cloudinary successfully!', 'success');
    } catch (err) {
      console.error('Contact photo upload error:', err);
      if (showToast) showToast(err.message || 'Failed to upload photo', 'error');
    } finally {
      setUploadingContactPhoto(false);
      setContactPhotoProgress(0);
      if (contactPhotoRef.current) contactPhotoRef.current.value = '';
    }
  };

  const handleDeleteContactPhoto = async () => {
    const curPhoto = contactInfo?.image;
    if (!curPhoto) {
      if (showToast) showToast('No photo to delete.', 'info');
      return;
    }

    if (!window.confirm('Are you sure you want to permanently delete this showcase photo? It will be removed from Cloudinary storage and the Contact Us page.')) {
      return;
    }

    setIsDeletingContactPhoto(true);
    try {
      if (curPhoto && (curPhoto.includes('cloudinary.com') || curPhoto.includes('res.cloudinary.com'))) {
        await api.deleteImage(curPhoto).catch(err => console.warn('Failed to delete contact photo from Cloudinary:', err));
      }

      const updated = {
        ...(contactInfo || {}),
        image: ''
      };
      await updateContactInfo(updated);

      if (showToast) showToast('Showcase photo permanently deleted from Cloudinary & Contact Us page.', 'success');
    } catch (err) {
      console.error('Failed to delete contact photo:', err);
      if (showToast) showToast(err.message || 'Failed to delete photo', 'error');
    } finally {
      setIsDeletingContactPhoto(false);
    }
  };

  const handleResetContactPhoto = async () => {
    if (contactInfo?.image === DEFAULT_CONTACT_IMAGE) {
      if (showToast) showToast('Default showcase photo is already active.', 'info');
      return;
    }

    const curPhoto = contactInfo?.image;
    if (curPhoto && (curPhoto.includes('cloudinary.com') || curPhoto.includes('res.cloudinary.com'))) {
      if (!window.confirm('Resetting to default will delete your custom photo from Cloudinary storage. Proceed?')) {
        return;
      }
      api.deleteImage(curPhoto).catch(err => console.warn('Failed to delete old contact photo from Cloudinary:', err));
    }

    try {
      const updated = {
        ...(contactInfo || {}),
        image: DEFAULT_CONTACT_IMAGE
      };
      await updateContactInfo(updated);
      if (showToast) showToast('Contact Us showcase photo reset to default.', 'info');
    } catch (err) {
      if (showToast) showToast(err.message || 'Failed to reset photo', 'error');
    }
  };

  const handleSaveContactUsSettings = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      const updated = {
        ...contactInfo,
        topBadge: contactTopBadgeInput.trim() || 'Verified Healthcare Concierge',
        statusBadge: contactStatusBadgeInput.trim() || '24/7 Live Patient Support Active',
        title: contactTitleInput.trim() || "We're Here for You & Your Family",
        subtitle: contactSubtitleInput.trim() || 'Reach our care coordinators directly for emergency hospital beds, specialist consults, or cashless insurance queries.',
        helplineLabel: helplineLabelInput.trim() || 'Helpline & Emergency',
        helplineStatus: helplineStatusInput.trim() || '24x7 Active',
        helphoneNumber: helphoneNumberInput.trim() || '+91 98765 4321',
        helplineNumber: helphoneNumberInput.trim() || '+91 98765 4321',
        helplineDesc: helplineDescInput.trim() || 'Direct 24/7 hotline for critical triage, live ICU & inpatient bed reservations across accredited partner hospitals.',
        photoBadge: photoBadgeInput.trim() || '40+ Network Hospitals • Bengaluru Care Hub',
        phones: [
          { id: 'phone-1', label: helplineLabelInput.trim() || 'Helpline & Emergency', number: helphoneNumberInput.trim() || '+91 98765 4321', isPrimary: true }
        ]
      };
      await updateContactInfo(updated);
      if (showToast) showToast('Contact Us page settings saved successfully!', 'success');
    } catch {
      if (showToast) showToast('Failed to save settings', 'error');
    }
  };

  const phonesList = Array.isArray(contactInfo?.phones) ? contactInfo.phones : [];
  const emailsList = Array.isArray(contactInfo?.emails) ? contactInfo.emails : [];

  const handleAdminAddPhone = async (e) => {
    e.preventDefault();
    if (!newPhoneNumber.trim()) return;
    const item = {
      id: 'phone_' + Date.now(),
      label: newPhoneLabel.trim() || 'Helpline',
      number: newPhoneNumber.trim(),
      isPrimary: Boolean(newPhonePrimary)
    };
    const updatedPhones = newPhonePrimary
      ? [...phonesList.map((p) => ({ ...p, isPrimary: false })), item]
      : [...phonesList, item];

    try {
      await updateContactInfo({
        ...contactInfo,
        phones: updatedPhones
      });
      if (showToast) showToast('Contact number added successfully!', 'success');
      setNewPhoneLabel('');
      setNewPhoneNumber('');
      setNewPhonePrimary(false);
      setIsAddingPhone(false);
    } catch {
      if (showToast) showToast('Failed to add contact number', 'error');
    }
  };

  const handleAdminDeletePhone = async (id) => {
    if (!window.confirm('Delete this contact number?')) return;
    try {
      const updatedPhones = phonesList.filter((p) => p.id !== id);
      await updateContactInfo({
        ...contactInfo,
        phones: updatedPhones
      });
      if (showToast) showToast('Contact number removed', 'info');
    } catch {
      if (showToast) showToast('Failed to delete number', 'error');
    }
  };

  const handleAdminSaveEditPhone = async (id) => {
    if (!editPhoneNumber.trim()) return;
    try {
      const updatedPhones = phonesList.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            label: editPhoneLabel.trim() || 'Helpline',
            number: editPhoneNumber.trim(),
            isPrimary: Boolean(editPhonePrimary)
          };
        }
        return editPhonePrimary ? { ...p, isPrimary: false } : p;
      });
      await updateContactInfo({
        ...contactInfo,
        phones: updatedPhones
      });
      setEditingPhoneId(null);
      if (showToast) showToast('Contact number updated', 'success');
    } catch {
      if (showToast) showToast('Failed to update number', 'error');
    }
  };

  const handleAdminAddEmail = async (e) => {
    e.preventDefault();
    if (!newEmailAddress.trim()) return;
    const item = {
      id: 'email_' + Date.now(),
      label: newEmailLabel.trim() || 'Support Desk',
      email: newEmailAddress.trim(),
      isPrimary: Boolean(newEmailPrimary)
    };
    const updatedEmails = newEmailPrimary
      ? [...emailsList.map((em) => ({ ...em, isPrimary: false })), item]
      : [...emailsList, item];

    try {
      await updateContactInfo({
        ...contactInfo,
        emails: updatedEmails
      });
      if (showToast) showToast('Email address added successfully!', 'success');
      setNewEmailLabel('');
      setNewEmailAddress('');
      setNewEmailPrimary(false);
      setIsAddingEmail(false);
    } catch {
      if (showToast) showToast('Failed to add email address', 'error');
    }
  };

  const handleAdminDeleteEmail = async (id) => {
    if (!window.confirm('Delete this email address?')) return;
    try {
      const updatedEmails = emailsList.filter((em) => em.id !== id);
      await updateContactInfo({
        ...contactInfo,
        emails: updatedEmails
      });
      if (showToast) showToast('Email address removed', 'info');
    } catch {
      if (showToast) showToast('Failed to delete email', 'error');
    }
  };

  const handleAdminSaveEditEmail = async (id) => {
    if (!editEmailAddress.trim()) return;
    try {
      const updatedEmails = emailsList.map((em) => {
        if (em.id === id) {
          return {
            ...em,
            label: editEmailLabel.trim() || 'Support Desk',
            email: editEmailAddress.trim(),
            isPrimary: Boolean(editEmailPrimary)
          };
        }
        return editEmailPrimary ? { ...em, isPrimary: false } : em;
      });
      await updateContactInfo({
        ...contactInfo,
        emails: updatedEmails
      });
      setEditingEmailId(null);
      if (showToast) showToast('Email address updated', 'success');
    } catch {
      if (showToast) showToast('Failed to update email', 'error');
    }
  };

  const handleAdminSaveHours = async (e) => {
    e.preventDefault();
    try {
      await updateContactInfo({
        ...contactInfo,
        workingHours: workingHoursInput.trim()
      });
      if (showToast) showToast('Operating hours updated', 'success');
    } catch {
      if (showToast) showToast('Failed to save hours', 'error');
    }
  };

  const setSubTab = (newTab) => {
    try {
      localStorage.setItem('sehat_admin_frontpage_subtab', newTab);
    } catch {}
    setSubTabState(newTab);
  };

  const isHeroDirtyRef = useRef(false);
  const heroFormRef = useRef(null);

  // Hero form local state
  const [heroForm, setHeroForm] = useState(() => ({
    badge: heroContent?.badge ?? '',
    city: heroContent?.city ?? 'Bengaluru',
    titleLine1: heroContent?.titleLine1 ?? '',
    titleLine2: heroContent?.titleLine2 ?? '',
    titleHighlight: heroContent?.titleHighlight ?? '',
    description: heroContent?.description ?? '',
    heroImage: heroContent?.heroImage || heroFamily,
    stat1Label: heroContent?.stats?.[0]?.label ?? 'Trusted by',
    stat1Value: heroContent?.stats?.[0]?.value ?? '10M+ Users',
    stat2Label: heroContent?.stats?.[1]?.label ?? 'Expert Doctors',
    stat2Value: heroContent?.stats?.[1]?.value ?? '25,000+',
    stat3Label: heroContent?.stats?.[2]?.label ?? 'Quick',
    stat3Value: heroContent?.stats?.[2]?.value ?? 'Appointments',
    whyChooseTitle: heroContent?.whyChooseTitle ?? 'Why Choose The Sehat Buddy?',
    whyChooseVideoUrl: heroContent?.whyChooseVideoUrl ?? '',
    whyChooseVideoText: heroContent?.whyChooseVideoText ?? 'Watch how\nSehat Buddy\nworks for you',
    whyChooseVideoAutoplay: heroContent?.whyChooseVideoAutoplay !== false,
    newsletterTitle: heroContent?.newsletterTitle ?? 'Stay updated with\nhealth tips & offers',
    newsletterSubtitle: heroContent?.newsletterSubtitle ?? 'Subscribe to our newsletter'
  }));

  // Corporate Tie-ups Header & Metrics local form state (only displays on frontend when clicking Save Header)
  const [corporateHeaderForm, setCorporateHeaderForm] = useState(() => ({
    corporateBadge: heroContent?.corporateBadge ?? 'ENTERPRISE HEALTHCARE NETWORK',
    corporateTitle: heroContent?.corporateTitle ?? 'Corporate Tie-ups & Partners',
    corporateSubtitle: heroContent?.corporateSubtitle ?? 'Trusted by leading enterprises for priority admissions, comprehensive annual checkups, and cashless corporate benefits.',
    corporateStat: heroContent?.corporateStat ?? '2.5M+ Corporate Lives Covered'
  }));
  const isCorporateHeaderDirtyRef = useRef(false);

  useEffect(() => {
    if (!isCorporateHeaderDirtyRef.current && heroContent) {
      setCorporateHeaderForm({
        corporateBadge: heroContent?.corporateBadge ?? 'ENTERPRISE HEALTHCARE NETWORK',
        corporateTitle: heroContent?.corporateTitle ?? 'Corporate Tie-ups & Partners',
        corporateSubtitle: heroContent?.corporateSubtitle ?? 'Trusted by leading enterprises for priority admissions, comprehensive annual checkups, and cashless corporate benefits.',
        corporateStat: heroContent?.corporateStat ?? '2.5M+ Corporate Lives Covered'
      });
    }
  }, [heroContent?.corporateBadge, heroContent?.corporateTitle, heroContent?.corporateSubtitle, heroContent?.corporateStat]);

  const handleCorporateHeaderChange = (field, value) => {
    isCorporateHeaderDirtyRef.current = true;
    setCorporateHeaderForm(prev => ({ ...prev, [field]: value }));
  };

  // Keep heroFormRef in sync with heroForm
  useEffect(() => {
    heroFormRef.current = heroForm;
  }, [heroForm]);

  // Auto-save on unmount if dirty
  useEffect(() => {
    return () => {
      if (isHeroDirtyRef.current && heroFormRef.current) {
        updateHeroContent(heroFormRef.current);
        isHeroDirtyRef.current = false;
      }
    };
  }, []);

  React.useEffect(() => {
    if (!isHeroDirtyRef.current && heroContent) {
      setHeroForm({
        badge: heroContent?.badge ?? '',
        city: heroContent?.city ?? 'Bengaluru',
        titleLine1: heroContent?.titleLine1 ?? '',
        titleLine2: heroContent?.titleLine2 ?? '',
        titleHighlight: heroContent?.titleHighlight ?? '',
        description: heroContent?.description ?? '',
        heroImage: heroContent?.heroImage || heroFamily,
        stat1Label: heroContent?.stats?.[0]?.label ?? 'Trusted by',
        stat1Value: heroContent?.stats?.[0]?.value ?? '10M+ Users',
        stat2Label: heroContent?.stats?.[1]?.label ?? 'Expert Doctors',
        stat2Value: heroContent?.stats?.[1]?.value ?? '25,000+',
        stat3Label: heroContent?.stats?.[2]?.label ?? 'Quick',
        stat3Value: heroContent?.stats?.[2]?.value ?? 'Appointments',
        whyChooseTitle: heroContent?.whyChooseTitle ?? 'Why Choose The Sehat Buddy?',
        whyChooseVideoUrl: heroContent?.whyChooseVideoUrl ?? '',
        whyChooseVideoText: heroContent?.whyChooseVideoText ?? 'Watch how\nSehat Buddy\nworks for you',
        whyChooseVideoAutoplay: heroContent?.whyChooseVideoAutoplay !== false,
        newsletterTitle: heroContent?.newsletterTitle ?? 'Stay updated with\nhealth tips & offers',
        newsletterSubtitle: heroContent?.newsletterSubtitle ?? 'Subscribe to our newsletter'
      });
    }
  }, [heroContent]);

  const handleHeroFieldChange = (field, value) => {
    isHeroDirtyRef.current = true;
    if (heroFormRef.current) {
      heroFormRef.current = { ...heroFormRef.current, [field]: value };
    }
    setHeroForm(prev => {
      const updated = { ...prev, [field]: value };
      heroFormRef.current = updated;
      return updated;
    });
  };

  const handleHeroFieldBlur = (field, value) => {
    const val = value !== undefined ? value : heroFormRef.current?.[field];
    if (val !== undefined) {
      updateHeroContent({ [field]: val });
    }
  };

  const handleSwitchSubTab = (newTab) => {
    if (isHeroDirtyRef.current && heroFormRef.current) {
      updateHeroContent(heroFormRef.current);
      isHeroDirtyRef.current = false;
    }
    setSubTab(newTab);
  };

  // Modals for adding items
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [newService, setNewService] = useState({
    title: '',
    subtitle: '',
    bgTint: '#EAF6F3',
    iconTint: '#D9F0EA'
  });

  const [isAddFeatureOpen, setIsAddFeatureOpen] = useState(false);
  const [newFeature, setNewFeature] = useState({
    title: '',
    description: '',
    iconName: 'ShieldCheck'
  });

  const [isAddArticleOpen, setIsAddArticleOpen] = useState(false);
  const [newArticle, setNewArticle] = useState({
    title: '',
    category: 'Heart Health',
    readTime: '5 min read',
    categoryColor: '#E0457B',
    categoryBg: '#FDE8EF',
    image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=600&q=80',
    link: '',
    pdfUrl: '',
    pdfName: '',
    pdfSize: ''
  });

  const [isPreviewVideoOpen, setIsPreviewVideoOpen] = useState(false);
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const [isDeletingWhyVideo, setIsDeletingWhyVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [isHeroPhotoUploading, setIsHeroPhotoUploading] = useState(false);
  const [isDeletingHeroPhoto, setIsDeletingHeroPhoto] = useState(false);
  const [customPhotoUrlInput, setCustomPhotoUrlInput] = useState('');
  const sanitizePresets = (list) => {
    if (!Array.isArray(list)) return [];
    return list.filter(p => {
      const name = (p.name || '').toLowerCase();
      const id = String(p.id || '');
      const url = String(p.url || '');
      if (name.includes('consultation') || id === 'preset_2') return false;
      if (name.includes('medical team') || id === 'preset_3' || url.includes('1582750433449')) return false;
      if (name.includes('happy family') || id === 'preset_1') return false;
      return true;
    });
  };

  const [heroPresets, setHeroPresets] = useState(() => {
    try {
      localStorage.removeItem('sehat_hero_presets_v2');
      localStorage.removeItem('sehat_hero_presets_v1');
    } catch {}
    if (Array.isArray(heroContent?.heroPresets)) {
      return sanitizePresets(heroContent.heroPresets);
    }
    return [];
  });

  // Sync heroPresets when heroContent loads from MongoDB Atlas
  const heroPresetsSerialized = JSON.stringify(heroContent?.heroPresets || []);
  React.useEffect(() => {
    if (Array.isArray(heroContent?.heroPresets)) {
      const sanitized = sanitizePresets(heroContent.heroPresets);
      setHeroPresets(sanitized);
    }
  }, [heroPresetsSerialized]);
  const [customHeroImage, setCustomHeroImage] = useState(() => {
    return localStorage.getItem('sehat_custom_hero_image') || '';
  });
  const videoFileInputRef = useRef(null);
  const heroFileInputRef = useRef(null);

  // Sync customHeroImage if heroContent has a custom (non-preset) image
  React.useEffect(() => {
    if (heroContent?.heroImage) {
      const isPreset = heroPresets.some(p => 
        p.url === heroContent.heroImage || 
        (p.name === 'Happy Family at Hospital' && (heroContent.heroImage?.includes('hero-family') || heroContent.heroImage?.includes('i3g2e9ptcdydfnfeqf9c')))
      );
      if (!isPreset && !heroContent.heroImage.startsWith('data:image/')) {
        setCustomHeroImage(heroContent.heroImage);
      }
    }
  }, [heroContent?.heroImage, heroPresets]);

  // Upload Video to Cloudinary
  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 100MB (Cloudinary Free Plan max video file size)
    const maxSizeBytes = 100 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      showToast('Video file exceeds maximum limit of 100MB (Cloudinary Free Plan quota). Please choose a smaller video.');
      return;
    }

    try {
      setIsVideoUploading(true);
      setVideoUploadProgress(5);

      const oldVid = heroForm.whyChooseVideoUrl || heroContent?.whyChooseVideoUrl;

      const uploadedUrl = await api.uploadVideo(file, 'sehatbuddy/videos', (percent) => {
        setVideoUploadProgress(percent);
      });

      // If replacing an existing Cloudinary video, permanently delete the previous one
      if (oldVid && (oldVid.includes('cloudinary.com') || oldVid.includes('res.cloudinary.com')) && oldVid !== uploadedUrl) {
        api.deleteVideo(oldVid).catch(err => console.warn('Old explainer video delete warning:', err));
      }

      setHeroForm(prev => ({
        ...prev,
        whyChooseVideoUrl: uploadedUrl
      }));

      // Immediately persist update
      updateHeroContent({
        whyChooseVideoUrl: uploadedUrl
      });

      showToast('Video uploaded and saved to Cloudinary successfully!');
    } catch (err) {
      console.error('Video upload failed:', err);
      showToast(err.message || 'Failed to upload video to Cloudinary. Please try again.');
    } finally {
      setIsVideoUploading(false);
      setVideoUploadProgress(0);
      if (videoFileInputRef.current) {
        videoFileInputRef.current.value = '';
      }
    }
  };

  // Corporate partner modal & form state
  const [isAddCorporateOpen, setIsAddCorporateOpen] = useState(false);
  const [uploadingLogoCorpId, setUploadingLogoCorpId] = useState(null);
  const [isNewCorporateUploading, setIsNewCorporateUploading] = useState(false);
  const [newCorporate, setNewCorporate] = useState({
    name: '',
    logo: '',
    website: ''
  });

  const handleOpenAddCorporate = () => {
    setNewCorporate({
      name: '',
      logo: '',
      website: ''
    });
    setIsAddCorporateOpen(true);
  };

  // Save Hero Form
  const handleSaveHero = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    updateHeroContent({
      badge: heroForm.badge,
      city: heroForm.city,
      titleLine1: heroForm.titleLine1,
      titleLine2: heroForm.titleLine2,
      titleHighlight: heroForm.titleHighlight,
      description: heroForm.description,
      heroImage: heroForm.heroImage,
      stats: [
        { id: 1, label: heroForm.stat1Label, value: heroForm.stat1Value },
        { id: 2, label: heroForm.stat2Label, value: heroForm.stat2Value },
        { id: 3, label: heroForm.stat3Label, value: heroForm.stat3Value }
      ],
      whyChooseTitle: heroForm.whyChooseTitle,
      whyChooseVideoUrl: heroForm.whyChooseVideoUrl,
      whyChooseVideoText: heroForm.whyChooseVideoText,
      whyChooseVideoAutoplay: heroForm.whyChooseVideoAutoplay,
      newsletterTitle: heroForm.newsletterTitle,
      newsletterSubtitle: heroForm.newsletterSubtitle
    });
    isHeroDirtyRef.current = false;
    showToast('Hero section & front page headers updated successfully!');
  };

  const handleSaveWhyVideo = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    isHeroDirtyRef.current = false;

    // If the video URL was cleared or changed from an existing Cloudinary video, delete old from Cloudinary
    const oldVid = heroContent?.whyChooseVideoUrl;
    const newVid = (heroForm.whyChooseVideoUrl || '').trim();
    if (oldVid && (oldVid.includes('cloudinary.com') || oldVid.includes('res.cloudinary.com')) && (!newVid || newVid !== oldVid)) {
      api.deleteVideo(oldVid).catch(err => console.warn('Failed to delete removed explainer video from Cloudinary:', err));
    }

    updateHeroContent({
      whyChooseTitle: heroForm.whyChooseTitle,
      whyChooseVideoUrl: newVid,
      whyChooseVideoText: heroForm.whyChooseVideoText,
      whyChooseVideoAutoplay: heroForm.whyChooseVideoAutoplay
    });
    showToast('Explainer video settings saved successfully!');
  };

  const isPresetActive = (presetUrl, targetImage = heroForm.heroImage) => {
    if (!targetImage) return false;
    if (targetImage === presetUrl) return true;
    if (presetUrl === heroFamily && (targetImage.includes('hero-family') || targetImage.includes('i3g2e9ptcdydfnfeqf9c'))) {
      return true;
    }
    return false;
  };

  const handleHeroFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 15MB
    if (file.size > 15 * 1024 * 1024) {
      showToast('Image file exceeds maximum limit of 15MB. Please choose a smaller file.');
      return;
    }

    try {
      setIsHeroPhotoUploading(true);
      const oldHeroPhoto = heroForm.heroImage || customHeroImage;

      const uploadedUrl = await api.uploadImage(file, 'sehatbuddy/hero');
      if (!uploadedUrl) {
        throw new Error('Upload succeeded but no image URL was returned.');
      }

      // If replacing an existing Cloudinary custom photo, delete the previous one
      if (oldHeroPhoto && (oldHeroPhoto.includes('cloudinary.com') || oldHeroPhoto.includes('res.cloudinary.com')) && oldHeroPhoto !== uploadedUrl) {
        api.deleteImage(oldHeroPhoto).catch(err => console.warn('Old hero photo delete notice:', err));
      }

      setCustomHeroImage(uploadedUrl);
      try {
        localStorage.setItem('sehat_custom_hero_image', uploadedUrl);
      } catch {}

      setHeroForm(prev => ({
        ...prev,
        heroImage: uploadedUrl
      }));

      // Immediately persist update so it reflects live on homepage and MongoDB Atlas
      updateHeroContent({
        heroImage: uploadedUrl
      });

      showToast('Hero photo uploaded & saved successfully!');
    } catch (err) {
      console.error('Hero photo upload failed:', err);
      showToast(err.message || 'Failed to upload photo to Cloudinary. Please try again.');
    } finally {
      setIsHeroPhotoUploading(false);
      if (heroFileInputRef.current) {
        heroFileInputRef.current.value = '';
      }
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleSelectHeroImage = (imageUrl, imageName) => {
    setHeroForm(prev => ({ ...prev, heroImage: imageUrl }));
    updateHeroContent({ heroImage: imageUrl });
    showToast(`Hero photo set to "${imageName}" & saved!`);
  };

  const handleApplyPhotoUrl = (e) => {
    if (e) e.preventDefault();
    const url = customPhotoUrlInput.trim();
    if (!url) {
      showToast('Please enter an image URL.');
      return;
    }
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
      showToast('Please enter a valid URL starting with http://, https://, or /');
      return;
    }

    setCustomHeroImage(url);
    try {
      localStorage.setItem('sehat_custom_hero_image', url);
    } catch {}

    setHeroForm(prev => ({ ...prev, heroImage: url }));
    updateHeroContent({ heroImage: url });
    showToast('Hero photo updated from URL & saved!');
    setCustomPhotoUrlInput('');
  };

  const handleDeleteCustomHeroPhoto = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const photoToDelete = heroForm.heroImage || customHeroImage;
    if (!photoToDelete) return;

    if (!window.confirm('Are you sure you want to permanently delete this hero photo? It will be removed from Cloudinary storage and the front page.')) {
      return;
    }

    setIsDeletingHeroPhoto(true);
    try {
      if (photoToDelete && (photoToDelete.includes('cloudinary.com') || photoToDelete.includes('res.cloudinary.com'))) {
        showToast('Deleting photo from Cloudinary...');
        await api.deleteImage(photoToDelete).catch(err => console.warn('Failed to delete photo from Cloudinary:', err));
      }

      const defaultImage = heroPresets[0]?.url || '';
      setHeroForm(prev => ({ ...prev, heroImage: defaultImage }));
      setCustomHeroImage('');
      setCustomPhotoUrlInput('');
      try {
        localStorage.removeItem('sehat_custom_hero_image');
      } catch {}
      updateHeroContent({ heroImage: defaultImage });

      showToast('Hero photo permanently deleted from Cloudinary.');
    } catch (err) {
      console.error('Error deleting hero photo:', err);
      showToast('Failed to delete photo: ' + (err.message || 'Please try again.'));
    } finally {
      setIsDeletingHeroPhoto(false);
    }
  };

  const handleDeletePresetPhoto = async (imgToDelete, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!window.confirm(`Are you sure you want to permanently delete "${imgToDelete.name}"? It will be removed from Cloudinary storage if hosted there.`)) {
      return;
    }
    const updated = heroPresets.filter(p => p.url !== imgToDelete.url && p.name !== imgToDelete.name);
    setHeroPresets(updated);
    try {
      localStorage.setItem('sehat_hero_presets_v2', JSON.stringify(updated));
    } catch {}

    // Persist deleted preset permanently to MongoDB Atlas
    const updates = { heroPresets: updated };
    if (isPresetActive(imgToDelete.url, heroForm.heroImage)) {
      const nextPhoto = updated[0]?.url || '';
      setHeroForm(prev => ({ ...prev, heroImage: nextPhoto }));
      updates.heroImage = nextPhoto;
    }
    updateHeroContent(updates);

    if (imgToDelete?.url && (imgToDelete.url.includes('cloudinary.com') || imgToDelete.url.includes('res.cloudinary.com'))) {
      showToast(`Deleting "${imgToDelete.name}" from Cloudinary...`);
      try {
        await api.deleteImage(imgToDelete.url);
        showToast(`Photo "${imgToDelete.name}" permanently deleted from Cloudinary.`);
      } catch (err) {
        console.warn('Cloudinary delete error:', err);
        showToast(`Photo "${imgToDelete.name}" deleted.`);
      }
    } else {
      showToast(`Photo "${imgToDelete.name}" deleted.`);
    }
  };

  const handleResetDefaultPresets = () => {
    setHeroPresets(DEFAULT_HERO_PRESETS);
    try {
      localStorage.setItem('sehat_hero_presets_v2', JSON.stringify(DEFAULT_HERO_PRESETS));
    } catch {}
    updateHeroContent({ heroPresets: DEFAULT_HERO_PRESETS });
    showToast('Default preset photos restored.');
  };

  // Add Service
  const handleCreateService = (e) => {
    e.preventDefault();
    if (!newService.title.trim()) return;
    addService({
      title: newService.title.trim(),
      subtitle: newService.subtitle.trim() || 'Expert care service',
      iconPath: 'https://res.cloudinary.com/nehlbmp2/image/upload/v1793190495/sehatbuddy/services/stethoscope.jpg',
      bgTint: newService.bgTint,
      iconTint: newService.iconTint
    });
    setIsAddServiceOpen(false);
    setNewService({ title: '', subtitle: '', bgTint: '#EAF6F3', iconTint: '#D9F0EA' });
    showToast('New service card added to front page!');
  };

  // Add Feature
  const handleCreateFeature = (e) => {
    e.preventDefault();
    if (!newFeature.title.trim()) return;
    addFeature({
      title: newFeature.title.trim(),
      description: newFeature.description.trim() || 'Quality care standard',
      iconName: newFeature.iconName
    });
    setIsAddFeatureOpen(false);
    setNewFeature({ title: '', description: '', iconName: 'ShieldCheck' });
    showToast('New "Why Choose Us" feature card added!');
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleArticlePdfUpload = (articleId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      showToast('PDF file exceeds the 1MB limit. Please choose a file under 1MB.');
      e.target.value = '';
      return;
    }
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showToast('Invalid file type: Please select a valid PDF document (.pdf).');
      e.target.value = '';
      return;
    }

    const formattedSize = formatFileSize(file.size);
    const fileName = file.name;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUri = reader.result;
      updateArticle(articleId, {
        pdfUrl: dataUri,
        pdfName: fileName,
        pdfSize: formattedSize
      });
      showToast(`PDF "${fileName}" (${formattedSize}) attached to article!`);

      try {
        const res = await api.uploadPdf(file, 'sehatbuddy/articles');
        if (res && (res.url || typeof res === 'string')) {
          const finalUrl = res.url || res;
          updateArticle(articleId, {
            pdfUrl: finalUrl,
            pdfName: fileName,
            pdfSize: formattedSize
          });
        }
      } catch (err) {
        console.warn('Backend PDF upload fallback used Data URI:', err.message);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveArticlePdf = (articleId, title) => {
    updateArticle(articleId, {
      pdfUrl: '',
      pdfName: '',
      pdfSize: ''
    });
    showToast(`PDF removed from article "${title || 'item'}".`);
  };

  const handleNewArticlePdfUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      showToast('PDF file exceeds the 1MB limit. Please choose a file under 1MB.');
      e.target.value = '';
      return;
    }
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showToast('Invalid file type: Please select a valid PDF document (.pdf).');
      e.target.value = '';
      return;
    }

    const formattedSize = formatFileSize(file.size);
    const fileName = file.name;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUri = reader.result;
      setNewArticle(prev => ({
        ...prev,
        pdfUrl: dataUri,
        pdfName: fileName,
        pdfSize: formattedSize
      }));
      showToast(`PDF "${fileName}" (${formattedSize}) ready to attach!`);

      try {
        const res = await api.uploadPdf(file, 'sehatbuddy/articles');
        if (res && (res.url || typeof res === 'string')) {
          const finalUrl = res.url || res;
          setNewArticle(prev => ({
            ...prev,
            pdfUrl: finalUrl,
            pdfName: fileName,
            pdfSize: formattedSize
          }));
        }
      } catch (err) {
        console.warn('Backend PDF upload fallback:', err.message);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveCorporatePartner = async (corpId, updatedData) => {
    try {
      await updateCorporateTieup(corpId, updatedData, true);
      showToast(`Corporate partner "${updatedData.name || 'entry'}" saved to database and live site!`);
    } catch (err) {
      showToast(`Failed to save partner: ${err.message || 'Server error'}`);
      throw err;
    }
  };

  const handleCorporateLogoUpload = async (corpId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.name.match(/\.(png|jpe?g|svg|webp|ico)$/i)) {
      showToast('Please upload a valid image file (PNG, JPG, SVG, WebP, ICO).');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Logo file size exceeds 5MB limit.');
      e.target.value = '';
      return;
    }

    e.target.value = '';
    setUploadingLogoCorpId(corpId);

    try {
      if (newCorporate.logo && (newCorporate.logo.includes('cloudinary.com') || newCorporate.logo.includes('res.cloudinary.com'))) {
        api.deleteImage(newCorporate.logo).catch(err => console.warn('Failed to delete replaced logo from Cloudinary:', err));
      }

      const uploadedUrl = await api.uploadImage(file, 'sehatbuddy/corporate');
      if (uploadedUrl) {
        updateCorporateTieup(corpId, { logo: uploadedUrl });
        showToast('Corporate icon updated!');
      } else {
        throw new Error('Upload returned no URL');
      }
    } catch (err) {
      console.warn('Backend corporate logo upload fallback used Data URI:', err.message);
      const reader = new FileReader();
      reader.onload = () => {
        updateCorporateTieup(corpId, { logo: reader.result });
        showToast('Corporate icon updated locally.');
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingLogoCorpId(null);
    }
  };

  const handleRemoveCorporateLogo = (corpId, name) => {
    updateCorporateTieup(corpId, { logo: '' });
    showToast(`Custom icon removed for "${name || 'partner'}".`);
  };

  const handleNewCorporateLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.name.match(/\.(png|jpe?g|svg|webp|ico)$/i)) {
      showToast('Please upload a valid image file (PNG, JPG, SVG, WebP, ICO).');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Logo file size exceeds 5MB limit.');
      e.target.value = '';
      return;
    }

    e.target.value = '';
    setIsNewCorporateUploading(true);

    try {
      if (newCorporate.logo && (newCorporate.logo.includes('cloudinary.com') || newCorporate.logo.includes('res.cloudinary.com'))) {
        api.deleteImage(newCorporate.logo).catch(err => console.warn('Failed to delete replaced logo from Cloudinary:', err));
      }

      const uploadedUrl = await api.uploadImage(file, 'sehatbuddy/corporate');
      if (uploadedUrl) {
        setNewCorporate(prev => ({ ...prev, logo: uploadedUrl }));
        showToast('Corporate logo ready!');
      } else {
        throw new Error('Upload returned no URL');
      }
    } catch (err) {
      console.warn('Modal corporate logo upload fallback used Data URI:', err.message);
      const reader = new FileReader();
      reader.onload = () => {
        setNewCorporate(prev => ({ ...prev, logo: reader.result }));
        showToast('Corporate logo ready!');
      };
      reader.readAsDataURL(file);
    } finally {
      setIsNewCorporateUploading(false);
    }
  };

  // Add Article
  const handleCreateArticle = (e) => {
    e.preventDefault();
    if (!newArticle.title.trim()) return;
    addArticle({
      title: newArticle.title.trim(),
      category: newArticle.category.trim() || 'Health Care',
      readTime: newArticle.readTime.trim() || '5 min read',
      categoryColor: newArticle.categoryColor,
      categoryBg: newArticle.categoryBg,
      image: newArticle.image,
      link: newArticle.link?.trim() || '',
      pdfUrl: newArticle.pdfUrl || '',
      pdfName: newArticle.pdfName || '',
      pdfSize: newArticle.pdfSize || ''
    });
    setIsAddArticleOpen(false);
    setNewArticle({
      title: '',
      category: 'Heart Health',
      readTime: '5 min read',
      categoryColor: '#E0457B',
      categoryBg: '#FDE8EF',
      image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=600&q=80',
      link: '',
      pdfUrl: '',
      pdfName: '',
      pdfSize: ''
    });
    showToast('New health article added to front page!');
  };

  // Save Corporate Header
  const handleSaveCorporateHeader = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    isCorporateHeaderDirtyRef.current = false;
    try {
      await updateHeroContent({
        corporateBadge: corporateHeaderForm.corporateBadge ?? '',
        corporateTitle: corporateHeaderForm.corporateTitle ?? '',
        corporateSubtitle: corporateHeaderForm.corporateSubtitle ?? '',
        corporateStat: corporateHeaderForm.corporateStat ?? ''
      });
      showToast('Corporate Tie-ups header & metrics updated and live on frontend!');
    } catch (err) {
      showToast('Failed to save header: ' + (err.message || 'Server error'), 'error');
    }
  };

  // Add Corporate Partner
  const handleCreateCorporate = async (e) => {
    e.preventDefault();
    const companyName = newCorporate.name.trim();
    if (!companyName) {
      showToast('Please enter a partner company name.');
      return;
    }
    try {
      await addCorporateTieup({
        name: companyName,
        logo: newCorporate.logo || '',
        website: (newCorporate.website || '').trim()
      });
      setIsAddCorporateOpen(false);
      setNewCorporate({
        name: '',
        logo: '',
        website: ''
      });
      showToast(`Partner "${companyName}" saved to Cloudinary & database!`);
    } catch (err) {
      showToast(`Failed to add partner: ${err.message || 'Server error'}`);
    }
  };

  // Delete All Corporate Partners
  const handleDeleteAllCorporate = async () => {
    const count = corporateTieups?.length || 0;
    if (window.confirm(`Are you sure you want to delete all ${count} corporate partners? This will permanently remove them from both the database and Cloudinary.`)) {
      try {
        await deleteAllCorporateTieups();
        showToast('All corporate partners and logos deleted from database and Cloudinary.');
      } catch (err) {
        showToast(`Failed to delete partners: ${err.message || 'Server error'}`);
      }
    }
  };

  return (
    <div className={styles.editorContainer}>
      <div className={styles.editorHeader}>
        <div>
          <h2 className={styles.editorTitle}>
            {hideSubTabs && subTab === 'contact' 
              ? 'Contact Us & Platform Helplines' 
              : 'Front Page Content & Mock Data Editor'}
          </h2>
          <p className={styles.editorSubtitle}>
            {hideSubTabs && subTab === 'contact'
              ? 'Manage platform customer helplines, support numbers, official email desks, and working hours displayed in the website footer.'
              : 'Customize hero banners, trust metrics, service cards, features, and health articles shown to website visitors.'}
          </p>
        </div>
      </div>

      {/* Sub Tabs */}
      {!hideSubTabs && (
        <div className={styles.subTabs}>
          <button
            className={`${styles.subTabBtn} ${subTab === 'hero' ? styles.subTabActive : ''}`}
            onClick={() => handleSwitchSubTab('hero')}
          >
            <Sparkles size={16} />
            <span>Hero & Trust Metrics</span>
          </button>
          <button
            className={`${styles.subTabBtn} ${subTab === 'services' ? styles.subTabActive : ''}`}
            onClick={() => handleSwitchSubTab('services')}
          >
            <Layers size={16} />
            <span>Explore Services ({services?.length || 0})</span>
          </button>
          <button
            className={`${styles.subTabBtn} ${subTab === 'why' ? styles.subTabActive : ''}`}
            onClick={() => handleSwitchSubTab('why')}
          >
            <HelpCircle size={16} />
            <span>Why Choose Us ({features?.length || 0})</span>
          </button>
          <button
            className={`${styles.subTabBtn} ${subTab === 'articles' ? styles.subTabActive : ''}`}
            onClick={() => handleSwitchSubTab('articles')}
          >
            <FileText size={16} />
            <span>Articles & Newsletter ({articles?.length || 0})</span>
          </button>
          <button
            className={`${styles.subTabBtn} ${subTab === 'corporate' ? styles.subTabActive : ''}`}
            onClick={() => handleSwitchSubTab('corporate')}
          >
            <Building2 size={16} />
            <span>Corporate Tie-ups ({corporateTieups?.length || 0})</span>
          </button>
          <button
            className={`${styles.subTabBtn} ${subTab === 'contact' ? styles.subTabActive : ''}`}
            onClick={() => handleSwitchSubTab('contact')}
          >
            <Phone size={16} />
            <span>Helplines & Contact ({contactInfo?.phones?.length || 0})</span>
          </button>
        </div>
      )}

      {/* SUB-TAB 1: HERO & STATS */}
      {subTab === 'hero' && (
        <div className={styles.tabPane}>
          <form onSubmit={handleSaveHero} className={styles.formCard}>
            <div className={styles.paneHeader}>
              <div>
                <h3>Hero Section Headlines & Text</h3>
                <p>Edit the main hero message that greets patients when they open the site.</p>
              </div>
              <button type="submit" className={styles.primarySaveBtn}>
                <CheckCircle size={16} /> Save Changes
              </button>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Top Badge Text</label>
                <input
                  type="text"
                  value={heroForm.badge}
                  onChange={(e) => handleHeroFieldChange('badge', e.target.value)}
                  placeholder="e.g. One Buddy for all Need"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Primary Serving City / Location</label>
                <input
                  type="text"
                  value={heroForm.city}
                  onChange={(e) => handleHeroFieldChange('city', e.target.value)}
                  placeholder="e.g. Bengaluru"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Title Line 1</label>
                <input
                  type="text"
                  value={heroForm.titleLine1}
                  onChange={(e) => handleHeroFieldChange('titleLine1', e.target.value)}
                  placeholder="e.g. Find Doctors, Book"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Title Line 2</label>
                <input
                  type="text"
                  value={heroForm.titleLine2}
                  onChange={(e) => handleHeroFieldChange('titleLine2', e.target.value)}
                  placeholder="e.g. Appointments & Take"
                />
              </div>

              <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                <label>Title Highlighted Word(s) (Teal Highlight)</label>
                <input
                  type="text"
                  value={heroForm.titleHighlight}
                  onChange={(e) => handleHeroFieldChange('titleHighlight', e.target.value)}
                  placeholder="e.g. Care of Your Health"
                />
              </div>

              <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                <label>Hero Description Paragraph</label>
                <textarea
                  rows={3}
                  value={heroForm.description}
                  onChange={(e) => handleHeroFieldChange('description', e.target.value)}
                  placeholder="Brief introductory paragraph..."
                />
              </div>
            </div>

            {/* Trust Metrics Bar */}
            <div className={styles.subSectionTitle}>Hero Trust Metrics</div>
            <div className={styles.statsEditorGrid}>
              <div className={styles.statEditBox}>
                <span className={styles.statBoxTitle}>Metric 1</span>
                <div className={styles.formGroup}>
                  <label>Label</label>
                  <input
                    type="text"
                    value={heroForm.stat1Label}
                    onChange={(e) => handleHeroFieldChange('stat1Label', e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Value</label>
                  <input
                    type="text"
                    value={heroForm.stat1Value}
                    onChange={(e) => handleHeroFieldChange('stat1Value', e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.statEditBox}>
                <span className={styles.statBoxTitle}>Metric 2</span>
                <div className={styles.formGroup}>
                  <label>Label</label>
                  <input
                    type="text"
                    value={heroForm.stat2Label}
                    onChange={(e) => handleHeroFieldChange('stat2Label', e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Value</label>
                  <input
                    type="text"
                    value={heroForm.stat2Value}
                    onChange={(e) => handleHeroFieldChange('stat2Value', e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.statEditBox}>
                <span className={styles.statBoxTitle}>Metric 3</span>
                <div className={styles.formGroup}>
                  <label>Label</label>
                  <input
                    type="text"
                    value={heroForm.stat3Label}
                    onChange={(e) => handleHeroFieldChange('stat3Label', e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Value</label>
                  <input
                    type="text"
                    value={heroForm.stat3Value}
                    onChange={(e) => handleHeroFieldChange('stat3Value', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Hero Image Selection */}
            <div className={styles.subSectionTitle}>Hero Family Photo</div>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '-8px', marginBottom: '12px' }}>
              Select a preset photo, upload your own photo directly to Cloudinary, or paste an image link.
            </p>

            <div className={styles.imageSelectorGrid}>
              {heroPresets.map((img, idx) => {
                const active = isPresetActive(img.url);
                return (
                  <div
                    key={img.id || idx}
                    className={`${styles.imagePreset} ${active ? styles.imagePresetActive : ''}`}
                    style={{ position: 'relative' }}
                    onClick={() => handleSelectHeroImage(img.url, img.name)}
                    title={`Set hero image to ${img.name}`}
                  >
                    <button
                      type="button"
                      className={styles.deletePresetCornerBtn}
                      onClick={(e) => handleDeletePresetPhoto(img, e)}
                      title={`Delete "${img.name}"`}
                    >
                      <Trash2 size={12} />
                    </button>
                    <img src={img.url} alt={img.name} />
                    <span>{img.name}</span>
                  </div>
                );
              })}

              {/* Custom photo card if current active photo is not in presets */}
              {heroForm.heroImage && !heroPresets.some(p => isPresetActive(p.url, heroForm.heroImage)) && (
                <div
                  className={`${styles.imagePreset} ${styles.imagePresetActive}`}
                  style={{ position: 'relative' }}
                  title="Currently active custom photo"
                >
                  <button
                    type="button"
                    disabled={isDeletingHeroPhoto}
                    className={styles.deletePresetCornerBtn}
                    onClick={handleDeleteCustomHeroPhoto}
                    title="Permanently delete custom photo from Cloudinary"
                  >
                    {isDeletingHeroPhoto ? <Loader2 size={12} className={styles.spinIcon} /> : <Trash2 size={12} />}
                  </button>
                  <img src={heroForm.heroImage} alt="Custom Hero" />
                  <span>✓ Custom Active</span>
                </div>
              )}

              {/* Stored custom photo if another preset is currently selected */}
              {customHeroImage && heroPresets.some(p => isPresetActive(p.url, heroForm.heroImage)) && (
                <div
                  className={styles.imagePreset}
                  style={{ position: 'relative' }}
                  onClick={() => handleSelectHeroImage(customHeroImage, 'Custom Photo')}
                  title="Switch back to your custom uploaded photo"
                >
                  <button
                    type="button"
                    disabled={isDeletingHeroPhoto}
                    className={styles.deletePresetCornerBtn}
                    onClick={handleDeleteCustomHeroPhoto}
                    title="Permanently delete custom photo from Cloudinary"
                  >
                    {isDeletingHeroPhoto ? <Loader2 size={12} className={styles.spinIcon} /> : <Trash2 size={12} />}
                  </button>
                  <img src={customHeroImage} alt="Custom Hero" />
                  <span>Custom Photo</span>
                </div>
              )}

              {/* Upload to Cloudinary Box */}
              <label className={`${styles.customUploadBox} ${isHeroPhotoUploading ? styles.uploadingBox : ''}`}>
                {isHeroPhotoUploading ? (
                  <>
                    <Loader2 size={20} className={styles.spinIcon} />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload size={20} />
                    <span>Upload custom image</span>
                  </>
                )}
                <input
                  ref={heroFileInputRef}
                  type="file"
                  accept="image/*"
                  disabled={isHeroPhotoUploading}
                  onChange={handleHeroFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>



            {/* Direct Image Link Input */}
            <div className={styles.heroUrlRow}>
              <div className={styles.formGroup} style={{ margin: 0 }}>
                <label>Or paste an image link directly</label>
                <div className={styles.urlInputWithBtn}>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/... or https://res.cloudinary.com/..."
                    value={customPhotoUrlInput}
                    onChange={(e) => setCustomPhotoUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleApplyPhotoUrl();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className={styles.applyBtn}
                    onClick={handleApplyPhotoUrl}
                    disabled={!customPhotoUrlInput.trim()}
                  >
                    Apply Photo
                  </button>
                </div>
              </div>
            </div>

            {/* Live Hero Preview Banner with Delete Photo option on all photos */}
            {heroForm.heroImage && (
              <div className={styles.currentHeroPreviewBanner}>
                <img
                  src={heroForm.heroImage}
                  alt="Live Hero Preview"
                  className={styles.heroPreviewThumb}
                  onError={(e) => {
                    e.target.src = heroFamily;
                  }}
                />
                <div className={styles.heroPreviewInfo}>
                  <span className={styles.heroPreviewTag}>Live on Homepage</span>
                  <span className={styles.heroPreviewUrl}>{heroForm.heroImage}</span>
                </div>
                <button
                  type="button"
                  disabled={isDeletingHeroPhoto}
                  className={styles.deleteHeroPhotoBtn}
                  onClick={handleDeleteCustomHeroPhoto}
                  title="Permanently delete this photo from Cloudinary"
                >
                  {isDeletingHeroPhoto ? <Loader2 size={14} className={styles.spinIcon} /> : <Trash2 size={14} />}
                  <span>{isDeletingHeroPhoto ? 'Deleting...' : 'Delete Photo'}</span>
                </button>
              </div>
            )}

            <div className={styles.formSubmitRow}>
              <button type="submit" className={styles.primarySaveBtn}>
                <CheckCircle size={16} /> Save Hero Section
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-TAB 2: EXPLORE SERVICES */}
      {subTab === 'services' && (
        <div className={styles.tabPane}>
          <div className={styles.paneActionHeader}>
            <div>
              <h3>Explore Top Services Cards</h3>
              <p>Edit service titles, descriptions, and color accents.</p>
            </div>
            <button
              className={styles.addBtn}
              onClick={() => setIsAddServiceOpen(true)}
            >
              <Plus size={16} /> Add New Service Card
            </button>
          </div>

          <div className={styles.itemsList}>
            {services?.map((svc) => (
              <div key={svc.id} className={styles.itemRowCard}>
                <div className={styles.itemColorPreview} style={{ backgroundColor: svc.bgTint }}>
                  <img src={svc.iconPath} alt={svc.title} className={styles.serviceIconThumb} onError={(e) => { e.target.style.display = 'none'; }} />
                </div>

                <div className={styles.itemInputGroup}>
                  <div className={styles.formGroup}>
                    <label>Title</label>
                    <input
                      type="text"
                      value={svc.title}
                      onChange={(e) => updateService(svc.id, { title: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          updateService(svc.id, { title: svc.title });
                          showToast(`Service "${svc.title}" saved!`);
                        }
                      }}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Subtitle / Description</label>
                    <input
                      type="text"
                      value={svc.subtitle}
                      onChange={(e) => updateService(svc.id, { subtitle: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          updateService(svc.id, { subtitle: svc.subtitle });
                          showToast(`Service "${svc.title}" saved!`);
                        }
                      }}
                    />
                  </div>
                </div>

                <div className={styles.colorPillsGroup}>
                  <div className={styles.colorInputWrap}>
                    <label>Card BG</label>
                    <input
                      type="color"
                      value={svc.bgTint || '#EAF6F3'}
                      onChange={(e) => updateService(svc.id, { bgTint: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  className={styles.deleteRowBtn}
                  onClick={() => {
                    deleteService(svc.id);
                    showToast(`Service "${svc.title}" removed.`);
                  }}
                  title="Delete service card"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: WHY CHOOSE US */}
      {subTab === 'why' && (
        <div className={styles.tabPane}>
          <div className={styles.paneActionHeader}>
            <div>
              <h3>"Why Choose The Sehat Buddy" Section</h3>
              <p>Edit section title and the key trust pillars shown with verified icons.</p>
            </div>
            <button
              className={styles.addBtn}
              onClick={() => setIsAddFeatureOpen(true)}
            >
              <Plus size={16} /> Add Feature Pillar
            </button>
          </div>

          {/* Section Title */}
          <form
            className={styles.formCard}
            style={{ marginBottom: '16px' }}
            onSubmit={(e) => {
              e.preventDefault();
              isHeroDirtyRef.current = false;
              updateHeroContent({ whyChooseTitle: heroForm.whyChooseTitle });
              showToast('Section heading saved successfully!');
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-heading)' }}>
                  Why Choose Us Section Heading
                </h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>
                  Customize the headline displayed on the homepage above the feature cards. Press Enter to save.
                </p>
              </div>
              <button
                type="submit"
                className={styles.primarySaveBtn}
              >
                <CheckCircle size={15} /> Save Title
              </button>
            </div>
            <div className={styles.formGroup}>
              <label>Section Heading Title</label>
              <input
                type="text"
                value={heroForm.whyChooseTitle ?? ''}
                onChange={(e) => handleHeroFieldChange('whyChooseTitle', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    isHeroDirtyRef.current = false;
                    const val = heroFormRef.current?.whyChooseTitle ?? e.target.value;
                    updateHeroContent({ whyChooseTitle: val });
                    showToast('Section heading saved successfully!');
                  }
                }}
                onBlur={(e) => {
                  handleHeroFieldBlur('whyChooseTitle', e.target.value);
                }}
                placeholder="e.g. Why Choose The Sehat Buddy?"
              />
            </div>
          </form>

          {/* Explainer Video Settings */}
          <form
            className={styles.formCard}
            style={{ marginBottom: '20px' }}
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveWhyVideo();
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #e9eff2', paddingBottom: '12px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-heading)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Play size={18} color="#2563EB" />
                  "Watch How It Works" Video Control
                </h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>
                  Manage the explainer video URL, play button text, and configure automatic video playback. Press Enter to save.
                </p>
              </div>
              <button
                type="submit"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--color-primary)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                <CheckCircle size={15} /> Save Video
              </button>
            </div>

            {/* Cloudinary Video Upload Box */}
            <div className={styles.videoUploadBox}>
              <div className={styles.videoUploadHeader}>
                <div className={styles.videoUploadInfo}>
                  <div className={styles.videoUploadIcon}>
                    <UploadCloud size={22} />
                  </div>
                  <div>
                    <div className={styles.videoUploadTitle}>Upload Explainer Video to Database & CDN</div>
                    <p className={styles.videoUploadDesc}>
                      Upload direct video (.mp4, .webm, .mov up to 100MB). Stored safely and plays directly on the website front page.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    ref={videoFileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-matroska,.mp4,.webm,.mov,.mkv,.avi"
                    onChange={handleVideoUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    disabled={isVideoUploading}
                    onClick={() => videoFileInputRef.current?.click()}
                    className={styles.videoUploadBtn}
                  >
                    {isVideoUploading ? (
                      <>
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        <span>Uploading ({videoUploadProgress}%)...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud size={16} />
                        <span>Upload Video to Cloudinary</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Upload Progress Bar */}
              {isVideoUploading && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B', marginBottom: '4px' }}>
                    <span>Uploading video directly to Cloudinary...</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{videoUploadProgress}%</span>
                  </div>
                  <div className={styles.videoProgressBar}>
                    <div className={styles.videoProgressFill} style={{ width: `${videoUploadProgress}%` }}></div>
                  </div>
                </div>
              )}

              {/* Status indicator if currently has an active video */}
              {heroForm.whyChooseVideoUrl && !isVideoUploading && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={styles.cloudinaryBadge}>
                      <CheckCircle size={13} /> Active Video Loaded
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#475569', wordBreak: 'break-all', maxWidth: '350px' }}>
                      {heroForm.whyChooseVideoUrl}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={isDeletingWhyVideo}
                    onClick={async () => {
                      const vidToDelete = heroForm.whyChooseVideoUrl || heroContent?.whyChooseVideoUrl;
                      if (!vidToDelete) return;
                      if (!window.confirm('Are you sure you want to permanently delete this explainer video? It will be removed from Cloudinary storage and the website.')) {
                        return;
                      }

                      setIsDeletingWhyVideo(true);
                      try {
                        if (vidToDelete && (vidToDelete.includes('cloudinary.com') || vidToDelete.includes('res.cloudinary.com'))) {
                          await api.deleteVideo(vidToDelete).catch(err => console.warn('Failed to delete explainer video from Cloudinary:', err));
                        }
                        setHeroForm(prev => ({ ...prev, whyChooseVideoUrl: '' }));
                        updateHeroContent({ whyChooseVideoUrl: '' });
                        showToast('Explainer video permanently deleted from Cloudinary and front page.');
                      } catch (err) {
                        console.error('Error removing explainer video:', err);
                        showToast('Failed to delete video: ' + (err.message || 'Please try again.'));
                      } finally {
                        setIsDeletingWhyVideo(false);
                      }
                    }}
                    style={{
                      background: '#fee2e2',
                      border: '1px solid #fecaca',
                      color: '#dc2626',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '5px 12px',
                      borderRadius: '6px',
                      cursor: isDeletingWhyVideo ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                    title="Remove this video and delete permanently from Cloudinary"
                  >
                    {isDeletingWhyVideo ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={13} />}
                    <span>{isDeletingWhyVideo ? 'Deleting...' : 'Remove Video'}</span>
                  </button>
                </div>
              )}
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                <label>Video URL (Cloudinary, YouTube, or Direct MP4 link)</label>
                <input
                  type="text"
                  value={heroForm.whyChooseVideoUrl}
                  onChange={(e) => handleHeroFieldChange('whyChooseVideoUrl', e.target.value)}
                  onBlur={(e) => handleHeroFieldBlur('whyChooseVideoUrl', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveWhyVideo();
                    }
                  }}
                  placeholder="Paste Cloudinary video link or leave empty to hide video player"
                />
                <span style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '4px', display: 'block' }}>
                  Upload a video to Cloudinary using the button above, or paste any video URL / YouTube link. Auto-saved on blur or press Enter.
                </span>
              </div>

              <div className={styles.formGroup}>
                <label>Play Button Text / Label</label>
                <textarea
                  rows={2}
                  value={heroForm.whyChooseVideoText}
                  onChange={(e) => handleHeroFieldChange('whyChooseVideoText', e.target.value)}
                  onBlur={(e) => handleHeroFieldBlur('whyChooseVideoText', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      handleSaveWhyVideo();
                    }
                  }}
                  placeholder="Watch how&#10;Sehat Buddy&#10;works for you"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Autoplay on Click</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginTop: '8px' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(heroForm.whyChooseVideoAutoplay)}
                    onChange={(e) => {
                      handleHeroFieldChange('whyChooseVideoAutoplay', e.target.checked);
                      updateHeroContent({ whyChooseVideoAutoplay: e.target.checked });
                    }}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                  />
                  <span style={{ fontSize: '0.88rem', color: '#1E293B', fontWeight: 500 }}>
                    Autoplay video immediately when player modal opens
                  </span>
                </label>
              </div>
            </div>

            {/* Test Video Preview Button */}
            {heroForm.whyChooseVideoUrl && (
              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsPreviewVideoOpen(true)}
                  style={{
                    background: '#F1F5F9',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    padding: '7px 14px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#334155',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Play size={14} color="#2563EB" /> Test & Preview Autoplay
                </button>
                <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  Click to test the video modal and verify that autoplay works properly.
                </span>
              </div>
            )}
          </form>

          <div className={styles.itemsList}>
            {features?.map((feat) => (
              <div key={feat.id} className={styles.itemRowCard}>
                <div className={styles.featureIconBadge}>
                  <ShieldCheck size={22} color="#2563EB" />
                </div>

                <div className={styles.itemInputGroup}>
                  <div className={styles.formGroup}>
                    <label>Feature Title</label>
                    <input
                      type="text"
                      value={feat.title}
                      onChange={(e) => updateFeature(feat.id, { title: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          updateFeature(feat.id, { title: feat.title });
                          showToast(`Feature "${feat.title}" saved!`);
                        }
                      }}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Description</label>
                    <input
                      type="text"
                      value={feat.description}
                      onChange={(e) => updateFeature(feat.id, { description: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          updateFeature(feat.id, { description: feat.description });
                          showToast(`Feature "${feat.title}" saved!`);
                        }
                      }}
                    />
                  </div>
                </div>

                <div className={styles.formGroup} style={{ width: '150px' }}>
                  <label>Icon</label>
                  <select
                    value={feat.iconName || 'ShieldCheck'}
                    onChange={(e) => updateFeature(feat.id, { iconName: e.target.value })}
                  >
                    {AVAILABLE_ICONS.map(ic => (
                      <option key={ic} value={ic}>{ic}</option>
                    ))}
                  </select>
                </div>

                <button
                  className={styles.deleteRowBtn}
                  onClick={() => {
                    deleteFeature(feat.id);
                    showToast(`Feature "${feat.title}" removed.`);
                  }}
                  title="Delete feature card"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: HEALTH CONTENT & ARTICLES */}
      {subTab === 'articles' && (
        <div className={styles.tabPane}>
          <div className={styles.paneActionHeader}>
            <div>
              <h3>Health Content & Tips Articles</h3>
              <p>Manage health guides, read times, and category tags displayed on the website.</p>
            </div>
            <button
              className={styles.addBtn}
              onClick={() => setIsAddArticleOpen(true)}
            >
              <Plus size={16} /> Add New Article
            </button>
          </div>

          <div className={styles.articlesEditorGrid}>
            {articles?.map((art) => (
              <div key={art.id} className={styles.articleEditCard}>
                <img
                  src={art.image}
                  alt={art.title}
                  className={styles.artThumb}
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=400&q=80';
                  }}
                />
                <div className={styles.artEditForm}>
                  <div className={styles.formGroup}>
                    <label>Article Title</label>
                    <input
                      type="text"
                      value={art.title}
                      onChange={(e) => updateArticle(art.id, { title: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          updateArticle(art.id, { title: art.title });
                          showToast(`Article "${art.title}" saved!`);
                        }
                      }}
                    />
                  </div>

                  <div className={styles.formGrid2}>
                    <div className={styles.formGroup}>
                      <label>Category</label>
                      <input
                        type="text"
                        value={art.category}
                        onChange={(e) => updateArticle(art.id, { category: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            updateArticle(art.id, { category: art.category });
                            showToast(`Article "${art.title}" saved!`);
                          }
                        }}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Read Time</label>
                      <input
                        type="text"
                        value={art.readTime}
                        onChange={(e) => updateArticle(art.id, { readTime: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            updateArticle(art.id, { readTime: art.readTime });
                            showToast(`Article "${art.title}" saved!`);
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup} style={{ marginTop: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <ExternalLink size={13} color="#2563EB" />
                      <span>Article Link / Redirect URL</span>
                    </label>
                    <input
                      type="url"
                      value={art.link || ''}
                      onChange={(e) => updateArticle(art.id, { link: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          updateArticle(art.id, { link: art.link });
                          showToast(`Article link for "${art.title}" saved!`);
                        }
                      }}
                      placeholder="e.g. https://example.com/article-slug or internal path"
                    />
                  </div>

                  {/* Blog PDF Document Attachment (Max 1MB) */}
                  <div className={styles.formGroup} style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', margin: 0, fontWeight: 600 }}>
                        <FileText size={13} color="#DC2626" />
                        <span>Blog PDF Document</span>
                      </label>
                      <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                        Limit: 1MB
                      </span>
                    </div>

                    {art.pdfUrl ? (
                      <div className={styles.pdfAttachmentCard}>
                        <div className={styles.pdfInfo}>
                          <div className={styles.pdfIconBadge}>
                            <FileText size={16} color="#DC2626" />
                          </div>
                          <div className={styles.pdfMeta}>
                            <span className={styles.pdfFileName} title={art.pdfName || 'Article Document.pdf'}>
                              {art.pdfName || 'Article Document.pdf'}
                            </span>
                            <span className={styles.pdfFileSize}>
                              {art.pdfSize || 'PDF Document'} • Uploaded
                            </span>
                          </div>
                        </div>
                        <div className={styles.pdfActions}>
                          <a
                            href={art.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.pdfViewBtn}
                            title="Open & view PDF in new tab"
                          >
                            <ExternalLink size={12} /> View
                          </a>
                          <label className={styles.pdfReplaceBtn} title="Upload a different PDF (Max 1MB)">
                            <Upload size={12} /> Replace
                            <input
                              type="file"
                              accept=".pdf,application/pdf"
                              style={{ display: 'none' }}
                              onChange={(e) => handleArticlePdfUpload(art.id, e)}
                            />
                          </label>
                          <button
                            type="button"
                            className={styles.pdfRemoveBtn}
                            onClick={() => handleRemoveArticlePdf(art.id, art.title)}
                            title="Remove PDF document from this article"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.pdfUploadZone}>
                        <label className={styles.pdfUploadBtn}>
                          <Upload size={13} />
                          <span>Upload PDF in Blog (Max 1MB)</span>
                          <input
                            type="file"
                            accept=".pdf,application/pdf"
                            style={{ display: 'none' }}
                            onChange={(e) => handleArticlePdfUpload(art.id, e)}
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  <div className={styles.artCardFooter}>
                    <span className={styles.categoryPillPreview} style={{ backgroundColor: art.categoryBg, color: art.categoryColor }}>
                      {art.category}
                    </span>
                    <button
                      className={styles.deleteRowBtn}
                      onClick={() => {
                        deleteArticle(art.id);
                        showToast(`Article "${art.title}" deleted.`);
                      }}
                      title="Delete article"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Newsletter Box Content */}
          <form
            className={styles.formCard}
            style={{ marginTop: '24px' }}
            onSubmit={(e) => {
              e.preventDefault();
              isHeroDirtyRef.current = false;
              updateHeroContent({
                newsletterTitle: heroForm.newsletterTitle,
                newsletterSubtitle: heroForm.newsletterSubtitle
              });
              showToast('Newsletter card content saved!');
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>Newsletter Card Content</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>
                  Manage the promotional newsletter subscription box title and subtitle. Press Enter to save.
                </p>
              </div>
              <button
                type="submit"
                className={styles.primarySaveBtn}
              >
                <CheckCircle size={15} /> Save Newsletter Content
              </button>
            </div>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Newsletter Title</label>
                <textarea
                  rows={2}
                  value={heroForm.newsletterTitle ?? ''}
                  onChange={(e) => handleHeroFieldChange('newsletterTitle', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      isHeroDirtyRef.current = false;
                      const titleVal = heroFormRef.current?.newsletterTitle ?? e.target.value;
                      const subVal = heroFormRef.current?.newsletterSubtitle ?? heroForm.newsletterSubtitle;
                      updateHeroContent({
                        newsletterTitle: titleVal,
                        newsletterSubtitle: subVal
                      });
                      showToast('Newsletter card content saved!');
                    }
                  }}
                  onBlur={(e) => {
                    handleHeroFieldBlur('newsletterTitle', e.target.value);
                  }}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Newsletter Subtitle</label>
                <input
                  type="text"
                  value={heroForm.newsletterSubtitle ?? ''}
                  onChange={(e) => handleHeroFieldChange('newsletterSubtitle', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      isHeroDirtyRef.current = false;
                      const titleVal = heroFormRef.current?.newsletterTitle ?? heroForm.newsletterTitle;
                      const subVal = heroFormRef.current?.newsletterSubtitle ?? e.target.value;
                      updateHeroContent({
                        newsletterTitle: titleVal,
                        newsletterSubtitle: subVal
                      });
                      showToast('Newsletter card content saved!');
                    }
                  }}
                  onBlur={(e) => {
                    handleHeroFieldBlur('newsletterSubtitle', e.target.value);
                  }}
                />
              </div>
            </div>
          </form>
        </div>
      )}

      {/* SUB-TAB 5: CORPORATE TIE-UPS */}
      {subTab === 'corporate' && (
        <div className={styles.tabPane}>
          {/* Section Header Controls */}
          <form onSubmit={handleSaveCorporateHeader} className={styles.formCard}>
            <div className={styles.paneHeader}>
              <div>
                <h3>Corporate Tie-ups Section Header & Metrics</h3>
                <p>Customize the headline, subtitle, and trust metrics shown above the corporate partners ticker.</p>
              </div>
              <button type="submit" className={styles.primarySaveBtn}>
                <CheckCircle size={16} /> Save Header
              </button>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Top Badge Text</label>
                <input
                  type="text"
                  value={corporateHeaderForm.corporateBadge ?? ''}
                  onChange={(e) => handleCorporateHeaderChange('corporateBadge', e.target.value)}
                  placeholder="e.g. OUR PARTNERS"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Section Heading Title</label>
                <input
                  type="text"
                  value={corporateHeaderForm.corporateTitle ?? ''}
                  onChange={(e) => handleCorporateHeaderChange('corporateTitle', e.target.value)}
                  placeholder="e.g. We work with the best partners"
                />
              </div>
            </div>
          </form>

          {/* Action Header */}
          <div className={styles.paneActionHeader}>
            <div>
              <h3>Corporate Partners ({corporateTieups?.length || 0})</h3>
              <p>Add and manage enterprise partner companies and logos displayed in the homepage partners marquee. All logos are saved to Cloudinary and deleted from Cloudinary when removed.</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {corporateTieups && corporateTieups.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={async () => {
                      await saveCorporateTieupsNow();
                      showToast('All corporate partners saved to database!');
                    }}
                    className={styles.primarySaveBtn}
                    style={{ padding: '8px 14px', fontSize: '0.84rem' }}
                    title="Save all corporate partner details to database"
                  >
                    <CheckCircle size={15} /> Save All
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAllCorporate}
                    style={{
                      background: '#fef2f2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease'
                    }}
                    title="Remove all corporate partners from database"
                  >
                    <Trash2 size={15} /> Delete All
                  </button>
                </>
              )}
              <button
                type="button"
                className={styles.addBtn}
                onClick={handleOpenAddCorporate}
              >
                <Plus size={16} /> Add Corporate Partner
              </button>
            </div>
          </div>

          {/* Partners List */}
          <div className={styles.itemsList}>
            {(!corporateTieups || corporateTieups.length === 0) && (
              <div style={{ textAlign: 'center', padding: '36px 20px', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '1.5px dashed #cbd5e1' }}>
                <p style={{ margin: '0 0 10px 0', fontWeight: 600, fontSize: '0.95rem' }}>No corporate partners currently in the database.</p>
                <p style={{ margin: '0 0 14px 0', fontSize: '0.85rem' }}>Click "+ Add Corporate Partner" to add a new enterprise partner.</p>
                <button
                  type="button"
                  onClick={handleOpenAddCorporate}
                  className={styles.addBtn}
                  style={{ display: 'inline-flex' }}
                >
                  <Plus size={16} /> Add Corporate Partner
                </button>
              </div>
            )}
            {corporateTieups?.map((corp) => {
              const corpId = corp.id !== undefined && corp.id !== null ? corp.id : corp._id;
              return (
                <CorporatePartnerRow
                  key={corpId}
                  corp={corp}
                  onSave={handleSaveCorporatePartner}
                  onDelete={async (id, name) => {
                    try {
                      const target = (corporateTieups || []).find(c => (c.id !== undefined && c.id !== null ? c.id : c._id) === id);
                      if (target?.logo && (target.logo.includes('cloudinary.com') || target.logo.includes('res.cloudinary.com'))) {
                        await api.deleteImage(target.logo).catch(err => console.warn('Cloudinary delete error:', err));
                      }
                      await deleteCorporateTieup(id);
                      showToast(`Partner "${name}" and logo removed from database and Cloudinary.`);
                    } catch (err) {
                      showToast(`Failed to delete partner: ${err.message || 'Server error'}`);
                    }
                  }}
                  showToast={showToast}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 6: CONTACT US PAGE MANAGEMENT */}
      {subTab === 'contact' && (
        <div className={styles.tabPane}>
          {/* Section Header */}
          <div className={styles.paneHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 className={styles.paneTitle}>Contact Us Page Controls &amp; Settings</h3>
              <p className={styles.paneSubtitle}>
                Manage all live elements of the Contact Us console: top badges, headlines, the emergency helpline card, and showcase hospital imagery.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSaveContactUsSettings}
              style={{
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '9px 18px',
                fontSize: '0.86rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                boxShadow: '0 2px 6px rgba(37,99,235,0.25)'
              }}
            >
              <Save size={16} /> Save All Contact Us Settings
            </button>
          </div>

          <form onSubmit={handleSaveContactUsSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
            {/* CARD 1: TOP BADGES & PAGE HEADLINES */}
            <div className={styles.formCard} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Top Badges &amp; Welcoming Headlines</h4>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Configure the badges above the heading, the main greeting, and the descriptive text.</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Top Left Badge Text
                  </label>
                  <input
                    type="text"
                    value={contactTopBadgeInput}
                    onChange={(e) => setContactTopBadgeInput(e.target.value)}
                    placeholder="e.g. Verified Healthcare Concierge"
                    className={styles.input}
                    style={{ width: '100%' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                    Appears with star icon at the top left of the page.
                  </span>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Top Right Status Badge Text
                  </label>
                  <input
                    type="text"
                    value={contactStatusBadgeInput}
                    onChange={(e) => setContactStatusBadgeInput(e.target.value)}
                    placeholder="e.g. 24/7 Live Patient Support Active"
                    className={styles.input}
                    style={{ width: '100%' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                    Appears with live green pulse indicator on the top right.
                  </span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Main Page Heading *
                </label>
                <input
                  type="text"
                  required
                  value={contactTitleInput}
                  onChange={(e) => setContactTitleInput(e.target.value)}
                  placeholder="e.g. We're Here for You & Your Family"
                  className={styles.input}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Subtitle / Supporting Description *
                </label>
                <textarea
                  rows={2}
                  required
                  value={contactSubtitleInput}
                  onChange={(e) => setContactSubtitleInput(e.target.value)}
                  placeholder="e.g. Reach our care coordinators directly for emergency hospital beds..."
                  className={styles.input}
                  style={{ width: '100%', resize: 'vertical', lineHeight: '1.45' }}
                />
              </div>
            </div>

            {/* TWO-COLUMN GRID FOR LEFT-COLUMN PAGE CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
              {/* CARD 2: HELPLINE & EMERGENCY DESK */}
              <div className={styles.formCard} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Phone size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#0f172a' }}>Helpline &amp; Emergency Card</h4>
                    <span style={{ fontSize: '0.76rem', color: '#64748b' }}>Top green card on the left column with one-click call &amp; copy actions.</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Card Label / Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={helplineLabelInput}
                      onChange={(e) => setHelplineLabelInput(e.target.value)}
                      placeholder="e.g. Helpline & Emergency"
                      className={styles.input}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Status Pill Tag
                    </label>
                    <input
                      type="text"
                      value={helplineStatusInput}
                      onChange={(e) => setHelplineStatusInput(e.target.value)}
                      placeholder="e.g. 24x7 Active"
                      className={styles.input}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Direct Helpline Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={helphoneNumberInput}
                    onChange={(e) => setHelphoneNumberInput(e.target.value)}
                    placeholder="e.g. +91 98765 4321"
                    className={styles.input}
                    style={{ width: '100%', fontWeight: 600, color: '#0f172a' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                    Triggers direct tel: link and copies to clipboard on button clicks.
                  </span>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Helpline Card Description
                  </label>
                  <textarea
                    rows={3}
                    value={helplineDescInput}
                    onChange={(e) => setHelplineDescInput(e.target.value)}
                    placeholder="e.g. Direct 24/7 hotline for critical triage, live ICU & inpatient bed reservations..."
                    className={styles.input}
                    style={{ width: '100%', resize: 'none', lineHeight: '1.4' }}
                  />
                </div>
              </div>

              {/* CARD 3: SHOWCASE HOSPITAL PHOTO & OVERLAY BADGE */}
              <div className={styles.formCard} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ImageIcon size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#0f172a' }}>Showcase Hospital Photo &amp; Caption</h4>
                    <span style={{ fontSize: '0.76rem', color: '#64748b' }}>Bottom card on the left column displaying high-res medical facility.</span>
                  </div>
                </div>

                <div style={{ position: 'relative', width: '100%', height: '170px', borderRadius: '12px', overflow: 'hidden', border: contactInfo?.image ? '1px solid #e2e8f0' : '1.5px dashed #cbd5e1', background: contactInfo?.image ? '#0f172a' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {contactInfo?.image ? (
                    <>
                      <img
                        src={contactInfo.image}
                        alt="Contact Page Showcase"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={(e) => { e.target.src = DEFAULT_CONTACT_IMAGE; }}
                      />
                      <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', color: '#ffffff', padding: '4px 10px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Building2 size={13} />
                        <span>{photoBadgeInput || '40+ Network Hospitals • Bengaluru Care Hub'}</span>
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
                      <ImageIcon size={36} color="#cbd5e1" style={{ marginBottom: '6px' }} />
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '0.86rem', color: '#64748b' }}>No Showcase Photo Selected</p>
                      <p style={{ margin: '3px 0 0', fontSize: '0.74rem', color: '#94a3b8' }}>Upload a photo or click "Reset Default" to display facility</p>
                    </div>
                  )}
                </div>

                {uploadingContactPhoto && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#2563eb', fontWeight: 600 }}>
                      <span>Uploading Photo to Cloudinary...</span>
                      <span>{contactPhotoProgress}%</span>
                    </div>
                    <div style={{ width: '100%', height: '5px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: `${contactPhotoProgress}%`, height: '100%', background: '#2563eb', transition: 'width 0.2s' }} />
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    disabled={uploadingContactPhoto || isDeletingContactPhoto}
                    onClick={() => contactPhotoRef.current?.click()}
                    style={{
                      flex: 1,
                      minWidth: '130px',
                      background: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: (uploadingContactPhoto || isDeletingContactPhoto) ? 'wait' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    {uploadingContactPhoto ? <Loader2 size={14} className={styles.spinIcon} /> : <Upload size={14} />}
                    <span>{uploadingContactPhoto ? 'Uploading to Cloudinary...' : (contactInfo?.image ? 'Replace Photo' : 'Upload Photo')}</span>
                  </button>

                  {Boolean(contactInfo?.image) && (
                    <button
                      type="button"
                      disabled={uploadingContactPhoto || isDeletingContactPhoto}
                      onClick={handleDeleteContactPhoto}
                      title="Permanently delete photo from Cloudinary"
                      style={{
                        background: '#fee2e2',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        padding: '8px 14px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: isDeletingContactPhoto ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      {isDeletingContactPhoto ? <Loader2 size={13} className={styles.spinIcon} /> : <Trash2 size={13} />}
                      <span>{isDeletingContactPhoto ? 'Deleting...' : 'Delete Photo'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={uploadingContactPhoto || isDeletingContactPhoto}
                    onClick={handleResetContactPhoto}
                    title="Reset to default hospital operating room showcase photo"
                    style={{
                      background: '#ffffff',
                      color: '#64748b',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <RefreshCw size={13} />
                    <span>Reset Default</span>
                  </button>

                  <input
                    ref={contactPhotoRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleUploadContactPhoto(e.target.files[0]);
                      }
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Photo Overlay Badge Caption
                  </label>
                  <input
                    type="text"
                    value={photoBadgeInput}
                    onChange={(e) => setPhotoBadgeInput(e.target.value)}
                    placeholder="e.g. 40+ Network Hospitals • Bengaluru Care Hub"
                    className={styles.input}
                    style={{ width: '100%' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                    Displayed directly on top of the showcase photo.
                  </span>
                </div>
              </div>
            </div>

            {/* BOTTOM SAVE ACTIONS */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button
                type="submit"
                style={{
                  background: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 24px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 6px rgba(5,150,105,0.25)'
                }}
              >
                <Save size={16} /> Save All Contact Us Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Add Service */}
      {isAddServiceOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAddServiceOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Add Service Card</h3>
              <button onClick={() => setIsAddServiceOpen(false)} className={styles.closeBtn}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateService} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Service Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Home Health Care"
                  value={newService.title}
                  onChange={(e) => setNewService({ ...newService, title: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Subtitle / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Qualified nurses at your doorstep"
                  value={newService.subtitle}
                  onChange={(e) => setNewService({ ...newService, subtitle: e.target.value })}
                />
              </div>
              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label>Background Color</label>
                  <input
                    type="color"
                    value={newService.bgTint}
                    onChange={(e) => setNewService({ ...newService, bgTint: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Icon Tint</label>
                  <input
                    type="color"
                    value={newService.iconTint}
                    onChange={(e) => setNewService({ ...newService, iconTint: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsAddServiceOpen(false)}>Cancel</button>
                <button type="submit" className={styles.submitBtn}>Add Service Card</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Feature */}
      {isAddFeatureOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAddFeatureOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Add Why Choose Us Feature</h3>
              <button onClick={() => setIsAddFeatureOpen(false)} className={styles.closeBtn}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateFeature} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Feature Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 100% Free Follow-ups"
                  value={newFeature.title}
                  onChange={(e) => setNewFeature({ ...newFeature, title: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Description</label>
                <input
                  type="text"
                  placeholder="e.g. Get 7 days free consultation follow-up"
                  value={newFeature.description}
                  onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Icon</label>
                <select
                  value={newFeature.iconName}
                  onChange={(e) => setNewFeature({ ...newFeature, iconName: e.target.value })}
                >
                  {AVAILABLE_ICONS.map(ic => (
                    <option key={ic} value={ic}>{ic}</option>
                  ))}
                </select>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsAddFeatureOpen(false)}>Cancel</button>
                <button type="submit" className={styles.submitBtn}>Add Feature</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Article */}
      {isAddArticleOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAddArticleOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Add Health Tip Article</h3>
              <button onClick={() => setIsAddArticleOpen(false)} className={styles.closeBtn}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateArticle} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Article Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 7 Foods to Boost Daily Energy"
                  value={newArticle.title}
                  onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                />
              </div>
              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label>Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Wellness, Fitness"
                    value={newArticle.category}
                    onChange={(e) => setNewArticle({ ...newArticle, category: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Read Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 4 min read"
                    value={newArticle.readTime}
                    onChange={(e) => setNewArticle({ ...newArticle, readTime: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Article Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newArticle.image}
                  onChange={(e) => setNewArticle({ ...newArticle, image: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ExternalLink size={13} color="#2563EB" />
                  <span>Article Link / Redirect URL</span>
                </label>
                <input
                  type="url"
                  placeholder="e.g. https://example.com/article-slug or /articles/slug"
                  value={newArticle.link || ''}
                  onChange={(e) => setNewArticle({ ...newArticle, link: e.target.value })}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px', display: 'block' }}>
                  When visitors on the homepage click this article, they will be redirected to this link.
                </span>
              </div>

              {/* PDF Document Upload in Blog */}
              <div className={styles.formGroup}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0, fontWeight: 600 }}>
                    <FileText size={14} color="#DC2626" />
                    <span>Upload PDF in Blog (Max 1MB)</span>
                  </label>
                  <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Limit: 1MB</span>
                </div>
                {newArticle.pdfUrl ? (
                  <div className={styles.pdfAttachmentCard}>
                    <div className={styles.pdfInfo}>
                      <div className={styles.pdfIconBadge}>
                        <FileText size={16} color="#DC2626" />
                      </div>
                      <div className={styles.pdfMeta}>
                        <span className={styles.pdfFileName}>{newArticle.pdfName || 'Document.pdf'}</span>
                        <span className={styles.pdfFileSize}>{newArticle.pdfSize || 'Ready to attach'}</span>
                      </div>
                    </div>
                    <div className={styles.pdfActions}>
                      <button
                        type="button"
                        className={styles.pdfRemoveBtn}
                        onClick={() => setNewArticle(prev => ({ ...prev, pdfUrl: '', pdfName: '', pdfSize: '' }))}
                        title="Remove PDF"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className={styles.pdfUploadBtn} style={{ cursor: 'pointer' }}>
                    <Upload size={14} />
                    <span>Select PDF Document (Max 1MB)</span>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      style={{ display: 'none' }}
                      onChange={handleNewArticlePdfUpload}
                    />
                  </label>
                )}
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsAddArticleOpen(false)}>Cancel</button>
                <button type="submit" className={styles.submitBtn}>Add Article</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Corporate Partner */}
      {isAddCorporateOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAddCorporateOpen(false)}>
          <div className={`${styles.modal} ${styles.corporateModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Add Corporate Partner</h3>
              <button onClick={() => setIsAddCorporateOpen(false)} className={styles.closeBtn}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateCorporate} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Company / Enterprise Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Microsoft, Flipkart, Google, Zepto"
                  value={newCorporate.name}
                  onChange={(e) => setNewCorporate({ ...newCorporate, name: e.target.value })}
                  autoFocus
                />
              </div>

              <div className={styles.formGroup}>
                <label>Company Website URL (Optional)</label>
                <input
                  type="url"
                  placeholder="e.g. https://www.microsoft.com"
                  value={newCorporate.website}
                  onChange={(e) => setNewCorporate({ ...newCorporate, website: e.target.value })}
                />
              </div>

              {/* Upload Company Logo */}
              <div className={styles.formGroup}>
                <label>Upload Company Logo (PNG, SVG, JPG, WebP) *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label
                    className={styles.corpUploadIconBtn}
                    style={{
                      padding: '8px 14px',
                      fontSize: '0.82rem',
                      cursor: isNewCorporateUploading ? 'not-allowed' : 'pointer',
                      opacity: isNewCorporateUploading ? 0.6 : 1
                    }}
                  >
                    <Upload size={14} />
                    <span>{isNewCorporateUploading ? 'Uploading to Cloudinary...' : (newCorporate.logo ? 'Change Logo' : 'Upload Logo to Cloudinary')}</span>
                    <input
                      type="file"
                      accept="image/*,.png,.jpg,.jpeg,.svg,.webp"
                      style={{ display: 'none' }}
                      disabled={isNewCorporateUploading}
                      onChange={handleNewCorporateLogoUpload}
                    />
                  </label>
                  {newCorporate.logo && (
                    <button
                      type="button"
                      className={styles.corpRemoveIconBtn}
                      style={{ width: '32px', height: '32px' }}
                      onClick={async () => {
                        const cur = newCorporate.logo;
                        if (cur && (cur.includes('cloudinary.com') || cur.includes('res.cloudinary.com'))) {
                          api.deleteImage(cur).catch(err => console.warn('Failed to delete corporate logo from Cloudinary:', err));
                        }
                        setNewCorporate(prev => ({ ...prev, logo: '' }));
                      }}
                      title="Remove Logo from Cloudinary"
                      disabled={isNewCorporateUploading}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Live Preview Box in new partner card style */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Homepage Live Card Preview
                </span>
                <div
                  style={{
                    width: '220px',
                    height: '76px',
                    background: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '14px',
                    padding: '12px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
                  }}
                  title="Card Preview"
                >
                  {newCorporate.logo ? (
                    <img
                      src={newCorporate.logo}
                      alt="Logo preview"
                      style={{ maxWidth: '170px', maxHeight: '40px', objectFit: 'contain', display: 'block' }}
                    />
                  ) : (
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
                      {newCorporate.name || 'Company Name'}
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsAddCorporateOpen(false)}>Cancel</button>
                <button type="submit" className={styles.submitBtn} disabled={isNewCorporateUploading}>
                  {isNewCorporateUploading ? 'Uploading...' : 'Add Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Video Preview Modal */}
      {isPreviewVideoOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
          onClick={() => setIsPreviewVideoOpen(false)}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '860px',
              background: '#000000',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.6)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsPreviewVideoOpen(false)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                zIndex: 10,
                background: 'rgba(0, 0, 0, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#fff',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>
            <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
              {heroForm.whyChooseVideoUrl.includes('youtube.com') || heroForm.whyChooseVideoUrl.includes('youtu.be') ? (
                <iframe
                  src={getEmbedUrl(heroForm.whyChooseVideoUrl, heroForm.whyChooseVideoAutoplay)}
                  title="Video Preview"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                />
              ) : (
                <video
                  src={heroForm.whyChooseVideoUrl}
                  autoPlay={Boolean(heroForm.whyChooseVideoAutoplay)}
                  controls
                  playsInline
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FrontPageEditor;
