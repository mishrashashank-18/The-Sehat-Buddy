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
import { useData } from './context/useData';
import './styles/global.css';

function MainWebsite({ onNavigate, currentView }) {
  return (
    <div className="app">
      <Navbar onNavigate={onNavigate} currentView={currentView} />
      <main>
        <Hero />
        <SearchBar onNavigate={onNavigate} />
        <ServicesSection />
        <WhyChooseSection />
        <PopularDoctors onNavigate={onNavigate} />
        <TopHospitals onNavigate={onNavigate} />
        <HealthContentSection />
      </main>
      <Footer />
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
  if (hash.startsWith('#/hospitals/') || hash.startsWith('#hospitals/')) {
    const clean = hash.replace(/^#\/?hospitals\//, '');
    if (clean) return 'hospital-profile:' + clean;
  }
  return 'site';
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

    let link = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }

    if (branding?.showLogo && branding?.logoType === 'image' && branding?.logoImage) {
      link.type = 'image/png';
      link.href = branding.logoImage;
    } else {
      link.type = 'image/svg+xml';
      link.href = '/favicon.svg';
    }
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
        <Footer />
      </div>
    );
  }

  if (currentView === 'find-hospitals') {
    return (
      <div className="app">
        <Navbar onNavigate={navigateTo} currentView={currentView} />
        <FindHospitals onNavigate={navigateTo} />
        <Footer />
      </div>
    );
  }

  if (currentView.startsWith('doctor-profile:')) {
    const docId = currentView.split(':')[1];
    return (
      <div className="app">
        <Navbar onNavigate={navigateTo} currentView={currentView} />
        <DoctorProfile doctorId={docId} onNavigate={navigateTo} />
        <Footer />
      </div>
    );
  }

  if (currentView.startsWith('hospital-profile:')) {
    const hospId = currentView.split(':')[1];
    return (
      <div className="app">
        <Navbar onNavigate={navigateTo} currentView={currentView} />
        <HospitalProfile hospitalId={hospId} onNavigate={navigateTo} />
        <Footer />
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
