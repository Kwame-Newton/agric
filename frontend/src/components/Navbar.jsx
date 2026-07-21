import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Leaf, ShoppingBasket, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  return (
    <nav className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
      <div className="container nav-container">
        <Link to="/" className="logo">
          <Leaf className="logo-icon" />
          <span>AgriLink</span>
        </Link>

        {/* Desktop Links */}
        <div className="nav-links">
          <a href="/" className="nav-link ">Home</a>
          {user?.role === 'buyer' && (
            <Link to="/marketplace" className="nav-link">
              Marketplace
            </Link>
          )}
          <Link to="/contact" className="nav-link">Contact</Link>
          <a href="#features" className="nav-link">Features</a>
          <a href="#how-it-works" className="nav-link">How it works</a>
        </div>

        <div className="nav-actions">
          {user ? (
            <>
              <div
                className="user-info"
                style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: '15px' }}
              >
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <div style={{ fontWeight: '600' }}>{user.name}</div>
                  <div style={{ fontSize: '0.8rem' }}>{user.role === 'farmer' ? 'Farmer' : 'Buyer'}</div>
                </div>
              </div>

              {user.role === 'farmer' ? (
                <Link to="/dashboard" className="btn btn-primary">Dashboard</Link>
              ) : (
                <Link to="/marketplace" className="btn btn-primary">
                  <ShoppingBasket size={16} />
                  Marketplace
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="btn-logout"
                title="Logout"
                style={{ background: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px' }}
              >
                <LogOut size={20} />
              </button>
            </>
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
                    {user.role === 'farmer' ? 'Farmer' : 'Buyer'}
                  </p>
                </div>

                {user.role === 'farmer' ? (
                  <Link to="/dashboard" onClick={() => setIsOpen(false)} className="btn btn-primary w-full">
                    Dashboard
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

