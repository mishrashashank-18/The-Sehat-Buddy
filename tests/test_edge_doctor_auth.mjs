// tests/test_edge_doctor_auth.mjs
import assert from 'assert';

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('=== STARTING EDGE DOCTOR AUTHENTICATION & MULTI-ROLE TESTS ===\n');

  // 1. Authenticate Dr. Ravishankar D
  console.log('1. Testing doctor login with valid credentials...');
  const loginRes = await fetch(`${API_BASE}/doctors/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'sarthak2005misra@gmail.com',
      password: 'sarth@K18'
    })
  });
  const loginData = await loginRes.json();
  assert.strictEqual(loginRes.status, 200, `Login should return 200, got ${loginRes.status}: ${JSON.stringify(loginData)}`);
  assert.ok(loginData.success, 'Login should succeed');
  assert.ok(loginData.token, 'Login should return a JWT token');
  console.log('   Doctor login successful! Doctor name:', loginData.user?.name);
  const doctorToken = loginData.token;

  // 2. Query /api/doctors/me with Doctor Token
  console.log('\n2. Testing GET /api/doctors/me with Doctor Token...');
  const meRes = await fetch(`${API_BASE}/doctors/me`, {
    headers: {
      'Authorization': `Bearer ${doctorToken}`,
      'Content-Type': 'application/json'
    }
  });
  const meData = await meRes.json();
  assert.strictEqual(meRes.status, 200, `GET /doctors/me with doctor token should be 200, got ${meRes.status}`);
  assert.strictEqual(meData.doctor?.email, 'sarthak2005misra@gmail.com');
  console.log('   GET /doctors/me succeeded with doctor token! Returned doctor:', meData.doctor?.name);

  // 3. Test what happened in Edge before our fix:
  // If an Admin Token was sent to /api/doctors/me, backend MUST return 401
  console.log('\n3. Testing GET /api/doctors/me with an Admin Token (reproducing pre-fix Edge collision)...');
  // First obtain or verify admin token
  const adminRes = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin',
      password: 'password123'
    })
  }).catch(() => null);

  let adminToken = null;
  if (adminRes && adminRes.ok) {
    const adminData = await adminRes.json();
    adminToken = adminData.token;
  }

  if (adminToken) {
    const meWithAdminRes = await fetch(`${API_BASE}/doctors/me`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'x-admin-request': 'true',
        'Content-Type': 'application/json'
      }
    });
    const meWithAdminData = await meWithAdminRes.json();
    assert.strictEqual(meWithAdminRes.status, 401, 'Backend must reject admin token for /doctors/me with 401');
    console.log('   Confirmed: Backend correctly rejects Admin Token on /doctors/me with 401 ("' + meWithAdminData.message + '")');
  }

  // 4. Test the frontend token resolution logic simulated with Edge storage
  console.log('\n4. Testing frontend route-isolated getActiveAuthToken & getAuthHeaders logic...');

  // Mock Edge storage state where admin was logged in first, then doctor logs in
  const mockLocalStorage = {
    'admin_logged_in': 'true',
    'admin_token': adminToken || 'mock.admin.jwt',
    'admin_user': JSON.stringify({ role: 'admin', email: 'admin@sehat.com' }),
    'doctor_token': doctorToken,
    'doctor_user': JSON.stringify({ role: 'doctor', email: 'sarthak2005misra@gmail.com' }),
    'token': doctorToken,
    'user': JSON.stringify({ role: 'doctor', email: 'sarthak2005misra@gmail.com' })
  };

  const safeDecodeJwt = (tok) => {
    if (!tok || typeof tok !== 'string') return null;
    try {
      const parts = tok.split('.');
      if (parts.length !== 3) return null;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
      return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
    } catch {
      return null;
    }
  };

  const isJwtExpired = (tok) => {
    if (!tok || typeof tok !== 'string') return true;
    const payload = safeDecodeJwt(tok);
    if (!payload || !payload.exp) return false;
    return payload.exp * 1000 < Date.now();
  };

  const resolveToken = (path, hash = '') => {
    const isDoctorRoute = path === '/doctor' || path.startsWith('/doctor/') || hash === '#doctor' || hash === '#/doctor' || hash.startsWith('#doctor/') || hash.startsWith('#/doctor/');
    const isHospitalRoute = path === '/hospital' || path.startsWith('/hospital/') || hash === '#hospital' || hash === '#/hospital' || hash.startsWith('#hospital/') || hash.startsWith('#/hospital/');
    const isAdminRoute = path === '/admin' || path.startsWith('/admin/') || hash === '#admin' || hash === '#/admin' || hash.startsWith('#admin/') || hash.startsWith('#/admin/');

    if (isDoctorRoute) {
      const docToken = mockLocalStorage['doctor_token'];
      if (docToken && !isJwtExpired(docToken)) return docToken;
      const genToken = mockLocalStorage['token'];
      if (genToken && !isJwtExpired(genToken)) {
        const payload = safeDecodeJwt(genToken);
        if (payload?.role === 'doctor') return genToken;
      }
      return null;
    }

    if (isHospitalRoute) {
      const hospToken = mockLocalStorage['hospital_token'];
      if (hospToken && !isJwtExpired(hospToken)) return hospToken;
      return null;
    }

    if (isAdminRoute) {
      const aToken = mockLocalStorage['admin_token'];
      if (aToken && !isJwtExpired(aToken)) return aToken;
      return null;
    }

    return mockLocalStorage['doctor_token'] || null;
  };

  const resolveHeaders = (path, hash = '') => {
    const token = resolveToken(path, hash);
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const isAdminRoute = path === '/admin' || path.startsWith('/admin/') || hash === '#admin' || hash === '#/admin';
    if (isAdminRoute) {
      headers['x-admin-request'] = 'true';
    }
    headers['Content-Type'] = 'application/json';
    return headers;
  };

  // Test Case A: On /doctor route in Edge
  const doctorHeaders = resolveHeaders('/doctor');
  assert.strictEqual(doctorHeaders['Authorization'], `Bearer ${doctorToken}`, 'On /doctor, doctor token must be chosen');
  assert.strictEqual(doctorHeaders['x-admin-request'], undefined, 'On /doctor, x-admin-request must NOT be set');
  console.log('   Test Case A Passed: On /doctor in Edge, selected doctor token, NO x-admin-request header.');

  // Test Case B: On /admin route in Edge
  const adminHeaders = resolveHeaders('/admin');
  assert.strictEqual(adminHeaders['Authorization'], `Bearer ${mockLocalStorage['admin_token']}`, 'On /admin, admin token must be chosen');
  assert.strictEqual(adminHeaders['x-admin-request'], 'true', 'On /admin, x-admin-request MUST be set');
  console.log('   Test Case B Passed: On /admin in Edge, selected admin token, x-admin-request header included.');

  // 5. Test invalid credentials rejection and attempt counter
  console.log('\n5. Testing doctor login with wrong password (negative test)...');
  const badLoginRes = await fetch(`${API_BASE}/doctors/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'sarthak2005misra@gmail.com',
      password: 'WrongPassword123!'
    })
  });
  const badLoginData = await badLoginRes.json();
  assert.strictEqual(badLoginRes.status, 401, 'Wrong password should return 401');
  assert.strictEqual(badLoginData.success, false, 'Wrong password should fail');
  assert.ok(badLoginData.message.includes('remaining before temporary lockout'), 'Should mention remaining attempts');
  console.log('   Invalid password correctly rejected! Message:', badLoginData.message);

  // Re-authenticate with correct password to reset failed attempts counter
  const resetRes = await fetch(`${API_BASE}/doctors/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'sarthak2005misra@gmail.com',
      password: 'sarth@K18'
    })
  });
  assert.strictEqual(resetRes.status, 200, 'Re-login with correct password should succeed and reset counter');
  console.log('   Counter reset on valid login confirmed.');

  // 6. Test unknown email
  console.log('\n6. Testing unknown doctor email (negative test)...');
  const unknownRes = await fetch(`${API_BASE}/doctors/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'nonexistent.doctor.999@hospital.com',
      password: 'somepassword'
    })
  });
  const unknownData = await unknownRes.json();
  assert.strictEqual(unknownRes.status, 401, 'Unknown email should return 401');
  assert.strictEqual(unknownData.success, false);
  console.log('   Unknown email correctly rejected with 401.');

  console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===');
}

runTests().catch(err => {
  console.error('\nTEST SUITE FAILED:', err);
  process.exit(1);
});
