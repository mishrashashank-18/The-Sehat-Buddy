import React, { useState, useEffect, useRef } from 'react';
import { DataContext } from './context';
import { api, API_BASE } from '../services/api';
import { initialBranding } from '../data/branding';
import { initialDoctors } from '../data/doctors';
import { initialHospitals } from '../data/hospitals';

const STORAGE_KEY_DOCTORS = 'sehat_buddy_doctors_v2';
const STORAGE_KEY_HOSPITALS = 'sehat_buddy_hospitals_v2';
const STORAGE_KEY_HERO = 'sehat_buddy_hero_v4';
const STORAGE_KEY_SERVICES = 'sehat_buddy_services_v2';
const STORAGE_KEY_FEATURES = 'sehat_buddy_features_v2';
const STORAGE_KEY_ARTICLES = 'sehat_buddy_articles_v2';
const STORAGE_KEY_CORPORATE = 'sehat_buddy_corporate_v2';
const STORAGE_KEY_FAQS = 'sehat_buddy_faqs_v2';
const STORAGE_KEY_REVIEWS = 'sehat_buddy_reviews_v2';
const STORAGE_KEY_SPECIALITIES = 'sehat_buddy_specialities_v2';
const STORAGE_KEY_BRANDING = 'sehat_buddy_branding_v3';

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

export const DataProvider = ({ children }) => {
  // 1. Doctors State (Fetched directly from DB / cached)
  const [doctors, setDoctors] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DOCTORS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return initialDoctors;
  });

  // 2. Hospitals State (Fetched directly from DB / cached)
  const [hospitals, setHospitals] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HOSPITALS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return initialHospitals;
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
          if (parsed.whyChooseVideoUrl === 'https://www.youtube.com/watch?v=zCCD52Pty4A') {
            parsed.whyChooseVideoUrl = '';
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse heroContent from localStorage', e);
    }
    return {
      badge: 'Your Health Partner, Every Step of the Way',
      titleLine1: 'Find Doctors, Book',
      titleLine2: 'Appointments & Take',
      titleHighlight: 'Care of Your Health',
      description: 'The Sehat Buddy is your one-stop platform to consult doctors, book tests, surgeries and explore trusted healthcare services – anytime, anywhere.',
      heroImage: '/src/assets/images/hero-family.jpg'
    };
  });

  // 4. Services State
  const [services, setServices] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SERVICES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  // 5. Features ("Why Choose Us") State
  const [features, setFeatures] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FEATURES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
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
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
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
    return [];
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
    const mapped = docList.map(d => {
      const existing = prevDoctors.find(p => matchesId(p, d));
      const resolvedSpecialty = d.specialization || d.specialty || existing?.specialty || existing?.specialization || 'General Physician';
      const resolvedPrice = d.fees ?? d.price ?? existing?.price ?? existing?.fees ?? 500;
      return {
        ...existing,
        ...d,
        id: d._id || d.id || existing?._id || existing?.id,
        _id: d._id || existing?._id || d.id,
        specialty: resolvedSpecialty,
        specialization: resolvedSpecialty,
        price: resolvedPrice,
        fees: resolvedPrice,
        experience: typeof d.experience === 'number' ? d.experience : (parseInt(String(d.experience || '').replace(/\D/g, ''), 10) || 5),
        licenseNumber: d.licenseNumber || existing?.licenseNumber || '',
        awards: (Array.isArray(d.awards) && d.awards.length > 0) ? d.awards : (Array.isArray(existing?.awards) ? existing.awards : []),
        certifications: (Array.isArray(d.certifications) && d.certifications.length > 0) ? d.certifications : (Array.isArray(existing?.certifications) ? existing.certifications : []),
        memberships: (Array.isArray(d.memberships) && d.memberships.length > 0) ? d.memberships : (Array.isArray(existing?.memberships) ? existing.memberships : []),
        careerExperience: (Array.isArray(d.careerExperience) && d.careerExperience.length > 0) ? d.careerExperience : (Array.isArray(existing?.careerExperience) ? existing.careerExperience : []),
        tags: (Array.isArray(d.tags) && d.tags.length > 0) ? d.tags : (Array.isArray(existing?.tags) ? existing.tags : undefined),
        reels: sanitizeReels((Array.isArray(d.reels) && d.reels.length > 0) ? d.reels : (Array.isArray(existing?.reels) ? existing.reels : [])),
        youtube_videos: (Array.isArray(d.youtube_videos) && d.youtube_videos.length > 0) ? d.youtube_videos : (Array.isArray(existing?.youtube_videos) ? existing.youtube_videos : []),
        availableDays: d.availableDays || existing?.availableDays || 'Mon - Sat (10am - 4pm)',
        scheduleDays: (Array.isArray(d.scheduleDays) && d.scheduleDays.length > 0) ? d.scheduleDays : (Array.isArray(existing?.scheduleDays) ? existing.scheduleDays : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']),
        availableSlots: (Array.isArray(d.availableSlots) && d.availableSlots.length > 0) ? d.availableSlots : (Array.isArray(existing?.availableSlots) ? existing.availableSlots : ['04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM']),
        slotDuration: d.slotDuration || existing?.slotDuration || 20,
        dayWiseSlots: (d.dayWiseSlots && typeof d.dayWiseSlots === 'object') ? d.dayWiseSlots : (existing?.dayWiseSlots || {}),
        dateWiseSlots: (d.dateWiseSlots && typeof d.dateWiseSlots === 'object') ? d.dateWiseSlots : (existing?.dateWiseSlots || {}),
        slots_booked: { ...(existing?.slots_booked || {}), ...(d.slots_booked || {}) }
      };
    });

    // Retain any locally modified or newly created doctors not in docList
    const notInApi = prevDoctors.filter(prevDoc => !docList.some(d => matchesId(prevDoc, d)));
    return [...mapped, ...notInApi];
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
        id: existing?.id || h.id || h._id,
        _id: h._id || existing?._id || h.id,
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
        insuranceHelpline: h.insuranceHelpline || existing?.insuranceHelpline || '1800-SEHAT-CARE'
      };
    });
    const notInApi = prevHospitals.filter(prevH => !hospList.some(h => matchesId(prevH, h)));
    return [...mapped, ...notInApi];
  };

  // Modular real-time refresh operations directly from MongoDB Atlas
  const refreshDoctors = async () => {
    try {
      const data = await api.getDoctors();
      if (Array.isArray(data)) {
        setDoctors(prev => {
          const mapped = mapDoctorList(data, prev);
          try {
            localStorage.setItem(STORAGE_KEY_DOCTORS, JSON.stringify(mapped));
            broadcastSync(STORAGE_KEY_DOCTORS, mapped);
          } catch {}
          return mapped;
        });
      }
    } catch {}
  };

  const refreshHospitals = async () => {
    try {
      const data = await api.getHospitals();
      if (Array.isArray(data)) {
        setHospitals(prev => {
          const mapped = mapHospitalList(data, prev);
          try {
            localStorage.setItem(STORAGE_KEY_HOSPITALS, JSON.stringify(mapped));
            broadcastSync(STORAGE_KEY_HOSPITALS, mapped);
          } catch {}
          return mapped;
        });
      }
    } catch {}
  };

  const refreshContent = async () => {
    try {
      const data = await api.getContent();
      if (data) {
        const { hero, services: sList, features: fList, articles: aList, corporate: cList, branding: bData } = data;
        if (hero && typeof hero === 'object') {
          setHeroContent(prev => {
            const cleanHero = { ...hero };
            if (typeof cleanHero.heroImage === 'string' && cleanHero.heroImage.startsWith('data:image/') && cleanHero.heroImage.length > 50000) {
              cleanHero.heroImage = prev?.heroImage || '/src/assets/images/hero-family.jpg';
            }
            if (cleanHero.whyChooseVideoUrl === 'https://www.youtube.com/watch?v=zCCD52Pty4A') {
              cleanHero.whyChooseVideoUrl = '';
            }
            return cleanHero;
          });
        }
        if (bData && typeof bData === 'object') {
          setBranding(prev => ({ ...prev, ...bData }));
        }
        if (Array.isArray(sList)) setServices(sList);
        if (Array.isArray(fList)) setFeatures(fList);
        if (Array.isArray(aList)) setArticles(aList);
        if (Array.isArray(cList)) setCorporateTieups(cList);
      }
    } catch {}
  };

  const refreshFaqs = async () => {
    try {
      const data = await api.getFaqs();
      if (Array.isArray(data)) {
        setFaqs(data.map(f => ({ ...f, id: f._id || f.id })));
      }
    } catch {}
  };

  const refreshReviews = async () => {
    try {
      const data = await api.getReviews();
      if (Array.isArray(data)) {
        setReviews(data.map(r => ({ ...r, id: r._id || r.id })));
      }
    } catch {}
  };

  const refreshSpecialities = async () => {
    try {
      const data = await api.getSpecialitiesProcedures();
      if (Array.isArray(data)) {
        setSpecialitiesProcedures(data.map(s => ({ ...s, id: s._id || s.id })));
      }
    } catch {}
  };

  const refreshAll = async () => {
    await Promise.allSettled([
      refreshDoctors(),
      refreshHospitals(),
      refreshContent(),
      refreshFaqs(),
      refreshReviews(),
      refreshSpecialities()
    ]);
  };

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
              if (payload.docId && payload.fullDocument) {
                setDoctors(prev => {
                  const updated = prev.map(d => matchesId(d, payload.docId) ? { ...d, ...payload.fullDocument } : d);
                  try {
                    localStorage.setItem(STORAGE_KEY_DOCTORS, JSON.stringify(updated));
                  } catch {}
                  return updated;
                });
              } else {
                refreshDoctors();
              }
            } else if (collection === 'hospitals') {
              refreshHospitals();
            } else if (collection === 'contents') {
              refreshContent();
            } else if (collection === 'faqs') {
              refreshFaqs();
            } else if (collection === 'reviews') {
              if (payload.docId && payload.fullDocument) {
                setReviews(prev => {
                  const exists = prev.some(r => matchesId(r, payload.docId));
                  const updated = exists
                    ? prev.map(r => matchesId(r, payload.docId) ? { ...r, ...payload.fullDocument } : r)
                    : [{ ...payload.fullDocument, id: payload.docId }, ...prev];
                  try {
                    localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(updated));
                  } catch {}
                  return updated;
                });
              } else if (payload.action === 'delete' && payload.docId) {
                setReviews(prev => {
                  const updated = prev.filter(r => !matchesId(r, payload.docId));
                  try {
                    localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(updated));
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

      if (key === STORAGE_KEY_DOCTORS && Array.isArray(data)) setDoctors(prev => (isSame(prev, data) ? prev : data));
      else if (key === STORAGE_KEY_HOSPITALS && Array.isArray(data)) setHospitals(prev => (isSame(prev, data) ? prev : data));
      else if (key === STORAGE_KEY_BRANDING && typeof data === 'object') setBranding(prev => (isSame(prev, data) ? prev : data));
      else if (key === STORAGE_KEY_HERO && typeof data === 'object') setHeroContent(prev => (isSame(prev, data) ? prev : data));
      else if (key === STORAGE_KEY_SERVICES && Array.isArray(data)) setServices(prev => (isSame(prev, data) ? prev : data));
      else if (key === STORAGE_KEY_FEATURES && Array.isArray(data)) setFeatures(prev => (isSame(prev, data) ? prev : data));
      else if (key === STORAGE_KEY_ARTICLES && Array.isArray(data)) setArticles(prev => (isSame(prev, data) ? prev : data));
      else if (key === STORAGE_KEY_CORPORATE && Array.isArray(data)) setCorporateTieups(prev => (isSame(prev, data) ? prev : data));
      else if (key === STORAGE_KEY_FAQS && Array.isArray(data)) setFaqs(prev => (isSame(prev, data) ? prev : data));
      else if (key === STORAGE_KEY_REVIEWS && Array.isArray(data)) setReviews(prev => (isSame(prev, data) ? prev : data));
      else if (key === STORAGE_KEY_SPECIALITIES && Array.isArray(data)) setSpecialitiesProcedures(prev => (isSame(prev, data) ? prev : data));
    };

    if (broadcastChan) {
      broadcastChan.onmessage = handleBroadcastMessage;
    }

    const handleStorageEvent = (e) => {
      if (!e.key || !e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue);
        if (e.key === STORAGE_KEY_DOCTORS && Array.isArray(parsed)) setDoctors(prev => (isSame(prev, parsed) ? prev : parsed));
        else if (e.key === STORAGE_KEY_HOSPITALS && Array.isArray(parsed)) setHospitals(prev => (isSame(prev, parsed) ? prev : parsed));
        else if (e.key === STORAGE_KEY_BRANDING) setBranding(prev => (isSame(prev, parsed) ? prev : parsed));
        else if (e.key === STORAGE_KEY_HERO) setHeroContent(prev => (isSame(prev, parsed) ? prev : parsed));
        else if (e.key === STORAGE_KEY_SERVICES && Array.isArray(parsed)) setServices(prev => (isSame(prev, parsed) ? prev : parsed));
        else if (e.key === STORAGE_KEY_FEATURES && Array.isArray(parsed)) setFeatures(prev => (isSame(prev, parsed) ? prev : parsed));
        else if (e.key === STORAGE_KEY_ARTICLES && Array.isArray(parsed)) setArticles(prev => (isSame(prev, parsed) ? prev : parsed));
        else if (e.key === STORAGE_KEY_CORPORATE && Array.isArray(parsed)) setCorporateTieups(prev => (isSame(prev, parsed) ? prev : parsed));
        else if (e.key === STORAGE_KEY_FAQS && Array.isArray(parsed)) setFaqs(prev => (isSame(prev, parsed) ? prev : parsed));
        else if (e.key === STORAGE_KEY_REVIEWS && Array.isArray(parsed)) setReviews(prev => (isSame(prev, parsed) ? prev : parsed));
        else if (e.key === STORAGE_KEY_SPECIALITIES && Array.isArray(parsed)) setSpecialitiesProcedures(prev => (isSame(prev, parsed) ? prev : parsed));
      } catch {}
    };

    window.addEventListener('storage', handleStorageEvent);

    return () => {
      if (broadcastChan) broadcastChan.onmessage = null;
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  // Sync to localStorage and broadcast real-time updates with loop prevention
  const lastSyncRef = useRef({});

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
  const addDoctor = (doctorData) => {
    const newDoctor = {
      ...doctorData,
      id: Date.now(),
      rating: parseFloat(doctorData.rating) || 4.5,
      reviews: doctorData.reviews ? `${doctorData.reviews}` : '10+',
      price: parseInt(doctorData.price, 10) || 500,
    };
    setDoctors(prev => {
      const updated = [newDoctor, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY_DOCTORS, JSON.stringify(updated));
        broadcastSync(STORAGE_KEY_DOCTORS, updated);
      } catch {}
      return updated;
    });
    api.addDoctor(newDoctor).catch(() => {});
    return newDoctor;
  };

  const updateDoctor = async (id, updatedData) => {
    let mergedDoctor = null;
    setDoctors(prev => {
      const updated = prev.map(doc => {
        if (matchesId(doc, id)) {
          const resolvedSpecialty = updatedData.specialty || updatedData.specialization || doc.specialty || doc.specialization;
          const resolvedPrice = updatedData.price !== undefined ? parseInt(updatedData.price, 10) || doc.price : (updatedData.fees !== undefined ? parseInt(updatedData.fees, 10) || doc.fees : doc.price);
          mergedDoctor = {
            ...doc,
            ...updatedData,
            id: doc.id || updatedData.id || doc._id,
            _id: doc._id || updatedData._id || doc.id,
            specialty: resolvedSpecialty,
            specialization: resolvedSpecialty,
            price: resolvedPrice,
            fees: resolvedPrice,
            experience: updatedData.experience !== undefined ? (typeof updatedData.experience === 'number' ? updatedData.experience : (parseInt(String(updatedData.experience || '').replace(/\D/g, ''), 10) || doc.experience)) : doc.experience,
            rating: updatedData.rating !== undefined ? parseFloat(updatedData.rating) || doc.rating : doc.rating,
            awards: updatedData.awards !== undefined ? updatedData.awards : doc.awards,
            certifications: updatedData.certifications !== undefined ? updatedData.certifications : doc.certifications,
            memberships: updatedData.memberships !== undefined ? updatedData.memberships : doc.memberships,
            careerExperience: updatedData.careerExperience !== undefined ? updatedData.careerExperience : doc.careerExperience,
            licenseNumber: updatedData.licenseNumber !== undefined ? updatedData.licenseNumber : doc.licenseNumber,
            reels: updatedData.reels !== undefined ? updatedData.reels : doc.reels,
            youtube_videos: updatedData.youtube_videos !== undefined ? updatedData.youtube_videos : doc.youtube_videos,
            faqs: updatedData.faqs !== undefined ? updatedData.faqs : doc.faqs,
            availableDays: updatedData.availableDays !== undefined ? updatedData.availableDays : doc.availableDays,
            scheduleDays: updatedData.scheduleDays !== undefined ? updatedData.scheduleDays : doc.scheduleDays,
            availableSlots: updatedData.availableSlots !== undefined ? updatedData.availableSlots : doc.availableSlots,
            slotDuration: updatedData.slotDuration !== undefined ? updatedData.slotDuration : doc.slotDuration,
            dayWiseSlots: updatedData.dayWiseSlots !== undefined ? updatedData.dayWiseSlots : (doc.dayWiseSlots || {}),
            dateWiseSlots: updatedData.dateWiseSlots !== undefined ? updatedData.dateWiseSlots : (doc.dateWiseSlots || {}),
            tags: updatedData.tags !== undefined ? updatedData.tags : doc.tags,
            slots_booked: updatedData.slots_booked !== undefined ? updatedData.slots_booked : doc.slots_booked,
            image: updatedData.image !== undefined ? updatedData.image : doc.image,
            about: updatedData.about !== undefined ? updatedData.about : doc.about
          };
          return mergedDoctor;
        }
        return doc;
      });
      try {
        localStorage.setItem(STORAGE_KEY_DOCTORS, JSON.stringify(updated));
        broadcastSync(STORAGE_KEY_DOCTORS, updated);
      } catch {}
      return updated;
    });

    try {
      const res = await api.updateDoctor(id, mergedDoctor || updatedData);
      if (res && (res._id || res.id)) {
        setDoctors(prev => {
          const updated = prev.map(doc => {
            if (matchesId(doc, id)) {
              const resSpecialty = res.specialization ?? res.specialty ?? doc.specialty;
              const resPrice = res.fees ?? res.price ?? doc.price;
              return {
                ...doc,
                ...res,
                id: doc.id || res.id || res._id,
                _id: res._id || doc._id || res.id,
                specialty: resSpecialty,
                specialization: resSpecialty,
                price: resPrice,
                fees: resPrice,
                experience: res.experience !== undefined ? (typeof res.experience === 'number' ? res.experience : (parseInt(String(res.experience || '').replace(/\D/g, ''), 10) || doc.experience)) : doc.experience,
                awards: Array.isArray(res.awards) ? res.awards : doc.awards,
                certifications: Array.isArray(res.certifications) ? res.certifications : doc.certifications,
                memberships: Array.isArray(res.memberships) ? res.memberships : doc.memberships,
                careerExperience: Array.isArray(res.careerExperience) ? res.careerExperience : doc.careerExperience,
                tags: Array.isArray(res.tags) ? res.tags : (updatedData.tags !== undefined ? updatedData.tags : doc.tags),
                reels: Array.isArray(res.reels) ? res.reels : doc.reels,
                youtube_videos: Array.isArray(res.youtube_videos) ? res.youtube_videos : doc.youtube_videos,
                availableSlots: Array.isArray(res.availableSlots) ? res.availableSlots : doc.availableSlots,
                scheduleDays: Array.isArray(res.scheduleDays) ? res.scheduleDays : doc.scheduleDays,
                slotDuration: res.slotDuration ?? doc.slotDuration,
                dayWiseSlots: (res.dayWiseSlots && typeof res.dayWiseSlots === 'object') ? res.dayWiseSlots : (updatedData.dayWiseSlots !== undefined ? updatedData.dayWiseSlots : (doc.dayWiseSlots || {})),
                dateWiseSlots: (res.dateWiseSlots && typeof res.dateWiseSlots === 'object') ? res.dateWiseSlots : (updatedData.dateWiseSlots !== undefined ? updatedData.dateWiseSlots : (doc.dateWiseSlots || {})),
                availableDays: res.availableDays ?? doc.availableDays,
                image: res.image || doc.image,
                about: res.about !== undefined ? res.about : doc.about
              };
            }
            return doc;
          });
          try {
            localStorage.setItem(STORAGE_KEY_DOCTORS, JSON.stringify(updated));
            broadcastSync(STORAGE_KEY_DOCTORS, updated);
          } catch {}
          return updated;
        });
      }
    } catch (err) {
      console.warn('Backend updateDoctor failed, local state retained:', err);
    }
  };

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

  const deleteDoctor = async (id) => {
    setDoctors(prev => {
      const cleanId = String(id).toLowerCase();
      const updated = prev.filter(doc => !matchesId(doc, id) && (doc.email || '').toLowerCase() !== cleanId);
      try {
        localStorage.setItem(STORAGE_KEY_DOCTORS, JSON.stringify(updated));
        broadcastSync(STORAGE_KEY_DOCTORS, updated);
      } catch {}
      return updated;
    });

    setHospitals(prev => prev.map(h => {
      const cleanId = String(id).toLowerCase();
      const newStars = (h.star_doctors || []).filter(sd => {
        const sdId = typeof sd === 'object' ? String(sd._id || sd.id) : String(sd);
        return sdId.toLowerCase() !== cleanId;
      });
      const newStaffDocs = (h.staff_doctors || []).filter(sd => {
        const sdEmail = (typeof sd === 'string' ? sd : sd?.email)?.toLowerCase();
        return sdEmail !== cleanId;
      });
      const newStaffEmails = (h.staff_emails || []).filter(e => {
        const em = (typeof e === 'string' ? e : e?.email)?.toLowerCase();
        return em !== cleanId;
      });
      return {
        ...h,
        star_doctors: newStars,
        staff_doctors: newStaffDocs,
        staff_emails: newStaffEmails
      };
    }));

    try {
      await api.deleteDoctor(id);
    } catch (err) {
      console.warn('Backend deleteDoctor failed:', err);
    }
  };

  // Hospital CRUD operations
  const addHospital = async (hospitalData) => {
    const newHospital = {
      ...hospitalData,
      id: Date.now(),
      rating: parseFloat(hospitalData.rating) || 4.5,
      reviews: hospitalData.reviews ? `${hospitalData.reviews}` : '50+',
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
      latitude: hospitalData.latitude !== undefined ? Number(hospitalData.latitude) : undefined,
      longitude: hospitalData.longitude !== undefined ? Number(hospitalData.longitude) : undefined
    };

    let serverResult = null;
    try {
      serverResult = await api.addHospital(newHospital);
      if (serverResult?.data) {
        newHospital._id = serverResult.data._id;
        newHospital.id = serverResult.data._id || newHospital.id;
      }
    } catch (err) {
      console.warn('Backend hospital registration error:', err);
    }

    setHospitals(prev => {
      const updated = [newHospital, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY_HOSPITALS, JSON.stringify(updated));
        broadcastSync(STORAGE_KEY_HOSPITALS, updated);
      } catch {}
      return updated;
    });

    return {
      hospital: newHospital,
      temporaryPassword: serverResult?.temporaryPassword
    };
  };

  const updateHospital = async (id, updatedData) => {
    let mergedHospital = null;
    let nextList = [];
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
            facebook: updatedData.facebook !== undefined ? updatedData.facebook : (hosp.facebook || '')
          };
          return mergedHospital;
        }
        return hosp;
      });
      try {
        localStorage.setItem(STORAGE_KEY_HOSPITALS, JSON.stringify(nextList));
        broadcastSync(STORAGE_KEY_HOSPITALS, nextList);
      } catch {}
      return nextList;
    });

    try {
      const serverId = mergedHospital?._id || (typeof id === 'string' && id.length === 24 ? id : (mergedHospital?.id || id));
      const serverResult = await api.updateHospital(serverId, mergedHospital || updatedData);
      if (serverResult) {
        setHospitals(prev => {
          const synced = prev.map(h => matchesId(h, id) ? { ...h, ...serverResult } : h);
          try {
            localStorage.setItem(STORAGE_KEY_HOSPITALS, JSON.stringify(synced));
            broadcastSync(STORAGE_KEY_HOSPITALS, synced);
          } catch {}
          return synced;
        });
        return serverResult;
      }
      return mergedHospital;
    } catch (err) {
      console.error('Backend updateHospital failed:', err);
      throw err;
    }
  };

  const updateHospitalBeds = async (id, bedData) => {
    const totalBeds = bedData.totalBeds !== undefined ? parseInt(bedData.totalBeds, 10) : undefined;
    const availableBeds = bedData.availableBeds !== undefined ? parseInt(bedData.availableBeds, 10) : (bedData.emptyBeds !== undefined ? parseInt(bedData.emptyBeds, 10) : undefined);

    setHospitals(prev => prev.map(h => {
      if (matchesId(h, id)) {
        return {
          ...h,
          totalBeds: totalBeds !== undefined ? totalBeds : h.totalBeds,
          availableBeds: availableBeds !== undefined ? availableBeds : h.availableBeds,
          emptyBeds: availableBeds !== undefined ? availableBeds : (h.emptyBeds !== undefined ? h.emptyBeds : h.availableBeds)
        };
      }
      return h;
    }));

    try {
      await api.updateHospitalBeds(id, {
        totalBeds,
        availableBeds,
        emptyBeds: availableBeds
      });
    } catch (err) {
      console.warn('Backend updateHospitalBeds failed, falling back to updateHospital:', err);
      await api.updateHospital(id, {
        totalBeds,
        availableBeds,
        emptyBeds: availableBeds
      });
    }
  };

  const deleteHospital = (id) => {
    setHospitals(prev => {
      const updated = prev.filter(hosp => !matchesId(hosp, id));
      try {
        localStorage.setItem(STORAGE_KEY_HOSPITALS, JSON.stringify(updated));
        broadcastSync(STORAGE_KEY_HOSPITALS, updated);
      } catch {}
      return updated;
    });
    api.deleteHospital(id).catch(() => {});
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
  const addCorporateTieup = (tieupData) => {
    const newTieup = {
      ...tieupData,
      id: Date.now(),
      name: tieupData.name || 'New Corporate Partner',
      shortName: tieupData.shortName || (tieupData.name ? tieupData.name.split(' ')[0] : 'Partner'),
      logoText: tieupData.logoText || (tieupData.name ? tieupData.name.slice(0, 4).toUpperCase() : 'CORP'),
      category: tieupData.category || 'Enterprise Partner',
      benefit: tieupData.benefit || 'Comprehensive healthcare coverage and priority care',
      color: tieupData.color || '#2563EB',
      bgColor: tieupData.bgColor || '#EFF6FF',
      employeesCovered: tieupData.employeesCovered || '50,000+'
    };
    setCorporateTieups(prev => {
      const next = [newTieup, ...prev];
      api.updateCorporateTieups(next).catch(() => {});
      return next;
    });
    return newTieup;
  };

  const updateCorporateTieup = (id, updatedData) => {
    setCorporateTieups(prev => {
      const next = prev.map(c => (String(c.id) === String(id) ? { ...c, ...updatedData } : c));
      api.updateCorporateTieups(next).catch(() => {});
      return next;
    });
  };

  const deleteCorporateTieup = (id) => {
    setCorporateTieups(prev => {
      const next = prev.filter(c => String(c.id) !== String(id));
      api.updateCorporateTieups(next).catch(() => {});
      return next;
    });
  };

  // FAQs CRUD
  const addFaq = (faqData) => {
    const newFaq = {
      ...faqData,
      id: faqData.id || faqData._id || `faq-${Date.now()}`,
      order: Number(faqData.order) || (faqs.length + 1),
      isActive: faqData.isActive !== undefined ? Boolean(faqData.isActive) : true
    };
    setFaqs(prev => [newFaq, ...prev]);
    api.addFaq(newFaq).then(saved => {
      if (saved && saved._id) {
        setFaqs(prev => prev.map(f => f.id === newFaq.id ? { ...saved, id: saved._id } : f));
      }
    }).catch(() => {});
    return newFaq;
  };

  const updateFaq = (id, updatedData) => {
    setFaqs(prev => prev.map(f => {
      if (matchesId(f, id)) {
        const merged = { ...f, ...updatedData };
        api.updateFaq(id, merged).catch(() => {});
        return merged;
      }
      return f;
    }));
  };

  const deleteFaq = (id) => {
    setFaqs(prev => prev.filter(f => !matchesId(f, id)));
    api.deleteFaq(id).catch(() => {});
  };

  // Reviews CRUD
  const addReview = async (reviewData) => {
    try {
      const saved = await api.addReview(reviewData);
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
      // Fallback local insertion if offline
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
  };

  const updateReview = (id, updatedData) => {
    setReviews(prev => {
      const updated = prev.map(r => {
        if (matchesId(r, id)) {
          const merged = { ...r, ...updatedData };
          api.updateReview(id, merged).catch(() => {});
          return merged;
        }
        return r;
      });
      try {
        localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(updated));
        broadcastSync(STORAGE_KEY_REVIEWS, updated);
      } catch {}
      return updated;
    });
  };

  const deleteReview = async (id) => {
    setReviews(prev => {
      const updated = prev.filter(r => !matchesId(r, id));
      try {
        localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(updated));
        broadcastSync(STORAGE_KEY_REVIEWS, updated);
      } catch {}
      return updated;
    });
    try {
      await api.deleteReview(id);
    } catch (err) {
      console.error('Failed to delete review on server:', err);
      // Re-fetch only if server call genuinely failed to roll back
      refreshReviews();
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
  const stats = {
    totalDoctors: doctors.length,
    totalHospitals: hospitals.length,
    totalBeds: hospitals.reduce((sum, h) => sum + (parseInt(h.totalBeds, 10) || 0), 0),
    avgConsultation: doctors.length > 0
      ? Math.round(doctors.reduce((sum, d) => sum + (parseInt(d.price, 10) || 0), 0) / doctors.length)
      : 0,
    emergencyHospitals: hospitals.filter(h => h.emergency24x7).length,
  };

  return (
    <DataContext.Provider
      value={{
        doctors,
        hospitals,
        addDoctor,
        updateDoctor,
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
        // FAQs
        faqs,
        addFaq,
        updateFaq,
        deleteFaq,
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
