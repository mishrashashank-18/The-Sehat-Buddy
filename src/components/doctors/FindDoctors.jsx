import React, { useState } from 'react';
import { useData } from '../../context/useData';
import Container from '../layout/Container';
import DoctorCard from './DoctorCard';
import styles from './FindDoctors.module.css';

const FindDoctors = ({ onNavigate }) => {
  const { doctors } = useData();
  
  // Read any initial query params passed from SearchBar / URL
  const queryParams = new URLSearchParams(window.location.search);
  const initialName = queryParams.get('name') || queryParams.get('q') || '';
  const initialLoc = queryParams.get('location') || queryParams.get('city') || '';
  const initialSpec = queryParams.get('specialty') || queryParams.get('speciality') || '';

  const [searchName, setSearchName] = useState(initialName);
  const [searchLocation, setSearchLocation] = useState(initialLoc);
  const [searchSpecialty, setSearchSpecialty] = useState(initialSpec);

  // Sync state if URL search params change
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('name') || params.has('q')) {
      setSearchName(params.get('name') || params.get('q') || '');
    }
    if (params.has('location') || params.has('city')) {
      setSearchLocation(params.get('location') || params.get('city') || '');
    }
    if (params.has('specialty') || params.has('speciality')) {
      setSearchSpecialty(params.get('specialty') || params.get('speciality') || '');
    }
  }, []);

  // Helper to ensure core anchor doctor (Dr. Rahul Verma) is permanently visible
  const isProtectedDoctor = (doc) => {
    if (!doc) return false;
    const name = (doc.name || '').toLowerCase();
    const email = (doc.email || '').toLowerCase();
    const id = String(doc.id || doc._id || '');
    return name.includes('rahul') || email.includes('rahul') || id === '1' || id === '6ac270f38586bcec9f96207f';
  };

  // Get unique specialties for the dropdown
  const uniqueSpecialties = Array.from(new Set(
    doctors
      .filter(d => d.available !== false || isProtectedDoctor(d))
      .map(d => d.specialty || d.specialization)
      .filter(Boolean)
  ));

  // Filter for active/listed doctors and apply search criteria
  const activeDoctors = doctors.filter(doc => {
    // Only filter out doctors explicitly de-listed by admin, never core doctor Dr. Rahul Verma
    if (!isProtectedDoctor(doc) && doc.available === false) return false;
    
    // Keyword match (name, specialty, degree, about, or treatments)
    if (searchName) {
      const q = searchName.toLowerCase().trim();
      const nameMatch = doc.name && doc.name.toLowerCase().includes(q);
      const specMatch = (doc.specialty && doc.specialty.toLowerCase().includes(q)) ||
                        (doc.specialization && doc.specialization.toLowerCase().includes(q));
      const hospMatch = doc.hospital && doc.hospital.toLowerCase().includes(q);
      const degreeMatch = doc.degree && doc.degree.toLowerCase().includes(q);
      const aboutMatch = doc.about && doc.about.toLowerCase().includes(q);
      if (!nameMatch && !specMatch && !hospMatch && !degreeMatch && !aboutMatch) return false;
    }
    
    // Location match (check hospital, address.line1, address.line2, address.city)
    if (searchLocation) {
      const locQ = searchLocation.toLowerCase().trim();
      const locMatch = (doc.hospital && doc.hospital.toLowerCase().includes(locQ)) ||
                       (doc.address && typeof doc.address === 'string' && doc.address.toLowerCase().includes(locQ)) ||
                       (doc.address?.city && doc.address.city.toLowerCase().includes(locQ)) ||
                       (doc.address?.line1 && doc.address.line1.toLowerCase().includes(locQ)) ||
                       (doc.address?.line2 && doc.address.line2.toLowerCase().includes(locQ));
      if (!locMatch) return false;
    }
    
    // Specialty match
    if (searchSpecialty) {
      const specQ = searchSpecialty.toLowerCase().trim();
      const docSpec = (doc.specialty || doc.specialization || '').toLowerCase().trim();
      if (!docSpec.includes(specQ) && !specQ.includes(docSpec)) return false;
    }
    
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
