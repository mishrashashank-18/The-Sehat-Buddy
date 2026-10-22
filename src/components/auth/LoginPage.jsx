import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Mail, Lock, Activity, Stethoscope, Building2, ShieldCheck, ArrowLeft, User, Eye, EyeOff, Sparkles, KeyRound } from 'lucide-react';
import logoImg from '../../assets/images/logo.png';
import { API_BASE } from '../../services/api';
import styles from './LoginPage.module.css';

const LoginPage = ({ role, setView }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Doctor specialized login step: 'email' -> 'set-password' (first login) OR 'password' (returning) OR 'reset-otp' / 'reset-new-password'
  const [docStep, setDocStep] = useState('email');
  const [docInfo, setDocInfo] = useState(null);

  // Hospital specialized login step: 'email' -> 'set-password' (first login) OR 'password' (returning) OR 'reset-otp' / 'reset-new-password'
  const [hospStep, setHospStep] = useState('email');
  const [hospInfo, setHospInfo] = useState(null);

  const roleInfo = {
    admin: {
      title: 'Admin Portal',
      subtitle: 'Manage the Sehat Buddy platform',
      icon: <ShieldCheck size={48} className={styles.roleIcon} />,
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000'
    },
    doctor: {
      title: 'Doctor Portal',
      subtitle: docStep === 'set-password'
        ? 'Welcome to the clinical portal. Set your new account password.'
        : (docStep === 'reset-otp'
          ? 'Enter the 6-digit OTP sent to your registered email.'
          : (docStep === 'reset-new-password'
            ? 'Set a new password for your doctor account.'
            : (docStep === 'password'
              ? 'Enter your password to access your doctor dashboard'
              : 'Enter your registered doctor email address'))),
      icon: <Stethoscope size={48} className={styles.roleIcon} />,
      image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=1000'
    },
    hospital: {
      title: 'Hospital Portal',
      subtitle: hospStep === 'set-password'
        ? (hospInfo?.name ? `Welcome, ${hospInfo.name}! Please set your account password.` : 'Welcome to the hospital portal. Set your new account password.')
        : (hospStep === 'reset-otp'
          ? 'Enter the 6-digit OTP sent to your registered hospital email.'
          : (hospStep === 'reset-new-password'
            ? 'Set a new password for your hospital account.'
            : (hospStep === 'password'
              ? (hospInfo?.name ? `Welcome back, ${hospInfo.name}!` : 'Enter your password to access your hospital dashboard')
              : 'Enter your registered hospital email address'))),
      icon: <Building2 size={48} className={styles.roleIcon} />,
      image: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&q=80&w=1000'
    },
    user: {
      title: 'Welcome',
      subtitle: 'Access your health records and appointments',
      icon: <Activity size={48} className={styles.roleIcon} />,
      image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=1000'
    },
  };

  const { title, subtitle, icon, image } = roleInfo[role] || roleInfo.user;

  const roleRedirects = {
    admin: 'admin',
    doctor: 'doctor',
    hospital: 'hospital',
    user: 'home',
  };

  const completeLoginRedirect = (userRole) => {
    const redirectAfter = localStorage.getItem('redirect_after_login');
    if (redirectAfter && (userRole === 'user' || !userRole)) {
      localStorage.removeItem('redirect_after_login');
      window.location.href = redirectAfter;
      return;
    }
    const targetPath = `/${roleRedirects[userRole] === 'home' ? '' : roleRedirects[userRole]}`;
    window.location.href = targetPath;
  };

  // DOCTOR STEP 1: Check Email
  const handleDoctorEmailCheck = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/doctors/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setDocInfo(data);
        if (data.isFirstLogin) {
          setDocStep('set-password');
        } else {
          setDocStep('password');
        }
      } else {
        setError(data.message || 'No doctor account found with this email. Please contact your hospital administrator.');
      }
    } catch (err) {
      setError('Could not connect to authentication server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // DOCTOR STEP 2A: Set Initial Password on First Login
  const handleDoctorSetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/doctors/set-initial-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('token', data.token);
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        window.location.href = '/doctor';
      } else {
        setError(data.message || 'Failed to set password. Please try again.');
      }
    } catch (err) {
      setError('An error occurred while saving your password.');
    } finally {
      setLoading(false);
    }
  };

  // DOCTOR STEP 2B: Returning Doctor Password Login
  const handleDoctorLoginWithPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/doctors/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('token', data.token);
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        window.location.href = '/doctor';
      } else {
        setError(data.message || 'Invalid password. Please try again.');
      }
    } catch (err) {
      setError('Login failed. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // DOCTOR PASSWORD RESET STEP 1: Request OTP to Email
  const handleDoctorRequestResetOtp = async (customEmail) => {
    const targetEmail = (customEmail || email).trim().toLowerCase();
    if (!targetEmail) {
      setError('Please enter your doctor email first.');
      return;
    }

    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/doctors/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setEmail(targetEmail);
        setOtp('');
        setDocStep('reset-otp');
        setSuccessMessage(data.message || `A 6-digit OTP has been sent to ${targetEmail}`);
      } else {
        setError(data.message || 'Could not send reset OTP. Please check your email.');
      }
    } catch (err) {
      setError('Failed to connect to authentication server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // DOCTOR PASSWORD RESET STEP 2: Verify OTP
  const handleDoctorVerifyResetOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the 6-digit OTP.');
      return;
    }

    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/doctors/verify-reset-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPassword('');
        setConfirmPassword('');
        setDocStep('reset-new-password');
        setSuccessMessage('OTP verified! Please create your new password.');
      } else {
        setError(data.message || 'Invalid or expired OTP. Please try again.');
      }
    } catch (err) {
      setError('Error verifying OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // DOCTOR PASSWORD RESET STEP 3: Submit New Password
  const handleDoctorResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/doctors/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
          password
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('token', data.token);
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        window.location.href = '/doctor';
      } else {
        setError(data.message || 'Failed to reset password. Please try again.');
      }
    } catch (err) {
      setError('An error occurred while resetting your password.');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // HOSPITAL AUTHENTICATION FLOW
  // ==========================================

  // HOSPITAL STEP 1: Check Email & Fetch Hospital Name from Database
  const handleHospitalEmailCheck = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/hospitals/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setHospInfo(data);
        if (data.isFirstLogin) {
          setHospStep('set-password');
        } else {
          setHospStep('password');
        }
      } else {
        setError(data.message || 'No registered hospital account found with this email. Please contact the platform administrator to register your hospital.');
      }
    } catch (err) {
      setError('Could not connect to authentication server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // HOSPITAL STEP 2A: Set Initial Password on First Login
  const handleHospitalSetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/hospitals/set-initial-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('token', data.token);
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        window.location.href = '/hospital';
      } else {
        setError(data.message || 'Failed to set password. Please try again.');
      }
    } catch (err) {
      setError('An error occurred while saving your password.');
    } finally {
      setLoading(false);
    }
  };

  // HOSPITAL STEP 2B: Returning Hospital Password Login
  const handleHospitalLoginWithPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/hospitals/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('token', data.token);
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        window.location.href = '/hospital';
      } else if (data.isFirstLogin) {
        setHospStep('set-password');
        setError('First-time login detected. Please create your password below.');
      } else {
        setError(data.message || 'Invalid password. Please try again.');
      }
    } catch (err) {
      setError('Login failed. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // HOSPITAL PASSWORD RESET STEP 1: Request OTP to Email
  const handleHospitalRequestResetOtp = async (customEmail) => {
    const targetEmail = (customEmail || email).trim().toLowerCase();
    if (!targetEmail) {
      setError('Please enter your hospital email first.');
      return;
    }

    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/hospitals/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setEmail(targetEmail);
        setOtp('');
        setHospStep('reset-otp');
        setSuccessMessage(data.message || `A 6-digit OTP has been sent to ${targetEmail}`);
      } else {
        setError(data.message || 'Could not send reset OTP. Please check your email.');
      }
    } catch (err) {
      setError('Failed to connect to authentication server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // HOSPITAL PASSWORD RESET STEP 2: Verify OTP
  const handleHospitalVerifyResetOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the 6-digit OTP.');
      return;
    }

    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/hospitals/verify-reset-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPassword('');
        setConfirmPassword('');
        setHospStep('reset-new-password');
        setSuccessMessage('OTP verified! Please create your new hospital password.');
      } else {
        setError(data.message || 'Invalid or expired OTP. Please try again.');
      }
    } catch (err) {
      setError('Error verifying OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // HOSPITAL PASSWORD RESET STEP 3: Submit New Password
  const handleHospitalResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/hospitals/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
          password
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('token', data.token);
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        window.location.href = '/hospital';
      } else {
        setError(data.message || 'Failed to reset password. Please try again.');
      }
    } catch (err) {
      setError('An error occurred while resetting your password.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const apiRole = role === 'doctor' ? 'doctors' : (role === 'hospital' ? 'hospitals' : role);
      const response = await fetch(`${API_BASE}/${apiRole}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingEmail, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        if (data.user || data.data) {
          localStorage.setItem('user', JSON.stringify(data.user || data.data));
        }
        completeLoginRedirect(role);
      } else {
        setError(data.message || 'OTP verification failed.');
      }
    } catch (err) {
      setError('An error occurred during OTP verification.');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const apiRole = role === 'doctor' ? 'doctors' : (role === 'hospital' ? 'hospitals' : role);
    const endpoint = isLogin ? `${API_BASE}/${apiRole}/login` : `${API_BASE}/${apiRole}/register`;
    const payload = isLogin ? { email, password } : { name, email, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.requires_verification) {
          setPendingEmail(email);
          setShowOtp(true);
          setError('');
        } else {
          localStorage.setItem('token', data.token);
          if (data.user || data.data) {
            localStorage.setItem('user', JSON.stringify(data.user || data.data));
          }
          const targetPath = `/${roleRedirects[role] === 'home' ? '' : roleRedirects[role]}`;
          window.location.href = targetPath;
        }
      } else {
        setError(data.message || `${isLogin ? 'Login' : 'Signup'} failed. Please try again.`);
      }
    } catch (err) {
      setError(`An error occurred while ${isLogin ? 'logging in' : 'signing up'}. Please try again later.`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE}/user/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: credentialResponse.credential }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        if (data.user || data.data) {
          localStorage.setItem('user', JSON.stringify(data.user || data.data));
        }
        completeLoginRedirect(role);
      } else {
        setError(data.message || 'Google login failed.');
      }
    } catch (err) {
      setError('An error occurred during Google login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authWrapper}>
        <div className={styles.imageSection} style={{ backgroundImage: `url(${image})` }}>
          <div className={styles.imageOverlay}>
            <div className={styles.brand}>
              <img src={logoImg} alt="Sehat Buddy" style={{ height: '38px', objectFit: 'contain' }} />
              <span className={styles.brandText}>Sehat Buddy</span>
            </div>
            <div className={styles.heroText}>
              <h1>Your Health, Our Priority</h1>
              <p>Join thousands of users and healthcare professionals making healthcare accessible and efficient.</p>
            </div>
          </div>
        </div>
        
        <div className={styles.formSection}>
          <button 
            className={styles.backBtn} 
            onClick={() => {
              if (showOtp) setShowOtp(false);
              else if (role === 'doctor' && docStep !== 'email') {
                setDocStep('email');
                setError('');
                setPassword('');
                setConfirmPassword('');
              }
              else if (role === 'hospital' && hospStep !== 'email') {
                setHospStep('email');
                setError('');
                setPassword('');
                setConfirmPassword('');
              }
              else setView ? setView('home') : window.location.pathname = '/';
            }}
          >
            <ArrowLeft size={20} />
            {showOtp ? 'Back to Login' : ((role === 'doctor' && docStep !== 'email') || (role === 'hospital' && hospStep !== 'email') ? 'Back to Email' : 'Back to Home')}
          </button>
          
          <div className={styles.formHeader}>
            <div className={styles.iconWrapper}>{icon}</div>
            <h2>
              {showOtp
                ? 'Verify OTP'
                : (role === 'doctor'
                  ? (docStep === 'set-password'
                    ? 'Set Your Password'
                    : (docStep === 'reset-otp'
                      ? 'Verify Reset OTP'
                      : (docStep === 'reset-new-password'
                        ? 'Create New Password'
                        : title)))
                  : (role === 'hospital'
                    ? (hospStep === 'set-password'
                      ? 'Set Hospital Password'
                      : (hospStep === 'reset-otp'
                        ? 'Verify Reset OTP'
                        : (hospStep === 'reset-new-password'
                          ? 'Create New Password'
                          : title)))
                    : (isLogin ? title : `Join ${role === 'user' ? 'Sehat Buddy' : title}`)))}
            </h2>
            <p>
              {showOtp
                ? `Enter the 6-digit OTP sent to ${pendingEmail}`
                : subtitle}
            </p>
          </div>
          
          {error && <div className={styles.errorMsg}>{error}</div>}
          {successMessage && (
            <div style={{
              background: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #a7f3d0',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '0.88rem',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 500
            }}>
              <span>✅</span> {successMessage}
            </div>
          )}

          {/* DOCTOR SPECIFIC AUTHENTICATION FLOW */}
          {role === 'doctor' ? (
            <div>
              {/* STEP 1: ENTER EMAIL & PRESS ENTER */}
              {docStep === 'email' && (
                <form className={styles.authForm} onSubmit={handleDoctorEmailCheck}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="docEmail">Doctor Email Address</label>
                    <div className={styles.inputWrapper}>
                      <Mail size={20} className={styles.inputIcon} />
                      <input
                        type="email"
                        id="docEmail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="doctor@hospital.com"
                        autoFocus
                      />
                    </div>
                  </div>

                  <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '4px 0 16px 0' }}>
                    💡 Enter your registered email. If you were added by a hospital or admin, you will be able to set your password on the next step.
                  </p>

                  <button type="submit" className={styles.submitButton} disabled={loading}>
                    {loading ? 'Checking Email...' : 'Continue (Press Enter)'}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '14px' }}>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        if (!email.trim()) {
                          setError('Please enter your doctor email above first to reset your password.');
                          return;
                        }
                        handleDoctorRequestResetOtp(email);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563eb',
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        padding: 0,
                        fontWeight: 500,
                        textDecoration: 'underline'
                      }}
                    >
                      Forgot password? Reset via Email OTP
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2A: FIRST-TIME LOGIN: SET PASSWORD */}
              {docStep === 'set-password' && (
                <form className={styles.authForm} onSubmit={handleDoctorSetPassword}>
                  <div style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    marginBottom: '18px'
                  }}>
                    <div style={{ fontWeight: 700, color: '#1e40af', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={18} color="#2563eb" /> First-Time Doctor Setup
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '0.95rem', color: '#1e3a8a', fontWeight: 600 }}>
                      👨‍⚕️ {docInfo?.name || 'Doctor'}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                      {email} {docInfo?.hospital ? `• ${docInfo.hospital}` : ''}
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="newPassword">Create New Password</label>
                    <div className={styles.inputWrapper}>
                      <Lock size={20} className={styles.inputIcon} />
                      <input
                        type={showPassword ? "text" : "password"}
                        id="newPassword"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        placeholder="At least 6 characters"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <div className={styles.inputWrapper}>
                      <KeyRound size={20} className={styles.inputIcon} />
                      <input
                        type={showPassword ? "text" : "password"}
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        placeholder="Re-enter your password"
                      />
                    </div>
                  </div>

                  <button type="submit" className={styles.submitButton} disabled={loading}>
                    {loading ? 'Saving Password...' : 'Set Password & Enter Dashboard'}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '14px' }}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setDocStep('email');
                        setPassword('');
                        setConfirmPassword('');
                        setError('');
                      }}
                      style={{ fontSize: '0.85rem', color: '#2563eb', textDecoration: 'none' }}
                    >
                      ← Use a different email
                    </a>
                  </div>
                </form>
              )}

              {/* STEP 2B: RETURNING DOCTOR PASSWORD LOGIN */}
              {docStep === 'password' && (
                <form className={styles.authForm} onSubmit={handleDoctorLoginWithPassword}>
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    marginBottom: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Doctor Account</span>
                      <strong style={{ fontSize: '0.98rem', color: '#0f172a', display: 'block' }}>
                        👨‍⚕️ {docInfo?.name || 'Doctor'}
                      </strong>
                      <span style={{ fontSize: '0.82rem', color: '#64748b' }}>{email}</span>
                    </div>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setDocStep('email');
                        setPassword('');
                        setError('');
                      }}
                      style={{ fontSize: '0.82rem', color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}
                    >
                      Change
                    </a>
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="password">Password</label>
                    <div className={styles.inputWrapper}>
                      <Lock size={20} className={styles.inputIcon} />
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-6px', marginBottom: '16px' }}>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleDoctorRequestResetOtp(email)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563eb',
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        padding: 0,
                        fontWeight: 500,
                        textDecoration: 'underline'
                      }}
                    >
                      Forgot Password? Reset via OTP
                    </button>
                  </div>

                  <button type="submit" className={styles.submitButton} disabled={loading}>
                    {loading ? 'Authenticating...' : 'Sign In'}
                  </button>
                </form>
              )}

              {/* STEP 3A: DOCTOR PASSWORD RESET - ENTER OTP */}
              {docStep === 'reset-otp' && (
                <form className={styles.authForm} onSubmit={handleDoctorVerifyResetOtp}>
                  <div style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    marginBottom: '18px'
                  }}>
                    <div style={{ fontWeight: 700, color: '#1e40af', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <KeyRound size={18} color="#2563eb" /> Verify Reset OTP
                    </div>
                    <div style={{ marginTop: '6px', fontSize: '0.86rem', color: '#334155' }}>
                      A 6-digit verification code has been dispatched to <strong>{email}</strong>. Enter it below to verify your identity.
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="resetOtp">Enter 6-digit OTP</label>
                    <div className={styles.inputWrapper}>
                      <Lock size={20} className={styles.inputIcon} />
                      <input
                        type="text"
                        id="resetOtp"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        required
                        maxLength={6}
                        placeholder="••••••"
                        style={{ letterSpacing: '6px', fontSize: '1.2rem', fontWeight: 700, textAlign: 'center' }}
                        autoFocus
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0 16px 0', fontSize: '0.84rem' }}>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleDoctorRequestResetOtp(email)}
                      style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: 0, fontWeight: 500 }}
                    >
                      Didn't get code? Resend OTP
                    </button>
                  </div>

                  <button type="submit" className={styles.submitButton} disabled={loading || otp.length < 6}>
                    {loading ? 'Verifying OTP...' : 'Verify OTP & Continue'}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '14px' }}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setDocStep('email');
                        setOtp('');
                        setError('');
                        setSuccessMessage('');
                      }}
                      style={{ fontSize: '0.85rem', color: '#64748b', textDecoration: 'none' }}
                    >
                      ← Cancel & Return to Login
                    </a>
                  </div>
                </form>
              )}

              {/* STEP 3B: DOCTOR PASSWORD RESET - CREATE NEW PASSWORD */}
              {docStep === 'reset-new-password' && (
                <form className={styles.authForm} onSubmit={handleDoctorResetPasswordSubmit}>
                  <div style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    marginBottom: '18px'
                  }}>
                    <div style={{ fontWeight: 700, color: '#166534', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={18} color="#16a34a" /> Set Your New Password
                    </div>
                    <div style={{ marginTop: '6px', fontSize: '0.86rem', color: '#334155' }}>
                      Identity verified for <strong>{email}</strong>. Create a strong password for your account.
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="newResetPassword">New Password</label>
                    <div className={styles.inputWrapper}>
                      <Lock size={20} className={styles.inputIcon} />
                      <input
                        type={showPassword ? "text" : "password"}
                        id="newResetPassword"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        placeholder="At least 6 characters"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="confirmResetPassword">Confirm New Password</label>
                    <div className={styles.inputWrapper}>
                      <KeyRound size={20} className={styles.inputIcon} />
                      <input
                        type={showPassword ? "text" : "password"}
                        id="confirmResetPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        placeholder="Re-enter your new password"
                      />
                    </div>
                  </div>

                  <button type="submit" className={styles.submitButton} disabled={loading}>
                    {loading ? 'Updating Password...' : 'Save New Password & Sign In'}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '14px' }}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setDocStep('email');
                        setPassword('');
                        setConfirmPassword('');
                        setOtp('');
                        setError('');
                        setSuccessMessage('');
                      }}
                      style={{ fontSize: '0.85rem', color: '#64748b', textDecoration: 'none' }}
                    >
                      ← Cancel & Return to Login
                    </a>
                  </div>
                </form>
              )}
            </div>
          ) : role === 'hospital' ? (
            <div>
              {/* STEP 1: ENTER HOSPITAL EMAIL & PRESS ENTER */}
              {hospStep === 'email' && (
                <form className={styles.authForm} onSubmit={handleHospitalEmailCheck}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="hospEmail">Hospital Official Email Address</label>
                    <div className={styles.inputWrapper}>
                      <Mail size={20} className={styles.inputIcon} />
                      <input
                        type="email"
                        id="hospEmail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="e.g. admin@manipalhospitals.com"
                        autoFocus
                      />
                    </div>
                  </div>

                  <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '4px 0 16px 0' }}>
                    💡 Enter your registered hospital email. If your hospital was registered by an admin, your hospital details will be retrieved from the database, and you can set your password on the next step.
                  </p>

                  <button type="submit" className={styles.submitButton} disabled={loading}>
                    {loading ? 'Checking Hospital Email...' : 'Continue (Press Enter)'}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '14px' }}>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        if (!email.trim()) {
                          setError('Please enter your hospital email above first to reset your password.');
                          return;
                        }
                        handleHospitalRequestResetOtp(email);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563eb',
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        padding: 0,
                        fontWeight: 500,
                        textDecoration: 'underline'
                      }}
                    >
                      Forgot password? Reset via Email OTP
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2A: FIRST-TIME HOSPITAL LOGIN: GREET HOSPITAL & SET PASSWORD */}
              {hospStep === 'set-password' && (
                <form className={styles.authForm} onSubmit={handleHospitalSetPassword}>
                  <div style={{
                    background: '#eff6ff',
                    border: '1.5px solid #bfdbfe',
                    borderRadius: '12px',
                    padding: '16px 18px',
                    marginBottom: '18px'
                  }}>
                    <div style={{ fontWeight: 700, color: '#1e40af', fontSize: '1.02rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={18} color="#2563eb" /> First-Time Hospital Setup
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '1.2rem', color: '#0f172a', fontWeight: 800 }}>
                      🏥 Welcome, {hospInfo?.name || 'Hospital'}!
                    </div>
                    <div style={{ fontSize: '0.84rem', color: '#475569', marginTop: '3px' }}>
                      {email} {hospInfo?.city ? `• ${hospInfo.city}` : ''}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#2563eb', marginTop: '6px' }}>
                      Please create a secure password to access your Hospital Dashboard.
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="hospNewPassword">Create New Password</label>
                    <div className={styles.inputWrapper}>
                      <Lock size={20} className={styles.inputIcon} />
                      <input
                        type={showPassword ? "text" : "password"}
                        id="hospNewPassword"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        placeholder="At least 6 characters"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="hospConfirmPassword">Confirm Password</label>
                    <div className={styles.inputWrapper}>
                      <KeyRound size={20} className={styles.inputIcon} />
                      <input
                        type={showPassword ? "text" : "password"}
                        id="hospConfirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        placeholder="Re-enter your password"
                      />
                    </div>
                  </div>

                  <button type="submit" className={styles.submitButton} disabled={loading}>
                    {loading ? 'Activating Hospital Account...' : 'Set Password & Enter Hospital Dashboard'}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '14px' }}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setHospStep('email');
                        setPassword('');
                        setConfirmPassword('');
                        setError('');
                      }}
                      style={{ fontSize: '0.85rem', color: '#2563eb', textDecoration: 'none' }}
                    >
                      ← Use a different hospital email
                    </a>
                  </div>
                </form>
              )}

              {/* STEP 2B: RETURNING HOSPITAL PASSWORD LOGIN */}
              {hospStep === 'password' && (
                <form className={styles.authForm} onSubmit={handleHospitalLoginWithPassword}>
                  <div style={{
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    marginBottom: '18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                        Hospital Account
                      </span>
                      <strong style={{ fontSize: '1.1rem', color: '#0f172a', display: 'block', marginTop: '2px' }}>
                        🏥 Welcome, {hospInfo?.name || 'Hospital'}!
                      </strong>
                      <span style={{ fontSize: '0.82rem', color: '#64748b' }}>{email}</span>
                    </div>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setHospStep('email');
                        setPassword('');
                        setError('');
                      }}
                      style={{ fontSize: '0.82rem', color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}
                    >
                      Change
                    </a>
                  </div>

                  <div className={styles.inputGroup}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label htmlFor="hospLoginPassword">Password</label>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleHospitalRequestResetOtp(email);
                        }}
                        style={{ fontSize: '0.82rem', color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}
                      >
                        Forgot password?
                      </a>
                    </div>
                    <div className={styles.inputWrapper}>
                      <Lock size={20} className={styles.inputIcon} />
                      <input
                        type={showPassword ? "text" : "password"}
                        id="hospLoginPassword"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" className={styles.submitButton} disabled={loading}>
                    {loading ? 'Authenticating...' : 'Sign In to Hospital Dashboard'}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '14px' }}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setHospStep('email');
                        setPassword('');
                        setError('');
                      }}
                      style={{ fontSize: '0.85rem', color: '#2563eb', textDecoration: 'none' }}
                    >
                      ← Use a different hospital email
                    </a>
                  </div>
                </form>
              )}

              {/* STEP 3A: HOSPITAL PASSWORD RESET - ENTER OTP */}
              {hospStep === 'reset-otp' && (
                <form className={styles.authForm} onSubmit={handleHospitalVerifyResetOtp}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="hospResetOtp">Enter 6-Digit OTP</label>
                    <div className={styles.inputWrapper}>
                      <Lock size={20} className={styles.inputIcon} />
                      <input
                        type="text"
                        id="hospResetOtp"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        required
                        maxLength={6}
                        placeholder="••••••"
                        style={{ letterSpacing: '6px', fontSize: '1.2rem', fontWeight: 700, textAlign: 'center' }}
                        autoFocus
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0 16px 0', fontSize: '0.84rem' }}>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleHospitalRequestResetOtp(email)}
                      style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: 0, fontWeight: 500 }}
                    >
                      Didn't get code? Resend OTP
                    </button>
                  </div>

                  <button type="submit" className={styles.submitButton} disabled={loading || otp.length < 6}>
                    {loading ? 'Verifying OTP...' : 'Verify OTP & Continue'}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '14px' }}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setHospStep('email');
                        setOtp('');
                        setError('');
                        setSuccessMessage('');
                      }}
                      style={{ fontSize: '0.85rem', color: '#64748b', textDecoration: 'none' }}
                    >
                      ← Cancel & Return to Login
                    </a>
                  </div>
                </form>
              )}

              {/* STEP 3B: HOSPITAL PASSWORD RESET - CREATE NEW PASSWORD */}
              {hospStep === 'reset-new-password' && (
                <form className={styles.authForm} onSubmit={handleHospitalResetPasswordSubmit}>
                  <div style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    marginBottom: '16px',
                    fontSize: '0.86rem',
                    color: '#15803d',
                    fontWeight: 500
                  }}>
                    Create a new password for your hospital account ({email}).
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="hospNewPasswordReset">New Password</label>
                    <div className={styles.inputWrapper}>
                      <Lock size={20} className={styles.inputIcon} />
                      <input
                        type={showPassword ? "text" : "password"}
                        id="hospNewPasswordReset"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        placeholder="At least 6 characters"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="hospConfirmResetPassword">Confirm New Password</label>
                    <div className={styles.inputWrapper}>
                      <KeyRound size={20} className={styles.inputIcon} />
                      <input
                        type={showPassword ? "text" : "password"}
                        id="hospConfirmResetPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        placeholder="Re-enter your new password"
                      />
                    </div>
                  </div>

                  <button type="submit" className={styles.submitButton} disabled={loading}>
                    {loading ? 'Updating Password...' : 'Save New Password & Sign In'}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '14px' }}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setHospStep('email');
                        setPassword('');
                        setConfirmPassword('');
                        setOtp('');
                        setError('');
                        setSuccessMessage('');
                      }}
                      style={{ fontSize: '0.85rem', color: '#64748b', textDecoration: 'none' }}
                    >
                      ← Cancel & Return to Login
                    </a>
                  </div>
                </form>
              )}
            </div>
          ) : showOtp ? (
            /* OTP FLOW FOR OTHER ROLES */
            <form className={styles.authForm} onSubmit={handleVerifyOtp}>
              <div className={styles.inputGroup}>
                <label htmlFor="otp">Enter OTP</label>
                <div className={styles.inputWrapper}>
                  <Lock size={20} className={styles.inputIcon} />
                  <input
                    type="text"
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    placeholder="123456"
                    maxLength={6}
                  />
                </div>
              </div>
              <button type="submit" className={styles.submitButton} disabled={loading}>
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>
            </form>
          ) : (
            /* STANDARD FLOW FOR ADMIN, HOSPITAL, USER */
            <form className={styles.authForm} onSubmit={handleAuth}>
              {!isLogin && (
                <div className={styles.inputGroup}>
                  <label htmlFor="name">Full Name</label>
                  <div className={styles.inputWrapper}>
                    <User size={20} className={styles.inputIcon} />
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="John Doe"
                    />
                  </div>
                </div>
              )}
              
              <div className={styles.inputGroup}>
                <label htmlFor="email">Email Address</label>
                <div className={styles.inputWrapper}>
                  <Mail size={20} className={styles.inputIcon} />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@example.com"
                  />
                </div>
              </div>
              
              <div className={styles.inputGroup}>
                <label htmlFor="password">Password</label>
                <div className={styles.inputWrapper}>
                  <Lock size={20} className={styles.inputIcon} />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#6B7280',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0
                    }}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {isLogin && (
                <div className={styles.forgotPassword}>
                  <a href="#">Forgot password?</a>
                </div>
              )}

              <button type="submit" className={styles.submitButton} disabled={loading}>
                {loading ? 'Authenticating...' : (isLogin ? 'Sign In' : 'Sign Up')}
              </button>
            </form>
          )}

          {role === 'user' && !showOtp && (
            <>
              <div className={styles.divider}>
                <span>or continue with</span>
              </div>
              <div className={styles.googleBtnWrapper}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google login failed. Please try again.')}
                  useOneTap
                  theme="outline"
                  size="large"
                  text={isLogin ? "signin_with" : "signup_with"}
                  shape="rectangular"
                  width="100%"
                />
              </div>
            </>
          )}
          
          {role !== 'admin' && role !== 'doctor' && role !== 'hospital' && !showOtp && (
            <div className={styles.signupPrompt}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <a href="#" onClick={(e) => {
                e.preventDefault();
                setIsLogin(!isLogin);
                setError('');
              }}>
                {isLogin ? 'Sign up here' : 'Sign in here'}
              </a>
            </div>
          )}

          {role === 'hospital' && hospStep === 'email' && (
            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.84rem', color: '#64748b' }}>
              Want to partner your hospital on Sehat Buddy? Contact Platform Administrator.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
