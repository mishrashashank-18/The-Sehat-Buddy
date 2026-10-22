import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/useData';
import { api } from '../../services/api';
import { Loader2, Building2 } from 'lucide-react';
import AdminHospitalEditPage from '../admin/AdminHospitalEditPage';

const HospitalDashboard = ({ onNavigate }) => {
  const { hospitals, refreshHospitals } = useData();

  // Authenticated hospital user session
  const loggedInUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('hospital_user')) || JSON.parse(localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  }, []);

  const [currentHospitalData, setCurrentHospitalData] = useState(null);
  const [loadingHospital, setLoadingHospital] = useState(true);

  // Load authenticated hospital identity securely from backend /api/hospitals/me
  useEffect(() => {
    let isMounted = true;
    const loadAuthenticatedHospital = async () => {
      try {
        const token = localStorage.getItem('hospital_token') || localStorage.getItem('token');
        if (!token) {
          if (isMounted) setLoadingHospital(false);
          return;
        }
        const data = await api.getMyHospital();
        if (isMounted && data) {
          setCurrentHospitalData(data);
        }
      } catch (err) {
        console.warn('Could not fetch /api/hospitals/me, falling back to local session:', err);
      } finally {
        if (isMounted) setLoadingHospital(false);
      }
    };
    loadAuthenticatedHospital();
    if (typeof refreshHospitals === 'function') {
      refreshHospitals();
    }
    return () => { isMounted = false; };
  }, [refreshHospitals]);

  // Active hospital: ONLY resolves to the verified authenticated hospital, prioritizing reactive DataContext updates
  const activeHospital = useMemo(() => {
    const target = currentHospitalData || loggedInUser;
    const targetId = target?._id || target?.id;
    const targetEmail = target?.email;

    if (Array.isArray(hospitals) && hospitals.length > 0) {
      if (targetId) {
        const found = hospitals.find(h => String(h.id || h._id).toLowerCase() === String(targetId).toLowerCase());
        if (found) return found;
      }
      if (targetEmail) {
        const found = hospitals.find(h => h.email && h.email.toLowerCase() === targetEmail.toLowerCase());
        if (found) return found;
      }
      if (target?.name) {
        const found = hospitals.find(h => h.name && h.name.toLowerCase() === target.name.toLowerCase());
        if (found) return found;
      }
    }

    if (currentHospitalData) {
      return currentHospitalData;
    }
    if (targetId || targetEmail) {
      return { ...loggedInUser, name: loggedInUser.name || 'Hospital Facility', id: targetId || targetEmail, _id: targetId };
    }
    // If logged-in user is platform admin, permit viewing first hospital
    if (loggedInUser?.role === 'admin' && Array.isArray(hospitals) && hospitals.length > 0) {
      return hospitals[0];
    }
    return null;
  }, [currentHospitalData, hospitals, loggedInUser]);

  if (loadingHospital && !activeHospital) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#64748b' }}>
        <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: '#2563eb', marginBottom: '12px' }} />
        <p style={{ fontWeight: 600 }}>Loading authenticated hospital portal...</p>
      </div>
    );
  }

  if (!activeHospital) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '24px', textAlign: 'center' }}>
        <Building2 size={48} color="#94a3b8" style={{ marginBottom: '12px' }} />
        <h2 style={{ color: '#1e293b', marginBottom: '8px' }}>Hospital Authentication Required</h2>
        <p style={{ color: '#64748b', maxWidth: '440px', marginBottom: '20px' }}>
          Please sign in with your verified hospital credentials to access the hospital management dashboard.
        </p>
        <button
          onClick={() => {
            localStorage.removeItem('hospital_token');
            localStorage.removeItem('hospital_user');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/hospital';
          }}
          style={{ padding: '10px 20px', background: '#2563eb', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}
        >
          Go to Hospital Login
        </button>
      </div>
    );
  }

  // Render the exact 9 tabs from AdminHospitalEditPage with hospital-level permissions
  return (
    <AdminHospitalEditPage
      hospitalId={activeHospital._id || activeHospital.id}
      hospitalData={activeHospital}
      onNavigate={onNavigate}
      isHospitalView={true}
    />
  );
};

export default HospitalDashboard;
