import React, { useState, useEffect } from 'react';
import { MapPin, Star, Bed, ShieldCheck, Search, Filter, Building2, Sparkles, ArrowRight } from 'lucide-react';
import { useData } from '../../context/useData';
import Container from '../layout/Container';
import styles from './FindHospitals.module.css';

const FindHospitals = ({ onNavigate }) => {
  const { hospitals } = useData();

  const queryParams = new URLSearchParams(window.location.search);
  const initialName = queryParams.get('name') || queryParams.get('q') || '';
  const initialLoc = queryParams.get('city') || queryParams.get('location') || '';
  const initialSpec = queryParams.get('specialty') || queryParams.get('speciality') || '';

  const [searchName, setSearchName] = useState(initialName);
  const [searchCity, setSearchCity] = useState(initialLoc);
  const [searchSpecialty, setSearchSpecialty] = useState(initialSpec);

  // Sync state if URL search params change
  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.has('name') || params.has('q')) {
        setSearchName(params.get('name') || params.get('q') || '');
      }
      if (params.has('city') || params.has('location')) {
        setSearchCity(params.get('city') || params.get('location') || '');
      }
      if (params.has('specialty') || params.has('speciality')) {
        setSearchSpecialty(params.get('specialty') || params.get('speciality') || '');
      }
    };

    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);

  // Collect unique cities
  const uniqueCities = Array.from(
    new Set(hospitals.map(h => h.city).filter(Boolean))
  ).sort();

  // Collect unique specialties across all hospitals
  const uniqueSpecialties = Array.from(
    new Set(
      hospitals.flatMap(h => (Array.isArray(h.specialties) ? h.specialties : []))
    )
  ).sort();

  // Filter hospitals based on search criteria
  const filteredHospitals = hospitals.filter(hospital => {
    // Name or address match
    if (searchName) {
      const q = searchName.toLowerCase().trim();
      const nameMatch = hospital.name && hospital.name.toLowerCase().includes(q);
      const addrMatch = hospital.address && hospital.address.toLowerCase().includes(q);
      const cityMatch = hospital.city && hospital.city.toLowerCase().includes(q);
      const specsMatch = Array.isArray(hospital.specialties) && hospital.specialties.some(s => s.toLowerCase().includes(q));
      if (!nameMatch && !addrMatch && !cityMatch && !specsMatch) return false;
    }

    // City match
    if (searchCity) {
      const cQ = searchCity.toLowerCase().trim();
      const cityMatch = hospital.city && hospital.city.toLowerCase().includes(cQ);
      const addrMatch = hospital.address && hospital.address.toLowerCase().includes(cQ);
      if (!cityMatch && !addrMatch) {
        return false;
      }
    }

    // Specialty match
    if (searchSpecialty) {
      const sQ = searchSpecialty.toLowerCase().trim();
      const specs = Array.isArray(hospital.specialties) ? hospital.specialties : [];
      const hasSpec = specs.some(s => s.toLowerCase().includes(sQ) || sQ.includes(s.toLowerCase()));
      if (!hasSpec) return false;
    }

    return true;
  });

  return (
    <div className={styles.pageWrapper}>
      <Container>
        <div className={styles.header}>
          <h1 className={styles.title}>Explore Hospitals & Medical Centers</h1>
          <p className={styles.subtitle}>
            Discover verified partner hospitals, emergency centers, and specialized care facilities.
          </p>
        </div>

        {/* Filter bar */}
        <div className={styles.filterBar}>
            <div className={styles.inputWrapper}>
              <Search size={18} className={styles.inputIcon} />
              <input
                type="text"
                placeholder="Search by hospital name or locality..."
                className={styles.filterInput}
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
            </div>

            <div className={styles.selectWrapper}>
              <MapPin size={18} className={styles.inputIcon} />
              <select
                className={styles.filterSelect}
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
              >
                <option value="">All Cities</option>
                {uniqueCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div className={styles.selectWrapper}>
              <Filter size={18} className={styles.inputIcon} />
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

            {(searchName || searchCity || searchSpecialty) && (
              <button
                className={styles.clearBtn}
                onClick={() => {
                  setSearchName('');
                  setSearchCity('');
                  setSearchSpecialty('');
                }}
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className={styles.resultCount}>
            Showing <strong>{filteredHospitals.length}</strong> {filteredHospitals.length === 1 ? 'hospital' : 'hospitals'}
          </div>

          {/* Hospital Grid */}
          {filteredHospitals.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>No hospitals found</h3>
              <p>Try adjusting your search filters or resetting them to view all available partner hospitals.</p>
              <button
                className={styles.resetBtn}
                onClick={() => {
                  setSearchName('');
                  setSearchCity('');
                  setSearchSpecialty('');
                }}
              >
                View All Hospitals
              </button>
            </div>
          ) : (
            <div className={styles.grid}>
              {filteredHospitals.map((hospital) => (
                <div
                  key={hospital.id || hospital._id}
                  className={styles.card}
                  onClick={() => onNavigate && onNavigate('hospital-profile', hospital.id || hospital._id)}
                >
                  <div className={styles.imageWrapper}>
                    <img
                      src={hospital.image}
                      alt={hospital.name}
                      className={styles.image}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    {hospital.city && (
                      <div className={styles.cityBadge}>
                        <MapPin size={12} /> {hospital.city}
                      </div>
                    )}
                  </div>

                  <div className={styles.info}>
                    <div className={styles.titleRow}>
                      <h3 className={styles.name}>{hospital.name}</h3>
                      <div className={styles.rating}>
                        <Star size={13} fill="#FACC15" color="#FACC15" />
                        <span>{hospital.rating || '4.5'}</span>
                      </div>
                    </div>

                    <p className={styles.address}>{hospital.address}</p>

                    <div className={styles.featuresRow}>
                      {hospital.totalBeds && (
                        <span className={styles.featurePill}>
                          <Bed size={13} /> {hospital.totalBeds} Beds
                        </span>
                      )}
                      {hospital.establishedYear && (
                        <span className={styles.featurePill}>
                          Est. {hospital.establishedYear}
                        </span>
                      )}
                    </div>

                    {hospital.specialties && hospital.specialties.length > 0 && (
                      <div className={styles.specialtiesWrap}>
                        {hospital.specialties.slice(0, 3).map((spec) => (
                          <span key={spec} className={styles.specialtyTag}>{spec}</span>
                        ))}
                        {hospital.specialties.length > 3 && (
                          <span className={styles.specialtyTagMore}>+{hospital.specialties.length - 3}</span>
                        )}
                      </div>
                    )}

                    <div className={styles.cardBottom}>
                      <div className={styles.verifiedBadge}>
                        <ShieldCheck size={14} color="#2563EB" />
                        <span>Verified Partner</span>
                      </div>
                      <button
                        className={styles.viewDetailsBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onNavigate) {
                            onNavigate('hospital-profile', hospital.id || hospital._id);
                          }
                        }}
                      >
                        View Center
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Container>
    </div>
  );
};

export default FindHospitals;
