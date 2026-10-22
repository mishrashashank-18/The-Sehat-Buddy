import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Video,
  User,
  CheckCircle,
  FileText,
  MessageSquare,
  CheckCircle2,
  IndianRupee,
  DollarSign,
  Star,
  Plus,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Activity,
  X,
  Check,
  Upload,
  Loader2,
  Camera,
  Award,
  ShieldCheck,
  GraduationCap,
  Users,
  Briefcase,
  ExternalLink,
  Trash2,
  Edit2,
  Play,
  AlertTriangle,
  RotateCcw,
  Eye,
  HelpCircle,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Save,
  Printer,
  TrendingUp,
  Wallet,
  CalendarDays,
  Sparkles,
  Info,
  Lock,
  Copy
} from 'lucide-react';
import { useData } from '../../context/useData';
import { broadcastSync, matchesId } from '../../context/DataContext';
import { api, API_BASE } from '../../services/api';
import { getDoctorVerifiedReviews } from '../doctors/DoctorProfile';
import logoImg from '../../assets/images/logo.png';
import styles from './DoctorDashboard.module.css';

const Instagram = ({ size = 18, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const Youtube = ({ size = 18, color = "currentColor", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
  </svg>
);

const getMediaEmbedUrl = (url) => {
  if (!url) return '';
  try {
    if (url.includes('youtu.be/') || url.includes('youtube.com/watch') || url.includes('youtube.com/shorts/')) {
      let videoId = '';
      if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
      else if (url.includes('youtube.com/watch?v=')) videoId = url.split('v=')[1].split('&')[0];
      else if (url.includes('youtube.com/shorts/')) videoId = url.split('shorts/')[1].split('?')[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url;
    }
    if (url.includes('instagram.com')) {
      const match = url.match(/instagram\.com\/(?:reel|reels|p|tv|share\/reel)\/([^/?#&]+)/i);
      if (match && match[1]) {
        let shortcode = match[1];
        const brokenMap = {
          'DeArmJdSQa6': 'DWGyY03lWc2',
          'DeAA8evMsBS': 'DXpDWdoDKai',
          'DdrR6vApDBK': 'DZdBbmoM1tn',
          'DdmEKEvTVC5': 'C-U4Xo9MvjQ',
          'C9_K5qXMO9e': 'DWGyY03lWc2'
        };
        if (brokenMap[shortcode]) shortcode = brokenMap[shortcode];
        return `https://www.instagram.com/reel/${shortcode}/embed/`;
      }
    }
    return url;
  } catch {
    return url;
  }
};

const INITIAL_APPOINTMENTS = [];
const INITIAL_PRESCRIPTIONS = [];

const MOCK_PATIENT_NAMES = ['Aarav Mehta', 'Sneha Kapur', 'Rajesh Kulkarni', 'Meera Iyer', 'Vikas Malhotra'];
const MOCK_PATIENT_IDS = ['1', '2', '3', '4', '5', 1, 2, 3, 4, 5];

export const isMockPatientAppointment = (apt) => {
  if (!apt) return true;
  if (MOCK_PATIENT_IDS.includes(apt.id) || MOCK_PATIENT_IDS.includes(apt._id)) return true;
  const pName = apt.patientName || apt.userData?.name;
  if (pName && MOCK_PATIENT_NAMES.includes(pName)) return true;
  return false;
};

const MOCK_RX_NAMES = ['Vikas Malhotra', 'Sunil Chawla'];
const MOCK_RX_IDS = ['1', '2', 1, 2];

export const isMockPrescriptionItem = (rx) => {
  if (!rx) return true;
  if (MOCK_RX_IDS.includes(rx.id) || MOCK_RX_IDS.includes(rx._id)) return true;
  if (rx.patientName && MOCK_RX_NAMES.includes(rx.patientName)) return true;
  return false;
};

// Automatic appointment de-duplication helper (eliminates duplicate entries by ID and patient slot fingerprint)
export const dedupeAppointments = (list) => {
  if (!Array.isArray(list)) return [];
  const seenIds = new Set();
  const seenFingerprints = new Set();
  const result = [];
  for (const item of list) {
    if (!item || isMockPatientAppointment(item)) continue;
    const strId = String(item.id || item._id);
    const pName = (item.patientName || item.userData?.name || '').toLowerCase().trim();
    const dStr = String(item.slotDate || item.dateStr || item.date || '').trim();
    const tStr = String(item.slotTime || item.time || '').trim();
    const fingerprint = `${pName}_${dStr}_${tStr}`;

    if (!seenIds.has(strId) && (!pName || !seenFingerprints.has(fingerprint))) {
      seenIds.add(strId);
      if (pName) seenFingerprints.add(fingerprint);
      result.push(item);
    }
  }
  return result;
};

// Persistent Status Overrides: guarantees that once an appointment status is changed
// (e.g. marked Completed or Reopened), it will never be clobbered by defaults, refreshes, or key transitions.
const STATUS_OVERRIDES_KEY = 'sehatbuddy_appointment_status_overrides';

const getStoredStatusOverrides = () => {
  try {
    const raw = localStorage.getItem(STATUS_OVERRIDES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
};

const saveStatusOverride = (appointmentId, newStatus) => {
  try {
    const overrides = getStoredStatusOverrides();
    overrides[String(appointmentId)] = {
      status: newStatus,
      updatedAt: Date.now()
    };
    localStorage.setItem(STATUS_OVERRIDES_KEY, JSON.stringify(overrides));
    broadcastSync(STATUS_OVERRIDES_KEY, overrides);
  } catch {}
};

const removeStatusOverride = (appointmentId) => {
  try {
    const overrides = getStoredStatusOverrides();
    delete overrides[String(appointmentId)];
    localStorage.setItem(STATUS_OVERRIDES_KEY, JSON.stringify(overrides));
    broadcastSync(STATUS_OVERRIDES_KEY, overrides);
  } catch {}
};

const applyStatusOverrides = (appointmentsList) => {
  if (!Array.isArray(appointmentsList)) return [];
  const overrides = getStoredStatusOverrides();
  return appointmentsList.map(apt => {
    const aptId = String(apt.id !== undefined && apt.id !== null ? apt.id : apt._id || '');
    const override = overrides[aptId] || (apt._id ? overrides[String(apt._id)] : null);
    if (override && override.status) {
      return { ...apt, status: override.status };
    }
    return apt;
  });
};

const getDoctorStorageKeys = (doc, user) => {
  const keys = new Set();
  const email = (doc?.email || user?.email || '').toLowerCase().trim();
  if (email) {
    keys.add(`sehatbuddy_doc_appointments_${email}`);
  }
  const id = doc?.id || user?.id;
  if (id) {
    keys.add(`sehatbuddy_doc_appointments_${id}`);
  }
  const mongoId = doc?._id || user?._id;
  if (mongoId) {
    keys.add(`sehatbuddy_doc_appointments_${mongoId}`);
  }
  // Standard compatibility keys
  keys.add('sehatbuddy_doc_appointments_1');
  keys.add('sehatbuddy_doc_appointments_default');
  return Array.from(keys);
};

// Local calendar date helper (prevents UTC timezone shift issues & handles multiple date string formats)
export const getLocalDateString = (d = new Date()) => {
  if (!d) return '';
  if (typeof d === 'string') {
    const trimmed = d.trim();
    if (!trimmed) return '';
    // YYYY-MM-DD
    const ymdMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    if (ymdMatch) {
      return `${ymdMatch[1]}-${String(ymdMatch[2]).padStart(2, '0')}-${String(ymdMatch[3]).padStart(2, '0')}`;
    }
    // DD-MM-YYYY or DD/MM/YYYY or DD_MM_YYYY
    const dmyMatch = trimmed.match(/^(\d{1,2})[-/_.](\d{1,2})[-/_.](\d{4})$/);
    if (dmyMatch) {
      return `${dmyMatch[3]}-${String(dmyMatch[2]).padStart(2, '0')}-${String(dmyMatch[1]).padStart(2, '0')}`;
    }
    // Purely digits (numeric timestamp string)
    if (/^\d{10,}$/.test(trimmed)) {
      const ts = Number(trimmed);
      const dObj = new Date(ts);
      if (!isNaN(dObj.getTime())) {
        return `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(dObj.getDate()).padStart(2, '0')}`;
      }
    }
  }
  if (typeof d === 'number') {
    const dObj = new Date(d);
    if (!isNaN(dObj.getTime())) {
      return `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(dObj.getDate()).padStart(2, '0')}`;
    }
  }
  const dateObj = d instanceof Date ? d : new Date(d);
  if (isNaN(dateObj.getTime())) return '';
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const DoctorDashboard = ({ onNavigate }) => {
  // Live real-time PC date tracker: always pulls directly from the user's PC
  const [currentPcDate, setCurrentPcDate] = useState(() => new Date());

  React.useEffect(() => {
    const updateTimeFromPc = () => setCurrentPcDate(new Date());
    window.addEventListener('focus', updateTimeFromPc);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') updateTimeFromPc();
    });
    const interval = setInterval(updateTimeFromPc, 15000);
    return () => {
      window.removeEventListener('focus', updateTimeFromPc);
      clearInterval(interval);
    };
  }, []);

  const todayDateStr = React.useMemo(() => getLocalDateString(currentPcDate), [currentPcDate]);
  const { doctors, updateDoctor, deleteDoctor, reviews } = useData();

  // Active doctor selection: strictly locks to the authenticated doctor's account
  const storedUser = React.useMemo(() => {
    try {
      const docUser = localStorage.getItem('doctor_user');
      if (docUser) return JSON.parse(docUser);
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);

  const activeDoctor = React.useMemo(() => {
    if (storedUser && (storedUser._id || storedUser.id)) {
      const match = doctors.find(d => matchesId(d, storedUser));
      if (match) return match;
    }
    if (storedUser && storedUser.email) {
      const emailMatch = doctors.find(d => (d.email || '').toLowerCase().trim() === storedUser.email.toLowerCase().trim());
      if (emailMatch) return emailMatch;
    }
    return doctors[0] || {};
  }, [doctors, storedUser]);

  // Real-time verified patient reviews & rating calculation (strictly synchronized with public Doctor Profile)
  const doctorVerifiedReviews = React.useMemo(() => {
    return getDoctorVerifiedReviews(activeDoctor, reviews);
  }, [activeDoctor, reviews]);

  const verifiedReviewsCount = doctorVerifiedReviews.length;
  const verifiedAvgRating = React.useMemo(() => {
    if (doctorVerifiedReviews.length === 0) return '0';
    const total = doctorVerifiedReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0);
    return (total / doctorVerifiedReviews.length).toFixed(1);
  }, [doctorVerifiedReviews]);

  // Status: 'Available' | 'Busy' | 'On Leave'
  const [availabilityStatus, setAvailabilityStatus] = useState(() => {
    return activeDoctor.availabilityStatus || (activeDoctor.available === false ? 'On Leave' : 'Available');
  });

  React.useEffect(() => {
    if (activeDoctor?.availabilityStatus) {
      setAvailabilityStatus(activeDoctor.availabilityStatus);
    } else if (activeDoctor?.available === false) {
      setAvailabilityStatus('On Leave');
    } else if (activeDoctor?.available === true) {
      setAvailabilityStatus('Available');
    }
  }, [activeDoctor?.availabilityStatus, activeDoctor?.available, activeDoctor?.id, activeDoctor?._id]);

  const handleSetAvailabilityStatus = async (newStatus) => {
    setAvailabilityStatus(newStatus);
    const docId = activeDoctor?.id || activeDoctor?._id;
    if (docId) {
      await updateDoctor(docId, {
        availabilityStatus: newStatus,
        available: true // Doctor remains listed in directory regardless of shift status
      });
    }
    const label = newStatus === 'Busy' ? 'In Surgery / Busy' : newStatus;
    showToast(`Status set to ${label}`);
  };

  const activeDocId = activeDoctor?.id || activeDoctor?._id || 'default';

  // Appointments state with persistent storage per doctor and bulletproof status overrides
  const [appointments, setAppointments] = useState(() => {
    try {
      const keys = getDoctorStorageKeys(activeDoctor, storedUser);
      for (const key of keys) {
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const clean = dedupeAppointments(parsed);
            if (clean.length > 0) {
              return applyStatusOverrides(clean);
            }
          }
        }
      }
    } catch {}
    return [];
  });
  const [appointmentFilter, setAppointmentFilter] = useState('all');

  // Prescriptions state with persistent storage per doctor
  const [prescriptions, setPrescriptions] = useState(() => {
    try {
      const keys = getDoctorStorageKeys(activeDoctor, storedUser);
      for (const key of keys) {
        const rxKey = key.replace('appointments', 'prescriptions');
        const saved = localStorage.getItem(rxKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const clean = parsed.filter(r => !isMockPrescriptionItem(r));
            if (clean.length > 0) {
              return clean;
            }
          }
        }
      }
    } catch {}
    return [];
  });

  // Unified persistent writers across all doctor storage aliases
  const saveDoctorAppointments = React.useCallback((updated) => {
    try {
      const keys = getDoctorStorageKeys(activeDoctor, storedUser);
      for (const k of keys) {
        localStorage.setItem(k, JSON.stringify(updated));
      }
      broadcastSync(`sehatbuddy_doc_appointments_${activeDocId}`, updated);
      broadcastSync(STATUS_OVERRIDES_KEY, getStoredStatusOverrides());
    } catch {}
  }, [activeDoctor, storedUser, activeDocId]);

  const saveDoctorPrescriptions = React.useCallback((updated) => {
    try {
      const keys = getDoctorStorageKeys(activeDoctor, storedUser);
      for (const k of keys) {
        const rxKey = k.replace('appointments', 'prescriptions');
        localStorage.setItem(rxKey, JSON.stringify(updated));
      }
      broadcastSync(`sehatbuddy_doc_prescriptions_${activeDocId}`, updated);
    } catch {}
  }, [activeDoctor, storedUser, activeDocId]);

  // Selected prescription for formatted printable PDF preview
  const [selectedRxForPrint, setSelectedRxForPrint] = useState(null);

  // Active Tab: 'appointments' | 'prescriptions' | 'profile' (persisted across refresh)
  const [activeTab, setActiveTabState] = useState(() => {
    try {
      const saved = localStorage.getItem('sehat_doctor_active_tab');
      if (saved && ['appointments', 'prescriptions', 'profile'].includes(saved)) {
        return saved;
      }
    } catch {}
    return 'appointments';
  });

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    try {
      localStorage.setItem('sehat_doctor_active_tab', tab);
    } catch {}
  };

  // Helper for default procedure & qualification tags
  const getDefaultDoctorTags = (doc) => {
    if (Array.isArray(doc?.tags) && doc.tags.length > 0) {
      return doc.tags.filter(Boolean);
    }
    const list = [];
    if (doc?.degree || doc?.qualifications) {
      const parts = (doc.degree || doc.qualifications).split(/[,/]+/).map(s => s.trim()).filter(Boolean);
      list.push(...parts);
    }
    const spec = (doc?.specialty || doc?.specialization || '').toLowerCase();
    if (spec.includes('dent') || spec.includes('paedo')) {
      list.push('BDS', 'MDS - Paedodontics', 'Implantologist', 'Pediatric Dentist', 'Cosmetic/Aesthetic Dentist', 'Preventive Dentistry', 'Dental Surgeon');
    } else if (spec.includes('cardio')) {
      list.push('Interventional Cardiologist', 'Angioplasty Specialist', 'Echocardiography', 'Heart Failure Care', 'Preventive Cardiology', 'Chest Pain Specialist');
    } else if (spec.includes('derma')) {
      list.push('Clinical Dermatology', 'Cosmetic/Aesthetic Specialist', 'Laser Therapeutics', 'Trichology', 'Cutaneous Surgeon', 'Acne & Skin Care');
    } else if (spec.includes('ortho')) {
      list.push('Joint Replacement', 'Arthroscopy Specialist', 'Robotic Knee Surgery', 'Sports Medicine', 'Trauma Surgeon', 'Spine Rehabilitation');
    } else if (spec.includes('pedia')) {
      list.push('Pediatric Intensive Care', 'Neonatology', 'Child Growth & Development', 'Vaccination Specialist', 'Pediatric Allergy Care');
    } else if (spec.includes('gyne') || spec.includes('obs')) {
      list.push('High-Risk Obstetrics', 'Laparoscopic Surgeon', 'Infertility Specialist', 'Women Hormonal Health', 'Maternal Fetal Care');
    } else if (spec.includes('neuro')) {
      list.push('Stroke Rehabilitation', 'Neurocritical Care', 'Electrophysiology', 'Headache & Migraine Specialist', 'Epilepsy Care');
    } else if (spec.includes('uro')) {
      list.push('Robotic Urological Surgery', 'Kidney Stone Specialist', 'Endourology', 'Renal Transplant', 'Prostate Care');
    } else {
      list.push('Consultant Physician', 'Clinical Diagnostics', 'Preventive Healthcare', 'Chronic Disease Management', 'Health Wellness');
    }
    return Array.from(new Set(list));
  };

  // Local state for profile form to prevent API spam and CastErrors
  const [profileForm, setProfileForm] = useState(activeDoctor);
  const [isSavingAbout, setIsSavingAbout] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [newAwardInput, setNewAwardInput] = useState('');
  const [newAwardYear, setNewAwardYear] = useState('');
  const [newCertInput, setNewCertInput] = useState('');
  const [newMembershipInput, setNewMembershipInput] = useState('');
  const [newCareerExpInput, setNewCareerExpInput] = useState('');
  const [newCareerExpStartYear, setNewCareerExpStartYear] = useState('');
  const [newCareerExpEndYear, setNewCareerExpEndYear] = useState('');
  const [newCareerExpIsPresent, setNewCareerExpIsPresent] = useState(false);

  // Inline editing states for modifying existing items
  const [editingAward, setEditingAward] = useState({ index: null, text: '', year: '' });
  const [editingCert, setEditingCert] = useState({ index: null, text: '' });
  const [editingMembership, setEditingMembership] = useState({ index: null, text: '' });
  const [editingCareerExp, setEditingCareerExp] = useState({ index: null, text: '', startYear: '', endYear: '', isPresent: false });

  // Schedule & Time Slots Management state (persisted across refresh)
  const [slotConfigMode, setSlotConfigModeState] = useState(() => {
    try {
      return localStorage.getItem('sehat_doctor_slot_mode') || 'all';
    } catch {
      return 'all';
    }
  });

  const setSlotConfigMode = (mode) => {
    setSlotConfigModeState(mode);
    try {
      localStorage.setItem('sehat_doctor_slot_mode', mode);
    } catch {}
  };

  const [selectedScheduleDay, setSelectedScheduleDayState] = useState(() => {
    try {
      return localStorage.getItem('sehat_doctor_slot_day') || 'Mon';
    } catch {
      return 'Mon';
    }
  });

  const setSelectedScheduleDay = (day) => {
    setSelectedScheduleDayState(day);
    try {
      localStorage.setItem('sehat_doctor_slot_day', day);
    } catch {}
  };

  const [selectedScheduleDate, setSelectedScheduleDate] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  const [newSlotTime, setNewSlotTime] = useState('');
  const [slotHour, setSlotHour] = useState('04');
  const [slotMin, setSlotMin] = useState('00');
  const [slotPeriod, setSlotPeriod] = useState('PM');
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  // Track and restore scroll position across refreshes
  React.useEffect(() => {
    const onScroll = () => {
      try {
        sessionStorage.setItem('sehat_doctor_scroll_pos', String(window.scrollY));
      } catch {}
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  React.useEffect(() => {
    try {
      const savedScroll = sessionStorage.getItem('sehat_doctor_scroll_pos');
      if (savedScroll) {
        const top = parseInt(savedScroll, 10);
        if (!isNaN(top) && top > 0) {
          const timer = setTimeout(() => {
            window.scrollTo({ top, behavior: 'instant' });
          }, 120);
          return () => clearTimeout(timer);
        }
      }
    } catch {}
  }, [activeTab]);

  // Multi-day Planned Leave state
  const [leaveStartDate, setLeaveStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [leaveEndDate, setLeaveEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [leaveNote, setLeaveNote] = useState('');

  // Real-time Earnings Heatmap state
  const [heatmapView, setHeatmapView] = useState('year'); // 'year' | 'weeks' | 'month'
  const [selectedHeatmapYear, setSelectedHeatmapYear] = useState(() => currentPcDate.getFullYear());
  const [selectedHeatmapCell, setSelectedHeatmapCell] = useState(null);
  const [isHeatmapExpanded, setIsHeatmapExpanded] = useState(true);

  // Career Experience Reorder & Drag/Drop State
  const [draggedCareerIdx, setDraggedCareerIdx] = useState(null);
  const [dragOverCareerIdx, setDragOverCareerIdx] = useState(null);
  const [isTouchDraggingCareer, setIsTouchDraggingCareer] = useState(false);
  const touchLongPressTimerRef = React.useRef(null);
  const touchStartPosRef = React.useRef({ x: 0, y: 0, index: null });

  // Delete & Reset Confirmation Modals
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [deleteConfirmationWord, setDeleteConfirmationWord] = useState('');
  const [isEarningsBreakdownOpen, setIsEarningsBreakdownOpen] = useState(false);

  // Featured Media (Reels & Videos) Preview Modal state
  const [previewMediaModal, setPreviewMediaModal] = useState(null); // { type: 'reel' | 'youtube', url, title, coverPhoto }
  const [previewReelError, setPreviewReelError] = useState(false);

  const initialDoctorIdRef = React.useRef(null);
  const isEditingAvailableDaysRef = React.useRef(false);
  const knownAppointmentFingerprintsRef = React.useRef(new Set());
  const isInitialAppointmentsLoadedRef = React.useRef(false);

  // Reset appointment notification tracking when active doctor switches
  React.useEffect(() => {
    isInitialAppointmentsLoadedRef.current = false;
    knownAppointmentFingerprintsRef.current = new Set();
  }, [activeDoctor?.id, activeDoctor?._id]);

  // Fetch remote appointments from database in real time
  const fetchRemoteAppointments = React.useCallback(() => {
    const lookupId = activeDoctor?._id || activeDoctor?.id || (doctors[0]?._id || doctors[0]?.id || '1');
    const lookupEmail = activeDoctor?.email || storedUser?.email || (doctors[0]?.email || 'dr.rahul@sehatbuddy.com');
    if (!lookupId && !lookupEmail) return;

    api.getDoctorDashboard(lookupId, lookupEmail).then(data => {
      if (Array.isArray(data)) {
        setAppointments(prev => {
          const remoteMapped = data
            .filter(apt => !isMockPatientAppointment(apt))
            .map(apt => {
              const rawSlot = String(apt.slotDate || '').trim();
              const resolvedDateStr = (/^\d{4}-\d{2}-\d{2}$/.test(rawSlot) ? rawSlot : '') ||
                (apt.date && /^\d{4}-\d{2}-\d{2}$/.test(String(apt.date).trim()) ? String(apt.date).trim() : '') ||
                (apt.dateStr && /^\d{4}-\d{2}-\d{2}$/.test(String(apt.dateStr).trim()) ? String(apt.dateStr).trim() : '') ||
                getLocalDateString(apt.slotDate || apt.date || apt.createdAt) || todayDateStr;
              const isCompleted = apt.isCompleted === true || apt.status === 'Completed' || String(apt.status).toLowerCase() === 'completed';

              return {
                id: apt._id || apt.id,
                _id: apt._id,
                patientName: apt.userData?.name || 'Patient',
                age: apt.userData?.age || 30,
                gender: apt.userData?.gender || 'Male',
                time: apt.slotTime || '02:00 PM',
                date: apt.slotDate || resolvedDateStr,
                dateStr: resolvedDateStr,
                slotDate: apt.slotDate || resolvedDateStr,
                slotTime: apt.slotTime || '02:00 PM',
                amount: Number(apt.amount) || Number(activeDoctor.price ?? activeDoctor.fees) || 800,
                type: apt.consultationType || 'In-Clinic',
                symptoms: apt.symptoms || apt.userData?.symptoms || 'Clinical Consultation Booking',
                status: isCompleted ? 'Completed' : (apt.cancelled ? 'Cancelled' : (apt.status || 'Confirmed')),
                isCompleted,
                phone: apt.userData?.phone || apt.phone || '+91 98000 00000',
                isRealtime: true,
                createdAt: apt.createdAt || apt.date
              };
            });

          // Also pull from local site bookings (sehat_buddy_appointments)
          let userBookings = [];
          try {
            const raw = localStorage.getItem('sehat_buddy_appointments');
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                userBookings = parsed
                  .filter(b => matchesId(activeDoctor, b.docId) && !isMockPatientAppointment(b))
                  .map(b => {
                    const rawSlot = String(b.slotDate || '').trim();
                    const resolvedDateStr = (/^\d{4}-\d{2}-\d{2}$/.test(rawSlot) ? rawSlot : '') ||
                      getLocalDateString(b.slotDate || b.bookedAt) || todayDateStr;
                    const isCompleted = b.status === 'Completed' || b.isCompleted === true || String(b.status).toLowerCase() === 'completed';

                    return {
                      id: b.id || b._id,
                      _id: b._id,
                      patientName: b.patientName || 'Guest Patient',
                      age: b.age || 30,
                      gender: b.gender || 'Not specified',
                      time: b.slotTime || '10:00 AM',
                      date: b.slotDate || resolvedDateStr,
                      dateStr: resolvedDateStr,
                      slotDate: b.slotDate || resolvedDateStr,
                      slotTime: b.slotTime || '10:00 AM',
                      amount: Number(b.amount) || Number(activeDoctor.price ?? activeDoctor.fees) || 800,
                      type: b.consultationType || 'In-Clinic',
                      symptoms: b.symptoms || 'General Consultation',
                      status: isCompleted ? 'Completed' : (b.status || 'Confirmed'),
                      isCompleted,
                      phone: b.patientPhone || '+91 98000 00000',
                      isRealtime: true,
                      createdAt: b.bookedAt || new Date().toISOString()
                    };
                  });
              }
            }
          } catch {}

          const allIncoming = dedupeAppointments([...remoteMapped, ...userBookings]);

          // Strict new booking notification: Only alert for genuinely new appointments booked in real time
          if (!isInitialAppointmentsLoadedRef.current) {
            // First run on mount: register all existing appointments as known so no false alert fires
            allIncoming.forEach(apt => {
              if (apt.id) knownAppointmentFingerprintsRef.current.add(String(apt.id));
              if (apt._id) knownAppointmentFingerprintsRef.current.add(String(apt._id));
              const pName = (apt.patientName || apt.userData?.name || '').toLowerCase().trim();
              const dStr = String(apt.slotDate || apt.dateStr || apt.date || '').trim();
              const tStr = String(apt.slotTime || apt.time || '').trim();
              knownAppointmentFingerprintsRef.current.add(`${pName}_${dStr}_${tStr}`);
            });
            isInitialAppointmentsLoadedRef.current = true;
          } else {
            // Subsequent polling or sync: find items that are genuinely new and created recently (< 90 seconds)
            const now = Date.now();
            const genuinelyNew = allIncoming.filter(apt => {
              if (!apt || isMockPatientAppointment(apt)) return false;
              const strId = String(apt.id || apt._id || '');
              const strMongoId = String(apt._id || '');
              const pName = (apt.patientName || apt.userData?.name || '').toLowerCase().trim();
              const dStr = String(apt.slotDate || apt.dateStr || apt.date || '').trim();
              const tStr = String(apt.slotTime || apt.time || '').trim();
              const fingerprint = `${pName}_${dStr}_${tStr}`;

              // Check if already known by ID, _id, or fingerprint
              if (strId && knownAppointmentFingerprintsRef.current.has(strId)) return false;
              if (strMongoId && knownAppointmentFingerprintsRef.current.has(strMongoId)) return false;
              if (fingerprint && knownAppointmentFingerprintsRef.current.has(fingerprint)) return false;

              // Must be created very recently (within last 90 seconds) to prevent any historical DB records from alerting
              const createdTimestamp = new Date(apt.createdAt || apt.bookedAt || 0).getTime();
              if (isNaN(createdTimestamp) || (now - createdTimestamp > 90000)) {
                // Register as known so it won't be checked again
                if (strId) knownAppointmentFingerprintsRef.current.add(strId);
                if (strMongoId) knownAppointmentFingerprintsRef.current.add(strMongoId);
                if (fingerprint) knownAppointmentFingerprintsRef.current.add(fingerprint);
                return false;
              }

              return true;
            });

            if (genuinelyNew.length > 0) {
              const newest = genuinelyNew[0];
              showToast(`🔔 New patient booking: ${newest.patientName} (${newest.time})`);
              genuinelyNew.forEach(apt => {
                if (apt.id) knownAppointmentFingerprintsRef.current.add(String(apt.id));
                if (apt._id) knownAppointmentFingerprintsRef.current.add(String(apt._id));
                const pName = (apt.patientName || apt.userData?.name || '').toLowerCase().trim();
                const dStr = String(apt.slotDate || apt.dateStr || apt.date || '').trim();
                const tStr = String(apt.slotTime || apt.time || '').trim();
                knownAppointmentFingerprintsRef.current.add(`${pName}_${dStr}_${tStr}`);
              });
            }
          }

          // Real database appointments are the authoritative source of truth
          const realAppointments = applyStatusOverrides(allIncoming);
          saveDoctorAppointments(realAppointments);
          return realAppointments;
        });
      }
    }).catch(() => {});
  }, [activeDoctor, storedUser, doctors, todayDateStr, saveDoctorAppointments, applyStatusOverrides]);

  // Load appointments & prescriptions whenever active doctor switches, and sync with backend
  React.useEffect(() => {
    try {
      let loadedApts = null;
      const keys = getDoctorStorageKeys(activeDoctor, storedUser);
      for (const key of keys) {
        const savedApts = localStorage.getItem(key);
        if (savedApts) {
          const parsed = JSON.parse(savedApts);
          if (Array.isArray(parsed)) {
            const clean = dedupeAppointments(parsed);
            if (clean.length > 0) {
              loadedApts = applyStatusOverrides(clean);
              break;
            }
          }
        }
      }
      setAppointments(loadedApts || []);
      if (loadedApts && loadedApts.length > 0) {
        loadedApts.forEach(apt => {
          if (apt.id) knownAppointmentFingerprintsRef.current.add(String(apt.id));
          if (apt._id) knownAppointmentFingerprintsRef.current.add(String(apt._id));
          const pName = (apt.patientName || apt.userData?.name || '').toLowerCase().trim();
          const dStr = String(apt.slotDate || apt.dateStr || apt.date || '').trim();
          const tStr = String(apt.slotTime || apt.time || '').trim();
          knownAppointmentFingerprintsRef.current.add(`${pName}_${dStr}_${tStr}`);
        });
      }

      let loadedRx = null;
      for (const key of keys) {
        const rxKey = key.replace('appointments', 'prescriptions');
        const savedRx = localStorage.getItem(rxKey);
        if (savedRx) {
          const parsed = JSON.parse(savedRx);
          if (Array.isArray(parsed)) {
            const clean = parsed.filter(r => !isMockPrescriptionItem(r));
            if (clean.length > 0) {
              loadedRx = clean;
              break;
            }
          }
        }
      }
      setPrescriptions(loadedRx || []);
    } catch {}

    fetchRemoteAppointments();
  }, [activeDoctor, storedUser, fetchRemoteAppointments, applyStatusOverrides]);

  // Real-time synchronization listener: broadcasts, storage events, polling & tab switching
  React.useEffect(() => {
    const handleAppointmentsSync = () => {
      fetchRemoteAppointments();
    };

    window.addEventListener('sehat_appointments_changed', handleAppointmentsSync);
    window.addEventListener('sehat_db_change', (e) => {
      if (e.detail?.collection === 'appointments') {
        fetchRemoteAppointments();
      }
    });

    const handleStorageChange = (e) => {
      const keys = getDoctorStorageKeys(activeDoctor, storedUser);
      if (keys.includes(e.key) && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            const clean = dedupeAppointments(parsed);
            setAppointments(applyStatusOverrides(clean));
          }
        } catch {}
      }
      if (e.key === STATUS_OVERRIDES_KEY && e.newValue) {
        setAppointments(prev => applyStatusOverrides(prev));
      }
      if (e.key === 'sehat_buddy_appointments') {
        fetchRemoteAppointments();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Refresh immediately when switching tabs or focusing window
    const handleTabSwitch = () => {
      if (document.visibilityState === 'visible') {
        try {
          const keys = getDoctorStorageKeys(activeDoctor, storedUser);
          for (const key of keys) {
            const savedApts = localStorage.getItem(key);
            if (savedApts) {
              const parsed = JSON.parse(savedApts);
              if (Array.isArray(parsed)) {
                const clean = dedupeAppointments(parsed);
                if (clean.length > 0) {
                  setAppointments(applyStatusOverrides(clean));
                  break;
                }
              }
            }
          }
        } catch {}
        fetchRemoteAppointments();
      }
    };
    document.addEventListener('visibilitychange', handleTabSwitch);
    window.addEventListener('focus', handleTabSwitch);

    // Fallback polling every 4 seconds to ensure real-time queue & heatmap freshness
    const pollInterval = setInterval(() => {
      fetchRemoteAppointments();
    }, 4000);

    return () => {
      window.removeEventListener('sehat_appointments_changed', handleAppointmentsSync);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleTabSwitch);
      window.removeEventListener('focus', handleTabSwitch);
      clearInterval(pollInterval);
    };
  }, [activeDoctor, storedUser, fetchRemoteAppointments, applyStatusOverrides]);

  // Load initial profile data strictly when the doctor identity changes (prevents flickering/overwriting during in-place edits)
  React.useEffect(() => {
    const currentId = activeDoctor?.id || activeDoctor?._id;
    if (!currentId) return;

    if (String(currentId) !== String(initialDoctorIdRef.current) || !profileForm?.name) {
      initialDoctorIdRef.current = String(currentId);
      setProfileForm({
        ...activeDoctor,
        name: activeDoctor.name || '',
        specialty: activeDoctor.specialization || activeDoctor.specialty || 'General Medicine',
        price: activeDoctor.fees ?? activeDoctor.price ?? 500,
        fees: activeDoctor.fees ?? activeDoctor.price ?? 500,
        experience: typeof activeDoctor.experience === 'string' ? parseInt(activeDoctor.experience, 10) : (activeDoctor.experience || 5),
        licenseNumber: activeDoctor.licenseNumber || '',
        hospital: activeDoctor.hospital || '',
        image: activeDoctor.image || '',
        about: activeDoctor.about || '',
        tags: Array.isArray(activeDoctor.tags) && activeDoctor.tags.length > 0
          ? activeDoctor.tags
          : getDefaultDoctorTags(activeDoctor),
        awards: Array.isArray(activeDoctor.awards) ? activeDoctor.awards : [],
        certifications: Array.isArray(activeDoctor.certifications) ? activeDoctor.certifications : [],
        memberships: Array.isArray(activeDoctor.memberships) ? activeDoctor.memberships : [],
        careerExperience: Array.isArray(activeDoctor.careerExperience) ? activeDoctor.careerExperience : [],
        reels: Array.isArray(activeDoctor.reels) ? activeDoctor.reels : [],
        youtube_videos: Array.isArray(activeDoctor.youtube_videos) ? activeDoctor.youtube_videos : [],
        availableDays: activeDoctor.availableDays || 'Mon - Sat (10am - 4pm)',
        scheduleDays: Array.isArray(activeDoctor.scheduleDays) && activeDoctor.scheduleDays.length > 0 
          ? activeDoctor.scheduleDays 
          : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        availableSlots: Array.isArray(activeDoctor.availableSlots) && activeDoctor.availableSlots.length > 0 
          ? activeDoctor.availableSlots 
          : ['04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'],
        slotDuration: activeDoctor.slotDuration || 20,
        dayWiseSlots: (activeDoctor.dayWiseSlots && typeof activeDoctor.dayWiseSlots === 'object') ? activeDoctor.dayWiseSlots : {},
        dateWiseSlots: (activeDoctor.dateWiseSlots && typeof activeDoctor.dateWiseSlots === 'object') ? activeDoctor.dateWiseSlots : {}
      });
    }
  }, [activeDoctor?.id, activeDoctor?._id, activeDoctor?.name]);

  // Synchronize profileForm.about whenever activeDoctor.about updates from DB, SSE, or DataContext
  React.useEffect(() => {
    if (!activeDoctor) return;
    setProfileForm(prev => {
      if (activeDoctor.about !== undefined && prev?.about !== activeDoctor.about && !isSavingAbout) {
        return { ...prev, about: activeDoctor.about };
      }
      return prev;
    });
  }, [activeDoctor?.about, isSavingAbout]);

  // Synchronize profileForm schedule & slots whenever activeDoctor updates from DB, SSE, or DataContext
  React.useEffect(() => {
    if (!activeDoctor) return;
    setProfileForm(prev => {
      if (!prev) return activeDoctor;
      let changed = false;
      const next = { ...prev };

      if (Array.isArray(activeDoctor.availableSlots) && activeDoctor.availableSlots.length > 0) {
        if (JSON.stringify(prev.availableSlots) !== JSON.stringify(activeDoctor.availableSlots)) {
          next.availableSlots = activeDoctor.availableSlots;
          changed = true;
        }
      }
      if (activeDoctor.dayWiseSlots && typeof activeDoctor.dayWiseSlots === 'object') {
        if (JSON.stringify(prev.dayWiseSlots) !== JSON.stringify(activeDoctor.dayWiseSlots)) {
          next.dayWiseSlots = activeDoctor.dayWiseSlots;
          changed = true;
        }
      }
      if (activeDoctor.dateWiseSlots && typeof activeDoctor.dateWiseSlots === 'object') {
        if (JSON.stringify(prev.dateWiseSlots) !== JSON.stringify(activeDoctor.dateWiseSlots)) {
          next.dateWiseSlots = activeDoctor.dateWiseSlots;
          changed = true;
        }
      }
      if (Array.isArray(activeDoctor.scheduleDays) && activeDoctor.scheduleDays.length > 0) {
        if (JSON.stringify(prev.scheduleDays) !== JSON.stringify(activeDoctor.scheduleDays)) {
          next.scheduleDays = activeDoctor.scheduleDays;
          changed = true;
        }
      }
      if (
        activeDoctor.availableDays &&
        activeDoctor.availableDays !== prev.availableDays &&
        !isEditingAvailableDaysRef.current
      ) {
        next.availableDays = activeDoctor.availableDays;
        changed = true;
      }
      if (activeDoctor.slotDuration && activeDoctor.slotDuration !== prev.slotDuration) {
        next.slotDuration = activeDoctor.slotDuration;
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [
    activeDoctor?.availableSlots,
    activeDoctor?.dayWiseSlots,
    activeDoctor?.dateWiseSlots,
    activeDoctor?.scheduleDays,
    activeDoctor?.availableDays,
    activeDoctor?.slotDuration
  ]);

  // Synchronize profileForm credentials (awards, certs, memberships, timeline, tags) whenever activeDoctor updates
  React.useEffect(() => {
    if (!activeDoctor) return;
    setProfileForm(prev => {
      if (!prev) return activeDoctor;
      let changed = false;
      const next = { ...prev };

      if (Array.isArray(activeDoctor.awards) && JSON.stringify(prev.awards || []) !== JSON.stringify(activeDoctor.awards)) {
        next.awards = activeDoctor.awards;
        changed = true;
      }
      if (Array.isArray(activeDoctor.certifications) && JSON.stringify(prev.certifications || []) !== JSON.stringify(activeDoctor.certifications)) {
        next.certifications = activeDoctor.certifications;
        changed = true;
      }
      if (Array.isArray(activeDoctor.memberships) && JSON.stringify(prev.memberships || []) !== JSON.stringify(activeDoctor.memberships)) {
        next.memberships = activeDoctor.memberships;
        changed = true;
      }
      if (Array.isArray(activeDoctor.careerExperience) && JSON.stringify(prev.careerExperience || []) !== JSON.stringify(activeDoctor.careerExperience)) {
        next.careerExperience = activeDoctor.careerExperience;
        changed = true;
      }
      if (Array.isArray(activeDoctor.tags) && JSON.stringify(prev.tags || []) !== JSON.stringify(activeDoctor.tags)) {
        next.tags = activeDoctor.tags;
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [
    activeDoctor?.awards,
    activeDoctor?.certifications,
    activeDoctor?.memberships,
    activeDoctor?.careerExperience,
    activeDoctor?.tags
  ]);

  // Tags / Badges handlers (reflects instantly in real time)
  const handleAddTag = (e) => {
    e?.preventDefault();
    const tagText = (newTagInput || '').trim();
    if (!tagText) return;
    const current = Array.isArray(profileForm.tags) ? profileForm.tags : getDefaultDoctorTags(activeDoctor);
    if (current.includes(tagText)) {
      showToast('This badge is already in your list');
      return;
    }
    const updated = [...current, tagText];
    setProfileForm(prev => ({ ...prev, tags: updated }));
    setNewTagInput('');
    updateDoctor(activeDoctor.id || activeDoctor._id, { tags: updated });
    showToast(`Badge "${tagText}" added!`);
  };

  const handleRemoveTag = (tagToRemove) => {
    const current = Array.isArray(profileForm.tags) ? profileForm.tags : getDefaultDoctorTags(activeDoctor);
    const updated = current.filter(t => t !== tagToRemove);
    setProfileForm(prev => ({ ...prev, tags: updated }));
    updateDoctor(activeDoctor.id || activeDoctor._id, { tags: updated });
    showToast(`Badge "${tagToRemove}" removed.`);
  };

  const handleResetDefaultTags = () => {
    const defaultList = [];
    if (activeDoctor?.degree || activeDoctor?.qualifications) {
      const parts = (activeDoctor.degree || activeDoctor.qualifications).split(/[,/]+/).map(s => s.trim()).filter(Boolean);
      defaultList.push(...parts);
    }
    const spec = (activeDoctor?.specialty || activeDoctor?.specialization || '').toLowerCase();
    if (spec.includes('dent') || spec.includes('paedo')) {
      defaultList.push('BDS', 'MDS - Paedodontics', 'Implantologist', 'Pediatric Dentist', 'Cosmetic/Aesthetic Dentist', 'Preventive Dentistry', 'Dental Surgeon');
    } else if (spec.includes('cardio')) {
      defaultList.push('Interventional Cardiologist', 'Angioplasty Specialist', 'Echocardiography', 'Heart Failure Care', 'Preventive Cardiology', 'Chest Pain Specialist');
    } else if (spec.includes('derma')) {
      defaultList.push('Clinical Dermatology', 'Cosmetic/Aesthetic Specialist', 'Laser Therapeutics', 'Trichology', 'Cutaneous Surgeon', 'Acne & Skin Care');
    } else if (spec.includes('ortho')) {
      defaultList.push('Joint Replacement', 'Arthroscopy Specialist', 'Robotic Knee Surgery', 'Sports Medicine', 'Trauma Surgeon', 'Spine Rehabilitation');
    } else if (spec.includes('pedia')) {
      defaultList.push('Pediatric Intensive Care', 'Neonatology', 'Child Growth & Development', 'Vaccination Specialist', 'Pediatric Allergy Care');
    } else if (spec.includes('gyne') || spec.includes('obs')) {
      defaultList.push('High-Risk Obstetrics', 'Laparoscopic Surgeon', 'Infertility Specialist', 'Women Hormonal Health', 'Maternal Fetal Care');
    } else if (spec.includes('neuro')) {
      defaultList.push('Stroke Rehabilitation', 'Neurocritical Care', 'Electrophysiology', 'Headache & Migraine Specialist', 'Epilepsy Care');
    } else if (spec.includes('uro')) {
      defaultList.push('Robotic Urological Surgery', 'Kidney Stone Specialist', 'Endourology', 'Renal Transplant', 'Prostate Care');
    } else {
      defaultList.push('Consultant Physician', 'Clinical Diagnostics', 'Preventive Healthcare', 'Chronic Disease Management', 'Health Wellness');
    }
    const uniqueDefaults = Array.from(new Set(defaultList));
    setProfileForm(prev => ({ ...prev, tags: uniqueDefaults }));
    updateDoctor(activeDoctor.id || activeDoctor._id, { tags: uniqueDefaults });
    showToast('Badges reset to default recommendations!');
  };

  // Helper to parse title and year from award string
  const parseAwardTextAndYear = (raw) => {
    if (!raw) return { text: '', year: '' };
    let str = String(raw).trim();
    let year = '';

    const parenMatch = str.match(/\(((?:19|20)\d{2})\)/);
    if (parenMatch) {
      year = parenMatch[1];
      str = str.replace(/\(((?:19|20)\d{2})\)/, '').trim();
    } else {
      const trailingMatch = str.match(/\b((?:19|20)\d{2})\b$/);
      if (trailingMatch) {
        year = trailingMatch[1];
        str = str.replace(/\b((?:19|20)\d{2})\b$/, '').trim();
      }
    }
    return { text: str, year };
  };

  // Awards handlers
  const handleAddAward = (e) => {
    e?.preventDefault();
    if (!newAwardInput.trim()) return;
    const current = Array.isArray(profileForm.awards) ? profileForm.awards : [];
    const title = newAwardInput.trim();
    const year = newAwardYear.trim();
    let finalAward = title;
    if (year && !title.includes(year)) {
      finalAward = `${title} (${year})`;
    }
    const updated = [...current, finalAward];
    setProfileForm(prev => ({ ...prev, awards: updated }));
    setNewAwardInput('');
    setNewAwardYear('');
    updateDoctor(activeDoctor.id || activeDoctor._id, { awards: updated });
    showToast('Award added and saved!');
  };

  const handleStartEditAward = (index, rawAward) => {
    const { text, year } = parseAwardTextAndYear(rawAward);
    setEditingAward({ index, text, year });
  };

  const handleUpdateAward = (index) => {
    if (!editingAward.text.trim()) return;
    const current = Array.isArray(profileForm.awards) ? profileForm.awards : [];
    const title = editingAward.text.trim();
    const year = (editingAward.year || '').trim();
    let finalAward = title;
    if (year && !title.includes(year)) {
      finalAward = `${title} (${year})`;
    }
    const updated = current.map((item, i) => (i === index ? finalAward : item));
    setProfileForm(prev => ({ ...prev, awards: updated }));
    setEditingAward({ index: null, text: '', year: '' });
    updateDoctor(activeDoctor.id || activeDoctor._id, { awards: updated });
    showToast('Award modified successfully!');
  };

  const handleRemoveAward = (index) => {
    const current = Array.isArray(profileForm.awards) ? profileForm.awards : [];
    const updated = current.filter((_, i) => i !== index);
    setProfileForm(prev => ({ ...prev, awards: updated }));
    updateDoctor(activeDoctor.id || activeDoctor._id, { awards: updated });
    showToast('Award deleted!');
  };

  const handleClearAllAwards = () => {
    if (!window.confirm('Are you sure you want to delete all awards?')) return;
    setProfileForm(prev => ({ ...prev, awards: [] }));
    updateDoctor(activeDoctor.id || activeDoctor._id, { awards: [] });
    showToast('All awards deleted.');
  };

  // Certifications handlers
  const handleAddCert = (e) => {
    e?.preventDefault();
    if (!newCertInput.trim()) return;
    const current = Array.isArray(profileForm.certifications) ? profileForm.certifications : [];
    const updated = [...current, newCertInput.trim()];
    setProfileForm(prev => ({ ...prev, certifications: updated }));
    setNewCertInput('');
    updateDoctor(activeDoctor.id || activeDoctor._id, { certifications: updated });
    showToast('Certificate added and saved!');
  };

  const handleUpdateCert = (index) => {
    if (!editingCert.text.trim()) return;
    const current = Array.isArray(profileForm.certifications) ? profileForm.certifications : [];
    const updated = current.map((item, i) => (i === index ? editingCert.text.trim() : item));
    setProfileForm(prev => ({ ...prev, certifications: updated }));
    setEditingCert({ index: null, text: '' });
    updateDoctor(activeDoctor.id || activeDoctor._id, { certifications: updated });
    showToast('Certificate modified successfully!');
  };

  const handleRemoveCert = (index) => {
    const current = Array.isArray(profileForm.certifications) ? profileForm.certifications : [];
    const updated = current.filter((_, i) => i !== index);
    setProfileForm(prev => ({ ...prev, certifications: updated }));
    updateDoctor(activeDoctor.id || activeDoctor._id, { certifications: updated });
    showToast('Certificate deleted!');
  };

  const handleClearAllCerts = () => {
    if (!window.confirm('Are you sure you want to delete all certificates?')) return;
    setProfileForm(prev => ({ ...prev, certifications: [] }));
    updateDoctor(activeDoctor.id || activeDoctor._id, { certifications: [] });
    showToast('All certificates deleted.');
  };

  // Memberships handlers
  const handleAddMembership = (e) => {
    e?.preventDefault();
    if (!newMembershipInput.trim()) return;
    const current = Array.isArray(profileForm.memberships) ? profileForm.memberships : [];
    const updated = [...current, newMembershipInput.trim()];
    setProfileForm(prev => ({ ...prev, memberships: updated }));
    setNewMembershipInput('');
    updateDoctor(activeDoctor.id || activeDoctor._id, { memberships: updated });
    showToast('Membership added and saved!');
  };

  const handleUpdateMembership = (index) => {
    if (!editingMembership.text.trim()) return;
    const current = Array.isArray(profileForm.memberships) ? profileForm.memberships : [];
    const updated = current.map((item, i) => (i === index ? editingMembership.text.trim() : item));
    setProfileForm(prev => ({ ...prev, memberships: updated }));
    setEditingMembership({ index: null, text: '' });
    updateDoctor(activeDoctor.id || activeDoctor._id, { memberships: updated });
    showToast('Membership modified successfully!');
  };

  const handleRemoveMembership = (index) => {
    const current = Array.isArray(profileForm.memberships) ? profileForm.memberships : [];
    const updated = current.filter((_, i) => i !== index);
    setProfileForm(prev => ({ ...prev, memberships: updated }));
    updateDoctor(activeDoctor.id || activeDoctor._id, { memberships: updated });
    showToast('Membership deleted!');
  };

  const handleClearAllMemberships = () => {
    if (!window.confirm('Are you sure you want to delete all memberships?')) return;
    setProfileForm(prev => ({ ...prev, memberships: [] }));
    updateDoctor(activeDoctor.id || activeDoctor._id, { memberships: [] });
    showToast('All memberships deleted.');
  };

  // Career experience timeline handlers
  const handleAddCareerExp = (e) => {
    e?.preventDefault();
    let roleText = newCareerExpInput.trim();
    if (!roleText) return;

    // Strip pre-existing parenthesis from role text to cleanly format
    roleText = roleText.replace(/\(.*?\)/g, '').trim();

    let finalStr = roleText;
    const startY = newCareerExpStartYear.trim();
    const endY = newCareerExpEndYear.trim();

    if (newCareerExpIsPresent) {
      finalStr = startY ? `${roleText} (${startY} - Present)` : `${roleText} (Present)`;
    } else if (startY && endY) {
      finalStr = `${roleText} (${startY} - ${endY})`;
    } else if (startY) {
      finalStr = `${roleText} (${startY})`;
    } else if (endY) {
      finalStr = `${roleText} (${endY})`;
    }

    const current = Array.isArray(profileForm.careerExperience) ? profileForm.careerExperience : [];
    const updated = newCareerExpIsPresent ? [finalStr, ...current] : [...current, finalStr];
    setProfileForm(prev => ({ ...prev, careerExperience: updated }));
    setNewCareerExpInput('');
    setNewCareerExpStartYear('');
    setNewCareerExpEndYear('');
    setNewCareerExpIsPresent(false);
    updateDoctor(activeDoctor.id || activeDoctor._id, { careerExperience: updated });
    showToast('Hospital timeline role added!');
  };

  const handleStartEditCareerExp = (index, fullStr) => {
    let text = fullStr;
    let startYear = '';
    let endYear = '';
    let isPresent = false;

    if (fullStr.includes('(') && fullStr.includes(')')) {
      const match = fullStr.match(/\((.*?)\)/);
      if (match) {
        const yearPart = match[1].trim();
        text = fullStr.replace(/\(.*?\)/, '').trim();
        if (yearPart.toLowerCase().includes('present')) {
          isPresent = true;
          const yMatch = yearPart.match(/(\d{4})/);
          if (yMatch) startYear = yMatch[1];
        } else if (yearPart.includes('-') || yearPart.includes('–')) {
          const yParts = yearPart.split(/[-–]/).map(s => s.trim());
          startYear = yParts[0] || '';
          endYear = yParts[1] || '';
        } else {
          startYear = yearPart;
        }
      }
    } else if (fullStr.toLowerCase().includes('present')) {
      isPresent = true;
      text = fullStr.replace(/present/i, '').replace(/[-–()]/g, '').trim();
    }
    setEditingCareerExp({ index, text, startYear, endYear, isPresent });
  };

  const handleUpdateCareerExp = (index) => {
    let roleText = (editingCareerExp.text || '').trim();
    if (!roleText) return;

    // Strip pre-existing parenthesis from role text to cleanly format
    roleText = roleText.replace(/\(.*?\)/g, '').trim();

    let finalStr = roleText;
    const startY = (editingCareerExp.startYear || '').trim();
    const endY = (editingCareerExp.endYear || '').trim();

    if (editingCareerExp.isPresent) {
      finalStr = startY ? `${roleText} (${startY} - Present)` : `${roleText} (Present)`;
    } else if (startY && endY) {
      finalStr = `${roleText} (${startY} - ${endY})`;
    } else if (startY) {
      finalStr = `${roleText} (${startY})`;
    } else if (endY) {
      finalStr = `${roleText} (${endY})`;
    }

    const current = Array.isArray(profileForm.careerExperience) ? profileForm.careerExperience : [];
    const updated = current.map((item, i) => (i === index ? finalStr : item));
    setProfileForm(prev => ({ ...prev, careerExperience: updated }));
    setEditingCareerExp({ index: null, text: '', startYear: '', endYear: '', isPresent: false });
    updateDoctor(activeDoctor.id || activeDoctor._id, { careerExperience: updated });
    showToast('Timeline role modified successfully!');
  };

  const handleRemoveCareerExp = (index) => {
    const current = Array.isArray(profileForm.careerExperience) ? profileForm.careerExperience : [];
    const updated = current.filter((_, i) => i !== index);
    setProfileForm(prev => ({ ...prev, careerExperience: updated }));
    updateDoctor(activeDoctor.id || activeDoctor._id, { careerExperience: updated });
    showToast('Timeline role deleted!');
  };

  const handleClearAllCareerExp = () => {
    if (!window.confirm('Are you sure you want to delete all timeline roles?')) return;
    setProfileForm(prev => ({ ...prev, careerExperience: [] }));
    updateDoctor(activeDoctor.id || activeDoctor._id, { careerExperience: [] });
    showToast('All timeline roles deleted.');
  };

  // 1. Reorder career experience: Move Up / Down
  const handleMoveCareerExp = (index, direction) => {
    const current = Array.isArray(profileForm.careerExperience) ? profileForm.careerExperience : [];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= current.length) return;

    const updated = [...current];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    setProfileForm(prev => ({ ...prev, careerExperience: updated }));
    updateDoctor(activeDoctor.id || activeDoctor._id, { careerExperience: updated });
    showToast(direction === -1 ? 'Role moved up!' : 'Role moved down!');
  };

  // 2. Reorder career experience: HTML5 Drag & Drop
  const handleCareerDragStart = (e, index) => {
    setDraggedCareerIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', String(index));
    } catch {}
  };

  const handleCareerDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCareerIdx !== index) {
      setDragOverCareerIdx(index);
    }
  };

  const handleCareerDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedCareerIdx === null || draggedCareerIdx === targetIndex) {
      setDraggedCareerIdx(null);
      setDragOverCareerIdx(null);
      return;
    }
    const current = Array.isArray(profileForm.careerExperience) ? profileForm.careerExperience : [];
    const updated = [...current];
    const [moved] = updated.splice(draggedCareerIdx, 1);
    updated.splice(targetIndex, 0, moved);

    setProfileForm(prev => ({ ...prev, careerExperience: updated }));
    updateDoctor(activeDoctor.id || activeDoctor._id, { careerExperience: updated });
    setDraggedCareerIdx(null);
    setDragOverCareerIdx(null);
    showToast('Career experience timeline reordered!');
  };

  const handleCareerDragEnd = () => {
    setDraggedCareerIdx(null);
    setDragOverCareerIdx(null);
  };

  // 3. Reorder career experience: Touch & Long-Press support for mobile/tablets
  const handleCareerTouchStart = (e, index) => {
    if (editingCareerExp.index !== null) return;
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY, index };

    if (touchLongPressTimerRef.current) clearTimeout(touchLongPressTimerRef.current);

    touchLongPressTimerRef.current = setTimeout(() => {
      setDraggedCareerIdx(index);
      setDragOverCareerIdx(index);
      setIsTouchDraggingCareer(true);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
      showToast('Role selected! Drag up or down to reorder, then release.');
    }, 280);
  };

  const handleCareerTouchMove = (e) => {
    const touch = e.touches[0];
    if (!isTouchDraggingCareer) {
      const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
      const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);
      if (dx > 10 || dy > 10) {
        if (touchLongPressTimerRef.current) clearTimeout(touchLongPressTimerRef.current);
      }
      return;
    }

    if (e.cancelable) e.preventDefault();
    const elem = document.elementFromPoint(touch.clientX, touch.clientY);
    const itemContainer = elem?.closest('[data-career-idx]');
    if (itemContainer) {
      const overIndex = parseInt(itemContainer.getAttribute('data-career-idx'), 10);
      if (!isNaN(overIndex) && overIndex !== dragOverCareerIdx) {
        setDragOverCareerIdx(overIndex);
      }
    }
  };

  const handleCareerTouchEnd = () => {
    if (touchLongPressTimerRef.current) clearTimeout(touchLongPressTimerRef.current);

    if (isTouchDraggingCareer) {
      if (draggedCareerIdx !== null && dragOverCareerIdx !== null && draggedCareerIdx !== dragOverCareerIdx) {
        const current = Array.isArray(profileForm.careerExperience) ? profileForm.careerExperience : [];
        const updated = [...current];
        const [moved] = updated.splice(draggedCareerIdx, 1);
        updated.splice(dragOverCareerIdx, 0, moved);

        setProfileForm(prev => ({ ...prev, careerExperience: updated }));
        updateDoctor(activeDoctor.id || activeDoctor._id, { careerExperience: updated });
        showToast('Career experience timeline reordered!');
      }
      setIsTouchDraggingCareer(false);
      setDraggedCareerIdx(null);
      setDragOverCareerIdx(null);
    }
  };

  // Schedule Days & Time Slots handlers
  const handleToggleScheduleDay = async (day) => {
    const currentDays = Array.isArray(profileForm.scheduleDays) ? [...profileForm.scheduleDays] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const updated = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    const newDayWise = { ...(profileForm.dayWiseSlots || {}) };
    if (!updated.includes(day)) {
      newDayWise[day] = 'off';
    } else if (newDayWise[day] === 'off') {
      delete newDayWise[day];
    }
    setProfileForm(prev => ({ ...prev, scheduleDays: updated, dayWiseSlots: newDayWise }));
    const docId = activeDoctor?.id || activeDoctor?._id;
    if (docId) {
      await updateDoctor(docId, { scheduleDays: updated, dayWiseSlots: newDayWise });
    }
    showToast(`${DAY_NAME_MAP[day] || day} is now ${updated.includes(day) ? 'Active' : 'Closed / Off'}`);
  };

  const DAYS_LIST = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const DAY_NAME_MAP = {
    Mon: 'Monday',
    Tue: 'Tuesday',
    Wed: 'Wednesday',
    Thu: 'Thursday',
    Fri: 'Friday',
    Sat: 'Saturday',
    Sun: 'Sunday'
  };

  const selectDayForSlots = (dayKey) => {
    setSelectedScheduleDay(dayKey);
    setSlotConfigMode('day');
  };

  // Helper to get slots for current mode (All / Day / Date)
  const getCurrentModeSlots = () => {
    if (slotConfigMode === 'all') {
      return Array.isArray(profileForm.availableSlots) ? profileForm.availableSlots : [];
    }
    if (slotConfigMode === 'day') {
      const dayConfig = profileForm.dayWiseSlots?.[selectedScheduleDay];
      const currentDays = Array.isArray(profileForm.scheduleDays) ? profileForm.scheduleDays : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      if (dayConfig === 'off' || dayConfig?.isOff === true || (!currentDays.includes(selectedScheduleDay) && dayConfig === undefined)) {
        return [];
      }
      if (Array.isArray(dayConfig)) return dayConfig;
      if (Array.isArray(dayConfig?.slots)) return dayConfig.slots;
      return Array.isArray(profileForm.availableSlots) ? profileForm.availableSlots : [];
    }
    if (slotConfigMode === 'date') {
      const dateConfig = profileForm.dateWiseSlots?.[selectedScheduleDate];
      if (dateConfig === 'off' || dateConfig?.isOff === true) return [];
      if (Array.isArray(dateConfig)) return dateConfig;
      if (Array.isArray(dateConfig?.slots)) return dateConfig.slots;
      // Inherited from day-wise or default
      const dayOfWeekShort = new Date(selectedScheduleDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
      const dayConfig = profileForm.dayWiseSlots?.[dayOfWeekShort];
      const currentDays = Array.isArray(profileForm.scheduleDays) ? profileForm.scheduleDays : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      if (dayConfig === 'off' || dayConfig?.isOff === true || (!currentDays.includes(dayOfWeekShort) && dayConfig === undefined)) {
        return [];
      }
      if (Array.isArray(dayConfig)) return dayConfig;
      if (Array.isArray(dayConfig?.slots)) return dayConfig.slots;
      return Array.isArray(profileForm.availableSlots) ? profileForm.availableSlots : [];
    }
    return [];
  };

  const isDayOff = (day) => {
    if (!day) return false;
    const dayConfig = profileForm.dayWiseSlots?.[day];
    if (dayConfig === 'off' || dayConfig?.isOff === true) return true;
    const currentDays = Array.isArray(profileForm.scheduleDays) ? profileForm.scheduleDays : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    if (!currentDays.includes(day) && (dayConfig === undefined || dayConfig === null)) return true;
    return false;
  };

  const isCurrentModeOff = () => {
    if (slotConfigMode === 'day') {
      return isDayOff(selectedScheduleDay);
    }
    if (slotConfigMode === 'date') {
      const dateConfig = profileForm.dateWiseSlots?.[selectedScheduleDate];
      if (dateConfig === 'off' || dateConfig?.isOff === true) return true;
      if (dateConfig === undefined) {
        const dayOfWeekShort = new Date(selectedScheduleDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
        return isDayOff(dayOfWeekShort);
      }
      return false;
    }
    return false;
  };

  const handleAddSlot = async (customSlot) => {
    let slot = '';
    if (typeof customSlot === 'string' && customSlot.trim()) {
      slot = customSlot.trim();
    } else if (newSlotTime.trim()) {
      slot = newSlotTime.trim();
    } else {
      slot = `${slotHour}:${slotMin} ${slotPeriod}`;
    }

    if (!slot) return;
    const currentSlots = getCurrentModeSlots();
    if (currentSlots.includes(slot)) {
      showToast(`Slot "${slot}" already exists!`);
      return;
    }

    const updated = [...currentSlots, slot];
    const docId = activeDoctor?.id || activeDoctor?._id;

    if (slotConfigMode === 'all') {
      setProfileForm(prev => ({ ...prev, availableSlots: updated }));
      if (docId) await updateDoctor(docId, { availableSlots: updated });
      showToast(`General time slot "${slot}" added and saved!`);
    } else if (slotConfigMode === 'day') {
      const newDayWise = { ...(profileForm.dayWiseSlots || {}), [selectedScheduleDay]: updated };
      let newScheduleDays = Array.isArray(profileForm.scheduleDays) ? [...profileForm.scheduleDays] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      if (!newScheduleDays.includes(selectedScheduleDay)) {
        newScheduleDays.push(selectedScheduleDay);
      }
      setProfileForm(prev => ({ ...prev, dayWiseSlots: newDayWise, scheduleDays: newScheduleDays }));
      if (docId) await updateDoctor(docId, { dayWiseSlots: newDayWise, scheduleDays: newScheduleDays });
      showToast(`Slot "${slot}" added for ${DAY_NAME_MAP[selectedScheduleDay] || selectedScheduleDay}!`);
    } else if (slotConfigMode === 'date') {
      const newDateWise = { ...(profileForm.dateWiseSlots || {}), [selectedScheduleDate]: updated };
      setProfileForm(prev => ({ ...prev, dateWiseSlots: newDateWise }));
      if (docId) await updateDoctor(docId, { dateWiseSlots: newDateWise });
      showToast(`Slot "${slot}" added for ${selectedScheduleDate}!`);
    }
    setNewSlotTime('');
  };

  const handleDeleteSlot = async (slotToRemove) => {
    const currentSlots = getCurrentModeSlots();
    const updated = currentSlots.filter(s => s !== slotToRemove);
    const docId = activeDoctor?.id || activeDoctor?._id;

    if (slotConfigMode === 'all') {
      setProfileForm(prev => ({ ...prev, availableSlots: updated }));
      if (docId) await updateDoctor(docId, { availableSlots: updated });
      showToast(`Slot "${slotToRemove}" removed from General Schedule`);
    } else if (slotConfigMode === 'day') {
      const newDayWise = { ...(profileForm.dayWiseSlots || {}), [selectedScheduleDay]: updated };
      setProfileForm(prev => ({ ...prev, dayWiseSlots: newDayWise }));
      if (docId) await updateDoctor(docId, { dayWiseSlots: newDayWise });
      showToast(`Slot "${slotToRemove}" removed from ${DAY_NAME_MAP[selectedScheduleDay] || selectedScheduleDay}`);
    } else if (slotConfigMode === 'date') {
      const newDateWise = { ...(profileForm.dateWiseSlots || {}), [selectedScheduleDate]: updated };
      setProfileForm(prev => ({ ...prev, dateWiseSlots: newDateWise }));
      if (docId) await updateDoctor(docId, { dateWiseSlots: newDateWise });
      showToast(`Slot "${slotToRemove}" removed from ${selectedScheduleDate}`);
    }
  };

  const handleApplySlotPreset = async (presetSlots, presetTitle) => {
    const docId = activeDoctor?.id || activeDoctor?._id;

    if (slotConfigMode === 'all') {
      setProfileForm(prev => ({ ...prev, availableSlots: presetSlots }));
      if (docId) await updateDoctor(docId, { availableSlots: presetSlots });
      showToast(`Applied "${presetTitle}" to General Schedule (${presetSlots.length} slots)`);
    } else if (slotConfigMode === 'day') {
      const newDayWise = { ...(profileForm.dayWiseSlots || {}), [selectedScheduleDay]: presetSlots };
      let newScheduleDays = Array.isArray(profileForm.scheduleDays) ? [...profileForm.scheduleDays] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      if (!newScheduleDays.includes(selectedScheduleDay)) {
        newScheduleDays.push(selectedScheduleDay);
      }
      setProfileForm(prev => ({ ...prev, dayWiseSlots: newDayWise, scheduleDays: newScheduleDays }));
      if (docId) await updateDoctor(docId, { dayWiseSlots: newDayWise, scheduleDays: newScheduleDays });
      showToast(`Applied "${presetTitle}" to ${DAY_NAME_MAP[selectedScheduleDay] || selectedScheduleDay} (${presetSlots.length} slots)`);
    } else if (slotConfigMode === 'date') {
      const newDateWise = { ...(profileForm.dateWiseSlots || {}), [selectedScheduleDate]: presetSlots };
      setProfileForm(prev => ({ ...prev, dateWiseSlots: newDateWise }));
      if (docId) await updateDoctor(docId, { dateWiseSlots: newDateWise });
      showToast(`Applied "${presetTitle}" to date ${selectedScheduleDate} (${presetSlots.length} slots)`);
    }
  };

  const handleClearAllSlots = async () => {
    const targetDesc = slotConfigMode === 'all' 
      ? 'all general appointment time slots' 
      : (slotConfigMode === 'day' ? `slots for ${DAY_NAME_MAP[selectedScheduleDay] || selectedScheduleDay}` : `slots for ${selectedScheduleDate}`);
    if (!window.confirm(`Are you sure you want to clear ${targetDesc}?`)) return;

    const docId = activeDoctor?.id || activeDoctor?._id;
    if (slotConfigMode === 'all') {
      setProfileForm(prev => ({ ...prev, availableSlots: [] }));
      if (docId) await updateDoctor(docId, { availableSlots: [] });
      showToast('All general appointment slots cleared');
    } else if (slotConfigMode === 'day') {
      const newDayWise = { ...(profileForm.dayWiseSlots || {}), [selectedScheduleDay]: [] };
      setProfileForm(prev => ({ ...prev, dayWiseSlots: newDayWise }));
      if (docId) await updateDoctor(docId, { dayWiseSlots: newDayWise });
      showToast(`All slots cleared for ${DAY_NAME_MAP[selectedScheduleDay] || selectedScheduleDay}`);
    } else if (slotConfigMode === 'date') {
      const newDateWise = { ...(profileForm.dateWiseSlots || {}), [selectedScheduleDate]: [] };
      setProfileForm(prev => ({ ...prev, dateWiseSlots: newDateWise }));
      if (docId) await updateDoctor(docId, { dateWiseSlots: newDateWise });
      showToast(`All slots cleared for ${selectedScheduleDate}`);
    }
  };

  // Day-wise specific helpers
  const handleToggleDayOff = async (targetDay) => {
    const dayKey = (typeof targetDay === 'string' && targetDay) ? targetDay : selectedScheduleDay;
    const docId = activeDoctor?.id || activeDoctor?._id;
    const currentDays = Array.isArray(profileForm.scheduleDays) ? [...profileForm.scheduleDays] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const isCurrentlyOff = isDayOff(dayKey);

    const newDayWise = { ...(profileForm.dayWiseSlots || {}) };
    let newScheduleDays = [...currentDays];

    if (isCurrentlyOff) {
      delete newDayWise[dayKey];
      if (!newScheduleDays.includes(dayKey)) {
        newScheduleDays.push(dayKey);
      }
      // Populate with existing baseline slots or standard slots so doctor immediately sees & can customize slots
      const existing = Array.isArray(profileForm.dayWiseSlots?.[dayKey]) ? profileForm.dayWiseSlots[dayKey] : null;
      if (!existing || existing.length === 0) {
        const baselineSlots = Array.isArray(profileForm.availableSlots) && profileForm.availableSlots.length > 0
          ? [...profileForm.availableSlots]
          : ['09:00 AM', '10:00 AM', '11:00 AM', '04:00 PM', '05:00 PM', '06:00 PM'];
        newDayWise[dayKey] = baselineSlots;
      }
      showToast(`${DAY_NAME_MAP[dayKey] || dayKey} marked Open & Active!`);
    } else {
      newDayWise[dayKey] = 'off';
      newScheduleDays = newScheduleDays.filter(d => d !== dayKey);
      showToast(`${DAY_NAME_MAP[dayKey] || dayKey} marked Closed / Off`);
    }
    setProfileForm(prev => ({ ...prev, dayWiseSlots: newDayWise, scheduleDays: newScheduleDays }));
    if (docId) await updateDoctor(docId, { dayWiseSlots: newDayWise, scheduleDays: newScheduleDays });
  };

  const handleResetDayToDefault = async (targetDay) => {
    const dayKey = (typeof targetDay === 'string' && targetDay) ? targetDay : selectedScheduleDay;
    const docId = activeDoctor?.id || activeDoctor?._id;
    const newDayWise = { ...(profileForm.dayWiseSlots || {}) };
    delete newDayWise[dayKey];
    let newScheduleDays = Array.isArray(profileForm.scheduleDays) ? [...profileForm.scheduleDays] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    if (!newScheduleDays.includes(dayKey)) {
      newScheduleDays.push(dayKey);
    }
    setProfileForm(prev => ({ ...prev, dayWiseSlots: newDayWise, scheduleDays: newScheduleDays }));
    if (docId) await updateDoctor(docId, { dayWiseSlots: newDayWise, scheduleDays: newScheduleDays });
    showToast(`${DAY_NAME_MAP[dayKey] || dayKey} reset to General Default Schedule`);
  };

  const handleCopyDayToAllDays = async () => {
    const currentSlots = getCurrentModeSlots();
    if (!window.confirm(`Copy ${DAY_NAME_MAP[selectedScheduleDay] || selectedScheduleDay}'s slots (${currentSlots.length} slots) to all 7 days?`)) return;
    const docId = activeDoctor?.id || activeDoctor?._id;
    const newDayWise = { ...(profileForm.dayWiseSlots || {}) };
    DAYS_LIST.forEach(d => {
      newDayWise[d] = [...currentSlots];
    });
    const allWorkingDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    setProfileForm(prev => ({ ...prev, dayWiseSlots: newDayWise, availableSlots: [...currentSlots], scheduleDays: allWorkingDays }));
    if (docId) await updateDoctor(docId, { dayWiseSlots: newDayWise, availableSlots: [...currentSlots], scheduleDays: allWorkingDays });
    showToast(`Copied ${currentSlots.length} slots to all days of the week!`);
  };

  // Date-wise specific helpers
  const handleToggleDateOff = async () => {
    const docId = activeDoctor?.id || activeDoctor?._id;
    const isCurrentlyOff = profileForm.dateWiseSlots?.[selectedScheduleDate] === 'off';
    const newDateWise = { ...(profileForm.dateWiseSlots || {}) };
    if (isCurrentlyOff) {
      delete newDateWise[selectedScheduleDate];
      showToast(`Date ${selectedScheduleDate} marked Open (Restored Day Schedule)`);
    } else {
      newDateWise[selectedScheduleDate] = 'off';
      showToast(`Date ${selectedScheduleDate} marked Closed / Leave`);
    }
    setProfileForm(prev => ({ ...prev, dateWiseSlots: newDateWise }));
    if (docId) await updateDoctor(docId, { dateWiseSlots: newDateWise });
  };

  const handleResetDateToDaySchedule = async (dateKeyToRemove) => {
    const dateKey = dateKeyToRemove || selectedScheduleDate;
    const docId = activeDoctor?.id || activeDoctor?._id;
    const newDateWise = { ...(profileForm.dateWiseSlots || {}) };
    delete newDateWise[dateKey];
    setProfileForm(prev => ({ ...prev, dateWiseSlots: newDateWise }));
    if (docId) await updateDoctor(docId, { dateWiseSlots: newDateWise });
    showToast(`Date ${dateKey} reset to standard schedule`);
  };

  // Planned Leave / Multi-day Off Handlers
  const handleApplyDateRangeLeave = async (e) => {
    e?.preventDefault();
    if (!leaveStartDate || !leaveEndDate) {
      showToast('Please select both Start Date and End Date');
      return;
    }
    const start = new Date(leaveStartDate + 'T00:00:00');
    const end = new Date(leaveEndDate + 'T00:00:00');
    if (end < start) {
      showToast('End Date must be on or after Start Date');
      return;
    }

    const docId = activeDoctor?.id || activeDoctor?._id;
    const newDateWise = { ...(profileForm.dateWiseSlots || {}) };

    const curr = new Date(start);
    let count = 0;
    while (curr <= end && count < 60) {
      const y = curr.getFullYear();
      const m = String(curr.getMonth() + 1).padStart(2, '0');
      const d = String(curr.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      newDateWise[dateStr] = 'off';
      curr.setDate(curr.getDate() + 1);
      count++;
    }

    setProfileForm(prev => ({ ...prev, dateWiseSlots: newDateWise }));
    if (docId) {
      await updateDoctor(docId, { dateWiseSlots: newDateWise });
    }
    showToast(`Marked ${count} day(s) off from ${leaveStartDate} to ${leaveEndDate}!`);
  };

  const handleApplyWeeklyDaysOffPreset = async (presetType) => {
    const docId = activeDoctor?.id || activeDoctor?._id;
    let newScheduleDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const newDayWise = { ...(profileForm.dayWiseSlots || {}) };

    if (presetType === 'weekend') {
      newScheduleDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      newDayWise['Sat'] = 'off';
      newDayWise['Sun'] = 'off';
      ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].forEach(d => {
        if (newDayWise[d] === 'off') delete newDayWise[d];
      });
      showToast('Set Weekend Off (Saturday & Sunday Closed)');
    } else if (presetType === 'sunday') {
      newScheduleDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      newDayWise['Sun'] = 'off';
      ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(d => {
        if (newDayWise[d] === 'off') delete newDayWise[d];
      });
      showToast('Set Sunday Only Off (Monday - Saturday Working)');
    } else if (presetType === 'all_working') {
      newScheduleDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      DAYS_LIST.forEach(d => {
        if (newDayWise[d] === 'off') delete newDayWise[d];
      });
      showToast('All 7 Days Marked Working (No Days Off)');
    }

    setProfileForm(prev => ({ ...prev, dayWiseSlots: newDayWise, scheduleDays: newScheduleDays }));
    if (docId) {
      await updateDoctor(docId, { dayWiseSlots: newDayWise, scheduleDays: newScheduleDays });
    }
  };

  const handleRemoveDateOff = async (dateStr) => {
    const docId = activeDoctor?.id || activeDoctor?._id;
    const newDateWise = { ...(profileForm.dateWiseSlots || {}) };
    delete newDateWise[dateStr];
    setProfileForm(prev => ({ ...prev, dateWiseSlots: newDateWise }));
    if (docId) {
      await updateDoctor(docId, { dateWiseSlots: newDateWise });
    }
    showToast(`Removed leave for ${dateStr} (Restored regular schedule)`);
  };

  const handleSlotDurationChange = async (durationMinutes) => {
    const durNum = Number(durationMinutes) || 20;
    const currentDur = Number(profileForm?.slotDuration) || 20;
    if (currentDur === durNum) {
      return; // Already set to this duration; no-op to prevent false popups or redundant updates
    }
    setProfileForm(prev => ({ ...prev, slotDuration: durNum }));
    const docId = activeDoctor?.id || activeDoctor?._id;
    if (docId) {
      await updateDoctor(docId, {
        slotDuration: durNum,
        availableSlots: profileForm.availableSlots,
        dayWiseSlots: profileForm.dayWiseSlots,
        dateWiseSlots: profileForm.dateWiseSlots,
        scheduleDays: profileForm.scheduleDays
      });
    }
  };

  const handleSaveSchedule = async () => {
    setIsSavingSchedule(true);
    try {
      const docId = activeDoctor?.id || activeDoctor?._id;
      if (!docId) return;
      await updateDoctor(docId, {
        availableDays: profileForm.availableDays || 'Mon - Sat (10am - 4pm)',
        scheduleDays: Array.isArray(profileForm.scheduleDays) ? profileForm.scheduleDays : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        availableSlots: Array.isArray(profileForm.availableSlots) ? profileForm.availableSlots : ['04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'],
        slotDuration: Number(profileForm.slotDuration) || 20,
        dayWiseSlots: profileForm.dayWiseSlots || {},
        dateWiseSlots: profileForm.dateWiseSlots || {}
      });
      showToast('Appointment dates & time slots saved successfully!');
    } catch (err) {
      console.error('Failed to save schedule:', err);
      showToast('Failed to save schedule. Please try again.');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  // Profile photo uploading state
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  // Profile photo zoom preview modal state
  const [isPhotoZoomOpen, setIsPhotoZoomOpen] = useState(false);

  // Common function to upload and save doctor photo to Cloudinary & DB
  const handleDoctorPhotoUpload = async (file) => {
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const uploadedUrl = await api.uploadImage(file, 'sehatbuddy/doctors');
      setProfileForm(prev => ({ ...prev, image: uploadedUrl }));
      await updateDoctor(activeDoctor.id || activeDoctor._id, { image: uploadedUrl });
      showToast('Profile photo uploaded and saved successfully!');
    } catch (err) {
      console.error('Failed to upload doctor photo:', err);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const localData = reader.result;
        setProfileForm(prev => ({ ...prev, image: localData }));
        await updateDoctor(activeDoctor.id || activeDoctor._id, { image: localData });
        showToast('Profile photo updated locally!');
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Remove / Delete profile photo
  const handleRemovePhoto = async () => {
    const defaultPlaceholder = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80';
    setProfileForm(prev => ({ ...prev, image: defaultPlaceholder }));
    await updateDoctor(activeDoctor.id || activeDoctor._id, { image: defaultPlaceholder });
    showToast('Profile photo removed!');
  };

  // Helper to verify if profile form has any unsaved modifications
  const isProfileFormDirty = () => {
    if (!activeDoctor || !profileForm) return false;
    const textFields = [
      'name', 'specialty', 'specialization', 'phone', 'contact_number',
      'licenseNumber', 'hospital', 'jobTitle', 'about', 'availableDays'
    ];
    for (const f of textFields) {
      if (profileForm[f] !== undefined && activeDoctor[f] !== undefined) {
        if (String(profileForm[f] || '').trim() !== String(activeDoctor[f] || '').trim()) {
          return true;
        }
      }
    }
    const formPrice = Number(profileForm.price ?? profileForm.fees);
    const docPrice = Number(activeDoctor.price ?? activeDoctor.fees);
    if (!isNaN(formPrice) && !isNaN(docPrice) && formPrice !== docPrice) {
      return true;
    }
    const formExp = parseInt(profileForm.experience, 10);
    const docExp = parseInt(activeDoctor.experience, 10);
    if (!isNaN(formExp) && !isNaN(docExp) && formExp !== docExp) {
      return true;
    }
    const formDur = Number(profileForm.slotDuration);
    const docDur = Number(activeDoctor.slotDuration);
    if (!isNaN(formDur) && !isNaN(docDur) && formDur !== docDur) {
      return true;
    }
    if (JSON.stringify(profileForm.scheduleDays || []) !== JSON.stringify(activeDoctor.scheduleDays || [])) return true;
    if (JSON.stringify(profileForm.availableSlots || []) !== JSON.stringify(activeDoctor.availableSlots || [])) return true;
    if (JSON.stringify(profileForm.dayWiseSlots || {}) !== JSON.stringify(activeDoctor.dayWiseSlots || {})) return true;
    if (JSON.stringify(profileForm.dateWiseSlots || {}) !== JSON.stringify(activeDoctor.dateWiseSlots || {})) return true;
    if (JSON.stringify(profileForm.tags || []) !== JSON.stringify(activeDoctor.tags || [])) return true;
    if (JSON.stringify(profileForm.awards || []) !== JSON.stringify(activeDoctor.awards || [])) return true;
    if (JSON.stringify(profileForm.certifications || []) !== JSON.stringify(activeDoctor.certifications || [])) return true;
    if (JSON.stringify(profileForm.memberships || []) !== JSON.stringify(activeDoctor.memberships || [])) return true;
    if (JSON.stringify(profileForm.careerExperience || []) !== JSON.stringify(activeDoctor.careerExperience || [])) return true;

    return false;
  };

  // Save All Profile Settings
  const handleSaveAllProfileSettings = async (e, options = {}) => {
    e?.preventDefault?.();
    const isExplicitUserSave = options.explicit === true || (e && (e.type === 'click' || e.type === 'submit'));
    const docId = activeDoctor._id || activeDoctor.id;
    if (!docId) return;

    const isDirty = isProfileFormDirty();

    // If nothing changed and this was an automatic trigger (e.g. onBlur), do nothing
    if (!isDirty && !isExplicitUserSave) {
      return;
    }

    // If user clicked Save Settings but no changes were made
    if (!isDirty && isExplicitUserSave) {
      showToast('Profile is already up to date!');
      return;
    }

    const payload = {
      ...profileForm,
      _id: activeDoctor._id,
      id: activeDoctor.id,
      email: activeDoctor.email,
      name: profileForm.name || activeDoctor.name || 'Doctor',
      specialization: profileForm.specialty || profileForm.specialization || 'General Medicine',
      specialty: profileForm.specialty || profileForm.specialization || 'General Medicine',
      fees: Number(profileForm.price ?? profileForm.fees) || 500,
      price: Number(profileForm.price ?? profileForm.fees) || 500,
      experience: parseInt(profileForm.experience, 10) || 0,
      jobTitle: profileForm.jobTitle !== undefined ? profileForm.jobTitle : 'Senior consultant',
      licenseNumber: profileForm.licenseNumber || '',
      about: profileForm.about !== undefined ? profileForm.about : (activeDoctor.about || ''),
      awards: Array.isArray(profileForm.awards) ? profileForm.awards : (Array.isArray(activeDoctor.awards) ? activeDoctor.awards : []),
      certifications: Array.isArray(profileForm.certifications) ? profileForm.certifications : (Array.isArray(activeDoctor.certifications) ? activeDoctor.certifications : []),
      memberships: Array.isArray(profileForm.memberships) ? profileForm.memberships : (Array.isArray(activeDoctor.memberships) ? activeDoctor.memberships : []),
      careerExperience: Array.isArray(profileForm.careerExperience) ? profileForm.careerExperience : (Array.isArray(activeDoctor.careerExperience) ? activeDoctor.careerExperience : []),
      tags: Array.isArray(profileForm.tags) ? profileForm.tags : (Array.isArray(activeDoctor.tags) ? activeDoctor.tags : []),
      reels: Array.isArray(activeDoctor.reels) ? activeDoctor.reels : (Array.isArray(profileForm.reels) ? profileForm.reels : []),
      youtube_videos: Array.isArray(activeDoctor.youtube_videos) ? activeDoctor.youtube_videos : (Array.isArray(profileForm.youtube_videos) ? profileForm.youtube_videos : []),
      availableDays: profileForm.availableDays || activeDoctor.availableDays || 'Mon - Sat (10am - 4pm)',
      scheduleDays: Array.isArray(profileForm.scheduleDays) ? profileForm.scheduleDays : (activeDoctor.scheduleDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']),
      availableSlots: Array.isArray(profileForm.availableSlots) ? profileForm.availableSlots : (activeDoctor.availableSlots || []),
      slotDuration: Number(profileForm.slotDuration) || activeDoctor.slotDuration || 20,
      dayWiseSlots: (profileForm.dayWiseSlots && typeof profileForm.dayWiseSlots === 'object') ? profileForm.dayWiseSlots : (activeDoctor.dayWiseSlots || {}),
      dateWiseSlots: (profileForm.dateWiseSlots && typeof profileForm.dateWiseSlots === 'object') ? profileForm.dateWiseSlots : (activeDoctor.dateWiseSlots || {})
    };

    await updateDoctor(docId, payload);
    // Update localStorage user object so about (and other fields) survive refresh
    try {
      const rawStored = localStorage.getItem('doctor_user') || localStorage.getItem('user');
      const stored = rawStored ? JSON.parse(rawStored) : {};
      if (stored && (stored.email === activeDoctor.email || String(stored._id) === String(activeDoctor._id) || String(stored.id) === String(activeDoctor.id))) {
        stored.about = payload.about;
        stored.name = payload.name;
        stored.specialization = payload.specialization;
        stored.specialty = payload.specialty;
        stored.role = 'doctor';
        localStorage.setItem('doctor_user', JSON.stringify(stored));
        localStorage.setItem('user', JSON.stringify(stored));
      }
    } catch {}
    showToast('All profile details, credentials, schedule & fees saved successfully!');
  };

  // Save About Section directly
  const handleSaveAbout = async () => {
    setIsSavingAbout(true);
    try {
      const docId = activeDoctor._id || activeDoctor.id;
      const aboutText = profileForm.about || '';
      await updateDoctor(docId, {
        _id: activeDoctor._id,
        id: activeDoctor.id,
        email: activeDoctor.email,
        about: aboutText
      });
      // Update localStorage user object so it survives refresh
      try {
        const rawStored = localStorage.getItem('doctor_user') || localStorage.getItem('user');
        const stored = rawStored ? JSON.parse(rawStored) : {};
        if (stored && (stored.email === activeDoctor.email || String(stored._id) === String(activeDoctor._id) || String(stored.id) === String(activeDoctor.id))) {
          stored.about = aboutText;
          stored.role = 'doctor';
          localStorage.setItem('doctor_user', JSON.stringify(stored));
          localStorage.setItem('user', JSON.stringify(stored));
        }
      } catch {}
      showToast('About section updated and saved successfully!');
    } catch (err) {
      console.error('Failed to save about section:', err);
      showToast('Failed to save about section');
    } finally {
      setIsSavingAbout(false);
    }
  };

  // View public live doctor profile
  const handleViewLiveProfile = async () => {
    const docId = activeDoctor.id || activeDoctor._id;
    if (!docId) return;
    try {
      await handleSaveAllProfileSettings();
    } catch {}
    if (onNavigate) {
      onNavigate('doctor-profile', docId);
    } else {
      window.open(`/doctors/${docId}`, '_blank');
    }
  };

  // Reset optional profile information
  const handleResetOptionalInfo = async () => {
    const cleared = {
      about: '',
      awards: [],
      certifications: [],
      memberships: [],
      careerExperience: [],
      instagram: '',
      facebook: ''
    };
    setProfileForm(prev => ({ ...prev, ...cleared }));
    await updateDoctor(activeDoctor.id || activeDoctor._id, cleared);
    setIsResetModalOpen(false);
    showToast('Optional profile details reset and cleared!');
  };

  // Delete doctor profile completely
  const handleDeleteDoctorProfile = async () => {
    const docId = activeDoctor.id || activeDoctor._id;
    if (!docId) return;
    try {
      await deleteDoctor(docId);
      setIsDeleteModalOpen(false);
      showToast('Doctor profile deleted successfully.');
      if (storedUser && String(storedUser._id || storedUser.id) === String(docId)) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      setTimeout(() => {
        if (onNavigate) {
          onNavigate('find-doctors');
        } else {
          window.location.href = '/doctors';
        }
      }, 700);
    } catch (err) {
      console.error('Failed to delete doctor profile:', err);
      showToast('Failed to delete doctor profile.');
    }
  };

  // Modals
  const [isNewAppointmentModalOpen, setIsNewAppointmentModalOpen] = useState(false);
  const [newAppointmentData, setNewAppointmentData] = useState({
    patientName: '',
    age: '',
    gender: 'Male',
    time: '03:00 PM',
    type: 'In-Clinic',
    symptoms: '',
    phone: ''
  });

  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [isSubmittingAppointment, setIsSubmittingAppointment] = useState(false);
  const [newPrescriptionData, setNewPrescriptionData] = useState({
    patientName: '',
    diagnosis: '',
    medications: '',
    followUp: 'After 7 days'
  });

  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Appointment status actions
  const updateAppointmentStatus = async (id, newStatus) => {
    // 1. Immediately persist status override to guarantee persistence across reload/reopen
    saveStatusOverride(id, newStatus);

    // 2. Update React state & persistent storage keys
    setAppointments(prev => {
      const updated = prev.map(apt => {
        if (String(apt.id) === String(id) || String(apt._id) === String(id)) {
          const isCompleted = newStatus === 'Completed';
          return {
            ...apt,
            status: newStatus,
            isCompleted,
            cancelled: newStatus === 'Cancelled',
            completedAt: isCompleted ? new Date().toISOString() : null,
            slotDate: isCompleted && apt.slotDate && apt.slotDate > todayDateStr ? todayDateStr : apt.slotDate,
            dateStr: isCompleted && apt.dateStr && apt.dateStr > todayDateStr ? todayDateStr : apt.dateStr,
            date: isCompleted && apt.date && apt.date > todayDateStr ? todayDateStr : apt.date
          };
        }
        return apt;
      });
      saveDoctorAppointments(updated);
      return updated;
    });

    // 3. Update status in local user bookings (sehat_buddy_appointments)
    try {
      const rawUserApts = localStorage.getItem('sehat_buddy_appointments');
      if (rawUserApts) {
        const parsed = JSON.parse(rawUserApts);
        if (Array.isArray(parsed)) {
          const updatedUserApts = parsed.map(b => {
            if (String(b.id) === String(id) || String(b._id) === String(id)) {
              const isCompleted = newStatus === 'Completed';
              return {
                ...b,
                status: newStatus,
                isCompleted,
                cancelled: newStatus === 'Cancelled',
                completedAt: isCompleted ? new Date().toISOString() : null,
                slotDate: isCompleted && b.slotDate && b.slotDate > todayDateStr ? todayDateStr : b.slotDate,
                dateStr: isCompleted && b.dateStr && b.dateStr > todayDateStr ? todayDateStr : b.dateStr
              };
            }
            return b;
          });
          localStorage.setItem('sehat_buddy_appointments', JSON.stringify(updatedUserApts));
        }
      }
    } catch {}

    // 4. Update backend
    try {
      await api.updateAppointmentStatus(id, {
        status: newStatus,
        isCompleted: newStatus === 'Completed',
        cancelled: newStatus === 'Cancelled'
      });
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sehat_appointments_changed', { detail: { id, status: newStatus } }));
      window.dispatchEvent(new CustomEvent('sehat_db_change', { detail: { collection: 'appointments', id, status: newStatus } }));
    }
    showToast(`Appointment marked as ${newStatus}`);
  };

  const handleDeleteAppointment = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this appointment? This action cannot be undone.')) return;
    removeStatusOverride(id);
    setAppointments(prev => {
      const updated = prev.filter(apt => String(apt.id) !== String(id) && String(apt._id) !== String(id));
      saveDoctorAppointments(updated);
      return updated;
    });

    try {
      await api.deleteDoctorAppointment(id);
    } catch {}

    try {
      const rawUserApts = localStorage.getItem('sehat_buddy_appointments');
      if (rawUserApts) {
        const parsed = JSON.parse(rawUserApts);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(b => String(b.id) !== String(id) && String(b._id) !== String(id));
          localStorage.setItem('sehat_buddy_appointments', JSON.stringify(filtered));
        }
      }
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sehat_appointments_changed', { detail: { id, action: 'delete' } }));
    }
    showToast('Appointment permanently deleted');
  };

  const handleAddAppointment = async (e) => {
    e.preventDefault();
    if (isSubmittingAppointment) return;
    if (!newAppointmentData.patientName.trim()) return;

    const phoneDigits = (newAppointmentData.phone || '').replace(/\D/g, '').slice(0, 10);
    if (phoneDigits.length > 0 && phoneDigits.length < 10) {
      alert('Please enter a valid 10-digit contact phone number.');
      return;
    }

    setIsSubmittingAppointment(true);
    const sDate = todayDateStr;
    const sTime = newAppointmentData.time || '03:00 PM';
    const fee = consultationFee;

    const newAptData = {
      docId: activeDoctor?._id ? activeDoctor._id.toString() : (activeDoctor?.id || 'default'),
      patientName: newAppointmentData.patientName.trim(),
      age: parseInt(newAppointmentData.age, 10) || 30,
      gender: newAppointmentData.gender || 'Male',
      time: sTime,
      slotTime: sTime,
      date: sDate,
      slotDate: sDate,
      type: newAppointmentData.type || 'In-Clinic',
      consultationType: newAppointmentData.type || 'In-Clinic Visit',
      symptoms: newAppointmentData.symptoms || 'General Consultation',
      phone: phoneDigits ? `+91 ${phoneDigits}` : '+91 98000 00000',
      status: 'Confirmed',
      amount: fee
    };

    try {
      const created = await api.createDoctorAppointment(newAptData);
      if (created && (created._id || created.id)) {
        fetchRemoteAppointments();
      } else {
        setAppointments(prev => {
          const updated = [{ ...newAptData, id: Date.now(), isRealtime: true }, ...prev];
          saveDoctorAppointments(updated);
          return updated;
        });
      }
    } catch {
      setAppointments(prev => {
        const updated = [{ ...newAptData, id: Date.now(), isRealtime: true }, ...prev];
        saveDoctorAppointments(updated);
        return updated;
      });
    } finally {
      setIsSubmittingAppointment(false);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sehat_appointments_changed', { detail: { action: 'add' } }));
    }
    setIsNewAppointmentModalOpen(false);
    setNewAppointmentData({
      patientName: '',
      age: '',
      gender: 'Male',
      time: '03:00 PM',
      type: 'In-Clinic',
      symptoms: '',
      phone: ''
    });
    showToast(`Appointment scheduled for ${newAptData.patientName}`);
  };

  const handleAddPrescription = (e) => {
    e.preventDefault();
    if (!newPrescriptionData.patientName.trim()) return;

    const newRx = {
      id: Date.now(),
      patientName: newPrescriptionData.patientName.trim(),
      date: 'Just now',
      diagnosis: newPrescriptionData.diagnosis || 'Clinical Consultation',
      medications: newPrescriptionData.medications || 'Standard medication protocol',
      followUp: newPrescriptionData.followUp
    };

    setPrescriptions(prev => {
      const updated = [newRx, ...prev];
      saveDoctorPrescriptions(updated);
      return updated;
    });
    setIsPrescriptionModalOpen(false);
    setNewPrescriptionData({
      patientName: '',
      diagnosis: '',
      medications: '',
      followUp: 'After 7 days'
    });
    showToast(`Prescription saved for ${newRx.patientName}`);
  };

  const handleDeletePrescription = (id) => {
    if (!window.confirm('Are you sure you want to delete this clinical prescription note?')) return;
    setPrescriptions(prev => {
      const updated = prev.filter(rx => rx.id !== id);
      saveDoctorPrescriptions(updated);
      return updated;
    });
    showToast('Prescription note deleted.');
  };

  // Robust resolver for appointment date key (ensures appointment slot date strictly dictates the calendar/heatmap day)
  const resolveAppointmentDateKey = React.useCallback((apt) => {
    if (!apt) return '';
    const isCompleted = apt.status === 'Completed' || apt.isCompleted === true || String(apt.status).toLowerCase() === 'completed';

    const slotD = String(apt.slotDate || '').trim();
    if (slotD.toLowerCase() === 'today') return todayDateStr;
    const fromSlotD = getLocalDateString(slotD);
    if (fromSlotD) {
      // Completed consultation cannot occur in the future; if booked for future slot, completion was executed today on PC
      if (isCompleted && fromSlotD > todayDateStr) {
        return todayDateStr;
      }
      return fromSlotD;
    }

    const dStr = String(apt.dateStr || '').trim();
    if (dStr.toLowerCase() === 'today') return todayDateStr;
    const fromDStr = getLocalDateString(dStr);
    if (fromDStr) {
      if (isCompleted && fromDStr > todayDateStr) {
        return todayDateStr;
      }
      return fromDStr;
    }

    const d = String(apt.date || '').trim();
    if (d.toLowerCase() === 'today') return todayDateStr;
    const fromD = getLocalDateString(d);
    if (fromD) {
      if (isCompleted && fromD > todayDateStr) {
        return todayDateStr;
      }
      return fromD;
    }

    if (apt.date && typeof apt.date === 'number') {
      const fromNum = getLocalDateString(apt.date);
      if (fromNum) {
        if (isCompleted && fromNum > todayDateStr) {
          return todayDateStr;
        }
        return fromNum;
      }
    }

    if (apt.bookedAt) {
      const parsed = getLocalDateString(apt.bookedAt);
      if (parsed) {
        if (isCompleted && parsed > todayDateStr) {
          return todayDateStr;
        }
        return parsed;
      }
    }
    if (apt.createdAt) {
      const parsed = getLocalDateString(apt.createdAt);
      if (parsed) {
        if (isCompleted && parsed > todayDateStr) {
          return todayDateStr;
        }
        return parsed;
      }
    }

    return todayDateStr;
  }, [todayDateStr]);

  const isTodayAppointment = React.useCallback((apt) => {
    if (!apt) return false;
    return resolveAppointmentDateKey(apt) === todayDateStr;
  }, [resolveAppointmentDateKey, todayDateStr]);

  // Today's scheduled appointments count
  const scheduledTodayCount = React.useMemo(() => {
    return appointments.filter(a => isTodayAppointment(a)).length;
  }, [appointments, isTodayAppointment]);

  // Today's completed patient count
  const completedTodayCount = React.useMemo(() => {
    return appointments.filter(a => {
      const isCompleted = a.status === 'Completed' || a.isCompleted === true || String(a.status).toLowerCase() === 'completed';
      return isCompleted && isTodayAppointment(a);
    }).length;
  }, [appointments, isTodayAppointment]);

  // Consultation fee for active doctor
  const consultationFee = Number(activeDoctor.price ?? activeDoctor.fees) || 800;

  // Today's completed appointments with patient details
  const todayCompletedAppointments = React.useMemo(() => {
    return appointments.filter(a => {
      const isCompleted = a.status === 'Completed' || a.isCompleted === true || String(a.status).toLowerCase() === 'completed';
      return isCompleted && isTodayAppointment(a);
    });
  }, [appointments, isTodayAppointment]);

  // Amount made today = sum of actual consultation amounts for today's completed visits
  const amountMadeToday = React.useMemo(() => {
    if (todayCompletedAppointments.length === 0) return 0;
    return todayCompletedAppointments.reduce((sum, a) => sum + (Number(a.amount) || consultationFee), 0);
  }, [todayCompletedAppointments, consultationFee]);

  // Real-time map of earnings and completed appointments per day
  const dailyEarningsMap = React.useMemo(() => {
    const map = {};
    appointments.forEach(apt => {
      const isCompleted = apt.status === 'Completed' || apt.isCompleted === true || String(apt.status).toLowerCase() === 'completed';
      if (isCompleted) {
        const dateKey = resolveAppointmentDateKey(apt);
        if (!dateKey) return;
        if (!map[dateKey]) {
          map[dateKey] = { count: 0, earnings: 0, patients: [] };
        }
        map[dateKey].count += 1;
        const fee = Number(apt.amount) || consultationFee;
        map[dateKey].earnings += fee;
        map[dateKey].patients.push({
          name: apt.patientName || apt.userData?.name || 'Patient',
          time: apt.time || apt.slotTime || 'N/A',
          type: apt.type || apt.consultationType || 'In-Clinic',
          fee
        });
      }
    });

    return map;
  }, [appointments, consultationFee, resolveAppointmentDateKey]);

  // Heatmap color generator matching white theme contribution calendar
  const getHeatmapColor = React.useCallback((earnings, count = 0, isFuture = false) => {
    if (isFuture) return '#fafafa';
    const c = Number(count) || 0;
    const e = Number(earnings) || 0;
    if (c === 0 && e === 0) return '#ebedf0'; // Empty day (clean light gray tile)
    if (c === 1 || e <= consultationFee) return '#9be9a8'; // Level 1 (soft mint green)
    if (c === 2 || e <= consultationFee * 2) return '#40c463'; // Level 2 (medium light green)
    if (c <= 4 || e <= consultationFee * 4) return '#30a14e'; // Level 3 (vibrant green)
    return '#216e39'; // Level 4 (deep emerald green)
  }, [consultationFee]);

  // 12-Week Timeline data (Mon to Sun rows, 12 week columns)
  // Strictly terminates at Present (Today); future dates are marked and hidden from the activity grid
  const heatmapWeeksData = React.useMemo(() => {
    const now = currentPcDate;
    // Normalize today to start of day in local time
    const todayNormalized = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const currentDayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon, ...
    const distFromMon = (currentDayOfWeek + 6) % 7;

    const startMon = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    startMon.setDate(startMon.getDate() - distFromMon - (11 * 7));
    startMon.setHours(0, 0, 0, 0);

    const weeks = [];
    const monthHeaders = [];
    let lastMonth = -1;

    for (let w = 0; w < 12; w++) {
      const weekDays = [];
      for (let d = 0; d < 7; d++) {
        const cellDate = new Date(startMon);
        cellDate.setDate(startMon.getDate() + (w * 7) + d);
        cellDate.setHours(0, 0, 0, 0);
        const cellTime = cellDate.getTime();
        const dateStr = getLocalDateString(cellDate);

        if (d === 0) {
          const m = cellDate.getMonth();
          if (m !== lastMonth) {
            monthHeaders.push({
              weekIdx: w,
              name: cellDate.toLocaleDateString('en-US', { month: 'short' })
            });
            lastMonth = m;
          }
        }

        const isFuture = cellTime > todayNormalized;
        const isToday = cellTime === todayNormalized;
        const dataForDay = isFuture ? { count: 0, earnings: 0, patients: [] } : (dailyEarningsMap[dateStr] || { count: 0, earnings: 0, patients: [] });

        weekDays.push({
          date: cellDate,
          dateStr,
          dayNum: cellDate.getDate(),
          dayName: cellDate.toLocaleDateString('en-US', { weekday: 'short' }),
          formattedDate: cellDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
          isFuture,
          isToday,
          count: isFuture ? 0 : dataForDay.count,
          earnings: isFuture ? 0 : dataForDay.earnings,
          patients: isFuture ? [] : dataForDay.patients
        });
      }
      weeks.push(weekDays);
    }

    return { weeks, monthHeaders };
  }, [dailyEarningsMap, currentPcDate]);

  // Month Calendar data (Current Month)
  const heatmapMonthData = React.useMemo(() => {
    const now = currentPcDate;
    const todayNormalized = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    
    const startDayIndex = (firstDay.getDay() + 6) % 7; // 0=Mon, 6=Sun
    
    const days = [];
    for (let i = 0; i < startDayIndex; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= totalDays; day++) {
      const cellDate = new Date(year, month, day);
      cellDate.setHours(0, 0, 0, 0);
      const cellTime = cellDate.getTime();
      const dateStr = getLocalDateString(cellDate);
      const isFuture = cellTime > todayNormalized;
      const isToday = cellTime === todayNormalized;
      const dataForDay = isFuture ? { count: 0, earnings: 0, patients: [] } : (dailyEarningsMap[dateStr] || { count: 0, earnings: 0, patients: [] });

      days.push({
        date: cellDate,
        dateStr,
        dayNum: day,
        dayName: cellDate.toLocaleDateString('en-US', { weekday: 'short' }),
        formattedDate: cellDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
        isFuture,
        isToday,
        count: isFuture ? 0 : dataForDay.count,
        earnings: isFuture ? 0 : dataForDay.earnings,
        patients: isFuture ? [] : dataForDay.patients
      });
    }

    return {
      monthName: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      days
    };
  }, [dailyEarningsMap, currentPcDate]);

  // Entire Year Timeline data grouped by distinct month blocks (Heat.js style)
  // Each month starts cleanly on its own column with its month label directly above it!
  const heatmapYearData = React.useMemo(() => {
    const now = currentPcDate;
    const year = selectedHeatmapYear;
    const todayNormalized = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const monthBlocks = [];

    for (let m = 0; m < 12; m++) {
      const monthDate = new Date(year, m, 1);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
      const firstDay = new Date(year, m, 1);
      const lastDay = new Date(year, m + 1, 0);
      const startDayOfWeek = (firstDay.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
      const daysInMonth = lastDay.getDate();
      const numWeeks = Math.ceil((startDayOfWeek + daysInMonth) / 7);

      const weeks = [];
      let monthTotalEarnings = 0;
      let monthTotalVisits = 0;

      for (let w = 0; w < numWeeks; w++) {
        const weekDays = [];
        for (let d = 0; d < 7; d++) {
          const dayNum = (w * 7) + d - startDayOfWeek + 1;
          if (dayNum < 1 || dayNum > daysInMonth) {
            weekDays.push(null);
          } else {
            const cellDate = new Date(year, m, dayNum);
            cellDate.setHours(0, 0, 0, 0);
            const cellTime = cellDate.getTime();
            const dateStr = getLocalDateString(cellDate);
            const isFuture = cellTime > todayNormalized;
            const isToday = cellTime === todayNormalized;
            const dataForDay = isFuture
              ? { count: 0, earnings: 0, patients: [] }
              : (dailyEarningsMap[dateStr] || { count: 0, earnings: 0, patients: [] });

            if (!isFuture) {
              monthTotalEarnings += dataForDay.earnings;
              monthTotalVisits += dataForDay.count;
            }

            weekDays.push({
              date: cellDate,
              dateStr,
              dayNum,
              monthName,
              dayName: cellDate.toLocaleDateString('en-US', { weekday: 'short' }),
              formattedDate: cellDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
              isFuture,
              isToday,
              count: isFuture ? 0 : dataForDay.count,
              earnings: isFuture ? 0 : dataForDay.earnings,
              patients: isFuture ? [] : dataForDay.patients
            });
          }
        }
        weeks.push(weekDays);
      }

      monthBlocks.push({
        monthIndex: m,
        monthName,
        weeks,
        totalEarnings: monthTotalEarnings,
        totalVisits: monthTotalVisits
      });
    }

    return { monthBlocks, year };
  }, [dailyEarningsMap, currentPcDate, selectedHeatmapYear]);

  // Overall heatmap metrics
  const heatmapMetrics = React.useMemo(() => {
    let totalRevenue = 0;
    let totalCompleted = 0;
    let peakDay = { dateStr: '', formattedDate: '', earnings: 0, count: 0 };

    Object.entries(dailyEarningsMap).forEach(([dateStr, data]) => {
      // Heatmap strictly records historical and today's PC date activity
      if (dateStr <= todayDateStr && data.earnings > 0) {
        totalRevenue += data.earnings;
        totalCompleted += data.count;
        if (data.earnings > peakDay.earnings) {
          const dObj = new Date(dateStr + 'T00:00:00');
          peakDay = {
            dateStr,
            formattedDate: dObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
            earnings: data.earnings,
            count: data.count
          };
        }
      }
    });

    return { totalRevenue, totalCompleted, peakDay };
  }, [dailyEarningsMap, todayDateStr]);

  // Filtered appointments
  const filteredAppointments = appointments.filter(apt => {
    if (appointmentFilter === 'all') return true;
    if (appointmentFilter === 'today') return isTodayAppointment(apt) || apt.date === 'Today';
    if (appointmentFilter === 'confirmed') return apt.status === 'Confirmed' || apt.status === 'In-Progress';
    if (appointmentFilter === 'completed') return apt.status === 'Completed';
    return true;
  });

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
            <img src={logoImg} alt="The Sehat Buddy" style={{ height: '26px', maxWidth: '32px', objectFit: 'contain' }} />
          </div>
          <div>
            <div className={styles.brandTitleWrap}>
              <span className={styles.brandTitle}>The Sehat Buddy</span>
              <span className={styles.portalBadge}>
                <Activity size={13} /> Doctor Portal
              </span>
            </div>
            <p className={styles.brandSub}>Physician Clinical Console & Patient Scheduling</p>
          </div>
        </div>

        {/* Portal Switcher */}
        <div className={styles.headerRight}>

          <div className={styles.quickNavBtns}>
            <button className={styles.navLinkBtn} onClick={() => onNavigate('site')}>
              Website
            </button>
            <button className={styles.navLinkBtn} style={{ color: '#dc2626', fontWeight: 600 }} onClick={() => {
              localStorage.removeItem('doctor_token');
              localStorage.removeItem('doctor_user');
              try {
                const u = JSON.parse(localStorage.getItem('user') || '{}');
                if (u.role === 'doctor' || !u.role) {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                }
              } catch {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
              }
              window.location.href = '/doctor';
            }}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Workspace */}
      <div className={styles.mainWrapper}>
        {/* Doctor Profile Banner */}
        <div className={styles.profileBanner}>
          <div className={styles.doctorCardMini}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img
                src={profileForm.image || activeDoctor.image}
                alt={activeDoctor.name || 'Doctor'}
                className={styles.doctorAvatar}
                onClick={() => setIsPhotoZoomOpen(true)}
                title="Click to view full photo"
                style={{ cursor: 'pointer', transition: 'transform 0.2s, opacity 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=200&q=80';
                }}
              />
              <label
                style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  background: '#2563eb',
                  color: 'white',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isUploadingImage ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                  border: '2px solid #0f172a',
                  transition: 'transform 0.2s, background 0.2s'
                }}
                title="Change Profile Photo"
              >
                {isUploadingImage ? (
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Camera size={14} />
                )}
                <input
                  type="file"
                  accept="image/*"
                  disabled={isUploadingImage}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleDoctorPhotoUpload(file);
                  }}
                />
              </label>
            </div>
            <div className={styles.doctorMeta}>
              <div className={styles.nameRow}>
                <h2 title={activeDoctor.name || 'Doctor'}>{activeDoctor.name}</h2>
                <span className={styles.specialtyPill} title={activeDoctor.specialty}>{activeDoctor.specialty}</span>
              </div>
              <p
                className={styles.degreesText}
                title={`${activeDoctor.degree || 'MBBS, MD'} • ${typeof activeDoctor.experience === 'number' || (!isNaN(Number(activeDoctor.experience)) && String(activeDoctor.experience).trim() !== '') ? `${activeDoctor.experience}+ Years Experience` : (activeDoctor.experience || '10+ Years Experience')}`}
              >
                {activeDoctor.degree || 'MBBS, MD'} • {typeof activeDoctor.experience === 'number' || (!isNaN(Number(activeDoctor.experience)) && String(activeDoctor.experience).trim() !== '') ? `${activeDoctor.experience}+ Years Experience` : (activeDoctor.experience || '10+ Years Experience')}
              </p>
              <p className={styles.hospitalAffiliation} title={activeDoctor.hospital || 'Private Healthcare Center'}>
                <Building2 size={13} style={{ flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {activeDoctor.hospital || 'Private Healthcare Center'}
                </span>
              </p>
            </div>
          </div>

          <div className={styles.statusToggleGroup}>
            <span className={styles.statusLabel}>Availability Status:</span>
            <div className={styles.statusButtonGroup}>
              <button
                type="button"
                className={`${styles.statusOption} ${availabilityStatus === 'Available' ? styles.statusAvailable : ''}`}
                onClick={() => handleSetAvailabilityStatus('Available')}
              >
                <span className={styles.statusDotGreen}></span> Available
              </button>
              <button
                type="button"
                className={`${styles.statusOption} ${availabilityStatus === 'Busy' ? styles.statusBusy : ''}`}
                onClick={() => handleSetAvailabilityStatus('Busy')}
              >
                <span className={styles.statusDotYellow}></span> In Surgery / Busy
              </button>
              <button
                type="button"
                className={`${styles.statusOption} ${availabilityStatus === 'On Leave' ? styles.statusLeave : ''}`}
                onClick={() => handleSetAvailabilityStatus('On Leave')}
              >
                <span className={styles.statusDotRed}></span> On Leave
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIconWrap} ${styles.kpiGreen}`}>
              <Calendar size={22} />
            </div>
            <div>
              <span className={styles.kpiLabel}>Appointments Today</span>
              <div className={styles.kpiValue}>
                {scheduledTodayCount} Scheduled
              </div>
              <span className={styles.kpiSub}>
                {completedTodayCount} Completed
              </span>
            </div>
          </div>

          <div
            className={styles.kpiCard}
            onClick={() => setIsEarningsBreakdownOpen(true)}
            style={{ cursor: 'pointer' }}
            title="Click to view patient consultation fees breakdown"
          >
            <div className={`${styles.kpiIconWrap} ${styles.kpiEmerald}`}>
              <TrendingUp size={22} />
            </div>
            <div>
              <span className={styles.kpiLabel}>Amount Made Today</span>
              <div className={styles.kpiValue}>
                ₹{amountMadeToday.toLocaleString('en-IN')}
              </div>
              <span className={styles.kpiSub}>
                Total earnings
              </span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIconWrap} ${styles.kpiBlue}`}>
              <IndianRupee size={22} />
            </div>
            <div>
              <span className={styles.kpiLabel}>Consultation Fee</span>
              <div className={styles.kpiValue}>₹{consultationFee}</div>
              <span className={styles.kpiSub}>
                Per patient consultation
              </span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIconWrap} ${styles.kpiYellow}`}>
              <Star size={22} />
            </div>
            <div>
              <span className={styles.kpiLabel}>Patient Satisfaction</span>
              <div className={styles.kpiValue}>{verifiedAvgRating} ★</div>
              <span className={styles.kpiSub}>{verifiedReviewsCount} {verifiedReviewsCount === 1 ? 'review' : 'reviews'}</span>
            </div>
          </div>

          {(() => {
            const rawTiming = String(activeDoctor.availableDays || 'Mon - Sat (10am - 4pm)').trim();
            let daysText = rawTiming;
            let hoursText = null;

            const parenMatch = rawTiming.match(/^(.*?)\s*\((.*?)\)$/);
            if (parenMatch) {
              daysText = parenMatch[1].trim();
              hoursText = parenMatch[2].trim();
            } else if (rawTiming.includes(':')) {
              const parts = rawTiming.split(':');
              daysText = parts[0].trim();
              hoursText = parts.slice(1).join(':').trim();
            }

            const timingSub = hoursText || `${activeDoctor.slotDuration || 20} mins slot`;

            return (
              <div className={styles.kpiCard}>
                <div className={`${styles.kpiIconWrap} ${styles.kpiPurple}`}>
                  <Clock size={22} />
                </div>
                <div>
                  <span className={styles.kpiLabel}>Clinic Timings</span>
                  <div
                    className={styles.kpiValue}
                    title={rawTiming}
                  >
                    {daysText}
                  </div>
                  <span 
                    className={styles.kpiSub} 
                    title={`${daysText} (${timingSub}) • OPD Slot: ${activeDoctor.slotDuration || 20} mins`}
                  >
                    {timingSub}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* REAL-TIME DOCTOR EARNINGS HEATMAP */}
        <div className={styles.heatmapCard}>
          <div className={styles.heatmapHeader}>
            <div className={styles.heatmapTitleGroup}>
              <h3 className={styles.heatmapTitle}>
                <Activity size={20} color="#15803d" />
                <span>Daily Earnings Real-Time Heatmap</span>
              </h3>
              <span className={styles.heatmapLivePulse} title="Synchronized live with patient consultations">
                <span className={styles.pulseDot}></span>
                <span>Live Real-Time Sync</span>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {/* Year Selector Control (Heat.js style) */}
              <div style={{ display: 'inline-flex', alignItems: 'center', background: '#f8fafc', borderRadius: '8px', padding: '2px', border: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  onClick={() => setSelectedHeatmapYear(y => y - 1)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: '4px 6px',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: '4px'
                  }}
                  title="Previous Year"
                >
                  <ChevronLeft size={15} />
                </button>
                <span style={{ color: '#0f172a', fontWeight: 800, fontSize: '0.80rem', padding: '0 8px', letterSpacing: '0.02em' }}>
                  {heatmapYearData.year}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedHeatmapYear(y => y + 1)}
                  disabled={heatmapYearData.year >= currentPcDate.getFullYear()}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: heatmapYearData.year >= currentPcDate.getFullYear() ? '#cbd5e1' : '#64748b',
                    cursor: heatmapYearData.year >= currentPcDate.getFullYear() ? 'not-allowed' : 'pointer',
                    padding: '4px 6px',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: '4px'
                  }}
                  title="Next Year"
                >
                  <ChevronRight size={15} />
                </button>
              </div>

              <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  onClick={() => setHeatmapView('year')}
                  style={{
                    border: 'none',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: heatmapView === 'year' ? '#ffffff' : 'transparent',
                    color: heatmapView === 'year' ? '#0f172a' : '#64748b',
                    boxShadow: heatmapView === 'year' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Full Year ({heatmapYearData.year})
                </button>
                <button
                  type="button"
                  onClick={() => setHeatmapView('weeks')}
                  style={{
                    border: 'none',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: heatmapView === 'weeks' ? '#ffffff' : 'transparent',
                    color: heatmapView === 'weeks' ? '#0f172a' : '#64748b',
                    boxShadow: heatmapView === 'weeks' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  12 Weeks
                </button>
                <button
                  type="button"
                  onClick={() => setHeatmapView('month')}
                  style={{
                    border: 'none',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: heatmapView === 'month' ? '#ffffff' : 'transparent',
                    color: heatmapView === 'month' ? '#0f172a' : '#64748b',
                    boxShadow: heatmapView === 'month' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Current Month
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsHeatmapExpanded(!isHeatmapExpanded)}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '5px 10px',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: '#475569',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>{isHeatmapExpanded ? 'Collapse' : 'Expand'}</span>
                <ChevronDown size={14} style={{ transform: isHeatmapExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
              </button>
            </div>
          </div>

          {isHeatmapExpanded && (
            <>
              {/* Summary Metrics Row */}
              <div className={styles.heatmapStatsRow}>
                <div className={styles.heatmapStatBadge}>
                  <span>Total Recorded Earnings:</span>
                  <strong style={{ color: '#15803d' }}>₹{heatmapMetrics.totalRevenue.toLocaleString('en-IN')}</strong>
                </div>
                <div className={styles.heatmapStatBadge}>
                  <span>Completed Consultations:</span>
                  <strong>{heatmapMetrics.totalCompleted} patients</strong>
                </div>
                {heatmapMetrics.peakDay.earnings > 0 && (
                  <div className={styles.heatmapStatBadge}>
                    <Sparkles size={13} color="#eab308" />
                    <span>Peak Day ({heatmapMetrics.peakDay.formattedDate}):</span>
                    <strong style={{ color: '#16a34a' }}>₹{heatmapMetrics.peakDay.earnings.toLocaleString('en-IN')}</strong>
                    <span style={{ fontSize: '0.70rem', color: '#64748b' }}>({heatmapMetrics.peakDay.count} visits)</span>
                  </div>
                )}
                <div className={styles.heatmapStatBadge} style={{ marginLeft: 'auto', background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                  <TrendingUp size={13} color="#16a34a" />
                  <span>Today ({todayDateStr}):</span>
                  <strong style={{ color: '#15803d' }}>₹{amountMadeToday.toLocaleString('en-IN')}</strong>
                  <span style={{ fontSize: '0.70rem', color: '#166534' }}>({completedTodayCount} completed)</span>
                </div>
              </div>

              {/* VIEW 0: FULL YEAR MATRIX (JAN - DEC) WITH HEAT.JS DISTINCT MONTH BLOCKS */}
              {heatmapView === 'year' && (
                <div className={styles.heatmapGridScroll}>
                  <div className={styles.heatmapMonthGroupContainer}>
                    {/* Sticky / Leading Day Labels (Mon to Sun) */}
                    <div className={styles.heatmapDayLabels}>
                      <span className={styles.heatmapDayLabel}>Mon</span>
                      <span className={styles.heatmapDayLabel}>Tue</span>
                      <span className={styles.heatmapDayLabel}>Wed</span>
                      <span className={styles.heatmapDayLabel}>Thu</span>
                      <span className={styles.heatmapDayLabel}>Fri</span>
                      <span className={styles.heatmapDayLabel}>Sat</span>
                      <span className={styles.heatmapDayLabel}>Sun</span>
                    </div>

                    {/* Months Rendered Side-by-Side as Distinct Blocks (Heat.js style) */}
                    <div className={styles.heatmapMonthsTrack}>
                      {heatmapYearData.monthBlocks.map((monthBlock) => (
                        <div key={monthBlock.monthIndex} className={styles.heatmapMonthBlock}>
                          {/* Distinct Month Header */}
                          <div className={styles.heatmapMonthHeaderLabel}>
                            <span className={styles.heatmapMonthNameText}>{monthBlock.monthName}</span>
                            {monthBlock.totalEarnings > 0 && (
                              <span className={styles.heatmapMonthEarningsBadge}>
                                ₹{monthBlock.totalEarnings.toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>

                          {/* Columns of weeks for this specific month */}
                          <div className={styles.heatmapMonthWeeksGrid}>
                            {monthBlock.weeks.map((week, wIdx) => (
                              <div key={wIdx} className={styles.heatmapMonthWeekCol}>
                                {week.map((cell, dIdx) => {
                                  // Days outside this month are blank spaces
                                  if (!cell) {
                                    return (
                                      <div
                                        key={dIdx}
                                        className={styles.heatmapCellPlaceholder}
                                        aria-hidden="true"
                                      />
                                    );
                                  }

                                  if (cell.isFuture) {
                                    return (
                                      <div
                                        key={dIdx}
                                        className={styles.heatmapCellFuture}
                                        title={`${cell.formattedDate} (Upcoming)`}
                                      />
                                    );
                                  }

                                  const isSelected = selectedHeatmapCell?.dateStr === cell.dateStr;
                                  const bgColor = getHeatmapColor(cell.earnings, cell.count, false);
                                  return (
                                    <div
                                      key={dIdx}
                                      className={`${styles.heatmapCell} ${cell.isToday ? styles.heatmapCellToday : ''} ${isSelected ? styles.heatmapCellActive : ''}`}
                                      style={{
                                        background: bgColor,
                                        cursor: 'pointer',
                                        outline: 'none'
                                      }}
                                      onClick={() => setSelectedHeatmapCell(cell)}
                                      title={`${cell.formattedDate}\n₹${cell.earnings.toLocaleString('en-IN')} Earned\n${cell.count} Completed Consultation${cell.count === 1 ? '' : 's'}${cell.isToday ? ' (Today)' : ''}`}
                                    />
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 1: 12-WEEK MATRIX (GITHUB STYLE) */}
              {heatmapView === 'weeks' && (
                <div className={styles.heatmapGridScroll}>
                  <div className={styles.heatmapMatrix}>
                    {/* Day labels (Mon, Wed, Fri) */}
                    <div className={styles.heatmapDayLabels}>
                      <span className={styles.heatmapDayLabel}>Mon</span>
                      <span className={styles.heatmapDayLabel}>Tue</span>
                      <span className={styles.heatmapDayLabel}>Wed</span>
                      <span className={styles.heatmapDayLabel}>Thu</span>
                      <span className={styles.heatmapDayLabel}>Fri</span>
                      <span className={styles.heatmapDayLabel}>Sat</span>
                      <span className={styles.heatmapDayLabel}>Sun</span>
                    </div>

                    {/* Columns of weeks */}
                    {heatmapWeeksData.weeks.map((week, wIdx) => {
                      const headerMonth = heatmapWeeksData.monthHeaders.find(mh => mh.weekIdx === wIdx);
                      return (
                        <div key={wIdx} className={styles.heatmapWeekCol}>
                          <div className={styles.heatmapMonthHeader}>
                            {headerMonth ? headerMonth.name : ''}
                          </div>
                          {week.map((cell, dIdx) => {
                            // Heatmap is a historical activity log that strictly points to present (Today).
                            // Future dates must not be rendered as active/visible blocks.
                            if (cell.isFuture) {
                              return (
                                <div
                                  key={dIdx}
                                  style={{
                                    width: '12px',
                                    height: '12px',
                                    visibility: 'hidden',
                                    pointerEvents: 'none'
                                  }}
                                />
                              );
                            }

                            const isSelected = selectedHeatmapCell?.dateStr === cell.dateStr;
                            const bgColor = getHeatmapColor(cell.earnings, cell.count, false);
                            return (
                              <div
                                key={dIdx}
                                className={`${styles.heatmapCell} ${cell.isToday ? styles.heatmapCellToday : ''} ${isSelected ? styles.heatmapCellActive : ''}`}
                                style={{
                                  background: bgColor,
                                  cursor: 'pointer',
                                  outline: 'none'
                                }}
                                onClick={() => setSelectedHeatmapCell(cell)}
                                title={`${cell.formattedDate}\n₹${cell.earnings.toLocaleString('en-IN')} Earned\n${cell.count} Completed Consultation${cell.count === 1 ? '' : 's'}${cell.isToday ? ' (Today)' : ''}`}
                              />
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* VIEW 2: CURRENT MONTH CALENDAR VIEW */}
              {heatmapView === 'month' && (
                <div style={{ background: '#181d24', border: '1px solid #272f3d', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '0.94rem', color: '#ffffff', fontWeight: 700 }}>
                      <CalendarDays size={16} color="#38bdf8" style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
                      {heatmapMonthData.monthName} Consultation Earnings
                    </h4>
                    <span style={{ fontSize: '0.76rem', color: '#8b949e' }}>
                      Click on any date to inspect earnings breakdown
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center' }}>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(dName => (
                      <div key={dName} style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8b949e', paddingBottom: '4px' }}>
                        {dName}
                      </div>
                    ))}

                    {heatmapMonthData.days.map((cell, idx) => {
                      if (!cell) {
                        return <div key={idx} style={{ minHeight: '52px', background: 'transparent' }} />;
                      }
                      const isSelected = selectedHeatmapCell?.dateStr === cell.dateStr;
                      const isFuture = cell.isFuture;
                      const bgColor = isFuture ? '#1a2029' : getHeatmapColor(cell.earnings, cell.count, false);
                      return (
                        <div
                          key={idx}
                          onClick={() => !isFuture && setSelectedHeatmapCell(cell)}
                          style={{
                            minHeight: '54px',
                            borderRadius: '8px',
                            background: bgColor,
                            border: isSelected ? '2px solid #56e36d' : (isFuture ? '1px dashed #2d3644' : '1px solid #30363d'),
                            padding: '4px 6px',
                            cursor: isFuture ? 'default' : 'pointer',
                            opacity: isFuture ? 0.45 : 1,
                            pointerEvents: isFuture ? 'none' : 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.15s ease',
                            boxShadow: isSelected ? '0 0 12px rgba(86, 227, 109, 0.35)' : 'none'
                          }}
                          title={isFuture ? `${cell.formattedDate} (Upcoming)` : `${cell.formattedDate}: ₹${cell.earnings} (${cell.count} completed)`}
                        >
                          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: cell.isToday ? '#4ade80' : (isFuture ? '#64748b' : '#c9d1d9') }}>
                              {cell.dayNum}
                            </span>
                            {cell.isToday && (
                              <span style={{ fontSize: '0.62rem', fontWeight: 800, background: '#238636', color: '#fff', borderRadius: '4px', padding: '0 3px' }}>
                                Today
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.76rem', fontWeight: 800, color: !isFuture && cell.earnings > 0 ? '#4ade80' : '#64748b' }}>
                            {!isFuture && cell.earnings > 0 ? `₹${cell.earnings}` : '—'}
                          </div>
                          <div style={{ fontSize: '0.64rem', color: isFuture ? '#64748b' : (cell.count > 0 ? '#86efac' : '#64748b'), fontWeight: 600 }}>
                            {isFuture ? 'Upcoming' : (cell.count > 0 ? `${cell.count} visit${cell.count === 1 ? '' : 's'}` : '0 visits')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SELECTED DAY DETAIL DRAWER / POPUP */}
              {selectedHeatmapCell && (() => {
                const dayData = dailyEarningsMap[selectedHeatmapCell.dateStr] || { count: 0, earnings: 0, patients: [] };
                const displayEarnings = dayData.earnings;
                const displayCount = dayData.count;
                const displayPatients = dayData.patients;
                const isCellToday = selectedHeatmapCell.dateStr === todayDateStr;

                return (
                  <div style={{
                    position: 'relative',
                    background: '#f0fdf4',
                    border: '1.5px solid #86efac',
                    borderRadius: '12px',
                    padding: '12px 42px 12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    animation: 'fadeIn 0.2s ease',
                    color: '#0f172a'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803d', fontWeight: 800, fontSize: '0.92rem' }}>
                        {selectedHeatmapCell.dayNum}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{selectedHeatmapCell.formattedDate}</span>
                          {isCellToday && (
                            <span style={{ fontSize: '0.68rem', background: '#16a34a', color: '#fff', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                              Today
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#166534', marginTop: '2px' }}>
                          Total Revenue: <strong>₹{displayEarnings.toLocaleString('en-IN')}</strong>
                        </div>
                      </div>
                    </div>

                    {displayPatients.length > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.76rem', color: '#14532d', fontWeight: 600 }}>Patients:</span>
                        {displayPatients.map((p, pIdx) => (
                          <span
                            key={pIdx}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #86efac',
                              padding: '3px 9px',
                              borderRadius: '6px',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              color: '#15803d',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            <span>{p.name}</span>
                            <span style={{ color: '#64748b', fontWeight: 500 }}>({p.time})</span>
                            <span
                              style={{
                                background: '#dcfce7',
                                color: '#15803d',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontWeight: 700,
                                fontSize: '0.72rem'
                              }}
                            >
                              ₹{Number(p.fee || consultationFee).toLocaleString('en-IN')}
                            </span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.76rem', color: '#64748b', fontStyle: 'italic' }}>
                        No completed patient consultations recorded on this date.
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedHeatmapCell(null)}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: '#ffffff',
                        border: '1px solid #bbf7d0',
                        color: '#64748b',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '6px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#ef4444';
                        e.currentTarget.style.borderColor = '#fca5a5';
                        e.currentTarget.style.background = '#fef2f2';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#64748b';
                        e.currentTarget.style.borderColor = '#bbf7d0';
                        e.currentTarget.style.background = '#ffffff';
                      }}
                      title="Close details"
                    >
                      <X size={15} />
                    </button>
                  </div>
                );
              })()}

              {/* Heatmap Footer & Legend */}
              <div className={styles.heatmapFooter}>
                <span style={{ color: '#64748b' }}>
                  Tip: Hover or click any block to view day-specific completed patient earnings. Cells update live as consultations are marked Completed.
                </span>

                <div className={styles.heatmapLegend}>
                  <span>Earnings:</span>
                  <span>₹0</span>
                  <div className={styles.legendBox} style={{ background: '#ebedf0', border: '1px solid #e2e8f0' }} title="₹0 (No completed patients)" />
                  <div className={styles.legendBox} style={{ background: '#9be9a8' }} title={`₹${consultationFee} (1 patient)`} />
                  <div className={styles.legendBox} style={{ background: '#40c463' }} title={`₹${consultationFee * 2} (2 patients)`} />
                  <div className={styles.legendBox} style={{ background: '#30a14e' }} title={`₹${consultationFee * 4} (3-4 patients)`} />
                  <div className={styles.legendBox} style={{ background: '#216e39' }} title={`₹${consultationFee * 5}+ (Peak day)`} />
                  <span>₹{consultationFee * 5}+</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Tabs Bar */}
        <div className={styles.tabsBar}>
          <div className={styles.tabsList}>
            <button
              className={`${styles.tabBtn} ${activeTab === 'appointments' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('appointments')}
            >
              <Calendar size={18} />
              <span>Appointments Queue ({appointments.length})</span>
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'prescriptions' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('prescriptions')}
            >
              <FileText size={18} />
              <span>Prescriptions & Notes ({prescriptions.length})</span>
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'profile' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <User size={18} />
              <span>Profile & Schedule Settings</span>
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'reviews' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              <MessageSquare size={18} />
              <span>Patient Reviews ({doctorVerifiedReviews.length})</span>
            </button>
          </div>

          {activeTab === 'appointments' && (
            <button
              className={styles.addPrimaryBtn}
              onClick={() => setIsNewAppointmentModalOpen(true)}
            >
              <Plus size={16} /> Schedule Patient
            </button>
          )}

          {activeTab === 'prescriptions' && (
            <button
              className={styles.addPrimaryBtn}
              onClick={() => setIsPrescriptionModalOpen(true)}
            >
              <Plus size={16} /> Write Prescription
            </button>
          )}
        </div>

        {/* TAB 1: APPOINTMENTS */}
        {activeTab === 'appointments' && (
          <div className={styles.tabContentArea}>
            <div className={styles.filterRow}>
              <div className={styles.filterPills}>
                <button
                  className={`${styles.pill} ${appointmentFilter === 'all' ? styles.pillActive : ''}`}
                  onClick={() => setAppointmentFilter('all')}
                >
                  All ({appointments.length})
                </button>
                <button
                  className={`${styles.pill} ${appointmentFilter === 'today' ? styles.pillActive : ''}`}
                  onClick={() => setAppointmentFilter('today')}
                >
                  Today
                </button>
                <button
                  className={`${styles.pill} ${appointmentFilter === 'confirmed' ? styles.pillActive : ''}`}
                  onClick={() => setAppointmentFilter('confirmed')}
                >
                  Upcoming / Confirmed
                </button>
                <button
                  className={`${styles.pill} ${appointmentFilter === 'completed' ? styles.pillActive : ''}`}
                  onClick={() => setAppointmentFilter('completed')}
                >
                  Completed
                </button>
              </div>
            </div>

            <div className={styles.appointmentsList}>
              {filteredAppointments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                  <Calendar size={36} color="#94a3b8" style={{ marginBottom: '10px' }} />
                  <h4 style={{ margin: '0 0 6px', color: '#1e293b', fontSize: '1rem', fontWeight: 700 }}>No Appointments in Queue</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>
                    {appointmentFilter === 'all'
                      ? 'No patient appointments booked yet. Real-time patient bookings will appear here automatically.'
                      : `No ${appointmentFilter} appointments found in the queue.`}
                  </p>
                </div>
              ) : (
                filteredAppointments.map((apt) => (
                <div key={apt.id} className={styles.appointmentCard}>
                  <div className={styles.aptTimeCol}>
                    <Clock size={16} className={styles.timeIcon} />
                    <span className={styles.aptTime}>{apt.time}</span>
                    <span className={styles.aptDate}>{apt.date}</span>
                    <span className={apt.type === 'Video Call' ? styles.videoBadge : styles.clinicBadge}>
                      {apt.type === 'Video Call' ? <Video size={12} /> : <User size={12} />}
                      {apt.type}
                    </span>
                  </div>

                  <div className={styles.aptDetailsCol}>
                    <div className={styles.aptPatientHeader}>
                      <h4>
                        {apt.patientName}
                        {apt.isRealtime && (
                          <span style={{ marginLeft: '8px', fontSize: '0.7rem', background: '#dcfce7', color: '#166534', padding: '2px 7px', borderRadius: '6px', fontWeight: '700', letterSpacing: '0.02em', border: '1px solid #bbf7d0', verticalAlign: 'middle' }}>
                            ● Online Patient
                          </span>
                        )}
                      </h4>
                      <span className={styles.aptPatientDemog}>
                        {apt.gender}, {apt.age} yrs • {apt.phone}
                      </span>
                    </div>
                    <p className={styles.aptSymptoms}>
                      <strong>Reason for Visit:</strong> {apt.symptoms}
                    </p>
                  </div>

                  <div className={styles.aptStatusCol}>
                    <span
                      className={`${styles.statusBadge} ${
                        apt.status === 'Completed'
                          ? styles.statusBadgeCompleted
                          : apt.status === 'In-Progress'
                          ? styles.statusBadgeProgress
                          : styles.statusBadgeConfirmed
                      }`}
                    >
                      {apt.status}
                    </span>

                    <div className={styles.aptActionBtns}>
                      {apt.status !== 'Completed' ? (
                        <button
                          className={styles.completeBtn}
                          onClick={() => updateAppointmentStatus(apt.id, 'Completed')}
                          title="Mark Completed"
                        >
                          <Check size={14} /> Completed
                        </button>
                      ) : (
                        <button
                          className={styles.completeBtn}
                          style={{ background: '#fef3c7', color: '#b45309', borderColor: '#fde68a' }}
                          onClick={() => updateAppointmentStatus(apt.id, 'Confirmed')}
                          title="Reopen appointment"
                        >
                          <RotateCcw size={13} /> Reopen
                        </button>
                      )}
                      {apt.type === 'Video Call' && apt.status !== 'Completed' && (
                        <button
                          className={styles.joinCallBtn}
                          onClick={() => showToast(`Starting teleconsultation call with ${apt.patientName}...`)}
                        >
                          <Video size={14} /> Start Call
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteAppointment(apt.id)}
                        style={{
                          background: 'transparent',
                          border: '1px solid #fecdd3',
                          color: '#e11d48',
                          borderRadius: '7px',
                          padding: '5px 8px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.76rem',
                          fontWeight: 600
                        }}
                        title="Delete appointment"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              )))}
            </div>
          </div>
        )}

        {/* TAB 2: PRESCRIPTIONS */}
        {activeTab === 'prescriptions' && (
          <div className={styles.tabContentArea}>
            <div className={styles.rxGrid}>
              {prescriptions.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px 20px', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                  <FileText size={36} color="#94a3b8" style={{ marginBottom: '10px' }} />
                  <h4 style={{ margin: '0 0 6px', color: '#1e293b', fontSize: '1rem', fontWeight: 700 }}>No Prescriptions Issued</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>
                    Click "Write New Prescription" above to write and issue a patient prescription.
                  </p>
                </div>
              ) : (
                prescriptions.map((rx) => (
                <div key={rx.id} className={styles.rxCard}>
                  <div className={styles.rxHeader}>
                    <div>
                      <h4>{rx.patientName}</h4>
                      <span className={styles.rxDate}>{rx.date}</span>
                    </div>
                    <span className={styles.rxBadge}>Rx Note</span>
                  </div>

                  <div className={styles.rxBody}>
                    <div className={styles.rxRow}>
                      <span className={styles.rxLabel}>Diagnosis:</span>
                      <span className={styles.rxValue}>{rx.diagnosis}</span>
                    </div>
                    <div className={styles.rxRow}>
                      <span className={styles.rxLabel}>Prescription:</span>
                      <span className={styles.rxValueText}>{rx.medications}</span>
                    </div>
                    <div className={styles.rxRow}>
                      <span className={styles.rxLabel}>Follow-up:</span>
                      <span className={styles.rxValue}>{rx.followUp}</span>
                    </div>
                  </div>

                  <div className={styles.rxFooter}>
                    <small>Prescribed by {activeDoctor.name || 'Doctor'}</small>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        className={styles.printBtn}
                        onClick={() => setSelectedRxForPrint(rx)}
                        title="Print or export PDF prescription"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Printer size={13} />
                        Export PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePrescription(rx.id)}
                        style={{
                          background: '#fff1f2',
                          border: '1px solid #fecdd3',
                          color: '#e11d48',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                        title="Delete prescription note"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              )))}
            </div>
          </div>
        )}

        {/* TAB 3: PROFILE & CLINIC SETTINGS */}
        {activeTab === 'profile' && (
          <div className={styles.tabContentArea}>
            <div className={styles.settingsCard}>
              {/* TOP HEADER & ACTION BAR */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 800 }}>
                    Doctor Profile & Clinic Information
                  </h3>
                  <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                    Change, modify, or delete your credentials, clinical timeline, video media, fees, and hospital details shown to patients on The Sehat Buddy.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {/* View Live Profile */}
                  <button
                    type="button"
                    onClick={handleViewLiveProfile}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: '1px solid #0284c7',
                      background: '#f0f9ff',
                      color: '#0284c7',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                    title="Preview how patients see your profile on the Doctor page"
                  >
                    <Eye size={15} />
                    <span>View Live Page</span>
                  </button>

                  {/* Save Settings */}
                  <button
                    type="button"
                    onClick={handleSaveAllProfileSettings}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'var(--color-primary, #2563eb)',
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(37,99,235,0.2)'
                    }}
                  >
                    <Check size={15} />
                    <span>Save All Changes</span>
                  </button>
                </div>
              </div>

              {/* SECTION: PROFILE PHOTO MANAGEMENT */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', marginBottom: '22px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.98rem', color: '#0f172a', fontWeight: 700 }}>Profile Photo</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative' }}>
                    <img 
                      src={profileForm.image} 
                      alt="Doctor Photo" 
                      onClick={() => setIsPhotoZoomOpen(true)}
                      title="Click to zoom preview"
                      style={{ width: '76px', height: '76px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #2563eb', cursor: 'pointer', transition: 'transform 0.2s' }} 
                      onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80'}
                    />
                    {isUploadingImage && (
                      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <label style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        background: '#2563eb',
                        color: '#ffffff',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        cursor: isUploadingImage ? 'not-allowed' : 'pointer',
                        boxShadow: '0 2px 6px rgba(37,99,235,0.15)'
                      }}>
                        <Upload size={14} />
                        <span>{isUploadingImage ? 'Uploading...' : 'Upload New Photo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploadingImage}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleDoctorPhotoUpload(file);
                          }}
                          style={{ display: 'none' }}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          borderRadius: '8px',
                          border: '1px solid #fca5a5',
                          background: '#fff1f2',
                          color: '#e11d48',
                          fontSize: '0.84rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                        title="Delete current photo and revert to default avatar"
                      >
                        <Trash2 size={14} />
                        <span>Delete Photo</span>
                      </button>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Recommended format: Square JPG or PNG. Stored permanently in Cloudinary.
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION: BASIC CLINICAL & CONSULTATION DETAILS */}
              <form
                onSubmit={handleSaveAllProfileSettings}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveAllProfileSettings(e);
                  }
                }}
                className={styles.settingsGrid}
              >
                <div className={styles.formGroup}>
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={profileForm.name || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    onBlur={handleSaveAllProfileSettings}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Specialty / Department</label>
                  <input
                    type="text"
                    value={profileForm.specialty || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, specialty: e.target.value })}
                    onBlur={handleSaveAllProfileSettings}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Job Title / Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior consultant"
                    value={profileForm.jobTitle !== undefined ? profileForm.jobTitle : 'Senior consultant'}
                    onChange={(e) => setProfileForm({ ...profileForm, jobTitle: e.target.value })}
                    onBlur={handleSaveAllProfileSettings}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Experience (Years)</label>
                  <input
                    type="number"
                    value={profileForm.experience ?? ''}
                    onChange={(e) => setProfileForm({ ...profileForm, experience: e.target.value === '' ? '' : Number(e.target.value) })}
                    onBlur={handleSaveAllProfileSettings}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Hospital Affiliation</label>
                  <input
                    type="text"
                    value={profileForm.hospital || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, hospital: e.target.value })}
                    onBlur={handleSaveAllProfileSettings}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Degrees / Qualifications</label>
                  <input
                    type="text"
                    value={profileForm.degree || profileForm.qualifications || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, degree: e.target.value, qualifications: e.target.value })}
                    onBlur={handleSaveAllProfileSettings}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Consultation Fee (₹)</label>
                  <input
                    type="number"
                    value={profileForm.price ?? profileForm.fees ?? ''}
                    onChange={(e) => setProfileForm({ ...profileForm, price: e.target.value === '' ? '' : Number(e.target.value) })}
                    onBlur={handleSaveAllProfileSettings}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Contact Phone</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="Enter 10-digit phone number"
                    value={profileForm.phone || ''}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setProfileForm({ ...profileForm, phone: digits });
                    }}
                    onBlur={handleSaveAllProfileSettings}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={16} color="#2563eb" />
                    Medical Registration / License No.
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DMC-2009-44182 or MCI-48291"
                    value={profileForm.licenseNumber || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, licenseNumber: e.target.value })}
                    onBlur={handleSaveAllProfileSettings}
                  />
                </div>

                <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                  <label>Available Consultation Hours</label>
                  <input
                    type="text"
                    value={profileForm.availableDays || ''}
                    onFocus={() => {
                      isEditingAvailableDaysRef.current = true;
                    }}
                    onChange={(e) => {
                      isEditingAvailableDaysRef.current = true;
                      setProfileForm({ ...profileForm, availableDays: e.target.value });
                    }}
                    onBlur={(e) => {
                      isEditingAvailableDaysRef.current = false;
                      handleSaveAllProfileSettings(e);
                    }}
                    style={{
                      fontVariantNumeric: 'tabular-nums',
                      fontFeatureSettings: '"tnum"',
                    }}
                  />
                </div>
              </form>

              {/* SECTION: CLINICAL FOCUS, PROCEDURES & QUALIFICATION BADGES */}
              <div style={{
                marginTop: '26px',
                border: '1.5px solid #bfdbfe',
                background: '#ffffff',
                borderRadius: '12px',
                padding: '22px 24px',
                boxShadow: '0 2px 8px rgba(37,99,235,0.06)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#1e3a8a', fontSize: '1.05rem', fontWeight: 800 }}>
                      <Award size={20} color="#2563eb" />
                      Clinical Focus, Procedures & Qualification Badges
                      <span style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        background: '#dbeafe',
                        color: '#1d4ed8',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        marginLeft: '6px'
                      }}>
                        {Array.isArray(profileForm.tags) ? profileForm.tags.length : 0} Badges
                      </span>
                    </h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                      These badges appear under your doctor name on your public profile in real-time (e.g. MBBS, Interventional Cardiologist, Angioplasty Specialist). Add or remove badges as needed.
                    </p>
                  </div>
                </div>

                {/* Badges Chips List */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  minHeight: '48px',
                  marginBottom: '16px',
                  background: '#f8fafc',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px dashed #cbd5e1'
                }}>
                  {Array.isArray(profileForm.tags) && profileForm.tags.length > 0 ? (
                    profileForm.tags.map((tag, tIdx) => (
                      <div
                        key={`tag-${tIdx}-${tag}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: '#eff6ff',
                          border: '1.5px solid #93c5fd',
                          borderRadius: '9999px',
                          padding: '5px 12px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          color: '#1e40af',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                        }}
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          title={`Remove badge "${tag}"`}
                          style={{
                            background: '#fee2e2',
                            border: 'none',
                            color: '#ef4444',
                            borderRadius: '50%',
                            width: '18px',
                            height: '18px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            padding: 0
                          }}
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: '#94a3b8', fontSize: '0.84rem', fontStyle: 'italic', padding: '6px 0' }}>
                      No badges added yet. Type a badge name below to add one.
                    </div>
                  )}
                </div>

                {/* Add Custom Badge Form */}
                <form
                  onSubmit={handleAddTag}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}
                >
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    placeholder="Type badge text (e.g. Angioplasty Specialist, Echocardiography, MBBS)..."
                    style={{
                      flex: '1 1 280px',
                      padding: '9px 14px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.88rem',
                      outline: 'none',
                      background: '#ffffff'
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '9px 18px',
                      borderRadius: '8px',
                      background: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(37,99,235,0.2)'
                    }}
                  >
                    <Plus size={15} />
                    Add Badge
                  </button>
                </form>

                {/* Quick Add Suggestions */}
                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>Quick add:</span>
                  {[
                    'MBBS',
                    'MD - Medicine',
                    'Interventional Cardiologist',
                    'Angioplasty Specialist',
                    'Echocardiography',
                    'Heart Failure Care',
                    'Preventive Cardiology',
                    'Chest Pain Specialist',
                    'Consultant Physician'
                  ].filter(sug => !Array.isArray(profileForm.tags) || !profileForm.tags.includes(sug))
                   .slice(0, 5)
                   .map((sug, sIdx) => (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => {
                        const current = Array.isArray(profileForm.tags) ? profileForm.tags : getDefaultDoctorTags(activeDoctor);
                        if (!current.includes(sug)) {
                          const updated = [...current, sug];
                          setProfileForm(prev => ({ ...prev, tags: updated }));
                          updateDoctor(activeDoctor.id || activeDoctor._id, { tags: updated });
                          showToast(`Added badge: "${sug}"`);
                        }
                      }}
                      style={{
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '3px 8px',
                        fontSize: '0.76rem',
                        color: '#334155',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION: APPOINTMENT DATES & TIME SLOTS MANAGEMENT */}
              <div style={{
                marginTop: '28px',
                border: '1.5px solid #bfdbfe',
                background: '#ffffff',
                borderRadius: '12px',
                padding: '22px 24px',
                boxShadow: '0 2px 8px rgba(37,99,235,0.06)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#1e3a8a', fontSize: '1.05rem', fontWeight: 800 }}>
                      <Calendar size={20} color="#2563eb" />
                      Appointment Dates & Booking Time Slots
                    </h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                      Configure your clinic working days and time slots. These are displayed live to patients on your Doctor Booking page.
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      disabled={isSavingSchedule}
                      onClick={handleSaveSchedule}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(37,99,235,0.25)'
                      }}
                    >
                      {isSavingSchedule ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
                      <span>Save Schedule & Slots</span>
                    </button>
                  </div>
                </div>

                {/* UNIFIED SCHEDULE SELECTOR: BASELINE | 7 DAY BUTTONS | DATE OVERRIDE */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', marginBottom: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CalendarDays size={18} color="#2563eb" />
                      <span>Select Day to View & Customize Slots:</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setSlotConfigMode('all')}
                        style={{
                          padding: '7px 12px',
                          borderRadius: '8px',
                          border: slotConfigMode === 'all' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                          background: slotConfigMode === 'all' ? '#eff6ff' : '#ffffff',
                          color: slotConfigMode === 'all' ? '#1d4ed8' : '#475569',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Clock size={14} color={slotConfigMode === 'all' ? '#2563eb' : '#64748b'} />
                        <span>🌐 Baseline (All Days)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSlotConfigMode('date')}
                        style={{
                          padding: '7px 12px',
                          borderRadius: '8px',
                          border: slotConfigMode === 'date' ? '2px solid #d97706' : '1px solid #cbd5e1',
                          background: slotConfigMode === 'date' ? '#fffbeb' : '#ffffff',
                          color: slotConfigMode === 'date' ? '#b45309' : '#475569',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Calendar size={14} color={slotConfigMode === 'date' ? '#d97706' : '#64748b'} />
                        <span>📅 Specific Date Override</span>
                        {Object.keys(profileForm.dateWiseSlots || {}).length > 0 && (
                          <span style={{ background: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: '8px', fontSize: '0.68rem', fontWeight: 800 }}>
                            {Object.keys(profileForm.dateWiseSlots || {}).length}
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setSlotConfigMode('leave')}
                        style={{
                          padding: '7px 12px',
                          borderRadius: '8px',
                          border: slotConfigMode === 'leave' ? '2px solid #ef4444' : '1px solid #cbd5e1',
                          background: slotConfigMode === 'leave' ? '#fff1f2' : '#ffffff',
                          color: slotConfigMode === 'leave' ? '#b91c1c' : '#475569',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <AlertTriangle size={14} color={slotConfigMode === 'leave' ? '#ef4444' : '#64748b'} />
                        <span>🏖️ Mark Days Off & Leave</span>
                        {(DAYS_LIST.filter(d => isDayOff(d)).length > 0 || Object.values(profileForm.dateWiseSlots || {}).filter(v => v === 'off' || v?.isOff === true).length > 0) && (
                          <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '1px 7px', borderRadius: '10px', fontSize: '0.68rem', fontWeight: 800 }}>
                            {DAYS_LIST.filter(d => isDayOff(d)).length + Object.values(profileForm.dateWiseSlots || {}).filter(v => v === 'off' || v?.isOff === true).length} off
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 7 Day Tabs: Mon, Tue, Wed, Thu, Fri, Sat, Sun */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(115px, 1fr))', gap: '8px' }}>
                    {DAYS_LIST.map(dayKey => {
                      const isSelected = slotConfigMode === 'day' && selectedScheduleDay === dayKey;
                      const dayConfig = profileForm.dayWiseSlots?.[dayKey];
                      const isDayOffVal = isDayOff(dayKey);
                      const hasCustomSlots = !isDayOffVal && (Array.isArray(dayConfig) || Array.isArray(dayConfig?.slots));
                      const slotCount = isDayOffVal
                        ? 0
                        : (hasCustomSlots 
                            ? (Array.isArray(dayConfig) ? dayConfig.length : dayConfig.slots.length) 
                            : (profileForm.availableSlots?.length || 0));

                      return (
                        <button
                          key={dayKey}
                          type="button"
                          onClick={() => selectDayForSlots(dayKey)}
                          style={{
                            padding: '10px 8px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            border: isSelected 
                              ? '2px solid #2563eb' 
                              : (isDayOffVal ? '1.5px solid #f87171' : (hasCustomSlots ? '1.5px solid #93c5fd' : '1px solid #e2e8f0')),
                            background: isSelected 
                              ? '#eff6ff' 
                              : (isDayOffVal ? '#fff1f2' : (hasCustomSlots ? '#f8faff' : '#ffffff')),
                            color: isSelected ? '#1d4ed8' : '#1e293b',
                            boxShadow: isSelected ? '0 3px 8px rgba(37,99,235,0.18)' : '0 1px 2px rgba(0,0,0,0.02)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.86rem' }}>
                              {DAY_NAME_MAP[dayKey] || dayKey}
                            </span>
                          </div>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '6px',
                            background: isDayOffVal ? '#fee2e2' : (hasCustomSlots ? '#dbeafe' : '#f1f5f9'),
                            color: isDayOffVal ? '#b91c1c' : (hasCustomSlots ? '#1d4ed8' : '#64748b')
                          }}>
                            {isDayOffVal ? 'Closed / Off' : (hasCustomSlots ? `⚡ ${slotCount} custom` : `${slotCount} slots`)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* MODE 1: ALL WORKING DAYS */}
                {slotConfigMode === 'all' && (
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                      <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                        Active Working Days & Quick Day-Slot Selection:
                      </label>
                      <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                        Click any day below to configure its slots specifically
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                      {DAYS_LIST.map(day => {
                        const currentDays = Array.isArray(profileForm.scheduleDays) ? profileForm.scheduleDays : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                        const dayConfig = profileForm.dayWiseSlots?.[day];
                        const isOff = dayConfig === 'off' || dayConfig?.isOff === true || (!currentDays.includes(day) && dayConfig === undefined);
                        const hasCustom = Array.isArray(dayConfig) || Array.isArray(dayConfig?.slots);
                        const count = isOff ? 0 : (hasCustom ? (Array.isArray(dayConfig) ? dayConfig.length : dayConfig.slots.length) : (profileForm.availableSlots?.length || 0));

                        return (
                          <div
                            key={day}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: !isOff ? '1.5px solid #bfdbfe' : '1px solid #e2e8f0',
                              background: !isOff ? '#ffffff' : '#f8fafc',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => handleToggleScheduleDay(day)}
                              title={!isOff ? 'Click to mark day Closed' : 'Click to mark day Open'}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                                fontWeight: 700,
                                fontSize: '0.82rem',
                                color: !isOff ? '#1e3a8a' : '#94a3b8'
                              }}
                            >
                              {!isOff ? <Check size={16} color="#2563eb" /> : <X size={16} color="#94a3b8" />}
                              <span>{DAY_NAME_MAP[day]}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => selectDayForSlots(day)}
                              title={`Configure slots specifically for ${DAY_NAME_MAP[day]}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: hasCustom ? '#dbeafe' : (!isOff ? '#eff6ff' : '#f1f5f9'),
                                color: hasCustom ? '#1d4ed8' : (!isOff ? '#2563eb' : '#64748b'),
                                border: 'none',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              <span>{isOff ? 'Closed' : `${count} slots`}</span>
                              <span>⚙️</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ marginTop: '10px', fontSize: '0.76rem', color: '#64748b' }}>
                      💡 These baseline slots apply to all active days. Click on any specific day (e.g. <strong>Monday</strong>) above or beside to set custom morning/evening timings for that day.
                    </div>
                  </div>
                )}

                {/* MODE 2: DAY-WISE (WEEKLY) SELECTOR */}
                {slotConfigMode === 'day' && (
                  <div style={{ background: '#f8fafc', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 800, color: '#1e3a8a', margin: 0 }}>
                          🗓️ {DAY_NAME_MAP[selectedScheduleDay] || selectedScheduleDay}'s Consultation Schedule
                        </label>
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          Set custom morning/evening slots for {DAY_NAME_MAP[selectedScheduleDay]}s or mark it as doctor off day.
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSlotConfigMode('all')}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          color: '#475569',
                          padding: '5px 10px',
                          borderRadius: '6px',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <span>← Back to General Baseline</span>
                      </button>
                    </div>

                    {/* Day selector pills */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                      {DAYS_LIST.map(dayKey => {
                        const isSelected = selectedScheduleDay === dayKey;
                        const dayConfig = profileForm.dayWiseSlots?.[dayKey];
                        const isOff = isDayOff(dayKey);
                        const hasCustomSlots = !isOff && (Array.isArray(dayConfig) || Array.isArray(dayConfig?.slots));
                        const slotCount = isOff 
                          ? 0 
                          : (hasCustomSlots 
                              ? (Array.isArray(dayConfig) ? dayConfig.length : dayConfig.slots.length) 
                              : (profileForm.availableSlots?.length || 0));

                        return (
                          <button
                            key={dayKey}
                            type="button"
                            onClick={() => setSelectedScheduleDay(dayKey)}
                            style={{
                              flex: '1 1 100px',
                              padding: '10px 12px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              border: isSelected ? '2px solid #2563eb' : (isOff ? '1px dashed #fca5a5' : '1px solid #cbd5e1'),
                              background: isSelected ? '#ffffff' : (isOff ? '#fff1f2' : (hasCustomSlots ? '#eff6ff' : '#ffffff')),
                              color: isSelected ? '#1e40af' : '#334155',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '4px',
                              boxShadow: isSelected ? '0 2px 6px rgba(37,99,235,0.2)' : 'none',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span style={{ fontWeight: 800, fontSize: '0.86rem' }}>{DAY_NAME_MAP[dayKey] || dayKey}</span>
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: isOff ? '#fee2e2' : (hasCustomSlots ? '#dbeafe' : '#f1f5f9'),
                              color: isOff ? '#b91c1c' : (hasCustomSlots ? '#1d4ed8' : '#64748b')
                            }}>
                              {isOff ? 'Closed / Off' : (hasCustomSlots ? `${slotCount} Custom` : `General (${slotCount})`)}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Selected Day Toolbar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>
                          🗓️ {DAY_NAME_MAP[selectedScheduleDay] || selectedScheduleDay}'s Status:
                        </span>
                        <span style={{
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: isDayOff(selectedScheduleDay) ? '#fee2e2' : (Array.isArray(profileForm.dayWiseSlots?.[selectedScheduleDay]) ? '#dbeafe' : '#f1f5f9'),
                          color: isDayOff(selectedScheduleDay) ? '#b91c1c' : (Array.isArray(profileForm.dayWiseSlots?.[selectedScheduleDay]) ? '#1d4ed8' : '#475569')
                        }}>
                          {isDayOff(selectedScheduleDay)
                            ? 'Marked OFF / Clinic Closed'
                            : (Array.isArray(profileForm.dayWiseSlots?.[selectedScheduleDay]) ? 'Custom Schedule Active' : 'Using General Default Slots')}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleDayOff(selectedScheduleDay)}
                          style={{
                            background: isDayOff(selectedScheduleDay) ? '#10b981' : '#fee2e2',
                            color: isDayOff(selectedScheduleDay) ? '#ffffff' : '#b91c1c',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {isDayOff(selectedScheduleDay) ? <Check size={12} /> : <X size={12} />}
                          {isDayOff(selectedScheduleDay) ? `Mark ${DAY_NAME_MAP[selectedScheduleDay]} Open` : `Mark ${DAY_NAME_MAP[selectedScheduleDay]} Off / Closed`}
                        </button>

                        <button
                          type="button"
                          onClick={handleCopyDayToAllDays}
                          title="Copy this day's slot schedule to Monday-Sunday"
                          style={{
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Copy size={12} />
                          Copy to All 7 Days
                        </button>

                        {profileForm.dayWiseSlots?.[selectedScheduleDay] !== undefined && (
                          <button
                            type="button"
                            onClick={handleResetDayToDefault}
                            style={{
                              background: '#f8fafc',
                              color: '#64748b',
                              border: '1px solid #cbd5e1',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '0.76rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <RotateCcw size={12} />
                            Reset to General
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* MODE 3: DATE-WISE (SPECIFIC DATES) SELECTOR */}
                {slotConfigMode === 'date' && (
                  <div style={{ background: '#f8fafc', border: '1px solid #fde68a', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#78350f', margin: 0 }}>
                          Select Calendar Date for Special Override or Leave
                        </label>
                        <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                          Override specific dates (e.g. holiday leave, doctor conference, or weekend special consultation slots).
                        </span>
                      </div>
                    </div>

                    {/* Date Picker Input & Quick Date Chips */}
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', border: '1.5px solid #d97706', padding: '6px 12px', borderRadius: '8px' }}>
                        <Calendar size={16} color="#d97706" />
                        <input
                          type="date"
                          value={selectedScheduleDate}
                          min={todayDateStr}
                          onChange={(e) => {
                            if (e.target.value) setSelectedScheduleDate(e.target.value);
                          }}
                          style={{
                            border: 'none',
                            outline: 'none',
                            fontSize: '0.84rem',
                            fontWeight: 700,
                            color: '#1e293b',
                            background: 'transparent',
                            cursor: 'pointer'
                          }}
                        />
                      </div>

                      {/* Quick Chips */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {[
                          { label: 'Today', offset: 0 },
                          { label: 'Tomorrow', offset: 1 },
                          { label: '+2 Days', offset: 2 },
                          { label: '+3 Days', offset: 3 },
                          { label: '+7 Days', offset: 7 }
                        ].map(q => {
                          const targetDate = new Date();
                          targetDate.setDate(targetDate.getDate() + q.offset);
                          const dateStr = getLocalDateString(targetDate);
                          const isPicked = selectedScheduleDate === dateStr;

                          return (
                            <button
                              key={q.offset}
                              type="button"
                              onClick={() => setSelectedScheduleDate(dateStr)}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: isPicked ? '1.5px solid #d97706' : '1px solid #cbd5e1',
                                background: isPicked ? '#fef3c7' : '#ffffff',
                                color: isPicked ? '#92400e' : '#475569',
                                fontWeight: isPicked ? 800 : 600,
                                fontSize: '0.76rem',
                                cursor: 'pointer'
                              }}
                            >
                              {q.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Selected Date Status & Action Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>
                          📅 {new Date(selectedScheduleDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}:
                        </span>
                        <span style={{
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: profileForm.dateWiseSlots?.[selectedScheduleDate] === 'off'
                            ? '#fee2e2'
                            : (profileForm.dateWiseSlots?.[selectedScheduleDate] ? '#fef3c7' : '#f1f5f9'),
                          color: profileForm.dateWiseSlots?.[selectedScheduleDate] === 'off'
                            ? '#b91c1c'
                            : (profileForm.dateWiseSlots?.[selectedScheduleDate] ? '#92400e' : '#475569')
                        }}>
                          {profileForm.dateWiseSlots?.[selectedScheduleDate] === 'off'
                            ? 'Doctor On Leave / Clinic Closed'
                            : (profileForm.dateWiseSlots?.[selectedScheduleDate]
                                ? `Specific Date Override (${Array.isArray(profileForm.dateWiseSlots[selectedScheduleDate]) ? profileForm.dateWiseSlots[selectedScheduleDate].length : 0} slots)`
                                : 'Inheriting Standard Day Schedule')}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={handleToggleDateOff}
                          style={{
                            background: profileForm.dateWiseSlots?.[selectedScheduleDate] === 'off' ? '#10b981' : '#fee2e2',
                            color: profileForm.dateWiseSlots?.[selectedScheduleDate] === 'off' ? '#ffffff' : '#b91c1c',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {profileForm.dateWiseSlots?.[selectedScheduleDate] === 'off' ? <Check size={12} /> : <X size={12} />}
                          {profileForm.dateWiseSlots?.[selectedScheduleDate] === 'off' ? 'Cancel Leave / Re-open Date' : 'Mark Date as Leave / Closed'}
                        </button>

                        {profileForm.dateWiseSlots?.[selectedScheduleDate] !== undefined && (
                          <button
                            type="button"
                            onClick={() => handleResetDateToDaySchedule(selectedScheduleDate)}
                            style={{
                              background: '#f8fafc',
                              color: '#64748b',
                              border: '1px solid #cbd5e1',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '0.76rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <RotateCcw size={12} />
                            Reset to Normal Day Schedule
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Configured Date Overrides Chips */}
                    {Object.keys(profileForm.dateWiseSlots || {}).length > 0 && (
                      <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', padding: '10px 12px' }}>
                        <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#92400e', display: 'block', marginBottom: '6px' }}>
                          ⚡ Configured Date Exceptions & Leaves:
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {Object.entries(profileForm.dateWiseSlots || {}).map(([dKey, dVal]) => {
                            const isOff = dVal === 'off' || dVal?.isOff === true;
                            const count = Array.isArray(dVal) ? dVal.length : (Array.isArray(dVal?.slots) ? dVal.slots.length : 0);
                            const isCurrentlySelected = selectedScheduleDate === dKey;

                            return (
                              <div
                                key={dKey}
                                onClick={() => setSelectedScheduleDate(dKey)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  background: isOff ? '#fee2e2' : '#ffffff',
                                  border: isCurrentlySelected ? '1.5px solid #d97706' : '1px solid #cbd5e1',
                                  color: isOff ? '#b91c1c' : '#1e293b',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                <span>{dKey}</span>
                                <span style={{ opacity: 0.8, fontSize: '0.7rem' }}>
                                  ({isOff ? 'Leave' : `${count} slots`})
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleResetDateToDaySchedule(dKey);
                                  }}
                                  title="Remove override"
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#ef4444',
                                    cursor: 'pointer',
                                    padding: '0 2px',
                                    display: 'inline-flex',
                                    alignItems: 'center'
                                  }}
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* MODE 4: DAYS OFF & PLANNED LEAVES MANAGER */}
                {slotConfigMode === 'leave' && (
                  <div style={{ background: '#f8fafc', border: '1px solid #fecdd3', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
                    {/* Section Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid #fecdd3' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '1.2rem' }}>🏖️</span>
                          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#991b1b' }}>
                            Doctor Days Off & Planned Leaves Manager
                          </h4>
                          <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 800 }}>
                            Live Booking Protection
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                          Mark recurring weekly days off (e.g. Sunday or Weekend), or schedule specific multi-day vacation leaves. When marked off, patients cannot book appointments on those days.
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setSlotConfigMode('day')}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            color: '#334155',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span>← Back to Weekly Slots</span>
                        </button>
                      </div>
                    </div>

                    {/* PART 1: WEEKLY RECURRING DAYS OFF */}
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', marginBottom: '18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                            📅 1. Recurring Weekly Days Off (Fixed Schedule)
                          </label>
                          <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                            Toggle any day of the week to mark it permanently closed or open for consultations.
                          </span>
                        </div>

                        {/* Quick Bulk Presets */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b' }}>Quick Presets:</span>
                          <button
                            type="button"
                            onClick={() => handleApplyWeeklyDaysOffPreset('sunday')}
                            style={{
                              background: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              color: '#334155',
                              cursor: 'pointer'
                            }}
                          >
                            ☀️ Sunday Only Off
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyWeeklyDaysOffPreset('weekend')}
                            style={{
                              background: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              color: '#334155',
                              cursor: 'pointer'
                            }}
                          >
                            🏖️ Weekend Off (Sat + Sun)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyWeeklyDaysOffPreset('all_working')}
                            style={{
                              background: '#ecfdf5',
                              border: '1px solid #a7f3d0',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              color: '#065f46',
                              cursor: 'pointer'
                            }}
                          >
                            💼 All 7 Days Working
                          </button>
                        </div>
                      </div>

                      {/* 7 Days Cards */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                        {DAYS_LIST.map(dayKey => {
                          const off = isDayOff(dayKey);
                          return (
                            <div
                              key={dayKey}
                              style={{
                                background: off ? '#fff1f2' : '#f0fdf4',
                                border: off ? '1.5px solid #fca5a5' : '1.5px solid #86efac',
                                borderRadius: '8px',
                                padding: '12px 10px',
                                textAlign: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <div style={{ fontWeight: 800, fontSize: '0.88rem', color: off ? '#991b1b' : '#166534' }}>
                                {DAY_NAME_MAP[dayKey] || dayKey}
                              </div>

                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: '12px',
                                background: off ? '#fee2e2' : '#dcfce7',
                                color: off ? '#991b1b' : '#15803d'
                              }}>
                                {off ? '🔴 Closed / Day Off' : '🟢 Open / Working'}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleToggleDayOff(dayKey)}
                                style={{
                                  width: '100%',
                                  marginTop: '4px',
                                  background: off ? '#10b981' : '#fee2e2',
                                  color: off ? '#ffffff' : '#b91c1c',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '5px 8px',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '4px'
                                }}
                              >
                                {off ? <Check size={12} /> : <X size={12} />}
                                {off ? 'Mark Working' : 'Mark Day Off'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* PART 2: MULTI-DAY VACATION / DATE RANGE LEAVE PLANNER */}
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', marginBottom: '18px' }}>
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                          ✈️ 2. Schedule Specific Dates Off / Vacation Leave (Single or Multi-Day)
                        </label>
                        <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                          Going on a vacation, attending a conference, or taking personal leave? Select start and end dates to block slots automatically.
                        </span>
                      </div>

                      <form onSubmit={handleApplyDateRangeLeave} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'flex-end', background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                            From (Start Date):
                          </label>
                          <input
                            type="date"
                            value={leaveStartDate}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => setLeaveStartDate(e.target.value)}
                            style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 600, background: '#ffffff' }}
                            required
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                            To (End Date):
                          </label>
                          <input
                            type="date"
                            value={leaveEndDate}
                            min={leaveStartDate || new Date().toISOString().split('T')[0]}
                            onChange={(e) => setLeaveEndDate(e.target.value)}
                            style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 600, background: '#ffffff' }}
                            required
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                            Leave Reason / Note (Optional):
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Vacation, Medical Conference"
                            value={leaveNote}
                            onChange={(e) => setLeaveNote(e.target.value)}
                            style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#ffffff' }}
                          />
                        </div>

                        <div>
                          <button
                            type="submit"
                            style={{
                              width: '100%',
                              background: '#dc2626',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '8px 14px',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              boxShadow: '0 2px 4px rgba(220,38,38,0.2)'
                            }}
                          >
                            <CalendarDays size={14} />
                            <span>Mark Doctor On Leave</span>
                          </button>
                        </div>
                      </form>

                      {/* Quick helper buttons for dates */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', alignSelf: 'center' }}>Quick Fill:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const today = new Date().toISOString().split('T')[0];
                            setLeaveStartDate(today);
                            setLeaveEndDate(today);
                          }}
                          style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '3px 8px', fontSize: '0.72rem', cursor: 'pointer' }}
                        >
                          Today Only
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const tom = new Date();
                            tom.setDate(tom.getDate() + 1);
                            const tomStr = tom.toISOString().split('T')[0];
                            setLeaveStartDate(tomStr);
                            setLeaveEndDate(tomStr);
                          }}
                          style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '3px 8px', fontSize: '0.72rem', cursor: 'pointer' }}
                        >
                          Tomorrow Only
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date();
                            const day = d.getDay();
                            const satDiff = (6 - day + 7) % 7;
                            const sat = new Date(d);
                            sat.setDate(d.getDate() + satDiff);
                            const sun = new Date(sat);
                            sun.setDate(sat.getDate() + 1);
                            setLeaveStartDate(sat.toISOString().split('T')[0]);
                            setLeaveEndDate(sun.toISOString().split('T')[0]);
                          }}
                          style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '3px 8px', fontSize: '0.72rem', cursor: 'pointer' }}
                        >
                          Upcoming Weekend
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const d1 = new Date();
                            const d2 = new Date();
                            d2.setDate(d2.getDate() + 6);
                            setLeaveStartDate(d1.toISOString().split('T')[0]);
                            setLeaveEndDate(d2.toISOString().split('T')[0]);
                          }}
                          style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '3px 8px', fontSize: '0.72rem', cursor: 'pointer' }}
                        >
                          Next 7 Days
                        </button>
                      </div>
                    </div>

                    {/* PART 3: ACTIVE SCHEDULED LEAVES & BLOCKED DATES LIST */}
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                            📋 3. Currently Configured Specific Leaves & Closed Dates
                          </label>
                          <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                            Dates where your clinic is marked closed. Click the red ✕ to cancel leave and reopen appointments.
                          </span>
                        </div>
                      </div>

                      {(() => {
                        const offDates = Object.entries(profileForm.dateWiseSlots || {})
                          .filter(([_, val]) => val === 'off' || val?.isOff === true)
                          .map(([d]) => d)
                          .sort();

                        if (offDates.length === 0) {
                          return (
                            <div style={{ textAlign: 'center', padding: '24px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                              <div style={{ fontSize: '1.2rem', marginBottom: '6px' }}>✨</div>
                              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#334155', marginBottom: '2px' }}>
                                No Date-Specific Leaves Active
                              </div>
                              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                Your clinic is open and accepting appointments on all your active weekly working days.
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
                            {offDates.map(dateStr => {
                              const dObj = new Date(dateStr + 'T00:00:00');
                              const dayName = dObj.toLocaleDateString('en-US', { weekday: 'short' });
                              const formattedDate = dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                              return (
                                <div
                                  key={dateStr}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    background: '#fff1f2',
                                    border: '1px solid #fecdd3',
                                    borderRadius: '8px',
                                    padding: '8px 12px'
                                  }}
                                >
                                  <div>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#991b1b' }}>
                                      {formattedDate} ({dayName})
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: '#b91c1c', fontWeight: 600 }}>
                                      Clinic Closed / On Leave
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveDateOff(dateStr)}
                                    title={`Cancel leave for ${dateStr} and reopen`}
                                    style={{
                                      background: '#fee2e2',
                                      border: '1px solid #fca5a5',
                                      color: '#ef4444',
                                      borderRadius: '6px',
                                      padding: '4px 8px',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                  >
                                    <X size={12} />
                                    <span>Cancel</span>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* SUBSECTION: TIME SLOTS EDITOR FOR ACTIVE MODE */}
                {slotConfigMode !== 'leave' && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.86rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                        <Clock size={15} color="#2563eb" />
                        {slotConfigMode === 'all' && `General Consultation Time Slots (${getCurrentModeSlots().length} configured)`}
                        {slotConfigMode === 'day' && `${DAY_NAME_MAP[selectedScheduleDay] || selectedScheduleDay}'s Consultation Slots (${getCurrentModeSlots().length} configured)`}
                        {slotConfigMode === 'date' && `Consultation Slots for ${selectedScheduleDate} (${getCurrentModeSlots().length} configured)`}
                      </label>
                      <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                        {slotConfigMode === 'all' && 'These baseline time slots apply across all active working days.'}
                        {slotConfigMode === 'day' && `These exact slots will be available when patients book appointments on ${DAY_NAME_MAP[selectedScheduleDay] || selectedScheduleDay}s.`}
                        {slotConfigMode === 'date' && `These slots will specifically override the booking panel for ${selectedScheduleDate}.`}
                      </span>
                    </div>

                    {!isCurrentModeOff() && getCurrentModeSlots().length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllSlots}
                        style={{
                          background: '#fff1f2',
                          border: '1px solid #fecdd3',
                          color: '#e11d48',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Trash2 size={12} />
                        Clear All Slots
                      </button>
                    )}
                  </div>

                  {/* If mode is Off/Closed */}
                  {isCurrentModeOff() ? (
                    <div style={{ background: '#fff1f2', border: '1.5px dashed #f87171', borderRadius: '8px', padding: '16px', textAlign: 'center', margin: '12px 0' }}>
                      <AlertTriangle size={24} color="#ef4444" style={{ marginBottom: '6px' }} />
                      <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#991b1b', marginBottom: '4px' }}>
                        {slotConfigMode === 'day' ? `${DAY_NAME_MAP[selectedScheduleDay] || selectedScheduleDay} is Marked Closed / Off` : `Date ${selectedScheduleDate} is Marked On Leave / Closed`}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#b91c1c', maxWidth: '500px', margin: '0 auto 10px' }}>
                        Patients booking on this {slotConfigMode === 'day' ? 'day' : 'date'} will see "Doctor On Leave / Clinic Closed" and cannot book slots.
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (slotConfigMode === 'day') {
                            handleToggleDayOff(selectedScheduleDay);
                          } else {
                            handleToggleDateOff();
                          }
                        }}
                        style={{
                          background: '#10b981',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 14px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Mark Open & Add Slots
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Active Slots Grid */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '44px', marginBottom: '16px' }}>
                        {getCurrentModeSlots().length > 0 ? (
                          getCurrentModeSlots().map((slot, sIdx) => (
                            <div
                              key={sIdx}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: '#ffffff',
                                border: '1.5px solid #93c5fd',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                color: '#1e3a8a',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                              }}
                            >
                              <Clock size={12} color="#2563eb" />
                              <span>{slot}</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteSlot(slot)}
                                title={`Remove slot ${slot}`}
                                style={{
                                  background: '#fee2e2',
                                  border: 'none',
                                  color: '#ef4444',
                                  borderRadius: '50%',
                                  width: '18px',
                                  height: '18px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  padding: 0
                                }}
                              >
                                <X size={11} />
                              </button>
                            </div>
                          ))
                        ) : (
                          <div style={{ color: '#94a3b8', fontSize: '0.84rem', fontStyle: 'italic', padding: '10px 0' }}>
                            No time slots configured for this {slotConfigMode === 'all' ? 'schedule' : (slotConfigMode === 'day' ? 'day' : 'date')}. Choose a preset below or add custom slots.
                          </div>
                        )}
                      </div>

                      {/* Add Slot Form */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px 14px' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                          Add Slot {slotConfigMode === 'day' ? `(${selectedScheduleDay})` : (slotConfigMode === 'date' ? `(${selectedScheduleDate})` : '')}:
                        </span>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <select
                            value={slotHour}
                            onChange={(e) => setSlotHour(e.target.value)}
                            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 600, background: '#ffffff' }}
                          >
                            {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(h => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                          <span>:</span>
                          <select
                            value={slotMin}
                            onChange={(e) => setSlotMin(e.target.value)}
                            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 600, background: '#ffffff' }}
                          >
                            {['00', '15', '20', '30', '40', '45', '50'].map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                          <select
                            value={slotPeriod}
                            onChange={(e) => setSlotPeriod(e.target.value)}
                            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 600, background: '#ffffff' }}
                          >
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddSlot(`${slotHour}:${slotMin} ${slotPeriod}`)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#0284c7',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 14px',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          <Plus size={14} />
                          Add Slot
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                          <input
                            type="text"
                            placeholder="Or custom (e.g. 06:15 PM)"
                            value={newSlotTime}
                            onChange={(e) => setNewSlotTime(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddSlot(newSlotTime);
                              }
                            }}
                            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', width: '180px' }}
                          />
                          {newSlotTime && (
                            <button
                              type="button"
                              onClick={() => handleAddSlot(newSlotTime)}
                              style={{
                                background: '#10b981',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Add
                            </button>
                          )}
                        </div>
                      </div>

                      {/* One-Click Presets */}
                      <div style={{ marginTop: '14px' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '6px' }}>
                          ⚡ Quick Slot Schedule Presets ({slotConfigMode === 'day' ? DAY_NAME_MAP[selectedScheduleDay] : (slotConfigMode === 'date' ? selectedScheduleDate : 'General')}):
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleApplySlotPreset(['04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'], 'Standard 4 Slots')}
                            style={{
                              background: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              padding: '5px 10px',
                              fontSize: '0.76rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              color: '#334155'
                            }}
                          >
                            Standard 4 Slots (04:00 PM - 05:30 PM)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplySlotPreset(['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM'], 'Morning OPD')}
                            style={{
                              background: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              padding: '5px 10px',
                              fontSize: '0.76rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              color: '#334155'
                            }}
                          >
                            Morning OPD (09:00 AM - 01:00 PM)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplySlotPreset(['04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM'], 'Evening OPD')}
                            style={{
                              background: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              padding: '5px 10px',
                              fontSize: '0.76rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              color: '#334155'
                            }}
                          >
                            Evening OPD (04:00 PM - 08:00 PM)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplySlotPreset([
                              '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
                              '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM'
                            ], 'Full Day OPD')}
                            style={{
                              background: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              padding: '5px 10px',
                              fontSize: '0.76rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              color: '#334155'
                            }}
                          >
                            Full Day OPD (Morning + Evening)
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                )}

                {/* SUBSECTION 3: SLOT DURATION & SUMMARY */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 16px' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                      Slot Duration (Per Patient)
                    </label>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {[15, 20, 30, 45, 60].map(dur => {
                        const isSelected = (profileForm.slotDuration || 20) === dur;
                        return (
                          <button
                            key={dur}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleSlotDurationChange(dur);
                            }}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              border: isSelected ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                              background: isSelected ? '#eff6ff' : '#ffffff',
                              color: isSelected ? '#1d4ed8' : '#475569',
                              fontWeight: isSelected ? 700 : 500,
                              fontSize: '0.78rem',
                              cursor: 'pointer'
                            }}
                          >
                            {dur} mins
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 16px' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                      Consultation Hours Text (Summary)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mon - Sat (10am - 4pm)"
                      value={profileForm.availableDays || ''}
                      onFocus={() => {
                        isEditingAvailableDaysRef.current = true;
                      }}
                      onChange={(e) => {
                        isEditingAvailableDaysRef.current = true;
                        setProfileForm({ ...profileForm, availableDays: e.target.value });
                      }}
                      onBlur={(e) => {
                        isEditingAvailableDaysRef.current = false;
                        handleSaveAllProfileSettings(e);
                      }}
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.82rem',
                        boxSizing: 'border-box',
                        fontVariantNumeric: 'tabular-nums',
                        fontFeatureSettings: '"tnum"',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: ABOUT DOCTOR / PROFESSIONAL BIO */}
              <div style={{
                marginTop: '28px',
                border: '1.5px solid #e2e8f0',
                background: '#ffffff',
                borderRadius: '12px',
                padding: '20px 22px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontSize: '1rem', fontWeight: 700 }}>
                      <FileText size={18} color="#2563eb" />
                      About Doctor / Professional Summary
                    </h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                      This text appears in the "About {activeDoctor.name?.startsWith('Dr.') ? activeDoctor.name : `Dr. ${activeDoctor.name || 'Doctor'}`}" card on your public doctor profile page. You can write multiple paragraphs by pressing Enter twice.
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {profileForm.about && (
                      <button
                        type="button"
                        onClick={() => setProfileForm({ ...profileForm, about: '' })}
                        style={{
                          background: '#fff1f2',
                          border: '1px solid #fecdd3',
                          color: '#e11d48',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          fontWeight: 600,
                          padding: '6px 12px',
                          borderRadius: '6px'
                        }}
                      >
                        Clear Text
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isSavingAbout}
                      onClick={handleSaveAbout}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        padding: '7px 16px',
                        borderRadius: '6px',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: isSavingAbout ? 'not-allowed' : 'pointer',
                        boxShadow: '0 2px 6px rgba(37,99,235,0.2)'
                      }}
                    >
                      {isSavingAbout ? (
                        <>
                          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save size={14} />
                          <span>Save About Section</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div style={{ position: 'relative', marginTop: '12px' }}>
                  <textarea
                    rows={6}
                    placeholder="Write your professional summary, clinical background, specializations, patient care approach, and institutional privileges here..."
                    value={profileForm.about || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, about: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        handleSaveAbout();
                      }
                    }}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.9rem',
                      lineHeight: '1.6',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      color: '#1e293b',
                      background: '#f8fafc',
                      transition: 'border-color 0.2s, background 0.2s'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#2563eb';
                      e.target.style.background = '#ffffff';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#cbd5e1';
                      e.target.style.background = '#f8fafc';
                      handleSaveAbout();
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '0.78rem', color: '#64748b' }}>
                    <span>Tip: Press Enter twice to create new distinct paragraphs on your profile.</span>
                    <span>{(profileForm.about || '').length} characters</span>
                  </div>
                </div>
              </div>

              {/* SECTION: AWARDS & RECOGNITIONS */}
              <div style={{ marginTop: '28px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
                    <Award size={18} color="#2563eb" />
                    Awards & Honors
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      {(profileForm.awards || []).length} Awards
                    </span>
                    {(profileForm.awards || []).length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllAwards}
                        style={{ background: 'none', border: 'none', color: '#e11d48', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Delete All
                      </button>
                    )}
                  </div>
                </div>
                <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '0 0 12px 0' }}>
                  Add national, state, or institutional awards. You can modify any award text or delete it.
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  {(profileForm.awards && profileForm.awards.length > 0) ? (
                    profileForm.awards.map((award, idx) => {
                      const { text: displayTitle, year: displayYear } = parseAwardTextAndYear(award);
                      return (
                        <div
                          key={`award-${idx}-${award}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#fef3c7',
                            color: '#92400e',
                            border: '1px solid #fde68a',
                            padding: '5px 10px',
                            borderRadius: '8px',
                            fontSize: '0.82rem',
                            fontWeight: 600
                          }}
                        >
                          {editingAward.index === idx ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                              <input
                                type="text"
                                value={editingAward.text}
                                onChange={(e) => setEditingAward(prev => ({ ...prev, text: e.target.value }))}
                                placeholder="Award title"
                                style={{ padding: '2px 6px', fontSize: '0.82rem', borderRadius: '4px', border: '1px solid #d97706', outline: 'none', minWidth: '140px' }}
                                autoFocus
                              />
                              <input
                                type="text"
                                value={editingAward.year || ''}
                                onChange={(e) => setEditingAward(prev => ({ ...prev, year: e.target.value }))}
                                placeholder="Year"
                                style={{ padding: '2px 6px', fontSize: '0.82rem', borderRadius: '4px', border: '1px solid #d97706', outline: 'none', width: '65px' }}
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateAward(idx)}
                                style={{ background: '#d97706', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', fontSize: '0.75rem' }}
                                title="Save modification"
                              >
                                <Check size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingAward({ index: null, text: '', year: '' })}
                                style={{ background: '#cbd5e1', color: '#334155', border: 'none', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', fontSize: '0.75rem' }}
                                title="Cancel"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <>
                              <Award size={14} color="#d97706" />
                              <span>{displayTitle || award}</span>
                              {displayYear && (
                                <span style={{
                                  background: '#fffbeb',
                                  color: '#b45309',
                                  border: '1px solid #fcd34d',
                                  borderRadius: '4px',
                                  padding: '1px 6px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700
                                }}>
                                  {displayYear}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleStartEditAward(idx, award)}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#b45309', padding: '0 2px', display: 'flex' }}
                                title="Modify award"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveAward(idx)}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0 2px', display: 'flex' }}
                                title="Delete award"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '0.82rem', fontStyle: 'italic' }}>No awards added yet.</span>
                  )}
                </div>

                <form onSubmit={handleAddAward} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="Award title (e.g. Best Cardiologist, National Medical Excellence Award...)"
                    value={newAwardInput}
                    onChange={(e) => setNewAwardInput(e.target.value)}
                    style={{ flex: '1 1 240px', padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.88rem' }}
                  />
                  <input
                    type="text"
                    placeholder="Year (e.g. 2024)"
                    value={newAwardYear}
                    onChange={(e) => setNewAwardYear(e.target.value)}
                    style={{ width: '130px', padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.88rem' }}
                  />
                  <button
                    type="submit"
                    style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                  >
                    + Add Award
                  </button>
                </form>
              </div>

              {/* SECTION: CERTIFICATIONS & FELLOWSHIPS */}
              <div style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
                    <GraduationCap size={18} color="#2563eb" />
                    Certificates & Fellowships
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      {(profileForm.certifications || []).length} Certificates
                    </span>
                    {(profileForm.certifications || []).length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllCerts}
                        style={{ background: 'none', border: 'none', color: '#e11d48', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Delete All
                      </button>
                    )}
                  </div>
                </div>
                <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '0 0 12px 0' }}>
                  Add clinical fellowships and specialized board certifications. Modify or delete at any time.
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  {(profileForm.certifications && profileForm.certifications.length > 0) ? (
                    profileForm.certifications.map((cert, idx) => (
                      <div
                        key={`cert-${idx}-${cert}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          border: '1px solid #bfdbfe',
                          padding: '5px 10px',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          fontWeight: 600
                        }}
                      >
                        {editingCert.index === idx ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="text"
                              value={editingCert.text}
                              onChange={(e) => setEditingCert({ index: idx, text: e.target.value })}
                              style={{ padding: '2px 6px', fontSize: '0.82rem', borderRadius: '4px', border: '1px solid #2563eb', outline: 'none' }}
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateCert(idx)}
                              style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', fontSize: '0.75rem' }}
                              title="Save modification"
                            >
                              <Check size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCert({ index: null, text: '' })}
                              style={{ background: '#cbd5e1', color: '#334155', border: 'none', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', fontSize: '0.75rem' }}
                              title="Cancel"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <GraduationCap size={14} color="#2563eb" />
                            <span>{cert}</span>
                            <button
                              type="button"
                              onClick={() => setEditingCert({ index: idx, text: cert })}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#2563eb', padding: '0 2px', display: 'flex' }}
                              title="Modify certificate"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveCert(idx)}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0 2px', display: 'flex' }}
                              title="Delete certificate"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    ))
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '0.82rem', fontStyle: 'italic' }}>No certifications added yet.</span>
                  )}
                </div>

                <form onSubmit={handleAddCert} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="e.g. Fellow of American College of Cardiology (FACC), ACLS Certified..."
                    value={newCertInput}
                    onChange={(e) => setNewCertInput(e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.88rem' }}
                  />
                  <button
                    type="submit"
                    style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                  >
                    + Add Certificate
                  </button>
                </form>
              </div>

              {/* SECTION: PROFESSIONAL MEMBERSHIPS */}
              <div style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
                    <Users size={18} color="#2563eb" />
                    Professional Medical Memberships
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      {(profileForm.memberships || []).length} Memberships
                    </span>
                    {(profileForm.memberships || []).length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllMemberships}
                        style={{ background: 'none', border: 'none', color: '#e11d48', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Delete All
                      </button>
                    )}
                  </div>
                </div>
                <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '0 0 12px 0' }}>
                  National and international medical societies and associations.
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  {(profileForm.memberships && profileForm.memberships.length > 0) ? (
                    profileForm.memberships.map((mem, idx) => (
                      <div
                        key={`mem-${idx}-${mem}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#f8fafc',
                          color: '#334155',
                          border: '1px solid #cbd5e1',
                          padding: '5px 10px',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          fontWeight: 600
                        }}
                      >
                        {editingMembership.index === idx ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="text"
                              value={editingMembership.text}
                              onChange={(e) => setEditingMembership({ index: idx, text: e.target.value })}
                              style={{ padding: '2px 6px', fontSize: '0.82rem', borderRadius: '4px', border: '1px solid #475569', outline: 'none' }}
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateMembership(idx)}
                              style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', fontSize: '0.75rem' }}
                              title="Save modification"
                            >
                              <Check size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingMembership({ index: null, text: '' })}
                              style={{ background: '#cbd5e1', color: '#334155', border: 'none', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', fontSize: '0.75rem' }}
                              title="Cancel"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <Users size={14} color="#64748b" />
                            <span>{mem}</span>
                            <button
                              type="button"
                              onClick={() => setEditingMembership({ index: idx, text: mem })}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#2563eb', padding: '0 2px', display: 'flex' }}
                              title="Modify membership"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveMembership(idx)}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0 2px', display: 'flex' }}
                              title="Delete membership"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    ))
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '0.82rem', fontStyle: 'italic' }}>No memberships added yet.</span>
                  )}
                </div>

                <form onSubmit={handleAddMembership} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="e.g. Cardiological Society of India (CSI), Indian Medical Association (IMA)..."
                    value={newMembershipInput}
                    onChange={(e) => setNewMembershipInput(e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.88rem' }}
                  />
                  <button
                    type="submit"
                    style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                  >
                    + Add Membership
                  </button>
                </form>
              </div>

              {/* SECTION: CAREER EXPERIENCE TIMELINE */}
              <div style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
                    <Briefcase size={18} color="#2563eb" />
                    Career Experience & Hospital Timeline
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      {(profileForm.careerExperience || []).length} Roles
                    </span>
                    {(profileForm.careerExperience || []).length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllCareerExp}
                        style={{ background: 'none', border: 'none', color: '#e11d48', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Delete All
                      </button>
                    )}
                  </div>
                </div>
                <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '0 0 10px 0' }}>
                  Past and present hospital posts, consultancy tenures, and clinical appointments.
                </p>

                {(profileForm.careerExperience || []).length > 1 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '0.78rem',
                    color: '#1e40af',
                    marginBottom: '12px'
                  }}>
                    <GripVertical size={14} color="#2563eb" />
                    <span>
                      <strong>Reorder:</strong> Long-press & drag any role above or below, or use the <strong>↑ / ↓</strong> buttons.
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                  {(profileForm.careerExperience && profileForm.careerExperience.length > 0) ? (
                    profileForm.careerExperience.map((expRole, idx) => {
                      const isBeingDragged = draggedCareerIdx === idx;
                      const isHoveredOver = dragOverCareerIdx === idx && draggedCareerIdx !== null && draggedCareerIdx !== idx;

                      return (
                        <div
                          key={`career-${idx}-${expRole}`}
                          data-career-idx={idx}
                          draggable={editingCareerExp.index === null}
                          onDragStart={(e) => handleCareerDragStart(e, idx)}
                          onDragOver={(e) => handleCareerDragOver(e, idx)}
                          onDrop={(e) => handleCareerDrop(e, idx)}
                          onDragEnd={handleCareerDragEnd}
                          onTouchStart={(e) => handleCareerTouchStart(e, idx)}
                          onTouchMove={handleCareerTouchMove}
                          onTouchEnd={handleCareerTouchEnd}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: isBeingDragged ? '#dbeafe' : (isHoveredOver ? '#eff6ff' : '#f8fafc'),
                            border: isBeingDragged 
                              ? '2px dashed #2563eb' 
                              : (isHoveredOver 
                                  ? '2px solid #2563eb' 
                                  : '1px solid #e2e8f0'),
                            padding: '8px 12px',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            color: '#1e293b',
                            fontWeight: 500,
                            opacity: isBeingDragged ? 0.75 : 1,
                            transform: isBeingDragged ? 'scale(1.01)' : 'none',
                            boxShadow: isBeingDragged ? '0 8px 16px rgba(37, 99, 235, 0.2)' : 'none',
                            transition: 'all 0.15s ease',
                            userSelect: 'none'
                          }}
                        >
                          {editingCareerExp.index === idx ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', flexWrap: 'wrap' }}>
                              <input
                                type="text"
                                placeholder="Role & Hospital (e.g. Senior Consultant - Apollo Hospital)"
                                value={editingCareerExp.text}
                                onChange={(e) => setEditingCareerExp(prev => ({ ...prev, text: e.target.value }))}
                                style={{ flex: '1 1 220px', padding: '6px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1.5px solid #2563eb', outline: 'none' }}
                                autoFocus
                              />
                              <input
                                type="text"
                                placeholder="Start Year"
                                value={editingCareerExp.startYear || ''}
                                onChange={(e) => setEditingCareerExp(prev => ({ ...prev, startYear: e.target.value }))}
                                style={{ width: '95px', padding: '6px 8px', fontSize: '0.82rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
                              />
                              <input
                                type="text"
                                placeholder="End Year"
                                value={editingCareerExp.isPresent ? 'Present' : (editingCareerExp.endYear || '')}
                                disabled={!!editingCareerExp.isPresent}
                                onChange={(e) => setEditingCareerExp(prev => ({ ...prev, endYear: e.target.value }))}
                                style={{
                                  width: '95px',
                                  padding: '6px 8px',
                                  fontSize: '0.82rem',
                                  borderRadius: '6px',
                                  border: '1px solid #cbd5e1',
                                  outline: 'none',
                                  background: editingCareerExp.isPresent ? '#f1f5f9' : '#ffffff',
                                  color: editingCareerExp.isPresent ? '#059669' : '#0f172a',
                                  fontWeight: editingCareerExp.isPresent ? 700 : 400
                                }}
                              />
                              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600, color: '#1e293b' }}>
                                <input
                                  type="checkbox"
                                  checked={!!editingCareerExp.isPresent}
                                  onChange={(e) => setEditingCareerExp(prev => ({ ...prev, isPresent: e.target.checked, endYear: e.target.checked ? '' : prev.endYear }))}
                                  style={{ width: '14px', height: '14px', cursor: 'pointer', accentColor: '#2563eb' }}
                                />
                                <span>Present</span>
                              </label>
                              <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateCareerExp(idx)}
                                  style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingCareerExp({ index: null, text: '', startYear: '', endYear: '', isPresent: false })}
                                  style={{ background: '#cbd5e1', color: '#334155', border: 'none', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', fontSize: '0.78rem' }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    cursor: 'grab',
                                    color: isBeingDragged ? '#2563eb' : '#94a3b8',
                                    padding: '2px',
                                    flexShrink: 0
                                  }}
                                  title="Drag or long-press to move"
                                >
                                  <GripVertical size={16} />
                                </div>
                                {expRole.toLowerCase().includes('present') || (idx === 0 && !(profileForm.careerExperience || []).some(c => c.toLowerCase().includes('present'))) ? (
                                  <div title="Present (Double circle)" style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #2563eb', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 0 2px rgba(37,99,235,0.15)' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563eb' }} />
                                  </div>
                                ) : (
                                  <div title="Past role (Single circle)" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#2563eb', border: '1.5px solid #ffffff', boxShadow: '0 0 0 1.5px #60a5fa', flexShrink: 0, margin: '0 3px' }} />
                                )}
                                <Briefcase size={14} color="#2563eb" style={{ flexShrink: 0 }} />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {expRole}
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, marginLeft: '8px' }}>
                                {/* Reorder Up / Down Buttons */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: '#e2e8f0', borderRadius: '6px', padding: '1px 2px', marginRight: '4px' }}>
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => handleMoveCareerExp(idx, -1)}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      cursor: idx === 0 ? 'not-allowed' : 'pointer',
                                      color: idx === 0 ? '#94a3b8' : '#1e293b',
                                      padding: '3px 4px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      borderRadius: '4px'
                                    }}
                                    title="Move up"
                                  >
                                    <ArrowUp size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === profileForm.careerExperience.length - 1}
                                    onClick={() => handleMoveCareerExp(idx, 1)}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      cursor: idx === profileForm.careerExperience.length - 1 ? 'not-allowed' : 'pointer',
                                      color: idx === profileForm.careerExperience.length - 1 ? '#94a3b8' : '#1e293b',
                                      padding: '3px 4px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      borderRadius: '4px'
                                    }}
                                    title="Move down"
                                  >
                                    <ArrowDown size={13} />
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleStartEditCareerExp(idx, expRole)}
                                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#2563eb', padding: '3px', display: 'flex', borderRadius: '4px' }}
                                  title="Modify role"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCareerExp(idx)}
                                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '3px', display: 'flex', borderRadius: '4px' }}
                                  title="Delete role"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '0.82rem', fontStyle: 'italic' }}>No past hospital roles added yet.</span>
                  )}
                </div>

                <form onSubmit={handleAddCareerExp} style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      placeholder="Role & Hospital (e.g. Senior Consultant - Apollo Hospital)"
                      value={newCareerExpInput}
                      onChange={(e) => setNewCareerExpInput(e.target.value)}
                      style={{ flex: '1 1 260px', padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.88rem', background: '#ffffff' }}
                    />
                    <input
                      type="text"
                      placeholder="Start Year (e.g. 2018)"
                      value={newCareerExpStartYear}
                      onChange={(e) => setNewCareerExpStartYear(e.target.value)}
                      style={{ width: '140px', padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.88rem', background: '#ffffff' }}
                    />
                    <input
                      type="text"
                      placeholder="End Year (e.g. 2024)"
                      value={newCareerExpIsPresent ? 'Present' : newCareerExpEndYear}
                      disabled={newCareerExpIsPresent}
                      onChange={(e) => setNewCareerExpEndYear(e.target.value)}
                      style={{
                        width: '140px',
                        padding: '8px 12px',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '0.88rem',
                        background: newCareerExpIsPresent ? '#f1f5f9' : '#ffffff',
                        color: newCareerExpIsPresent ? '#059669' : '#0f172a',
                        fontWeight: newCareerExpIsPresent ? 700 : 400
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 600, color: '#1e293b', userSelect: 'none' }}>
                      <input
                        type="checkbox"
                        checked={newCareerExpIsPresent}
                        onChange={(e) => {
                          setNewCareerExpIsPresent(e.target.checked);
                          if (e.target.checked) setNewCareerExpEndYear('');
                        }}
                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#2563eb' }}
                      />
                      <span>Currently working here (Present)</span>
                    </label>

                    <button
                      type="submit"
                      style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 1px 2px rgba(37,99,235,0.2)' }}
                    >
                      <Plus size={15} />
                      <span>Add Role</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* SECTION: FEATURED MEDIA (MANAGED EXCLUSIVELY BY ADMIN) */}
              <div style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
                    <ShieldCheck size={18} color="#2563eb" />
                    Featured Media (Instagram Reels & YouTube Videos)
                  </h4>
                  <span style={{
                    fontSize: '0.75rem',
                    background: '#eff6ff',
                    color: '#2563eb',
                    border: '1px solid #bfdbfe',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Lock size={12} /> Managed by Platform Admin
                  </span>
                </div>
                <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '0 0 14px 0', lineHeight: 1.5 }}>
                  To maintain verified clinical quality, Instagram Reels and educational YouTube videos are uploaded and managed exclusively by the Platform Administrator. Contact your platform admin if you wish to feature new reels or treatment videos on your public doctor profile.
                </p>

                {/* Read-only Reels preview if configured by admin */}
                {Array.isArray(profileForm.reels) && profileForm.reels.filter(r => (typeof r === 'string' ? r.trim() : (r?.url || r?.coverPhoto))).length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#be185d', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <Instagram size={15} /> Active Instagram Reels ({profileForm.reels.filter(r => (typeof r === 'string' ? r.trim() : (r?.url || r?.coverPhoto))).length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {profileForm.reels.map((reelItem, idx) => {
                        if (!reelItem) return null;
                        const reelUrl = (typeof reelItem === 'string' ? reelItem : (reelItem?.url || reelItem?.link || '')).trim();
                        const coverPhoto = typeof reelItem === 'object' ? (reelItem?.coverPhoto || '') : '';
                        if (!reelUrl && !coverPhoto) return null;

                        return (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              background: '#fdf2f8',
                              border: '1px solid #fbcfe8',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              fontSize: '0.84rem',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {coverPhoto ? (
                              <img 
                                src={coverPhoto} 
                                alt="Cover" 
                                style={{ width: '26px', height: '34px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0, cursor: 'pointer' }}
                                onClick={() => {
                                  setPreviewReelError(false);
                                  setPreviewMediaModal({
                                    type: 'reel',
                                    url: reelUrl,
                                    title: `Instagram Reel #${idx + 1}`,
                                    coverPhoto
                                  });
                                }}
                                title="Click to preview reel" 
                              />
                            ) : (
                              <div
                                onClick={() => {
                                  setPreviewReelError(false);
                                  setPreviewMediaModal({
                                    type: 'reel',
                                    url: reelUrl,
                                    title: `Instagram Reel #${idx + 1}`,
                                    coverPhoto
                                  });
                                }}
                                style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#fce7f3', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                                title="Click to preview reel"
                              >
                                <Play size={12} color="#db2777" fill="#db2777" />
                              </div>
                            )}

                            <span
                              onClick={() => {
                                setPreviewReelError(false);
                                setPreviewMediaModal({
                                  type: 'reel',
                                  url: reelUrl,
                                  title: `Instagram Reel #${idx + 1}`,
                                  coverPhoto
                                });
                              }}
                              style={{ color: '#db2777', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, cursor: 'pointer', fontWeight: 600 }}
                              title="Click to preview reel directly in dashboard"
                            >
                              {reelUrl || 'Cover Photo Uploaded'}
                            </span>

                            {coverPhoto && (
                              <span style={{ fontSize: '0.7rem', color: '#0369a1', background: '#e0f2fe', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, flexShrink: 0 }}>
                                Custom Cover
                              </span>
                            )}

                            <span style={{ fontSize: '0.72rem', color: '#9d174d', background: '#fce7f3', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, flexShrink: 0 }}>
                              Live on Profile
                            </span>

                            {/* Direct Preview Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewReelError(false);
                                setPreviewMediaModal({
                                  type: 'reel',
                                  url: reelUrl,
                                  title: `Instagram Reel #${idx + 1}`,
                                  coverPhoto
                                });
                              }}
                              title="Directly play and preview this reel"
                              style={{
                                background: '#be185d',
                                color: '#ffffff',
                                border: 'none',
                                padding: '5px 12px',
                                borderRadius: '6px',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                boxShadow: '0 1px 3px rgba(190, 24, 93, 0.25)',
                                flexShrink: 0,
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <Play size={11} fill="#ffffff" />
                              <span>Preview</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Read-only YouTube preview if configured by admin */}
                {Array.isArray(profileForm.youtube_videos) && profileForm.youtube_videos.filter(Boolean).length > 0 && (
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <Youtube size={15} /> Active YouTube Videos ({profileForm.youtube_videos.filter(Boolean).length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {profileForm.youtube_videos.filter(Boolean).map((vidUrl, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            fontSize: '0.84rem',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div
                            onClick={() => {
                              setPreviewMediaModal({
                                type: 'youtube',
                                url: vidUrl,
                                title: `YouTube Video #${idx + 1}`
                              });
                            }}
                            style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                            title="Click to preview video"
                          >
                            <Play size={12} color="#dc2626" fill="#dc2626" />
                          </div>

                          <span
                            onClick={() => {
                              setPreviewMediaModal({
                                type: 'youtube',
                                url: vidUrl,
                                title: `YouTube Video #${idx + 1}`
                              });
                            }}
                            style={{ color: '#dc2626', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, cursor: 'pointer', fontWeight: 600 }}
                            title="Click to preview video directly in dashboard"
                          >
                            {vidUrl}
                          </span>

                          <span style={{ fontSize: '0.72rem', color: '#991b1b', background: '#fee2e2', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, flexShrink: 0 }}>
                            Live on Profile
                          </span>

                          {/* Direct Preview Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewMediaModal({
                                type: 'youtube',
                                url: vidUrl,
                                title: `YouTube Video #${idx + 1}`
                              });
                            }}
                            title="Directly play and preview this video"
                            style={{
                              background: '#dc2626',
                              color: '#ffffff',
                              border: 'none',
                              padding: '5px 12px',
                              borderRadius: '6px',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              boxShadow: '0 1px 3px rgba(220, 38, 38, 0.25)',
                              flexShrink: 0,
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <Play size={11} fill="#ffffff" />
                            <span>Preview</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION: SOCIAL LINKS */}
              <h4 style={{ marginTop: '24px', marginBottom: '12px' }}>Social Profiles (Optional)</h4>
              <form
                onSubmit={handleSaveAllProfileSettings}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveAllProfileSettings(e);
                  }
                }}
                className={styles.settingsGrid}
              >
                <div className={styles.formGroup}>
                  <label>Instagram URL</label>
                  <input
                    type="url"
                    placeholder="https://instagram.com/dr.username"
                    value={profileForm.instagram || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, instagram: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Facebook URL</label>
                  <input
                    type="url"
                    placeholder="https://facebook.com/dr.username"
                    value={profileForm.facebook || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, facebook: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>LinkedIn URL</label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/dr.username"
                    value={profileForm.linkedin || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, linkedin: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Twitter / X URL</label>
                  <input
                    type="url"
                    placeholder="https://x.com/dr_username"
                    value={profileForm.twitter || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, twitter: e.target.value })}
                  />
                </div>
              </form>

              {/* SECTION: DOCTOR PROFILE FAQS (GOVERNED BY REGISTERED HOSPITAL OR ADMIN) */}
              <div style={{ marginTop: '28px', borderTop: '1px solid #e2e8f0', paddingTop: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
                    <HelpCircle size={18} color="#0284c7" />
                    Doctor Profile FAQs (Managed by Hospital / Admin)
                  </h4>
                  <span style={{ fontSize: '0.76rem', background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                    Hospital Governed (Read-Only)
                  </span>
                </div>

                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '14px 16px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <ShieldCheck size={20} color="#0284c7" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ fontSize: '0.86rem', color: '#0369a1', lineHeight: 1.5 }}>
                      <strong>Hospital Governance Policy:</strong> The FAQs displayed on your public doctor profile page can only be updated by the hospital under which you are registered (<strong>{activeDoctor.hospital || 'Your Registered Hospital'}</strong>) or platform Administrators. Doctors cannot directly alter public clinical policy FAQs.
                      <div style={{ marginTop: '5px', fontSize: '0.8rem', color: '#0284c7' }}>
                        To request updates or custom clinical FAQs on your page, please contact your hospital administration.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Display Current Live FAQs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {((activeDoctor.faqs && activeDoctor.faqs.length > 0) ? activeDoctor.faqs : [
                    { q: `How can I book an appointment with ${activeDoctor.name ? (activeDoctor.name.startsWith('Dr.') ? activeDoctor.name : `Dr. ${activeDoctor.name}`) : 'the doctor'}?`, a: 'You can book an in-clinic or video consultation directly on The Sehat Buddy platform with instant confirmation.' },
                    { q: 'What do I need to show at the clinic?', a: 'Carry a valid government photo ID, health insurance policy e-card (if claiming cashless coverage), and previous doctor prescriptions or test reports.' },
                    { q: 'Is my consultation private with the doctor?', a: 'Yes, 100%. All consultations, patient notes, and medical discussions are strictly confidential.' },
                    { q: 'Can I reschedule my appointment?', a: 'Yes, you can easily reschedule or cancel prior to your slot time through your patient account.' },
                    { q: 'Does the doctor accept health insurance or cashless claims?', a: 'Yes, consultations and hospital procedures qualify for cashless mediclaim pre-authorization with all leading TPAs.' }
                  ]).map((faq, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '10px 14px'
                      }}
                    >
                      <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.86rem', marginBottom: '4px' }}>
                        Q{idx + 1}: {faq.q || faq.question}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.82rem', lineHeight: 1.4 }}>
                        {faq.a || faq.answer}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* DANGER ZONE: RESET INFO & DELETE DOCTOR PROFILE */}
              <div style={{ marginTop: '36px', border: '1.5px solid #fecaca', background: '#fff5f5', borderRadius: '14px', padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', marginBottom: '6px' }}>
                  <AlertTriangle size={18} />
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Danger Zone</h4>
                </div>
                <p style={{ margin: '0 0 16px 0', fontSize: '0.84rem', color: '#7f1d1d' }}>
                  Be careful: actions here modify your public visibility or permanently remove your doctor listing from The Sehat Buddy.
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setIsResetModalOpen(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid #f87171',
                      background: '#ffffff',
                      color: '#b91c1c',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <RotateCcw size={14} />
                    <span>Reset Optional Info</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmationWord('');
                      setIsDeleteModalOpen(true);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#dc2626',
                      color: '#ffffff',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(220,38,38,0.2)'
                    }}
                  >
                    <Trash2 size={14} />
                    <span>Delete Doctor Profile</span>
                  </button>
                </div>
              </div>

              {/* BOTTOM SAVE ROW */}
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <button
                  type="button"
                  onClick={handleViewLiveProfile}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#334155',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Eye size={16} />
                  <span>Preview On Public Doctor Page</span>
                </button>

                <button
                  type="button"
                  className={styles.saveBtn}
                  onClick={handleSaveAllProfileSettings}
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Appointment Modal */}
      {isNewAppointmentModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsNewAppointmentModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Book In-Clinic / Video Patient</h3>
              <button onClick={() => setIsNewAppointmentModalOpen(false)} className={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddAppointment} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Patient Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Verma"
                  value={newAppointmentData.patientName}
                  onChange={(e) => setNewAppointmentData({ ...newAppointmentData, patientName: e.target.value })}
                />
              </div>

              <div className={styles.grid2}>
                <div className={styles.formGroup}>
                  <label>Age</label>
                  <input
                    type="number"
                    placeholder="35"
                    value={newAppointmentData.age}
                    onChange={(e) => setNewAppointmentData({ ...newAppointmentData, age: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Gender</label>
                  <select
                    value={newAppointmentData.gender}
                    onChange={(e) => setNewAppointmentData({ ...newAppointmentData, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className={styles.grid2}>
                <div className={styles.formGroup}>
                  <label>Appointment Type</label>
                  <select
                    value={newAppointmentData.type}
                    onChange={(e) => setNewAppointmentData({ ...newAppointmentData, type: e.target.value })}
                  >
                    <option value="In-Clinic">In-Clinic Visit</option>
                    <option value="Video Call">Teleconsultation (Video)</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Time Slot</label>
                  <input
                    type="text"
                    placeholder="03:30 PM"
                    value={newAppointmentData.time}
                    onChange={(e) => setNewAppointmentData({ ...newAppointmentData, time: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Contact Phone</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="Enter 10-digit mobile number"
                  value={newAppointmentData.phone}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setNewAppointmentData({ ...newAppointmentData, phone: digits });
                  }}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Reason / Symptoms</label>
                <input
                  type="text"
                  placeholder="e.g. Chest discomfort, Follow up"
                  value={newAppointmentData.symptoms}
                  onChange={(e) => setNewAppointmentData({ ...newAppointmentData, symptoms: e.target.value })}
                />
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsNewAppointmentModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn} disabled={isSubmittingAppointment}>
                  {isSubmittingAppointment ? 'Scheduling...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Prescription Modal */}
      {isPrescriptionModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsPrescriptionModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Write Clinical Prescription</h3>
              <button onClick={() => setIsPrescriptionModalOpen(false)} className={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddPrescription} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Patient Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Mehta"
                  value={newPrescriptionData.patientName}
                  onChange={(e) => setNewPrescriptionData({ ...newPrescriptionData, patientName: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Diagnosis / Assessment *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acute Bronchitis, Normal ECG"
                  value={newPrescriptionData.diagnosis}
                  onChange={(e) => setNewPrescriptionData({ ...newPrescriptionData, diagnosis: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Medications & Dosage *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Tab. Azithromycin 500mg (1 OD for 3 days), Syp. Ambroxol (2 tsp TDS)"
                  value={newPrescriptionData.medications}
                  onChange={(e) => setNewPrescriptionData({ ...newPrescriptionData, medications: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Follow-up Advice</label>
                <input
                  type="text"
                  placeholder="e.g. After 5 days if cough persists"
                  value={newPrescriptionData.followUp}
                  onChange={(e) => setNewPrescriptionData({ ...newPrescriptionData, followUp: e.target.value })}
                />
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsPrescriptionModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn}>
                  Save Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Printable Prescription Preview Modal */}
      {selectedRxForPrint && (
        <div
          className={styles.modalOverlay}
          onClick={() => setSelectedRxForPrint(null)}
          style={{ zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(5px)', padding: '16px' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '620px',
              width: '100%',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid #e2e8f0'
            }}
          >
            {/* Modal Actions Bar (Not Printed) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: 700, fontSize: '0.95rem' }}>
                <Printer size={18} color="#2563eb" />
                <span>Clinical Prescription & Patient Summary</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '7px',
                    padding: '6px 14px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(37,99,235,0.25)'
                  }}
                >
                  <Printer size={14} /> Print / Save PDF
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRxForPrint(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Prescription Sheet */}
            <div
              id="printable-rx-sheet"
              style={{
                padding: '32px 36px',
                background: '#ffffff',
                color: '#0f172a',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
            >
              {/* Doctor & Hospital Letterhead */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #2563eb', paddingBottom: '16px', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ margin: '0 0 4px 0', fontSize: '1.35rem', color: '#1e3a8a', fontWeight: 800 }}>
                    {activeDoctor.name}
                  </h2>
                  <div style={{ fontSize: '0.86rem', color: '#3b82f6', fontWeight: 600 }}>
                    {activeDoctor.degree || activeDoctor.qualifications || 'MBBS, MD'} • {activeDoctor.specialty || activeDoctor.specialization}
                  </div>
                  {activeDoctor.licenseNumber && (
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '3px' }}>
                      Medical Reg No: <strong>{activeDoctor.licenseNumber}</strong>
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                    {activeDoctor.hospital || 'The Sehat Buddy Clinic'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                    The Sehat Buddy Telehealth & Clinical Network
                  </div>
                  {(activeDoctor.phone || activeDoctor.contact_number) && (
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                      Ph: {activeDoctor.phone || activeDoctor.contact_number}
                    </div>
                  )}
                </div>
              </div>

              {/* Patient Meta Strip */}
              <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 16px', marginBottom: '22px', fontSize: '0.86rem' }}>
                <div>
                  <span style={{ color: '#64748b' }}>Patient: </span>
                  <strong style={{ color: '#0f172a' }}>{selectedRxForPrint.patientName}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Date: </span>
                  <strong style={{ color: '#0f172a' }}>{selectedRxForPrint.date}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Rx ID: </span>
                  <strong style={{ color: '#2563eb' }}>RX-{String(selectedRxForPrint.id).slice(-6)}</strong>
                </div>
              </div>

              {/* Clinical Diagnosis */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>
                  Clinical Diagnosis / Impression
                </div>
                <div style={{ fontSize: '0.95rem', color: '#0f172a', fontWeight: 600, background: '#f0f9ff', padding: '10px 14px', borderRadius: '8px', borderLeft: '4px solid #0284c7' }}>
                  {selectedRxForPrint.diagnosis}
                </div>
              </div>

              {/* Rx Prescriptions Section */}
              <div style={{ marginBottom: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1.2rem', fontWeight: 800, color: '#1e3a8a', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.5rem', fontFamily: 'serif', fontStyle: 'italic' }}>℞</span>
                  <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#64748b', fontWeight: 700 }}>
                    Medication Protocol & Dosage
                  </span>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 16px', fontSize: '0.92rem', color: '#1e293b', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {selectedRxForPrint.medications}
                </div>
              </div>

              {/* Advice / Follow-up */}
              {selectedRxForPrint.followUp && (
                <div style={{ marginBottom: '28px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>
                    Follow-up Instructions & Advice
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#334155' }}>
                    {selectedRxForPrint.followUp}
                  </div>
                </div>
              )}

              {/* Signature / Validation Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Digitally issued via The Sehat Buddy Healthcare Portal
                  <br />Valid without physical signature if QR/Code verified.
                </div>
                <div style={{ textAlign: 'center', minWidth: '160px' }}>
                  <div style={{ height: '36px', borderBottom: '1.5px dashed #94a3b8', marginBottom: '6px' }}></div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                    {activeDoctor.name}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                    Physician Signature & Stamp
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Photo Zoom Preview Modal */}
      {isPhotoZoomOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setIsPhotoZoomOpen(false)}
          style={{
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '520px',
              width: '90%',
              background: '#0f172a',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <button
              onClick={() => setIsPhotoZoomOpen(false)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(0, 0, 0, 0.65)',
                border: 'none',
                color: 'white',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
                transition: 'background 0.2s'
              }}
              title="Close"
            >
              <X size={20} />
            </button>

            <div style={{ background: '#020617', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '340px', padding: '16px' }}>
              <img
                src={activeDoctor.image}
                alt={activeDoctor.name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '65vh',
                  objectFit: 'contain',
                  borderRadius: '12px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                }}
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80';
                }}
              />
            </div>

            <div style={{ padding: '16px 20px', background: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.15rem', fontWeight: 700 }}>
                  {activeDoctor.name}
                </h3>
                <span style={{ fontSize: '0.84rem', color: '#94a3b8' }}>
                  {activeDoctor.specialty} • {activeDoctor.hospital || 'Verified Practitioner'}
                </span>
              </div>
              <label
                style={{
                  background: '#2563eb',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: isUploadingImage ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title="Replace with new photo"
              >
                {isUploadingImage ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Camera size={15} />}
                <span>Update Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={isUploadingImage}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleDoctorPhotoUpload(file);
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Reset Optional Info Confirmation Modal */}
      {isResetModalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setIsResetModalOpen(false)}
          style={{ zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '90%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              border: '1px solid #f1f5f9'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                <RotateCcw size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 700 }}>Reset Optional Profile Details?</h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Doctor Page Profile Reset</span>
              </div>
            </div>

            <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              This will clear your <strong>About Bio, Awards, Certifications, Memberships, and Career Timeline</strong> from your public doctor profile. (Featured Media is managed separately by the Admin).
              <br /><br />
              Your basic clinic profile details (Name, Specialty, Experience, Hospital, Fees, Phone) will remain intact.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetOptionalInfo}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#d97706',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                Reset & Clear Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PATIENT REVIEWS & EXPERIENCES */}
      {activeTab === 'reviews' && (
        <div className={styles.tabContentCard} style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
          <div style={{ padding: '24px 28px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', background: '#fafafa' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fef3c7', color: '#b45309', padding: '4px 12px', borderRadius: '100px', fontSize: '0.78rem', fontWeight: 700, marginBottom: '8px' }}>
                <Star size={13} fill="#b45309" color="#b45309" />
                <span>Verified Patient Testimonials</span>
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
                Patient Feedback & Clinical Experiences
              </h2>
              <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
                Reviews submitted by patients treated by you and at your affiliated facility ({activeDoctor.hospital || 'Hospital'}).
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#ffffff', padding: '14px 22px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{verifiedAvgRating}</div>
                <div style={{ display: 'flex', gap: '3px', color: '#f59e0b', marginTop: '6px' }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={14} fill={s <= Math.round(Number(verifiedAvgRating)) ? '#f59e0b' : '#e2e8f0'} color={s <= Math.round(Number(verifiedAvgRating)) ? '#f59e0b' : '#cbd5e1'} />
                  ))}
                </div>
              </div>
              <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                  {doctorVerifiedReviews.length} {doctorVerifiedReviews.length === 1 ? 'Review' : 'Reviews'}
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                  <CheckCircle2 size={13} color="#10b981" /> 100% Verified
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: '28px' }}>
            {doctorVerifiedReviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 16px', color: '#94a3b8' }}>
                <MessageSquare size={48} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
                <h3 style={{ color: '#475569', fontSize: '1.1rem', margin: '0 0 6px 0' }}>No Patient Reviews Yet</h3>
                <p style={{ fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto' }}>
                  When patients submit feedback on the hospital profile or after their clinical consultation, their verified testimonials will appear here.
                </p>
              </div>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: doctorVerifiedReviews.length === 1 ? 'minmax(320px, 640px)' : 'repeat(auto-fit, minmax(360px, 1fr))', 
                gap: '24px',
                alignItems: 'stretch'
              }}>
                {doctorVerifiedReviews.map((rev, idx) => {
                  const initial = ((rev.patientName || 'P').trim().charAt(0) || 'P').toUpperCase();
                  const ratingNum = Number(rev.rating) || 5;

                  return (
                    <div
                      key={rev.id || rev._id || idx}
                      style={{
                        background: '#ffffff',
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0',
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                        transition: 'all 0.2s ease',
                        minHeight: '220px'
                      }}
                    >
                      {/* Top Header Row: Patient Avatar, Name & City + Star Rating */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                            color: '#1d4ed8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.05rem',
                            fontWeight: 800,
                            border: '1.5px solid #bfdbfe',
                            flexShrink: 0
                          }}>
                            {initial}
                          </div>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a', textTransform: 'capitalize' }}>
                              {rev.patientName || 'Verified Patient'}
                            </h4>
                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                              {rev.patientCity || 'Bengaluru'}
                            </span>
                          </div>
                        </div>

                        {/* Rating pill with stars */}
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          background: '#fffbeb', 
                          padding: '4px 10px', 
                          borderRadius: '8px', 
                          border: '1px solid #fef3c7',
                          flexShrink: 0 
                        }}>
                          <div style={{ display: 'flex', gap: '2px' }}>
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star
                                key={s}
                                size={14}
                                fill={s <= ratingNum ? '#f59e0b' : '#e2e8f0'}
                                color={s <= ratingNum ? '#f59e0b' : '#cbd5e1'}
                              />
                            ))}
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#b45309' }}>
                            {ratingNum.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      {/* Content Area: Treatment Tag, Title, and Comment Quote */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {rev.treatment && (
                          <div style={{ marginBottom: '12px' }}>
                            <span style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '5px', 
                              background: '#eff6ff', 
                              color: '#1d4ed8', 
                              padding: '4px 12px', 
                              borderRadius: '100px', 
                              fontSize: '0.75rem', 
                              fontWeight: 600,
                              border: '1px solid #dbeafe'
                            }}>
                              <span style={{ color: '#3b82f6' }}>●</span> Treatment: {rev.treatment}
                            </span>
                          </div>
                        )}

                        {rev.title && (
                          <h5 style={{ margin: '0 0 8px 0', fontSize: '0.96rem', fontWeight: 700, color: '#1e293b' }}>
                            {rev.title}
                          </h5>
                        )}

                        <div style={{ 
                          flex: 1,
                          background: '#f8fafc', 
                          padding: '12px 14px', 
                          borderRadius: '10px', 
                          borderLeft: '3px solid #3b82f6',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <p style={{ margin: 0, fontSize: '0.88rem', color: '#334155', lineHeight: 1.55, fontStyle: 'italic' }}>
                            "{rev.comment}"
                          </p>
                        </div>
                      </div>

                      {/* Bottom Footer: Verified Badge + Insurance Badge */}
                      <div style={{ 
                        borderTop: '1px solid #f1f5f9', 
                        marginTop: '16px', 
                        paddingTop: '12px', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        fontSize: '0.75rem'
                      }}>
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '5px', 
                          color: '#059669', 
                          background: '#ecfdf5', 
                          padding: '3px 10px', 
                          borderRadius: '100px', 
                          fontWeight: 600,
                          border: '1px solid #d1fae5'
                        }}>
                          <CheckCircle2 size={13} color="#059669" /> Verified Patient
                        </span>

                        {rev.insuranceUsed && rev.insuranceUsed !== 'None' && (
                          <span style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '5px', 
                            color: '#0284c7', 
                            background: '#f0f9ff', 
                            padding: '3px 10px', 
                            borderRadius: '100px', 
                            fontWeight: 600,
                            border: '1px solid #e0f2fe'
                          }}>
                            <ShieldCheck size={13} color="#0284c7" /> {rev.insuranceUsed}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Doctor Profile Permanently Modal */}
      {isDeleteModalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            setIsDeleteModalOpen(false);
            setDeleteConfirmationWord('');
          }}
          style={{ zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(5px)' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '500px',
              width: '90%',
              padding: '24px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
              border: '1.5px solid #fecdd3'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48' }}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.18rem', color: '#9f1239', fontWeight: 700 }}>Delete Doctor Profile Permanently?</h3>
                <span style={{ fontSize: '0.8rem', color: '#e11d48', fontWeight: 500 }}>Warning: This action is permanent and cannot be undone</span>
              </div>
            </div>

            <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              Deleting this doctor profile will permanently remove your listing from the <strong>Doctor Page</strong>, patient search results, and delete all associated records, media, and credentials from the database.
            </p>

            <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '10px', padding: '12px 14px', marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#9f1239', marginBottom: '6px' }}>
                Type <strong style={{ textDecoration: 'underline' }}>DELETE</strong> to confirm permanent deletion:
              </label>
              <input
                type="text"
                placeholder="DELETE"
                value={deleteConfirmationWord}
                onChange={(e) => setDeleteConfirmationWord(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #f43f5e',
                  fontSize: '0.95rem',
                  outline: 'none',
                  fontWeight: 600,
                  letterSpacing: '1px',
                  color: '#9f1239',
                  background: '#ffffff',
                  boxSizing: 'border-box'
                }}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmationWord('');
                }}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmationWord !== 'DELETE'}
                onClick={handleDeleteDoctorProfile}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  background: deleteConfirmationWord === 'DELETE' ? '#e11d48' : '#fda4af',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: deleteConfirmationWord === 'DELETE' ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background 0.2s'
                }}
              >
                <Trash2 size={16} />
                Permanently Delete Doctor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Today's Amount Made Breakdown Modal */}
      {isEarningsBreakdownOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setIsEarningsBreakdownOpen(false)}
          style={{
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '18px',
              width: '92%',
              maxWidth: '540px',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1.5px solid #e2e8f0',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                  <TrendingUp size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Amount Made Breakdown</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                    Today ({todayDateStr}) • {todayCompletedAppointments.length} completed consultation{todayCompletedAppointments.length === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEarningsBreakdownOpen(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Total Highlight Bar */}
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px 16px', margin: '16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#166534' }}>Total Earned Today</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#15803d' }}>₹{amountMadeToday.toLocaleString('en-IN')}</span>
            </div>

            {/* Patients List */}
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {todayCompletedAppointments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: '#64748b' }}>
                  <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 500 }}>No completed consultations recorded today yet.</p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>When an appointment is marked "Completed", it will appear here with the fee paid.</p>
                </div>
              ) : (
                todayCompletedAppointments.map((apt, idx) => {
                  const patientName = apt.patientName || apt.userData?.name || 'Patient';
                  const timeSlot = apt.slotTime || apt.time || 'Today';
                  const consultType = apt.consultationType || apt.type || 'In-Clinic Consultation';
                  const feePaid = Number(apt.amount) || consultationFee;

                  return (
                    <div
                      key={apt.id || apt._id || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                          {patientName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#0f172a' }}>{patientName}</div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', gap: '8px', marginTop: '2px' }}>
                            <span>🕒 {timeSlot}</span>
                            <span>•</span>
                            <span>{consultType}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#15803d' }}>
                          ₹{feePaid.toLocaleString('en-IN')}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600, background: '#dcfce7', padding: '1px 6px', borderRadius: '4px' }}>
                          Paid
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ paddingTop: '16px', borderTop: '1px solid #e2e8f0', marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setIsEarningsBreakdownOpen(false)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#334155',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FEATURED MEDIA PREVIEW MODAL */}
      {previewMediaModal && (
        <div 
          onClick={() => setPreviewMediaModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#090d16',
              borderRadius: '18px',
              overflow: 'hidden',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.85)',
              width: '100%',
              maxWidth: previewMediaModal.type === 'reel' ? '420px' : '840px',
              position: 'relative',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}
          >
            {/* Top Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {previewMediaModal.type === 'reel' ? (
                  <Instagram size={16} color="#f43f5e" />
                ) : (
                  <Youtube size={16} color="#ef4444" />
                )}
                <span style={{ color: '#ffffff', fontSize: '0.86rem', fontWeight: 700 }}>
                  {previewMediaModal.title}
                </span>
                <span style={{
                  fontSize: '0.68rem',
                  background: previewMediaModal.type === 'reel' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: previewMediaModal.type === 'reel' ? '#fda4af' : '#fca5a5',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontWeight: 700
                }}>
                  Live on Profile
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewMediaModal(null)}
                title="Close Preview"
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Video Display Container */}
            <div style={{
              width: '100%',
              height: previewMediaModal.type === 'reel' ? '70vh' : 'auto',
              maxHeight: previewMediaModal.type === 'reel' ? '640px' : 'none',
              aspectRatio: previewMediaModal.type === 'reel' ? '9/16' : '16/9',
              background: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              {previewMediaModal.type === 'reel' ? (
                !previewReelError ? (
                  <video
                    key={previewMediaModal.url}
                    src={`${API_BASE}/reel-video?url=${encodeURIComponent(previewMediaModal.url)}`}
                    poster={previewMediaModal.coverPhoto}
                    autoPlay
                    playsInline
                    controls
                    onError={() => setPreviewReelError(true)}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000000' }}
                  />
                ) : (
                  <iframe
                    src={getMediaEmbedUrl(previewMediaModal.url)}
                    title="Reel Preview Player"
                    scrolling="no"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  />
                )
              ) : (
                <iframe
                  src={getMediaEmbedUrl(previewMediaModal.url)}
                  title="YouTube Video Preview Player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
