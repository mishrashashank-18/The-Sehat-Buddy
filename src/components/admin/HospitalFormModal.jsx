import React, { useState } from 'react';
import { X, Building2, Upload, AlertCircle, Plus, Check } from 'lucide-react';
import { useData } from '../../context/useData';
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
  const { addHospital, updateHospital } = useData();

  const [formData, setFormData] = useState(() => {
    if (hospitalToEdit) {
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
  const [errors, setErrors] = useState({});

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
      email: formData.email.trim(),
      establishedYear: parseInt(formData.establishedYear, 10) || 2000,
      description: formData.description.trim(),
      specialties: formData.specialties,
      image: finalImage,
    };

    if (hospitalToEdit) {
      updateHospital(hospitalToEdit.id, payload);
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
