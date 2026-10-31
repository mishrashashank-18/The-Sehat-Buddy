import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DataContext } from './context';
import { api, API_BASE } from '../services/api';
import { initialBranding } from '../data/branding';
import { defaultAcceptedInsurances } from '../data/insurancePartners';
import { formatDoctorAvailability } from '../utils/doctorScheduleUtils';
import { initialArticles } from '../data/articles';
import { initialServices } from '../data/services';
import { initialDoctors } from '../data/doctors';
import { initialCorporateTieups } from '../data/corporateTieups';
import { initialHeroContent } from '../data/heroContent';

const STORAGE_KEY_DOCTORS = 'sehat_buddy_doctors_v3';
const STORAGE_KEY_HOSPITALS = 'sehat_buddy_hospitals_v4';
const STORAGE_KEY_HERO = 'sehat_buddy_hero_v4';
const STORAGE_KEY_SERVICES = 'sehat_buddy_services_v2';
const STORAGE_KEY_FEATURES = 'sehat_buddy_features_v2';
const STORAGE_KEY_ARTICLES = 'sehat_buddy_articles_v2';
const STORAGE_KEY_CORPORATE = 'sehat_buddy_corporate_v2';
const STORAGE_KEY_FAQS = 'sehat_buddy_faqs_v2';
const STORAGE_KEY_FAQ_SYMBOLS = 'sehat_buddy_faq_symbols_v2';
const STORAGE_KEY_REVIEWS = 'sehat_buddy_reviews_v2';
const STORAGE_KEY_SPECIALITIES = 'sehat_buddy_specialities_v2';
const STORAGE_KEY_BRANDING = 'sehat_buddy_branding_v3';
const STORAGE_KEY_CONTACT = 'sehat_buddy_contact_v1';
const STORAGE_KEY_LEGAL = 'sehat_buddy_legal_policies_v1';

export const DEFAULT_CONTACT_INFO = {
  phones: [
    { id: 'phone-1', label: 'Helpline & Emergency', number: '+91 98765 43210', isPrimary: true },
    { id: 'phone-2', label: 'Appointments Desk', number: '+91 80000 12345', isPrimary: false }
  ],
  emails: [
    { id: 'email-1', label: 'Patient Support', email: 'support@thesehatbuddy.com', isPrimary: true },
    { id: 'email-2', label: 'General Inquiries', email: 'contact@thesehatbuddy.com', isPrimary: false }
  ],
  workingHours: 'Mon – Sat: 8:00 AM – 8:00 PM'
};

export const DEFAULT_LEGAL_POLICIES = {
  privacyPolicy: {
    url: '',
    fileName: '',
    fileSize: 0,
    fileSizeFormatted: '',
    updatedAt: null
  },
  termsAndConditions: {
    url: '',
    fileName: '',
    fileSize: 0,
    fileSizeFormatted: '',
    updatedAt: null
  }
};

// Real-time synchronization channel across browser tabs & windows
const SYNC_CHANNEL_NAME = 'sehat_buddy_sync_bus_v1';
export const CURRENT_TAB_ID = 'tab_' + Math.random().toString(36).slice(2, 9) + '_' + Date.now();
let broadcastChan = null;
try {
  if (typeof BroadcastChannel !== 'undefined') {
    broadcastChan = new BroadcastChannel(SYNC_CHANNEL_NAME);
  }
} catch (e) {
  broadcastChan = null;
}

export const broadcastSync = (key, data) => {
  try {
    broadcastChan?.postMessage({
      type: 'SEHAT_SYNC',
      senderTabId: CURRENT_TAB_ID,
      key,
      data,
      timestamp: Date.now()
    });
  } catch {}
};

export const isSame = (prev, next) => JSON.stringify(prev) === JSON.stringify(next);

// Robust ID matching helper that safely handles MongoDB _id, numeric id, and email
export const matchesId = (item, id) => {
  if (!item || id === undefined || id === null) return false;

  // If id is an object (e.g. doctor, user, or hospital object)
  if (typeof id === 'object') {
    // 1. Direct email match
    if (id.email && item.email && String(id.email).toLowerCase().trim() === String(item.email).toLowerCase().trim()) {
      return true;
    }
    // 2. Cross-check numeric and MongoDB string IDs
    if (id.id !== undefined && item.id !== undefined && String(id.id).trim() === String(item.id).trim()) {
      return true;
    }
    if (id._id !== undefined && item._id !== undefined && String(id._id).trim() === String(item._id).trim()) {
      return true;
    }
    if (id.id !== undefined && item._id !== undefined && String(id.id).trim() === String(item._id).trim()) {
      return true;
    }
    if (id._id !== undefined && item.id !== undefined && String(id._id).trim() === String(item.id).trim()) {
      return true;
    }
  }

  // If id is a string, number, or fallback
  const candidateIds = [];
  if (typeof id === 'object') {
    if (id.id !== undefined && id.id !== null) candidateIds.push(String(id.id).trim());
    if (id._id !== undefined && id._id !== null) candidateIds.push(String(id._id).trim());
    if (id.email) candidateIds.push(String(id.email).toLowerCase().trim());
  } else {
    candidateIds.push(String(id).trim());
  }

  for (const cid of candidateIds) {
    if (!cid) continue;
    if (item.id !== undefined && item.id !== null && String(item.id).trim() === cid) return true;
    if (item._id !== undefined && item._id !== null && String(item._id).trim() === cid) return true;
    if (item.email && cid.includes('@') && item.email.toLowerCase().trim() === cid.toLowerCase()) return true;
  }

  // Alias handling for Dr. Rahul Verma (id: 1, '1', 'default', 'rahul')
  const itemIsRahul = (
    item.id === 1 ||
    String(item.id) === '1' ||
    (item.email && item.email.toLowerCase().includes('rahul')) ||
    (item.name && item.name.toLowerCase().includes('rahul verma'))
  );
  if (itemIsRahul) {
    for (const cid of candidateIds) {
      if (cid === '1' || cid === 'default' || cid.toLowerCase().includes('rahul')) return true;
    }
  }

  return false;
};

// Canonical doctor ID extractor (prefers MongoDB _id)
export const getDoctorCanonicalId = (doc) => {
  if (!doc) return null;
  if (typeof doc === 'object') {
    return doc._id ? String(doc._id) : (doc.id ? String(doc.id) : (doc.email ? String(doc.email).toLowerCase() : null));
  }
  return String(doc);
};

// Automatic media resolution helper that seamlessly upgrades legacy local paths to Cloudinary CDN
export const resolveMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // 1. Articles migration to Cloudinary CDN
  if (trimmed.includes('article-1') || trimmed === '/src/assets/images/article-1.png' || trimmed.endsWith('/article-1.png')) {
    return 'https://res.cloudinary.com/nehlbmp2/image/upload/v1793190459/sehatbuddy/articles/article-1.jpg';
  }
  if (trimmed.includes('article-2') || trimmed === '/src/assets/images/article-2.png' || trimmed.endsWith('/article-2.png')) {
    return 'https://res.cloudinary.com/nehlbmp2/image/upload/v1793190461/sehatbuddy/articles/article-2.jpg';
  }
  if (trimmed.includes('article-3') || trimmed === '/src/assets/images/article-3.png' || trimmed.endsWith('/article-3.png')) {
    return 'https://res.cloudinary.com/nehlbmp2/image/upload/v1793190462/sehatbuddy/articles/article-3.jpg';
  }
  if (trimmed.includes('article-4') || trimmed === '/src/assets/images/article-4.png' || trimmed.endsWith('/article-4.png')) {
    return 'https://res.cloudinary.com/nehlbmp2/image/upload/v1793190464/sehatbuddy/articles/article-4.jpg';
  }

  // 2. Doctor photos migration to Cloudinary CDN
  if (trimmed.includes('doctor-1') || trimmed === '/src/assets/images/doctor-1.png' || trimmed.endsWith('/doctor-1.png')) {
    return 'https://res.cloudinary.com/nehlbmp2/image/upload/v1793190466/sehatbuddy/doctors/doctor-1.jpg';
  }
  if (trimmed.includes('doctor-2') || trimmed === '/src/assets/images/doctor-2.png' || trimmed.endsWith('/doctor-2.png')) {
    return 'https://res.cloudinary.com/nehlbmp2/image/upload/v1793190467/sehatbuddy/doctors/doctor-2.jpg';
  }

  // 3. Hero image migration to Cloudinary CDN
  if (trimmed.includes('hero-family') || trimmed === '/src/assets/images/hero-family.jpg' || trimmed.endsWith('/hero-family.jpg')) {
    return 'https://res.cloudinary.com/nehlbmp2/image/upload/v1792239399/sehatbuddy/hero/i3g2e9ptcdydfnfeqf9c.jpg';
  }

  // 4. Services icons migration to Cloudinary CDN & public static
  if (trimmed.includes('stethoscope')) {
    return 'https://res.cloudinary.com/nehlbmp2/image/upload/v1793190495/sehatbuddy/services/stethoscope.jpg';
  }
  if (trimmed.includes('hospital.png')) {
    return 'https://res.cloudinary.com/nehlbmp2/image/upload/v1793190494/sehatbuddy/services/hospital.jpg';
  }
  if (trimmed.startsWith('/src/assets/images/icons/')) {
    return trimmed.replace('/src/assets/images/icons/', '/assets/images/icons/');
  }

  // 5. Avatars migration to Cloudinary CDN
  if (trimmed.includes('avatar-male') || trimmed.includes('default_doctor_male')) {
    return 'https://res.cloudinary.com/nehlbmp2/image/upload/v1792893957/sehatbuddy/avatars/default_doctor_male.png';
  }
  if (trimmed.includes('avatar-female') || trimmed.includes('default_doctor_female')) {
    return 'https://res.cloudinary.com/nehlbmp2/image/upload/v1792893958/sehatbuddy/avatars/default_doctor_female.jpg';
  }

  return trimmed;
};

// Robust helper to check if a doctor is included in a star_doctors list
export const isDoctorInStarList = (doctor, starList) => {
  if (!doctor || !Array.isArray(starList) || starList.length === 0) return false;
  return starList.some(sd => {
    if (!sd) return false;
    // If sd is an object
    if (typeof sd === 'object') {
      const sdId = sd._id || sd.id;
      const docId = doctor._id || doctor.id;
      if (sdId && docId && String(sdId).trim() === String(docId).trim()) return true;
      if (sd._id && doctor._id && String(sd._id).trim() === String(doctor._id).trim()) return true;
      if (sd.id && doctor.id && String(sd.id).trim() === String(doctor.id).trim()) return true;
      if (sd.email && doctor.email && sd.email.toLowerCase().trim() === doctor.email.toLowerCase().trim()) return true;
      if (sd.name && doctor.name && sd.name.toLowerCase().trim() === doctor.name.toLowerCase().trim()) return true;
      return matchesId(doctor, sd);
    }
    // If sd is a string or number
    const str = String(sd).trim().toLowerCase();
    if (doctor._id && String(doctor._id).toLowerCase().trim() === str) return true;
    if (doctor.id && String(doctor.id).toLowerCase().trim() === str) return true;
    if (doctor.email && doctor.email.toLowerCase().trim() === str) return true;
    if (doctor.name && doctor.name.toLowerCase().trim() === str) return true;
    return matchesId(doctor, sd);
  });
};

// Robust helper to check if a doctor belongs to or is affiliated with a specific hospital
export const isDoctorAffiliatedWithHospital = (doctor, hospital) => {
  if (!doctor || !hospital) return false;

  const currentHospitalName = String(hospital.name || '').toLowerCase().trim();
  const hospId = String(hospital._id || hospital.id || '').trim();

  // 1. Direct MongoDB ID / ObjectId match
  if (hospId) {
    if (doctor.hospitalId && String(doctor.hospitalId).trim() === hospId) return true;
    if (doctor.hospital_id && String(doctor.hospital_id).trim() === hospId) return true;
    if (doctor.hospital && String(doctor.hospital).trim() === hospId) return true;
  }

  // 2. Doctor is designated in hospital's star_doctors list
  if (Array.isArray(hospital.star_doctors) && isDoctorInStarList(doctor, hospital.star_doctors)) {
    return true;
  }

  // 3. Doctor's email is in hospital staff_emails or staff_doctors
  const docEmail = (doctor.email || '').toLowerCase().trim();
  if (docEmail) {
    if (Array.isArray(hospital.staff_emails) && hospital.staff_emails.some(e => (typeof e === 'string' ? e : e?.email)?.toLowerCase().trim() === docEmail)) {
      return true;
    }
    if (Array.isArray(hospital.staff_doctors) && hospital.staff_doctors.some(sd => (typeof sd === 'string' ? sd : sd?.email)?.toLowerCase().trim() === docEmail)) {
      return true;
    }
  }

  // 4. Doctor's hospital property name match
  const docHosp = String(doctor.hospital || '').toLowerCase().trim();
  if (!docHosp || !currentHospitalName) return false;

  // Exact match
  if (docHosp === currentHospitalName) return true;

  // Substring containment if both are non-trivial length
  if (docHosp.length > 5 && currentHospitalName.length > 5) {
    if (docHosp.includes(currentHospitalName) || currentHospitalName.includes(docHosp)) return true;
  }

  // Primary brand / root word comparison (e.g. "Manipal", "Fortis", "Apollo", "Aster", "S2 Health")
  const genericWords = new Set(['hospital', 'hospitals', 'super', 'speciality', 'specialty', 'center', 'centre', 'city', 'clinic', 'medical', 'care', 'healthcare', 'research', 'institute']);
  const clean = (s) => s.replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
  const docWords = clean(docHosp).split(' ').filter(w => w.length > 2 && !genericWords.has(w));
  const hospWords = clean(currentHospitalName).split(' ').filter(w => w.length > 2 && !genericWords.has(w));

  if (docWords.length > 0 && hospWords.length > 0) {
    if (docWords[0] === hospWords[0]) return true;
  }

  return false;
};

export const DataProvider = ({ children }) => {
  // 1. Doctors State (Fetched directly from DB / cached)
  const [doctors, setDoctors] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DOCTORS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Keep only authentic doctors with database ObjectIds (filter out legacy numeric mocks)
          const valid = parsed.filter(d => d && (d._id || (d.id && String(d.id).length > 5)));
          if (valid.length > 0) return valid;
        }
      }
    } catch {}
    return [];
  });

  // 2. Hospitals State (Fetched directly from DB / cached)
  const [hospitals, setHospitals] = useState(() => {
    try {
      localStorage.removeItem('sehat_buddy_hospitals_v2');
      localStorage.removeItem('sehat_buddy_hospitals_v3');
      const saved = localStorage.getItem(STORAGE_KEY_HOSPITALS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Keep only authentic hospitals with database ObjectIds (filter out legacy numeric mocks)
          const valid = parsed.filter(h => h && (h._id || (h.id && String(h.id).length > 5)));
          if (valid.length > 0) return valid;
        }
      }
    } catch {}
    return [];
  });

  // 3. Hero & Front Page General Content State
  const [heroContent, setHeroContent] = useState(() => {
    try {
      localStorage.removeItem('sehat_buddy_hero_v3');
      localStorage.removeItem('sehat_buddy_hero_v2');
      const savedV4 = localStorage.getItem(STORAGE_KEY_HERO);
      if (savedV4) {
        const parsed = JSON.parse(savedV4);
        if (parsed && typeof parsed === 'object') {
          parsed.heroImage = resolveMediaUrl(parsed.heroImage || initialHeroContent.heroImage);
          if (parsed.whyChooseVideoUrl === 'https://www.youtube.com/watch?v=zCCD52Pty4A') {
            parsed.whyChooseVideoUrl = '';
          }
          return { ...initialHeroContent, ...parsed };
        }
      }
    } catch (e) {
      console.error('Failed to parse heroContent from localStorage', e);
    }
    return initialHeroContent;
  });

  // 4. Services State
  const [services, setServices] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SERVICES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(s => ({ ...s, iconPath: resolveMediaUrl(s.iconPath) }));
        }
      }
    } catch (e) {}
    return initialServices;
  });

  // 5. Features ("Why Choose Us") State
  const [features, setFeatures] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FEATURES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item, idx) => ({
            id: item.id || idx + 1,
            title: item.title || 'Healthcare Feature',
            description: item.description || '',
            iconName: (typeof item.iconName === 'string' && item.iconName) || 'ShieldCheck'
          }));
        }
      }
    } catch (e) {}
    return [];
  });

  // 6. Articles & Health Content State
  const [articles, setArticles] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ARTICLES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(a => ({ ...a, image: resolveMediaUrl(a.image) }));
        }
      }
    } catch (e) {}
    return initialArticles;
  });

  // 7. Corporate Tie-ups & Enterprise Network State
  const [corporateTieups, setCorporateTieups] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CORPORATE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return initialCorporateTieups;
  });

  // 8. FAQs State
  const [faqs, setFaqs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FAQS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  // 8b. FAQ Symbols / Icons State
  const [faqSymbols, setFaqSymbols] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FAQ_SYMBOLS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  // 9. Public Reviews State
  const [reviews, setReviews] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_REVIEWS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  // 10. Specialities & Procedures State
  const [specialitiesProcedures, setSpecialitiesProcedures] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SPECIALITIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  // 11. Site Identity & Branding State
  const [branding, setBranding] = useState(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('sehat_buddy_branding_v2');
      }
      const saved = localStorage.getItem(STORAGE_KEY_BRANDING);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          if (!parsed.logoImage || parsed.logoType === 'default') {
            parsed.logoImage = '/logo.png';
            parsed.logoType = 'image';
          }
          if (parsed.favicon && (parsed.favicon.includes('M24.5 17.5') || parsed.favicon.includes('M9.5 15.5'))) {
            parsed.favicon = '/favicon.png';
          }
          return { ...initialBranding, ...parsed };
        }
      }
    } catch (e) {}
    return initialBranding;
  });

  // 12. Platform Contact Support Info State
  const [contactInfo, setContactInfo] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONTACT);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (Array.isArray(parsed.phones) || Array.isArray(parsed.emails))) {
          return parsed;
        }
      }
    } catch (e) {}
    return DEFAULT_CONTACT_INFO;
  });

  // 13. Platform Legal & Policy Documents (Privacy Policy & Terms and Conditions)
  const [legalPolicies, setLegalPolicies] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LEGAL);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.privacyPolicy || parsed.termsAndConditions)) {
          return { ...DEFAULT_LEGAL_POLICIES, ...parsed };
        }
      }
    } catch (e) {}
    return DEFAULT_LEGAL_POLICIES;
  });

  // Sanitizer for reels to ensure only healthy, active Instagram reels are served
  const sanitizeReels = (reelsList) => {
    if (!reelsList) return [];
    let list = reelsList;
    if (typeof reelsList === 'string') {
      list = reelsList.trim().split(/\s+/).filter(Boolean);
    }
    if (!Array.isArray(list)) return [];
    return list.map(r => {
      if (!r) return null;
      let url = typeof r === 'string' ? r.trim() : (r.url || r.link || '').trim();
      let coverPhoto = typeof r === 'object' ? (r.coverPhoto || r.cover || r.thumbnail || '') : '';
      if (!url && !coverPhoto) return null;
      return { url, coverPhoto };
    }).filter(Boolean);
  };

  // Helper mapping functions - strictly database-driven with safe merge
  const mapDoctorList = (docList, prevDoctors = []) => {
    if (!Array.isArray(docList) || docList.length === 0) {
      return prevDoctors;
    }
    const mapped = docList.map(d => {
      const existing = prevDoctors.find(p => matchesId(p, d));
      const rawSpec = (d.specialization && d.specialization !== 'General Medicine')
        ? d.specialization
        : ((d.specialty && d.specialty !== 'General Medicine') ? d.specialty : (d.specialization || d.specialty || existing?.specialization || existing?.specialty || 'General Physician'));
      const resolvedSpecialty = rawSpec || 'General Physician';
      const rawPrice = d.price !== undefined ? d.price : d.fees;
      const resolvedPrice = (rawPrice !== undefined && rawPrice !== null && !isNaN(Number(rawPrice)))
        ? Number(rawPrice)
        : (existing?.price ?? existing?.fees ?? 500);
      const resolvedPhone = d.phone || d.contact_number || existing?.phone || existing?.contact_number || '';
      const resolvedDegree = d.degree || d.qualifications || existing?.degree || existing?.qualifications || '';
      return {
        ...existing,
        ...d,
        id: d._id || d.id || existing?._id || existing?.id,
        _id: d._id || existing?._id || d.id,
        image: resolveMediaUrl(d.image || existing?.image || initialDoctors[0].image),
        phone: resolvedPhone,
        contact_number: resolvedPhone,
        degree: resolvedDegree,
        qualifications: resolvedDegree,
        specialty: resolvedSpecialty,
        specialization: resolvedSpecialty,
        price: resolvedPrice,
        fees: resolvedPrice,
        rating: d.rating !== undefined ? d.rating : existing?.rating,
        reviews: d.reviews !== undefined ? d.reviews : (existing?.reviews || '50+'),
        availabilityStatus: d.availabilityStatus || existing?.availabilityStatus || 'Available',
        statusUpdatedAt: Number(d.statusUpdatedAt || existing?.statusUpdatedAt || 0),
        experience: typeof d.experience === 'number' ? d.experience : (parseInt(String(d.experience || '').replace(/\D/g, ''), 10) || 5),
        jobTitle: d.jobTitle !== undefined ? d.jobTitle : (existing?.jobTitle || ''),
        licenseNumber: d.licenseNumber !== undefined ? d.licenseNumber : (existing?.licenseNumber || ''),
        profileCompletion: d.profileCompletion !== undefined ? Number(d.profileCompletion) : (existing?.profileCompletion || 0),
        isProfileComplete: d.isProfileComplete !== undefined ? Boolean(d.isProfileComplete) : Boolean(existing?.isProfileComplete),
        awards: Array.isArray(d.awards) ? d.awards : (Array.isArray(existing?.awards) ? existing.awards : []),
        certifications: Array.isArray(d.certifications) ? d.certifications : (Array.isArray(existing?.certifications) ? existing.certifications : []),
        memberships: Array.isArray(d.memberships) ? d.memberships : (Array.isArray(existing?.memberships) ? existing.memberships : []),
        careerExperience: Array.isArray(d.careerExperience) ? d.careerExperience : (Array.isArray(existing?.careerExperience) ? existing.careerExperience : []),
        faqs: (Array.isArray(d.faqs) && d.faqs.length > 0) ? d.faqs : (Array.isArray(existing?.faqs) ? existing.faqs : (Array.isArray(d.faqs) ? d.faqs : [])),
        tags: Array.isArray(d.tags) ? d.tags : (Array.isArray(existing?.tags) ? existing.tags : undefined),
        reels: sanitizeReels((Array.isArray(d.reels) && d.reels.length > 0) ? d.reels : (Array.isArray(existing?.reels) ? existing.reels : [])),
        youtube_videos: (Array.isArray(d.youtube_videos) && d.youtube_videos.length > 0) ? d.youtube_videos : (Array.isArray(existing?.youtube_videos) ? existing.youtube_videos : []),
        availableDays: formatDoctorAvailability(d) || formatDoctorAvailability(existing) || 'Mon - Sat (10:00 AM - 04:00 PM)',
        scheduleDays: (Array.isArray(d.scheduleDays) && d.scheduleDays.length > 0) ? d.scheduleDays : (Array.isArray(existing?.scheduleDays) ? existing.scheduleDays : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']),
        availableSlots: (Array.isArray(d.availableSlots) && d.availableSlots.length > 0) ? d.availableSlots : (Array.isArray(existing?.availableSlots) ? existing.availableSlots : ['04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM']),
        slotDuration: d.slotDuration || existing?.slotDuration || 20,
        dayWiseSlots: (d.dayWiseSlots && typeof d.dayWiseSlots === 'object') ? d.dayWiseSlots : (existing?.dayWiseSlots || {}),
        dateWiseSlots: (d.dateWiseSlots && typeof d.dateWiseSlots === 'object') ? d.dateWiseSlots : (existing?.dateWiseSlots || {}),
        slots_booked: { ...(existing?.slots_booked || {}), ...(d.slots_booked || {}) },
        isStarDoctor: (() => {
          const keepExisting = Number(existing?.starUpdatedAt || 0) > Number(d.starUpdatedAt || 0) && existing?.isStarDoctor !== undefined;
          return keepExisting ? Boolean(existing.isStarDoctor) : (d.isStarDoctor !== undefined ? Boolean(d.isStarDoctor) : Boolean(existing?.isStarDoctor));
        })(),
        starUpdatedAt: (Number(existing?.starUpdatedAt || 0) > Number(d.starUpdatedAt || 0) && existing?.isStarDoctor !== undefined)
          ? Number(existing.starUpdatedAt)
          : (d.starUpdatedAt !== undefined ? Number(d.starUpdatedAt) : Number(existing?.starUpdatedAt || 0))
      };
    });

    // Database is authoritative: never retain mock or deleted doctors
    return mapped;
  };

  const mapHospitalList = (hospList, prevHospitals = []) => {
    const mapped = hospList.map(h => {
      const existing = prevHospitals.find(p => matchesId(p, h));
      const rawReels = Array.isArray(h.reels)
        ? h.reels
        : (typeof h.reels === 'string' && h.reels.trim()
            ? (h.reels.includes('http') ? h.reels.trim().split(/\s+/).filter(u => u.startsWith('http')) : h.reels.split(',').map(s => s.trim()).filter(Boolean))
            : (existing?.reels || []));

      const rawVideos = Array.isArray(h.youtube_videos)
        ? h.youtube_videos
        : (typeof h.youtube_videos === 'string' && h.youtube_videos.trim()
            ? (h.youtube_videos.includes('http') ? h.youtube_videos.trim().split(/\s+/).filter(u => u.startsWith('http')) : h.youtube_videos.split(',').map(s => s.trim()).filter(Boolean))
            : (existing?.youtube_videos || []));

      return {
        ...existing,
        ...h,
        id: String(h._id || h.id || existing?._id || existing?.id || ''),
        _id: h._id || existing?._id || h.id,
        profileCompletion: h.profileCompletion !== undefined ? Number(h.profileCompletion) : (existing?.profileCompletion !== undefined ? Number(existing.profileCompletion) : 0),
        specialties: (Array.isArray(h.specialities || h.specialties) && (h.specialities || h.specialties).length > 0)
          ? (h.specialities || h.specialties)
          : (existing?.specialties || existing?.specialities || []),
        reels: sanitizeReels(rawReels),
        youtube_videos: rawVideos.map(v => typeof v === 'string' ? { url: v.trim(), coverPhoto: '' } : { url: v?.url || '', coverPhoto: v?.coverPhoto || '' }),
        photos: (Array.isArray(h.photos) && h.photos.length > 0) ? h.photos : (existing?.photos || []),
        star_doctors: Array.isArray(h.star_doctors) ? h.star_doctors : (Array.isArray(existing?.star_doctors) ? existing.star_doctors : []),
        totalBeds: h.totalBeds !== undefined && h.totalBeds !== null ? Number(h.totalBeds) : (existing?.totalBeds !== undefined ? Number(existing.totalBeds) : 100),
        availableBeds: h.availableBeds !== undefined && h.availableBeds !== null ? Number(h.availableBeds) : (h.emptyBeds !== undefined && h.emptyBeds !== null ? Number(h.emptyBeds) : (existing?.availableBeds !== undefined ? Number(existing.availableBeds) : 24)),
        emptyBeds: h.availableBeds !== undefined && h.availableBeds !== null ? Number(h.availableBeds) : (h.emptyBeds !== undefined && h.emptyBeds !== null ? Number(h.emptyBeds) : (existing?.emptyBeds !== undefined ? Number(existing.emptyBeds) : 24)),
        cashlessInsurance: h.cashlessInsurance !== undefined ? Boolean(h.cashlessInsurance) : (existing?.cashlessInsurance ?? true),
        acceptedInsurances: (Array.isArray(h.acceptedInsurances) && h.acceptedInsurances.length > 0) ? h.acceptedInsurances : (existing?.acceptedInsurances || []),
        tpaHelpdesk: h.tpaHelpdesk || existing?.tpaHelpdesk || {
          phone: h.phone || '080-45678900',
          email: 'tpa@' + (h.email ? h.email.split('@')[1] : 'sehatbuddy.com'),
          preAuthTime: '30 Mins Cashless Pre-Approval'
        },
        insuranceHelpline: h.insuranceHelpline || existing?.insuranceHelpline || '1800-SEHAT-CARE',
        showOnHome: (Number(existing?.homeUpdatedAt || 0) > Number(h.homeUpdatedAt || 0) && existing?.showOnHome !== undefined)
          ? Boolean(existing.showOnHome)
          : (h.showOnHome !== undefined ? Boolean(h.showOnHome) : (existing?.showOnHome ?? true)),
        homeUpdatedAt: (Number(existing?.homeUpdatedAt || 0) > Number(h.homeUpdatedAt || 0) && existing?.showOnHome !== undefined)
          ? Number(existing.homeUpdatedAt)
          : (h.homeUpdatedAt !== undefined ? Number(h.homeUpdatedAt) : Number(existing?.homeUpdatedAt || 0))
      };
    });
    // Authoritative database data: never retain deleted or mock hospitals
    return mapped;
  };

  // Modular real-time refresh operations directly from MongoDB Atlas
  const refreshDoctors = useCallback(async () => {
    try {
      const data = await api.getDoctors();
      if (Array.isArray(data) && data.length > 0) {
        setDoctors(prev => {
          const mapped = mapDoctorList(data, prev);
          if (JSON.stringify(prev) === JSON.stringify(mapped)) {
            return prev;
          }
          try {
            localStorage.setItem(STORAGE_KEY_DOCTORS, JSON.stringify(mapped));
            broadcastSync(STORAGE_KEY_DOCTORS, mapped);
          } catch {}
          return mapped;
        });
      }
    } catch {}
  }, []);

  const refreshHospitals = useCallback(async () => {
    try {
      const data = await api.getHospitals();
      if (Array.isArray(data)) {
        setHospitals(prev => {
          const mapped = mapHospitalList(data, prev);
          if (JSON.stringify(prev) === JSON.stringify(mapped)) {
            return prev;
          }
          try {
            localStorage.setItem(STORAGE_KEY_HOSPITALS, JSON.stringify(mapped));
            broadcastSync(STORAGE_KEY_HOSPITALS, mapped);
          } catch {}
          return mapped;
        });
      }
    } catch {}
  }, []);

  const refreshContent = useCallback(async () => {
    try {
      const data = await api.getContent();
      if (data) {
        const { hero, services: sList, features: fList, articles: aList, corporate: cList, branding: bData, contact: contactData, legal_policies: legalData } = data;
        if (hero && typeof hero === 'object') {
          setHeroContent(prev => {
            const cleanHero = { ...hero };
            cleanHero.heroImage = resolveMediaUrl(cleanHero.heroImage || prev?.heroImage);
            if (cleanHero.whyChooseVideoUrl === 'https://www.youtube.com/watch?v=zCCD52Pty4A') {
              cleanHero.whyChooseVideoUrl = '';
            }
            return isSame(prev, cleanHero) ? prev : cleanHero;
          });
        }
        if (bData && typeof bData === 'object') {
          setBranding(prev => (isSame(prev, { ...prev, ...bData }) ? prev : { ...prev, ...bData }));
        }
        if (Array.isArray(sList)) {
          const mappedServices = sList.map(s => ({ ...s, iconPath: resolveMediaUrl(s.iconPath) }));
          setServices(prev => (isSame(prev, mappedServices) ? prev : mappedServices));
        }
        if (Array.isArray(fList)) {
          setFeatures(prev => (isSame(prev, fList) ? prev : fList));
        }
        if (Array.isArray(aList)) {
          const mappedArticles = aList.map(a => ({ ...a, image: resolveMediaUrl(a.image) }));
          setArticles(prev => (isSame(prev, mappedArticles) ? prev : mappedArticles));
        }
        if (Array.isArray(cList)) {
          setCorporateTieups(prev => (isSame(prev, cList) ? prev : cList));
          try {
            localStorage.setItem(STORAGE_KEY_CORPORATE, JSON.stringify(cList));
          } catch {}
        }
        if (contactData && typeof contactData === 'object') {
          setContactInfo(prev => {
            const next = { ...prev, ...contactData };
            try {
              localStorage.setItem(STORAGE_KEY_CONTACT, JSON.stringify(next));
              broadcastSync(STORAGE_KEY_CONTACT, next);
            } catch {}
            return isSame(prev, next) ? prev : next;
          });
        }
        if (legalData && typeof legalData === 'object') {
          setLegalPolicies(prev => {
            const next = { ...prev, ...legalData };
            try {
              localStorage.setItem(STORAGE_KEY_LEGAL, JSON.stringify(next));
              broadcastSync(STORAGE_KEY_LEGAL, next);
            } catch {}
            return isSame(prev, next) ? prev : next;
          });
        }
      }
    } catch {}
  }, []);

  const refreshFaqs = useCallback(async () => {
    try {
      const data = await api.getFaqs();
      if (Array.isArray(data)) {
        const clean = data.map(f => ({ ...f, id: f._id || f.id }));
        setFaqs(clean);
        try {
          localStorage.setItem(STORAGE_KEY_FAQS, JSON.stringify(clean));
        } catch {}
      }
    } catch {}
  }, []);

  const refreshFaqSymbols = useCallback(async () => {
    try {
      const data = await api.getFaqSymbols();
      if (Array.isArray(data)) {
        setFaqSymbols(data.map(s => ({ ...s, id: s._id || s.id })));
      }
    } catch {}
  }, []);

  const refreshReviews = useCallback(async () => {
    try {
      const data = await api.getReviews();
      if (Array.isArray(data)) {
        setReviews(data.map(r => ({ ...r, id: r._id || r.id })));
      }
    } catch {}
  }, []);

  const refreshSpecialities = useCallback(async () => {
    try {
      const data = await api.getSpecialitiesProcedures();
      if (Array.isArray(data)) {
        setSpecialitiesProcedures(data.map(s => ({ ...s, id: s._id || s.id })));
      }
    } catch {}
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.allSettled([
      refreshDoctors(),
      refreshHospitals(),
      refreshContent(),
      refreshFaqs(),
      refreshFaqSymbols(),
      refreshReviews(),
      refreshSpecialities()
    ]);
  }, [refreshDoctors, refreshHospitals, refreshContent, refreshFaqs, refreshFaqSymbols, refreshReviews, refreshSpecialities]);

  // Zero-latency real-time synchronization via Server-Sent Events (SSE)
  useEffect(() => {
    let eventSource = null;
    let retryTimer = null;
    let isMounted = true;

    // Initial immediate fetch
    refreshAll();

    const connectRealtimeSSE = () => {
      if (!isMounted) return;
      try {
        eventSource = new EventSource(`${API_BASE}/realtime-stream`);

        eventSource.addEventListener('connected', () => {
          // SSE Handshake active
        });

        eventSource.addEventListener('db_change', (e) => {
          if (!e.data || !isMounted) return;
          try {
            const payload = JSON.parse(e.data);
            const { collection } = payload;

            // Broadcast global window events for dashboards and views
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('sehat_db_change', { detail: payload }));
              if (collection === 'appointments') {
                window.dispatchEvent(new CustomEvent('sehat_appointments_changed', { detail: payload }));
              }
            }

            // Instant targeted update based on modified collection
            if (collection === 'doctors') {
              if (payload.operation === 'delete' && (payload.docId || payload.fullDocument?.email)) {
                const deletedEmail = (payload.fullDocument?.email || '').toLowerCase().trim();
                const deletedId = payload.docId;
                setDoctors(prev => {
                  const updated = prev.filter(d => {
                    if (deletedId && matchesId(d, deletedId)) return false;
                    if (deletedEmail && (d.email || '').toLowerCase().trim() === deletedEmail) return false;
                    return true;
                  });
                  try {
                    localStorage.setItem(STORAGE_KEY_DOCTORS, JSON.stringify(updated));
                    broadcastSync(STORAGE_KEY_DOCTORS, updated);
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('sehat_doctors_updated', { detail: updated }));
                    }
                  } catch {}
                  return updated;
                });

                if (typeof window !== 'undefined') {
                  const delDetail = {
                    id: deletedId,
                    email: deletedEmail,
                    timestamp: Date.now()
                  };
                  window.dispatchEvent(new CustomEvent('sehat_doctor_deleted', { detail: delDetail }));
                  broadcastSync('sehat_doctor_deleted', delDetail);
                }
              } else if (payload.docId && payload.fullDocument) {
                const docData = payload.fullDocument;
                const rawSpec = (docData.specialization && docData.specialization !== 'General Medicine')
                  ? docData.specialization
                  : ((docData.specialty && docData.specialty !== 'General Medicine') ? docData.specialty : (docData.specialization || docData.specialty));
                const deg = docData.degree || docData.qualifications;
                const pr = (docData.fees !== undefined && docData.fees !== 500)
                  ? docData.fees
                  : (docData.price !== undefined && docData.price !== 500
                    ? docData.price
                    : (docData.fees ?? docData.price));
                const exp = docData.experience !== undefined ? docData.experience : undefined;
                const hosp = docData.hospital;
                const nm = docData.name;
                const rtg = docData.rating !== undefined ? parseFloat(docData.rating) || docData.rating : undefined;
                const revs = docData.reviews !== undefined ? docData.reviews : undefined;
                const avDays = docData.availableDays !== undefined ? docData.availableDays : undefined;
                const avStatus = docData.availabilityStatus !== undefined ? docData.availabilityStatus : undefined;
                const avBool = docData.available !== undefined ? docData.available : undefined;
                const ph = docData.phone !== undefined ? docData.phone : (docData.contact_number !== undefined ? docData.contact_number : undefined);

                setDoctors(prev => {
                  let found = false;
                  let hasDiff = false;
                  const updated = prev.map(d => {
                    if (matchesId(d, payload.docId) || (d.email && docData.email && d.email.toLowerCase().trim() === docData.email.toLowerCase().trim())) {
                      found = true;
                      const resolvedPh = ph !== undefined ? ph : (d.phone || d.contact_number || '');
                      const currentStarTs = Number(d.starUpdatedAt || 0);
                      const incomingStarTs = Number(docData.starUpdatedAt || 0);
                      const keepCurrentStar = currentStarTs > incomingStarTs && d.isStarDoctor !== undefined;
                      const nextStar = keepCurrentStar
                        ? Boolean(d.isStarDoctor)
                        : (docData.isStarDoctor !== undefined ? Boolean(docData.isStarDoctor) : Boolean(d.isStarDoctor));
                      const nextStarTs = keepCurrentStar
                        ? currentStarTs
                        : (incomingStarTs || currentStarTs || 0);

                      const candidate = {
                        ...d,
                        ...docData,
                        id: d.id || docData.id || docData._id,
                        _id: docData._id || d._id || docData.id,
                        name: nm ? String(nm).trim() : d.name,
                        phone: resolvedPh,
                        contact_number: resolvedPh,
                        specialty: rawSpec || d.specialization || d.specialty,
                        specialization: rawSpec || d.specialization || d.specialty,
                        hospital: hosp !== undefined ? hosp : d.hospital,
                        experience: exp !== undefined ? exp : d.experience,
                        degree: deg || d.degree || d.qualifications,
                        qualifications: deg || d.qualifications || d.degree,
                        price: pr !== undefined ? pr : (d.price ?? d.fees),
                        fees: pr !== undefined ? pr : (d.fees ?? d.price),
                        rating: rtg !== undefined ? rtg : d.rating,
                        reviews: revs !== undefined ? revs : d.reviews,
                        availableDays: avDays !== undefined ? formatDoctorAvailability({ ...d, ...docData, availableDays: avDays }) : d.availableDays,
                        availabilityStatus: avStatus !== undefined ? avStatus : d.availabilityStatus,
                        available: avBool !== undefined ? avBool : d.available,
                        scheduleDays: docData.scheduleDays !== undefined ? docData.scheduleDays : d.scheduleDays,
                        availableSlots: docData.availableSlots !== undefined ? docData.availableSlots : d.availableSlots,
                        slotDuration: docData.slotDuration !== undefined ? docData.slotDuration : d.slotDuration,
                        dayWiseSlots: docData.dayWiseSlots !== undefined ? docData.dayWiseSlots : d.dayWiseSlots,
                        dateWiseSlots: docData.dateWiseSlots !== undefined ? docData.dateWiseSlots : d.dateWiseSlots,
                        tags: Array.isArray(docData.tags) ? docData.tags : d.tags,
                        about: docData.about !== undefined ? docData.about : d.about,
                        awards: Array.isArray(docData.awards) ? docData.awards : d.awards,
                        certifications: Array.isArray(docData.certifications) ? docData.certifications : d.certifications,
                        memberships: Array.isArray(docData.memberships) ? docData.memberships : d.memberships,
                        careerExperience: Array.isArray(docData.careerExperience) ? docData.careerExperience : d.careerExperience,
                        faqs: Array.isArray(docData.faqs) ? docData.faqs : (Array.isArray(d.faqs) ? d.faqs : []),
                        reels: Array.isArray(docData.reels) ? docData.reels : d.reels,
                        youtube_videos: Array.isArray(docData.youtube_videos) ? docData.youtube_videos : d.youtube_videos,
                        jobTitle: docData.jobTitle !== undefined ? docData.jobTitle : (d.jobTitle || ''),
                        licenseNumber: docData.licenseNumber !== undefined ? docData.licenseNumber : (d.licenseNumber || ''),
                        profileCompletion: docData.profileCompletion !== undefined ? Number(docData.profileCompletion) : d.profileCompletion,
                        isProfileComplete: docData.isProfileComplete !== undefined ? Boolean(docData.isProfileComplete) : d.isProfileComplete,
                        isStarDoctor: nextStar,
                        starUpdatedAt: nextStarTs
                      };

                      const isDifferent = Object.keys(candidate).some(k => {
                        if (k === 'updatedAt' || k === '__v') return false;
                        if (typeof candidate[k] === 'object' && candidate[k] !== null) {
                          return JSON.stringify(candidate[k]) !== JSON.stringify(d[k]);
                        }
                        return candidate[k] !== d[k];
                      });

                      if (isDifferent) {
                        hasDiff = true;
                        return candidate;
                      }
                      return d;
                    }
                    return d;
                  });
                  if (!found && (payload.operation === 'insert' || payload.operation === 'create')) {
                    const newEntry = {
                      ...docData,
                      id: docData._id || docData.id,
                      _id: docData._id || docData.id,
                      specialty: rawSpec || 'General Physician',
                      specialization: rawSpec || 'General Physician',
                      degree: deg || '',
                      qualifications: deg || '',
                      price: pr || 500,
                      fees: pr || 500,
                      rating: rtg !== undefined ? rtg : 0,
                      reviews: revs !== undefined ? revs : '0',
                      availableDays: formatDoctorAvailability(docData) || 'Mon - Sat (10:00 AM - 04:00 PM)',
                      availabilityStatus: avStatus || 'Available',
                      available: avBool !== undefined ? avBool : true,
                      faqs: Array.isArray(docData.faqs) ? docData.faqs : [],
                      phone: ph !== undefined ? ph : (docData.phone || docData.contact_number || ''),
                      contact_number: ph !== undefined ? ph : (docData.contact_number || docData.phone || ''),
                      profileCompletion: docData.profileCompletion !== undefined ? Number(docData.profileCompletion) : 0,
                      isProfileComplete: Boolean(docData.isProfileComplete),
                      isStarDoctor: Boolean(docData.isStarDoctor)
                    };
                    const updatedWithNew = [newEntry, ...prev];
                    try {
                      localStorage.setItem(STORAGE_KEY_DOCTORS, JSON.stringify(updatedWithNew));
                      broadcastSync(STORAGE_KEY_DOCTORS, updatedWithNew);
                    } catch {}
                    return updatedWithNew;
                  }
                  if (!hasDiff) return prev;
                  try {
                    localStorage.setItem(STORAGE_KEY_DOCTORS, JSON.stringify(updated));
                    broadcastSync(STORAGE_KEY_DOCTORS, updated);

                    const currentDocUserStr = localStorage.getItem('doctor_user');
                    if (currentDocUserStr) {
                      const currentDocUser = JSON.parse(currentDocUserStr);
                      const matchingUpdated = updated.find(d => matchesId(d, currentDocUser));
                      if (matchingUpdated) {
                        localStorage.setItem('doctor_user', JSON.stringify({ ...currentDocUser, ...matchingUpdated }));
                      }
                    }

                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('sehat_doctors_updated', { detail: updated }));
                    }
                  } catch {}
                  return updated;
                });
              } else {
                refreshDoctors();
              }
            } else if (collection === 'hospitals') {
              if (payload.operation === 'delete' && payload.docId) {
                setHospitals(prev => {
                  const updated = prev.filter(h => !matchesId(h, payload.docId));
                  try {
                    localStorage.setItem(STORAGE_KEY_HOSPITALS, JSON.stringify(updated));
                    broadcastSync(STORAGE_KEY_HOSPITALS, updated);
                  } catch {}
                  return updated;
                });
              } else if (payload.docId && payload.fullDocument) {
                const hospData = payload.fullDocument;
                setHospitals(prev => {
                  let hasDiff = false;
                  const updated = prev.map(h => {
                    if (matchesId(h, payload.docId)) {
                      const currentHomeTs = Number(h.homeUpdatedAt || 0);
                      const incomingHomeTs = Number(hospData.homeUpdatedAt || 0);
                      const keepCurrentHome = currentHomeTs > incomingHomeTs && h.showOnHome !== undefined;
                      const nextHome = keepCurrentHome
                        ? Boolean(h.showOnHome)
                        : (hospData.showOnHome !== undefined ? Boolean(hospData.showOnHome) : (h.showOnHome ?? true));
                      const nextHomeTs = keepCurrentHome
                        ? currentHomeTs
                        : (incomingHomeTs || currentHomeTs || 0);

                      const candidate = {
                        ...h,
                        ...hospData,
                        id: h.id || hospData.id || hospData._id,
                        _id: hospData._id || h._id || hospData.id,
                        showOnHome: nextHome,
                        homeUpdatedAt: nextHomeTs
                      };
                      if (JSON.stringify(candidate) !== JSON.stringify(h)) {
                        hasDiff = true;
                        return candidate;
                      }
                      return h;
                    }
                    return h;
                  });
                  if (!hasDiff) return prev;
                  try {
                    localStorage.setItem(STORAGE_KEY_HOSPITALS, JSON.stringify(updated));
                    broadcastSync(STORAGE_KEY_HOSPITALS, updated);
                  } catch {}
                  return updated;
                });
              } else {
                refreshHospitals();
              }
            } else if (collection === 'contents') {
              if (payload.fullDocument?.type && payload.fullDocument?.data) {
                const { type, data } = payload.fullDocument;
                if (type === 'hero' && data && typeof data === 'object') {
                  setHeroContent(prev => {
                    const clean = { ...prev, ...data };
                    clean.heroImage = resolveMediaUrl(clean.heroImage || prev?.heroImage);
                    if (clean.whyChooseVideoUrl === 'https://www.youtube.com/watch?v=zCCD52Pty4A') {
                      clean.whyChooseVideoUrl = '';
                    }
                    try {
                      localStorage.setItem(STORAGE_KEY_HERO, JSON.stringify(clean));
                      broadcastSync(STORAGE_KEY_HERO, clean);
                    } catch {}
                    return clean;
                  });
                } else if (type === 'services' && Array.isArray(data)) {
                  const mapped = data.map(s => ({ ...s, iconPath: resolveMediaUrl(s.iconPath) }));
                  setServices(mapped);
                  try {
                    localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(mapped));
                    broadcastSync(STORAGE_KEY_SERVICES, mapped);
                  } catch {}
                } else if (type === 'features' && Array.isArray(data)) {
                  setFeatures(data);
                  try {
                    localStorage.setItem(STORAGE_KEY_FEATURES, JSON.stringify(data));
                    broadcastSync(STORAGE_KEY_FEATURES, data);
                  } catch {}
                } else if (type === 'articles' && Array.isArray(data)) {
                  const mapped = data.map(a => ({ ...a, image: resolveMediaUrl(a.image) }));
                  setArticles(mapped);
                  try {
                    localStorage.setItem(STORAGE_KEY_ARTICLES, JSON.stringify(mapped));
                    broadcastSync(STORAGE_KEY_ARTICLES, mapped);
                  } catch {}
                } else if (type === 'branding' && data && typeof data === 'object') {
                  setBranding(prev => {
                    const merged = { ...prev, ...data };
                    try {
                      localStorage.setItem(STORAGE_KEY_BRANDING, JSON.stringify(merged));
                      broadcastSync(STORAGE_KEY_BRANDING, merged);
                    } catch {}
                    return merged;
                  });
                } else if (type === 'corporate') {
                  const safeData = Array.isArray(data) ? data : (data && typeof data === 'object' ? [data] : []);
                  setCorporateTieups(prev => (isSame(prev, safeData) ? prev : safeData));
                  try {
                    localStorage.setItem(STORAGE_KEY_CORPORATE, JSON.stringify(safeData));
                    broadcastSync(STORAGE_KEY_CORPORATE, safeData);
                  } catch {}
                } else if (type === 'contact' && data && typeof data === 'object') {
                  setContactInfo(prev => {
                    const safeContact = { ...prev, ...data };
                    try {
                      localStorage.setItem(STORAGE_KEY_CONTACT, JSON.stringify(safeContact));
                      broadcastSync(STORAGE_KEY_CONTACT, safeContact);
                    } catch {}
                    return isSame(prev, safeContact) ? prev : safeContact;
                  });
                } else if (type === 'legal_policies' && data && typeof data === 'object') {
                  setLegalPolicies(prev => {
                    const safeLegal = { ...prev, ...data };
                    try {
                      localStorage.setItem(STORAGE_KEY_LEGAL, JSON.stringify(safeLegal));
                      broadcastSync(STORAGE_KEY_LEGAL, safeLegal);
                    } catch {}
                    return isSame(prev, safeLegal) ? prev : safeLegal;
                  });
                }
              }
            } else if (collection === 'corporates') {
              if (payload.action === 'delete' && payload.docId === 'all') {
                setCorporateTieups(prev => (prev.length === 0 ? prev : []));
                try {
                  localStorage.setItem(STORAGE_KEY_CORPORATE, JSON.stringify([]));
                  broadcastSync(STORAGE_KEY_CORPORATE, []);
                } catch {}
              } else if (Array.isArray(payload.data)) {
                setCorporateTieups(prev => (isSame(prev, payload.data) ? prev : payload.data));
                try {
                  localStorage.setItem(STORAGE_KEY_CORPORATE, JSON.stringify(payload.data));
                  broadcastSync(STORAGE_KEY_CORPORATE, payload.data);
                } catch {}
              }
            } else if (collection === 'faqs') {
              if (payload.operation === 'delete' || payload.action === 'delete') {
                const targetDocId = payload.docId || payload.id;
                if (targetDocId) {
                  setFaqs(prev => {
                    const exists = prev.some(f => matchesId(f, targetDocId));
                    if (!exists) return prev;
                    const updated = prev.filter(f => !matchesId(f, targetDocId));
                    try {
                      localStorage.setItem(STORAGE_KEY_FAQS, JSON.stringify(updated));
                      lastSyncRef.current[STORAGE_KEY_FAQS] = JSON.stringify(updated);
                      broadcastSync(STORAGE_KEY_FAQS, updated);
                    } catch {}
                    return updated;
                  });
                }
              } else if (payload.docId && payload.fullDocument) {
                setFaqs(prev => {
                  const targetDocId = payload.docId || payload.fullDocument._id || payload.fullDocument.id;
                  const exists = prev.some(f => matchesId(f, targetDocId));
                  if (exists) {
                    const cur = prev.find(f => matchesId(f, targetDocId));
                    const candidate = { ...cur, ...payload.fullDocument, id: targetDocId, _id: targetDocId };
                    if (JSON.stringify(cur) === JSON.stringify(candidate)) {
                      return prev;
                    }
                    const updated = prev.map(f => matchesId(f, targetDocId) ? candidate : f);
                    try {
                      localStorage.setItem(STORAGE_KEY_FAQS, JSON.stringify(updated));
                      lastSyncRef.current[STORAGE_KEY_FAQS] = JSON.stringify(updated);
                      broadcastSync(STORAGE_KEY_FAQS, updated);
                    } catch {}
                    return updated;
                  }
                  const newFaq = { ...payload.fullDocument, id: targetDocId, _id: targetDocId };
                  const updated = [newFaq, ...prev];
                  try {
                    localStorage.setItem(STORAGE_KEY_FAQS, JSON.stringify(updated));
                    lastSyncRef.current[STORAGE_KEY_FAQS] = JSON.stringify(updated);
                    broadcastSync(STORAGE_KEY_FAQS, updated);
                  } catch {}
                  return updated;
                });
              } else {
                refreshFaqs();
              }
            } else if (collection === 'faq_symbols' || collection === 'faqsymbols') {
              refreshFaqSymbols();
            } else if (collection === 'reviews') {
              if (payload.operation === 'delete' || payload.action === 'delete') {
                const targetDocId = payload.docId || payload.id;
                if (targetDocId) {
                  setReviews(prev => {
                    const exists = prev.some(r => matchesId(r, targetDocId));
                    if (!exists) return prev;
                    const updated = prev.filter(r => !matchesId(r, targetDocId));
                    try {
                      localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(updated));
                      lastSyncRef.current[STORAGE_KEY_REVIEWS] = JSON.stringify(updated);
                      broadcastSync(STORAGE_KEY_REVIEWS, updated);
                    } catch {}
                    return updated;
                  });
                }
              } else if (payload.docId && payload.fullDocument) {
                setReviews(prev => {
                  const exists = prev.some(r => matchesId(r, payload.docId));
                  if (exists) {
                    const cur = prev.find(r => matchesId(r, payload.docId));
                    const candidate = { ...cur, ...payload.fullDocument };
                    if (JSON.stringify(cur) === JSON.stringify(candidate)) {
                      return prev;
                    }
                    const updated = prev.map(r => matchesId(r, payload.docId) ? candidate : r);
                    try {
                      localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(updated));
                      lastSyncRef.current[STORAGE_KEY_REVIEWS] = JSON.stringify(updated);
                      broadcastSync(STORAGE_KEY_REVIEWS, updated);
                    } catch {}
                    return updated;
                  }
                  const updated = [{ ...payload.fullDocument, id: payload.docId }, ...prev];
                  try {
                    localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(updated));
                    lastSyncRef.current[STORAGE_KEY_REVIEWS] = JSON.stringify(updated);
                    broadcastSync(STORAGE_KEY_REVIEWS, updated);
                  } catch {}
                  return updated;
                });
              } else {
                refreshReviews();
              }
            } else if (collection === 'specialityprocedures') {
              refreshSpecialities();
            } else if (collection === 'appointments') {
              // Notification event already dispatched
            } else {
              refreshAll();
            }
          } catch (err) {
            console.error('Error parsing db_change payload:', err);
          }
        });

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          if (isMounted) {
            retryTimer = setTimeout(connectRealtimeSSE, 3000);
          }
        };
      } catch {
        if (isMounted) {
          retryTimer = setTimeout(connectRealtimeSSE, 5000);
        }
      }
    };

    connectRealtimeSSE();

    // Fallback periodic heartbeat polling (every 20 seconds when document is visible)
    const intervalId = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible' && isMounted) {
        refreshAll();
      }
    }, 20000);

    return () => {
      isMounted = false;
      if (retryTimer) clearTimeout(retryTimer);
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      clearInterval(intervalId);
    };
  }, []);

  // Real-time inter-tab receiver (BroadcastChannel + storage events with loop prevention)
  useEffect(() => {
    const isSame = (prev, next) => JSON.stringify(prev) === JSON.stringify(next);

    const handleBroadcastMessage = (event) => {
      const { type, senderTabId, key, data } = event.data || {};
      if (type !== 'SEHAT_SYNC' || !data || senderTabId === CURRENT_TAB_ID) return;

      if (key === STORAGE_KEY_DOCTORS && Array.isArray(data) && data.length > 0) {
        setDoctors(prev => (isSame(prev, data) ? prev : data));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('sehat_doctors_updated', { detail: data }));
        }
      }
      else if (key === STORAGE_KEY_HOSPITALS && Array.isArray(data) && data.length > 0) setHospitals(prev => (isSame(prev, data) ? prev : data));
      else if (key === STORAGE_KEY_BRANDING && typeof data === 'object') setBranding(prev => (isSame(prev, data) ? prev : data));
      else if (key === STORAGE_KEY_HERO && typeof data === 'object') setHeroContent(prev => (isSame(prev, data) ? prev : data));
      else if (key === STORAGE_KEY_SERVICES && Array.isArray(data)) setServices(prev => (isSame(prev, data) ? prev : data));
      else if (key === STORAGE_KEY_FEATURES && Array.isArray(data)) setFeatures(prev => (isSame(prev, data) ? prev : data));
      else if (key === STORAGE_KEY_ARTICLES && Array.isArray(data)) setArticles(prev => (isSame(prev, data) ? prev : data));
      else if (key === STORAGE_KEY_CORPORATE && Array.isArray(data)) setCorporateTieups(prev => (isSame(prev, data) ? prev : data));
      else if (key === STORAGE_KEY_FAQS && Array.isArray(data)) setFaqs(prev => (isSame(prev, data) ? prev : data));
      else if (key === STORAGE_KEY_FAQ_SYMBOLS && Array.isArray(data)) setFaqSymbols(prev => (isSame(prev, data) ? prev : data));
      else if (key === STORAGE_KEY_REVIEWS && Array.isArray(data)) setReviews(prev => (isSame(prev, data) ? prev : data));
      else if (key === STORAGE_KEY_SPECIALITIES && Array.isArray(data)) setSpecialitiesProcedures(prev => (isSame(prev, data) ? prev : data));
      else if (key === STORAGE_KEY_CONTACT && typeof data === 'object') setContactInfo(prev => (isSame(prev, data) ? prev : data));
      else if (key === STORAGE_KEY_LEGAL && typeof data === 'object') setLegalPolicies(prev => (isSame(prev, data) ? prev : data));
    };

    if (broadcastChan) {
      broadcastChan.addEventListener('message', handleBroadcastMessage);
    }

    const handleStorageEvent = (e) => {
      if (!e.key || !e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue);
        if (e.key === STORAGE_KEY_DOCTORS && Array.isArray(parsed) && parsed.length > 0) {
          setDoctors(prev => (isSame(prev, parsed) ? prev : parsed));
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('sehat_doctors_updated', { detail: parsed }));
          }
        }
        else if (e.key === STORAGE_KEY_HOSPITALS && Array.isArray(parsed) && parsed.length > 0) setHospitals(prev => (isSame(prev, parsed) ? prev : parsed));
        else if (e.key === STORAGE_KEY_BRANDING) setBranding(prev => (isSame(prev, parsed) ? prev : parsed));
        else if (e.key === STORAGE_KEY_HERO) setHeroContent(prev => (isSame(prev, parsed) ? prev : parsed));
        else if (e.key === STORAGE_KEY_SERVICES && Array.isArray(parsed)) setServices(prev => (isSame(prev, parsed) ? prev : parsed));
        else if (e.key === STORAGE_KEY_FEATURES && Array.isArray(parsed)) setFeatures(prev => (isSame(prev, parsed) ? prev : parsed));
        else if (e.key === STORAGE_KEY_ARTICLES && Array.isArray(parsed)) setArticles(prev => (isSame(prev, parsed) ? prev : parsed));
        else if (e.key === STORAGE_KEY_CORPORATE && Array.isArray(parsed)) setCorporateTieups(prev => (isSame(prev, parsed) ? prev : parsed));
        else if (e.key === STORAGE_KEY_FAQS && Array.isArray(parsed)) setFaqs(prev => (isSame(prev, parsed) ? prev : parsed));
        else if (e.key === STORAGE_KEY_FAQ_SYMBOLS && Array.isArray(parsed)) setFaqSymbols(prev => (isSame(prev, parsed) ? prev : parsed));
        else if (e.key === STORAGE_KEY_REVIEWS && Array.isArray(parsed)) setReviews(prev => (isSame(prev, parsed) ? prev : parsed));
        else if (e.key === STORAGE_KEY_SPECIALITIES && Array.isArray(parsed)) setSpecialitiesProcedures(prev => (isSame(prev, parsed) ? prev : parsed));
        else if (e.key === STORAGE_KEY_CONTACT && typeof parsed === 'object') setContactInfo(prev => (isSame(prev, parsed) ? prev : parsed));
        else if (e.key === STORAGE_KEY_LEGAL && typeof parsed === 'object') setLegalPolicies(prev => (isSame(prev, parsed) ? prev : parsed));
      } catch {}
    };

    window.addEventListener('storage', handleStorageEvent);

    return () => {
      if (broadcastChan) broadcastChan.removeEventListener('message', handleBroadcastMessage);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  // Sync to localStorage and broadcast real-time updates with loop prevention
  const lastSyncRef = useRef({});
  const corporateSyncTimeoutRef = useRef(null);

  const syncState = (key, value) => {
    try {
      const serialized = JSON.stringify(value);
      if (lastSyncRef.current[key] !== serialized) {
        lastSyncRef.current[key] = serialized;
        localStorage.setItem(key, serialized);
        broadcastSync(key, value);
      }
    } catch (e) {
      console.error(`Failed to sync ${key} to localStorage`, e);
    }
  };

  useEffect(() => { syncState(STORAGE_KEY_HERO, heroContent); }, [heroContent]);
  useEffect(() => { syncState(STORAGE_KEY_SERVICES, services); }, [services]);
  useEffect(() => { syncState(STORAGE_KEY_FEATURES, features); }, [features]);
  useEffect(() => { syncState(STORAGE_KEY_ARTICLES, articles); }, [articles]);
  useEffect(() => { syncState(STORAGE_KEY_DOCTORS, doctors); }, [doctors]);
  useEffect(() => { syncState(STORAGE_KEY_HOSPITALS, hospitals); }, [hospitals]);
  useEffect(() => { syncState(STORAGE_KEY_CORPORATE, corporateTieups); }, [corporateTieups]);
  useEffect(() => { syncState(STORAGE_KEY_FAQS, faqs); }, [faqs]);
  useEffect(() => { syncState(STORAGE_KEY_FAQ_SYMBOLS, faqSymbols); }, [faqSymbols]);
  useEffect(() => { syncState(STORAGE_KEY_REVIEWS, reviews); }, [reviews]);
  useEffect(() => { syncState(STORAGE_KEY_SPECIALITIES, specialitiesProcedures); }, [specialitiesProcedures]);
  useEffect(() => { syncState(STORAGE_KEY_BRANDING, branding); }, [branding]);

  // Realtime notification: Trigger cloud storage quota recalculation whenever any entity changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('storage-stats-refresh'));
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [doctors, hospitals, heroContent, services, features, articles, corporateTieups, faqs, reviews, specialitiesProcedures, branding]);



  // Doctor CRUD operations
  const addDoctor = async (doctorData) => {
    const cleanEmail = (doctorData.email || '').toLowerCase().trim();
    if (!cleanEmail) {
      throw new Error('Doctor email address is required.');
    }

    // Call backend API to create doctor in MongoDB Atlas
    const serverResult = await api.addDoctor(doctorData);
    const resolvedId = serverResult?._id || serverResult?.id || Date.now();
    const createdDoctor = {
      ...doctorData,
      ...(serverResult || {}),
      id: resolvedId,
      _id: resolvedId,
      email: cleanEmail,
      rating: doctorData.rating !== undefined && !isNaN(parseFloat(doctorData.rating)) ? parseFloat(doctorData.rating) : (serverResult?.rating || 0),
      reviews: doctorData.reviews !== undefined ? `${doctorData.reviews}` : (serverResult?.reviews || '0'),
      price: parseInt(doctorData.price, 10) || serverResult?.price || serverResult?.fees || 500,
      fees: parseInt(doctorData.price, 10) || serverResult?.fees || serverResult?.price || 500,
      available: doctorData.available !== undefined ? doctorData.available : true
    };

    setDoctors(prev => {
      // Check if already in list (by ID or clean email)
      const exists = prev.some(d => matchesId(d, createdDoctor) || (d.email && d.email.toLowerCase().trim() === cleanEmail));
      const updated = exists
        ? prev.map(d => (matchesId(d, createdDoctor) || (d.email && d.email.toLowerCase().trim() === cleanEmail)) ? { ...d, ...createdDoctor } : d)
        : [createdDoctor, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY_DOCTORS, JSON.stringify(updated));
        broadcastSync(STORAGE_KEY_DOCTORS, updated);
      } catch {}
      return updated;
    });

    return createdDoctor;
  };

  const updateDoctor = async (id, updatedData) => {
    const existingDoc = doctors.find(doc => matchesId(doc, id));
    let mergedDoctor = existingDoc ? { ...existingDoc, ...updatedData } : { ...updatedData };
    setDoctors(prev => {
      const updated = prev.map(doc => {
        if (matchesId(doc, id)) {
          const incomingSpec = (updatedData.specialty !== undefined) ? updatedData.specialty : updatedData.specialization;
          const resolvedSpecialty = incomingSpec !== undefined
            ? incomingSpec
            : ((doc.specialization && doc.specialization !== 'General Medicine') ? doc.specialization : (doc.specialty || doc.specialization || 'General Physician'));
          const rawPrice = updatedData.price !== undefined ? updatedData.price : updatedData.fees;
          const resolvedPrice = (rawPrice !== undefined && rawPrice !== null && !isNaN(Number(rawPrice)))
            ? Number(rawPrice)
            : (doc.price ?? doc.fees ?? 500);
          const resolvedPhone = updatedData.phone !== undefined ? updatedData.phone : (updatedData.contact_number !== undefined ? updatedData.contact_number : (doc.phone || doc.contact_number || ''));
          const currentStatusTs = Number(doc.statusUpdatedAt || 0);
          const incomingStatusTs = Number(updatedData.statusUpdatedAt || 0);
          const keepCurrentStatus = incomingStatusTs && currentStatusTs > incomingStatusTs;
          const nextStatus = keepCurrentStatus
            ? doc.availabilityStatus
            : (updatedData.availabilityStatus !== undefined ? updatedData.availabilityStatus : doc.availabilityStatus);
          const nextStatusTs = keepCurrentStatus
            ? currentStatusTs
            : (incomingStatusTs || currentStatusTs || (updatedData.availabilityStatus !== undefined ? Date.now() : 0));

          mergedDoctor = {
            ...doc,
            ...updatedData,
            name: updatedData.name ? String(updatedData.name).trim() : doc.name,
            phone: resolvedPhone,
            contact_number: resolvedPhone,
            hospital: updatedData.hospital !== undefined ? updatedData.hospital : doc.hospital,
            degree: updatedData.degree || updatedData.qualifications || doc.degree || doc.qualifications,
            qualifications: updatedData.degree || updatedData.qualifications || doc.degree || doc.qualifications,
            available: updatedData.available !== undefined ? Boolean(updatedData.available) : doc.available,
            id: doc.id || updatedData.id || doc._id,
            _id: doc._id || updatedData._id || doc.id,
            specialty: resolvedSpecialty,
            specialization: resolvedSpecialty,
            price: resolvedPrice,
            fees: resolvedPrice,
            experience: updatedData.experience !== undefined ? (typeof updatedData.experience === 'number' ? updatedData.experience : (!isNaN(parseInt(String(updatedData.experience || '').replace(/\D/g, ''), 10)) ? parseInt(String(updatedData.experience || '').replace(/\D/g, ''), 10) : (updatedData.experience === '' ? 0 : doc.experience))) : doc.experience,
            rating: updatedData.rating !== undefined ? parseFloat(updatedData.rating) || doc.rating : doc.rating,
            reviews: updatedData.reviews !== undefined ? updatedData.reviews : doc.reviews,
            availabilityStatus: nextStatus,
            statusUpdatedAt: nextStatusTs,
            awards: updatedData.awards !== undefined ? updatedData.awards : doc.awards,
            certifications: updatedData.certifications !== undefined ? updatedData.certifications : doc.certifications,
            memberships: updatedData.memberships !== undefined ? updatedData.memberships : doc.memberships,
            careerExperience: updatedData.careerExperience !== undefined ? updatedData.careerExperience : doc.careerExperience,
            licenseNumber: updatedData.licenseNumber !== undefined ? updatedData.licenseNumber : doc.licenseNumber,
            jobTitle: updatedData.jobTitle !== undefined ? updatedData.jobTitle : (doc.jobTitle || ''),
            reels: updatedData.reels !== undefined ? updatedData.reels : doc.reels,
            youtube_videos: updatedData.youtube_videos !== undefined ? updatedData.youtube_videos : doc.youtube_videos,
            faqs: updatedData.faqs !== undefined ? updatedData.faqs : doc.faqs,
            availableDays: formatDoctorAvailability({ ...doc, ...updatedData, availableDays: updatedData.availableDays !== undefined ? updatedData.availableDays : doc.availableDays }),
            scheduleDays: updatedData.scheduleDays !== undefined ? updatedData.scheduleDays : doc.scheduleDays,
            availableSlots: updatedData.availableSlots !== undefined ? updatedData.availableSlots : doc.availableSlots,
            slotDuration: updatedData.slotDuration !== undefined ? updatedData.slotDuration : doc.slotDuration,
            dayWiseSlots: updatedData.dayWiseSlots !== undefined ? updatedData.dayWiseSlots : (doc.dayWiseSlots || {}),
            dateWiseSlots: updatedData.dateWiseSlots !== undefined ? updatedData.dateWiseSlots : (doc.dateWiseSlots || {}),
            tags: updatedData.tags !== undefined ? updatedData.tags : doc.tags,
            slots_booked: updatedData.slots_booked !== undefined ? updatedData.slots_booked : doc.slots_booked,
            image: updatedData.image !== undefined ? updatedData.image : doc.image,
            about: updatedData.about !== undefined ? updatedData.about : doc.about,
            profileCompletion: updatedData.profileCompletion !== undefined ? Number(updatedData.profileCompletion) : doc.profileCompletion,
            isProfileComplete: updatedData.isProfileComplete !== undefined ? Boolean(updatedData.isProfileComplete) : doc.isProfileComplete,
            isStarDoctor: updatedData.isStarDoctor !== undefined ? Boolean(updatedData.isStarDoctor) : Boolean(doc.isStarDoctor),
            starUpdatedAt: updatedData.isStarDoctor !== undefined
              ? (updatedData.starMutationTimestamp ? Number(updatedData.starMutationTimestamp) : (updatedData.starUpdatedAt ? Number(updatedData.starUpdatedAt) : Math.max(Number(doc.starUpdatedAt || 0) + 1, Date.now())))
              : Number(doc.starUpdatedAt || 0)
          };
          return mergedDoctor;
        }
        return doc;
      });
      try {
        localStorage.setItem(STORAGE_KEY_DOCTORS, JSON.stringify(updated));
        broadcastSync(STORAGE_KEY_DOCTORS, updated);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('sehat_doctors_updated', { detail: updated }));
        }
        const docUserStr = localStorage.getItem('doctor_user');
        if (docUserStr) {
          const docUser = JSON.parse(docUserStr);
          if (matchesId(docUser, id)) {
            localStorage.setItem('doctor_user', JSON.stringify({ ...docUser, ...mergedDoctor }));
          }
        }
      } catch {}
      return updated;
    });

    try {
      const cleanedData = { ...updatedData };
      delete cleanedData.password;
      delete cleanedData.otp;
      delete cleanedData.otpExpires;
      delete cleanedData.otpAttempts;
      const res = await api.updateDoctor(id, cleanedData);
      if (res && (res._id || res.id)) {
        setDoctors(prev => {
          let hasDiff = false;
          const updated = prev.map(doc => {
            if (matchesId(doc, id) || (res._id && matchesId(doc, res._id)) || (res.id && matchesId(doc, res.id))) {
              const currentStarTs = Number(doc.starUpdatedAt || 0);
              const incomingStarTs = Number(res.starUpdatedAt || 0);
              const isStarExplicitlyUpdated = updatedData.isStarDoctor !== undefined;
              const nextStar = res.isStarDoctor !== undefined
                ? Boolean(res.isStarDoctor)
                : (isStarExplicitlyUpdated ? Boolean(updatedData.isStarDoctor) : Boolean(doc.isStarDoctor));
              const nextStarTs = isStarExplicitlyUpdated
                ? Math.max(currentStarTs, incomingStarTs, Number(res.starUpdatedAt || 0), Number(updatedData.starMutationTimestamp || 0), Date.now())
                : (incomingStarTs || currentStarTs || 0);
              const rawResSpec = (res.specialization && res.specialization !== 'General Medicine')
                ? res.specialization
                : ((res.specialty && res.specialty !== 'General Medicine') ? res.specialty : (res.specialization || res.specialty));
              const resSpecialty = rawResSpec || doc.specialization || doc.specialty || 'General Physician';
              const resPrice = (res.fees !== undefined && res.fees !== 500)
                ? res.fees
                : (res.price !== undefined && res.price !== 500
                  ? res.price
                  : (res.fees ?? res.price ?? doc.price));
              const resDegree = res.degree || res.qualifications || doc.degree || doc.qualifications || '';
              const resHospital = res.hospital ?? doc.hospital;
              const resName = res.name ?? doc.name;
              const resEmail = res.email ? String(res.email).trim().toLowerCase() : (updatedData.email ? String(updatedData.email).trim().toLowerCase() : doc.email);
              const resPhone = res.phone !== undefined ? res.phone : (res.contact_number !== undefined ? res.contact_number : (updatedData.phone !== undefined ? updatedData.phone : (doc.phone || doc.contact_number || '')));
              const resStatusTs = Number(res.statusUpdatedAt || 0);
              const curStatusTs = Number(doc.statusUpdatedAt || 0);
              const keepCurStatus = Boolean(updatedData.statusUpdatedAt && curStatusTs > resStatusTs);
              const nextStatusFromRes = keepCurStatus
                ? doc.availabilityStatus
                : (res.availabilityStatus !== undefined ? res.availabilityStatus : (updatedData.availabilityStatus !== undefined ? updatedData.availabilityStatus : doc.availabilityStatus));
              const nextStatusTsFromRes = keepCurStatus
                ? curStatusTs
                : (resStatusTs || curStatusTs || 0);
              const candidate = {
                ...doc,
                ...res,
                id: doc.id || res.id || res._id,
                _id: res._id || doc._id || res.id,
                email: resEmail,
                phone: resPhone,
                contact_number: resPhone,
                name: resName,
                hospital: resHospital,
                degree: resDegree,
                qualifications: resDegree,
                specialty: resSpecialty,
                specialization: resSpecialty,
                price: resPrice,
                fees: resPrice,
                rating: res.rating !== undefined ? parseFloat(res.rating) || doc.rating : (updatedData.rating !== undefined ? parseFloat(updatedData.rating) || doc.rating : doc.rating),
                reviews: res.reviews !== undefined ? res.reviews : (updatedData.reviews !== undefined ? updatedData.reviews : doc.reviews),
                availableDays: formatDoctorAvailability({
                  ...doc,
                  ...updatedData,
                  ...res,
                  availableDays: res.availableDays !== undefined ? res.availableDays : (updatedData.availableDays !== undefined ? updatedData.availableDays : doc.availableDays)
                }),
                availabilityStatus: nextStatusFromRes,
                statusUpdatedAt: nextStatusTsFromRes,
                available: res.available !== undefined ? res.available : (updatedData.available !== undefined ? updatedData.available : doc.available),
                experience: res.experience !== undefined ? (typeof res.experience === 'number' ? res.experience : (!isNaN(parseInt(String(res.experience || '').replace(/\D/g, ''), 10)) ? parseInt(String(res.experience || '').replace(/\D/g, ''), 10) : (res.experience === '' ? 0 : doc.experience))) : doc.experience,
                awards: Array.isArray(res.awards) ? res.awards : (updatedData.awards !== undefined ? updatedData.awards : doc.awards),
                certifications: Array.isArray(res.certifications) ? res.certifications : (updatedData.certifications !== undefined ? updatedData.certifications : doc.certifications),
                memberships: Array.isArray(res.memberships) ? res.memberships : (updatedData.memberships !== undefined ? updatedData.memberships : doc.memberships),
                careerExperience: Array.isArray(res.careerExperience) ? res.careerExperience : (updatedData.careerExperience !== undefined ? updatedData.careerExperience : doc.careerExperience),
                faqs: Array.isArray(res.faqs) ? res.faqs : (updatedData.faqs !== undefined ? updatedData.faqs : doc.faqs),
                tags: Array.isArray(res.tags) ? res.tags : (updatedData.tags !== undefined ? updatedData.tags : doc.tags),
                reels: Array.isArray(res.reels) ? res.reels : doc.reels,
                youtube_videos: Array.isArray(res.youtube_videos) ? res.youtube_videos : doc.youtube_videos,
                availableSlots: Array.isArray(res.availableSlots) ? res.availableSlots : doc.availableSlots,
                scheduleDays: Array.isArray(res.scheduleDays) ? res.scheduleDays : doc.scheduleDays,
                slotDuration: res.slotDuration ?? doc.slotDuration,
                dayWiseSlots: (res.dayWiseSlots && typeof res.dayWiseSlots === 'object') ? res.dayWiseSlots : (updatedData.dayWiseSlots !== undefined ? updatedData.dayWiseSlots : (doc.dayWiseSlots || {})),
                dateWiseSlots: (res.dateWiseSlots && typeof res.dateWiseSlots === 'object') ? res.dateWiseSlots : (updatedData.dateWiseSlots !== undefined ? updatedData.dateWiseSlots : (doc.dateWiseSlots || {})),
                image: updatedData.image !== undefined ? updatedData.image : (res.image !== undefined ? res.image : (doc.image || '')),
                about: res.about !== undefined ? res.about : doc.about,
                jobTitle: res.jobTitle !== undefined ? res.jobTitle : (updatedData.jobTitle !== undefined ? updatedData.jobTitle : (doc.jobTitle || '')),
                licenseNumber: res.licenseNumber !== undefined ? res.licenseNumber : (updatedData.licenseNumber !== undefined ? updatedData.licenseNumber : (doc.licenseNumber || '')),
                profileCompletion: res.profileCompletion !== undefined ? Number(res.profileCompletion) : (updatedData.profileCompletion !== undefined ? Number(updatedData.profileCompletion) : doc.profileCompletion),
                isProfileComplete: res.isProfileComplete !== undefined ? Boolean(res.isProfileComplete) : (updatedData.isProfileComplete !== undefined ? Boolean(updatedData.isProfileComplete) : doc.isProfileComplete),
                isStarDoctor: nextStar,
                starUpdatedAt: nextStarTs
              };

              const isDifferent = Object.keys(candidate).some(k => {
                if (k === 'updatedAt' || k === '__v') return false;
                if (typeof candidate[k] === 'object' && candidate[k] !== null) {
                  return JSON.stringify(candidate[k]) !== JSON.stringify(doc[k]);
                }
                return candidate[k] !== doc[k];
              });

              if (isDifferent) {
                hasDiff = true;
                return candidate;
              }
              return doc;
            }
            return doc;
          });
          if (!hasDiff) return prev;
          try {
            localStorage.setItem(STORAGE_KEY_DOCTORS, JSON.stringify(updated));
            broadcastSync(STORAGE_KEY_DOCTORS, updated);
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('sehat_doctors_updated', { detail: updated }));
            }
            const docUserStr = localStorage.getItem('doctor_user');
            if (docUserStr) {
              const docUser = JSON.parse(docUserStr);
              if (matchesId(docUser, id)) {
                localStorage.setItem('doctor_user', JSON.stringify({ ...docUser, ...res, email: resEmail, phone: resPhone, contact_number: resPhone }));
              }
            }
          } catch {}
          return updated;
        });
        return res;
      }
    } catch (err) {
      console.warn('Backend updateDoctor failed, rolling back local state:', err);
      if (existingDoc) {
        setDoctors(prev => {
          const rolledBack = prev.map(doc => matchesId(doc, id) ? existingDoc : doc);
          try {
            localStorage.setItem(STORAGE_KEY_DOCTORS, JSON.stringify(rolledBack));
            broadcastSync(STORAGE_KEY_DOCTORS, rolledBack);
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('sehat_doctors_updated', { detail: rolledBack }));
            }
          } catch {}
          return rolledBack;
        });
      }
      throw err;
    }
    return mergedDoctor;
  };

  const syncDoctorLocally = useCallback((freshDoc) => {
    if (!freshDoc || (!freshDoc.id && !freshDoc._id)) return;
    setDoctors(prev => {
      let found = false;
      let hasDiff = false;
      const updated = prev.map(doc => {
        if (matchesId(doc, freshDoc)) {
          found = true;
          const currentStarTs = Number(doc.starUpdatedAt || 0);
          const incomingStarTs = Number(freshDoc.starUpdatedAt || 0);
          const keepCurrentStar = currentStarTs > incomingStarTs && doc.isStarDoctor !== undefined;
          const resolvedStar = keepCurrentStar
            ? Boolean(doc.isStarDoctor)
            : (freshDoc.isStarDoctor !== undefined ? Boolean(freshDoc.isStarDoctor) : Boolean(doc.isStarDoctor));
          const resolvedStarTs = keepCurrentStar
            ? currentStarTs
            : (incomingStarTs || currentStarTs || 0);

          const candidate = {
            ...doc,
            ...freshDoc,
            isStarDoctor: resolvedStar,
            starUpdatedAt: resolvedStarTs
          };

          const isDifferent = Object.keys(candidate).some(k => {
            if (k === 'updatedAt' || k === '__v') return false;
            if (typeof candidate[k] === 'object' && candidate[k] !== null) {
              return JSON.stringify(candidate[k]) !== JSON.stringify(doc[k]);
            }
            return candidate[k] !== doc[k];
          });

          if (isDifferent) {
            hasDiff = true;
            return candidate;
          }
          return doc;
        }
        return doc;
      });
      if (!hasDiff && found) return prev;
      const finalDocs = found ? updated : [...updated, freshDoc];
      try {
        localStorage.setItem(STORAGE_KEY_DOCTORS, JSON.stringify(finalDocs));
        lastSyncRef.current[STORAGE_KEY_DOCTORS] = JSON.stringify(finalDocs);
        broadcastSync(STORAGE_KEY_DOCTORS, finalDocs);
      } catch {}
      return finalDocs;
    });
    try {
      const docUserStr = localStorage.getItem('doctor_user');
      if (docUserStr) {
        const docUser = JSON.parse(docUserStr);
        if (matchesId(docUser, freshDoc)) {
          localStorage.setItem('doctor_user', JSON.stringify({ ...docUser, ...freshDoc }));
        }
      }
    } catch {}
  }, []);

  const updateDoctorFaqs = async (doctorId, faqs, hospitalId = null) => {
    setDoctors(prev => {
      const updated = prev.map(doc => {
        if (matchesId(doc, doctorId)) {
          return { ...doc, faqs };
        }
        return doc;
      });
      try {
        localStorage.setItem(STORAGE_KEY_DOCTORS, JSON.stringify(updated));
        broadcastSync(STORAGE_KEY_DOCTORS, updated);
      } catch {}
      return updated;
    });

    if (hospitalId) {
      await api.updateDoctorFaqsByHospital(hospitalId, doctorId, faqs);
    } else {
      await api.updateDoctor(doctorId, { faqs });
    }
  };

  const deleteDoctor = async (target) => {
    let targetDoc = null;
    let resolvedId = null;
    let resolvedEmail = null;

    if (target && typeof target === 'object') {
      targetDoc = target;
      resolvedId = target._id || target.id;
      resolvedEmail = target.email;
    } else {
      resolvedId = target;
      if (typeof target === 'string' && target.includes('@')) {
        resolvedEmail = target;
      }
      targetDoc = doctors.find(d => matchesId(d, target) || (d.email && d.email.toLowerCase() === String(target).toLowerCase()));
      if (targetDoc) {
        resolvedId = targetDoc._id || targetDoc.id || resolvedId;
        resolvedEmail = targetDoc.email || resolvedEmail;
      }
    }

    // Call backend API to permanently remove doctor & associated data from MongoDB Atlas
    await api.deleteDoctor(resolvedId, resolvedEmail);

    const cleanId = String(resolvedId || '').toLowerCase();
    const cleanEmail = String(resolvedEmail || '').toLowerCase();

    if (typeof window !== 'undefined') {
      const delDetail = {
        id: resolvedId,
        email: cleanEmail,
        timestamp: Date.now()
      };
      window.dispatchEvent(new CustomEvent('sehat_doctor_deleted', { detail: delDetail }));
      broadcastSync('sehat_doctor_deleted', delDetail);
    }

    setDoctors(prev => {
      const updated = prev.filter(doc => {
        if (resolvedId && matchesId(doc, resolvedId)) return false;
        if (cleanEmail && (doc.email || '').toLowerCase() === cleanEmail) return false;
        if (cleanId && (doc.email || '').toLowerCase() === cleanId) return false;
        return true;
      });
      try {
        localStorage.setItem(STORAGE_KEY_DOCTORS, JSON.stringify(updated));
        broadcastSync(STORAGE_KEY_DOCTORS, updated);
      } catch {}
      return updated;
    });

    setHospitals(prev => {
      const updatedHosp = prev.map(h => {
        const newStars = (h.star_doctors || []).filter(sd => {
          const sdId = typeof sd === 'object' ? String(sd._id || sd.id) : String(sd);
          return sdId.toLowerCase() !== cleanId && (!cleanEmail || sdId.toLowerCase() !== cleanEmail);
        });
        const newStaffDocs = (h.staff_doctors || []).filter(sd => {
          const sdEmail = (typeof sd === 'string' ? sd : sd?.email)?.toLowerCase();
          return sdEmail !== cleanEmail && sdEmail !== cleanId;
        });
        const newStaffEmails = (h.staff_emails || []).filter(e => {
          const em = (typeof e === 'string' ? e : e?.email)?.toLowerCase();
          return em !== cleanEmail && em !== cleanId;
        });
        return {
          ...h,
          star_doctors: newStars,
          staff_doctors: newStaffDocs,
          staff_emails: newStaffEmails
        };
      });
      try {
        localStorage.setItem(STORAGE_KEY_HOSPITALS, JSON.stringify(updatedHosp));
        broadcastSync(STORAGE_KEY_HOSPITALS, updatedHosp);
      } catch {}
      return updatedHosp;
    });
  };

  // Hospital CRUD operations
  const addHospital = async (hospitalData) => {
    const newHospital = {
      ...hospitalData,
      rating: parseFloat(hospitalData.rating) || 0,
      reviews: hospitalData.reviews ? `${hospitalData.reviews}` : '0 Reviews',
      totalBeds: parseInt(hospitalData.totalBeds, 10) || 100,
      emergency24x7: Boolean(hospitalData.emergency24x7),
      specialties: Array.isArray(hospitalData.specialties)
        ? hospitalData.specialties
        : (typeof hospitalData.specialties === 'string'
            ? hospitalData.specialties.split(',').map(s => s.trim()).filter(Boolean)
            : []),
      reels: hospitalData.reels || [],
      youtube_videos: hospitalData.youtube_videos || [],
      photos: Array.isArray(hospitalData.photos) ? hospitalData.photos : [],
      star_doctors: hospitalData.star_doctors || [],
      staff_emails: hospitalData.staff_emails || [],
      staff_doctors: hospitalData.staff_doctors || [],
      cashlessInsurance: hospitalData.cashlessInsurance !== undefined ? Boolean(hospitalData.cashlessInsurance) : true,
      acceptedInsurances: Array.isArray(hospitalData.acceptedInsurances) && hospitalData.acceptedInsurances.length > 0 ? hospitalData.acceptedInsurances : defaultAcceptedInsurances,
      tpaHelpdesk: hospitalData.tpaHelpdesk || {
        phone: hospitalData.phone || '080-45678900',
        email: 'tpa@' + (hospitalData.email ? hospitalData.email.split('@')[1] : 'sehatbuddy.com'),
        preAuthTime: '30 Mins Cashless Pre-Approval'
      },
      insuranceHelpline: hospitalData.insuranceHelpline || '1800-SEHAT-CARE',
      latitude: hospitalData.latitude !== undefined && hospitalData.latitude !== '' ? Number(hospitalData.latitude) : undefined,
      longitude: hospitalData.longitude !== undefined && hospitalData.longitude !== '' ? Number(hospitalData.longitude) : undefined
    };

    // Database is authoritative: wait for backend confirmation
    const serverResult = await api.addHospital(newHospital);
    const createdData = serverResult?.data || serverResult;
    const finalHospital = {
      ...newHospital,
      ...createdData,
      _id: createdData._id || createdData.id,
      id: createdData._id || createdData.id
    };

    setHospitals(prev => {
      const updated = [finalHospital, ...prev.filter(h => !matchesId(h, finalHospital._id))];
      try {
        localStorage.setItem(STORAGE_KEY_HOSPITALS, JSON.stringify(updated));
        broadcastSync(STORAGE_KEY_HOSPITALS, updated);
      } catch {}
      return updated;
    });

    return {
      hospital: finalHospital,
      temporaryPassword: serverResult?.temporaryPassword
    };
  };

  const updateHospital = async (id, updatedData) => {
    let mergedHospital = null;
    let nextList = [];
    const prevHospital = hospitals.find(h => matchesId(h, id));
    setHospitals(prev => {
      nextList = prev.map(hosp => {
        if (matchesId(hosp, id)) {
          mergedHospital = {
            ...hosp,
            ...updatedData,
            name: updatedData.name !== undefined ? updatedData.name : hosp.name,
            email: updatedData.email !== undefined ? updatedData.email : hosp.email,
            phone: updatedData.phone !== undefined ? updatedData.phone : hosp.phone,
            address: updatedData.address !== undefined ? updatedData.address : hosp.address,
            city: updatedData.city !== undefined ? updatedData.city : hosp.city,
            description: updatedData.description !== undefined ? updatedData.description : hosp.description,
            establishedYear: updatedData.establishedYear !== undefined ? parseInt(updatedData.establishedYear, 10) : hosp.establishedYear,
            reviews: updatedData.reviews !== undefined ? updatedData.reviews : hosp.reviews,
            isVerified: updatedData.isVerified !== undefined ? Boolean(updatedData.isVerified) : hosp.isVerified,
            publicationStatus: updatedData.publicationStatus !== undefined ? updatedData.publicationStatus : hosp.publicationStatus,
            status: updatedData.status !== undefined ? updatedData.status : hosp.status,
            profileCompletion: updatedData.profileCompletion !== undefined ? updatedData.profileCompletion : hosp.profileCompletion,
            image: updatedData.image !== undefined ? updatedData.image : hosp.image,
            rating: updatedData.rating !== undefined ? parseFloat(updatedData.rating) : hosp.rating,
            totalBeds: updatedData.totalBeds !== undefined ? parseInt(updatedData.totalBeds, 10) : hosp.totalBeds,
            availableBeds: updatedData.availableBeds !== undefined ? parseInt(updatedData.availableBeds, 10) : (updatedData.emptyBeds !== undefined ? parseInt(updatedData.emptyBeds, 10) : hosp.availableBeds),
            emptyBeds: updatedData.availableBeds !== undefined ? parseInt(updatedData.availableBeds, 10) : (updatedData.emptyBeds !== undefined ? parseInt(updatedData.emptyBeds, 10) : (hosp.emptyBeds !== undefined ? hosp.emptyBeds : hosp.availableBeds)),
            emergency24x7: updatedData.emergency24x7 !== undefined ? Boolean(updatedData.emergency24x7) : hosp.emergency24x7,
            cashlessInsurance: updatedData.cashlessInsurance !== undefined ? Boolean(updatedData.cashlessInsurance) : hosp.cashlessInsurance,
            acceptedInsurances: updatedData.acceptedInsurances !== undefined ? updatedData.acceptedInsurances : hosp.acceptedInsurances,
            tpaHelpdesk: updatedData.tpaHelpdesk !== undefined ? updatedData.tpaHelpdesk : hosp.tpaHelpdesk,
            insuranceHelpline: updatedData.insuranceHelpline !== undefined ? updatedData.insuranceHelpline : hosp.insuranceHelpline,
            specialties: Array.isArray(updatedData.specialties)
              ? updatedData.specialties
              : (Array.isArray(updatedData.specialities)
                  ? updatedData.specialities
                  : (typeof updatedData.specialties === 'string'
                      ? updatedData.specialties.split(',').map(s => s.trim()).filter(Boolean)
                      : (hosp.specialties || hosp.specialities || []))),
            specialities: Array.isArray(updatedData.specialties)
              ? updatedData.specialties
              : (Array.isArray(updatedData.specialities)
                  ? updatedData.specialities
                  : (typeof updatedData.specialties === 'string'
                      ? updatedData.specialties.split(',').map(s => s.trim()).filter(Boolean)
                      : (hosp.specialties || hosp.specialities || []))),
            reels: updatedData.reels !== undefined ? updatedData.reels : (hosp.reels || []),
            youtube_videos: updatedData.youtube_videos !== undefined ? updatedData.youtube_videos : (hosp.youtube_videos || []),
            photos: updatedData.photos !== undefined ? updatedData.photos : (hosp.photos || []),
            star_doctors: updatedData.star_doctors !== undefined ? updatedData.star_doctors : (hosp.star_doctors || []),
            staff_emails: updatedData.staff_emails !== undefined ? updatedData.staff_emails : (hosp.staff_emails || []),
            staff_doctors: updatedData.staff_doctors !== undefined ? updatedData.staff_doctors : (hosp.staff_doctors || []),
            latitude: updatedData.latitude !== undefined ? (updatedData.latitude === '' || updatedData.latitude === null ? undefined : Number(updatedData.latitude)) : hosp.latitude,
            longitude: updatedData.longitude !== undefined ? (updatedData.longitude === '' || updatedData.longitude === null ? undefined : Number(updatedData.longitude)) : hosp.longitude,
            instagram: updatedData.instagram !== undefined ? updatedData.instagram : (hosp.instagram || ''),
            facebook: updatedData.facebook !== undefined ? updatedData.facebook : (hosp.facebook || ''),
            youtube: updatedData.youtube !== undefined ? updatedData.youtube : (hosp.youtube || ''),
            website: updatedData.website !== undefined ? updatedData.website : (hosp.website || ''),
            showOnHome: updatedData.showOnHome !== undefined ? Boolean(updatedData.showOnHome) : (hosp.showOnHome ?? true),
            homeUpdatedAt: updatedData.showOnHome !== undefined
              ? (updatedData.homeMutationTimestamp ? Number(updatedData.homeMutationTimestamp) : (updatedData.homeUpdatedAt ? Number(updatedData.homeUpdatedAt) : Math.max(Number(hosp.homeUpdatedAt || 0) + 1, Date.now())))
              : Number(hosp.homeUpdatedAt || 0)
          };
          return mergedHospital;
        }
        return hosp;
      });
      try {
        const serialized = JSON.stringify(nextList);
        lastSyncRef.current[STORAGE_KEY_HOSPITALS] = serialized;
        localStorage.setItem(STORAGE_KEY_HOSPITALS, serialized);
        broadcastSync(STORAGE_KEY_HOSPITALS, nextList);
      } catch {}
      return nextList;
    });

    try {
      const serverId = mergedHospital?._id || (typeof id === 'string' && id.length === 24 ? id : (mergedHospital?.id || id));
      const payloadToSend = { ...(updatedData || {}) };
      delete payloadToSend.__v;
      delete payloadToSend._id;
      delete payloadToSend.id;
      const serverResult = await api.updateHospital(serverId, payloadToSend);
      if (serverResult) {
        setHospitals(prev => {
          let hasDiff = false;
          const synced = prev.map(h => {
            if (matchesId(h, id)) {
              const currentHomeTs = Number(h.homeUpdatedAt || 0);
              const incomingHomeTs = Number(serverResult.homeUpdatedAt || 0);
              const isHomeExplicitlyUpdated = updatedData.showOnHome !== undefined || updatedData.homeMutationTimestamp !== undefined;
              const keepCurrentHome = isHomeExplicitlyUpdated && currentHomeTs > incomingHomeTs;
              const nextHome = keepCurrentHome
                ? Boolean(h.showOnHome)
                : (serverResult.showOnHome !== undefined ? Boolean(serverResult.showOnHome) : (updatedData.showOnHome !== undefined ? Boolean(updatedData.showOnHome) : (h.showOnHome ?? true)));
              const nextHomeTs = keepCurrentHome
                ? currentHomeTs
                : (incomingHomeTs || (isHomeExplicitlyUpdated && updatedData.homeMutationTimestamp ? Number(updatedData.homeMutationTimestamp) : currentHomeTs));

              const cand = {
                ...h,
                ...serverResult,
                showOnHome: nextHome,
                homeUpdatedAt: nextHomeTs
              };
              if (JSON.stringify(cand) !== JSON.stringify(h)) {
                hasDiff = true;
                return cand;
              }
            }
            return h;
          });
          if (!hasDiff) return prev;
          try {
            const serialized = JSON.stringify(synced);
            lastSyncRef.current[STORAGE_KEY_HOSPITALS] = serialized;
            localStorage.setItem(STORAGE_KEY_HOSPITALS, serialized);
            broadcastSync(STORAGE_KEY_HOSPITALS, synced);
          } catch {}
          return synced;
        });
        try {
          const hospUser = JSON.parse(localStorage.getItem('hospital_user') || 'null');
          if (hospUser && matchesId(hospUser, id)) {
            localStorage.setItem('hospital_user', JSON.stringify({ ...hospUser, ...serverResult }));
          }
        } catch {}
        return serverResult;
      }
      return mergedHospital;
    } catch (err) {
      console.error('Backend updateHospital failed, rolling back local state:', err);
      if (prevHospital) {
        setHospitals(prev => {
          const reverted = prev.map(h => matchesId(h, id) ? prevHospital : h);
          try {
            const serialized = JSON.stringify(reverted);
            lastSyncRef.current[STORAGE_KEY_HOSPITALS] = serialized;
            localStorage.setItem(STORAGE_KEY_HOSPITALS, serialized);
            broadcastSync(STORAGE_KEY_HOSPITALS, reverted);
          } catch {}
          return reverted;
        });
      }
      throw err;
    }
  };

  const updateHospitalBeds = async (id, bedData) => {
    const totalBeds = bedData.totalBeds !== undefined ? parseInt(bedData.totalBeds, 10) : undefined;
    const availableBeds = bedData.availableBeds !== undefined ? parseInt(bedData.availableBeds, 10) : (bedData.emptyBeds !== undefined ? parseInt(bedData.emptyBeds, 10) : undefined);

    try {
      const res = await api.updateHospitalBeds(id, {
        totalBeds,
        availableBeds,
        emptyBeds: availableBeds
      });

      setHospitals(prev => {
        const updated = prev.map(h => matchesId(h, id) ? { ...h, ...res } : h);
        try {
          localStorage.setItem(STORAGE_KEY_HOSPITALS, JSON.stringify(updated));
          broadcastSync(STORAGE_KEY_HOSPITALS, updated);
        } catch {}
        return updated;
      });
      return res;
    } catch (err) {
      console.error('Backend updateHospitalBeds failed:', err);
      throw err;
    }
  };

  const deleteHospital = async (id) => {
    const target = (hospitals || []).find(h => matchesId(h, id));
    const targetServerId = target?._id || (typeof id === 'string' && id.length === 24 ? id : target?.id || id);

    await api.deleteHospital(targetServerId);

    setHospitals(prev => {
      const updated = prev.filter(hosp => !matchesId(hosp, id));
      try {
        localStorage.setItem(STORAGE_KEY_HOSPITALS, JSON.stringify(updated));
        broadcastSync(STORAGE_KEY_HOSPITALS, updated);
      } catch {}
      return updated;
    });
  };

  // Hero & General Content CRUD
  const updateHeroContent = (newFields) => {
    setHeroContent(prev => {
      const merged = { ...prev, ...newFields };
      try {
        localStorage.setItem(STORAGE_KEY_HERO, JSON.stringify(merged));
        broadcastSync(STORAGE_KEY_HERO, merged);
      } catch {}
      api.updateHero(merged).catch(() => {});
      return merged;
    });
  };

  // Services CRUD
  const addService = (serviceData) => {
    const newService = {
      ...serviceData,
      id: Date.now(),
      bgTint: serviceData.bgTint || '#EAF6F3',
      iconTint: serviceData.iconTint || '#D9F0EA'
    };
    setServices(prev => {
      const next = [...prev, newService];
      api.updateServices(next).catch(() => {});
      return next;
    });
    return newService;
  };

  const updateService = (id, updatedData) => {
    setServices(prev => {
      const next = prev.map(s => (s.id === id ? { ...s, ...updatedData } : s));
      api.updateServices(next).catch(() => {});
      return next;
    });
  };

  const deleteService = (id) => {
    setServices(prev => {
      const next = prev.filter(s => s.id !== id);
      api.updateServices(next).catch(() => {});
      return next;
    });
  };

  // Features ("Why Choose Us") CRUD
  const addFeature = (featureData) => {
    const newFeature = {
      ...featureData,
      id: Date.now(),
      iconName: featureData.iconName || 'ShieldCheck'
    };
    setFeatures(prev => {
      const next = [...prev, newFeature];
      api.updateFeatures(next).catch(() => {});
      return next;
    });
    return newFeature;
  };

  const updateFeature = (id, updatedData) => {
    setFeatures(prev => {
      const next = prev.map(f => (f.id === id ? { ...f, ...updatedData } : f));
      api.updateFeatures(next).catch(() => {});
      return next;
    });
  };

  const deleteFeature = (id) => {
    setFeatures(prev => {
      const next = prev.filter(f => f.id !== id);
      api.updateFeatures(next).catch(() => {});
      return next;
    });
  };

  // Articles & Health Content CRUD
  const addArticle = (articleData) => {
    const newArticle = {
      ...articleData,
      id: Date.now(),
      category: articleData.category || 'Health Tips',
      categoryColor: articleData.categoryColor || '#2563EB',
      categoryBg: articleData.categoryBg || '#EAF6F3',
      readTime: articleData.readTime || '4 min read'
    };
    setArticles(prev => {
      const next = [newArticle, ...prev];
      api.updateArticles(next).catch(() => {});
      return next;
    });
    return newArticle;
  };

  const updateArticle = (id, updatedData) => {
    setArticles(prev => {
      const next = prev.map(a => (a.id === id ? { ...a, ...updatedData } : a));
      api.updateArticles(next).catch(() => {});
      return next;
    });
  };

  const deleteArticle = (id) => {
    setArticles(prev => {
      const next = prev.filter(a => a.id !== id);
      api.updateArticles(next).catch(() => {});
      return next;
    });
  };

  // Corporate Tie-ups CRUD
  const addCorporateTieup = async (tieupData) => {
    const newTieup = {
      ...tieupData,
      id: tieupData.id || Date.now(),
      name: tieupData.name || 'New Corporate Partner',
      shortName: tieupData.shortName || (tieupData.name ? tieupData.name.split(' ')[0] : 'Partner'),
      logoText: tieupData.logoText || (tieupData.name ? tieupData.name.slice(0, 4).toUpperCase() : 'CORP'),
      category: tieupData.category || 'Enterprise Partner',
      benefit: tieupData.benefit || 'Comprehensive healthcare coverage and priority care',
      color: tieupData.color || '#2563EB',
      bgColor: tieupData.bgColor || '#EFF6FF',
      employeesCovered: tieupData.employeesCovered || '50,000+'
    };
    const safePrev = Array.isArray(corporateTieups) ? corporateTieups : [];
    const next = [newTieup, ...safePrev];
    setCorporateTieups(next);
    try {
      localStorage.setItem(STORAGE_KEY_CORPORATE, JSON.stringify(next));
      broadcastSync(STORAGE_KEY_CORPORATE, next);
    } catch {}
    try {
      await api.updateCorporateTieups(next);
    } catch (err) {
      console.error('Failed to save corporate tieups to server:', err);
      throw err;
    }
    return newTieup;
  };

  const updateCorporateTieup = async (id, updatedData, immediate = true) => {
    let nextState = null;
    setCorporateTieups(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const next = safePrev.map(c => (matchesId(c, id) ? { ...c, ...updatedData } : c));
      nextState = next;
      try {
        localStorage.setItem(STORAGE_KEY_CORPORATE, JSON.stringify(next));
        broadcastSync(STORAGE_KEY_CORPORATE, next);
      } catch {}

      if (corporateSyncTimeoutRef.current) {
        clearTimeout(corporateSyncTimeoutRef.current);
      }
      if (!immediate) {
        corporateSyncTimeoutRef.current = setTimeout(() => {
          api.updateCorporateTieups(next).catch((err) => {
            console.error('Failed to update corporate tieup on server:', err);
          });
        }, 350);
      }

      return next;
    });

    if (immediate && nextState) {
      await api.updateCorporateTieups(nextState);
    }
    return nextState;
  };

  const saveCorporateTieupsNow = async () => {
    if (corporateSyncTimeoutRef.current) {
      clearTimeout(corporateSyncTimeoutRef.current);
    }
    return api.updateCorporateTieups(corporateTieups);
  };

  const deleteCorporateTieup = async (id) => {
    if (corporateSyncTimeoutRef.current) {
      clearTimeout(corporateSyncTimeoutRef.current);
    }
    const safePrev = Array.isArray(corporateTieups) ? corporateTieups : [];
    const next = safePrev.filter(c => !matchesId(c, id));
    setCorporateTieups(next);
    try {
      localStorage.setItem(STORAGE_KEY_CORPORATE, JSON.stringify(next));
      broadcastSync(STORAGE_KEY_CORPORATE, next);
    } catch {}
    try {
      await api.deleteCorporate(id);
    } catch {
      await api.updateCorporateTieups(next);
    }
    return next;
  };

  const deleteAllCorporateTieups = async () => {
    if (corporateSyncTimeoutRef.current) {
      clearTimeout(corporateSyncTimeoutRef.current);
    }
    const next = [];
    setCorporateTieups(next);
    try {
      localStorage.setItem(STORAGE_KEY_CORPORATE, JSON.stringify(next));
      broadcastSync(STORAGE_KEY_CORPORATE, next);
    } catch {}
    try {
      await api.deleteAllCorporates();
    } catch {
      await api.updateCorporateTieups([]);
    }
    return next;
  };

  // FAQs CRUD
  const addFaq = async (faqData) => {
    try {
      const saved = await api.addFaq(faqData);
      const newFaq = {
        ...faqData,
        ...(saved || {}),
        id: saved?._id || saved?.id || faqData.id || faqData._id || `faq-${Date.now()}`,
        _id: saved?._id || faqData._id || saved?.id || faqData.id,
        order: Number(faqData.order) || (faqs.length + 1),
        isActive: faqData.isActive !== undefined ? Boolean(faqData.isActive) : true
      };
      setFaqs(prev => {
        const next = [newFaq, ...prev.filter(f => !matchesId(f, newFaq.id))];
        try {
          localStorage.setItem(STORAGE_KEY_FAQS, JSON.stringify(next));
          lastSyncRef.current[STORAGE_KEY_FAQS] = JSON.stringify(next);
          broadcastSync(STORAGE_KEY_FAQS, next);
        } catch {}
        return next;
      });
      return newFaq;
    } catch (err) {
      console.error('Failed to add FAQ to database:', err);
      throw err;
    }
  };

  const updateFaq = async (id, updatedData) => {
    try {
      const saved = await api.updateFaq(id, updatedData);
      setFaqs(prev => {
        const next = prev.map(f => {
          if (matchesId(f, id)) {
            return { ...f, ...updatedData, ...(saved || {}) };
          }
          return f;
        });
        try {
          localStorage.setItem(STORAGE_KEY_FAQS, JSON.stringify(next));
          lastSyncRef.current[STORAGE_KEY_FAQS] = JSON.stringify(next);
          broadcastSync(STORAGE_KEY_FAQS, next);
        } catch {}
        return next;
      });
      return saved;
    } catch (err) {
      console.error('Failed to update FAQ in database:', err);
      throw err;
    }
  };

  const deleteFaq = async (id) => {
    try {
      await api.deleteFaq(id);
      setFaqs(prev => {
        const next = prev.filter(f => !matchesId(f, id));
        try {
          localStorage.setItem(STORAGE_KEY_FAQS, JSON.stringify(next));
          lastSyncRef.current[STORAGE_KEY_FAQS] = JSON.stringify(next);
          broadcastSync(STORAGE_KEY_FAQS, next);
        } catch {}
        return next;
      });
    } catch (err) {
      console.error('Failed to delete FAQ from database:', err);
      throw err;
    }
  };

  const reorderFaqs = async (items) => {
    try {
      const formattedItems = (items || []).map((item, idx) => ({
        id: item.id || item._id,
        _id: item._id || item.id,
        order: item.order !== undefined && item.order !== null ? Number(item.order) : idx + 1
      }));

      setFaqs(prev => {
        const orderMap = new Map();
        formattedItems.forEach(fi => {
          if (fi.id) orderMap.set(String(fi.id), fi.order);
          if (fi._id) orderMap.set(String(fi._id), fi.order);
        });
        const next = prev.map(f => {
          const fid = String(f.id || f._id || '');
          if (orderMap.has(fid)) {
            return { ...f, order: orderMap.get(fid) };
          }
          return f;
        });
        try {
          localStorage.setItem(STORAGE_KEY_FAQS, JSON.stringify(next));
          lastSyncRef.current[STORAGE_KEY_FAQS] = JSON.stringify(next);
          broadcastSync(STORAGE_KEY_FAQS, next);
        } catch {}
        return next;
      });

      await api.reorderFaqs(formattedItems);
    } catch (err) {
      console.error('Failed to reorder FAQs in database:', err);
      throw err;
    }
  };

  // FAQ Symbols CRUD
  const addFaqSymbol = async (symbolData) => {
    try {
      const saved = await api.createFaqSymbol(symbolData);
      if (saved) {
        setFaqSymbols(prev => {
          const filtered = prev.filter(s => s.key !== saved.key && !matchesId(s, saved._id));
          return [...filtered, { ...saved, id: saved._id || saved.id }];
        });
        return saved;
      }
    } catch (err) {
      console.error('Failed to add FAQ symbol:', err);
      throw err;
    }
  };

  const deleteFaqSymbol = async (id) => {
    setFaqSymbols(prev => prev.filter(s => !matchesId(s, id)));
    try {
      await api.deleteFaqSymbol(id);
    } catch (err) {
      console.error('Failed to delete FAQ symbol:', err);
    }
  };

  // Reviews CRUD
  const addReview = async (reviewData, tokenOverride = null) => {
    try {
      const saved = await api.addReview(reviewData, tokenOverride);
      if (saved && (saved._id || saved.id)) {
        const item = { ...saved, id: saved._id || saved.id };
        setReviews(prev => {
          // If already added by SSE, do not insert duplicate
          if (prev.some(r => matchesId(r, item.id))) {
            return prev;
          }
          const updated = [item, ...prev];
          try {
            localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(updated));
            broadcastSync(STORAGE_KEY_REVIEWS, updated);
          } catch {}
          return updated;
        });
        return item;
      }
    } catch (err) {
      console.error('Failed to add review to server:', err);
      // Strictly do NOT insert locally if the server rejected due to authentication, authorization, or invalid session
      const status = err?.status || err?.response?.status;
      const msg = String(err?.message || '').toLowerCase();
      if (status === 401 || status === 403 || msg.includes('login') || msg.includes('unauthorized') || msg.includes('forbidden') || msg.includes('token')) {
        throw err;
      }
      // Fallback local insertion ONLY if user is genuinely offline
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const fallbackItem = {
          ...reviewData,
          id: reviewData.id || reviewData._id || `rev-${Date.now()}`,
          rating: Number(reviewData.rating) || 5,
          createdAt: new Date().toISOString(),
          isVerified: reviewData.isVerified !== undefined ? Boolean(reviewData.isVerified) : true,
          status: reviewData.status || 'approved'
        };
        setReviews(prev => {
          if (prev.some(r => matchesId(r, fallbackItem.id))) return prev;
          const updated = [fallbackItem, ...prev];
          try {
            localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(updated));
            broadcastSync(STORAGE_KEY_REVIEWS, updated);
          } catch {}
          return updated;
        });
        return fallbackItem;
      }
      throw err;
    }
  };

  const updateReview = async (id, updatedData) => {
    try {
      const saved = await api.updateReview(id, updatedData);
      setReviews(prev => {
        const updated = prev.map(r => {
          if (matchesId(r, id)) {
            return { ...r, ...updatedData, ...(saved || {}) };
          }
          return r;
        });
        try {
          localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(updated));
          broadcastSync(STORAGE_KEY_REVIEWS, updated);
        } catch {}
        return updated;
      });
      return saved;
    } catch (err) {
      console.error('Failed to update review on server:', err);
      throw err;
    }
  };

  const deleteReview = async (target) => {
    const targetId = (target && typeof target === 'object') ? (target._id || target.id) : target;
    setReviews(prev => {
      const exists = prev.some(r => matchesId(r, targetId));
      if (!exists) return prev;
      const updated = prev.filter(r => !matchesId(r, targetId));
      try {
        localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(updated));
        lastSyncRef.current[STORAGE_KEY_REVIEWS] = JSON.stringify(updated);
        broadcastSync(STORAGE_KEY_REVIEWS, updated);
      } catch {}
      return updated;
    });
    try {
      await api.deleteReview(targetId);
    } catch (err) {
      console.error('Failed to delete review on server:', err);
      // Re-fetch only if server call genuinely failed to roll back
      refreshReviews();
      throw err;
    }
  };

  // Specialities & Procedures CRUD
  const addSpecialityProcedure = (itemData) => {
    const newItem = {
      ...itemData,
      id: itemData.id || itemData._id || `sp-${Date.now()}`,
      type: itemData.type || 'speciality',
      insuranceCovered: itemData.insuranceCovered !== undefined ? itemData.insuranceCovered : true,
      insuranceDetails: itemData.insuranceDetails || {
        coveragePercent: 'Up to 100% Covered',
        cashlessAvailable: true,
        preAuthHours: '30 Mins Pre-Approval',
        estimatedCostRange: '₹45,000 - ₹90,000',
        outOfPocketWithInsurance: '₹0 with Cashless Mediclaim',
        emiAvailable: true
      }
    };
    setSpecialitiesProcedures(prev => [...prev, newItem]);
    api.addSpecialityProcedure(newItem).then(saved => {
      if (saved && saved._id) {
        setSpecialitiesProcedures(prev => prev.map(s => s.id === newItem.id ? { ...saved, id: saved._id } : s));
      }
    }).catch(() => {});
    return newItem;
  };

  const updateSpecialityProcedure = (id, updatedData) => {
    setSpecialitiesProcedures(prev => prev.map(s => {
      if (matchesId(s, id)) {
        const merged = { ...s, ...updatedData };
        api.updateSpecialityProcedure(id, merged).catch(() => {});
        return merged;
      }
      return s;
    }));
  };

  const deleteSpecialityProcedure = (id) => {
    setSpecialitiesProcedures(prev => prev.filter(s => !matchesId(s, id)));
    api.deleteSpecialityProcedure(id).catch(() => {});
  };

  // 10. Branding & Site Identity CRUD
  const updateBranding = (newFields) => {
    setBranding(prev => {
      const merged = { ...prev, ...newFields };
      try {
        localStorage.setItem(STORAGE_KEY_BRANDING, JSON.stringify(merged));
        broadcastSync(STORAGE_KEY_BRANDING, merged);
      } catch {}
      api.updateBranding(merged).catch(() => {});
      return merged;
    });
  };

  const resetBranding = () => {
    setBranding(initialBranding);
    localStorage.removeItem(STORAGE_KEY_BRANDING);
    api.updateBranding(initialBranding).catch(() => {});
  };

  // 11. Platform Contact Info CRUD
  const updateContactInfo = useCallback(async (newContactData) => {
    try {
      const updated = {
        phones: Array.isArray(newContactData.phones) ? newContactData.phones : (contactInfo?.phones || []),
        emails: Array.isArray(newContactData.emails) ? newContactData.emails : (contactInfo?.emails || []),
        workingHours: newContactData.workingHours || contactInfo?.workingHours || 'Mon – Sat: 8:00 AM – 8:00 PM'
      };

      setContactInfo(updated);
      try {
        localStorage.setItem(STORAGE_KEY_CONTACT, JSON.stringify(updated));
        broadcastSync(STORAGE_KEY_CONTACT, updated);
      } catch {}

      await api.updateContact(updated);
      return { success: true, data: updated };
    } catch (err) {
      console.error('Failed to update contact info in DB:', err);
      throw err;
    }
  }, [contactInfo]);

  // 12. Platform Legal & Policy Documents CRUD (25MB PDFs)
  const refreshLegalPolicies = useCallback(async () => {
    try {
      const data = await api.getLegalPolicies();
      if (data && typeof data === 'object') {
        setLegalPolicies(prev => {
          const next = { ...prev, ...data };
          try {
            localStorage.setItem(STORAGE_KEY_LEGAL, JSON.stringify(next));
            broadcastSync(STORAGE_KEY_LEGAL, next);
          } catch {}
          return isSame(prev, next) ? prev : next;
        });
        return data;
      }
    } catch (err) {
      console.warn('Failed to refresh legal policies:', err);
    }
  }, []);

  const updateLegalPolicies = useCallback(async (newLegalData) => {
    try {
      const updated = {
        privacyPolicy: newLegalData.privacyPolicy !== undefined 
          ? (typeof newLegalData.privacyPolicy === 'object' ? { ...legalPolicies.privacyPolicy, ...newLegalData.privacyPolicy } : newLegalData.privacyPolicy)
          : legalPolicies.privacyPolicy,
        termsAndConditions: newLegalData.termsAndConditions !== undefined 
          ? (typeof newLegalData.termsAndConditions === 'object' ? { ...legalPolicies.termsAndConditions, ...newLegalData.termsAndConditions } : newLegalData.termsAndConditions)
          : legalPolicies.termsAndConditions
      };

      setLegalPolicies(updated);
      try {
        localStorage.setItem(STORAGE_KEY_LEGAL, JSON.stringify(updated));
        broadcastSync(STORAGE_KEY_LEGAL, updated);
      } catch {}

      await api.updateLegalPolicies(updated);
      return { success: true, data: updated };
    } catch (err) {
      console.error('Failed to update legal policies in DB:', err);
      throw err;
    }
  }, [legalPolicies]);

  // Reset Front Page Defaults
  const resetFrontPageDefaults = () => {
    setHeroContent(initialHeroContent);
    setServices(initialServices);
    setFeatures(initialFeatures);
    setArticles(initialArticles);
    setCorporateTieups(initialCorporateTieups);
    setFaqs(initialFaqs);
    setReviews(initialReviews);
    setSpecialitiesProcedures(initialSpecialitiesProcedures);
    resetBranding();
    localStorage.removeItem(STORAGE_KEY_HERO);
    localStorage.removeItem('sehat_buddy_hero_v2');
    localStorage.removeItem(STORAGE_KEY_SERVICES);
    localStorage.removeItem(STORAGE_KEY_FEATURES);
    localStorage.removeItem(STORAGE_KEY_ARTICLES);
    localStorage.removeItem(STORAGE_KEY_CORPORATE);
    localStorage.removeItem(STORAGE_KEY_FAQS);
    localStorage.removeItem(STORAGE_KEY_REVIEWS);
    localStorage.removeItem(STORAGE_KEY_SPECIALITIES);
    api.updateCorporateTieups(initialCorporateTieups).catch(() => {});
  };

  // Reset Everything
  const resetToDefaults = () => {
    setDoctors([]);
    setHospitals([]);
    resetFrontPageDefaults();
    localStorage.removeItem(STORAGE_KEY_DOCTORS);
    localStorage.removeItem(STORAGE_KEY_HOSPITALS);
  };

  // Stats calculation
  const stats = useMemo(() => ({
    totalDoctors: doctors.length,
    totalHospitals: hospitals.length,
    totalBeds: hospitals.reduce((sum, h) => sum + (parseInt(h.totalBeds, 10) || 0), 0),
    avgConsultation: doctors.length > 0
      ? Math.round(doctors.reduce((sum, d) => sum + (parseInt(d.price, 10) || 0), 0) / doctors.length)
      : 0,
    emergencyHospitals: hospitals.filter(h => h.emergency24x7).length,
  }), [doctors, hospitals]);

  return (
    <DataContext.Provider
      value={{
        doctors,
        hospitals,
        addDoctor,
        updateDoctor,
        syncDoctorLocally,
        updateDoctorFaqs,
        deleteDoctor,
        addHospital,
        updateHospital,
        updateHospitalBeds,
        deleteHospital,
        // Branding & Site Identity
        branding,
        updateBranding,
        resetBranding,
        // Platform Contact Info
        contactInfo,
        updateContactInfo,
        // Legal Policies & Compliance (25MB PDFs)
        legalPolicies,
        updateLegalPolicies,
        refreshLegalPolicies,
        // Front page content
        heroContent,
        updateHeroContent,
        services,
        addService,
        updateService,
        deleteService,
        features,
        addFeature,
        updateFeature,
        deleteFeature,
        articles,
        addArticle,
        updateArticle,
        deleteArticle,
        corporateTieups,
        addCorporateTieup,
        updateCorporateTieup,
        deleteCorporateTieup,
        deleteAllCorporateTieups,
        saveCorporateTieupsNow,
        // FAQs
        faqs,
        addFaq,
        updateFaq,
        deleteFaq,
        reorderFaqs,
        // FAQ Symbols / Presets
        faqSymbols,
        refreshFaqSymbols,
        addFaqSymbol,
        deleteFaqSymbol,
        // Public Reviews
        reviews,
        addReview,
        updateReview,
        deleteReview,
        // Specialities & Procedures / Surgeries
        specialitiesProcedures,
        addSpecialityProcedure,
        updateSpecialityProcedure,
        deleteSpecialityProcedure,
        resetFrontPageDefaults,
        resetToDefaults,
        stats,
        // Real-time synchronization hooks
        refreshAll,
        refreshDoctors,
        refreshHospitals,
        refreshContent,
        refreshFaqs,
        refreshReviews,
        refreshSpecialities
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export default DataProvider;
