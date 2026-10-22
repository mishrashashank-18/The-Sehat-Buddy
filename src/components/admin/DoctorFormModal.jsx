import React, { useState } from 'react';
import { X, Upload, Stethoscope, Building2, AlertCircle, HelpCircle, Plus, Trash2, Edit2, Star, Loader2 } from 'lucide-react';
import { useData } from '../../context/useData';
import doc1 from '../../assets/images/doctor-1.png';
import doc2 from '../../assets/images/doctor-2.png';
import doc3 from '../../assets/images/doctor-3.png';
import doc4 from '../../assets/images/doctor-4.png';
import { api } from '../../services/api';
import styles from './DoctorFormModal.module.css';

const PRESET_AVATARS = [
  { label: 'Male Doctor 1', src: doc1 },
  { label: 'Female Doctor 1', src: doc2 },
  { label: 'Male Doctor 2', src: doc3 },
  { label: 'Female Doctor 2', src: doc4 },
];

const SPECIALTY_OPTIONS = [
  'Cardiologist',
  'Gynecologist',
  'Orthopedic',
  'Pediatrician',
  'Neurologist',
  'Dermatologist',
  'General Physician',
  'Oncologist',
  'ENT Specialist',
  'Dentist',
  'Psychiatrist',
  'Pulmonologist'
];

const DoctorFormContent = ({ doctorToEdit, onClose, onSuccess }) => {
  const { hospitals, addDoctor, updateDoctor } = useData();

  const [formData, setFormData] = useState(() => {
    if (doctorToEdit) {
      const expNum = parseInt(doctorToEdit.experience, 10) || 5;
      return {
        name: doctorToEdit.name || '',
        specialty: SPECIALTY_OPTIONS.includes(doctorToEdit.specialty) ? doctorToEdit.specialty : 'Other',
        customSpecialty: SPECIALTY_OPTIONS.includes(doctorToEdit.specialty) ? '' : (doctorToEdit.specialty || ''),
        hospital: doctorToEdit.hospital || '',
        experienceYears: expNum,
        price: doctorToEdit.price || 500,
        rating: doctorToEdit.rating !== undefined ? doctorToEdit.rating : 0,
        reviews: doctorToEdit.reviews !== undefined ? doctorToEdit.reviews : '0',
        degree: doctorToEdit.degree || 'MBBS',
        phone: doctorToEdit.phone || '',
        email: doctorToEdit.email || '',
        availableDays: doctorToEdit.availableDays || 'Mon - Sat (9:00 AM - 1:00 PM)',
        about: doctorToEdit.about || '',
        available: doctorToEdit.available !== undefined ? doctorToEdit.available : true,
        isStarDoctor: Boolean(doctorToEdit.isStarDoctor),
        image: doctorToEdit.image || doc1,
        instagram: doctorToEdit.instagram || '',
        facebook: doctorToEdit.facebook || '',
        reels: Array.isArray(doctorToEdit.reels) ? [...doctorToEdit.reels, '', '', '', '', ''].slice(0, 5) : ['', '', '', '', ''],
        youtube_videos: Array.isArray(doctorToEdit.youtube_videos) ? [...doctorToEdit.youtube_videos, '', ''].slice(0, 2) : ['', ''],
        faqs: Array.isArray(doctorToEdit.faqs) ? doctorToEdit.faqs : []
      };
    }
    return {
      name: '',
      specialty: 'Cardiologist',
      customSpecialty: '',
      hospital: hospitals[0]?.name || '',
      experienceYears: 8,
      price: 700,
      rating: 0,
      reviews: '0',
      degree: 'MBBS, MD',
      phone: '+91 ',
      email: '',
      availableDays: 'Mon - Sat (10:00 AM - 4:00 PM)',
      about: '',
      available: true,
      isStarDoctor: false,
      image: doc1,
      instagram: '',
      facebook: '',
      reels: ['', '', '', '', ''],
      youtube_videos: ['', ''],
      faqs: []
    };
  });

  const [newFaqQ, setNewFaqQ] = useState('');
  const [newFaqA, setNewFaqA] = useState('');
  const [editingFaqIdx, setEditingFaqIdx] = useState(null);
  const [editingFaqData, setEditingFaqData] = useState({ q: '', a: '' });

  const [imageType, setImageType] = useState(() => {
    if (doctorToEdit && typeof doctorToEdit.image === 'string' && doctorToEdit.image.startsWith('http')) {
      return 'url';
    }
    return 'preset';
  });

  const [customImageUrl, setCustomImageUrl] = useState(() => {
    if (doctorToEdit && typeof doctorToEdit.image === 'string' && doctorToEdit.image.startsWith('http')) {
      return doctorToEdit.image;
    }
    return '';
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Doctor name is required';
    if (formData.specialty === 'Other' && !formData.customSpecialty.trim()) {
      newErrors.customSpecialty = 'Please specify specialty';
    }
    if (!formData.price || Number(formData.price) <= 0) {
      newErrors.price = 'Valid consultation fee is required';
    }
    if (!formData.experienceYears || Number(formData.experienceYears) < 0) {
      newErrors.experienceYears = 'Experience is required';
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
      const url = await api.uploadImage(file, 'sehatbuddy/doctors');
      setFormData(prev => ({ ...prev, image: url }));
    } catch (err) {
      console.error('Failed to upload to Cloudinary:', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const [uploadingReelIdx, setUploadingReelIdx] = useState(null);
  const [deletingCoverIdx, setDeletingCoverIdx] = useState(null);

  const handleDeleteCoverPhoto = async (index) => {
    const newReels = [...formData.reels];
    const cur = (typeof newReels[index] === 'object' && newReels[index]) ? newReels[index] : {};
    const coverUrl = cur.coverPhoto || '';
    const currentUrl = (typeof newReels[index] === 'string' ? newReels[index] : (cur.url || cur.link || '')).trim();

    if (!coverUrl) return;

    if (!window.confirm('Are you sure you want to permanently delete this cover photo? It will be removed from Cloudinary storage and doctor profile.')) {
      return;
    }

    setDeletingCoverIdx(index);
    try {
      // 1. Permanently delete from Cloudinary if it's hosted there
      if (coverUrl.includes('cloudinary.com') || coverUrl.includes('res.cloudinary.com')) {
        await api.deleteImage(coverUrl, 'image').catch((err) => {
          console.warn('Failed to delete asset from Cloudinary:', err);
        });
      }

      // 2. Clear coverPhoto from form data
      newReels[index] = { ...cur, url: currentUrl, coverPhoto: '' };
      setFormData(prev => ({ ...prev, reels: newReels }));

      // 3. If editing an existing doctor, immediately persist to MongoDB Atlas to guarantee permanent deletion
      const targetId = doctorToEdit?.id || doctorToEdit?._id;
      if (targetId) {
        await updateDoctor(targetId, { reels: newReels });
      }
    } catch (err) {
      console.error('Failed to permanently delete cover photo:', err);
    } finally {
      setDeletingCoverIdx(null);
    }
  };

  const handleReelCoverUpload = async (index, file) => {
    if (!file) return;
    setUploadingReelIdx(index);
    try {
      const url = await api.uploadImage(file, 'sehatbuddy/reels');
      const newReels = [...formData.reels];
      const cur = (typeof newReels[index] === 'object' && newReels[index]) ? newReels[index] : {};
      const currentUrl = (typeof newReels[index] === 'string' ? newReels[index] : (cur.url || cur.link || '')).trim();
      newReels[index] = { ...cur, url: currentUrl, coverPhoto: url };
      setFormData(prev => ({ ...prev, reels: newReels }));

      // Automatically persist to MongoDB Atlas & DataContext in real-time
      const targetId = doctorToEdit?.id || doctorToEdit?._id;
      if (targetId) {
        await updateDoctor(targetId, { reels: newReels });
      }
    } catch (err) {
      console.error('Failed to upload reel cover to Cloudinary:', err);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const newReels = [...formData.reels];
        const cur = (typeof newReels[index] === 'object' && newReels[index]) ? newReels[index] : {};
        const currentUrl = (typeof newReels[index] === 'string' ? newReels[index] : (cur.url || cur.link || '')).trim();
        newReels[index] = { ...cur, url: currentUrl, coverPhoto: reader.result };
        setFormData(prev => ({ ...prev, reels: newReels }));
        const targetId = doctorToEdit?.id || doctorToEdit?._id;
        if (targetId) {
          await updateDoctor(targetId, { reels: newReels });
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingReelIdx(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const finalSpecialty = formData.specialty === 'Other' ? formData.customSpecialty.trim() : formData.specialty;
    const finalImage = imageType === 'url' && customImageUrl ? customImageUrl : formData.image;

    const payload = {
      name: formData.name.trim(),
      specialty: finalSpecialty,
      specialization: finalSpecialty,
      experienceYears: parseInt(formData.experienceYears, 10) || 5,
      experience: parseInt(formData.experienceYears, 10) || 5,
      experienceText: `${parseInt(formData.experienceYears, 10) || 5}+ Years Experience`,
      price: parseInt(formData.price, 10) || 500,
      fees: parseInt(formData.price, 10) || 500,
      rating: parseFloat(formData.rating) || 0,
      reviews: formData.reviews || '0',
      hospital: formData.hospital || (hospitals[0]?.name || 'City General Hospital'),
      degree: formData.degree,
      phone: formData.phone,
      email: formData.email,
      availableDays: formData.availableDays,
      about: formData.about,
      image: finalImage,
      instagram: formData.instagram,
      facebook: formData.facebook,
      reels: formData.reels
        .map(r => {
          if (typeof r === 'string') return r.trim();
          if (r && typeof r === 'object') {
            const url = (r.url || '').trim();
            const coverPhoto = (r.coverPhoto || '').trim();
            if (!url && !coverPhoto) return null;
            if (coverPhoto) return { url, coverPhoto };
            return url;
          }
          return null;
        })
        .filter(Boolean),
      youtube_videos: formData.youtube_videos.filter(url => url.trim() !== ''),
      qualifications: formData.degree,
      contact_number: formData.phone,
      available: formData.available,
      isStarDoctor: Boolean(formData.isStarDoctor),
      faqs: (formData.faqs || []).filter(f => (f.q || f.question || '').trim() !== '')
    };

    if (doctorToEdit) {
      const docId = doctorToEdit._id || doctorToEdit.id;
      const fullPayload = {
        ...payload,
        _id: doctorToEdit._id || doctorToEdit.id,
        id: doctorToEdit.id || doctorToEdit._id,
        email: doctorToEdit.email || payload.email
      };
      updateDoctor(docId, fullPayload);
    } else {
      addDoctor(payload);
    }

    if (onSuccess) {
      onSuccess(doctorToEdit ? 'Doctor updated successfully!' : 'New doctor added successfully!');
    }
    onClose();
  };

  return (
    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <div className={styles.iconBadge}>
            <Stethoscope size={22} />
          </div>
          <div>
            <h2>{doctorToEdit ? 'Edit Doctor Profile' : 'Add New Doctor'}</h2>
            <p>{doctorToEdit ? 'Update doctor credentials and schedule' : 'Register a new verified specialist to Sehat Buddy'}</p>
          </div>
        </div>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.body}>
          {/* Basic Info */}
          <div className={styles.sectionHeader}>Doctor Details</div>
          
          <div className={styles.grid2}>
            <div className={styles.formGroup}>
              <label>Doctor Full Name <span className={styles.req}>*</span></label>
              <input
                type="text"
                placeholder="e.g. Dr. Priya Roy"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={errors.name ? styles.inputError : ''}
              />
              {errors.name && <span className={styles.errorMsg}><AlertCircle size={13} /> {errors.name}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Specialty <span className={styles.req}>*</span></label>
              <select
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
              >
                {SPECIALTY_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
                <option value="Other">Other / Custom</option>
              </select>
            </div>
          </div>

          {formData.specialty === 'Other' && (
            <div className={styles.formGroup}>
              <label>Custom Specialty <span className={styles.req}>*</span></label>
              <input
                type="text"
                placeholder="e.g. Endocrinologist"
                value={formData.customSpecialty}
                onChange={(e) => setFormData({ ...formData, customSpecialty: e.target.value })}
                className={errors.customSpecialty ? styles.inputError : ''}
              />
              {errors.customSpecialty && <span className={styles.errorMsg}><AlertCircle size={13} /> {errors.customSpecialty}</span>}
            </div>
          )}

          <div className={styles.grid3}>
            <div className={styles.formGroup}>
              <label>Experience (Years) <span className={styles.req}>*</span></label>
              <input
                type="number"
                min="0"
                max="60"
                value={formData.experienceYears}
                onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                className={errors.experienceYears ? styles.inputError : ''}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Consultation Fee (₹) <span className={styles.req}>*</span></label>
              <input
                type="number"
                min="50"
                step="50"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className={errors.price ? styles.inputError : ''}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Degrees / Qualification</label>
              <input
                type="text"
                placeholder="e.g. MBBS, MD (AIIMS)"
                value={formData.degree}
                onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
              />
            </div>
          </div>

          {/* Hospital Affiliation */}
          <div className={styles.formGroup}>
            <label>Affiliated Hospital</label>
            <div className={styles.selectWithIcon}>
              <Building2 size={16} className={styles.fieldIcon} />
              <select
                value={formData.hospital}
                onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
              >
                <option value="">Select an affiliated hospital</option>
                {hospitals.map(hosp => (
                  <option key={hosp.id} value={hosp.name}>{hosp.name} ({hosp.city})</option>
                ))}
                <option value="Independent Private Clinic">Independent Private Clinic</option>
              </select>
            </div>
          </div>

          {/* Contact & Availability */}
          <div className={styles.grid2}>
            <div className={styles.formGroup}>
              <label>Contact Phone</label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Email Address</label>
              <input
                type="email"
                placeholder="doctor@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.grid2}>
            <div className={styles.formGroup}>
              <label>Available Hours / Days</label>
              <input
                type="text"
                placeholder="e.g. Mon - Sat (10:00 AM - 2:00 PM)"
                value={formData.availableDays}
                onChange={(e) => setFormData({ ...formData, availableDays: e.target.value })}
              />
            </div>

            <div className={styles.grid2}>
              <div className={styles.formGroup}>
                <label>Rating (0 for new)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  placeholder="0"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Reviews Count (0 for new)</label>
                <input
                  type="text"
                  placeholder="0"
                  value={formData.reviews}
                  onChange={(e) => setFormData({ ...formData, reviews: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Profile Avatar / Photo */}
          <div className={styles.sectionHeader}>Doctor Photo / Avatar</div>
          
          <div className={styles.avatarSelectionTabs}>
            <button
              type="button"
              className={`${styles.tabBtn} ${imageType === 'preset' ? styles.tabActive : ''}`}
              onClick={() => setImageType('preset')}
            >
              Choose Preset
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
              {PRESET_AVATARS.map((preset, idx) => (
                <div
                  key={idx}
                  className={`${styles.presetItem} ${formData.image === preset.src ? styles.presetSelected : ''}`}
                  onClick={() => setFormData({ ...formData, image: preset.src })}
                >
                  <img src={preset.src} alt={preset.label} />
                  <span>{preset.label}</span>
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
                <span>Click to select an image from your device</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className={styles.fileInput} />
              </label>
              {formData.image && typeof formData.image === 'string' && formData.image.startsWith('data:') && (
                <div className={styles.previewBox}>
                  <img src={formData.image} alt="Uploaded preview" />
                </div>
              )}
            </div>
          )}

          {/* About / Bio */}
          <div className={styles.formGroup} style={{ marginTop: '14px' }}>
            <label>Doctor Bio / Short Description</label>
            <textarea
              rows={3}
              placeholder="Brief summary of professional experience, awards, or medical specialties... (Press Ctrl+Enter to save)"
              value={formData.about}
              onChange={(e) => setFormData({ ...formData, about: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
          </div>

          <div className={styles.formGroup} style={{ marginTop: '14px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.available}
                onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                style={{ width: 'auto' }}
              />
              Active / Listed on Find Doctors page
            </label>
          </div>

          <div className={styles.formGroup} style={{ marginTop: '10px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              background: formData.isStarDoctor ? '#fef3c7' : '#f8fafc',
              border: formData.isStarDoctor ? '1.5px solid #f59e0b' : '1px solid #e2e8f0',
              padding: '12px 14px',
              borderRadius: '10px',
              transition: 'all 0.2s'
            }}>
              <input
                type="checkbox"
                checked={formData.isStarDoctor}
                onChange={(e) => setFormData({ ...formData, isStarDoctor: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: '#f59e0b', cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontWeight: 700, color: formData.isStarDoctor ? '#92400e' : '#1e293b', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Star size={16} fill={formData.isStarDoctor ? '#f59e0b' : 'none'} color={formData.isStarDoctor ? '#f59e0b' : '#64748b'} />
                  Feature as Star Doctor (Featured on Homepage Popular Doctors)
                </div>
                <div style={{ fontSize: '0.78rem', color: formData.isStarDoctor ? '#b45309' : '#64748b', marginTop: '2px' }}>
                  Doctors marked as Star will appear prominently in the "Popular Doctors" section on the front page.
                </div>
              </div>
            </label>
          </div>

          {/* Social Links */}
          <div className={styles.sectionHeader}>Social Profiles</div>
          <div className={styles.grid2}>
            <div className={styles.formGroup}>
              <label>Instagram URL</label>
              <input
                type="url"
                placeholder="https://instagram.com/..."
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Facebook URL</label>
              <input
                type="url"
                placeholder="https://facebook.com/..."
                value={formData.facebook}
                onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
              />
            </div>
          </div>

          {/* Instagram Reels */}
          <div className={styles.sectionHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Instagram Reels & Cover Photos (Max 5)</span>
            <span style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 600 }}>Auto Cover Extraction</span>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '-4px 0 12px 0' }}>
            Enter any Instagram Reel URL. The native high-resolution cover photo will be extracted and displayed on the public doctor profile. You can also specify an optional custom cover photo.
          </p>
          {[0, 1, 2, 3, 4].map((index) => {
            const reelVal = formData.reels[index];
            const reelUrl = typeof reelVal === 'string' ? reelVal : (reelVal?.url || '');
            const customCover = typeof reelVal === 'object' ? (reelVal?.coverPhoto || '') : '';

            // Extract shortcode for live preview
            const match = reelUrl.match(/instagram\.com\/(?:reel|reels|p|tv|share\/reel)\/([^/?#&]+)/i);
            const shortcode = match ? match[1] : '';
            const previewCover = customCover || (shortcode ? `https://www.instagram.com/p/${shortcode}/media/?size=l` : '');

            return (
              <div 
                className={styles.formGroup} 
                key={`reel-${index}`}
                style={{ 
                  background: '#f8fafc', 
                  padding: '12px 14px', 
                  borderRadius: '10px', 
                  border: '1px solid #e2e8f0', 
                  marginBottom: '12px' 
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ margin: 0, fontWeight: 700, fontSize: '0.86rem', color: '#0f172a' }}>
                    Reel {index + 1} URL
                  </label>
                  {shortcode && (
                    <span style={{ fontSize: '0.72rem', color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: '100px', fontWeight: 700 }}>
                      ✓ Cover Photo Linked
                    </span>
                  )}
                </div>
                <input
                  type="url"
                  placeholder="https://www.instagram.com/reel/..."
                  value={reelUrl}
                  onChange={(e) => {
                    const newReels = [...formData.reels];
                    const cur = (typeof newReels[index] === 'object' && newReels[index]) ? newReels[index] : {};
                    newReels[index] = { ...cur, url: e.target.value };
                    setFormData({ ...formData, reels: newReels });
                  }}
                  style={{ marginBottom: '8px' }}
                />

                {(reelUrl || customCover) && (
                  <div style={{ marginTop: '8px', padding: '10px 12px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>Reel Cover Photo</span>
                        {customCover && customCover.includes('cloudinary.com') && (
                          <span style={{ fontSize: '0.68rem', color: '#0284c7', background: '#e0f2fe', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, border: '1px solid #bae6fd' }}>
                            Cloudinary
                          </span>
                        )}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Delete Cover Photo Button (Permanent Delete from Cloudinary & DB) */}
                        {customCover && (
                          <button
                            type="button"
                            disabled={deletingCoverIdx === index}
                            onClick={() => handleDeleteCoverPhoto(index)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              color: '#dc2626',
                              background: '#fee2e2',
                              border: '1px solid #fecaca',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              cursor: deletingCoverIdx === index ? 'not-allowed' : 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            title="Permanently delete this cover photo from Cloudinary"
                          >
                            {deletingCoverIdx === index ? (
                              <>
                                <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                                <span>Deleting...</span>
                              </>
                            ) : (
                              <>
                                <Trash2 size={13} />
                                <span>Delete Cover</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* Upload Button: Local Storage -> Cloudinary */}
                        <label 
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            color: '#ffffff',
                            background: uploadingReelIdx === index ? '#94a3b8' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                            padding: '5px 12px',
                            borderRadius: '6px',
                            cursor: uploadingReelIdx === index ? 'not-allowed' : 'pointer',
                            boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)',
                            transition: 'all 0.2s'
                          }}
                          title="Upload cover photo from local storage directly to Cloudinary"
                        >
                          {uploadingReelIdx === index ? (
                            <>
                              <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                              <span>Uploading to Cloudinary...</span>
                            </>
                          ) : (
                            <>
                              <Upload size={13} />
                              <span>Upload Cover Photo</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingReelIdx === index}
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleReelCoverUpload(index, file);
                                e.target.value = '';
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <input
                          type="url"
                          placeholder="Cloudinary URL or image link (Auto-filled on upload, or paste link)"
                          value={customCover}
                          onChange={(e) => {
                            const newReels = [...formData.reels];
                            const cur = (typeof newReels[index] === 'object' && newReels[index]) ? newReels[index] : { url: reelUrl };
                            newReels[index] = { ...cur, url: reelUrl, coverPhoto: e.target.value };
                            setFormData({ ...formData, reels: newReels });
                          }}
                          style={{ fontSize: '0.8rem', padding: '7px 10px', width: '100%', boxSizing: 'border-box' }}
                        />
                      </div>
                      {previewCover && (
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <div 
                            style={{ 
                              width: '42px', 
                              height: '56px', 
                              borderRadius: '6px', 
                              overflow: 'hidden', 
                              border: '1px solid #cbd5e1', 
                              flexShrink: 0, 
                              background: '#000000',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                            }} 
                            title="Reel Cover Photo Preview"
                          >
                            <img 
                              src={previewCover} 
                              alt="Cover" 
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
                              onError={(e) => { e.target.style.display = 'none'; }} 
                            />
                          </div>
                          {customCover && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCoverPhoto(index)}
                              title="Delete cover photo"
                              style={{
                                position: 'absolute',
                                top: '-6px',
                                right: '-6px',
                                background: '#dc2626',
                                color: '#ffffff',
                                border: '2px solid #ffffff',
                                borderRadius: '50%',
                                width: '18px',
                                height: '18px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                padding: 0,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                              }}
                            >
                              <X size={10} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* YouTube Videos */}
          <div className={styles.sectionHeader}>YouTube Educational Videos (Max 2)</div>
          {[0, 1].map((index) => (
            <div className={styles.formGroup} key={`yt-${index}`}>
              <label>Video {index + 1} URL</label>
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={formData.youtube_videos[index] || ''}
                onChange={(e) => {
                  const newYt = [...formData.youtube_videos];
                  newYt[index] = e.target.value;
                  setFormData({ ...formData, youtube_videos: newYt });
                }}
              />
            </div>
          ))}

          {/* Doctor Profile FAQs (Managed by Admin or Hospital) */}
          <div className={styles.sectionHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle size={16} />
              Public Doctor Page FAQs
            </span>
            <button
              type="button"
              onClick={() => {
                const defaults = [
                  { q: `How can I book an appointment with ${formData.name || 'the doctor'}?`, a: 'You can book an in-clinic or video consultation directly on The Sehat Buddy platform with instant confirmation.' },
                  { q: 'What do I need to bring at the clinic?', a: 'Carry a valid government ID, insurance policy e-card (for cashless claim), and previous medical reports.' },
                  { q: 'Is my consultation confidential?', a: 'Yes, 100% private and protected under standard medical privacy regulations.' },
                  { q: 'Can I reschedule my appointment?', a: 'Yes, appointments can be easily rescheduled prior to your booked slot.' },
                  { q: 'Does the doctor accept cashless health insurance?', a: 'Yes, consultations and hospital procedures qualify for cashless mediclaim pre-authorization.' }
                ];
                setFormData(prev => ({ ...prev, faqs: defaults }));
              }}
              style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
            >
              Load Defaults
            </button>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '-4px 0 12px 0' }}>
            Frequently Asked Questions shown on this doctor's public profile page. (Only Admin or their registered Hospital can modify these).
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
            {(formData.faqs && formData.faqs.length > 0) ? (
              formData.faqs.map((faq, fIdx) => (
                <div
                  key={fIdx}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '10px 12px'
                  }}
                >
                  {editingFaqIdx === fIdx ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        type="text"
                        value={editingFaqData.q}
                        onChange={(e) => setEditingFaqData({ ...editingFaqData, q: e.target.value })}
                        placeholder="Question..."
                        style={{ width: '100%', padding: '6px 8px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                      <textarea
                        rows={2}
                        value={editingFaqData.a}
                        onChange={(e) => setEditingFaqData({ ...editingFaqData, a: e.target.value })}
                        placeholder="Answer..."
                        style={{ width: '100%', padding: '6px 8px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (!editingFaqData.q.trim()) return;
                            const updated = [...formData.faqs];
                            updated[fIdx] = { ...editingFaqData };
                            setFormData({ ...formData, faqs: updated });
                            setEditingFaqIdx(null);
                          }}
                          style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingFaqIdx(null)}
                          style={{ background: '#cbd5e1', color: '#334155', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '0.78rem', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1e293b', marginBottom: '2px' }}>
                          Q{fIdx + 1}: {faq.q || faq.question}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                          {faq.a || faq.answer}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFaqIdx(fIdx);
                            setEditingFaqData({ q: faq.q || faq.question || '', a: faq.a || faq.answer || '' });
                          }}
                          style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: '4px' }}
                          title="Edit FAQ"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = formData.faqs.filter((_, i) => i !== fIdx);
                            setFormData({ ...formData, faqs: updated });
                          }}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                          title="Delete FAQ"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic' }}>
                No custom FAQs yet. Default platform FAQs will be displayed.
              </span>
            )}
          </div>

          {/* Add New FAQ Form */}
          <div style={{ background: '#f1f5f9', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '8px' }}>
              + Add Custom FAQ for this Doctor
            </span>
            <input
              type="text"
              placeholder="Question (e.g. Does Dr. Roy perform laparoscopic surgeries?)"
              value={newFaqQ}
              onChange={(e) => setNewFaqQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (!newFaqQ.trim()) return;
                  const updated = [...(formData.faqs || []), { q: newFaqQ.trim(), a: newFaqA.trim() }];
                  setFormData({ ...formData, faqs: updated });
                  setNewFaqQ('');
                  setNewFaqA('');
                }
              }}
              style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '6px', boxSizing: 'border-box' }}
            />
            <textarea
              rows={2}
              placeholder="Answer... (Press Ctrl+Enter to add)"
              value={newFaqA}
              onChange={(e) => setNewFaqA(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  if (!newFaqQ.trim()) return;
                  const updated = [...(formData.faqs || []), { q: newFaqQ.trim(), a: newFaqA.trim() }];
                  setFormData({ ...formData, faqs: updated });
                  setNewFaqQ('');
                  setNewFaqA('');
                }
              }}
              style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '8px', boxSizing: 'border-box' }}
            />
            <button
              type="button"
              onClick={() => {
                if (!newFaqQ.trim()) return;
                const updated = [...(formData.faqs || []), { q: newFaqQ.trim(), a: newFaqA.trim() }];
                setFormData({ ...formData, faqs: updated });
                setNewFaqQ('');
                setNewFaqA('');
              }}
              style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Plus size={14} /> Add FAQ
            </button>
          </div>
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={styles.submitBtn}>
            {doctorToEdit ? 'Save Changes' : 'Add Doctor'}
          </button>
        </div>
      </form>
    </div>
  );
};

const DoctorFormModal = ({ isOpen, onClose, doctorToEdit, onSuccess }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <DoctorFormContent
        key={doctorToEdit ? doctorToEdit.id : 'new'}
        doctorToEdit={doctorToEdit}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </div>
  );
};

export default DoctorFormModal;
