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



export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

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
          <div className="sidebar-avatar">GV</div>
          <div className="sidebar-farmer-info">
            <div className="sidebar-farmer-name">Green Valley Farms</div>
            <div className="sidebar-farmer-badge">
              <span className="verified-dot"></span>
              Verified Farmer
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
            <div className="topbar-date">May 24, 2024 — May 30, 2024</div>
            <button className="topbar-icon-btn">
              <Bell size={20} />
            </button>
            <div className="topbar-user">
              <div className="topbar-avatar">GV</div>
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
