import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Video,
  User,
  CheckCircle,
  FileText,
  DollarSign,
  Star,
  Plus,
  Building2,
  ChevronDown,
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
  Printer
} from 'lucide-react';
import { useData } from '../../context/useData';
import { broadcastSync } from '../../context/DataContext';
import { api } from '../../services/api';
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

const INITIAL_APPOINTMENTS = [
  {
    id: 1,
    patientName: 'Aarav Mehta',
    age: 42,
    gender: 'Male',
    time: '10:00 AM',
    date: 'Today',
    type: 'In-Clinic',
    symptoms: 'Chest tightness, elevated BP (145/95)',
    status: 'In-Progress',
    phone: '+91 98711 22334'
  },
  {
    id: 2,
    patientName: 'Sneha Kapur',
    age: 29,
    gender: 'Female',
    time: '11:15 AM',
    date: 'Today',
    type: 'Video Call',
    symptoms: 'Follow-up for routine ECG report & palpitations',
    status: 'Confirmed',
    phone: '+91 98100 44556'
  },
  {
    id: 3,
    patientName: 'Rajesh Kulkarni',
    age: 58,
    gender: 'Male',
    time: '12:30 PM',
    date: 'Today',
    type: 'In-Clinic',
    symptoms: 'Post-angioplasty 6-month evaluation',
    status: 'Confirmed',
    phone: '+91 98220 99887'
  },
  {
    id: 4,
    patientName: 'Meera Iyer',
    age: 35,
    gender: 'Female',
    time: '02:00 PM',
    date: 'Today',
    type: 'Video Call',
    symptoms: 'Cholesterol panel discussion & lifestyle guide',
    status: 'Confirmed',
    phone: '+91 98330 11223'
  },
  {
    id: 5,
    patientName: 'Vikas Malhotra',
    age: 50,
    gender: 'Male',
    time: '04:00 PM',
    date: 'Today',
    type: 'In-Clinic',
    symptoms: 'Shortness of breath on mild exertion',
    status: 'Completed',
    phone: '+91 98440 33445'
  }
];

const INITIAL_PRESCRIPTIONS = [
  {
    id: 1,
    patientName: 'Vikas Malhotra',
    date: 'Today, 04:30 PM',
    diagnosis: 'Mild hypertension & sinus tachycardia',
    medications: 'Tab. Telmisartan 40mg (1 OD), Tab. Metoprolol 25mg (1 OD)',
    followUp: 'After 14 days with repeat BP chart'
  },
  {
    id: 2,
    patientName: 'Sunil Chawla',
    date: 'Yesterday, 03:15 PM',
    diagnosis: 'Dyslipidemia with stable angina',
    medications: 'Tab. Atorvastatin 20mg (1 HS), Tab. Ecosprin 75mg (1 OD)',
    followUp: 'After 1 month with lipid profile'
  }
];

const DoctorDashboard = ({ onNavigate }) => {
  const { doctors, updateDoctor, deleteDoctor } = useData();

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
      const match = doctors.find(d => String(d.id || d._id) === String(storedUser._id || storedUser.id));
      if (match) return match;
    }
    if (storedUser && storedUser.email) {
      const emailMatch = doctors.find(d => (d.email || '').toLowerCase().trim() === storedUser.email.toLowerCase().trim());
      if (emailMatch) return emailMatch;
    }
    return doctors[0] || {};
  }, [doctors, storedUser]);

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

  // Appointments state with persistent storage per doctor
  const [appointments, setAppointments] = useState(() => {
    try {
      const saved = localStorage.getItem(`sehatbuddy_doc_appointments_${activeDocId}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_APPOINTMENTS;
  });
  const [appointmentFilter, setAppointmentFilter] = useState('all');

  // Prescriptions state with persistent storage per doctor
  const [prescriptions, setPrescriptions] = useState(() => {
    try {
      const saved = localStorage.getItem(`sehatbuddy_doc_prescriptions_${activeDocId}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_PRESCRIPTIONS;
  });

  // Selected prescription for formatted printable PDF preview
  const [selectedRxForPrint, setSelectedRxForPrint] = useState(null);

  // Active Tab: 'appointments' | 'prescriptions' | 'profile'
  const [activeTab, setActiveTab] = useState('appointments');

  // Local state for profile form to prevent API spam and CastErrors
  const [profileForm, setProfileForm] = useState(activeDoctor);
  const [newAwardInput, setNewAwardInput] = useState('');
  const [newCertInput, setNewCertInput] = useState('');
  const [newMembershipInput, setNewMembershipInput] = useState('');
  const [newCareerExpInput, setNewCareerExpInput] = useState('');
  const [newReelInput, setNewReelInput] = useState('');
  const [newYoutubeInput, setNewYoutubeInput] = useState('');

  // Inline editing states for modifying existing items
  const [editingAward, setEditingAward] = useState({ index: null, text: '' });
  const [editingCert, setEditingCert] = useState({ index: null, text: '' });
  const [editingMembership, setEditingMembership] = useState({ index: null, text: '' });
  const [editingCareerExp, setEditingCareerExp] = useState({ index: null, text: '' });
  const [editingReel, setEditingReel] = useState({ index: null, text: '' });
  const [editingYoutube, setEditingYoutube] = useState({ index: null, text: '' });

  // Schedule & Time Slots Management state
  const [newSlotTime, setNewSlotTime] = useState('');
  const [slotHour, setSlotHour] = useState('04');
  const [slotMin, setSlotMin] = useState('00');
  const [slotPeriod, setSlotPeriod] = useState('PM');
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

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

  const initialDoctorIdRef = React.useRef(null);

  // Fetch remote appointments if doctor is authenticated
  const fetchRemoteAppointments = React.useCallback(() => {
    if (!activeDocId || activeDocId === 'default') return;
    const lookupId = activeDoctor._id || activeDoctor.id || activeDocId;
    api.getDoctorDashboard(lookupId).then(data => {
      if (Array.isArray(data)) {
        setAppointments(prev => {
          const remoteMapped = data.map(apt => ({
            id: apt._id || apt.id,
            patientName: apt.userData?.name || 'Patient',
            age: apt.userData?.age || 30,
            gender: apt.userData?.gender || 'Male',
            time: apt.slotTime || '02:00 PM',
            date: apt.slotDate || 'Today',
            type: apt.consultationType || 'In-Clinic',
            symptoms: apt.symptoms || apt.userData?.symptoms || 'Clinical Consultation Booking',
            status: apt.isCompleted ? 'Completed' : (apt.cancelled ? 'Cancelled' : (apt.status || 'Confirmed')),
            phone: apt.userData?.phone || apt.phone || '+91 98000 00000',
            isRealtime: true,
            createdAt: apt.createdAt || apt.date
          }));

          if (remoteMapped.length > 0) {
            // Check for new incoming appointments to trigger notification toast
            const existingIds = new Set(prev.map(p => String(p.id)));
            const newIncoming = remoteMapped.filter(r => !existingIds.has(String(r.id)));
            if (newIncoming.length > 0 && prev.length > 0) {
              showToast(`🔔 New patient booking: ${newIncoming[0].patientName} (${newIncoming[0].time})`);
            }

            // Real appointments always take top priority
            const nonRemoteExisting = prev.filter(p => !p.isRealtime && !remoteMapped.some(r => String(r.id) === String(p.id)));
            const merged = [...remoteMapped, ...nonRemoteExisting];
            try {
              localStorage.setItem(`sehatbuddy_doc_appointments_${activeDocId}`, JSON.stringify(merged));
            } catch {}
            return merged;
          }
          return prev;
        });
      }
    }).catch(() => {});
  }, [activeDocId, activeDoctor?._id, activeDoctor?.id]);

  // Load appointments & prescriptions whenever active doctor switches, and sync with backend
  React.useEffect(() => {
    if (!activeDocId || activeDocId === 'default') return;
    try {
      const savedApts = localStorage.getItem(`sehatbuddy_doc_appointments_${activeDocId}`);
      if (savedApts) setAppointments(JSON.parse(savedApts));
      else setAppointments(INITIAL_APPOINTMENTS);

      const savedRx = localStorage.getItem(`sehatbuddy_doc_prescriptions_${activeDocId}`);
      if (savedRx) setPrescriptions(JSON.parse(savedRx));
      else setPrescriptions(INITIAL_PRESCRIPTIONS);
    } catch {}

    fetchRemoteAppointments();
  }, [activeDocId, fetchRemoteAppointments]);

  // Real-time synchronization listener for appointments
  React.useEffect(() => {
    const handleAppointmentsSync = (e) => {
      fetchRemoteAppointments();
    };

    window.addEventListener('sehat_appointments_changed', handleAppointmentsSync);
    window.addEventListener('sehat_db_change', (e) => {
      if (e.detail?.collection === 'appointments') {
        fetchRemoteAppointments();
      }
    });

    const handleStorageChange = (e) => {
      if (e.key === `sehatbuddy_doc_appointments_${activeDocId}` && e.newValue) {
        try {
          setAppointments(JSON.parse(e.newValue));
        } catch {}
      }
      if (e.key === 'sehat_buddy_appointments') {
        fetchRemoteAppointments();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Fallback polling every 5 seconds to ensure real-time queue freshness
    const pollInterval = setInterval(() => {
      fetchRemoteAppointments();
    }, 5000);

    return () => {
      window.removeEventListener('sehat_appointments_changed', handleAppointmentsSync);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pollInterval);
    };
  }, [activeDocId, fetchRemoteAppointments]);

  React.useEffect(() => {
    const currentId = activeDoctor?.id || activeDoctor?._id;
    if (currentId && (String(currentId) !== String(initialDoctorIdRef.current) || !profileForm?.name)) {
      initialDoctorIdRef.current = String(currentId);
      setProfileForm({
        ...activeDoctor,
        name: activeDoctor.name || '',
        specialty: activeDoctor.specialization || activeDoctor.specialty || 'General Medicine',
        price: activeDoctor.fees ?? activeDoctor.price ?? 500,
        experience: typeof activeDoctor.experience === 'string' ? parseInt(activeDoctor.experience) : (activeDoctor.experience || 5),
        licenseNumber: activeDoctor.licenseNumber || '',
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
        slotDuration: activeDoctor.slotDuration || 20
      });
    }
  }, [activeDoctor?.id, activeDoctor?._id, activeDoctor?.name, activeDoctor?.availableSlots, activeDoctor?.scheduleDays]);

  // Awards handlers
  const handleAddAward = (e) => {
    e?.preventDefault();
    if (!newAwardInput.trim()) return;
    const current = Array.isArray(profileForm.awards) ? profileForm.awards : [];
    const updated = [...current, newAwardInput.trim()];
    setProfileForm(prev => ({ ...prev, awards: updated }));
    setNewAwardInput('');
    updateDoctor(activeDoctor.id || activeDoctor._id, { awards: updated });
    showToast('Award added and saved!');
  };

  const handleUpdateAward = (index) => {
    if (!editingAward.text.trim()) return;
    const current = Array.isArray(profileForm.awards) ? profileForm.awards : [];
    const updated = current.map((item, i) => (i === index ? editingAward.text.trim() : item));
    setProfileForm(prev => ({ ...prev, awards: updated }));
    setEditingAward({ index: null, text: '' });
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

  // Instagram Reels handlers
  const handleAddReel = (e) => {
    e?.preventDefault();
    if (!newReelInput.trim()) return;
    const current = Array.isArray(profileForm.reels) ? profileForm.reels : [];
    const updated = [...current, newReelInput.trim()];
    setProfileForm(prev => ({ ...prev, reels: updated }));
    setNewReelInput('');
    updateDoctor(activeDoctor.id || activeDoctor._id, { reels: updated });
    showToast('Instagram reel added and saved!');
  };

  const handleUpdateReel = (index) => {
    if (!editingReel.text.trim()) return;
    const current = Array.isArray(profileForm.reels) ? profileForm.reels : [];
    const updated = current.map((item, i) => (i === index ? editingReel.text.trim() : item));
    setProfileForm(prev => ({ ...prev, reels: updated }));
    setEditingReel({ index: null, text: '' });
    updateDoctor(activeDoctor.id || activeDoctor._id, { reels: updated });
    showToast('Instagram reel updated!');
  };

  const handleRemoveReel = (index) => {
    const current = Array.isArray(profileForm.reels) ? profileForm.reels : [];
    const updated = current.filter((_, i) => i !== index);
    setProfileForm(prev => ({ ...prev, reels: updated }));
    updateDoctor(activeDoctor.id || activeDoctor._id, { reels: updated });
    showToast('Instagram reel deleted!');
  };

  const handleClearAllReels = () => {
    if (!window.confirm('Are you sure you want to delete all Instagram reels?')) return;
    setProfileForm(prev => ({ ...prev, reels: [] }));
    updateDoctor(activeDoctor.id || activeDoctor._id, { reels: [] });
    showToast('All reels deleted.');
  };

  // Educational YouTube Videos handlers
  const handleAddYoutube = (e) => {
    e?.preventDefault();
    if (!newYoutubeInput.trim()) return;
    const current = Array.isArray(profileForm.youtube_videos) ? profileForm.youtube_videos : [];
    const updated = [...current, newYoutubeInput.trim()];
    setProfileForm(prev => ({ ...prev, youtube_videos: updated }));
    setNewYoutubeInput('');
    updateDoctor(activeDoctor.id || activeDoctor._id, { youtube_videos: updated });
    showToast('Educational YouTube video added!');
  };

  const handleUpdateYoutube = (index) => {
    if (!editingYoutube.text.trim()) return;
    const current = Array.isArray(profileForm.youtube_videos) ? profileForm.youtube_videos : [];
    const updated = current.map((item, i) => (i === index ? editingYoutube.text.trim() : item));
    setProfileForm(prev => ({ ...prev, youtube_videos: updated }));
    setEditingYoutube({ index: null, text: '' });
    updateDoctor(activeDoctor.id || activeDoctor._id, { youtube_videos: updated });
    showToast('Educational video updated!');
  };

  const handleRemoveYoutube = (index) => {
    const current = Array.isArray(profileForm.youtube_videos) ? profileForm.youtube_videos : [];
    const updated = current.filter((_, i) => i !== index);
    setProfileForm(prev => ({ ...prev, youtube_videos: updated }));
    updateDoctor(activeDoctor.id || activeDoctor._id, { youtube_videos: updated });
    showToast('Educational video deleted!');
  };

  const handleClearAllYoutube = () => {
    if (!window.confirm('Are you sure you want to delete all educational videos?')) return;
    setProfileForm(prev => ({ ...prev, youtube_videos: [] }));
    updateDoctor(activeDoctor.id || activeDoctor._id, { youtube_videos: [] });
    showToast('All educational videos deleted.');
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
    const docId = activeDoctor.id || activeDoctor._id;
    if (!docId) return;

    const payload = {
      ...profileForm,
      name: profileForm.name || activeDoctor.name || 'Doctor',
      specialization: profileForm.specialty || profileForm.specialization || 'General Medicine',
      specialty: profileForm.specialty || profileForm.specialization || 'General Medicine',
      fees: Number(profileForm.price ?? profileForm.fees) || 500,
      price: Number(profileForm.price ?? profileForm.fees) || 500,
      experience: parseInt(profileForm.experience, 10) || 0,
      jobTitle: profileForm.jobTitle !== undefined ? profileForm.jobTitle : 'Senior consultant',
      licenseNumber: profileForm.licenseNumber || '',
      awards: Array.isArray(profileForm.awards) ? profileForm.awards : [],
      certifications: Array.isArray(profileForm.certifications) ? profileForm.certifications : [],
      memberships: Array.isArray(profileForm.memberships) ? profileForm.memberships : [],
      careerExperience: Array.isArray(profileForm.careerExperience) ? profileForm.careerExperience : [],
      reels: Array.isArray(profileForm.reels) ? profileForm.reels : [],
      youtube_videos: Array.isArray(profileForm.youtube_videos) ? profileForm.youtube_videos : [],
      availableDays: profileForm.availableDays || 'Mon - Sat (10am - 4pm)',
      scheduleDays: Array.isArray(profileForm.scheduleDays) ? profileForm.scheduleDays : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      availableSlots: Array.isArray(profileForm.availableSlots) ? profileForm.availableSlots : ['04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'],
      slotDuration: Number(profileForm.slotDuration) || 20
    };

    await updateDoctor(docId, payload);
    showToast('All profile details, credentials, schedule & fees saved successfully!');
  };

  // Save About Section directly
  const [isSavingAbout, setIsSavingAbout] = useState(false);
  const handleSaveAbout = async () => {
    setIsSavingAbout(true);
    try {
      const docId = activeDoctor.id || activeDoctor._id;
      await updateDoctor(docId, {
        about: profileForm.about || ''
      });
      showToast('About section updated and saved successfully!');
    } catch (err) {
      console.error('Failed to save about section:', err);
      showToast('Failed to save about section');
    } finally {
      setIsSavingAbout(false);
    }
  };

  // View public live doctor profile
  const handleViewLiveProfile = () => {
    const docId = activeDoctor.id || activeDoctor._id;
    if (onNavigate) {
      onNavigate('doctor-profile:' + docId);
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
      reels: [],
      youtube_videos: [],
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
    setAppointments(prev => {
      const updated = prev.map(apt => (apt.id === id ? { ...apt, status: newStatus } : apt));
      try {
        localStorage.setItem(`sehatbuddy_doc_appointments_${activeDocId}`, JSON.stringify(updated));
        broadcastSync(`sehatbuddy_doc_appointments_${activeDocId}`, updated);
      } catch {}
      return updated;
    });

    try {
      await api.updateAppointmentStatus(id, {
        status: newStatus,
        isCompleted: newStatus === 'Completed',
        cancelled: newStatus === 'Cancelled'
      });
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sehat_appointments_changed', { detail: { id, status: newStatus } }));
    }
    showToast(`Appointment marked as ${newStatus}`);
  };

  const handleDeleteAppointment = (id) => {
    if (!window.confirm('Are you sure you want to remove this appointment from your queue?')) return;
    setAppointments(prev => {
      const updated = prev.filter(apt => apt.id !== id);
      try {
        localStorage.setItem(`sehatbuddy_doc_appointments_${activeDocId}`, JSON.stringify(updated));
        broadcastSync(`sehatbuddy_doc_appointments_${activeDocId}`, updated);
      } catch {}
      return updated;
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sehat_appointments_changed', { detail: { id, action: 'delete' } }));
    }
    showToast('Appointment removed from queue');
  };

  const handleAddAppointment = (e) => {
    e.preventDefault();
    if (!newAppointmentData.patientName.trim()) return;

    const newApt = {
      id: Date.now(),
      patientName: newAppointmentData.patientName.trim(),
      age: parseInt(newAppointmentData.age, 10) || 30,
      gender: newAppointmentData.gender,
      time: newAppointmentData.time,
      date: 'Today',
      type: newAppointmentData.type,
      symptoms: newAppointmentData.symptoms || 'General Checkup',
      status: 'Confirmed',
      phone: newAppointmentData.phone || '+91 98000 00000'
    };

    setAppointments(prev => {
      const updated = [newApt, ...prev];
      try {
        localStorage.setItem(`sehatbuddy_doc_appointments_${activeDocId}`, JSON.stringify(updated));
        broadcastSync(`sehatbuddy_doc_appointments_${activeDocId}`, updated);
      } catch {}
      return updated;
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sehat_appointments_changed', { detail: { appointment: newApt, action: 'add' } }));
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
    showToast(`Appointment scheduled for ${newApt.patientName}`);
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
      try {
        localStorage.setItem(`sehatbuddy_doc_prescriptions_${activeDocId}`, JSON.stringify(updated));
      } catch {}
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
      try {
        localStorage.setItem(`sehatbuddy_doc_prescriptions_${activeDocId}`, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast('Prescription note deleted.');
  };

  // Filtered appointments
  const filteredAppointments = appointments.filter(apt => {
    if (appointmentFilter === 'all') return true;
    if (appointmentFilter === 'today') return apt.date === 'Today';
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
            <button className={styles.navLinkBtn} onClick={() => onNavigate('hospital')}>
              Hospital Portal
            </button>
            <button className={styles.navLinkBtn} onClick={() => onNavigate('admin')}>
              Admin
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
                {appointments.filter(a => a.date === 'Today').length || appointments.length} Scheduled
              </div>
              <span className={styles.kpiSub}>
                {appointments.filter(a => a.status === 'Completed').length} Completed
              </span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIconWrap} ${styles.kpiBlue}`}>
              <DollarSign size={22} />
            </div>
            <div>
              <span className={styles.kpiLabel}>Consultation Fee</span>
              <div className={styles.kpiValue}>₹{activeDoctor.price || activeDoctor.fees || 700}</div>
              <span className={styles.kpiSub}>
                Estimated Daily: ₹{(activeDoctor.price || activeDoctor.fees || 700) * (appointments.filter(a => a.date === 'Today').length || appointments.length)}
              </span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIconWrap} ${styles.kpiYellow}`}>
              <Star size={22} />
            </div>
            <div>
              <span className={styles.kpiLabel}>Patient Satisfaction</span>
              <div className={styles.kpiValue}>{activeDoctor.rating || 4.8} ★</div>
              <span className={styles.kpiSub}>{activeDoctor.reviews || '500+'} reviews</span>
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
              <span className={styles.kpiSub}>OPD Slot: 20 mins</span>
            </div>
          </div>
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
              {filteredAppointments.map((apt) => (
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
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: PRESCRIPTIONS */}
        {activeTab === 'prescriptions' && (
          <div className={styles.tabContentArea}>
            <div className={styles.rxGrid}>
              {prescriptions.map((rx) => (
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
              ))}
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
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Specialty / Department</label>
                  <input
                    type="text"
                    value={profileForm.specialty || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, specialty: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Job Title / Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior consultant"
                    value={profileForm.jobTitle !== undefined ? profileForm.jobTitle : 'Senior consultant'}
                    onChange={(e) => setProfileForm({ ...profileForm, jobTitle: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Experience (Years)</label>
                  <input
                    type="number"
                    value={profileForm.experience ?? ''}
                    onChange={(e) => setProfileForm({ ...profileForm, experience: e.target.value === '' ? '' : Number(e.target.value) })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Hospital Affiliation</label>
                  <input
                    type="text"
                    value={profileForm.hospital || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, hospital: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Degrees / Qualifications</label>
                  <input
                    type="text"
                    value={profileForm.degree || profileForm.qualifications || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, degree: e.target.value, qualifications: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Consultation Fee (₹)</label>
                  <input
                    type="number"
                    value={profileForm.price ?? profileForm.fees ?? ''}
                    onChange={(e) => setProfileForm({ ...profileForm, price: e.target.value === '' ? '' : Number(e.target.value) })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Contact Phone</label>
                  <input
                    type="text"
                    value={profileForm.phone || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
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
                  />
                </div>

                <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                  <label>Available Consultation Hours</label>
                  <input
                    type="text"
                    value={profileForm.availableDays || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, availableDays: e.target.value })}
                  />
                </div>
              </form>

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
                      This text appears in the "About Dr. {activeDoctor.name || 'Doctor'}" card on your public doctor profile page. You can write multiple paragraphs by pressing Enter twice.
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
                    profileForm.awards.map((award, idx) => (
                      <div
                        key={idx}
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="text"
                              value={editingAward.text}
                              onChange={(e) => setEditingAward({ index: idx, text: e.target.value })}
                              style={{ padding: '2px 6px', fontSize: '0.82rem', borderRadius: '4px', border: '1px solid #d97706', outline: 'none' }}
                              autoFocus
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
                              onClick={() => setEditingAward({ index: null, text: '' })}
                              style={{ background: '#cbd5e1', color: '#334155', border: 'none', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', fontSize: '0.75rem' }}
                              title="Cancel"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <Award size={14} color="#d97706" />
                            <span>{award}</span>
                            <button
                              type="button"
                              onClick={() => setEditingAward({ index: idx, text: award })}
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
                    ))
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '0.82rem', fontStyle: 'italic' }}>No awards added yet.</span>
                  )}
                </div>

                <form onSubmit={handleAddAward} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="e.g. Best Cardiologist 2023 - CSI, National Medical Excellence Award..."
                    value={newAwardInput}
                    onChange={(e) => setNewAwardInput(e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.88rem' }}
                  />
                  <button
                    type="submit"
                    style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
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
                        key={idx}
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
                        key={idx}
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
                          key={idx}
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

              {/* SECTION: INSTAGRAM REELS (SHOWN ON DOCTOR PAGE) */}
              <div style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
                    <Instagram size={18} color="#e1306c" />
                    Instagram Reels (Displayed on Doctor Profile)
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      {(profileForm.reels || []).length} Reels
                    </span>
                    {(profileForm.reels || []).length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllReels}
                        style={{ background: 'none', border: 'none', color: '#e11d48', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Delete All
                      </button>
                    )}
                  </div>
                </div>
                <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '0 0 12px 0' }}>
                  Add your healthcare Instagram Reel URLs. Patients can watch your reels directly on your public doctor profile page.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                  {(profileForm.reels && profileForm.reels.length > 0) ? (
                    profileForm.reels.map((reelUrl, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: '#fdf2f8',
                          border: '1px solid #fbcfe8',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                          color: '#831843'
                        }}
                      >
                        {editingReel.index === idx ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                            <input
                              type="url"
                              value={editingReel.text}
                              onChange={(e) => setEditingReel({ index: idx, text: e.target.value })}
                              style={{ flex: 1, padding: '4px 8px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #db2777', outline: 'none' }}
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateReel(idx)}
                              style={{ background: '#db2777', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingReel({ index: null, text: '' })}
                              style={{ background: '#cbd5e1', color: '#334155', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.78rem' }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}>
                              <Play size={14} color="#db2777" style={{ flexShrink: 0 }} />
                              <a
                                href={reelUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: '#db2777', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                              >
                                {reelUrl}
                              </a>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => setEditingReel({ index: idx, text: reelUrl })}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#db2777', padding: '2px', display: 'flex' }}
                                title="Modify reel link"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveReel(idx)}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px', display: 'flex' }}
                                title="Delete reel"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '0.82rem', fontStyle: 'italic' }}>No Instagram reels added yet.</span>
                  )}
                </div>

                <form onSubmit={handleAddReel} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="url"
                    placeholder="e.g. https://www.instagram.com/reel/C3abcXYZ123/..."
                    value={newReelInput}
                    onChange={(e) => setNewReelInput(e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.88rem' }}
                  />
                  <button
                    type="submit"
                    style={{ background: '#db2777', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                  >
                    + Add Reel
                  </button>
                </form>
              </div>

              {/* SECTION: EDUCATIONAL YOUTUBE VIDEOS (SHOWN ON DOCTOR PAGE) */}
              <div style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
                    <Youtube size={18} color="#dc2626" />
                    Educational YouTube Videos (Displayed on Doctor Profile)
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      {(profileForm.youtube_videos || []).length} Videos
                    </span>
                    {(profileForm.youtube_videos || []).length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllYoutube}
                        style={{ background: 'none', border: 'none', color: '#e11d48', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Delete All
                      </button>
                    )}
                  </div>
                </div>
                <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '0 0 12px 0' }}>
                  Add YouTube video links explaining medical treatments, preventative health, or patient success stories.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                  {(profileForm.youtube_videos && profileForm.youtube_videos.length > 0) ? (
                    profileForm.youtube_videos.map((vidUrl, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: '#fef2f2',
                          border: '1px solid #fecaca',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                          color: '#991b1b'
                        }}
                      >
                        {editingYoutube.index === idx ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                            <input
                              type="url"
                              value={editingYoutube.text}
                              onChange={(e) => setEditingYoutube({ index: idx, text: e.target.value })}
                              style={{ flex: 1, padding: '4px 8px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #dc2626', outline: 'none' }}
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateYoutube(idx)}
                              style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingYoutube({ index: null, text: '' })}
                              style={{ background: '#cbd5e1', color: '#334155', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.78rem' }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}>
                              <Play size={14} color="#dc2626" style={{ flexShrink: 0 }} />
                              <a
                                href={vidUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: '#dc2626', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                              >
                                {vidUrl}
                              </a>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => setEditingYoutube({ index: idx, text: vidUrl })}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '2px', display: 'flex' }}
                                title="Modify video link"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveYoutube(idx)}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px', display: 'flex' }}
                                title="Delete video"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '0.82rem', fontStyle: 'italic' }}>No YouTube videos added yet.</span>
                  )}
                </div>

                <form onSubmit={handleAddYoutube} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="url"
                    placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ..."
                    value={newYoutubeInput}
                    onChange={(e) => setNewYoutubeInput(e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.88rem' }}
                  />
                  <button
                    type="submit"
                    style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                  >
                    + Add Video
                  </button>
                </form>
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
                  type="text"
                  placeholder="+91 98765 43210"
                  value={newAppointmentData.phone}
                  onChange={(e) => setNewAppointmentData({ ...newAppointmentData, phone: e.target.value })}
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
                <button type="submit" className={styles.saveBtn}>
                  Confirm Appointment
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
              This will clear your <strong>About Bio, Awards, Certifications, Memberships, Career Timeline, Instagram Reels, and YouTube Videos</strong> from your public doctor profile.
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
    </div>
  );
};

export default DoctorDashboard;
