import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  FileText,
  Upload,
  Eye,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileUp,
  Lock,
  Calendar,
  HardDrive
} from 'lucide-react';
import { useData } from '../../context/useData';
import { api } from '../../services/api';
import PolicyViewerModal from '../common/PolicyViewerModal';
import styles from './LegalPoliciesManager.module.css';

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 Megabytes

const LegalPoliciesManager = ({ showToast }) => {
  const { legalPolicies, updateLegalPolicies } = useData();

  const [previewType, setPreviewType] = useState(null); // 'privacy' | 'terms' | null

  // Uploading state
  const [uploadingPrivacy, setUploadingPrivacy] = useState(false);
  const [privacyProgress, setPrivacyProgress] = useState(0);

  const [uploadingTerms, setUploadingTerms] = useState(false);
  const [termsProgress, setTermsProgress] = useState(0);

  // Drag states
  const [dragOverPrivacy, setDragOverPrivacy] = useState(false);
  const [dragOverTerms, setDragOverTerms] = useState(false);

  const privacyInputRef = useRef(null);
  const termsInputRef = useRef(null);

  const handleFileSelected = async (file, type) => {
    if (!file) return;

    // 1. Strict PDF type check
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      showToast && showToast('Invalid file format. Only official PDF (.pdf) documents are accepted.', 'error');
      return;
    }

    // 2. Strict 25MB limit check
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const actualMb = (file.size / (1024 * 1024)).toFixed(1);
      showToast && showToast(`File size (${actualMb} MB) exceeds maximum allowed limit of 25 MB.`, 'error');
      return;
    }

    const isPrivacy = type === 'privacy';
    const setUploading = isPrivacy ? setUploadingPrivacy : setUploadingTerms;
    const setProgress = isPrivacy ? setPrivacyProgress : setTermsProgress;
    const label = isPrivacy ? 'Privacy Policy' : 'Terms & Conditions';

    try {
      setUploading(true);
      setProgress(0);

      const res = await api.uploadPolicyPdf(file, type, (pct) => {
        setProgress(pct);
      });

      if (!res || !res.success || !res.url) {
        throw new Error(res?.message || `Failed to upload ${label} PDF`);
      }

      const policyKey = isPrivacy ? 'privacyPolicy' : 'termsAndConditions';
      const oldUrl = legalPolicies?.[policyKey]?.url;
      const oldPublicId = legalPolicies?.[policyKey]?.publicId;

      const updatedMeta = {
        url: res.url,
        publicId: res.public_id || null,
        fileName: res.name || file.name,
        fileSize: res.size || file.size,
        fileSizeFormatted: res.sizeFormatted || `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
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

      showToast && showToast(`${label} PDF (${updatedMeta.fileSizeFormatted}) uploaded successfully!`, 'success');
    } catch (err) {
      console.error(`Upload error for ${label}:`, err);
      showToast && showToast(err.message || `Failed to upload ${label} PDF.`, 'error');
    } finally {
      setUploading(false);
      setProgress(0);
      if (privacyInputRef.current) privacyInputRef.current.value = '';
      if (termsInputRef.current) termsInputRef.current.value = '';
    }
  };

  const handleRemovePolicy = async (type) => {
    const isPrivacy = type === 'privacy';
    const label = isPrivacy ? 'Privacy Policy' : 'Terms & Conditions';
    const policyKey = isPrivacy ? 'privacyPolicy' : 'termsAndConditions';
    const existingUrl = legalPolicies?.[policyKey]?.url;
    const existingPublicId = legalPolicies?.[policyKey]?.publicId;

    if (!window.confirm(`Are you sure you want to remove the ${label} PDF? Patients viewing this policy will see "${label} Not Added" until a new document is uploaded.`)) {
      return;
    }

    try {
      // 1. Delete the physical file from server disk and Cloudinary
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

  const hasPrivacyPdf = Boolean(privacyMeta?.url && privacyMeta.url.trim());
  const hasTermsPdf = Boolean(termsMeta?.url && termsMeta.url.trim());

  return (
    <div className={styles.managerWrapper}>
      {/* Header */}
      <div className={styles.headerSection}>
        <h1 className={styles.pageTitle}>Legal Policies &amp; Compliance</h1>
        <p className={styles.pageSubtitle}>
          Upload official PDF documents (up to 25MB each) for your public Privacy Policy and Terms &amp; Conditions.
          Patients view them in an interactive in-app viewer with built-in download prevention to protect your documentation.
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
            When patients click &ldquo;Privacy Policy&rdquo; or &ldquo;Terms &amp; Conditions&rdquo; across the website,
            the PDF is displayed directly inside a dedicated, read-only modal viewer with toolbar suppression (<code>#toolbar=0</code>)
            and sandboxed iframe restrictions so documents are viewed cleanly online without being downloaded to user machines.
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
            <span className={`${styles.statusBadge} ${hasPrivacyPdf ? styles.statusActive : styles.statusDefault}`}>
              {hasPrivacyPdf ? 'PDF Active' : 'Not Added'}
            </span>
          </div>

          {hasPrivacyPdf && (
            <div className={styles.fileMetaBox}>
              <div className={styles.fileNameRow} title={privacyMeta.fileName || 'Privacy Policy Document'}>
                <FileText size={16} color="#2563eb" style={{ flexShrink: 0 }} />
                <span>{privacyMeta.fileName || 'Privacy_Policy_Document.pdf'}</span>
              </div>
              <div className={styles.fileDetailsRow}>
                <span className={styles.sizeBadge}>{privacyMeta.fileSizeFormatted || 'PDF'}</span>
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
                <span>Uploading Privacy Policy PDF...</span>
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
                {hasPrivacyPdf ? 'Click or drop to replace PDF' : 'Upload Privacy Policy PDF'}
              </span>
              <span className={styles.dropTextSecondary}>
                PDF format only &bull; Up to 25 MB max
              </span>
              <input
                ref={privacyInputRef}
                type="file"
                accept=".pdf,application/pdf"
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

            {hasPrivacyPdf && (
              <>
                <button
                  type="button"
                  className={styles.replaceBtn}
                  onClick={() => privacyInputRef.current?.click()}
                  title="Upload a new version to replace current PDF"
                >
                  <RefreshCw size={15} />
                  <span>Replace</span>
                </button>

                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={() => handleRemovePolicy('privacy')}
                  title="Remove custom PDF and revert to system default"
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
            <span className={`${styles.statusBadge} ${hasTermsPdf ? styles.statusActive : styles.statusDefault}`}>
              {hasTermsPdf ? 'PDF Active' : 'Not Added'}
            </span>
          </div>

          {hasTermsPdf && (
            <div className={styles.fileMetaBox}>
              <div className={styles.fileNameRow} title={termsMeta.fileName || 'Terms & Conditions Document'}>
                <FileText size={16} color="#2563eb" style={{ flexShrink: 0 }} />
                <span>{termsMeta.fileName || 'Terms_And_Conditions_Document.pdf'}</span>
              </div>
              <div className={styles.fileDetailsRow}>
                <span className={styles.sizeBadge}>{termsMeta.fileSizeFormatted || 'PDF'}</span>
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
                <span>Uploading Terms &amp; Conditions PDF...</span>
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
                {hasTermsPdf ? 'Click or drop to replace PDF' : 'Upload Terms & Conditions PDF'}
              </span>
              <span className={styles.dropTextSecondary}>
                PDF format only &bull; Up to 25 MB max
              </span>
              <input
                ref={termsInputRef}
                type="file"
                accept=".pdf,application/pdf"
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

            {hasTermsPdf && (
              <>
                <button
                  type="button"
                  className={styles.replaceBtn}
                  onClick={() => termsInputRef.current?.click()}
                  title="Upload a new version to replace current PDF"
                >
                  <RefreshCw size={15} />
                  <span>Replace</span>
                </button>

                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={() => handleRemovePolicy('terms')}
                  title="Remove custom PDF and revert to system default"
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
