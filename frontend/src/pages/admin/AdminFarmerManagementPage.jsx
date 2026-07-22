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
   Add Farmer Modal
───────────────────────────────────────────── */

function AddFarmerModal({ open, onClose, onAdd }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [farmName, setFarmName] = useState('');
  const [farmLocation, setFarmLocation] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [primaryCategory, setPrimaryCategory] = useState('vegetables');
  const [idType, setIdType] = useState('national');
  const [idNumber, setIdNumber] = useState('');
  const [farmBio, setFarmBio] = useState('');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await onAdd({
        email,
        password,
        fullName,
        phone,
        farmName,
        farmLocation,
        farmSize,
        primaryCategory,
        idType,
        idNumber,
        farmBio,
      });

      setEmail('');
      setPassword('');
      setFullName('');
      setPhone('');
      setFarmName('');
      setFarmLocation('');
      setFarmSize('');
      setFarmBio('');
      setIdNumber('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create farmer account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ padding: '2.5rem', maxWidth: '640px', width: '100%', margin: '0 auto' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem', color: '#111' }}>
          ➕ Add New Farmer Account
        </h3>
        {error && (
          <div style={{ color: '#c62828', background: '#ffebee', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#555', display: 'block', marginBottom: '0.3rem' }}>Full Name *</label>
              <input type="text" className="fm-input" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Kwame Mensah" />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#555', display: 'block', marginBottom: '0.3rem' }}>Phone *</label>
              <input type="tel" className="fm-input" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +233 24..." />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#555', display: 'block', marginBottom: '0.3rem' }}>Email Address *</label>
              <input type="email" className="fm-input" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="farmer@farm.com" />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#555', display: 'block', marginBottom: '0.3rem' }}>Password *</label>
              <input type="password" className="fm-input" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '0.5rem 0' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#555', display: 'block', marginBottom: '0.3rem' }}>Farm Name *</label>
              <input type="text" className="fm-input" required value={farmName} onChange={(e) => setFarmName(e.target.value)} placeholder="e.g. Mensah Valley Farms" />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#555', display: 'block', marginBottom: '0.3rem' }}>Location *</label>
              <input type="text" className="fm-input" required value={farmLocation} onChange={(e) => setFarmLocation(e.target.value)} placeholder="e.g. Kumasi, Ashanti" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#555', display: 'block', marginBottom: '0.3rem' }}>Farm Size (Acres) *</label>
              <input type="number" className="fm-input" min="1" required value={farmSize} onChange={(e) => setFarmSize(e.target.value)} placeholder="5" />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#555', display: 'block', marginBottom: '0.3rem' }}>Primary Category *</label>
              <select className="fm-input" style={{ padding: '0.65rem' }} value={primaryCategory} onChange={(e) => setPrimaryCategory(e.target.value)}>
                <option value="vegetables">Vegetables</option>
                <option value="fruits">Fruits</option>
                <option value="grains">Grains</option>
                <option value="spices">Spices</option>
                <option value="tubers">Tubers</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#555', display: 'block', marginBottom: '0.3rem' }}>ID Card Type *</label>
              <select className="fm-input" style={{ padding: '0.65rem' }} value={idType} onChange={(e) => setIdType(e.target.value)}>
                <option value="national">National ID (Ghana Card)</option>
                <option value="voter">Voter's ID</option>
                <option value="association">Farmer Association ID</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#555', display: 'block', marginBottom: '0.3rem' }}>ID Number *</label>
              <input type="text" className="fm-input" required value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="e.g. GHA-123456789-0" />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#555', display: 'block', marginBottom: '0.3rem' }}>About the Farm</label>
            <textarea className="fm-textarea" rows="2" value={farmBio} onChange={(e) => setFarmBio(e.target.value)} placeholder="Short description of the farm..." />
          </div>

          <div className="fm-modal-actions" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="button" className="fm-btn fm-btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="fm-btn fm-btn-approve" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

/* ─────────────────────────────────────────────
   Main Page Component
───────────────────────────────────────────── */

export default function AdminFarmerManagementPage() {
  const [farmers, setFarmers] = useState([]);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('all');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const perPage = 10;

  // Modal states
  const [detailFarmer, setDetailFarmer] = useState(null);
  const [verifyFarmer, setVerifyFarmer] = useState(null);
  const [rejectFarmer, setRejectFarmer] = useState(null);
  const [suspendFarmer, setSuspendFarmer] = useState(null);
  const [deleteFarmer, setDeleteFarmer] = useState(null);

  // Fetch Farmers from Supabase
  const loadFarmers = async () => {
    setIsLoadingData(true);
    try {
      const { data, error } = await supabase
        .from('farmers')
        .select('*, profiles(*)');

      if (error) {
        console.error('Error fetching farmers:', error);
        return;
      }

      if (data) {
        const formatted = data.map((f) => ({
          id: f.id,
          name: f.profiles?.full_name || 'Unknown Farmer',
          email: f.profiles?.email || '',
          phone: f.profiles?.phone || '',
          farmName: f.farm_name,
          location: f.farm_location,
          farmSize: f.farm_size,
          primaryCategory: f.primary_category,
          idType: f.id_type,
          idNumber: f.id_number,
          farmDescription: f.farm_bio || '',
          status: f.verification_status || 'pending',
          dateJoined: f.created_at,
          cropsListed: 0,
          totalOrders: 0,
          totalRevenue: 0,
          cropSpecialty: f.primary_category,
          crops: [],
          orders: [],
          blogPosts: [],
        }));
        setFarmers(formatted);
      }
    } catch (err) {
      console.error('Error loading farmers:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadFarmers();
  }, []);

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

  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  // Handlers
  const showToast = (type) => {
    setToast(type);
    setTimeout(() => setToast(null), 4000);
  };

  const handleVerify = async (id) => {
    const { error } = await supabase
      .from('farmers')
      .update({ verification_status: 'verified' })
      .eq('id', id);

    if (!error) {
      setFarmers((prev) => prev.map((f) => (f.id === id ? { ...f, status: 'verified' } : f)));
      showToast('verified');
    } else {
      console.error('Error verifying farmer:', error);
    }
  };

  const handleReject = async (id) => {
    const { error } = await supabase
      .from('farmers')
      .update({ verification_status: 'rejected' })
      .eq('id', id);

    if (!error) {
      setFarmers((prev) => prev.filter((f) => f.id !== id));
      showToast('rejected');
    } else {
      console.error('Error rejecting farmer:', error);
    }
  };

  const handleSuspend = async (id) => {
    const { error } = await supabase
      .from('farmers')
      .update({ verification_status: 'suspended' })
      .eq('id', id);

    if (!error) {
      setFarmers((prev) => prev.map((f) => (f.id === id ? { ...f, status: 'suspended' } : f)));
      showToast('suspended');
    } else {
      console.error('Error suspending farmer:', error);
    }
  };

  const handleReactivate = async (id) => {
    const { error } = await supabase
      .from('farmers')
      .update({ verification_status: 'verified' })
      .eq('id', id);

    if (!error) {
      setFarmers((prev) => prev.map((f) => (f.id === id ? { ...f, status: 'verified' } : f)));
      showToast('reactivated');
    } else {
      console.error('Error reactivating farmer:', error);
    }
  };

  const handleDelete = async (id) => {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (!error) {
      setFarmers((prev) => prev.filter((f) => f.id !== id));
      showToast('deleted');
    } else {
      console.error('Error deleting farmer profile:', error);
    }
  };

  const handleBulkVerify = async () => {
    const ids = Array.from(selectedIds);
    const { error } = await supabase
      .from('farmers')
      .update({ verification_status: 'verified' })
      .in('id', ids);

    if (!error) {
      setFarmers((prev) => prev.map((f) => (selectedIds.has(f.id) ? { ...f, status: 'verified' } : f)));
      showToast('bulkVerified');
      setSelectedIds(new Set());
    }
  };

  const handleBulkSuspend = async () => {
    const ids = Array.from(selectedIds);
    const { error } = await supabase
      .from('farmers')
      .update({ verification_status: 'suspended' })
      .in('id', ids);

    if (!error) {
      setFarmers((prev) => prev.map((f) => (selectedIds.has(f.id) ? { ...f, status: 'suspended' } : f)));
      showToast('bulkSuspended');
      setSelectedIds(new Set());
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    const { error } = await supabase
      .from('profiles')
      .delete()
      .in('id', ids);

    if (!error) {
      setFarmers((prev) => prev.filter((f) => !selectedIds.has(f.id)));
      showToast('bulkDeleted');
      setSelectedIds(new Set());
    }
  };

  const handleCreateFarmer = async (formData) => {
    // Create temporary Supabase client with non-persisting session to not sign out current Admin
    const tempSupabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      { auth: { persistSession: false } }
    );

    const normalizedEmail = formData.email.trim().toLowerCase();

    const { data: authData, error: authError } = await tempSupabase.auth.signUp({
      email: normalizedEmail,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          phone: formData.phone,
          role: 'farmer',
          farm_name: formData.farmName,
          farm_location: formData.farmLocation,
          farm_size: parseFloat(formData.farmSize) || 0,
          primary_category: formData.primaryCategory,
          id_type: formData.idType,
          id_number: formData.idNumber,
          farm_bio: formData.farmBio,
        },
      },
    });

    if (authError) {
      throw new Error(authError.message);
    }

    if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
      throw new Error('An account with this email already exists in Supabase Auth. Please use a different email or delete the existing account first.');
    }

    const newUserId = authData.user?.id;
    if (newUserId) {
      // 1. Ensure profile role is set to 'farmer'
      const { error: profileErr } = await supabase
        .from('profiles')
        .upsert({
          id: newUserId,
          email: normalizedEmail,
          full_name: formData.fullName,
          phone: formData.phone,
          role: 'farmer',
        });

      if (profileErr) {
        console.error('Error saving profile record:', profileErr);
      }

      // 2. Remove any fallback buyer row if trigger created it
      await supabase
        .from('buyers')
        .delete()
        .eq('id', newUserId);

      // 3. Insert or update farmer record as verified
      const { error: fErr } = await supabase
        .from('farmers')
        .upsert({
          id: newUserId,
          farm_name: formData.farmName,
          farm_location: formData.farmLocation,
          farm_size: parseFloat(formData.farmSize) || 0,
          primary_category: formData.primaryCategory,
          id_type: formData.idType,
          id_number: formData.idNumber,
          farm_bio: formData.farmBio || '',
          verification_status: 'verified',
        });

      if (fErr) {
        console.error('Error saving farmer record:', fErr);
        throw new Error(`Failed to save farmer record: ${fErr.message}`);
      }
    } else {
      throw new Error('Supabase Auth failed to return a valid User ID.');
    }

    // Refresh farmers list
    await loadFarmers();
    showToast('verified');
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
          <button className="fm-btn fm-btn-approve" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={16} /> Add New Farmer
          </button>
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
        <AddFarmerModal
          open={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleCreateFarmer}
        />
      </div>
    </AdminDashboardLayout>
  );
}
