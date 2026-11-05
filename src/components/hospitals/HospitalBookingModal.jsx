import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calendar,
  Clock,
  Building2,
  User,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  ArrowRight,
  Loader2,
  Navigation,
  AlertCircle,
  Lock,
  Stethoscope
} from 'lucide-react';
import { API_BASE, api } from '../../services/api';
import { getAuthenticatedPatient } from '../../utils/patientAuth';
import { useData } from '../../context/useData';
import { isDoctorAffiliatedWithHospital } from '../../context/DataContext';
import styles from './HospitalBookingModal.module.css';

const TIME_SLOTS = [
  '09:00 AM',
  '10:00 AM',
  '11:30 AM',
  '01:30 PM',
  '02:30 PM',
  '04:00 PM',
  '05:30 PM',
  '06:30 PM'
];

const sortTimeSlots = (slots = []) => {
  if (!Array.isArray(slots)) return [];
  const parseTime = (t) => {
    if (!t || typeof t !== 'string') return 0;
    const match = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = (match[3] || 'AM').toUpperCase();
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };
  return [...slots].sort((a, b) => parseTime(a) - parseTime(b));
};

const isSlotPastForDate = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return false;
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  if (dateStr < todayStr) return true;
  if (dateStr > todayStr) return false;

  const match = String(timeStr).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return false;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const period = (match[3] || 'AM').toUpperCase();
  if (period === 'PM' && h < 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;

  return (h * 60 + m) <= (now.getHours() * 60 + now.getMinutes());
};

const resolveDoctorSlotsForDate = (doctor, dateObj) => {
  if (!doctor) {
    return {
      isAvailable: false,
      isOff: false,
      slots: [],
      statusNote: 'Please select a doctor to view their schedule'
    };
  }

  const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayNameShort = daysShort[dateObj.getDay()];
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;

  // Check overall doctor status
  const today = new Date();
  const isToday = dateObj.toDateString() === today.toDateString();
  if (isToday && (doctor.availabilityStatus === 'On Leave' || doctor.available === false)) {
    return {
      isAvailable: false,
      isOff: true,
      slots: [],
      statusNote: `${doctor.name} is currently On Leave today`
    };
  }

  // 1. dateWiseSlots (highest priority override by doctor dashboard)
  const dateConfig = doctor.dateWiseSlots?.[dateStr];
  if (dateConfig !== undefined && dateConfig !== null) {
    if (dateConfig === 'off' || dateConfig?.isOff === true) {
      return {
        isAvailable: false,
        isOff: true,
        slots: [],
        statusNote: `${doctor.name} is off duty on this date`
      };
    }
    const customList = Array.isArray(dateConfig) ? dateConfig : (Array.isArray(dateConfig?.slots) ? dateConfig.slots : []);
    if (customList.length > 0) {
      const sorted = sortTimeSlots(customList);
      return {
        isAvailable: true,
        isOff: false,
        slots: sorted,
        statusNote: `${sorted.length} custom slots configured`
      };
    }
    return {
      isAvailable: false,
      isOff: true,
      slots: [],
      statusNote: 'No slots scheduled by doctor for this date'
    };
  }

  // 2. dayWiseSlots (Mon, Tue, etc.)
  const dayConfig = doctor.dayWiseSlots?.[dayNameShort] || doctor.dayWiseSlots?.[dateObj.toLocaleDateString('en-US', { weekday: 'long' })];
  if (dayConfig !== undefined && dayConfig !== null) {
    if (dayConfig === 'off' || dayConfig?.isOff === true) {
      return {
        isAvailable: false,
        isOff: true,
        slots: [],
        statusNote: `${doctor.name} is off on ${dayNameShort}`
      };
    }
    const daySlots = Array.isArray(dayConfig) ? dayConfig : (Array.isArray(dayConfig?.slots) ? dayConfig.slots : []);
    if (daySlots.length > 0) {
      const sorted = sortTimeSlots(daySlots);
      return {
        isAvailable: true,
        isOff: false,
        slots: sorted,
        statusNote: null
      };
    }
  }

  // 3. scheduleDays check
  if (Array.isArray(doctor.scheduleDays) && doctor.scheduleDays.length > 0) {
    const isWorkingDay = doctor.scheduleDays.some(sd =>
      String(sd).toLowerCase().startsWith(dayNameShort.toLowerCase())
    );
    if (!isWorkingDay) {
      return {
        isAvailable: false,
        isOff: true,
        slots: [],
        statusNote: `${doctor.name} does not practice on ${dayNameShort}`
      };
    }
  }

  // 4. availableSlots
  if (Array.isArray(doctor.availableSlots) && doctor.availableSlots.length > 0) {
    return {
      isAvailable: true,
      isOff: false,
      slots: sortTimeSlots(doctor.availableSlots),
      statusNote: null
    };
  }

  // 5. If doctor has not configured any slots yet
  return {
    isAvailable: false,
    isOff: false,
    slots: [],
    statusNote: 'No slots configured by doctor'
  };
};

const HospitalBookingModal = ({
  hospital,
  onClose,
  onGetDirections,
  onBookingSuccess,
  preselectedDepartment = null,
  onNavigate
}) => {
  // Prevent background scrolling when modal is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Check login status
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const user = useMemo(() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  }, []);
  const isLoggedIn = Boolean(token || user);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const { doctors = [] } = useData();

  // Extract departments from hospital
  const departmentsList = useMemo(() => {
    const fromHospital = hospital?.specialities || hospital?.specialties || [];
    const defaults = ['General Medicine', 'Cardiology', 'Orthopedics', 'Neurology', 'Nephrology', 'General Surgery', 'Pediatrics', 'Obstetrics & Gynecology'];
    const merged = Array.from(new Set([...fromHospital, ...defaults])).filter(Boolean);
    return merged.slice(0, 8);
  }, [hospital]);

  // Form states
  const visitType = 'Hospital OPD Visit';
  const [selectedDept, setSelectedDept] = useState(preselectedDepartment || departmentsList[0] || 'General Medicine');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');

  // Only show doctors affiliated with / working inside THIS hospital
  const hospitalDoctors = useMemo(() => {
    if (!Array.isArray(doctors) || doctors.length === 0 || !hospital) return [];

    // 1. Strict affiliation check (matching hospital name, hospitalId, staff_doctors, star_doctors, staff_emails)
    const affiliated = doctors.filter(doc => isDoctorAffiliatedWithHospital(doc, hospital));
    if (affiliated.length > 0) return affiliated;

    // 2. Direct name/ID match fallback
    const hospName = String(hospital?.name || '').toLowerCase().trim();
    const hospId = String(hospital?._id || hospital?.id || '').trim();
    if (!hospName && !hospId) return [];

    return doctors.filter(doc => {
      const docHosp = String(doc.hospital || '').toLowerCase().trim();
      const docHospId = String(doc.hospitalId || doc.hospital_id || '').trim();
      if (hospId && docHospId && docHospId === hospId) return true;
      if (docHosp && hospName && (docHosp === hospName || docHosp.includes(hospName))) return true;
      return false;
    });
  }, [doctors, hospital]);

  // Filter doctors matching current selected department (strictly from hospitalDoctors)
  const filteredDoctors = useMemo(() => {
    if (!hospitalDoctors || hospitalDoctors.length === 0) return [];
    if (!selectedDept) return hospitalDoctors;

    const normDept = selectedDept.toLowerCase().replace(/[^a-z0-9]/g, '');
    const matched = hospitalDoctors.filter(d => {
      const spec = String(d.specialization || d.specialty || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return spec.includes(normDept) || normDept.includes(spec);
    });

    if (matched.length > 0) {
      return matched;
    }

    return hospitalDoctors;
  }, [hospitalDoctors, selectedDept]);

  // Selected doctor object resolved from active doctors list
  const selectedDoctor = useMemo(() => {
    if (!selectedDoctorId) return null;
    return (doctors || []).find(d => String(d._id || d.id) === String(selectedDoctorId)) || null;
  }, [doctors, selectedDoctorId]);

  // Dynamic 4 upcoming dates linked to selected doctor's real-time schedule
  const dateOptions = useMemo(() => {
    const options = [];
    const today = new Date();
    for (let i = 0; i < 4; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const dateNum = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const doctorSchedule = resolveDoctorSlotsForDate(selectedDoctor, d);
      const upcomingCount = doctorSchedule.slots.filter(s => !isSlotPastForDate(dateStr, s)).length;

      options.push({
        idx: i,
        day: dayName,
        date: dateNum,
        dateObj: d,
        dateStr,
        label: `${dayName}, ${dateNum}`,
        isOff: doctorSchedule.isOff,
        slotsList: doctorSchedule.slots,
        statusNote: doctorSchedule.statusNote,
        slotsBadge: !selectedDoctor
          ? 'Select Doctor'
          : doctorSchedule.isOff
            ? 'Off Duty'
            : upcomingCount > 0
              ? `${upcomingCount} Slots Left`
              : (doctorSchedule.slots.length > 0 ? 'Slots Over' : 'No Slots')
      });
    }
    return options;
  }, [selectedDoctor]);

  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const activeSlots = dateOptions[selectedDateIdx]?.slotsList || [];
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');

  // Keep time slot synchronized when doctor or date changes, skipping past slots
  useEffect(() => {
    const curDateStr = dateOptions[selectedDateIdx]?.dateStr;
    const availableUpcoming = activeSlots.filter(s => !isSlotPastForDate(curDateStr, s));
    if (availableUpcoming.length > 0) {
      if (!availableUpcoming.includes(selectedTimeSlot)) {
        setSelectedTimeSlot(availableUpcoming[0]);
      }
    } else {
      setSelectedTimeSlot('');
    }
  }, [selectedDateIdx, selectedDoctorId, activeSlots, dateOptions]);

  // Pre-fill user details strictly only if logged in as a patient
  const [patientName, setPatientName] = useState(() => {
    const { user } = getAuthenticatedPatient();
    return user?.name || '';
  });

  const [patientPhone, setPatientPhone] = useState(() => {
    const { user } = getAuthenticatedPatient();
    return user?.phone || '';
  });

  const [patientEmail, setPatientEmail] = useState(() => {
    const { user } = getAuthenticatedPatient();
    return user?.email || '';
  });

  const [symptoms, setSymptoms] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Not specified');

  // Restore draft if user was redirected from login
  useEffect(() => {
    try {
      const draftStr = localStorage.getItem('pendingHospitalBooking');
      if (draftStr) {
        const draft = JSON.parse(draftStr);
        if (draft.hospitalId === (hospital.id || hospital._id)) {
          if (draft.selectedDept) setSelectedDept(draft.selectedDept);
          if (draft.selectedDoctorId) setSelectedDoctorId(draft.selectedDoctorId);
          if (draft.selectedTimeSlot) setSelectedTimeSlot(draft.selectedTimeSlot);
          if (draft.patientName) setPatientName(draft.patientName);
          if (draft.patientPhone) setPatientPhone(draft.patientPhone);
          if (draft.patientEmail) setPatientEmail(draft.patientEmail);
          if (draft.symptoms) setSymptoms(draft.symptoms);
          if (draft.age) setAge(draft.age);
          if (draft.gender) setGender(draft.gender);
        }
        localStorage.removeItem('pendingHospitalBooking');
      }
    } catch {}
  }, [hospital]);

  // Booking process states
  const [bookingStatus, setBookingStatus] = useState(null); // 'loading', 'success', 'error'
  const [confirmedBookingData, setConfirmedBookingData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  if (!hospital) return null;

  const handleSubmitBooking = async (e) => {
    e.preventDefault();

    if (!patientName.trim()) {
      alert('Please enter patient full name');
      return;
    }
    if (!patientPhone.trim() || patientPhone.replace(/\D/g, '').length < 10) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!patientEmail.trim() || !patientEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }
    if (!selectedDoctorId || !selectedDoctor) {
      alert('Please select a doctor to book an appointment');
      return;
    }
    if (!selectedTimeSlot) {
      alert('Please select an available appointment time slot');
      return;
    }

    if (!symptoms.trim()) {
      alert('Please enter symptoms or reason for hospital visit');
      return;
    }

    const chosenDateObj = dateOptions[selectedDateIdx] || dateOptions[0];

    // Check: Cannot book past time slot
    if (isSlotPastForDate(chosenDateObj.dateStr, selectedTimeSlot)) {
      alert(`The time slot ${selectedTimeSlot} has already passed for today. Please select an upcoming slot or another date.`);
      return;
    }

    // Check: One booking per person per day
    try {
      const existing = JSON.parse(localStorage.getItem('sehat_buddy_appointments') || '[]');
      const alreadyBooked = existing.find(a =>
        a.slotDate === chosenDateObj.dateStr &&
        a.status !== 'Cancelled' && !a.cancelled &&
        (
          (patientPhone.trim() && (a.patientPhone === patientPhone.trim() || a.userData?.phone === patientPhone.trim())) ||
          (patientEmail.trim() && (a.patientEmail === patientEmail.trim() || a.userData?.email === patientEmail.trim()))
        )
      );
      if (alreadyBooked) {
        alert(`An appointment is already booked for ${patientName.trim()} on ${chosenDateObj.label} (${alreadyBooked.slotTime}). Only one booking per person per day is allowed.`);
        return;
      }
    } catch {}

    // CHECK LOGIN: If user is not logged in, prompt login now after form is filled!
    if (!isLoggedIn) {
      try {
        localStorage.setItem('pendingHospitalBooking', JSON.stringify({
          hospitalId: hospital.id || hospital._id,
          selectedDept,
          selectedDoctorId,
          selectedDateIdx,
          selectedTimeSlot,
          patientName,
          patientPhone,
          patientEmail,
          age,
          gender,
          symptoms
        }));
        localStorage.setItem('autoOpenHospitalBooking', 'true');
      } catch {}

      setShowLoginPrompt(true);
      return;
    }

    setBookingStatus('loading');
    setErrorMessage('');

    const hospitalName = hospital.name || 'Hospital Center';
    const hospitalAddress = hospital.address || '';
    const hospitalId = hospital.id || hospital._id || 'hosp-default';

    const payload = {
      hospitalId,
      doctorId: selectedDoctor?._id || selectedDoctor?.id || null,
      doctorName: selectedDoctor?.name || 'Hospital Duty Specialist',
      slotDate: chosenDateObj.dateStr,
      slotTime: selectedTimeSlot,
      department: selectedDept,
      consultationType: visitType,
      patientName: patientName.trim(),
      patientPhone: patientPhone.trim(),
      patientEmail: patientEmail.trim(),
      age: (age && !isNaN(parseInt(age, 10)) && parseInt(age, 10) > 0) ? parseInt(age, 10) : null,
      gender: (gender && gender !== 'Not specified' && gender !== 'Not Selected') ? gender : null,
      symptoms: symptoms.trim()
    };

    let serverBooking = null;
    try {
      serverBooking = await api.bookHospitalAppointment(payload);
    } catch (err) {
      console.error('[HospitalBookingModal] Server API booking error:', err);
      setErrorMessage(err.message || 'Failed to confirm appointment on server. Please try again.');
      setBookingStatus(null);
      return;
    }

    // Generate appointment record from persisted DB document
    const aptId = serverBooking?._id || serverBooking?.id || `SB-HOSP-${Math.floor(10000 + Math.random() * 90000)}`;
    const parsedAge = (age && !isNaN(parseInt(age, 10)) && parseInt(age, 10) > 0) ? parseInt(age, 10) : (serverBooking?.userData?.age || null);
    const parsedGender = (gender && gender !== 'Not specified' && gender !== 'Not Selected') ? gender : (serverBooking?.userData?.gender || null);

    const newBooking = {
      ...serverBooking,
      id: aptId,
      appointmentId: aptId,
      appointmentType: 'hospital',
      hospitalId,
      hospitalName,
      hospitalAddress,
      hospitalImage: hospital.image || 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80',
      department: selectedDept,
      docId: selectedDoctor?._id || selectedDoctor?.id || '',
      doctorName: selectedDoctor?.name || 'Hospital Duty Specialist',
      doctorImage: selectedDoctor?.image || null,
      doctorSpecialty: selectedDoctor?.specialization || selectedDoctor?.specialty || selectedDept,
      consultationType: visitType,
      patientName: patientName.trim(),
      patientPhone: patientPhone.trim(),
      patientEmail: patientEmail.trim(),
      patientAge: parsedAge,
      patientGender: parsedGender,
      age: parsedAge,
      gender: parsedGender,
      userData: {
        ...(serverBooking?.userData || {}),
        name: patientName.trim(),
        phone: patientPhone.trim(),
        email: patientEmail.trim(),
        age: parsedAge,
        gender: parsedGender,
        symptoms: symptoms.trim()
      },
      symptoms: symptoms.trim(),
      slotDate: chosenDateObj.dateStr,
      dateLabel: chosenDateObj.label,
      slotTime: selectedTimeSlot,
      amount: 0,
      fee: 'Free Registration / Cashless TPA',
      status: 'Confirmed',
      bookedAt: new Date().toISOString()
    };

    try {
      const existing = JSON.parse(localStorage.getItem('sehat_buddy_appointments') || '[]');
      existing.unshift(newBooking);
      localStorage.setItem('sehat_buddy_appointments', JSON.stringify(existing));
      localStorage.setItem('sehat_last_appointment_sync', Date.now().toString());
    } catch (err) {
      console.warn('[HospitalBookingModal] localStorage write error:', err);
    }

    // Broadcast appointment change so Admin Panel & Hospital Dashboard update in REAL TIME without refresh
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sehat_appointments_changed', { detail: newBooking }));
      try {
        if (window.BroadcastChannel) {
          const syncChan = new BroadcastChannel('sehat_appointments_sync');
          syncChan.postMessage({ type: 'appointment_created', data: newBooking });
          syncChan.close();
        }
      } catch {}
    }

    setConfirmedBookingData(newBooking);
    setBookingStatus('success');

    if (onBookingSuccess) {
      onBookingSuccess(newBooking);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={() => !bookingStatus && onClose()}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <img
              src={hospital.image || 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80'}
              alt={hospital.name}
              className={styles.hospitalThumb}
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80';
              }}
            />
            <div className={styles.headerInfo}>
              <div className={styles.headerBadge}>
                <ShieldCheck size={12} /> Verified Hospital Partner
              </div>
              <h2 className={styles.modalTitle}>{hospital.name}</h2>
              <p className={styles.modalSubtitle}>
                <MapPin size={12} />
                <span>{hospital.city || 'Bengaluru'} • {hospital.address ? hospital.address.split(',')[0] : 'Medical Center'}</span>
              </p>
            </div>
          </div>
          {!bookingStatus && (
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className={styles.modalBody}>
          {bookingStatus === 'success' ? (
            /* Confirmation Screen */
            <div className={styles.successWrapper}>
              <div className={styles.successIconCircle}>
                <CheckCircle2 size={46} strokeWidth={2.4} />
              </div>
              <h3 className={styles.successTitle}>Hospital Visit Confirmed!</h3>
              <div className={styles.tokenBadge}>
                <span>Token ID:</span>
                <strong>{confirmedBookingData?.appointmentId || confirmedBookingData?.id}</strong>
              </div>
              <p className={styles.successText}>
                Your appointment at <strong>{hospital.name}</strong> has been successfully booked for{' '}
                <strong>
                  {dateOptions[selectedDateIdx]?.label} at {selectedTimeSlot}
                </strong>{' '}
                under the <strong>{selectedDept}</strong> department.
              </p>

              <div className={styles.successDetailsCard}>
                <div className={styles.successDetailItem}>
                  <Building2 size={18} className={styles.successDetailIcon} />
                  <div className={styles.successDetailText}>
                    <strong>Facility & Department:</strong> {hospital.name} • {selectedDept}
                  </div>
                </div>
                <div className={styles.successDetailItem}>
                  <Clock size={18} className={styles.successDetailIcon} />
                  <div className={styles.successDetailText}>
                    <strong>Scheduled Slot:</strong> {dateOptions[selectedDateIdx]?.label} at {selectedTimeSlot}
                  </div>
                </div>
                <div className={styles.successDetailItem}>
                  <User size={18} className={styles.successDetailIcon} />
                  <div className={styles.successDetailText}>
                    <strong>Patient:</strong> {confirmedBookingData?.patientName} ({confirmedBookingData?.patientPhone})
                  </div>
                </div>
                <div className={styles.successDetailItem}>
                  <ShieldCheck size={18} className={styles.successDetailIcon} />
                  <div className={styles.successDetailText}>
                    <strong>Cashless / Desk Check-in:</strong> Present this Token ID at the reception or TPA counter upon arrival for express service.
                  </div>
                </div>
              </div>

              <div className={styles.successActionsRow}>
                <button
                  type="button"
                  className={styles.returnBtn}
                  onClick={() => {
                    setBookingStatus(null);
                    onClose();
                  }}
                >
                  Return to Profile
                </button>
                {onGetDirections ? (
                  <button
                    type="button"
                    className={styles.directionsBtn}
                    onClick={() => {
                      onClose();
                      onGetDirections();
                    }}
                  >
                    <Navigation size={16} />
                    <span>Get Directions</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.directionsBtn}
                    onClick={() => {
                      setBookingStatus(null);
                      onClose();
                    }}
                  >
                    <CheckCircle2 size={16} />
                    <span>Done</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Booking Form */
            <form onSubmit={handleSubmitBooking}>
              {/* Step 1: Department Selection */}
              <div className={styles.sectionBlock}>
                <label className={styles.sectionLabel}>
                  <span>1. Select Department or Clinical Specialty</span>
                </label>
                <div className={styles.deptScrollRow}>
                  {departmentsList.map((dept, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`${styles.deptPill} ${selectedDept === dept ? styles.deptPillActive : ''}`}
                      onClick={() => setSelectedDept(dept)}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Select Available Doctor */}
              <div className={styles.sectionBlock}>
                <label className={styles.sectionLabel}>
                  <span>2. Select Available Doctor</span>
                  <span className={styles.sectionLabelHelper}>Live Doctor Dashboard Schedule</span>
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className={styles.inputField}
                  style={{
                    fontWeight: 600,
                    appearance: 'auto',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">{hospitalDoctors.length > 0 ? '-- Select a Doctor --' : 'No doctors available for this hospital'}</option>
                  {filteredDoctors.map((doc) => {
                    const docId = doc._id || doc.id;
                    const spec = doc.specialization || doc.specialty || 'Specialist';
                    const isLeave = doc.availabilityStatus === 'On Leave' || doc.available === false;
                    return (
                      <option key={docId} value={docId}>
                        {doc.name} — {spec} {isLeave ? '• [On Leave Today]' : ''}
                      </option>
                    );
                  })}
                </select>

                {hospitalDoctors.length === 0 && (
                  <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#b91c1c', background: '#fef2f2', padding: '8px 12px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                    No doctors are currently registered under {hospital.name}. Slots cannot be shown until a doctor is assigned to this hospital.
                  </div>
                )}

                {selectedDoctor && (
                  <div style={{
                    marginTop: '10px',
                    padding: '10px 14px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img
                        src={selectedDoctor.image || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80'}
                        alt={selectedDoctor.name}
                        style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #2563eb' }}
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80';
                        }}
                      />
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                          {selectedDoctor.name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          {selectedDoctor.specialization || selectedDoctor.specialty || 'Consultant Specialist'} {selectedDoctor.experience ? `• ${selectedDoctor.experience}+ yrs exp` : ''}
                        </div>
                      </div>
                    </div>
                    <div>
                      {selectedDoctor.availabilityStatus === 'On Leave' || selectedDoctor.available === false ? (
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b91c1c', background: '#fef2f2', padding: '4px 8px', borderRadius: '6px', border: '1px solid #fecaca' }}>
                          ● On Leave
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', background: '#f0fdf4', padding: '4px 8px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                          ● Slots Configured
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Step 3: Date & Time Slot */}
              <div className={styles.sectionBlock}>
                <label className={styles.sectionLabel}>
                  <span>3. Choose Date & Time Slot</span>
                </label>
                {!selectedDoctor ? (
                  <div style={{
                    padding: '24px 20px',
                    background: '#f8fafc',
                    border: '1.5px dashed #cbd5e1',
                    borderRadius: '12px',
                    textAlign: 'center',
                    color: '#64748b'
                  }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: '#475569' }}>
                      <User size={20} />
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                      No Doctor Selected
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#64748b', maxWidth: '380px', margin: '0 auto', lineHeight: 1.45 }}>
                      {hospitalDoctors.length > 0
                        ? 'Please select an available doctor above to view their schedule and book a slot.'
                        : `No doctors are currently registered under ${hospital.name}. Slots cannot be shown until a doctor is assigned to this hospital.`}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={styles.dateSlotsRow}>
                      {dateOptions.map((opt, idx) => (
                        <div
                          key={idx}
                          className={`${styles.dateSlotCard} ${selectedDateIdx === idx ? styles.dateSlotCardActive : ''}`}
                          onClick={() => setSelectedDateIdx(idx)}
                        >
                          <span className={styles.dateDayName}>{opt.day}</span>
                          <span className={styles.dateDayNum}>{opt.date}</span>
                          <span
                            className={styles.dateSlotPill}
                            style={opt.isOff ? { background: '#fee2e2', color: '#dc2626' } : undefined}
                          >
                            {opt.slotsBadge}
                          </span>
                        </div>
                      ))}
                    </div>

                    {dateOptions[selectedDateIdx]?.isOff ? (
                      <div style={{ padding: '12px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '0.84rem', marginTop: '10px' }}>
                        {dateOptions[selectedDateIdx]?.statusNote || `${selectedDoctor.name} is off duty on this date. Please select another date.`}
                      </div>
                    ) : activeSlots.length === 0 ? (
                      <div style={{ padding: '12px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', color: '#92400e', fontSize: '0.84rem', marginTop: '10px' }}>
                        No appointment slots configured by {selectedDoctor.name} for {dateOptions[selectedDateIdx]?.label}.
                      </div>
                    ) : (
                      <div className={styles.timeSlotsGrid}>
                        {activeSlots.map((time, idx) => {
                          const curDateStr = dateOptions[selectedDateIdx]?.dateStr;
                          const isPast = isSlotPastForDate(curDateStr, time);
                          return (
                            <button
                              key={idx}
                              type="button"
                              disabled={isPast}
                              title={isPast ? 'Slot time has already passed for today' : `Select ${time}`}
                              className={`${styles.timeSlotBtn} ${selectedTimeSlot === time ? styles.timeSlotBtnActive : ''}`}
                              style={isPast ? {
                                opacity: 0.45,
                                cursor: 'not-allowed',
                                background: '#f1f5f9',
                                color: '#94a3b8',
                                textDecoration: 'line-through',
                                borderColor: '#e2e8f0'
                              } : undefined}
                              onClick={() => {
                                if (!isPast) setSelectedTimeSlot(time);
                              }}
                            >
                              <Clock size={13} />
                              <span>{time}</span>
                              {isPast && <span style={{ fontSize: '0.68rem', marginLeft: '3px', textDecoration: 'none' }}>(Over)</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Step 4: Patient Details */}
              <div className={styles.sectionBlock}>
                <label className={styles.sectionLabel}>
                  <span>4. Patient Information</span>
                </label>

                <div className={styles.formGrid2}>
                  <div>
                    <label className={styles.inputLabel}>Patient Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className={styles.inputField}
                    />
                  </div>
                  <div>
                    <label className={styles.inputLabel}>Mobile Phone Number *</label>
                    <input
                      type="tel"
                      required
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className={styles.inputField}
                    />
                  </div>
                </div>

                <div className={styles.formGrid2}>
                  <div>
                    <label className={styles.inputLabel}>Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="patient@example.com"
                      value={patientEmail}
                      onChange={(e) => setPatientEmail(e.target.value)}
                      className={styles.inputField}
                    />
                  </div>
                  <div>
                    <label className={styles.inputLabel}>Patient Age & Gender</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <input
                        type="number"
                        placeholder="Age"
                        min="1"
                        max="120"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className={styles.inputField}
                      />
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className={styles.inputField}
                        style={{ padding: '10px 8px' }}
                      >
                        <option value="Not specified">Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Symptoms or Reason for Hospital Visit *</label>
                  <textarea
                    rows="2"
                    required
                    placeholder="Briefly describe health concerns, previous diagnosis, or symptoms (required)..."
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className={styles.textareaField}
                  />
                </div>
              </div>

              {/* Summary Card */}
              <div className={styles.summaryBox}>
                <div className={styles.summaryRow}>
                  <span>Hospital Center</span>
                  <span className={styles.summaryVal}>{hospital.name}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Department</span>
                  <span className={styles.summaryVal}>
                    {selectedDept}
                  </span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Assigned Doctor</span>
                  <span className={styles.summaryVal}>
                    {selectedDoctor ? `${selectedDoctor.name} (${selectedDoctor.specialization || selectedDoctor.specialty || 'Specialist'})` : 'No Doctor Selected'}
                  </span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Selected Schedule</span>
                  <span className={styles.summaryVal}>
                    {selectedDoctor && selectedTimeSlot ? `${dateOptions[selectedDateIdx]?.label} at ${selectedTimeSlot}` : 'Slot Not Selected'}
                  </span>
                </div>

                <div className={styles.insuranceHint}>
                  <ShieldCheck size={16} />
                  <span>Cashless insurance pre-approval and Ayushman / TPA helpdesk available upon arrival</span>
                </div>
              </div>

              {errorMessage && (
                <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '0.85rem', marginBottom: '14px' }}>
                  {errorMessage}
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={bookingStatus === 'loading'}
                className={styles.submitBtn}
              >
                {bookingStatus === 'loading' ? (
                  <>
                    <Loader2 size={18} className={styles.spinIcon} />
                    <span>Confirming Appointment...</span>
                  </>
                ) : (
                  <>
                    <span>Book Appointment</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Login Prompt Dialog Modal */}
      {showLoginPrompt && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(5px)',
          zIndex: 11000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '440px',
            width: '100%',
            padding: '26px',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Lock size={28} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
              Please Log In First
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 20px', lineHeight: 1.5 }}>
              To book an appointment at <strong>{hospital.name}</strong>, you need to sign in to your Sehat Buddy account first. Once logged in, you will be able to complete your booking.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowLoginPrompt(false)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '8px',
                  background: '#ffffff',
                  color: '#334155',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onNavigate) {
                    onNavigate('user-login', { view: 'hospital-profile', param: hospital.id || hospital._id });
                  } else {
                    window.location.href = '/login';
                  }
                }}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  background: '#2563eb',
                  color: '#ffffff',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Log In Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalBookingModal;
