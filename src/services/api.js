const resolveApiBase = () => {
  const envUrl = import.meta.env.VITE_BASE_URL || import.meta.env.VITE_API_BASE_URL;
  if (!envUrl) return '/api';
  const trimmed = envUrl.trim().replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const API_BASE = resolveApiBase();

const handleResponse = async (res) => {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error ${res.status}`);
  }
  return res.json();
};

export const api = {
  // Doctors
  async getDoctors() {
    const res = await fetch(`${API_BASE}/doctors`);
    const data = await handleResponse(res);
    return data.data;
  },

  async addDoctor(doctorData) {
    const res = await fetch(`${API_BASE}/doctors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doctorData)
    });
    const data = await handleResponse(res);
    return data.data;
  },

  async updateDoctor(id, doctorData) {
    const res = await fetch(`${API_BASE}/doctors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doctorData)
    });
    const data = await handleResponse(res);
    return data.data;
  },

  async deleteDoctor(id) {
    const res = await fetch(`${API_BASE}/doctors/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },

  // Hospitals
  async getHospitals() {
    const res = await fetch(`${API_BASE}/hospitals`);
    const data = await handleResponse(res);
    return data.data;
  },

  async addHospital(hospitalData) {
    const res = await fetch(`${API_BASE}/hospitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(hospitalData)
    });
    const data = await handleResponse(res);
    return data.data;
  },

  async updateHospital(id, hospitalData) {
    const res = await fetch(`${API_BASE}/hospitals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(hospitalData)
    });
    const data = await handleResponse(res);
    return data.data;
  },

  async deleteHospital(id) {
    const res = await fetch(`${API_BASE}/hospitals/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },

  // Content (Front-page)
  async getContent() {
    const res = await fetch(`${API_BASE}/content`);
    const data = await handleResponse(res);
    return data.data;
  },

  async updateHero(heroData) {
    const res = await fetch(`${API_BASE}/content/hero`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(heroData)
    });
    const data = await handleResponse(res);
    return data.data;
  },

  async updateServices(servicesList) {
    const res = await fetch(`${API_BASE}/content/services`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(servicesList)
    });
    const data = await handleResponse(res);
    return data.data;
  },

  async updateFeatures(featuresList) {
    const res = await fetch(`${API_BASE}/content/features`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(featuresList)
    });
    const data = await handleResponse(res);
    return data.data;
  },

  async updateArticles(articlesList) {
    const res = await fetch(`${API_BASE}/content/articles`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(articlesList)
    });
    const data = await handleResponse(res);
    return data.data;
  },

  // Stats
  async getStats() {
    const res = await fetch(`${API_BASE}/stats`);
    const data = await handleResponse(res);
    return data.data;
  }
};
