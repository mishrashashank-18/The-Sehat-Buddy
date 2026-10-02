import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import styles from './DeleteConfirmModal.module.css';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, title, message, itemName }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.iconWrap}>
          <AlertTriangle size={32} color="#dc2626" />
        </div>

        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        <h3 className={styles.title}>{title || 'Confirm Deletion'}</h3>
        <p className={styles.message}>
          {message || 'Are you sure you want to delete this item? This action cannot be undone.'}
        </p>

        {itemName && (
          <div className={styles.itemHighlight}>
            <span>"{itemName}"</span>
          </div>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.deleteBtn}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            <Trash2 size={16} /> Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
