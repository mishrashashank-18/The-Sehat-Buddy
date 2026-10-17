import React from 'react';
import {
  X,
  ShieldCheck,
  Clock,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Building2,
  Stethoscope,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { defaultAcceptedInsurances } from '../../data/insurancePartners';
import styles from './TreatmentInsuranceModal.module.css';

const TreatmentInsuranceModal = ({ item, onClose, onCheckInsurance, onNavigate }) => {
  if (!item) return null;

  const ins = item.insuranceDetails || {
    coveragePercent: 'Up to 100% Covered',
    cashlessAvailable: true,
    preAuthHours: '30 Mins Pre-Approval',
    estimatedCostRange: '₹45,000 - ₹90,000',
    outOfPocketWithInsurance: '₹0 with Cashless Mediclaim',
    emiAvailable: true
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className={styles.header}>
          <div className={styles.categoryPill}>
            {item.type === 'procedure' ? 'Surgical Procedure' : 'Medical Speciality'}
          </div>
          <h2 className={styles.title}>{item.name}</h2>
          <p className={styles.description}>{item.description}</p>
        </div>

        {/* Insurance Coverage Showcase Card */}
        <div className={styles.insuranceCard}>
          <div className={styles.insuranceCardHeader}>
            <div className={styles.insHeaderTitle}>
              <ShieldCheck size={24} color="#0284c7" />
              <div>
                <h3>Insurance & Cashless Facility</h3>
                <span>100% Paperless TPA Pre-Authorization Support</span>
              </div>
            </div>
            <div className={styles.cashlessBadge}>
              <CheckCircle2 size={14} /> Cashless Available
            </div>
          </div>

          <div className={styles.insGrid}>
            <div className={styles.insItem}>
              <span className={styles.insLabel}>Insurance Coverage</span>
              <strong className={styles.insValueHighlight}>{ins.coveragePercent || 'Up to 100% Covered'}</strong>
            </div>

            <div className={styles.insItem}>
              <span className={styles.insLabel}>Pre-Auth Approval</span>
              <strong className={styles.insValue}>
                <Clock size={15} color="#2563eb" style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
                {ins.preAuthHours || '30 Mins Pre-Approval'}
              </strong>
            </div>

            <div className={styles.insItem}>
              <span className={styles.insLabel}>Estimated Hospital Cost</span>
              <strong className={styles.insValue}>{ins.estimatedCostRange || '₹45,000 - ₹90,000'}</strong>
            </div>

            <div className={styles.insItem}>
              <span className={styles.insLabel}>Out-of-Pocket Expense</span>
              <strong className={styles.insValueSuccess}>{ins.outOfPocketWithInsurance || '₹0 with Cashless Mediclaim'}</strong>
            </div>
          </div>

          <div className={styles.emiBanner}>
            <CreditCard size={18} color="#0284c7" />
            <span>0% No-Cost EMI options (3, 6, 9, 12 months) available for any non-covered expenses or co-pay.</span>
          </div>

          {/* Accepted Insurance Partners */}
          <div className={styles.insPartnersSection}>
            <span className={styles.insPartnersTitle}>Accepted by all leading Insurance Companies & TPAs:</span>
            <div className={styles.partnerTags}>
              {defaultAcceptedInsurances.map((partner, idx) => (
                <span key={idx} className={styles.partnerTag}>
                  ✓ {partner}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Sub-procedures list if applicable */}
        {Array.isArray(item.procedures) && item.procedures.length > 0 && (
          <div className={styles.proceduresBox}>
            <h4 className={styles.boxTitle}>
              <Sparkles size={16} color="#2563eb" /> Key Treatments & Surgeries Included:
            </h4>
            <div className={styles.procGrid}>
              {item.procedures.map((p, i) => (
                <div key={i} className={styles.procItem}>
                  <span className={styles.procBullet}>•</span>
                  <span>{p}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions Footer */}
        <div className={styles.actionsFooter}>
          <button
            type="button"
            className={styles.checkInsBtn}
            onClick={() => {
              onClose();
              if (onCheckInsurance) onCheckInsurance(item);
            }}
          >
            <ShieldCheck size={18} />
            <span>Check My Insurance Coverage</span>
          </button>

          <button
            type="button"
            className={styles.findDoctorBtn}
            onClick={() => {
              onClose();
              if (onNavigate) {
                onNavigate('find-doctors', { specialty: item.name });
              }
            }}
          >
            <Stethoscope size={18} />
            <span>Consult Specialist Doctor</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TreatmentInsuranceModal;
