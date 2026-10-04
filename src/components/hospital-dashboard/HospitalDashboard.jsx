import React, { useState } from 'react';
import {
  Building2,
  Bed,
  HeartPulse,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  Stethoscope,
  Plus,
  Truck,
  CheckCircle,
  ChevronDown,
  AlertTriangle,
  X
} from 'lucide-react';
import { useData } from '../../context/useData';
import styles from './HospitalDashboard.module.css';

const INITIAL_WARDS = [
  { id: 'icu', name: 'Intensive Care Unit (ICU)', total: 40, occupied: 36, head: 'Dr. Rahul Verma' },
  { id: 'cardiac', name: 'Cardiac Care Wing (CCU)', total: 60, occupied: 52, head: 'Dr. Rahul Verma' },
  { id: 'ortho', name: 'Orthopedics & Joint Care', total: 50, occupied: 38, head: 'Dr. Amit Singh' },
  { id: 'pediatric', name: 'Pediatric & Neonatal Ward', total: 45, occupied: 29, head: 'Dr. Pooja Malhotra' },
  { id: 'gynae', name: 'Maternity & Women Health', total: 55, occupied: 46, head: 'Dr. Neha Sharma' },
  { id: 'general', name: 'General Inpatient Ward', total: 200, occupied: 154, head: 'Chief Medical Officer' }
];

const INITIAL_ER_CASES = [
  { id: 1, patient: 'Sanjay Rawat', triage: 'Red (Critical)', condition: 'Acute MI (Heart Attack)', time: '12 mins ago', doctor: 'Dr. Rahul Verma', bed: 'ER-01' },
  { id: 2, patient: 'Pooja Kashyap', triage: 'Yellow (Urgent)', condition: 'Fractured Femur (Road Accident)', time: '28 mins ago', doctor: 'Dr. Amit Singh', bed: 'ER-04' },
  { id: 3, patient: 'Mohit Sen', triage: 'Green (Stable)', condition: 'High Grade Fever & Dehydration', time: '45 mins ago', doctor: 'Dr. Pooja Malhotra', bed: 'ER-07' }
];

const INITIAL_AMBULANCES = [
  { id: 'DL-01-AB-1001', driver: 'Manoj Kumar', phone: '+91 98111 10001', status: 'Available', location: 'Hospital Base' },
  { id: 'DL-01-AB-1002', driver: 'Rajesh Tyagi', phone: '+91 98111 10002', status: 'Dispatched', location: 'En route: Sector 21' },
  { id: 'DL-01-AB-1003', driver: 'Imran Khan', phone: '+91 98111 10003', status: 'In-Transit', location: 'Patient onboard, returning' },
  { id: 'DL-01-AB-1004', driver: 'Satish Pal', phone: '+91 98111 10004', status: 'Available', location: 'Hospital Base' }
];

const HospitalDashboard = ({ onNavigate }) => {
  const { hospitals, doctors, updateHospital } = useData();

  // Selected hospital
  const [selectedHospitalId, setSelectedHospitalId] = useState(() => hospitals[0]?.id || 1);
  const activeHospital = hospitals.find(h => h.id === selectedHospitalId) || hospitals[0] || {};

  // Tabs: 'beds' | 'doctors' | 'emergency' | 'settings'
  const [activeTab, setActiveTab] = useState('beds');

  // Wards & Bed state
  const [wards, setWards] = useState(INITIAL_WARDS);
  const [erCases] = useState(INITIAL_ER_CASES);
  const [ambulances, setAmbulances] = useState(INITIAL_AMBULANCES);

  // Modals
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [admitData, setAdmitData] = useState({
    patientName: '',
    wardId: 'icu',
    diagnosis: ''
  });

  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Doctors affiliated with this hospital
  const affiliatedDoctors = doctors.filter(
    d => d.hospital?.toLowerCase() === activeHospital.name?.toLowerCase() || !d.hospital
  );

  // Total occupied beds in active hospital
  const totalOccupiedBeds = wards.reduce((sum, w) => sum + w.occupied, 0);
  const totalCapacityBeds = activeHospital.totalBeds || wards.reduce((sum, w) => sum + w.total, 0);
  const occupancyPercent = Math.min(100, Math.round((totalOccupiedBeds / totalCapacityBeds) * 100));

  // Quick actions
  const handleAdmitPatient = (e) => {
    e.preventDefault();
    if (!admitData.patientName.trim()) return;

    setWards(prev =>
      prev.map(w => {
        if (w.id === admitData.wardId && w.occupied < w.total) {
          return { ...w, occupied: w.occupied + 1 };
        }
        return w;
      })
    );

    showToast(`Patient ${admitData.patientName} admitted to ${wards.find(w => w.id === admitData.wardId)?.name}`);
    setIsAdmitModalOpen(false);
    setAdmitData({ patientName: '', wardId: 'icu', diagnosis: '' });
  };

  const handleDischargePatient = (wardId) => {
    setWards(prev =>
      prev.map(w => {
        if (w.id === wardId && w.occupied > 0) {
          return { ...w, occupied: w.occupied - 1 };
        }
        return w;
      })
    );
    showToast('Bed vacated and marked ready for sanitized re-allocation.');
  };

  const handleDispatchAmbulance = (ambId) => {
    setAmbulances(prev =>
      prev.map(a => (a.id === ambId ? { ...a, status: 'Dispatched', location: 'Dispatched to Emergency Call' } : a))
    );
    showToast(`Ambulance ${ambId} dispatched for immediate rescue.`);
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Toast Alert */}
      {toastMessage && (
        <div className={styles.toast}>
          <CheckCircle size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className={styles.topbar}>
        <div className={styles.brandGroup}>
          <div className={styles.logoIcon}>
            <HeartPulse size={26} color="#2563EB" strokeWidth={2.5} />
          </div>
          <div>
            <div className={styles.brandTitleWrap}>
              <span className={styles.brandTitle}>The Sehat Buddy</span>
              <span className={styles.portalBadge}>
                <Building2 size={13} /> Hospital Center
              </span>
            </div>
            <p className={styles.brandSub}>Hospital Operations, Inpatient Wards & ER Triage</p>
          </div>
        </div>

        {/* Hospital Switcher & Portal Switcher */}
        <div className={styles.headerRight}>
          <div className={styles.hospitalSwitcher}>
            <span className={styles.switcherLabel}>Active Facility:</span>
            <div className={styles.selectWrap}>
              <select
                value={selectedHospitalId}
                onChange={(e) => setSelectedHospitalId(Number(e.target.value))}
                className={styles.facilitySelect}
              >
                {hospitals.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.city})
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className={styles.selectIcon} />
            </div>
          </div>

          <div className={styles.quickNavBtns}>
            <button className={styles.navLinkBtn} onClick={() => onNavigate('site')}>
              Website
            </button>
            <button className={styles.navLinkBtn} onClick={() => onNavigate('doctor')}>
              Doctor Portal
            </button>
            <button className={styles.navLinkBtn} onClick={() => onNavigate('admin')}>
              Admin
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className={styles.mainWrapper}>
        {/* Hospital Overview Banner */}
        <div className={styles.facilityBanner}>
          <div className={styles.facilityInfo}>
            <img
              src={activeHospital.image}
              alt={activeHospital.name}
              className={styles.facilityImage}
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=240&q=80';
              }}
            />
            <div className={styles.facilityMeta}>
              <div className={styles.titleRow}>
                <h2>{activeHospital.name}</h2>
                <div className={styles.ratingBadge}>
                  ★ {activeHospital.rating || 4.8}
                </div>
              </div>
              <p className={styles.facilityAddress}>
                <MapPin size={14} /> {activeHospital.address || 'Medical Enclave, City Central'}
              </p>
              <div className={styles.tagGroup}>
                <span className={styles.cityPill}>{activeHospital.city}</span>
                {activeHospital.emergency24x7 && (
                  <span className={styles.emergencyPill}>
                    <ShieldCheck size={12} /> 24/7 Trauma Emergency Ready
                  </span>
                )}
                {activeHospital.phone && (
                  <span className={styles.phonePill}>
                    <Phone size={12} /> {activeHospital.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats on Banner */}
          <div className={styles.occupancyGaugeCard}>
            <div className={styles.gaugeHeader}>
              <span className={styles.gaugeLabel}>Bed Occupancy</span>
              <span className={styles.gaugePercent}>{occupancyPercent}%</span>
            </div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${occupancyPercent}%` }}
              ></div>
            </div>
            <div className={styles.gaugeDetails}>
              <span>{totalOccupiedBeds} Beds Occupied</span>
              <span>{Math.max(0, totalCapacityBeds - totalOccupiedBeds)} Available</span>
            </div>
          </div>
        </div>

        {/* Operational Metrics Cards */}
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIconWrap} ${styles.kpiBlue}`}>
              <Bed size={22} />
            </div>
            <div>
              <span className={styles.kpiLabel}>Total Bed Capacity</span>
              <div className={styles.kpiValue}>{totalCapacityBeds} Beds</div>
              <span className={styles.kpiSub}>Across 6 major wards</span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIconWrap} ${styles.kpiRed}`}>
              <AlertTriangle size={22} />
            </div>
            <div>
              <span className={styles.kpiLabel}>Active Emergency Triage</span>
              <div className={styles.kpiValue}>{erCases.length} Cases</div>
              <span className={styles.kpiSub}>1 Critical (Code Red)</span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIconWrap} ${styles.kpiGreen}`}>
              <Stethoscope size={22} />
            </div>
            <div>
              <span className={styles.kpiLabel}>Affiliated Doctors</span>
              <div className={styles.kpiValue}>{affiliatedDoctors.length} Specialists</div>
              <span className={styles.kpiSub}>Active on clinical roster</span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIconWrap} ${styles.kpiYellow}`}>
              <Truck size={22} />
            </div>
            <div>
              <span className={styles.kpiLabel}>Ambulance Fleet</span>
              <div className={styles.kpiValue}>
                {ambulances.filter(a => a.status === 'Available').length} / {ambulances.length}
              </div>
              <span className={styles.kpiSub}>Emergency Ready</span>
            </div>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className={styles.tabsBar}>
          <div className={styles.tabsList}>
            <button
              className={`${styles.tabBtn} ${activeTab === 'beds' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('beds')}
            >
              <Bed size={18} />
              <span>Wards & Bed Capacity</span>
            </button>

            <button
              className={`${styles.tabBtn} ${activeTab === 'doctors' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('doctors')}
            >
              <Stethoscope size={18} />
              <span>Clinical Roster ({affiliatedDoctors.length})</span>
            </button>

            <button
              className={`${styles.tabBtn} ${activeTab === 'emergency' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('emergency')}
            >
              <AlertTriangle size={18} />
              <span>ER Triage & Fleet</span>
            </button>

            <button
              className={`${styles.tabBtn} ${activeTab === 'settings' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <Building2 size={18} />
              <span>Facility Profile</span>
            </button>
          </div>

          {activeTab === 'beds' && (
            <button
              className={styles.addPrimaryBtn}
              onClick={() => setIsAdmitModalOpen(true)}
            >
              <Plus size={16} /> Admit Patient
            </button>
          )}
        </div>

        {/* TAB 1: BED & WARD MANAGEMENT */}
        {activeTab === 'beds' && (
          <div className={styles.tabContentArea}>
            <div className={styles.wardsGrid}>
              {wards.map((ward) => {
                const percent = Math.round((ward.occupied / ward.total) * 100);
                const isNearCapacity = percent >= 90;

                return (
                  <div key={ward.id} className={styles.wardCard}>
                    <div className={styles.wardHeader}>
                      <div>
                        <h4>{ward.name}</h4>
                        <span className={styles.wardHeadDoctor}>In-charge: {ward.head}</span>
                      </div>
                      <span className={isNearCapacity ? styles.wardAlertBadge : styles.wardNormalBadge}>
                        {isNearCapacity ? 'High Occupancy' : 'Available'}
                      </span>
                    </div>

                    <div className={styles.wardNumbersRow}>
                      <div>
                        <span className={styles.occupiedCount}>{ward.occupied}</span>
                        <span className={styles.totalCount}> / {ward.total} Beds Occupied</span>
                      </div>
                      <span className={styles.wardPercent}>{percent}%</span>
                    </div>

                    <div className={styles.wardProgressBar}>
                      <div
                        className={`${styles.wardProgressFill} ${isNearCapacity ? styles.fillRed : ''}`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>

                    <div className={styles.wardCardFooter}>
                      <span className={styles.vacantCount}>
                        {ward.total - ward.occupied} beds vacant
                      </span>
                      <div className={styles.wardActions}>
                        <button
                          className={styles.dischargeBtn}
                          onClick={() => handleDischargePatient(ward.id)}
                          title="Discharge patient and vacate bed"
                          disabled={ward.occupied === 0}
                        >
                          Discharge 1
                        </button>
                        <button
                          className={styles.quickAdmitBtn}
                          onClick={() => {
                            setAdmitData(prev => ({ ...prev, wardId: ward.id }));
                            setIsAdmitModalOpen(true);
                          }}
                          disabled={ward.occupied >= ward.total}
                        >
                          + Admit
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: DOCTORS ON ROSTER */}
        {activeTab === 'doctors' && (
          <div className={styles.tabContentArea}>
            <div className={styles.doctorsTableCard}>
              <div className={styles.tableHeaderRow}>
                <h3>Medical Specialists Affiliated with {activeHospital.name}</h3>
                <span className={styles.tableCountBadge}>{affiliatedDoctors.length} Doctors</span>
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.rosterTable}>
                  <thead>
                    <tr>
                      <th>Doctor</th>
                      <th>Specialty</th>
                      <th>Qualifications</th>
                      <th>Consultation Fee</th>
                      <th>Weekly Hours</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {affiliatedDoctors.map((doc) => (
                      <tr key={doc.id}>
                        <td>
                          <div className={styles.docCell}>
                            <img
                              src={doc.image}
                              alt={doc.name}
                              className={styles.docAvatar}
                              onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=150&q=80';
                              }}
                            />
                            <div>
                              <span className={styles.docName}>{doc.name}</span>
                              <span className={styles.docContact}>{doc.phone || '+91 98000 00000'}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={styles.specialtyTag}>{doc.specialty}</span>
                        </td>
                        <td>{doc.degree || 'MBBS, MD'}</td>
                        <td>
                          <strong style={{ color: '#2563EB' }}>₹{doc.price}</strong>
                        </td>
                        <td>{doc.availableDays || 'Mon - Fri (10am - 4pm)'}</td>
                        <td>
                          <span className={styles.onDutyBadge}>On Duty</span>
                        </td>
                        <td>
                          <button
                            className={styles.pageDoctorBtn}
                            onClick={() => showToast(`Sent clinical emergency notification to ${doc.name}`)}
                          >
                            Page Doctor
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: EMERGENCY TRIAGE & AMBULANCES */}
        {activeTab === 'emergency' && (
          <div className={styles.tabContentArea}>
            <div className={styles.emergencySplit}>
              {/* ER Queue */}
              <div className={styles.erCard}>
                <div className={styles.boxHeader}>
                  <div>
                    <h4>Active Emergency Triage (ER)</h4>
                    <p>Live trauma and critical care patient admissions</p>
                  </div>
                  <span className={styles.erLiveBadge}>LIVE</span>
                </div>

                <div className={styles.erList}>
                  {erCases.map((c) => (
                    <div key={c.id} className={styles.erItem}>
                      <div className={styles.triageIndicatorWrap}>
                        <span
                          className={`${styles.triageDot} ${
                            c.triage.includes('Red')
                              ? styles.triageRed
                              : c.triage.includes('Yellow')
                              ? styles.triageYellow
                              : styles.triageGreen
                          }`}
                        ></span>
                        <span className={styles.triageLabel}>{c.triage}</span>
                      </div>

                      <div className={styles.erDetails}>
                        <div className={styles.erPatientName}>
                          <strong>{c.patient}</strong> • Bed {c.bed}
                        </div>
                        <p className={styles.erCondition}>{c.condition}</p>
                        <span className={styles.erDoctor}>Attending: {c.doctor}</span>
                      </div>

                      <div className={styles.erMeta}>
                        <span className={styles.erTime}>
                          <Clock size={12} /> {c.time}
                        </span>
                        <button
                          className={styles.erActionBtn}
                          onClick={() => showToast(`Opening ICU charts for ${c.patient}`)}
                        >
                          View Charts
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ambulances */}
              <div className={styles.erCard}>
                <div className={styles.boxHeader}>
                  <div>
                    <h4>Ambulance Fleet & Dispatch</h4>
                    <p>Track ready response units and transit location</p>
                  </div>
                  <span className={styles.fleetBadge}>{ambulances.length} Units</span>
                </div>

                <div className={styles.ambulanceList}>
                  {ambulances.map((amb) => (
                    <div key={amb.id} className={styles.ambItem}>
                      <div className={styles.ambIconWrap}>
                        <Truck size={20} color="#2563EB" />
                      </div>

                      <div className={styles.ambInfo}>
                        <strong>{amb.id}</strong>
                        <span className={styles.ambDriver}>Driver: {amb.driver} • {amb.phone}</span>
                        <span className={styles.ambLocation}>
                          <MapPin size={12} /> {amb.location}
                        </span>
                      </div>

                      <div className={styles.ambActionCol}>
                        <span
                          className={`${styles.ambStatusPill} ${
                            amb.status === 'Available'
                              ? styles.ambAvailable
                              : styles.ambDispatched
                          }`}
                        >
                          {amb.status}
                        </span>

                        {amb.status === 'Available' ? (
                          <button
                            className={styles.dispatchBtn}
                            onClick={() => handleDispatchAmbulance(amb.id)}
                          >
                            Dispatch
                          </button>
                        ) : (
                          <button
                            className={styles.locateBtn}
                            onClick={() => showToast(`Live GPS tracked: ${amb.id} near ${amb.location}`)}
                          >
                            Track GPS
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: FACILITY PROFILE SETTINGS */}
        {activeTab === 'settings' && (
          <div className={styles.tabContentArea}>
            <div className={styles.settingsCard}>
              <h3>Hospital Facility Profile</h3>
              <p>Update hospital contact details, bed count, and accreditation info shown to public visitors.</p>

              <div className={styles.settingsGrid}>
                <div className={styles.formGroup}>
                  <label>Helpline / Emergency Phone</label>
                  <input
                    type="text"
                    value={activeHospital.phone || ''}
                    onChange={(e) => {
                      updateHospital(activeHospital.id, { phone: e.target.value });
                    }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Official Email</label>
                  <input
                    type="email"
                    value={activeHospital.email || ''}
                    onChange={(e) => {
                      updateHospital(activeHospital.id, { email: e.target.value });
                    }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Total Hospital Beds</label>
                  <input
                    type="number"
                    value={activeHospital.totalBeds || 400}
                    onChange={(e) => {
                      updateHospital(activeHospital.id, { totalBeds: Number(e.target.value) });
                    }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Established Year</label>
                  <input
                    type="number"
                    value={activeHospital.establishedYear || 2000}
                    onChange={(e) => {
                      updateHospital(activeHospital.id, { establishedYear: Number(e.target.value) });
                    }}
                  />
                </div>

                <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                  <label>Street Address</label>
                  <input
                    type="text"
                    value={activeHospital.address || ''}
                    onChange={(e) => {
                      updateHospital(activeHospital.id, { address: e.target.value });
                    }}
                  />
                </div>
              </div>

              <div className={styles.settingsSaveRow}>
                <button
                  className={styles.saveBtn}
                  onClick={() => showToast('Hospital facility details saved!')}
                >
                  Save Facility Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Admit Patient Modal */}
      {isAdmitModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAdmitModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Admit Patient & Allocate Inpatient Bed</h3>
              <button onClick={() => setIsAdmitModalOpen(false)} className={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAdmitPatient} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Patient Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={admitData.patientName}
                  onChange={(e) => setAdmitData({ ...admitData, patientName: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Target Ward / Department *</label>
                <select
                  value={admitData.wardId}
                  onChange={(e) => setAdmitData({ ...admitData, wardId: e.target.value })}
                >
                  {wards.map(w => (
                    <option key={w.id} value={w.id} disabled={w.occupied >= w.total}>
                      {w.name} ({w.total - w.occupied} beds available)
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Admission Diagnosis</label>
                <input
                  type="text"
                  placeholder="e.g. Post-operative recovery, Severe Pneumonia"
                  value={admitData.diagnosis}
                  onChange={(e) => setAdmitData({ ...admitData, diagnosis: e.target.value })}
                />
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsAdmitModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn}>
                  Confirm Admission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalDashboard;
