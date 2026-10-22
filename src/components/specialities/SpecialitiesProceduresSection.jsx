import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Search,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  Stethoscope,
  Activity,
  X,
  Layers
} from 'lucide-react';
import { useData } from '../../context/useData';
import TreatmentInsuranceModal from './TreatmentInsuranceModal';
import InsuranceCheckModal from '../insurance/InsuranceCheckModal';
import styles from './SpecialitiesProceduresSection.module.css';

// Dynamic category theme mapping for rich visual cues and pastel tints
const getItemTheme = (item) => {
  const name = (item?.name || '').toLowerCase();
  const icon = (item?.icon || '').toLowerCase();

  if (name.includes('cardiac') || name.includes('heart') || icon === 'heart') {
    return {
      accent: '#e11d48',
      iconBg: '#fff1f2',
      iconBorder: '#fecdd3',
      badgeBg: '#fff1f2',
      badgeText: '#be123c',
      glow: 'rgba(225, 29, 72, 0.12)'
    };
  }
  if (name.includes('neuro') || name.includes('brain') || icon === 'brain') {
    return {
      accent: '#7c3aed',
      iconBg: '#f5f3ff',
      iconBorder: '#ddd6fe',
      badgeBg: '#f5f3ff',
      badgeText: '#6d28d9',
      glow: 'rgba(124, 58, 237, 0.12)'
    };
  }
  if (name.includes('cancer') || name.includes('oncology') || icon === 'ribbon') {
    return {
      accent: '#db2777',
      iconBg: '#fdf2f8',
      iconBorder: '#fbcfe8',
      badgeBg: '#fdf2f8',
      badgeText: '#be185d',
      glow: 'rgba(219, 39, 119, 0.12)'
    };
  }
  if (name.includes('ortho') || name.includes('joint') || name.includes('bone') || name.includes('knee') || icon === 'bone') {
    return {
      accent: '#d97706',
      iconBg: '#fffbeb',
      iconBorder: '#fde68a',
      badgeBg: '#fffbeb',
      badgeText: '#b45309',
      glow: 'rgba(217, 119, 6, 0.12)'
    };
  }
  if (name.includes('nephro') || name.includes('kidney') || icon === 'kidneys') {
    return {
      accent: '#0891b2',
      iconBg: '#ecfeff',
      iconBorder: '#a5f3fc',
      badgeBg: '#ecfeff',
      badgeText: '#0e7490',
      glow: 'rgba(8, 145, 178, 0.12)'
    };
  }
  if (name.includes('robotic') || icon === 'bot') {
    return {
      accent: '#4f46e5',
      iconBg: '#eef2ff',
      iconBorder: '#c7d2fe',
      badgeBg: '#eff6ff',
      badgeText: '#1e40af',
      glow: 'rgba(79, 70, 229, 0.12)'
    };
  }
  if (name.includes('internal medicine') || name.includes('general medicine') || icon === 'pill') {
    return {
      accent: '#059669',
      iconBg: '#ecfdf5',
      iconBorder: '#a7f3d0',
      badgeBg: '#ecfdf5',
      badgeText: '#047857',
      glow: 'rgba(5, 150, 105, 0.12)'
    };
  }
  if (name.includes('gynae') || name.includes('obstetric') || name.includes('maternity') || icon === 'baby') {
    return {
      accent: '#f43f5e',
      iconBg: '#fff1f2',
      iconBorder: '#fecdd3',
      badgeBg: '#fff1f2',
      badgeText: '#e11d48',
      glow: 'rgba(244, 63, 94, 0.12)'
    };
  }
  if (name.includes('eye') || name.includes('cataract') || name.includes('ophthalm') || icon === 'eye') {
    return {
      accent: '#0284c7',
      iconBg: '#f0f9ff',
      iconBorder: '#bae6fd',
      badgeBg: '#f0f9ff',
      badgeText: '#0369a1',
      glow: 'rgba(2, 132, 199, 0.12)'
    };
  }
  if (name.includes('gastro') || name.includes('liver') || name.includes('digest')) {
    return {
      accent: '#ea580c',
      iconBg: '#fff7ed',
      iconBorder: '#fed7aa',
      badgeBg: '#fff7ed',
      badgeText: '#c2410c',
      glow: 'rgba(234, 88, 12, 0.12)'
    };
  }
  return {
    accent: '#2563eb',
    iconBg: '#eff6ff',
    iconBorder: '#bfdbfe',
    badgeBg: '#eff6ff',
    badgeText: '#1d4ed8',
    glow: 'rgba(37, 99, 235, 0.12)'
  };
};

// Premium high-fidelity SVG icons with colored strokes
const RenderMedicalIcon = ({ iconType, color = '#2563eb', size = 26 }) => {
  const norm = (iconType || '').toLowerCase();

  if (norm.includes('bot') || norm.includes('robotic')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="10" rx="3" />
        <circle cx="12" cy="5" r="2" />
        <path d="M12 7v4" />
        <line x1="8" y1="16" x2="8.01" y2="16" strokeWidth="2.5" />
        <line x1="16" y1="16" x2="16.01" y2="16" strokeWidth="2.5" />
        <path d="M9 19h6" />
      </svg>
    );
  }

  if (norm.includes('ribbon') || norm.includes('cancer') || norm.includes('oncol')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3c-2.5 0-4.5 2-4.5 4.5 0 3.8 4.5 8.5 4.5 8.5s4.5-4.7 4.5-8.5C16.5 5 14.5 3 12 3z" />
        <path d="M9 14.5L5 21" />
        <path d="M15 14.5L19 21" />
      </svg>
    );
  }

  if (norm.includes('heart') || norm.includes('cardiac') || norm.includes('cardio')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        <path d="M8 12h2l1.5-3 2.5 6 1.5-3h2.5" />
      </svg>
    );
  }

  if (norm.includes('bone') || norm.includes('ortho') || norm.includes('joint')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.5 7.5A2.5 2.5 0 0 0 15 5a2.5 2.5 0 0 0-4.5 1.5c0 .2.02.4.06.6L7.1 10.6a2.5 2.5 0 1 0-2.1 4.3 2.5 2.5 0 0 0 4.5-1.5c0-.2-.02-.4-.06-.6l3.44-3.44A2.5 2.5 0 1 0 17.5 7.5Z" />
      </svg>
    );
  }

  if (norm.includes('brain') || norm.includes('neuro')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04" />
        <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04" />
      </svg>
    );
  }

  if (norm.includes('kidney') || norm.includes('nephro')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 6c-2.5 0-4 2-4 5s2 6 4 6c2 0 3-1.5 3.5-3V8c-.5-1.5-1.5-2-3.5-2z" />
        <path d="M18 6c2.5 0 4 2 4 5s-2 6-4 6c-2 0-3-1.5-3.5-3V8c.5-1.5 1.5-2 3.5-2z" />
        <path d="M9.5 12h5" />
        <path d="M12 9v6" />
      </svg>
    );
  }

  if (norm.includes('pill') || norm.includes('medicine') || norm.includes('internal')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="8" width="18" height="8" rx="4" transform="rotate(-45 12 12)" />
        <line x1="8.5" y1="8.5" x2="15.5" y2="15.5" />
      </svg>
    );
  }

  if (norm.includes('baby') || norm.includes('gynae') || norm.includes('obstetric')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="6" r="3" />
        <path d="M6 20a6 6 0 0 1 12 0" />
        <circle cx="16" cy="12" r="2" />
        <path d="M12 14a4 4 0 0 1 4 4" />
      </svg>
    );
  }

  if (norm.includes('eye') || norm.includes('cataract') || norm.includes('ophthalm')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
        <circle cx="12" cy="12" r="1" fill={color} />
      </svg>
    );
  }

  // Fallback icon
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4v16m-8-8h16" />
    </svg>
  );
};

const SpecialitiesProceduresSection = ({ onNavigate }) => {
  const { specialitiesProcedures } = useData();
  const [activeTab, setActiveTab] = useState('specialities'); // 'specialities' | 'procedures'
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isInsuranceModalOpen, setIsInsuranceModalOpen] = useState(false);
  const [insurancePreSelect, setInsurancePreSelect] = useState(null);

  const specialitiesList = useMemo(() => {
    return (specialitiesProcedures || []).filter(item => item.type === 'speciality');
  }, [specialitiesProcedures]);

  const proceduresList = useMemo(() => {
    return (specialitiesProcedures || []).filter(item => item.type === 'procedure');
  }, [specialitiesProcedures]);

  const currentRawList = activeTab === 'specialities' ? specialitiesList : proceduresList;

  // Filter based on search query
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return currentRawList;
    const q = searchQuery.toLowerCase().trim();
    return currentRawList.filter(item => {
      const nameMatch = (item.name || '').toLowerCase().includes(q);
      const descMatch = (item.description || '').toLowerCase().includes(q);
      const procMatch = Array.isArray(item.procedures) && item.procedures.some(p => p.toLowerCase().includes(q));
      return nameMatch || descMatch || procMatch;
    });
  }, [currentRawList, searchQuery]);

  // Display top 8 unless showAll is true or user is actively filtering
  const displayedItems = useMemo(() => {
    if (showAll || searchQuery.trim().length > 0) {
      return filteredList;
    }
    return filteredList.slice(0, 8);
  }, [filteredList, showAll, searchQuery]);

  const handleOpenItem = (item) => {
    setSelectedItem(item);
  };

  const handleOpenInsuranceCheck = (item = null) => {
    setInsurancePreSelect(item);
    setIsInsuranceModalOpen(true);
  };

  return (
    <div className={styles.sectionCard}>
      {/* Top Header Block */}
      <div className={styles.headerBlock}>
        <div className={styles.titleGroup}>
          <div className={styles.titleIconBadge}>
            <Stethoscope size={22} />
          </div>
          <div>
            <div className={styles.titleRow}>
              <h2 className={styles.mainTitle}>Specialities & Procedures</h2>
              <span className={styles.headerCountBadge}>
                {filteredList.length} Available
              </span>
            </div>
            <p className={styles.subtitle}>
              Comprehensive clinical departments and surgical procedures with full cashless insurance pre-approval.
            </p>
          </div>
        </div>

        {/* Modern Segmented Tab Switch */}
        <div className={styles.segmentedTabs} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'specialities'}
            className={`${styles.segmentBtn} ${activeTab === 'specialities' ? styles.segmentBtnActive : ''}`}
            onClick={() => {
              setActiveTab('specialities');
              setShowAll(false);
              setSearchQuery('');
            }}
          >
            <Layers size={15} />
            <span>Clinical Specialities</span>
            <span className={styles.tabBadge}>{specialitiesList.length}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'procedures'}
            className={`${styles.segmentBtn} ${activeTab === 'procedures' ? styles.segmentBtnActive : ''}`}
            onClick={() => {
              setActiveTab('procedures');
              setShowAll(false);
              setSearchQuery('');
            }}
          >
            <Activity size={15} />
            <span>Surgical Procedures</span>
            <span className={styles.tabBadge}>{proceduresList.length}</span>
          </button>
        </div>
      </div>

      {/* Quick Search & Filter Bar */}
      <div className={styles.searchRow}>
        <div className={styles.searchBar}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder={`Search ${activeTab === 'specialities' ? 'specialities (e.g. Cardiology, Oncology, Ortho)' : 'procedures (e.g. Cataract, Knee Replacement)'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          {searchQuery && (
            <button
              type="button"
              className={styles.clearSearchBtn}
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className={styles.liveMeta}>
          Showing {displayedItems.length} of {filteredList.length} {activeTab}
        </div>
      </div>

      {/* Grid of Medical Items */}
      {displayedItems.length > 0 ? (
        <div className={styles.itemsGrid}>
          {displayedItems.map((item) => {
            const theme = getItemTheme(item);

            return (
              <div
                key={item.id || item._id}
                className={styles.itemCard}
                onClick={() => handleOpenItem(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOpenItem(item);
                  }
                }}
                style={{
                  '--card-accent': theme.accent,
                  '--card-glow': theme.glow,
                  '--card-icon-bg': theme.iconBg,
                  '--card-icon-border': theme.iconBorder
                }}
              >
                <div className={styles.cardTopRow}>
                  <div
                    className={styles.iconBox}
                    style={{
                      backgroundColor: theme.iconBg,
                      borderColor: theme.iconBorder
                    }}
                  >
                    <RenderMedicalIcon
                      iconType={item.icon || item.name}
                      color={theme.accent}
                      size={26}
                    />
                  </div>

                  <div className={styles.cornerAction}>
                    <span className={styles.actionPill}>View Details</span>
                    <ArrowUpRight size={15} className={styles.arrowIcon} />
                  </div>
                </div>

                <div className={styles.cardBody}>
                  <h4 className={styles.itemName} title={item.name}>
                    {item.name}
                  </h4>

                  {/* Procedures preview or short description */}
                  {Array.isArray(item.procedures) && item.procedures.length > 0 ? (
                    <div className={styles.procChipsList}>
                      {item.procedures.slice(0, 2).map((proc, pIdx) => (
                        <span key={pIdx} className={styles.procChip} title={proc}>
                          {proc}
                        </span>
                      ))}
                      {item.procedures.length > 2 && (
                        <span className={styles.procMoreTag}>
                          +{item.procedures.length - 2} more
                        </span>
                      )}
                    </div>
                  ) : item.description ? (
                    <p className={styles.itemDesc} title={item.description}>{item.description}</p>
                  ) : (
                    <div className={styles.procChipsList} />
                  )}
                </div>

                <div className={styles.cardFooter}>
                  <div
                    className={styles.insurancePill}
                    style={{
                      backgroundColor: theme.badgeBg,
                      color: theme.badgeText
                    }}
                    title={item.insuranceDetails?.coveragePercent || 'Cashless Available'}
                  >
                    <ShieldCheck size={12} style={{ flexShrink: 0 }} />
                    <span className={styles.insuranceText}>
                      {item.insuranceDetails?.coveragePercent || 'Cashless Available'}
                    </span>
                  </div>

                  {item.insuranceDetails?.preAuthHours && (
                    <span className={styles.preAuthTag} title="TPA Pre-Approval Timeline">
                      ⚡ {item.insuranceDetails.preAuthHours.replace('Pre-Approval', '').replace('Pre-Auth', '').replace('Emergency', '').trim()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <Search size={32} color="#94a3b8" />
          <h4 className={styles.emptyTitle}>No matching {activeTab} found</h4>
          <p className={styles.emptySubtitle}>
            Try searching with a different keyword or reset your filter.
          </p>
          <button
            type="button"
            className={styles.resetBtn}
            onClick={() => setSearchQuery('')}
          >
            Clear Search Filter
          </button>
        </div>
      )}

      {/* View All / Show Less Toggle Button */}
      {filteredList.length > 8 && !searchQuery.trim() && (
        <div className={styles.viewAllRow}>
          <button
            type="button"
            className={styles.viewAllBtn}
            onClick={() => setShowAll(prev => !prev)}
            aria-expanded={showAll}
          >
            <span>
              {showAll
                ? `Show Less (Top 8 ${activeTab === 'specialities' ? 'Specialities' : 'Procedures'})`
                : `View All ${filteredList.length} ${activeTab === 'specialities' ? 'Clinical Specialities' : 'Surgical Procedures'}`}
            </span>
            {showAll ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      )}

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
    </div>
  );
};

export default SpecialitiesProceduresSection;
