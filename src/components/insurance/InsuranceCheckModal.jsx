import React, { useState, useMemo } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  PhoneCall,
  Sparkles,
  Building2,
  ChevronRight,
  Search,
  MapPin,
  Filter,
  Check
} from 'lucide-react';
import { useData } from '../../context/useData';
import { insurancePartners, defaultAcceptedInsurances } from '../../data/insurancePartners';
import styles from './InsuranceCheckModal.module.css';

const InsuranceCheckModal = ({ initialItem, initialInsurer, initialHospital, initialTab = 'search', onClose, onNavigate }) => {
  const { hospitals, specialitiesProcedures } = useData();

  const [activeTab, setActiveTab] = useState(initialTab); // 'search' | 'eligibility'

  // Search State
  const [searchInsQuery, setSearchInsQuery] = useState(initialInsurer || '');
  const [selectedCity, setSelectedCity] = useState('');

  // Eligibility Form State
  const [treatment, setTreatment] = useState(initialItem ? initialItem.name : (specialitiesProcedures[0]?.name || 'Robotic Knee Replacement'));
  const [selectedHospital, setSelectedHospital] = useState(initialHospital || hospitals[0]?.name || 'Apollo Hospitals');
  const [insurer, setInsurer] = useState(initialInsurer || 'Star Health & Allied Insurance');
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [sumInsured, setSumInsured] = useState('500000');
  const [submitted, setSubmitted] = useState(false);

  // Collect unique cities across hospitals
  const uniqueCities = useMemo(() => {
    return Array.from(new Set(hospitals.map(h => h.city).filter(Boolean))).sort();
  }, [hospitals]);

  // Filter hospitals based on insurance search query and city
  const matchingHospitals = useMemo(() => {
    return hospitals.filter((h) => {
      // City check
      if (selectedCity && h.city && h.city.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }

      // Insurance check
      if (searchInsQuery.trim()) {
        const q = searchInsQuery.toLowerCase().trim();
        const accepted = Array.isArray(h.acceptedInsurances) && h.acceptedInsurances.length > 0
          ? h.acceptedInsurances
          : defaultAcceptedInsurances;

        const hasMatch = accepted.some(
          (ins) => ins.toLowerCase().includes(q) || q.includes(ins.toLowerCase())
        );

        const hospitalNameMatch = h.name && h.name.toLowerCase().includes(q);

        if (!hasMatch && !hospitalNameMatch) return false;
      }

      return true;
    });
  }, [hospitals, searchInsQuery, selectedCity]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleSelectHospitalForPreAuth = (hName, insName = null) => {
    setSelectedHospital(hName);
    if (insName) setInsurer(insName);
    setActiveTab('eligibility');
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        {/* Modal Tab Switcher */}
        <div className={styles.topTabsNav}>
          <button
            type="button"
            className={`${styles.topTabBtn} ${activeTab === 'search' ? styles.topTabBtnActive : ''}`}
            onClick={() => setActiveTab('search')}
          >
            <Search size={16} />
            <span>Search Hospital Insurances</span>
          </button>

          <button
            type="button"
            className={`${styles.topTabBtn} ${activeTab === 'eligibility' ? styles.topTabBtnActive : ''}`}
            onClick={() => setActiveTab('eligibility')}
          >
            <ShieldCheck size={16} />
            <span>Check Cashless Pre-Auth</span>
          </button>
        </div>

        {/* TAB 1: SEARCH AVAILABLE INSURANCES ACROSS HOSPITALS */}
        {activeTab === 'search' && (
          <div className={styles.searchSection}>
            <div className={styles.header}>
              <div className={styles.insBadge}>
                <ShieldCheck size={16} color="#059669" />
                <span>Search 100% Cashless Empaneled Networks</span>
              </div>
              <h2 className={styles.title}>Find Hospitals by Accepted Insurance</h2>
              <p className={styles.subtitle}>
                Search any health insurance company or TPA to discover verified partner hospitals with cashless admission desks.
              </p>
            </div>

            {/* Search and City Inputs */}
            <div className={styles.searchBarRow}>
              <div className={styles.searchInputWrap}>
                <Search size={18} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search insurance (e.g. Star Health, HDFC ERGO, Care Health, ICICI Lombard)..."
                  value={searchInsQuery}
                  onChange={(e) => setSearchInsQuery(e.target.value)}
                  className={styles.searchInputField}
                />
                {searchInsQuery && (
                  <button
                    type="button"
                    className={styles.clearSearchBtn}
                    onClick={() => setSearchInsQuery('')}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <div className={styles.citySelectWrap}>
                <MapPin size={16} className={styles.cityIcon} />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className={styles.citySelect}
                >
                  <option value="">All Cities</option>
                  {uniqueCities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Insurance Filter Pills */}
            <div className={styles.quickPillsWrap}>
              <span className={styles.quickPillsLabel}>Popular Insurers & TPAs:</span>
              <div className={styles.pillsScroll}>
                {insurancePartners.map((partner) => {
                  const isSelected = searchInsQuery.toLowerCase().includes(partner.name.toLowerCase().split(' ')[0]);
                  return (
                    <button
                      key={partner.id}
                      type="button"
                      className={`${styles.insPill} ${isSelected ? styles.insPillActive : ''}`}
                      onClick={() => setSearchInsQuery(partner.name.split(' ')[0])}
                    >
                      {partner.name.split(' ')[0]} {partner.name.split(' ')[1] || ''}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hospital Results Count */}
            <div className={styles.resultsInfoRow}>
              <span>
                Found <strong>{matchingHospitals.length}</strong> {matchingHospitals.length === 1 ? 'hospital' : 'hospitals'}
                {searchInsQuery ? ` accepting "${searchInsQuery}"` : ' with cashless insurance support'}
                {selectedCity ? ` in ${selectedCity}` : ''}
              </span>
              {(searchInsQuery || selectedCity) && (
                <button
                  type="button"
                  className={styles.resetSearchLink}
                  onClick={() => {
                    setSearchInsQuery('');
                    setSelectedCity('');
                  }}
                >
                  Reset Search
                </button>
              )}
            </div>

            {/* Hospital Cards List */}
            <div className={styles.hospitalsList}>
              {matchingHospitals.length === 0 ? (
                <div className={styles.emptyResults}>
                  <ShieldCheck size={40} color="#94a3b8" />
                  <h4>No hospitals found matching "{searchInsQuery}"</h4>
                  <p>Our partner network continually adds TPAs. Try searching for a different insurance provider or clear filters.</p>
                  <button
                    type="button"
                    className={styles.resetBtn}
                    onClick={() => {
                      setSearchInsQuery('');
                      setSelectedCity('');
                    }}
                  >
                    View All Partner Hospitals
                  </button>
                </div>
              ) : (
                matchingHospitals.map((hosp) => {
                  const acceptedList = Array.isArray(hosp.acceptedInsurances) && hosp.acceptedInsurances.length > 0
                    ? hosp.acceptedInsurances
                    : defaultAcceptedInsurances;

                  return (
                    <div key={hosp.id || hosp._id} className={styles.hospitalCard}>
                      <div className={styles.hospMainRow}>
                        <div className={styles.hospImgWrap}>
                          <img
                            src={hosp.image}
                            alt={hosp.name}
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=300&q=80';
                            }}
                          />
                        </div>

                        <div className={styles.hospInfoCol}>
                          <div className={styles.hospTitleRow}>
                            <h4 className={styles.hospName}>{hosp.name}</h4>
                            <span className={styles.cashlessBadge}>
                              <CheckCircle2 size={13} /> 100% Cashless
                            </span>
                          </div>

                          <div className={styles.hospMetaRow}>
                            {hosp.city && (
                              <span className={styles.hospMetaItem}>
                                <MapPin size={13} /> {hosp.city}
                              </span>
                            )}
                            <span className={styles.hospMetaItem}>
                              <Clock size={13} color="#059669" />
                              {hosp.tpaHelpdesk?.preAuthTime || '30 Mins Pre-Approval'}
                            </span>
                          </div>

                          <p className={styles.hospAddress}>{hosp.address}</p>

                          {/* Accepted Insurances Tag List */}
                          <div className={styles.acceptedInsurancesBox}>
                            <span className={styles.acceptedLabel}>Accepted Insurances & TPAs:</span>
                            <div className={styles.insuranceTagsList}>
                              {acceptedList.map((insName, iIdx) => {
                                const isSearched = searchInsQuery && insName.toLowerCase().includes(searchInsQuery.toLowerCase().trim());
                                return (
                                  <span
                                    key={iIdx}
                                    className={`${styles.insTag} ${isSearched ? styles.insTagHighlighted : ''}`}
                                  >
                                    <Check size={11} /> {insName}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className={styles.cardActionsRow}>
                        <button
                          type="button"
                          className={styles.checkPreAuthBtn}
                          onClick={() => handleSelectHospitalForPreAuth(hosp.name, searchInsQuery || 'Star Health & Allied Insurance')}
                        >
                          <ShieldCheck size={15} />
                          <span>Check Cashless Pre-Auth</span>
                        </button>

                        <button
                          type="button"
                          className={styles.viewCenterBtn}
                          onClick={() => {
                            onClose();
                            if (onNavigate) {
                              onNavigate('hospital-profile', hosp.id || hosp._id);
                            }
                          }}
                        >
                          <span>View Hospital Center</span>
                          <ChevronRight size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ELIGIBILITY CHECK FORM */}
        {activeTab === 'eligibility' && (
          <div>
            {!submitted ? (
              <div>
                <div className={styles.header}>
                  <div className={styles.insBadge}>
                    <ShieldCheck size={16} color="#059669" />
                    <span>Instant Cashless Eligibility Check</span>
                  </div>
                  <h2 className={styles.title}>Check Surgery & Hospital Insurance Coverage</h2>
                  <p className={styles.subtitle}>
                    Get real-time pre-authorization estimation and 100% cashless support from our TPA hospital desk.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Treatment / Surgery / Speciality</label>
                      <select
                        value={treatment}
                        onChange={(e) => setTreatment(e.target.value)}
                        className={styles.input}
                        required
                      >
                        {specialitiesProcedures.map((sp) => (
                          <option key={sp.id || sp._id} value={sp.name}>
                            {sp.name} ({sp.type === 'procedure' ? 'Surgery' : 'Speciality'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Preferred Network Hospital</label>
                      <select
                        value={selectedHospital}
                        onChange={(e) => setSelectedHospital(e.target.value)}
                        className={styles.input}
                      >
                        {hospitals.map((h) => (
                          <option key={h.id || h._id} value={h.name}>
                            {h.name} ({h.city || 'Bengaluru'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Your Insurance Provider / TPA</label>
                      <select
                        value={insurer}
                        onChange={(e) => setInsurer(e.target.value)}
                        className={styles.input}
                        required
                      >
                        {insurancePartners.map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.name} ({p.turnaround} TAT)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Approximate Policy Sum Insured</label>
                      <select
                        value={sumInsured}
                        onChange={(e) => setSumInsured(e.target.value)}
                        className={styles.input}
                      >
                        <option value="300000">₹3,00,000</option>
                        <option value="500000">₹5,00,000</option>
                        <option value="1000000">₹10,00,000</option>
                        <option value="1500000">₹15,00,000+</option>
                        <option value="corporate">Corporate Group Mediclaim</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Patient Full Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Ramesh Kumar"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        className={styles.input}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Mobile Number for Pre-Auth Updates</label>
                      <input
                        type="tel"
                        placeholder="e.g. 9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={styles.input}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.infoHighlights}>
                    <div className={styles.highlightPill}>
                      <CheckCircle2 size={15} color="#059669" /> 100% Cashless Settlement
                    </div>
                    <div className={styles.highlightPill}>
                      <Clock size={15} color="#2563eb" /> 30-min Fast Pre-Approval
                    </div>
                    <div className={styles.highlightPill}>
                      <CreditCard size={15} color="#0d9488" /> 0% No-Cost EMI Backup
                    </div>
                  </div>

                  <button type="submit" className={styles.submitBtn}>
                    <span>Check Eligibility & Claim Assistance</span>
                    <ChevronRight size={18} />
                  </button>
                </form>
              </div>
            ) : (
              <div className={styles.successState}>
                <div className={styles.successIcon}>
                  <CheckCircle2 size={54} color="#059669" />
                </div>
                <h3 className={styles.successTitle}>Insurance Pre-Eligibility Confirmed!</h3>
                <p className={styles.successDesc}>
                  Thank you, <strong>{patientName}</strong>! Your selected procedure <strong>{treatment}</strong> at{' '}
                  <strong>{selectedHospital}</strong> is eligible for <strong>100% Cashless Hospitalization</strong> under{' '}
                  <strong>{insurer}</strong>.
                </p>

                <div className={styles.summaryCard}>
                  <div className={styles.summaryRow}>
                    <span>Coverage Status:</span>
                    <strong style={{ color: '#059669' }}>Eligible (Up to 100% Cashless)</strong>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Pre-Auth Turnaround:</span>
                    <strong>~25 - 30 minutes at Hospital Desk</strong>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Dedicated TPA Coordinator:</span>
                    <strong>Assigned to your phone ({phone})</strong>
                  </div>
                </div>

                <div className={styles.nextSteps}>
                  <h4>What happens next?</h4>
                  <ul>
                    <li>Our Hospital Insurance Coordinator will call you shortly to assist with pre-auth documents.</li>
                    <li>Zero paperwork hassle — our hospital desk coordinates directly with {insurer}.</li>
                    <li>0% EMI facility is available for non-medical expenses.</li>
                  </ul>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button
                    type="button"
                    className={styles.doneBtn}
                    onClick={() => {
                      setSubmitted(false);
                      setActiveTab('search');
                    }}
                    style={{ background: '#f1f5f9', color: '#334155' }}
                  >
                    Search Another Insurance
                  </button>
                  <button type="button" className={styles.doneBtn} onClick={onClose}>
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InsuranceCheckModal;
