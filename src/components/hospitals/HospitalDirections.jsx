// src/components/hospitals/HospitalDirections.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, X, Navigation, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { getRoute } from '../../services/routingService';
import styles from './HospitalDirections.module.css';

// Custom User Location Pin Icon (pulsing blue circle)
const createUserIcon = () => {
  return L.divIcon({
    className: 'user-location-marker',
    html: '<div class="user-marker-pulse"></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

// Custom Hospital Marker Pin Icon (red location pin with medical cross)
const createHospitalIcon = () => {
  return L.divIcon({
    className: 'hospital-marker-icon',
    html: `
      <div class="hospital-marker-pin">
        <span class="hospital-marker-inner">🏥</span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  });
};

// Helper component to auto-fit map view bounds
function FitBounds({ bounds }) {
  const map = useMap();

  useEffect(() => {
    if (!bounds || bounds.length === 0) return;
    try {
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 16,
        animate: true
      });
    } catch (err) {
      console.warn('[HospitalDirections] fitBounds error:', err);
    }
  }, [map, bounds]);

  return null;
}

export default function HospitalDirections({ hospital, userLocation, onClose }) {
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userIcon = useMemo(() => createUserIcon(), []);
  const hospitalIcon = useMemo(() => createHospitalIcon(), []);

  const userCoords = useMemo(() => {
    if (!userLocation) return null;
    return [userLocation.latitude, userLocation.longitude];
  }, [userLocation]);

  const hospitalCoords = useMemo(() => {
    if (!hospital || hospital.latitude == null || hospital.longitude == null) return null;
    return [Number(hospital.latitude), Number(hospital.longitude)];
  }, [hospital]);

  // Fetch route when coordinates are available
  const fetchRoute = async () => {
    if (!userCoords || !hospitalCoords) return;

    setLoading(true);
    setError(null);

    try {
      const res = await getRoute(
        { latitude: userCoords[0], longitude: userCoords[1] },
        { latitude: hospitalCoords[0], longitude: hospitalCoords[1] }
      );

      if (res && res.coordinates && res.coordinates.length > 0) {
        setRouteCoordinates(res.coordinates);
        setDistance(res.distance);
        setDuration(res.duration);
        setProvider(res.provider);
      } else {
        throw new Error('No road route could be calculated.');
      }
    } catch (err) {
      console.error('[HospitalDirections] Route error:', err);
      setError(err.message || 'Failed to calculate driving route.');
      // Fallback straight line if road routing failed so user still sees both points
      setRouteCoordinates([userCoords, hospitalCoords]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoute();
  }, [userCoords, hospitalCoords]);

  // Calculate bounds to encompass user, hospital, and all route points
  const mapBounds = useMemo(() => {
    if (routeCoordinates && routeCoordinates.length > 0) {
      return routeCoordinates;
    }
    if (userCoords && hospitalCoords) {
      return [userCoords, hospitalCoords];
    }
    if (hospitalCoords) {
      return [hospitalCoords];
    }
    return null;
  }, [routeCoordinates, userCoords, hospitalCoords]);

  const defaultCenter = hospitalCoords || [12.9716, 77.5946];

  // Prevent background scrolling while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Hospital Directions">
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <button onClick={onClose} className={styles.backBtn} aria-label="Back to Hospital Details">
              <ArrowLeft size={18} />
              <span>Back</span>
            </button>
            <div className={styles.titleArea}>
              <h2>Directions to {hospital.name}</h2>
              <p>{hospital.address}</p>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeIconBtn} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Metrics Bar */}
        <div className={styles.metricsBar}>
          <div className={styles.metricsGroup}>
            <div className={styles.metricItem}>
              <div className={`${styles.metricIconWrap} ${styles.distIcon}`}>
                <Navigation size={18} />
              </div>
              <div>
                <div className={styles.metricLabel}>Distance</div>
                <div className={styles.metricValue}>
                  {loading ? 'Calculating...' : (distance || 'Direct path')}
                </div>
              </div>
            </div>

            <div className={styles.metricItem}>
              <div className={`${styles.metricIconWrap} ${styles.etaIcon}`}>
                <Clock size={18} />
              </div>
              <div>
                <div className={styles.metricLabel}>Estimated Time (ETA)</div>
                <div className={styles.metricValue}>
                  {loading ? 'Calculating...' : (duration || '--')}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.routePoints}>
            <span className={`${styles.pointBadge} ${styles.originBadge}`}>
              📍 Your Location
            </span>
            <span className={styles.routeArrow}>➔</span>
            <span className={`${styles.pointBadge} ${styles.destBadge}`} title={hospital.name}>
              🏥 {hospital.name}
            </span>
          </div>
        </div>

        {/* Interactive Leaflet Map */}
        <div className={styles.mapContainer}>
          {loading && (
            <div className={styles.loadingOverlay}>
              <RefreshCw size={16} className={styles.spin} />
              <span>Calculating road route via OpenRouteService...</span>
            </div>
          )}

          {error && (
            <div className={styles.errorBanner}>
              <AlertCircle size={18} />
              <span>{error}</span>
              <button onClick={fetchRoute} className={styles.retryBtn}>Retry</button>
            </div>
          )}

          <MapContainer
            center={defaultCenter}
            zoom={13}
            scrollWheelZoom={true}
            className={styles.leafletMap}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Fit bounds dynamically */}
            {mapBounds && <FitBounds bounds={mapBounds} />}

            {/* User Location Marker */}
            {userCoords && (
              <Marker position={userCoords} icon={userIcon}>
                <Popup>
                  <div style={{ fontWeight: 600, color: '#1e3a8a', marginBottom: '4px' }}>
                    📍 Your Current Location
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Latitude: {userCoords[0].toFixed(4)}, Longitude: {userCoords[1].toFixed(4)}
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Hospital Marker */}
            {hospitalCoords && (
              <Marker position={hospitalCoords} icon={hospitalIcon}>
                <Popup>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                    🏥 {hospital.name}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                    {hospital.address}
                  </div>
                  {hospital.phone && (
                    <div style={{ fontSize: '0.78rem', color: '#2563eb', marginTop: '4px' }}>
                      📞 {hospital.phone}
                    </div>
                  )}
                </Popup>
              </Marker>
            )}

            {/* Road Route Polyline */}
            {routeCoordinates && routeCoordinates.length > 0 && (
              <Polyline
                positions={routeCoordinates}
                color="#2563eb"
                weight={6}
                opacity={0.85}
                lineCap="round"
                lineJoin="round"
              />
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
