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
import { api } from '../../services/api';
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
    if (doctorVerifiedReviews.length === 0) return (activeDoctor.rating || 4.8);
    const total = doctorVerifiedReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0);
    return (total / doctorVerifiedReviews.length).toFixed(1);
  }, [doctorVerifiedReviews, activeDoctor.rating]);

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
        available: newStatus === 'Available'
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

  // Active Tab: 'appointments' | 'prescriptions' | 'profile'
  const [activeTab, setActiveTab] = useState('appointments');

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

  // Inline editing states for modifying existing items
  const [editingAward, setEditingAward] = useState({ index: null, text: '', year: '' });
  const [editingCert, setEditingCert] = useState({ index: null, text: '' });
  const [editingMembership, setEditingMembership] = useState({ index: null, text: '' });
  const [editingCareerExp, setEditingCareerExp] = useState({ index: null, text: '' });

  // Schedule & Time Slots Management state
  const [slotConfigMode, setSlotConfigMode] = useState('all'); // 'all' (Standard) | 'day' (Day-wise) | 'date' (Date-wise)
  const [selectedScheduleDay, setSelectedScheduleDay] = useState('Mon');
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

  const initialDoctorIdRef = React.useRef(null);

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

          // Check for new incoming appointments to trigger notification toast
          const existingIds = new Set((prev || []).map(p => String(p.id || p._id)));
          const newIncoming = allIncoming.filter(r => !existingIds.has(String(r.id || r._id)));
          if (newIncoming.length > 0 && prev && prev.length > 0) {
            showToast(`🔔 New patient booking: ${newIncoming[0].patientName} (${newIncoming[0].time})`);
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
    if (!newCareerExpInput.trim()) return;
    const current = Array.isArray(profileForm.careerExperience) ? profileForm.careerExperience : [];
    const updated = [...current, newCareerExpInput.trim()];
    setProfileForm(prev => ({ ...prev, careerExperience: updated }));
    setNewCareerExpInput('');
    updateDoctor(activeDoctor.id || activeDoctor._id, { careerExperience: updated });
    showToast('Hospital timeline role added!');
  };

  const handleUpdateCareerExp = (index) => {
    if (!editingCareerExp.text.trim()) return;
    const current = Array.isArray(profileForm.careerExperience) ? profileForm.careerExperience : [];
    const updated = current.map((item, i) => (i === index ? editingCareerExp.text.trim() : item));
    setProfileForm(prev => ({ ...prev, careerExperience: updated }));
    setEditingCareerExp({ index: null, text: '' });
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
    setProfileForm(prev => ({ ...prev, scheduleDays: updated }));
    const docId = activeDoctor?.id || activeDoctor?._id;
    if (docId) {
      await updateDoctor(docId, { scheduleDays: updated });
    }
    showToast(`Working days updated (${updated.length} active)`);
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

  // Helper to get slots for current mode (All / Day / Date)
  const getCurrentModeSlots = () => {
    if (slotConfigMode === 'all') {
      return Array.isArray(profileForm.availableSlots) ? profileForm.availableSlots : [];
    }
    if (slotConfigMode === 'day') {
      const dayConfig = profileForm.dayWiseSlots?.[selectedScheduleDay];
      if (dayConfig === 'off' || dayConfig?.isOff === true) return [];
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
      if (dayConfig === 'off' || dayConfig?.isOff === true) return [];
      if (Array.isArray(dayConfig)) return dayConfig;
      if (Array.isArray(dayConfig?.slots)) return dayConfig.slots;
      return Array.isArray(profileForm.availableSlots) ? profileForm.availableSlots : [];
    }
    return [];
  };

  const isCurrentModeOff = () => {
    if (slotConfigMode === 'day') {
      const dayConfig = profileForm.dayWiseSlots?.[selectedScheduleDay];
      return dayConfig === 'off' || dayConfig?.isOff === true;
    }
    if (slotConfigMode === 'date') {
      const dateConfig = profileForm.dateWiseSlots?.[selectedScheduleDate];
      if (dateConfig === 'off' || dateConfig?.isOff === true) return true;
      if (dateConfig === undefined) {
        const dayOfWeekShort = new Date(selectedScheduleDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
        const dayConfig = profileForm.dayWiseSlots?.[dayOfWeekShort];
        return dayConfig === 'off' || dayConfig?.isOff === true;
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
      setProfileForm(prev => ({ ...prev, dayWiseSlots: newDayWise }));
      if (docId) await updateDoctor(docId, { dayWiseSlots: newDayWise });
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
      setProfileForm(prev => ({ ...prev, dayWiseSlots: newDayWise }));
      if (docId) await updateDoctor(docId, { dayWiseSlots: newDayWise });
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
  const handleToggleDayOff = async () => {
    const docId = activeDoctor?.id || activeDoctor?._id;
    const isCurrentlyOff = profileForm.dayWiseSlots?.[selectedScheduleDay] === 'off';
    const newDayWise = { ...(profileForm.dayWiseSlots || {}) };
    if (isCurrentlyOff) {
      delete newDayWise[selectedScheduleDay];
      showToast(`${DAY_NAME_MAP[selectedScheduleDay] || selectedScheduleDay} marked Open (Using General Slots)`);
    } else {
      newDayWise[selectedScheduleDay] = 'off';
      showToast(`${DAY_NAME_MAP[selectedScheduleDay] || selectedScheduleDay} marked Closed / Off`);
    }
    setProfileForm(prev => ({ ...prev, dayWiseSlots: newDayWise }));
    if (docId) await updateDoctor(docId, { dayWiseSlots: newDayWise });
  };

  const handleResetDayToDefault = async () => {
    const docId = activeDoctor?.id || activeDoctor?._id;
    const newDayWise = { ...(profileForm.dayWiseSlots || {}) };
    delete newDayWise[selectedScheduleDay];
    setProfileForm(prev => ({ ...prev, dayWiseSlots: newDayWise }));
    if (docId) await updateDoctor(docId, { dayWiseSlots: newDayWise });
    showToast(`${DAY_NAME_MAP[selectedScheduleDay] || selectedScheduleDay} reset to General Default Schedule`);
  };

  const handleCopyDayToAllDays = async () => {
    const currentSlots = getCurrentModeSlots();
    if (!window.confirm(`Copy ${DAY_NAME_MAP[selectedScheduleDay] || selectedScheduleDay}'s slots (${currentSlots.length} slots) to all 7 days?`)) return;
    const docId = activeDoctor?.id || activeDoctor?._id;
    const newDayWise = { ...(profileForm.dayWiseSlots || {}) };
    DAYS_LIST.forEach(d => {
      newDayWise[d] = [...currentSlots];
    });
    setProfileForm(prev => ({ ...prev, dayWiseSlots: newDayWise, availableSlots: [...currentSlots] }));
    if (docId) await updateDoctor(docId, { dayWiseSlots: newDayWise, availableSlots: [...currentSlots] });
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

  const handleSlotDurationChange = async (durationMinutes) => {
    setProfileForm(prev => ({ ...prev, slotDuration: durationMinutes }));
    const docId = activeDoctor?.id || activeDoctor?._id;
    if (docId) {
      await updateDoctor(docId, { slotDuration: durationMinutes });
    }
    showToast(`Slot duration set to ${durationMinutes} minutes`);
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

  // Save All Profile Settings
  const handleSaveAllProfileSettings = async (e) => {
    e?.preventDefault?.();
    const docId = activeDoctor._id || activeDoctor.id;
    if (!docId) return;

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
      awards: Array.isArray(profileForm.awards) ? profileForm.awards : [],
      certifications: Array.isArray(profileForm.certifications) ? profileForm.certifications : [],
      memberships: Array.isArray(profileForm.memberships) ? profileForm.memberships : [],
      careerExperience: Array.isArray(profileForm.careerExperience) ? profileForm.careerExperience : [],
      tags: Array.isArray(profileForm.tags) ? profileForm.tags : [],
      reels: Array.isArray(activeDoctor.reels) ? activeDoctor.reels : (Array.isArray(profileForm.reels) ? profileForm.reels : []),
      youtube_videos: Array.isArray(activeDoctor.youtube_videos) ? activeDoctor.youtube_videos : (Array.isArray(profileForm.youtube_videos) ? profileForm.youtube_videos : []),
      availableDays: profileForm.availableDays || 'Mon - Sat (10am - 4pm)',
      scheduleDays: Array.isArray(profileForm.scheduleDays) ? profileForm.scheduleDays : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      availableSlots: Array.isArray(profileForm.availableSlots) ? profileForm.availableSlots : ['04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'],
      slotDuration: Number(profileForm.slotDuration) || 20
    };

    await updateDoctor(docId, payload);
    // Update localStorage user object so about (and other fields) survive refresh
    try {
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      if (stored && (stored.email === activeDoctor.email || String(stored._id) === String(activeDoctor._id) || String(stored.id) === String(activeDoctor.id))) {
        stored.about = payload.about;
        stored.name = payload.name;
        stored.specialization = payload.specialization;
        stored.specialty = payload.specialty;
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
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        if (stored && (stored.email === activeDoctor.email || String(stored._id) === String(activeDoctor._id) || String(stored.id) === String(activeDoctor.id))) {
          stored.about = aboutText;
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

  // Heatmap color generator based on doctor earnings & completed consultation count
  const getHeatmapColor = React.useCallback((earnings, count = 0, isFuture = false) => {
    if (isFuture) return '#f8fafc';
    const c = Number(count) || 0;
    const e = Number(earnings) || 0;
    if (c === 0 && e === 0) return '#f1f5f9';
    if (c === 1 || e <= consultationFee) return '#bbf7d0'; // 1 consultation (mint)
    if (c === 2 || e <= consultationFee * 2) return '#86efac'; // 2 consultations (light green)
    if (c <= 4 || e <= consultationFee * 4) return '#4ade80'; // 3-4 consultations (medium green)
    if (c <= 6 || e <= consultationFee * 6) return '#16a34a'; // 5-6 consultations (vibrant green)
    return '#15803d'; // 7+ consultations (deep emerald green)
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
              localStorage.removeItem('token');
              localStorage.removeItem('user');
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
            style={{
              background: '#f0fdf4',
              border: '1.5px solid #86efac',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
            title="Click to view patient consultation fees breakdown"
          >
            <div className={`${styles.kpiIconWrap} ${styles.kpiEmerald}`}>
              <TrendingUp size={22} />
            </div>
            <div>
              <span className={styles.kpiLabel} style={{ color: '#15803d', fontWeight: 700 }}>Amount Made Today</span>
              <div className={styles.kpiValue} style={{ color: '#14532d', display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                ₹{amountMadeToday.toLocaleString('en-IN')}
              </div>
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
              <span className={styles.kpiSub}>{verifiedReviewsCount}+ reviews</span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIconWrap} ${styles.kpiPurple}`}>
              <Clock size={22} />
            </div>
            <div>
              <span className={styles.kpiLabel}>Clinic Timings</span>
              <div className={styles.kpiValue} style={{ fontSize: '1rem', marginTop: '4px' }}>
                {activeDoctor.availableDays || 'Mon - Sat (10am - 4pm)'}
              </div>
              <span className={styles.kpiSub}>OPD Slot: {activeDoctor.slotDuration || 20} mins</span>
            </div>
          </div>
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
              <div style={{ display: 'inline-flex', alignItems: 'center', background: '#0f172a', borderRadius: '8px', padding: '2px', border: '1px solid #1e293b' }}>
                <button
                  type="button"
                  onClick={() => setSelectedHeatmapYear(y => y - 1)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
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
                <span style={{ color: '#ffffff', fontWeight: 800, fontSize: '0.80rem', padding: '0 8px', letterSpacing: '0.02em' }}>
                  {heatmapYearData.year}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedHeatmapYear(y => y + 1)}
                  disabled={heatmapYearData.year >= currentPcDate.getFullYear()}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: heatmapYearData.year >= currentPcDate.getFullYear() ? '#475569' : '#94a3b8',
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
                  border: '1px solid #cbd5e1',
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
                                        cursor: 'pointer'
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
                                    width: '16px',
                                    height: '16px',
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
                                  cursor: 'pointer'
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
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '0.94rem', color: '#0f172a', fontWeight: 700 }}>
                      <CalendarDays size={16} color="#2563eb" style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
                      {heatmapMonthData.monthName} Consultation Earnings
                    </h4>
                    <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                      Click on any date to inspect earnings breakdown
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center' }}>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(dName => (
                      <div key={dName} style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', paddingBottom: '4px' }}>
                        {dName}
                      </div>
                    ))}

                    {heatmapMonthData.days.map((cell, idx) => {
                      if (!cell) {
                        return <div key={idx} style={{ minHeight: '52px', background: 'transparent' }} />;
                      }
                      const isSelected = selectedHeatmapCell?.dateStr === cell.dateStr;
                      const isFuture = cell.isFuture;
                      const bgColor = isFuture ? '#fafafa' : getHeatmapColor(cell.earnings, cell.count, false);
                      return (
                        <div
                          key={idx}
                          onClick={() => !isFuture && setSelectedHeatmapCell(cell)}
                          style={{
                            minHeight: '54px',
                            borderRadius: '8px',
                            background: bgColor,
                            border: isSelected ? '2px solid #0f172a' : (isFuture ? '1px dashed #e2e8f0' : '1px solid rgba(0,0,0,0.08)'),
                            padding: '4px 6px',
                            cursor: isFuture ? 'default' : 'pointer',
                            opacity: isFuture ? 0.45 : 1,
                            pointerEvents: isFuture ? 'none' : 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.15s ease',
                            boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.15)' : 'none'
                          }}
                          title={isFuture ? `${cell.formattedDate} (Upcoming)` : `${cell.formattedDate}: ₹${cell.earnings} (${cell.count} completed)`}
                        >
                          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: cell.isToday ? '#15803d' : (isFuture ? '#94a3b8' : '#334155') }}>
                              {cell.dayNum}
                            </span>
                            {cell.isToday && (
                              <span style={{ fontSize: '0.62rem', fontWeight: 800, background: '#16a34a', color: '#fff', borderRadius: '4px', padding: '0 3px' }}>
                                Today
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.76rem', fontWeight: 800, color: !isFuture && cell.earnings > 0 ? '#14532d' : '#94a3b8' }}>
                            {!isFuture && cell.earnings > 0 ? `₹${cell.earnings}` : '—'}
                          </div>
                          <div style={{ fontSize: '0.64rem', color: isFuture ? '#94a3b8' : (cell.count > 0 ? '#166534' : '#94a3b8'), fontWeight: 600 }}>
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
                    background: '#f0fdf4',
                    border: '1.5px solid #86efac',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    animation: 'fadeIn 0.2s ease'
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
                          Total Revenue: <strong>₹{displayEarnings.toLocaleString('en-IN')}</strong> ({displayCount} completed consultation{displayCount === 1 ? '' : 's'} × ₹{consultationFee})
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
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              color: '#15803d'
                            }}
                          >
                            {p.name} ({p.time})
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
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: '6px'
                      }}
                      title="Close details"
                    >
                      <X size={16} />
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
                  <div className={styles.legendBox} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }} title="₹0 (No completed patients)" />
                  <div className={styles.legendBox} style={{ background: '#bbf7d0' }} title={`₹${consultationFee} (1 patient)`} />
                  <div className={styles.legendBox} style={{ background: '#86efac' }} title={`₹${consultationFee * 2} (2 patients)`} />
                  <div className={styles.legendBox} style={{ background: '#4ade80' }} title={`₹${consultationFee * 4} (3-4 patients)`} />
                  <div className={styles.legendBox} style={{ background: '#16a34a' }} title={`₹${consultationFee * 6} (5-6 patients)`} />
                  <div className={styles.legendBox} style={{ background: '#15803d' }} title={`₹${consultationFee * 7}+ (Peak day)`} />
                  <span>₹{consultationFee * 7}+</span>
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
                    onChange={(e) => setProfileForm({ ...profileForm, availableDays: e.target.value })}
                    onBlur={handleSaveAllProfileSettings}
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

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={handleResetDefaultTags}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: '#f8fafc',
                        color: '#475569',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                      title="Reset badges to default clinical recommendations"
                    >
                      <RotateCcw size={13} />
                      Reset to Defaults
                    </button>
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
                      No badges added yet. Type a badge name below or click "Reset to Defaults".
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

                {/* SCHEDULE MODE SELECTOR TABS: ALL DAYS | DAY-WISE | DATE-WISE */}
                <div style={{ background: '#f1f5f9', padding: '6px', borderRadius: '12px', marginBottom: '18px', display: 'flex', gap: '6px', border: '1px solid #cbd5e1' }}>
                  <button
                    type="button"
                    onClick={() => setSlotConfigMode('all')}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      background: slotConfigMode === 'all' ? '#ffffff' : 'transparent',
                      color: slotConfigMode === 'all' ? '#1d4ed8' : '#64748b',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      boxShadow: slotConfigMode === 'all' ? '0 2px 5px rgba(37,99,235,0.12)' : 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Clock size={16} color={slotConfigMode === 'all' ? '#2563eb' : '#64748b'} />
                    <span>General (All Days)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSlotConfigMode('day')}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      background: slotConfigMode === 'day' ? '#ffffff' : 'transparent',
                      color: slotConfigMode === 'day' ? '#1d4ed8' : '#64748b',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      boxShadow: slotConfigMode === 'day' ? '0 2px 5px rgba(37,99,235,0.12)' : 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <CalendarDays size={16} color={slotConfigMode === 'day' ? '#2563eb' : '#64748b'} />
                    <span>Day-wise (Weekly)</span>
                    {Object.keys(profileForm.dayWiseSlots || {}).length > 0 && (
                      <span style={{ background: '#dbeafe', color: '#1e40af', padding: '1px 7px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 800 }}>
                        {Object.keys(profileForm.dayWiseSlots || {}).length} custom
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSlotConfigMode('date')}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      background: slotConfigMode === 'date' ? '#ffffff' : 'transparent',
                      color: slotConfigMode === 'date' ? '#1d4ed8' : '#64748b',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      boxShadow: slotConfigMode === 'date' ? '0 2px 5px rgba(37,99,235,0.12)' : 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Calendar size={16} color={slotConfigMode === 'date' ? '#2563eb' : '#64748b'} />
                    <span>Date-wise (Specific Dates)</span>
                    {Object.keys(profileForm.dateWiseSlots || {}).length > 0 && (
                      <span style={{ background: '#fef3c7', color: '#92400e', padding: '1px 7px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 800 }}>
                        {Object.keys(profileForm.dateWiseSlots || {}).length} dates
                      </span>
                    )}
                  </button>
                </div>

                {/* MODE 1: ALL WORKING DAYS */}
                {slotConfigMode === 'all' && (
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                      Active Working Days (Click to toggle on / off)
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                        const currentDays = Array.isArray(profileForm.scheduleDays) ? profileForm.scheduleDays : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                        const isActive = currentDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => handleToggleScheduleDay(day)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 14px',
                              borderRadius: '8px',
                              fontWeight: 700,
                              fontSize: '0.82rem',
                              cursor: 'pointer',
                              border: isActive ? '2px solid #2563eb' : '1px solid #cbd5e1',
                              background: isActive ? '#eff6ff' : '#ffffff',
                              color: isActive ? '#1d4ed8' : '#64748b',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {isActive ? <Check size={14} color="#2563eb" /> : <X size={14} color="#94a3b8" />}
                            <span>{day === 'Mon' ? 'Monday' : day === 'Tue' ? 'Tuesday' : day === 'Wed' ? 'Wednesday' : day === 'Thu' ? 'Thursday' : day === 'Fri' ? 'Friday' : day === 'Sat' ? 'Saturday' : 'Sunday'}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '0.76rem', color: '#64748b' }}>
                      Days checked will display available appointment slots to patients. Unchecked days will show "Clinic Closed / Off".
                    </div>
                  </div>
                )}

                {/* MODE 2: DAY-WISE (WEEKLY) SELECTOR */}
                {slotConfigMode === 'day' && (
                  <div style={{ background: '#f8fafc', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#1e3a8a', margin: 0 }}>
                          Select Day of Week to Customize
                        </label>
                        <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                          Set custom morning/evening timings for specific days or mark individual weekdays as clinic holidays.
                        </span>
                      </div>
                    </div>

                    {/* Day selector pills */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                      {DAYS_LIST.map(dayKey => {
                        const isSelected = selectedScheduleDay === dayKey;
                        const dayConfig = profileForm.dayWiseSlots?.[dayKey];
                        const isDayOff = dayConfig === 'off' || dayConfig?.isOff === true;
                        const hasCustomSlots = Array.isArray(dayConfig) || Array.isArray(dayConfig?.slots);
                        const slotCount = hasCustomSlots 
                          ? (Array.isArray(dayConfig) ? dayConfig.length : dayConfig.slots.length) 
                          : (profileForm.availableSlots?.length || 0);

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
                              border: isSelected ? '2px solid #2563eb' : '1px solid #cbd5e1',
                              background: isSelected ? '#ffffff' : (isDayOff ? '#fff1f2' : (hasCustomSlots ? '#eff6ff' : '#ffffff')),
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
                              background: isDayOff ? '#fee2e2' : (hasCustomSlots ? '#dbeafe' : '#f1f5f9'),
                              color: isDayOff ? '#b91c1c' : (hasCustomSlots ? '#1d4ed8' : '#64748b')
                            }}>
                              {isDayOff ? 'Closed / Off' : (hasCustomSlots ? `${slotCount} Custom` : `General (${slotCount})`)}
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
                          background: profileForm.dayWiseSlots?.[selectedScheduleDay] === 'off' ? '#fee2e2' : (profileForm.dayWiseSlots?.[selectedScheduleDay] ? '#dbeafe' : '#f1f5f9'),
                          color: profileForm.dayWiseSlots?.[selectedScheduleDay] === 'off' ? '#b91c1c' : (profileForm.dayWiseSlots?.[selectedScheduleDay] ? '#1d4ed8' : '#475569')
                        }}>
                          {profileForm.dayWiseSlots?.[selectedScheduleDay] === 'off'
                            ? 'Marked OFF / Clinic Closed'
                            : (profileForm.dayWiseSlots?.[selectedScheduleDay] ? 'Custom Schedule Active' : 'Using General Default Slots')}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={handleToggleDayOff}
                          style={{
                            background: profileForm.dayWiseSlots?.[selectedScheduleDay] === 'off' ? '#10b981' : '#fee2e2',
                            color: profileForm.dayWiseSlots?.[selectedScheduleDay] === 'off' ? '#ffffff' : '#b91c1c',
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
                          {profileForm.dayWiseSlots?.[selectedScheduleDay] === 'off' ? <Check size={12} /> : <X size={12} />}
                          {profileForm.dayWiseSlots?.[selectedScheduleDay] === 'off' ? `Mark ${DAY_NAME_MAP[selectedScheduleDay]} Open` : `Mark ${DAY_NAME_MAP[selectedScheduleDay]} Off / Closed`}
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

                {/* SUBSECTION: TIME SLOTS EDITOR FOR ACTIVE MODE */}
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
                        onClick={slotConfigMode === 'day' ? handleToggleDayOff : handleToggleDateOff}
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
                            onClick={() => handleSlotDurationChange(dur)}
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
                      onChange={(e) => setProfileForm({ ...profileForm, availableDays: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.82rem',
                        boxSizing: 'border-box'
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                              <input
                                type="text"
                                value={editingCareerExp.text}
                                onChange={(e) => setEditingCareerExp({ index: idx, text: e.target.value })}
                                style={{ flex: 1, padding: '4px 8px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #2563eb', outline: 'none' }}
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateCareerExp(idx)}
                                style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCareerExp({ index: null, text: '' })}
                                style={{ background: '#cbd5e1', color: '#334155', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.78rem' }}
                              >
                                Cancel
                              </button>
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
                                  onClick={() => setEditingCareerExp({ index: idx, text: expRole })}
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

                <form onSubmit={handleAddCareerExp} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="e.g. Senior Consultant - Apollo Hospital (2018 - Present)..."
                    value={newCareerExpInput}
                    onChange={(e) => setNewCareerExpInput(e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.88rem' }}
                  />
                  <button
                    type="submit"
                    style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                  >
                    + Add Role
                  </button>
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
                              gap: '8px',
                              background: '#fdf2f8',
                              border: '1px solid #fbcfe8',
                              padding: '7px 12px',
                              borderRadius: '8px',
                              fontSize: '0.84rem'
                            }}
                          >
                            {coverPhoto ? (
                              <img 
                                src={coverPhoto} 
                                alt="Cover" 
                                style={{ width: '22px', height: '30px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }} 
                              />
                            ) : (
                              <Play size={13} color="#db2777" style={{ flexShrink: 0 }} />
                            )}
                            <a
                              href={reelUrl || '#'}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: '#db2777', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}
                            >
                              {reelUrl || 'Cover Photo Uploaded'}
                            </a>
                            {coverPhoto && (
                              <span style={{ fontSize: '0.7rem', color: '#0369a1', background: '#e0f2fe', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                Custom Cover
                              </span>
                            )}
                            <span style={{ fontSize: '0.72rem', color: '#9d174d', background: '#fce7f3', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                              Live on Profile
                            </span>
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
                            gap: '8px',
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            padding: '7px 12px',
                            borderRadius: '8px',
                            fontSize: '0.84rem'
                          }}
                        >
                          <Play size={13} color="#dc2626" style={{ flexShrink: 0 }} />
                          <a
                            href={vidUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: '#dc2626', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}
                          >
                            {vidUrl}
                          </a>
                          <span style={{ fontSize: '0.72rem', color: '#991b1b', background: '#fee2e2', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                            Live on Profile
                          </span>
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
                    { q: `How can I book an appointment with Dr. ${activeDoctor.name || 'the doctor'}?`, a: 'You can book an in-clinic or video consultation directly on The Sehat Buddy platform with instant confirmation.' },
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#ffffff', padding: '12px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{doctorAvgRating}</div>
                <div style={{ display: 'flex', gap: '2px', color: '#f59e0b', marginTop: '4px' }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={14} fill={s <= Math.round(Number(doctorAvgRating)) ? '#f59e0b' : '#e2e8f0'} color={s <= Math.round(Number(doctorAvgRating)) ? '#f59e0b' : '#cbd5e1'} />
                  ))}
                </div>
              </div>
              <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '16px' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>{doctorVerifiedReviews.length} Reviews</div>
                <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>100% Verified Patients</div>
              </div>
            </div>
          </div>

          <div style={{ padding: '24px 28px' }}>
            {doctorVerifiedReviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 16px', color: '#94a3b8' }}>
                <MessageSquare size={48} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
                <h3 style={{ color: '#475569', fontSize: '1.1rem', margin: '0 0 6px 0' }}>No Patient Reviews Yet</h3>
                <p style={{ fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto' }}>
                  When patients submit feedback on the hospital profile or after their clinical consultation, their verified testimonials will appear here.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {doctorVerifiedReviews.map((rev, idx) => (
                  <div
                    key={rev.id || rev._id || idx}
                    style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      border: '1.5px solid #e2e8f0',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                          <h4 style={{ margin: '0 0 2px 0', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                            {rev.patientName || 'Verified Patient'}
                          </h4>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {rev.patientCity || 'Bengaluru'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star
                              key={s}
                              size={14}
                              fill={s <= Number(rev.rating) ? '#f59e0b' : '#e2e8f0'}
                              color={s <= Number(rev.rating) ? '#f59e0b' : '#cbd5e1'}
                            />
                          ))}
                        </div>
                      </div>

                      {rev.treatment && (
                        <div style={{ display: 'inline-block', background: '#eff6ff', color: '#1d4ed8', padding: '3px 10px', borderRadius: '100px', fontSize: '0.74rem', fontWeight: 600, marginBottom: '10px' }}>
                          Treatment: {rev.treatment}
                        </div>
                      )}

                      {rev.title && (
                        <h5 style={{ margin: '0 0 6px 0', fontSize: '0.92rem', fontWeight: 700, color: '#1e293b' }}>
                          {rev.title}
                        </h5>
                      )}

                      <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#475569', lineHeight: 1.55 }}>
                        "{rev.comment}"
                      </p>
                    </div>

                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: '#64748b' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#059669', fontWeight: 600 }}>
                        <CheckCircle2 size={13} color="#059669" /> Verified Patient
                      </span>
                      {rev.insuranceUsed && rev.insuranceUsed !== 'None' && (
                        <span style={{ color: '#0284c7', fontWeight: 600 }}>
                          {rev.insuranceUsed}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
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
    </div>
  );
};

export default DoctorDashboard;
