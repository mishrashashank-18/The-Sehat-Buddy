import React, { useState } from 'react';
import {
  HeartPulse,
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
  Check
} from 'lucide-react';
import { useData } from '../../context/useData';
import styles from './DoctorDashboard.module.css';

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
  const { doctors, updateDoctor } = useData();

  // Active doctor selection (get from login if available)
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [selectedDoctorId, setSelectedDoctorId] = useState(() => {
    if (storedUser && storedUser._id) {
      return storedUser._id;
    }
    return doctors[0]?.id || doctors[0]?._id || 1;
  });
  
  const activeDoctor = doctors.find(d => String(d.id) === String(selectedDoctorId) || String(d._id) === String(selectedDoctorId)) || doctors[0] || {};

  // Status: 'Available' | 'Busy' | 'On Leave'
  const [availabilityStatus, setAvailabilityStatus] = useState('Available');

  // Appointments state
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
  const [appointmentFilter, setAppointmentFilter] = useState('all');

  // Prescriptions state
  const [prescriptions, setPrescriptions] = useState(INITIAL_PRESCRIPTIONS);

  // Active Tab: 'appointments' | 'prescriptions' | 'profile'
  const [activeTab, setActiveTab] = useState('appointments');

  // Local state for profile form to prevent API spam and CastErrors
  const [profileForm, setProfileForm] = useState(activeDoctor);
  React.useEffect(() => {
    setProfileForm({
      ...activeDoctor,
      experience: typeof activeDoctor.experience === 'string' ? parseInt(activeDoctor.experience) : activeDoctor.experience
    });
  }, [activeDoctor]);

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
  const updateAppointmentStatus = (id, newStatus) => {
    setAppointments(prev =>
      prev.map(apt => (apt.id === id ? { ...apt, status: newStatus } : apt))
    );
    showToast(`Appointment marked as ${newStatus}`);
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

    setAppointments(prev => [newApt, ...prev]);
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

    setPrescriptions(prev => [newRx, ...prev]);
    setIsPrescriptionModalOpen(false);
    setNewPrescriptionData({
      patientName: '',
      diagnosis: '',
      medications: '',
      followUp: 'After 7 days'
    });
    showToast(`Prescription saved for ${newRx.patientName}`);
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
            <HeartPulse size={26} color="#2563EB" strokeWidth={2.5} />
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
              window.location.href = '/login';
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
            <img
              src={activeDoctor.image}
              alt={activeDoctor.name}
              className={styles.doctorAvatar}
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=200&q=80';
              }}
            />
            <div className={styles.doctorMeta}>
              <div className={styles.nameRow}>
                <h2>{activeDoctor.name}</h2>
                <span className={styles.specialtyPill}>{activeDoctor.specialty}</span>
              </div>
              <p className={styles.degreesText}>{activeDoctor.degree || 'MBBS, MD'} • {activeDoctor.experience}</p>
              <p className={styles.hospitalAffiliation}>
                <Building2 size={13} /> {activeDoctor.hospital || 'Private Healthcare Center'}
              </p>
            </div>
          </div>

          <div className={styles.statusToggleGroup}>
            <span className={styles.statusLabel}>Availability Status:</span>
            <div className={styles.statusButtonGroup}>
              <button
                className={`${styles.statusOption} ${availabilityStatus === 'Available' ? styles.statusAvailable : ''}`}
                onClick={() => { setAvailabilityStatus('Available'); showToast('Status set to Available'); }}
              >
                <span className={styles.statusDotGreen}></span> Available
              </button>
              <button
                className={`${styles.statusOption} ${availabilityStatus === 'Busy' ? styles.statusBusy : ''}`}
                onClick={() => { setAvailabilityStatus('Busy'); showToast('Status set to Busy'); }}
              >
                <span className={styles.statusDotYellow}></span> In Surgery / Busy
              </button>
              <button
                className={`${styles.statusOption} ${availabilityStatus === 'On Leave' ? styles.statusLeave : ''}`}
                onClick={() => { setAvailabilityStatus('On Leave'); showToast('Status set to On Leave'); }}
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
              <div className={styles.kpiValue}>{appointments.length} Scheduled</div>
              <span className={styles.kpiSub}>3 Completed</span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIconWrap} ${styles.kpiBlue}`}>
              <DollarSign size={22} />
            </div>
            <div>
              <span className={styles.kpiLabel}>Consultation Fee</span>
              <div className={styles.kpiValue}>₹{activeDoctor.price || 700}</div>
              <span className={styles.kpiSub}>Estimated Daily: ₹{(activeDoctor.price || 700) * appointments.length}</span>
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
                      <h4>{apt.patientName}</h4>
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
                      {apt.status !== 'Completed' && (
                        <button
                          className={styles.completeBtn}
                          onClick={() => updateAppointmentStatus(apt.id, 'Completed')}
                          title="Mark Completed"
                        >
                          <Check size={14} /> Completed
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
                    <small>Prescribed by {activeDoctor.name}</small>
                    <button
                      className={styles.printBtn}
                      onClick={() => showToast(`Generating PDF prescription for ${rx.patientName}...`)}
                    >
                      Export PDF
                    </button>
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
              <h3>Consultation & Clinic Settings</h3>
              <p>Configure fee, availability days, and contact info displayed to patients on Sehat Buddy.</p>

              <div className={styles.settingsGrid}>
                <div className={styles.formGroup}>
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={profileForm.name || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Specialty</label>
                  <input
                    type="text"
                    value={profileForm.specialty || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, specialty: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Experience (Years)</label>
                  <input
                    type="number"
                    value={profileForm.experience || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, experience: Number(e.target.value) })}
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
                    value={profileForm.price || profileForm.fees || 700}
                    onChange={(e) => setProfileForm({ ...profileForm, price: Number(e.target.value) })}
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

                <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                  <label>Available Consultation Hours</label>
                  <input
                    type="text"
                    value={profileForm.availableDays || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, availableDays: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                  <label>Professional Bio</label>
                  <textarea
                    rows={3}
                    value={profileForm.about || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, about: e.target.value })}
                  />
                </div>
              </div>

              <h4 style={{ marginTop: '24px', marginBottom: '12px' }}>Profile Photo</h4>
              <div className={styles.settingsGrid}>
                <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <img 
                      src={profileForm.image} 
                      alt="Profile Preview" 
                      style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} 
                      onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=200&q=80'}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setProfileForm(prev => ({ ...prev, image: reader.result }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      style={{ flex: 1, padding: '8px', border: '1px dashed #cbd5e1', borderRadius: '8px', cursor: 'pointer', background: '#f8fafc' }}
                    />
                  </div>
                  <small style={{ color: '#64748b', marginTop: '6px', display: 'block' }}>Upload a professional headshot. Changes will reflect instantly across the platform after saving.</small>
                </div>
              </div>

              <h4 style={{ marginTop: '24px', marginBottom: '12px' }}>Social & Media (Optional)</h4>
              <div className={styles.settingsGrid}>
                <div className={styles.formGroup}>
                  <label>Instagram URL</label>
                  <input
                    type="url"
                    value={profileForm.instagram || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, instagram: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Facebook URL</label>
                  <input
                    type="url"
                    value={profileForm.facebook || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, facebook: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.settingsSaveRow}>
                <button
                  className={styles.saveBtn}
                  onClick={() => {
                    updateDoctor(activeDoctor.id || activeDoctor._id, {
                      ...profileForm,
                      specialization: profileForm.specialty,
                      fees: profileForm.price,
                      experience: parseInt(profileForm.experience) || 0
                    });
                    showToast('Profile settings saved successfully!');
                  }}
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
    </div>
  );
};

export default DoctorDashboard;
