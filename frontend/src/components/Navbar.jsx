import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Leaf, ShoppingBasket, LogOut, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleDocumentClick = (event) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(event.target)) {
        setAvatarMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    setAvatarMenuOpen(false);
    navigate('/', { replace: true });
  };

  return (
    <nav className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
      <div className="container nav-container">
        <Link to="/" className="logo">
          <img src="/favicon.jpg" alt="AgriLink Logo" className="logo-icon-img" style={{ width: 26, height: 26, borderRadius: 6, objectFit: 'cover' }} />
          <span>AgriLink</span>
        </Link>

        {/* Desktop Links */}
        <div className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          {user?.role === 'buyer' && (
            <>
              <Link to="/marketplace" className="nav-link">Marketplace</Link>
              <Link to="/blog" className="nav-link">Farm Blog</Link>
            </>
          )}
          {user?.role === 'farmer' && (
            <Link to="/dashboard" className="nav-link">Farmer Dashboard</Link>
          )}
          {user?.role === 'admin' && (
            <Link to="/admin/dashboard" className="nav-link">Admin Portal</Link>
          )}
          <Link to="/contact" className="nav-link">Contact</Link>
        </div>

        <div className="nav-actions">
          {user ? (
            <div className="navbar-user-menu-wrapper" ref={avatarMenuRef}>
              <button
                type="button"
                className="navbar-avatar-btn"
                onClick={() => setAvatarMenuOpen(open => !open)}
                aria-expanded={avatarMenuOpen}
                aria-haspopup="menu"
              >
                <span className="navbar-avatar-initials">
                  {user.name ? user.name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase() : 'NK'}
                </span>
                <ChevronDown size={14} className={`navbar-chevron ${avatarMenuOpen ? 'navbar-chevron-open' : ''}`} />
              </button>

              {avatarMenuOpen && (
                <div className="navbar-dropdown-overlay" onClick={() => setAvatarMenuOpen(false)} />
              )}
              {avatarMenuOpen && (
                <div className="navbar-avatar-dropdown" role="menu">
                  <div className="navbar-dropdown-header">
                    <div className="navbar-dropdown-name">{user.name}</div>
                    <div className="navbar-dropdown-email">{user.email}</div>
                    <div className="navbar-dropdown-role">
                      {user.role === 'farmer' ? 'Farmer' : user.role === 'admin' ? 'Administrator' : 'Buyer'}
                    </div>
                  </div>
                  <div className="navbar-dropdown-divider" />
                  {user.role === 'farmer' ? (
                    <Link
                      to="/dashboard"
                      className="navbar-dropdown-item"
                      onClick={() => setAvatarMenuOpen(false)}
                    >
                      <ShoppingBasket size={18} className="navbar-dropdown-item-icon" />
                      <span>Farmer Dashboard</span>
                    </Link>
                  ) : user.role === 'admin' ? (
                    <Link
                      to="/admin/dashboard"
                      className="navbar-dropdown-item"
                      onClick={() => setAvatarMenuOpen(false)}
                    >
                      <ShoppingBasket size={18} className="navbar-dropdown-item-icon" />
                      <span>Admin Portal</span>
                    </Link>
                  ) : (
                    <Link
                      to="/marketplace"
                      className="navbar-dropdown-item"
                      onClick={() => setAvatarMenuOpen(false)}
                    >
                      <ShoppingBasket size={18} className="navbar-dropdown-item-icon" />
                      <span>Marketplace</span>
                    </Link>
                  )}
                  <div className="navbar-dropdown-divider" />
                  <button
                    type="button"
                    className="navbar-dropdown-item navbar-dropdown-logout"
                    onClick={handleLogout}
                  >
                    <LogOut size={18} className="navbar-dropdown-item-icon navbar-dropdown-item-icon-logout" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn-login">Login</Link>
              <Link to="/register" className="btn btn-primary">Register</Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button onClick={() => setIsOpen(!isOpen)} className="mobile-toggle">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="mobile-menu">
          <a href="#home" onClick={() => setIsOpen(false)} className="mobile-link">Home</a>
          {user?.role === 'buyer' && (
            <Link to="/marketplace" onClick={() => setIsOpen(false)} className="mobile-link">
              Marketplace
            </Link>
          )}
          <Link to="/contact" onClick={() => setIsOpen(false)} className="mobile-link">Contact</Link>

          <div className="mobile-actions">
            {user ? (
              <>
                <div style={{ padding: '10px', borderBottom: '1px solid var(--border)', marginBottom: '10px' }}>
                  <p style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '4px' }}>{user.name}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {user.role === 'farmer' ? 'Farmer' : user.role === 'admin' ? 'Administrator' : 'Buyer'}
                  </p>
                </div>

                {user.role === 'farmer' ? (
                  <Link to="/dashboard" onClick={() => setIsOpen(false)} className="btn btn-primary w-full">
                    Farmer Dashboard
                  </Link>
                ) : user.role === 'admin' ? (
                  <Link to="/admin/dashboard" onClick={() => setIsOpen(false)} className="btn btn-primary w-full">
                    Admin Portal
                  </Link>
                ) : (
                  <Link to="/marketplace" onClick={() => setIsOpen(false)} className="btn btn-primary w-full">
                    Marketplace
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="btn-login"
                  style={{ width: '100%', marginTop: '8px' }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsOpen(false)} className="btn-login">Login</Link>
                <Link to="/register" onClick={() => setIsOpen(false)} className="btn btn-primary w-full">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

