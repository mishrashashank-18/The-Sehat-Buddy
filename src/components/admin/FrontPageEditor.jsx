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
  Check
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
    shortName: corp.shortName || '',
    logoText: corp.logoText || '',
    category: corp.category || '',
    benefit: corp.benefit || '',
    employeesCovered: corp.employeesCovered || '',
    color: corp.color || '#2563EB',
    bgColor: corp.bgColor || '#EFF6FF',
    logo: corp.logo || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Synchronize draft if corp updates externally (e.g. initial fetch or database reload)
  useEffect(() => {
    setDraft({
      name: corp.name || '',
      shortName: corp.shortName || '',
      logoText: corp.logoText || '',
      category: corp.category || '',
      benefit: corp.benefit || '',
      employeesCovered: corp.employeesCovered || '',
      color: corp.color || '#2563EB',
      bgColor: corp.bgColor || '#EFF6FF',
      logo: corp.logo || ''
    });
  }, [corp.name, corp.shortName, corp.logoText, corp.category, corp.benefit, corp.employeesCovered, corp.color, corp.bgColor, corp.logo]);

  const hasChanges = (
    (draft.name || '').trim() !== (corp.name || '').trim() ||
    (draft.logoText || '').trim() !== (corp.logoText || '').trim() ||
    (draft.category || '').trim() !== (corp.category || '').trim() ||
    (draft.benefit || '').trim() !== (corp.benefit || '').trim() ||
    (draft.employeesCovered || '').trim() !== (corp.employeesCovered || '').trim() ||
    (draft.color || '#2563EB').toLowerCase() !== (corp.color || '#2563EB').toLowerCase() ||
    (draft.bgColor || '#EFF6FF').toLowerCase() !== (corp.bgColor || '#EFF6FF').toLowerCase() ||
    (draft.logo || '') !== (corp.logo || '')
  );

  const handleLogoUpload = async (e) => {
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
    setIsUploadingLogo(true);

    try {
      const uploadedUrl = await api.uploadImage(file, 'sehatbuddy/corporate');
      if (uploadedUrl) {
        setDraft(prev => ({ ...prev, logo: uploadedUrl }));
        showToast('Logo loaded into draft! Click "Save" on card to publish.');
      } else {
        throw new Error('Upload returned no URL');
      }
    } catch (err) {
      console.warn('Fallback Data URI logo upload used:', err.message);
      const reader = new FileReader();
      reader.onload = () => {
        setDraft(prev => ({ ...prev, logo: reader.result }));
        showToast('Logo loaded into draft! Click "Save" on card to publish.');
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleLogoRemove = () => {
    setDraft(prev => ({ ...prev, logo: '' }));
    showToast('Logo removed from draft. Click "Save" on card to publish.');
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
    <div className={styles.itemRowCard} style={{ alignItems: 'flex-start' }}>
      {/* Visual Preview Badge with Icon Upload */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <div
          className={styles.corpBadgePreview}
          style={{
            backgroundColor: draft.bgColor || '#EFF6FF',
            color: draft.color || '#2563EB'
          }}
          title={draft.logo ? `Custom icon for ${draft.name || 'Company'}` : "Badge Live Preview"}
        >
          {isUploadingLogo ? (
            <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Loading...</span>
          ) : draft.logo ? (
            <img
              key={draft.logo}
              src={draft.logo}
              alt={draft.name || 'Company icon'}
              className={styles.corpBadgeImg}
              loading="eager"
              decoding="async"
            />
          ) : (
            <span>{draft.logoText || draft.shortName || 'CORP'}</span>
          )}
        </div>

        <div className={styles.corpLogoUploadWrap}>
          <label
            className={styles.corpUploadIconBtn}
            title="Upload custom company icon (PNG, JPG, SVG, WebP, ICO)"
            style={{
              opacity: isUploadingLogo ? 0.6 : 1,
              pointerEvents: isUploadingLogo ? 'none' : 'auto'
            }}
          >
            <Upload size={11} />
            <span>{isUploadingLogo ? 'Uploading...' : (draft.logo ? 'Change' : 'Upload Icon')}</span>
            <input
              type="file"
              accept="image/*,.png,.jpg,.jpeg,.svg,.webp,.ico"
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
              title="Remove custom icon and revert to text code"
              disabled={isUploadingLogo}
            >
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      <div className={styles.itemInputGroup} style={{ gridTemplateColumns: '1.4fr 1fr 1fr' }}>
        <div className={styles.formGroup}>
          <label>Company Name</label>
          <input
            type="text"
            value={draft.name}
            onChange={(e) => setDraft(prev => ({ ...prev, name: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSave();
              }
            }}
            placeholder="e.g. Tata Consultancy Services"
          />
        </div>

        <div className={styles.formGroup}>
          <label>Logo Text (Short Code)</label>
          <input
            type="text"
            value={draft.logoText}
            onChange={(e) => setDraft(prev => ({ ...prev, logoText: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSave();
              }
            }}
            placeholder="e.g. TCS"
          />
        </div>

        <div className={styles.formGroup}>
          <label>Industry / Category</label>
          <input
            type="text"
            value={draft.category}
            onChange={(e) => setDraft(prev => ({ ...prev, category: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSave();
              }
            }}
            placeholder="e.g. IT & Consulting"
          />
        </div>

        <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
          <label>Benefit Offered</label>
          <input
            type="text"
            value={draft.benefit}
            onChange={(e) => setDraft(prev => ({ ...prev, benefit: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSave();
              }
            }}
            placeholder="e.g. Comprehensive Employee Wellness & Health Checks"
          />
        </div>

        <div className={styles.formGroup}>
          <label>Employees Covered</label>
          <input
            type="text"
            value={draft.employeesCovered}
            onChange={(e) => setDraft(prev => ({ ...prev, employeesCovered: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSave();
              }
            }}
            placeholder="e.g. 500,000+"
          />
        </div>
      </div>

      {/* Color Controls */}
      <div className={styles.colorPillsGroup} style={{ flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
        <div className={styles.colorInputWrap}>
          <label>Text Color</label>
          <div className={styles.colorInputInline}>
            <input
              type="color"
              value={isValidHex(draft.color) ? draft.color : '#2563EB'}
              onChange={(e) => setDraft(prev => ({ ...prev, color: e.target.value }))}
              title="Choose text color swatch"
            />
            <input
              type="text"
              className={styles.colorHexText}
              value={draft.color}
              onChange={(e) => setDraft(prev => ({ ...prev, color: e.target.value }))}
              placeholder="#2563EB"
              maxLength={9}
              title="Enter hex color code (e.g. #2563EB)"
            />
          </div>
        </div>
        <div className={styles.colorInputWrap}>
          <label>Badge BG</label>
          <div className={styles.colorInputInline}>
            <input
              type="color"
              value={isValidHex(draft.bgColor) ? draft.bgColor : '#EFF6FF'}
              onChange={(e) => setDraft(prev => ({ ...prev, bgColor: e.target.value }))}
              title="Choose badge background swatch"
            />
            <input
              type="text"
              className={styles.colorHexText}
              value={draft.bgColor}
              onChange={(e) => setDraft(prev => ({ ...prev, bgColor: e.target.value }))}
              placeholder="#EFF6FF"
              maxLength={9}
              title="Enter hex color code (e.g. #EFF6FF)"
            />
          </div>
        </div>
      </div>

      {/* Card Actions: Save & Delete */}
      <div className={styles.cardActionsCol}>
        <button
          type="button"
          className={`${styles.saveCardBtn} ${hasChanges ? styles.saveCardBtnActive : ''} ${justSaved ? styles.saveCardBtnSuccess : ''}`}
          onClick={handleSave}
          disabled={isSaving}
          title={hasChanges ? "Save changes to frontend and database" : "Click to save card"}
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
          title="Delete corporate partner"
          disabled={isSaving}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
});

const FrontPageEditor = ({ showToast, initialSubTab = 'hero' }) => {
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
    resetFrontPageDefaults
  } = useData();

  // Active sub-tab: 'hero' | 'services' | 'why' | 'articles' | 'corporate'
  const [subTab, setSubTabState] = useState(() => {
    try {
      const saved = localStorage.getItem('sehat_admin_frontpage_subtab');
      if (saved) return saved;
    } catch {}
    return 'hero';
  });

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
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [isHeroPhotoUploading, setIsHeroPhotoUploading] = useState(false);
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

      const uploadedUrl = await api.uploadVideo(file, 'sehatbuddy/videos', (percent) => {
        setVideoUploadProgress(percent);
      });

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
    shortName: '',
    category: '',
    benefit: '',
    color: '#0054A6',
    bgColor: '#EFF6FF',
    logoText: '',
    logo: '',
    employeesCovered: ''
  });

  const handleOpenAddCorporate = () => {
    setNewCorporate({
      name: '',
      shortName: '',
      category: '',
      benefit: '',
      color: '#0054A6',
      bgColor: '#EFF6FF',
      logoText: '',
      logo: '',
      employeesCovered: ''
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
    if (e) e.preventDefault();
    isHeroDirtyRef.current = false;
    updateHeroContent({
      whyChooseTitle: heroForm.whyChooseTitle,
      whyChooseVideoUrl: heroForm.whyChooseVideoUrl,
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
      const uploadedUrl = await api.uploadImage(file, 'sehatbuddy/hero');
      if (!uploadedUrl) {
        throw new Error('Upload succeeded but no image URL was returned.');
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
    const photoToDelete = customHeroImage || (heroForm.heroImage && !heroPresets.some(p => isPresetActive(p.url, heroForm.heroImage)) ? heroForm.heroImage : null);

    const defaultImage = heroPresets[0]?.url || heroFamily || '';
    setHeroForm(prev => ({ ...prev, heroImage: defaultImage }));
    setCustomHeroImage('');
    setCustomPhotoUrlInput('');
    try {
      localStorage.removeItem('sehat_custom_hero_image');
    } catch {}
    updateHeroContent({ heroImage: defaultImage });

    if (photoToDelete && photoToDelete.includes('cloudinary.com')) {
      showToast('Deleting photo from Cloudinary...');
      try {
        await api.deleteImage(photoToDelete);
        showToast('Photo permanently deleted from Cloudinary & reset to default preset.');
      } catch (err) {
        console.warn('Failed to delete photo from Cloudinary:', err);
        showToast('Photo removed from homepage. (Cloudinary cleanup error: ' + (err.message || 'unknown') + ')');
      }
    } else {
      showToast('Photo removed. Reset to default preset photo.');
    }
  };

  const handleDeletePresetPhoto = async (imgToDelete, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const updated = heroPresets.filter(p => p.url !== imgToDelete.url && p.name !== imgToDelete.name);
    setHeroPresets(updated);
    try {
      localStorage.setItem('sehat_hero_presets_v2', JSON.stringify(updated));
    } catch {}

    // Persist deleted preset permanently to MongoDB Atlas
    const updates = { heroPresets: updated };
    if (isPresetActive(imgToDelete.url, heroForm.heroImage)) {
      const nextPhoto = updated[0]?.url || heroFamily || '';
      setHeroForm(prev => ({ ...prev, heroImage: nextPhoto }));
      updates.heroImage = nextPhoto;
    }
    updateHeroContent(updates);

    if (imgToDelete?.url && imgToDelete.url.includes('cloudinary.com')) {
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
    if (!companyName) return;
    const short = newCorporate.shortName.trim() || companyName.split(' ')[0];
    try {
      await addCorporateTieup({
        name: companyName,
        shortName: short,
        logoText: (newCorporate.logoText.trim() || short).slice(0, 10),
        category: newCorporate.category.trim() || 'Enterprise Partner',
        benefit: newCorporate.benefit.trim() || 'Comprehensive healthcare coverage and priority care',
        employeesCovered: newCorporate.employeesCovered.trim() || '50,000+',
        color: newCorporate.color || '#2563EB',
        bgColor: newCorporate.bgColor || '#EFF6FF',
        logo: newCorporate.logo || ''
      });
      setIsAddCorporateOpen(false);
      setNewCorporate({
        name: '',
        shortName: '',
        category: '',
        benefit: '',
        color: '#0054A6',
        bgColor: '#EFF6FF',
        logoText: '',
        logo: '',
        employeesCovered: ''
      });
      showToast(`Partner "${companyName}" saved to database!`);
    } catch (err) {
      showToast(`Failed to add partner: ${err.message || 'Server error'}`);
    }
  };

  // Delete All Corporate Partners
  const handleDeleteAllCorporate = async () => {
    const count = corporateTieups?.length || 0;
    if (window.confirm(`Are you sure you want to delete all ${count} corporate partners from the database?`)) {
      try {
        await deleteAllCorporateTieups();
        showToast('All corporate partners deleted from database.');
      } catch (err) {
        showToast(`Failed to delete partners: ${err.message || 'Server error'}`);
      }
    }
  };

  return (
    <div className={styles.editorContainer}>
      <div className={styles.editorHeader}>
        <div>
          <h2 className={styles.editorTitle}>Front Page Content & Mock Data Editor</h2>
          <p className={styles.editorSubtitle}>
            Customize hero banners, trust metrics, service cards, features, and health articles shown to website visitors.
          </p>
        </div>
      </div>

      {/* Sub Tabs */}
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
      </div>

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
                    className={styles.deletePresetCornerBtn}
                    onClick={handleDeleteCustomHeroPhoto}
                    title="Delete custom photo"
                  >
                    <Trash2 size={12} />
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
                    className={styles.deletePresetCornerBtn}
                    onClick={handleDeleteCustomHeroPhoto}
                    title="Delete custom photo"
                  >
                    <Trash2 size={12} />
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
                  className={styles.deleteHeroPhotoBtn}
                  onClick={handleDeleteCustomHeroPhoto}
                  title="Delete this photo"
                >
                  <Trash2 size={14} />
                  <span>Delete Photo</span>
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
                    onClick={async () => {
                      const vidToDelete = heroForm.whyChooseVideoUrl;
                      setHeroForm(prev => ({ ...prev, whyChooseVideoUrl: '' }));
                      updateHeroContent({ whyChooseVideoUrl: '' });
                      if (vidToDelete && vidToDelete.includes('cloudinary.com')) {
                        try {
                          await api.deleteImage(vidToDelete, 'video');
                          showToast('Explainer video permanently deleted from Cloudinary.');
                        } catch (err) {
                          showToast('Explainer video removed from front page.');
                        }
                      } else {
                        showToast('Explainer video removed from front page.');
                      }
                    }}
                    style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.75rem', fontWeight: 600, padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                    title="Remove this video and delete from Cloudinary"
                  >
                    <Trash2 size={13} />
                    <span>Remove Video</span>
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
                  placeholder="e.g. ENTERPRISE HEALTHCARE NETWORK"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Covered Lives Stat Pill</label>
                <input
                  type="text"
                  value={corporateHeaderForm.corporateStat ?? ''}
                  onChange={(e) => handleCorporateHeaderChange('corporateStat', e.target.value)}
                  placeholder="e.g. 2.5M+ Corporate Lives Covered"
                />
              </div>

              <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                <label>Section Heading Title</label>
                <input
                  type="text"
                  value={corporateHeaderForm.corporateTitle ?? ''}
                  onChange={(e) => handleCorporateHeaderChange('corporateTitle', e.target.value)}
                  placeholder="e.g. Corporate Tie-ups & Partners"
                />
              </div>

              <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                <label>Section Subtitle</label>
                <textarea
                  rows={2}
                  value={corporateHeaderForm.corporateSubtitle ?? ''}
                  onChange={(e) => handleCorporateHeaderChange('corporateSubtitle', e.target.value)}
                  placeholder="Describe your corporate healthcare partnership network..."
                />
              </div>
            </div>
          </form>

          {/* Action Header */}
          <div className={styles.paneActionHeader}>
            <div>
              <h3>Corporate Partners & Enterprises ({corporateTieups?.length || 0})</h3>
              <p>Manage enterprise companies, custom brand colors, logo initials, and employee benefit packages.</p>
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
                      await deleteCorporateTieup(id);
                      showToast(`Partner "${name}" removed from database.`);
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
                  placeholder="e.g. Tata Consultancy Services"
                  value={newCorporate.name}
                  onChange={(e) => setNewCorporate({ ...newCorporate, name: e.target.value })}
                />
              </div>

              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label>Badge Logo Text *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TCS or MSFT"
                    value={newCorporate.logoText}
                    onChange={(e) => setNewCorporate({ ...newCorporate, logoText: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Industry / Category</label>
                  <input
                    type="text"
                    placeholder="e.g. IT & Consulting"
                    value={newCorporate.category}
                    onChange={(e) => setNewCorporate({ ...newCorporate, category: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Healthcare Benefit Offered</label>
                <input
                  type="text"
                  placeholder="e.g. Comprehensive Annual Health Checks & Family Benefits"
                  value={newCorporate.benefit}
                  onChange={(e) => setNewCorporate({ ...newCorporate, benefit: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Employees Covered</label>
                <input
                  type="text"
                  placeholder="e.g. 500,000+"
                  value={newCorporate.employeesCovered}
                  onChange={(e) => setNewCorporate({ ...newCorporate, employeesCovered: e.target.value })}
                />
              </div>

              <div className={styles.formGrid2}>
                <div className={styles.formGroup}>
                  <label>Logo Text Color</label>
                  <div className={styles.colorInputRow}>
                    <input
                      type="color"
                      className={styles.colorSwatchInput}
                      value={newCorporate.color}
                      onChange={(e) => setNewCorporate({ ...newCorporate, color: e.target.value })}
                    />
                    <input
                      type="text"
                      className={styles.colorHexInput}
                      value={newCorporate.color}
                      onChange={(e) => setNewCorporate({ ...newCorporate, color: e.target.value })}
                      placeholder="#2563EB"
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Badge Background Color</label>
                  <div className={styles.colorInputRow}>
                    <input
                      type="color"
                      className={styles.colorSwatchInput}
                      value={newCorporate.bgColor}
                      onChange={(e) => setNewCorporate({ ...newCorporate, bgColor: e.target.value })}
                    />
                    <input
                      type="text"
                      className={styles.colorHexInput}
                      value={newCorporate.bgColor}
                      onChange={(e) => setNewCorporate({ ...newCorporate, bgColor: e.target.value })}
                      placeholder="#EFF6FF"
                    />
                  </div>
                </div>
              </div>

              {/* Upload Company Icon / Logo */}
              <div className={styles.formGroup}>
                <label>Upload Company Icon / Logo (Optional)</label>
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
                    <span>{isNewCorporateUploading ? 'Uploading...' : (newCorporate.logo ? 'Change Icon' : 'Upload Icon (PNG, SVG, JPG)')}</span>
                    <input
                      type="file"
                      accept="image/*,.png,.jpg,.jpeg,.svg,.webp,.ico"
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
                      onClick={() => setNewCorporate(prev => ({ ...prev, logo: '' }))}
                      title="Remove Icon"
                      disabled={isNewCorporateUploading}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Live Preview Box */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  className={styles.corpBadgePreview}
                  style={{
                    backgroundColor: newCorporate.bgColor || '#EFF6FF',
                    color: newCorporate.color || '#2563EB',
                    width: '60px',
                    height: '40px',
                    margin: 0
                  }}
                  title="Live Preview"
                >
                  {newCorporate.logo ? (
                    <img
                      key={newCorporate.logo}
                      src={newCorporate.logo}
                      alt="Logo preview"
                      className={styles.corpBadgeImg}
                      loading="eager"
                      decoding="async"
                    />
                  ) : (
                    <span>{newCorporate.logoText || 'CORP'}</span>
                  )}
                </div>
                <div>
                  <strong style={{ fontSize: '0.88rem', color: '#0F172A', display: 'block' }}>
                    {newCorporate.name || 'Company Name'}
                  </strong>
                  <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                    {newCorporate.benefit || 'Healthcare Benefit preview'}
                  </span>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsAddCorporateOpen(false)}>Cancel</button>
                <button type="submit" className={styles.submitBtn}>Add Corporate Partner</button>
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
