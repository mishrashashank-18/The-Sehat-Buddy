import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Star,
  Bed,
  Clock,
  ShieldCheck,
  Upload,
  Plus,
  Trash2,
  Check,
  Loader2,
  Image as ImageIcon,
  ExternalLink,
  Activity,
  FileText
} from 'lucide-react';
import { useData } from '../../context/useData';
import { api } from '../../services/api';
import styles from './HospitalProfileEditModal.module.css';

const PRESET_SPECIALTIES = [
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'Nephrology',
  'General Surgery',
  'Pediatrics',
  'Gynecology',
  'Oncology',
  'Dermatology',
  'Gastroenterology',
  'Urology',
  'ENT',
  'Pulmonology',
  'Emergency & Trauma'
];

const HospitalProfileEditModal = ({ isOpen, onClose, hospital, initialTab = 'general', onSuccess }) => {
  const { updateHospital, refreshHospitals } = useData();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [customSpecInput, setCustomSpecInput] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    city: '',
    address: '',
    phone: '',
    email: '',
    establishedYear: 2000,
    rating: 4.8,
    reviews: '50+',
    isVerified: true,
    totalBeds: 100,
    emergency24x7: true,
    image: '',
    instagram: '',
    facebook: '',
    youtube: '',
    website: '',
    specialties: [],
    description: ''
  });

  useEffect(() => {
    if (hospital) {
      const specs = Array.isArray(hospital.specialties) && hospital.specialties.length > 0
        ? hospital.specialties
        : (Array.isArray(hospital.specialities) && hospital.specialities.length > 0
            ? hospital.specialities
            : ['Cardiology', 'Neurology', 'Orthopedics', 'Nephrology', 'General Surgery']);

      setFormData({
        name: hospital.name || '',
        city: hospital.city || 'Bengaluru, Karnataka',
        address: hospital.address || '',
        phone: hospital.phone || '+91 1800 102 3222',
        email: hospital.email || 'info@manipalhd.com',
        establishedYear: hospital.establishedYear || 2000,
        rating: hospital.rating !== undefined && hospital.rating !== null ? hospital.rating : 0,
        reviews: hospital.reviews || '0 Reviews',
        isVerified: hospital.isVerified !== undefined ? hospital.isVerified : true,
        totalBeds: hospital.totalBeds || 120,
        emergency24x7: hospital.emergency24x7 !== undefined ? hospital.emergency24x7 : true,
        image: hospital.image || 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80',
        instagram: hospital.instagram || '',
        facebook: hospital.facebook || '',
        youtube: hospital.youtube || '',
        website: hospital.website || '',
        specialties: [...specs],
        description: hospital.description || ''
      });
      if (initialTab) {
        setActiveTab(initialTab);
      }
    }
  }, [hospital, initialTab, isOpen]);

  if (!isOpen || !hospital) return null;

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await api.uploadImage(file, 'sehatbuddy/hospitals');
      setFormData(prev => ({ ...prev, image: url }));
    } catch (err) {
      console.error('Failed to upload image to Cloudinary:', err);
      // Fallback to data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddSpecialty = (spec) => {
    const trimmed = (spec || '').trim();
    if (!trimmed) return;
    if (!formData.specialties.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, trimmed]
      }));
    }
    setCustomSpecInput('');
  };

  const handleRemoveSpecialty = (specToRemove) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s.toLowerCase() !== specToRemove.toLowerCase())
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Hospital Name is required.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        city: formData.city.trim(),
        address: formData.address.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim().toLowerCase(),
        establishedYear: parseInt(formData.establishedYear, 10) || 2000,
        rating: parseFloat(formData.rating) || 4.8,
        reviews: String(formData.reviews || '50+').trim(),
        isVerified: Boolean(formData.isVerified),
        totalBeds: parseInt(formData.totalBeds, 10) || 100,
        emergency24x7: Boolean(formData.emergency24x7),
        image: formData.image.trim(),
        instagram: formData.instagram.trim(),
        facebook: formData.facebook.trim(),
        youtube: formData.youtube.trim(),
        website: formData.website.trim(),
        specialties: formData.specialties,
        specialities: formData.specialties,
        description: formData.description.trim()
      };

      const targetId = hospital.id || hospital._id;
      await updateHospital(targetId, payload);
      if (refreshHospitals) {
        await refreshHospitals();
      }

      if (onSuccess) {
        onSuccess('Hospital details modified and saved to database successfully!');
      }
      onClose();
    } catch (err) {
      console.error('Failed to update hospital:', err);
      alert('Failed to save changes to database. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIconWrap}>
              <Building2 size={24} />
            </div>
            <div>
              <h2>Modify Hospital Profile</h2>
              <p>Updates persist directly to MongoDB database and live public view</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className={styles.tabsBar}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'general' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <Building2 size={15} /> General & Location
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'contact' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('contact')}
          >
            <Phone size={15} /> Contact & Capacity
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'media' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('media')}
          >
            <ImageIcon size={15} /> Image & Social Accounts
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'departments' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('departments')}
          >
            <Activity size={15} /> Departments ({formData.specialties.length})
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'about' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('about')}
          >
            <FileText size={15} /> About Facility
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className={styles.modalBody}>
            {/* TAB: GENERAL & LOCATION */}
            {activeTab === 'general' && (
              <>
                <div className={styles.formGroup}>
                  <label><Building2 size={15} /> Hospital Official Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Manipal Hospital, Old Airport Road"
                  />
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label><MapPin size={15} /> City / Region Location Tag</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. Bengaluru, Karnataka"
                    />
                    <span className={styles.hint}>Displayed in the blue location badge on the hospital image</span>
                  </div>

                  <div className={styles.formGroup}>
                    <label><ShieldCheck size={15} /> Verified Partner Status</label>
                    <div
                      className={`${styles.toggleCard} ${formData.isVerified ? styles.toggleCardActive : ''}`}
                      onClick={() => setFormData({ ...formData, isVerified: !formData.isVerified })}
                    >
                      <span className={styles.toggleLabel}>
                        <ShieldCheck size={18} color={formData.isVerified ? '#16a34a' : '#64748b'} />
                        {formData.isVerified ? 'Verified Healthcare Partner' : 'Standard Healthcare Listing'}
                      </span>
                      <input
                        type="checkbox"
                        checked={formData.isVerified}
                        onChange={(e) => setFormData({ ...formData, isVerified: e.target.checked })}
                        style={{ width: 'auto', cursor: 'pointer' }}
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label><MapPin size={15} /> Full Physical Address</label>
                  <textarea
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. 98, HAL Old Airport Road, Kodihalli, Bengaluru, Karnataka 560017"
                  />
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label><Star size={15} /> Rating Score (out of 5)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                      placeholder="4.8"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Reviews Count Label</label>
                    <input
                      type="text"
                      value={formData.reviews}
                      onChange={(e) => setFormData({ ...formData, reviews: e.target.value })}
                      placeholder="e.g. 50+ or 1,200+"
                    />
                  </div>
                </div>
              </>
            )}

            {/* TAB: CONTACT & CAPACITY */}
            {activeTab === 'contact' && (
              <>
                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label><Phone size={15} /> Contact Telephone Number</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. +91 1800 102 3222"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label><Mail size={15} /> Official Hospital Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. info@manipalhd.com"
                    />
                  </div>
                </div>

                <div className={styles.formGrid3}>
                  <div className={styles.formGroup}>
                    <label><Calendar size={15} /> Established Year</label>
                    <input
                      type="number"
                      min="1850"
                      max="2099"
                      value={formData.establishedYear}
                      onChange={(e) => setFormData({ ...formData, establishedYear: e.target.value })}
                      placeholder="e.g. 2000"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label><Bed size={15} /> Total Inpatient Beds</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.totalBeds}
                      onChange={(e) => setFormData({ ...formData, totalBeds: e.target.value })}
                      placeholder="e.g. 120"
                    />
                    <span className={styles.hint}>Shown on the "120 Inpatient Beds" badge</span>
                  </div>

                  <div className={styles.formGroup}>
                    <label><Clock size={15} /> 24x7 ER Ready</label>
                    <div
                      className={`${styles.toggleCard} ${formData.emergency24x7 ? styles.toggleCardActive : ''}`}
                      onClick={() => setFormData({ ...formData, emergency24x7: !formData.emergency24x7 })}
                      style={{ height: '42px', boxSizing: 'border-box' }}
                    >
                      <span className={styles.toggleLabel} style={{ fontSize: '0.8rem' }}>
                        {formData.emergency24x7 ? '24x7 ER Active' : 'ER Restricted'}
                      </span>
                      <input
                        type="checkbox"
                        checked={formData.emergency24x7}
                        onChange={(e) => setFormData({ ...formData, emergency24x7: e.target.checked })}
                        style={{ width: 'auto', cursor: 'pointer' }}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* TAB: IMAGE & SOCIAL ACCOUNTS */}
            {activeTab === 'media' && (
              <>
                <div className={styles.formGroup}>
                  <label><ImageIcon size={15} /> Hospital Main Image</label>
                  <div className={styles.imageUploadSection}>
                    <img
                      src={formData.image || 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80'}
                      alt="Hospital Preview"
                      className={styles.imagePreview}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    <div className={styles.imageControls}>
                      <input
                        type="url"
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        placeholder="Image URL or upload a file below..."
                      />
                      <label className={styles.uploadBtnLabel}>
                        {isUploading ? (
                          <>
                            <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                            Uploading to Cloudinary...
                          </>
                        ) : (
                          <>
                            <Upload size={15} />
                            Upload Photo from Device
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                          style={{ display: 'none' }}
                        />
                      </label>
                      <span className={styles.hint}>Supported formats: JPG, PNG, WebP (Uploaded directly to Cloudinary)</span>
                    </div>
                  </div>
                </div>

                <div className={styles.formGrid2}>
                  <div className={styles.formGroup}>
                    <label>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e1306c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                      </svg>
                      Instagram Profile / Account URL
                    </label>
                    <input
                      type="text"
                      value={formData.instagram}
                      onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                      placeholder="e.g. https://instagram.com/manipalhospitals or @manipal"
                    />
                    <span className={styles.hint}>Clickable Instagram icon displays directly below hospital image</span>
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1877f2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                      </svg>
                      Facebook Page / URL
                    </label>
                    <input
                      type="text"
                      value={formData.facebook}
                      onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                      placeholder="e.g. https://facebook.com/manipalhospitals"
                    />
                    <span className={styles.hint}>Clickable Facebook icon displays directly below hospital image</span>
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="#ef4444"></polygon>
                      </svg>
                      YouTube Channel / URL
                    </label>
                    <input
                      type="text"
                      value={formData.youtube}
                      onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                      placeholder="e.g. https://youtube.com/@manipalhospitals"
                    />
                    <span className={styles.hint}>Clickable YouTube icon displays directly below hospital image</span>
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                      </svg>
                      Official Website URL
                    </label>
                    <input
                      type="text"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="e.g. https://www.manipalhospitals.com"
                    />
                    <span className={styles.hint}>Clickable Website globe icon displays directly below hospital image</span>
                  </div>
                </div>
              </>
            )}

            {/* TAB: DEPARTMENTS & SPECIALTIES */}
            {activeTab === 'departments' && (
              <>
                <div className={styles.formGroup}>
                  <label><Activity size={15} /> Active Clinical Departments ({formData.specialties.length})</label>
                  <div className={styles.tagsContainer}>
                    {formData.specialties.length === 0 ? (
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No departments added yet. Choose from presets below.</span>
                    ) : (
                      formData.specialties.map((spec, idx) => (
                        <span key={idx} className={styles.tagBadge}>
                          {spec}
                          <button
                            type="button"
                            className={styles.tagRemoveBtn}
                            onClick={() => handleRemoveSpecialty(spec)}
                            title={`Remove ${spec}`}
                          >
                            <X size={13} />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label style={{ fontSize: '0.8rem', color: '#64748b' }}>Quick Add Common Specialties:</label>
                  <div className={styles.presetContainer}>
                    {PRESET_SPECIALTIES.map((spec) => {
                      const isAdded = formData.specialties.some(s => s.toLowerCase() === spec.toLowerCase());
                      return (
                        <button
                          key={spec}
                          type="button"
                          className={styles.presetPill}
                          onClick={() => isAdded ? handleRemoveSpecialty(spec) : handleAddSpecialty(spec)}
                          style={isAdded ? { background: '#e0f2fe', color: '#0369a1', borderColor: '#7dd3fc', borderStyle: 'solid' } : {}}
                        >
                          {isAdded ? <Check size={12} /> : <Plus size={12} />}
                          {spec}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className={styles.addCustomWrap}>
                  <input
                    type="text"
                    value={customSpecInput}
                    onChange={(e) => setCustomSpecInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSpecialty(customSpecInput);
                      }
                    }}
                    placeholder="Type a custom department and press Add..."
                  />
                  <button
                    type="button"
                    className={styles.addCustomBtn}
                    onClick={() => handleAddSpecialty(customSpecInput)}
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>
              </>
            )}

            {/* TAB: ABOUT FACILITY */}
            {activeTab === 'about' && (
              <div className={styles.formGroup}>
                <label><FileText size={15} /> About This Facility (Detailed Overview)</label>
                <textarea
                  rows={7}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your medical center, clinical centers of excellence, equipment, and key highlights..."
                />
                <span className={styles.hint}>
                  This paragraph is displayed prominently under the "ABOUT THIS FACILITY" section on your public center page.
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.saveBtn}
              disabled={isSaving || isUploading}
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Saving to Database...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Save Changes to Database
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HospitalProfileEditModal;
