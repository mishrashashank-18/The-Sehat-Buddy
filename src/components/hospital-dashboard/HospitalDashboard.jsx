import React, { useState, useMemo } from 'react';
import {
  Building2,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  Stethoscope,
  Plus,
  Truck,
  CheckCircle,
  AlertTriangle,
  X,
  Video,
  Sparkles,
  Star,
  ExternalLink,
  Globe,
  Image as ImageIcon,
  Trash2,
  Upload,
  Loader2,
  Camera,
  Activity,
  Edit2,
  Search,
  Filter,
  HelpCircle,
  LogOut
} from 'lucide-react';
import { useData } from '../../context/useData';
import { api, API_BASE } from '../../services/api';
import HospitalLocationPicker from './HospitalLocationPicker';
import SpecialityFormModal from '../admin/SpecialityFormModal';
import logoImg from '../../assets/images/logo.png';
import styles from './HospitalDashboard.module.css';

const INITIAL_ER_CASES = [
  { id: 1, patient: 'Sanjay Rawat', triage: 'Red (Critical)', condition: 'Acute MI (Heart Attack)', time: '12 mins ago', doctor: 'Dr. Rahul Verma', bed: 'ER-01' },
  { id: 2, patient: 'Pooja Kashyap', triage: 'Yellow (Urgent)', condition: 'Fractured Femur (Road Accident)', time: '28 mins ago', doctor: 'Dr. Amit Singh', bed: 'ER-04' },
  { id: 3, patient: 'Mohit Sen', triage: 'Green (Stable)', condition: 'High Grade Fever & Dehydration', time: '45 mins ago', doctor: 'Dr. Pooja Malhotra', bed: 'ER-07' }
];

const INITIAL_AMBULANCES = [
  { id: 'DL-01-AB-1001', driver: 'Manoj Kumar', phone: '+91 98111 10001', status: 'Available', location: 'Hospital Base' },
  { id: 'DL-01-AB-1002', driver: 'Rajesh Tyagi', phone: '+91 98111 10002', status: 'Dispatched', location: 'En route: Sector 21' },
  { id: 'DL-01-AB-1003', driver: 'Imran Khan', phone: '+91 98111 10003', status: 'In-Transit', location: 'Patient onboard, returning' },
  { id: 'DL-01-AB-1004', driver: 'Satish Pal', phone: '+91 98111 10004', status: 'Available', location: 'Hospital Base' }
];

const HospitalDashboard = ({ onNavigate }) => {
  const {
    hospitals,
    doctors,
    updateHospital,
    updateDoctorFaqs,
    addDoctor,
    specialitiesProcedures,
    addSpecialityProcedure,
    updateSpecialityProcedure,
    deleteSpecialityProcedure
  } = useData();

  // Authenticated hospital user session
  const loggedInUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  }, []);

  const activeHospital = useMemo(() => {
    const userId = loggedInUser._id || loggedInUser.id;
    if (userId) {
      const foundById = hospitals.find(h => String(h.id || h._id) === String(userId));
      if (foundById) return foundById;
    }
    if (loggedInUser.email) {
      const foundByEmail = hospitals.find(h => h.email && h.email.toLowerCase() === loggedInUser.email.toLowerCase());
      if (foundByEmail) return foundByEmail;
    }
    if (loggedInUser.name) {
      const foundByName = hospitals.find(h => h.name && h.name.toLowerCase() === loggedInUser.name.toLowerCase());
      if (foundByName) return foundByName;
      return { ...loggedInUser, id: userId || 'auth-hospital' };
    }
    return hospitals[0] || {};
  }, [hospitals, loggedInUser]);

  // Tabs: 'doctors' | 'media' | 'gallery' | 'emergency' | 'settings' | 'specialities'
  const [activeTab, setActiveTab] = useState('doctors');

  // 5 Instagram Reels & 5 YouTube Videos state
  const [reels, setReels] = useState(['', '', '', '', '']);
  const [youtubeVideos, setYoutubeVideos] = useState(['', '', '', '', '']);
  const [starDoctorIds, setStarDoctorIds] = useState([]);

  // Photos & Gallery state (Profile, interior, exterior, custom photos)
  const [photos, setPhotos] = useState([]);
  const [newPhotoCategory, setNewPhotoCategory] = useState('interior');
  const [newPhotoTitle, setNewPhotoTitle] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);

  React.useEffect(() => {
    if (activeHospital) {
      const curReels = Array.isArray(activeHospital.reels) ? [...activeHospital.reels] : [];
      while (curReels.length < 5) curReels.push('');
      setReels(curReels.slice(0, 5));

      const curVideos = Array.isArray(activeHospital.youtube_videos) ? [...activeHospital.youtube_videos] : [];
      while (curVideos.length < 5) curVideos.push('');
      setYoutubeVideos(curVideos.slice(0, 5));

      const curStarDocs = Array.isArray(activeHospital.star_doctors)
        ? activeHospital.star_doctors.map(d => typeof d === 'object' ? (d._id || d.id) : d).filter(Boolean)
        : [];
      setStarDoctorIds(curStarDocs);

      const curPhotos = Array.isArray(activeHospital.photos) ? [...activeHospital.photos] : [];
      setPhotos(curPhotos);
    }
  }, [activeHospital?.id, activeHospital?._id]);

  // Operational State
  const [erCases] = useState(INITIAL_ER_CASES);
  const [ambulances, setAmbulances] = useState(INITIAL_AMBULANCES);

  // Add Doctor to Hospital modal
  const [isAddDoctorModalOpen, setIsAddDoctorModalOpen] = useState(false);
  const [newDoctorData, setNewDoctorData] = useState({
    name: '',
    email: '',
    specialty: 'Cardiology',
    experience: 5,
    fees: 700,
    degree: 'MBBS, MD',
    isStarDoctor: false
  });
  const [isAddingDoc, setIsAddingDoc] = useState(false);

  // Doctor FAQs management modal (managed by registered hospital)
  const [isDoctorFaqModalOpen, setIsDoctorFaqModalOpen] = useState(false);
  const [selectedFaqDoctor, setSelectedFaqDoctor] = useState(null);
  const [doctorFaqsList, setDoctorFaqsList] = useState([]);
  const [newDoctorFaqQ, setNewDoctorFaqQ] = useState('');
  const [newDoctorFaqA, setNewDoctorFaqA] = useState('');
  const [editingDoctorFaqIdx, setEditingDoctorFaqIdx] = useState(null);
  const [editingDoctorFaqData, setEditingDoctorFaqData] = useState({ q: '', a: '' });
  const [isSavingDoctorFaqs, setIsSavingDoctorFaqs] = useState(false);

  const handleOpenDoctorFaqModal = (doc) => {
    setSelectedFaqDoctor(doc);
    const existing = Array.isArray(doc.faqs) && doc.faqs.length > 0 ? doc.faqs : [
      { q: `How can I book an appointment with ${doc.name}?`, a: `Appointments for ${doc.name} at ${activeHospital.name || 'our hospital'} can be booked through The Sehat Buddy platform with instant confirmation.` },
      { q: 'What should I carry for the clinic consultation?', a: 'Carry a valid photo ID, insurance card (if cashless), and any recent medical records or prescriptions.' },
      { q: 'Is cashless insurance pre-authorization available?', a: `Yes, ${activeHospital.name || 'our hospital'} offers 100% cashless treatment with all leading TPAs and insurers.` },
      { q: 'Can I reschedule or cancel my appointment?', a: 'Yes, appointments can be easily rescheduled or cancelled prior to the scheduled slot time.' }
    ];
    setDoctorFaqsList(existing);
    setNewDoctorFaqQ('');
    setNewDoctorFaqA('');
    setEditingDoctorFaqIdx(null);
    setIsDoctorFaqModalOpen(true);
  };

  const handleSaveDoctorFaqs = async () => {
    if (!selectedFaqDoctor) return;
    setIsSavingDoctorFaqs(true);
    try {
      const validFaqs = doctorFaqsList.filter(f => (f.q || f.question || '').trim() !== '');
      await updateDoctorFaqs(
        selectedFaqDoctor.id || selectedFaqDoctor._id,
        validFaqs,
        activeHospital.id || activeHospital._id
      );
      showToast(`Public FAQs for ${selectedFaqDoctor.name} updated and published!`);
      setIsDoctorFaqModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast('Failed to update doctor FAQs.');
    } finally {
      setIsSavingDoctorFaqs(false);
    }
  };

  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Specialities & Procedures State & Handlers
  const [editingSpeciality, setEditingSpeciality] = useState(null);
  const [isSpecialityModalOpen, setIsSpecialityModalOpen] = useState(false);
  const [specialitySearch, setSpecialitySearch] = useState('');
  const [specialityTypeFilter, setSpecialityTypeFilter] = useState('all');
  const [newCustomSpecialtyInput, setNewCustomSpecialtyInput] = useState('');

  const handleToggleHospitalSpecialty = (spec) => {
    const curSpecs = Array.isArray(activeHospital.specialties) ? [...activeHospital.specialties] : [];
    const exists = curSpecs.some(s => s.toLowerCase() === spec.toLowerCase());
    const nextSpecs = exists
      ? curSpecs.filter(s => s.toLowerCase() !== spec.toLowerCase())
      : [...curSpecs, spec];

    updateHospital(activeHospital.id || activeHospital._id, {
      ...activeHospital,
      specialties: nextSpecs,
      specialities: nextSpecs
    });
    showToast(`${spec} ${exists ? 'removed from' : 'added to'} hospital departments.`);
  };

  const handleAddCustomHospitalSpecialty = (e) => {
    e?.preventDefault();
    const trimmed = newCustomSpecialtyInput.trim();
    if (!trimmed) return;
    const curSpecs = Array.isArray(activeHospital.specialties) ? [...activeHospital.specialties] : [];
    if (curSpecs.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      showToast('Department already exists in this hospital.');
      return;
    }
    const nextSpecs = [...curSpecs, trimmed];
    updateHospital(activeHospital.id || activeHospital._id, {
      ...activeHospital,
      specialties: nextSpecs,
      specialities: nextSpecs
    });
    setNewCustomSpecialtyInput('');
    showToast(`Added "${trimmed}" to hospital departments.`);
  };

  const handleSaveSpecialityProcedure = (savedData) => {
    if (editingSpeciality && (editingSpeciality.id || editingSpeciality._id)) {
      updateSpecialityProcedure(editingSpeciality.id || editingSpeciality._id, savedData);
      showToast(`Updated "${savedData.name}" successfully!`);
    } else {
      addSpecialityProcedure(savedData);
      showToast(`Added "${savedData.name}" successfully!`);
    }
    setIsSpecialityModalOpen(false);
    setEditingSpeciality(null);
  };

  const handleDeleteSpecialityProcedure = (item) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"? This will remove it from the catalog.`)) {
      deleteSpecialityProcedure(item.id || item._id);
      showToast(`"${item.name}" deleted successfully.`);
    }
  };

  const handleAddDoctorSubmit = async (e) => {
    e.preventDefault();
    if (!newDoctorData.name.trim() || !newDoctorData.email.trim()) {
      showToast('Please provide doctor name and email.');
      return;
    }

    setIsAddingDoc(true);
    try {
      const res = await fetch(`${API_BASE}/doctors/add-by-hospital`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDoctorData.name.trim(),
          email: newDoctorData.email.trim().toLowerCase(),
          specialization: newDoctorData.specialty,
          experience: Number(newDoctorData.experience) || 5,
          fees: Number(newDoctorData.fees) || 500,
          degree: newDoctorData.degree || 'MBBS, MD',
          isStarDoctor: newDoctorData.isStarDoctor,
          hospitalId: activeHospital.id || activeHospital._id,
          hospitalName: activeHospital.name
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const addedDoctor = data.data;

        // If marked as star, update hospital's star_doctors list
        if (newDoctorData.isStarDoctor && addedDoctor._id) {
          const newStarIds = [...starDoctorIds, addedDoctor._id];
          setStarDoctorIds(newStarIds);
          await updateHospital(activeHospital.id || activeHospital._id, {
            star_doctors: newStarIds
          });
        }

        // Add to local state via DataContext
        if (addDoctor) {
          addDoctor({
            ...addedDoctor,
            id: addedDoctor._id || Date.now(),
            price: addedDoctor.fees,
            specialty: addedDoctor.specialization,
            hospital: activeHospital.name
          });
        }

        setIsAddDoctorModalOpen(false);
        setNewDoctorData({
          name: '',
          email: '',
          specialty: 'Cardiology',
          experience: 5,
          fees: 700,
          degree: 'MBBS, MD',
          isStarDoctor: false
        });

        showToast(`${addedDoctor.name} added to roster${newDoctorData.isStarDoctor ? ' and selected as Star Doctor!' : '!'}`);
      } else {
        showToast(data.message || 'Failed to add doctor.');
      }
    } catch (err) {
      showToast('Error saving doctor. Please try again.');
    } finally {
      setIsAddingDoc(false);
    }
  };

  // Doctors affiliated with this hospital
  const affiliatedDoctors = doctors.filter(
    d => d.hospital?.toLowerCase() === activeHospital.name?.toLowerCase() || !d.hospital
  );

  const handleDispatchAmbulance = (ambId) => {
    setAmbulances(prev =>
      prev.map(a => (a.id === ambId ? { ...a, status: 'Dispatched', location: 'Dispatched to Emergency Call' } : a))
    );
    showToast(`Ambulance ${ambId} dispatched for immediate rescue.`);
  };

  const handleSaveMedia = async () => {
    const cleanedReels = reels.map(r => (typeof r === 'string' ? r.trim() : (r && typeof r === 'object' ? r : ''))).filter(Boolean);
    const cleanedVideos = youtubeVideos.map(v => v.trim()).filter(Boolean);
    try {
      await updateHospital(activeHospital.id || activeHospital._id, {
        reels: cleanedReels,
        youtube_videos: cleanedVideos,
        star_doctors: starDoctorIds,
        photos: photos
      });
      showToast('Hospital reels, YouTube videos, and Star Doctors saved successfully!');
    } catch {
      showToast('Failed to save hospital media.');
    }
  };

  // Upload hospital main profile photo via Cloudinary
  const handleUploadProfilePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingProfile(true);
    try {
      const url = await api.uploadImage(file, 'sehatbuddy/hospitals/profile');
      await updateHospital(activeHospital.id || activeHospital._id, { image: url });
      showToast('Hospital profile photo uploaded to Cloudinary & saved!');
    } catch (err) {
      console.error('Failed to upload profile photo to Cloudinary:', err);
      // Fallback: Read as base64 data uri
      const reader = new FileReader();
      reader.onloadend = async () => {
        const localUri = reader.result;
        await updateHospital(activeHospital.id || activeHospital._id, { image: localUri });
        showToast('Hospital profile photo saved locally!');
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingProfile(false);
    }
  };

  // Upload interior / exterior / custom photo via Cloudinary
  const handleUploadGalleryPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const url = await api.uploadImage(file, 'sehatbuddy/hospitals/gallery');
      const newPhotoItem = {
        url,
        title: newPhotoTitle.trim() || `${newPhotoCategory.charAt(0).toUpperCase() + newPhotoCategory.slice(1)} View`,
        category: newPhotoCategory,
        createdAt: new Date().toISOString()
      };
      const updatedPhotos = [newPhotoItem, ...photos];
      setPhotos(updatedPhotos);
      await updateHospital(activeHospital.id || activeHospital._id, { photos: updatedPhotos });
      setNewPhotoTitle('');
      showToast(`${newPhotoCategory.toUpperCase()} photo uploaded to Cloudinary & saved!`);
    } catch (err) {
      console.error('Failed to upload gallery photo to Cloudinary:', err);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const localUri = reader.result;
        const newPhotoItem = {
          url: localUri,
          title: newPhotoTitle.trim() || `${newPhotoCategory.charAt(0).toUpperCase() + newPhotoCategory.slice(1)} View`,
          category: newPhotoCategory,
          createdAt: new Date().toISOString()
        };
        const updatedPhotos = [newPhotoItem, ...photos];
        setPhotos(updatedPhotos);
        await updateHospital(activeHospital.id || activeHospital._id, { photos: updatedPhotos });
        setNewPhotoTitle('');
        showToast(`${newPhotoCategory.toUpperCase()} photo saved locally!`);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Delete a gallery photo permanently from Cloudinary & database
  const handleDeletePhoto = async (photoIndex) => {
    const photoToDelete = photos[photoIndex];
    const imgUrl = typeof photoToDelete === 'string' ? photoToDelete : photoToDelete?.url;

    const updatedPhotos = photos.filter((_, idx) => idx !== photoIndex);
    setPhotos(updatedPhotos);
    await updateHospital(activeHospital.id || activeHospital._id, { photos: updatedPhotos });

    if (imgUrl && typeof imgUrl === 'string' && imgUrl.includes('cloudinary.com')) {
      try {
        await api.deleteImage(imgUrl);
        showToast('Photo permanently deleted from Cloudinary & facility gallery!');
      } catch (err) {
        console.warn('Cloudinary delete warning:', err);
        showToast('Photo removed from facility gallery.');
      }
    } else {
      showToast('Photo removed successfully!');
    }
  };

  const toggleStarDoctor = async (docId) => {
    const sId = String(docId);
    let newStarIds;
    setStarDoctorIds(prev => {
      const exists = prev.some(id => String(id) === sId);
      if (exists) {
        newStarIds = prev.filter(id => String(id) !== sId);
      } else {
        newStarIds = [...prev, docId];
      }
      return newStarIds;
    });

    try {
      await updateHospital(activeHospital.id || activeHospital._id, { star_doctors: newStarIds });
      showToast('Star Doctors updated instantly!');
    } catch {
      showToast('Failed to update Star Doctors immediately.');
    }
  };

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
                <Building2 size={13} /> Hospital Center
              </span>
            </div>
            <p className={styles.brandSub}>Hospital Operations, Clinical Staff & ER Triage</p>
          </div>
        </div>

        {/* Authenticated Facility Account & Quick Actions */}
        <div className={styles.headerRight}>
          <div className={styles.facilityAccountBadge}>
            <div className={styles.facilityAccountIcon}>
              <Building2 size={16} />
            </div>
            <div className={styles.facilityAccountText}>
              <div className={styles.facilityAccountTitle}>
                <span className={styles.facilityAccountName} title={activeHospital.name}>
                  {activeHospital.name || 'Hospital Facility'}
                </span>
                <span className={styles.authenticatedPill}>
                  <span className={styles.authDot}></span>
                  Active
                </span>
              </div>
              <span className={styles.facilityAccountSub}>
                {activeHospital.city ? `${activeHospital.city} • Verified Facility Account` : 'Authorized Facility Account'}
              </span>
            </div>
          </div>

          <div className={styles.quickNavBtns}>
            <button
              className={`${styles.navLinkBtn} ${styles.navLinkPrimary}`}
              onClick={() => onNavigate && onNavigate('hospital-profile', activeHospital.id || activeHospital._id)}
              title="Open public hospital center page"
            >
              <Globe size={13} /> View Public Center
            </button>
            <button className={styles.navLinkBtn} onClick={() => onNavigate('site')} title="Go to Website">
              <ExternalLink size={13} /> Website
            </button>
            {loggedInUser?.role === 'admin' && (
              <button className={styles.navLinkBtn} onClick={() => onNavigate('admin')} title="Go to Admin Panel">
                <ShieldCheck size={13} /> Admin
              </button>
            )}
            <button
              className={`${styles.navLinkBtn} ${styles.navLinkLogout}`}
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/hospital';
              }}
              title="Sign out of hospital account"
            >
              <LogOut size={13} /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className={styles.mainWrapper}>
        {/* Hospital Overview Banner */}
        <div className={styles.facilityBanner}>
          <div className={styles.facilityInfo}>
            <div className={styles.facilityImageWrap}>
              <img
                src={activeHospital.image}
                alt={activeHospital.name}
                className={styles.facilityImage}
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=240&q=80';
                }}
              />
            </div>
            <div className={styles.facilityMeta}>
              <div className={styles.titleRow}>
                <h2>{activeHospital.name}</h2>
                <div className={styles.ratingBadge}>
                  ★ {activeHospital.rating || 4.8}
                </div>
              </div>
              <p className={styles.facilityAddress}>
                <MapPin size={14} /> {activeHospital.address || 'Medical Enclave, City Central'}
              </p>
              <div className={styles.tagGroup}>
                <span className={styles.cityPill}>{activeHospital.city}</span>
                {activeHospital.emergency24x7 && (
                  <span className={styles.emergencyPill}>
                    <ShieldCheck size={12} /> 24/7 Trauma Emergency Ready
                  </span>
                )}
                {activeHospital.phone && (
                  <span className={styles.phonePill}>
                    <Phone size={12} /> {activeHospital.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Operational Metrics Cards */}
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIconWrap} ${styles.kpiGreen}`}>
              <Stethoscope size={22} />
            </div>
            <div className={styles.kpiContent}>
              <span className={styles.kpiLabel}>Affiliated Doctors</span>
              <div className={styles.kpiValue}>
                {affiliatedDoctors.length} {affiliatedDoctors.length === 1 ? 'Specialist' : 'Specialists'}
              </div>
              <span className={styles.kpiSub}>Active on clinical roster</span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIconWrap} ${styles.kpiBlue}`}>
              <Sparkles size={22} />
            </div>
            <div className={styles.kpiContent}>
              <span className={styles.kpiLabel}>Specialities & Procedures</span>
              <div className={styles.kpiValue}>
                {(activeHospital.specialities?.length || specialitiesProcedures?.length || 0)} Services
              </div>
              <span className={styles.kpiSub}>Clinical catalog active</span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIconWrap} ${styles.kpiRed}`}>
              <AlertTriangle size={22} />
            </div>
            <div className={styles.kpiContent}>
              <span className={styles.kpiLabel}>Active Emergency Triage</span>
              <div className={styles.kpiValue}>{erCases.length} Cases</div>
              <span className={styles.kpiSub}>1 Critical (Code Red)</span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIconWrap} ${styles.kpiYellow}`}>
              <Truck size={22} />
            </div>
            <div className={styles.kpiContent}>
              <span className={styles.kpiLabel}>Ambulance Fleet</span>
              <div className={styles.kpiValue}>
                {ambulances.filter(a => a.status === 'Available').length} / {ambulances.length}
              </div>
              <span className={styles.kpiSub}>Emergency Ready</span>
            </div>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className={styles.tabsBar}>
          <div className={styles.tabsList}>

            <button
              className={`${styles.tabBtn} ${activeTab === 'doctors' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('doctors')}
            >
              <Stethoscope size={16} />
              <span>Doctor Roster</span>
              <span className={styles.tabBadge}>{affiliatedDoctors.length}</span>
            </button>

            <button
              className={`${styles.tabBtn} ${activeTab === 'media' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('media')}
            >
              <Video size={16} />
              <span>Reels & Media</span>
            </button>

            <button
              className={`${styles.tabBtn} ${activeTab === 'photos' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('photos')}
            >
              <Camera size={16} />
              <span>Photo Gallery</span>
              <span className={styles.tabBadge}>{photos.length}</span>
            </button>

            <button
              className={`${styles.tabBtn} ${activeTab === 'emergency' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('emergency')}
            >
              <AlertTriangle size={16} />
              <span>ER & Fleet</span>
            </button>

            <button
              className={`${styles.tabBtn} ${activeTab === 'settings' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <Building2 size={16} />
              <span>Hospital Profile</span>
            </button>

            <button
              className={`${styles.tabBtn} ${activeTab === 'specialities' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('specialities')}
            >
              <Activity size={16} />
              <span>Specialities</span>
              <span className={styles.tabBadge}>{specialitiesProcedures?.length || 0}</span>
            </button>
          </div>

          <div className={styles.tabsActionWrap}>
            {activeTab === 'doctors' && (
              <button
                className={styles.addPrimaryBtn}
                onClick={() => setIsAddDoctorModalOpen(true)}
              >
                <Plus size={16} /> Add Doctor
              </button>
            )}

            {activeTab === 'specialities' && (
              <button
                className={styles.addPrimaryBtn}
                onClick={() => {
                  setEditingSpeciality(null);
                  setIsSpecialityModalOpen(true);
                }}
              >
                <Plus size={16} /> Add Speciality
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: DOCTORS ON ROSTER */}
        {activeTab === 'doctors' && (
          <div className={styles.tabContentArea}>
            <div className={styles.doctorsTableCard}>
              <div className={styles.tableHeaderRow}>
                <div>
                  <h3 style={{ margin: 0 }}>Medical Specialists Affiliated with {activeHospital.name}</h3>
                  <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                    Add doctors to your hospital roster and select star doctors to highlight on your public center page.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className={styles.tableCountBadge}>{affiliatedDoctors.length} Doctors</span>
                  <button
                    className={styles.addPrimaryBtn}
                    onClick={() => setIsAddDoctorModalOpen(true)}
                    style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                  >
                    <Plus size={14} /> Add Doctor
                  </button>
                </div>
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.rosterTable}>
                  <thead>
                    <tr>
                      <th>Doctor</th>
                      <th>Specialty</th>
                      <th>Qualifications</th>
                      <th>Consultation Fee</th>
                      <th>Weekly Hours</th>
                      <th>Status</th>
                      <th>Star Doctor</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {affiliatedDoctors.map((doc) => {
                      const isStar = starDoctorIds.some(id => String(id) === String(doc.id || doc._id));
                      return (
                        <tr key={doc.id || doc._id}>
                          <td>
                            <div className={styles.docCell}>
                              <img
                                src={doc.image}
                                alt={doc.name}
                                className={styles.docAvatar}
                                onError={(e) => {
                                  e.target.src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=150&q=80';
                                }}
                              />
                              <div>
                                <span className={styles.docName}>{doc.name}</span>
                                <span className={styles.docContact}>{doc.phone || '+91 98000 00000'}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={styles.specialtyTag}>{doc.specialty}</span>
                          </td>
                          <td>{doc.degree || 'MBBS, MD'}</td>
                          <td>
                            <strong style={{ color: '#2563EB' }}>₹{doc.price}</strong>
                          </td>
                          <td>{doc.availableDays || 'Mon - Fri (10am - 4pm)'}</td>
                          <td>
                            {(() => {
                              const status = doc.availabilityStatus || (doc.available === false ? 'On Leave' : 'Available');
                              if (status === 'Busy') {
                                return (
                                  <span className={styles.statusBadgeBusy}>
                                    <span className={`${styles.statusDot} ${styles.dotBusy}`}></span>
                                    In Surgery / Busy
                                  </span>
                                );
                              }
                              if (status === 'On Leave') {
                                return (
                                  <span className={styles.statusBadgeLeave}>
                                    <span className={`${styles.statusDot} ${styles.dotLeave}`}></span>
                                    On Leave
                                  </span>
                                );
                              }
                              return (
                                <span className={styles.statusBadgeAvailable}>
                                  <span className={`${styles.statusDot} ${styles.dotAvailable}`}></span>
                                  Available
                                </span>
                              );
                            })()}
                          </td>
                          <td>
                            <button
                              className={`${styles.starToggleBtn} ${isStar ? styles.starToggleBtnActive : ''}`}
                              onClick={async () => {
                                const newStarIds = isStar
                                  ? starDoctorIds.filter(id => String(id) !== String(doc.id || doc._id))
                                  : [...starDoctorIds, doc.id || doc._id];
                                setStarDoctorIds(newStarIds);
                                await updateHospital(activeHospital.id || activeHospital._id, { star_doctors: newStarIds });
                                showToast(`${doc.name} ${isStar ? 'removed from' : 'marked as'} Star Doctor!`);
                              }}
                            >
                              <Star size={13} fill={isStar ? '#f59e0b' : 'none'} color={isStar ? '#f59e0b' : '#64748b'} />
                              {isStar ? 'Star Doctor' : 'Mark Star'}
                            </button>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={() => handleOpenDoctorFaqModal(doc)}
                                style={{
                                  background: '#f0f9ff',
                                  color: '#0284c7',
                                  border: '1px solid #bae6fd',
                                  borderRadius: '6px',
                                  padding: '6px 10px',
                                  fontSize: '0.78rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                title={`Manage public FAQs for ${doc.name}`}
                              >
                                <HelpCircle size={13} />
                                Doctor FAQs
                              </button>
                              <button
                                className={styles.pageDoctorBtn}
                                onClick={() => showToast(`Sent clinical emergency notification to ${doc.name}`)}
                              >
                                Page Doctor
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: MEDIA & STAR DOCTORS MANAGEMENT */}
        {activeTab === 'media' && (
          <div className={styles.tabContentArea}>
            <div className={styles.mediaGrid}>
              {/* Instagram Reels Card */}
              <form
                className={styles.mediaCard}
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveMedia();
                }}
              >
                <div className={styles.mediaCardHeader}>
                  <div>
                    <h3>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e1306c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                      </svg>
                      Instagram Reels (Max 5)
                    </h3>
                    <p>Add up to 5 Instagram reel links to appear on this hospital's public center page (leave blank if fewer). Press Enter to save.</p>
                  </div>
                  <button type="submit" className={styles.saveBtn}>
                    Save Changes
                  </button>
                </div>

                <div className={styles.mediaInputList}>
                  {reels.map((reel, index) => {
                    const reelVal = typeof reel === 'string' ? reel : (reel?.url || reel?.link || '');
                    return (
                      <div key={index} className={styles.mediaInputRow}>
                        <span className={styles.mediaNumberBadge}>#{index + 1}</span>
                        <input
                          type="url"
                          placeholder={`https://www.instagram.com/reel/... (Reel ${index + 1})`}
                          value={reelVal}
                          onChange={(e) => {
                            const updated = [...reels];
                            const cur = (typeof updated[index] === 'object' && updated[index]) ? updated[index] : {};
                            updated[index] = { ...cur, url: e.target.value };
                            setReels(updated);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveMedia();
                            }
                          }}
                        />
                        {reelVal && (
                          <a
                            href={reelVal}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.testLinkBtn}
                          >
                            <ExternalLink size={14} /> Preview
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </form>

              {/* YouTube Videos Card */}
              <form
                className={styles.mediaCard}
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveMedia();
                }}
              >
                <div className={styles.mediaCardHeader}>
                  <div>
                    <h3>
                      <Video size={20} color="#ef4444" />
                      YouTube Videos (Max 5)
                    </h3>
                    <p>Add up to 5 YouTube video links (regular video, watch link, or shorts) for virtual tours and health talks. Press Enter to save.</p>
                  </div>
                  <button type="submit" className={styles.saveBtn}>
                    Save Changes
                  </button>
                </div>

                <div className={styles.mediaInputList}>
                  {youtubeVideos.map((video, index) => (
                    <div key={index} className={styles.mediaInputRow}>
                      <span className={styles.mediaNumberBadge} style={{ background: '#fef2f2', color: '#ef4444' }}>
                        #{index + 1}
                      </span>
                      <input
                        type="url"
                        placeholder={`https://www.youtube.com/watch?v=... (Video ${index + 1})`}
                        value={video}
                        onChange={(e) => {
                          const updated = [...youtubeVideos];
                          updated[index] = e.target.value;
                          setYoutubeVideos(updated);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveMedia();
                          }
                        }}
                      />
                      {video && (
                        <a
                          href={video}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.testLinkBtn}
                        >
                          <ExternalLink size={14} /> Preview
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </form>

              {/* Star Doctors of this Hospital Card */}
              <div className={styles.mediaCard}>
                <div className={styles.mediaCardHeader}>
                  <div>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={20} color="#f59e0b" />
                      Star Doctors of {activeHospital.name}
                      <span style={{ fontSize: '0.8rem', background: '#fef3c7', color: '#b45309', padding: '2px 10px', borderRadius: '12px', fontWeight: 600 }}>
                        {starDoctorIds.length} Selected
                      </span>
                    </h3>
                    <p>Select which doctors to highlight as verified Star Doctors for this hospital center. All doctors of this hospital are displayed below.</p>
                  </div>
                  <button className={styles.saveBtn} onClick={handleSaveMedia}>
                    Save Star Doctors
                  </button>
                </div>

                <div className={styles.starDoctorsSelector}>
                  {(() => {
                    const hospName = (activeHospital.name || '').toLowerCase().trim();
                    const staffEmails = new Set([
                      ...(activeHospital.staff_emails || []).map(e => (typeof e === 'string' ? e : e?.email)?.toLowerCase().trim()),
                      ...(activeHospital.staff_doctors || []).map(d => (typeof d === 'string' ? d : d?.email)?.toLowerCase().trim())
                    ].filter(Boolean));

                    const staffNameMap = new Map();
                    (activeHospital.staff_doctors || []).forEach(d => {
                      if (d && typeof d === 'object' && d.email && d.name) {
                        staffNameMap.set(d.email.toLowerCase().trim(), d.name.trim());
                      }
                    });

                    const list = [];
                    const addedEmails = new Set();

                    (doctors || []).forEach(doc => {
                      const docEmail = (doc.email || '').toLowerCase().trim();
                      const docHosp = (doc.hospital || '').toLowerCase().trim();
                      const isStaff = staffEmails.has(docEmail);
                      const isMatch = hospName && docHosp && (
                        docHosp === hospName || docHosp.includes(hospName) || hospName.includes(docHosp)
                      );

                      if (isStaff || isMatch) {
                        list.push({
                          ...doc,
                          name: staffNameMap.get(docEmail) || doc.name
                        });
                        if (docEmail) addedEmails.add(docEmail);
                      }
                    });

                    (activeHospital.staff_doctors || []).forEach(sd => {
                      const sEmail = (sd?.email || sd || '').toLowerCase().trim();
                      if (sEmail && !addedEmails.has(sEmail)) {
                        addedEmails.add(sEmail);
                        list.push({
                          id: sEmail,
                          _id: sEmail,
                          name: sd?.name || ('Dr. ' + sEmail.split('@')[0].replace(/[._-]/g, ' ')),
                          email: sEmail,
                          specialty: 'Hospital Staff Physician',
                          specialization: 'Hospital Staff Physician',
                          hospital: activeHospital.name,
                          image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=150&q=80'
                        });
                      }
                    });

                    if (list.length === 0) {
                      return (
                        <div style={{ gridColumn: '1 / -1', padding: '24px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '12px' }}>
                          <p style={{ margin: 0, fontWeight: 600 }}>No doctors currently registered to this hospital center.</p>
                          <p style={{ margin: '4px 0 0', fontSize: '0.84rem' }}>Affiliated doctors will appear here automatically when added by admin or hospital management.</p>
                        </div>
                      );
                    }

                    return list.map((doc) => {
                      const isSelected = starDoctorIds.some(id => String(id) === String(doc.id || doc._id || doc.email));
                      return (
                        <div
                          key={doc.id || doc._id || doc.email}
                          className={`${styles.starDoctorOption} ${isSelected ? styles.starDoctorOptionActive : ''}`}
                          onClick={() => toggleStarDoctor(doc.id || doc._id || doc.email)}
                          title={isSelected ? "Click to remove Star Doctor" : "Click to select as Star Doctor"}
                        >
                          <img
                            src={doc.image}
                            alt={doc.name}
                            className={styles.starDocAvatar}
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=150&q=80';
                            }}
                          />
                          <div className={styles.starDocMeta}>
                            <h4>{doc.name}</h4>
                            <p style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', margin: '3px 0 0' }}>
                              <span>{doc.specialty || doc.specialization}</span>
                              <span style={{
                                fontSize: '0.72rem',
                                padding: '1px 7px',
                                borderRadius: '999px',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: (doc.availabilityStatus === 'Busy') ? '#fef3c7' : (doc.availabilityStatus === 'On Leave' || doc.available === false) ? '#fee2e2' : '#dcfce7',
                                color: (doc.availabilityStatus === 'Busy') ? '#b45309' : (doc.availabilityStatus === 'On Leave' || doc.available === false) ? '#b91c1c' : '#15803d',
                                border: `1px solid ${(doc.availabilityStatus === 'Busy') ? '#fde68a' : (doc.availabilityStatus === 'On Leave' || doc.available === false) ? '#fecaca' : '#bbf7d0'}`
                              }}>
                                <span style={{
                                  width: '5px',
                                  height: '5px',
                                  borderRadius: '50%',
                                  backgroundColor: (doc.availabilityStatus === 'Busy') ? '#d97706' : (doc.availabilityStatus === 'On Leave' || doc.available === false) ? '#dc2626' : '#16a34a'
                                }}></span>
                                {doc.availabilityStatus === 'Busy' ? 'Busy' : (doc.availabilityStatus === 'On Leave' || doc.available === false) ? 'On Leave' : 'Available'}
                              </span>
                            </p>
                          </div>
                          <Star
                            size={22}
                            className={styles.starToggleIcon}
                            fill={isSelected ? '#f59e0b' : 'none'}
                            color={isSelected ? '#f59e0b' : '#cbd5e1'}
                          />
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: PHOTOS & GALLERY (PROFILE, INTERIOR, EXTERIOR, CUSTOM) */}
        {activeTab === 'photos' && (
          <div className={styles.tabContentArea}>
            <div className={styles.mediaGrid}>
              {/* Profile Photo Card */}
              <div className={styles.mediaCard}>
                <div className={styles.mediaCardHeader}>
                  <div>
                    <h3>
                      <Camera size={20} color="#2563eb" />
                      Hospital Main Profile / Cover Photo
                    </h3>
                    <p>Primary photo shown on the hospital card, banner, and search listings.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ position: 'relative', width: '140px', height: '100px', borderRadius: '12px', overflow: 'hidden', border: '2px solid #e2e8f0', background: '#0f172a' }}>
                      <img
                        src={activeHospital.image}
                        alt="Hospital Main Profile"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=800&q=80';
                        }}
                      />
                      {isUploadingProfile && (
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(0,0,0,0.6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white'
                        }}>
                          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                        </div>
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                        Change Hospital Cover Photo
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingProfile}
                        onChange={handleUploadProfilePhoto}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '10px',
                          border: '1px dashed #94a3b8',
                          borderRadius: '8px',
                          background: '#f8fafc',
                          cursor: 'pointer'
                        }}
                      />
                      <small style={{ color: '#64748b', marginTop: '6px', display: 'block' }}>
                        Uploaded securely via Cloudinary API. Persists permanently across page refreshes.
                      </small>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Interior, Exterior & Custom Photos Card */}
              <div className={styles.mediaCard}>
                <div className={styles.mediaCardHeader}>
                  <div>
                    <h3>
                      <ImageIcon size={20} color="#059669" />
                      Upload Interior, Exterior & Facility Photos
                    </h3>
                    <p>Add specialized facility photos for patients to see inside OT, wards, exterior building, and campus.</p>
                  </div>
                </div>

                <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Photo Category
                      </label>
                      <select
                        value={newPhotoCategory}
                        onChange={(e) => setNewPhotoCategory(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                      >
                        <option value="interior">Interior (OT, ICU, Rooms, Reception)</option>
                        <option value="exterior">Exterior (Building, Campus, Parking)</option>
                        <option value="facility">Facility & Tech (MRI, Lab, Cafeteria)</option>
                        <option value="custom">Custom Showcase Photo</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Caption / Title (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Modern Cath Lab / Main Entrance"
                        value={newPhotoTitle}
                        onChange={(e) => setNewPhotoTitle(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Select Photo File
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingPhoto}
                        onChange={handleUploadGalleryPhoto}
                        style={{
                          flex: 1,
                          padding: '10px',
                          border: '1px dashed #2563eb',
                          borderRadius: '8px',
                          background: '#eff6ff',
                          cursor: 'pointer'
                        }}
                      />
                      {isUploadingPhoto && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2563eb', fontSize: '0.88rem', fontWeight: 600 }}>
                          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Uploading to Cloudinary...
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Uploaded Gallery Grid */}
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#1e293b' }}>
                      Uploaded Facility Gallery ({photos.length} photos)
                    </h4>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Visible on Public Hospital Profile
                    </span>
                  </div>

                  {photos.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #e2e8f0', color: '#64748b' }}>
                      <ImageIcon size={32} style={{ opacity: 0.4, marginBottom: '8px' }} />
                      <p style={{ margin: 0, fontSize: '0.9rem' }}>No interior or exterior photos uploaded yet.</p>
                      <small>Upload photos above to showcase your facility to patients.</small>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}>
                      {photos.map((item, pIdx) => {
                        const imgUrl = typeof item === 'string' ? item : item.url;
                        const title = typeof item === 'object' ? item.title : `Photo #${pIdx + 1}`;
                        const category = typeof item === 'object' ? item.category : 'custom';

                        return (
                          <div
                            key={pIdx}
                            style={{
                              position: 'relative',
                              borderRadius: '10px',
                              overflow: 'hidden',
                              border: '1px solid #e2e8f0',
                              background: '#0f172a',
                              aspectRatio: '4 / 3',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                            }}
                          >
                            <img
                              src={imgUrl}
                              alt={title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div style={{
                              position: 'absolute',
                              top: '8px',
                              left: '8px',
                              background: 'rgba(0,0,0,0.65)',
                              color: 'white',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              {category}
                            </div>
                            <button
                              onClick={() => handleDeletePhoto(pIdx)}
                              style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                background: 'rgba(239, 68, 68, 0.9)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '28px',
                                height: '28px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'transform 0.2s'
                              }}
                              title="Delete photo"
                            >
                              <Trash2 size={14} />
                            </button>
                            <div style={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                              color: 'white',
                              padding: '12px 8px 6px',
                              fontSize: '0.75rem',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {title}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: EMERGENCY TRIAGE & AMBULANCES */}
        {activeTab === 'emergency' && (
          <div className={styles.tabContentArea}>
            <div className={styles.emergencySplit}>
              {/* ER Queue */}
              <div className={styles.erCard}>
                <div className={styles.boxHeader}>
                  <div>
                    <h4>Active Emergency Triage (ER)</h4>
                    <p>Live trauma and critical care patient admissions</p>
                  </div>
                  <span className={styles.erLiveBadge}>LIVE</span>
                </div>

                <div className={styles.erList}>
                  {erCases.map((c) => (
                    <div key={c.id} className={styles.erItem}>
                      <div className={styles.triageIndicatorWrap}>
                        <span
                          className={`${styles.triageDot} ${
                            c.triage.includes('Red')
                              ? styles.triageRed
                              : c.triage.includes('Yellow')
                              ? styles.triageYellow
                              : styles.triageGreen
                          }`}
                        ></span>
                        <span className={styles.triageLabel}>{c.triage}</span>
                      </div>

                      <div className={styles.erDetails}>
                        <div className={styles.erPatientName}>
                          <strong>{c.patient}</strong> • Bed {c.bed}
                        </div>
                        <p className={styles.erCondition}>{c.condition}</p>
                        <span className={styles.erDoctor}>Attending: {c.doctor}</span>
                      </div>

                      <div className={styles.erMeta}>
                        <span className={styles.erTime}>
                          <Clock size={12} /> {c.time}
                        </span>
                        <button
                          className={styles.erActionBtn}
                          onClick={() => showToast(`Opening ICU charts for ${c.patient}`)}
                        >
                          View Charts
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ambulances */}
              <div className={styles.erCard}>
                <div className={styles.boxHeader}>
                  <div>
                    <h4>Ambulance Fleet & Dispatch</h4>
                    <p>Track ready response units and transit location</p>
                  </div>
                  <span className={styles.fleetBadge}>{ambulances.length} Units</span>
                </div>

                <div className={styles.ambulanceList}>
                  {ambulances.map((amb) => (
                    <div key={amb.id} className={styles.ambItem}>
                      <div className={styles.ambIconWrap}>
                        <Truck size={20} color="#2563EB" />
                      </div>

                      <div className={styles.ambInfo}>
                        <strong>{amb.id}</strong>
                        <span className={styles.ambDriver}>Driver: {amb.driver} • {amb.phone}</span>
                        <span className={styles.ambLocation}>
                          <MapPin size={12} /> {amb.location}
                        </span>
                      </div>

                      <div className={styles.ambActionCol}>
                        <span
                          className={`${styles.ambStatusPill} ${
                            amb.status === 'Available'
                              ? styles.ambAvailable
                              : styles.ambDispatched
                          }`}
                        >
                          {amb.status}
                        </span>

                        {amb.status === 'Available' ? (
                          <button
                            className={styles.dispatchBtn}
                            onClick={() => handleDispatchAmbulance(amb.id)}
                          >
                            Dispatch
                          </button>
                        ) : (
                          <button
                            className={styles.locateBtn}
                            onClick={() => showToast(`Live GPS tracked: ${amb.id} near ${amb.location}`)}
                          >
                            Track GPS
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: FACILITY PROFILE SETTINGS */}
        {activeTab === 'settings' && (
          <div className={styles.tabContentArea}>
            <form
              className={styles.settingsCard}
              onSubmit={(e) => {
                e.preventDefault();
                showToast('Hospital facility details saved!');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  showToast('Hospital facility details saved!');
                }
              }}
            >
              <h3>Hospital Facility Profile</h3>
              <p>Update hospital contact details, bed count, and accreditation info shown to public visitors. Press Enter to save.</p>

              <div className={styles.settingsGrid}>
                <div className={styles.formGroup}>
                  <label>Helpline / Emergency Phone</label>
                  <input
                    type="text"
                    value={activeHospital.phone || ''}
                    onChange={(e) => {
                      updateHospital(activeHospital.id, { phone: e.target.value });
                    }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Official Email</label>
                  <input
                    type="email"
                    value={activeHospital.email || ''}
                    onChange={(e) => {
                      updateHospital(activeHospital.id, { email: e.target.value });
                    }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Total Hospital Beds</label>
                  <input
                    type="number"
                    value={activeHospital.totalBeds ?? ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Number(e.target.value);
                      updateHospital(activeHospital.id, { totalBeds: val });
                    }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Established Year</label>
                  <input
                    type="number"
                    value={activeHospital.establishedYear ?? ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Number(e.target.value);
                      updateHospital(activeHospital.id, { establishedYear: val });
                    }}
                  />
                </div>

                <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                  <label>Street Address</label>
                  <input
                    type="text"
                    value={activeHospital.address || ''}
                    onChange={(e) => {
                      updateHospital(activeHospital.id, { address: e.target.value });
                    }}
                  />
                </div>
              </div>

              {/* HOSPITAL LOCATION MANAGEMENT (Leaflet Location Picker) */}
              <HospitalLocationPicker
                hospital={activeHospital}
                onSaveLocation={(coords) => {
                  updateHospital(activeHospital.id || activeHospital._id, coords);
                  showToast('Hospital GPS coordinates saved and updated for public route directions!');
                }}
              />

              <div className={styles.settingsSaveRow}>
                <button
                  type="submit"
                  className={styles.saveBtn}
                >
                  Save Facility Profile
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 7: SPECIALITIES & PROCEDURES MANAGEMENT */}
        {activeTab === 'specialities' && (
          <div className={styles.tabContentArea}>
            {/* 1. Hospital Active Departments Card */}
            <div className={styles.settingsCard} style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
                <div>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={20} color="#2563eb" />
                    Hospital Clinical Departments & Specialities
                  </h3>
                  <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                    Departments active for this hospital. These will be highlighted on your public hospital profile.
                  </p>
                </div>
                <div style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '4px 12px', borderRadius: '100px', fontSize: '0.82rem', fontWeight: 700 }}>
                  {(activeHospital.specialties || []).length} Departments Active
                </div>
              </div>

              {/* Active Specialties Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '16px 0' }}>
                {(activeHospital.specialties && activeHospital.specialties.length > 0) ? (
                  activeHospital.specialties.map((spec) => (
                    <span
                      key={spec}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        border: '1.5px solid #93c5fd',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '0.88rem',
                        fontWeight: 600
                      }}
                    >
                      <CheckCircle size={14} color="#2563eb" />
                      {spec}
                      <button
                        type="button"
                        onClick={() => handleToggleHospitalSpecialty(spec)}
                        title={`Remove ${spec}`}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          padding: 0,
                          marginLeft: '2px'
                        }}
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))
                ) : (
                  <p style={{ color: '#94a3b8', fontSize: '0.88rem', fontStyle: 'italic', margin: 0 }}>
                    No departments selected yet. Click any quick-select button below or add your own!
                  </p>
                )}
              </div>

              {/* Quick Select Popular Departments */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '12px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Quick-Add Clinical Departments:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {[
                    'Cardiology', 'Neurology', 'Orthopedics', 'Robotic Surgery', 'Oncology',
                    'Nephrology', 'Internal Medicine', 'Obstetrics & Gynaecology', 'Pediatrics',
                    'Urology', 'Gastroenterology', 'Pulmonology', 'Emergency & Critical Care'
                  ].map((dept) => {
                    const isSelected = (activeHospital.specialties || []).some(s => s.toLowerCase() === dept.toLowerCase());
                    return (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => handleToggleHospitalSpecialty(dept)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: isSelected ? '#dbeafe' : '#f8fafc',
                          color: isSelected ? '#1e40af' : '#475569',
                          border: isSelected ? '1.5px solid #3b82f6' : '1px solid #cbd5e1',
                          borderRadius: '8px',
                          padding: '5px 12px',
                          fontSize: '0.82rem',
                          fontWeight: isSelected ? 700 : 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {isSelected ? <CheckCircle size={13} color="#2563eb" /> : <Plus size={13} />}
                        {dept}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Department Form */}
              <form onSubmit={handleAddCustomHospitalSpecialty} style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <input
                  type="text"
                  placeholder="Enter custom department (e.g. Ophthalmology, Plastic Surgery)..."
                  value={newCustomSpecialtyInput}
                  onChange={(e) => setNewCustomSpecialtyInput(e.target.value)}
                  style={{
                    flex: 1,
                    maxWidth: '420px',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Plus size={15} /> Add Department
                </button>
              </form>
            </div>

            {/* 2. Specialities & Procedures Catalog */}
            <div className={styles.settingsCard}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
                <div>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={20} color="#2563eb" />
                    Specialities, Surgeries & Cashless Mediclaim Catalog
                  </h3>
                  <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                    Edit the treatments, cost estimates, cashless insurance coverage, and procedures shown under "Specialities & Procedures".
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.saveBtn}
                  onClick={() => {
                    setEditingSpeciality(null);
                    setIsSpecialityModalOpen(true);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={16} /> + New Speciality / Procedure
                </button>
              </div>

              {/* Filter & Search Controls */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '18px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '6px 12px', flex: 1, minWidth: '240px' }}>
                  <Search size={16} color="#64748b" />
                  <input
                    type="text"
                    placeholder="Search specialities or procedures..."
                    value={specialitySearch}
                    onChange={(e) => setSpecialitySearch(e.target.value)}
                    style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.88rem' }}
                  />
                  {specialitySearch && (
                    <button type="button" onClick={() => setSpecialitySearch('')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { key: 'all', label: 'All Items' },
                    { key: 'speciality', label: 'Specialities' },
                    { key: 'procedure', label: 'Procedures' }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setSpecialityTypeFilter(tab.key)}
                      style={{
                        background: specialityTypeFilter === tab.key ? '#2563eb' : '#f1f5f9',
                        color: specialityTypeFilter === tab.key ? '#ffffff' : '#475569',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '7px 14px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                {(specialitiesProcedures || [])
                  .filter(item => {
                    const matchesSearch = !specialitySearch ||
                      item.name?.toLowerCase().includes(specialitySearch.toLowerCase()) ||
                      item.description?.toLowerCase().includes(specialitySearch.toLowerCase());
                    const matchesType = specialityTypeFilter === 'all' || item.type === specialityTypeFilter;
                    return matchesSearch && matchesType;
                  })
                  .map((item) => (
                    <div
                      key={item.id || item._id}
                      style={{
                        background: '#ffffff',
                        border: '1.5px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '12px',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                          <div>
                            <span
                              style={{
                                display: 'inline-block',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: item.type === 'procedure' ? '#fef3c7' : '#eff6ff',
                                color: item.type === 'procedure' ? '#92400e' : '#1d4ed8',
                                marginBottom: '6px'
                              }}
                            >
                              {item.type === 'procedure' ? 'Surgical Procedure' : 'Clinical Speciality'}
                            </span>
                            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                              {item.name}
                            </h4>
                          </div>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSpeciality(item);
                                setIsSpecialityModalOpen(true);
                              }}
                              title="Edit Speciality / Procedure"
                              style={{
                                background: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                color: '#1d4ed8',
                                borderRadius: '6px',
                                padding: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSpecialityProcedure(item)}
                              title="Delete Speciality / Procedure"
                              style={{
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                                color: '#dc2626',
                                borderRadius: '6px',
                                padding: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {item.description && (
                          <p style={{ margin: '8px 0 0 0', color: '#64748b', fontSize: '0.82rem', lineHeight: 1.4 }}>
                            {item.description}
                          </p>
                        )}
                      </div>

                      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                          <span style={{ color: '#64748b', fontWeight: 600 }}>Coverage:</span>
                          <span style={{ color: '#0284c7', background: '#f0f9ff', border: '1px solid #bae6fd', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                            {item.insuranceDetails?.coveragePercent || 'Cashless Available'}
                          </span>
                        </div>

                        {item.insuranceDetails?.estimatedCostRange && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                            <span style={{ color: '#64748b', fontWeight: 600 }}>Estimated Cost:</span>
                            <span style={{ color: '#0f172a', fontWeight: 700 }}>
                              {item.insuranceDetails.estimatedCostRange}
                            </span>
                          </div>
                        )}

                        {item.procedures && item.procedures.length > 0 && (
                          <div style={{ marginTop: '4px' }}>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>
                              Included Procedures ({item.procedures.length}):
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {item.procedures.slice(0, 3).map((p, idx) => (
                                <span key={idx} style={{ background: '#f8fafc', color: '#475569', fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                  {p}
                                </span>
                              ))}
                              {item.procedures.length > 3 && (
                                <span style={{ color: '#2563eb', fontSize: '0.72rem', fontWeight: 600 }}>
                                  +{item.procedures.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Doctor to Hospital Modal */}
      {isAddDoctorModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAddDoctorModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className={styles.modalHeader}>
              <div>
                <h3 style={{ margin: 0 }}>Add Doctor to {activeHospital.name}</h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Register a clinical specialist and select whether to highlight them as a Star Doctor.
                </span>
              </div>
              <button onClick={() => setIsAddDoctorModalOpen(false)} className={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddDoctorSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Doctor Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Khanna"
                  value={newDoctorData.name}
                  onChange={(e) => setNewDoctorData({ ...newDoctorData, name: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Doctor Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. dr.khanna@hospital.com"
                  value={newDoctorData.email}
                  onChange={(e) => setNewDoctorData({ ...newDoctorData, email: e.target.value })}
                />
                <span style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                  💡 On their first login to the Doctor Portal, they will enter this email and set their password.
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className={styles.formGroup}>
                  <label>Department / Specialty *</label>
                  <select
                    value={newDoctorData.specialty}
                    onChange={(e) => setNewDoctorData({ ...newDoctorData, specialty: e.target.value })}
                  >
                    <option value="Cardiology">Cardiology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Gynecology">Gynecology</option>
                    <option value="Oncology">Oncology</option>
                    <option value="General Medicine">General Medicine</option>
                    <option value="Dermatology">Dermatology</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Degrees / Qualifications</label>
                  <input
                    type="text"
                    placeholder="e.g. MBBS, MD, MS"
                    value={newDoctorData.degree}
                    onChange={(e) => setNewDoctorData({ ...newDoctorData, degree: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className={styles.formGroup}>
                  <label>Experience (Years)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={newDoctorData.experience}
                    onChange={(e) => setNewDoctorData({ ...newDoctorData, experience: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Consultation Fee (₹)</label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={newDoctorData.fees}
                    onChange={(e) => setNewDoctorData({ ...newDoctorData, fees: e.target.value })}
                  />
                </div>
              </div>

              {/* STAR DOCTOR SELECTOR */}
              <div style={{
                background: newDoctorData.isStarDoctor ? '#fef3c7' : '#f8fafc',
                border: newDoctorData.isStarDoctor ? '1.5px solid #f59e0b' : '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                marginTop: '6px',
                transition: 'all 0.2s ease'
              }}>
                <div>
                  <div style={{ fontWeight: 700, color: newDoctorData.isStarDoctor ? '#92400e' : '#334155', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Star size={16} fill={newDoctorData.isStarDoctor ? '#f59e0b' : 'none'} color={newDoctorData.isStarDoctor ? '#f59e0b' : '#64748b'} />
                    Select as Star Doctor
                  </div>
                  <div style={{ fontSize: '0.78rem', color: newDoctorData.isStarDoctor ? '#b45309' : '#64748b', marginTop: '2px' }}>
                    Featured prominently on your public hospital center page under "Star Doctors & Clinical Leaders".
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={newDoctorData.isStarDoctor}
                  onChange={(e) => setNewDoctorData({ ...newDoctorData, isStarDoctor: e.target.checked })}
                  style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: '#f59e0b' }}
                />
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsAddDoctorModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn} disabled={isAddingDoc}>
                  {isAddingDoc ? 'Adding Doctor...' : 'Add Doctor to Hospital'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Speciality & Procedure Edit/Add Modal */}
      {isSpecialityModalOpen && (
        <SpecialityFormModal
          itemToEdit={editingSpeciality}
          onClose={() => {
            setIsSpecialityModalOpen(false);
            setEditingSpeciality(null);
          }}
          onSave={handleSaveSpecialityProcedure}
        />
      )}

      {/* Manage Doctor Profile FAQs Modal */}
      {isDoctorFaqModalOpen && selectedFaqDoctor && (
        <div
          className={styles.modalOverlay}
          onClick={() => setIsDoctorFaqModalOpen(false)}
          style={{ zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '620px',
              width: '92%',
              maxHeight: '88vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <HelpCircle size={20} color="#0284c7" />
                  Manage FAQs for {selectedFaqDoctor.name}
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Hospital Authority • Displayed on {selectedFaqDoctor.name}'s public doctor profile page
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsDoctorFaqModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <ShieldCheck size={18} color="#0284c7" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.84rem', color: '#0369a1', lineHeight: 1.45 }}>
                  As the registered hospital center (<strong>{activeHospital.name}</strong>), you maintain and verify clinical policy FAQs for your affiliated specialists. Changes published here reflect immediately on the doctor's live profile page.
                </div>
              </div>

              {/* List of Existing FAQs */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>
                    Current FAQs ({doctorFaqsList.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const defaults = [
                        { q: `How can I book an appointment with ${selectedFaqDoctor.name}?`, a: `Appointments for ${selectedFaqDoctor.name} at ${activeHospital.name || 'our hospital'} can be booked online through The Sehat Buddy platform.` },
                        { q: 'What should I carry for the clinic consultation?', a: 'Carry a valid photo ID, health insurance policy e-card, and any previous doctor prescriptions or test reports.' },
                        { q: 'Is cashless insurance pre-authorization available?', a: `Yes, ${activeHospital.name || 'our hospital'} provides 100% cashless pre-authorization with all major insurance TPAs.` },
                        { q: 'Can I reschedule or cancel my appointment?', a: 'Yes, patients can reschedule or cancel before their slot time through their patient account.' }
                      ];
                      setDoctorFaqsList(defaults);
                    }}
                    style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Reset to Hospital Defaults
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                  {doctorFaqsList.map((faq, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '10px 12px'
                      }}
                    >
                      {editingDoctorFaqIdx === idx ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <input
                            type="text"
                            value={editingDoctorFaqData.q}
                            onChange={(e) => setEditingDoctorFaqData({ ...editingDoctorFaqData, q: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (!editingDoctorFaqData.q.trim()) return;
                                const updated = [...doctorFaqsList];
                                updated[idx] = { ...editingDoctorFaqData };
                                setDoctorFaqsList(updated);
                                setEditingDoctorFaqIdx(null);
                              }
                            }}
                            placeholder="Question..."
                            style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1.5px solid #0284c7', outline: 'none', boxSizing: 'border-box' }}
                          />
                          <textarea
                            rows={2}
                            value={editingDoctorFaqData.a}
                            onChange={(e) => setEditingDoctorFaqData({ ...editingDoctorFaqData, a: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                e.preventDefault();
                                if (!editingDoctorFaqData.q.trim()) return;
                                const updated = [...doctorFaqsList];
                                updated[idx] = { ...editingDoctorFaqData };
                                setDoctorFaqsList(updated);
                                setEditingDoctorFaqIdx(null);
                              }
                            }}
                            placeholder="Answer... (Press Ctrl+Enter to save)"
                            style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1.5px solid #0284c7', outline: 'none', boxSizing: 'border-box' }}
                          />
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => {
                                if (!editingDoctorFaqData.q.trim()) return;
                                const updated = [...doctorFaqsList];
                                updated[idx] = { ...editingDoctorFaqData };
                                setDoctorFaqsList(updated);
                                setEditingDoctorFaqIdx(null);
                              }}
                              style={{ background: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              Done
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingDoctorFaqIdx(null)}
                              style={{ background: '#cbd5e1', color: '#334155', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '0.78rem', cursor: 'pointer' }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.86rem', color: '#0f172a', marginBottom: '3px' }}>
                              Q{idx + 1}: {faq.q || faq.question}
                            </div>
                            <div style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.4 }}>
                              {faq.a || faq.answer}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingDoctorFaqIdx(idx);
                                setEditingDoctorFaqData({ q: faq.q || faq.question || '', a: faq.a || faq.answer || '' });
                              }}
                              style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', padding: '4px' }}
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDoctorFaqsList(prev => prev.filter((_, i) => i !== idx));
                              }}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New FAQ Block */}
              <div style={{ background: '#f8fafc', border: '1.5px dashed #cbd5e1', borderRadius: '10px', padding: '14px' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '8px' }}>
                  + Add Custom FAQ for {selectedFaqDoctor.name}
                </span>
                <input
                  type="text"
                  placeholder="Question (e.g. Does the doctor provide second opinion consultations?)"
                  value={newDoctorFaqQ}
                  onChange={(e) => setNewDoctorFaqQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (!newDoctorFaqQ.trim()) return;
                      setDoctorFaqsList(prev => [...prev, { q: newDoctorFaqQ.trim(), a: newDoctorFaqA.trim() }]);
                      setNewDoctorFaqQ('');
                      setNewDoctorFaqA('');
                    }
                  }}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '8px', boxSizing: 'border-box' }}
                />
                <textarea
                  rows={2}
                  placeholder="Answer... (Press Ctrl+Enter to add)"
                  value={newDoctorFaqA}
                  onChange={(e) => setNewDoctorFaqA(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      if (!newDoctorFaqQ.trim()) return;
                      setDoctorFaqsList(prev => [...prev, { q: newDoctorFaqQ.trim(), a: newDoctorFaqA.trim() }]);
                      setNewDoctorFaqQ('');
                      setNewDoctorFaqA('');
                    }
                  }}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '10px', boxSizing: 'border-box' }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newDoctorFaqQ.trim()) return;
                    setDoctorFaqsList(prev => [...prev, { q: newDoctorFaqQ.trim(), a: newDoctorFaqA.trim() }]);
                    setNewDoctorFaqQ('');
                    setNewDoctorFaqA('');
                  }}
                  style={{
                    background: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '7px 14px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Plus size={14} /> Add to Roster FAQs
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsDoctorFaqModalOpen(false)}
                style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingDoctorFaqs}
                onClick={handleSaveDoctorFaqs}
                style={{
                  padding: '9px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#0284c7',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: isSavingDoctorFaqs ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {isSavingDoctorFaqs ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={15} />}
                Publish Doctor FAQs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalDashboard;
