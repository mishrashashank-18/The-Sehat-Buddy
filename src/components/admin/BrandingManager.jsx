import React, { useState, useEffect, useRef } from 'react';
import {
  HeartPulse,
  Upload,
  Image as ImageIcon,
  Trash2,
  RotateCcw,
  Save,
  CheckCircle2,
  Sparkles,
  Eye,
  Type
} from 'lucide-react';
import { useData } from '../../context/useData';
import { api } from '../../services/api';
import styles from './BrandingManager.module.css';

const BrandingManager = ({ showToast }) => {
  const { branding, updateBranding, resetBranding } = useData();

  const [formData, setFormData] = useState({
    siteName: branding?.siteName || 'The Sehat Buddy',
    tagline: branding?.tagline || 'Your Health. Our Priority.',
    logoType: branding?.logoType || 'default', // 'default' | 'image' | 'none'
    logoImage: branding?.logoImage || '',
    showLogo: branding?.showLogo !== false,
    showTagline: branding?.showTagline !== false
  });

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (branding) {
      setFormData({
        siteName: branding.siteName || 'The Sehat Buddy',
        tagline: branding.tagline || 'Your Health. Our Priority.',
        logoType: branding.logoType || 'default',
        logoImage: branding.logoImage || '',
        showLogo: branding.showLogo !== false,
        showTagline: branding.showTagline !== false
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
                  <HeartPulse size={36} color="#2563EB" strokeWidth={2.4} />
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
                <HeartPulse size={24} color="#2563EB" />
              </div>
              <span className={styles.modeTitle}>Default Icon</span>
              <span className={styles.modeDesc}>Official Heartbeat Medical Pulse Icon</span>
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
