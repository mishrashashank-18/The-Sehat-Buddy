import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ExternalLink,
  Users,
  CheckCircle2,
  Calendar,
  Clock,
  IndianRupee,
  Building2,
  Star,
  Search,
  Filter,
  Video,
  FileText,
  Stethoscope,
  Pill,
  Sparkles,
  Phone,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { useData } from '../../context/useData';
import { matchesId } from '../../context/DataContext';
import { getDoctorVerifiedReviews } from '../doctors/DoctorProfile';
import {
  dedupeAppointments,
  isMockPatientAppointment,
  isMockPrescriptionItem
} from '../doctor-dashboard/DoctorDashboard';
import styles from './DoctorHistoryModal.module.css';

const DoctorHistoryModal = ({ doctor, onClose }) => {
  const { doctors, reviews } = useData();
  const liveDoc = useMemo(() => {
    return (doctors || []).find(d => matchesId(d, doctor?.id || doctor?._id)) || doctor || {};
  }, [doctors, doctor]);

  const liveRating = useMemo(() => {
    const verifiedReviews = getDoctorVerifiedReviews(liveDoc, reviews);
    const count = verifiedReviews.length;

    let score = '0';
    if (count > 0) {
      const total = verifiedReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0);
      score = (total / count).toFixed(1);
    }

    return { score, count: `${count} ${count === 1 ? 'review' : 'reviews'}` };
  }, [liveDoc, reviews]);

  const [activeTab, setActiveTab] = useState('consultations'); // 'consultations' | 'prescriptions'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

  // Collect doctor storage keys matching email, numeric ID, and Mongo ID
  const storageKeys = useMemo(() => {
    if (!doctor) return [];
    const keys = new Set();
    const email = (doctor.email || '').toLowerCase().trim();
    if (email) keys.add(`sehatbuddy_doc_appointments_${email}`);
    if (doctor.id !== undefined && doctor.id !== null) keys.add(`sehatbuddy_doc_appointments_${doctor.id}`);
    if (doctor._id) keys.add(`sehatbuddy_doc_appointments_${doctor._id}`);

    // If Dr. Rahul Verma (flagship doctor), check default fallback keys
    if (
      email === 'dr.rahul@sehatbuddy.com' ||
      String(doctor.id) === '1' ||
      (doctor.name && doctor.name.toLowerCase().includes('rahul verma'))
    ) {
      keys.add('sehatbuddy_doc_appointments_1');
      keys.add('sehatbuddy_doc_appointments_default');
    }
    return Array.from(keys);
  }, [doctor]);

  // Load all consultations & prescriptions for this doctor
  const loadDoctorData = async () => {
    if (!doctor) return;
    setIsLoading(true);

    try {
      const docLookupId = doctor._id || doctor.id;
      const docEmail = doctor.email;

      // 1. Remote consultations from MongoDB
      let remoteList = [];
      try {
        const res = await api.getDoctorDashboard(docLookupId, docEmail);
        if (Array.isArray(res)) {
          remoteList = res
            .filter(apt => !isMockPatientAppointment(apt))
            .map(apt => {
              const rawDate = apt.slotDate || apt.dateStr || apt.date || '';
              const isCompleted = apt.isCompleted === true || apt.status === 'Completed' || String(apt.status).toLowerCase() === 'completed';
              return {
                id: apt._id || apt.id,
                _id: apt._id,
                patientName: apt.userData?.name || apt.patientName || 'Patient',
                age: apt.userData?.age || apt.age || 30,
                gender: apt.userData?.gender || apt.gender || 'Not specified',
                phone: apt.userData?.phone || apt.patientPhone || apt.phone || '—',
                time: apt.slotTime || apt.time || '10:00 AM',
                date: rawDate,
                dateStr: rawDate,
                slotDate: rawDate,
                slotTime: apt.slotTime || apt.time || '10:00 AM',
                amount: Number(apt.amount) || Number(doctor.price ?? doctor.fees) || 500,
                type: apt.consultationType || 'In-Clinic',
                symptoms: apt.symptoms || apt.userData?.symptoms || 'Clinical Consultation',
                status: isCompleted ? 'Completed' : (apt.cancelled ? 'Cancelled' : (apt.status || 'Confirmed')),
                isCompleted,
                createdAt: apt.createdAt || apt.date || new Date().toISOString()
              };
            });
        }
      } catch (err) {
        console.warn('Failed to load remote doctor dashboard:', err);
      }

      // 2. Local public site bookings (sehat_buddy_appointments)
      let userBookings = [];
      try {
        const raw = localStorage.getItem('sehat_buddy_appointments');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            userBookings = parsed
              .filter(b => {
                if (isMockPatientAppointment(b)) return false;
                if (matchesId(doctor, b.docId)) return true;
                if (b.doctorName && doctor.name && b.doctorName.toLowerCase().trim() === doctor.name.toLowerCase().trim()) return true;
                return false;
              })
              .map(b => {
                const rawDate = b.slotDate || b.dateStr || b.date || '';
                const isCompleted = b.status === 'Completed' || b.isCompleted === true || String(b.status).toLowerCase() === 'completed';
                return {
                  id: b.id || b._id,
                  _id: b._id,
                  patientName: b.patientName || 'Patient',
                  age: b.age || 30,
                  gender: b.gender || 'Not specified',
                  phone: b.patientPhone || b.phone || '—',
                  time: b.slotTime || b.time || '10:00 AM',
                  date: rawDate,
                  dateStr: rawDate,
                  slotDate: rawDate,
                  slotTime: b.slotTime || b.time || '10:00 AM',
                  amount: Number(b.amount || b.fee) || Number(doctor.price ?? doctor.fees) || 500,
                  type: b.consultationType || 'In-Clinic',
                  symptoms: b.symptoms || 'General Consultation',
                  status: isCompleted ? 'Completed' : (b.status || 'Confirmed'),
                  isCompleted,
                  createdAt: b.bookedAt || b.createdAt || new Date().toISOString()
                };
              });
          }
        }
      } catch {}

      // 3. Local doctor dashboard appointments from doctor storage keys
      let docLocalApts = [];
      try {
        for (const k of storageKeys) {
          const saved = localStorage.getItem(k);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              const clean = parsed.filter(a => !isMockPatientAppointment(a));
              docLocalApts.push(...clean);
            }
          }
        }
      } catch {}

      // Combine and deduplicate consultations
      const combined = dedupeAppointments([...remoteList, ...userBookings, ...docLocalApts]);
      // Sort newest to oldest
      combined.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
      setAppointments(combined);

      // 4. Prescriptions
      let docRx = [];
      try {
        for (const k of storageKeys) {
          const rxKey = k.replace('appointments', 'prescriptions');
          const savedRx = localStorage.getItem(rxKey);
          if (savedRx) {
            const parsed = JSON.parse(savedRx);
            if (Array.isArray(parsed)) {
              const clean = parsed.filter(r => !isMockPrescriptionItem(r));
              docRx.push(...clean);
            }
          }
        }
      } catch {}
      setPrescriptions(docRx);

    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDoctorData();
  }, [doctor]);

  // Calculations & Statistics
  const completedConsultations = useMemo(() => {
    return appointments.filter(a => a.isCompleted || a.status === 'Completed');
  }, [appointments]);

  const totalEarnings = useMemo(() => {
    return completedConsultations.reduce((sum, a) => {
      const amt = Number(a.amount || a.fee) || Number(doctor?.price ?? doctor?.fees) || 500;
      return sum + amt;
    }, 0);
  }, [completedConsultations, doctor]);

  const confirmedCount = useMemo(() => {
    return appointments.filter(a => !a.isCompleted && a.status !== 'Completed' && a.status !== 'Cancelled').length;
  }, [appointments]);

  // Filtered consultations
  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'Completed' && !(apt.isCompleted || apt.status === 'Completed')) return false;
        if (statusFilter === 'Confirmed' && (apt.isCompleted || apt.status === 'Completed' || apt.status === 'Cancelled')) return false;
        if (statusFilter === 'Cancelled' && apt.status !== 'Cancelled') return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const pName = (apt.patientName || '').toLowerCase();
        const pPhone = (apt.phone || '').toLowerCase();
        const symptoms = (apt.symptoms || '').toLowerCase();
        return pName.includes(q) || pPhone.includes(q) || symptoms.includes(q);
      }
      return true;
    });
  }, [appointments, statusFilter, searchQuery]);

  if (!doctor) return null;

  const publicProfileUrl = `/doctors/${doctor.id || doctor._id}`;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.docProfileGroup}>
            <img
              src={liveDoc.image || doctor.image}
              alt={liveDoc.name || doctor.name}
              className={styles.docAvatar}
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=150&q=80';
              }}
            />
            <div className={styles.docMeta}>
              <div className={styles.docNameRow}>
                <h2 className={styles.docName}>{liveDoc.name || doctor.name}</h2>
                <span className={styles.specialtyPill}>{liveDoc.specialty || liveDoc.specialization || doctor.specialty || doctor.specialization}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.76rem', color: '#b45309', background: '#fef3c7', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                  <Star size={12} fill="#f59e0b" color="#f59e0b" />
                  {liveRating.score} ({liveRating.count})
                </span>
              </div>
              <p className={styles.docSubText}>
                {(liveDoc.degree || doctor.degree) && <span>{liveDoc.degree || doctor.degree} •</span>}
                {typeof liveDoc.experience === 'number' || !isNaN(Number(liveDoc.experience)) ? (
                  <span>{liveDoc.experience}+ Years Experience</span>
                ) : (
                  <span>{liveDoc.experience || doctor.experience || 'Experienced'}</span>
                )}
                <span>•</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Building2 size={13} color="#64748b" />
                  {liveDoc.hospital || doctor.hospital || 'Apollo Hospitals'}
                </span>
              </p>
            </div>
          </div>

          <div className={styles.headerActions}>
            <a
              href={publicProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.publicProfileBtn}
              title="Open public doctor profile in a new tab"
            >
              <ExternalLink size={15} />
              <span>View Public Profile</span>
            </a>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              title="Close history modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className={styles.modalBody}>
          {/* KPI Stats Cards */}
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconWrap} ${styles.kpiGreen}`}>
                <CheckCircle2 size={22} />
              </div>
              <div className={styles.kpiContent}>
                <span className={styles.kpiLabel}>Patients Done</span>
                <div className={styles.kpiValue}>
                  {completedConsultations.length}
                </div>
                <span className={styles.kpiSub}>
                  {confirmedCount} scheduled / confirmed
                </span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconWrap} ${styles.kpiBlue}`}>
                <IndianRupee size={22} />
              </div>
              <div className={styles.kpiContent}>
                <span className={styles.kpiLabel}>Total Revenue</span>
                <div className={styles.kpiValue}>
                  ₹{totalEarnings.toLocaleString('en-IN')}
                </div>
                <span className={styles.kpiSub}>
                  From completed consultations
                </span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconWrap} ${styles.kpiAmber}`}>
                <Clock size={22} />
              </div>
              <div className={styles.kpiContent}>
                <span className={styles.kpiLabel}>Consultation Fee</span>
                <div className={styles.kpiValue}>
                  ₹{doctor.price || doctor.fees || 500}
                </div>
                <span className={styles.kpiSub}>
                  Per patient consultation
                </span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div className={`${styles.kpiIconWrap} ${styles.kpiPurple}`}>
                <Calendar size={22} />
              </div>
              <div className={styles.kpiContent}>
                <span className={styles.kpiLabel}>OPD Slot Duration</span>
                <div className={styles.kpiValue}>
                  {doctor.slotDuration || 20} mins
                </div>
                <span className={styles.kpiSub} title={doctor.availableDays}>
                  {doctor.availableDays || 'Mon - Sat (10am - 4pm)'}
                </span>
              </div>
            </div>
          </div>

          {/* Toolbar: Tabs, Search, Filter & Refresh */}
          <div className={styles.toolbarRow}>
            <div className={styles.tabList}>
              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === 'consultations' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('consultations')}
              >
                <Users size={15} />
                <span>Patient Consultations ({appointments.length})</span>
              </button>
              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === 'prescriptions' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('prescriptions')}
              >
                <Pill size={15} />
                <span>Prescriptions ({prescriptions.length})</span>
              </button>
            </div>

            <div className={styles.searchFilterGroup}>
              <div className={styles.searchBox}>
                <Search size={15} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="Search patient, symptoms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {activeTab === 'consultations' && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={styles.statusSelect}
                >
                  <option value="all">All Statuses ({appointments.length})</option>
                  <option value="Completed">Completed ({completedConsultations.length})</option>
                  <option value="Confirmed">Confirmed / Upcoming ({confirmedCount})</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              )}

              <button
                type="button"
                onClick={loadDoctorData}
                className={styles.closeBtn}
                title="Refresh history data"
                style={{ width: '32px', height: '32px' }}
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* TAB 1: Patient Consultations Table */}
          {activeTab === 'consultations' && (
            <div className={styles.tableContainer}>
              {filteredAppointments.length === 0 ? (
                <div className={styles.emptyState}>
                  <Users size={40} className={styles.emptyIcon} />
                  <h4 className={styles.emptyTitle}>No Consultations Found</h4>
                  <p className={styles.emptySubtitle}>
                    {searchQuery || statusFilter !== 'all'
                      ? 'No patient consultations match your current search or status filter.'
                      : `Dr. ${doctor.name.replace('Dr. ', '')} does not have any recorded consultations yet. Any patients booked online or registered at clinic will appear here automatically.`}
                  </p>
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Date & Time</th>
                      <th>Duration</th>
                      <th>Type</th>
                      <th>Fee Paid</th>
                      <th>Symptoms / Notes</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.map((apt, idx) => {
                      const isComp = apt.isCompleted || apt.status === 'Completed';
                      const isCanc = apt.status === 'Cancelled';
                      const fee = Number(apt.amount || apt.fee) || Number(doctor.price ?? doctor.fees) || 500;
                      const initial = (apt.patientName || 'P').charAt(0).toUpperCase();

                      return (
                        <tr key={apt.id || apt._id || idx}>
                          <td>
                            <div className={styles.patientCell}>
                              <div className={styles.patientAvatar}>{initial}</div>
                              <div>
                                <div className={styles.patientName}>{apt.patientName}</div>
                                <div className={styles.patientDetails}>
                                  {apt.age ? `${apt.age}y` : ''}{apt.gender && apt.gender !== 'Not specified' ? ` • ${apt.gender}` : ''}
                                  {apt.phone && apt.phone !== '—' && ` • ${apt.phone}`}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>
                              {apt.slotDate || apt.dateStr || apt.date || 'Today'}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Clock size={11} />
                              {apt.slotTime || apt.time}
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
                              {doctor.slotDuration || 20} mins
                            </span>
                          </td>
                          <td>
                            {apt.type?.toLowerCase().includes('video') ? (
                              <span className={`${styles.typeBadge} ${styles.typeVideo}`}>
                                <Video size={12} /> Video
                              </span>
                            ) : (
                              <span className={`${styles.typeBadge} ${styles.typeClinic}`}>
                                <Building2 size={12} /> In-Clinic
                              </span>
                            )}
                          </td>
                          <td>
                            <span className={styles.amountHighlight}>₹{fee}</span>
                          </td>
                          <td>
                            <span style={{ color: '#475569', fontSize: '0.78rem', maxWidth: '240px', display: 'inline-block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={apt.symptoms}>
                              {apt.symptoms || 'General Consultation'}
                            </span>
                          </td>
                          <td>
                            {isComp ? (
                              <span className={`${styles.statusBadge} ${styles.statusCompleted}`}>
                                <CheckCircle2 size={12} /> Completed
                              </span>
                            ) : isCanc ? (
                              <span className={`${styles.statusBadge} ${styles.statusCancelled}`}>
                                Cancelled
                              </span>
                            ) : (
                              <span className={`${styles.statusBadge} ${styles.statusConfirmed}`}>
                                <Clock size={12} /> Confirmed
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB 2: Prescriptions Table */}
          {activeTab === 'prescriptions' && (
            <div className={styles.tableContainer}>
              {prescriptions.length === 0 ? (
                <div className={styles.emptyState}>
                  <FileText size={40} className={styles.emptyIcon} />
                  <h4 className={styles.emptyTitle}>No Prescriptions Recorded</h4>
                  <p className={styles.emptySubtitle}>
                    Dr. {doctor.name.replace('Dr. ', '')} has not issued any electronic prescriptions yet.
                  </p>
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Patient Name</th>
                      <th>Date</th>
                      <th>Diagnosis</th>
                      <th>Medicines Prescribed</th>
                      <th>Doctor Advice / Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescriptions.map((rx, idx) => (
                      <tr key={rx.id || rx._id || idx}>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{rx.patientName}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            {rx.patientAge ? `${rx.patientAge}y` : ''} {rx.patientGender ? `• ${rx.patientGender}` : ''}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.78rem', color: '#475569' }}>
                            {rx.date || 'Recent'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: '#1d4ed8' }}>
                            {rx.diagnosis || 'Clinical Follow-up'}
                          </span>
                        </td>
                        <td>
                          {Array.isArray(rx.medicines) && rx.medicines.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              {rx.medicines.map((m, mIdx) => (
                                <span key={mIdx} style={{ fontSize: '0.75rem', color: '#334155' }}>
                                  • <strong>{m.name || m}</strong> {m.dosage ? `(${m.dosage})` : ''}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>No medicines recorded</span>
                          )}
                        </td>
                        <td>
                          <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                            {rx.advice || rx.notes || 'Routine follow-up in 2 weeks.'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorHistoryModal;
