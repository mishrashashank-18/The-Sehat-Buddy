import React from 'react';
import Navbar from './components/layout/Navbar';
import Hero from './components/hero/Hero';
import SearchBar from './components/search/SearchBar';
import ServicesSection from './components/services/ServicesSection';
import WhyChooseSection from './components/why/WhyChooseSection';
import PopularDoctors from './components/doctors/PopularDoctors';
import HealthContentSection from './components/content/HealthContentSection';
import Footer from './components/layout/Footer';
import './styles/global.css';

function App() {
  return (
    <div className="app">
      <Navbar />
      <main>
        <Hero />
        <SearchBar />
        <ServicesSection />
        <WhyChooseSection />
        <PopularDoctors />
        <HealthContentSection />
      </main>
      <Footer />
    </div>
  );
}

export default App;
