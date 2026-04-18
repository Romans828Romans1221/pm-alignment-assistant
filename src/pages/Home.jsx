import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendSignInLinkToEmail
} from "firebase/auth";
import { auth, googleProvider, microsoftProvider } from '../api/firebase';
import styles from './Home.module.css';

const Home = () => {
  const [activeTab, setActiveTab] = useState('demo');
  const [authMode, setAuthMode] = useState('options');
  const [emailMode, setEmailMode] = useState('signin');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      googleProvider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, googleProvider);
      if (result?.user) navigate('/leader');
    } catch (error) {
      console.error('Google Login Failed:', error.message);
      if (error.code === 'auth/popup-blocked') {
        alert('Please allow popups for this site in your browser settings.');
      } else {
        alert('Login Issue: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    try {
      setLoading(true);
      microsoftProvider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, microsoftProvider);
      if (result?.user) navigate('/leader');
    } catch (error) {
      console.error('Microsoft Login Failed:', error.message);
      alert('Microsoft login issue: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email || !password) return alert('Please enter your email and password.');
    try {
      setLoading(true);
      if (emailMode === 'signin') {
        const result = await signInWithEmailAndPassword(auth, email, password);
        if (result?.user) navigate('/leader');
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        if (result?.user) navigate('/leader');
      }
    } catch (error) {
      console.error('Email Auth Failed:', error.message);
      if (error.code === 'auth/user-not-found') {
        alert('No account found. Please create an account first.');
      } else if (error.code === 'auth/wrong-password') {
        alert('Incorrect password. Please try again.');
      } else if (error.code === 'auth/email-already-in-use') {
        alert('An account already exists with this email. Please sign in instead.');
      } else if (error.code === 'auth/weak-password') {
        alert('Password must be at least 6 characters.');
      } else {
        alert('Auth error: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) return alert('Please enter your email address.');
    try {
      setLoading(true);
      const actionCodeSettings = {
        url: `${window.location.origin}/leader`,
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      setMagicSent(true);
    } catch (error) {
      console.error('Magic link error:', error.message);
      alert('Error sending magic link: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderAuthOptions = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className={styles.googleButton}
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

      <button
        onClick={handleMicrosoftLogin}
        disabled={loading}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          backgroundColor: '#2F3241',
          color: 'white',
          fontWeight: '600',
          fontSize: '15px',
          cursor: 'pointer',
          width: '100%'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/512px-Microsoft_logo.svg.png"
            alt="Microsoft"
            style={{ width: '20px', height: '20px' }}
          />
          <span>Continue with Microsoft</span>
        </div>
        <span>→</span>
      </button>

      <button
        onClick={() => setAuthMode('email')}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          backgroundColor: '#2F3241',
          color: 'white',
          fontWeight: '600',
          fontSize: '15px',
          cursor: 'pointer',
          width: '100%'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>✉️</span>
          <span>Continue with Email</span>
        </div>
        <span>→</span>
      </button>

      <button
        onClick={() => setAuthMode('magic')}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          backgroundColor: '#2F3241',
          color: 'white',
          fontWeight: '600',
          fontSize: '15px',
          cursor: 'pointer',
          width: '100%'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>🔗</span>
          <span>Send Magic Link</span>
        </div>
        <span>→</span>
      </button>
    </div>
  );

  const renderEmailAuth = () => (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setEmailMode('signin')}
          style={{
            flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
            backgroundColor: emailMode === 'signin' ? '#4A90E2' : '#2F3241',
            color: 'white', fontWeight: '600', cursor: 'pointer'
          }}
        >
          Sign In
        </button>
        <button
          onClick={() => setEmailMode('signup')}
          style={{
            flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
            backgroundColor: emailMode === 'signup' ? '#4A90E2' : '#2F3241',
            color: 'white', fontWeight: '600', cursor: 'pointer'
          }}
        >
          Create Account
        </button>
      </div>

      <input
        type="email"
        placeholder="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          width: '100%', padding: '12px', borderRadius: '8px',
          border: '1px solid #e2e8f0', marginBottom: '10px',
          fontSize: '15px', boxSizing: 'border-box',
          backgroundColor: '#1a1a2e', color: 'white'
        }}
      />
      <input
        type="password"
        placeholder="Password (min 6 characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{
          width: '100%', padding: '12px', borderRadius: '8px',
          border: '1px solid #e2e8f0', marginBottom: '16px',
          fontSize: '15px', boxSizing: 'border-box',
          backgroundColor: '#1a1a2e', color: 'white'
        }}
      />

      <button
        onClick={handleEmailAuth}
        disabled={loading}
        style={{
          width: '100%', padding: '14px', borderRadius: '12px',
          border: 'none', backgroundColor: '#4A90E2',
          color: 'white', fontWeight: '700', fontSize: '15px',
          cursor: 'pointer', marginBottom: '12px'
        }}
      >
        {loading ? 'Processing...' : emailMode === 'signin' ? 'Sign In' : 'Create Account'}
      </button>

      <button
        onClick={() => setAuthMode('options')}
        style={{
          width: '100%', padding: '10px', borderRadius: '8px',
          border: '1px solid #e2e8f0', backgroundColor: 'transparent',
          color: '#94a3b8', cursor: 'pointer', fontSize: '14px'
        }}
      >
        ← Back to all options
      </button>
    </div>
  );

  const renderMagicLink = () => (
    <div style={{ width: '100%' }}>
      {magicSent ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📬</div>
          <h3 style={{ color: 'white', marginBottom: '8px' }}>Check your inbox</h3>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            We sent a magic link to <strong style={{ color: 'white' }}>{email}</strong>.
            Click the link to sign in instantly.
          </p>
        </div>
      ) : (
        <>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '16px' }}>
            Enter your email and we will send you a one-click login link. No password needed.
          </p>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%', padding: '12px', borderRadius: '8px',
              border: '1px solid #e2e8f0', marginBottom: '12px',
              fontSize: '15px', boxSizing: 'border-box',
              backgroundColor: '#1a1a2e', color: 'white'
            }}
          />
          <button
            onClick={handleMagicLink}
            disabled={loading}
            style={{
              width: '100%', padding: '14px', borderRadius: '12px',
              border: 'none', backgroundColor: '#4A90E2',
              color: 'white', fontWeight: '700', fontSize: '15px',
              cursor: 'pointer', marginBottom: '12px'
            }}
          >
            {loading ? 'Sending...' : '✉️ Send Magic Link'}
          </button>
          <button
            onClick={() => setAuthMode('options')}
            style={{
              width: '100%', padding: '10px', borderRadius: '8px',
              border: '1px solid #e2e8f0', backgroundColor: 'transparent',
              color: '#94a3b8', cursor: 'pointer', fontSize: '14px'
            }}
          >
            ← Back to all options
          </button>
        </>
      )}
    </div>
  );

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

          {authMode === 'options' && renderAuthOptions()}
          {authMode === 'email' && renderEmailAuth()}
          {authMode === 'magic' && renderMagicLink()}
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