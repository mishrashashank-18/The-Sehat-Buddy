import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  RotateCcw,
  Save,
  CheckCircle2,
  Sparkles,
  Eye,
  Type,
  Globe
} from 'lucide-react';
import { useData } from '../../context/useData';
import { api } from '../../services/api';
import { DEFAULT_FAVICON, DEFAULT_FAVICON_CIRCULAR } from '../../data/branding';
import { NEW_SEHAT_BUDDY_FAVICON } from '../../data/faviconDataUri';
import logoImg from '../../assets/images/logo.png';
import styles from './BrandingManager.module.css';

// Client-side helper to crop any image into a high-res circular favicon
const makeCircularFavicon = (imageUrl) => {
  return new Promise((resolve) => {
    if (
      !imageUrl ||
      imageUrl.includes('M24.5 17.5') ||
      imageUrl.includes('M9.5 15.5') ||
      imageUrl === NEW_SEHAT_BUDDY_FAVICON ||
      imageUrl === '/favicon.png' ||
      imageUrl === '/favicon.ico' ||
      imageUrl === '/logo.png' ||
      imageUrl.includes('logo.png')
    ) {
      return resolve(NEW_SEHAT_BUDDY_FAVICON);
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 128;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(imageUrl);
        ctx.clearRect(0, 0, size, size);

        // Circle clip
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // White background inside circle
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);

        // Draw image centered preserving aspect ratio
        const aspect = (img.width || 1) / (img.height || 1);
        const maxInner = size * 0.62;
        let drawW = maxInner;
        let drawH = maxInner;
        if (aspect >= 1) {
          drawH = maxInner / aspect;
        } else {
          drawW = maxInner * aspect;
        }
        const drawX = (size - drawW) / 2;
        const drawY = (size - drawH) / 2 + 3;
        ctx.drawImage(img, drawX, drawY, drawW, drawH);

        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(imageUrl);
      }
    };
    img.onerror = () => resolve(NEW_SEHAT_BUDDY_FAVICON);
    img.src = imageUrl;
  });
};

const BrandingManager = ({ showToast }) => {
  const { branding, updateBranding, resetBranding } = useData();

  const [formData, setFormData] = useState({
    siteName: branding?.siteName || 'The Sehat Buddy',
    tagline: branding?.tagline || 'Your Health. Our Priority.',
    logoType: branding?.logoType || 'image', // 'default' | 'image' | 'none'
    logoImage: branding?.logoImage || '/logo.png',
    showLogo: branding?.showLogo !== false,
    showTagline: branding?.showTagline !== false,
    faviconType: branding?.faviconType || 'default', // 'default' | 'custom' | 'logo'
    favicon: branding?.favicon || DEFAULT_FAVICON,
    faviconCircular: branding?.faviconCircular !== false
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);
  const fileInputRef = useRef(null);
  const faviconInputRef = useRef(null);

  useEffect(() => {
    if (branding) {
      setFormData({
        siteName: branding.siteName || 'The Sehat Buddy',
        tagline: branding.tagline || 'Your Health. Our Priority.',
        logoType: branding.logoType || 'image',
        logoImage: branding.logoImage || '/logo.png',
        showLogo: branding.showLogo !== false,
        showTagline: branding.showTagline !== false,
        faviconType: branding.faviconType || 'default',
        favicon: branding.favicon || DEFAULT_FAVICON,
        faviconCircular: branding.faviconCircular !== false
      });
    }
  }, [branding]);

  // Handle local file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    setIsUploading(true);
    try {
      // First create local preview immediately
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Url = reader.result;
        setFormData((prev) => ({
          ...prev,
          logoType: 'image',
          logoImage: base64Url,
          showLogo: true
        }));

        // Try backend upload if available
        try {
          const uploadRes = await api.uploadImage(file, 'logos');
          if (uploadRes && uploadRes.url) {
            setFormData((prev) => ({
              ...prev,
              logoImage: uploadRes.url
            }));
          }
        } catch {
          // Fallback to base64Url if backend upload fails
        }
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Failed to read image file:', err);
      setIsUploading(false);
    }
  };

  // Remove custom logo
  const handleRemoveLogo = () => {
    setFormData((prev) => ({
      ...prev,
      logoImage: '',
      logoType: 'default'
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (showToast) showToast('Custom logo removed. Default icon restored.');
  };

  // Handle local favicon upload
  const handleFaviconUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.name.endsWith('.ico')) {
      alert('Please upload a valid image file (PNG, SVG, ICO, JPG, WebP).');
      return;
    }

    setIsUploadingFavicon(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        let dataUrl = reader.result;
        if (formData.faviconCircular) {
          try {
            dataUrl = await makeCircularFavicon(dataUrl);
          } catch {
            // fallback to original
          }
        }

        setFormData((prev) => ({
          ...prev,
          faviconType: 'custom',
          favicon: dataUrl
        }));

        try {
          const uploadRes = await api.uploadImage(file, 'favicons');
          if (uploadRes && uploadRes.url) {
            let processedUrl = uploadRes.url;
            if (formData.faviconCircular) {
              try {
                processedUrl = await makeCircularFavicon(processedUrl);
              } catch {}
            }
            setFormData((prev) => ({
              ...prev,
              favicon: processedUrl
            }));
          }
        } catch {
          // fallback
        }
        setIsUploadingFavicon(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Failed to read favicon file:', err);
      setIsUploadingFavicon(false);
    }
  };

  // Reset favicon back to default circular icon
  const handleResetFavicon = () => {
    setFormData((prev) => ({
      ...prev,
      faviconType: 'default',
      favicon: DEFAULT_FAVICON_CIRCULAR,
      faviconCircular: true
    }));
    if (faviconInputRef.current) {
      faviconInputRef.current.value = '';
    }
    if (showToast) showToast('Favicon reset to default circular icon.');
  };

  // Sync favicon with brand logo
  const handleUseLogoAsFavicon = async () => {
    if (!formData.logoImage) {
      alert('Please upload or set a custom brand logo first.');
      return;
    }
    let fav = formData.logoImage;
    if (formData.faviconCircular) {
      try {
        fav = await makeCircularFavicon(fav);
      } catch {}
    }
    setFormData((prev) => ({
      ...prev,
      faviconType: 'logo',
      favicon: fav
    }));
    if (showToast) showToast('Favicon updated to match brand logo!');
  };

  // Toggle circular crop for favicon
  const handleToggleFaviconCircular = async (checked) => {
    let newFavicon = formData.favicon;
    if (checked && formData.favicon && !formData.favicon.includes('data:image/svg+xml')) {
      try {
        newFavicon = await makeCircularFavicon(formData.favicon);
      } catch {}
    }
    setFormData((prev) => ({
      ...prev,
      faviconCircular: checked,
      favicon: newFavicon
    }));
  };

  // Save changes
  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.siteName.trim()) {
      alert('Website name cannot be empty.');
      return;
    }

    updateBranding(formData);
    if (showToast) {
      showToast('Brand identity and logo successfully saved!');
    }
  };

  // Reset to original defaults
  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset site name and logo back to defaults?')) {
      resetBranding();
      if (showToast) {
        showToast('Site branding reset to default values.');
      }
    }
  };

  return (
    <div className={styles.managerWrapper}>
      {/* Header */}
      <div className={styles.headerSection}>
        <h1 className={styles.pageTitle}>Site Identity & Logo</h1>
        <p className={styles.pageSubtitle}>
          Customize your platform name, tagline, and brand logo. Changes take effect across the entire website instantly.
        </p>
      </div>

      {/* Live Preview Card */}
      <div className={styles.previewCard}>
        <div className={styles.previewHeader}>
          <span className={styles.previewLabel}>Live Header Preview</span>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Navbar Appearance</span>
        </div>

        <div className={styles.previewContainer}>
          <div className={styles.previewBrand}>
            {formData.showLogo && formData.logoType !== 'none' && (
              <div className={styles.previewLogoIcon}>
                {formData.logoType === 'image' && formData.logoImage ? (
                  <img
                    src={formData.logoImage}
                    alt={formData.siteName}
                    className={styles.previewCustomImg}
                  />
                ) : (
                  <img
                    src={logoImg}
                    alt="Logo"
                    className={styles.previewCustomImg}
                    style={{ height: '36px', objectFit: 'contain' }}
                  />
                )}
              </div>
            )}
            <div className={styles.previewBrandText}>
              <h2>{formData.siteName || 'The Sehat Buddy'}</h2>
              {formData.showTagline && formData.tagline && (
                <p>{formData.tagline}</p>
              )}
            </div>
          </div>

          <div className={styles.previewMockNav}>
            <span>Home</span>
            <span>Find Doctors</span>
            <span>Hospitals</span>
            <div className={styles.previewMockBtn}>Login / Sign Up</div>
          </div>
        </div>

        {/* Browser Tab Preview */}
        <div className={styles.browserPreviewSection}>
          <div className={styles.browserPreviewHeader}>
            <span className={styles.browserPreviewBadge}>
              <Globe size={13} /> Browser Tab Preview
            </span>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Live appearance in user's browser tab & bookmarks
            </span>
          </div>
          <div className={styles.browserWindowMockup}>
            <div className={styles.browserControls}>
              <div className={styles.browserDots}>
                <span className={styles.dotRed}></span>
                <span className={styles.dotYellow}></span>
                <span className={styles.dotGreen}></span>
              </div>
              <div className={styles.browserTab}>
                <img
                  src={formData.favicon || DEFAULT_FAVICON_CIRCULAR}
                  alt="Favicon"
                  className={styles.browserTabFavicon}
                />
                <span className={styles.browserTabTitle}>
                  {formData.siteName || 'The Sehat Buddy'} - Health & Care
                </span>
                <span className={styles.browserTabClose}>&times;</span>
              </div>
            </div>
            <div className={styles.browserAddressBar}>
              <span className={styles.browserAddressLock}>🔒</span>
              <span className={styles.browserAddressText}>https://thesehatbuddy.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className={styles.formCard}>
        {/* 1. Brand Name & Tagline */}
        <div>
          <h3 className={styles.sectionTitle}>
            <Type size={18} color="#2563eb" /> Website Title & Tagline
          </h3>
          <p className={styles.sectionDesc}>
            Control the main brand name displayed in the top navbar, mobile navigation, and footer.
          </p>

          <div className={styles.inputGrid}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Platform Name *</label>
              <input
                type="text"
                required
                value={formData.siteName}
                onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                placeholder="e.g. The Sehat Buddy"
                className={styles.textInput}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Brand Tagline</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="e.g. Your Health. Our Priority."
                className={styles.textInput}
              />
              <label className={styles.toggleRow}>
                <input
                  type="checkbox"
                  checked={formData.showTagline}
                  onChange={(e) => setFormData({ ...formData, showTagline: e.target.checked })}
                  className={styles.toggleCheckbox}
                />
                <span className={styles.toggleText}>Display tagline under site name</span>
              </label>
            </div>
          </div>
        </div>

        {/* 2. Logo Configuration */}
        <div>
          <h3 className={styles.sectionTitle}>
            <ImageIcon size={18} color="#2563eb" /> Brand Logo
          </h3>
          <p className={styles.sectionDesc}>
            Choose between the default medical heart pulse icon, a custom uploaded logo image, or remove the logo for a clean text-only look.
          </p>

          <div className={styles.logoModeGrid}>
            {/* Mode 1: Default Icon */}
            <div
              className={`${styles.logoModeCard} ${formData.logoType === 'default' && formData.showLogo ? styles.logoModeSelected : ''}`}
              onClick={() => setFormData({ ...formData, logoType: 'default', showLogo: true })}
            >
              <div className={styles.modeIcon}>
                <img src={logoImg} alt="Default Logo" style={{ height: '24px', maxWidth: '30px', objectFit: 'contain' }} />
              </div>
              <span className={styles.modeTitle}>Default Icon</span>
              <span className={styles.modeDesc}>Official Sehat Buddy Logo</span>
            </div>

            {/* Mode 2: Custom Upload */}
            <div
              className={`${styles.logoModeCard} ${formData.logoType === 'image' && formData.showLogo ? styles.logoModeSelected : ''}`}
              onClick={() => setFormData({ ...formData, logoType: 'image', showLogo: true })}
            >
              <div className={styles.modeIcon}>
                <Upload size={24} color="#2563EB" />
              </div>
              <span className={styles.modeTitle}>Custom Image</span>
              <span className={styles.modeDesc}>Upload PNG, SVG, or JPG logo</span>
            </div>

            {/* Mode 3: No Logo */}
            <div
              className={`${styles.logoModeCard} ${!formData.showLogo || formData.logoType === 'none' ? styles.logoModeSelected : ''}`}
              onClick={() => setFormData({ ...formData, showLogo: false, logoType: 'none' })}
            >
              <div className={styles.modeIcon}>
                <Type size={24} color="#64748b" />
              </div>
              <span className={styles.modeTitle}>No Logo (Text Only)</span>
              <span className={styles.modeDesc}>Display platform name without any logo icon</span>
            </div>
          </div>

          {/* Custom Logo Upload Area (Active when logoType === 'image') */}
          {formData.logoType === 'image' && (
            <div className={styles.uploadSection} style={{ marginTop: '20px' }}>
              <div
                className={styles.dropArea}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={32} className={styles.uploadIcon} />
                <div>
                  <p className={styles.uploadText}>
                    <strong>Click to browse logo image</strong> or drag and drop
                  </p>
                  <p className={styles.uploadSub}>Recommended: Transparent PNG or SVG (Max 5MB)</p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className={styles.hiddenFileInput}
                />
              </div>

              {isUploading && (
                <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#2563eb', fontWeight: 600 }}>
                  Processing image upload...
                </div>
              )}

              {/* External Image URL Option */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>Or Enter Logo Image URL</label>
                <div className={styles.urlInputRow}>
                  <input
                    type="url"
                    value={formData.logoImage}
                    onChange={(e) => setFormData({ ...formData, logoImage: e.target.value })}
                    placeholder="https://example.com/logo.png"
                    className={styles.textInput}
                    style={{ flex: 1 }}
                  />
                  {formData.logoImage && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className={styles.removeLogoBtn}
                    >
                      <Trash2 size={14} /> Remove Logo
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Favicon Configuration */}
        <div>
          <h3 className={styles.sectionTitle}>
            <Globe size={18} color="#2563eb" /> Browser Favicon (Circle Icon)
          </h3>
          <p className={styles.sectionDesc}>
            Set the icon displayed in browser tabs, bookmarks, and mobile shortcuts. You can use the official circular medical icon, upload your own custom icon, or sync directly from your brand logo.
          </p>

          <div className={styles.logoModeGrid}>
            {/* Mode 1: Default Circular Icon */}
            <div
              className={`${styles.logoModeCard} ${formData.faviconType === 'default' ? styles.logoModeSelected : ''}`}
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  faviconType: 'default',
                  favicon: DEFAULT_FAVICON_CIRCULAR,
                  faviconCircular: true
                }));
              }}
            >
              <div className={styles.modeIcon}>
                <img
                  src={DEFAULT_FAVICON_CIRCULAR}
                  alt="Default circular favicon"
                  style={{ width: 28, height: 28, borderRadius: '50%' }}
                />
              </div>
              <span className={styles.modeTitle}>Default Circular Icon</span>
              <span className={styles.modeDesc}>Official blue circular health pulse icon</span>
            </div>

            {/* Mode 2: Custom Upload */}
            <div
              className={`${styles.logoModeCard} ${formData.faviconType === 'custom' ? styles.logoModeSelected : ''}`}
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  faviconType: 'custom'
                }));
              }}
            >
              <div className={styles.modeIcon}>
                <Upload size={24} color="#2563EB" />
              </div>
              <span className={styles.modeTitle}>Custom Upload</span>
              <span className={styles.modeDesc}>Upload PNG, ICO, SVG, or JPG favicon</span>
            </div>

            {/* Mode 3: Match Brand Logo */}
            <div
              className={`${styles.logoModeCard} ${formData.faviconType === 'logo' ? styles.logoModeSelected : ''}`}
              onClick={handleUseLogoAsFavicon}
            >
              <div className={styles.modeIcon}>
                <Sparkles size={24} color="#2563EB" />
              </div>
              <span className={styles.modeTitle}>Match Brand Logo</span>
              <span className={styles.modeDesc}>Auto-crop brand logo into circular favicon</span>
            </div>
          </div>

          {/* Favicon Settings & Upload Box */}
          <div className={styles.faviconDetailsCard}>
            <div className={styles.faviconRow}>
              <div className={styles.faviconPreviewBadge}>
                <img
                  src={formData.favicon || DEFAULT_FAVICON_CIRCULAR}
                  alt="Active Favicon"
                  className={styles.faviconActiveImg}
                />
                <span className={styles.faviconSizeText}>Live Favicon</span>
              </div>

              <div className={styles.faviconControls}>
                <label className={styles.toggleRow}>
                  <input
                    type="checkbox"
                    checked={formData.faviconCircular}
                    onChange={(e) => handleToggleFaviconCircular(e.target.checked)}
                    className={styles.toggleCheckbox}
                  />
                  <div>
                    <span className={styles.toggleText} style={{ fontWeight: 700, color: '#0f172a' }}>
                      Auto-crop Favicon as Circle (Recommended)
                    </span>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                      Rounds edges to give a clean circular appearance in browser tabs and bookmarks.
                    </p>
                  </div>
                </label>

                <div className={styles.faviconButtonsRow}>
                  <button
                    type="button"
                    onClick={() => faviconInputRef.current?.click()}
                    className={styles.uploadFaviconBtn}
                  >
                    <Upload size={15} /> Upload Favicon File
                  </button>
                  <input
                    type="file"
                    ref={faviconInputRef}
                    onChange={handleFaviconUpload}
                    accept="image/png,image/x-icon,image/svg+xml,image/jpeg,image/webp,.ico"
                    className={styles.hiddenFileInput}
                  />

                  {formData.favicon !== DEFAULT_FAVICON_CIRCULAR && (
                    <button
                      type="button"
                      onClick={handleResetFavicon}
                      className={styles.removeLogoBtn}
                    >
                      <RotateCcw size={14} /> Reset to Default Favicon
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* External Favicon URL Input */}
            <div className={styles.inputGroup} style={{ marginTop: '16px' }}>
              <label className={styles.label}>Or Provide Custom Favicon Image URL</label>
              <input
                type="url"
                value={formData.favicon?.startsWith('data:') ? '' : formData.favicon}
                onChange={async (e) => {
                  const url = e.target.value;
                  let processed = url;
                  if (formData.faviconCircular && url) {
                    try {
                      processed = await makeCircularFavicon(url);
                    } catch {}
                  }
                  setFormData((prev) => ({
                    ...prev,
                    faviconType: 'custom',
                    favicon: processed || DEFAULT_FAVICON_CIRCULAR
                  }));
                }}
                placeholder="https://example.com/favicon.png"
                className={styles.textInput}
              />
            </div>
            {isUploadingFavicon && (
              <div style={{ fontSize: '0.82rem', color: '#2563eb', fontWeight: 600, marginTop: '8px' }}>
                Processing favicon upload...
              </div>
            )}
          </div>
        </div>

        {/* Action Bar */}
        <div className={styles.actionBar}>
          <button
            type="button"
            onClick={handleReset}
            className={styles.resetBtn}
            title="Reset site name and logo back to defaults"
          >
            <RotateCcw size={16} /> Reset Defaults
          </button>

          <button
            type="submit"
            className={styles.saveBtn}
          >
            <Save size={18} /> Save Branding & Logo
          </button>
        </div>
      </form>
    </div>
  );
};

export default BrandingManager;
