// src/components/hospital-dashboard/HospitalLocationPicker.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Check, AlertCircle } from 'lucide-react';
import styles from './HospitalDashboard.module.css';

// Custom hospital pin icon for dashboard location picker
const createPickerHospitalIcon = () => {
  return L.divIcon({
    className: 'dashboard-picker-marker',
    html: `
      <div style="
        width: 38px;
        height: 38px;
        background: #ef4444;
        border: 2px solid #ffffff;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      ">
        <span style="transform: rotate(45deg); font-size: 18px; line-height: 1;">🏥</span>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38]
  });
};

// Map click handler and center updater
function MapController({ coords, onMapClick }) {
  const map = useMap();

  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    }
  });

  useEffect(() => {
    if (coords && !isNaN(coords[0]) && !isNaN(coords[1])) {
      map.setView(coords, map.getZoom(), { animate: true });
    }
  }, [coords, map]);

  return null;
}

export default function HospitalLocationPicker({ hospital, onSaveLocation }) {
  const initialLat = hospital?.latitude !== undefined && hospital?.latitude !== null ? Number(hospital.latitude) : 12.9592;
  const initialLng = hospital?.longitude !== undefined && hospital?.longitude !== null ? Number(hospital.longitude) : 77.6534;

  const [latitude, setLatitude] = useState(initialLat);
  const [longitude, setLongitude] = useState(initialLng);
  const [isSaved, setIsSaved] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const markerRef = useRef(null);

  const markerIcon = useMemo(() => createPickerHospitalIcon(), []);

  // Sync state if selected hospital changes
  useEffect(() => {
    if (hospital) {
      setLatitude(hospital.latitude !== undefined && hospital.latitude !== null ? Number(hospital.latitude) : 12.9592);
      setLongitude(hospital.longitude !== undefined && hospital.longitude !== null ? Number(hospital.longitude) : 77.6534);
      setIsSaved(false);
    }
  }, [hospital?.id, hospital?._id, hospital?.latitude, hospital?.longitude]);

  const handleMapClick = (lat, lng) => {
    const fixedLat = Number(lat.toFixed(6));
    const fixedLng = Number(lng.toFixed(6));
    setLatitude(fixedLat);
    setLongitude(fixedLng);
    setIsSaved(false);
  };

  const handleMarkerDragEnd = () => {
    const marker = markerRef.current;
    if (marker) {
      const { lat, lng } = marker.getLatLng();
      const fixedLat = Number(lat.toFixed(6));
      const fixedLng = Number(lng.toFixed(6));
      setLatitude(fixedLat);
      setLongitude(fixedLng);
      setIsSaved(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDetecting(false);
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setLatitude(lat);
        setLongitude(lng);
        setIsSaved(false);
      },
      (err) => {
        setDetecting(false);
        alert('Could not detect location: ' + err.message);
      },
      { timeout: 10000 }
    );
  };

  const handleSave = () => {
    if (isNaN(latitude) || isNaN(longitude)) {
      alert('Please provide valid numerical coordinates.');
      return;
    }

    if (onSaveLocation) {
      onSaveLocation({
        latitude: Number(latitude),
        longitude: Number(longitude)
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  const currentCoords = [Number(latitude) || 12.9592, Number(longitude) || 77.6534];

  return (
    <div style={{
      marginTop: '24px',
      padding: '20px',
      background: '#f8fafc',
      borderRadius: '14px',
      border: '1px solid #e2e8f0'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={18} color="#ef4444" />
            Hospital Location (Leaflet Coordinates Picker)
          </h4>
          <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
            Click anywhere on the map or drag the hospital pin to set precise location for road directions.
          </span>
        </div>
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={detecting}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#334155',
            cursor: 'pointer'
          }}
        >
          <Navigation size={14} color="#2563eb" />
          {detecting ? 'Detecting...' : 'Use My Location'}
        </button>
      </div>

      {/* Leaflet Map Preview */}
      <div style={{
        height: '280px',
        width: '100%',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #cbd5e1',
        marginBottom: '16px',
        position: 'relative'
      }}>
        <MapContainer
          center={currentCoords}
          zoom={14}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController coords={currentCoords} onMapClick={handleMapClick} />
          <Marker
            position={currentCoords}
            icon={markerIcon}
            draggable={true}
            eventHandlers={{
              dragend: handleMarkerDragEnd
            }}
            ref={markerRef}
          >
            <Popup>
              <strong>{hospital?.name || 'Hospital Location'}</strong><br />
              Lat: {Number(latitude).toFixed(4)}, Lng: {Number(longitude).toFixed(4)}<br />
              <small style={{ color: '#64748b' }}>(Drag to reposition)</small>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* Coordinate Input Fields */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px',
        alignItems: 'end'
      }}>
        <div className={styles.formGroup}>
          <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
            Latitude:
          </label>
          <input
            type="number"
            step="any"
            placeholder="22.7196"
            value={latitude}
            onChange={(e) => {
              setLatitude(e.target.value);
              setIsSaved(false);
            }}
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.9rem',
              background: '#ffffff'
            }}
          />
        </div>

        <div className={styles.formGroup}>
          <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
            Longitude:
          </label>
          <input
            type="number"
            step="any"
            placeholder="75.8577"
            value={longitude}
            onChange={(e) => {
              setLongitude(e.target.value);
              setIsSaved(false);
            }}
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.9rem',
              background: '#ffffff'
            }}
          />
        </div>

        <div>
          <button
            type="button"
            onClick={handleSave}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: isSaved ? '#16a34a' : '#2563eb',
              color: '#ffffff',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {isSaved ? (
              <>
                <Check size={16} /> Location Saved!
              </>
            ) : (
              'Save Location'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
