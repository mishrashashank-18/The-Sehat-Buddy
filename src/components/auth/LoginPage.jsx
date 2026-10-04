import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Mail, Lock, HeartPulse, Activity, Stethoscope, Building2, ShieldCheck, ArrowLeft, User, Eye, EyeOff } from 'lucide-react';
import styles from './LoginPage.module.css';

const LoginPage = ({ role, setView }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const roleInfo = {
    admin: {
      title: 'Admin Portal',
      subtitle: 'Manage the Sehat Buddy platform',
      icon: <ShieldCheck size={48} className={styles.roleIcon} />,
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000'
    },
    doctor: {
      title: 'Doctor Portal',
      subtitle: 'Manage your appointments and patients',
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

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? `http://localhost:5000/api/${role}/login` : `http://localhost:5000/api/${role}/register`;
    const payload = isLogin ? { email, password } : { name, email, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
            onClick={() => setView ? setView('home') : window.location.pathname = '/'}
          >
            <ArrowLeft size={20} /> Back to Home
          </button>
          
          <div className={styles.formHeader}>
            <div className={styles.iconWrapper}>{icon}</div>
            <h2>{isLogin ? title : `Join ${role === 'user' ? 'Sehat Buddy' : title}`}</h2>
            <p>{isLogin ? subtitle : 'Create your account to get started'}</p>
          </div>
          
          {error && <div className={styles.errorMsg}>{error}</div>}

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

          {role === 'user' && (
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
          
          {role !== 'admin' && (
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
