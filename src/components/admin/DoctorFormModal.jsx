import React, { useState } from 'react';
import { X, Upload, Stethoscope, Building2, AlertCircle } from 'lucide-react';
import { useData } from '../../context/useData';
import doc1 from '../../assets/images/doctor-1.png';
import doc2 from '../../assets/images/doctor-2.png';
import doc3 from '../../assets/images/doctor-3.png';
import doc4 from '../../assets/images/doctor-4.png';
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
        rating: doctorToEdit.rating || 4.8,
        reviews: doctorToEdit.reviews || '100+',
        degree: doctorToEdit.degree || 'MBBS',
        phone: doctorToEdit.phone || '',
        email: doctorToEdit.email || '',
        availableDays: doctorToEdit.availableDays || 'Mon - Sat (9:00 AM - 1:00 PM)',
        about: doctorToEdit.about || '',
        available: doctorToEdit.available !== undefined ? doctorToEdit.available : true,
        image: doctorToEdit.image || doc1,
        instagram: doctorToEdit.instagram || '',
        facebook: doctorToEdit.facebook || '',
        reels: Array.isArray(doctorToEdit.reels) ? [...doctorToEdit.reels, '', '', '', '', ''].slice(0, 5) : ['', '', '', '', ''],
        youtube_videos: Array.isArray(doctorToEdit.youtube_videos) ? [...doctorToEdit.youtube_videos, '', ''].slice(0, 2) : ['', '']
      };
    }
    return {
      name: '',
      specialty: 'Cardiologist',
      customSpecialty: '',
      hospital: hospitals[0]?.name || '',
      experienceYears: 8,
      price: 700,
      rating: 4.8,
      reviews: '250+',
      degree: 'MBBS, MD',
      phone: '+91 ',
      email: '',
      availableDays: 'Mon - Sat (10:00 AM - 4:00 PM)',
      about: '',
      available: true,
      image: doc1,
      instagram: '',
      facebook: '',
      reels: ['', '', '', '', ''],
      youtube_videos: ['', '']
    };
  });

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

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
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
      rating: parseFloat(formData.rating) || 4.8,
      reviews: formData.reviews || '50+',
      hospital: formData.hospital || (hospitals[0]?.name || 'City General Hospital'),
      degree: formData.degree,
      phone: formData.phone,
      email: formData.email,
      availableDays: formData.availableDays,
      about: formData.about,
      image: finalImage,
      instagram: formData.instagram,
      facebook: formData.facebook,
      reels: formData.reels.filter(url => url.trim() !== ''),
      youtube_videos: formData.youtube_videos.filter(url => url.trim() !== ''),
      qualifications: formData.degree,
      contact_number: formData.phone,
      available: formData.available
    };

    if (doctorToEdit) {
      updateDoctor(doctorToEdit.id || doctorToEdit._id, payload);
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
              <div className={styles.formGroup}>
                <label>Reviews</label>
                <input
                  type="text"
                  placeholder="e.g. 500+"
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
              placeholder="Brief summary of professional experience, awards, or medical specialties..."
              value={formData.about}
              onChange={(e) => setFormData({ ...formData, about: e.target.value })}
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
          <div className={styles.sectionHeader}>Instagram Reels (Max 5)</div>
          {[0, 1, 2, 3, 4].map((index) => (
            <div className={styles.formGroup} key={`reel-${index}`}>
              <label>Reel {index + 1} URL</label>
              <input
                type="url"
                placeholder="https://www.instagram.com/reel/..."
                value={formData.reels[index] || ''}
                onChange={(e) => {
                  const newReels = [...formData.reels];
                  newReels[index] = e.target.value;
                  setFormData({ ...formData, reels: newReels });
                }}
              />
            </div>
          ))}

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
