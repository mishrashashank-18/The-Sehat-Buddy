import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  ExternalLink,
  Building2,
  Camera,
  Plus,
  Trash2,
  Edit3,
  Stethoscope,
  Sparkles,
  ShieldCheck,
  Video,
  HelpCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Bed,
  Check,
  X,
  AlertCircle,
  Loader2,
  Star,
  Search,
  CheckSquare,
  Globe,
  Layers,
  Upload,
  CreditCard,
  FileText,
  Siren,
  Clock,
  Heart,
  Users,
  UserCheck,
  CalendarDays,
  Filter,
  MessageSquare,
  LogOut,
  PlayCircle,
  Play,
  AlertTriangle
} from 'lucide-react';
import { useData } from '../../context/useData';
import { isDoctorInStarList, getDoctorCanonicalId, matchesId } from '../../context/DataContext';
import { api } from '../../services/api';
import { insurancePartners, defaultAcceptedInsurances } from '../../data/insurancePartners';
import DoctorFormModal from './DoctorFormModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import styles from './AdminHospitalEditPage.module.css';

const DEFAULT_SPECIALTIES = [
  'Cardiology',
  'Neurology',
  'Oncology',
  'Orthopedics',
  'Pediatrics',
  'Trauma & Emergency',
  'Gynecology & Obstetrics',
  'Nephrology',
  'General Surgery',
  'Dermatology',
  'Gastroenterology',
  'Robotic Surgery',
  'Pulmonology',
  'Endocrinology',
  'Urology',
  'Ophthalmology'
];

const PRESET_HOSPITAL_IMAGES = [
  {
    name: 'Modern Medical Center',
    url: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'Glass Facade Clinic',
    url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'Metropolitan Care Pavilion',
    url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'Advanced Surgical Pavilion',
    url: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1200&q=80'
  }
];

const PHOTO_CATEGORIES = [
  'Exterior',
  'Interior',
  'Critical Care & ICU',
  'Operation Theater (OT)',
  'Patient Rooms & Suites',
  'Radiology & Diagnostics',
  'Emergency & Trauma',
  'Reception & Lobby',
  'Facility'
];

const POPULAR_INSURANCES = [
  'Star Health & Allied Insurance',
  'HDFC ERGO General Insurance',
  'ICICI Lombard Health Care',
  'Care Health Insurance',
  'Niva Bupa Health Insurance',
  'Bajaj Allianz Health Guard',
  'Tata AIG Medicare',
  'SBI General Insurance',
  'Aditya Birla Health Insurance',
  'New India Assurance',
  'National Insurance Company',
  'Oriental Insurance Company',
  'United India Insurance',
  'ManipalCigna Health Insurance',
  'Reliance General Insurance',
  'Future Generali India Insurance',
  'Universal Sompo General Insurance',
  'Medi Assist TPA',
  'Paramount Health TPA',
  'Vidal Health TPA',
  'Raksha Health Insurance TPA',
  'Heritage Health TPA',
  'MDIndia Health Insurance TPA',
  'Family Health Plan (FHPL) TPA'
];

export const FAQ_ICONS_LIST = [
  { id: 'credit-card', label: 'Cashless / Card', icon: CreditCard, color: '#d97706', bg: '#fef3c7' },
  { id: 'document', label: 'Admission & Docs', icon: FileText, color: '#0284c7', bg: '#e0f2fe' },
  { id: 'emergency', label: 'Emergency 24x7', icon: Siren, color: '#ef4444', bg: '#fee2e2' },
  { id: 'doctor', label: 'Doctor & Consult', icon: Stethoscope, color: '#7c3aed', bg: '#ede9fe' },
  { id: 'shield', label: 'Verified Policy', icon: ShieldCheck, color: '#059669', bg: '#d1fae5' },
  { id: 'clock', label: 'Visiting Hours', icon: Clock, color: '#2563eb', bg: '#eff6ff' },
  { id: 'bed', label: 'Rooms & Beds', icon: Bed, color: '#4f46e5', bg: '#e0e7ff' },
  { id: 'phone', label: 'Contact Phone', icon: Phone, color: '#16a34a', bg: '#dcfce7' },
  { id: 'heart', label: 'Patient Care', icon: Heart, color: '#e11d48', bg: '#ffe4e6' },
  { id: 'help-circle', label: 'General Info', icon: HelpCircle, color: '#475569', bg: '#f1f5f9' }
];

const INITIAL_ER_CASES = [
  { id: 'ER-101', patient: 'Rohan Sharma', age: 45, triage: 'Red (Critical)', condition: 'Acute Chest Pain / STEMI', eta: '5 mins', bedAssigned: 'ICU-B02', status: 'Arriving' },
  { id: 'ER-102', patient: 'Priya Patel', age: 29, triage: 'Yellow (Urgent)', condition: 'Compound Fracture', eta: 'In Facility', bedAssigned: 'Triage-04', status: 'Under Treatment' },
  { id: 'ER-103', patient: 'Deepak Verma', age: 62, triage: 'Green (Standard)', condition: 'High Fever & Dehydration', eta: 'In Facility', bedAssigned: 'Ward-A12', status: 'Observed' }
];

const INITIAL_AMBULANCES = [
  { id: 'AMB-01', type: 'Advanced Cardiac (ICU on Wheels)', driver: 'Suresh Kumar', phone: '+91 98765 43210', status: 'Available', location: 'Hospital Base' },
  { id: 'AMB-02', type: 'Basic Life Support (BLS)', driver: 'Ramesh Singh', phone: '+91 98765 43211', status: 'Dispatched', location: 'MG Road, Transit' },
  { id: 'AMB-03', type: 'Neonatal Care Intensive', driver: 'Manoj Tiwari', phone: '+91 98765 43212', status: 'Available', location: 'Hospital Base' },
  { id: 'AMB-04', type: 'Advanced Life Support (ALS)', driver: 'Vikram Joshi', phone: '+91 98765 43213', status: 'Maintenance', location: 'Workshop Bay 2' }
];

const getYouTubeEmbedUrl = (url) => {
  if (!url) return '';
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : url;
};

const getInstagramEmbedUrl = (url) => {
  if (!url) return '';
  const clean = url.split('?')[0].replace(/\/+$/, '');
  return `${clean}/embed`;
};

const InstagramIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export default function AdminHospitalEditPage({ hospitalId, onNavigate, isHospitalView = false, hospitalData = null }) {
  const {
    hospitals,
    updateHospital,
    refreshHospitals,
    doctors,
    addDoctor,
    updateDoctor,
    deleteDoctor,
    faqs,
    addFaq,
    updateFaq,
    deleteFaq,
    reviews,
    addReview,
    updateReview,
    deleteReview,
    refreshReviews
  } = useData();

  // Fresh refresh from database on page load/mount
  useEffect(() => {
    if (typeof refreshHospitals === 'function') {
      refreshHospitals();
    }
    if (typeof refreshReviews === 'function') {
      refreshReviews();
    }
  }, [hospitalId]);

  // Helper to reliably parse reels whether stored as array of objects, array of strings, or whitespace/comma-delimited string
  const parseReels = (data) => {
    if (!data) return [];
    let list = data;
    if (typeof data === 'string') {
      list = data.includes('http') ? data.trim().split(/\s+/).filter(u => u.startsWith('http')) : data.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (!Array.isArray(list)) return [];
    return list.map(r => {
      if (typeof r === 'string') return { url: r.trim(), coverPhoto: '' };
      return { url: (r?.url || r?.link || '').trim(), coverPhoto: (r?.coverPhoto || r?.cover || '').trim() };
    }).filter(r => r.url || r.coverPhoto);
  };

  const parseVideos = (data) => {
    if (!data) return [];
    let list = data;
    if (typeof data === 'string') {
      list = data.includes('http') ? data.trim().split(/\s+/).filter(u => u.startsWith('http')) : data.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (!Array.isArray(list)) return [];
    return list.map(v => {
      if (typeof v === 'string') return { url: v.trim(), coverPhoto: '' };
      return { url: (v?.url || v?.link || '').trim(), coverPhoto: (v?.coverPhoto || v?.cover || '').trim() };
    }).filter(v => v.url || v.coverPhoto);
  };

  // Find target hospital
  const hospital = useMemo(() => {
    if (hospitalData) return hospitalData;
    if (!hospitalId || !hospitals) return null;
    const cleanId = String(hospitalId).trim().toLowerCase();
    return hospitals.find(h => 
      String(h.id || '').toLowerCase() === cleanId || 
      String(h._id || '').toLowerCase() === cleanId
    );
  }, [hospitals, hospitalId, hospitalData]);

  // Tab State: only active tab is shown (single-page tab switching)
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const saveSuccessTimeoutRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState('');

  const triggerSaveSuccess = useCallback((duration = 3500) => {
    if (saveSuccessTimeoutRef.current) {
      clearTimeout(saveSuccessTimeoutRef.current);
      saveSuccessTimeoutRef.current = null;
    }
    setSaveSuccess(true);
    saveSuccessTimeoutRef.current = setTimeout(() => {
      setSaveSuccess(false);
      saveSuccessTimeoutRef.current = null;
    }, duration);
  }, []);

  useEffect(() => {
    return () => {
      if (saveSuccessTimeoutRef.current) clearTimeout(saveSuccessTimeoutRef.current);
    };
  }, []);

  // Hospital-level Preview Modals State
  const [previewMediaItem, setPreviewMediaItem] = useState(null);
  const [previewFaqItem, setPreviewFaqItem] = useState(null);
  const [faqSearchQuery, setFaqSearchQuery] = useState('');
  const [faqCategoryFilter, setFaqCategoryFilter] = useState('All');

  // ER & Fleet State
  const [erCases] = useState(INITIAL_ER_CASES);
  const [ambulances, setAmbulances] = useState(INITIAL_AMBULANCES);

  const handleDispatchAmbulance = (ambId) => {
    setAmbulances(prev =>
      prev.map(a => (a.id === ambId ? { ...a, status: 'Dispatched', location: 'Dispatched to Emergency Call' } : a))
    );
  };

  // Form State
  const [formData, setFormData] = useState(null);
  const initializedHospitalId = useRef(null);
  const [customSpecialtyInput, setCustomSpecialtyInput] = useState('');
  const [doctorSearch, setDoctorSearch] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('all'); // 'all' | 'star'

  // Insurance State
  const [newInsuranceInput, setNewInsuranceInput] = useState('');
  const [editingInsuranceIndex, setEditingInsuranceIndex] = useState(null);
  const [editingInsuranceName, setEditingInsuranceName] = useState('');
  const [insuranceSearch, setInsuranceSearch] = useState('');

  // Doctor Modals State
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [doctorToEdit, setDoctorToEdit] = useState(null);
  const [deleteDoctorModalState, setDeleteDoctorModalState] = useState({
    isOpen: false,
    doctor: null
  });

  // New Photo Form State
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoTitle, setNewPhotoTitle] = useState('');
  const [newPhotoCategory, setNewPhotoCategory] = useState('Interior');

  // New FAQ Form State
  const [isAddingFaq, setIsAddingFaq] = useState(false);
  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    category: 'General',
    note: '',
    stepsInput: '',
    icon: 'help-circle'
  });
  const [editingFaqId, setEditingFaqId] = useState(null);
  const [customFaqIconPreview, setCustomFaqIconPreview] = useState(null);
  const [isUploadingFaqIcon, setIsUploadingFaqIcon] = useState(false);
  const faqIconInputRef = useRef(null);

  // Direct Media Upload State
  const [uploadingMediaKey, setUploadingMediaKey] = useState(null);
  const [reelUploadProgress, setReelUploadProgress] = useState({});

  // Patient Bookings & Visits Management State
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientStatusFilter, setPatientStatusFilter] = useState('all'); // 'all' | 'Completed' | 'Confirmed' | 'Cancelled'
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedDay, setSelectedDay] = useState('all');
  const [selectedPreset, setSelectedPreset] = useState('all'); // 'all' | 'today' | 'this_month' | 'this_year'

  const fetchHospitalAppointments = useCallback(async () => {
    setLoadingAppointments(true);
    try {
      const data = await api.getAdminAppointments();
      if (Array.isArray(data)) {
        setAppointments(data);
      }
    } catch (err) {
      console.warn('Failed to fetch hospital appointments:', err);
    } finally {
      setLoadingAppointments(false);
    }
  }, []);

  useEffect(() => {
    fetchHospitalAppointments();
    const handleUpdate = () => fetchHospitalAppointments();
    window.addEventListener('sehat_appointments_changed', handleUpdate);
    window.addEventListener('sehat_db_change', handleUpdate);
    return () => {
      window.removeEventListener('sehat_appointments_changed', handleUpdate);
      window.removeEventListener('sehat_db_change', handleUpdate);
    };
  }, [fetchHospitalAppointments]);

  // Appointments strictly linked to this hospital
  const hospitalAppointments = useMemo(() => {
    if (!hospital || !appointments) return [];
    const hospId = String(hospital.id || hospital._id || '').toLowerCase();
    const hospName = String(hospital.name || '').toLowerCase();

    return appointments.filter(apt => {
      const aptHospId = String(apt.hospitalId || apt.hospitalData?._id || apt.hospitalData?.id || '').toLowerCase();
      const aptHospName = String(apt.hospitalData?.name || apt.hospitalName || '').toLowerCase();
      return (aptHospId && aptHospId === hospId) || (aptHospName && aptHospName.includes(hospName));
    });
  }, [hospital, appointments]);

  // Available Years from actual bookings
  const availableYears = useMemo(() => {
    const years = new Set();
    hospitalAppointments.forEach(apt => {
      const rawDate = apt.slotDate || (apt.createdAt ? apt.createdAt.slice(0, 10) : '');
      if (rawDate && rawDate.includes('-')) {
        const y = rawDate.split('-')[0];
        if (y && y.length === 4) years.add(y);
      }
    });
    years.add(new Date().getFullYear().toString());
    return Array.from(years).sort().reverse();
  }, [hospitalAppointments]);

  // Filtered Patients according to Year / Month / Day / Search / Status
  const filteredPatients = useMemo(() => {
    return hospitalAppointments.filter(apt => {
      // 1. Status Filter
      if (patientStatusFilter !== 'all') {
        if (patientStatusFilter === 'Completed' && (apt.status !== 'Completed' && !apt.isCompleted)) return false;
        if (patientStatusFilter === 'Confirmed' && (apt.status !== 'Confirmed' || apt.cancelled || apt.isCompleted)) return false;
        if (patientStatusFilter === 'Cancelled' && (apt.status !== 'Cancelled' && !apt.cancelled)) return false;
      }

      // Date parsing from slotDate (format YYYY-MM-DD) or createdAt
      const rawDate = apt.slotDate || (apt.createdAt ? apt.createdAt.slice(0, 10) : '');
      const parts = rawDate.split('-');
      const aptYear = parts[0] || '';
      const aptMonth = parts[1] || '';
      const aptDay = parts[2] ? parts[2].padStart(2, '0') : '';

      const now = new Date();

      if (selectedPreset === 'today') {
        const todayStr = now.toISOString().slice(0, 10);
        if (rawDate !== todayStr) return false;
      } else if (selectedPreset === 'this_month') {
        const curY = now.getFullYear().toString();
        const curM = String(now.getMonth() + 1).padStart(2, '0');
        if (aptYear !== curY || aptMonth !== curM) return false;
      } else if (selectedPreset === 'this_year') {
        const curY = now.getFullYear().toString();
        if (aptYear !== curY) return false;
      } else {
        if (selectedYear !== 'all' && aptYear !== selectedYear) return false;
        if (selectedMonth !== 'all' && aptMonth !== selectedMonth) return false;
        if (selectedDay !== 'all' && aptDay !== selectedDay.padStart(2, '0')) return false;
      }

      // Search Query
      if (patientSearch.trim()) {
        const q = patientSearch.toLowerCase().trim();
        const pName = (apt.userData?.name || apt.patientName || '').toLowerCase();
        const pPhone = (apt.userData?.phone || apt.patientPhone || '').toLowerCase();
        const pEmail = (apt.userData?.email || apt.patientEmail || '').toLowerCase();
        const pSymptoms = (apt.userData?.symptoms || apt.symptoms || '').toLowerCase();
        const pDept = (apt.department || '').toLowerCase();
        const pToken = String(apt._id || apt.id || '').toLowerCase();
        if (!pName.includes(q) && !pPhone.includes(q) && !pEmail.includes(q) && !pSymptoms.includes(q) && !pDept.includes(q) && !pToken.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [hospitalAppointments, patientStatusFilter, selectedPreset, selectedYear, selectedMonth, selectedDay, patientSearch]);

  // Statistics for selected Year / Month / Day
  const patientStats = useMemo(() => {
    const baseList = hospitalAppointments.filter(apt => {
      const rawDate = apt.slotDate || (apt.createdAt ? apt.createdAt.slice(0, 10) : '');
      const parts = rawDate.split('-');
      const aptYear = parts[0] || '';
      const aptMonth = parts[1] || '';
      const aptDay = parts[2] ? parts[2].padStart(2, '0') : '';
      const now = new Date();

      if (selectedPreset === 'today') {
        return rawDate === now.toISOString().slice(0, 10);
      }
      if (selectedPreset === 'this_month') {
        return aptYear === now.getFullYear().toString() && aptMonth === String(now.getMonth() + 1).padStart(2, '0');
      }
      if (selectedPreset === 'this_year') {
        return aptYear === now.getFullYear().toString();
      }
      if (selectedYear !== 'all' && aptYear !== selectedYear) return false;
      if (selectedMonth !== 'all' && aptMonth !== selectedMonth) return false;
      if (selectedDay !== 'all' && aptDay !== selectedDay.padStart(2, '0')) return false;
      return true;
    });

    const total = baseList.length;
    const visited = baseList.filter(a => a.status === 'Completed' || a.isCompleted).length;
    const upcoming = baseList.filter(a => (a.status === 'Confirmed' || a.status === 'Pending') && !a.cancelled && !a.isCompleted).length;
    const cancelled = baseList.filter(a => a.status === 'Cancelled' || a.cancelled).length;

    return { total, visited, upcoming, cancelled };
  }, [hospitalAppointments, selectedPreset, selectedYear, selectedMonth, selectedDay]);

  const handleUpdatePatientStatus = async (aptId, newStatus) => {
    try {
      await api.updateAdminAppointmentStatus(aptId, {
        status: newStatus,
        isCompleted: newStatus === 'Completed',
        cancelled: newStatus === 'Cancelled'
      });
      setAppointments(prev => prev.map(a => 
        (a._id === aptId || a.id === aptId)
          ? { ...a, status: newStatus, isCompleted: newStatus === 'Completed', cancelled: newStatus === 'Cancelled' }
          : a
      ));
    } catch (err) {
      console.error('Failed to update patient visit status:', err);
    }
  };

  // Public Reviews Management State
  const [isAddingReview, setIsAddingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewRatingFilter, setReviewRatingFilter] = useState('all');
  const [reviewForm, setReviewForm] = useState({
    patientName: '',
    patientCity: 'Bengaluru',
    rating: 5,
    title: '',
    comment: '',
    treatment: '',
    insuranceUsed: 'Star Health & Allied Insurance',
    isVerified: true,
    status: 'approved'
  });

  // Reviews strictly linked to this hospital (deduplicated by ID / content)
  const hospitalReviews = useMemo(() => {
    if (!hospital || !reviews) return [];
    const hospId = String(hospital.id || hospital._id || '').toLowerCase().trim();
    const hospName = String(hospital.name || '').toLowerCase().trim();

    const seenIds = new Set();
    const filtered = [];

    for (const r of reviews) {
      if (r.targetType && r.targetType !== 'hospital') continue;
      const tId = String(r.targetId || '').toLowerCase().trim();
      const tName = String(r.targetName || '').toLowerCase().trim();

      // Strict matching logic:
      // 1. If review has a targetId, it MUST match this hospital's ID strictly.
      let isMatch = false;
      if (tId) {
        isMatch = (tId === hospId);
      } else if (tName && hospName) {
        // 2. Only if targetId is completely absent, fall back to exact hospital name
        isMatch = (tName === hospName || (tName.length > 5 && hospName.includes(tName)) || (hospName.length > 5 && tName.includes(hospName)));
      }

      if (isMatch) {
        const uniqueKey = String(r.id || r._id || `${r.patientName}_${r.comment}`);
        if (!seenIds.has(uniqueKey)) {
          seenIds.add(uniqueKey);
          filtered.push(r);
        }
      }
    }
    return filtered;
  }, [hospital, reviews]);

  // Review Summary Metrics
  const reviewStats = useMemo(() => {
    const total = hospitalReviews.length;
    const avg = total > 0
      ? (hospitalReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / total).toFixed(1)
      : '5.0';
    const fiveStars = hospitalReviews.filter(r => Number(r.rating) === 5).length;
    const verifiedCount = hospitalReviews.filter(r => r.isVerified).length;
    return { total, avg, fiveStars, verifiedCount };
  }, [hospitalReviews]);

  // Filtered Hospital Reviews
  const filteredHospitalReviews = useMemo(() => {
    return hospitalReviews.filter(rev => {
      if (reviewRatingFilter !== 'all' && Number(rev.rating) !== Number(reviewRatingFilter)) {
        return false;
      }
      if (reviewSearch.trim()) {
        const q = reviewSearch.toLowerCase().trim();
        const pName = (rev.patientName || '').toLowerCase();
        const pTitle = (rev.title || '').toLowerCase();
        const pComment = (rev.comment || '').toLowerCase();
        const pTreat = (rev.treatment || '').toLowerCase();
        const pCity = (rev.patientCity || '').toLowerCase();
        const pIns = (rev.insuranceUsed || '').toLowerCase();
        if (!pName.includes(q) && !pTitle.includes(q) && !pComment.includes(q) && !pTreat.includes(q) && !pCity.includes(q) && !pIns.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [hospitalReviews, reviewRatingFilter, reviewSearch]);

  const handleOpenAddReview = () => {
    setEditingReviewId(null);
    setReviewForm({
      patientName: '',
      patientCity: hospital?.city || 'Bengaluru',
      rating: 5,
      title: '',
      comment: '',
      treatment: hospital?.specialties?.[0] || 'General Consultation',
      insuranceUsed: hospital?.acceptedInsurances?.[0] || 'Star Health & Allied Insurance',
      isVerified: true,
      status: 'approved'
    });
    setIsAddingReview(true);
  };

  const handleEditReviewClick = (rev) => {
    setEditingReviewId(rev.id || rev._id);
    setReviewForm({
      patientName: rev.patientName || '',
      patientCity: rev.patientCity || hospital?.city || 'Bengaluru',
      rating: Number(rev.rating) || 5,
      title: rev.title || '',
      comment: rev.comment || '',
      treatment: rev.treatment || '',
      insuranceUsed: rev.insuranceUsed || 'None',
      isVerified: rev.isVerified !== undefined ? Boolean(rev.isVerified) : true,
      status: rev.status || 'approved'
    });
    setIsAddingReview(true);
  };

  const handleDeleteReviewClick = (revId) => {
    if (window.confirm('Are you sure you want to permanently delete this public review? It will be removed immediately from this hospital.')) {
      deleteReview(revId);
    }
  };

  const handleSaveReview = async (e) => {
    e.preventDefault();
    if (isSubmittingReview) return;
    if (!reviewForm.patientName.trim()) {
      alert('Please enter patient name');
      return;
    }
    if (!reviewForm.comment.trim()) {
      alert('Please enter review comment / feedback');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const reviewPayload = {
        patientName: reviewForm.patientName.trim(),
        patientCity: reviewForm.patientCity.trim() || hospital?.city || 'Bengaluru',
        targetType: 'hospital',
        targetId: String(hospital.id || hospital._id || ''),
        targetName: hospital.name || 'Hospital',
        rating: Number(reviewForm.rating) || 5,
        title: reviewForm.title.trim(),
        comment: reviewForm.comment.trim(),
        treatment: reviewForm.treatment.trim(),
        insuranceUsed: reviewForm.insuranceUsed.trim() || 'None',
        isVerified: Boolean(reviewForm.isVerified),
        status: reviewForm.status || 'approved'
      };

      if (editingReviewId) {
        await updateReview(editingReviewId, reviewPayload);
      } else {
        await addReview(reviewPayload);
      }

      setIsAddingReview(false);
      setEditingReviewId(null);
    } catch (err) {
      console.error('Failed to save review:', err);
      alert('Failed to save review. Please check your connection.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Initialize form data when hospital loads
  useEffect(() => {
    if (!hospital) return;

    const currentHospId = String(hospital.id || hospital._id || '');

    // If the hospital is already initialized, synchronize star_doctors and photos if updated from server/DataContext
    if (initializedHospitalId.current === currentHospId && formData !== null) {
      const incomingStarDocs = (Array.isArray(hospital.star_doctors) ? hospital.star_doctors : [])
        .map(d => typeof d === 'object' && d !== null ? (d._id || d.id) : d)
        .filter(Boolean);
      const curStarStr = (formData.star_doctors || []).map(String).sort().join(',');
      const incStarStr = incomingStarDocs.map(String).sort().join(',');
      if (curStarStr !== incStarStr) {
        setFormData(prev => ({ ...prev, star_doctors: incomingStarDocs }));
      }
      return;
    }

    initializedHospitalId.current = currentHospId;

    const existingPhotos = Array.isArray(hospital.photos) ? [...hospital.photos] : [];
    const existingReels = parseReels(hospital.reels);
    const existingVideos = parseVideos(hospital.youtube_videos);

    const existingStarDocs = (Array.isArray(hospital.star_doctors) ? hospital.star_doctors : [])
      .map(d => typeof d === 'object' && d !== null ? (d._id || d.id) : d)
      .filter(Boolean);

    const existingStaffDocs = Array.isArray(hospital.staff_doctors) ? [...hospital.staff_doctors] : [];

    setFormData({
      name: hospital.name || '',
      city: hospital.city || 'Delhi',
      address: hospital.address || '',
      latitude: hospital.latitude !== undefined && hospital.latitude !== null ? hospital.latitude : '',
      longitude: hospital.longitude !== undefined && hospital.longitude !== null ? hospital.longitude : '',
      establishedYear: hospital.establishedYear || 2000,
      totalBeds: hospital.totalBeds || 100,
      availableBeds: hospital.availableBeds !== undefined ? hospital.availableBeds : (hospital.emptyBeds || 20),
      emergency24x7: hospital.emergency24x7 !== undefined ? Boolean(hospital.emergency24x7) : true,
      isVerified: hospital.isVerified !== undefined ? Boolean(hospital.isVerified) : true,
      rating: hospital.rating || 4.8,
      reviews: hospital.reviews || '500+ Reviews',
      phone: hospital.phone || '',
      email: hospital.email || '',
      description: hospital.description || '',
      image: hospital.image || PRESET_HOSPITAL_IMAGES[0].url,
      photos: existingPhotos,
      specialties: hospital.specialties || hospital.specialities || ['Cardiology', 'Neurology', 'Orthopedics'],
      star_doctors: existingStarDocs,
      staff_doctors: existingStaffDocs,
      cashlessInsurance: hospital.cashlessInsurance !== undefined ? Boolean(hospital.cashlessInsurance) : true,
      acceptedInsurances: Array.isArray(hospital.acceptedInsurances) && hospital.acceptedInsurances.length > 0 ? hospital.acceptedInsurances : defaultAcceptedInsurances,
      insuranceHelpline: hospital.insuranceHelpline || '1800-SEHAT-CARE',
      tpaPhone: hospital.tpaHelpdesk?.phone || '',
      tpaEmail: hospital.tpaHelpdesk?.email || '',
      tpaPreAuthTime: hospital.tpaHelpdesk?.preAuthTime || '30 Mins Cashless Pre-Approval',
      instagram: hospital.instagram || '',
      facebook: hospital.facebook || '',
      reels: existingReels,
      youtube_videos: existingVideos
    });
  }, [hospital]);

  if (!hospital) {
    return (
      <div className={styles.editPageWrapper} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Building2 size={48} color="#94a3b8" style={{ marginBottom: '16px' }} />
          <h2>Hospital Not Found</h2>
          <p style={{ color: '#64748b', marginBottom: '20px' }}>
            We could not locate the hospital with ID: <strong>{hospitalId}</strong>
          </p>
          <button onClick={() => onNavigate('admin')} className={styles.backBtn}>
            <ArrowLeft size={16} />
            <span>Return to Admin Panel</span>
          </button>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className={styles.editPageWrapper} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={36} className={styles.spinIcon} color="#2563eb" />
        <p style={{ marginTop: '12px', color: '#64748b' }}>Loading hospital details...</p>
      </div>
    );
  }

  // Hospital FAQs
  const hospitalFaqs = (faqs || []).filter(f => 
    f.targetType === 'hospital' && (
      (f.targetId && String(f.targetId) === String(hospital.id || hospital._id)) ||
      (f.targetName && hospital.name && f.targetName.toLowerCase() === hospital.name.toLowerCase())
    )
  );

  // Field change handler
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setSaveSuccess(false);
  };

  // Specialties
  const handleAddSpecialty = (spec) => {
    const trimmed = spec.trim();
    if (!trimmed || formData.specialties.includes(trimmed)) return;
    setFormData(prev => ({
      ...prev,
      specialties: [...prev.specialties, trimmed]
    }));
    setCustomSpecialtyInput('');
    setSaveSuccess(false);
  };

  const handleRemoveSpecialty = (specToRemove) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specToRemove)
    }));
    setSaveSuccess(false);
  };

  // Photos Gallery
  const handleAddPhoto = () => {
    if (!newPhotoUrl.trim()) return;
    const newPhoto = {
      url: newPhotoUrl.trim(),
      title: newPhotoTitle.trim() || `${formData.name || 'Hospital'} Facility`,
      category: newPhotoCategory || 'Facility'
    };
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, newPhoto]
    }));
    setNewPhotoUrl('');
    setNewPhotoTitle('');
    setSaveSuccess(false);
  };

  const handleRemovePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
    setSaveSuccess(false);
  };

  // Star Doctors toggle with immediate auto-persist across dashboards & public profile
  const handleToggleStarDoctor = async (docOrId) => {
    const docObj = (typeof docOrId === 'object' && docOrId !== null)
      ? docOrId
      : ((doctors || []).find(d => matchesId(d, docOrId)) || { id: docOrId, _id: docOrId });

    const canonicalId = getDoctorCanonicalId(docObj) || String(docOrId);
    const isSelected = isDoctorInStarList(docObj, formData.star_doctors);

    const nextList = isSelected
      ? formData.star_doctors.filter(sd => !isDoctorInStarList(docObj, [sd]))
      : [...formData.star_doctors.filter(sd => !isDoctorInStarList(docObj, [sd])), canonicalId];

    setFormData(prev => ({
      ...prev,
      star_doctors: nextList
    }));
    setSaveSuccess(false);

    // Auto-persist immediately to MongoDB Atlas database
    const targetHospId = hospital?._id || hospitalId || hospital?.id;
    if (targetHospId) {
      try {
        await updateHospital(targetHospId, {
          ...formData,
          star_doctors: nextList
        });
        triggerSaveSuccess(3500);
      } catch (err) {
        console.warn('Auto-save star doctor failed:', err);
      }
    }
  };

  // Doctor CRUD handlers
  const handleOpenAddDoctor = () => {
    setDoctorToEdit({
      hospital: formData.name || hospital.name,
      city: formData.city || hospital.city || 'Delhi',
      department: (formData.specialties && formData.specialties[0]) || 'Cardiology'
    });
    setIsDoctorModalOpen(true);
  };

  const handleOpenEditDoctor = (doc) => {
    setDoctorToEdit(doc);
    setIsDoctorModalOpen(true);
  };

  const handleOpenDeleteDoctor = (doc) => {
    setDeleteDoctorModalState({
      isOpen: true,
      doctor: doc
    });
  };

  const handleConfirmDeleteDoctor = async () => {
    const doc = deleteDoctorModalState.doctor;
    if (!doc) return;
    try {
      await deleteDoctor(doc);
      setFormData(prev => ({
        ...prev,
        star_doctors: prev.star_doctors.filter(sd => !isDoctorInStarList(doc, [sd]))
      }));
      setDeleteDoctorModalState({ isOpen: false, doctor: null });
    } catch (err) {
      console.error('Failed to delete doctor:', err);
    }
  };

  const handleDoctorModalSuccess = () => {
    setIsDoctorModalOpen(false);
    setDoctorToEdit(null);
  };

  // Insurance CRUD Handlers
  const handleAddInsurance = (nameToAdd) => {
    const cleanName = (typeof nameToAdd === 'string' ? nameToAdd : newInsuranceInput).trim();
    if (!cleanName) return;

    // Check duplicate (case-insensitive)
    const exists = formData.acceptedInsurances.some(
      ins => ins.toLowerCase() === cleanName.toLowerCase()
    );
    if (exists) {
      alert(`"${cleanName}" is already in the accepted insurances list.`);
      return;
    }

    setFormData(prev => ({
      ...prev,
      acceptedInsurances: [...prev.acceptedInsurances, cleanName]
    }));
    setNewInsuranceInput('');
    setSaveSuccess(false);
  };

  const handleStartEditInsurance = (index, currentName) => {
    setEditingInsuranceIndex(index);
    setEditingInsuranceName(currentName);
  };

  const handleSaveEditInsurance = (index) => {
    const cleanName = editingInsuranceName.trim();
    if (!cleanName) return;

    // Check duplicate with another item
    const exists = formData.acceptedInsurances.some(
      (ins, i) => i !== index && ins.toLowerCase() === cleanName.toLowerCase()
    );
    if (exists) {
      alert(`Another insurance with the name "${cleanName}" already exists.`);
      return;
    }

    setFormData(prev => {
      const next = [...prev.acceptedInsurances];
      next[index] = cleanName;
      return { ...prev, acceptedInsurances: next };
    });
    setEditingInsuranceIndex(null);
    setEditingInsuranceName('');
    setSaveSuccess(false);
  };

  const handleCancelEditInsurance = () => {
    setEditingInsuranceIndex(null);
    setEditingInsuranceName('');
  };

  const handleDeleteInsurance = (indexToDelete) => {
    setFormData(prev => ({
      ...prev,
      acceptedInsurances: prev.acceptedInsurances.filter((_, idx) => idx !== indexToDelete)
    }));
    if (editingInsuranceIndex === indexToDelete) {
      setEditingInsuranceIndex(null);
      setEditingInsuranceName('');
    }
    setSaveSuccess(false);
  };

  const handleToggleInsurance = (partnerName) => {
    setFormData(prev => {
      const exists = prev.acceptedInsurances.includes(partnerName);
      const nextList = exists
        ? prev.acceptedInsurances.filter(item => item !== partnerName)
        : [...prev.acceptedInsurances, partnerName];
      return { ...prev, acceptedInsurances: nextList };
    });
    setSaveSuccess(false);
  };

  // Reels
  const handleAddReel = () => {
    setFormData(prev => ({
      ...prev,
      reels: [...prev.reels, { url: '', coverPhoto: '' }]
    }));
  };

  const handleUpdateReel = (index, field, value) => {
    setFormData(prev => {
      const next = [...prev.reels];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, reels: next };
    });
    setSaveSuccess(false);
  };

  const handleRemoveReel = async (index) => {
    const updatedReels = formData.reels.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      reels: updatedReels
    }));
    setSaveSuccess(false);

    // Auto-persist immediately to MongoDB database
    const targetHospId = hospital?._id || hospitalId || hospital?.id;
    if (targetHospId && !isHospitalView) {
      try {
        await updateHospital(targetHospId, {
          ...formData,
          reels: updatedReels.filter(r => (typeof r === 'string' ? r.trim() : (r && r.url && r.url.trim())))
        });
        triggerSaveSuccess(3500);
      } catch (err) {
        console.warn('Auto-save reel deletion error:', err);
      }
    }
  };

  // YouTube Videos
  const handleAddVideo = () => {
    setFormData(prev => ({
      ...prev,
      youtube_videos: [...prev.youtube_videos, { url: '', coverPhoto: '' }]
    }));
  };

  const handleUpdateVideo = (index, field, value) => {
    setFormData(prev => {
      const next = [...prev.youtube_videos];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, youtube_videos: next };
    });
    setSaveSuccess(false);
  };

  const handleRemoveVideo = async (index) => {
    const updatedVideos = formData.youtube_videos.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      youtube_videos: updatedVideos
    }));
    setSaveSuccess(false);

    // Auto-persist immediately to MongoDB database
    const targetHospId = hospital?._id || hospitalId || hospital?.id;
    if (targetHospId && !isHospitalView) {
      try {
        await updateHospital(targetHospId, {
          ...formData,
          youtube_videos: updatedVideos.filter(v => (typeof v === 'string' ? v.trim() : (v && v.url && v.url.trim())))
        });
        triggerSaveSuccess(3500);
      } catch (err) {
        console.warn('Auto-save video deletion error:', err);
      }
    }
  };

  // Direct Cover Photo Upload Handler (Reels & Videos)
  const handleMediaCoverUpload = async (e, type, index) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const key = `${type}-${index}`;
    setUploadingMediaKey(key);
    try {
      const url = await api.uploadImage(file, 'sehatbuddy/covers');
      if (type === 'reel') {
        handleUpdateReel(index, 'coverPhoto', url);
      } else {
        handleUpdateVideo(index, 'coverPhoto', url);
      }
    } catch (err) {
      console.warn('API upload failed, using FileReader fallback:', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'reel') {
          handleUpdateReel(index, 'coverPhoto', reader.result);
        } else {
          handleUpdateVideo(index, 'coverPhoto', reader.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingMediaKey(null);
      e.target.value = '';
    }
  };

  // Direct Cloudinary Reel Video Upload Handler
  const handleReelVideoUpload = async (e, index) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const key = `reel-video-${index}`;
    setUploadingMediaKey(key);
    setReelUploadProgress(prev => ({ ...prev, [index]: 10 }));

    try {
      const data = await api.uploadVideo(file, 'sehatbuddy/reels', (percent) => {
        setReelUploadProgress(prev => ({ ...prev, [index]: percent }));
      });

      if (data && data.url) {
        // Auto-set the Cloudinary Video URL
        handleUpdateReel(index, 'url', data.url);
        // Auto-set the Cloudinary instant video thumbnail if coverPhoto is empty or generated
        const autoThumbnail = data.url.replace(/\.[^/.]+$/, '.jpg');
        handleUpdateReel(index, 'coverPhoto', autoThumbnail);
      }
    } catch (err) {
      console.error('Video upload to Cloudinary failed:', err);
      alert(err.message || 'Video upload to Cloudinary failed. Please check your video file.');
    } finally {
      setUploadingMediaKey(null);
      setReelUploadProgress(prev => ({ ...prev, [index]: 100 }));
      e.target.value = '';
    }
  };

  // Direct Instagram Reel to Cloudinary Auto-Converter
  const handleConvertInstagramReel = async (idx) => {
    const raw = formData.reels[idx]?.url;
    if (!raw || !raw.includes('instagram.com')) return;
    const key = `convert-ig-${idx}`;
    setUploadingMediaKey(key);
    try {
      const data = await api.uploadInstagramReel(raw, 'sehatbuddy/reels');
      if (data && data.url) {
        handleUpdateReel(idx, 'url', data.url);
        if (data.coverPhoto) {
          handleUpdateReel(idx, 'coverPhoto', data.coverPhoto);
        }
      }
    } catch (err) {
      console.error('Failed to convert Instagram reel:', err);
      alert(err.message || 'Failed to convert reel to Cloudinary video');
    } finally {
      setUploadingMediaKey(null);
    }
  };

  // Direct FAQ Icon Upload Handler
  const handleFaqIconUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFaqIcon(true);
    try {
      const url = await api.uploadImage(file, 'sehatbuddy/faq_icons');
      setCustomFaqIconPreview(url);
      setFaqForm(prev => ({ ...prev, icon: url }));
    } catch (err) {
      console.warn('API FAQ icon upload failed, falling back to FileReader:', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomFaqIconPreview(reader.result);
        setFaqForm(prev => ({ ...prev, icon: reader.result }));
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingFaqIcon(false);
      e.target.value = '';
    }
  };

  // FAQ management
  const handleSaveFaq = async (e) => {
    e.preventDefault();
    if (!faqForm.question.trim() || !faqForm.answer.trim()) return;

    const stepsArray = faqForm.stepsInput
      ? faqForm.stepsInput.split('\n').map(s => s.trim()).filter(Boolean)
      : [];

    const faqPayload = {
      targetType: 'hospital',
      targetId: hospital.id || hospital._id,
      targetName: formData.name || hospital.name,
      question: faqForm.question.trim(),
      answer: faqForm.answer.trim(),
      category: faqForm.category.trim() || 'General',
      note: faqForm.note.trim(),
      steps: stepsArray,
      icon: faqForm.icon || 'help-circle',
      isActive: true
    };

    if (editingFaqId) {
      await updateFaq(editingFaqId, faqPayload);
    } else {
      await addFaq(faqPayload);
    }

    setFaqForm({ question: '', answer: '', category: 'General', note: '', stepsInput: '', icon: 'help-circle' });
    setCustomFaqIconPreview(null);
    setIsAddingFaq(false);
    setEditingFaqId(null);
  };

  const handleEditFaqClick = (faq) => {
    setEditingFaqId(faq.id || faq._id);
    const isCustom = faq.icon && (
      faq.icon.startsWith('http') ||
      faq.icon.startsWith('data:image') ||
      faq.icon.startsWith('/') ||
      faq.icon.includes('.')
    );
    setFaqForm({
      question: faq.question || '',
      answer: faq.answer || '',
      category: faq.category || 'General',
      note: faq.note || '',
      stepsInput: Array.isArray(faq.steps) ? faq.steps.join('\n') : '',
      icon: faq.icon || 'help-circle'
    });
    setCustomFaqIconPreview(isCustom ? faq.icon : null);
    setIsAddingFaq(true);
  };

  const handleDeleteFaqClick = (faqId) => {
    if (window.confirm('Are you sure you want to delete this hospital FAQ?')) {
      deleteFaq(faqId);
    }
  };

  // Master Save Function
  const handleSaveAll = async () => {
    setIsSaving(true);
    setErrorMessage('');
    setSaveSuccess(false);

    try {
      const payload = {
        name: formData.name.trim(),
        city: formData.city.trim(),
        address: formData.address.trim(),
        latitude: formData.latitude !== '' ? Number(formData.latitude) : null,
        longitude: formData.longitude !== '' ? Number(formData.longitude) : null,
        establishedYear: Number(formData.establishedYear) || 2000,
        totalBeds: Number(formData.totalBeds) || 100,
        availableBeds: Number(formData.availableBeds) || 0,
        emptyBeds: Number(formData.availableBeds) || 0,
        emergency24x7: Boolean(formData.emergency24x7),
        isVerified: Boolean(formData.isVerified),
        rating: Number(formData.rating) || 4.8,
        reviews: formData.reviews || '500+ Reviews',
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        description: formData.description.trim(),
        image: formData.image,
        photos: formData.photos,
        specialties: formData.specialties,
        specialities: formData.specialties,
        star_doctors: formData.star_doctors,
        staff_doctors: formData.staff_doctors,
        cashlessInsurance: Boolean(formData.cashlessInsurance),
        acceptedInsurances: formData.acceptedInsurances,
        insuranceHelpline: formData.insuranceHelpline.trim(),
        tpaHelpdesk: {
          phone: formData.tpaPhone.trim(),
          email: formData.tpaEmail.trim(),
          preAuthTime: formData.tpaPreAuthTime.trim()
        },
        instagram: formData.instagram.trim(),
        facebook: formData.facebook.trim(),
        reels: formData.reels.filter(r => (typeof r === 'string' ? r.trim() : (r && r.url && r.url.trim()))),
        youtube_videos: formData.youtube_videos.filter(v => (typeof v === 'string' ? v.trim() : (v && v.url && v.url.trim())))
      };

      if (isHospitalView) {
        delete payload.reels;
        delete payload.youtube_videos;
      }

      const targetHospId = hospital?._id || hospitalId || hospital?.id;
      await updateHospital(targetHospId, payload);
      triggerSaveSuccess(5000);
      if (typeof refreshHospitals === 'function') {
        refreshHospitals();
      }
    } catch (err) {
      console.error('Error updating hospital profile:', err);
      setErrorMessage(err.message || 'Failed to update hospital. Please check backend connection.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.editPageWrapper}>
      {/* Top Header Bar */}
      <div className={styles.topBar}>
        <div className={styles.topBarInner}>
          <div className={styles.topLeftGroup}>
            {isHospitalView ? (
              <div className={styles.hospitalBrandPill}>
                <Building2 size={16} color="#2563eb" />
                <span>Hospital Facility Portal</span>
              </div>
            ) : (
              <button
                type="button"
                className={styles.backBtn}
                onClick={() => onNavigate('admin')}
                title="Return to Admin Hospitals Directory"
              >
                <ArrowLeft size={16} />
                <span>Back to Hospitals</span>
              </button>
            )}

            <div className={styles.titleArea}>
              <div className={styles.breadcrumb}>
                {isHospitalView ? (
                  <>
                    <span>Hospital Portal</span>
                    <span>/</span>
                    <span className={styles.breadcrumbCurrent}>Facility Operations</span>
                  </>
                ) : (
                  <>
                    <span>Admin Panel</span>
                    <span>/</span>
                    <span>Hospitals</span>
                    <span>/</span>
                    <span className={styles.breadcrumbCurrent}>Edit Center</span>
                  </>
                )}
              </div>
              <h1 className={styles.pageHeading}>
                {formData.name || 'Hospital Dashboard'}
                {formData.isVerified && (
                  <span className={styles.verifiedBadge}>
                    <ShieldCheck size={13} />
                    Verified Facility Account
                  </span>
                )}
              </h1>
            </div>
          </div>

          <div className={styles.topActionsGroup}>
            {saveSuccess && (
              <div className={styles.saveNotice}>
                <CheckCircle2 size={16} color="#166534" />
                <span>Changes saved to Database & Live Page!</span>
              </div>
            )}

            {errorMessage && (
              <div style={{ color: '#dc2626', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="button"
              className={styles.liveViewBtn}
              onClick={() => onNavigate('hospital-profile', hospital.id || hospital._id)}
              title="Preview changes directly on the live hospital page without reloading"
            >
              <ExternalLink size={15} />
              <span>View Live Center</span>
            </button>

            <button
              type="button"
              className={styles.saveBtn}
              onClick={handleSaveAll}
              disabled={isSaving}
              title="Save all changes to backend database and sync frontend"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className={styles.spinIcon} />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save All Changes</span>
                </>
              )}
            </button>

            {isHospitalView && (
              <button
                type="button"
                className={styles.logoutBtn}
                onClick={() => {
                  localStorage.removeItem('hospital_token');
                  localStorage.removeItem('hospital_user');
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  window.location.href = '/hospital';
                }}
                title="Sign out of hospital account"
              >
                <LogOut size={15} />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Executive Overview Section */}
      <div className={styles.overviewSection}>
        <div className={styles.overviewContainer}>
          {/* Facility Hero Banner */}
          <div className={styles.overviewHeroCard}>
            <div className={styles.overviewHeroMain}>
              <div className={styles.overviewImgWrapper}>
                <img
                  src={formData.image || PRESET_HOSPITAL_IMAGES[0].url}
                  alt={formData.name}
                  className={styles.overviewImg}
                  onError={(e) => {
                    e.target.src = PRESET_HOSPITAL_IMAGES[0].url;
                  }}
                />
                <span className={styles.overviewImgTag}>
                  Est. {formData.establishedYear || '1991'}
                </span>
              </div>

              <div className={styles.overviewDetails}>
                <div className={styles.overviewBadgeRow}>
                  {formData.isVerified && (
                    <span className={styles.overviewBadgeVerified}>
                      <ShieldCheck size={13} />
                      Verified Facility
                    </span>
                  )}
                  {formData.emergency24x7 && (
                    <span className={styles.overviewBadgeEmergency}>
                      <Siren size={13} />
                      24/7 Trauma & Emergency
                    </span>
                  )}
                  <span className={styles.overviewBadgeCity}>
                    <MapPin size={12} />
                    {formData.city}
                  </span>
                </div>

                <h2 className={styles.overviewTitle}>{formData.name}</h2>
                <p className={styles.overviewAddress}>
                  <MapPin size={14} className={styles.overviewAddressPin} />
                  <span>{formData.address || 'Address not configured'}</span>
                </p>

                <div className={styles.overviewMetaRow}>
                  <div className={styles.overviewMetaItem}>
                    <div className={styles.overviewRatingPill}>
                      <Star size={13} fill="#f59e0b" color="#f59e0b" />
                      <strong>{formData.rating || 4.8}</strong>
                    </div>
                    <span className={styles.overviewReviewsText}>{formData.reviews || '500+ Reviews'}</span>
                  </div>

                  {formData.phone && (
                    <div className={styles.overviewMetaItem}>
                      <Phone size={13} color="#0284c7" />
                      <span>{formData.phone}</span>
                    </div>
                  )}

                  {formData.email && (
                    <div className={styles.overviewMetaItem}>
                      <Mail size={13} color="#64748b" />
                      <span>{formData.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.overviewHeroRight}>
              <div className={styles.occupancyWidget}>
                <div className={styles.occupancyWidgetHeader}>
                  <span className={styles.occupancyLabel}>Live Inpatient Occupancy</span>
                  <span className={styles.occupancyPercent}>
                    {formData.totalBeds > 0
                      ? `${Math.min(100, Math.max(0, Math.round(((Number(formData.totalBeds) - Number(formData.availableBeds)) / Number(formData.totalBeds)) * 100)))}%`
                      : '0%'}
                  </span>
                </div>
                <div className={styles.occupancyTrack}>
                  <div
                    className={styles.occupancyFill}
                    style={{
                      width: `${formData.totalBeds > 0 ? Math.min(100, Math.max(0, Math.round(((Number(formData.totalBeds) - Number(formData.availableBeds)) / Number(formData.totalBeds)) * 100))) : 0}%`,
                      backgroundColor:
                        Number(formData.availableBeds) <= 5 ? '#ef4444' : Number(formData.availableBeds) <= 20 ? '#f59e0b' : '#10b981'
                    }}
                  />
                </div>
                <div className={styles.occupancyFooter}>
                  <span><strong>{formData.availableBeds}</strong> Vacant Beds</span>
                  <span><strong>{formData.totalBeds}</strong> Total Capacity</span>
                </div>
              </div>

              <div className={styles.overviewLiveIndicator}>
                <span className={styles.pulseDot} />
                <span>Facility System Online & Synced</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Stat Cards Grid */}
          <div className={styles.metricsGrid}>
            <div
              className={`${styles.metricCard} ${activeTab === 'general' ? styles.metricCardActive : ''}`}
              onClick={() => {
                setActiveTab('general');
                window.scrollTo({ top: 460, behavior: 'smooth' });
              }}
              title="Click to view & update Bed Capacity"
            >
              <div className={styles.metricCardIcon} style={{ background: '#ecfdf5', color: '#059669' }}>
                <Bed size={20} />
              </div>
              <div className={styles.metricCardContent}>
                <span className={styles.metricCardLabel}>Available Bed Capacity</span>
                <div className={styles.metricCardNumberRow}>
                  <strong className={styles.metricCardVal}>{formData.availableBeds}</strong>
                  <span className={styles.metricCardSub}>/ {formData.totalBeds} Total</span>
                </div>
                <span className={styles.metricCardHint}>
                  {formData.emergency24x7 ? '24/7 ER Ready' : 'Standard Inpatient'}
                </span>
              </div>
            </div>

            <div
              className={`${styles.metricCard} ${activeTab === 'doctors' ? styles.metricCardActive : ''}`}
              onClick={() => {
                setActiveTab('doctors');
                window.scrollTo({ top: 460, behavior: 'smooth' });
              }}
              title="Click to manage Star Doctors & Specialists"
            >
              <div className={styles.metricCardIcon} style={{ background: '#fffbeb', color: '#d97706' }}>
                <Sparkles size={20} />
              </div>
              <div className={styles.metricCardContent}>
                <span className={styles.metricCardLabel}>Specialists & Doctors</span>
                <div className={styles.metricCardNumberRow}>
                  <strong className={styles.metricCardVal}>{formData.star_doctors?.length || 0}</strong>
                  <span className={styles.metricCardSub}>Star Docs</span>
                </div>
                <span className={styles.metricCardHint}>
                  {(doctors || []).length} registered clinicians
                </span>
              </div>
            </div>

            <div
              className={`${styles.metricCard} ${activeTab === 'specialties' ? styles.metricCardActive : ''}`}
              onClick={() => {
                setActiveTab('specialties');
                window.scrollTo({ top: 460, behavior: 'smooth' });
              }}
              title="Click to manage Clinical Specialties"
            >
              <div className={styles.metricCardIcon} style={{ background: '#eff6ff', color: '#2563eb' }}>
                <Layers size={20} />
              </div>
              <div className={styles.metricCardContent}>
                <span className={styles.metricCardLabel}>Departments & Care</span>
                <div className={styles.metricCardNumberRow}>
                  <strong className={styles.metricCardVal}>{formData.specialties?.length || 0}</strong>
                  <span className={styles.metricCardSub}>Departments</span>
                </div>
                <span className={styles.metricCardHint}>
                  Active patient care lines
                </span>
              </div>
            </div>

            <div
              className={`${styles.metricCard} ${activeTab === 'patients' ? styles.metricCardActive : ''}`}
              onClick={() => {
                setActiveTab('patients');
                window.scrollTo({ top: 460, behavior: 'smooth' });
              }}
              title="Click to manage Booked Patients"
            >
              <div className={styles.metricCardIcon} style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                <Users size={20} />
              </div>
              <div className={styles.metricCardContent}>
                <span className={styles.metricCardLabel}>Booked Patients</span>
                <div className={styles.metricCardNumberRow}>
                  <strong className={styles.metricCardVal}>{patientStats.total || hospitalAppointments.length}</strong>
                  <span className={styles.metricCardSub}>Appointments</span>
                </div>
                <span className={styles.metricCardHint}>
                  {patientStats.upcoming} Pending • {patientStats.visited} Completed
                </span>
              </div>
            </div>

            <div
              className={`${styles.metricCard} ${activeTab === 'er-fleet' ? styles.metricCardActive : ''}`}
              onClick={() => {
                setActiveTab('er-fleet');
                window.scrollTo({ top: 460, behavior: 'smooth' });
              }}
              title="Click to view ER Triage & Ambulance Fleet"
            >
              <div className={styles.metricCardIcon} style={{ background: '#fef2f2', color: '#dc2626' }}>
                <Siren size={20} />
              </div>
              <div className={styles.metricCardContent}>
                <span className={styles.metricCardLabel}>ER & Ambulance Fleet</span>
                <div className={styles.metricCardNumberRow}>
                  <strong className={styles.metricCardVal}>
                    {ambulances.filter(a => a.status === 'Available').length}
                  </strong>
                  <span className={styles.metricCardSub}>Ambulances Ready</span>
                </div>
                <span className={styles.metricCardHint}>
                  {erCases.length} Active ER Triage cases
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation: Direct Page Headings */}
      <div className={styles.tabsBar}>
        <div className={styles.tabsContainer}>
          <button
            type="button"
            className={`${styles.navTab} ${activeTab === 'general' ? styles.navTabActive : ''}`}
            onClick={() => {
              setActiveTab('general');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <Building2 size={15} />
            <span>General & Capacity</span>
          </button>

          <button
            type="button"
            className={`${styles.navTab} ${activeTab === 'media' ? styles.navTabActive : ''}`}
            onClick={() => {
              setActiveTab('media');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <Camera size={15} />
            <span>Photos & Showcase</span>
            <span className={styles.tabBadge}>{formData.photos.length + 1}</span>
          </button>

          <button
            type="button"
            className={`${styles.navTab} ${activeTab === 'specialties' ? styles.navTabActive : ''}`}
            onClick={() => {
              setActiveTab('specialties');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <Stethoscope size={15} />
            <span>Departments & Specialties</span>
            <span className={styles.tabBadge}>{formData.specialties.length}</span>
          </button>

          <button
            type="button"
            className={`${styles.navTab} ${activeTab === 'doctors' ? styles.navTabActive : ''}`}
            onClick={() => {
              setActiveTab('doctors');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <Sparkles size={15} />
            <span>Star Doctors & Staff</span>
            <span className={styles.tabBadge}>{formData.star_doctors.length}</span>
          </button>

          <button
            type="button"
            className={`${styles.navTab} ${activeTab === 'insurance' ? styles.navTabActive : ''}`}
            onClick={() => {
              setActiveTab('insurance');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <CheckSquare size={15} />
            <span>Insurance & Cashless Desk</span>
          </button>

          <button
            type="button"
            className={`${styles.navTab} ${activeTab === 'social-reels' ? styles.navTabActive : ''}`}
            onClick={() => {
              setActiveTab('social-reels');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <Video size={15} />
            <span>Reels & Videos</span>
            <span className={styles.tabBadge}>{formData.reels.length + formData.youtube_videos.length}</span>
          </button>

          <button
            type="button"
            className={`${styles.navTab} ${activeTab === 'faqs' ? styles.navTabActive : ''}`}
            onClick={() => {
              setActiveTab('faqs');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <HelpCircle size={15} />
            <span>Hospital FAQs</span>
            <span className={styles.tabBadge}>{hospitalFaqs.length}</span>
          </button>

          <button
            type="button"
            className={`${styles.navTab} ${activeTab === 'patients' ? styles.navTabActive : ''}`}
            onClick={() => {
              setActiveTab('patients');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <Users size={15} />
            <span>Booked Patients & Visits</span>
            <span className={styles.tabBadge}>{hospitalAppointments.length}</span>
          </button>

          <button
            type="button"
            className={`${styles.navTab} ${activeTab === 'reviews' ? styles.navTabActive : ''}`}
            onClick={() => {
              setActiveTab('reviews');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <MessageSquare size={15} />
            <span>Public Reviews</span>
            <span className={styles.tabBadge}>{hospitalReviews.length}</span>
          </button>

          <button
            type="button"
            className={`${styles.navTab} ${activeTab === 'er-fleet' ? styles.navTabActive : ''}`}
            onClick={() => {
              setActiveTab('er-fleet');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <Siren size={15} />
            <span>ER & Fleet</span>
            <span className={styles.tabBadge}>3 Active</span>
          </button>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className={styles.mainContent}>

        {/* TAB 1: GENERAL & CAPACITY */}
        {activeTab === 'general' && (
          <div id="section-general">
            <div className={styles.cardSection}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>
                    <Building2 size={20} color="#2563eb" />
                    General Hospital Information
                  </h2>
                  <p className={styles.sectionSubtitle}>
                    Basic institutional details, addresses, and public reputation metrics.
                  </p>
                </div>
              </div>

              <div className={styles.gridTwo}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Hospital Name *</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="e.g. Manipal Hospital Old Airport Road"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>City *</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="e.g. Bengaluru, Delhi, Mumbai"
                  />
                </div>
              </div>

              <div className={styles.formGroup} style={{ marginTop: '16px' }}>
                <label className={styles.formLabel}>Street Address *</label>
                <input
                  type="text"
                  className={styles.inputField}
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="e.g. 98, HAL Old Airport Rd, Kodihalli, Bengaluru, Karnataka 560017"
                />
              </div>

              <div className={styles.gridTwo} style={{ marginTop: '16px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <MapPin size={14} />
                    Latitude (For Live Directions & Route)
                  </label>
                  <input
                    type="number"
                    step="any"
                    className={styles.inputField}
                    value={formData.latitude}
                    onChange={(e) => handleChange('latitude', e.target.value)}
                    placeholder="e.g. 12.9592"
                  />
                  <span className={styles.helperText}>Used for real-time GPS distance calculation</span>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <MapPin size={14} />
                    Longitude (For Live Directions & Route)
                  </label>
                  <input
                    type="number"
                    step="any"
                    className={styles.inputField}
                    value={formData.longitude}
                    onChange={(e) => handleChange('longitude', e.target.value)}
                    placeholder="e.g. 77.6499"
                  />
                  <span className={styles.helperText}>Used for real-time GPS distance calculation</span>
                </div>
              </div>

              <div className={styles.gridThree} style={{ marginTop: '16px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Established Year</label>
                  <input
                    type="number"
                    className={styles.inputField}
                    value={formData.establishedYear}
                    onChange={(e) => handleChange('establishedYear', e.target.value)}
                    placeholder="e.g. 1991"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Star Rating (Out of 5.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    className={styles.inputField}
                    value={formData.rating}
                    onChange={(e) => handleChange('rating', e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Reviews Text</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={formData.reviews}
                    onChange={(e) => handleChange('reviews', e.target.value)}
                    placeholder="e.g. 1,400+ Reviews"
                  />
                </div>
              </div>
            </div>

            {/* Bed Capacity & Verification */}
            <div className={styles.cardSection}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>
                    <Bed size={20} color="#2563eb" />
                    Bed Capacity & Service Status
                  </h2>
                  <p className={styles.sectionSubtitle}>
                    Real-time available capacity and emergency readiness badges.
                  </p>
                </div>
              </div>

              <div className={styles.gridTwo}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Total Hospital Beds</label>
                  <input
                    type="number"
                    className={styles.inputField}
                    value={formData.totalBeds}
                    onChange={(e) => handleChange('totalBeds', e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Available / Vacant Beds</label>
                  <input
                    type="number"
                    className={styles.inputField}
                    value={formData.availableBeds}
                    onChange={(e) => handleChange('availableBeds', e.target.value)}
                  />
                  <span className={styles.helperText}>Live bed capacity displayed on hospital cards</span>
                </div>
              </div>

              <div className={styles.gridTwo} style={{ marginTop: '20px' }}>
                <div className={styles.toggleRow}>
                  <div className={styles.toggleLabel}>
                    <span className={styles.toggleTitle}>24x7 Emergency Services</span>
                    <span className={styles.toggleDesc}>Show round-the-clock emergency care badge</span>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={formData.emergency24x7}
                      onChange={(e) => handleChange('emergency24x7', e.target.checked)}
                    />
                    <span className={styles.slider} />
                  </label>
                </div>

                <div className={styles.toggleRow}>
                  <div className={styles.toggleLabel}>
                    <span className={styles.toggleTitle}>Verified Hospital Center</span>
                    <span className={styles.toggleDesc}>Show green verified badge on profile and search</span>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={formData.isVerified}
                      onChange={(e) => handleChange('isVerified', e.target.checked)}
                    />
                    <span className={styles.slider} />
                  </label>
                </div>
              </div>
            </div>

            {/* Facility Description */}
            <div className={styles.cardSection}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>
                    <Edit3 size={20} color="#2563eb" />
                    About This Facility (Detailed Overview)
                  </h2>
                  <p className={styles.sectionSubtitle}>
                    Comprehensive write-up explaining hospital highlights, awards, and center background.
                  </p>
                </div>
              </div>

              <div className={styles.formGroup}>
                <textarea
                  className={styles.textareaField}
                  rows={6}
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Enter full hospital description. Paragraphs will be cleanly formatted with an expandable 'Show More' toggle on the hospital profile..."
                />
              </div>
            </div>
          </div>
        )}
        {/* TAB 2: PHOTOS & SHOWCASE */}
        {activeTab === 'media' && (
          <div id="section-media">
            {/* Primary Hero Image */}
            <div className={styles.cardSection}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>
                    <Camera size={20} color="#2563eb" />
                    Primary Campus Hero Photo
                  </h2>
                  <p className={styles.sectionSubtitle}>
                    The main prominent photograph displayed in hospital cards and hero banner.
                  </p>
                </div>
              </div>

              <div className={styles.gridTwo}>
                <div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Hero Image URL</label>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={formData.image}
                      onChange={(e) => handleChange('image', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    <label className={styles.formLabel}>Or Select from Presets:</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '8px' }}>
                      {PRESET_HOSPITAL_IMAGES.map((preset, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleChange('image', preset.url)}
                          style={{
                            border: formData.image === preset.url ? '2px solid #2563eb' : '1px solid #cbd5e1',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            background: '#ffffff'
                          }}
                        >
                          <img src={preset.url} alt={preset.name} style={{ width: '100%', height: '70px', objectFit: 'cover' }} />
                          <div style={{ padding: '6px 8px', fontSize: '0.74rem', fontWeight: 600, color: '#334155' }}>
                            {preset.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className={styles.formLabel}>Hero Image Preview</label>
                  <div style={{ width: '100%', height: '220px', borderRadius: '10px', overflow: 'hidden', border: '1.5px solid #cbd5e1', position: 'relative' }}>
                    <img
                      src={formData.image}
                      alt="Hero Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.src = PRESET_HOSPITAL_IMAGES[0].url; }}
                    />
                    <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(15, 23, 42, 0.8)', color: 'white', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                      Primary Campus Hero
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Photo Showcase Gallery */}
            <div className={styles.cardSection}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>
                    <Camera size={20} color="#2563eb" />
                    Facility Showcase Gallery & Lightbox ({formData.photos.length} Photos)
                  </h2>
                  <p className={styles.sectionSubtitle}>
                    All interior, exterior, OT, suite, and lab photos shown in the user photo lightbox.
                  </p>
                </div>
              </div>

              {/* Add New Photo Box */}
              <div className={styles.addBox}>
                <div className={styles.addBoxHeader}>
                  <Plus size={16} />
                  <span>Add New Photo to Gallery</span>
                </div>

                <div className={styles.gridThree}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Image Direct URL *</label>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={newPhotoUrl}
                      onChange={(e) => setNewPhotoUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Photo Title / Description</label>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={newPhotoTitle}
                      onChange={(e) => setNewPhotoTitle(e.target.value)}
                      placeholder="e.g. Critical Care ICU Unit"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Category</label>
                    <select
                      className={styles.selectField}
                      value={newPhotoCategory}
                      onChange={(e) => setNewPhotoCategory(e.target.value)}
                    >
                      {PHOTO_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={handleAddPhoto}
                    disabled={!newPhotoUrl.trim()}
                    style={{
                      background: '#2563eb',
                      color: 'white',
                      border: 'none',
                      padding: '8px 18px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Plus size={15} />
                    <span>Add to Showcase</span>
                  </button>
                </div>
              </div>

              {/* Gallery Grid */}
              <div className={styles.photoGrid}>
                {formData.photos.map((photo, idx) => (
                  <div key={idx} className={styles.photoCard}>
                    <div className={styles.photoImgWrapper}>
                      <img
                        src={typeof photo === 'string' ? photo : photo.url}
                        alt={photo.title || `Photo ${idx + 1}`}
                        className={styles.photoImg}
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80';
                        }}
                      />
                      <button
                        type="button"
                        className={styles.photoDeleteBtn}
                        onClick={() => handleRemovePhoto(idx)}
                        title="Delete photo from gallery"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className={styles.photoMeta}>
                      <span className={styles.categoryTag}>
                        {typeof photo === 'object' && photo.category ? photo.category : 'Facility'}
                      </span>
                      <strong style={{ fontSize: '0.86rem', color: '#0f172a' }}>
                        {typeof photo === 'object' && photo.title ? photo.title : `Facility View #${idx + 1}`}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* TAB 3: DEPARTMENTS & SPECIALTIES */}
        {activeTab === 'specialties' && (
          <div id="section-specialties" className={styles.cardSection}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>
                  <Stethoscope size={20} color="#2563eb" />
                  Departments & Key Clinical Specialties
                </h2>
                <p className={styles.sectionSubtitle}>
                  Add or remove specialties offered at this facility. Badges are interactive on the hospital page.
                </p>
              </div>
            </div>

            {/* Current Active Specialties */}
            <label className={styles.formLabel}>Current Specialties ({formData.specialties.length})</label>
            <div className={styles.badgeWrap}>
              {formData.specialties.map((spec, idx) => (
                <span key={idx} className={styles.tagBadge}>
                  <Stethoscope size={13} />
                  <span>{spec}</span>
                  <button
                    type="button"
                    className={styles.tagRemoveBtn}
                    onClick={() => handleRemoveSpecialty(spec)}
                    title={`Remove ${spec}`}
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>

            {/* Add Custom Specialty Input */}
            <div style={{ marginTop: '24px' }}>
              <label className={styles.formLabel}>Add Custom Department</label>
              <div style={{ display: 'flex', gap: '10px', maxWidth: '500px', marginTop: '6px' }}>
                <input
                  type="text"
                  className={styles.inputField}
                  value={customSpecialtyInput}
                  onChange={(e) => setCustomSpecialtyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSpecialty(customSpecialtyInput);
                    }
                  }}
                  placeholder="e.g. Pediatric Cardiology"
                />
                <button
                  type="button"
                  onClick={() => handleAddSpecialty(customSpecialtyInput)}
                  style={{
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Plus size={16} />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Quick Pick List */}
            <div style={{ marginTop: '24px' }}>
              <label className={styles.formLabel}>Quick-Add Common Medical Specialties</label>
              <div className={styles.quickPickWrap}>
                {DEFAULT_SPECIALTIES.filter(s => !formData.specialties.includes(s)).map((spec, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={styles.quickPickBtn}
                    onClick={() => handleAddSpecialty(spec)}
                  >
                    + {spec}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* TAB 4: STAR DOCTORS & STAFF */}
        {activeTab === 'doctors' && (
          <div id="section-doctors" className={styles.cardSection}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>
                  <Sparkles size={20} color="#f59e0b" />
                  Doctors & Clinical Specialists ({formData.star_doctors.length} Star Doctors)
                </h2>
                <p className={styles.sectionSubtitle}>
                  Add, edit, or delete doctors for this hospital. Highlight your top specialists to showcase in the "Star Doctors & Clinical Leaders" section.
                </p>
              </div>

              <button
                type="button"
                className={styles.addDoctorBtn}
                onClick={handleOpenAddDoctor}
              >
                <Plus size={16} />
                <span>Add New Doctor</span>
              </button>
            </div>

            {/* Doctor Search & Filters Toolbar */}
            <div className={styles.doctorToolbar}>
              <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
                <input
                  type="text"
                  className={styles.inputField}
                  style={{ paddingLeft: '36px' }}
                  placeholder="Search doctors by name or specialty..."
                  value={doctorSearch}
                  onChange={(e) => setDoctorSearch(e.target.value)}
                />
              </div>

              <div className={styles.doctorFilterPills}>
                <button
                  type="button"
                  className={`${styles.doctorFilterPill} ${doctorFilter === 'all' ? styles.doctorFilterPillActive : ''}`}
                  onClick={() => setDoctorFilter('all')}
                >
                  All Doctors ({(doctors || []).length})
                </button>
                <button
                  type="button"
                  className={`${styles.doctorFilterPill} ${doctorFilter === 'star' ? styles.doctorFilterPillActive : ''}`}
                  onClick={() => setDoctorFilter('star')}
                >
                  ⭐ Star Doctors ({formData.star_doctors.length})
                </button>
              </div>
            </div>

            {/* Doctors Grid */}
            <div className={styles.doctorSelectGrid}>
              {(doctors || [])
                .filter(doc => {
                  const isSelected = isDoctorInStarList(doc, formData.star_doctors);
                  if (doctorFilter === 'star' && !isSelected) return false;

                  if (!doctorSearch.trim()) return true;
                  const query = doctorSearch.toLowerCase();
                  return (
                    (doc.name || '').toLowerCase().includes(query) ||
                    (doc.specialty || doc.specialization || '').toLowerCase().includes(query) ||
                    (doc.hospital || '').toLowerCase().includes(query)
                  );
                })
                .map((doc) => {
                  const docId = doc.id || doc._id;
                  const isSelected = isDoctorInStarList(doc, formData.star_doctors);

                  return (
                    <div
                      key={docId}
                      className={`${styles.doctorCard} ${isSelected ? styles.doctorCardSelected : ''}`}
                    >
                      <div className={styles.docCardTop}>
                        <img
                          src={doc.image || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80'}
                          alt={doc.name}
                          className={styles.docAvatar}
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80';
                          }}
                        />
                        <div className={styles.docInfo}>
                          <h4 className={styles.docName}>{doc.name}</h4>
                          <p className={styles.docSpecialty}>{doc.specialty || doc.specialization || 'Consultant'}</p>
                          <div className={styles.docMetaRow}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#f59e0b', fontWeight: 600 }}>
                              <Star size={12} fill="#f59e0b" />
                              {doc.rating || 4.8}
                            </span>
                            <span>•</span>
                            <span>{doc.experience || '5+ Years'}</span>
                            {doc.price && (
                              <>
                                <span>•</span>
                                <span style={{ fontWeight: 600, color: '#0f172a' }}>₹{doc.price}</span>
                              </>
                            )}
                          </div>
                          {doc.hospital && (
                            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Building2 size={11} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.hospital}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className={styles.docCardActions}>
                        <button
                          type="button"
                          className={`${styles.starToggleBtn} ${isSelected ? styles.starToggleActive : styles.starToggleInactive}`}
                          onClick={() => handleToggleStarDoctor(doc)}
                          title={isSelected ? 'Remove from Star Doctors' : 'Set as Star Doctor'}
                        >
                          <Sparkles size={13} fill={isSelected ? '#b45309' : 'none'} />
                          <span>{isSelected ? '⭐ Star Doctor' : 'Set as Star'}</span>
                        </button>

                        <div className={styles.docBtnGroup}>
                          <button
                            type="button"
                            className={styles.docActionBtn}
                            onClick={() => handleOpenEditDoctor(doc)}
                            title="Edit doctor details, reels, videos & FAQs"
                          >
                            <Edit3 size={13} />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            className={`${styles.docActionBtn} ${styles.docDeleteBtn}`}
                            onClick={() => handleOpenDeleteDoctor(doc)}
                            title="Delete doctor"
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Empty state when no doctor matches search */}
            {(doctors || []).filter(doc => {
              const isSelected = isDoctorInStarList(doc, formData.star_doctors);
              if (doctorFilter === 'star' && !isSelected) return false;
              if (!doctorSearch.trim()) return true;
              const query = doctorSearch.toLowerCase();
              return (
                (doc.name || '').toLowerCase().includes(query) ||
                (doc.specialty || doc.specialization || '').toLowerCase().includes(query) ||
                (doc.hospital || '').toLowerCase().includes(query)
              );
            }).length === 0 && (
              <div style={{ textAlign: 'center', padding: '36px 20px', color: '#64748b', background: '#f8fafc', borderRadius: '10px', marginTop: '16px' }}>
                <Stethoscope size={36} color="#cbd5e1" style={{ marginBottom: '8px' }} />
                <p style={{ margin: 0, fontWeight: 600 }}>No doctors found matching your criteria.</p>
                <button
                  type="button"
                  className={styles.quickPickBtn}
                  style={{ marginTop: '10px' }}
                  onClick={handleOpenAddDoctor}
                >
                  + Add Doctor Now
                </button>
              </div>
            )}
          </div>
        )}
        {/* TAB 5: INSURANCE & CASHLESS DESK */}
        {activeTab === 'insurance' && (
          <div id="section-insurance">
            <div className={styles.cardSection}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>
                    <CheckSquare size={20} color="#2563eb" />
                    Cashless Mediclaim & TPA Desk Settings
                  </h2>
                  <p className={styles.sectionSubtitle}>
                    Control insurance helpline, desk turnaround speed, and accepted insurance companies.
                  </p>
                </div>
              </div>

              <div className={styles.toggleRow} style={{ marginBottom: '20px' }}>
                <div className={styles.toggleLabel}>
                  <span className={styles.toggleTitle}>100% Cashless Mediclaim Desk</span>
                  <span className={styles.toggleDesc}>Show "Insurance Accepted" badge and direct pre-approval support</span>
                </div>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={formData.cashlessInsurance}
                    onChange={(e) => handleChange('cashlessInsurance', e.target.checked)}
                  />
                  <span className={styles.slider} />
                </label>
              </div>

              <div className={styles.gridThree}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Insurance Helpline Number</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={formData.insuranceHelpline}
                    onChange={(e) => handleChange('insuranceHelpline', e.target.value)}
                    placeholder="e.g. 1800-SEHAT-CARE"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>TPA Desk Direct Phone</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={formData.tpaPhone}
                    onChange={(e) => handleChange('tpaPhone', e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Pre-Auth Approval Turnaround Time</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={formData.tpaPreAuthTime}
                    onChange={(e) => handleChange('tpaPreAuthTime', e.target.value)}
                    placeholder="e.g. 30 Mins Cashless Pre-Approval"
                  />
                </div>
              </div>
            </div>

            {/* Accepted Insurances Management */}
            <div className={styles.cardSection}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>
                    <ShieldCheck size={20} color="#2563eb" />
                    Accepted Insurance Companies & TPAs ({formData.acceptedInsurances.length} Active)
                  </h2>
                  <p className={styles.sectionSubtitle}>
                    Add new insurance providers or TPAs, edit existing ones, or remove partners no longer empaneled at this hospital.
                  </p>
                </div>
              </div>

              {/* Add New Insurance Bar */}
              <div className={styles.insuranceAddBox}>
                <label className={styles.formLabel} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={15} color="#2563eb" />
                  <span>Add New Insurance Provider or TPA</span>
                </label>
                <div className={styles.insuranceInputRow}>
                  <input
                    type="text"
                    className={styles.inputField}
                    placeholder="Enter insurance company or TPA name (e.g. Max Bupa, Vidal Health TPA)..."
                    value={newInsuranceInput}
                    onChange={(e) => setNewInsuranceInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddInsurance();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className={styles.addDoctorBtn}
                    onClick={() => handleAddInsurance()}
                    disabled={!newInsuranceInput.trim()}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    <Plus size={16} />
                    <span>Add Insurance</span>
                  </button>
                </div>

                {/* Quick-Pick Suggestions */}
                <div style={{ marginTop: '14px' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Quick Add Popular Insurers & TPAs:
                  </span>
                  <div className={styles.quickPickWrap} style={{ marginTop: '6px' }}>
                    {POPULAR_INSURANCES
                      .filter(ins => !formData.acceptedInsurances.some(curr => curr.toLowerCase() === ins.toLowerCase()))
                      .slice(0, 14)
                      .map((insName) => (
                        <button
                          key={insName}
                          type="button"
                          className={styles.quickPickBtn}
                          onClick={() => handleAddInsurance(insName)}
                        >
                          + {insName}
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              {/* Search within active insurances */}
              <div className={styles.insuranceToolbar}>
                <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
                  <input
                    type="text"
                    className={styles.inputField}
                    style={{ paddingLeft: '36px' }}
                    placeholder="Search active insurances..."
                    value={insuranceSearch}
                    onChange={(e) => setInsuranceSearch(e.target.value)}
                  />
                </div>
                <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                  Showing {
                    formData.acceptedInsurances.filter(ins =>
                      !insuranceSearch.trim() || ins.toLowerCase().includes(insuranceSearch.toLowerCase())
                    ).length
                  } of {formData.acceptedInsurances.length} Insurers
                </span>
              </div>

              {/* Insurances Grid */}
              <div className={styles.insuranceGrid}>
                {formData.acceptedInsurances
                  .map((insName, originalIndex) => ({ name: insName, index: originalIndex }))
                  .filter(({ name }) => {
                    if (!insuranceSearch.trim()) return true;
                    return name.toLowerCase().includes(insuranceSearch.toLowerCase());
                  })
                  .map(({ name, index }) => {
                    const isEditing = editingInsuranceIndex === index;

                    if (isEditing) {
                      return (
                        <div key={index} className={`${styles.insuranceCard} ${styles.insuranceCardActive}`}>
                          <div className={styles.insuranceEditRow}>
                            <input
                              type="text"
                              className={styles.insuranceEditInput}
                              value={editingInsuranceName}
                              onChange={(e) => setEditingInsuranceName(e.target.value)}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveEditInsurance(index);
                                } else if (e.key === 'Escape') {
                                  e.preventDefault();
                                  handleCancelEditInsurance();
                                }
                              }}
                            />
                            <button
                              type="button"
                              className={styles.insuranceSaveBtn}
                              onClick={() => handleSaveEditInsurance(index)}
                              title="Save changes"
                            >
                              <Check size={14} />
                              <span>Save</span>
                            </button>
                            <button
                              type="button"
                              className={styles.insuranceCancelBtn}
                              onClick={handleCancelEditInsurance}
                              title="Cancel editing"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={index} className={`${styles.insuranceCard} ${styles.insuranceCardActive}`}>
                        <div className={styles.insuranceCardLeft}>
                          <div className={styles.insuranceIconBadge}>
                            <ShieldCheck size={18} />
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <p className={styles.insuranceName} title={name}>
                              {name}
                            </p>
                            <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>
                              ✓ Cashless Empaneled
                            </span>
                          </div>
                        </div>

                        <div className={styles.insuranceActions}>
                          <button
                            type="button"
                            className={`${styles.insuranceActionBtn} ${styles.insuranceEditBtn}`}
                            onClick={() => handleStartEditInsurance(index, name)}
                            title="Edit / Rename Insurance"
                          >
                            <Edit3 size={13} />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            className={`${styles.insuranceActionBtn} ${styles.insuranceDeleteBtn}`}
                            onClick={() => handleDeleteInsurance(index)}
                            title="Delete Insurance from hospital"
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {formData.acceptedInsurances.length === 0 && (
                <div style={{ textAlign: 'center', padding: '36px 20px', color: '#64748b', background: '#f8fafc', borderRadius: '10px' }}>
                  <ShieldCheck size={36} color="#cbd5e1" style={{ marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>No accepted insurance companies added yet.</p>
                  <p style={{ margin: '4px 0 12px 0', fontSize: '0.84rem' }}>Use the input above or click any quick-add button to add empaneled providers.</p>
                </div>
              )}
            </div>
          </div>
        )}
        {/* TAB 6: REELS, VIDEOS & SOCIALS */}
        {activeTab === 'social-reels' && (
          <div id="section-socials">
            {/* Contact & Social Links */}
            <div className={styles.cardSection}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>
                    <Phone size={20} color="#2563eb" />
                    Hospital Contact & Social Channels
                  </h2>
                  <p className={styles.sectionSubtitle}>
                    Official communication desks and social profiles displayed on the profile page.
                  </p>
                </div>
              </div>

              <div className={styles.gridTwo}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Hospital Helpdesk Phone</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="e.g. +91 1800 102 3222"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Official Email Address</label>
                  <input
                    type="email"
                    className={styles.inputField}
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="e.g. info@manipalhospitals.com"
                  />
                </div>
              </div>

              <div className={styles.gridTwo} style={{ marginTop: '16px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Instagram Profile / Handle URL</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={formData.instagram}
                    onChange={(e) => handleChange('instagram', e.target.value)}
                    placeholder="e.g. https://instagram.com/manipalhospitals"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Facebook Page URL</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={formData.facebook}
                    onChange={(e) => handleChange('facebook', e.target.value)}
                    placeholder="e.g. https://facebook.com/manipalhospitals"
                  />
                </div>
              </div>
            </div>

            {/* Banner for Hospital Admin Preview Only */}
            {isHospitalView && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px 18px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <ShieldCheck size={20} color="#16a34a" />
                <span style={{ fontSize: '0.88rem', color: '#166534', fontWeight: 500 }}>
                  <strong>Preview Only:</strong> Video and reel uploads are managed by the platform administrator. You can view, preview, and play all active media belonging to your facility below.
                </span>
              </div>
            )}

            {/* Instagram Reels Section */}
            <div className={styles.cardSection}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>
                    <Video size={20} color="#db2777" />
                    Instagram Reels ({formData.reels.length} Items) {isHospitalView ? '— Preview' : ''}
                  </h2>
                  <p className={styles.sectionSubtitle}>
                    Featured medical shorts and doctor guidance reels.
                  </p>
                </div>

                {!isHospitalView && (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={handleSaveAll}
                      disabled={isSaving}
                      style={{
                        background: '#16a34a',
                        color: '#ffffff',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        cursor: isSaving ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)'
                      }}
                      title="Save Reels directly to Database"
                    >
                      {isSaving ? <Loader2 size={14} className={styles.spinAnimation} /> : <Save size={14} />}
                      <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleAddReel}
                      style={{
                        background: '#fdf2f8',
                        color: '#db2777',
                        border: '1px solid #fbcfe8',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Plus size={15} />
                      <span>Add Reel</span>
                    </button>
                  </div>
                )}
              </div>

              {isHospitalView ? (
                formData.reels.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '10px' }}>
                    No Instagram reels have been linked yet by the administrator.
                  </div>
                ) : (
                  <div className={styles.previewCardGrid}>
                    {formData.reels.map((reel, idx) => {
                      const cover = reel.coverPhoto || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=400&q=80';
                      const isVideo = reel.url && (reel.url.includes('cloudinary.com') || reel.url.match(/\.(mp4|webm|mov)(\?.*)?$/i));
                      return (
                        <div
                          key={idx}
                          className={styles.mediaPreviewCard}
                          onMouseEnter={(e) => {
                            if (isVideo) {
                              const v = e.currentTarget.querySelector('video');
                              if (v) {
                                v.currentTime = 0;
                                v.play().catch(() => {});
                              }
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (isVideo) {
                              const v = e.currentTarget.querySelector('video');
                              if (v) v.pause();
                            }
                          }}
                        >
                          <div className={styles.mediaThumbnailWrap} style={{ position: 'relative', overflow: 'hidden' }}>
                            {isVideo ? (
                              <video
                                src={reel.url}
                                poster={cover}
                                muted
                                playsInline
                                loop
                                preload="metadata"
                                className={styles.mediaThumbnail}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <img src={cover} alt={`Reel #${idx + 1}`} className={styles.mediaThumbnail} />
                            )}
                            <span style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(219, 39, 119, 0.9)', color: 'white', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', zIndex: 2 }}>
                              <InstagramIcon size={12} color="#ffffff" /> Reel #{idx + 1}
                            </span>
                            {isVideo && (
                              <span style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0, 0, 0, 0.65)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px', zIndex: 2 }}>
                                ▶ Autoplay on hover
                              </span>
                            )}
                          </div>
                          <div className={styles.mediaPreviewBody}>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', wordBreak: 'break-all', marginBottom: '12px' }}>
                              {reel.url || 'No URL specified'}
                            </div>
                            <button
                              type="button"
                              className={styles.mediaPlayBtn}
                              onClick={() => setPreviewMediaItem({ type: 'instagram', url: reel.url, coverPhoto: reel.coverPhoto, title: `Reel #${idx + 1}` })}
                            >
                              <Play size={13} fill="currentColor" />
                              <span>Preview & Play Reel</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                formData.reels.map((reel, idx) => (
                  <div key={idx} className={styles.mediaItemCard}>
                    <div className={styles.mediaItemHeader}>
                      <strong style={{ fontSize: '0.88rem', color: '#db2777' }}>Reel #{idx + 1}</strong>
                      <button
                        type="button"
                        onClick={() => handleRemoveReel(idx)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className={styles.gridTwo}>
                      <div className={styles.formGroup}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label className={styles.formLabel} style={{ margin: 0 }}>
                            Reel Video (Cloudinary MP4 or Link)
                          </label>
                          {reel.url && reel.url.includes('cloudinary') && (
                            <span style={{ fontSize: '0.72rem', color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '100px', fontWeight: 700, border: '1px solid #a7f3d0' }}>
                              ✓ Cloudinary Auto-Play Ready
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="text"
                            className={styles.inputField}
                            value={reel.url}
                            onChange={(e) => handleUpdateReel(idx, 'url', e.target.value)}
                            placeholder="Upload video file or paste Cloudinary / Instagram video URL"
                            style={{ flex: 1 }}
                          />

                          <label
                            className={styles.uploadFileBtn}
                            style={{
                              background: '#2563eb',
                              color: '#ffffff',
                              border: 'none',
                              padding: '8px 14px',
                              whiteSpace: 'nowrap',
                              cursor: uploadingMediaKey === `reel-video-${idx}` ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              borderRadius: '8px',
                              fontWeight: 600,
                              fontSize: '0.82rem'
                            }}
                            title="Upload MP4 / MOV video file directly to Cloudinary"
                          >
                            {uploadingMediaKey === `reel-video-${idx}` ? (
                              <>
                                <Loader2 size={13} className={styles.spinAnimation} />
                                <span>{reelUploadProgress[idx] || 0}%</span>
                              </>
                            ) : (
                              <>
                                <Video size={14} />
                                <span>Upload Video</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="video/mp4,video/webm,video/quicktime,video/*"
                              style={{ display: 'none' }}
                              disabled={uploadingMediaKey === `reel-video-${idx}`}
                              onChange={(e) => handleReelVideoUpload(e, idx)}
                            />
                          </label>
                        </div>

                        {reel.url && reel.url.includes('instagram.com') && !reel.url.includes('cloudinary') && (
                          <button
                            type="button"
                            onClick={() => handleConvertInstagramReel(idx)}
                            disabled={uploadingMediaKey === `convert-ig-${idx}`}
                            style={{
                              background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                              color: '#ffffff',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              cursor: uploadingMediaKey === `convert-ig-${idx}` ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              marginTop: '6px',
                              width: 'fit-content'
                            }}
                          >
                            {uploadingMediaKey === `convert-ig-${idx}` ? (
                              <>
                                <Loader2 size={12} className={styles.spinAnimation} />
                                <span>Extracting & Uploading to Cloudinary...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles size={12} />
                                <span>Auto-Upload to Cloudinary (Enables Hover Autoplay & Native Player)</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Cover Photo (Direct Upload or Link)</label>
                        <div className={styles.coverUploadContainer}>
                          {reel.coverPhoto ? (
                            <div className={styles.coverPreviewWrap}>
                              <img
                                src={reel.coverPhoto}
                                alt={`Reel #${idx + 1} Cover`}
                                className={styles.coverPreviewThumb}
                                onError={(e) => {
                                  e.target.src = 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=400&q=80';
                                }}
                              />
                              <div className={styles.coverPreviewInfo}>
                                <p className={styles.coverPreviewUrl} title={reel.coverPhoto}>
                                  {reel.coverPhoto.startsWith('data:') ? '✓ Uploaded image file' : reel.coverPhoto}
                                </p>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                  <label className={styles.uploadFileBtn} style={{ padding: '3px 8px', fontSize: '0.72rem' }}>
                                    {uploadingMediaKey === `reel-${idx}` ? (
                                      <>
                                        <Loader2 size={12} className={styles.spinAnimation} />
                                        <span>Uploading...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Camera size={12} />
                                        <span>Change Photo</span>
                                      </>
                                    )}
                                    <input
                                      type="file"
                                      accept="image/*"
                                      style={{ display: 'none' }}
                                      disabled={uploadingMediaKey === `reel-${idx}`}
                                      onChange={(e) => handleMediaCoverUpload(e, 'reel', idx)}
                                    />
                                  </label>
                                  <button
                                    type="button"
                                    className={styles.coverRemoveBtn}
                                    onClick={() => handleUpdateReel(idx, 'coverPhoto', '')}
                                    title="Remove cover photo"
                                  >
                                    <Trash2 size={12} />
                                    <span>Remove</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className={styles.coverUploadRow}>
                              <label className={styles.uploadFileBtn}>
                                {uploadingMediaKey === `reel-${idx}` ? (
                                  <>
                                    <Loader2 size={14} className={styles.spinAnimation} />
                                    <span>Uploading...</span>
                                  </>
                                ) : (
                                  <>
                                    <Upload size={14} />
                                    <span>Upload Cover Photo</span>
                                  </>
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  style={{ display: 'none' }}
                                  disabled={uploadingMediaKey === `reel-${idx}`}
                                  onChange={(e) => handleMediaCoverUpload(e, 'reel', idx)}
                                />
                              </label>
                              <span className={styles.coverDividerText}>or</span>
                              <input
                                type="text"
                                className={styles.inputField}
                                style={{ flex: 1, minWidth: '180px' }}
                                value={reel.coverPhoto}
                                onChange={(e) => handleUpdateReel(idx, 'coverPhoto', e.target.value)}
                                placeholder="Paste cover photo URL..."
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* YouTube Videos Section */}
            <div className={styles.cardSection}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>
                    <Video size={20} color="#ef4444" />
                    Featured YouTube Videos & Medical Tours ({formData.youtube_videos.length} Items) {isHospitalView ? '— Preview' : ''}
                  </h2>
                  <p className={styles.sectionSubtitle}>
                    Virtual facility walkthroughs and clinical procedure videos.
                  </p>
                </div>

                {!isHospitalView && (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={handleSaveAll}
                      disabled={isSaving}
                      style={{
                        background: '#16a34a',
                        color: '#ffffff',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        cursor: isSaving ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)'
                      }}
                      title="Save YouTube Videos directly to Database"
                    >
                      {isSaving ? <Loader2 size={14} className={styles.spinAnimation} /> : <Save size={14} />}
                      <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleAddVideo}
                      style={{
                        background: '#fef2f2',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Plus size={15} />
                      <span>Add Video</span>
                    </button>
                  </div>
                )}
              </div>

              {isHospitalView ? (
                formData.youtube_videos.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '10px' }}>
                    No YouTube videos have been linked yet by the administrator.
                  </div>
                ) : (
                  <div className={styles.previewCardGrid}>
                    {formData.youtube_videos.map((video, idx) => {
                      const ytMatch = video.url ? video.url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/) : null;
                      const cover = video.coverPhoto || (ytMatch ? `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=400&q=80');
                      return (
                        <div key={idx} className={styles.mediaPreviewCard}>
                          <div className={styles.mediaThumbnailWrap}>
                            <img src={cover} alt={`Video #${idx + 1}`} className={styles.mediaThumbnail} />
                            <span style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(220, 38, 38, 0.9)', color: 'white', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <PlayCircle size={12} /> Video #{idx + 1}
                            </span>
                          </div>
                          <div className={styles.mediaPreviewBody}>
                            <div style={{ fontSize: '0.78rem', color: '#64748b', wordBreak: 'break-all', marginBottom: '12px' }}>
                              {video.url || 'No URL specified'}
                            </div>
                            <button
                              type="button"
                              className={styles.mediaPlayBtn}
                              onClick={() => setPreviewMediaItem({ type: 'youtube', url: video.url, coverPhoto: video.coverPhoto, title: `YouTube Video #${idx + 1}` })}
                            >
                              <Play size={13} fill="currentColor" />
                              <span>Preview & Play Video</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                formData.youtube_videos.map((video, idx) => (
                  <div key={idx} className={styles.mediaItemCard}>
                    <div className={styles.mediaItemHeader}>
                      <strong style={{ fontSize: '0.88rem', color: '#ef4444' }}>YouTube Video #{idx + 1}</strong>
                      <button
                        type="button"
                        onClick={() => handleRemoveVideo(idx)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className={styles.gridTwo}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>YouTube Video URL</label>
                        <input
                          type="text"
                          className={styles.inputField}
                          value={video.url}
                          onChange={(e) => handleUpdateVideo(idx, 'url', e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=..."
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Cover Photo (Direct Upload or Link)</label>
                        <div className={styles.coverUploadContainer}>
                          {video.coverPhoto ? (
                            <div className={styles.coverPreviewWrap}>
                              <img
                                src={video.coverPhoto}
                                alt={`Video #${idx + 1} Cover`}
                                className={styles.coverPreviewThumb}
                                onError={(e) => {
                                  e.target.src = 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=400&q=80';
                                }}
                              />
                              <div className={styles.coverPreviewInfo}>
                                <p className={styles.coverPreviewUrl} title={video.coverPhoto}>
                                  {video.coverPhoto.startsWith('data:') ? '✓ Uploaded image file' : video.coverPhoto}
                                </p>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                  <label className={styles.uploadFileBtn} style={{ padding: '3px 8px', fontSize: '0.72rem' }}>
                                    {uploadingMediaKey === `video-${idx}` ? (
                                      <>
                                        <Loader2 size={12} className={styles.spinAnimation} />
                                        <span>Uploading...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Camera size={12} />
                                        <span>Change Photo</span>
                                      </>
                                    )}
                                    <input
                                      type="file"
                                      accept="image/*"
                                      style={{ display: 'none' }}
                                      disabled={uploadingMediaKey === `video-${idx}`}
                                      onChange={(e) => handleMediaCoverUpload(e, 'video', idx)}
                                    />
                                  </label>
                                  <button
                                    type="button"
                                    className={styles.coverRemoveBtn}
                                    onClick={() => handleUpdateVideo(idx, 'coverPhoto', '')}
                                    title="Remove cover photo"
                                  >
                                    <Trash2 size={12} />
                                    <span>Remove</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className={styles.coverUploadRow}>
                              <label className={styles.uploadFileBtn}>
                                {uploadingMediaKey === `video-${idx}` ? (
                                  <>
                                    <Loader2 size={14} className={styles.spinAnimation} />
                                    <span>Uploading...</span>
                                  </>
                                ) : (
                                  <>
                                    <Upload size={14} />
                                    <span>Upload Cover Photo</span>
                                  </>
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  style={{ display: 'none' }}
                                  disabled={uploadingMediaKey === `video-${idx}`}
                                  onChange={(e) => handleMediaCoverUpload(e, 'video', idx)}
                                />
                              </label>
                              <span className={styles.coverDividerText}>or</span>
                              <input
                                type="text"
                                className={styles.inputField}
                                style={{ flex: 1, minWidth: '180px' }}
                                value={video.coverPhoto}
                                onChange={(e) => handleUpdateVideo(idx, 'coverPhoto', e.target.value)}
                                placeholder="Paste cover photo URL..."
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Reels & Videos Bottom Save Action Bar */}
            {!isHospitalView && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                padding: '20px 24px',
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
                marginTop: '16px'
              }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#0f172a' }}>
                    Save Reels & Videos Changes
                  </h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                    Saves all {formData.reels.length} reels and {formData.youtube_videos.length} videos permanently to database and syncs live across Sehat Buddy.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {saveSuccess && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', fontSize: '0.86rem', fontWeight: 600 }}>
                      <CheckCircle2 size={16} />
                      <span>Saved successfully!</span>
                    </div>
                  )}
                  <button
                    type="button"
                    className={styles.saveBtn}
                    onClick={handleSaveAll}
                    disabled={isSaving}
                    style={{ padding: '10px 24px', fontSize: '0.94rem' }}
                  >
                    {isSaving ? <Loader2 size={16} className={styles.spinAnimation} /> : <Save size={16} />}
                    <span>{isSaving ? 'Saving to Database...' : 'Save Reels & Media'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {/* TAB 7: HOSPITAL FAQS */}
        {activeTab === 'faqs' && (
          <div id="section-faqs" className={styles.cardSection}>
            {isHospitalView && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '12px 18px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <HelpCircle size={20} color="#2563eb" />
                <span style={{ fontSize: '0.88rem', color: '#1e40af', fontWeight: 500 }}>
                  <strong>Preview Only:</strong> Hospital FAQs are published by the platform administrator. You can search, filter by category, and preview all official facility FAQs below.
                </span>
              </div>
            )}

            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>
                  <HelpCircle size={20} color="#2563eb" />
                  Frequently Asked Questions (Hospital FAQs) {isHospitalView ? '— Preview' : ''}
                </h2>
                <p className={styles.sectionSubtitle}>
                  Essential answers regarding admission, 100% cashless mediclaim, visiting hours, and documentation.
                </p>
              </div>

              {!isAddingFaq && !isHospitalView && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingFaqId(null);
                    setFaqForm({ question: '', answer: '', category: 'General', note: '', stepsInput: '' });
                    setIsAddingFaq(true);
                  }}
                  style={{
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Plus size={16} />
                  <span>Add Hospital FAQ</span>
                </button>
              )}
            </div>

            {/* Filter and Search Bar for Hospital Admin or Regular Search */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search hospital FAQs by question, answer, or notes..."
                  value={faqSearchQuery}
                  onChange={(e) => setFaqSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '9px 14px 9px 38px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>
              <select
                value={faqCategoryFilter}
                onChange={(e) => setFaqCategoryFilter(e.target.value)}
                style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', background: '#ffffff', minWidth: '160px' }}
              >
                <option value="All">All Categories</option>
                {Array.from(new Set(hospitalFaqs.map(f => f.category || 'General'))).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Add / Edit FAQ Drawer Box */}
            {isAddingFaq && (
              <form onSubmit={handleSaveFaq} className={styles.addBox} style={{ marginBottom: '24px' }}>
                <div className={styles.addBoxHeader}>
                  <HelpCircle size={18} />
                  <span>{editingFaqId ? 'Edit Hospital FAQ' : 'Create New Hospital FAQ'}</span>
                </div>

                <div className={styles.gridTwo}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Question *</label>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={faqForm.question}
                      onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                      placeholder="e.g. Does the hospital offer 100% cashless hospitalization?"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Category</label>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={faqForm.category}
                      onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                      placeholder="e.g. Cashless Insurance, Admission, Visiting Hours"
                    />
                  </div>
                </div>

                <div className={styles.formGroup} style={{ marginTop: '14px' }}>
                  <label className={styles.formLabel}>Detailed Answer *</label>
                  <textarea
                    className={styles.textareaField}
                    rows={4}
                    value={faqForm.answer}
                    onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                    placeholder="Provide a clear, helpful answer for prospective patients..."
                    required
                  />
                </div>

                <div className={styles.gridTwo} style={{ marginTop: '14px' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Pro Tip / Verified Note (Optional)</label>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={faqForm.note}
                      onChange={(e) => setFaqForm({ ...faqForm, note: e.target.value })}
                      placeholder="e.g. Carry original Aadhaar and Insurance e-card to the TPA desk."
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Numbered Steps (One per line, Optional)</label>
                    <textarea
                      className={styles.inputField}
                      rows={2}
                      value={faqForm.stepsInput}
                      onChange={(e) => setFaqForm({ ...faqForm, stepsInput: e.target.value })}
                      placeholder="Step 1: Report to TPA Desk&#10;Step 2: Submit E-Card&#10;Step 3: Receive Pre-Approval"
                    />
                  </div>
                </div>

                {/* FAQ Icon Selection (10 Direct Icons + Upload Custom Icon) */}
                <div style={{ marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label className={styles.formLabel} style={{ marginBottom: 0 }}>
                      Choose FAQ Icon (10 Direct Icons or Upload Custom) *
                    </label>
                    {customFaqIconPreview && (
                      <button
                        type="button"
                        onClick={() => faqIconInputRef.current?.click()}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#2563eb',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        + Upload Another Icon
                      </button>
                    )}
                  </div>

                  <div className={styles.faqIconGrid}>
                    {FAQ_ICONS_LIST.map((opt) => {
                      const isSelected = faqForm.icon === opt.id;
                      const IconComp = opt.icon;

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          className={`${styles.faqIconBtn} ${isSelected ? styles.faqIconBtnActive : ''}`}
                          onClick={() => setFaqForm(prev => ({ ...prev, icon: opt.id }))}
                        >
                          <div
                            className={styles.faqIconBadge}
                            style={{
                              background: isSelected ? '#2563eb' : opt.bg,
                              color: isSelected ? '#ffffff' : opt.color
                            }}
                          >
                            <IconComp size={18} />
                          </div>
                          <span className={`${styles.faqIconLabel} ${isSelected ? styles.faqIconLabelActive : ''}`}>
                            {opt.label}
                          </span>
                        </button>
                      );
                    })}

                    {/* 11th Option: Upload Custom Icon */}
                    <button
                      type="button"
                      className={`${styles.faqIconBtn} ${styles.faqIconUploadBtn} ${faqForm.icon === customFaqIconPreview && customFaqIconPreview ? styles.faqIconBtnActive : ''}`}
                      onClick={() => {
                        if (customFaqIconPreview && faqForm.icon !== customFaqIconPreview) {
                          setFaqForm(prev => ({ ...prev, icon: customFaqIconPreview }));
                        } else {
                          faqIconInputRef.current?.click();
                        }
                      }}
                      title="Upload custom icon from device"
                    >
                      <div
                        className={styles.faqIconBadge}
                        style={{
                          background: customFaqIconPreview ? '#ffffff' : '#f1f5f9',
                          color: '#2563eb',
                          border: customFaqIconPreview ? '1.5px solid #bfdbfe' : 'none',
                          overflow: 'hidden'
                        }}
                      >
                        {isUploadingFaqIcon ? (
                          <Loader2 size={18} className={styles.spinAnimation} color="#2563eb" />
                        ) : customFaqIconPreview ? (
                          <img
                            src={customFaqIconPreview}
                            alt="Custom Icon"
                            style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                          />
                        ) : (
                          <Upload size={18} color="#64748b" />
                        )}
                      </div>
                      <span className={`${styles.faqIconLabel} ${faqForm.icon === customFaqIconPreview && customFaqIconPreview ? styles.faqIconLabelActive : ''}`}>
                        {customFaqIconPreview ? 'Custom Icon' : 'Upload Icon'}
                      </span>
                    </button>
                  </div>

                  <input
                    type="file"
                    ref={faqIconInputRef}
                    accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                    style={{ display: 'none' }}
                    onChange={handleFaqIconUpload}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingFaq(false);
                      setEditingFaqId(null);
                    }}
                    className={styles.backBtn}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      background: '#2563eb',
                      color: 'white',
                      border: 'none',
                      padding: '8px 20px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {editingFaqId ? 'Update FAQ' : 'Save FAQ'}
                  </button>
                </div>
              </form>
            )}

            {/* List of Existing FAQs */}
            <div className={styles.faqAdminList}>
              {(() => {
                const displayFaqs = hospitalFaqs.filter(faq => {
                  if (faqCategoryFilter !== 'All' && faq.category !== faqCategoryFilter) return false;
                  if (faqSearchQuery.trim()) {
                    const q = faqSearchQuery.toLowerCase().trim();
                    const questionMatch = (faq.question || '').toLowerCase().includes(q);
                    const answerMatch = (faq.answer || '').toLowerCase().includes(q);
                    const noteMatch = (faq.note || '').toLowerCase().includes(q);
                    if (!questionMatch && !answerMatch && !noteMatch) return false;
                  }
                  return true;
                });

                if (displayFaqs.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                      <HelpCircle size={32} color="#cbd5e1" style={{ marginBottom: '8px' }} />
                      <p>{hospitalFaqs.length === 0 ? 'No hospital-specific FAQs added yet.' : 'No FAQs match your search or category filter.'}</p>
                    </div>
                  );
                }

                return displayFaqs.map((faq) => {
                  const isCustomIcon = faq.icon && (
                    faq.icon.startsWith('http') ||
                    faq.icon.startsWith('data:image') ||
                    faq.icon.startsWith('/') ||
                    faq.icon.includes('.')
                  );
                  const matchedIcon = FAQ_ICONS_LIST.find(i => i.id === faq.icon);
                  const IconComp = matchedIcon ? matchedIcon.icon : HelpCircle;

                  return (
                    <div key={faq.id || faq._id} className={styles.faqAdminCard}>
                      <div className={styles.faqAdminHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: isCustomIcon ? '#f8fafc' : (matchedIcon?.bg || '#eff6ff'),
                            color: isCustomIcon ? '#2563eb' : (matchedIcon?.color || '#2563eb'),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            border: '1px solid #e2e8f0',
                            overflow: 'hidden'
                          }}>
                            {isCustomIcon ? (
                              <img src={faq.icon} alt="FAQ icon" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                            ) : (
                              <IconComp size={16} />
                            )}
                          </div>
                          <span className={styles.faqAdminQuestion}>{faq.question}</span>
                        </div>
                        <span className={styles.faqAdminCategory}>{faq.category || 'General'}</span>
                      </div>

                      <p className={styles.faqAdminAnswer}>{faq.answer}</p>

                      {faq.note && (
                        <div style={{ fontSize: '0.78rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle2 size={14} />
                          <span>{faq.note}</span>
                        </div>
                      )}

                      <div className={styles.faqAdminActions}>
                        {isHospitalView ? (
                          <button
                            type="button"
                            className={styles.faqPreviewBtn}
                            onClick={() => setPreviewFaqItem(faq)}
                          >
                            <ExternalLink size={13} />
                            <span>Preview Full FAQ</span>
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              className={styles.iconBtn}
                              onClick={() => handleEditFaqClick(faq)}
                            >
                              <Edit3 size={14} />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                              onClick={() => handleDeleteFaqClick(faq.id || faq._id)}
                            >
                              <Trash2 size={14} />
                              <span>Delete</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}
        {/* TAB 8: BOOKED PATIENTS & VISITS */}
        {activeTab === 'patients' && (
          <div id="section-patients" className={styles.cardSection}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>
                  <Users size={20} color="#2563eb" />
                  Booked Patients & Hospital Visits ({hospitalAppointments.length} Total Records)
                </h2>
                <p className={styles.sectionSubtitle}>
                  Review all patient bookings, track completed visits by admin, and filter granularly by Year, Month, and Day.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchHospitalAppointments}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title="Refresh patient appointments directly from database"
              >
                <Loader2 size={13} className={loadingAppointments ? styles.spinAnimation : ''} />
                <span>{loadingAppointments ? 'Refreshing...' : 'Refresh Records'}</span>
              </button>
            </div>

            {/* Comprehensive Date & Period Filters */}
            <div className={styles.patientFilterCard}>
              {/* Row 1: Quick Time Presets */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div className={styles.presetBar}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.03em', marginRight: '4px' }}>
                    Quick Preset:
                  </span>
                  <button
                    type="button"
                    className={`${styles.periodPresetBtn} ${selectedPreset === 'all' && selectedYear === 'all' && selectedMonth === 'all' && selectedDay === 'all' ? styles.periodPresetBtnActive : ''}`}
                    onClick={() => {
                      setSelectedPreset('all');
                      setSelectedYear('all');
                      setSelectedMonth('all');
                      setSelectedDay('all');
                    }}
                  >
                    All Time ({hospitalAppointments.length})
                  </button>
                  <button
                    type="button"
                    className={`${styles.periodPresetBtn} ${selectedPreset === 'today' ? styles.periodPresetBtnActive : ''}`}
                    onClick={() => {
                      setSelectedPreset('today');
                      setSelectedYear('all');
                      setSelectedMonth('all');
                      setSelectedDay('all');
                    }}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    className={`${styles.periodPresetBtn} ${selectedPreset === 'this_month' ? styles.periodPresetBtnActive : ''}`}
                    onClick={() => {
                      setSelectedPreset('this_month');
                      setSelectedYear('all');
                      setSelectedMonth('all');
                      setSelectedDay('all');
                    }}
                  >
                    This Month
                  </button>
                  <button
                    type="button"
                    className={`${styles.periodPresetBtn} ${selectedPreset === 'this_year' ? styles.periodPresetBtnActive : ''}`}
                    onClick={() => {
                      setSelectedPreset('this_year');
                      setSelectedYear('all');
                      setSelectedMonth('all');
                      setSelectedDay('all');
                    }}
                  >
                    This Year ({new Date().getFullYear()})
                  </button>
                </div>

                {(selectedYear !== 'all' || selectedMonth !== 'all' || selectedDay !== 'all' || selectedPreset !== 'all' || patientStatusFilter !== 'all' || patientSearch) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPreset('all');
                      setSelectedYear('all');
                      setSelectedMonth('all');
                      setSelectedDay('all');
                      setPatientStatusFilter('all');
                      setPatientSearch('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <X size={13} />
                    <span>Reset All Filters</span>
                  </button>
                )}
              </div>

              {/* Row 2: Granular Selectors (Year, Month, Day, Status) */}
              <div className={styles.dropdownFilterRow}>
                {/* Year Select */}
                <div className={styles.filterSelectGroup}>
                  <label className={styles.filterSelectLabel}>Year</label>
                  <select
                    className={styles.filterSelectInput}
                    value={selectedPreset !== 'all' ? 'preset' : selectedYear}
                    onChange={(e) => {
                      setSelectedPreset('all');
                      setSelectedYear(e.target.value);
                    }}
                  >
                    <option value="all">All Years</option>
                    {availableYears.map(yr => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                    {selectedPreset !== 'all' && <option value="preset" disabled>Custom (Preset Active)</option>}
                  </select>
                </div>

                {/* Month Select */}
                <div className={styles.filterSelectGroup}>
                  <label className={styles.filterSelectLabel}>Month</label>
                  <select
                    className={styles.filterSelectInput}
                    value={selectedPreset !== 'all' ? 'preset' : selectedMonth}
                    onChange={(e) => {
                      setSelectedPreset('all');
                      setSelectedMonth(e.target.value);
                    }}
                  >
                    <option value="all">All Months</option>
                    <option value="01">01 - January</option>
                    <option value="02">02 - February</option>
                    <option value="03">03 - March</option>
                    <option value="04">04 - April</option>
                    <option value="05">05 - May</option>
                    <option value="06">06 - June</option>
                    <option value="07">07 - July</option>
                    <option value="08">08 - August</option>
                    <option value="09">09 - September</option>
                    <option value="10">10 - October</option>
                    <option value="11">11 - November</option>
                    <option value="12">12 - December</option>
                    {selectedPreset !== 'all' && <option value="preset" disabled>Custom (Preset Active)</option>}
                  </select>
                </div>

                {/* Day Select */}
                <div className={styles.filterSelectGroup}>
                  <label className={styles.filterSelectLabel}>Day of Month</label>
                  <select
                    className={styles.filterSelectInput}
                    value={selectedPreset !== 'all' ? 'preset' : selectedDay}
                    onChange={(e) => {
                      setSelectedPreset('all');
                      setSelectedDay(e.target.value);
                    }}
                  >
                    <option value="all">All Days (1 - 31)</option>
                    {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map(d => (
                      <option key={d} value={d}>Day {d}</option>
                    ))}
                    {selectedPreset !== 'all' && <option value="preset" disabled>Custom (Preset Active)</option>}
                  </select>
                </div>

                {/* Visit Status Filter */}
                <div className={styles.filterSelectGroup}>
                  <label className={styles.filterSelectLabel}>Visit Status</label>
                  <select
                    className={styles.filterSelectInput}
                    value={patientStatusFilter}
                    onChange={(e) => setPatientStatusFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="Completed">Visited / Completed</option>
                    <option value="Confirmed">Confirmed / Scheduled</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Search Box */}
                <div className={styles.filterSelectGroup} style={{ gridColumn: 'span 1' }}>
                  <label className={styles.filterSelectLabel}>Search Patient</label>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      className={styles.filterSelectInput}
                      style={{ paddingLeft: '32px' }}
                      placeholder="Name, phone, department..."
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Visit & Patient Metrics (Dynamically calculated based on Year/Month/Day selection) */}
            <div className={styles.patientMetricGrid}>
              <div className={styles.patientMetricCard}>
                <div className={styles.patientMetricIcon} style={{ background: '#eff6ff', color: '#2563eb' }}>
                  <Users size={22} />
                </div>
                <div>
                  <div className={styles.patientMetricVal}>{patientStats.total}</div>
                  <div className={styles.patientMetricTitle}>Total Booked Patients</div>
                </div>
              </div>

              <div className={styles.patientMetricCard}>
                <div className={styles.patientMetricIcon} style={{ background: '#ecfdf5', color: '#059669' }}>
                  <UserCheck size={22} />
                </div>
                <div>
                  <div className={styles.patientMetricVal} style={{ color: '#059669' }}>{patientStats.visited}</div>
                  <div className={styles.patientMetricTitle}>
                    Patients Visited ({patientStats.total > 0 ? Math.round((patientStats.visited / patientStats.total) * 100) : 0}%)
                  </div>
                </div>
              </div>

              <div className={styles.patientMetricCard}>
                <div className={styles.patientMetricIcon} style={{ background: '#fef3c7', color: '#d97706' }}>
                  <CalendarDays size={22} />
                </div>
                <div>
                  <div className={styles.patientMetricVal} style={{ color: '#d97706' }}>{patientStats.upcoming}</div>
                  <div className={styles.patientMetricTitle}>Upcoming / Scheduled</div>
                </div>
              </div>

              <div className={styles.patientMetricCard}>
                <div className={styles.patientMetricIcon} style={{ background: '#fef2f2', color: '#dc2626' }}>
                  <AlertCircle size={22} />
                </div>
                <div>
                  <div className={styles.patientMetricVal} style={{ color: '#dc2626' }}>{patientStats.cancelled}</div>
                  <div className={styles.patientMetricTitle}>Cancelled Bookings</div>
                </div>
              </div>
            </div>

            {/* Patient Appointments Table */}
            {loadingAppointments ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                <Loader2 size={28} className={styles.spinAnimation} style={{ margin: '0 auto 12px auto' }} />
                <p>Loading patient records from database...</p>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '48px 20px',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1.5px dashed #cbd5e1'
              }}>
                <Users size={40} color="#94a3b8" style={{ marginBottom: '12px' }} />
                <h3 style={{ margin: '0 0 6px 0', color: '#334155', fontSize: '1.1rem' }}>No Patient Bookings Found</h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.86rem', maxWidth: '420px', marginInline: 'auto' }}>
                  {hospitalAppointments.length === 0
                    ? `No appointments have been booked for ${formData.name || 'this hospital'} yet.`
                    : 'No patient visits match the selected Year, Month, Day, or status filter.'}
                </p>
                {hospitalAppointments.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPreset('all');
                      setSelectedYear('all');
                      setSelectedMonth('all');
                      setSelectedDay('all');
                      setPatientStatusFilter('all');
                      setPatientSearch('');
                    }}
                    style={{
                      marginTop: '16px',
                      background: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 18px',
                      borderRadius: '8px',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Show All Patient Bookings ({hospitalAppointments.length})
                  </button>
                )}
              </div>
            ) : (
              <div className={styles.patientTableWrap}>
                <table className={styles.patientTable}>
                  <thead>
                    <tr>
                      <th>Token / ID</th>
                      <th>Patient Details</th>
                      <th>Department & Symptoms</th>
                      <th>Date & Slot</th>
                      <th>Visit Status</th>
                      <th style={{ textAlign: 'right' }}>Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients.map((apt) => {
                      const aptId = apt._id || apt.id;
                      const pName = apt.userData?.name || apt.patientName || 'Patient';
                      const pPhone = apt.userData?.phone || apt.patientPhone || 'N/A';
                      const pEmail = apt.userData?.email || apt.patientEmail || '';
                      const pAge = apt.userData?.age || apt.patientAge || '';
                      const pGender = apt.userData?.gender || apt.patientGender || '';
                      const dept = apt.department || 'General Medicine';
                      const symptoms = apt.userData?.symptoms || apt.symptoms || 'General Consultation';
                      const slotDate = apt.slotDate || (apt.createdAt ? apt.createdAt.slice(0, 10) : 'Scheduled');
                      const slotTime = apt.slotTime || '';
                      const status = apt.status || 'Confirmed';
                      const isVisited = status === 'Completed' || apt.isCompleted;
                      const isCancelled = status === 'Cancelled' || apt.cancelled;

                      return (
                        <tr key={aptId}>
                          <td>
                            <span style={{
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              background: '#f1f5f9',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              color: '#334155'
                            }}>
                              {aptId ? String(aptId).slice(-8).toUpperCase() : 'APT'}
                            </span>
                          </td>

                          <td>
                            <div>
                              <strong style={{ fontSize: '0.92rem', color: '#0f172a', display: 'block' }}>
                                {pName} {pAge && <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>({pAge} yrs{pGender ? `, ${pGender}` : ''})</span>}
                              </strong>
                              <div style={{ display: 'flex', gap: '10px', fontSize: '0.78rem', color: '#475569', marginTop: '3px' }}>
                                <a href={`tel:${pPhone}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                                  📞 {pPhone}
                                </a>
                                {pEmail && (
                                  <a href={`mailto:${pEmail}`} style={{ color: '#64748b', textDecoration: 'none' }}>
                                    ✉️ {pEmail}
                                  </a>
                                )}
                              </div>
                            </div>
                          </td>

                          <td>
                            <div>
                              <span style={{
                                display: 'inline-block',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: '#eff6ff',
                                color: '#1d4ed8',
                                marginBottom: '3px'
                              }}>
                                {dept}
                              </span>
                              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic' }}>
                                {symptoms}
                              </p>
                            </div>
                          </td>

                          <td>
                            <div>
                              <strong style={{ fontSize: '0.88rem', color: '#0f172a', display: 'block' }}>
                                {slotDate}
                              </strong>
                              <span style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 600 }}>
                                ⏰ {slotTime || 'Regular Hours'}
                              </span>
                            </div>
                          </td>

                          <td>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              padding: '4px 10px',
                              borderRadius: '100px',
                              background: isVisited ? '#ecfdf5' : isCancelled ? '#fef2f2' : '#eff6ff',
                              color: isVisited ? '#059669' : isCancelled ? '#dc2626' : '#2563eb',
                              border: isVisited ? '1px solid #a7f3d0' : isCancelled ? '1px solid #fecaca' : '1px solid #bfdbfe'
                            }}>
                              {isVisited ? <CheckCircle2 size={12} /> : isCancelled ? <X size={12} /> : <Clock size={12} />}
                              <span>{isVisited ? 'Visited / Completed' : isCancelled ? 'Cancelled' : status}</span>
                            </span>
                          </td>

                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'flex-end' }}>
                              {!isVisited && (
                                <button
                                  type="button"
                                  className={`${styles.patientActionBtn} ${styles.patientActionVisited}`}
                                  onClick={() => handleUpdatePatientStatus(aptId, 'Completed')}
                                  title="Mark patient as visited / appointment completed"
                                >
                                  <Check size={13} />
                                  <span>Mark Visited</span>
                                </button>
                              )}

                              {!isCancelled && !isVisited && (
                                <button
                                  type="button"
                                  className={`${styles.patientActionBtn} ${styles.patientActionCancel}`}
                                  onClick={() => handleUpdatePatientStatus(aptId, 'Cancelled')}
                                  title="Cancel this appointment"
                                >
                                  <X size={13} />
                                  <span>Cancel</span>
                                </button>
                              )}

                              {(isVisited || isCancelled) && (
                                <button
                                  type="button"
                                  className={styles.patientActionBtn}
                                  style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}
                                  onClick={() => handleUpdatePatientStatus(aptId, 'Confirmed')}
                                  title="Revert status back to Confirmed / Scheduled"
                                >
                                  <Clock size={13} />
                                  <span>Reopen</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 9: PUBLIC REVIEWS & TESTIMONIALS */}
        {activeTab === 'reviews' && (
          <div id="section-reviews" className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleArea}>
                <div className={styles.sectionBadge}>
                  <MessageSquare size={14} />
                  <span>Verified Testimonials</span>
                </div>
                <h2 className={styles.sectionTitle}>Public Reviews & Patient Experiences</h2>
                <p className={styles.sectionSubtitle}>
                  Directly add, modify, or remove verified public ratings & patient testimonials for {formData.name || 'this hospital'}. Changes are automatically synced to MongoDB Atlas and visible live on the hospital's profile.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  type="button"
                  className={styles.addDoctorBtn}
                  onClick={() => {
                    if (isAddingReview) {
                      setIsAddingReview(false);
                      setEditingReviewId(null);
                    } else {
                      handleOpenAddReview();
                    }
                  }}
                >
                  {isAddingReview ? (
                    <>
                      <X size={15} />
                      <span>Cancel Form</span>
                    </>
                  ) : (
                    <>
                      <Plus size={15} />
                      <span>+ Add Public Review</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Metric Cards */}
            <div className={styles.reviewMetricGrid}>
              <div className={styles.reviewMetricCard}>
                <div className={styles.reviewMetricIcon} style={{ background: '#fef3c7', color: '#d97706' }}>
                  <Star size={24} fill="#d97706" />
                </div>
                <div>
                  <div className={styles.reviewMetricVal}>{reviewStats.avg} <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>/ 5.0</span></div>
                  <div className={styles.reviewMetricTitle}>Average Rating</div>
                </div>
              </div>

              <div className={styles.reviewMetricCard}>
                <div className={styles.reviewMetricIcon} style={{ background: '#eff6ff', color: '#2563eb' }}>
                  <MessageSquare size={24} />
                </div>
                <div>
                  <div className={styles.reviewMetricVal}>{reviewStats.total}</div>
                  <div className={styles.reviewMetricTitle}>Total Reviews Published</div>
                </div>
              </div>

              <div className={styles.reviewMetricCard}>
                <div className={styles.reviewMetricIcon} style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                  <Sparkles size={24} />
                </div>
                <div>
                  <div className={styles.reviewMetricVal}>{reviewStats.fiveStars}</div>
                  <div className={styles.reviewMetricTitle}>5-Star Top Experiences</div>
                </div>
              </div>

              <div className={styles.reviewMetricCard}>
                <div className={styles.reviewMetricIcon} style={{ background: '#ecfdf5', color: '#059669' }}>
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <div className={styles.reviewMetricVal}>{reviewStats.verifiedCount}</div>
                  <div className={styles.reviewMetricTitle}>100% Verified Patients</div>
                </div>
              </div>
            </div>

            {/* Add / Edit Review In-Page Form */}
            {isAddingReview && (
              <form onSubmit={handleSaveReview} className={styles.reviewFormContainer}>
                <div className={styles.reviewFormTitle}>
                  {editingReviewId ? <Edit3 size={18} /> : <Plus size={18} />}
                  <span>{editingReviewId ? 'Modify Public Review' : `Add Public Review for ${formData.name || 'Hospital'}`}</span>
                </div>

                <div className={styles.gridTwo}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Patient Full Name *</label>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={reviewForm.patientName}
                      onChange={(e) => setReviewForm({ ...reviewForm, patientName: e.target.value })}
                      placeholder="e.g. Ramesh K. Narayanan"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Patient City</label>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={reviewForm.patientCity}
                      onChange={(e) => setReviewForm({ ...reviewForm, patientCity: e.target.value })}
                      placeholder="e.g. Bengaluru, Karnataka"
                    />
                  </div>
                </div>

                <div className={styles.gridTwo} style={{ marginTop: '14px' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Rating (Click to select 1 to 5 Stars) *</label>
                    <div className={styles.starRatingRow}>
                      <div className={styles.starPickerGroup}>
                        {[1, 2, 3, 4, 5].map((starNum) => {
                          const isFilled = starNum <= Number(reviewForm.rating);
                          return (
                            <button
                              key={starNum}
                              type="button"
                              className={styles.starPickerBtn}
                              onClick={() => setReviewForm({ ...reviewForm, rating: starNum })}
                              title={`Rate ${starNum} out of 5 stars`}
                            >
                              <Star
                                size={22}
                                fill={isFilled ? '#f59e0b' : '#e2e8f0'}
                                color={isFilled ? '#f59e0b' : '#cbd5e1'}
                              />
                            </button>
                          );
                        })}
                      </div>
                      <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#b45309' }}>
                        {reviewForm.rating === 5 && '★★★★★ (5/5) Excellent'}
                        {reviewForm.rating === 4 && '★★★★☆ (4/5) Very Good'}
                        {reviewForm.rating === 3 && '★★★☆☆ (3/5) Average'}
                        {reviewForm.rating === 2 && '★★☆☆☆ (2/5) Below Average'}
                        {reviewForm.rating === 1 && '★☆☆☆☆ (1/5) Poor'}
                      </span>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Verification & Status</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', height: '42px' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.86rem', fontWeight: 600, color: '#15803d' }}>
                        <input
                          type="checkbox"
                          checked={reviewForm.isVerified}
                          onChange={(e) => setReviewForm({ ...reviewForm, isVerified: e.target.checked })}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <span>Verified Patient Badge</span>
                      </label>

                      <select
                        value={reviewForm.status}
                        onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })}
                        className={styles.filterSelectInput}
                        style={{ maxWidth: '140px', padding: '6px 10px', fontSize: '0.8rem' }}
                      >
                        <option value="approved">Approved</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className={styles.gridTwo} style={{ marginTop: '14px' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Treatment / Procedure Undergone</label>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={reviewForm.treatment}
                      onChange={(e) => setReviewForm({ ...reviewForm, treatment: e.target.value })}
                      placeholder="e.g. Total Knee Replacement, Angioplasty, OPD Consult"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Insurance / Cashless Provider Used</label>
                    <input
                      type="text"
                      className={styles.inputField}
                      value={reviewForm.insuranceUsed}
                      onChange={(e) => setReviewForm({ ...reviewForm, insuranceUsed: e.target.value })}
                      placeholder="e.g. Star Health & Allied Insurance, HDFC ERGO, None"
                    />
                  </div>
                </div>

                <div className={styles.formGroup} style={{ marginTop: '14px' }}>
                  <label className={styles.formLabel}>Review Title / Highlight</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    value={reviewForm.title}
                    onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                    placeholder="e.g. Outstanding surgical care and 100% cashless support!"
                  />
                </div>

                <div className={styles.formGroup} style={{ marginTop: '14px' }}>
                  <label className={styles.formLabel}>Detailed Review & Patient Testimonial *</label>
                  <textarea
                    rows={4}
                    className={styles.textareaField}
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    placeholder="Describe patient feedback, admission experience, nursing care, doctor bedside manner, and overall hospitality..."
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
                  <button
                    type="button"
                    className={styles.backBtn}
                    onClick={() => {
                      setIsAddingReview(false);
                      setEditingReviewId(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    style={{
                      background: '#2563eb',
                      color: 'white',
                      border: 'none',
                      padding: '8px 22px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      cursor: isSubmittingReview ? 'not-allowed' : 'pointer',
                      opacity: isSubmittingReview ? 0.7 : 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {isSubmittingReview ? (
                      <>
                        <Loader2 size={15} className={styles.spinIcon} />
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <>
                        <Save size={15} />
                        <span>{editingReviewId ? 'Save Review Changes' : 'Publish Public Review'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Filter & Search Bar */}
            <div className={styles.filterToolbar}>
              <div className={styles.searchBox}>
                <Search size={16} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search reviews by patient, title, comment, treatment, insurance..."
                  value={reviewSearch}
                  onChange={(e) => setReviewSearch(e.target.value)}
                  className={styles.searchInput}
                />
                {reviewSearch && (
                  <button
                    type="button"
                    onClick={() => setReviewSearch('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0 4px' }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className={styles.filterSelectLabel}>Rating:</span>
                  <select
                    value={reviewRatingFilter}
                    onChange={(e) => setReviewRatingFilter(e.target.value)}
                    className={styles.filterSelectInput}
                    style={{ minWidth: '150px' }}
                  >
                    <option value="all">All Ratings ({hospitalReviews.length})</option>
                    <option value="5">5 Stars (★★★★★)</option>
                    <option value="4">4 Stars (★★★★☆)</option>
                    <option value="3">3 Stars (★★★☆☆)</option>
                    <option value="2">2 Stars (★★☆☆☆)</option>
                    <option value="1">1 Star (★☆☆☆☆)</option>
                  </select>
                </div>

                <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                  Showing {filteredHospitalReviews.length} of {hospitalReviews.length} reviews
                </span>
              </div>
            </div>

            {/* Reviews Cards Display */}
            {filteredHospitalReviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', marginTop: '16px' }}>
                <MessageSquare size={38} color="#94a3b8" style={{ marginBottom: '10px' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: '0 0 6px 0' }}>
                  {hospitalReviews.length === 0 ? 'No Public Reviews Added Yet' : 'No Reviews Matched Filters'}
                </h3>
                <p style={{ fontSize: '0.86rem', color: '#64748b', maxWidth: '460px', margin: '0 auto 16px auto', lineHeight: 1.5 }}>
                  {hospitalReviews.length === 0
                    ? `Publish genuine patient testimonials to boost confidence for patients looking for treatment at ${formData.name || 'this hospital'}.`
                    : 'Try clearing your search query or choosing "All Ratings" above to see all hospital reviews.'}
                </p>
                {hospitalReviews.length === 0 && (
                  <button
                    type="button"
                    onClick={handleOpenAddReview}
                    className={styles.addDoctorBtn}
                    style={{ margin: '0 auto' }}
                  >
                    <Plus size={15} />
                    <span>+ Add First Public Review</span>
                  </button>
                )}
              </div>
            ) : (
              <div className={styles.reviewsGrid}>
                {filteredHospitalReviews.map((rev) => {
                  const revId = rev.id || rev._id;
                  const patientInitials = (rev.patientName || 'P')
                    .split(' ')
                    .map(w => w[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();

                  const ratingNum = Number(rev.rating) || 5;

                  return (
                    <div key={revId} className={styles.reviewCard}>
                      <div className={styles.reviewCardTop}>
                        <div className={styles.reviewPatientMeta}>
                          <div className={styles.reviewAvatar}>
                            {patientInitials}
                          </div>
                          <div>
                            <div className={styles.reviewPatientName}>
                              <span>{rev.patientName}</span>
                              {rev.isVerified && (
                                <span
                                  title="100% Verified Hospital Patient"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '2px',
                                    background: '#dcfce7',
                                    color: '#15803d',
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    padding: '1px 6px',
                                    borderRadius: '100px'
                                  }}
                                >
                                  <ShieldCheck size={11} />
                                  <span>Verified</span>
                                </span>
                              )}
                            </div>
                            <span className={styles.reviewPatientCity}>{rev.patientCity || 'Bengaluru'}</span>
                          </div>
                        </div>

                        <div className={styles.reviewStarsWrap}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={15}
                              fill={s <= ratingNum ? '#f59e0b' : '#e2e8f0'}
                              color={s <= ratingNum ? '#f59e0b' : '#cbd5e1'}
                            />
                          ))}
                        </div>
                      </div>

                      <div className={styles.reviewPillsRow}>
                        {rev.treatment && (
                          <span className={styles.reviewTreatmentPill}>
                            {rev.treatment}
                          </span>
                        )}
                        {rev.insuranceUsed && rev.insuranceUsed !== 'None' && (
                          <span className={styles.reviewInsurancePill}>
                            <ShieldCheck size={12} />
                            <span>Cashless: {rev.insuranceUsed}</span>
                          </span>
                        )}
                      </div>

                      {rev.title && (
                        <h4 className={styles.reviewTitleText}>
                          {rev.title}
                        </h4>
                      )}

                      <p className={styles.reviewCommentText}>
                        "{rev.comment}"
                      </p>

                      <div className={styles.reviewCardFooter}>
                        <span
                          className={`${styles.reviewStatusBadge} ${
                            rev.status === 'approved'
                              ? styles.reviewStatusApproved
                              : rev.status === 'pending'
                              ? styles.reviewStatusPending
                              : styles.reviewStatusRejected
                          }`}
                        >
                          {rev.status || 'approved'}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            className={`${styles.reviewActionBtn} ${styles.reviewEditBtn}`}
                            onClick={() => handleEditReviewClick(rev)}
                            title="Edit / modify review details"
                          >
                            <Edit3 size={13} />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            className={`${styles.reviewActionBtn} ${styles.reviewDeleteBtn}`}
                            onClick={() => handleDeleteReviewClick(revId)}
                            title="Permanently delete review"
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 10: EMERGENCY & FLEET */}
        {activeTab === 'er-fleet' && (
          <div id="section-er" className={styles.cardSection}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>
                  <Siren size={20} color="#dc2626" />
                  Emergency Operations (ER) & Ambulance Fleet
                </h2>
                <p className={styles.sectionSubtitle}>
                  Real-time emergency triage admissions, critical patient bed allocation, and ambulance dispatch.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginTop: '16px' }}>
              {/* ER Queue */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={18} color="#dc2626" />
                    Active Emergency Triage (ER)
                  </h3>
                  <span style={{ background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: '999px', fontSize: '0.74rem', fontWeight: 700 }}>
                    LIVE
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {erCases.map((c) => (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>
                          {c.patient} <span style={{ fontSize: '0.78rem', color: '#64748b' }}>({c.age} yrs)</span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                          {c.condition} • Bed: {c.bedAssigned}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          display: 'inline-block',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: c.triage.includes('Red') ? '#fee2e2' : c.triage.includes('Yellow') ? '#fef3c7' : '#dcfce7',
                          color: c.triage.includes('Red') ? '#dc2626' : c.triage.includes('Yellow') ? '#d97706' : '#15803d'
                        }}>
                          {c.triage}
                        </span>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '3px' }}>
                          ETA: {c.eta}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ambulance Fleet */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Siren size={18} color="#2563eb" />
                    Ambulance Rescue Fleet
                  </h3>
                  <span style={{ background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '999px', fontSize: '0.74rem', fontWeight: 700 }}>
                    2 Available
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {ambulances.map((amb) => (
                    <div key={amb.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>
                          {amb.id} — {amb.type}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                          Driver: {amb.driver} ({amb.phone}) • {amb.location}
                        </div>
                      </div>
                      <div>
                        {amb.status === 'Available' ? (
                          <button
                            type="button"
                            onClick={() => handleDispatchAmbulance(amb.id)}
                            style={{ background: '#2563eb', color: '#ffffff', border: 'none', padding: '5px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Dispatch
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.74rem', fontWeight: 600, color: amb.status === 'Dispatched' ? '#d97706' : '#94a3b8' }}>
                            {amb.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* MEDIA PREVIEW MODAL */}
      {previewMediaItem && (
        <div className={styles.modalBackdrop} onClick={() => setPreviewMediaItem(null)}>
          <div className={styles.previewModalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.previewModalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {previewMediaItem.type === 'youtube' ? <PlayCircle size={20} color="#dc2626" /> : <InstagramIcon size={20} color="#e1306c" />}
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#1e293b' }}>
                  {previewMediaItem.title || (previewMediaItem.type === 'youtube' ? 'YouTube Video Preview' : 'Instagram Reel Preview')}
                </h3>
              </div>
              <button
                type="button"
                className={styles.closeModalBtn}
                onClick={() => setPreviewMediaItem(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              {previewMediaItem.type === 'youtube' ? (
                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '8px', background: '#000' }}>
                  <iframe
                    src={getYouTubeEmbedUrl(previewMediaItem.url)}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <video
                    src={previewMediaItem.url && (previewMediaItem.url.includes('cloudinary.com') || previewMediaItem.url.match(/\.(mp4|webm|mov)(\?.*)?$/i))
                      ? previewMediaItem.url
                      : `${API_BASE}/reel-video?url=${encodeURIComponent(previewMediaItem.url)}`}
                    poster={previewMediaItem.coverPhoto}
                    controls
                    playsInline
                    style={{ width: '100%', maxWidth: '420px', maxHeight: '560px', borderRadius: '12px', background: '#000', objectFit: 'contain' }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FAQ PREVIEW MODAL */}
      {previewFaqItem && (
        <div className={styles.modalBackdrop} onClick={() => setPreviewFaqItem(null)}>
          <div className={styles.previewModalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.previewModalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HelpCircle size={20} color="#2563eb" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#1e293b' }}>Hospital FAQ Details</h3>
              </div>
              <button
                type="button"
                className={styles.closeModalBtn}
                onClick={() => setPreviewFaqItem(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '24px' }}>
              <span style={{ display: 'inline-block', padding: '4px 10px', background: '#eff6ff', color: '#2563eb', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, marginBottom: '12px' }}>
                {previewFaqItem.category || 'General FAQ'}
              </span>
              <h2 style={{ fontSize: '1.15rem', color: '#0f172a', margin: '0 0 16px', lineHeight: 1.4 }}>
                {previewFaqItem.question}
              </h2>
              <div style={{ color: '#334155', fontSize: '0.94rem', lineHeight: 1.6, background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', whiteSpace: 'pre-wrap' }}>
                {previewFaqItem.answer}
              </div>
              {previewFaqItem.note && (
                <div style={{ marginTop: '14px', background: '#fefce8', border: '1px solid #fef08a', padding: '12px', borderRadius: '8px', color: '#854d0e', fontSize: '0.84rem' }}>
                  <strong>Note:</strong> {previewFaqItem.note}
                </div>
              )}
              {Array.isArray(previewFaqItem.steps) && previewFaqItem.steps.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: '0.9rem', color: '#1e293b' }}>Steps:</h4>
                  <ol style={{ margin: 0, paddingLeft: '20px', color: '#475569', fontSize: '0.88rem' }}>
                    {previewFaqItem.steps.map((st, i) => (
                      <li key={i} style={{ marginBottom: '4px' }}>{st}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Doctor Add / Edit Form Modal */}
      <DoctorFormModal
        isOpen={isDoctorModalOpen}
        onClose={() => {
          setIsDoctorModalOpen(false);
          setDoctorToEdit(null);
        }}
        doctorToEdit={doctorToEdit}
        onSuccess={handleDoctorModalSuccess}
      />

      {/* Doctor Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteDoctorModalState.isOpen}
        onClose={() => setDeleteDoctorModalState({ isOpen: false, doctor: null })}
        onConfirm={handleConfirmDeleteDoctor}
        title="Delete Doctor"
        message="Are you sure you want to permanently delete this doctor? They will be removed from this hospital and doctor directory."
        itemName={deleteDoctorModalState.doctor?.name}
      />
    </div>
  );
}
