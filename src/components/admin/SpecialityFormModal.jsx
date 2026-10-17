import React, { useState } from 'react';
import { X, ShieldCheck, Save, Check } from 'lucide-react';
import styles from './DoctorFormModal.module.css';

const AVAILABLE_ICONS = [
  'Bot',
  'Ribbon',
  'Heart',
  'Bone',
  'Brain',
  'Kidneys',
  'Pill',
  'Baby',
  'Eye',
  'Activity',
  'ShieldCheck'
];

const SpecialityFormModal = ({ itemToEdit, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: itemToEdit?.name || '',
    type: itemToEdit?.type || 'speciality',
    icon: itemToEdit?.icon || 'Bot',
    description: itemToEdit?.description || '',
    insuranceCovered: itemToEdit?.insuranceCovered !== undefined ? itemToEdit.insuranceCovered : true,
    coveragePercent: itemToEdit?.insuranceDetails?.coveragePercent || 'Up to 100% Covered',
    cashlessAvailable: itemToEdit?.insuranceDetails?.cashlessAvailable !== undefined ? itemToEdit.insuranceDetails.cashlessAvailable : true,
    preAuthHours: itemToEdit?.insuranceDetails?.preAuthHours || '30 Mins Pre-Approval',
    estimatedCostRange: itemToEdit?.insuranceDetails?.estimatedCostRange || '₹45,000 - ₹90,000',
    outOfPocketWithInsurance: itemToEdit?.insuranceDetails?.outOfPocketWithInsurance || '₹0 with Cashless Mediclaim',
    emiAvailable: itemToEdit?.insuranceDetails?.emiAvailable !== undefined ? itemToEdit.insuranceDetails.emiAvailable : true,
    proceduresText: Array.isArray(itemToEdit?.procedures) ? itemToEdit.procedures.join(', ') : ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Name is required');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      type: formData.type,
      icon: formData.icon,
      description: formData.description.trim(),
      insuranceCovered: formData.insuranceCovered,
      insuranceDetails: {
        coveragePercent: formData.coveragePercent.trim(),
        cashlessAvailable: formData.cashlessAvailable,
        preAuthHours: formData.preAuthHours.trim(),
        estimatedCostRange: formData.estimatedCostRange.trim(),
        outOfPocketWithInsurance: formData.outOfPocketWithInsurance.trim(),
        emiAvailable: formData.emiAvailable
      },
      procedures: formData.proceduresText
        .split(',')
        .map(p => p.trim())
        .filter(Boolean)
    };

    onSave(payload);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={20} />
        </button>

        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
            {itemToEdit ? 'Edit Speciality / Surgery' : 'Add Speciality / Procedure'}
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
            Configure treatment details, display icons, and cashless insurance coverage parameters.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Name *</label>
              <input
                type="text"
                placeholder="e.g. Robotic Surgery or Cataract Surgery"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                style={{ border: '1.5px solid #cbd5e1', borderRadius: '10px', padding: '10px 14px', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Section Tab *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                style={{ border: '1.5px solid #cbd5e1', borderRadius: '10px', padding: '10px 14px', outline: 'none' }}
              >
                <option value="speciality">Speciality (e.g. Cardiology, Oncology)</option>
                <option value="procedure">Procedure / Surgery (e.g. Knee Replacement)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Medical Icon</label>
              <select
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                style={{ border: '1.5px solid #cbd5e1', borderRadius: '10px', padding: '10px 14px', outline: 'none' }}
              >
                {AVAILABLE_ICONS.map(ic => (
                  <option key={ic} value={ic}>{ic}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Coverage Indicator</label>
              <input
                type="text"
                placeholder="e.g. Up to 100% Covered"
                value={formData.coveragePercent}
                onChange={(e) => setFormData({ ...formData, coveragePercent: e.target.value })}
                style={{ border: '1.5px solid #cbd5e1', borderRadius: '10px', padding: '10px 14px', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Description</label>
            <textarea
              rows={2}
              placeholder="Brief overview of clinical scope, benefits, recovery..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{ border: '1.5px solid #cbd5e1', borderRadius: '10px', padding: '10px 14px', outline: 'none', fontFamily: 'inherit' }}
            />
          </div>

          {/* Insurance Fields Box */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} color="#059669" /> Insurance & Cashless Configuration
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Pre-Auth TAT</label>
                <input
                  type="text"
                  placeholder="e.g. 30 Mins Pre-Approval"
                  value={formData.preAuthHours}
                  onChange={(e) => setFormData({ ...formData, preAuthHours: e.target.value })}
                  style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 12px', outline: 'none', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Estimated Cost Range</label>
                <input
                  type="text"
                  placeholder="e.g. ₹45,000 - ₹90,000"
                  value={formData.estimatedCostRange}
                  onChange={(e) => setFormData({ ...formData, estimatedCostRange: e.target.value })}
                  style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 12px', outline: 'none', fontSize: '0.88rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>Out-of-Pocket with Insurance</label>
                <input
                  type="text"
                  placeholder="e.g. ₹0 with Cashless Mediclaim"
                  value={formData.outOfPocketWithInsurance}
                  onChange={(e) => setFormData({ ...formData, outOfPocketWithInsurance: e.target.value })}
                  style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 12px', outline: 'none', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '18px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.cashlessAvailable}
                    onChange={(e) => setFormData({ ...formData, cashlessAvailable: e.target.checked })}
                  />
                  Cashless Available
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.emiAvailable}
                    onChange={(e) => setFormData({ ...formData, emiAvailable: e.target.checked })}
                  />
                  0% EMI Available
                </label>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
              Associated Procedures / Surgeries (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Monofocal Cataract, Multifocal Lens, Phacoemulsification"
              value={formData.proceduresText}
              onChange={(e) => setFormData({ ...formData, proceduresText: e.target.value })}
              style={{ border: '1.5px solid #cbd5e1', borderRadius: '10px', padding: '10px 14px', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ background: '#f1f5f9', border: 'none', borderRadius: '10px', padding: '10px 20px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ background: '#2563eb', border: 'none', borderRadius: '10px', padding: '10px 24px', fontWeight: 700, color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Save size={16} />
              <span>{itemToEdit ? 'Save Changes' : 'Create Item'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SpecialityFormModal;
