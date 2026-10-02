import React, { useState, useEffect } from 'react';
import { DataProvider } from './context/DataContext';
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
import './styles/global.css';

function MainWebsite() {
  return (
    <div className="app">
      <Navbar />
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

    window.history.pushState({}, '', targetPath);
    setCurrentView(viewName);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (currentView === 'admin') {
    return <AdminPanel onExit={() => navigateTo('site')} onNavigate={navigateTo} />;
  }

  if (currentView === 'doctor') {
    return <DoctorDashboard onNavigate={navigateTo} />;
  }

  if (currentView === 'hospital') {
    return <HospitalDashboard onNavigate={navigateTo} />;
  }

  return <MainWebsite />;
}

function App() {
  return (
    <ErrorBoundary>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </ErrorBoundary>
  );
}

export default App;
