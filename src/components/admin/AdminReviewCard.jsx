import React from 'react';
import { Star, Trash2 } from 'lucide-react';

const AdminReviewCard = React.memo(({
  review,
  onEdit,
  onDelete,
  onApprove
}) => {
  const rev = review;
  const ratingNum = Number(rev.rating) || 5;

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
        contain: 'content'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <strong style={{ fontSize: '0.98rem', color: '#0f172a' }}>{rev.patientName}</strong>
          <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block' }}>
            {rev.patientCity || 'Bengaluru'} {rev.createdAt ? `• ${new Date(rev.createdAt).toLocaleDateString()}` : ''}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '2px' }}>
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              size={14}
              fill={s <= ratingNum ? '#f59e0b' : '#e2e8f0'}
              color={s <= ratingNum ? '#f59e0b' : '#cbd5e1'}
            />
          ))}
        </div>
      </div>

      <div style={{ fontSize: '0.8rem', background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', color: '#334155', border: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '0.74rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '4px',
            background: rev.targetType === 'doctor' ? '#f5f3ff' : '#eff6ff',
            color: rev.targetType === 'doctor' ? '#7c3aed' : '#2563eb',
            border: `1px solid ${rev.targetType === 'doctor' ? '#ddd6fe' : '#bfdbfe'}`
          }}>
            {rev.targetType === 'doctor' ? '👨‍⚕️ Doctor Review' : '🏥 Hospital Review'}
          </span>
          <strong style={{ color: '#0f172a' }}>{rev.targetName || rev.doctorName}</strong>
        </div>
        {rev.treatment && <span style={{ display: 'block', color: '#2563eb' }}>Treatment: {rev.treatment}</span>}
        {rev.insuranceUsed && <span style={{ display: 'block', color: '#059669' }}>Insurance: {rev.insuranceUsed}</span>}
      </div>

      {rev.title && (
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>
          {rev.title}
        </div>
      )}

      <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569', lineHeight: 1.5 }}>
        {rev.comment}
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            padding: '3px 8px',
            borderRadius: '4px',
            background: rev.status === 'approved' ? '#ecfdf5' : rev.status === 'pending' ? '#fef3c7' : '#fef2f2',
            color: rev.status === 'approved' ? '#059669' : rev.status === 'pending' ? '#b45309' : '#ef4444'
          }}>
            {rev.status}
          </span>
          {rev.status === 'pending' && (
            <button
              type="button"
              onClick={() => onApprove(rev)}
              style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '4px', fontSize: '0.72rem', padding: '2px 6px', fontWeight: 700, cursor: 'pointer' }}
            >
              Approve
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={() => onEdit(rev)}
            style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '5px 10px', fontSize: '0.78rem', fontWeight: 600, color: '#2563eb', cursor: 'pointer' }}
            title="Edit / Modify review details"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(rev)}
            style={{
              background: '#fef2f2',
              border: '1px solid #fee2e2',
              borderRadius: '6px',
              padding: '5px 10px',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: '#ef4444',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Delete this review permanently"
          >
            <Trash2 size={13} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
});

export default AdminReviewCard;
