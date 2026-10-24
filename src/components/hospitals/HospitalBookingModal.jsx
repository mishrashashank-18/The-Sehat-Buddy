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
  Sparkles,
  Stethoscope,
  ArrowRight,
  Loader2,
  Navigation,
  Activity,
  AlertCircle,
  Lock
} from 'lucide-react';
import { API_BASE, api } from '../../services/api';
import { getAuthenticatedPatient } from '../../utils/patientAuth';
import styles from './HospitalBookingModal.module.css';

const VISIT_TYPES = [
  {
    id: 'Hospital OPD Visit',
    title: 'Hospital OPD Visit',
    desc: 'In-person consultation with hospital physician or surgeon',
    icon: Building2
  },
  {
    id: 'Priority Check-in',
    title: 'Priority Check-in',
    desc: 'Express token, fast-track desk & quick doctor consultation',
    icon: Sparkles
  },
  {
    id: 'Video Consultation',
    title: 'Video Consultation',
    desc: 'Tele-consultation with leading specialist from home',
    icon: Activity
  },
  {
    id: 'Admission / Bed Enquiry',
    title: 'Admission / Bed Enquiry',
    desc: 'Planned surgery, bed booking & cashless insurance support',
    icon: Stethoscope
  }
];

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

  // Extract departments from hospital
  const departmentsList = useMemo(() => {
    const fromHospital = hospital?.specialities || hospital?.specialties || [];
    const defaults = ['General Medicine', 'Cardiology', 'Orthopedics', 'Neurology', 'Nephrology', 'General Surgery', 'Pediatrics', 'Obstetrics & Gynecology'];
    const merged = Array.from(new Set([...fromHospital, ...defaults])).filter(Boolean);
    return merged.slice(0, 8);
  }, [hospital]);

  // Dynamic 4 upcoming dates
  const dateOptions = useMemo(() => {
    const options = [];
    const today = new Date();
    for (let i = 0; i < 4; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const dateNum = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      const dateStr = d.toISOString().split('T')[0];
      options.push({
        idx: i,
        day: dayName,
        date: dateNum,
        dateStr,
        label: `${dayName}, ${dateNum}`,
        slots: i === 0 ? '6 Slots Left' : '8+ Slots'
      });
    }
    return options;
  }, []);

  // Form states
  const [visitType, setVisitType] = useState('Hospital OPD Visit');
  const [selectedDept, setSelectedDept] = useState(preselectedDepartment || departmentsList[0] || 'General Medicine');
  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(TIME_SLOTS[1] || '10:00 AM');

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

  // Booking process states
  const [bookingStatus, setBookingStatus] = useState(null); // 'loading', 'success', 'error'
  const [confirmedBookingData, setConfirmedBookingData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  if (!hospital) return null;

  const handleSubmitBooking = async (e) => {
    e.preventDefault();

    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }

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

    setBookingStatus('loading');
    setErrorMessage('');

    const chosenDateObj = dateOptions[selectedDateIdx] || dateOptions[0];
    const hospitalName = hospital.name || 'Hospital Center';
    const hospitalAddress = hospital.address || '';
    const hospitalId = hospital.id || hospital._id || 'hosp-default';

    const payload = {
      hospitalId,
      slotDate: chosenDateObj.dateStr,
      slotTime: selectedTimeSlot,
      department: selectedDept,
      consultationType: visitType,
      patientName: patientName.trim(),
      patientPhone: patientPhone.trim(),
      patientEmail: patientEmail.trim(),
      age: parseInt(age, 10) || 30,
      gender,
      symptoms: symptoms.trim() || `Consultation in ${selectedDept}`
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
      consultationType: visitType,
      patientName: patientName.trim(),
      patientPhone: patientPhone.trim(),
      patientEmail: patientEmail.trim(),
      symptoms: symptoms.trim() || `Consultation in ${selectedDept}`,
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
    } catch (err) {
      console.warn('[HospitalBookingModal] localStorage write error:', err);
    }

    // Broadcast appointment change so Admin Panel reflects immediately
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sehat_appointments_changed', { detail: newBooking }));
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
                    <strong>Scheduled Slot:</strong> {dateOptions[selectedDateIdx]?.label} at {selectedTimeSlot} ({visitType})
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
              {!isLoggedIn && (
                <div style={{
                  background: '#fffbeb',
                  border: '1.5px solid #fde68a',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Lock size={18} color="#b45309" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#92400e' }}>
                        Please log in first to book appointments
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#b45309' }}>
                        Sign in to confirm and record your hospital visit under your account.
                      </div>
                    </div>
                  </div>
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
                      background: '#d97706',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Log In / Sign Up
                  </button>
                </div>
              )}

              {/* Step 1: Visit Type */}
              <div className={styles.sectionBlock}>
                <label className={styles.sectionLabel}>
                  <span>1. Choose Visit / Consultation Mode</span>
                  <span className={styles.sectionLabelHelper}>Instant Priority Booking</span>
                </label>
                <div className={styles.visitTypeGrid}>
                  {VISIT_TYPES.map((type) => {
                    const IconComponent = type.icon;
                    const isActive = visitType === type.id;
                    return (
                      <div
                        key={type.id}
                        className={`${styles.visitTypeCard} ${isActive ? styles.visitTypeCardActive : ''}`}
                        onClick={() => setVisitType(type.id)}
                      >
                        <div className={styles.visitTypeCardHeader}>
                          <IconComponent size={16} color={isActive ? '#2563eb' : '#475569'} />
                          <span>{type.title}</span>
                        </div>
                        <p className={styles.visitTypeDesc}>{type.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Department Selection */}
              <div className={styles.sectionBlock}>
                <label className={styles.sectionLabel}>
                  <span>2. Select Department or Clinical Specialty</span>
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

              {/* Step 3: Date & Time Slot */}
              <div className={styles.sectionBlock}>
                <label className={styles.sectionLabel}>
                  <span>3. Choose Date & Time Slot</span>
                </label>
                <div className={styles.dateSlotsRow}>
                  {dateOptions.map((opt, idx) => (
                    <div
                      key={idx}
                      className={`${styles.dateSlotCard} ${selectedDateIdx === idx ? styles.dateSlotCardActive : ''}`}
                      onClick={() => setSelectedDateIdx(idx)}
                    >
                      <span className={styles.dateDayName}>{opt.day}</span>
                      <span className={styles.dateDayNum}>{opt.date}</span>
                      <span className={styles.dateSlotPill}>{opt.slots}</span>
                    </div>
                  ))}
                </div>

                <div className={styles.timeSlotsGrid}>
                  {TIME_SLOTS.map((time, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`${styles.timeSlotBtn} ${selectedTimeSlot === time ? styles.timeSlotBtnActive : ''}`}
                      onClick={() => setSelectedTimeSlot(time)}
                    >
                      <Clock size={13} />
                      <span>{time}</span>
                    </button>
                  ))}
                </div>
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
                  <label className={styles.inputLabel}>Symptoms or Reason for Hospital Visit</label>
                  <textarea
                    rows="2"
                    placeholder="Briefly describe health concerns, previous diagnosis, or doctor referral..."
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
                  <span>Department & Mode</span>
                  <span className={styles.summaryVal}>
                    {selectedDept} • {visitType}
                  </span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Selected Schedule</span>
                  <span className={styles.summaryVal}>
                    {dateOptions[selectedDateIdx]?.label} at {selectedTimeSlot}
                  </span>
                </div>

                <div className={styles.summaryDivider} />

                <div className={styles.feeRow}>
                  <div className={styles.feeTitle}>
                    Hospital Booking / Registration Fee
                    <span className={styles.freeTag}>Zero Booking Fee</span>
                  </div>
                  <div className={styles.feeAmount}>₹0</div>
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
                type={isLoggedIn ? 'submit' : 'button'}
                disabled={bookingStatus === 'loading'}
                className={styles.submitBtn}
                onClick={!isLoggedIn ? () => setShowLoginPrompt(true) : undefined}
                style={!isLoggedIn ? { background: '#d97706', boxShadow: '0 8px 20px rgba(217, 119, 6, 0.25)' } : undefined}
              >
                {bookingStatus === 'loading' ? (
                  <>
                    <Loader2 size={18} className={styles.spinIcon} />
                    <span>Confirming Hospital Booking...</span>
                  </>
                ) : !isLoggedIn ? (
                  <>
                    <Lock size={18} />
                    <span>Log In to Book Hospital Visit</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Hospital Appointment</span>
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
