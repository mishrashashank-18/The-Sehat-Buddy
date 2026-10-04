import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle,
  RotateCcw,
  Plus,
  Trash2,
  FileText,
  HelpCircle,
  Upload,
  Layers,
  ShieldCheck,
  X
} from 'lucide-react';
import { useData } from '../../context/useData';
import heroFamily from '../../assets/images/hero-family.jpg';
import styles from './FrontPageEditor.module.css';

const PRESET_HERO_IMAGES = [
  { name: 'Happy Family', url: heroFamily },
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

const FrontPageEditor = ({ showToast }) => {
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
    resetFrontPageDefaults
  } = useData();

  // Active sub-tab: 'hero' | 'services' | 'why' | 'articles'
  const [subTab, setSubTab] = useState('hero');

  // Hero form local state
  const [heroForm, setHeroForm] = useState(() => ({
    badge: heroContent?.badge || '',
    titleLine1: heroContent?.titleLine1 || '',
    titleLine2: heroContent?.titleLine2 || '',
    titleHighlight: heroContent?.titleHighlight || '',
    description: heroContent?.description || '',
    heroImage: heroContent?.heroImage || heroFamily,
    stat1Label: heroContent?.stats?.[0]?.label || 'Trusted by',
    stat1Value: heroContent?.stats?.[0]?.value || '10M+ Users',
    stat2Label: heroContent?.stats?.[1]?.label || 'Expert Doctors',
    stat2Value: heroContent?.stats?.[1]?.value || '25,000+',
    stat3Label: heroContent?.stats?.[2]?.label || 'Quick',
    stat3Value: heroContent?.stats?.[2]?.value || 'Appointments',
    whyChooseTitle: heroContent?.whyChooseTitle || 'Why Choose The Sehat Buddy?',
    newsletterTitle: heroContent?.newsletterTitle || 'Stay updated with\nhealth tips & offers',
    newsletterSubtitle: heroContent?.newsletterSubtitle || 'Subscribe to our newsletter'
  }));

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
    image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=600&q=80'
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
      newsletterTitle: heroForm.newsletterTitle,
      newsletterSubtitle: heroForm.newsletterSubtitle
    });
    showToast('Hero section & front page headers updated successfully!');
  };

  const handleHeroFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setHeroForm(prev => ({ ...prev, heroImage: reader.result }));
      };
      reader.readAsDataURL(file);
    }
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
      image: newArticle.image
    });
    setIsAddArticleOpen(false);
    setNewArticle({
      title: '',
      category: 'Heart Health',
      readTime: '5 min read',
      categoryColor: '#E0457B',
      categoryBg: '#FDE8EF',
      image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=600&q=80'
    });
    showToast('New health article added to front page!');
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
          onClick={() => setSubTab('hero')}
        >
          <Sparkles size={16} />
          <span>Hero & Trust Metrics</span>
        </button>
        <button
          className={`${styles.subTabBtn} ${subTab === 'services' ? styles.subTabActive : ''}`}
          onClick={() => setSubTab('services')}
        >
          <Layers size={16} />
          <span>Explore Services ({services?.length || 0})</span>
        </button>
        <button
          className={`${styles.subTabBtn} ${subTab === 'why' ? styles.subTabActive : ''}`}
          onClick={() => setSubTab('why')}
        >
          <HelpCircle size={16} />
          <span>Why Choose Us ({features?.length || 0})</span>
        </button>
        <button
          className={`${styles.subTabBtn} ${subTab === 'articles' ? styles.subTabActive : ''}`}
          onClick={() => setSubTab('articles')}
        >
          <FileText size={16} />
          <span>Articles & Newsletter ({articles?.length || 0})</span>
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
                  onChange={(e) => setHeroForm({ ...heroForm, badge: e.target.value })}
                  placeholder="e.g. Your Health Partner, Every Step of the Way"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Title Line 1</label>
                <input
                  type="text"
                  value={heroForm.titleLine1}
                  onChange={(e) => setHeroForm({ ...heroForm, titleLine1: e.target.value })}
                  placeholder="e.g. Find Doctors, Book"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Title Line 2</label>
                <input
                  type="text"
                  value={heroForm.titleLine2}
                  onChange={(e) => setHeroForm({ ...heroForm, titleLine2: e.target.value })}
                  placeholder="e.g. Appointments & Take"
                />
              </div>

              <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                <label>Title Highlighted Word(s) (Teal Highlight)</label>
                <input
                  type="text"
                  value={heroForm.titleHighlight}
                  onChange={(e) => setHeroForm({ ...heroForm, titleHighlight: e.target.value })}
                  placeholder="e.g. Care of Your Health"
                />
              </div>

              <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                <label>Hero Description Paragraph</label>
                <textarea
                  rows={3}
                  value={heroForm.description}
                  onChange={(e) => setHeroForm({ ...heroForm, description: e.target.value })}
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
                    onChange={(e) => setHeroForm({ ...heroForm, stat1Label: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Value</label>
                  <input
                    type="text"
                    value={heroForm.stat1Value}
                    onChange={(e) => setHeroForm({ ...heroForm, stat1Value: e.target.value })}
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
                    onChange={(e) => setHeroForm({ ...heroForm, stat2Label: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Value</label>
                  <input
                    type="text"
                    value={heroForm.stat2Value}
                    onChange={(e) => setHeroForm({ ...heroForm, stat2Value: e.target.value })}
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
                    onChange={(e) => setHeroForm({ ...heroForm, stat3Label: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Value</label>
                  <input
                    type="text"
                    value={heroForm.stat3Value}
                    onChange={(e) => setHeroForm({ ...heroForm, stat3Value: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Hero Image Selection */}
            <div className={styles.subSectionTitle}>Hero Family Photo</div>
            <div className={styles.imageSelectorGrid}>
              {PRESET_HERO_IMAGES.map((img, idx) => (
                <div
                  key={idx}
                  className={`${styles.imagePreset} ${heroForm.heroImage === img.url ? styles.imagePresetActive : ''}`}
                  onClick={() => setHeroForm({ ...heroForm, heroImage: img.url })}
                >
                  <img src={img.url} alt={img.name} />
                  <span>{img.name}</span>
                </div>
              ))}
              <label className={styles.customUploadBox}>
                <Upload size={20} />
                <span>Upload custom image</span>
                <input type="file" accept="image/*" onChange={handleHeroFileUpload} style={{ display: 'none' }} />
              </label>
            </div>

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
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Subtitle / Description</label>
                    <input
                      type="text"
                      value={svc.subtitle}
                      onChange={(e) => updateService(svc.id, { subtitle: e.target.value })}
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
          <div className={styles.formCard} style={{ marginBottom: '16px' }}>
            <div className={styles.formGroup}>
              <label>Section Heading Title</label>
              <input
                type="text"
                value={heroForm.whyChooseTitle}
                onChange={(e) => {
                  setHeroForm({ ...heroForm, whyChooseTitle: e.target.value });
                  updateHeroContent({ whyChooseTitle: e.target.value });
                }}
                placeholder="e.g. Why Choose The Sehat Buddy?"
              />
            </div>
          </div>

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
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Description</label>
                    <input
                      type="text"
                      value={feat.description}
                      onChange={(e) => updateFeature(feat.id, { description: e.target.value })}
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
                    />
                  </div>

                  <div className={styles.formGrid2}>
                    <div className={styles.formGroup}>
                      <label>Category</label>
                      <input
                        type="text"
                        value={art.category}
                        onChange={(e) => updateArticle(art.id, { category: e.target.value })}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Read Time</label>
                      <input
                        type="text"
                        value={art.readTime}
                        onChange={(e) => updateArticle(art.id, { readTime: e.target.value })}
                      />
                    </div>
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
          <div className={styles.formCard} style={{ marginTop: '24px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '1.05rem' }}>Newsletter Card Content</h4>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Newsletter Title</label>
                <textarea
                  rows={2}
                  value={heroForm.newsletterTitle}
                  onChange={(e) => {
                    setHeroForm({ ...heroForm, newsletterTitle: e.target.value });
                    updateHeroContent({ newsletterTitle: e.target.value });
                  }}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Newsletter Subtitle</label>
                <input
                  type="text"
                  value={heroForm.newsletterSubtitle}
                  onChange={(e) => {
                    setHeroForm({ ...heroForm, newsletterSubtitle: e.target.value });
                    updateHeroContent({ newsletterSubtitle: e.target.value });
                  }}
                />
              </div>
            </div>
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
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsAddArticleOpen(false)}>Cancel</button>
                <button type="submit" className={styles.submitBtn}>Add Article</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FrontPageEditor;
