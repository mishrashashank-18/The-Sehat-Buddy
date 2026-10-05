import React, { useState } from 'react';
import { X, Building2, Upload, AlertCircle, Plus, Check, Video, Sparkles, Star, Loader2 } from 'lucide-react';
import { useData } from '../../context/useData';
import { api } from '../../services/api';
import styles from './HospitalFormModal.module.css';

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
      const initReels = Array.isArray(hospitalToEdit.reels) ? [...hospitalToEdit.reels] : [];
      while (initReels.length < 5) initReels.push('');

      const initVideos = Array.isArray(hospitalToEdit.youtube_videos) ? [...hospitalToEdit.youtube_videos] : [];
      while (initVideos.length < 5) initVideos.push('');

      const initStarDocs = Array.isArray(hospitalToEdit.star_doctors)
        ? hospitalToEdit.star_doctors.map(d => typeof d === 'object' ? (d._id || d.id) : d).filter(Boolean)
        : [];

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
        staff_emails: Array.isArray(hospitalToEdit.staff_emails) ? [...hospitalToEdit.staff_emails] : []
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
      reels: ['', '', '', '', ''],
      youtube_videos: ['', '', '', '', ''],
      star_doctors: [],
      latitude: '',
      longitude: '',
      staff_emails: []
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
  const [errors, setErrors] = useState({});

  const handleAddStaffEmail = () => {
    if (!staffEmailInput.trim()) return;
    const cleanEmail = staffEmailInput.trim().toLowerCase();
    if (!formData.staff_emails.includes(cleanEmail)) {
      setFormData({
        ...formData,
        staff_emails: [...formData.staff_emails, cleanEmail]
      });
    }
    setStaffEmailInput('');
  };

  const handleRemoveStaffEmail = (emailToRemove) => {
    setFormData({
      ...formData,
      staff_emails: formData.staff_emails.filter(e => e !== emailToRemove)
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Hospital name is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.address.trim()) newErrors.address = 'Full address is required';
    if (!formData.totalBeds || Number(formData.totalBeds) <= 0) {
      newErrors.totalBeds = 'Valid bed capacity is required';
    }
    if (formData.specialties.length === 0) {
      newErrors.specialties = 'Select at least one department';
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
      city: formData.city.trim(),
      address: formData.address.trim(),
      rating: parseFloat(formData.rating) || 4.7,
      reviews: formData.reviews || '100+',
      totalBeds: parseInt(formData.totalBeds, 10) || 100,
      emergency24x7: Boolean(formData.emergency24x7),
      phone: formData.phone.trim(),
      email: formData.email.trim() || `${formData.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}@sehatbuddy.com`,
      password: 'password123', // Default required password for DB
      establishedYear: parseInt(formData.establishedYear, 10) || 2000,
      description: formData.description.trim(),
      specialties: formData.specialties,
      specialities: formData.specialties, // DB mapping
      image: finalImage,
      reels: formData.reels.map(r => r.trim()).filter(Boolean),
      youtube_videos: formData.youtube_videos.map(v => v.trim()).filter(Boolean),
      star_doctors: formData.star_doctors,
      staff_emails: formData.staff_emails,
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
          <div className={styles.sectionHeader}>Hospital Overview</div>

          <div className={styles.grid2}>
            <div className={styles.formGroup}>
              <label>Hospital Name <span className={styles.req}>*</span></label>
              <input
                type="text"
                placeholder="e.g. Fortis Memorial Hospital"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={errors.name ? styles.inputError : ''}
              />
              {errors.name && <span className={styles.errorMsg}><AlertCircle size={13} /> {errors.name}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>City / Location <span className={styles.req}>*</span></label>
              <input
                type="text"
                placeholder="e.g. Delhi, Gurgaon, Mumbai..."
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className={errors.city ? styles.inputError : ''}
              />
              {errors.city && <span className={styles.errorMsg}><AlertCircle size={13} /> {errors.city}</span>}
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

          <div className={styles.grid2}>
            <div className={styles.formGroup}>
              <label>Helpline / Emergency Phone</label>
              <input
                type="text"
                placeholder="+91 11 2000 3000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Official Email</label>
              <input
                type="email"
                placeholder="contact@hospital.org"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
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
              placeholder="Overview of specialties, advanced technology, patient facilities..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Instagram Reels */}
          <div className={styles.sectionHeader} style={{ marginTop: '20px' }}>
            Instagram Reels (Max 5 - Public Page)
          </div>
          <div className={styles.mediaInputList}>
            {formData.reels.map((reel, index) => (
              <div key={index} className={styles.mediaRow}>
                <span className={styles.mediaIndex}>#{index + 1}</span>
                <input
                  type="url"
                  placeholder={`https://www.instagram.com/reel/... (Reel ${index + 1})`}
                  value={reel}
                  onChange={(e) => {
                    const newReels = [...formData.reels];
                    newReels[index] = e.target.value;
                    setFormData({ ...formData, reels: newReels });
                  }}
                />
              </div>
            ))}
          </div>

          {/* YouTube Videos */}
          <div className={styles.sectionHeader} style={{ marginTop: '20px' }}>
            YouTube Videos (Max 5 - Walkthroughs & Sessions)
          </div>
          <div className={styles.mediaInputList}>
            {formData.youtube_videos.map((video, index) => (
              <div key={index} className={styles.mediaRow}>
                <span className={styles.mediaIndex} style={{ background: '#fef2f2', color: '#ef4444' }}>
                  #{index + 1}
                </span>
                <input
                  type="url"
                  placeholder={`https://www.youtube.com/watch?v=... (Video ${index + 1})`}
                  value={video}
                  onChange={(e) => {
                    const newVideos = [...formData.youtube_videos];
                    newVideos[index] = e.target.value;
                    setFormData({ ...formData, youtube_videos: newVideos });
                  }}
                />
              </div>
            ))}
          </div>

          {/* Star Doctors Selection */}
          <div className={styles.sectionHeader} style={{ marginTop: '20px' }}>
            ⭐ Star Doctors of this Hospital
          </div>
          <div className={styles.starDoctorsGrid}>
            {doctors.map((doc) => {
              const isSelected = formData.star_doctors.some(id => String(id) === String(doc.id || doc._id));
              return (
                <div
                  key={doc.id || doc._id}
                  className={`${styles.starDocItem} ${isSelected ? styles.starDocItemActive : ''}`}
                  onClick={() => {
                    const docId = doc.id || doc._id;
                    const exists = formData.star_doctors.some(id => String(id) === String(docId));
                    const newDocs = exists
                      ? formData.star_doctors.filter(id => String(id) !== String(docId))
                      : [...formData.star_doctors, docId];
                    setFormData({ ...formData, star_doctors: newDocs });
                  }}
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
                    <p>{doc.specialty || doc.specialization}</p>
                  </div>
                  <Star
                    size={16}
                    color={isSelected ? '#f59e0b' : '#cbd5e1'}
                    fill={isSelected ? '#f59e0b' : 'none'}
                  />
                </div>
              );
            })}
          </div>

          {/* Hospital Staff Doctors (Invite by Email) */}
          <div className={styles.sectionHeader} style={{ marginTop: '24px' }}>
            Hospital Staff & Affiliated Doctors (Invite by Email)
          </div>
          <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '-4px 0 12px 0' }}>
            Add emails of doctors who work at this hospital. When they log in to the Doctor Portal for the first time, they will be prompted to set their password.
          </p>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              type="email"
              placeholder="e.g. doctor@hospital.com"
              value={staffEmailInput}
              onChange={(e) => setStaffEmailInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddStaffEmail();
                }
              }}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #d9e2e6',
                fontSize: '0.88rem'
              }}
            />
            <button
              type="button"
              onClick={handleAddStaffEmail}
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
              + Add Doctor Email
            </button>
          </div>

          {formData.staff_emails && formData.staff_emails.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {formData.staff_emails.map((email, idx) => (
                <span
                  key={idx}
                  style={{
                    background: '#eff6ff',
                    color: '#1e40af',
                    border: '1px solid #bfdbfe',
                    padding: '5px 12px',
                    borderRadius: '20px',
                    fontSize: '0.82rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>👨‍⚕️ {email}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveStaffEmail(email)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#6b7280',
                      cursor: 'pointer',
                      padding: '0 2px',
                      fontSize: '1rem',
                      lineHeight: 1
                    }}
                    title="Remove email"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
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
