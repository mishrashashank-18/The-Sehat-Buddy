export const resolveApiBase = () => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BASE_URL || import.meta.env.VITE_API_BASE_URL;
  if (!envUrl) return 'http://localhost:5000/api';
  const trimmed = envUrl.trim().replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

export const API_BASE = resolveApiBase();

const getAuthHeaders = (isFormData = false) => {
  const token = localStorage.getItem('token');
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
    const res = await fetch(`${API_BASE}/doctors/list`);
    const data = await handleResponse(res);
    return data.data || data;
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
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      role = user.role;
    } catch {}

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
          return data.data || data;
        }
      } catch {}
    }

    try {
      const res = await fetch(`${API_BASE}/doctors/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        return data.data || data;
      }
    } catch {}

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

  async getDoctorDashboard(docId = null) {
    try {
      const url = docId ? `${API_BASE}/doctors/dashboard?docId=${encodeURIComponent(docId)}` : `${API_BASE}/doctors/dashboard`;
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

  async bookAppointment(bookingData) {
    const res = await fetch(`${API_BASE}/user/book-appointment`, {
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

  async deleteDoctor(id) {
    try {
      const res = await fetch(`${API_BASE}/doctors/${id}`, { 
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) return handleResponse(res);
    } catch {}

    const res2 = await fetch(`${API_BASE}/admin/delete-doctor/${id}`, { 
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res2);
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
    return data.data;
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

  // Image Upload (Cloudinary)
  async uploadImage(fileOrBase64, folder = 'sehatbuddy') {
    let body;
    let headers = {};
    const token = localStorage.getItem('token');
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
    const token = localStorage.getItem('token');
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

    const token = localStorage.getItem('token');

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

  // Public Reviews API
  async getReviews(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/reviews${qs ? '?' + qs : ''}`);
    const data = await handleResponse(res);
    return data.data || [];
  },

  async addReview(reviewData) {
    const res = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: getAuthHeaders(),
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
    const res = await fetch(`${API_BASE}/reviews/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
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
