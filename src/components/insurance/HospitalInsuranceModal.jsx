import React, { useState, useMemo } from 'react';
import { X, ShieldCheck, Search, Clock, Phone, CheckCircle2 } from 'lucide-react';
import { defaultAcceptedInsurances } from '../../data/insurancePartners';
import styles from './HospitalInsuranceModal.module.css';

const HospitalInsuranceModal = ({ hospital, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Get accepted insurances for this hospital only
  const acceptedList = useMemo(() => {
    if (!hospital) return defaultAcceptedInsurances;
    if (Array.isArray(hospital.acceptedInsurances) && hospital.acceptedInsurances.length > 0) {
      return hospital.acceptedInsurances;
    }
    return defaultAcceptedInsurances;
  }, [hospital]);

  // Filter accepted insurances by user query
  const filteredInsurances = useMemo(() => {
    if (!searchQuery.trim()) return acceptedList;
    const q = searchQuery.toLowerCase().trim();
    return acceptedList.filter((ins) => ins.toLowerCase().includes(q));
  }, [acceptedList, searchQuery]);

  if (!hospital) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <div className={styles.badge}>
              <ShieldCheck size={14} /> 100% Cashless Empaneled
            </div>
            <h2 className={styles.title}>Insurances Accepted at {hospital.name}</h2>
            <p className={styles.subtitle}>
              The following health insurance providers and TPAs are accepted for cashless admission and treatment pre-approval at this hospital.
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* TPA Turnaround & Helpline Bar */}
        <div className={styles.metaBar}>
          <div className={styles.metaItem}>
            <Clock size={16} className={styles.metaIcon} />
            <div>
              <span className={styles.metaLabel}>Pre-Auth Turnaround</span>
              <strong>{hospital.tpaHelpdesk?.preAuthTime || '30 Mins Cashless Pre-Approval'}</strong>
            </div>
          </div>
          {(hospital.tpaHelpdesk?.phone || hospital.phone) && (
            <div className={styles.metaItem}>
              <Phone size={16} className={styles.metaIcon} />
              <div>
                <span className={styles.metaLabel}>Hospital TPA Helpdesk</span>
                <strong>{hospital.tpaHelpdesk?.phone || hospital.phone}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Search within this hospital's insurances */}
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search your insurance (e.g. Star Health, HDFC ERGO, Care...)"
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searchQuery && (
            <button className={styles.clearSearchBtn} onClick={() => setSearchQuery('')} aria-label="Clear search">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Insurances List */}
        <div className={styles.body}>
          <div className={styles.listHeader}>
            <span>Accepted Insurances ({filteredInsurances.length})</span>
            <span className={styles.cashlessTag}>✓ 100% Cashless Pre-Approved</span>
          </div>

          {filteredInsurances.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No insurance matching "<strong>{searchQuery}</strong>" found for {hospital.name}.</p>
              <span>Please contact the hospital TPA helpdesk at {hospital.tpaHelpdesk?.phone || hospital.phone} to inquire about reimbursement or custom cashless approval.</span>
            </div>
          ) : (
            <div className={styles.insuranceGrid}>
              {filteredInsurances.map((ins, idx) => (
                <div key={idx} className={styles.insuranceCard}>
                  <div className={styles.cardLeft}>
                    <CheckCircle2 size={17} className={styles.checkIcon} />
                    <span className={styles.insName}>{ins}</span>
                  </div>
                  <span className={styles.cardCashlessBadge}>Cashless</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <p className={styles.footerNote}>
            Present your insurance e-card or TPA card at the hospital admission desk for instant pre-authorization.
          </p>
          <button type="button" className={styles.doneBtn} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default HospitalInsuranceModal;
