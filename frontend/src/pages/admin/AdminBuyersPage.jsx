import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, X, Eye, Trash2, Download, ChevronLeft, ChevronRight,
  Mail, Phone, MapPin, Calendar, ShoppingCart, Package,
  TrendingUp, DollarSign, Clock, UserX, UserCheck,
  RotateCcw, Users, Loader, RefreshCw
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { AdminDashboardLayout } from './AdminDashboardPage';
import './admin.css';

/* ──────────────────────────────────────────────────────────
   Helpers
────────────────────────────────────────────────────────── */
function getInitials(name) {
  if (!name) return 'B';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  '#1e5c3b', '#1565c0', '#6a1b9a', '#c62828',
  '#e65100', '#00695c', '#4527a0', '#283593',
];
function avatarColor(id) {
  if (!id) return AVATAR_COLORS[0];
  const num = typeof id === 'number' ? id : String(id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[num % AVATAR_COLORS.length];
}

/* ──────────────────────────────────────────────────────────
   Sub-components
────────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    active:    { label: 'Active',    cls: 'bm-badge-active' },
    inactive:  { label: 'Inactive',  cls: 'bm-badge-inactive' },
    suspended: { label: 'Suspended', cls: 'bm-badge-suspended' },
  };
  const c = map[status] || map.inactive;
  return <span className={`bm-badge ${c.cls}`}>{c.label}</span>;
}

function OrderStatusBadge({ status }) {
  const map = {
    delivered:  { cls: 'fm-order-status-badge delivered' },
    processing: { cls: 'fm-order-status-badge processing' },
    pending:    { cls: 'fm-order-status-badge pending' },
    cancelled:  { cls: 'bm-order-cancelled' },
  };
  const c = map[status] || { cls: 'bm-order-cancelled' };
  return <span className={c.cls}>{status}</span>;
}

function StatCard({ label, value, color, icon: Icon, sub }) {
  return (
    <div className="vr-stat-card" style={{ borderTop: `3px solid ${color}` }}>
      <div className="vr-stat-icon" style={{ background: `${color}18` }}>
        <Icon size={20} color={color} />
      </div>
      <div className="vr-stat-body">
        <div className="vr-stat-value">{value}</div>
        <div className="vr-stat-label">{label}</div>
        {sub && <div className="vr-stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

function Toast({ toast, onClose }) {
  if (!toast) return null;
  const map = {
    suspended:   { icon: '🚫', msg: 'Buyer account suspended.' },
    reactivated: { icon: '✅', msg: 'Buyer account reactivated.' },
    deleted:     { icon: '🗑',  msg: 'Buyer account permanently deleted.' },
  };
  const c = map[toast];
  if (!c) return null;
  return (
    <div className="fm-toast">
      <span>{c.icon} {c.msg}</span>
      <button className="fm-toast-close" onClick={onClose}><X size={13} /></button>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Buyer Detail Modal
────────────────────────────────────────────────────────── */
function BuyerDetailModal({ buyer, open, onClose, onSuspend, onReactivate, onDelete }) {
  const [tab, setTab] = useState('overview');
  if (!buyer || !open) return null;

  const preferredCategories = buyer.preferredCategories || [];
  const recentOrders = buyer.recentOrders || [];

  return (
    <div className="fm-modal-overlay" onClick={onClose}>
      <div className="fm-modal fm-modal-detail" onClick={e => e.stopPropagation()} style={{ maxWidth: 820 }}>
        <div className="vr-detail-layout">
          {/* Left panel */}
          <div className="vr-detail-left" style={{ background: `linear-gradient(175deg, ${avatarColor(buyer.id)}dd, ${avatarColor(buyer.id)}99)` }}>
            <div className="vr-detail-avatar">
              <div className="fm-avatar" style={{ width: 72, height: 72, fontSize: 28, background: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.3)' }}>
                {getInitials(buyer.name)}
              </div>
            </div>
            <h2 className="vr-detail-name">{buyer.name}</h2>
            <StatusBadge status={buyer.status} />
            <div className="vr-detail-meta" style={{ marginTop: '1.25rem' }}>
              <div className="fm-detail-info-item"><Mail size={13} className="fm-detail-info-icon" /><span>{buyer.email}</span></div>
              <div className="fm-detail-info-item"><Phone size={13} className="fm-detail-info-icon" /><span>{buyer.phone}</span></div>
              <div className="fm-detail-info-item"><MapPin size={13} className="fm-detail-info-icon" /><span>{buyer.location}</span></div>
              <div className="fm-detail-info-item"><Calendar size={13} className="fm-detail-info-icon" /><span>Joined {buyer.dateJoined ? new Date(buyer.dateJoined).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}</span></div>
            </div>
            {preferredCategories.length > 0 && (
              <div className="bm-detail-cats">
                <div className="bm-cats-label">Preferred Categories</div>
                {preferredCategories.map(c => (
                  <span key={c} className="bm-cat-chip">{c}</span>
                ))}
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="vr-detail-right">
            <button className="vr-close-btn" onClick={onClose}><X size={18} /></button>

            {/* Tabs */}
            <div className="fm-detail-tabs">
              {['overview', 'orders'].map(t => (
                <button
                  key={t}
                  className={`fm-detail-tab ${tab === t ? 'active' : ''}`}
                  onClick={() => setTab(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            <div className="fm-detail-tab-content" style={{ paddingTop: '1rem' }}>
              {tab === 'overview' && (
                <div className="bm-overview">
                  <div className="bm-kpi-grid">
                    <div className="bm-kpi"><Package size={18} color="#1565c0" /><span className="bm-kpi-val">{buyer.totalOrders || 0}</span><span className="bm-kpi-lbl">Total Orders</span></div>
                    <div className="bm-kpi"><DollarSign size={18} color="#2e7d32" /><span className="bm-kpi-val">₵{(buyer.totalSpent || 0).toLocaleString()}</span><span className="bm-kpi-lbl">Total Spent</span></div>
                    <div className="bm-kpi"><Clock size={18} color="#f57f17" /><span className="bm-kpi-val">{buyer.lastOrder ? new Date(buyer.lastOrder).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No orders'}</span><span className="bm-kpi-lbl">Last Order</span></div>
                  </div>
                </div>
              )}

              {tab === 'orders' && (
                <div className="fm-detail-orders">
                  {recentOrders.length > 0 ? (
                    <table className="fm-mini-table">
                      <thead>
                        <tr><th>Order ID</th><th>Crop</th><th>Farmer</th><th>Amount</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {recentOrders.map(o => (
                          <tr key={o.id}>
                            <td><code style={{ fontSize: '0.75rem', color: '#555' }}>{o.id}</code></td>
                            <td>{o.crop}</td>
                            <td style={{ color: '#888', fontSize: '0.82rem' }}>{o.farmer}</td>
                            <td style={{ fontWeight: 700 }}>₵{o.amount}</td>
                            <td><OrderStatusBadge status={o.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p style={{ color: '#888', padding: '1rem 0' }}>No recent orders for this buyer.</p>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="vr-detail-actions">
              {buyer.status !== 'suspended' ? (
                <button className="fm-btn fm-btn-suspend" onClick={() => { onClose(); onSuspend(buyer.id); }}>
                  <UserX size={14} /> Suspend
                </button>
              ) : (
                <button className="fm-btn fm-btn-reactivate" onClick={() => { onClose(); onReactivate(buyer.id); }}>
                  <RotateCcw size={14} /> Reactivate
                </button>
              )}
              <button className="fm-btn fm-btn-delete" onClick={() => { onClose(); onDelete(buyer); }}>
                <Trash2 size={14} /> Delete Account
              </button>
              <button className="fm-btn fm-btn-cancel" onClick={onClose} style={{ marginLeft: 'auto' }}>Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Delete Confirm Modal
────────────────────────────────────────────────────────── */
function DeleteModal({ buyer, open, onClose, onConfirm }) {
  const [confirm, setConfirm] = useState('');
  if (!buyer || !open) return null;
  const match = confirm.toLowerCase() === buyer.name.toLowerCase();
  return (
    <div className="fm-modal-overlay" onClick={onClose}>
      <div className="fm-modal" onClick={e => e.stopPropagation()}>
        <div className="fm-modal-delete">
          <div className="fm-modal-delete-icon"><Trash2 size={48} color="#c62828" /></div>
          <h3>Permanently delete this account?</h3>
          <p className="fm-modal-delete-warning">All account data will be removed from the database. This cannot be undone.</p>
          <div className="fm-modal-delete-input-group">
            <label>Type <strong>{buyer.name}</strong> to confirm</label>
            <input
              className="fm-input fm-input-delete-confirm"
              type="text"
              placeholder={buyer.name}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
            />
          </div>
          <div className="fm-modal-actions">
            <button className="fm-btn fm-btn-cancel" onClick={() => { onClose(); setConfirm(''); }}>Cancel</button>
            <button
              className="fm-btn fm-btn-delete"
              disabled={!match}
              onClick={() => { if (match) { onConfirm(buyer.id); onClose(); setConfirm(''); } }}
            >
              <Trash2 size={14} /> Delete Permanently
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Actions dropdown
────────────────────────────────────────────────────────── */
function ActionsMenu({ buyer, onView, onSuspend, onReactivate, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="fm-actions-dropdown">
      <button className="fm-actions-trigger" onClick={() => setOpen(o => !o)}>
        <span /><span /><span />
      </button>
      {open && (
        <>
          <div className="fm-actions-backdrop" onClick={() => setOpen(false)} />
          <div className="fm-actions-menu">
            <button onClick={() => { setOpen(false); onView(buyer); }}>
              <Eye size={14} /> View Profile
            </button>
            {buyer.status !== 'suspended' ? (
              <button className="fm-action-warn" onClick={() => { setOpen(false); onSuspend(buyer.id); }}>
                <UserX size={14} /> Suspend
              </button>
            ) : (
              <button onClick={() => { setOpen(false); onReactivate(buyer.id); }}>
                <RotateCcw size={14} /> Reactivate
              </button>
            )}
            <button className="fm-action-danger" onClick={() => { setOpen(false); onDelete(buyer); }}>
              <Trash2 size={14} /> Delete Account
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Main Page
────────────────────────────────────────────────────────── */
export default function AdminBuyersPage() {
  const [buyers, setBuyers] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState(null);
  const [detailBuyer, setDetailBuyer] = useState(null);
  const [deleteBuyer, setDeleteBuyer] = useState(null);
  const perPage = 8;

  // ── Fetch Buyers from Supabase ────────────────────────────
  const loadBuyers = useCallback(async () => {
    setIsLoadingData(true);
    setError('');
    try {
      // Query profiles with role = 'buyer' and join buyers table
      const { data, error: err } = await supabase
        .from('profiles')
        .select('*, buyers(*)')
        .eq('role', 'buyer')
        .order('created_at', { ascending: false });

      if (err) throw err;

      if (data) {
        const formatted = data.map((p) => {
          const bDetails = Array.isArray(p.buyers) ? p.buyers[0] : p.buyers;
          return {
            id: p.id,
            name: p.full_name || 'Unnamed Buyer',
            email: p.email || '',
            phone: p.phone || 'N/A',
            location: bDetails?.delivery_address || 'Not specified',
            buyerType: bDetails?.buyer_type || 'individual',
            paymentMethod: bDetails?.payment_method || 'momo',
            dateJoined: p.created_at,
            status: bDetails?.status || 'active',
            totalOrders: 0,
            totalSpent: 0,
            lastOrder: null,
            preferredCategories: [],
            recentOrders: [],
          };
        });
        setBuyers(formatted);
      }
    } catch (e) {
      console.error('Error loading buyers:', e);
      setError('Failed to load buyers. Please check network connection.');
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadBuyers();
  }, [loadBuyers]);

  /* Stats */
  const totalBuyers    = buyers.length;
  const activeBuyers   = buyers.filter(b => b.status === 'active').length;
  const suspendedCount = buyers.filter(b => b.status === 'suspended').length;
  const totalRevenue   = buyers.reduce((s, b) => s + (b.totalSpent || 0), 0);

  /* Filter */
  const filtered = useMemo(() => {
    let list = buyers;
    if (filterStatus !== 'all') list = list.filter(b => b.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(b =>
        b.name.toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q) ||
        b.location.toLowerCase().includes(q) ||
        b.buyerType.toLowerCase().includes(q)
      );
    }
    return list;
  }, [buyers, filterStatus, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated  = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const showToast = type => { setToast(type); setTimeout(() => setToast(null), 4000); };

  const handleSuspend = async (id) => {
    try {
      const { error: err } = await supabase
        .from('buyers')
        .upsert({ id, status: 'suspended' });
      if (err) throw err;
      setBuyers(prev => prev.map(b => b.id === id ? { ...b, status: 'suspended' } : b));
      showToast('suspended');
    } catch (e) {
      alert('Failed to suspend buyer: ' + e.message);
    }
  };

  const handleReactivate = async (id) => {
    try {
      const { error: err } = await supabase
        .from('buyers')
        .upsert({ id, status: 'active' });
      if (err) throw err;
      setBuyers(prev => prev.map(b => b.id === id ? { ...b, status: 'active' } : b));
      showToast('reactivated');
    } catch (e) {
      alert('Failed to reactivate buyer: ' + e.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const { error: err } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);
      if (err) throw err;
      setBuyers(prev => prev.filter(b => b.id !== id));
      showToast('deleted');
    } catch (e) {
      alert('Failed to delete buyer profile: ' + e.message);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Location', 'Buyer Type', 'Date Joined', 'Status'];
    const rows = buyers.map(b => [b.name, b.email, b.phone, b.location, b.buyerType, b.dateJoined, b.status]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'buyers_export.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminDashboardLayout>
      <div className="fm-page">
        <Toast toast={toast} onClose={() => setToast(null)} />

        {/* Header */}
        <div className="fm-header">
          <div>
            <h1 className="fm-page-title">Buyer Management</h1>
            <p className="fm-page-subtitle">Manage and monitor all registered buyers on AgriLink</p>
          </div>
          <button className="fm-btn fm-btn-export" onClick={handleExportCSV}>
            <Download size={14} /> Export CSV
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#ffebee', color: '#c62828', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>
            <span style={{ flex: 1 }}>{error}</span>
            <button onClick={loadBuyers} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#c62828', fontWeight: 700 }}>
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="vr-stats-row">
          <StatCard label="Total Buyers"      value={totalBuyers}                   color="#1e5c3b" icon={Users}       sub="Registered" />
          <StatCard label="Active Buyers"     value={activeBuyers}                  color="#2e7d32" icon={UserCheck}   sub="Currently active" />
          <StatCard label="Suspended"         value={suspendedCount}                color="#c62828" icon={UserX}       sub="Accounts" />
          <StatCard label="Total Spend"       value={`₵${totalRevenue.toLocaleString()}`} color="#1565c0" icon={TrendingUp} sub="All time" />
        </div>

        {/* Toolbar */}
        <div className="fm-toolbar">
          <div className="fm-toolbar-left">
            <div className="fm-search-wrap">
              <Search size={15} className="fm-search-icon" />
              <input
                className="fm-search-input"
                type="text"
                placeholder="Search by name, email or location…"
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              />
              {search && (
                <button className="fm-search-clear" onClick={() => setSearch('')}><X size={13} /></button>
              )}
            </div>
          </div>
          <div className="fm-toolbar-right">
            <div className="fm-filter-tabs">
              {['all', 'active', 'inactive', 'suspended'].map(tab => (
                <button
                  key={tab}
                  className={`fm-filter-tab ${filterStatus === tab ? 'active' : ''}`}
                  onClick={() => { setFilterStatus(tab); setCurrentPage(1); }}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading state or Table */}
        {isLoadingData ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '0.75rem', color: '#777' }}>
            <Loader size={22} style={{ animation: 'spin 1s linear infinite' }} />
            <span>Loading registered buyers...</span>
          </div>
        ) : (
          <div className="fm-table-wrap">
            <table className="fm-table">
              <thead>
                <tr>
                  <th>Buyer</th>
                  <th>Location</th>
                  <th>Joined</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'center' }}>Orders</th>
                  <th>Total Spent</th>
                  <th>Status</th>
                  <th className="fm-th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(buyer => (
                  <tr key={buyer.id} className={buyer.status === 'suspended' ? 'bm-row-suspended' : ''}>
                    <td>
                      <div className="fm-td-farmer">
                        <div className="fm-avatar-wrap">
                          <div className="fm-avatar" style={{ width: 38, height: 38, fontSize: 14, background: avatarColor(buyer.id) }}>
                            {getInitials(buyer.name)}
                          </div>
                          {buyer.status === 'active' && <span className="fm-avatar-dot" />}
                        </div>
                        <div className="fm-td-farmer-info">
                          <div className="fm-td-farmer-name">{buyer.name}</div>
                          <div className="fm-td-farmer-email">{buyer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="vr-location-cell"><MapPin size={12} color="#aaa" />{buyer.location}</div>
                    </td>
                    <td>
                      <span className="vr-date">
                        {buyer.dateJoined ? new Date(buyer.dateJoined).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span style={{ textTransform: 'capitalize', fontSize: '0.85rem', fontWeight: 600, color: '#555' }}>{buyer.buyerType}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="bm-orders-badge">{buyer.totalOrders}</span>
                    </td>
                    <td>
                      <span className="bm-spent">₵{buyer.totalSpent.toLocaleString()}</span>
                    </td>
                    <td><StatusBadge status={buyer.status} /></td>
                    <td className="fm-td-actions">
                      <ActionsMenu
                        buyer={buyer}
                        onView={b => setDetailBuyer(b)}
                        onSuspend={handleSuspend}
                        onReactivate={handleReactivate}
                        onDelete={b => setDeleteBuyer(b)}
                      />
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={8} className="fm-empty-row">
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: '#ccc' }}>
                        <ShoppingCart size={40} />
                        <span>No buyers found</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoadingData && (
          <div className="fm-pagination">
            <div className="fm-pagination-info">
              Showing {filtered.length === 0 ? 0 : (currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filtered.length)} of {filtered.length} buyers
            </div>
            <div className="fm-pagination-controls">
              <button className="fm-pagination-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                <ChevronLeft size={14} /> Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  className={`fm-pagination-btn fm-pagination-page ${currentPage === p ? 'active' : ''}`}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}
              <button className="fm-pagination-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Modals */}
        <BuyerDetailModal
          buyer={detailBuyer}
          open={!!detailBuyer}
          onClose={() => setDetailBuyer(null)}
          onSuspend={handleSuspend}
          onReactivate={handleReactivate}
          onDelete={b => setDeleteBuyer(typeof b === 'object' ? b : buyers.find(x => x.id === b))}
        />
        <DeleteModal
          buyer={deleteBuyer}
          open={!!deleteBuyer}
          onClose={() => setDeleteBuyer(null)}
          onConfirm={handleDelete}
        />
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </AdminDashboardLayout>
  );
}
