import React, { useState, useEffect, useRef } from 'react';
import { DataContext } from './context';
import { api, API_BASE } from '../services/api';
import { initialHeroContent } from '../data/heroContent';
import { initialServices } from '../data/services';
import { initialFeatures } from '../data/features';
import { initialArticles } from '../data/articles';
import { initialHospitals } from '../data/hospitals';
import { initialDoctors } from '../data/doctors';
import { initialCorporateTieups } from '../data/corporateTieups';
import { initialFaqs } from '../data/faqs';
import { initialReviews } from '../data/reviews';
import { initialSpecialitiesProcedures } from '../data/specialitiesProcedures';
import { defaultAcceptedInsurances } from '../data/insurancePartners';
import { initialBranding, DEFAULT_FAVICON_CIRCULAR } from '../data/branding';

const STORAGE_KEY_DOCTORS = 'sehat_buddy_doctors_v2';
const STORAGE_KEY_HOSPITALS = 'sehat_buddy_hospitals_v2';
const STORAGE_KEY_HERO = 'sehat_buddy_hero_v3';
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
  const sId = String(id).trim();
  if (!sId) return false;
  return (
    (item.id !== undefined && item.id !== null && String(item.id).trim() === sId) ||
    (item._id !== undefined && item._id !== null && String(item._id).trim() === sId) ||
    (item.email && sId.includes('@') && item.email.toLowerCase().trim() === sId.toLowerCase())
  );
};

export const DataProvider = ({ children }) => {
  // 1. Doctors State (Fetched directly from DB with fallback)
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

  // 2. Hospitals State (Fetched directly from DB with fallback)
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
      const savedV3 = localStorage.getItem(STORAGE_KEY_HERO);
      if (savedV3) {
        const parsed = JSON.parse(savedV3);
        if (parsed && typeof parsed === 'object') return { ...initialHeroContent, ...parsed };
      }
      const savedV2 = localStorage.getItem('sehat_buddy_hero_v2');
      if (savedV2) {
        const parsed = JSON.parse(savedV2);
        if (parsed && typeof parsed === 'object') {
          // Carry forward customizations but update heroImage to the newly uploaded family photo
          return { ...initialHeroContent, ...parsed, heroImage: initialHeroContent.heroImage };
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
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse services from localStorage', e);
    }
    return initialServices;
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
    } catch (e) {
      console.error('Failed to parse features from localStorage', e);
    }
    return initialFeatures;
  });

  // 6. Articles & Health Content State
  const [articles, setArticles] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ARTICLES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse articles from localStorage', e);
    }
    return initialArticles;
  });

  // 7. Corporate Tie-ups & Enterprise Network State
  const [corporateTieups, setCorporateTieups] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CORPORATE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse corporateTieups from localStorage', e);
    }
    return initialCorporateTieups;
  });

  // 8. FAQs State
  const [faqs, setFaqs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FAQS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse faqs from localStorage', e);
    }
    return initialFaqs;
  });

  // 9. Public Reviews State
  const [reviews, setReviews] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_REVIEWS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse reviews from localStorage', e);
    }
    return initialReviews;
  });

  // 10. Specialities & Procedures State
  const [specialitiesProcedures, setSpecialitiesProcedures] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SPECIALITIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse specialitiesProcedures from localStorage', e);
    }
    return initialSpecialitiesProcedures;
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
    } catch (e) {
      console.error('Failed to parse branding from localStorage', e);
    }
    return initialBranding;
  });

  // Helper mapping functions
  const mapDoctorList = (docList, prevDoctors = []) => {
    return docList.map(d => {
      const existing = prevDoctors.find(p => matchesId(p, d._id || d.id));
      const initial = initialDoctors.find(i => matchesId(i, d.id || d._id) || (i.name && d.name && i.name.toLowerCase() === d.name.toLowerCase()));
      return {
        ...d,
        id: d._id || d.id,
        specialty: d.specialization || d.specialty || 'General Physician',
        price: d.fees || d.price || 500,
        experience: typeof d.experience === 'number' ? `${d.experience}+ Years Experience` : (d.experience || d.experienceText || '5+ Years Experience'),
        licenseNumber: d.licenseNumber || existing?.licenseNumber || initial?.licenseNumber || '',
        awards: Array.isArray(d.awards) && d.awards.length > 0 ? d.awards : (Array.isArray(existing?.awards) && existing.awards.length > 0 ? existing.awards : (initial?.awards || [])),
        certifications: Array.isArray(d.certifications) && d.certifications.length > 0 ? d.certifications : (Array.isArray(existing?.certifications) && existing.certifications.length > 0 ? existing.certifications : (initial?.certifications || [])),
        memberships: Array.isArray(d.memberships) && d.memberships.length > 0 ? d.memberships : (Array.isArray(existing?.memberships) && existing.memberships.length > 0 ? existing.memberships : (initial?.memberships || [])),
        careerExperience: Array.isArray(d.careerExperience) && d.careerExperience.length > 0 ? d.careerExperience : (Array.isArray(existing?.careerExperience) && existing.careerExperience.length > 0 ? existing.careerExperience : (initial?.careerExperience || []))
      };
    });
  };

  const mapHospitalList = (hospList) => {
    return hospList.map(h => ({
      ...h,
      id: h._id || h.id,
      specialties: h.specialities || h.specialties || [],
      reels: h.reels || [],
      youtube_videos: h.youtube_videos || [],
      photos: Array.isArray(h.photos) ? h.photos : [],
      star_doctors: h.star_doctors || [],
      cashlessInsurance: h.cashlessInsurance !== undefined ? h.cashlessInsurance : true,
      acceptedInsurances: Array.isArray(h.acceptedInsurances) && h.acceptedInsurances.length > 0 ? h.acceptedInsurances : defaultAcceptedInsurances,
      tpaHelpdesk: h.tpaHelpdesk || {
        phone: h.phone || '080-45678900',
        email: 'tpa@' + (h.email ? h.email.split('@')[1] : 'sehatbuddy.com'),
        preAuthTime: '30 Mins Cashless Pre-Approval'
      },
      insuranceHelpline: h.insuranceHelpline || '1800-SEHAT-CARE'
    }));
  };

  // Modular real-time refresh operations
  const refreshDoctors = async () => {
    try {
      const data = await api.getDoctors();
      if (Array.isArray(data)) {
        setDoctors(prev => mapDoctorList(data, prev));
      }
    } catch {}
  };

  const refreshHospitals = async () => {
    try {
      const data = await api.getHospitals();
      if (Array.isArray(data)) {
        setHospitals(mapHospitalList(data));
      }
    } catch {}
  };

  const refreshContent = async () => {
    try {
      const data = await api.getContent();
      if (data) {
        const { hero, services: sList, features: fList, articles: aList, corporate: cList, branding: bData } = data;
        if (hero) {
          setHeroContent(prev => {
            const cleanHero = { ...hero };
            if (typeof cleanHero.heroImage === 'string' && cleanHero.heroImage.startsWith('data:image/') && cleanHero.heroImage.length > 50000) {
              cleanHero.heroImage = prev.heroImage || initialHeroContent.heroImage;
            }
            const merged = { ...initialHeroContent, ...cleanHero, ...prev };
            if (JSON.stringify(prev) === JSON.stringify(merged)) return prev;
            return merged;
          });
        }
        if (bData && typeof bData === 'object') {
          setBranding(prev => {
            const isPrevCustomized = (prev?.siteName && prev.siteName !== 'The Sehat Buddy') || (prev?.tagline && prev.tagline !== 'Your Health. Our Priority.');
            const isBackendDefault = bData?.siteName === 'The Sehat Buddy' && (!bData?.tagline || bData?.tagline === 'Your Health. Our Priority.');
            if (isPrevCustomized && isBackendDefault) return prev;
            const merged = { ...prev, ...bData };
            if (JSON.stringify(prev) === JSON.stringify(merged)) return prev;
            return merged;
          });
        }
        if (Array.isArray(sList) && sList.length > 0) setServices(prev => (prev && prev.length > 0 ? prev : sList));
        if (Array.isArray(fList) && fList.length > 0) setFeatures(prev => (prev && prev.length > 0 ? prev : fList));
        if (Array.isArray(aList) && aList.length > 0) setArticles(prev => (prev && prev.length > 0 ? prev : aList));
        if (Array.isArray(cList) && cList.length > 0) setCorporateTieups(prev => (prev && prev.length > 0 ? prev : cList));
      }
    } catch {}
  };

  const refreshFaqs = async () => {
    try {
      const data = await api.getFaqs();
      if (Array.isArray(data) && data.length > 0) {
        setFaqs(data.map(f => ({ ...f, id: f._id || f.id })));
      }
    } catch {}
  };

  const refreshReviews = async () => {
    try {
      const data = await api.getReviews();
      if (Array.isArray(data) && data.length > 0) {
        setReviews(data.map(r => ({ ...r, id: r._id || r.id })));
      }
    } catch {}
  };

  const refreshSpecialities = async () => {
    try {
      const data = await api.getSpecialitiesProcedures();
      if (Array.isArray(data) && data.length > 0) {
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

            // Instant sub-second targeted refresh based on modified collection
            if (collection === 'doctors') {
              refreshDoctors();
            } else if (collection === 'hospitals') {
              refreshHospitals();
            } else if (collection === 'contents') {
              refreshContent();
            } else if (collection === 'faqs') {
              refreshFaqs();
            } else if (collection === 'reviews') {
              refreshReviews();
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
          mergedDoctor = {
            ...doc,
            ...updatedData,
            rating: updatedData.rating !== undefined ? parseFloat(updatedData.rating) || doc.rating : doc.rating,
            price: updatedData.price !== undefined ? parseInt(updatedData.price, 10) || doc.price : doc.price,
            awards: updatedData.awards !== undefined ? updatedData.awards : doc.awards,
            certifications: updatedData.certifications !== undefined ? updatedData.certifications : doc.certifications,
            memberships: updatedData.memberships !== undefined ? updatedData.memberships : doc.memberships,
            careerExperience: updatedData.careerExperience !== undefined ? updatedData.careerExperience : doc.careerExperience,
            licenseNumber: updatedData.licenseNumber !== undefined ? updatedData.licenseNumber : doc.licenseNumber,
            faqs: updatedData.faqs !== undefined ? updatedData.faqs : doc.faqs
          };
          return mergedDoctor;
        }
        return doc;
      });
      return updated;
    });

    try {
      await api.updateDoctor(id, mergedDoctor || updatedData);
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

  const deleteDoctor = (id) => {
    setDoctors(prev => {
      const updated = prev.filter(doc => !matchesId(doc, id));
      try {
        localStorage.setItem(STORAGE_KEY_DOCTORS, JSON.stringify(updated));
        broadcastSync(STORAGE_KEY_DOCTORS, updated);
      } catch {}
      return updated;
    });
    api.deleteDoctor(id).catch(() => {});
  };

  // Hospital CRUD operations
  const addHospital = (hospitalData) => {
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
    setHospitals(prev => {
      const updated = [newHospital, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY_HOSPITALS, JSON.stringify(updated));
        broadcastSync(STORAGE_KEY_HOSPITALS, updated);
      } catch {}
      return updated;
    });
    api.addHospital(newHospital).catch(() => {});
    return newHospital;
  };

  const updateHospital = async (id, updatedData) => {
    let mergedHospital = null;
    setHospitals(prev => {
      const updated = prev.map(hosp => {
        if (matchesId(hosp, id)) {
          mergedHospital = {
            ...hosp,
            ...updatedData,
            rating: updatedData.rating !== undefined ? parseFloat(updatedData.rating) : hosp.rating,
            totalBeds: updatedData.totalBeds !== undefined ? parseInt(updatedData.totalBeds, 10) : hosp.totalBeds,
            emergency24x7: updatedData.emergency24x7 !== undefined ? Boolean(updatedData.emergency24x7) : hosp.emergency24x7,
            cashlessInsurance: updatedData.cashlessInsurance !== undefined ? Boolean(updatedData.cashlessInsurance) : hosp.cashlessInsurance,
            acceptedInsurances: updatedData.acceptedInsurances !== undefined ? updatedData.acceptedInsurances : hosp.acceptedInsurances,
            tpaHelpdesk: updatedData.tpaHelpdesk !== undefined ? updatedData.tpaHelpdesk : hosp.tpaHelpdesk,
            insuranceHelpline: updatedData.insuranceHelpline !== undefined ? updatedData.insuranceHelpline : hosp.insuranceHelpline,
            specialties: Array.isArray(updatedData.specialties)
              ? updatedData.specialties
              : (typeof updatedData.specialties === 'string'
                  ? updatedData.specialties.split(',').map(s => s.trim()).filter(Boolean)
                  : hosp.specialties),
            reels: updatedData.reels !== undefined ? updatedData.reels : (hosp.reels || []),
            youtube_videos: updatedData.youtube_videos !== undefined ? updatedData.youtube_videos : (hosp.youtube_videos || []),
            photos: updatedData.photos !== undefined ? updatedData.photos : (hosp.photos || []),
            star_doctors: updatedData.star_doctors !== undefined ? updatedData.star_doctors : (hosp.star_doctors || []),
            staff_emails: updatedData.staff_emails !== undefined ? updatedData.staff_emails : (hosp.staff_emails || []),
            staff_doctors: updatedData.staff_doctors !== undefined ? updatedData.staff_doctors : (hosp.staff_doctors || []),
            latitude: updatedData.latitude !== undefined ? (updatedData.latitude === '' || updatedData.latitude === null ? undefined : Number(updatedData.latitude)) : hosp.latitude,
            longitude: updatedData.longitude !== undefined ? (updatedData.longitude === '' || updatedData.longitude === null ? undefined : Number(updatedData.longitude)) : hosp.longitude
          };
          return mergedHospital;
        }
        return hosp;
      });
      return updated;
    });

    try {
      await api.updateHospital(id, mergedHospital || updatedData);
    } catch (err) {
      console.warn('Backend updateHospital failed, local state retained:', err);
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
  const addReview = (reviewData) => {
    const newReview = {
      ...reviewData,
      id: reviewData.id || reviewData._id || `rev-${Date.now()}`,
      rating: Number(reviewData.rating) || 5,
      createdAt: new Date().toISOString(),
      isVerified: reviewData.isVerified !== undefined ? Boolean(reviewData.isVerified) : true,
      status: reviewData.status || 'approved'
    };
    setReviews(prev => [newReview, ...prev]);
    api.addReview(newReview).then(saved => {
      if (saved && saved._id) {
        setReviews(prev => prev.map(r => r.id === newReview.id ? { ...saved, id: saved._id } : r));
      }
    }).catch(() => {});
    return newReview;
  };

  const updateReview = (id, updatedData) => {
    setReviews(prev => prev.map(r => {
      if (matchesId(r, id)) {
        const merged = { ...r, ...updatedData };
        api.updateReview(id, merged).catch(() => {});
        return merged;
      }
      return r;
    }));
  };

  const deleteReview = (id) => {
    setReviews(prev => prev.filter(r => !matchesId(r, id)));
    api.deleteReview(id).catch(() => {});
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
