import React, { useState } from 'react';
import { Search, MapPin, ChevronDown } from 'lucide-react';
import Container from '../layout/Container';
import Button from '../common/Button';
import { useData } from '../../context/useData';
import styles from './SearchBar.module.css';

const SearchBar = ({ onNavigate }) => {
  const { doctors, hospitals, branding, heroContent } = useData();
  const currentCity = heroContent?.city || branding?.city || 'Bengaluru';

  const [searchQuery, setSearchQuery] = useState('');
  const [speciality, setSpeciality] = useState('');

  // Collect dynamic list of specialties from doctors and hospitals
  const specialtiesSet = new Set();
  doctors?.forEach(doc => {
    if (doc.specialty) specialtiesSet.add(doc.specialty);
    if (doc.specialization) specialtiesSet.add(doc.specialization);
  });
  hospitals?.forEach(hosp => {
    if (Array.isArray(hosp.specialties)) {
      hosp.specialties.forEach(s => specialtiesSet.add(s));
    }
  });
  // Fallbacks if list is small
  ['Cardiology', 'Neurology', 'Orthopedics', 'Gynecology', 'Pediatrics', 'Dermatology'].forEach(s => specialtiesSet.add(s));
  const uniqueSpecialties = Array.from(specialtiesSet).sort();

  const handleSearch = (e) => {
    if (e) e.preventDefault();

    const query = searchQuery.trim();
    const loc = currentCity;
    const spec = speciality.trim();

    // Check if query specifically targets a hospital
    const lowerQ = query.toLowerCase();
    const hospitalMatch = hospitals?.some(h => 
      h.name?.toLowerCase().includes(lowerQ)
    );

    // If query matches a hospital name and no doctor name, or user is primarily looking for hospital
    const isHospitalQuery = query && hospitalMatch && !doctors?.some(d => d.name?.toLowerCase().includes(lowerQ));

    const searchParams = {};
    if (query) searchParams.q = query;
    if (loc) searchParams.location = loc;
    if (spec) searchParams.specialty = spec;

    if (onNavigate) {
      if (isHospitalQuery) {
        onNavigate('find-hospitals', searchParams);
      } else {
        // Default to finding doctors matching criteria (or finding doctors & hospitals)
        onNavigate('find-doctors', searchParams);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  return (
    <Container className={styles.wrapper}>
      <form className={styles.searchCard} onSubmit={handleSearch}>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>I'm looking for</label>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              placeholder="Doctor, Speciality, Treatment..."
              className={styles.input}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Search size={18} className={styles.icon} />
          </div>
        </div>
        
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Speciality</label>
          <div className={styles.inputWrapper}>
            <select 
              className={styles.select}
              value={speciality}
              onChange={(e) => setSpeciality(e.target.value)}
            >
              <option value="">Select Speciality</option>
              {uniqueSpecialties.map((spec) => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
            <ChevronDown size={18} className={styles.selectIcon} />
          </div>
        </div>
        
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Location</label>
          <div className={styles.inputWrapper}>
            <MapPin size={18} className={styles.iconLocation} />
            <input
              type="text"
              className={`${styles.input} ${styles.selectWithIcon}`}
              value={currentCity}
              readOnly
              style={{ cursor: 'default', color: '#1e293b', fontWeight: 500, backgroundColor: '#ffffff' }}
              title={`Currently serving ${currentCity}`}
            />
          </div>
        </div>
        
        <Button type="submit" className={styles.searchBtn} onClick={handleSearch}>
          Search
        </Button>
      </form>
    </Container>
  );
};

export default SearchBar;
