import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Leaf, Lock, Mail, User, AlertCircle } from 'lucide-react';
import GoogleAuthModal from '../components/GoogleAuthModal';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [role, setRole] = useState('buyer'); // 'buyer' or 'farmer'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate(user.role === 'farmer' ? '/dashboard' : '/marketplace');
    }
  }, [user, navigate]);

  // Demo credentials display
  const demoAccounts = {
    farmer: { email: 'farmer@demo.com', password: 'password123' },
    buyer: { email: 'buyer@demo.com', password: 'password123' },
  };

  const fillDemoCredentials = () => {
    const demo = demoAccounts[role];
    setEmail(demo.email);
    setPassword(demo.password);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Attempt login
    const result = await login(email, password);
    
    if (result.success) {
      // Login successful, redirect will happen via useEffect
      console.log('Login successful:', result.user);
    } else {
      setError(result.error || 'Login failed');
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = (selectedEmail) => {
    console.log('Logged in via Google as:', role, selectedEmail);
    alert(`Successfully signed in with Google as ${selectedEmail}!`);
  };

  return (
    <div className="auth-page">
      {/* Back to Home Button */}
      <Link to="/" className="back-home-btn">
        <ArrowLeft size={18} />
        <span>Back to Home</span>
      </Link>

      <div className="auth-container">
        {/* Left Side: Image Panel (Visible on Desktop) */}
        <div className="auth-image-panel">
          <div className="auth-image-overlay"></div>
          <img 
            src={role === 'farmer' 
              ? "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=800"
              : "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800"
            } 
            alt="Agricultural background" 
            className="auth-bg-image"
          />
          <div className="auth-image-content">
            <Link to="/" className="auth-logo">
              <Leaf className="logo-icon" />
              <span>AgriLink</span>
            </Link>
            <h2 className="auth-image-title">
              {role === 'farmer' 
                ? "Manage your farm and reach thousands of buyers instantly." 
                : "Get fresh, organic produce delivered straight from the farm."
              }
            </h2>
            <p className="auth-image-desc">
              Connecting local farmers directly to customers for a sustainable and transparent supply chain.
            </p>
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="auth-form-panel">
          <div className="auth-form-wrapper">
            <div className="auth-header">
              <div className="mobile-logo-wrapper">
                <Link to="/" className="auth-logo dark-theme">
                  <Leaf className="logo-icon" />
                  <span>AgriLink</span>
                </Link>
              </div>
              <h1 className="heading-md auth-title">Welcome Back</h1>
              <p className="auth-subtitle">Please enter your details to sign in</p>
            </div>

            {/* Role Tab Selector */}
            <div className="role-selector-tabs">
              <button 
                type="button"
                className={`role-tab ${role === 'buyer' ? 'active' : ''}`}
                onClick={() => setRole('buyer')}
              >
                <User size={16} />
                <span>Buyer / Consumer</span>
              </button>
              <button 
                type="button"
                className={`role-tab ${role === 'farmer' ? 'active' : ''}`}
                onClick={() => setRole('farmer')}
              >
                <Leaf size={16} />
                <span>Farmer / Producer</span>
              </button>
            </div>

            {/* Google Authentication */}
            <button 
              type="button" 
              className="btn-google-auth w-full"
              onClick={() => setIsGoogleModalOpen(true)}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" className="google-btn-icon">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="auth-separator">
              <span className="separator-text">or sign in with email</span>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{ 
                padding: '12px', 
                background: '#ffebee', 
                border: '1px solid #ef5350',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                gap: '8px',
                marginBottom: '16px',
                alignItems: 'center',
                color: '#c62828'
              }}>
                <AlertCircle size={16} />
                <span style={{ fontSize: '0.9rem' }}>{error}</span>
              </div>
            )}

            {/* Demo Credentials Info Box */}
            <div style={{ 
              padding: '12px', 
              background: 'var(--accent-light)', 
              border: '1px solid var(--accent)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '16px'
            }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <strong>Demo Account ({role === 'farmer' ? 'Farmer' : 'Buyer'}):</strong>
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Email: <code style={{ background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '3px' }}>{demoAccounts[role].email}</code>
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Password: <code style={{ background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '3px' }}>{demoAccounts[role].password}</code>
              </p>
              <button 
                type="button"
                onClick={fillDemoCredentials}
                style={{
                  fontSize: '0.8rem',
                  padding: '6px 12px',
                  background: 'var(--accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Fill Demo Credentials
              </button>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address</label>
                <div className="input-icon-wrapper">
                  <Mail className="input-icon" size={18} />
                  <input 
                    type="email" 
                    id="email"
                    className="form-input" 
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">Password</label>
                <div className="input-icon-wrapper">
                  <Lock className="input-icon" size={18} />
                  <input 
                    type="password" 
                    id="password"
                    className="form-input" 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-options">
                <label className="checkbox-container">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="checkbox-checkmark"></span>
                  <span className="checkbox-label">Remember me</span>
                </label>
                <a href="#forgot" className="forgot-password-link">Forgot password?</a>
              </div>

              <button type="submit" className="btn btn-primary btn-submit w-full" disabled={isLoading}>
                {isLoading ? 'Signing In...' : `Sign In as ${role === 'buyer' ? 'Buyer' : 'Farmer'}`}
              </button>
            </form>

            <div className="auth-footer">
              <p>Don't have an account? <Link to="/register" className="auth-footer-link">Sign up</Link></p>
            </div>
          </div>
        </div>
      </div>
      <GoogleAuthModal 
        isOpen={isGoogleModalOpen} 
        onClose={() => setIsGoogleModalOpen(false)}
        onSelectAccount={handleGoogleLogin}
      />
    </div>
  );
}
