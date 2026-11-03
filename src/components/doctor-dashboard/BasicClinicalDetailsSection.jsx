import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserCheck, Check, Save, ShieldCheck } from 'lucide-react';

const cleanDigits = (val) => {
  const digits = String(val || '').replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
};

export const getDraftFromDoctor = (doc) => ({
  name: doc?.name ?? '',
  specialty: doc?.specialization ?? doc?.specialty ?? '',
  jobTitle: doc?.jobTitle ?? '',
  experience: (doc?.experience !== undefined && doc?.experience !== null && doc?.experience !== '') ? doc.experience : '',
  hospital: doc?.hospital ?? '',
  degree: (doc?.degree !== undefined ? doc.degree : (doc?.qualifications !== undefined ? doc.qualifications : '')) ?? '',
  price: (doc?.fees !== undefined && doc?.fees !== null && doc?.fees !== '') 
    ? doc.fees 
    : ((doc?.price !== undefined && doc?.price !== null && doc?.price !== '') ? doc.price : ''),
  phone: cleanDigits(doc?.phone || doc?.contact_number),
  licenseNumber: doc?.licenseNumber ?? '',
  availableDays: doc?.availableDays ?? ''
});

/**
 * BasicClinicalDetailsSection
 * Completely flicker-free, stable controlled form for doctor credentials and consultation details.
 *
 * Architecture:
 * 1. Single source of truth (controlled `formData` state).
 * 2. Synchronous, direct updates on keystrokes using latest event value.
 * 3. Keeps input values as string while typing (never converting numbers prematurely).
 * 4. Stable DOM input elements with static IDs, names, and no dynamic key recreations.
 * 5. Isolates ongoing typing from background remote API polling/SSE events via dirty & active focus tracking.
 * 6. Always keeps parent `draftRef` synchronized for global form saves.
 */
const BasicClinicalDetailsSection = ({
  doctor,
  onSave,
  draftRef,
  isSaving = false,
  isSaved = false,
  styles
}) => {
  // 1. Controlled form state initialized safely from authenticated doctor
  const [formData, setFormData] = useState(() => getDraftFromDoctor(doctor));

  // 2. Refs to protect active user editing from background remote overwrites
  const dirtyFieldsRef = useRef(new Set());
  const activeEditingFieldRef = useRef(null);
  const currentDoctorIdRef = useRef(String(doctor?._id || doctor?.id || ''));

  // 3. Keep parent draftRef in sync with latest formData at all times
  useEffect(() => {
    if (draftRef) {
      draftRef.current = formData;
    }
  }, [formData, draftRef]);

  // 4. Remote synchronization: only updates untouched fields when remote doctor changes
  const docId = String(doctor?._id || doctor?.id || '');
  const docName = doctor?.name;
  const docSpecialty = doctor?.specialization ?? doctor?.specialty;
  const docJobTitle = doctor?.jobTitle;
  const docExperience = doctor?.experience;
  const docHospital = doctor?.hospital;
  const docDegree = doctor?.degree ?? doctor?.qualifications;
  const docFees = doctor?.fees ?? doctor?.price;
  const docPhone = doctor?.phone ?? doctor?.contact_number;
  const docLicense = doctor?.licenseNumber;
  const docAvailableDays = doctor?.availableDays;

  useEffect(() => {
    if (!docId) return;

    // Doctor identity changed completely (different user login or doctor switch)
    if (docId !== currentDoctorIdRef.current) {
      currentDoctorIdRef.current = docId;
      dirtyFieldsRef.current.clear();
      activeEditingFieldRef.current = null;
      const fresh = getDraftFromDoctor(doctor);
      setFormData(fresh);
      if (draftRef) draftRef.current = fresh;
      return;
    }

    // Same doctor: merge remote updates ONLY for untouched fields that user is not actively typing in
    const fresh = getDraftFromDoctor(doctor);
    setFormData(prev => {
      let hasChanges = false;
      const next = { ...prev };
      for (const field of Object.keys(fresh)) {
        if (dirtyFieldsRef.current.has(field) || activeEditingFieldRef.current === field) {
          continue; // Guard user's active/dirty edits
        }
        if (String(fresh[field] ?? '') !== String(prev[field] ?? '')) {
          next[field] = fresh[field];
          hasChanges = true;
        }
      }
      if (hasChanges && draftRef) {
        draftRef.current = next;
      }
      return hasChanges ? next : prev;
    });
  }, [
    docId,
    docName,
    docSpecialty,
    docJobTitle,
    docExperience,
    docHospital,
    docDegree,
    docFees,
    docPhone,
    docLicense,
    docAvailableDays,
    draftRef
  ]);

  // 5. Synchronous, stable change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    dirtyFieldsRef.current.add(name);
    activeEditingFieldRef.current = name;

    const nextVal = name === 'phone' ? cleanDigits(value) : value;

    setFormData(prev => {
      const updated = { ...prev, [name]: nextVal };
      if (draftRef) {
        draftRef.current = updated;
      }
      return updated;
    });
  };

  const handleInputFocus = (e) => {
    activeEditingFieldRef.current = e.target.name;
  };

  const handleInputBlur = (e) => {
    if (activeEditingFieldRef.current === e.target.name) {
      activeEditingFieldRef.current = null;
    }
  };

  // 6. Submit handler
  const handleSubmit = useCallback((e) => {
    e?.preventDefault?.();
    if (isSaving) return;

    const base = getDraftFromDoctor(doctor);
    const isDirty = Object.keys(formData).some(
      k => String(formData[k] ?? '').trim() !== String(base[k] ?? '').trim()
    );

    const payload = {
      name: (formData.name || '').trim(),
      specialty: (formData.specialty || '').trim(),
      specialization: (formData.specialty || '').trim(),
      jobTitle: (formData.jobTitle || '').trim(),
      experience: (formData.experience !== '' && !isNaN(parseFloat(formData.experience))) 
        ? parseFloat(formData.experience) 
        : 0,
      hospital: (formData.hospital || '').trim(),
      degree: (formData.degree || '').trim(),
      qualifications: (formData.degree || '').trim(),
      fees: (formData.price !== '' && !isNaN(Number(formData.price))) 
        ? Number(formData.price) 
        : 0,
      price: (formData.price !== '' && !isNaN(Number(formData.price))) 
        ? Number(formData.price) 
        : 0,
      phone: cleanDigits(formData.phone),
      contact_number: cleanDigits(formData.phone),
      licenseNumber: (formData.licenseNumber || '').trim(),
      availableDays: (formData.availableDays || '').trim()
    };

    dirtyFieldsRef.current.clear();
    activeEditingFieldRef.current = null;

    if (onSave) {
      onSave(payload, { isDirty });
    }
  }, [formData, doctor, isSaving, onSave]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
      e.target?.blur?.();
    }
  };

  return (
    <div style={{ marginTop: '28px', marginBottom: '24px' }}>
      {/* SECTION HEADER */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '1.5px solid #e2e8f0'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={19} color="#2563eb" />
            Basic Clinical & Consultation Details
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
            Information is only updated in the database and doctor's public page when you click <strong>Save Details</strong> or press <strong>Enter</strong>.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: isSaved ? '#16a34a' : '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 18px',
            fontSize: '0.84rem',
            fontWeight: 600,
            cursor: isSaving ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 6px rgba(37,99,235,0.25)',
            transition: 'all 0.2s ease'
          }}
          title="Save clinical details to database and public profile"
        >
          {isSaved ? <Check size={15} /> : <Save size={15} />}
          <span>{isSaving ? 'Saving...' : isSaved ? 'Saved to Database!' : 'Save Details'}</span>
        </button>
      </div>

      {/* INPUT FORM GRID */}
      <form onSubmit={handleSubmit} className={styles.settingsGrid}>
        {/* 1. Full Name */}
        <div className={styles.formGroup}>
          <label htmlFor="clinical-input-name">Full Name</label>
          <input
            id="clinical-input-name"
            name="name"
            type="text"
            autoComplete="off"
            placeholder="e.g. Dr. Rahul Sharma"
            value={formData.name || ''}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* 2. Specialty / Department */}
        <div className={styles.formGroup}>
          <label htmlFor="clinical-input-specialty">Specialty / Department</label>
          <input
            id="clinical-input-specialty"
            name="specialty"
            type="text"
            autoComplete="off"
            placeholder="e.g. Cardiologist"
            value={formData.specialty || ''}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* 3. Job Title / Designation */}
        <div className={styles.formGroup}>
          <label htmlFor="clinical-input-jobTitle">Job Title / Designation</label>
          <input
            id="clinical-input-jobTitle"
            name="jobTitle"
            type="text"
            autoComplete="off"
            placeholder="e.g. Senior Consultant"
            value={formData.jobTitle || ''}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* 4. Experience (Years) */}
        <div className={styles.formGroup}>
          <label htmlFor="clinical-input-experience">Experience (Years)</label>
          <input
            id="clinical-input-experience"
            name="experience"
            type="number"
            min="0"
            max="70"
            step="any"
            autoComplete="off"
            placeholder="e.g. 10"
            value={formData.experience !== undefined && formData.experience !== null ? formData.experience : ''}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* 5. Hospital Affiliation */}
        <div className={styles.formGroup}>
          <label htmlFor="clinical-input-hospital">Hospital Affiliation</label>
          <input
            id="clinical-input-hospital"
            name="hospital"
            type="text"
            autoComplete="off"
            placeholder="e.g. Apollo Hospital"
            value={formData.hospital || ''}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* 6. Degrees / Qualifications */}
        <div className={styles.formGroup}>
          <label htmlFor="clinical-input-degree">Degrees / Qualifications</label>
          <input
            id="clinical-input-degree"
            name="degree"
            type="text"
            autoComplete="off"
            placeholder="e.g. MBBS, MD, DM (Cardiology)"
            value={formData.degree || ''}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* 7. Consultation Fee (₹) */}
        <div className={styles.formGroup}>
          <label htmlFor="clinical-input-price">Consultation Fee (₹)</label>
          <input
            id="clinical-input-price"
            name="price"
            type="number"
            min="0"
            step="any"
            autoComplete="off"
            placeholder="e.g. 500"
            value={formData.price !== undefined && formData.price !== null ? formData.price : ''}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* 8. Contact Phone */}
        <div className={styles.formGroup}>
          <label htmlFor="clinical-input-phone">Contact Phone</label>
          <input
            id="clinical-input-phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            autoComplete="off"
            placeholder="Enter 10-digit mobile number"
            value={formData.phone || ''}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* 9. Medical Registration / License No. */}
        <div className={styles.formGroup}>
          <label htmlFor="clinical-input-licenseNumber" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={16} color="#2563eb" />
            Medical Registration / License No.
          </label>
          <input
            id="clinical-input-licenseNumber"
            name="licenseNumber"
            type="text"
            autoComplete="off"
            placeholder="e.g. DMC-2009-44182 or MCI-48291"
            value={formData.licenseNumber || ''}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* 10. Available Consultation Hours */}
        <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
          <label htmlFor="clinical-input-availableDays">Available Consultation Hours</label>
          <input
            id="clinical-input-availableDays"
            name="availableDays"
            type="text"
            autoComplete="off"
            placeholder="e.g. Mon - Sat (10:00 AM - 02:00 PM)"
            value={formData.availableDays || ''}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* BOTTOM ACTION SAVE BUTTON */}
        <div style={{
          gridColumn: 'span 2',
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: '8px',
          marginBottom: '6px'
        }}>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: isSaved ? '#16a34a' : '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '9px 20px',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 6px rgba(37,99,235,0.25)',
              transition: 'all 0.2s ease'
            }}
            title="Save clinical details to database and public profile"
          >
            {isSaved ? <Check size={15} /> : <Save size={15} />}
            <span>{isSaving ? 'Saving...' : isSaved ? 'Saved to Database!' : 'Save Clinical Details'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default React.memo(BasicClinicalDetailsSection);
