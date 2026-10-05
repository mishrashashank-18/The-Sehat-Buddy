import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Mail, Lock, HeartPulse, Activity, Stethoscope, Building2, ShieldCheck, ArrowLeft, User, Eye, EyeOff, Sparkles, KeyRound } from 'lucide-react';
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

  // Doctor specialized login step: 'email' -> 'set-password' (first login) OR 'password' (returning)
  const [docStep, setDocStep] = useState('email');
  const [docInfo, setDocInfo] = useState(null);

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
        : (docStep === 'password'
          ? 'Enter your password to access your doctor dashboard'
          : 'Enter your registered doctor email address'),
      icon: <Stethoscope size={48} className={styles.roleIcon} />,
      image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=1000'
    },
    hospital: {
      title: 'Hospital Portal',
      subtitle: 'Manage hospital operations and staff',
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

  // DOCTOR STEP 1: Check Email
  const handleDoctorEmailCheck = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/doctors/check-email', {
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
      const response = await fetch('http://localhost:5000/api/doctors/set-initial-password', {
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
      const response = await fetch('http://localhost:5000/api/doctors/login', {
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

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const apiRole = role === 'doctor' ? 'doctors' : (role === 'hospital' ? 'hospitals' : role);
      const response = await fetch(`http://localhost:5000/api/${apiRole}/verify-otp`, {
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
        const targetPath = `/${roleRedirects[role] === 'home' ? '' : roleRedirects[role]}`;
        window.location.href = targetPath;
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
    const endpoint = isLogin ? `http://localhost:5000/api/${apiRole}/login` : `http://localhost:5000/api/${apiRole}/register`;
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
      const response = await fetch('http://localhost:5000/api/user/google-login', {
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
        const targetPath = `/${roleRedirects[role] === 'home' ? '' : roleRedirects[role]}`;
        window.location.href = targetPath;
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
              <HeartPulse size={36} className={styles.brandIcon} />
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
              else setView ? setView('home') : window.location.pathname = '/';
            }}
          >
            <ArrowLeft size={20} />
            {showOtp ? 'Back to Login' : (role === 'doctor' && docStep !== 'email' ? 'Back to Email' : 'Back to Home')}
          </button>
          
          <div className={styles.formHeader}>
            <div className={styles.iconWrapper}>{icon}</div>
            <h2>
              {showOtp
                ? 'Verify OTP'
                : (role === 'doctor'
                  ? (docStep === 'set-password' ? 'Set Your Password' : title)
                  : (isLogin ? title : `Join ${role === 'user' ? 'Sehat Buddy' : title}`))}
            </h2>
            <p>
              {showOtp
                ? `Enter the 6-digit OTP sent to ${pendingEmail}`
                : subtitle}
            </p>
          </div>
          
          {error && <div className={styles.errorMsg}>{error}</div>}

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
                </form>
              )}

              {/* STEP 2A: FIRST-TIME LOGIN: SET PASSWORD */}
              {docStep === 'set-password' && (
                <form className={styles.authForm} onSubmit={handleDoctorSetPassword}>
                  <div style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontWeight: 700, color: '#1e40af', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={16} color="#2563eb" /> First-Time Doctor Setup
                    </div>
                    <div style={{ fontSize: '0.84rem', color: '#3b82f6', marginTop: '4px' }}>
                      Welcome {docInfo?.name ? docInfo.name : 'Doctor'}! ({email})
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
                    borderRadius: '10px',
                    padding: '10px 14px',
                    marginBottom: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Signing in as</span>
                      <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{email}</strong>
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

                  <button type="submit" className={styles.submitButton} disabled={loading}>
                    {loading ? 'Authenticating...' : 'Sign In'}
                  </button>
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
          
          {role !== 'admin' && role !== 'doctor' && !showOtp && (
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
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
