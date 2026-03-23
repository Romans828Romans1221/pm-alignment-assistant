import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult 
} from "firebase/auth";
import { auth, googleProvider } from '../api/firebase';
import styles from './Home.module.css';

const isMobileSafari = () => {
  const ua = navigator.userAgent;
  return /iP(ad|hone|od)/.test(ua) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

const Home = () => {
  const [activeTab, setActiveTab] = useState('demo');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          navigate('/leader');
        }
      })
      .catch((error) => {
        console.error('Redirect sign in error', error);
      });
  }, [navigate]);

  const handleLogin = async () => {
    try {
      setLoading(true);
      if (isMobileSafari()) {
        await signInWithRedirect(auth, googleProvider);
      } else {
        await signInWithPopup(auth, googleProvider);
        navigate('/leader');
      }
    } catch (error) {
      console.error('Login Failed:', error.message);
      alert('Login Issue: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>

      <div className={styles.nav}>
        <h1 className={styles.logo}>Clarity</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('demo')}
            className={`${styles.navButton} ${activeTab === 'demo' ? styles.navButtonActive : ''}`}
          >
            Log In
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`${styles.navButton} ${activeTab === 'architecture' ? styles.navButtonActive : ''}`}
          >
            Architecture
          </button>
        </div>
      </div>

      {activeTab === 'demo' && (
        <div className={styles.card}>
          <div className={styles.iconGlow}>✨</div>
          <h2 className={styles.titleGlow}>Sign in to Clarity</h2>
          <p className={styles.subtitle}>Align your team's goals in seconds.</p>

          <button 
            onClick={handleLogin} 
            className={styles.googleButton}
            disabled={loading}
          >
            <div className={styles.googleContent}>
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="G"
                style={{ width: '20px', height: '20px' }}
              />
              <span className={styles.buttonText}>
                {loading ? 'Signing in...' : 'Continue with Google'}
              </span>
            </div>
            <span className={styles.arrow}>→</span>
          </button>

          <div className={styles.footer}>
            <span>Create Account</span>
            <span>•</span>
            <span>Forgot Password?</span>
          </div>
        </div>
      )}

      {activeTab === 'architecture' && (
        <div className="max-w-4xl p-8 text-left">
          <h2 className={styles.titleGlow} style={{ fontSize: '2rem' }}>
            System Architecture
          </h2>
          <p className={styles.subtitle}>
            Secure Node.js Backend • React Frontend • Firebase Auth
          </p>
        </div>
      )}
    </div>
  );
};

export default Home;