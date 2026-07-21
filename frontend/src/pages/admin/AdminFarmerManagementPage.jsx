import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Download,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  Sprout,
  Package,
  DollarSign,
  MessageSquare,
  Clock,
  UserCheck,
  UserX,
  UserMinus,
  Plus,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../../supabaseClient';
import { AdminDashboardLayout } from './AdminDashboardPage';
import './admin.css';


/* ─────────────────────────────────────────────
   Helper Components
───────────────────────────────────────────── */

function StatCard({ label, value, color, icon: Icon }) {
  return (
    <div className="fm-stat-card" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="fm-stat-icon" style={{ backgroundColor: color }}>
        {Icon && <Icon size={18} color="#fff" />}
      </div>
      <div className="fm-stat-info">
        <div className="fm-stat-label">{label}</div>
        <div className="fm-stat-value">{value}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    verified: { label: 'Verified', className: 'fm-badge-verified' },
    pending: { label: 'Pending', className: 'fm-badge-pending' },
    suspended: { label: 'Suspended', className: 'fm-badge-suspended' },
  };
  const c = config[status] || config.pending;
  return <span className={`fm-badge ${c.className}`}>{c.label}</span>;
}

function getInitials(name) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function AvatarWithStatus({ name, status, size = 40 }) {
  const online = status === 'verified';
  return (
    <div className="fm-avatar-wrap" style={{ width: size, height: size }}>
      <div className="fm-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
        {getInitials(name)}
      </div>
      {online && <span className="fm-avatar-dot" />}
    </div>
  );
}

const TOAST_TYPES = {
  verified: { icon: '✅', message: 'Farmer verified successfully. Confirmation email sent.' },
  rejected: { icon: '❌', message: 'Verification rejected. Farmer has been notified.' },
  suspended: { icon: '🚫', message: 'Account suspended successfully.' },
  reactivated: { icon: '♻️', message: 'Account reactivated successfully.' },
  deleted: { icon: '🗑', message: 'Account permanently deleted.' },
  bulkVerified: { icon: '✅', message: 'Selected farmers verified successfully.' },
  bulkSuspended: { icon: '🚫', message: 'Selected farmers suspended successfully.' },
  bulkDeleted: { icon: '🗑', message: 'Selected farmers permanently deleted.' },
};

function Toast({ toast, onClose }) {
  if (!toast) return null;
  const config = TOAST_TYPES[toast];
  if (!config) return null;
  return (
    <div className="fm-toast">
      <span>{config.icon} {config.message}</span>
      <button className="fm-toast-close" onClick={onClose}><X size={14} /></button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Modals
───────────────────────────────────────────── */

function Modal({ open, onClose, children, className = '' }) {
  if (!open) return null;
  return (
    <div className="fm-modal-overlay" onClick={onClose}>
      <div className={`fm-modal ${className}`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function VerifyConfirmModal({ farmer, open, onClose, onConfirm }) {
  if (!farmer) return null;
  return (
    <Modal open={open} onClose={onClose}>
      <div className="fm-modal-verify">
        <div className="fm-modal-verify-icon">
          <CheckCircle size={48} color="#2e7d32" />
        </div>
        <h3>Approve {farmer.name} as a verified farmer on AgriLink?</h3>
        <p>They will receive an email confirmation and their crops will appear on the marketplace.</p>
        <div className="fm-modal-actions">
          <button className="fm-btn fm-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="fm-btn fm-btn-approve" onClick={() => { onConfirm(farmer.id); onClose(); }}>
            ✅ Approve
          </button>
        </div>
      </div>
    </Modal>
  );
}

function RejectModal({ farmer, open, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  if (!farmer) return null;
  return (
    <Modal open={open} onClose={onClose}>
      <div className="fm-modal-reject">
        <h3>Reject Verification Request</h3>
        <p className="fm-modal-reject-name">{farmer.name}</p>
        <textarea
          className="fm-textarea"
          placeholder="Enter reason for rejection (this will be sent to the farmer)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
        />
        <div className="fm-modal-actions">
          <button className="fm-btn fm-btn-cancel" onClick={onClose}>Cancel</button>
          <button
            className="fm-btn fm-btn-reject"
            disabled={!reason.trim()}
            onClick={() => { onConfirm(farmer.id, reason); onClose(); setReason(''); }}
          >
            ❌ Reject & Notify
          </button>
        </div>
      </div>
    </Modal>
  );
}

function SuspendModal({ farmer, open, onClose, onConfirm }) {
  if (!farmer) return null;
  return (
    <Modal open={open} onClose={onClose}>
      <div className="fm-modal-suspend">
        <div className="fm-modal-suspend-icon">
          <AlertTriangle size={48} color="#e65100" />
        </div>
        <h3>Suspend {farmer.name}'s account?</h3>
        <p>Their listings will be hidden from the marketplace until reactivated.</p>
        <div className="fm-modal-actions">
          <button className="fm-btn fm-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="fm-btn fm-btn-suspend" onClick={() => { onConfirm(farmer.id); onClose(); }}>
            🚫 Suspend
          </button>
        </div>
      </div>
    </Modal>
  );
}

function DeleteModal({ farmer, open, onClose, onConfirm }) {
  const [confirmName, setConfirmName] = useState('');
  if (!farmer) return null;
  const match = confirmName.toLowerCase() === farmer.name.toLowerCase();
  return (
    <Modal open={open} onClose={onClose}>
      <div className="fm-modal-delete">
        <div className="fm-modal-delete-icon">
          <Trash2 size={48} color="#c62828" />
        </div>
        <h3>Permanently delete this account?</h3>
        <p className="fm-modal-delete-warning">
          This will remove all crops, orders, blog posts and messages. This cannot be undone.
        </p>
        <div className="fm-modal-delete-input-group">
          <label>Type <strong>{farmer.name}</strong> to confirm</label>
          <input
            className="fm-input fm-input-delete-confirm"
            type="text"
            placeholder={farmer.name}
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
          />
        </div>
        <div className="fm-modal-actions">
          <button className="fm-btn fm-btn-cancel" onClick={() => { onClose(); setConfirmName(''); }}>
            Cancel
          </button>
          <button
            className="fm-btn fm-btn-delete"
            disabled={!match}
            onClick={() => { if (match) { onConfirm(farmer.id); onClose(); setConfirmName(''); } }}
          >
            🗑 Delete Permanently
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ─────────────────────────────────────────────
   Farmer Detail Modal
───────────────────────────────────────────── */

function FarmerDetailModal({ farmer, open, onClose, onAction }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!farmer) return null;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'crops', label: 'Crops' },
    { id: 'orders', label: 'Orders' },
    { id: 'blog', label: 'Blog Posts' },
  ];

  return (
    <Modal open={open} onClose={onClose} className="fm-modal-detail">
      <div className="fm-detail-layout">
        {/* Left Panel */}
        <div className="fm-detail-left">
          <div className="fm-detail-cover">
            <div className="fm-detail-cover-placeholder">
              <Sprout size={40} color="rgba(255,255,255,0.4)" />
            </div>
          </div>
          <div className="fm-detail-avatar-section">
            <AvatarWithStatus name={farmer.name} status={farmer.status} size={64} />
            <h2 className="fm-detail-name">{farmer.name}</h2>
            <StatusBadge status={farmer.status} />
          </div>
          <div className="fm-detail-info-list">
            <div className="fm-detail-info-item">
              <MapPin size={14} className="fm-detail-info-icon" />
              <span>{farmer.location}</span>
            </div>
            <div className="fm-detail-info-item">
              <Calendar size={14} className="fm-detail-info-icon" />
              <span>Joined {new Date(farmer.dateJoined).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="fm-detail-info-item">
              <Mail size={14} className="fm-detail-info-icon" />
              <span>{farmer.email}</span>
            </div>
            <div className="fm-detail-info-item">
              <Phone size={14} className="fm-detail-info-icon" />
              <span>{farmer.phone}</span>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="fm-detail-right">
          <div className="fm-detail-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`fm-detail-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="fm-detail-tab-content">
            {activeTab === 'overview' && (
              <div className="fm-detail-overview">
                <div className="fm-detail-overview-section">
                  <h4>Farm Name</h4>
                  <p>{farmer.farmName}</p>
                </div>
                <div className="fm-detail-overview-section">
                  <h4>Description</h4>
                  <p>{farmer.farmDescription}</p>
                </div>
                <div className="fm-detail-overview-section">
                  <h4>Crop Speciality</h4>
                  <p>{farmer.cropSpecialty}</p>
                </div>
                <div className="fm-detail-stats-grid">
                  <div className="fm-detail-stat-card">
                    <Sprout size={18} color="#1e5c3b" />
                    <span className="fm-detail-stat-value">{farmer.cropsListed}</span>
                    <span className="fm-detail-stat-label">Crops Listed</span>
                  </div>
                  <div className="fm-detail-stat-card">
                    <Package size={18} color="#1565c0" />
                    <span className="fm-detail-stat-value">{farmer.totalOrders}</span>
                    <span className="fm-detail-stat-label">Orders Received</span>
                  </div>
                  <div className="fm-detail-stat-card">
                    <DollarSign size={18} color="#2e7d32" />
                    <span className="fm-detail-stat-value">₵{farmer.totalRevenue.toLocaleString()}</span>
                    <span className="fm-detail-stat-label">Revenue Generated</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'crops' && (
              <div className="fm-detail-crops">
                <table className="fm-mini-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {farmer.crops.map((crop, i) => (
                      <tr key={i}>
                        <td>{crop.name}</td>
                        <td>{crop.category}</td>
                        <td>{crop.price}</td>
                        <td>
                          <span className={`fm-crop-status ${crop.status}`}>
                            {crop.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {farmer.crops.length === 0 && (
                      <tr><td colSpan={4} className="fm-empty-cell">No crops listed yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="fm-detail-orders">
                <table className="fm-mini-table">
                  <thead>
                    <tr>
                      <th>Buyer</th>
                      <th>Crop</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {farmer.orders.map((order, i) => (
                      <tr key={i}>
                        <td>{order.buyer}</td>
                        <td>{order.crop}</td>
                        <td>{order.amount}</td>
                        <td>
                          <span className={`fm-order-status-badge ${order.status}`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {farmer.orders.length === 0 && (
                      <tr><td colSpan={4} className="fm-empty-cell">No orders yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'blog' && (
              <div className="fm-detail-blog">
                <div className="fm-blog-grid">
                  {farmer.blogPosts.map((post, i) => (
                    <div key={i} className="fm-blog-thumb-card">
                      <div className="fm-blog-thumb-placeholder">
                        <MessageSquare size={24} color="#788c80" />
                      </div>
                      <div className="fm-blog-thumb-info">
                        <h4>{post.title}</h4>
                        <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                  ))}
                  {farmer.blogPosts.length === 0 && (
                    <div className="fm-empty-cell">No blog posts yet</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="fm-detail-actions">
            {farmer.status === 'pending' && (
              <>
                <button className="fm-btn fm-btn-approve" onClick={() => onAction('verify', farmer)}>
                  ✅ Approve
                </button>
                <button className="fm-btn fm-btn-reject" onClick={() => onAction('reject', farmer)}>
                  ❌ Reject
                </button>
              </>
            )}
            {farmer.status === 'verified' && (
              <button className="fm-btn fm-btn-suspend" onClick={() => onAction('suspend', farmer)}>
                🚫 Suspend Account
              </button>
            )}
            {farmer.status === 'suspended' && (
              <button className="fm-btn fm-btn-reactivate" onClick={() => onAction('reactivate', farmer)}>
                ♻️ Reactivate Account
              </button>
            )}
            <button className="fm-btn fm-btn-cancel" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ─────────────────────────────────────────────
   Main Page Component
───────────────────────────────────────────── */

export default function AdminFarmerManagementPage() {
  const [farmers, setFarmers] = useState(MOCK_FARMERS);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('all');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState(null);
  const perPage = 10;

  // Modal states
  const [detailFarmer, setDetailFarmer] = useState(null);
  const [verifyFarmer, setVerifyFarmer] = useState(null);
  const [rejectFarmer, setRejectFarmer] = useState(null);
  const [suspendFarmer, setSuspendFarmer] = useState(null);
  const [deleteFarmer, setDeleteFarmer] = useState(null);

  // Stats
  const totalFarmers = farmers.length;
  const verifiedCount = farmers.filter((f) => f.status === 'verified').length;
  const pendingCount = farmers.filter((f) => f.status === 'pending').length;
  const suspendedCount = farmers.filter((f) => f.status === 'suspended').length;

  // Filter & search
  const filtered = useMemo(() => {
    let list = farmers;
    if (filterTab !== 'all') {
      list = list.filter((f) => f.status === filterTab);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.farmName.toLowerCase().includes(q) ||
          f.location.toLowerCase().includes(q)
      );
    }
    return list;
  }, [farmers, filterTab, search]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  // Handlers
  const showToast = (type) => {
    setToast(type);
    setTimeout(() => setToast(null), 4000);
  };

  const handleVerify = (id) => {
    setFarmers((prev) => prev.map((f) => (f.id === id ? { ...f, status: 'verified' } : f)));
    showToast('verified');
  };

  const handleReject = (id) => {
    setFarmers((prev) => prev.filter((f) => f.id !== id));
    showToast('rejected');
  };

  const handleSuspend = (id) => {
    setFarmers((prev) => prev.map((f) => (f.id === id ? { ...f, status: 'suspended' } : f)));
    showToast('suspended');
  };

  const handleReactivate = (id) => {
    setFarmers((prev) => prev.map((f) => (f.id === id ? { ...f, status: 'verified' } : f)));
    showToast('reactivated');
  };

  const handleDelete = (id) => {
    setFarmers((prev) => prev.filter((f) => f.id !== id));
    showToast('deleted');
  };

  const handleBulkVerify = () => {
    setFarmers((prev) => prev.map((f) => (selectedIds.has(f.id) ? { ...f, status: 'verified' } : f)));
    showToast('bulkVerified');
    setSelectedIds(new Set());
  };

  const handleBulkSuspend = () => {
    setFarmers((prev) => prev.map((f) => (selectedIds.has(f.id) ? { ...f, status: 'suspended' } : f)));
    showToast('bulkSuspended');
    setSelectedIds(new Set());
  };

  const handleBulkDelete = () => {
    setFarmers((prev) => prev.filter((f) => !selectedIds.has(f.id)));
    showToast('bulkDeleted');
    setSelectedIds(new Set());
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map((f) => f.id)));
    }
  };

  const handleActionFromDetail = (action, farmer) => {
    setDetailFarmer(null);
    if (action === 'verify') setVerifyFarmer(farmer);
    else if (action === 'reject') setRejectFarmer(farmer);
    else if (action === 'suspend') setSuspendFarmer(farmer);
    else if (action === 'reactivate') handleReactivate(farmer.id);
  };

  const handleActionsDropdown = (action, farmer) => {
    if (action === 'view') setDetailFarmer(farmer);
    else if (action === 'verify') setVerifyFarmer(farmer);
    else if (action === 'suspend') setSuspendFarmer(farmer);
    else if (action === 'reactivate') handleReactivate(farmer.id);
    else if (action === 'delete') setDeleteFarmer(farmer);
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Farm Name', 'Location', 'Crops Listed', 'Date Joined', 'Status'];
    const rows = farmers.map((f) => [
      f.name, f.email, f.farmName, f.location, f.cropsListed, f.dateJoined, f.status,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'farmers_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Active actions dropdown state
  const [openActionId, setOpenActionId] = useState(null);

  return (
    <AdminDashboardLayout>
      <div className="fm-page">
        {/* Toast */}
        <Toast toast={toast} onClose={() => setToast(null)} />

        {/* Page Header */}
        <div className="fm-header">
          <h1 className="fm-page-title">Farmer Management</h1>
        </div>

        {/* Stats Row */}
        <div className="fm-stats-row">
          <StatCard label="Total Farmers" value={totalFarmers} color="#1e5c3b" icon={Sprout} />
          <StatCard label="Verified Farmers" value={verifiedCount} color="#2e7d32" icon={UserCheck} />
          <StatCard label="Pending Verification" value={pendingCount} color="#e65100" icon={Clock} />
          <StatCard label="Suspended Farmers" value={suspendedCount} color="#c62828" icon={UserX} />
        </div>

        {/* Search & Filter Bar */}
        <div className="fm-toolbar">
          <div className="fm-toolbar-left">
            <div className="fm-search-wrap">
              <Search size={16} className="fm-search-icon" />
              <input
                className="fm-search-input"
                type="text"
                placeholder="Search by name, farm name or location..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              />
              {search && (
                <button className="fm-search-clear" onClick={() => setSearch('')}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          <div className="fm-toolbar-right">
            <div className="fm-filter-tabs">
              {['all', 'verified', 'pending', 'suspended'].map((tab) => (
                <button
                  key={tab}
                  className={`fm-filter-tab ${filterTab === tab ? 'active' : ''}`}
                  onClick={() => { setFilterTab(tab); setCurrentPage(1); }}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            <button className="fm-btn fm-btn-export" onClick={handleExportCSV}>
              <Download size={14} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="fm-bulk-bar">
            <span className="fm-bulk-count">{selectedIds.size} farmer(s) selected</span>
            <div className="fm-bulk-actions">
              <button className="fm-btn fm-btn-bulk-approve" onClick={handleBulkVerify}>
                <CheckCircle size={14} /> Verify Selected
              </button>
              <button className="fm-btn fm-btn-bulk-suspend" onClick={handleBulkSuspend}>
                <AlertTriangle size={14} /> Suspend Selected
              </button>
              <button className="fm-btn fm-btn-bulk-delete" onClick={handleBulkDelete}>
                <Trash2 size={14} /> Delete Selected
              </button>
            </div>
          </div>
        )}

        {/* Farmers Table */}
        <div className="fm-table-wrap">
          <table className="fm-table">
            <thead>
              <tr>
                <th className="fm-th-checkbox">
                  <input
                    type="checkbox"
                    checked={paginated.length > 0 && selectedIds.size === paginated.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>Farmer</th>
                <th>Farm Name</th>
                <th>Location</th>
                <th>Crops</th>
                <th>Date Joined</th>
                <th>Status</th>
                <th className="fm-th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((farmer) => (
                <tr key={farmer.id} className={selectedIds.has(farmer.id) ? 'fm-row-selected' : ''}>
                  <td className="fm-td-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(farmer.id)}
                      onChange={() => toggleSelect(farmer.id)}
                    />
                  </td>
                  <td>
                    <div className="fm-td-farmer">
                      <AvatarWithStatus name={farmer.name} status={farmer.status} />
                      <div className="fm-td-farmer-info">
                        <div className="fm-td-farmer-name">{farmer.name}</div>
                        <div className="fm-td-farmer-email">{farmer.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{farmer.farmName}</td>
                  <td>{farmer.location}</td>
                  <td className="fm-td-crops">{farmer.cropsListed}</td>
                  <td>{new Date(farmer.dateJoined).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td><StatusBadge status={farmer.status} /></td>
                  <td className="fm-td-actions">
                    <div className="fm-actions-dropdown">
                      <button
                        className="fm-actions-trigger"
                        onClick={() => setOpenActionId(openActionId === farmer.id ? null : farmer.id)}
                      >
                        <span></span><span></span><span></span>
                      </button>
                      {openActionId === farmer.id && (
                        <>
                          <div className="fm-actions-backdrop" onClick={() => setOpenActionId(null)} />
                          <div className="fm-actions-menu">
                            <button onClick={() => { setOpenActionId(null); handleActionsDropdown('view', farmer); }}>
                              <Eye size={14} /> View Profile
                            </button>
                            {farmer.status === 'pending' && (
                              <button onClick={() => { setOpenActionId(null); handleActionsDropdown('verify', farmer); }}>
                                <CheckCircle size={14} /> Verify
                              </button>
                            )}
                            {farmer.status === 'verified' && (
                              <button className="fm-action-warn" onClick={() => { setOpenActionId(null); handleActionsDropdown('suspend', farmer); }}>
                                <AlertTriangle size={14} /> Suspend
                              </button>
                            )}
                            {farmer.status === 'suspended' && (
                              <button onClick={() => { setOpenActionId(null); handleActionsDropdown('reactivate', farmer); }}>
                                <RotateCcw size={14} /> Reactivate
                              </button>
                            )}
                            <button className="fm-action-danger" onClick={() => { setOpenActionId(null); handleActionsDropdown('delete', farmer); }}>
                              <Trash2 size={14} /> Delete Account
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={8} className="fm-empty-row">No farmers found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="fm-pagination">
          <div className="fm-pagination-info">
            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * perPage + 1}
            -{Math.min(currentPage * perPage, filtered.length)} of {filtered.length} farmers
          </div>
          <div className="fm-pagination-controls">
            <button
              className="fm-pagination-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft size={14} /> Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`fm-pagination-btn fm-pagination-page ${currentPage === page ? 'active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button
              className="fm-pagination-btn"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Modals */}
        <FarmerDetailModal
          farmer={detailFarmer}
          open={!!detailFarmer}
          onClose={() => setDetailFarmer(null)}
          onAction={handleActionFromDetail}
        />
        <VerifyConfirmModal
          farmer={verifyFarmer}
          open={!!verifyFarmer}
          onClose={() => setVerifyFarmer(null)}
          onConfirm={handleVerify}
        />
        <RejectModal
          farmer={rejectFarmer}
          open={!!rejectFarmer}
          onClose={() => setRejectFarmer(null)}
          onConfirm={handleReject}
        />
        <SuspendModal
          farmer={suspendFarmer}
          open={!!suspendFarmer}
          onClose={() => setSuspendFarmer(null)}
          onConfirm={handleSuspend}
        />
        <DeleteModal
          farmer={deleteFarmer}
          open={!!deleteFarmer}
          onClose={() => setDeleteFarmer(null)}
          onConfirm={handleDelete}
        />
      </div>
    </AdminDashboardLayout>
  );
}
