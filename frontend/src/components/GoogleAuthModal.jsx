import React, { useState } from 'react';
import { X, UserPlus, ArrowLeft } from 'lucide-react';

export default function GoogleAuthModal({ isOpen, onClose, onSelectAccount }) {
  const [view, setView] = useState('list'); // 'list' or 'custom'
  const [customEmail, setCustomEmail] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSelectMock = (email) => {
    onSelectAccount(email);
    onClose();
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes('@')) {
      setError('Enter a valid email address');
      return;
    }
    setError('');
    onSelectAccount(customEmail);
    onClose();
  };

  return (
    <div className="google-modal-overlay">
      <div className="google-modal-card">
        {/* Modal Header */}
        <button onClick={onClose} className="google-modal-close" aria-label="Close">
          <X size={18} />
        </button>

        <div className="google-branding">
          <svg viewBox="0 0 24 24" width="24" height="24" className="google-icon-svg">
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
          <h2 className="google-title">Sign in with Google</h2>
          <p className="google-subtitle">to continue to <span className="text-bold">AgriLink</span></p>
        </div>

        {view === 'list' ? (
          /* Account List View */
          <div className="google-accounts-list">
            <button 
              className="google-account-item"
              onClick={() => handleSelectMock('nana.kwame@gmail.com')}
            >
              <div className="google-avatar font-avatar-1">N</div>
              <div className="google-account-info">
                <div className="google-account-name">Nana Kwame</div>
                <div className="google-account-email">nana.kwame@gmail.com</div>
              </div>
            </button>

            <button 
              className="google-account-item"
              onClick={() => handleSelectMock('guest.user@gmail.com')}
            >
              <div className="google-avatar font-avatar-2">G</div>
              <div className="google-account-info">
                <div className="google-account-name">Guest User</div>
                <div className="google-account-email">guest.user@gmail.com</div>
              </div>
            </button>

            <button 
              className="google-account-item use-other-btn"
              onClick={() => setView('custom')}
            >
              <div className="google-avatar custom-avatar">
                <UserPlus size={18} />
              </div>
              <div className="google-account-info">
                <div className="google-account-name text-blue">Use another account</div>
              </div>
            </button>
          </div>
        ) : (
          /* Custom Email View */
          <form onSubmit={handleCustomSubmit} className="google-custom-form">
            <button 
              type="button" 
              onClick={() => { setView('list'); setError(''); }} 
              className="google-back-btn"
            >
              <ArrowLeft size={16} />
              <span>Back to accounts</span>
            </button>

            <div className="google-form-group">
              <input 
                type="email" 
                className={`google-input ${error ? 'input-error' : ''}`}
                placeholder="Email or phone"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                required
                autoFocus
              />
              {error && <span className="google-error-msg">{error}</span>}
            </div>

            <p className="google-terms-disclaimer">
              To continue, Google will share your name, email address, profile picture, and language preference with AgriLink.
            </p>

            <div className="google-form-actions">
              <button 
                type="button" 
                onClick={() => { setView('list'); setError(''); }} 
                className="google-btn-text"
              >
                Cancel
              </button>
              <button type="submit" className="google-btn-submit">
                Next
              </button>
            </div>
          </form>
        )}

        <div className="google-footer">
          <span>English (United States)</span>
          <div className="google-footer-links">
            <a href="#help">Help</a>
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
          </div>
        </div>
      </div>
    </div>
  );
}
