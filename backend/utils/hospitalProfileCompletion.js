/**
 * backend/utils/hospitalProfileCompletion.js
 *
 * Authoritative backend checklist and validation logic for hospital profile completion,
 * mobile phone normalization/validation, and bed capacity verification.
 */

/**
 * Normalizes and validates Indian 10-digit mobile numbers.
 * Permitted input: +91 9876543210, 09876543210, 98765-43210, 9876543210
 * Returns { valid: boolean, normalized: string, error?: string }
 */
export const normalizeAndValidatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'Hospital contact number is required' };
  }

  // Strip all whitespace, dashes, parens, dots
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '').trim();

  // Strip standard country prefix (+91 or 91 or leading 0)
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.slice(1);
  }

  if (!/^\d+$/.test(cleaned)) {
    return { valid: false, error: 'Contact number can only contain numeric digits' };
  }

  if (cleaned.length !== 10) {
    return {
      valid: false,
      error: `Contact number must contain exactly 10 digits (currently ${cleaned.length} digits)`
    };
  }

  if (!/^[6-9]\d{9}$/.test(cleaned)) {
    return {
      valid: false,
      error: 'Indian mobile numbers must start with digit 6, 7, 8, or 9'
    };
  }

  return { valid: true, normalized: cleaned };
};

/**
 * Validates hospital bed capacity counts.
 * Rules:
 * - totalBeds must be an integer >= 1 (operational hospital).
 * - availableBeds must be an integer >= 0.
 * - availableBeds cannot exceed totalBeds.
 * Returns { valid: boolean, error?: string }
 */
export const validateBedCapacity = (totalBeds, availableBeds) => {
  if (totalBeds === '' || totalBeds === undefined || totalBeds === null || Number(totalBeds) === 0) {
    return { valid: true, total: 0, available: 0 };
  }
  const total = Number(totalBeds);
  const available = Number(availableBeds || 0);

  if (isNaN(total) || !Number.isInteger(total) || total < 1) {
    return {
      valid: false,
      error: 'Total hospital bed capacity must be a positive integer of at least 1 bed.'
    };
  }

  if (isNaN(available) || !Number.isInteger(available) || available < 0) {
    return {
      valid: false,
      error: 'Available / vacant beds count cannot be negative.'
    };
  }

  if (available > total) {
    return {
      valid: false,
      error: `Available beds (${available}) cannot exceed total hospital bed capacity (${total}).`
    };
  }

  return { valid: true, total, available };
};

/**
 * Minimum Profile Completion threshold required for public website discovery.
 */
export const MIN_PROFILE_COMPLETION_THRESHOLD = 80;

/**
 * Calculates hospital profile completion percentage using saved database data.
 * Total weight: 100%
 *
 * Weighted Sections:
 * 1. Basic Identity (20%):
 *    - name >= 3 chars, not placeholder (5%)
 *    - email valid format (5%)
 *    - phone valid 10-digit Indian mobile (5%)
 *    - city valid (5%)
 *
 * 2. Address & Location (15%):
 *    - address >= 6 chars, not default 'Main Medical Campus' (10%)
 *    - coordinates or state (5%)
 *
 * 3. Visual Media (20%):
 *    - image (hero) valid non-placeholder URL (10%)
 *    - photos (gallery) has at least 1 showcase photo (10%)
 *
 * 4. Clinical Capacity & Emergency (20%):
 *    - totalBeds >= 1 (10%)
 *    - availableBeds >= 0 and <= totalBeds (5%)
 *    - emergency24x7 explicitly defined (5%)
 *
 * 5. Clinical Staff & Specialties (15%):
 *    - specialities has at least 1 specialty (10%)
 *    - star_doctors or staff_doctors has at least 1 doctor (5%)
 *
 * 6. Hospital Overview & History (10%):
 *    - description >= 20 characters (5%)
 *    - establishedYear valid year <= current year (5%)
 */
export const calculateHospitalProfileCompletion = (hospital) => {
  if (!hospital || typeof hospital !== 'object') {
    return {
      percentage: 0,
      isEligibleForPublication: false,
      missingRequirements: ['Hospital data is missing or invalid'],
      breakdown: []
    };
  }

  let totalScore = 0;
  const missingRequirements = [];
  const breakdown = [];

  // --- 1. Basic Identity (20 pts) ---
  let identityScore = 0;
  const missingIdentity = [];

  // Name (5 pts)
  const name = String(hospital.name || '').trim();
  if (name.length >= 3 && !['hospital', 'test hospital', 'facility', 'new hospital'].includes(name.toLowerCase())) {
    identityScore += 5;
  } else {
    missingIdentity.push('Official hospital name');
  }

  // Email (5 pts)
  const email = String(hospital.email || '').trim().toLowerCase();
  if (email.length > 5 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    identityScore += 5;
  } else {
    missingIdentity.push('Valid administrative email');
  }

  // Phone (5 pts)
  const phoneValidation = normalizeAndValidatePhone(hospital.phone);
  if (phoneValidation.valid) {
    identityScore += 5;
  } else {
    missingIdentity.push('Valid 10-digit Indian contact number');
  }

  // City (5 pts)
  const city = String(hospital.city || '').trim();
  if (city.length >= 2) {
    identityScore += 5;
  } else {
    missingIdentity.push('City / Location');
  }

  totalScore += identityScore;
  breakdown.push({
    section: 'Basic Information',
    weight: 20,
    earned: identityScore,
    missing: missingIdentity
  });
  if (missingIdentity.length > 0) missingRequirements.push(...missingIdentity);

  // --- 2. Address & Location (15 pts) ---
  let addressScore = 0;
  const missingAddress = [];

  const address = String(hospital.address || '').trim();
  if (address.length >= 6 && address.toLowerCase() !== 'main medical campus') {
    addressScore += 10;
  } else {
    missingAddress.push('Detailed campus physical address');
  }

  const hasCoords = (hospital.latitude !== undefined && hospital.latitude !== null && !isNaN(hospital.latitude)) ||
                    (hospital.longitude !== undefined && hospital.longitude !== null && !isNaN(hospital.longitude));
  const hasState = String(hospital.state || '').trim().length >= 2;
  if (hasCoords || hasState) {
    addressScore += 5;
  } else {
    missingAddress.push('Geo-coordinates or state');
  }

  totalScore += addressScore;
  breakdown.push({
    section: 'Address & Location',
    weight: 15,
    earned: addressScore,
    missing: missingAddress
  });
  if (missingAddress.length > 0) missingRequirements.push(...missingAddress);

  // --- 3. Visual Media (20 pts) ---
  let mediaScore = 0;
  const missingMedia = [];

  const heroImg = String(hospital.image || '').trim();
  const isDefaultHero = heroImg.includes('CHANGEME') || heroImg.length < 10;
  if (heroImg && !isDefaultHero) {
    mediaScore += 10;
  } else {
    missingMedia.push('Primary hospital hero photo');
  }

  const photos = Array.isArray(hospital.photos) ? hospital.photos : [];
  const validPhotos = photos.filter(p => {
    const u = typeof p === 'string' ? p : p?.url;
    return u && typeof u === 'string' && u.trim().length > 10;
  });
  if (validPhotos.length >= 1) {
    mediaScore += 10;
  } else {
    missingMedia.push('At least 1 facility showcase photo in gallery');
  }

  totalScore += mediaScore;
  breakdown.push({
    section: 'Visual Media',
    weight: 20,
    earned: mediaScore,
    missing: missingMedia
  });
  if (missingMedia.length > 0) missingRequirements.push(...missingMedia);

  // --- 4. Clinical Capacity & Emergency (20 pts) ---
  let capacityScore = 0;
  const missingCapacity = [];

  const totalBeds = Number(hospital.totalBeds);
  if (!isNaN(totalBeds) && totalBeds >= 1) {
    capacityScore += 10;
  } else {
    missingCapacity.push('Total bed capacity count (>= 1)');
  }

  const availableBeds = Number(hospital.availableBeds !== undefined ? hospital.availableBeds : hospital.emptyBeds);
  if (!isNaN(availableBeds) && availableBeds >= 0 && availableBeds <= (totalBeds || 100)) {
    capacityScore += 5;
  } else {
    missingCapacity.push('Valid available beds count (cannot exceed total beds)');
  }

  if (hospital.emergency24x7 !== undefined && hospital.emergency24x7 !== null) {
    capacityScore += 5;
  } else {
    missingCapacity.push('24/7 Emergency care status');
  }

  totalScore += capacityScore;
  breakdown.push({
    section: 'Bed Capacity & Emergency',
    weight: 20,
    earned: capacityScore,
    missing: missingCapacity
  });
  if (missingCapacity.length > 0) missingRequirements.push(...missingCapacity);

  // --- 5. Clinical Staff & Specialties (15 pts) ---
  let clinicalScore = 0;
  const missingClinical = [];

  const specs = Array.isArray(hospital.specialities || hospital.specialties) ? (hospital.specialities || hospital.specialties) : [];
  if (specs.length >= 1) {
    clinicalScore += 10;
  } else {
    missingClinical.push('At least 1 medical department or specialty');
  }

  const starDocs = Array.isArray(hospital.star_doctors) ? hospital.star_doctors : [];
  const staffDocs = Array.isArray(hospital.staff_doctors) ? hospital.staff_doctors : [];
  const staffEmails = Array.isArray(hospital.staff_emails) ? hospital.staff_emails : [];
  if (starDocs.length > 0 || staffDocs.length > 0 || staffEmails.length > 0) {
    clinicalScore += 5;
  } else {
    missingClinical.push('At least 1 affiliated doctor or staff specialist');
  }

  totalScore += clinicalScore;
  breakdown.push({
    section: 'Specialties & Staff',
    weight: 15,
    earned: clinicalScore,
    missing: missingClinical
  });
  if (missingClinical.length > 0) missingRequirements.push(...missingClinical);

  // --- 6. Hospital Overview & History (10 pts) ---
  let overviewScore = 0;
  const missingOverview = [];

  const desc = String(hospital.description || '').trim();
  if (desc.length >= 20) {
    overviewScore += 5;
  } else {
    missingOverview.push('Facility overview description (at least 20 characters)');
  }

  const estYear = Number(hospital.establishedYear);
  const curYear = new Date().getFullYear();
  if (!isNaN(estYear) && estYear >= 1800 && estYear <= curYear) {
    overviewScore += 5;
  } else {
    missingOverview.push('Valid established year');
  }

  totalScore += overviewScore;
  breakdown.push({
    section: 'Overview & History',
    weight: 10,
    earned: overviewScore,
    missing: missingOverview
  });
  if (missingOverview.length > 0) missingRequirements.push(...missingOverview);

  const percentage = Math.min(100, Math.max(0, Math.round(totalScore)));
  const isEligibleForPublication = percentage >= MIN_PROFILE_COMPLETION_THRESHOLD;

  return {
    percentage,
    isEligibleForPublication,
    threshold: MIN_PROFILE_COMPLETION_THRESHOLD,
    missingRequirements,
    breakdown
  };
};
