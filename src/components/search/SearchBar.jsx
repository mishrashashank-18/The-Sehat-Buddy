import React, { useState } from 'react';
import { Search, MapPin, ChevronDown } from 'lucide-react';
import Container from '../layout/Container';
import Button from '../common/Button';
import styles from './SearchBar.module.css';

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [speciality, setSpeciality] = useState('');
  const [location, setLocation] = useState('');

  return (
    <Container className={styles.wrapper}>
      <div className={styles.searchCard}>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>I'm looking for</label>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              placeholder="Doctor, Speciality, Treatment..."
              className={styles.input}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
              <option value="" disabled hidden>Select Speciality</option>
              <option value="cardiology">Cardiology</option>
              <option value="neurology">Neurology</option>
              <option value="orthopedics">Orthopedics</option>
            </select>
            <ChevronDown size={18} className={styles.selectIcon} />
          </div>
        </div>
        
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Location</label>
          <div className={styles.inputWrapper}>
            <MapPin size={18} className={styles.iconLocation} />
            <select 
              className={`${styles.select} ${styles.selectWithIcon}`}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="" disabled hidden>Select Location</option>
              <option value="delhi">Delhi</option>
              <option value="mumbai">Mumbai</option>
              <option value="bangalore">Bangalore</option>
            </select>
            <ChevronDown size={18} className={styles.selectIcon} />
          </div>
        </div>
        
        <Button className={styles.searchBtn}>Search</Button>
      </div>
    </Container>
  );
};

export default SearchBar;
