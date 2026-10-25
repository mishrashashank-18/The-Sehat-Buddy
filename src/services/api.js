export const resolveApiBase = () => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BASE_URL || import.meta.env.VITE_API_BASE_URL;
  if (typeof window !== 'undefined' && window.location.hostname) {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!envUrl) {
      return isLocal ? 'http://127.0.0.1:5000/api' : `http://${window.location.hostname}:5000/api`;
    }
    // If envUrl points to localhost but the page is accessed via LAN IP
    if (!isLocal && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
      return `http://${window.location.hostname}:5000/api`;
    }
  }
  if (!envUrl) return 'http://localhost:5000/api';
  const trimmed = envUrl.trim().replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

export const API_BASE = resolveApiBase();

export const getActiveAuthToken = () => {
  try {
    let storedUser = null;
    try {
      storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    } catch {}

    const path = typeof window !== 'undefined' ? (window.location.pathname || '') : '';
    const hash = typeof window !== 'undefined' ? (window.location.hash || '') : '';

    if (storedUser?.role === 'admin' || path.startsWith('/admin') || hash.includes('admin') || localStorage.getItem('admin_logged_in') === 'true') {
      return localStorage.getItem('admin_token') || localStorage.getItem('token');
    }
    if (storedUser?.role === 'doctor' || path.startsWith('/doctor') || hash.includes('doctor')) {
      return localStorage.getItem('doctor_token') || localStorage.getItem('token');
    }
    if (storedUser?.role === 'hospital' || path.startsWith('/hospital') || hash.includes('hospital')) {
      return localStorage.getItem('hospital_token') || localStorage.getItem('token');
    }
    return localStorage.getItem('admin_token') || localStorage.getItem('token') || localStorage.getItem('hospital_token') || localStorage.getItem('doctor_token') || localStorage.getItem('patient_token');
  } catch {
    return localStorage.getItem('admin_token') || localStorage.getItem('token');
  }
};

const getAuthHeaders = (isFormData = false) => {
  const token = getActiveAuthToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';
  return headers;
};

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
    const fetchOptions = {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    };

    try {
      const res = await fetch(`${API_BASE}/doctors/list`, fetchOptions);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data?.data || []);
        if (Array.isArray(list) && (list.length > 0 || data?.success)) return list;
      }
    } catch (e) {
      console.warn('GET /doctors/list failed, attempting fallback:', e.message);
    }

    try {
      const res2 = await fetch(`${API_BASE}/doctors`, fetchOptions);
      if (res2.ok) {
        const data2 = await res2.json();
        const list2 = Array.isArray(data2) ? data2 : (data2?.data || []);
        if (Array.isArray(list2) && (list2.length > 0 || data2?.success)) return list2;
      }
    } catch (e2) {
      console.warn('GET /doctors failed, attempting fallback:', e2.message);
    }

    try {
      const res3 = await fetch(`${API_BASE}/admin/all-doctors`, {
        ...fetchOptions,
        headers: {
          ...fetchOptions.headers,
          ...getAuthHeaders()
        }
      });
      if (res3.ok) {
        const data3 = await res3.json();
        const list3 = Array.isArray(data3) ? data3 : (data3?.data || []);
        if (Array.isArray(list3)) return list3;
      }
    } catch {}

    return [];
  },

  async getDoctorById(id) {
    try {
      const res = await fetch(`${API_BASE}/doctors/${id}`);
      if (res.ok) {
        const data = await res.json();
        return data.data || data;
      }
    } catch {}
    return null;
  },

  async addDoctor(doctorData) {
    const res = await fetch(`${API_BASE}/admin/add-doctor`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(doctorData)
    });
    const data = await handleResponse(res);
    return data.data;
  },

  async addDoctorByHospital(doctorData) {
    const res = await fetch(`${API_BASE}/doctors/add-by-hospital`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(doctorData)
    });
    const data = await handleResponse(res);
    return data.data;
  },

  async updateDoctor(id, doctorData) {
    let role = null;
    try {
      const user = JSON.parse(localStorage.getItem('admin_user') || localStorage.getItem('user') || '{}');
      role = user.role;
    } catch {}
    if (!role && typeof window !== 'undefined' && (window.location.pathname || '').startsWith('/admin')) {
      role = 'admin';
    }

    const payload = { ...doctorData };
    if (payload.experience !== undefined) {
      const parsedExp = parseInt(payload.experience, 10);
      payload.experience = !isNaN(parsedExp) ? parsedExp : 5;
    }
    if (payload.price !== undefined && payload.fees === undefined) {
      payload.fees = Number(payload.price) || 500;
    }

    if (role === 'admin') {
      try {
        const res = await fetch(`${API_BASE}/admin/update-doctor/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const data = await res.json();
          return { ...(data.data || data), emailChanged: data.emailChanged, temporaryPassword: data.temporaryPassword };
        } else if (res.status === 400 || res.status === 409 || res.status === 422) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Failed to update doctor details');
        }
      } catch (adminErr) {
        if (adminErr.message && !adminErr.message.includes('HTTP error') && !adminErr.message.includes('Failed to fetch')) {
          throw adminErr;
        }
      }
    }

    try {
      const res = await fetch(`${API_BASE}/doctors/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        return { ...(data.data || data), emailChanged: data.emailChanged, temporaryPassword: data.temporaryPassword };
      } else if (res.status === 400 || res.status === 409 || res.status === 422) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to update doctor profile');
      }
    } catch (docErr) {
      if (docErr.message && !docErr.message.includes('HTTP error') && !docErr.message.includes('Failed to fetch')) {
        throw docErr;
      }
    }

    try {
      const res2 = await fetch(`${API_BASE}/admin/update-doctor/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (res2.ok) {
        const data = await res2.json();
        return data.data || data;
      }
    } catch {}

    return payload;
  },

  async getDoctorDashboard(docId = null, docEmail = null) {
    try {
      const params = new URLSearchParams();
      if (docId) params.append('docId', docId);
      if (docEmail) params.append('email', docEmail);
      const query = params.toString();
      const url = query ? `${API_BASE}/doctors/dashboard?${query}` : `${API_BASE}/doctors/dashboard`;
      const res = await fetch(url, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        return data.data || data;
      }
    } catch {}
    return [];
  },

  async updateAppointmentStatus(id, statusData) {
    try {
      const res = await fetch(`${API_BASE}/doctors/appointments/${id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(statusData)
      });
      if (res.ok) {
        const data = await res.json();
        return data.data || data;
      }
    } catch {}
    return null;
  },

  async createDoctorAppointment(appointmentData) {
    try {
      const res = await fetch(`${API_BASE}/doctors/appointments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(appointmentData)
      });
      if (res.ok) {
        const data = await res.json();
        return data.data || data;
      }
    } catch {}
    return null;
  },

  async deleteDoctorAppointment(id) {
    try {
      const res = await fetch(`${API_BASE}/doctors/appointments/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        return data.data || data;
      }
    } catch {}
    return null;
  },

  async bookAppointment(bookingData) {
    const res = await fetch(`${API_BASE}/user/book-appointment`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(bookingData)
    });
    const data = await handleResponse(res);
    return data.data || data;
  },

  async bookHospitalAppointment(bookingData) {
    const res = await fetch(`${API_BASE}/user/book-hospital-appointment`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(bookingData)
    });
    const data = await handleResponse(res);
    return data.data || data;
  },

  async updateDoctorFaqsByHospital(hospitalId, doctorId, faqs) {
    try {
      const res = await fetch(`${API_BASE}/hospitals/${hospitalId}/doctor-faqs/${doctorId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ faqs })
      });
      if (res.ok) {
        const data = await res.json();
        return data.data || data;
      }
    } catch {}

    // Fallback to admin update
    try {
      const res2 = await fetch(`${API_BASE}/admin/update-doctor/${doctorId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ faqs })
      });
      if (res2.ok) {
        const data2 = await res2.json();
        return data2.data || data2;
      }
    } catch {}

    return { faqs };
  },

  async deleteDoctor(id, email) {
    const rawId = (id && typeof id === 'object') ? (id._id || id.id || id.email) : id;
    const rawEmail = email || (id && typeof id === 'object' ? id.email : null);
    const cleanId = String(rawId || '').trim();
    const cleanEmail = rawEmail ? String(rawEmail).trim().toLowerCase() : null;
    let lastError = null;

    if (cleanId) {
      const encodedId = encodeURIComponent(cleanId);
      // 1. Try admin delete-doctor endpoint
      try {
        const res = await fetch(`${API_BASE}/admin/delete-doctor/${encodedId}`, { 
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        if (res.ok) return await handleResponse(res);
        const data = await res.json().catch(() => ({}));
        if (data && data.message) lastError = new Error(data.message);
      } catch (err) {
        lastError = err;
      }

      // 2. Fallback to /doctors endpoint
      try {
        const res2 = await fetch(`${API_BASE}/doctors/${encodedId}`, { 
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        if (res2.ok) return await handleResponse(res2);
        const data2 = await res2.json().catch(() => ({}));
        if (data2 && data2.message) lastError = new Error(data2.message);
      } catch (err) {
        lastError = err;
      }
    }

    // 3. If email is provided and differs from cleanId, try deleting by email
    if (cleanEmail && cleanEmail !== cleanId.toLowerCase()) {
      const encodedEmail = encodeURIComponent(cleanEmail);
      try {
        const res3 = await fetch(`${API_BASE}/admin/delete-doctor/${encodedEmail}`, { 
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        if (res3.ok) return await handleResponse(res3);
      } catch {}

      try {
        const res4 = await fetch(`${API_BASE}/doctors/${encodedEmail}`, { 
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        if (res4.ok) return await handleResponse(res4);
      } catch {}
    }

    if (lastError) throw lastError;
    throw new Error('Failed to delete doctor from database');
  },

  // Hospitals
  async getHospitals() {
    const res = await fetch(`${API_BASE}/hospitals/list`);
    const data = await handleResponse(res);
    return data.data || data;
  },

  async addHospital(hospitalData) {
    const res = await fetch(`${API_BASE}/hospitals/register`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(hospitalData)
    });
    const data = await handleResponse(res);
    return data;
  },

  async getHospitalById(id) {
    const res = await fetch(`${API_BASE}/hospitals/${id}`);
    const data = await handleResponse(res);
    return data.data || data;
  },

  async getMyHospital() {
    const res = await fetch(`${API_BASE}/hospitals/me`, {
      headers: getAuthHeaders()
    });
    const data = await handleResponse(res);
    return data.data || data;
  },

  async updateHospital(id, hospitalData) {
    const res = await fetch(`${API_BASE}/hospitals/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(hospitalData)
    });
    const data = await handleResponse(res);
    return data.data;
  },

  async getHospitalBeds(id) {
    const res = await fetch(`${API_BASE}/hospitals/${id}/beds`, {
      headers: getAuthHeaders()
    });
    const data = await handleResponse(res);
    return data.data;
  },

  async updateHospitalBeds(id, bedData) {
    const res = await fetch(`${API_BASE}/hospitals/${id}/beds`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(bedData)
    });
    const data = await handleResponse(res);
    return data.data;
  },

  async deleteHospital(id) {
    const res = await fetch(`${API_BASE}/hospitals/${id}`, { 
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async checkHospitalEmail(email) {
    const res = await fetch(`${API_BASE}/hospitals/check-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return handleResponse(res);
  },

  async setInitialHospitalPassword(email, password) {
    const res = await fetch(`${API_BASE}/hospitals/set-initial-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },

  async loginHospital(email, password) {
    const res = await fetch(`${API_BASE}/hospitals/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },

  async forgotHospitalPassword(email) {
    const res = await fetch(`${API_BASE}/hospitals/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return handleResponse(res);
  },

  async verifyHospitalResetOtp(email, otp) {
    const res = await fetch(`${API_BASE}/hospitals/verify-reset-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    return handleResponse(res);
  },

  async resetHospitalPassword(email, otp, newPassword) {
    const res = await fetch(`${API_BASE}/hospitals/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword })
    });
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
      headers: getAuthHeaders(),
      body: JSON.stringify(heroData)
    });
    const data = await handleResponse(res);
    return data.data;
  },

  async updateServices(servicesList) {
    const res = await fetch(`${API_BASE}/content/services`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(servicesList)
    });
    const data = await handleResponse(res);
    return data.data;
  },

  async updateFeatures(featuresList) {
    const res = await fetch(`${API_BASE}/content/features`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(featuresList)
    });
    const data = await handleResponse(res);
    return data.data;
  },

  async updateArticles(articlesList) {
    const res = await fetch(`${API_BASE}/content/articles`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(articlesList)
    });
    const data = await handleResponse(res);
    return data.data;
  },

  async updateCorporateTieups(corporateList) {
    const res = await fetch(`${API_BASE}/content/corporate`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(corporateList)
    });
    const data = await handleResponse(res);
    return data.data;
  },

  async updateBranding(brandingData) {
    const res = await fetch(`${API_BASE}/content/branding`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(brandingData)
    });
    const data = await handleResponse(res);
    return data.data;
  },

  // Stats
  async getStats() {
    const res = await fetch(`${API_BASE}/stats`, {
      headers: getAuthHeaders()
    });
    const data = await handleResponse(res);
    return data.data;
  },

  // Storage Quota Stats (MongoDB & Cloudinary)
  async getStorageStats() {
    const res = await fetch(`${API_BASE}/admin/storage-stats`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Admin Appointments Management
  async getAdminAppointments() {
    const res = await fetch(`${API_BASE}/admin/appointments`, {
      headers: getAuthHeaders()
    });
    const data = await handleResponse(res);
    return data.data || [];
  },

  async updateAdminAppointmentStatus(id, statusData) {
    const res = await fetch(`${API_BASE}/admin/appointments/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(statusData)
    });
    const data = await handleResponse(res);
    return data.data || data;
  },

  async deleteAdminAppointment(id) {
    const res = await fetch(`${API_BASE}/admin/appointments/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await handleResponse(res);
    return data.data || data;
  },

  // Image Upload (Cloudinary)
  async uploadImage(fileOrBase64, folder = 'sehatbuddy') {
    let body;
    let headers = {};
    const token = getActiveAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    if (fileOrBase64 instanceof File || fileOrBase64 instanceof Blob) {
      const formData = new FormData();
      formData.append('image', fileOrBase64);
      formData.append('folder', folder);
      body = formData;
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify({ image: fileOrBase64, folder });
    }

    const res = await fetch(`${API_BASE}/upload/image`, {
      method: 'POST',
      headers,
      body
    });
    const data = await handleResponse(res);
    return data.url;
  },

  // Delete Media / Image completely from Cloudinary
  async deleteImage(urlOrPublicId, resourceType = 'image') {
    const token = getActiveAuthToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/upload/delete`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        url: urlOrPublicId && urlOrPublicId.startsWith('http') ? urlOrPublicId : undefined,
        public_id: urlOrPublicId && !urlOrPublicId.startsWith('http') ? urlOrPublicId : undefined,
        resource_type: resourceType
      })
    });
    return handleResponse(res);
  },

  // Video Upload (Cloudinary)
  async uploadVideo(fileOrBlob, folder = 'sehatbuddy/videos', onProgress = null) {
    const formData = new FormData();
    formData.append('video', fileOrBlob);
    formData.append('folder', folder);

    const token = getActiveAuthToken();

    if (onProgress && typeof onProgress === 'function') {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE}/upload/video`);
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent);
          }
        };

        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300 && data.success) {
              resolve(data.url);
            } else {
              reject(new Error(data.message || 'Video upload to Cloudinary failed'));
            }
          } catch {
            reject(new Error('Invalid response from upload server'));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during video upload'));
        xhr.send(formData);
      });
    }

    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/upload/video`, {
      method: 'POST',
      headers,
      body: formData
    });
    const data = await handleResponse(res);
    return data.url;
  },

  // Auto-convert Instagram Reel to Cloudinary Video
  async uploadInstagramReel(url, folder = 'sehatbuddy/reels') {
    const token = getActiveAuthToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/upload/instagram-reel`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ url, folder })
    });
    return await handleResponse(res);
  },

  // Avatars API
  async getAvatars() {
    try {
      const res = await fetch(`${API_BASE}/avatars`);
      const data = await handleResponse(res);
      return data.data || [];
    } catch (e) {
      console.warn('Avatars fetch warning, using defaults:', e.message);
      return [];
    }
  },

  // FAQs API
  async getFaqs(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/faqs${qs ? '?' + qs : ''}`);
    const data = await handleResponse(res);
    return data.data || [];
  },

  async addFaq(faqData) {
    const res = await fetch(`${API_BASE}/faqs`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(faqData)
    });
    const data = await handleResponse(res);
    return data.data;
  },

  async updateFaq(id, faqData) {
    const res = await fetch(`${API_BASE}/faqs/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(faqData)
    });
    const data = await handleResponse(res);
    return data.data;
  },

  async deleteFaq(id) {
    const res = await fetch(`${API_BASE}/faqs/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // FAQ Symbols & Icons API
  async getFaqSymbols() {
    const res = await fetch(`${API_BASE}/faqs/symbols`);
    const data = await handleResponse(res);
    return data.data || [];
  },

  async createFaqSymbol(symbolData) {
    const res = await fetch(`${API_BASE}/faqs/symbols`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(symbolData)
    });
    const data = await handleResponse(res);
    return data.data;
  },

  async deleteFaqSymbol(id) {
    const res = await fetch(`${API_BASE}/faqs/symbols/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Public Reviews API
  async getReviews(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/reviews${qs ? '?' + qs : ''}`);
    const data = await handleResponse(res);
    return data.data || [];
  },

  async addReview(reviewData, tokenOverride = null) {
    let token = tokenOverride;
    if (!token) {
      const path = typeof window !== 'undefined' ? (window.location.pathname || '') : '';
      if (path.startsWith('/admin')) {
        token = localStorage.getItem('admin_token') || localStorage.getItem('token');
      } else {
        const patientToken = localStorage.getItem('patient_token') || localStorage.getItem('user_token');
        if (patientToken) {
          token = patientToken;
        } else {
          try {
            const u = JSON.parse(localStorage.getItem('user') || '{}');
            if (u && u.role === 'user') token = localStorage.getItem('token');
          } catch {}
        }
      }
    }

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers,
      body: JSON.stringify(reviewData)
    });
    const data = await handleResponse(res);
    return data.data;
  },

  async updateReview(id, reviewData) {
    const res = await fetch(`${API_BASE}/reviews/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(reviewData)
    });
    const data = await handleResponse(res);
    return data.data;
  },

  async deleteReview(id) {
    const rawId = (id && typeof id === 'object') ? (id._id || id.id) : id;
    const cleanId = String(rawId || '').trim();
    const encodedId = encodeURIComponent(cleanId);
    let lastError = null;

    // 1. Try /api/admin/reviews/:id
    try {
      const resAdmin = await fetch(`${API_BASE}/admin/reviews/${encodedId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (resAdmin.ok) return await handleResponse(resAdmin);
      const dataAdmin = await resAdmin.json().catch(() => ({}));
      if (dataAdmin?.message) lastError = new Error(dataAdmin.message);
    } catch (err) {
      lastError = err;
    }

    // 2. Try /api/reviews/:id
    try {
      const res = await fetch(`${API_BASE}/reviews/${encodedId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) return await handleResponse(res);
      const data = await res.json().catch(() => ({}));
      if (data?.message) lastError = new Error(data.message);
    } catch (err) {
      lastError = err;
    }

    // 3. Fallback /api/admin/delete-review/:id
    try {
      const res3 = await fetch(`${API_BASE}/admin/delete-review/${encodedId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res3.ok) return await handleResponse(res3);
    } catch {}

    if (lastError) throw lastError;
    throw new Error('Failed to delete review from database');
  },

  // Specialities & Procedures API
  async getSpecialitiesProcedures(type = '') {
    const url = type ? `${API_BASE}/specialities-procedures?type=${type}` : `${API_BASE}/specialities-procedures`;
    const res = await fetch(url);
    const data = await handleResponse(res);
    return data.data || [];
  },

  async addSpecialityProcedure(itemData) {
    const res = await fetch(`${API_BASE}/specialities-procedures`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(itemData)
    });
    const data = await handleResponse(res);
    return data.data;
  },

  async updateSpecialityProcedure(id, itemData) {
    const res = await fetch(`${API_BASE}/specialities-procedures/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(itemData)
    });
    const data = await handleResponse(res);
    return data.data;
  },

  async deleteSpecialityProcedure(id) {
    const res = await fetch(`${API_BASE}/specialities-procedures/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async subscribeNewsletter(email, source = 'newsletter', featureInterest = null) {
    const res = await fetch(`${API_BASE}/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, source, featureInterest })
    });
    return await handleResponse(res);
  }
};
