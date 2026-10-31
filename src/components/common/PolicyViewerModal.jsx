import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  FileText,
  Building2,
  X,
  Maximize2,
  Minimize2,
  Lock,
  AlertCircle,
  FileX
} from 'lucide-react';
import { useData } from '../../context/useData';
import styles from './PolicyViewerModal.module.css';

const resolvePdfSrc = (url) => {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Relative path like /uploads/documents/...
  const clean = url.startsWith('/') ? url : `/${url}`;
  return clean;
};

const PolicyViewerModal = ({ isOpen, onClose, type = 'privacy' }) => {
  const { legalPolicies, refreshLegalPolicies } = useData();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoadingPdf, setIsLoadingPdf] = useState(true);

  const normalizedType = (type || '').toLowerCase();
  const isPrivacy = normalizedType === 'privacy' || normalizedType === 'privacypolicy';
  const isAbout = normalizedType === 'about' || normalizedType === 'aboutus';

  const policyMeta = isPrivacy
    ? legalPolicies?.privacyPolicy
    : isAbout
      ? legalPolicies?.aboutUs
      : legalPolicies?.termsAndConditions;

  const hasUploadedDoc = Boolean(policyMeta?.url && policyMeta.url.trim());
  const isImageDoc =
    policyMeta?.fileType === 'image' ||
    Boolean(policyMeta?.url && policyMeta.url.match(/\.(jpg|jpeg|png|webp|svg|gif)(\?.*)?$/i)) ||
    Boolean(policyMeta?.fileName && policyMeta.fileName.match(/\.(jpg|jpeg|png|webp|svg|gif)$/i));

  // Real-time refresh when modal opens or document type changes
  useEffect(() => {
    if (isOpen) {
      if (typeof refreshLegalPolicies === 'function') {
        refreshLegalPolicies();
      }
      setIsLoadingPdf(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, type, refreshLegalPolicies]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose && onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const title = isPrivacy ? 'Privacy Policy' : isAbout ? 'About Us' : 'Terms & Conditions';
  const rawDocUrl = resolvePdfSrc(policyMeta?.url);
  // Add parameters to suppress download/print toolbars in browser viewer
  const securePdfUrl = rawDocUrl ? `${rawDocUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH` : '';

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose && onClose();
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        className={`${styles.modalContainer} ${isFullscreen ? styles.modalContainerFullscreen : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="policy-dialog-title"
      >
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.iconBadge}>
              {isPrivacy ? <ShieldCheck size={24} /> : isAbout ? <Building2 size={24} /> : <FileText size={24} />}
            </div>
            <div className={styles.titleBox}>
              <h2 id="policy-dialog-title">
                {title}
                <span className={styles.viewOnlyPill}>PROTECTED VIEW</span>
              </h2>
              <div className={styles.subMeta}>
                <span>The Sehat Buddy {isAbout ? 'Company' : 'Legal'}</span>
                <span className={styles.metaDot} />
                {hasUploadedDoc ? (
                  <span>
                    {isImageDoc ? 'Photo / Image' : 'PDF Document'}{' '}
                    {policyMeta?.fileSizeFormatted ? `(${policyMeta.fileSizeFormatted})` : ''}
                  </span>
                ) : (
                  <span style={{ color: '#dc2626', fontWeight: 600 }}>Not Added</span>
                )}
              </div>
            </div>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => setIsFullscreen(prev => !prev)}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              title="Close (Esc)"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Security / Inline Notice Banner */}
        <div className={styles.securityBanner}>
          <div className={styles.securityBannerLeft}>
            <Lock size={13} />
            <span>In-App Document Viewer</span>
          </div>
          <div className={styles.securityBannerRight}>
            The Sehat Buddy &copy; {new Date().getFullYear()}
          </div>
        </div>

        {/* Body Content */}
        <div className={styles.modalBody}>
          {hasUploadedDoc ? (
            isImageDoc ? (
              <div className={styles.imageViewerWrapper}>
                <img
                  src={rawDocUrl}
                  alt={title}
                  className={styles.protectedImage}
                  onContextMenu={(e) => e.preventDefault()}
                  draggable={false}
                />
              </div>
            ) : (
              <div className={styles.iframeWrapper}>
                {isLoadingPdf && (
                  <div className={styles.loadingOverlay}>
                    <div className={styles.spinner} />
                    <p style={{ fontSize: '0.88rem', color: '#475569', fontWeight: 500 }}>
                      Rendering protected document...
                    </p>
                  </div>
                )}
                {/* Embed PDF inline with toolbar suppressed to prevent download/print tools */}
                <iframe
                  src={securePdfUrl}
                  title={title}
                  className={styles.pdfFrame}
                  onLoad={() => setIsLoadingPdf(false)}
                />
              </div>
            )
          ) : (
            <div className={styles.emptyPolicyContainer}>
              <div className={styles.emptyPolicyCard}>
                <div className={styles.emptyPolicyIconBadge}>
                  <FileX size={40} />
                </div>
                <h3 className={styles.emptyPolicyTitle}>
                  {title} Not Added
                </h3>
                <p className={styles.emptyPolicyMessage}>
                  {isAbout
                    ? 'The official About Us document or photo has not been uploaded by the platform administrator yet.'
                    : isPrivacy
                      ? 'The official Privacy Policy document has not been uploaded by the platform administrator yet.'
                      : 'The official Terms & Conditions document has not been uploaded by the platform administrator yet.'}
                </p>
                <div className={styles.emptyPolicyNote}>
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>
                    Real-time status: Once an administrator uploads the photo or document from the Admin Panel, it will automatically appear here.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <div className={styles.footerLeft}>
            <AlertCircle size={14} />
            <span>
              {isAbout
                ? 'Official Company Overview • The Sehat Buddy Healthcare Network'
                : 'Official Policy • Registered with The Sehat Buddy Healthcare Network'}
            </span>
          </div>
          <button type="button" className={styles.doneBtn} onClick={onClose}>
            Close Document
          </button>
        </div>
      </div>
    </div>
  );
};

export default PolicyViewerModal;
