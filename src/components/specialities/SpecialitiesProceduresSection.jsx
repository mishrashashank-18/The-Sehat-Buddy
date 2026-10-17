import React, { useState } from 'react';
import {
  ChevronRight,
  ShieldCheck,
  Search,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  PhoneCall
} from 'lucide-react';
import { useData } from '../../context/useData';
import Container from '../layout/Container';
import TreatmentInsuranceModal from './TreatmentInsuranceModal';
import InsuranceCheckModal from '../insurance/InsuranceCheckModal';
import styles from './SpecialitiesProceduresSection.module.css';

// Custom high-fidelity SVG icons matching the medical diagram aesthetics in the screenshot
const RenderMedicalIcon = ({ iconType, size = 38 }) => {
  switch (iconType) {
    case 'Bot':
    case 'Robotic Surgery':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="#003d79" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="14" y="28" width="20" height="6" rx="2" />
          <path d="M12 34l-3 8h30l-3-8" />
          <path d="M24 28v-8" />
          <path d="M16 14l8 6 8-6" />
          <circle cx="24" cy="12" r="3" />
          <path d="M10 16l6 4" />
          <path d="M38 16l-6 4" />
          <circle cx="24" cy="31" r="1.5" fill="#003d79" />
        </svg>
      );
    case 'Ribbon':
    case 'Cancer Care / Oncology':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="#003d79" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M24 6c-5 0-9 4-9 9 0 7 9 17 9 17s9-10 9-17c0-5-4-9-9-9z" />
          <path d="M18 28l-8 14" />
          <path d="M30 28l8 14" />
          <circle cx="24" cy="15" r="3" />
        </svg>
      );
    case 'Heart':
    case 'Cardiac Sciences':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="#003d79" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M24 38c-8-6-16-14-16-22 0-5 4-9 9-9 4 0 6 2 7 5 1-3 3-5 7-5 5 0 9 4 9 9 0 8-8 16-16 22z" />
          <path d="M24 16v6" />
          <path d="M28 10l-4 4" />
          <path d="M20 10l4 4" />
        </svg>
      );
    case 'Bone':
    case 'Orthopaedics & Joint Replacement':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="#003d79" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6v14l-6 18h16l-4-18V6z" />
          <circle cx="24" cy="20" r="4" />
          <path d="M16 18c-2 2-2 5 0 7" />
          <path d="M32 18c2 2 2 5 0 7" />
        </svg>
      );
    case 'Brain':
    case 'Neurosciences':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="#003d79" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M24 8a12 12 0 0 0-12 12c0 5 3 9 7 11v7h10v-7c4-2 7-6 7-11A12 12 0 0 0 24 8z" />
          <path d="M20 20c0-2 2-4 4-4s4 2 4 4" />
          <path d="M24 16v8" />
          <path d="M18 26c2 2 4 2 6 0" />
        </svg>
      );
    case 'Kidneys':
    case 'Nephrology':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="#003d79" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 10c-5 0-9 5-9 11s4 11 9 11c3 0 5-2 6-4V14c-1-2-3-4-6-4z" />
          <path d="M30 10c5 0 9 5 9 11s-4 11-9 11c-3 0-5-2-6-4V14c1-2 3-4 6-4z" />
          <path d="M24 14v24" />
          <path d="M20 38h8" />
        </svg>
      );
    case 'Pill':
    case 'Internal Medicine':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="#003d79" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="12" y="16" width="24" height="16" rx="8" transform="rotate(-30 24 24)" />
          <line x1="16" y1="28" x2="32" y2="20" />
          <circle cx="16" cy="38" r="8" />
          <path d="M12 38h8" />
        </svg>
      );
    case 'Baby':
    case 'Obstetrics And Gynaecology':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="#003d79" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M24 16v18" />
          <path d="M14 12c-4 0-6 4-6 8s3 8 8 8h16c5 0 8-4 8-8s-2-8-6-8" />
          <path d="M16 28c2 4 5 6 8 6s6-2 8-6" />
          <path d="M20 34l4 6 4-6" />
        </svg>
      );
    case 'Eye':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="#003d79" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 24s7-12 18-12 18 12 18 12-7 12-18 12S6 24 6 24z" />
          <circle cx="24" cy="24" r="6" />
          <circle cx="24" cy="24" r="2" fill="#003d79" />
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="#003d79" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="24" cy="24" r="16" />
          <path d="M24 16v16" />
          <path d="M16 24h16" />
        </svg>
      );
  }
};

const SpecialitiesProceduresSection = ({ onNavigate }) => {
  const { specialitiesProcedures } = useData();
  const [activeTab, setActiveTab] = useState('specialities'); // 'specialities' | 'procedures'
  const [showAll, setShowAll] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isInsuranceModalOpen, setIsInsuranceModalOpen] = useState(false);
  const [insurancePreSelect, setInsurancePreSelect] = useState(null);

  const specialitiesList = specialitiesProcedures.filter(item => item.type === 'speciality');
  const proceduresList = specialitiesProcedures.filter(item => item.type === 'procedure');

  const currentList = activeTab === 'specialities' ? specialitiesList : proceduresList;
  const displayedItems = showAll ? currentList : currentList.slice(0, 8);

  const handleOpenItem = (item) => {
    setSelectedItem(item);
  };

  const handleOpenInsuranceCheck = (item = null) => {
    setInsurancePreSelect(item);
    setIsInsuranceModalOpen(true);
  };

  return (
    <section className={styles.sectionWrap} id="specialities-procedures-section">
      <Container>
        {/* Section Header with Accent Bar */}
        <div className={styles.sectionHeader}>
          <div className={styles.titleWrap}>
            <h2 className={styles.sectionTitle}>Specialities & Procedures</h2>
            <div className={styles.accentBar} />
          </div>
        </div>

        <div className={styles.contentLayout}>
          {/* Left Column: Tabs + Items Grid + View All */}
          <div className={styles.leftCol}>
            {/* Tabs */}
            <div className={styles.tabsContainer}>
              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === 'specialities' ? styles.tabBtnActive : ''}`}
                onClick={() => {
                  setActiveTab('specialities');
                  setShowAll(false);
                }}
              >
                Specialities
                {activeTab === 'specialities' && <div className={styles.tabIndicator} />}
              </button>

              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === 'procedures' ? styles.tabBtnActive : ''}`}
                onClick={() => {
                  setActiveTab('procedures');
                  setShowAll(false);
                }}
              >
                Procedures
                {activeTab === 'procedures' && <div className={styles.tabIndicator} />}
              </button>
            </div>

            {/* Grid of Medical Items */}
            <div className={styles.itemsGrid}>
              {displayedItems.map((item) => (
                <div
                  key={item.id || item._id}
                  className={styles.itemCard}
                  onClick={() => handleOpenItem(item)}
                  title={`View ${item.name} details & Cashless Insurance Coverage`}
                >
                  <div className={styles.iconBox}>
                    <RenderMedicalIcon iconType={item.icon || item.name} size={38} />
                  </div>

                  <div className={styles.itemInfo}>
                    <div className={styles.itemName}>{item.name}</div>
                    <div className={styles.insurancePill}>
                      <ShieldCheck size={12} color="#0284c7" />
                      <span>{item.insuranceDetails?.coveragePercent || 'Cashless Available'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* View All Toggle */}
            <div className={styles.viewAllRow}>
              <button
                type="button"
                className={styles.viewAllBtn}
                onClick={() => setShowAll(prev => !prev)}
              >
                <span>{showAll ? 'Show less' : 'View all'}</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </Container>

      {/* Detail Modal */}
      {selectedItem && (
        <TreatmentInsuranceModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onCheckInsurance={(item) => handleOpenInsuranceCheck(item)}
          onNavigate={onNavigate}
        />
      )}

      {/* Insurance Eligibility Modal */}
      {isInsuranceModalOpen && (
        <InsuranceCheckModal
          initialItem={insurancePreSelect}
          onClose={() => {
            setIsInsuranceModalOpen(false);
            setInsurancePreSelect(null);
          }}
        />
      )}
    </section>
  );
};

export default SpecialitiesProceduresSection;
