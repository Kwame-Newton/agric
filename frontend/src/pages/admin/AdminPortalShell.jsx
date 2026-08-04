import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, LogOut } from 'lucide-react';
import './admin.css';

export function AdminPortalShell({ children }) {
  const navigate = useNavigate();

  const logoutAdmin = () => {
    localStorage.removeItem('agrilink_user');
    navigate('/admin/login');
  };

  return (
    <div className="admin-app-root">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <Leaf size={22} color="#2D6A4F" />
          <div>
            <div className="admin-sidebar-title">AgriLink Admin</div>
          </div>
        </div>

        <div className="admin-sidebar-divider" />

        <nav className="admin-sidebar-nav">
          <Link to="/admin/dashboard" className="admin-sidebar-link">Dashboard</Link>
          <Link to="/admin/farmers" className="admin-sidebar-link">Farmer Management</Link>
          <Link to="/admin/buyers" className="admin-sidebar-link">Buyer Management</Link>
          <Link to="/admin/crops" className="admin-sidebar-link">Crop Listings</Link>
          <Link to="/admin/orders" className="admin-sidebar-link">Orders</Link>
          <Link to="/admin/verification" className="admin-sidebar-link">Verification Requests</Link>
          <Link to="/admin/messages" className="admin-sidebar-link">Messages / Reports</Link>
          <Link to="/admin/settings" className="admin-sidebar-link">Settings</Link>
        </nav>

        <button className="admin-sidebar-logout" onClick={logoutAdmin}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <div className="admin-topbar-brand">
              <Leaf className="admin-topbar-logo-icon" />
              <span>Admin</span>
            </div>
          </div>
          <div className="admin-topbar-right">
            <button className="admin-topbar-logout" onClick={logoutAdmin}>
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}

