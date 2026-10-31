import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  FileText,
  Building2,
  Upload,
  Eye,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileUp,
  Lock,
  Calendar,
  Image as ImageIcon
} from 'lucide-react';
import { useData } from '../../context/useData';
import { api } from '../../services/api';
import PolicyViewerModal from '../common/PolicyViewerModal';
import styles from './LegalPoliciesManager.module.css';

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 Megabytes

const LegalPoliciesManager = ({ showToast }) => {
  const { legalPolicies, updateLegalPolicies } = useData();

  const [previewType, setPreviewType] = useState(null); // 'privacy' | 'terms' | 'about' | null

  // Uploading states
  const [uploadingPrivacy, setUploadingPrivacy] = useState(false);
  const [privacyProgress, setPrivacyProgress] = useState(0);

  const [uploadingTerms, setUploadingTerms] = useState(false);
  const [termsProgress, setTermsProgress] = useState(0);

  const [uploadingAbout, setUploadingAbout] = useState(false);
  const [aboutProgress, setAboutProgress] = useState(0);

  // Drag states
  const [dragOverPrivacy, setDragOverPrivacy] = useState(false);
  const [dragOverTerms, setDragOverTerms] = useState(false);
  const [dragOverAbout, setDragOverAbout] = useState(false);

  const privacyInputRef = useRef(null);
  const termsInputRef = useRef(null);
  const aboutInputRef = useRef(null);

  const handleFileSelected = async (file, type) => {
    if (!file) return;

    // 1. Strict PDF or Image type check
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = (file.type && file.type.startsWith('image/')) || file.name.match(/\.(png|jpg|jpeg|webp|svg)$/i);

    if (!isPdf && !isImage) {
      showToast && showToast('Invalid format. Only official PDF (.pdf) documents and photos (PNG, JPG, WEBP) up to 25MB are accepted.', 'error');
      return;
    }

    // 2. Strict 25MB limit check
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const actualMb = (file.size / (1024 * 1024)).toFixed(1);
      showToast && showToast(`File size (${actualMb} MB) exceeds maximum allowed limit of 25 MB.`, 'error');
      return;
    }

    const isPrivacy = type === 'privacy';
    const isAbout = type === 'about';
    const label = isAbout ? 'About Us' : isPrivacy ? 'Privacy Policy' : 'Terms & Conditions';
    const policyKey = isAbout ? 'aboutUs' : isPrivacy ? 'privacyPolicy' : 'termsAndConditions';

    const setUploading = isAbout ? setUploadingAbout : isPrivacy ? setUploadingPrivacy : setUploadingTerms;
    const setProgress = isAbout ? setAboutProgress : isPrivacy ? setPrivacyProgress : setTermsProgress;

    try {
      setUploading(true);
      setProgress(0);

      const res = await api.uploadPolicyPdf(file, type, (pct) => {
        setProgress(pct);
      });

      if (!res || !res.success || !res.url) {
        throw new Error(res?.message || `Failed to upload ${label}`);
      }

      const oldUrl = legalPolicies?.[policyKey]?.url;
      const oldPublicId = legalPolicies?.[policyKey]?.publicId;

      const updatedMeta = {
        url: res.url,
        publicId: res.public_id || null,
        fileName: res.name || file.name,
        fileSize: res.size || file.size,
        fileSizeFormatted: res.sizeFormatted || `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        fileType: res.fileType || (isImage ? 'image' : 'pdf'),
        updatedAt: res.updatedAt || new Date().toISOString()
      };

      await updateLegalPolicies({
        [policyKey]: updatedMeta
      });

      // Clean up previous replaced file from server storage and Cloudinary
      if (oldPublicId) {
        api.deleteMedia(oldPublicId, 'image').catch(() => {});
        api.deleteMedia(oldPublicId, 'raw').catch(() => {});
      }
      if (oldUrl && oldUrl !== res.url) {
        api.deleteMedia(oldUrl).catch(() => {});
      }

      showToast && showToast(`${label} (${updatedMeta.fileSizeFormatted}) uploaded successfully!`, 'success');
    } catch (err) {
      console.error(`Upload error for ${label}:`, err);
      showToast && showToast(err.message || `Failed to upload ${label}.`, 'error');
    } finally {
      setUploading(false);
      setProgress(0);
      if (privacyInputRef.current) privacyInputRef.current.value = '';
      if (termsInputRef.current) termsInputRef.current.value = '';
      if (aboutInputRef.current) aboutInputRef.current.value = '';
    }
  };

  const handleRemovePolicy = async (type) => {
    const isPrivacy = type === 'privacy';
    const isAbout = type === 'about';
    const label = isAbout ? 'About Us' : isPrivacy ? 'Privacy Policy' : 'Terms & Conditions';
    const policyKey = isAbout ? 'aboutUs' : isPrivacy ? 'privacyPolicy' : 'termsAndConditions';
    const existingUrl = legalPolicies?.[policyKey]?.url;
    const existingPublicId = legalPolicies?.[policyKey]?.publicId;

    if (!window.confirm(`Are you sure you want to remove the ${label}? Patients viewing this will see "${label} Not Added" until a new file is uploaded.`)) {
      return;
    }

    try {
      // 1. Delete physical file from Cloudinary and server disk
      if (existingPublicId) {
        await api.deleteMedia(existingPublicId, 'image').catch(() => {});
        await api.deleteMedia(existingPublicId, 'raw').catch(() => {});
      }
      if (existingUrl) {
        await api.deleteMedia(existingUrl).catch(() => {});
      }

      // 2. Clear from MongoDB database
      await updateLegalPolicies({
        [policyKey]: {
          url: '',
          publicId: null,
          fileName: '',
          fileSize: 0,
          fileSizeFormatted: '',
          fileType: '',
          updatedAt: new Date().toISOString()
        }
      });
      showToast && showToast(`${label} removed. Status is now "Not Added".`, 'info');
    } catch (err) {
      showToast && showToast(err.message || `Failed to remove ${label}.`, 'error');
    }
  };

  const privacyMeta = legalPolicies?.privacyPolicy;
  const termsMeta = legalPolicies?.termsAndConditions;
  const aboutMeta = legalPolicies?.aboutUs;

  const hasPrivacyDoc = Boolean(privacyMeta?.url && privacyMeta.url.trim());
  const hasTermsDoc = Boolean(termsMeta?.url && termsMeta.url.trim());
  const hasAboutDoc = Boolean(aboutMeta?.url && aboutMeta.url.trim());

  return (
    <div className={styles.managerWrapper}>
      {/* Header */}
      <div className={styles.headerSection}>
        <h1 className={styles.pageTitle}>Legal Policies &amp; Company Documents</h1>
        <p className={styles.pageSubtitle}>
          Upload official PDF documents or photos (up to 25MB each) for your Privacy Policy, Terms &amp; Conditions, and About Us.
          Visitors view them in an interactive in-app protected viewer with download prevention to safeguard your documentation.
        </p>
      </div>

      {/* Security & In-App View Banner */}
      <div className={styles.securityBanner}>
        <div className={styles.securityBannerIcon}>
          <Lock size={22} />
        </div>
        <div className={styles.securityBannerContent}>
          <h4>Download Prevention &amp; In-App Protected Viewing</h4>
          <p>
            When users click &ldquo;Privacy Policy&rdquo;, &ldquo;Terms &amp; Conditions&rdquo;, or &ldquo;About Us&rdquo; across the website,
            the content is displayed directly inside a dedicated, read-only modal viewer with toolbar suppression (<code>#toolbar=0</code>)
            and sandboxed iframe/image restrictions so documents are viewed cleanly online without being downloaded to user machines.
          </p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className={styles.cardsGrid}>
        {/* Card 1: Privacy Policy */}
        <div className={styles.policyCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderLeft}>
              <div className={styles.cardIconBadge}>
                <ShieldCheck size={22} />
              </div>
              <div>
                <h3 className={styles.cardTitle}>Privacy Policy</h3>
                <p className={styles.cardSub}>Patient Data Protection &amp; DPDPA</p>
              </div>
            </div>
            <span className={`${styles.statusBadge} ${hasPrivacyDoc ? styles.statusActive : styles.statusDefault}`}>
              {hasPrivacyDoc ? (privacyMeta?.fileType === 'image' ? 'Photo Active' : 'PDF Active') : 'Not Added'}
            </span>
          </div>

          {hasPrivacyDoc && (
            <div className={styles.fileMetaBox}>
              <div className={styles.fileNameRow} title={privacyMeta.fileName || 'Privacy Policy Document'}>
                {privacyMeta?.fileType === 'image' ? <ImageIcon size={16} color="#2563eb" style={{ flexShrink: 0 }} /> : <FileText size={16} color="#2563eb" style={{ flexShrink: 0 }} />}
                <span>{privacyMeta.fileName || 'Privacy_Policy_Document.pdf'}</span>
              </div>
              <div className={styles.fileDetailsRow}>
                <span className={styles.sizeBadge}>{privacyMeta.fileSizeFormatted || 'Doc'}</span>
                <span>
                  <Calendar size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: '4px' }} />
                  {privacyMeta.updatedAt ? new Date(privacyMeta.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                </span>
              </div>
            </div>
          )}

          {uploadingPrivacy ? (
            <div className={styles.progressWrapper}>
              <div className={styles.progressLabel}>
                <span>Uploading Privacy Policy...</span>
                <span>{privacyProgress}%</span>
              </div>
              <div className={styles.progressBarContainer}>
                <div className={styles.progressBarFill} style={{ width: `${privacyProgress}%` }} />
              </div>
            </div>
          ) : (
            <div
              className={`${styles.dropZone} ${dragOverPrivacy ? styles.dropZoneDragOver : ''}`}
              onClick={() => privacyInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOverPrivacy(true); }}
              onDragLeave={() => setDragOverPrivacy(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverPrivacy(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileSelected(e.dataTransfer.files[0], 'privacy');
                }
              }}
            >
              <div className={styles.dropIcon}>
                <FileUp size={22} />
              </div>
              <span className={styles.dropTextPrimary}>
                {hasPrivacyDoc ? 'Click or drop to replace document' : 'Upload Privacy Policy'}
              </span>
              <span className={styles.dropTextSecondary}>
                PDF or Photo &bull; Up to 25 MB max
              </span>
              <input
                ref={privacyInputRef}
                type="file"
                accept=".pdf,application/pdf,image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelected(e.target.files[0], 'privacy');
                  }
                }}
              />
            </div>
          )}

          <div className={styles.cardActions}>
            <button
              type="button"
              className={styles.previewBtn}
              onClick={() => setPreviewType('privacy')}
              title="Preview how users view this document in-app"
            >
              <Eye size={16} />
              <span>Preview User View</span>
            </button>

            {hasPrivacyDoc && (
              <>
                <button
                  type="button"
                  className={styles.replaceBtn}
                  onClick={() => privacyInputRef.current?.click()}
                  title="Upload a new version to replace current file"
                >
                  <RefreshCw size={15} />
                  <span>Replace</span>
                </button>

                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={() => handleRemovePolicy('privacy')}
                  title="Remove file and revert to Not Added"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Card 2: Terms & Conditions */}
        <div className={styles.policyCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderLeft}>
              <div className={styles.cardIconBadge}>
                <FileText size={22} />
              </div>
              <div>
                <h3 className={styles.cardTitle}>Terms &amp; Conditions</h3>
                <p className={styles.cardSub}>Service Agreements &amp; User Terms</p>
              </div>
            </div>
            <span className={`${styles.statusBadge} ${hasTermsDoc ? styles.statusActive : styles.statusDefault}`}>
              {hasTermsDoc ? (termsMeta?.fileType === 'image' ? 'Photo Active' : 'PDF Active') : 'Not Added'}
            </span>
          </div>

          {hasTermsDoc && (
            <div className={styles.fileMetaBox}>
              <div className={styles.fileNameRow} title={termsMeta.fileName || 'Terms & Conditions Document'}>
                {termsMeta?.fileType === 'image' ? <ImageIcon size={16} color="#2563eb" style={{ flexShrink: 0 }} /> : <FileText size={16} color="#2563eb" style={{ flexShrink: 0 }} />}
                <span>{termsMeta.fileName || 'Terms_And_Conditions_Document.pdf'}</span>
              </div>
              <div className={styles.fileDetailsRow}>
                <span className={styles.sizeBadge}>{termsMeta.fileSizeFormatted || 'Doc'}</span>
                <span>
                  <Calendar size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: '4px' }} />
                  {termsMeta.updatedAt ? new Date(termsMeta.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                </span>
              </div>
            </div>
          )}

          {uploadingTerms ? (
            <div className={styles.progressWrapper}>
              <div className={styles.progressLabel}>
                <span>Uploading Terms &amp; Conditions...</span>
                <span>{termsProgress}%</span>
              </div>
              <div className={styles.progressBarContainer}>
                <div className={styles.progressBarFill} style={{ width: `${termsProgress}%` }} />
              </div>
            </div>
          ) : (
            <div
              className={`${styles.dropZone} ${dragOverTerms ? styles.dropZoneDragOver : ''}`}
              onClick={() => termsInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOverTerms(true); }}
              onDragLeave={() => setDragOverTerms(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverTerms(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileSelected(e.dataTransfer.files[0], 'terms');
                }
              }}
            >
              <div className={styles.dropIcon}>
                <FileUp size={22} />
              </div>
              <span className={styles.dropTextPrimary}>
                {hasTermsDoc ? 'Click or drop to replace document' : 'Upload Terms & Conditions'}
              </span>
              <span className={styles.dropTextSecondary}>
                PDF or Photo &bull; Up to 25 MB max
              </span>
              <input
                ref={termsInputRef}
                type="file"
                accept=".pdf,application/pdf,image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelected(e.target.files[0], 'terms');
                  }
                }}
              />
            </div>
          )}

          <div className={styles.cardActions}>
            <button
              type="button"
              className={styles.previewBtn}
              onClick={() => setPreviewType('terms')}
              title="Preview how users view this document in-app"
            >
              <Eye size={16} />
              <span>Preview User View</span>
            </button>

            {hasTermsDoc && (
              <>
                <button
                  type="button"
                  className={styles.replaceBtn}
                  onClick={() => termsInputRef.current?.click()}
                  title="Upload a new version to replace current file"
                >
                  <RefreshCw size={15} />
                  <span>Replace</span>
                </button>

                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={() => handleRemovePolicy('terms')}
                  title="Remove file and revert to Not Added"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Card 3: About Us */}
        <div className={styles.policyCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderLeft}>
              <div className={styles.cardIconBadge} style={{ background: '#ecfdf5', borderColor: '#a7f3d0', color: '#059669' }}>
                <Building2 size={22} />
              </div>
              <div>
                <h3 className={styles.cardTitle}>About Us</h3>
                <p className={styles.cardSub}>Company Mission, Story &amp; Overview</p>
              </div>
            </div>
            <span className={`${styles.statusBadge} ${hasAboutDoc ? styles.statusActive : styles.statusDefault}`}>
              {hasAboutDoc ? (aboutMeta?.fileType === 'image' ? 'Photo Active' : 'PDF Active') : 'Not Added'}
            </span>
          </div>

          {hasAboutDoc && (
            <div className={styles.fileMetaBox}>
              <div className={styles.fileNameRow} title={aboutMeta.fileName || 'About Us Overview'}>
                {aboutMeta?.fileType === 'image' ? <ImageIcon size={16} color="#059669" style={{ flexShrink: 0 }} /> : <FileText size={16} color="#059669" style={{ flexShrink: 0 }} />}
                <span>{aboutMeta.fileName || 'About_Us_Overview'}</span>
              </div>
              <div className={styles.fileDetailsRow}>
                <span className={styles.sizeBadge}>{aboutMeta.fileSizeFormatted || 'Doc'}</span>
                <span>
                  <Calendar size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: '4px' }} />
                  {aboutMeta.updatedAt ? new Date(aboutMeta.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                </span>
              </div>
            </div>
          )}

          {uploadingAbout ? (
            <div className={styles.progressWrapper}>
              <div className={styles.progressLabel}>
                <span>Uploading About Us Photo or Document...</span>
                <span>{aboutProgress}%</span>
              </div>
              <div className={styles.progressBarContainer}>
                <div className={styles.progressBarFill} style={{ width: `${aboutProgress}%`, background: '#059669' }} />
              </div>
            </div>
          ) : (
            <div
              className={`${styles.dropZone} ${dragOverAbout ? styles.dropZoneDragOver : ''}`}
              onClick={() => aboutInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOverAbout(true); }}
              onDragLeave={() => setDragOverAbout(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverAbout(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileSelected(e.dataTransfer.files[0], 'about');
                }
              }}
            >
              <div className={styles.dropIcon} style={{ color: '#059669' }}>
                <FileUp size={22} />
              </div>
              <span className={styles.dropTextPrimary}>
                {hasAboutDoc ? 'Click or drop to replace photo or PDF' : 'Upload About Us Photo or PDF'}
              </span>
              <span className={styles.dropTextSecondary}>
                Photo (PNG, JPG, WEBP) or PDF &bull; Up to 25 MB max
              </span>
              <input
                ref={aboutInputRef}
                type="file"
                accept=".pdf,application/pdf,image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelected(e.target.files[0], 'about');
                  }
                }}
              />
            </div>
          )}

          <div className={styles.cardActions}>
            <button
              type="button"
              className={styles.previewBtn}
              onClick={() => setPreviewType('about')}
              title="Preview how users view About Us in-app"
            >
              <Eye size={16} />
              <span>Preview User View</span>
            </button>

            {hasAboutDoc && (
              <>
                <button
                  type="button"
                  className={styles.replaceBtn}
                  onClick={() => aboutInputRef.current?.click()}
                  title="Upload a new version to replace current file"
                >
                  <RefreshCw size={15} />
                  <span>Replace</span>
                </button>

                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={() => handleRemovePolicy('about')}
                  title="Remove file and revert to Not Added"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal for Admin to Test User View */}
      <PolicyViewerModal
        isOpen={Boolean(previewType)}
        type={previewType || 'privacy'}
        onClose={() => setPreviewType(null)}
      />
    </div>
  );
};

export default LegalPoliciesManager;
