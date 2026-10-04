import React, { useState } from 'react';
import { useData } from '../../context/useData';
import Container from '../layout/Container';
import DoctorCard from './DoctorCard';
import styles from './FindDoctors.module.css';

const FindDoctors = ({ onNavigate }) => {
  const { doctors } = useData();
  
  const [searchName, setSearchName] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [searchSpecialty, setSearchSpecialty] = useState('');

  // Get unique specialties for the dropdown
  const uniqueSpecialties = Array.from(new Set(doctors.filter(d => d.available !== false).map(d => d.specialty || d.specialization).filter(Boolean)));

  // Filter for active/listed doctors and apply search criteria
  const activeDoctors = doctors.filter(doc => {
    if (doc.available === false) return false;
    
    // Name match
    if (searchName && !doc.name.toLowerCase().includes(searchName.toLowerCase())) return false;
    
    // Location match (check hospital, address.line1, address.line2)
    if (searchLocation) {
      const locMatch = (doc.hospital && doc.hospital.toLowerCase().includes(searchLocation.toLowerCase())) ||
                       (doc.address && typeof doc.address === 'string' && doc.address.toLowerCase().includes(searchLocation.toLowerCase())) ||
                       (doc.address?.line1 && doc.address.line1.toLowerCase().includes(searchLocation.toLowerCase())) ||
                       (doc.address?.line2 && doc.address.line2.toLowerCase().includes(searchLocation.toLowerCase()));
      if (!locMatch) return false;
    }
    
    // Specialty match
    if (searchSpecialty && (doc.specialty || doc.specialization) !== searchSpecialty) return false;
    
    return true;
  });

  return (
    <div className={styles.pageWrapper}>
      <Container>
        <div className={styles.header}>
          <h1 className={styles.title}>Find Doctors</h1>
          <p className={styles.subtitle}>Book appointments with the best doctors in your area.</p>
        </div>

        <div className={styles.filterBar}>
          <input 
            type="text" 
            placeholder="Search by doctor name..." 
            className={styles.filterInput}
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />
          <input 
            type="text" 
            placeholder="Search by location or hospital..." 
            className={styles.filterInput}
            value={searchLocation}
            onChange={(e) => setSearchLocation(e.target.value)}
          />
          <select 
            className={styles.filterSelect}
            value={searchSpecialty}
            onChange={(e) => setSearchSpecialty(e.target.value)}
          >
            <option value="">All Specialties</option>
            {uniqueSpecialties.map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>

        {activeDoctors.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>No doctors found</h3>
            <p>Try adjusting your search filters to find what you're looking for.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {activeDoctors.map((doctor) => (
              <DoctorCard 
                key={doctor.id || doctor._id} 
                doctor={doctor} 
                onNavigate={onNavigate}
                showBookNow={true}
              />
            ))}
          </div>
        )}
      </Container>
    </div>
  );
};

export default FindDoctors;
