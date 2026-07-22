import React from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Sprout,
  ShoppingCart,
  ListChecks,
  Package,
  MessageSquare,
  Settings,
  CheckCircle,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './admin.css';

function AdminSidebarNavItem({ to, icon: Icon, label }) {
  const location = useLocation();
  const active = location.pathname === to;

  return (
    <Link to={to} className={`admin-sidebar-item ${active ? 'active' : ''}`}>
      <Icon size={18} className="admin-sidebar-icon" />
      <span className="admin-sidebar-label">{label}</span>
    </Link>
  );
}

function getInitials(name) {
  if (!name) return 'A';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function AdminDashboardLayout({ children }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const initials = getInitials(user?.name);
  const displayName = user?.name || 'Admin';
  const pageTitle = pathname.replace('/admin/', '').replace(/-/g, ' ') || 'dashboard';

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="admin-app-root">
      <aside className="admin-sidebar">
        {/* Brand */}
        <div className="admin-sidebar-brand">
          <div className="admin-sidebar-emoji">🌱</div>
          <div className="admin-sidebar-title">AgriLink Admin</div>
        </div>

        {/* Admin Profile */}
        <div className="admin-sidebar-profile">
          <div className="admin-sidebar-avatar">{initials}</div>
          <div>
            <div className="admin-sidebar-profile-name">{displayName}</div>
            <div className="admin-sidebar-profile-role">Administrator</div>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          <AdminSidebarNavItem to="/admin/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <AdminSidebarNavItem to="/admin/farmers" icon={Sprout} label="Farmer Management" />
          <AdminSidebarNavItem to="/admin/buyers" icon={ShoppingCart} label="Buyer Management" />
          <AdminSidebarNavItem to="/admin/crops" icon={CheckCircle} label="Crop Listings" />
          <AdminSidebarNavItem to="/admin/orders" icon={Package} label="Orders" />
          <AdminSidebarNavItem to="/admin/verification" icon={ListChecks} label="Verification Requests" />
          <AdminSidebarNavItem to="/admin/messages" icon={MessageSquare} label="Messages / Reports" />
          <AdminSidebarNavItem to="/admin/settings" icon={Settings} label="Settings" />
        </nav>

        <button className="admin-sidebar-logout" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <div className="admin-topbar-breadcrumb" style={{ textTransform: 'capitalize' }}>{pageTitle}</div>
          </div>
          <div className="admin-topbar-right">
            <div className="admin-topbar-user">
              <div className="admin-topbar-avatar">{initials}</div>
              <div className="admin-topbar-user-info">
                <div className="admin-topbar-user-name">{displayName}</div>
                <div className="admin-topbar-user-role">Administrator</div>
              </div>
              <button className="admin-topbar-logout" onClick={handleLogout}>
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-title">{title}</div>
      <div className="admin-stat-value">{value}</div>
    </div>
  );
}

function Table({ headers, rows }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx}>
              {r.map((cell, i) => (
                <td key={i}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { AdminDashboardLayout };

export default function AdminDashboardPage() {
  const statsRow1 = [
    { title: 'Total Farmers Registered', value: 1280 },
    { title: 'Total Buyers Registered', value: 940 },
    { title: 'Total Crop Listings', value: 2560 },
    { title: 'Total Orders Placed', value: 1120 },
  ];

  const statsRow2 = [
    { title: 'Pending Verification Requests', value: '🔴 38' },
    { title: 'Reported Problems', value: '24' },
    { title: 'Active Listings Today', value: '640' },
  ];

  const recentFarmers = [
    ['John Farmer', 'Green Valley Farms', 'Kumasi, Ashanti', '2024-05-30', 'Verified'],
    ['Ama Owusu', 'Ama Organic Farm', 'Ejisu, Ashanti', '2024-05-28', 'Pending'],
    ['Kwame Asare', 'Happy Farm', 'Ejisu, Ashanti', '2024-05-26', 'Rejected'],
  ];

  const recentOrders = [
    ['Kofi Mensah', 'Tomatoes', 'John Farmer', '₵260', 'Pending'],
    ['Ama Owusu', 'Maize', 'Ama Owusu', '₵180', 'Processing'],
    ['Yaw Boateng', 'Pepper', 'Kwame Asare', '₵200', 'Delivered'],
  ];

  return (
    <AdminDashboardLayout>
      <section>
        <div className="admin-stats-row">
          {statsRow1.map((s) => (
            <StatCard key={s.title} title={s.title} value={s.value} />
          ))}
        </div>

        <div className="admin-stats-row admin-stats-row-2">
          {statsRow2.map((s) => (
            <StatCard key={s.title} title={s.title} value={s.value} />
          ))}
        </div>

        <div className="admin-tables">
          <div className="admin-table-card">
            <div className="admin-table-title">Recent Farmer Registrations</div>
            <Table
              headers={['Name', 'Farm', 'Location', 'Date', 'Status']}
              rows={recentFarmers}
            />
          </div>

          <div className="admin-table-card">
            <div className="admin-table-title">Recent Orders</div>
            <Table
              headers={['Buyer', 'Crop', 'Farmer', 'Amount', 'Status']}
              rows={recentOrders}
            />
          </div>
        </div>
      </section>
    </AdminDashboardLayout>
  );
}

