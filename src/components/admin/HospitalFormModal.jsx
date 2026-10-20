import React, { useState } from 'react';
import {
  X,
  Building2,
  Upload,
  AlertCircle,
  Plus,
  Check,
  Video,
  Sparkles,
  Star,
  Loader2,
  ShieldCheck,
  Camera,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import { useData } from '../../context/useData';
import { api } from '../../services/api';
import { insurancePartners, defaultAcceptedInsurances } from '../../data/insurancePartners';
import styles from './HospitalFormModal.module.css';

const getYouTubeThumbnail = (url) => {
  if (!url || typeof url !== 'string') return null;
  let videoId = '';
  if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
  else if (url.includes('youtube.com/watch?v=')) videoId = url.split('v=')[1].split('&')[0];
  else if (url.includes('youtube.com/shorts/')) videoId = url.split('shorts/')[1].split('?')[0];
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
};

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
  'Robotic Surgery'
];

const PRESET_HOSPITAL_IMAGES = [
  {
    name: 'Modern Medical Center',
    url: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Glass Facade Clinic',
    url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Metropolitan Hospital',
    url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Care & Research Pavilion',
    url: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80'
  }
];

const HospitalFormContent = ({ hospitalToEdit, onClose, onSuccess }) => {
  const { addHospital, updateHospital, doctors } = useData();

  const [formData, setFormData] = useState(() => {
    if (hospitalToEdit) {
      const initReels = (Array.isArray(hospitalToEdit.reels) ? hospitalToEdit.reels : [])
        .map(r => {
          if (typeof r === 'string') return { url: r, coverPhoto: '' };
          if (r && typeof r === 'object') return { url: r.url || '', coverPhoto: r.coverPhoto || '' };
          return { url: '', coverPhoto: '' };
        });
      while (initReels.length < 5) initReels.push({ url: '', coverPhoto: '' });

      const initVideos = (Array.isArray(hospitalToEdit.youtube_videos) ? hospitalToEdit.youtube_videos : [])
        .map(v => {
          if (typeof v === 'string') return { url: v, coverPhoto: '' };
          if (v && typeof v === 'object') return { url: v.url || '', coverPhoto: v.coverPhoto || '' };
          return { url: '', coverPhoto: '' };
        });
      while (initVideos.length < 5) initVideos.push({ url: '', coverPhoto: '' });

      const initStarDocs = Array.isArray(hospitalToEdit.star_doctors)
        ? hospitalToEdit.star_doctors.map(d => typeof d === 'object' ? (d._id || d.id) : d).filter(Boolean)
        : [];

      // Resolve staff doctors with full names from hospital records or doctors database
      const rawStaffEmails = Array.isArray(hospitalToEdit.staff_emails) ? [...hospitalToEdit.staff_emails] : [];
      const rawStaffDocs = Array.isArray(hospitalToEdit.staff_doctors) ? [...hospitalToEdit.staff_doctors] : [];

      const initialStaffDocs = [];
      const seenStaffEmails = new Set();

      rawStaffDocs.forEach(sd => {
        const sEmail = (typeof sd === 'string' ? sd : sd?.email || '').toLowerCase().trim();
        if (!sEmail || seenStaffEmails.has(sEmail)) return;
        seenStaffEmails.add(sEmail);
        let sName = (typeof sd === 'object' ? sd?.name : '') || '';
        if (!sName && doctors && doctors.length > 0) {
          const match = doctors.find(d => (d.email || '').toLowerCase().trim() === sEmail);
          if (match?.name) sName = match.name;
        }
        if (!sName) {
          const namePart = sEmail.split('@')[0].replace(/[._-]/g, ' ');
          sName = 'Dr. ' + namePart.charAt(0).toUpperCase() + namePart.slice(1);
        }
        initialStaffDocs.push({ email: sEmail, name: sName });
      });

      rawStaffEmails.forEach(e => {
        const cleanE = (typeof e === 'string' ? e : e?.email || '').toLowerCase().trim();
        if (!cleanE || seenStaffEmails.has(cleanE)) return;
        seenStaffEmails.add(cleanE);
        let sName = '';
        if (doctors && doctors.length > 0) {
          const match = doctors.find(d => (d.email || '').toLowerCase().trim() === cleanE);
          if (match?.name) sName = match.name;
        }
        if (!sName) {
          const namePart = cleanE.split('@')[0].replace(/[._-]/g, ' ');
          sName = 'Dr. ' + namePart.charAt(0).toUpperCase() + namePart.slice(1);
        }
        initialStaffDocs.push({ email: cleanE, name: sName });
      });

      // Also auto-link any existing doctors in DB whose hospital property matches this hospital
      if (doctors && doctors.length > 0 && hospitalToEdit.name) {
        const hospNameLower = hospitalToEdit.name.toLowerCase().trim();
        doctors.forEach(doc => {
          const docEmail = (doc.email || '').toLowerCase().trim();
          const docHosp = (doc.hospital || '').toLowerCase().trim();
          if (docEmail && !seenStaffEmails.has(docEmail) && docHosp && (docHosp === hospNameLower || docHosp.includes(hospNameLower) || hospNameLower.includes(docHosp))) {
            seenStaffEmails.add(docEmail);
            initialStaffDocs.push({ email: docEmail, name: doc.name || '' });
          }
        });
      }

      return {
        name: hospitalToEdit.name || '',
        city: hospitalToEdit.city || 'Delhi',
        address: hospitalToEdit.address || '',
        rating: hospitalToEdit.rating || 4.8,
        reviews: hospitalToEdit.reviews || '500+',
        totalBeds: hospitalToEdit.totalBeds || 300,
        emergency24x7: Boolean(hospitalToEdit.emergency24x7),
        phone: hospitalToEdit.phone || '',
        email: hospitalToEdit.email || '',
        establishedYear: hospitalToEdit.establishedYear || 2000,
        description: hospitalToEdit.description || '',
        image: hospitalToEdit.image || PRESET_HOSPITAL_IMAGES[0].url,
        specialties: hospitalToEdit.specialties || ['Cardiology'],
        reels: initReels.slice(0, 5),
        youtube_videos: initVideos.slice(0, 5),
        star_doctors: initStarDocs,
        latitude: hospitalToEdit.latitude !== undefined && hospitalToEdit.latitude !== null ? hospitalToEdit.latitude : '',
        longitude: hospitalToEdit.longitude !== undefined && hospitalToEdit.longitude !== null ? hospitalToEdit.longitude : '',
        staff_emails: Array.from(seenStaffEmails),
        staff_doctors: initialStaffDocs,
        cashlessInsurance: hospitalToEdit.cashlessInsurance !== undefined ? hospitalToEdit.cashlessInsurance : true,
        acceptedInsurances: Array.isArray(hospitalToEdit.acceptedInsurances) && hospitalToEdit.acceptedInsurances.length > 0 ? hospitalToEdit.acceptedInsurances : defaultAcceptedInsurances,
        tpaPhone: hospitalToEdit.tpaHelpdesk?.phone || '',
        tpaEmail: hospitalToEdit.tpaHelpdesk?.email || '',
        tpaPreAuthTime: hospitalToEdit.tpaHelpdesk?.preAuthTime || '30 Mins Cashless Pre-Approval',
        insuranceHelpline: hospitalToEdit.insuranceHelpline || '1800-SEHAT-CARE'
      };
    }
    return {
      name: '',
      city: 'Delhi',
      address: '',
      rating: 4.8,
      reviews: '1,200+',
      totalBeds: 400,
      emergency24x7: true,
      phone: '+91 ',
      email: '',
      establishedYear: 2005,
      description: '',
      image: PRESET_HOSPITAL_IMAGES[0].url,
      specialties: ['Cardiology', 'Neurology', 'Orthopedics'],
      reels: [
        { url: '', coverPhoto: '' },
        { url: '', coverPhoto: '' },
        { url: '', coverPhoto: '' },
        { url: '', coverPhoto: '' },
        { url: '', coverPhoto: '' }
      ],
      youtube_videos: [
        { url: '', coverPhoto: '' },
        { url: '', coverPhoto: '' },
        { url: '', coverPhoto: '' },
        { url: '', coverPhoto: '' },
        { url: '', coverPhoto: '' }
      ],
      star_doctors: [],
      latitude: '',
      longitude: '',
      staff_emails: [],
      staff_doctors: [],
      cashlessInsurance: true,
      acceptedInsurances: defaultAcceptedInsurances,
      tpaPhone: '',
      tpaEmail: '',
      tpaPreAuthTime: '30 Mins Cashless Pre-Approval',
      insuranceHelpline: '1800-SEHAT-CARE'
    };
  });

  const [imageType, setImageType] = useState(() => {
    if (hospitalToEdit?.image && !PRESET_HOSPITAL_IMAGES.some(p => p.url === hospitalToEdit.image)) {
      return 'url';
    }
    return 'preset';
  });

  const [customImageUrl, setCustomImageUrl] = useState(() => {
    if (hospitalToEdit?.image && !PRESET_HOSPITAL_IMAGES.some(p => p.url === hospitalToEdit.image)) {
      return hospitalToEdit.image;
    }
    return '';
  });

  const [customSpecialtyInput, setCustomSpecialtyInput] = useState('');
  const [staffEmailInput, setStaffEmailInput] = useState('');
  const [staffDoctorNameInput, setStaffDoctorNameInput] = useState('');
  const [errors, setErrors] = useState({});

  const handleAddStaffDoctor = () => {
    if (!staffEmailInput.trim()) return;
    const cleanEmail = staffEmailInput.trim().toLowerCase();
    let docName = staffDoctorNameInput.trim();

    if (!docName && doctors && doctors.length > 0) {
      const match = doctors.find(d => (d.email || '').toLowerCase().trim() === cleanEmail);
      if (match?.name) {
        docName = match.name;
      }
    }
    if (!docName) {
      const namePart = cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
      docName = 'Dr. ' + namePart.charAt(0).toUpperCase() + namePart.slice(1);
    } else if (!docName.toLowerCase().startsWith('dr.') && !docName.toLowerCase().startsWith('dr ')) {
      docName = 'Dr. ' + docName;
    }

    const existingStaff = formData.staff_doctors || [];
    if (!existingStaff.some(d => (d.email || d).toLowerCase() === cleanEmail)) {
      setFormData({
        ...formData,
        staff_emails: [...(formData.staff_emails || []).filter(e => e.toLowerCase() !== cleanEmail), cleanEmail],
        staff_doctors: [...existingStaff, { email: cleanEmail, name: docName }]
      });
    }
    setStaffEmailInput('');
    setStaffDoctorNameInput('');
  };

  const handleRemoveStaffDoctor = (emailToRemove) => {
    setFormData({
      ...formData,
      staff_emails: (formData.staff_emails || []).filter(e => e !== emailToRemove),
      staff_doctors: (formData.staff_doctors || []).filter(d => d.email !== emailToRemove)
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Hospital name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Official Hospital email is required for login';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (formData.totalBeds && Number(formData.totalBeds) <= 0) {
      newErrors.totalBeds = 'Valid bed capacity is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await api.uploadImage(file, 'sehatbuddy/hospitals');
      setFormData(prev => ({ ...prev, image: url }));
    } catch (err) {
      console.error('Failed to upload to Cloudinary:', err);
      // Fallback to data URI
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const [uploadingMediaIdx, setUploadingMediaIdx] = useState(null);

  const handleMediaCoverUpload = async (e, type, index) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const key = `${type}-${index}`;
    setUploadingMediaIdx(key);
    try {
      const url = await api.uploadImage(file, 'sehatbuddy/covers');
      if (type === 'reel') {
        const nextReels = [...formData.reels];
        const cur = (typeof nextReels[index] === 'object' && nextReels[index]) ? nextReels[index] : {};
        nextReels[index] = { ...cur, coverPhoto: url };
        setFormData(prev => ({ ...prev, reels: nextReels }));
      } else {
        const nextVideos = [...formData.youtube_videos];
        const cur = (typeof nextVideos[index] === 'object' && nextVideos[index]) ? nextVideos[index] : {};
        nextVideos[index] = { ...cur, coverPhoto: url };
        setFormData(prev => ({ ...prev, youtube_videos: nextVideos }));
      }
    } catch (err) {
      console.error('Failed to upload cover photo:', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'reel') {
          const nextReels = [...formData.reels];
          const cur = (typeof nextReels[index] === 'object' && nextReels[index]) ? nextReels[index] : {};
          nextReels[index] = { ...cur, coverPhoto: reader.result };
          setFormData(prev => ({ ...prev, reels: nextReels }));
        } else {
          const nextVideos = [...formData.youtube_videos];
          const cur = (typeof nextVideos[index] === 'object' && nextVideos[index]) ? nextVideos[index] : {};
          nextVideos[index] = { ...cur, coverPhoto: reader.result };
          setFormData(prev => ({ ...prev, youtube_videos: nextVideos }));
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingMediaIdx(null);
    }
  };

  const updateReelItem = (index, field, value) => {
    const nextReels = [...formData.reels];
    const cur = (typeof nextReels[index] === 'object' && nextReels[index]) ? nextReels[index] : {};
    nextReels[index] = { ...cur, [field]: value };
    setFormData(prev => ({ ...prev, reels: nextReels }));
  };

  const updateVideoItem = (index, field, value) => {
    const nextVideos = [...formData.youtube_videos];
    const cur = (typeof nextVideos[index] === 'object' && nextVideos[index]) ? nextVideos[index] : {};
    nextVideos[index] = { ...cur, [field]: value };
    setFormData(prev => ({ ...prev, youtube_videos: nextVideos }));
  };

  const toggleSpecialty = (spec) => {
    setFormData(prev => {
      const exists = prev.specialties.includes(spec);
      return {
        ...prev,
        specialties: exists ? prev.specialties.filter(s => s !== spec) : [...prev.specialties, spec]
      };
    });
  };

  const addCustomSpecialty = () => {
    const trimmed = customSpecialtyInput.trim();
    if (trimmed && !formData.specialties.includes(trimmed)) {
      setFormData(prev => ({ ...prev, specialties: [...prev.specialties, trimmed] }));
      setCustomSpecialtyInput('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const finalImage = imageType === 'url' && customImageUrl ? customImageUrl : formData.image;

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      city: formData.city.trim() || 'Delhi',
      address: formData.address.trim() || `${formData.city || 'Central'} Medical Campus`,
      rating: parseFloat(formData.rating) || 4.8,
      reviews: formData.reviews || '50+',
      totalBeds: parseInt(formData.totalBeds, 10) || 100,
      emergency24x7: Boolean(formData.emergency24x7),
      phone: formData.phone.trim() || '+91 11 2000 3000',
      password: hospitalToEdit ? undefined : 'CHANGEME_PENDING_SETUP',
      isFirstLogin: hospitalToEdit ? hospitalToEdit.isFirstLogin : true,
      passwordSet: hospitalToEdit ? hospitalToEdit.passwordSet : false,
      establishedYear: parseInt(formData.establishedYear, 10) || 2005,
      description: formData.description.trim(),
      specialties: formData.specialties && formData.specialties.length > 0 ? formData.specialties : ['Cardiology', 'Neurology', 'Orthopedics'],
      specialities: formData.specialties && formData.specialties.length > 0 ? formData.specialties : ['Cardiology', 'Neurology', 'Orthopedics'], // DB mapping
      image: finalImage,
      reels: formData.reels
        .map(r => {
          if (typeof r === 'string') return r.trim() ? { url: r.trim(), coverPhoto: '' } : null;
          if (r && typeof r === 'object') {
            const url = (r.url || '').trim();
            const coverPhoto = (r.coverPhoto || '').trim();
            if (!url && !coverPhoto) return null;
            return { url, coverPhoto };
          }
          return null;
        })
        .filter(Boolean),
      youtube_videos: formData.youtube_videos
        .map(v => {
          if (typeof v === 'string') return v.trim() ? { url: v.trim(), coverPhoto: '' } : null;
          if (v && typeof v === 'object') {
            const url = (v.url || '').trim();
            const coverPhoto = (v.coverPhoto || '').trim();
            if (!url && !coverPhoto) return null;
            return { url, coverPhoto };
          }
          return null;
        })
        .filter(Boolean),
      star_doctors: formData.star_doctors,
      staff_emails: formData.staff_emails,
      staff_doctors: formData.staff_doctors,
      cashlessInsurance: formData.cashlessInsurance,
      acceptedInsurances: formData.acceptedInsurances,
      tpaHelpdesk: {
        phone: formData.tpaPhone.trim() || formData.phone.trim() || '080-45678900',
        email: formData.tpaEmail.trim() || formData.email.trim(),
        preAuthTime: formData.tpaPreAuthTime.trim() || '30 Mins Cashless Pre-Approval'
      },
      insuranceHelpline: formData.insuranceHelpline.trim() || '1800-SEHAT-CARE',
      latitude: formData.latitude !== '' && formData.latitude !== null && !isNaN(Number(formData.latitude)) ? Number(formData.latitude) : undefined,
      longitude: formData.longitude !== '' && formData.longitude !== null && !isNaN(Number(formData.longitude)) ? Number(formData.longitude) : undefined,
    };

    if (hospitalToEdit) {
      updateHospital(hospitalToEdit.id || hospitalToEdit._id, payload);
    } else {
      addHospital(payload);
    }

    if (onSuccess) {
      onSuccess(hospitalToEdit ? 'Hospital updated successfully!' : 'Hospital added successfully!');
    }
    onClose();
  };

  // Filter doctors to ONLY show doctors affiliated with this hospital
  const hospitalDoctors = React.useMemo(() => {
    const currentHospitalName = (formData.name || hospitalToEdit?.name || '').toLowerCase().trim();

    // Collect all emails associated with this hospital's staff
    const staffEmailSet = new Set([
      ...(formData.staff_emails || []).map(e => (typeof e === 'string' ? e : e?.email)?.toLowerCase().trim()),
      ...(formData.staff_doctors || []).map(d => (typeof d === 'string' ? d : d?.email)?.toLowerCase().trim())
    ].filter(Boolean));

    // Map email to custom name if provided in staff_doctors
    const staffNameMap = new Map();
    (formData.staff_doctors || []).forEach(d => {
      if (d && typeof d === 'object' && d.email && d.name) {
        staffNameMap.set(d.email.toLowerCase().trim(), d.name.trim());
      }
    });

    const list = [];
    const addedEmails = new Set();
    const addedIds = new Set();

    // 1. Doctors from the platform whose hospital property matches or whose email is in this hospital's staff
    (doctors || []).forEach(doc => {
      const docEmail = (doc.email || '').toLowerCase().trim();
      const docHosp = (doc.hospital || '').toLowerCase().trim();
      const docIdStr = String(doc.id || doc._id || '');

      const isStaff = staffEmailSet.has(docEmail);
      const isHospitalMatch = currentHospitalName && docHosp && (
        docHosp === currentHospitalName ||
        docHosp.includes(currentHospitalName) ||
        currentHospitalName.includes(docHosp)
      );

      if (isStaff || isHospitalMatch) {
        // Fetch doctor name from staff_doctors if defined, else doctor's DB name
        const displayName = staffNameMap.get(docEmail) || doc.name;
        list.push({
          ...doc,
          name: displayName
        });
        if (docEmail) addedEmails.add(docEmail);
        if (docIdStr) addedIds.add(docIdStr);
      }
    });

    // 2. Any staff doctors added in this modal who might not yet exist in the global doctors list
    (formData.staff_doctors || []).forEach(staffDoc => {
      const sEmail = (staffDoc.email || staffDoc || '').toLowerCase().trim();
      if (sEmail && !addedEmails.has(sEmail)) {
        addedEmails.add(sEmail);
        const name = staffDoc.name || ('Dr. ' + sEmail.split('@')[0].replace(/[._-]/g, ' '));
        list.push({
          id: sEmail,
          _id: sEmail,
          name: name,
          email: sEmail,
          specialty: 'Hospital Staff Physician',
          specialization: 'Hospital Staff Physician',
          hospital: formData.name || 'This Hospital',
          image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=150&q=80'
        });
      }
    });

    return list;
  }, [doctors, formData.name, formData.staff_emails, formData.staff_doctors, hospitalToEdit]);

  return (
    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <div className={styles.iconBadge}>
            <Building2 size={22} />
          </div>
          <div>
            <h2>{hospitalToEdit ? 'Edit Hospital' : 'Add New Hospital'}</h2>
            <p>{hospitalToEdit ? 'Update clinical facilities, departments and location' : 'Register a new verified healthcare facility to Sehat Buddy'}</p>
          </div>
        </div>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.body}>
          {/* General Info */}
          <div className={styles.sectionHeader}>Hospital Overview & Portal Credentials</div>

          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '16px',
            fontSize: '0.86rem',
            color: '#166534',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <ShieldCheck size={20} color="#16a34a" style={{ flexShrink: 0 }} />
            <div>
              <strong>Hospital Portal Access:</strong> When the hospital logs into the Hospital Portal with this email, their name will be fetched automatically from the database, and they will be prompted to set their password on first login.
            </div>
          </div>

          <div className={styles.grid2}>
            <div className={styles.formGroup}>
              <label>Hospital Name <span className={styles.req}>*</span></label>
              <input
                type="text"
                placeholder="e.g. Manipal Hospital"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={errors.name ? styles.inputError : ''}
              />
              {errors.name && <span className={styles.errorMsg}><AlertCircle size={13} /> {errors.name}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Official Hospital Email (Login ID) <span className={styles.req}>*</span></label>
              <input
                type="email"
                placeholder="e.g. admin@manipalhospitals.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={errors.email ? styles.inputError : ''}
              />
              {errors.email && <span className={styles.errorMsg}><AlertCircle size={13} /> {errors.email}</span>}
            </div>
          </div>

          <div className={styles.grid2}>
            <div className={styles.formGroup}>
              <label>City / Location</label>
              <input
                type="text"
                placeholder="e.g. Delhi, Bangalore, Mumbai..."
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Helpline / Contact Phone</label>
              <input
                type="text"
                placeholder="+91 11 2000 3000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Complete Street Address <span className={styles.req}>*</span></label>
            <textarea
              rows={2}
              placeholder="Full address including landmarks and pin code..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className={errors.address ? styles.inputError : ''}
            />
            {errors.address && <span className={styles.errorMsg}><AlertCircle size={13} /> {errors.address}</span>}
          </div>

          <div className={styles.grid2}>
            <div className={styles.formGroup}>
              <label>Latitude (e.g. 12.9592)</label>
              <input
                type="number"
                step="any"
                placeholder="22.7196"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Longitude (e.g. 77.6534)</label>
              <input
                type="number"
                step="any"
                placeholder="75.8577"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.grid3}>
            <div className={styles.formGroup}>
              <label>Total Bed Capacity <span className={styles.req}>*</span></label>
              <input
                type="number"
                min="10"
                step="10"
                value={formData.totalBeds}
                onChange={(e) => setFormData({ ...formData, totalBeds: e.target.value })}
                className={errors.totalBeds ? styles.inputError : ''}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Established Year</label>
              <input
                type="number"
                min="1850"
                max="2026"
                value={formData.establishedYear}
                onChange={(e) => setFormData({ ...formData, establishedYear: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Rating (1 - 5)</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
              />
            </div>
          </div>

          {/* Emergency & Contacts */}
          <div className={styles.emergencyBox}>
            <div className={styles.emergencyLabelGroup}>
              <span className={styles.emergencyTitle}>24/7 Emergency & Trauma Care</span>
              <span className={styles.emergencySub}>Does this hospital have an active round-the-clock emergency department?</span>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={formData.emergency24x7}
                onChange={(e) => setFormData({ ...formData, emergency24x7: e.target.checked })}
              />
              <span className={styles.slider}></span>
            </label>
          </div>



          {/* Specialties */}
          <div className={styles.sectionHeader}>Key Medical Departments & Centers</div>
          {errors.specialties && <span className={styles.errorMsg}><AlertCircle size={13} /> {errors.specialties}</span>}
          
          <div className={styles.tagsContainer}>
            {DEFAULT_SPECIALTIES.map((spec) => {
              const isSelected = formData.specialties.includes(spec);
              return (
                <button
                  key={spec}
                  type="button"
                  className={`${styles.tagBtn} ${isSelected ? styles.tagActive : ''}`}
                  onClick={() => toggleSpecialty(spec)}
                >
                  {isSelected && <Check size={14} />}
                  {spec}
                </button>
              );
            })}
            {formData.specialties.filter(s => !DEFAULT_SPECIALTIES.includes(s)).map((spec) => (
              <button
                key={spec}
                type="button"
                className={`${styles.tagBtn} ${styles.tagActive}`}
                onClick={() => toggleSpecialty(spec)}
              >
                <Check size={14} />
                {spec}
              </button>
            ))}
          </div>

          <div className={styles.addTagRow}>
            <input
              type="text"
              placeholder="Add other department (e.g. Rheumatology)..."
              value={customSpecialtyInput}
              onChange={(e) => setCustomSpecialtyInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomSpecialty();
                }
              }}
            />
            <button type="button" className={styles.addTagBtn} onClick={addCustomSpecialty}>
              <Plus size={16} /> Add
            </button>
          </div>

          {/* Image Selection */}
          <div className={styles.sectionHeader}>Hospital Photo</div>

          <div className={styles.avatarSelectionTabs}>
            <button
              type="button"
              className={`${styles.tabBtn} ${imageType === 'preset' ? styles.tabActive : ''}`}
              onClick={() => setImageType('preset')}
            >
              Preset Images
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${imageType === 'url' ? styles.tabActive : ''}`}
              onClick={() => setImageType('url')}
            >
              Web Image URL
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${imageType === 'upload' ? styles.tabActive : ''}`}
              onClick={() => setImageType('upload')}
            >
              Upload File
            </button>
          </div>

          {imageType === 'preset' && (
            <div className={styles.presetGrid}>
              {PRESET_HOSPITAL_IMAGES.map((preset, idx) => (
                <div
                  key={idx}
                  className={`${styles.presetItem} ${formData.image === preset.url ? styles.presetSelected : ''}`}
                  onClick={() => setFormData({ ...formData, image: preset.url })}
                >
                  <img src={preset.url} alt={preset.name} />
                  <span>{preset.name}</span>
                </div>
              ))}
            </div>
          )}

          {imageType === 'url' && (
            <div className={styles.formGroup}>
              <label>Image URL</label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={customImageUrl}
                onChange={(e) => {
                  setCustomImageUrl(e.target.value);
                  setFormData(prev => ({ ...prev, image: e.target.value }));
                }}
              />
              {customImageUrl && (
                <div className={styles.previewBox}>
                  <img src={customImageUrl} alt="Preview" onError={(e) => { e.target.style.display = 'none'; }} />
                </div>
              )}
            </div>
          )}

          {imageType === 'upload' && (
            <div className={styles.uploadArea}>
              <label className={styles.uploadLabel}>
                <Upload size={24} />
                <span>Click to select hospital image from your device</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className={styles.fileInput} />
              </label>
              {formData.image && typeof formData.image === 'string' && formData.image.startsWith('data:') && (
                <div className={styles.previewBox}>
                  <img src={formData.image} alt="Uploaded preview" />
                </div>
              )}
            </div>
          )}

          <div className={styles.formGroup} style={{ marginTop: '14px' }}>
            <label>Hospital Description & Accreditations</label>
            <textarea
              rows={3}
              placeholder="Overview of specialties, advanced technology, patient facilities... (Press Ctrl+Enter to save)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
          </div>

          {/* Instagram Reels */}
          <div className={styles.sectionHeader} style={{ marginTop: '20px' }}>
            Instagram Reels (Max 5 - Public Page)
          </div>
          <div className={styles.mediaInputList}>
            {formData.reels.map((reel, index) => {
              const reelUrl = typeof reel === 'string' ? reel : (reel?.url || reel?.link || '');
              const reelCover = typeof reel === 'object' ? (reel?.coverPhoto || '') : '';
              const hasUrl = Boolean(reelUrl.trim());

              return (
                <div key={index} className={styles.mediaItemCard}>
                  <div className={styles.mediaRow}>
                    <span className={styles.mediaIndex}>#{index + 1}</span>
                    <input
                      type="url"
                      placeholder={`https://www.instagram.com/reel/... (Reel ${index + 1})`}
                      value={reelUrl}
                      onChange={(e) => updateReelItem(index, 'url', e.target.value)}
                    />
                  </div>

                  {/* Cover Image option when reel URL is entered or cover exists */}
                  {(hasUrl || reelCover) && (
                    <div className={styles.coverImageRow}>
                      {reelCover ? (
                        <div className={styles.coverPreviewGroup}>
                          <img
                            src={reelCover}
                            alt={`Reel ${index + 1} Cover`}
                            className={styles.coverThumbnail}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                          <div className={styles.coverInfo}>
                            <span className={styles.coverBadge}>Reel Cover Active</span>
                            <input
                              type="url"
                              placeholder="Cover image URL..."
                              value={reelCover}
                              onChange={(e) => updateReelItem(index, 'coverPhoto', e.target.value)}
                              className={styles.coverUrlInput}
                            />
                          </div>
                          <button
                            type="button"
                            className={styles.removeCoverBtn}
                            onClick={() => updateReelItem(index, 'coverPhoto', '')}
                            title="Remove cover image"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ) : (
                        <div className={styles.addCoverOptions}>
                          <label className={styles.uploadCoverBtn}>
                            {uploadingMediaIdx === `reel-${index}` ? (
                              <Loader2 size={13} className={styles.spinIcon} />
                            ) : (
                              <Camera size={13} />
                            )}
                            <span>{uploadingMediaIdx === `reel-${index}` ? 'Uploading...' : 'Upload Cover Image'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              disabled={uploadingMediaIdx === `reel-${index}`}
                              onChange={(e) => handleMediaCoverUpload(e, 'reel', index)}
                            />
                          </label>
                          <span className={styles.coverDivider}>or</span>
                          <input
                            type="url"
                            placeholder="Paste cover image URL..."
                            value={reelCover}
                            onChange={(e) => updateReelItem(index, 'coverPhoto', e.target.value)}
                            className={styles.coverUrlQuickInput}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* YouTube Videos */}
          <div className={styles.sectionHeader} style={{ marginTop: '20px' }}>
            YouTube Videos (Max 5 - Walkthroughs & Sessions)
          </div>
          <div className={styles.mediaInputList}>
            {formData.youtube_videos.map((video, index) => {
              const videoUrl = typeof video === 'string' ? video : (video?.url || '');
              const videoCover = typeof video === 'object' ? (video?.coverPhoto || '') : '';
              const hasUrl = Boolean(videoUrl.trim());
              const autoThumbnail = getYouTubeThumbnail(videoUrl);

              return (
                <div key={index} className={styles.mediaItemCard}>
                  <div className={styles.mediaRow}>
                    <span className={styles.mediaIndex} style={{ background: '#fef2f2', color: '#ef4444' }}>
                      #{index + 1}
                    </span>
                    <input
                      type="url"
                      placeholder={`https://www.youtube.com/watch?v=... (Video ${index + 1})`}
                      value={videoUrl}
                      onChange={(e) => updateVideoItem(index, 'url', e.target.value)}
                    />
                  </div>

                  {/* Cover Image option when video URL is entered or cover exists */}
                  {(hasUrl || videoCover) && (
                    <div className={styles.coverImageRow}>
                      {videoCover ? (
                        <div className={styles.coverPreviewGroup}>
                          <img
                            src={videoCover}
                            alt={`Video ${index + 1} Cover`}
                            className={styles.coverThumbnail}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                          <div className={styles.coverInfo}>
                            <span className={styles.coverBadge} style={{ background: '#fef2f2', color: '#dc2626' }}>
                              Video Cover Active
                            </span>
                            <input
                              type="url"
                              placeholder="Cover image URL..."
                              value={videoCover}
                              onChange={(e) => updateVideoItem(index, 'coverPhoto', e.target.value)}
                              className={styles.coverUrlInput}
                            />
                          </div>
                          <button
                            type="button"
                            className={styles.removeCoverBtn}
                            onClick={() => updateVideoItem(index, 'coverPhoto', '')}
                            title="Remove cover image"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ) : (
                        <div className={styles.addCoverOptions}>
                          <label className={styles.uploadCoverBtn}>
                            {uploadingMediaIdx === `video-${index}` ? (
                              <Loader2 size={13} className={styles.spinIcon} />
                            ) : (
                              <Camera size={13} />
                            )}
                            <span>{uploadingMediaIdx === `video-${index}` ? 'Uploading...' : 'Upload Cover Image'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              disabled={uploadingMediaIdx === `video-${index}`}
                              onChange={(e) => handleMediaCoverUpload(e, 'video', index)}
                            />
                          </label>
                          {autoThumbnail && (
                            <button
                              type="button"
                              className={styles.autoCoverBtn}
                              onClick={() => updateVideoItem(index, 'coverPhoto', autoThumbnail)}
                              title="Use YouTube video default thumbnail as cover"
                            >
                              <ImageIcon size={13} /> Auto YouTube Cover
                            </button>
                          )}
                          <span className={styles.coverDivider}>or</span>
                          <input
                            type="url"
                            placeholder="Paste cover image URL..."
                            value={videoCover}
                            onChange={(e) => updateVideoItem(index, 'coverPhoto', e.target.value)}
                            className={styles.coverUrlQuickInput}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Star Doctors Selection */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px', borderBottom: '1px solid #edf2f4', paddingBottom: '6px' }}>
            <div className={styles.sectionHeader} style={{ margin: 0, border: 'none', padding: 0 }}>
              ⭐ Star Doctors of this Hospital
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, background: '#fef3c7', color: '#b45309', padding: '3px 10px', borderRadius: '12px' }}>
              {formData.star_doctors.length} Selected
            </span>
          </div>
          <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '6px 0 10px 0' }}>
            Select the star doctors to be showcased prominently on this hospital's profile page. Click any doctor card to toggle star status.
          </p>

          <div className={styles.starDoctorsGrid} style={{ minHeight: '220px', flexShrink: 0 }}>
            {hospitalDoctors && hospitalDoctors.length > 0 ? (
              hospitalDoctors.map((doc) => {
                const docId = doc.id || doc._id || doc.email;
                const isSelected = formData.star_doctors.some(id => 
                  String(id) === String(docId) || (doc.email && String(id).toLowerCase() === doc.email.toLowerCase())
                );
                const isHospitalStaff = (doc.hospital && formData.name && doc.hospital.toLowerCase().includes(formData.name.toLowerCase())) ||
                  (formData.staff_emails && formData.staff_emails.includes(doc.email?.toLowerCase())) ||
                  (formData.staff_doctors && formData.staff_doctors.some(sd => (sd.email || sd)?.toLowerCase() === doc.email?.toLowerCase()));

                return (
                  <div
                    key={doc.id || doc._id || doc.email}
                    className={`${styles.starDocItem} ${isSelected ? styles.starDocItemActive : ''}`}
                    onClick={() => {
                      const targetId = doc.id || doc._id || doc.email;
                      const isAlreadySelected = formData.star_doctors.some(id => 
                        String(id) === String(targetId) || (doc.email && String(id).toLowerCase() === doc.email.toLowerCase())
                      );
                      const newDocs = isAlreadySelected
                        ? formData.star_doctors.filter(id => 
                            String(id) !== String(targetId) && (!doc.email || String(id).toLowerCase() !== doc.email.toLowerCase())
                          )
                        : [...formData.star_doctors, targetId];
                      setFormData({ ...formData, star_doctors: newDocs });
                    }}
                    title={isSelected ? "Click to remove Star status" : "Click to select as Star Doctor"}
                  >
                    <img
                      src={doc.image}
                      alt={doc.name}
                      className={styles.starDocThumb}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=150&q=80';
                      }}
                    />
                    <div className={styles.starDocInfo}>
                      <h5>{doc.name}</h5>
                      <p>
                        {doc.specialty || doc.specialization}
                        {isHospitalStaff && <span style={{ color: '#059669', fontWeight: 600 }}> • Hospital Staff</span>}
                      </p>
                    </div>
                    <Star
                      size={20}
                      color={isSelected ? '#f59e0b' : '#cbd5e1'}
                      fill={isSelected ? '#f59e0b' : 'none'}
                      style={{ flexShrink: 0 }}
                    />
                  </div>
                );
              })
            ) : (
              <div style={{ gridColumn: '1 / -1', padding: '28px 16px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '12px' }}>
                <p style={{ margin: 0, fontWeight: 600, color: '#334155', fontSize: '0.95rem' }}>
                  No doctors currently registered to this hospital.
                </p>
                <p style={{ margin: '6px 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                  Add doctors in the <strong>Hospital Staff</strong> section below. They will immediately appear here so you can mark them as Star Doctors!
                </p>
              </div>
            )}
          </div>

          {/* Hospital Staff Doctors (Invite by Email & Name) */}
          <div className={styles.sectionHeader} style={{ marginTop: '24px' }}>
            Hospital Staff & Affiliated Doctors
          </div>
          <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '-4px 0 12px 0' }}>
            Add doctors who work at this hospital with their Name and Email. When they log in to the Doctor Portal with their email, their name will automatically be retrieved from the database, and they can set their password.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr auto', gap: '8px', marginBottom: '12px' }}>
            <input
              type="text"
              placeholder="Doctor's Name (e.g. Dr. Rajesh Sharma)"
              value={staffDoctorNameInput}
              onChange={(e) => setStaffDoctorNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddStaffDoctor();
                }
              }}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #d9e2e6',
                fontSize: '0.88rem'
              }}
            />
            <input
              type="email"
              placeholder="Doctor Email (e.g. doctor@hospital.com)"
              value={staffEmailInput}
              onChange={(e) => setStaffEmailInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddStaffDoctor();
                }
              }}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #d9e2e6',
                fontSize: '0.88rem'
              }}
            />
            <button
              type="button"
              onClick={handleAddStaffDoctor}
              style={{
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '0 18px',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              + Add Doctor
            </button>
          </div>

          {((formData.staff_doctors && formData.staff_doctors.length > 0) || (formData.staff_emails && formData.staff_emails.length > 0)) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {(formData.staff_doctors && formData.staff_doctors.length > 0
                ? formData.staff_doctors
                : (formData.staff_emails || []).map(e => ({ email: e, name: '' }))
              ).map((doc, idx) => {
                const sEmail = (doc.email || doc || '').toLowerCase().trim();
                let displayName = doc.name;
                if (!displayName && doctors && doctors.length > 0) {
                  const match = doctors.find(d => (d.email || '').toLowerCase().trim() === sEmail);
                  if (match?.name) displayName = match.name;
                }
                if (!displayName) {
                  const namePart = sEmail.split('@')[0].replace(/[._-]/g, ' ');
                  displayName = 'Dr. ' + namePart.charAt(0).toUpperCase() + namePart.slice(1);
                }

                return (
                  <span
                    key={idx}
                    style={{
                      background: '#eff6ff',
                      color: '#1e40af',
                      border: '1px solid #bfdbfe',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '0.84rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 500
                    }}
                  >
                    <span>
                      👨‍⚕️ <strong>{displayName}</strong> <span style={{ color: '#64748b', fontWeight: 400, fontSize: '0.8rem' }}>({doc.email || doc})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveStaffDoctor(doc.email || doc)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#6b7280',
                        cursor: 'pointer',
                        padding: '0 2px',
                        fontSize: '1rem',
                        lineHeight: 1
                      }}
                      title="Remove doctor"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {/* Section: Insurance & Cashless Mediclaim Desk */}
          <div style={{ marginTop: '24px', marginBottom: '20px', background: '#f8fafc', border: '1.5px solid #d1fae5', borderRadius: '14px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color="#059669" />
                <strong style={{ fontSize: '1rem', color: '#065f46' }}>Insurance & Cashless Facility Desk</strong>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', fontWeight: 700, color: '#065f46', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.cashlessInsurance}
                  onChange={(e) => setFormData({ ...formData, cashlessInsurance: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                Accepts 100% Cashless Insurance
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
              <div className={styles.formGroup}>
                <label>TPA Desk Phone</label>
                <input
                  type="text"
                  placeholder="e.g. 080-45678900"
                  value={formData.tpaPhone}
                  onChange={(e) => setFormData({ ...formData, tpaPhone: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>TPA Desk Email</label>
                <input
                  type="email"
                  placeholder="e.g. tpa@hospital.com"
                  value={formData.tpaEmail}
                  onChange={(e) => setFormData({ ...formData, tpaEmail: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Pre-Auth Turnaround Time</label>
                <input
                  type="text"
                  placeholder="e.g. 30 Mins Cashless Pre-Approval"
                  value={formData.tpaPreAuthTime}
                  onChange={(e) => setFormData({ ...formData, tpaPreAuthTime: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                Select Accepted Insurance Companies & TPAs:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {insurancePartners.map((partner) => {
                  const isSelected = formData.acceptedInsurances.includes(partner.name);
                  return (
                    <button
                      key={partner.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setFormData({
                            ...formData,
                            acceptedInsurances: formData.acceptedInsurances.filter(n => n !== partner.name)
                          });
                        } else {
                          setFormData({
                            ...formData,
                            acceptedInsurances: [...formData.acceptedInsurances, partner.name]
                          });
                        }
                      }}
                      style={{
                        background: isSelected ? '#ecfdf5' : '#ffffff',
                        border: `1.5px solid ${isSelected ? '#059669' : '#cbd5e1'}`,
                        color: isSelected ? '#065f46' : '#475569',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.15s'
                      }}
                    >
                      {isSelected ? '✓ ' : '+ '} {partner.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={styles.submitBtn}>
            {hospitalToEdit ? 'Save Changes' : 'Add Hospital'}
          </button>
        </div>
      </form>
    </div>
  );
};

const HospitalFormModal = ({ isOpen, onClose, hospitalToEdit, onSuccess }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <HospitalFormContent
        key={hospitalToEdit ? hospitalToEdit.id : 'new'}
        hospitalToEdit={hospitalToEdit}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </div>
  );
};

export default HospitalFormModal;
