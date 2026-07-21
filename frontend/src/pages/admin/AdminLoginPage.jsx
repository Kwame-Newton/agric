import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Leaf, Lock, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();


  useEffect(() => {
    if (!authLoading && user && user.role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(email.trim().toLowerCase(), password);
      if (!result.success) {
        setError(result.error || 'Invalid email or password');
        setIsLoading(false);
        return;
      }

      const loggedUser = result.user;
      if (!loggedUser || loggedUser.role !== 'admin') {
        setError('You are not authorized to access the admin portal.');
        // Optionally sign out any non-admin session
        try { await (typeof window !== 'undefined' && window.__supabase_sign_out ? window.__supabase_sign_out() : Promise.resolve()); } catch(e) {}
        setIsLoading(false);
        return;
      }

      // Redirect to admin dashboard; AuthContext useEffect will also handle this when user state updates
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-auth-page">
      <Link to="/" className="admin-back-home-btn">
        <ArrowLeft size={18} />
        <span>Back to Home</span>
      </Link>

      <div className="admin-auth-container">


        <div className="admin-auth-card">
          <div className="admin-auth-header">
            <div className="admin-auth-logo">
              <Leaf className="logo-icon" />
              <span>AgriLink</span>
            </div>
            <h1 className="admin-auth-title">Admin Portal</h1>
            <p className="admin-auth-subtitle">Sign in to manage the platform</p>
          </div>

          <form onSubmit={onSubmit} className="admin-auth-form">
            <div className="admin-form-group">
              <label className="admin-form-label" htmlFor="adminEmail">Email</label>

              <div className="admin-input-icon-wrapper">
                <Mail className="admin-input-icon" size={18} />
                <input
                  id="adminEmail"
                  type="email"
                  className="admin-input"
                  placeholder="admin@agrilink.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label" htmlFor="adminPassword">Password</label>
              <div className="admin-input-icon-wrapper">
                <Lock className="admin-input-icon" size={18} />
                <input
                  id="adminPassword"
                  type="password"
                  className="admin-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="admin-auth-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn btn-primary admin-login-btn" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Login'}
            </button>
          </form>

          <div className="admin-auth-note">
            <span>Admin accounts are created internally only.</span>
          </div>

        </div>
      </div>
    </div>
  );
}

