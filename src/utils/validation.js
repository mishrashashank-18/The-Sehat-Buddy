/**
 * src/utils/validation.js
 *
 * Frontend validation helpers matching backend business rules.
 */

export const validateIndianPhone = (phone) => {
  if (!phone || !String(phone).trim()) {
    return { isValid: false, valid: false, error: 'Hospital contact number is required' };
  }

  // Remove spaces, dashes, parens, dots
  let cleaned = String(phone).replace(/[\s\-\(\)\.]/g, '').trim();

  // Strip leading +91 or 0
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.slice(1);
  }

  if (!/^\d+$/.test(cleaned)) {
    return { isValid: false, valid: false, error: 'Phone number cannot contain letters or special characters' };
  }

  if (cleaned.length !== 10) {
    return {
      isValid: false,
      valid: false,
      error: `Contact number must contain exactly 10 digits (currently ${cleaned.length} digits)`
    };
  }

  if (!/^[6-9]\d{9}$/.test(cleaned)) {
    return {
      isValid: false,
      valid: false,
      error: 'Valid Indian mobile numbers must start with 6, 7, 8, or 9'
    };
  }

  return { isValid: true, valid: true, normalized: cleaned, formatted: `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}` };
};

export const validateBedCounts = (totalBeds, availableBeds) => {
  if (totalBeds === '' || totalBeds === undefined || totalBeds === null || Number(totalBeds) === 0) {
    return { isValid: true, valid: true, total: 0, available: 0 };
  }
  const total = parseInt(totalBeds, 10);
  const available = parseInt(availableBeds || 0, 10);

  if (isNaN(total) || total < 1) {
    return { isValid: false, valid: false, error: 'Total beds must be a positive integer of at least 1' };
  }

  if (isNaN(available) || available < 0) {
    return { isValid: false, valid: false, error: 'Available beds cannot be negative' };
  }

  if (available > total) {
    return {
      isValid: false,
      valid: false,
      error: `Available beds (${available}) cannot exceed total capacity (${total})`
    };
  }

  return { isValid: true, valid: true, total, available };
};
