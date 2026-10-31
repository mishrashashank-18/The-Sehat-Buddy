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
import AdminHospitalEditPage from './components/admin/AdminHospitalEditPage';
import DoctorDashboard from './components/doctor-dashboard/DoctorDashboard';
import HospitalDashboard from './components/hospital-dashboard/HospitalDashboard';
import ErrorBoundary from './components/common/ErrorBoundary';
import LoginPage from './components/auth/LoginPage';
import FindDoctors from './components/doctors/FindDoctors';
import DoctorProfile from './components/doctors/DoctorProfile';
import FindHospitals from './components/hospitals/FindHospitals';
import HospitalProfile from './components/hospitals/HospitalProfile';
import ComingSoon from './components/common/ComingSoon';
import PolicyViewerModal from './components/common/PolicyViewerModal';
import ContactUs from './components/contact/ContactUs';
import { useData } from './context/useData';
import { NEW_SEHAT_BUDDY_FAVICON } from './data/faviconDataUri';
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

  const adminHospMatch = path.match(/^\/admin\/hospitals\/([^/]+)\/edit$/);
  if (adminHospMatch) {
    return 'admin-edit-hospital:' + adminHospMatch[1];
  }
  const hashAdminHospMatch = hash.match(/^#\/?admin\/hospitals\/([^/]+)\/edit$/) || hash.match(/^#\/?admin-edit-hospital\/([^/]+)$/);
  if (hashAdminHospMatch) {
    return 'admin-edit-hospital:' + hashAdminHospMatch[1];
  }

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
    if (clean === 'contact' || clean === 'contact-us') return 'contact';
    if (clean) return 'coming-soon:' + clean;
  }
  if (hash.startsWith('#/coming-soon/') || hash.startsWith('#coming-soon/')) {
    const clean = hash.replace(/^#\/?coming-soon\//, '').trim();
    if (clean === 'contact' || clean === 'contact-us') return 'contact';
    if (clean) return 'coming-soon:' + clean;
  }
  if (path === '/lab-tests' || path === '/services/lab-tests' || hash === '#lab-tests') return 'coming-soon:lab-tests';
  if (path === '/surgeries' || path === '/services/surgeries' || hash === '#surgeries') return 'coming-soon:surgeries';
  if (path === '/senior-care' || path === '/services/senior-care') return 'coming-soon:senior-care';
  if (path === '/women-care' || path === '/services/women-care') return 'coming-soon:women-care';
  if (path === '/kid-care' || path === '/services/kid-care') return 'coming-soon:kid-care';
  if (path === '/care-services' || hash === '#care-services') return 'coming-soon:care-services';
  if (path === '/services' || hash === '#services') return 'coming-soon:all-services';
  if (path === '/about' || hash === '#about') return 'coming-soon:about';
  if (path === '/contact' || path === '/contact-us' || hash === '#contact' || hash === '#contact-us') return 'contact';
  if (path === '/privacy' || hash === '#privacy') return 'coming-soon:privacy';
  if (path === '/terms' || hash === '#terms') return 'coming-soon:terms';
  if (path === '/support' || path === '/provider-support' || hash === '#support') return 'coming-soon:provider-support';
  if (path === '/articles' || hash === '#articles') return 'coming-soon:articles';

  return 'site';
};

const makeCircularFavicon = (imageUrl) => {
  return new Promise((resolve) => {
    if (
      !imageUrl ||
      imageUrl.includes('M24.5 17.5') ||
      imageUrl.includes('M9.5 15.5') ||
      imageUrl === NEW_SEHAT_BUDDY_FAVICON ||
      imageUrl === '/favicon.png' ||
      imageUrl === '/favicon.ico' ||
      imageUrl === '/logo.png' ||
      imageUrl.includes('logo.png')
    ) {
      return resolve(NEW_SEHAT_BUDDY_FAVICON);
    }
    if (imageUrl.startsWith('data:image/svg+xml') && imageUrl.includes('circle')) {
      return resolve(imageUrl);
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const size = 192;
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

        // Draw image centered inside circle preserving aspect ratio
        const aspect = (img.width || 1) / (img.height || 1);
        const maxInner = size * 0.75;
        let drawW = maxInner;
        let drawH = maxInner;
        if (aspect >= 1) {
          drawH = maxInner / aspect;
        } else {
          drawW = maxInner * aspect;
        }
        const drawX = (size - drawW) / 2;
        const drawY = (size - drawH) / 2;
        ctx.drawImage(img, drawX, drawY, drawW, drawH);

        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(imageUrl);
      }
    };
    img.onerror = () => resolve(NEW_SEHAT_BUDDY_FAVICON);
    img.src = imageUrl;
  });
};

const parseJwtPayload = (token) => {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
      const jsonPayload = decodeURIComponent(
        atob(padded)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    }
  } catch {}
  return null;
};

export const getRoleToken = (role) => {
  try {
    // 1. Role-specific isolated token
    const roleToken = localStorage.getItem(`${role}_token`);
    if (roleToken) {
      const payload = parseJwtPayload(roleToken);
      if (payload && payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem(`${role}_token`);
        localStorage.removeItem(`${role}_user`);
      } else {
        return roleToken;
      }
    }

    // 2. Fallback to general token with self-healing migration
    const generalToken = localStorage.getItem('token');
    if (generalToken) {
      const payload = parseJwtPayload(generalToken);
      if (payload) {
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          // expired
        } else if (payload.role === role) {
          localStorage.setItem(`${role}_token`, generalToken);
          return generalToken;
        }
      }
    }

    // 3. Fallback to user object in localStorage
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      if (u && u.role === role && generalToken) {
        localStorage.setItem(`${role}_token`, generalToken);
        localStorage.setItem(`${role}_user`, JSON.stringify(u));
        return generalToken;
      }
    } catch {}

    return null;
  } catch {
    return null;
  }
};

export const getRoleUser = (role) => {
  try {
    const specific = localStorage.getItem(`${role}_user`);
    if (specific) return JSON.parse(specific);

    const general = localStorage.getItem('user');
    if (general) {
      const parsed = JSON.parse(general);
      if (parsed.role === role) {
        localStorage.setItem(`${role}_user`, general);
        return parsed;
      }
    }
    return null;
  } catch {
    return null;
  }
};

const getSessionRole = (targetRole) => {
  const token = targetRole ? getRoleToken(targetRole) : localStorage.getItem('token');
  if (!token) {
    const roleUser = targetRole ? getRoleUser(targetRole) : null;
    if (roleUser && roleUser.role) return roleUser.role;
    return null;
  }

  const payload = parseJwtPayload(token);
  if (payload) {
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      if (targetRole) {
        localStorage.removeItem(`${targetRole}_token`);
        localStorage.removeItem(`${targetRole}_user`);
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      return null;
    }
    if (payload.role) return payload.role;
  }

  try {
    const user = targetRole ? getRoleUser(targetRole) : JSON.parse(localStorage.getItem('user') || '{}');
    if (user && user.role) return user.role;
  } catch {}

  return null;
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
    const hasCustomFavicon =
      branding?.favicon &&
      branding.favicon !== '/favicon.png' &&
      branding.favicon !== '/favicon.ico' &&
      branding.favicon !== '/logo.png' &&
      !branding.favicon.includes('logo.png') &&
      !branding.favicon.includes('M24.5 17.5');

    if (!hasCustomFavicon) {
      return;
    }

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

      const appleTouch = document.createElement('link');
      appleTouch.rel = 'apple-touch-icon';
      appleTouch.href = link.href;
      document.head.appendChild(appleTouch);
    };

    makeCircularFavicon(branding.favicon).then(applyFavicon);

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
    let resolvedView = viewName;
    let resolvedParam = param;

    if (typeof viewName === 'string' && viewName.includes(':')) {
      const parts = viewName.split(':');
      resolvedView = parts[0];
      resolvedParam = parts.slice(1).join(':');
    }

    let targetPath = '/';
    if (resolvedView === 'admin') {
      if (resolvedParam) {
        targetPath = `/admin?tab=${encodeURIComponent(resolvedParam)}`;
        try {
          localStorage.setItem('sehat_admin_active_tab', resolvedParam);
        } catch {}
      } else {
        targetPath = '/admin';
      }
    }
    else if (resolvedView === 'admin-edit-hospital') targetPath = `/admin/hospitals/${resolvedParam}/edit`;
    else if (resolvedView === 'doctor') targetPath = '/doctor';
    else if (resolvedView === 'hospital') targetPath = '/hospital';
    else if (resolvedView === 'user-login') targetPath = '/login';
    else if (resolvedView === 'find-doctors') {
      const queryString = resolvedParam && typeof resolvedParam === 'object' 
        ? '?' + new URLSearchParams(resolvedParam).toString() 
        : '';
      targetPath = '/doctors' + queryString;
    }
    else if (resolvedView === 'find-hospitals') {
      const queryString = resolvedParam && typeof resolvedParam === 'object' 
        ? '?' + new URLSearchParams(resolvedParam).toString() 
        : '';
      targetPath = '/hospitals' + queryString;
    }
    else if (resolvedView === 'doctor-profile') targetPath = `/doctors/${resolvedParam}`;
    else if (resolvedView === 'hospital-profile') targetPath = `/hospitals/${resolvedParam}`;
    else if (resolvedView === 'coming-soon') targetPath = `/coming-soon/${resolvedParam || 'feature'}`;
    else if (resolvedView === 'contact') targetPath = '/contact';

    if (resolvedView === 'user-login' && resolvedParam) {
      setRedirectAfterLogin(resolvedParam);
    }

    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }

    setCurrentView(
      resolvedView === 'admin-edit-hospital'
        ? `admin-edit-hospital:${resolvedParam}`
        : resolvedView === 'doctor-profile' 
        ? `doctor-profile:${resolvedParam}` 
        : resolvedView === 'hospital-profile'
        ? `hospital-profile:${resolvedParam}`
        : resolvedView === 'coming-soon'
        ? `coming-soon:${resolvedParam || 'feature'}`
        : resolvedView
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const adminToken = getRoleToken('admin');
  const adminRole = getSessionRole('admin');

  const doctorToken = getRoleToken('doctor');
  const doctorRole = getSessionRole('doctor');

  const hospitalToken = getRoleToken('hospital');
  const hospitalRole = getSessionRole('hospital');

  if (currentView.startsWith('admin-edit-hospital:')) {
    const hospId = currentView.split(':')[1];
    if (!adminToken || adminRole !== 'admin') return <LoginPage role="admin" setView={navigateTo} />;
    return <AdminHospitalEditPage hospitalId={hospId} onNavigate={navigateTo} />;
  }

  if (currentView === 'admin') {
    if (!adminToken || adminRole !== 'admin') return <LoginPage role="admin" setView={navigateTo} />;
    return <AdminPanel onExit={() => navigateTo('site')} onNavigate={navigateTo} />;
  }

  if (currentView === 'doctor') {
    if (!doctorToken || doctorRole !== 'doctor') return <LoginPage role="doctor" setView={navigateTo} />;
    return <DoctorDashboard onNavigate={navigateTo} />;
  }

  if (currentView === 'hospital') {
    if (!hospitalToken || hospitalRole !== 'hospital') return <LoginPage role="hospital" setView={navigateTo} />;
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
    const isPolicy = feature === 'privacy' || feature === 'terms';
    return (
      <div className="app">
        <Navbar onNavigate={navigateTo} currentView={currentView} />
        <ComingSoon featureKey={feature} onNavigate={navigateTo} />
        <Footer onNavigate={navigateTo} />
        {isPolicy && (
          <PolicyViewerModal
            isOpen={true}
            type={feature}
            onClose={() => navigateTo('home')}
          />
        )}
      </div>
    );
  }

  if (currentView === 'contact') {
    return (
      <div className="app contactViewApp">
        <Navbar onNavigate={navigateTo} currentView={currentView} />
        <ContactUs onNavigate={navigateTo} />
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
