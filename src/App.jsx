import React, { useState, useEffect } from 'react';
import { DataProvider } from './context/DataContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Navbar from './components/layout/Navbar';
import Hero from './components/hero/Hero';
import SearchBar from './components/search/SearchBar';
import ServicesSection from './components/services/ServicesSection';
import WhyChooseSection from './components/why/WhyChooseSection';
import PopularDoctors from './components/doctors/PopularDoctors';
import TopHospitals from './components/hospitals/TopHospitals';
import HealthContentSection from './components/content/HealthContentSection';
import CorporateTieups from './components/corporate/CorporateTieups';
import Footer from './components/layout/Footer';
import AdminPanel from './components/admin/AdminPanel';
import DoctorDashboard from './components/doctor-dashboard/DoctorDashboard';
import HospitalDashboard from './components/hospital-dashboard/HospitalDashboard';
import ErrorBoundary from './components/common/ErrorBoundary';
import LoginPage from './components/auth/LoginPage';
import FindDoctors from './components/doctors/FindDoctors';
import DoctorProfile from './components/doctors/DoctorProfile';
import FindHospitals from './components/hospitals/FindHospitals';
import HospitalProfile from './components/hospitals/HospitalProfile';
import ComingSoon from './components/common/ComingSoon';
import { useData } from './context/useData';
import './styles/global.css';

function MainWebsite({ onNavigate, currentView }) {
  return (
    <div className="app">
      <Navbar onNavigate={onNavigate} currentView={currentView} />
      <main>
        <Hero />
        <SearchBar onNavigate={onNavigate} />
        <ServicesSection onNavigate={onNavigate} />
        <WhyChooseSection />
        <PopularDoctors onNavigate={onNavigate} />
        <TopHospitals onNavigate={onNavigate} />
        <HealthContentSection onNavigate={onNavigate} />
        <CorporateTieups onNavigate={onNavigate} />
      </main>
      <Footer onNavigate={onNavigate} />
    </div>
  );
}

const resolveCurrentView = () => {
  const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
  const hash = window.location.hash.toLowerCase();

  if (path === '/admin' || path.startsWith('/admin/') || hash === '#admin' || hash === '#/admin') {
    return 'admin';
  }
  if (path === '/doctor' || path.startsWith('/doctor/') || hash === '#doctor' || hash === '#/doctor') {
    return 'doctor';
  }
  if (path === '/hospital' || path.startsWith('/hospital/') || hash === '#hospital' || hash === '#/hospital') {
    return 'hospital';
  }
  if (path === '/login' || path.startsWith('/login/') || hash === '#login' || hash === '#/login') {
    return 'user-login';
  }
  if (path === '/doctors' || hash === '#doctors' || hash === '#/doctors') {
    return 'find-doctors';
  }
  if (path === '/hospitals' || hash === '#hospitals' || hash === '#/hospitals') {
    return 'find-hospitals';
  }
  if (path.startsWith('/doctors/')) {
    const segments = path.split('/');
    if (segments.length >= 3) {
      return 'doctor-profile:' + segments[2];
    }
  }
  if (path.startsWith('/hospitals/')) {
    const segments = path.split('/');
    if (segments.length >= 3) {
      return 'hospital-profile:' + segments[2];
    }
  }
  if (path.startsWith('/coming-soon/')) {
    const clean = path.replace(/^\/coming-soon\//, '').trim();
    if (clean) return 'coming-soon:' + clean;
  }
  if (hash.startsWith('#/coming-soon/') || hash.startsWith('#coming-soon/')) {
    const clean = hash.replace(/^#\/?coming-soon\//, '').trim();
    if (clean) return 'coming-soon:' + clean;
  }
  if (path === '/about' || hash === '#about') return 'coming-soon:about';
  if (path === '/contact' || hash === '#contact') return 'coming-soon:contact';
  if (path === '/privacy' || hash === '#privacy') return 'coming-soon:privacy';
  if (path === '/terms' || hash === '#terms') return 'coming-soon:terms';
  if (path === '/support' || path === '/provider-support' || hash === '#support') return 'coming-soon:provider-support';
  if (path === '/articles' || hash === '#articles') return 'coming-soon:articles';

  return 'site';
};

const SEHAT_BUDDY_FAVICON_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none'%3E%3Ccircle cx='16' cy='16' r='16' fill='%23FFFFFF'/%3E%3Cpath d='M24.5 17.5c1.3-1.3 2.6-2.8 2.6-4.8 0-2.3-1.9-4.2-4.2-4.2-1.5 0-2.6.4-3.9 1.7-1.3-1.3-2.4-1.7-3.9-1.7-2.3 0-4.2 1.9-4.2 4.2 0 2 1.3 3.5 2.6 4.8l6.1 6.1 5-6.1Z' stroke='%232563EB' stroke-width='2.3' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M9.5 15.5h3.6l.6-.9 1.8 3.8 1.8-5.8 1.4 2.9h4.8' stroke='%232563EB' stroke-width='2.3' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E`;

const makeCircularFavicon = (imageUrl) => {
  return new Promise((resolve) => {
    if (!imageUrl) return resolve(SEHAT_BUDDY_FAVICON_SVG);
    if (imageUrl.startsWith('data:image/svg+xml') && imageUrl.includes('circle')) {
      return resolve(imageUrl);
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(imageUrl);

        // Circular clip
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();

        // White background inside circle
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);

        // Draw image centered inside circle
        const pad = 4;
        ctx.drawImage(img, pad, pad, size - pad * 2, size - pad * 2);

        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(imageUrl);
      }
    };
    img.onerror = () => resolve(imageUrl);
    img.src = imageUrl;
  });
};

function AppContent() {
  const { branding } = useData();
  const [currentView, setCurrentView] = useState(resolveCurrentView);
  const [redirectAfterLogin, setRedirectAfterLogin] = useState(null);

  // Sync Favicon and Document Title dynamically with Branding Settings
  useEffect(() => {
    if (branding?.siteName) {
      document.title = branding.siteName;
    }

    let isMounted = true;
    const rawFavicon =
      branding?.showLogo && branding?.logoType === 'image' && branding?.logoImage
        ? branding.logoImage
        : SEHAT_BUDDY_FAVICON_SVG;

    const applyFavicon = (url) => {
      if (!isMounted) return;
      document.querySelectorAll("link[rel*='icon']").forEach((el) => el.remove());

      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = url.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/png';
      link.href = url.startsWith('data:') ? url : `${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}`;
      document.head.appendChild(link);

      const shortcut = document.createElement('link');
      shortcut.rel = 'shortcut icon';
      shortcut.href = link.href;
      document.head.appendChild(shortcut);
    };

    if (rawFavicon === SEHAT_BUDDY_FAVICON_SVG) {
      applyFavicon(SEHAT_BUDDY_FAVICON_SVG);
    } else {
      makeCircularFavicon(rawFavicon).then(applyFavicon);
    }

    return () => {
      isMounted = false;
    };
  }, [branding]);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentView(resolveCurrentView());
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigateTo = (viewName, param) => {
    let targetPath = '/';
    if (viewName === 'admin') targetPath = '/admin';
    else if (viewName === 'doctor') targetPath = '/doctor';
    else if (viewName === 'hospital') targetPath = '/hospital';
    else if (viewName === 'user-login') targetPath = '/login';
    else if (viewName === 'find-doctors') {
      const queryString = param && typeof param === 'object' 
        ? '?' + new URLSearchParams(param).toString() 
        : '';
      targetPath = '/doctors' + queryString;
    }
    else if (viewName === 'find-hospitals') {
      const queryString = param && typeof param === 'object' 
        ? '?' + new URLSearchParams(param).toString() 
        : '';
      targetPath = '/hospitals' + queryString;
    }
    else if (viewName === 'doctor-profile') targetPath = `/doctors/${param}`;
    else if (viewName === 'hospital-profile') targetPath = `/hospitals/${param}`;
    else if (viewName === 'coming-soon') targetPath = `/coming-soon/${param || 'feature'}`;

    if (viewName === 'user-login' && param) {
      setRedirectAfterLogin(param);
    }

    window.history.pushState({}, '', targetPath);
    window.dispatchEvent(new PopStateEvent('popstate'));
    setCurrentView(
      viewName === 'doctor-profile' 
        ? `doctor-profile:${param}` 
        : viewName === 'hospital-profile'
        ? `hospital-profile:${param}`
        : viewName === 'coming-soon'
        ? `coming-soon:${param || 'feature'}`
        : viewName
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const token = localStorage.getItem('token');

  if (currentView === 'admin') {
    if (!token) return <LoginPage role="admin" setView={navigateTo} />;
    return <AdminPanel onExit={() => navigateTo('site')} onNavigate={navigateTo} />;
  }

  if (currentView === 'doctor') {
    if (!token) return <LoginPage role="doctor" setView={navigateTo} />;
    return <DoctorDashboard onNavigate={navigateTo} />;
  }

  if (currentView === 'hospital') {
    if (!token) return <LoginPage role="hospital" setView={navigateTo} />;
    return <HospitalDashboard onNavigate={navigateTo} />;
  }

  if (currentView === 'user-login') {
    return <LoginPage role="user" setView={(view) => {
      if ((view === 'site' || view === 'home') && redirectAfterLogin) {
        navigateTo(redirectAfterLogin.view, redirectAfterLogin.param);
        setRedirectAfterLogin(null);
      } else {
        navigateTo(view);
      }
    }} />;
  }

  if (currentView === 'find-doctors') {
    return (
      <div className="app">
        <Navbar onNavigate={navigateTo} currentView={currentView} />
        <FindDoctors onNavigate={navigateTo} />
        <Footer onNavigate={navigateTo} />
      </div>
    );
  }

  if (currentView === 'find-hospitals') {
    return (
      <div className="app">
        <Navbar onNavigate={navigateTo} currentView={currentView} />
        <FindHospitals onNavigate={navigateTo} />
        <Footer onNavigate={navigateTo} />
      </div>
    );
  }

  if (currentView.startsWith('doctor-profile:')) {
    const docId = currentView.split(':')[1];
    return (
      <div className="app">
        <Navbar onNavigate={navigateTo} currentView={currentView} />
        <DoctorProfile doctorId={docId} onNavigate={navigateTo} />
        <Footer onNavigate={navigateTo} />
      </div>
    );
  }

  if (currentView.startsWith('hospital-profile:')) {
    const hospId = currentView.split(':')[1];
    return (
      <div className="app">
        <Navbar onNavigate={navigateTo} currentView={currentView} />
        <HospitalProfile hospitalId={hospId} onNavigate={navigateTo} />
        <Footer onNavigate={navigateTo} />
      </div>
    );
  }

  if (currentView.startsWith('coming-soon:')) {
    const feature = currentView.split(':')[1];
    return (
      <div className="app">
        <Navbar onNavigate={navigateTo} currentView={currentView} />
        <ComingSoon featureKey={feature} onNavigate={navigateTo} />
        <Footer onNavigate={navigateTo} />
      </div>
    );
  }

  return <MainWebsite onNavigate={navigateTo} currentView={currentView} />;
}

function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_CLIENT_ID";
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <ErrorBoundary>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </ErrorBoundary>
    </GoogleOAuthProvider>
  );
}

export default App;
