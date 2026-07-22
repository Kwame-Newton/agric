import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Sprout, ShoppingCart, BookOpen,
  User, MessageSquare, Settings, LogOut, Leaf,
  Menu, X, Bell, ChevronDown
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Sprout, label: 'My Crops', path: '/dashboard/crops' },
  { icon: ShoppingCart, label: 'Orders', path: '/dashboard/orders' },
  { icon: BookOpen, label: 'Farm Blog', path: '/dashboard/blog' },
  { icon: User, label: 'Profile', path: '/dashboard/profile' },
  { icon: MessageSquare, label: 'Messages', path: '/dashboard/messages', badge: 3 },
  { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
];

function getInitials(name) {
  if (!name) return 'F';
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const initials = getInitials(user?.name);
  const displayName = user?.name || 'Farmer';
  const farmName = user?.farmName || user?.farm_name || user?.name || 'My Farm';
  const isVerified = user?.verification_status === 'verified' || user?.status === 'verified';

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="dashboard-root">
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo">
            <Leaf className="sidebar-logo-icon" />
            <span>AgriLink</span>
          </Link>
          <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-farmer-profile">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-farmer-info">
            <div className="sidebar-farmer-name">{displayName}</div>
            <div className="sidebar-farmer-badge">
              <span className="verified-dot"></span>
              {isVerified ? 'Verified Farmer' : 'Farmer Account'}
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ icon: Icon, label, path, badge }) => (
            <Link
              key={path}
              to={path}
              className={`sidebar-nav-item ${location.pathname === path ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={20} className="sidebar-nav-icon" />
              <span>{label}</span>
              {badge && <span className="nav-badge">{badge}</span>}
            </Link>
          ))}
        </nav>

        <button className="sidebar-logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="dashboard-main">
        {/* Top Navbar */}
        <header className="dashboard-topbar">
          <button className="topbar-menu-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>

          <div className="topbar-title">
            {navItems.find(n => n.path === location.pathname)?.label || 'Dashboard'}
          </div>

          <div className="topbar-right">
            <div className="topbar-user">
              <div className="topbar-avatar">{initials}</div>
              <div className="topbar-user-info">
                <div className="topbar-user-name">{displayName}</div>
                <div className="topbar-user-role">Farmer</div>
              </div>
              <ChevronDown size={16} />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  );
}
