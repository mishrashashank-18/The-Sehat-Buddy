import React, { useState, useEffect } from 'react';
import { DataContext } from './context';
import { api } from '../services/api';
import { initialHeroContent } from '../data/heroContent';
import { initialServices } from '../data/services';
import { initialFeatures } from '../data/features';
import { initialArticles } from '../data/articles';
import { initialHospitals } from '../data/hospitals';
import { initialDoctors } from '../data/doctors';
import { initialCorporateTieups } from '../data/corporateTieups';

const STORAGE_KEY_DOCTORS = 'sehat_buddy_doctors_v2';
const STORAGE_KEY_HOSPITALS = 'sehat_buddy_hospitals_v2';
const STORAGE_KEY_HERO = 'sehat_buddy_hero_v3';
const STORAGE_KEY_SERVICES = 'sehat_buddy_services_v2';
const STORAGE_KEY_FEATURES = 'sehat_buddy_features_v2';
const STORAGE_KEY_ARTICLES = 'sehat_buddy_articles_v2';
const STORAGE_KEY_CORPORATE = 'sehat_buddy_corporate_v2';

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

  // Fetch from Backend API periodically for real-time updates
  useEffect(() => {
    let isMounted = true;
    const fetchBackendData = async () => {
      try {
        const [docsRes, hospsRes, contentRes] = await Promise.allSettled([
          api.getDoctors(),
          api.getHospitals(),
          api.getContent()
        ]);

        if (!isMounted) return;

        if (docsRes.status === 'fulfilled' && Array.isArray(docsRes.value)) {
          setDoctors(docsRes.value.map(d => ({
            ...d,
            id: d._id || d.id,
            specialty: d.specialization || d.specialty || 'General Physician',
            price: d.fees || d.price || 500,
            experience: typeof d.experience === 'number' ? `${d.experience}+ Years Experience` : (d.experience || d.experienceText || '5+ Years Experience')
          })));
        }
        if (hospsRes.status === 'fulfilled' && Array.isArray(hospsRes.value)) {
          setHospitals(hospsRes.value.map(h => ({
            ...h,
            id: h._id || h.id,
            specialties: h.specialities || h.specialties || [],
            reels: h.reels || [],
            youtube_videos: h.youtube_videos || [],
            photos: Array.isArray(h.photos) ? h.photos : [],
            star_doctors: h.star_doctors || []
          })));
        }
        if (contentRes.status === 'fulfilled' && contentRes.value) {
          const { hero, services: sList, features: fList, articles: aList, corporate: cList } = contentRes.value;
          if (hero) {
            setHeroContent(prev => {
              const cleanHero = { ...hero };
              if (typeof cleanHero.heroImage === 'string' && cleanHero.heroImage.startsWith('data:image/') && cleanHero.heroImage.length > 50000) {
                cleanHero.heroImage = prev.heroImage || initialHeroContent.heroImage;
              }
              return { ...prev, ...cleanHero };
            });
          }
          if (Array.isArray(sList) && sList.length > 0) setServices(sList);
          if (Array.isArray(fList) && fList.length > 0) setFeatures(fList);
          if (Array.isArray(aList) && aList.length > 0) setArticles(aList);
          if (Array.isArray(cList) && cList.length > 0) setCorporateTieups(cList);
        }
      } catch {
        // Backend not available, seamlessly fall back to local storage and default data
      }
    };

    fetchBackendData();

    // Poll periodically to keep data fresh without excessive network chatter
    const intervalId = setInterval(() => {
      fetchBackendData();
    }, 60000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HERO, JSON.stringify(heroContent));
    } catch (e) {
      console.error('Failed to save heroContent to localStorage', e);
    }
  }, [heroContent]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(services));
    } catch (e) {
      console.error('Failed to save services to localStorage', e);
    }
  }, [services]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FEATURES, JSON.stringify(features));
    } catch (e) {
      console.error('Failed to save features to localStorage', e);
    }
  }, [features]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ARTICLES, JSON.stringify(articles));
    } catch (e) {
      console.error('Failed to save articles to localStorage', e);
    }
  }, [articles]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DOCTORS, JSON.stringify(doctors));
    } catch (e) {
      console.error('Failed to save doctors to localStorage', e);
    }
  }, [doctors]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HOSPITALS, JSON.stringify(hospitals));
    } catch (e) {
      console.error('Failed to save hospitals to localStorage', e);
    }
  }, [hospitals]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CORPORATE, JSON.stringify(corporateTieups));
    } catch (e) {
      console.error('Failed to save corporateTieups to localStorage', e);
    }
  }, [corporateTieups]);

  // Doctor CRUD operations
  const addDoctor = (doctorData) => {
    const newDoctor = {
      ...doctorData,
      id: Date.now(),
      rating: parseFloat(doctorData.rating) || 4.5,
      reviews: doctorData.reviews ? `${doctorData.reviews}` : '10+',
      price: parseInt(doctorData.price, 10) || 500,
    };
    setDoctors(prev => [newDoctor, ...prev]);
    api.addDoctor(newDoctor).catch(() => {});
    return newDoctor;
  };

  const updateDoctor = (id, updatedData) => {
    setDoctors(prev =>
      prev.map(doc => {
        if (String(doc.id || doc._id) === String(id)) {
          const merged = {
            ...doc,
            ...updatedData,
            rating: parseFloat(updatedData.rating) || doc.rating,
            price: parseInt(updatedData.price, 10) || doc.price,
          };
          api.updateDoctor(id, merged).catch(() => {});
          return merged;
        }
        return doc;
      })
    );
  };

  const deleteDoctor = (id) => {
    setDoctors(prev => prev.filter(doc => String(doc.id || doc._id) !== String(id)));
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
      latitude: hospitalData.latitude !== undefined ? Number(hospitalData.latitude) : undefined,
      longitude: hospitalData.longitude !== undefined ? Number(hospitalData.longitude) : undefined
    };
    setHospitals(prev => [newHospital, ...prev]);
    api.addHospital(newHospital).catch(() => {});
    return newHospital;
  };

  const updateHospital = (id, updatedData) => {
    setHospitals(prev =>
      prev.map(hosp => {
        if (String(hosp.id || hosp._id) === String(id)) {
          const merged = {
            ...hosp,
            ...updatedData,
            rating: updatedData.rating !== undefined ? parseFloat(updatedData.rating) : hosp.rating,
            totalBeds: updatedData.totalBeds !== undefined ? parseInt(updatedData.totalBeds, 10) : hosp.totalBeds,
            emergency24x7: updatedData.emergency24x7 !== undefined ? Boolean(updatedData.emergency24x7) : hosp.emergency24x7,
            specialties: Array.isArray(updatedData.specialties)
              ? updatedData.specialties
              : (typeof updatedData.specialties === 'string'
                  ? updatedData.specialties.split(',').map(s => s.trim()).filter(Boolean)
                  : hosp.specialties),
            reels: updatedData.reels !== undefined ? updatedData.reels : (hosp.reels || []),
            youtube_videos: updatedData.youtube_videos !== undefined ? updatedData.youtube_videos : (hosp.youtube_videos || []),
            photos: updatedData.photos !== undefined ? updatedData.photos : (hosp.photos || []),
            star_doctors: updatedData.star_doctors !== undefined ? updatedData.star_doctors : (hosp.star_doctors || []),
            latitude: updatedData.latitude !== undefined ? (updatedData.latitude === '' || updatedData.latitude === null ? undefined : Number(updatedData.latitude)) : hosp.latitude,
            longitude: updatedData.longitude !== undefined ? (updatedData.longitude === '' || updatedData.longitude === null ? undefined : Number(updatedData.longitude)) : hosp.longitude
          };
          api.updateHospital(id, merged).catch(() => {});
          return merged;
        }
        return hosp;
      })
    );
  };

  const deleteHospital = (id) => {
    setHospitals(prev => prev.filter(hosp => String(hosp.id || hosp._id) !== String(id)));
    api.deleteHospital(id).catch(() => {});
  };

  // Hero & General Content CRUD
  const updateHeroContent = (newFields) => {
    setHeroContent(prev => {
      const merged = { ...prev, ...newFields };
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

  // Reset Front Page Defaults
  const resetFrontPageDefaults = () => {
    setHeroContent(initialHeroContent);
    setServices(initialServices);
    setFeatures(initialFeatures);
    setArticles(initialArticles);
    setCorporateTieups(initialCorporateTieups);
    localStorage.removeItem(STORAGE_KEY_HERO);
    localStorage.removeItem('sehat_buddy_hero_v2');
    localStorage.removeItem(STORAGE_KEY_SERVICES);
    localStorage.removeItem(STORAGE_KEY_FEATURES);
    localStorage.removeItem(STORAGE_KEY_ARTICLES);
    localStorage.removeItem(STORAGE_KEY_CORPORATE);
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
        deleteDoctor,
        addHospital,
        updateHospital,
        deleteHospital,
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
        resetFrontPageDefaults,
        resetToDefaults,
        stats
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export default DataProvider;
