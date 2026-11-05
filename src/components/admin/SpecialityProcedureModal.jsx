import React, { useState, useEffect } from 'react';
import { X, Check, Stethoscope, Sparkles } from 'lucide-react';
import { RenderMedicalIcon } from '../specialities/SpecialitiesProceduresSection';

export const MEDICAL_ICON_PRESETS = [
  { id: 'Bot', label: 'Robotic Surgery', hint: 'Bot' },
  { id: 'Ribbon', label: 'Cancer / Oncology', hint: 'Ribbon' },
  { id: 'Heart', label: 'Cardiac Sciences', hint: 'Heart' },
  { id: 'Bone', label: 'Orthopaedics / Joint', hint: 'Bone' },
  { id: 'Brain', label: 'Neurosciences', hint: 'Brain' },
  { id: 'Kidneys', label: 'Nephrology', hint: 'Kidneys' },
  { id: 'Pill', label: 'Internal Medicine', hint: 'Pill' },
  { id: 'Baby', label: 'Obstetrics & Gynae', hint: 'Baby' },
  { id: 'Eye', label: 'Eye / Cataract', hint: 'Eye' },
  { id: 'Activity', label: 'Laparoscopic Surgery', hint: 'Activity' },
  { id: 'ShieldCheck', label: 'Hernia / General Care', hint: 'ShieldCheck' },
  { id: 'Stethoscope', label: 'General Clinical', hint: 'Stethoscope' }
];

export default function SpecialityProcedureModal({
  isOpen,
  onClose,
  onSave,
  itemToEdit = null,
  defaultType = 'speciality'
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState(defaultType);
  const [icon, setIcon] = useState('Bot');
  const [description, setDescription] = useState('');
  const [proceduresInput, setProceduresInput] = useState('');
  const [coveragePercent, setCoveragePercent] = useState('Up to 100% Covered');
  const [preAuthHours, setPreAuthHours] = useState('30 Mins Pre-Approval');
  const [estimatedCostRange, setEstimatedCostRange] = useState('₹45,000 - ₹1,20,000');
  const [outOfPocketWithInsurance, setOutOfPocketWithInsurance] = useState('₹0 with Cashless Mediclaim');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (itemToEdit) {
        setName(itemToEdit.name || '');
        setType(itemToEdit.type || defaultType);
        setIcon(itemToEdit.icon || 'Bot');
        setDescription(itemToEdit.description || '');
        setProceduresInput(Array.isArray(itemToEdit.procedures) ? itemToEdit.procedures.join(', ') : '');
        setCoveragePercent(itemToEdit.insuranceDetails?.coveragePercent || 'Up to 100% Covered');
        setPreAuthHours(itemToEdit.insuranceDetails?.preAuthHours || '30 Mins Pre-Approval');
        setEstimatedCostRange(itemToEdit.insuranceDetails?.estimatedCostRange || '₹45,000 - ₹1,20,000');
        setOutOfPocketWithInsurance(itemToEdit.insuranceDetails?.outOfPocketWithInsurance || '₹0 with Cashless Mediclaim');
      } else {
        setName('');
        setType(defaultType);
        setIcon(defaultType === 'procedure' ? 'Eye' : 'Bot');
        setDescription('');
        setProceduresInput('');
        setCoveragePercent(defaultType === 'procedure' ? '100% Cashless Covered' : '100% Cashless Available');
        setPreAuthHours('30 Mins Pre-Approval');
        setEstimatedCostRange(defaultType === 'procedure' ? '₹45,000 - ₹95,000' : '₹80,000 - ₹2,50,000');
        setOutOfPocketWithInsurance('₹0 with Cashless Mediclaim');
      }
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen, itemToEdit, defaultType]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a name or title for this entry.');
      return;
    }

    const parsedProcedures = proceduresInput
      .split(',')
      .map(p => p.trim())
      .filter(Boolean);

    const payload = {
      name: name.trim(),
      type,
      icon: icon || 'Bot',
      description: description.trim(),
      isPopular: true,
      insuranceCovered: true,
      insuranceDetails: {
        coveragePercent: coveragePercent.trim() || 'Up to 100% Covered',
        cashlessAvailable: true,
        preAuthHours: preAuthHours.trim() || '30 Mins Pre-Approval',
        estimatedCostRange: estimatedCostRange.trim() || 'Contact Hospital',
        outOfPocketWithInsurance: outOfPocketWithInsurance.trim() || '₹0 with Cashless Mediclaim',
        emiAvailable: true
      },
      procedures: parsedProcedures
    };

    setIsSubmitting(true);
    setError('');
    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      console.error('Failed to save speciality/procedure:', err);
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = Boolean(itemToEdit);
  const isProcedure = type === 'procedure';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'fadeInUp 0.2s ease-out'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f8fafc'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: isProcedure ? '#eff6ff' : '#fdf2f8',
                color: isProcedure ? '#2563eb' : '#db2777',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <RenderMedicalIcon iconType={icon} color={isProcedure ? '#2563eb' : '#db2777'} size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 700 }}>
                {isEditing
                  ? `Edit ${isProcedure ? 'Surgical Procedure' : 'Clinical Speciality'}`
                  : `Add New ${isProcedure ? 'Surgical Procedure' : 'Clinical Speciality'}`}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Configures real-time showcase card, sub-procedures, and cashless mediclaim tags.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#e2e8f0',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#475569'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '24px', flex: 1 }}>
          {error && (
            <div
              style={{
                padding: '10px 14px',
                background: '#fee2e2',
                border: '1px solid #fca5a5',
                color: '#b91c1c',
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '16px',
                fontWeight: 600
              }}
            >
              {error}
            </div>
          )}

          {/* Type Selector */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              ENTRY TYPE *
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setType('speciality')}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: type === 'speciality' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  background: type === 'speciality' ? '#eff6ff' : '#ffffff',
                  color: type === 'speciality' ? '#1d4ed8' : '#475569',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Stethoscope size={16} />
                <span>Clinical Speciality</span>
              </button>
              <button
                type="button"
                onClick={() => setType('procedure')}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: type === 'procedure' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  background: type === 'procedure' ? '#eff6ff' : '#ffffff',
                  color: type === 'procedure' ? '#1d4ed8' : '#475569',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Sparkles size={16} />
                <span>Surgical Procedure</span>
              </button>
            </div>
          </div>

          {/* Name Field */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              {isProcedure ? 'SURGICAL PROCEDURE NAME *' : 'CLINICAL SPECIALITY NAME *'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isProcedure ? 'e.g. Cataract Surgery or Total Knee Replacement' : 'e.g. Cancer Care / Oncology or Robotic Surgery'}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.92rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Icon Presets Picker */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              CARD MEDICAL ICON PRESET
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))',
                gap: '8px',
                maxHeight: '145px',
                overflowY: 'auto',
                padding: '8px',
                background: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid #e2e8f0'
              }}
            >
              {MEDICAL_ICON_PRESETS.map((preset) => {
                const isSelected = icon === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setIcon(preset.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      background: isSelected ? '#eff6ff' : '#ffffff',
                      color: isSelected ? '#1d4ed8' : '#475569',
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: '0.76rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <RenderMedicalIcon iconType={preset.id} size={18} color={isSelected ? '#2563eb' : '#64748b'} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {preset.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              OVERVIEW & CLINICAL HIGHLIGHTS
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Advanced adult and pediatric cardiology, coronary bypass (CABG), angioplasty, heart valve repair, and rhythm management."
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.88rem',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Sub-procedures / Techniques */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
              KEY SUB-PROCEDURES / SURGICAL TECHNIQUES (COMMA-SEPARATED)
            </label>
            <span style={{ display: 'block', fontSize: '0.74rem', color: '#64748b', marginBottom: '6px' }}>
              These render as interactive chips on the public card (e.g. Tumor Resection, Chemotherapy Port, +1 more)
            </span>
            <input
              type="text"
              value={proceduresInput}
              onChange={(e) => setProceduresInput(e.target.value)}
              placeholder="e.g. Tumor Resection, Chemotherapy Port Insertion, Surgical Oncology"
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.88rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Insurance & Pre-Auth Tags */}
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>
              MEDICLAIM, INSURANCE & COST BADGES
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Coverage Badge Text
                </label>
                <input
                  type="text"
                  value={coveragePercent}
                  onChange={(e) => setCoveragePercent(e.target.value)}
                  placeholder="e.g. 100% Cashless Available"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.84rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Pre-Approval Turnaround
                </label>
                <input
                  type="text"
                  value={preAuthHours}
                  onChange={(e) => setPreAuthHours(e.target.value)}
                  placeholder="e.g. 30 Mins Pre-Approval"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.84rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Estimated Cost Range
                </label>
                <input
                  type="text"
                  value={estimatedCostRange}
                  onChange={(e) => setEstimatedCostRange(e.target.value)}
                  placeholder="e.g. ₹80,000 - ₹2,50,000"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.84rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Out of Pocket with Insurance
                </label>
                <input
                  type="text"
                  value={outOfPocketWithInsurance}
                  onChange={(e) => setOutOfPocketWithInsurance(e.target.value)}
                  placeholder="e.g. ₹0 with Cashless Mediclaim"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.84rem', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontWeight: 600,
                fontSize: '0.86rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '9px 20px',
                borderRadius: '8px',
                border: 'none',
                background: '#2563eb',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.86rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Check size={16} />
              <span>{isSubmitting ? 'Saving...' : isEditing ? 'Update Entry' : 'Add to Hospital'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
