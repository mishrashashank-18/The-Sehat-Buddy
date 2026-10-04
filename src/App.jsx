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
import './styles/global.css';

function MainWebsite({ onNavigate }) {
  return (
    <div className="app">
      <Navbar onNavigate={onNavigate} />
      <main>
        <Hero />
        <SearchBar />
        <ServicesSection />
        <WhyChooseSection />
        <PopularDoctors />
        <TopHospitals />
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
  return 'site';
};

function AppContent() {
  const [currentView, setCurrentView] = useState(resolveCurrentView);

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

  const navigateTo = (viewName) => {
    let targetPath = '/';
    if (viewName === 'admin') targetPath = '/admin';
    else if (viewName === 'doctor') targetPath = '/doctor';
    else if (viewName === 'hospital') targetPath = '/hospital';
    else if (viewName === 'user-login') targetPath = '/login';

    window.history.pushState({}, '', targetPath);
    setCurrentView(viewName);
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
    return <LoginPage role="user" setView={navigateTo} />;
  }

  return <MainWebsite onNavigate={navigateTo} />;
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
