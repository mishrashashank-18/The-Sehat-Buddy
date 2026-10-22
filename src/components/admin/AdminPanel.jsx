import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  Stethoscope,
  Building2,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit3,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  MapPin,
  Star,
  Bed,
  Phone,
  Clock,
  ShieldCheck,
  LogOut,
  LayoutTemplate,
  HelpCircle,
  MessageSquare,
  Activity,
  Eye,
  EyeOff,
  Palette,
  Database,
  Cloud,
  HardDrive,
  RefreshCw,
  Server,
  Layers,
  Image as ImageIcon,
  AlertTriangle,
  Mail,
  Send,
  Calendar,
  User,
  Users,
  UserCheck,
  CalendarDays,
  Check
} from 'lucide-react';
import { api } from '../../services/api';
import { useData } from '../../context/useData';
import DoctorFormModal from './DoctorFormModal';
import HospitalFormModal from './HospitalFormModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import FrontPageEditor from './FrontPageEditor';
import FaqFormModal, { FAQ_ICON_OPTIONS } from './FaqFormModal';
import ReviewFormModal from './ReviewFormModal';
import SpecialityFormModal from './SpecialityFormModal';
import BrandingManager from './BrandingManager';
import logoImg from '../../assets/images/logo.png';
import styles from './AdminPanel.module.css';

// Smart Calibrated Progress Scale so active database/cloud usage is always clearly visible on the line
// instead of collapsing into 0px due to massive total capacity (e.g. 0.8 MB / 512 MB = 0.16%)
const getVisualProgressPercent = (used, total, actualPercent) => {
  const numUsed = Number(used) || 0;
  const numTotal = Number(total) || 1;
  const pct = actualPercent !== undefined && actualPercent !== null
    ? Number(actualPercent)
    : (numUsed / numTotal) * 100;

  if (numUsed <= 0) return 0;
  if (pct >= 100) return 100;

  // Power scale (exponent 0.45) with minimum visible presence (8%)
  // so 0.8 MB yields ~13% visible width, 190 MB yields ~18% visible width
  const minVisible = 8;
  const scaled = Math.pow(Math.min(pct / 100, 1), 0.45) * (100 - minVisible);
  return Math.min(100, Math.max(minVisible, Number((minVisible + scaled).toFixed(1))));
};

const AdminPanel = ({ onExit, onNavigate }) => {
  const {
    branding,
    doctors,
    hospitals,
    corporateTieups,
    updateDoctor,
    deleteDoctor,
    deleteHospital,
    resetToDefaults,
    stats,
    faqs,
    addFaq,
    updateFaq,
    deleteFaq,
    reviews,
    addReview,
    updateReview,
    deleteReview,
    specialitiesProcedures,
    addSpecialityProcedure,
    updateSpecialityProcedure,
    deleteSpecialityProcedure
  } = useData();

  // Navigation tab: 'overview' | 'doctors' | 'hospitals' | 'content' | 'branding' | 'faqs' | 'reviews' | 'specialities'
  const [activeTab, setActiveTabState] = useState(() => {
    try {
      const saved = localStorage.getItem('sehat_admin_active_tab') || 'overview';
      return saved === 'corporate' ? 'content' : saved;
    } catch {}
    return 'overview';
  });

  const setActiveTab = (tab) => {
    try {
      localStorage.setItem('sehat_admin_active_tab', tab);
    } catch {}
    setActiveTabState(tab);
  };

  // Search & Filters for Doctors
  const [doctorSearch, setDoctorSearch] = useState('');
  const [doctorSpecialtyFilter, setDoctorSpecialtyFilter] = useState('all');

  // Search & Filters for Hospitals
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [hospitalCityFilter, setHospitalCityFilter] = useState('all');
  const [emergencyOnly, setEmergencyOnly] = useState(false);

  // Modals state
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [doctorToEdit, setDoctorToEdit] = useState(null);

  const [isHospitalModalOpen, setIsHospitalModalOpen] = useState(false);
  const [hospitalToEdit, setHospitalToEdit] = useState(null);

  // Appointments Management State
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [appointmentSearch, setAppointmentSearch] = useState('');
  const [appointmentTypeFilter, setAppointmentTypeFilter] = useState('all'); // 'all' | 'hospital' | 'doctor'
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState('all'); // 'all' | 'Confirmed' | 'Completed' | 'Cancelled'
  const [appointmentYearFilter, setAppointmentYearFilter] = useState('all');
  const [appointmentMonthFilter, setAppointmentMonthFilter] = useState('all');
  const [appointmentDayFilter, setAppointmentDayFilter] = useState('all');
  const [appointmentPreset, setAppointmentPreset] = useState('all'); // 'all' | 'today' | 'this_month' | 'this_year'

  const fetchAppointments = useCallback(async () => {
    setLoadingAppointments(true);
    try {
      const data = await api.getAdminAppointments();
      if (Array.isArray(data)) {
        setAppointments(data);
      }
    } catch (err) {
      console.warn('Failed to fetch admin appointments:', err);
      try {
        const local = JSON.parse(localStorage.getItem('sehat_buddy_appointments') || '[]');
        setAppointments(local);
      } catch {}
    } finally {
      setLoadingAppointments(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
    const handleAptChanged = () => {
      fetchAppointments();
    };
    window.addEventListener('sehat_appointments_changed', handleAptChanged);
    window.addEventListener('sehat_db_change', handleAptChanged);
    return () => {
      window.removeEventListener('sehat_appointments_changed', handleAptChanged);
      window.removeEventListener('sehat_db_change', handleAptChanged);
    };
  }, [fetchAppointments]);

  const handleUpdateStatus = async (appointmentId, newStatus) => {
    try {
      await api.updateAdminAppointmentStatus(appointmentId, {
        status: newStatus,
        isCompleted: newStatus === 'Completed',
        cancelled: newStatus === 'Cancelled'
      });
      setAppointments(prev => prev.map(a => (a._id === appointmentId || a.id === appointmentId) ? { ...a, status: newStatus, isCompleted: newStatus === 'Completed', cancelled: newStatus === 'Cancelled' } : a));
      showToast(`Appointment status updated to ${newStatus}`);
    } catch (err) {
      console.error('Failed to update status:', err);
      showToast('Failed to update status', 'error');
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to delete this appointment record?')) return;
    try {
      await api.deleteAdminAppointment(appointmentId);
      setAppointments(prev => prev.filter(a => a._id !== appointmentId && a.id !== appointmentId));
      showToast('Appointment record deleted successfully');
    } catch (err) {
      console.error('Failed to delete appointment:', err);
      showToast('Failed to delete appointment', 'error');
    }
  };

  const availableAppointmentYears = React.useMemo(() => {
    const years = new Set();
    appointments.forEach(apt => {
      const rawDate = apt.slotDate || (apt.createdAt ? apt.createdAt.slice(0, 10) : '');
      if (rawDate && rawDate.includes('-')) {
        const y = rawDate.split('-')[0];
        if (y && y.length === 4) years.add(y);
      }
    });
    years.add(new Date().getFullYear().toString());
    return Array.from(years).sort().reverse();
  }, [appointments]);

  const filteredAppointments = React.useMemo(() => {
    return appointments.filter(apt => {
      if (appointmentTypeFilter === 'hospital' && apt.appointmentType !== 'hospital' && !apt.hospitalId && !apt.hospitalData) return false;
      if (appointmentTypeFilter === 'doctor' && (apt.appointmentType === 'hospital' || (!apt.docId && apt.hospitalId))) return false;

      if (appointmentStatusFilter !== 'all') {
        const s = (apt.status || 'Confirmed').toLowerCase();
        if (appointmentStatusFilter === 'Completed' && (s !== 'completed' && !apt.isCompleted)) return false;
        if (appointmentStatusFilter === 'Confirmed' && (s !== 'confirmed' || apt.cancelled || apt.isCompleted)) return false;
        if (appointmentStatusFilter === 'Cancelled' && (s !== 'cancelled' && !apt.cancelled)) return false;
      }

      // Date parsing
      const rawDate = apt.slotDate || (apt.createdAt ? apt.createdAt.slice(0, 10) : '');
      const parts = rawDate.split('-');
      const aptYear = parts[0] || '';
      const aptMonth = parts[1] || '';
      const aptDay = parts[2] ? parts[2].padStart(2, '0') : '';
      const now = new Date();

      if (appointmentPreset === 'today') {
        if (rawDate !== now.toISOString().slice(0, 10)) return false;
      } else if (appointmentPreset === 'this_month') {
        if (aptYear !== now.getFullYear().toString() || aptMonth !== String(now.getMonth() + 1).padStart(2, '0')) return false;
      } else if (appointmentPreset === 'this_year') {
        if (aptYear !== now.getFullYear().toString()) return false;
      } else {
        if (appointmentYearFilter !== 'all' && aptYear !== appointmentYearFilter) return false;
        if (appointmentMonthFilter !== 'all' && aptMonth !== appointmentMonthFilter) return false;
        if (appointmentDayFilter !== 'all' && aptDay !== appointmentDayFilter.padStart(2, '0')) return false;
      }

      if (appointmentSearch.trim()) {
        const q = appointmentSearch.toLowerCase().trim();
        const pName = (apt.userData?.name || apt.patientName || '').toLowerCase();
        const pPhone = (apt.userData?.phone || apt.patientPhone || '').toLowerCase();
        const pEmail = (apt.userData?.email || apt.patientEmail || '').toLowerCase();
        const hName = (apt.hospitalData?.name || apt.hospitalName || '').toLowerCase();
        const dName = (apt.docData?.name || apt.doctorName || '').toLowerCase();
        const dept = (apt.department || '').toLowerCase();
        const token = (apt._id || apt.id || '').toLowerCase();

        return pName.includes(q) || pPhone.includes(q) || pEmail.includes(q) || hName.includes(q) || dName.includes(q) || dept.includes(q) || token.includes(q);
      }

      return true;
    });
  }, [appointments, appointmentTypeFilter, appointmentStatusFilter, appointmentPreset, appointmentYearFilter, appointmentMonthFilter, appointmentDayFilter, appointmentSearch]);

  // Statistics for selected Year / Month / Day
  const appointmentStats = React.useMemo(() => {
    const base = appointments.filter(apt => {
      const rawDate = apt.slotDate || (apt.createdAt ? apt.createdAt.slice(0, 10) : '');
      const parts = rawDate.split('-');
      const aptYear = parts[0] || '';
      const aptMonth = parts[1] || '';
      const aptDay = parts[2] ? parts[2].padStart(2, '0') : '';
      const now = new Date();

      if (appointmentPreset === 'today') {
        return rawDate === now.toISOString().slice(0, 10);
      }
      if (appointmentPreset === 'this_month') {
        return aptYear === now.getFullYear().toString() && aptMonth === String(now.getMonth() + 1).padStart(2, '0');
      }
      if (appointmentPreset === 'this_year') {
        return aptYear === now.getFullYear().toString();
      }
      if (appointmentYearFilter !== 'all' && aptYear !== appointmentYearFilter) return false;
      if (appointmentMonthFilter !== 'all' && aptMonth !== appointmentMonthFilter) return false;
      if (appointmentDayFilter !== 'all' && aptDay !== appointmentDayFilter.padStart(2, '0')) return false;
      return true;
    });

    const total = base.length;
    const visited = base.filter(a => a.status === 'Completed' || a.isCompleted).length;
    const upcoming = base.filter(a => (a.status === 'Confirmed' || a.status === 'Pending') && !a.cancelled && !a.isCompleted).length;
    const cancelled = base.filter(a => a.status === 'Cancelled' || a.cancelled).length;

    return { total, visited, upcoming, cancelled };
  }, [appointments, appointmentPreset, appointmentYearFilter, appointmentMonthFilter, appointmentDayFilter]);

  // Search & Filters for FAQs
  const [faqSearch, setFaqSearch] = useState('');
  const [faqCategoryFilter, setFaqCategoryFilter] = useState('all');
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [faqToEdit, setFaqToEdit] = useState(null);

  // Dynamic categories for FAQ filter (standards + all custom categories present in FAQs)
  const faqFilterCategories = React.useMemo(() => {
    const defaultCats = [
      'Insurance & Cashless',
      'Surgeries & Procedures',
      'Hospitals & Admissions',
      'Doctors & Consultations',
      'General'
    ];
    const set = new Set(defaultCats);
    (faqs || []).forEach(f => {
      const cat = (f?.category || '').trim();
      if (cat) set.add(cat);
    });
    return Array.from(set);
  }, [faqs]);

  // Search & Filters for Reviews
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewStatusFilter, setReviewStatusFilter] = useState('all');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewToEdit, setReviewToEdit] = useState(null);

  // Search & Filters for Specialities & Procedures
  const [specSearch, setSpecSearch] = useState('');
  const [specTypeFilter, setSpecTypeFilter] = useState('all');
  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);
  const [specToEdit, setSpecToEdit] = useState(null);

  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    type: null, // 'doctor' | 'hospital' | 'faq' | 'review' | 'speciality' | 'reset'
    item: null
  });

  // Toast feedback
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3500);
  };

  const handleToggleStarDoctor = (doc, e) => {
    e?.stopPropagation?.();
    const nextVal = !doc.isStarDoctor;
    updateDoctor(doc.id || doc._id, { isStarDoctor: nextVal });
    showToast(
      nextVal
        ? `⭐ ${doc.name} marked as Star Doctor! Featured in Popular Doctors on homepage.`
        : `Removed ${doc.name} from Star Doctors.`
    );
  };

  // Realtime Cloud Quota & Storage Stats (MongoDB, Cloudinary & Brevo)
  const [storageData, setStorageData] = useState(null);
  const [loadingStorage, setLoadingStorage] = useState(false);
  const [storageError, setStorageError] = useState(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  const fetchStorageStats = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoadingStorage(true);
      const res = await api.getStorageStats();
      if (res && res.success) {
        setStorageData(res);
        setStorageError(null);
      } else {
        if (!isSilent) setStorageError(res?.message || 'Could not fetch storage metrics');
      }
    } catch (err) {
      if (!isSilent) {
        console.error('Failed to load storage stats:', err);
        const message = err.message === 'Failed to fetch'
          ? 'Backend server is offline or unreachable. Please ensure the backend is running.'
          : (err.message || 'Failed to load cloud storage stats');
        setStorageError(message);
      }
    } finally {
      if (!isSilent) setLoadingStorage(false);
    }
  }, []);

  // Realtime SSE Stream & Auto-Sync
  useEffect(() => {
    let eventSource = null;
    let isMounted = true;

    const token = localStorage.getItem('token');
    const apiBase = import.meta.env.VITE_API_URL || import.meta.env.VITE_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    const streamBase = apiBase.replace(/\/+$/, '');
    const cleanBase = streamBase.endsWith('/api') ? streamBase : `${streamBase}/api`;
    const sseUrl = `${cleanBase}/admin/storage-stream?token=${encodeURIComponent(token || '')}`;

    if (token) {
      try {
        eventSource = new EventSource(sseUrl);

        eventSource.onopen = () => {
          if (isMounted) setIsRealtimeConnected(true);
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data && data.success && isMounted) {
              setStorageData(data);
              setStorageError(null);
            }
          } catch {
            // Heartbeats or parse error
          }
        };

        eventSource.onerror = () => {
          if (isMounted) setIsRealtimeConnected(false);
        };
      } catch (err) {
        console.warn('Realtime EventSource error:', err);
      }
    }

    // Immediate initial fetch
    fetchStorageStats(false);

    // Refresh when app mutations happen or window is re-focused
    const handleMutationSync = () => {
      fetchStorageStats(true);
    };

    const handleVisibilitySync = () => {
      if (document.visibilityState === 'visible') {
        fetchStorageStats(true);
      }
    };

    window.addEventListener('storage-stats-refresh', handleMutationSync);
    window.addEventListener('visibilitychange', handleVisibilitySync);
    window.addEventListener('focus', handleMutationSync);

    // Fallback periodic sync every 20 seconds
    const intervalTimer = setInterval(() => {
      fetchStorageStats(true);
    }, 20000);

    return () => {
      isMounted = false;
      if (eventSource) eventSource.close();
      clearInterval(intervalTimer);
      window.removeEventListener('storage-stats-refresh', handleMutationSync);
      window.removeEventListener('visibilitychange', handleVisibilitySync);
      window.removeEventListener('focus', handleMutationSync);
    };
  }, [fetchStorageStats]);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchStorageStats(false);
    }
  }, [activeTab, fetchStorageStats]);

  // Filtered Doctors
  const filteredDoctors = (doctors || []).filter(doc => {
    const q = doctorSearch.toLowerCase().trim();
    const matchesSearch = !q ||
      (doc.name || '').toLowerCase().includes(q) ||
      (doc.specialty || '').toLowerCase().includes(q) ||
      (doc.hospital || '').toLowerCase().includes(q);
    const matchesSpecialty =
      doctorSpecialtyFilter === 'all' || (doc.specialty || '').toLowerCase() === doctorSpecialtyFilter.toLowerCase();
    return matchesSearch && matchesSpecialty;
  });

  // Unique specialties for filter dropdown
  const uniqueSpecialties = Array.from(new Set((doctors || []).map(d => d.specialty).filter(Boolean)));

  // Filtered Hospitals
  const filteredHospitals = (hospitals || []).filter(hosp => {
    const q = hospitalSearch.toLowerCase().trim();
    const matchesSearch = !q ||
      (hosp.name || '').toLowerCase().includes(q) ||
      (hosp.city || '').toLowerCase().includes(q) ||
      (Array.isArray(hosp.specialties) && hosp.specialties.some(s => (s || '').toLowerCase().includes(q)));
    const matchesCity =
      hospitalCityFilter === 'all' || (hosp.city || '').toLowerCase() === hospitalCityFilter.toLowerCase();
    const matchesEmergency = !emergencyOnly || hosp.emergency24x7;
    return matchesSearch && matchesCity && matchesEmergency;
  });

  // Unique cities for hospital filter
  const uniqueCities = Array.from(new Set(hospitals.map(h => h.city).filter(Boolean)));

  // Handlers for Doctor actions
  const handleOpenAddDoctor = () => {
    setDoctorToEdit(null);
    setIsDoctorModalOpen(true);
  };

  const handleOpenEditDoctor = (doc) => {
    setDoctorToEdit(doc);
    setIsDoctorModalOpen(true);
  };

  const handleDeleteDoctorClick = (doc) => {
    setDeleteModalState({
      isOpen: true,
      type: 'doctor',
      item: doc
    });
  };

  // Handlers for Hospital actions
  const handleOpenAddHospital = () => {
    setHospitalToEdit(null);
    setIsHospitalModalOpen(true);
  };

  const handleOpenEditHospital = (hosp) => {
    const hospId = hosp?.id || hosp?._id;
    if (onNavigate && hospId) {
      onNavigate('admin-edit-hospital', hospId);
      return;
    }
    setHospitalToEdit(hosp);
    setIsHospitalModalOpen(true);
  };

  const handleDeleteHospitalClick = (hosp) => {
    setDeleteModalState({
      isOpen: true,
      type: 'hospital',
      item: hosp
    });
  };

  const handleConfirmDelete = () => {
    if (deleteModalState.type === 'doctor' && deleteModalState.item) {
      deleteDoctor(deleteModalState.item.id || deleteModalState.item._id);
      showToast(`Doctor "${deleteModalState.item.name}" deleted successfully.`);
    } else if (deleteModalState.type === 'hospital' && deleteModalState.item) {
      deleteHospital(deleteModalState.item.id || deleteModalState.item._id);
      showToast(`Hospital "${deleteModalState.item.name}" deleted successfully.`);
    } else if (deleteModalState.type === 'faq' && deleteModalState.item) {
      deleteFaq(deleteModalState.item.id || deleteModalState.item._id);
      showToast('FAQ deleted successfully.');
    } else if (deleteModalState.type === 'review' && deleteModalState.item) {
      deleteReview(deleteModalState.item.id || deleteModalState.item._id);
      showToast('Review deleted successfully.');
    } else if (deleteModalState.type === 'speciality' && deleteModalState.item) {
      deleteSpecialityProcedure(deleteModalState.item.id || deleteModalState.item._id);
      showToast('Speciality / Surgery deleted successfully.');
    } else if (deleteModalState.type === 'reset') {
      resetToDefaults();
      showToast('All doctors, hospitals, FAQs, reviews, and specialities reset to demo defaults.');
    }
  };

  return (
    <div className={styles.adminContainer}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className={styles.toast}>
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar */}
      <header className={styles.topbar}>
        <div className={styles.brandGroup}>
          {branding?.showLogo !== false && branding?.logoType !== 'none' && (
            <div className={styles.logoIcon}>
              <img
                src={branding?.logoType === 'image' && branding?.logoImage ? branding.logoImage : logoImg}
                alt={branding?.siteName || 'Logo'}
                style={{ height: '28px', maxWidth: '36px', objectFit: 'contain', display: 'block' }}
              />
            </div>
          )}
          <div>
            <div className={styles.brandTitleWrap}>
              <span className={styles.brandTitle}>{branding?.siteName || 'The Sehat Buddy'}</span>
              <span className={styles.adminBadge}>
                <ShieldCheck size={13} /> Admin Panel
              </span>
            </div>
            <p className={styles.brandSub}>
              {branding?.tagline || 'Doctors & Healthcare Directory Management'}
            </p>
          </div>
        </div>

        <div className={styles.topbarActions}>
          <button
            className={styles.portalNavBtn}
            onClick={() => onNavigate ? onNavigate('doctor') : null}
            title="Open Doctor Clinical Console"
          >
            Doctor Dashboard
          </button>

          <button
            className={styles.portalNavBtn}
            onClick={() => onNavigate ? onNavigate('hospital') : null}
            title="Open Hospital Operations Portal"
          >
            Hospital Dashboard
          </button>

          <button className={styles.viewSiteBtn} onClick={onExit}>
            <span>View Website</span>
            <ExternalLink size={16} />
          </button>
          <button 
            className={styles.logoutBtn} 
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.reload();
            }}
          >
            <span>Log Out</span>
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className={styles.workspace}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarNav}>
            <button
              className={`${styles.navItem} ${activeTab === 'overview' ? styles.navItemActive : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <LayoutDashboard size={20} />
              <span>Overview</span>
            </button>

            <button
              className={`${styles.navItem} ${activeTab === 'doctors' ? styles.navItemActive : ''}`}
              onClick={() => setActiveTab('doctors')}
            >
              <Stethoscope size={20} />
              <span>Doctors</span>
              <span className={styles.navCount}>{doctors.length}</span>
            </button>

            <button
              className={`${styles.navItem} ${activeTab === 'hospitals' ? styles.navItemActive : ''}`}
              onClick={() => setActiveTab('hospitals')}
            >
              <Building2 size={20} />
              <span>Hospitals</span>
              <span className={styles.navCount}>{hospitals.length}</span>
            </button>

            <button
              className={`${styles.navItem} ${activeTab === 'appointments' ? styles.navItemActive : ''}`}
              onClick={() => setActiveTab('appointments')}
            >
              <Calendar size={20} />
              <span>Appointments</span>
              <span className={styles.navCount}>{appointments.length}</span>
            </button>

            <button
              className={`${styles.navItem} ${activeTab === 'content' ? styles.navItemActive : ''}`}
              onClick={() => setActiveTab('content')}
            >
              <LayoutTemplate size={20} />
              <span>Front Page Content</span>
            </button>

            <button
              className={`${styles.navItem} ${activeTab === 'branding' ? styles.navItemActive : ''}`}
              onClick={() => setActiveTab('branding')}
            >
              <Palette size={20} />
              <span>Site Identity & Logo</span>
            </button>

            <button
              className={`${styles.navItem} ${activeTab === 'faqs' ? styles.navItemActive : ''}`}
              onClick={() => setActiveTab('faqs')}
            >
              <HelpCircle size={20} />
              <span>FAQs Management</span>
              <span className={styles.navCount}>{faqs.length}</span>
            </button>

            <button
              className={`${styles.navItem} ${activeTab === 'reviews' ? styles.navItemActive : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              <MessageSquare size={20} />
              <span>Public Reviews</span>
              <span className={styles.navCount}>{reviews.length}</span>
            </button>

            <button
              className={`${styles.navItem} ${activeTab === 'specialities' ? styles.navItemActive : ''}`}
              onClick={() => setActiveTab('specialities')}
            >
              <Activity size={20} />
              <span>Specialities & Surgeries</span>
              <span className={styles.navCount}>{specialitiesProcedures.length}</span>
            </button>
          </div>

          <div className={styles.quickAddBox}>
            <span className={styles.quickAddTitle}>Quick Actions</span>
            <button className={styles.quickDoctorBtn} onClick={handleOpenAddDoctor}>
              <Plus size={16} /> Add Doctor
            </button>
            <button className={styles.quickHospitalBtn} onClick={handleOpenAddHospital}>
              <Plus size={16} /> Add Hospital
            </button>
            <button
              className={styles.quickDoctorBtn}
              style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}
              onClick={() => {
                setFaqToEdit(null);
                setIsFaqModalOpen(true);
              }}
            >
              <Plus size={16} /> Add FAQ
            </button>
            <button
              className={styles.quickDoctorBtn}
              style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}
              onClick={() => {
                setSpecToEdit(null);
                setIsSpecModalOpen(true);
              }}
            >
              <Plus size={16} /> Add Speciality / Surgery
            </button>
            <button
              className={styles.quickDoctorBtn}
              style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}
              onClick={() => {
                setReviewToEdit(null);
                setIsReviewModalOpen(true);
              }}
            >
              <Plus size={16} /> Add Review
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className={styles.mainContent}>
          {/* TAB 1: OVERVIEW */}
          <div className={styles.viewSection} style={{ display: activeTab === 'overview' ? 'block' : 'none' }}>
              <div className={styles.viewHeader}>
                <div>
                  <h1 className={styles.pageTitle}>Dashboard Overview</h1>
                  <p className={styles.pageSubtitle}>Monitor registered doctors, healthcare centers, and clinical capacities</p>
                </div>
                <div className={styles.headerBtnGroup}>
                  <button className={styles.primaryBtn} onClick={handleOpenAddDoctor}>
                    <Plus size={18} /> Add Doctor
                  </button>
                  <button className={styles.secondaryBtn} onClick={handleOpenAddHospital}>
                    <Plus size={18} /> Add Hospital
                  </button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className={styles.statsGrid}>
                <div className={styles.statCard} onClick={() => setActiveTab('doctors')}>
                  <div className={`${styles.statIconWrap} ${styles.statIconGreen}`}>
                    <Stethoscope size={24} />
                  </div>
                  <div className={styles.statInfo}>
                    <span className={styles.statLabel}>Total Doctors</span>
                    <span className={styles.statValue}>{stats.totalDoctors}</span>
                    <span className={styles.statSub}>Specialists registered</span>
                  </div>
                </div>

                <div className={styles.statCard} onClick={() => setActiveTab('hospitals')}>
                  <div className={`${styles.statIconWrap} ${styles.statIconBlue}`}>
                    <Building2 size={24} />
                  </div>
                  <div className={styles.statInfo}>
                    <span className={styles.statLabel}>Total Hospitals</span>
                    <span className={styles.statValue}>{stats.totalHospitals}</span>
                    <span className={styles.statSub}>Across {uniqueCities.length || 1} cities</span>
                  </div>
                </div>

                <div className={styles.statCard} onClick={() => setActiveTab('appointments')}>
                  <div className={`${styles.statIconWrap}`} style={{ background: '#ecfdf5', color: '#059669' }}>
                    <Calendar size={24} />
                  </div>
                  <div className={styles.statInfo}>
                    <span className={styles.statLabel}>Total Bookings</span>
                    <span className={styles.statValue}>{appointments.length}</span>
                    <span className={styles.statSub}>
                      {appointments.filter(a => a.appointmentType === 'hospital' || a.hospitalId).length} Hospital Visits
                    </span>
                  </div>
                </div>
              </div>

              {/* Cloud Infrastructure & Storage Quotas */}
              <div className={styles.storageSection}>
                <div className={styles.storageHeader}>
                  <div className={styles.storageHeaderTitle}>
                    <div className={styles.storageTitleBadge}>
                      <Server size={14} />
                      <span>Cloud Quotas & Capacity</span>
                    </div>
                    <h2>Database, Media & Email Quotas</h2>
                    <p>Live resource usage, allocated capacity, and remaining free space / quota on MongoDB Atlas, Cloudinary, and Brevo</p>
                  </div>

                  <div className={styles.storageHeaderActions}>
                    <div
                      className={styles.realtimeBadge}
                      title={isRealtimeConnected
                        ? "Realtime live connection active directly to MongoDB Change Stream & Cloudinary"
                        : "Realtime auto-sync active"
                      }
                    >
                      <span className={`${styles.pulseDot} ${isRealtimeConnected ? styles.pulseGreen : styles.pulseAmber}`}></span>
                      <span>{isRealtimeConnected ? 'Live Realtime' : 'Auto-Sync Active'}</span>
                    </div>

                    {storageData?.timestamp && (
                      <span className={styles.storageTimestamp}>
                        Updated {new Date(storageData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    )}
                    <button
                      className={styles.storageRefreshBtn}
                      onClick={() => fetchStorageStats(false)}
                      disabled={loadingStorage}
                      title="Refresh real-time storage metrics"
                    >
                      <RefreshCw size={14} className={loadingStorage ? styles.spinning : ''} />
                      {loadingStorage ? 'Refreshing...' : 'Refresh Quotas'}
                    </button>
                  </div>
                </div>

                {storageError && !storageData && (
                  <div className={styles.storageErrorBox}>
                    <AlertTriangle size={18} />
                    <span>Failed to retrieve storage metrics: {storageError}</span>
                    <button onClick={fetchStorageStats} className={styles.storageRetryBtn}>Try Again</button>
                  </div>
                )}

                <div className={styles.storageGrid}>
                  {/* MongoDB Storage Card */}
                  <div className={`${styles.storageCard} ${styles.mongoCard}`}>
                    <div className={styles.storageCardHeader}>
                      <div className={styles.storageCardTitleGroup}>
                        <div className={`${styles.storageIconWrap} ${styles.storageIconMongo}`}>
                          <Database size={20} />
                        </div>
                        <div>
                          <div className={styles.storagePlatformTag}>NoSQL Database</div>
                          <h3 className={styles.storageCardTitle}>MongoDB Atlas</h3>
                        </div>
                      </div>

                      <div className={styles.storageBadgeGroup}>
                        <span className={`${styles.statusPill} ${
                          storageData?.mongodb?.status === 'critical' ? styles.statusPillCritical :
                          storageData?.mongodb?.status === 'warning' ? styles.statusPillWarning : styles.statusPillHealthy
                        }`}>
                          <span className={styles.statusDot}></span>
                          {storageData?.mongodb?.plan || 'M0 Free'} Plan
                        </span>
                      </div>
                    </div>

                    <div className={styles.storageHeroMetric}>
                      <div className={styles.storageHeroRemaining}>
                        <span className={styles.storageHeroNum}>
                          {storageData?.mongodb ? storageData.mongodb.remainingMB : '511.22'}
                        </span>
                        <span className={styles.storageHeroUnit}>MB</span>
                      </div>
                      <span className={styles.storageHeroLabel}>Remaining Free Space</span>
                      <span className={styles.storageHeroSub}>
                        512 MB total limit • {storageData?.mongodb ? `${storageData.mongodb.usedMB} MB (${storageData.mongodb.percentUsed}%) used` : '0 MB used'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className={styles.progressBarWrap}>
                      <div className={styles.progressBarTrack}>
                        <div
                          className={`${styles.progressBarFill} ${styles.progressMongo}`}
                          style={{
                            width: `${getVisualProgressPercent(
                              storageData?.mongodb?.usedMB,
                              storageData?.mongodb?.totalLimitMB,
                              storageData?.mongodb?.percentUsed
                            )}%`
                          }}
                        >
                          {Number(storageData?.mongodb?.usedMB) > 0 && (
                            <span className={styles.progressGlowThumb} title={`${storageData?.mongodb?.usedMB} MB used`}></span>
                          )}
                        </div>
                      </div>
                      <div className={styles.progressBarLabels}>
                        <span className={styles.progressActiveBadgeMongo}>
                          <span className={styles.statusDotGreen}></span>
                          {storageData?.mongodb ? `${storageData.mongodb.usedMB} MB Used (${storageData.mongodb.percentUsed}%)` : '0 MB Used (0%)'}
                        </span>
                        <span className={styles.progressCapacityLabel}>
                          {storageData?.mongodb ? `${storageData.mongodb.remainingMB} MB Free of 512 MB` : '512 MB Total'}
                        </span>
                      </div>
                    </div>

                    {/* Detailed Metric Pills */}
                    <div className={styles.storageDetailsGrid}>
                      <div className={styles.storageDetailPill}>
                        <span className={styles.detailPillLabel}>Total Space</span>
                        <span className={styles.detailPillVal}>{storageData?.mongodb ? `${storageData.mongodb.totalLimitMB} MB` : '512 MB'}</span>
                      </div>
                      <div className={styles.storageDetailPill}>
                        <span className={styles.detailPillLabel}>Used Space</span>
                        <span className={styles.detailPillVal}>{storageData?.mongodb ? `${storageData.mongodb.usedMB} MB` : '0 MB'}</span>
                      </div>
                      <div className={styles.storageDetailPill}>
                        <span className={styles.detailPillLabel}>Remaining Space</span>
                        <span className={`${styles.detailPillVal} ${styles.textEmerald}`}>
                          {storageData?.mongodb ? `${storageData.mongodb.remainingMB} MB` : '512 MB'}
                        </span>
                      </div>
                      <div className={styles.storageDetailPill}>
                        <span className={styles.detailPillLabel}>Total Documents</span>
                        <span className={styles.detailPillVal}>
                          {storageData?.mongodb ? `${storageData.mongodb.objects} records` : '0 records'}
                        </span>
                      </div>
                    </div>

                    {/* Storage Breakdown Footer */}
                    <div className={styles.storageFooterRow}>
                      <span title={`Database: ${storageData?.mongodb?.databaseName || 'thesehatbuddy'}`}>
                        <Layers size={13} /> {storageData?.mongodb ? `${storageData.mongodb.collections} Collections` : '10 Collections'}
                      </span>
                      <span title="Data and index breakdown">
                        Data: {storageData?.mongodb ? storageData.mongodb.dataSizeMB : '0.04'} MB • Index: {storageData?.mongodb ? storageData.mongodb.indexSizeMB : '0.47'} MB
                      </span>
                    </div>
                  </div>

                  {/* Cloudinary Storage Card */}
                  <div className={`${styles.storageCard} ${styles.cldCard}`}>
                    <div className={styles.storageCardHeader}>
                      <div className={styles.storageCardTitleGroup}>
                        <div className={`${styles.storageIconWrap} ${styles.storageIconCld}`}>
                          <Cloud size={20} />
                        </div>
                        <div>
                          <div className={styles.storagePlatformTag}>Media Cloud CDN</div>
                          <h3 className={styles.storageCardTitle}>Cloudinary Media</h3>
                        </div>
                      </div>

                      <div className={styles.storageBadgeGroup}>
                        <span className={`${styles.statusPill} ${
                          storageData?.cloudinary?.status === 'critical' ? styles.statusPillCritical :
                          storageData?.cloudinary?.status === 'warning' ? styles.statusPillWarning : styles.statusPillHealthy
                        }`}>
                          <span className={styles.statusDot}></span>
                          {storageData?.cloudinary?.plan || 'Free'} Plan
                        </span>
                      </div>
                    </div>

                    <div className={styles.storageHeroMetric}>
                      <div className={styles.storageHeroRemaining}>
                        <span className={styles.storageHeroNum}>
                          {storageData?.cloudinary ? storageData.cloudinary.remainingGB : '24.8'}
                        </span>
                        <span className={styles.storageHeroUnit}>GB</span>
                      </div>
                      <span className={styles.storageHeroLabel}>Remaining Free Space</span>
                      <span className={styles.storageHeroSub}>
                        25 GB total limit • {storageData?.cloudinary ? `${storageData.cloudinary.usedMB} MB (${storageData.cloudinary.percentUsed}%) used` : '0 MB used'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className={styles.progressBarWrap}>
                      <div className={styles.progressBarTrack}>
                        <div
                          className={`${styles.progressBarFill} ${styles.progressCld}`}
                          style={{
                            width: `${getVisualProgressPercent(
                              storageData?.cloudinary?.usedMB,
                              (storageData?.cloudinary?.totalLimitGB || 25) * 1024,
                              storageData?.cloudinary?.percentUsed
                            )}%`
                          }}
                        >
                          {Number(storageData?.cloudinary?.usedMB) > 0 && (
                            <span className={`${styles.progressGlowThumb} ${styles.progressGlowThumbCld}`} title={`${storageData?.cloudinary?.usedMB} MB used`}></span>
                          )}
                        </div>
                      </div>
                      <div className={styles.progressBarLabels}>
                        <span className={styles.progressActiveBadgeCld}>
                          <span className={styles.statusDotBlue}></span>
                          {storageData?.cloudinary ? `${storageData.cloudinary.usedMB} MB Used (${storageData.cloudinary.percentUsed}%)` : '0 MB Used (0%)'}
                        </span>
                        <span className={styles.progressCapacityLabel}>
                          {storageData?.cloudinary ? `${storageData.cloudinary.remainingGB} GB Free of 25 GB` : '25 GB Total'}
                        </span>
                      </div>
                    </div>

                    {/* Detailed Metric Pills */}
                    <div className={styles.storageDetailsGrid}>
                      <div className={styles.storageDetailPill}>
                        <span className={styles.detailPillLabel}>Total Space</span>
                        <span className={styles.detailPillVal}>{storageData?.cloudinary ? `${storageData.cloudinary.totalLimitGB} GB` : '25 GB'}</span>
                      </div>
                      <div className={styles.storageDetailPill}>
                        <span className={styles.detailPillLabel}>Used Space</span>
                        <span className={styles.detailPillVal}>{storageData?.cloudinary ? `${storageData.cloudinary.usedMB} MB` : '0 MB'}</span>
                      </div>
                      <div className={styles.storageDetailPill}>
                        <span className={styles.detailPillLabel}>Remaining Space</span>
                        <span className={`${styles.detailPillVal} ${styles.textSky}`}>
                          {storageData?.cloudinary ? `${storageData.cloudinary.remainingGB} GB` : '25 GB'}
                        </span>
                      </div>
                      <div className={styles.storageDetailPill}>
                        <span className={styles.detailPillLabel}>Hosted Assets</span>
                        <span className={styles.detailPillVal}>
                          {storageData?.cloudinary ? `${storageData.cloudinary.objects} files` : '0 files'}
                        </span>
                      </div>
                    </div>

                    {/* Storage Breakdown Footer */}
                    <div className={styles.storageFooterRow}>
                      <span title="Cloudinary monthly account credits">
                        <ImageIcon size={13} /> {storageData?.cloudinary ? `${storageData.cloudinary.credits.remaining} / ${storageData.cloudinary.credits.total} Credits` : '24.7 / 25 Credits'}
                      </span>
                      <span title="Monthly bandwidth used">
                        Bandwidth: {storageData?.cloudinary ? storageData.cloudinary.bandwidthMB : '0'} MB
                      </span>
                    </div>
                  </div>

                  {/* Brevo Email Quota Card */}
                  <div className={`${styles.storageCard} ${styles.brevoCard}`}>
                    <div className={styles.storageCardHeader}>
                      <div className={styles.storageCardTitleGroup}>
                        <div className={`${styles.storageIconWrap} ${styles.storageIconBrevo}`}>
                          <Mail size={20} />
                        </div>
                        <div>
                          <div className={styles.storagePlatformTag}>Transactional Email</div>
                          <h3 className={styles.storageCardTitle}>Brevo Mail Service</h3>
                        </div>
                      </div>

                      <div className={styles.storageBadgeGroup}>
                        <span className={`${styles.statusPill} ${
                          storageData?.brevo?.status === 'critical' ? styles.statusPillCritical :
                          storageData?.brevo?.status === 'warning' ? styles.statusPillWarning : styles.statusPillHealthy
                        }`}>
                          <span className={styles.statusDot}></span>
                          {storageData?.brevo?.plan || 'Free'} Plan
                        </span>
                      </div>
                    </div>

                    <div className={styles.storageHeroMetric}>
                      <div className={styles.storageHeroRemaining}>
                        <span className={styles.storageHeroNum}>
                          {storageData?.brevo ? storageData.brevo.remainingToday : '300'}
                        </span>
                        <span className={styles.storageHeroUnit}>Emails</span>
                      </div>
                      <span className={styles.storageHeroLabel}>Remaining Daily Quota</span>
                      <span className={styles.storageHeroSub}>
                        300 daily limit • {storageData?.brevo ? `${storageData.brevo.sentToday} sent (${storageData.brevo.percentUsed}%) today` : '0 sent (0%) today'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className={styles.progressBarWrap}>
                      <div className={styles.progressBarTrack}>
                        <div
                          className={`${styles.progressBarFill} ${styles.progressBrevo}`}
                          style={{
                            width: `${getVisualProgressPercent(
                              storageData?.brevo?.sentToday,
                              storageData?.brevo?.totalLimit || 300,
                              storageData?.brevo?.percentUsed
                            )}%`
                          }}
                        >
                          {Number(storageData?.brevo?.sentToday) > 0 && (
                            <span className={`${styles.progressGlowThumb} ${styles.progressGlowThumbBrevo}`} title={`${storageData?.brevo?.sentToday} sent today`}></span>
                          )}
                        </div>
                      </div>
                      <div className={styles.progressBarLabels}>
                        <span className={styles.progressActiveBadgeBrevo}>
                          <span className={styles.statusDotCyan}></span>
                          {storageData?.brevo ? `${storageData.brevo.sentToday} Sent Today (${storageData.brevo.percentUsed}%)` : '0 Sent Today (0%)'}
                        </span>
                        <span className={styles.progressCapacityLabel}>
                          {storageData?.brevo ? `${storageData.brevo.remainingToday} Free of 300 Daily` : '300 Daily Total'}
                        </span>
                      </div>
                    </div>

                    {/* Detailed Metric Pills */}
                    <div className={styles.storageDetailsGrid}>
                      <div className={styles.storageDetailPill}>
                        <span className={styles.detailPillLabel}>Total Quota</span>
                        <span className={styles.detailPillVal}>{storageData?.brevo ? `${storageData.brevo.totalLimit} emails` : '300 emails'}</span>
                      </div>
                      <div className={styles.storageDetailPill}>
                        <span className={styles.detailPillLabel}>Sent Today</span>
                        <span className={styles.detailPillVal}>{storageData?.brevo ? `${storageData.brevo.sentToday} emails` : '0 emails'}</span>
                      </div>
                      <div className={styles.storageDetailPill}>
                        <span className={styles.detailPillLabel}>Remaining Today</span>
                        <span className={`${styles.detailPillVal} ${styles.textTeal}`}>
                          {storageData?.brevo ? `${storageData.brevo.remainingToday} emails` : '300 emails'}
                        </span>
                      </div>
                      <div className={styles.storageDetailPill}>
                        <span className={styles.detailPillLabel}>Sent This Month</span>
                        <span className={styles.detailPillVal}>
                          {storageData?.brevo ? `${storageData.brevo.sentMonth} emails` : '0 emails'}
                        </span>
                      </div>
                    </div>

                    {/* Email Breakdown Footer */}
                    <div className={styles.storageFooterRow}>
                      <span title="SMTP Relay Host: smtp-relay.brevo.com">
                        <Send size={13} /> SMTP Active
                      </span>
                      <span title={storageData?.brevo?.accountEmail || 'thesehatbuddy@gmail.com'}>
                        {storageData?.brevo?.accountEmail || 'thesehatbuddy@gmail.com'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Preview Sections */}
              <div className={styles.overviewRow}>
                {/* Recent Doctors Preview */}
                <div className={styles.overviewBox}>
                  <div className={styles.boxHeader}>
                    <div>
                      <h3>Doctors Showcase ({doctors.length})</h3>
                      <p>Active medical professionals on Sehat Buddy</p>
                    </div>
                    <button className={styles.boxActionBtn} onClick={() => setActiveTab('doctors')}>
                      Manage All
                    </button>
                  </div>

                  <div className={styles.boxList}>
                    {doctors.map(doc => (
                      <div key={doc.id || doc._id} className={styles.boxItem}>
                        <img
                          src={doc.image}
                          alt={doc.name}
                          className={styles.docAvatarSmall}
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=150&q=80';
                          }}
                        />
                        <div className={styles.boxItemInfo}>
                          <h4>{doc.name}</h4>
                          <p>{doc.specialty} • {doc.experience}</p>
                          <span className={styles.docHospitalName}>{doc.hospital || 'Private Clinic'}</span>
                        </div>
                        <div className={styles.boxItemRight}>
                          <span className={styles.docPriceTag}>₹{doc.price}</span>
                          <button
                            className={styles.smallActionBtn}
                            onClick={() => handleOpenEditDoctor(doc)}
                            title="Edit Doctor"
                          >
                            <Edit3 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Hospitals Preview */}
                <div className={styles.overviewBox}>
                  <div className={styles.boxHeader}>
                    <div>
                      <h3>Hospitals Directory ({hospitals.length})</h3>
                      <p>Registered medical facilities & emergency hubs</p>
                    </div>
                    <button className={styles.boxActionBtn} onClick={() => setActiveTab('hospitals')}>
                      Manage All
                    </button>
                  </div>

                  <div className={styles.boxList}>
                    {hospitals.map(hosp => (
                      <div key={hosp.id || hosp._id} className={styles.boxItem}>
                        <img
                          src={hosp.image}
                          alt={hosp.name}
                          className={styles.hospThumbSmall}
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=150&q=80';
                          }}
                        />
                        <div className={styles.boxItemInfo}>
                          <h4>{hosp.name}</h4>
                          <p><MapPin size={12} /> {hosp.city} • {hosp.totalBeds} Beds</p>
                          {hosp.emergency24x7 && (
                            <span className={styles.emergencyBadgeSmall}>24/7 Emergency</span>
                          )}
                        </div>
                        <div className={styles.boxItemRight}>
                          <div className={styles.ratingBadgeSmall}>
                            <Star size={12} fill="#FACC15" color="#FACC15" />
                            <span>{hosp.rating}</span>
                          </div>
                          <button
                            className={styles.smallActionBtn}
                            onClick={() => handleOpenEditHospital(hosp)}
                            title="Edit Hospital"
                          >
                            <Edit3 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          {/* TAB 2: DOCTORS MANAGEMENT */}
          <div className={styles.viewSection} style={{ display: activeTab === 'doctors' ? 'block' : 'none' }}>
              <div className={styles.viewHeader}>
                <div>
                  <h1 className={styles.pageTitle}>Doctors Management</h1>
                  <p className={styles.pageSubtitle}>Add, edit, or remove certified doctors and medical specialists</p>
                </div>
                <button className={styles.primaryBtn} onClick={handleOpenAddDoctor}>
                  <Plus size={18} /> Add Doctor
                </button>
              </div>

              {/* Filters & Search */}
              <div className={styles.filterBar}>
                <div className={styles.searchBox}>
                  <Search size={18} className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Search doctor by name, specialty, hospital..."
                    value={doctorSearch}
                    onChange={(e) => setDoctorSearch(e.target.value)}
                  />
                  {doctorSearch && (
                    <button className={styles.clearSearch} onClick={() => setDoctorSearch('')}>×</button>
                  )}
                </div>

                <div className={styles.filterGroup}>
                  <Filter size={16} className={styles.filterIcon} />
                  <select
                    value={doctorSpecialtyFilter}
                    onChange={(e) => setDoctorSpecialtyFilter(e.target.value)}
                  >
                    <option value="all">All Specialties ({doctors.length})</option>
                    {uniqueSpecialties.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Doctors Table / Cards */}
              {filteredDoctors.length === 0 ? (
                <div className={styles.emptyState}>
                  <Stethoscope size={44} className={styles.emptyIcon} />
                  <h3>No Doctors Found</h3>
                  <p>No doctor matches your search query or filter criteria.</p>
                  <button
                    className={styles.secondaryBtn}
                    onClick={() => { setDoctorSearch(''); setDoctorSpecialtyFilter('all'); }}
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className={styles.tableContainer}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Doctor</th>
                        <th>Specialty & Experience</th>
                        <th>Affiliated Hospital</th>
                        <th>Consultation Fee</th>
                        <th>Rating</th>
                        <th>Availability</th>
                        <th style={{ textAlign: 'right', whiteSpace: 'nowrap', paddingRight: '18px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDoctors.map(doc => (
                        <tr key={doc.id || doc._id}>
                          <td>
                            <div className={styles.tableDocProfile}>
                              <img
                                src={doc.image}
                                alt={doc.name}
                                className={styles.tableDocAvatar}
                                onError={(e) => {
                                  e.target.src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=150&q=80';
                                }}
                              />
                              <div>
                                <span className={styles.tableDocName}>{doc.name}</span>
                                {doc.degree && <span className={styles.tableDocDegree}>{doc.degree}</span>}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={styles.specialtyBadge}>{doc.specialty}</span>
                            <div className={styles.tableSubText}>{doc.experience}</div>
                          </td>
                          <td>
                            <div className={styles.tableHospitalCell}>
                              <Building2 size={14} />
                              <span>{doc.hospital || 'Private Clinic'}</span>
                            </div>
                          </td>
                          <td>
                            <span className={styles.priceHighlight}>₹{doc.price}</span>
                          </td>
                          <td>
                            <div className={styles.ratingBadge}>
                              <Star size={13} fill="#FACC15" color="#FACC15" />
                              <span>{doc.rating}</span>
                              <small>({doc.reviews})</small>
                            </div>
                          </td>
                          <td>
                            <span className={styles.availabilityText}>
                              {doc.availableDays || 'Mon - Sat'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap', paddingRight: '18px' }}>
                            <div className={styles.actionBtnGroup}>
                              <button
                                className={`${styles.starActionBtn} ${doc.isStarDoctor ? styles.starActionBtnActive : ''}`}
                                onClick={(e) => handleToggleStarDoctor(doc, e)}
                                title={doc.isStarDoctor ? "Remove from Popular Doctors on homepage" : "Mark as Star Doctor (Feature on Homepage)"}
                              >
                                <Star size={15} fill={doc.isStarDoctor ? "#F59E0B" : "none"} color={doc.isStarDoctor ? "#D97706" : "#64748B"} />
                                <span>{doc.isStarDoctor ? "Starred" : "Star"}</span>
                              </button>
                              <button
                                className={styles.editActionBtn}
                                onClick={() => handleOpenEditDoctor(doc)}
                                title="Edit Doctor"
                              >
                                <Edit3 size={16} /> Edit
                              </button>
                              <button
                                className={styles.deleteActionBtn}
                                onClick={() => handleDeleteDoctorClick(doc)}
                                title="Delete Doctor"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          {/* TAB 3: HOSPITALS MANAGEMENT */}
          <div className={styles.viewSection} style={{ display: activeTab === 'hospitals' ? 'block' : 'none' }}>
              <div className={styles.viewHeader}>
                <div>
                  <h1 className={styles.pageTitle}>Hospitals Directory</h1>
                  <p className={styles.pageSubtitle}>Manage affiliated partner hospitals, bed counts, and clinical departments</p>
                </div>
                <button className={styles.secondaryBtn} onClick={handleOpenAddHospital}>
                  <Plus size={18} /> Add Hospital
                </button>
              </div>

              {/* Filters & Search */}
              <div className={styles.filterBar}>
                <div className={styles.searchBox}>
                  <Search size={18} className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Search hospital by name, city, department..."
                    value={hospitalSearch}
                    onChange={(e) => setHospitalSearch(e.target.value)}
                  />
                  {hospitalSearch && (
                    <button className={styles.clearSearch} onClick={() => setHospitalSearch('')}>×</button>
                  )}
                </div>

                <div className={styles.filterGroup}>
                  <MapPin size={16} className={styles.filterIcon} />
                  <select
                    value={hospitalCityFilter}
                    onChange={(e) => setHospitalCityFilter(e.target.value)}
                  >
                    <option value="all">All Cities ({hospitals.length})</option>
                    {uniqueCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <label className={styles.emergencyFilterToggle}>
                  <input
                    type="checkbox"
                    checked={emergencyOnly}
                    onChange={(e) => setEmergencyOnly(e.target.checked)}
                  />
                  <span>24/7 Emergency Only</span>
                </label>
              </div>

              {/* Hospitals Cards Grid */}
              {filteredHospitals.length === 0 ? (
                <div className={styles.emptyState}>
                  <Building2 size={44} className={styles.emptyIcon} />
                  <h3>No Hospitals Found</h3>
                  <p>No medical center matches your search query or city filter.</p>
                  <button
                    className={styles.secondaryBtn}
                    onClick={() => { setHospitalSearch(''); setHospitalCityFilter('all'); setEmergencyOnly(false); }}
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className={styles.hospitalsGrid}>
                  {filteredHospitals.map(hosp => (
                    <div key={hosp.id || hosp._id} className={styles.hospitalAdminCard}>
                      <div className={styles.cardImageContainer}>
                        <img
                          src={hosp.image}
                          alt={hosp.name}
                          className={styles.cardHospitalImage}
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=800&q=80';
                          }}
                        />
                        <div className={styles.cardCityBadge}>
                          <MapPin size={13} /> {hosp.city}
                        </div>
                        {hosp.emergency24x7 && (
                          <div className={styles.cardEmergencyBadge}>
                            24/7 Emergency
                          </div>
                        )}
                      </div>

                      <div className={styles.cardHospitalContent}>
                        <div className={styles.cardHeaderRow}>
                          <h3 className={styles.cardHospitalName}>{hosp.name}</h3>
                          <div className={styles.cardRating}>
                            <Star size={14} fill="#FACC15" color="#FACC15" />
                            <span>{hosp.rating}</span>
                          </div>
                        </div>

                        <p className={styles.cardAddress}>{hosp.address}</p>

                        <div className={styles.cardMetaRow}>
                          <div className={styles.metaPill}>
                            <Bed size={14} />
                            <span>{hosp.totalBeds} Beds</span>
                          </div>
                          {hosp.establishedYear && (
                            <div className={styles.metaPill}>
                              <span>Est. {hosp.establishedYear}</span>
                            </div>
                          )}
                          {hosp.phone && (
                            <div className={styles.metaPill}>
                              <Phone size={13} />
                              <span>{hosp.phone}</span>
                            </div>
                          )}
                        </div>

                        {hosp.specialties && hosp.specialties.length > 0 && (
                          <div className={styles.cardSpecialties}>
                            {hosp.specialties.slice(0, 4).map(spec => (
                              <span key={spec} className={styles.specTag}>{spec}</span>
                            ))}
                            {hosp.specialties.length > 4 && (
                              <span className={styles.specTagMore}>+{hosp.specialties.length - 4} more</span>
                            )}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px', margin: '12px 0 8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.75rem', background: '#eff6ff', color: '#2563eb', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                            📹 {(hosp.reels || []).filter(Boolean).length || 5} Reels
                          </span>
                          <span style={{ fontSize: '0.75rem', background: '#fef2f2', color: '#ef4444', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                            ▶️ {(hosp.youtube_videos || []).filter(Boolean).length || 5} Videos
                          </span>
                          <span style={{ fontSize: '0.75rem', background: '#fffbeb', color: '#d97706', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                            ⭐ {(hosp.star_doctors || []).length} Star Doctors
                          </span>
                        </div>

                        <div className={styles.cardFooterActions}>
                          <button
                            className={styles.secondaryBtn}
                            style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            onClick={() => onNavigate && onNavigate('hospital-profile', hosp.id || hosp._id)}
                            title="Open public hospital center page"
                          >
                            <ExternalLink size={14} /> View Center
                          </button>
                          <button
                            className={styles.editCardBtn}
                            onClick={() => handleOpenEditHospital(hosp)}
                          >
                            <Edit3 size={15} /> Edit Details
                          </button>
                          <button
                            className={styles.deleteCardBtn}
                            onClick={() => handleDeleteHospitalClick(hosp)}
                            title="Delete Hospital"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          {/* TAB: APPOINTMENTS & BOOKINGS */}
          <div className={styles.viewSection} style={{ display: activeTab === 'appointments' ? 'block' : 'none' }}>
            <div className={styles.viewHeader}>
              <div>
                <h1 className={styles.pageTitle}>Appointments & Hospital Bookings</h1>
                <p className={styles.pageSubtitle}>
                  Real-time patient visits, hospital OPD bookings, and doctor consultations across all facilities
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  className={styles.secondaryBtn}
                  onClick={fetchAppointments}
                  disabled={loadingAppointments}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <RefreshCw size={15} className={loadingAppointments ? styles.spinning : ''} />
                  <span>Refresh Bookings</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Bookings</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{appointments.length}</div>
              </div>
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '16px' }}>
                <span style={{ fontSize: '0.78rem', color: '#1d4ed8', fontWeight: 600, textTransform: 'uppercase' }}>Hospital Visits & Beds</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1d4ed8', marginTop: '4px' }}>
                  {appointments.filter(a => a.appointmentType === 'hospital' || a.hospitalId).length}
                </div>
              </div>
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '16px' }}>
                <span style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 600, textTransform: 'uppercase' }}>Doctor Consultations</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#047857', marginTop: '4px' }}>
                  {appointments.filter(a => a.appointmentType !== 'hospital' && !a.hospitalId).length}
                </div>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase' }}>Confirmed Active</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
                  {appointments.filter(a => (a.status || 'Confirmed') === 'Confirmed').length}
                </div>
              </div>
            </div>

            {/* Visit & Booking Metric Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '14px',
              marginBottom: '16px'
            }}>
              <div style={{ background: '#ffffff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>{appointmentStats.total}</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', marginTop: '2px' }}>Total Booked Patients</div>
                </div>
              </div>

              <div style={{ background: '#ffffff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCheck size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669', lineHeight: 1.1 }}>{appointmentStats.visited}</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', marginTop: '2px' }}>
                    Patients Visited ({appointmentStats.total > 0 ? Math.round((appointmentStats.visited / appointmentStats.total) * 100) : 0}%)
                  </div>
                </div>
              </div>

              <div style={{ background: '#ffffff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CalendarDays size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d97706', lineHeight: 1.1 }}>{appointmentStats.upcoming}</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', marginTop: '2px' }}>Upcoming / Scheduled</div>
                </div>
              </div>

              <div style={{ background: '#ffffff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626', lineHeight: 1.1 }}>{appointmentStats.cancelled}</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', marginTop: '2px' }}>Cancelled Bookings</div>
                </div>
              </div>
            </div>

            {/* Comprehensive Filter Bar (Presets, Year/Month/Day, Type, Status, Search) */}
            <div style={{
              background: '#ffffff',
              padding: '16px 20px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              {/* Row 1: Quick Time Presets & Reset */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    Period Preset:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAppointmentPreset('all');
                      setAppointmentYearFilter('all');
                      setAppointmentMonthFilter('all');
                      setAppointmentDayFilter('all');
                    }}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      border: appointmentPreset === 'all' && appointmentYearFilter === 'all' && appointmentMonthFilter === 'all' && appointmentDayFilter === 'all' ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                      background: appointmentPreset === 'all' && appointmentYearFilter === 'all' && appointmentMonthFilter === 'all' && appointmentDayFilter === 'all' ? '#2563eb' : '#ffffff',
                      color: appointmentPreset === 'all' && appointmentYearFilter === 'all' && appointmentMonthFilter === 'all' && appointmentDayFilter === 'all' ? '#ffffff' : '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    All Time ({appointments.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAppointmentPreset('today');
                      setAppointmentYearFilter('all');
                      setAppointmentMonthFilter('all');
                      setAppointmentDayFilter('all');
                    }}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      border: appointmentPreset === 'today' ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                      background: appointmentPreset === 'today' ? '#2563eb' : '#ffffff',
                      color: appointmentPreset === 'today' ? '#ffffff' : '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAppointmentPreset('this_month');
                      setAppointmentYearFilter('all');
                      setAppointmentMonthFilter('all');
                      setAppointmentDayFilter('all');
                    }}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      border: appointmentPreset === 'this_month' ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                      background: appointmentPreset === 'this_month' ? '#2563eb' : '#ffffff',
                      color: appointmentPreset === 'this_month' ? '#ffffff' : '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    This Month
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAppointmentPreset('this_year');
                      setAppointmentYearFilter('all');
                      setAppointmentMonthFilter('all');
                      setAppointmentDayFilter('all');
                    }}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      border: appointmentPreset === 'this_year' ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                      background: appointmentPreset === 'this_year' ? '#2563eb' : '#ffffff',
                      color: appointmentPreset === 'this_year' ? '#ffffff' : '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    This Year ({new Date().getFullYear()})
                  </button>
                </div>

                {(appointmentPreset !== 'all' || appointmentYearFilter !== 'all' || appointmentMonthFilter !== 'all' || appointmentDayFilter !== 'all' || appointmentTypeFilter !== 'all' || appointmentStatusFilter !== 'all' || appointmentSearch) && (
                  <button
                    type="button"
                    onClick={() => {
                      setAppointmentPreset('all');
                      setAppointmentYearFilter('all');
                      setAppointmentMonthFilter('all');
                      setAppointmentDayFilter('all');
                      setAppointmentTypeFilter('all');
                      setAppointmentStatusFilter('all');
                      setAppointmentSearch('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Reset Filters
                  </button>
                )}
              </div>

              {/* Row 2: Granular Selectors */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '10px',
                alignItems: 'center'
              }}>
                {/* Year */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', marginBottom: '3px', textTransform: 'uppercase' }}>Year</label>
                  <select
                    value={appointmentPreset !== 'all' ? 'preset' : appointmentYearFilter}
                    onChange={(e) => {
                      setAppointmentPreset('all');
                      setAppointmentYearFilter(e.target.value);
                    }}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', background: '#ffffff', outline: 'none' }}
                  >
                    <option value="all">All Years</option>
                    {availableAppointmentYears.map(yr => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                    {appointmentPreset !== 'all' && <option value="preset" disabled>Custom (Preset Active)</option>}
                  </select>
                </div>

                {/* Month */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', marginBottom: '3px', textTransform: 'uppercase' }}>Month</label>
                  <select
                    value={appointmentPreset !== 'all' ? 'preset' : appointmentMonthFilter}
                    onChange={(e) => {
                      setAppointmentPreset('all');
                      setAppointmentMonthFilter(e.target.value);
                    }}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', background: '#ffffff', outline: 'none' }}
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
                    {appointmentPreset !== 'all' && <option value="preset" disabled>Custom (Preset Active)</option>}
                  </select>
                </div>

                {/* Day */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', marginBottom: '3px', textTransform: 'uppercase' }}>Day</label>
                  <select
                    value={appointmentPreset !== 'all' ? 'preset' : appointmentDayFilter}
                    onChange={(e) => {
                      setAppointmentPreset('all');
                      setAppointmentDayFilter(e.target.value);
                    }}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', background: '#ffffff', outline: 'none' }}
                  >
                    <option value="all">All Days (1 - 31)</option>
                    {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map(d => (
                      <option key={d} value={d}>Day {d}</option>
                    ))}
                    {appointmentPreset !== 'all' && <option value="preset" disabled>Custom (Preset Active)</option>}
                  </select>
                </div>

                {/* Type */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', marginBottom: '3px', textTransform: 'uppercase' }}>Target</label>
                  <select
                    value={appointmentTypeFilter}
                    onChange={(e) => setAppointmentTypeFilter(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', background: '#ffffff', outline: 'none' }}
                  >
                    <option value="all">All Targets</option>
                    <option value="hospital">🏥 Hospitals Only</option>
                    <option value="doctor">👨‍⚕️ Doctors Only</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', marginBottom: '3px', textTransform: 'uppercase' }}>Visit Status</label>
                  <select
                    value={appointmentStatusFilter}
                    onChange={(e) => setAppointmentStatusFilter(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', background: '#ffffff', outline: 'none' }}
                  >
                    <option value="all">All Statuses</option>
                    <option value="Completed">Visited / Completed</option>
                    <option value="Confirmed">Confirmed / Upcoming</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Search */}
                <div style={{ gridColumn: 'span 1' }}>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', marginBottom: '3px', textTransform: 'uppercase' }}>Search</label>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      value={appointmentSearch}
                      onChange={(e) => setAppointmentSearch(e.target.value)}
                      placeholder="Patient, phone, hospital..."
                      style={{ width: '100%', padding: '7px 10px 7px 30px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.82rem', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Appointments Table */}
            <div className={styles.tableContainer}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Token / ID</th>
                    <th>Type</th>
                    <th>Medical Center / Specialist</th>
                    <th>Patient Details</th>
                    <th>Schedule Slot</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                        No appointments found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((apt) => {
                      const aptId = apt._id || apt.id || apt.appointmentId;
                      const isHospital = apt.appointmentType === 'hospital' || Boolean(apt.hospitalId);
                      const targetName = isHospital 
                        ? (apt.hospitalData?.name || apt.hospitalName || 'Hospital Visit')
                        : (apt.docData?.name || apt.doctorName || 'Doctor Consultation');
                      const subtitle = isHospital 
                        ? (apt.department ? `${apt.department} • ${apt.consultationType || 'OPD'}` : (apt.hospitalData?.city || 'Hospital OPD'))
                        : (apt.docData?.specialty || apt.department || 'Consultant');
                      const patientName = apt.userData?.name || apt.patientName || 'Patient';
                      const patientPhone = apt.userData?.phone || apt.patientPhone || 'N/A';
                      const patientEmail = apt.userData?.email || apt.patientEmail || '';
                      const dateSlot = apt.slotDate || apt.dateLabel || 'Scheduled';
                      const timeSlot = apt.slotTime || '';
                      const status = apt.status || 'Confirmed';

                      return (
                        <tr key={aptId}>
                          <td>
                            <span style={{
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              background: '#f1f5f9',
                              padding: '3px 7px',
                              borderRadius: '4px',
                              color: '#334155'
                            }}>
                              {aptId ? String(aptId).slice(-8).toUpperCase() : 'APT'}
                            </span>
                          </td>
                          <td>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '100px',
                              background: isHospital ? '#eff6ff' : '#ecfdf5',
                              color: isHospital ? '#1d4ed8' : '#047857',
                              border: isHospital ? '1px solid #bfdbfe' : '1px solid #a7f3d0'
                            }}>
                              {isHospital ? <Building2 size={12} /> : <Stethoscope size={12} />}
                              <span>{isHospital ? 'Hospital OPD' : 'Doctor Consult'}</span>
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{targetName}</strong>
                              <span style={{ fontSize: '0.76rem', color: '#64748b' }}>{subtitle}</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>{patientName}</strong>
                              <span style={{ fontSize: '0.76rem', color: '#475569' }}>
                                📞 {patientPhone} {patientEmail ? `• ${patientEmail}` : ''}
                              </span>
                              {(apt.userData?.symptoms || apt.symptoms) && (
                                <span style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic', marginTop: '2px' }}>
                                  Reason: {apt.userData?.symptoms || apt.symptoms}
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <strong style={{ fontSize: '0.86rem', color: '#0f172a' }}>{dateSlot}</strong>
                              <span style={{ fontSize: '0.76rem', color: '#2563eb', fontWeight: 600 }}>{timeSlot}</span>
                            </div>
                          </td>
                          <td>
                            <span style={{
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '4px',
                              background: status === 'Confirmed' ? '#ecfdf5' : status === 'Completed' ? '#eff6ff' : '#fef2f2',
                              color: status === 'Confirmed' ? '#059669' : status === 'Completed' ? '#2563eb' : '#dc2626'
                            }}>
                              {status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                              {status !== 'Completed' && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(aptId, 'Completed')}
                                  title="Mark as Visited / Completed"
                                  style={{
                                    padding: '4px 9px',
                                    borderRadius: '6px',
                                    border: '1px solid #86efac',
                                    background: '#dcfce7',
                                    color: '#15803d',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px'
                                  }}
                                >
                                  <Check size={12} />
                                  <span>Mark Visited</span>
                                </button>
                              )}
                              {status !== 'Cancelled' && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(aptId, 'Cancelled')}
                                  title="Cancel Appointment"
                                  style={{
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid #fecaca',
                                    background: '#fef2f2',
                                    color: '#dc2626',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Cancel
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteAppointment(aptId)}
                                title="Delete Record"
                                style={{
                                  padding: '5px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  background: 'transparent',
                                  color: '#94a3b8',
                                  cursor: 'pointer'
                                }}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* TAB 4: FRONT PAGE CONTENT */}
          <div className={styles.viewSection} style={{ display: activeTab === 'content' ? 'block' : 'none' }}>
            <FrontPageEditor showToast={showToast} />
          </div>

          {/* TAB 6: FAQs MANAGEMENT */}
          <div className={styles.viewSection} style={{ display: activeTab === 'faqs' ? 'block' : 'none' }}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Frequently Asked Questions (FAQs)</h2>
                  <p className={styles.sectionSub}>Add new FAQs or modify existing answers displayed on the public portal.</p>
                </div>
                <button
                  className={styles.primaryActionBtn}
                  onClick={() => {
                    setFaqToEdit(null);
                    setIsFaqModalOpen(true);
                  }}
                >
                  <Plus size={16} /> Add New FAQ
                </button>
              </div>

              {/* Filters */}
              <div className={styles.filterBar}>
                <div className={styles.searchBox}>
                  <Search size={18} className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Search FAQs by question or answer keyword..."
                    value={faqSearch}
                    onChange={(e) => setFaqSearch(e.target.value)}
                  />
                  {faqSearch && (
                    <button className={styles.clearSearch} onClick={() => setFaqSearch('')}>×</button>
                  )}
                </div>
                <div className={styles.filterGroup}>
                  <Filter size={16} className={styles.filterIcon} />
                  <select
                    value={faqCategoryFilter}
                    onChange={(e) => setFaqCategoryFilter(e.target.value)}
                    className={styles.filterSelect}
                  >
                    <option value="all">All Categories ({faqs.length})</option>
                    {faqFilterCategories.map(cat => {
                      const count = faqs.filter(f => f.category === cat).length;
                      return (
                        <option key={cat} value={cat}>
                          {cat} {count > 0 ? `(${count})` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* FAQ Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
                {(faqs || [])
                  .filter(f => {
                    const matchCat = faqCategoryFilter === 'all' || f.category === faqCategoryFilter;
                    const q = faqSearch.toLowerCase().trim();
                    const matchSearch = !q ||
                      (f.question || '').toLowerCase().includes(q) ||
                      (f.answer || '').toLowerCase().includes(q);
                    return matchCat && matchSearch;
                  })
                  .map((faq) => (
                    <div
                      key={faq.id || faq._id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '14px',
                        padding: '18px 22px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                          {(() => {
                            const isCustom = faq.icon && (faq.icon.startsWith('http') || faq.icon.startsWith('data:image') || faq.icon.startsWith('/') || faq.icon.includes('.'));
                            if (isCustom) {
                              return (
                                <div
                                  title="Custom Uploaded Icon"
                                  style={{
                                    width: '42px',
                                    height: '42px',
                                    borderRadius: '11px',
                                    background: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    border: '1px solid #cbd5e1',
                                    marginTop: '2px',
                                    overflow: 'hidden',
                                    padding: '6px'
                                  }}
                                >
                                  <img src={faq.icon} alt="FAQ Icon" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                </div>
                              );
                            }
                            const iconOpt = FAQ_ICON_OPTIONS.find(o => o.id === faq.icon) || FAQ_ICON_OPTIONS[0];
                            const IconComp = iconOpt.icon;
                            return (
                              <div
                                title={`Icon: ${iconOpt.label}`}
                                style={{
                                  width: '42px',
                                  height: '42px',
                                  borderRadius: '11px',
                                  background: iconOpt.bg,
                                  color: iconOpt.color,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  border: '1px solid #e2e8f0',
                                  marginTop: '2px'
                                }}
                              >
                                <IconComp size={20} />
                              </div>
                            );
                          })()}
                          <div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.75rem', background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                                {faq.category}
                              </span>
                              {faq.targetName && (
                                <span style={{
                                  fontSize: '0.75rem',
                                  background: faq.targetType === 'doctor' ? '#f5f3ff' : '#ecfdf5',
                                  color: faq.targetType === 'doctor' ? '#7c3aed' : '#059669',
                                  border: `1px solid ${faq.targetType === 'doctor' ? '#ddd6fe' : '#a7f3d0'}`,
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  fontWeight: 700
                                }}>
                                  {faq.targetType === 'doctor' ? '👨‍⚕️ Doctor: ' : '🏥 Hospital: '}
                                  {faq.targetName}
                                </span>
                              )}
                              <span style={{ fontSize: '0.75rem', background: faq.isActive ? '#ecfdf5' : '#f1f5f9', color: faq.isActive ? '#059669' : '#64748b', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                                {faq.isActive ? 'Active' : 'Hidden'}
                              </span>
                            </div>
                            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                              {faq.question}
                            </h4>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setFaqToEdit(faq);
                              setIsFaqModalOpen(true);
                            }}
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              borderRadius: '8px',
                              padding: '6px 12px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              color: '#2563eb',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Edit3 size={14} /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteModalState({
                                isOpen: true,
                                type: 'faq',
                                item: faq
                              });
                            }}
                            style={{
                              background: '#fef2f2',
                              border: '1px solid #fecaca',
                              borderRadius: '8px',
                              padding: '6px 10px',
                              color: '#ef4444',
                              cursor: 'pointer'
                            }}
                            title="Delete FAQ"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', lineHeight: 1.55 }}>
                        {faq.answer}
                      </p>
                    </div>
                  ))}
              </div>
            </div>

          {/* TAB 7: PUBLIC REVIEWS */}
          <div className={styles.viewSection} style={{ display: activeTab === 'reviews' ? 'block' : 'none' }}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Public Reviews & Patient Testimonials</h2>
                  <p className={styles.sectionSub}>Moderate user reviews, verify insurance experiences, or add official hospital reviews.</p>
                </div>
                <button
                  className={styles.primaryActionBtn}
                  onClick={() => {
                    setReviewToEdit(null);
                    setIsReviewModalOpen(true);
                  }}
                >
                  <Plus size={16} /> Add New Review
                </button>
              </div>

              {/* Filters */}
              <div className={styles.filterBar}>
                <div className={styles.searchBox}>
                  <Search size={18} className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Search by patient name, hospital, surgery, or keywords..."
                    value={reviewSearch}
                    onChange={(e) => setReviewSearch(e.target.value)}
                  />
                  {reviewSearch && (
                    <button className={styles.clearSearch} onClick={() => setReviewSearch('')}>×</button>
                  )}
                </div>
                <div className={styles.filterGroup}>
                  <Filter size={16} className={styles.filterIcon} />
                  <select
                    value={reviewStatusFilter}
                    onChange={(e) => setReviewStatusFilter(e.target.value)}
                    className={styles.filterSelect}
                  >
                    <option value="all">All Reviews ({reviews.length})</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Reviews List */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px', marginTop: '16px' }}>
                {(reviews || [])
                  .filter(r => {
                    const matchStatus = reviewStatusFilter === 'all' || r.status === reviewStatusFilter;
                    const q = reviewSearch.toLowerCase().trim();
                    const matchSearch = !q ||
                      (r.patientName || '').toLowerCase().includes(q) ||
                      (r.targetName || '').toLowerCase().includes(q) ||
                      (r.comment || '').toLowerCase().includes(q);
                    return matchStatus && matchSearch;
                  })
                  .map((rev) => (
                    <div
                      key={rev.id || rev._id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '14px',
                        padding: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <strong style={{ fontSize: '0.98rem', color: '#0f172a' }}>{rev.patientName}</strong>
                          <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block' }}>{rev.patientCity}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={14}
                              fill={s <= Number(rev.rating) ? '#f59e0b' : '#e2e8f0'}
                              color={s <= Number(rev.rating) ? '#f59e0b' : '#cbd5e1'}
                            />
                          ))}
                        </div>
                      </div>

                      <div style={{ fontSize: '0.8rem', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', color: '#334155', border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: rev.targetType === 'doctor' ? '#f5f3ff' : '#eff6ff',
                            color: rev.targetType === 'doctor' ? '#7c3aed' : '#2563eb',
                            border: `1px solid ${rev.targetType === 'doctor' ? '#ddd6fe' : '#bfdbfe'}`
                          }}>
                            {rev.targetType === 'doctor' ? '👨‍⚕️ Doctor Review' : '🏥 Hospital Review'}
                          </span>
                          <strong style={{ color: '#0f172a' }}>{rev.targetName}</strong>
                        </div>
                        {rev.treatment && <span style={{ display: 'block', color: '#2563eb' }}>Treatment: {rev.treatment}</span>}
                        {rev.insuranceUsed && <span style={{ display: 'block', color: '#059669' }}>Insurance: {rev.insuranceUsed}</span>}
                      </div>

                      <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569', lineHeight: 1.5 }}>
                        {rev.comment}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '3px 8px',
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
                              setIsReviewModalOpen(true);
                            }}
                            style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '0.78rem', fontWeight: 600, color: '#2563eb', cursor: 'pointer' }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteModalState({
                                isOpen: true,
                                type: 'review',
                                item: { ...rev, name: rev.patientName + "'s review" }
                              });
                            }}
                            style={{ background: '#fef2f2', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '0.78rem', color: '#ef4444', cursor: 'pointer' }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

          {/* TAB 8: SPECIALITIES & SURGERIES */}
          <div className={styles.viewSection} style={{ display: activeTab === 'specialities' ? 'block' : 'none' }}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Specialities & Procedures (Surgeries)</h2>
                  <p className={styles.sectionSub}>Manage clinical departments, surgical procedures, and cashless insurance coverage parameters.</p>
                </div>
                <button
                  className={styles.primaryActionBtn}
                  onClick={() => {
                    setSpecToEdit(null);
                    setIsSpecModalOpen(true);
                  }}
                >
                  <Plus size={16} /> Add Speciality / Surgery
                </button>
              </div>

              {/* Filters */}
              <div className={styles.filterBar}>
                <div className={styles.searchBox}>
                  <Search size={18} className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Search specialities, procedures, surgeries..."
                    value={specSearch}
                    onChange={(e) => setSpecSearch(e.target.value)}
                  />
                  {specSearch && (
                    <button className={styles.clearSearch} onClick={() => setSpecSearch('')}>×</button>
                  )}
                </div>
                <div className={styles.filterGroup}>
                  <Filter size={16} className={styles.filterIcon} />
                  <select
                    value={specTypeFilter}
                    onChange={(e) => setSpecTypeFilter(e.target.value)}
                    className={styles.filterSelect}
                  >
                    <option value="all">All Items ({specialitiesProcedures.length})</option>
                    <option value="speciality">Specialities Only</option>
                    <option value="procedure">Procedures / Surgeries Only</option>
                  </select>
                </div>
              </div>

              {/* Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px', marginTop: '16px' }}>
                {(specialitiesProcedures || [])
                  .filter(sp => {
                    const matchType = specTypeFilter === 'all' || sp.type === specTypeFilter;
                    const q = specSearch.toLowerCase().trim();
                    const matchSearch = !q ||
                      (sp.name || '').toLowerCase().includes(q) ||
                      (sp.description || '').toLowerCase().includes(q);
                    return matchType && matchSearch;
                  })
                  .map((sp) => (
                    <div
                      key={sp.id || sp._id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '14px',
                        padding: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: sp.type === 'procedure' ? '#eff6ff' : '#f0fdf4',
                            color: sp.type === 'procedure' ? '#2563eb' : '#059669',
                            display: 'inline-block',
                            marginBottom: '4px'
                          }}>
                            {sp.type === 'procedure' ? 'Surgical Procedure' : 'Medical Speciality'}
                          </span>
                          <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                            {sp.name}
                          </h4>
                        </div>

                        <span style={{ fontSize: '0.8rem', background: '#f8fafc', padding: '4px 8px', borderRadius: '6px', color: '#64748b' }}>
                          Icon: {sp.icon || 'Bot'}
                        </span>
                      </div>

                      <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ color: '#059669', fontWeight: 700 }}>
                          🛡️ {sp.insuranceDetails?.coveragePercent || 'Cashless Available'}
                        </span>
                        <span style={{ color: '#475569' }}>
                          Cost: <strong>{sp.insuranceDetails?.estimatedCostRange || '₹45,000 - ₹90,000'}</strong>
                        </span>
                        <span style={{ color: '#64748b' }}>
                          Pre-Auth: {sp.insuranceDetails?.preAuthHours || '30 Mins'}
                        </span>
                      </div>

                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.45 }}>
                        {sp.description}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSpecToEdit(sp);
                            setIsSpecModalOpen(true);
                          }}
                          style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '0.8rem', fontWeight: 600, color: '#2563eb', cursor: 'pointer' }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteModalState({
                              isOpen: true,
                              type: 'speciality',
                              item: sp
                            });
                          }}
                          style={{ background: '#fef2f2', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '0.8rem', color: '#ef4444', cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

          {/* TAB 9: SITE IDENTITY & LOGO */}
          <div className={styles.viewSection} style={{ display: activeTab === 'branding' ? 'block' : 'none' }}>
            <BrandingManager showToast={showToast} />
          </div>
        </main>
      </div>

      {/* Modals */}
      <DoctorFormModal
        isOpen={isDoctorModalOpen}
        onClose={() => setIsDoctorModalOpen(false)}
        doctorToEdit={doctorToEdit}
        onSuccess={showToast}
      />

      <HospitalFormModal
        isOpen={isHospitalModalOpen}
        onClose={() => setIsHospitalModalOpen(false)}
        hospitalToEdit={hospitalToEdit}
        onSuccess={showToast}
      />

      {isFaqModalOpen && (
        <FaqFormModal
          faqToEdit={faqToEdit}
          onClose={() => setIsFaqModalOpen(false)}
          onSave={(data) => {
            if (faqToEdit) {
              updateFaq(faqToEdit.id || faqToEdit._id, data);
              showToast('FAQ updated successfully!');
            } else {
              addFaq(data);
              showToast('New FAQ added successfully!');
            }
            setIsFaqModalOpen(false);
          }}
        />
      )}

      {isReviewModalOpen && (
        <ReviewFormModal
          reviewToEdit={reviewToEdit}
          onClose={() => setIsReviewModalOpen(false)}
          onSave={(data) => {
            if (reviewToEdit) {
              updateReview(reviewToEdit.id || reviewToEdit._id, data);
              showToast('Review updated successfully!');
            } else {
              addReview(data);
              showToast('New Review added successfully!');
            }
            setIsReviewModalOpen(false);
          }}
        />
      )}

      {isSpecModalOpen && (
        <SpecialityFormModal
          itemToEdit={specToEdit}
          onClose={() => setIsSpecModalOpen(false)}
          onSave={(data) => {
            if (specToEdit) {
              updateSpecialityProcedure(specToEdit.id || specToEdit._id, data);
              showToast('Speciality / Procedure updated successfully!');
            } else {
              addSpecialityProcedure(data);
              showToast('New Speciality / Procedure created successfully!');
            }
            setIsSpecModalOpen(false);
          }}
        />
      )}

      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, type: null, item: null })}
        onConfirm={handleConfirmDelete}
        title={
          deleteModalState.type === 'reset'
            ? 'Reset to Default Seeds?'
            : `Delete ${deleteModalState.type === 'doctor' ? 'Doctor' : deleteModalState.type === 'hospital' ? 'Hospital' : deleteModalState.type === 'faq' ? 'FAQ' : deleteModalState.type === 'review' ? 'Review' : 'Speciality'}?`
        }
        message={
          deleteModalState.type === 'reset'
            ? 'This will restore the initial pre-configured database back to initial defaults.'
            : `Are you sure you want to delete this record? It will be removed from both the Admin Panel and the public website.`
        }
        itemName={deleteModalState.item?.name || deleteModalState.item?.question || deleteModalState.item?.patientName}
      />
    </div>
  );
};

export default AdminPanel;
