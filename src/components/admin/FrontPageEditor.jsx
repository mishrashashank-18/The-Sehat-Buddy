import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle,
  RotateCcw,
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
  ExternalLink
} from 'lucide-react';
import { useData } from '../../context/useData';
import { api } from '../../services/api';
import heroFamily from '../../assets/images/hero-family.jpg';
import styles from './FrontPageEditor.module.css';

const PRESET_HERO_IMAGES = [
  { name: 'Happy Family at Hospital', url: heroFamily },
  { name: 'Doctor Consultation', url: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80' },
  { name: 'Medical Team', url: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=800&q=80' }
];

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
    whyChooseVideoUrl: heroContent?.whyChooseVideoUrl ?? 'https://www.youtube.com/watch?v=zCCD52Pty4A',
    whyChooseVideoText: heroContent?.whyChooseVideoText ?? 'Watch how\nSehat Buddy\nworks for you',
    whyChooseVideoAutoplay: heroContent?.whyChooseVideoAutoplay !== false,
    newsletterTitle: heroContent?.newsletterTitle ?? 'Stay updated with\nhealth tips & offers',
    newsletterSubtitle: heroContent?.newsletterSubtitle ?? 'Subscribe to our newsletter',
    corporateBadge: heroContent?.corporateBadge ?? 'ENTERPRISE HEALTHCARE NETWORK',
    corporateTitle: heroContent?.corporateTitle ?? 'Corporate Tie-ups & Partners',
    corporateSubtitle: heroContent?.corporateSubtitle ?? 'Trusted by leading enterprises for priority admissions, comprehensive annual checkups, and cashless corporate benefits.',
    corporateStat: heroContent?.corporateStat ?? '2.5M+ Corporate Lives Covered'
  }));

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
        whyChooseVideoUrl: heroContent?.whyChooseVideoUrl ?? 'https://www.youtube.com/watch?v=zCCD52Pty4A',
        whyChooseVideoText: heroContent?.whyChooseVideoText ?? 'Watch how\nSehat Buddy\nworks for you',
        whyChooseVideoAutoplay: heroContent?.whyChooseVideoAutoplay !== false,
        newsletterTitle: heroContent?.newsletterTitle ?? 'Stay updated with\nhealth tips & offers',
        newsletterSubtitle: heroContent?.newsletterSubtitle ?? 'Subscribe to our newsletter',
        corporateBadge: heroContent?.corporateBadge ?? 'ENTERPRISE HEALTHCARE NETWORK',
        corporateTitle: heroContent?.corporateTitle ?? 'Corporate Tie-ups & Partners',
        corporateSubtitle: heroContent?.corporateSubtitle ?? 'Trusted by leading enterprises for priority admissions, comprehensive annual checkups, and cashless corporate benefits.',
        corporateStat: heroContent?.corporateStat ?? '2.5M+ Corporate Lives Covered'
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
    link: ''
  });

  const [isPreviewVideoOpen, setIsPreviewVideoOpen] = useState(false);
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [isHeroPhotoUploading, setIsHeroPhotoUploading] = useState(false);
  const [customPhotoUrlInput, setCustomPhotoUrlInput] = useState('');
  const [customHeroImage, setCustomHeroImage] = useState(() => {
    return localStorage.getItem('sehat_custom_hero_image') || '';
  });
  const videoFileInputRef = useRef(null);
  const heroFileInputRef = useRef(null);

  // Sync customHeroImage if heroContent has a custom (non-preset) image
  React.useEffect(() => {
    if (heroContent?.heroImage) {
      const isPreset = PRESET_HERO_IMAGES.some(p => 
        p.url === heroContent.heroImage || 
        (p.name === 'Happy Family at Hospital' && (heroContent.heroImage?.includes('hero-family') || heroContent.heroImage?.includes('i3g2e9ptcdydfnfeqf9c')))
      );
      if (!isPreset && !heroContent.heroImage.startsWith('data:image/')) {
        setCustomHeroImage(heroContent.heroImage);
      }
    }
  }, [heroContent?.heroImage]);

  // Upload Video to Cloudinary
  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 250MB
    const maxSizeBytes = 250 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      showToast('Video file exceeds maximum limit of 250MB. Please choose a smaller video.');
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
  const [newCorporate, setNewCorporate] = useState({
    name: '',
    shortName: '',
    category: 'IT & Consulting',
    benefit: '',
    color: '#0054A6',
    bgColor: '#EFF6FF',
    logoText: '',
    employeesCovered: '100,000+'
  });

  // Save Hero Form
  const handleSaveHero = (e) => {
    e.preventDefault();
    updateHeroContent({
      badge: heroForm.badge,
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

  // Add Service
  const handleCreateService = (e) => {
    e.preventDefault();
    if (!newService.title.trim()) return;
    addService({
      title: newService.title.trim(),
      subtitle: newService.subtitle.trim() || 'Expert care service',
      iconPath: '/src/assets/images/icons/stethoscope.png',
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
      link: newArticle.link?.trim() || ''
    });
    setIsAddArticleOpen(false);
    setNewArticle({
      title: '',
      category: 'Heart Health',
      readTime: '5 min read',
      categoryColor: '#E0457B',
      categoryBg: '#FDE8EF',
      image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=600&q=80',
      link: ''
    });
    showToast('New health article added to front page!');
  };

  // Save Corporate Header
  const handleSaveCorporateHeader = (e) => {
    if (e) e.preventDefault();
    const current = heroFormRef.current || heroForm;
    isHeroDirtyRef.current = false;
    updateHeroContent({
      corporateBadge: current.corporateBadge ?? '',
      corporateTitle: current.corporateTitle ?? '',
      corporateSubtitle: current.corporateSubtitle ?? '',
      corporateStat: current.corporateStat ?? ''
    });
    showToast('Corporate Tie-ups header & metrics updated successfully!');
  };

  // Add Corporate Partner
  const handleCreateCorporate = (e) => {
    e.preventDefault();
    if (!newCorporate.name.trim()) return;
    const short = newCorporate.shortName.trim() || newCorporate.name.split(' ')[0];
    addCorporateTieup({
      name: newCorporate.name.trim(),
      shortName: short,
      logoText: (newCorporate.logoText.trim() || short).slice(0, 10),
      category: newCorporate.category.trim() || 'Enterprise Partner',
      benefit: newCorporate.benefit.trim() || 'Comprehensive healthcare coverage and priority care',
      employeesCovered: newCorporate.employeesCovered.trim() || '50,000+',
      color: newCorporate.color || '#2563EB',
      bgColor: newCorporate.bgColor || '#EFF6FF'
    });
    setIsAddCorporateOpen(false);
    setNewCorporate({
      name: '',
      shortName: '',
      category: 'IT & Consulting',
      benefit: '',
      color: '#0054A6',
      bgColor: '#EFF6FF',
      logoText: '',
      employeesCovered: '100,000+'
    });
    showToast(`Partner "${newCorporate.name.trim()}" added to Corporate Tie-ups!`);
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
        <button
          className={styles.resetBtn}
          onClick={() => {
            resetFrontPageDefaults();
            showToast('Front page mock data reset to initial defaults.');
          }}
          title="Restore original sample headlines and cards"
        >
          <RotateCcw size={15} /> Reset Front Page Defaults
        </button>
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
              <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                <label>Top Badge Text</label>
                <input
                  type="text"
                  value={heroForm.badge}
                  onChange={(e) => handleHeroFieldChange('badge', e.target.value)}
                  placeholder="e.g. Your Health Partner, Every Step of the Way"
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
              {PRESET_HERO_IMAGES.map((img, idx) => {
                const active = isPresetActive(img.url);
                return (
                  <div
                    key={idx}
                    className={`${styles.imagePreset} ${active ? styles.imagePresetActive : ''}`}
                    onClick={() => handleSelectHeroImage(img.url, img.name)}
                    title={`Set hero image to ${img.name}`}
                  >
                    <img src={img.url} alt={img.name} />
                    <span>{img.name}</span>
                  </div>
                );
              })}

              {/* Custom photo card if current active photo is not in presets */}
              {heroForm.heroImage && !PRESET_HERO_IMAGES.some(p => isPresetActive(p.url, heroForm.heroImage)) && (
                <div
                  className={`${styles.imagePreset} ${styles.imagePresetActive}`}
                  title="Currently active custom photo"
                >
                  <img src={heroForm.heroImage} alt="Custom Hero" />
                  <span>✓ Custom Active</span>
                </div>
              )}

              {/* Stored custom photo if another preset is currently selected */}
              {customHeroImage && PRESET_HERO_IMAGES.some(p => isPresetActive(p.url, heroForm.heroImage)) && (
                <div
                  className={styles.imagePreset}
                  onClick={() => handleSelectHeroImage(customHeroImage, 'Custom Photo')}
                  title="Switch back to your custom uploaded photo"
                >
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

            {/* Live Hero Preview Banner */}
            {heroForm.heroImage && (
              <div className={styles.currentHeroPreviewBanner}>
                <img
                  src={heroForm.heroImage}
                  alt="Live Hero Preview"
                  className={styles.heroPreviewThumb}
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80';
                  }}
                />
                <div className={styles.heroPreviewInfo}>
                  <span className={styles.heroPreviewTag}>Live on Homepage</span>
                  <span className={styles.heroPreviewUrl}>{heroForm.heroImage}</span>
                </div>
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
                    <div className={styles.videoUploadTitle}>Upload Custom Video to Cloudinary</div>
                    <p className={styles.videoUploadDesc}>
                      Upload direct video (.mp4, .webm, .mov up to 250MB). Streamed securely to Cloudinary CDN and automatically saved to the website.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    ref={videoFileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/ogg,video/quicktime,video/*"
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
                    <span>Uploading and processing in Cloudinary CDN...</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{videoUploadProgress}%</span>
                  </div>
                  <div className={styles.videoProgressBar}>
                    <div className={styles.videoProgressFill} style={{ width: `${videoUploadProgress}%` }}></div>
                  </div>
                </div>
              )}

              {/* Status indicator if currently pointing to Cloudinary */}
              {heroForm.whyChooseVideoUrl?.includes('cloudinary.com') && !isVideoUploading && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={styles.cloudinaryBadge}>
                      <CheckCircle size={13} /> Cloudinary Video Active
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#475569', wordBreak: 'break-all' }}>
                      {heroForm.whyChooseVideoUrl.split('/').pop()}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const defaultYt = 'https://www.youtube.com/watch?v=zCCD52Pty4A';
                      setHeroForm(prev => ({ ...prev, whyChooseVideoUrl: defaultYt }));
                      updateHeroContent({ whyChooseVideoUrl: defaultYt });
                      showToast('Reverted to default YouTube explainer video.');
                    }}
                    style={{ background: 'transparent', border: 'none', color: '#64748B', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Reset to Default YouTube
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveWhyVideo();
                    }
                  }}
                  placeholder="https://www.youtube.com/watch?v=... or https://res.cloudinary.com/..."
                />
                <span style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '4px', display: 'block' }}>
                  Upload a video to Cloudinary using the button above, or paste any YouTube URL / external MP4 link. Press Enter to save.
                </span>
              </div>

              <div className={styles.formGroup}>
                <label>Play Button Text / Label</label>
                <textarea
                  rows={2}
                  value={heroForm.whyChooseVideoText}
                  onChange={(e) => handleHeroFieldChange('whyChooseVideoText', e.target.value)}
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
                    onChange={(e) => handleHeroFieldChange('whyChooseVideoAutoplay', e.target.checked)}
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
                  value={heroForm.corporateBadge ?? ''}
                  onChange={(e) => handleHeroFieldChange('corporateBadge', e.target.value)}
                  onBlur={(e) => handleHeroFieldBlur('corporateBadge', e.target.value)}
                  placeholder="e.g. ENTERPRISE HEALTHCARE NETWORK"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Covered Lives Stat Pill</label>
                <input
                  type="text"
                  value={heroForm.corporateStat ?? ''}
                  onChange={(e) => handleHeroFieldChange('corporateStat', e.target.value)}
                  onBlur={(e) => handleHeroFieldBlur('corporateStat', e.target.value)}
                  placeholder="e.g. 2.5M+ Corporate Lives Covered"
                />
              </div>

              <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                <label>Section Heading Title</label>
                <input
                  type="text"
                  value={heroForm.corporateTitle ?? ''}
                  onChange={(e) => handleHeroFieldChange('corporateTitle', e.target.value)}
                  onBlur={(e) => handleHeroFieldBlur('corporateTitle', e.target.value)}
                  placeholder="e.g. Corporate Tie-ups & Partners"
                />
              </div>

              <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                <label>Section Subtitle</label>
                <textarea
                  rows={2}
                  value={heroForm.corporateSubtitle ?? ''}
                  onChange={(e) => handleHeroFieldChange('corporateSubtitle', e.target.value)}
                  onBlur={(e) => handleHeroFieldBlur('corporateSubtitle', e.target.value)}
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
            <button
              type="button"
              className={styles.addBtn}
              onClick={() => setIsAddCorporateOpen(true)}
            >
              <Plus size={16} /> Add Corporate Partner
            </button>
          </div>

          {/* Partners List */}
          <div className={styles.itemsList}>
            {corporateTieups?.map((corp) => (
              <div key={corp.id} className={styles.itemRowCard} style={{ alignItems: 'flex-start' }}>
                {/* Visual Preview Badge */}
                <div
                  style={{
                    width: '64px',
                    height: '42px',
                    borderRadius: '8px',
                    backgroundColor: corp.bgColor || '#EFF6FF',
                    color: corp.color || '#2563EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    flexShrink: 0,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    marginTop: '4px'
                  }}
                  title="Badge Live Preview"
                >
                  {corp.logoText || corp.shortName || 'CORP'}
                </div>

                <div className={styles.itemInputGroup} style={{ gridTemplateColumns: '1.4fr 1fr 1fr' }}>
                  <div className={styles.formGroup}>
                    <label>Company Name</label>
                    <input
                      type="text"
                      value={corp.name || ''}
                      onChange={(e) => updateCorporateTieup(corp.id, { name: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          updateCorporateTieup(corp.id, { name: corp.name });
                          showToast(`Corporate partner "${corp.name || 'entry'}" saved!`);
                        }
                      }}
                      placeholder="e.g. Tata Consultancy Services"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Logo Text (Short Code)</label>
                    <input
                      type="text"
                      value={corp.logoText || ''}
                      onChange={(e) => updateCorporateTieup(corp.id, { logoText: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          updateCorporateTieup(corp.id, { logoText: corp.logoText });
                          showToast(`Corporate partner "${corp.name || 'entry'}" saved!`);
                        }
                      }}
                      placeholder="e.g. TCS"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Industry / Category</label>
                    <input
                      type="text"
                      value={corp.category || ''}
                      onChange={(e) => updateCorporateTieup(corp.id, { category: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          updateCorporateTieup(corp.id, { category: corp.category });
                          showToast(`Corporate partner "${corp.name || 'entry'}" saved!`);
                        }
                      }}
                      placeholder="e.g. IT & Consulting"
                    />
                  </div>

                  <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                    <label>Benefit Offered</label>
                    <input
                      type="text"
                      value={corp.benefit || ''}
                      onChange={(e) => updateCorporateTieup(corp.id, { benefit: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          updateCorporateTieup(corp.id, { benefit: corp.benefit });
                          showToast(`Corporate partner "${corp.name || 'entry'}" saved!`);
                        }
                      }}
                      placeholder="e.g. Comprehensive Employee Wellness & Health Checks"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Employees Covered</label>
                    <input
                      type="text"
                      value={corp.employeesCovered || ''}
                      onChange={(e) => updateCorporateTieup(corp.id, { employeesCovered: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          updateCorporateTieup(corp.id, { employeesCovered: corp.employeesCovered });
                          showToast(`Corporate partner "${corp.name || 'entry'}" saved!`);
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
                    <input
                      type="color"
                      value={corp.color || '#2563EB'}
                      onChange={(e) => updateCorporateTieup(corp.id, { color: e.target.value })}
                      title="Logo text color"
                    />
                  </div>
                  <div className={styles.colorInputWrap}>
                    <label>Badge BG</label>
                    <input
                      type="color"
                      value={corp.bgColor || '#EFF6FF'}
                      onChange={(e) => updateCorporateTieup(corp.id, { bgColor: e.target.value })}
                      title="Badge background color"
                    />
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  type="button"
                  className={styles.deleteRowBtn}
                  onClick={() => {
                    deleteCorporateTieup(corp.id);
                    showToast(`Partner "${corp.name}" removed.`);
                  }}
                  title="Delete corporate partner"
                  style={{ marginTop: '4px' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
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
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
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
                  <label>Logo Badge Text (Short Acronym) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TCS"
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="color"
                      value={newCorporate.color}
                      onChange={(e) => setNewCorporate({ ...newCorporate, color: e.target.value })}
                      style={{ width: '40px', height: '36px', padding: 0 }}
                    />
                    <input
                      type="text"
                      value={newCorporate.color}
                      onChange={(e) => setNewCorporate({ ...newCorporate, color: e.target.value })}
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Badge Background Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="color"
                      value={newCorporate.bgColor}
                      onChange={(e) => setNewCorporate({ ...newCorporate, bgColor: e.target.value })}
                      style={{ width: '40px', height: '36px', padding: 0 }}
                    />
                    <input
                      type="text"
                      value={newCorporate.bgColor}
                      onChange={(e) => setNewCorporate({ ...newCorporate, bgColor: e.target.value })}
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
              </div>

              {/* Live Preview Box */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '60px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: newCorporate.bgColor,
                    color: newCorporate.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    flexShrink: 0,
                    boxShadow: '0 2px 5px rgba(0,0,0,0.06)'
                  }}
                >
                  {newCorporate.logoText || 'CORP'}
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
