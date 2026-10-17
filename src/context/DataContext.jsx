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
import { initialFaqs } from '../data/faqs';
import { initialReviews } from '../data/reviews';
import { initialSpecialitiesProcedures } from '../data/specialitiesProcedures';
import { defaultAcceptedInsurances } from '../data/insurancePartners';
import { initialBranding } from '../data/branding';

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
const STORAGE_KEY_BRANDING = 'sehat_buddy_branding_v2';

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
      const saved = localStorage.getItem(STORAGE_KEY_BRANDING);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return { ...initialBranding, ...parsed };
      }
    } catch (e) {
      console.error('Failed to parse branding from localStorage', e);
    }
    return initialBranding;
  });

  // Fetch from Backend API periodically for real-time updates
  useEffect(() => {
    let isMounted = true;
    const fetchBackendData = async () => {
      try {
        const [docsRes, hospsRes, contentRes, faqsRes, reviewsRes, specsRes] = await Promise.allSettled([
          api.getDoctors(),
          api.getHospitals(),
          api.getContent(),
          api.getFaqs(),
          api.getReviews(),
          api.getSpecialitiesProcedures()
        ]);

        if (!isMounted) return;

        if (docsRes.status === 'fulfilled' && Array.isArray(docsRes.value)) {
          setDoctors(prevDoctors => {
            return docsRes.value.map(d => {
              const existing = prevDoctors.find(p => String(p.id || p._id) === String(d._id || d.id));
              return {
                ...d,
                id: d._id || d.id,
                specialty: d.specialization || d.specialty || 'General Physician',
                price: d.fees || d.price || 500,
                experience: typeof d.experience === 'number' ? `${d.experience}+ Years Experience` : (d.experience || d.experienceText || '5+ Years Experience'),
                licenseNumber: d.licenseNumber || existing?.licenseNumber || '',
                awards: Array.isArray(d.awards) && d.awards.length > 0 ? d.awards : (existing?.awards || []),
                certifications: Array.isArray(d.certifications) && d.certifications.length > 0 ? d.certifications : (existing?.certifications || []),
                memberships: Array.isArray(d.memberships) && d.memberships.length > 0 ? d.memberships : (existing?.memberships || []),
                careerExperience: Array.isArray(d.careerExperience) && d.careerExperience.length > 0 ? d.careerExperience : (existing?.careerExperience || [])
              };
            });
          });
        }
        if (hospsRes.status === 'fulfilled' && Array.isArray(hospsRes.value)) {
          setHospitals(hospsRes.value.map(h => ({
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
          })));
        }
        if (contentRes.status === 'fulfilled' && contentRes.value) {
          const { hero, services: sList, features: fList, articles: aList, corporate: cList, branding: bData } = contentRes.value;
          if (hero) {
            setHeroContent(prev => {
              const cleanHero = { ...hero };
              if (typeof cleanHero.heroImage === 'string' && cleanHero.heroImage.startsWith('data:image/') && cleanHero.heroImage.length > 50000) {
                cleanHero.heroImage = prev.heroImage || initialHeroContent.heroImage;
              }
              return { ...prev, ...cleanHero };
            });
          }
          if (bData) setBranding(prev => ({ ...prev, ...bData }));
          if (Array.isArray(sList) && sList.length > 0) setServices(sList);
          if (Array.isArray(fList) && fList.length > 0) setFeatures(fList);
          if (Array.isArray(aList) && aList.length > 0) setArticles(aList);
          if (Array.isArray(cList) && cList.length > 0) setCorporateTieups(cList);
        }
        if (faqsRes.status === 'fulfilled' && Array.isArray(faqsRes.value) && faqsRes.value.length > 0) {
          setFaqs(faqsRes.value.map(f => ({ ...f, id: f._id || f.id })));
        }
        if (reviewsRes.status === 'fulfilled' && Array.isArray(reviewsRes.value) && reviewsRes.value.length > 0) {
          setReviews(reviewsRes.value.map(r => ({ ...r, id: r._id || r.id })));
        }
        if (specsRes.status === 'fulfilled' && Array.isArray(specsRes.value) && specsRes.value.length > 0) {
          setSpecialitiesProcedures(specsRes.value.map(s => ({ ...s, id: s._id || s.id })));
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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FAQS, JSON.stringify(faqs));
    } catch (e) {
      console.error('Failed to save faqs to localStorage', e);
    }
  }, [faqs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(reviews));
    } catch (e) {
      console.error('Failed to save reviews to localStorage', e);
    }
  }, [reviews]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SPECIALITIES, JSON.stringify(specialitiesProcedures));
    } catch (e) {
      console.error('Failed to save specialitiesProcedures to localStorage', e);
    }
  }, [specialitiesProcedures]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BRANDING, JSON.stringify(branding));
    } catch (e) {
      console.error('Failed to save branding to localStorage', e);
    }
  }, [branding]);

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
    setDoctors(prev => {
      const updated = prev.map(doc => {
        if (String(doc.id || doc._id) === String(id)) {
          const merged = {
            ...doc,
            ...updatedData,
            rating: updatedData.rating !== undefined ? parseFloat(updatedData.rating) || doc.rating : doc.rating,
            price: updatedData.price !== undefined ? parseInt(updatedData.price, 10) || doc.price : doc.price,
            awards: updatedData.awards !== undefined ? updatedData.awards : doc.awards,
            certifications: updatedData.certifications !== undefined ? updatedData.certifications : doc.certifications,
            memberships: updatedData.memberships !== undefined ? updatedData.memberships : doc.memberships,
            careerExperience: updatedData.careerExperience !== undefined ? updatedData.careerExperience : doc.careerExperience,
            licenseNumber: updatedData.licenseNumber !== undefined ? updatedData.licenseNumber : doc.licenseNumber
          };
          api.updateDoctor(id, merged).catch(() => {});
          return merged;
        }
        return doc;
      });
      try {
        localStorage.setItem(STORAGE_KEY_DOCTORS, JSON.stringify(updated));
      } catch {}
      return updated;
    });
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
      if (String(f.id || f._id) === String(id)) {
        const merged = { ...f, ...updatedData };
        api.updateFaq(id, merged).catch(() => {});
        return merged;
      }
      return f;
    }));
  };

  const deleteFaq = (id) => {
    setFaqs(prev => prev.filter(f => String(f.id || f._id) !== String(id)));
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
      if (String(r.id || r._id) === String(id)) {
        const merged = { ...r, ...updatedData };
        api.updateReview(id, merged).catch(() => {});
        return merged;
      }
      return r;
    }));
  };

  const deleteReview = (id) => {
    setReviews(prev => prev.filter(r => String(r.id || r._id) !== String(id)));
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
      if (String(s.id || s._id) === String(id)) {
        const merged = { ...s, ...updatedData };
        api.updateSpecialityProcedure(id, merged).catch(() => {});
        return merged;
      }
      return s;
    }));
  };

  const deleteSpecialityProcedure = (id) => {
    setSpecialitiesProcedures(prev => prev.filter(s => String(s.id || s._id) !== String(id)));
    api.deleteSpecialityProcedure(id).catch(() => {});
  };

  // 10. Branding & Site Identity CRUD
  const updateBranding = (newFields) => {
    setBranding(prev => {
      const merged = { ...prev, ...newFields };
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
        stats
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export default DataProvider;
