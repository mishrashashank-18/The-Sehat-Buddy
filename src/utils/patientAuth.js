/**
 * Strict patient authentication helper.
 * Ensures doctor, admin, or hospital login sessions are NEVER mistaken for a logged-in patient.
 */
export const getAuthenticatedPatient = () => {
  if (typeof window === 'undefined') {
    return { token: null, user: null, isLoggedIn: false };
  }

  try {
    // 1. Check patient-isolated credentials
    const patientToken = localStorage.getItem('patient_token') || localStorage.getItem('user_token');
    const patientUserStr = localStorage.getItem('patient_user') || localStorage.getItem('user_user');
    if (patientToken && patientUserStr) {
      const u = JSON.parse(patientUserStr);
      if (u && (u.email || u._id || u.id)) {
        return { token: patientToken, user: u, isLoggedIn: true };
      }
    }

    // 2. Fallback to general token/user ONLY if role is strictly 'user' (patient)
    // NEVER treat admin, doctor, or hospital accounts as a patient session!
    const generalToken = localStorage.getItem('token');
    const generalUserStr = localStorage.getItem('user');
    if (generalToken && generalUserStr) {
      const u = JSON.parse(generalUserStr);
      if (u && u.role === 'user' && (u.email || u._id || u.id)) {
        return { token: generalToken, user: u, isLoggedIn: true };
      }
    }
  } catch {}

  return { token: null, user: null, isLoggedIn: false };
};
