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
  AlertCircle,
  MessageSquare,
  Plus,
  Edit3,
  Trash2
} from 'lucide-react';
import { api } from '../../services/api';
import { useData } from '../../context/useData';
import { matchesId } from '../../context/DataContext';
import { getDoctorVerifiedReviews } from '../doctors/DoctorProfile';
import ExpandableReviewComment from '../common/ExpandableReviewComment';
import ReviewFormModal from './ReviewFormModal';
import {
  dedupeAppointments,
  isMockPatientAppointment,
  isMockPrescriptionItem
} from '../doctor-dashboard/DoctorDashboard';
import styles from './DoctorHistoryModal.module.css';

export const extractDateParts = (item) => {
  if (!item) return { year: '', month: '', day: '', fullDate: '' };
  const raw = String(item.slotDate || item.dateStr || item.date || item.createdAt || item.bookedAt || '').trim();
  if (!raw) return { year: '', month: '', day: '', fullDate: '' };

  // 1. Direct YYYY-MM-DD pattern (e.g. "2026-10-26" or "2026-10-26T...")
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return {
      year: isoMatch[1],
      month: isoMatch[2],
      day: isoMatch[3],
      fullDate: `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`
    };
  }

  // 2. DD-MM-YYYY or DD/MM/YYYY pattern
  const dmyMatch = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return {
      year,
      month,
      day,
      fullDate: `${year}-${month}-${day}`
    };
  }

  // 3. Native Date parse
  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear().toString();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return {
      year,
      month,
      day,
      fullDate: `${year}-${month}-${day}`
    };
  }

  return { year: '', month: '', day: '', fullDate: '' };
};

const DoctorHistoryModal = ({ doctor, initialAppointments = [], onClose }) => {
  const { doctors, reviews, addReview, updateReview, deleteReview } = useData();
  const liveDoc = useMemo(() => {
    return (doctors || []).find(d => matchesId(d, doctor?.id || doctor?._id)) || doctor || {};
  }, [doctors, doctor]);

  const doctorReviews = useMemo(() => {
    return getDoctorVerifiedReviews(liveDoc, reviews);
  }, [liveDoc, reviews]);

  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [reviewToEdit, setReviewToEdit] = useState(null);

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

  // Synchronously compute initial consultations & prescriptions for instant 0ms modal render
  const initialDoctorData = useMemo(() => {
    if (!doctor) return { appointments: [], prescriptions: [] };
    let initialList = [];
    let initialRx = [];

    try {
      // 1. Initial appointments passed from parent AdminPanel
      if (Array.isArray(initialAppointments) && initialAppointments.length > 0) {
        const fromParent = initialAppointments
          .filter(apt => {
            if (isMockPatientAppointment(apt)) return false;
            if (matchesId(doctor, apt.docId || apt.doctorId)) return true;
            if (apt.doctorName && doctor.name && apt.doctorName.toLowerCase().trim() === doctor.name.toLowerCase().trim()) return true;
            if (apt.docData && (matchesId(doctor, apt.docData.id || apt.docData._id) || (doctor.name && apt.docData.name && apt.docData.name.toLowerCase().trim() === doctor.name.toLowerCase().trim()))) return true;
            return false;
          })
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
        initialList.push(...fromParent);
      }

      // 2. Local public site bookings (sehat_buddy_appointments)
      const raw = localStorage.getItem('sehat_buddy_appointments');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const userBookings = parsed
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
          initialList.push(...userBookings);
        }
      }

      // 3. Local doctor dashboard appointments from doctor storage keys
      for (const k of storageKeys) {
        const saved = localStorage.getItem(k);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const clean = parsed.filter(a => !isMockPatientAppointment(a));
            initialList.push(...clean);
          }
        }
        const rxKey = k.replace('appointments', 'prescriptions');
        const savedRx = localStorage.getItem(rxKey);
        if (savedRx) {
          const parsedRx = JSON.parse(savedRx);
          if (Array.isArray(parsedRx)) {
            const cleanRx = parsedRx.filter(r => !isMockPrescriptionItem(r));
            initialRx.push(...cleanRx);
          }
        }
      }
    } catch {}

    const deduped = dedupeAppointments(initialList);
    deduped.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
    return { appointments: deduped, prescriptions: initialRx };
  }, [doctor, storageKeys, initialAppointments]);

  const [activeTab, setActiveTab] = useState('consultations'); // 'consultations' | 'prescriptions' | 'reviews'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedDay, setSelectedDay] = useState('all');
  const [selectedDate, setSelectedDate] = useState(''); // exact 'YYYY-MM-DD'
  const [selectedPreset, setSelectedPreset] = useState('all'); // 'all' | 'today' | 'this_month' | 'this_year'
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [appointments, setAppointments] = useState(initialDoctorData.appointments);
  const [prescriptions, setPrescriptions] = useState(initialDoctorData.prescriptions);

  // Sync internal state if target doctor changes
  const targetDocId = doctor?._id || doctor?.id;
  useEffect(() => {
    if (initialDoctorData.appointments.length > 0) {
      setAppointments(initialDoctorData.appointments);
    }
    if (initialDoctorData.prescriptions.length > 0) {
      setPrescriptions(initialDoctorData.prescriptions);
    }
  }, [targetDocId]);

  // Load all consultations & prescriptions for this doctor
  const loadDoctorData = async (forceShowSpinner = false) => {
    if (!doctor) return;
    if (forceShowSpinner || appointments.length === 0) {
      setIsLoading(true);
    }
    setIsSyncing(true);

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
      setIsSyncing(false);
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

  // Available Years collected from actual appointments
  const availableYears = useMemo(() => {
    const years = new Set();
    appointments.forEach(apt => {
      const { year } = extractDateParts(apt);
      if (year && year.length === 4) years.add(year);
    });
    years.add(new Date().getFullYear().toString());
    return Array.from(years).sort().reverse();
  }, [appointments]);

  // Filtered consultations according to Status, Date/Month/Year presets, and Search
  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'Completed' && !(apt.isCompleted || apt.status === 'Completed')) return false;
        if (statusFilter === 'Confirmed' && (apt.isCompleted || apt.status === 'Completed' || apt.status === 'Cancelled')) return false;
        if (statusFilter === 'Cancelled' && apt.status !== 'Cancelled') return false;
      }

      // Date filtering
      const { year, month, day, fullDate } = extractDateParts(apt);
      const now = new Date();

      if (selectedPreset === 'today') {
        const curY = now.getFullYear().toString();
        const curM = String(now.getMonth() + 1).padStart(2, '0');
        const curD = String(now.getDate()).padStart(2, '0');
        const todayStr = `${curY}-${curM}-${curD}`;
        if (fullDate !== todayStr) return false;
      } else if (selectedPreset === 'this_month') {
        const curY = now.getFullYear().toString();
        const curM = String(now.getMonth() + 1).padStart(2, '0');
        if (year !== curY || month !== curM) return false;
      } else if (selectedPreset === 'this_year') {
        const curY = now.getFullYear().toString();
        if (year !== curY) return false;
      } else if (selectedDate) {
        if (fullDate !== selectedDate) return false;
      } else {
        if (selectedYear !== 'all' && year !== selectedYear) return false;
        if (selectedMonth !== 'all' && month !== selectedMonth) return false;
        if (selectedDay !== 'all' && day !== selectedDay) return false;
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
  }, [appointments, statusFilter, selectedPreset, selectedDate, selectedYear, selectedMonth, selectedDay, searchQuery]);

  // Filtered prescriptions according to Date/Month/Year presets, and Search
  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter(rx => {
      // Date filtering
      const { year, month, day, fullDate } = extractDateParts(rx);
      const now = new Date();

      if (selectedPreset === 'today') {
        const curY = now.getFullYear().toString();
        const curM = String(now.getMonth() + 1).padStart(2, '0');
        const curD = String(now.getDate()).padStart(2, '0');
        const todayStr = `${curY}-${curM}-${curD}`;
        if (fullDate && fullDate !== todayStr) return false;
      } else if (selectedPreset === 'this_month') {
        const curY = now.getFullYear().toString();
        const curM = String(now.getMonth() + 1).padStart(2, '0');
        if (year && (year !== curY || month !== curM)) return false;
      } else if (selectedPreset === 'this_year') {
        const curY = now.getFullYear().toString();
        if (year && year !== curY) return false;
      } else if (selectedDate) {
        if (fullDate && fullDate !== selectedDate) return false;
      } else {
        if (selectedYear !== 'all' && year && year !== selectedYear) return false;
        if (selectedMonth !== 'all' && month && month !== selectedMonth) return false;
        if (selectedDay !== 'all' && day && day !== selectedDay) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const pName = (rx.patientName || '').toLowerCase();
        const diag = (rx.diagnosis || '').toLowerCase();
        return pName.includes(q) || diag.includes(q);
      }
      return true;
    });
  }, [prescriptions, selectedPreset, selectedDate, selectedYear, selectedMonth, selectedDay, searchQuery]);

  const isFilterActive = selectedYear !== 'all' ||
    selectedMonth !== 'all' ||
    selectedDay !== 'all' ||
    Boolean(selectedDate) ||
    selectedPreset !== 'all' ||
    statusFilter !== 'all' ||
    Boolean(searchQuery.trim());

  const handleResetFilters = () => {
    setSelectedYear('all');
    setSelectedMonth('all');
    setSelectedDay('all');
    setSelectedDate('');
    setSelectedPreset('all');
    setStatusFilter('all');
    setSearchQuery('');
  };

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
          <div className={styles.toolbarSection}>
            <div className={styles.toolbarRow}>
              <div className={styles.tabList}>
                <button
                  type="button"
                  className={`${styles.tabBtn} ${activeTab === 'consultations' ? styles.tabBtnActive : ''}`}
                  onClick={() => setActiveTab('consultations')}
                >
                  <Users size={15} />
                  <span>
                    Patient Consultations ({filteredAppointments.length !== appointments.length ? `${filteredAppointments.length}/${appointments.length}` : appointments.length})
                  </span>
                </button>
                <button
                  type="button"
                  className={`${styles.tabBtn} ${activeTab === 'prescriptions' ? styles.tabBtnActive : ''}`}
                  onClick={() => setActiveTab('prescriptions')}
                >
                  <Pill size={15} />
                  <span>
                    Prescriptions ({filteredPrescriptions.length !== prescriptions.length ? `${filteredPrescriptions.length}/${prescriptions.length}` : prescriptions.length})
                  </span>
                </button>
                <button
                  type="button"
                  className={`${styles.tabBtn} ${activeTab === 'reviews' ? styles.tabBtnActive : ''}`}
                  onClick={() => setActiveTab('reviews')}
                >
                  <Star size={15} color="#d97706" />
                  <span>Patient Reviews ({doctorReviews.length})</span>
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
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#94a3b8', display: 'flex' }}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => loadDoctorData(true)}
                  className={styles.closeBtn}
                  title="Refresh history data"
                  style={{ width: '32px', height: '32px' }}
                >
                  <RefreshCw size={14} className={isLoading || isSyncing ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Row 2: Date, Month, Year & Status Filter Bar */}
            {(activeTab === 'consultations' || activeTab === 'prescriptions') && (
              <div className={styles.dateFilterBar}>
                {/* Quick Period Presets */}
                <div className={styles.periodPresets}>
                  <button
                    type="button"
                    className={`${styles.presetPill} ${selectedPreset === 'all' && selectedYear === 'all' && selectedMonth === 'all' && selectedDay === 'all' && !selectedDate ? styles.presetPillActive : ''}`}
                    onClick={() => {
                      setSelectedPreset('all');
                      setSelectedYear('all');
                      setSelectedMonth('all');
                      setSelectedDay('all');
                      setSelectedDate('');
                    }}
                  >
                    All Time
                  </button>
                  <button
                    type="button"
                    className={`${styles.presetPill} ${selectedPreset === 'today' ? styles.presetPillActive : ''}`}
                    onClick={() => {
                      setSelectedPreset('today');
                      setSelectedYear('all');
                      setSelectedMonth('all');
                      setSelectedDay('all');
                      setSelectedDate('');
                    }}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    className={`${styles.presetPill} ${selectedPreset === 'this_month' ? styles.presetPillActive : ''}`}
                    onClick={() => {
                      setSelectedPreset('this_month');
                      setSelectedYear('all');
                      setSelectedMonth('all');
                      setSelectedDay('all');
                      setSelectedDate('');
                    }}
                  >
                    This Month
                  </button>
                  <button
                    type="button"
                    className={`${styles.presetPill} ${selectedPreset === 'this_year' ? styles.presetPillActive : ''}`}
                    onClick={() => {
                      setSelectedPreset('this_year');
                      setSelectedYear('all');
                      setSelectedMonth('all');
                      setSelectedDay('all');
                      setSelectedDate('');
                    }}
                  >
                    This Year
                  </button>
                </div>

                <div className={styles.dividerVertical} />

                {/* Date Selectors: Year, Month, Day/Date */}
                <div className={styles.selectorsGroup}>
                  {/* Year Filter */}
                  <div className={styles.filterControlItem}>
                    <label className={styles.filterControlLabel}>
                      <Calendar size={12} color="#64748b" /> Year
                    </label>
                    <select
                      className={styles.filterControlSelect}
                      value={selectedPreset !== 'all' ? 'preset' : selectedYear}
                      onChange={(e) => {
                        setSelectedPreset('all');
                        setSelectedYear(e.target.value);
                        if (selectedDate) setSelectedDate('');
                      }}
                    >
                      <option value="all">All Years</option>
                      {availableYears.map(yr => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                      {selectedPreset !== 'all' && <option value="preset" disabled>Preset Active</option>}
                    </select>
                  </div>

                  {/* Month Filter */}
                  <div className={styles.filterControlItem}>
                    <label className={styles.filterControlLabel}>Month</label>
                    <select
                      className={styles.filterControlSelect}
                      value={selectedPreset !== 'all' ? 'preset' : selectedMonth}
                      onChange={(e) => {
                        setSelectedPreset('all');
                        setSelectedMonth(e.target.value);
                        if (selectedDate) setSelectedDate('');
                      }}
                    >
                      <option value="all">All Months</option>
                      <option value="01">01 - Jan</option>
                      <option value="02">02 - Feb</option>
                      <option value="03">03 - Mar</option>
                      <option value="04">04 - Apr</option>
                      <option value="05">05 - May</option>
                      <option value="06">06 - Jun</option>
                      <option value="07">07 - Jul</option>
                      <option value="08">08 - Aug</option>
                      <option value="09">09 - Sep</option>
                      <option value="10">10 - Oct</option>
                      <option value="11">11 - Nov</option>
                      <option value="12">12 - Dec</option>
                      {selectedPreset !== 'all' && <option value="preset" disabled>Preset Active</option>}
                    </select>
                  </div>

                  {/* Day Filter */}
                  <div className={styles.filterControlItem}>
                    <label className={styles.filterControlLabel}>Day</label>
                    <select
                      className={styles.filterControlSelect}
                      value={selectedPreset !== 'all' ? 'preset' : selectedDay}
                      onChange={(e) => {
                        setSelectedPreset('all');
                        setSelectedDay(e.target.value);
                        if (selectedDate) setSelectedDate('');
                      }}
                    >
                      <option value="all">All Days</option>
                      {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map(d => (
                        <option key={d} value={d}>Day {d}</option>
                      ))}
                      {selectedPreset !== 'all' && <option value="preset" disabled>Preset Active</option>}
                    </select>
                  </div>

                  {/* Exact Date Picker */}
                  <div className={styles.filterControlItem}>
                    <label className={styles.filterControlLabel}>Exact Date</label>
                    <input
                      type="date"
                      className={styles.filterControlDate}
                      value={selectedDate}
                      title="Select exact date"
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedDate(val);
                        setSelectedPreset('all');
                        if (val) {
                          const [y, m, d] = val.split('-');
                          setSelectedYear(y || 'all');
                          setSelectedMonth(m || 'all');
                          setSelectedDay(d || 'all');
                        }
                      }}
                    />
                  </div>

                  {/* Status Filter (Consultations) */}
                  {activeTab === 'consultations' && (
                    <div className={styles.filterControlItem}>
                      <label className={styles.filterControlLabel}>Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className={styles.filterControlSelect}
                      >
                        <option value="all">All Statuses ({appointments.length})</option>
                        <option value="Completed">Completed ({completedConsultations.length})</option>
                        <option value="Confirmed">Confirmed ({confirmedCount})</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  )}

                  {/* Reset Filters */}
                  {isFilterActive && (
                    <button
                      type="button"
                      className={styles.resetFiltersBtn}
                      onClick={handleResetFilters}
                      title="Clear all date and search filters"
                    >
                      <X size={13} />
                      <span>Clear Filters</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* TAB 1: Patient Consultations Table */}
          {activeTab === 'consultations' && (
            <div className={styles.tableContainer}>
              {filteredAppointments.length === 0 ? (
                <div className={styles.emptyState}>
                  <Users size={40} className={styles.emptyIcon} />
                  <h4 className={styles.emptyTitle}>No Consultations Found</h4>
                  <p className={styles.emptySubtitle}>
                    {isFilterActive
                      ? 'No patient consultations match your current date, month, year, status, or search filters.'
                      : `Dr. ${doctor.name.replace('Dr. ', '')} does not have any recorded consultations yet. Any patients booked online or registered at clinic will appear here automatically.`}
                  </p>
                  {isFilterActive && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className={styles.resetFiltersBtn}
                      style={{ marginTop: '12px' }}
                    >
                      <X size={13} />
                      <span>Clear All Filters</span>
                    </button>
                  )}
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
              {filteredPrescriptions.length === 0 ? (
                <div className={styles.emptyState}>
                  <FileText size={40} className={styles.emptyIcon} />
                  <h4 className={styles.emptyTitle}>No Prescriptions Recorded</h4>
                  <p className={styles.emptySubtitle}>
                    {isFilterActive
                      ? 'No electronic prescriptions match your current date or search filters.'
                      : `Dr. ${doctor.name.replace('Dr. ', '')} has not issued any electronic prescriptions yet.`}
                  </p>
                  {isFilterActive && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className={styles.resetFiltersBtn}
                      style={{ marginTop: '12px' }}
                    >
                      <X size={13} />
                      <span>Clear All Filters</span>
                    </button>
                  )}
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
                    {filteredPrescriptions.map((rx, idx) => (
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
          {/* TAB 3: Doctor Reviews Management */}
          {activeTab === 'reviews' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fef3c7', padding: '4px 10px', borderRadius: '8px', color: '#b45309', fontWeight: 800 }}>
                    <Star size={16} fill="#f59e0b" color="#f59e0b" />
                    <span>{liveRating.score}</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#92400e' }}>({doctorReviews.length} {doctorReviews.length === 1 ? 'review' : 'reviews'})</span>
                  </div>
                  <span style={{ fontSize: '0.84rem', color: '#64748b' }}>
                    Authentic patient reviews displayed on Dr. {liveDoc.name ? liveDoc.name.replace(/^Dr\.\s*/i, '') : ''}'s public profile.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setReviewToEdit(null);
                    setIsReviewFormOpen(true);
                  }}
                  style={{
                    background: '#7c3aed',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Plus size={15} /> Add Review for {liveDoc.name}
                </button>
              </div>

              {doctorReviews.length === 0 ? (
                <div className={styles.emptyState}>
                  <MessageSquare size={40} className={styles.emptyIcon} />
                  <h4 className={styles.emptyTitle}>No Reviews for this Doctor Yet</h4>
                  <p className={styles.emptySubtitle}>
                    Dr. {liveDoc.name ? liveDoc.name.replace(/^Dr\.\s*/i, '') : ''} does not have any recorded patient reviews yet. Click "+ Add Review" above to publish a verified review.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
                  {doctorReviews.map((rev) => (
                    <div
                      key={rev.id || rev._id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <strong style={{ fontSize: '0.94rem', color: '#0f172a' }}>{rev.patientName}</strong>
                          <span style={{ fontSize: '0.76rem', color: '#94a3b8', display: 'block' }}>
                            {rev.patientCity || 'Bengaluru'} {rev.createdAt ? `• ${new Date(rev.createdAt).toLocaleDateString()}` : ''}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={13}
                              fill={s <= Number(rev.rating) ? '#f59e0b' : '#e2e8f0'}
                              color={s <= Number(rev.rating) ? '#f59e0b' : '#cbd5e1'}
                            />
                          ))}
                        </div>
                      </div>

                      {rev.treatment && (
                        <div style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 600 }}>
                          Treatment: {rev.treatment}
                        </div>
                      )}

                      {rev.title && (
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                          {rev.title}
                        </div>
                      )}

                      <ExpandableReviewComment
                        comment={rev.comment}
                        maxLength={200}
                        style={{ margin: 0, fontSize: '0.84rem', color: '#475569', lineHeight: 1.5 }}
                      />

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: rev.status === 'approved' ? '#ecfdf5' : rev.status === 'pending' ? '#fef3c7' : '#fef2f2',
                          color: rev.status === 'approved' ? '#059669' : rev.status === 'pending' ? '#b45309' : '#ef4444'
                        }}>
                          {rev.status}
                        </span>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setReviewToEdit(rev);
                              setIsReviewFormOpen(true);
                            }}
                            style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '0.76rem', fontWeight: 600, color: '#2563eb', cursor: 'pointer' }}
                            title="Edit / Modify review details"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (window.confirm(`Permanently delete review by "${rev.patientName}"?`)) {
                                await deleteReview(rev._id || rev.id);
                              }
                            }}
                            style={{
                              background: '#fef2f2',
                              border: '1px solid #fee2e2',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              fontSize: '0.76rem',
                              fontWeight: 600,
                              color: '#ef4444',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                            title="Delete this review permanently"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isReviewFormOpen && (
        <ReviewFormModal
          reviewToEdit={reviewToEdit}
          preselectedDoctor={liveDoc}
          initialTargetType="doctor"
          onClose={() => {
            setIsReviewFormOpen(false);
            setReviewToEdit(null);
          }}
          onSave={async (data) => {
            try {
              if (reviewToEdit) {
                await updateReview(reviewToEdit.id || reviewToEdit._id, data);
              } else {
                await addReview(data);
              }
            } catch (err) {
              console.error('Failed to save review:', err);
            }
            setIsReviewFormOpen(false);
            setReviewToEdit(null);
          }}
        />
      )}
    </div>
  );
};

export default DoctorHistoryModal;
