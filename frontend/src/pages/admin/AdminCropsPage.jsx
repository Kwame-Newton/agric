import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, X, Eye, Trash2, Download, ChevronLeft, ChevronRight,
  Sprout, PauseCircle, PlayCircle, MapPin, Calendar, Tag,
  DollarSign, Package, CheckCircle, AlertCircle, Image as ImageIcon,
  Loader, RefreshCw, Filter
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { AdminDashboardLayout } from './AdminDashboardPage';
import './admin.css';

/* ──────────────────────────────────────────────────────────
   Helpers & Fallbacks
────────────────────────────────────────────────────────── */
const cropCategories = ['Vegetables', 'Fruits', 'Grains', 'Tubers', 'Spices'];

const FALLBACK_IMAGES = {
  Vegetables: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=300&q=70',
  Fruits:     'https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=300&q=70',
  Grains:     'https://images.unsplash.com/photo-1577449923886-df3d846797af?auto=format&fit=crop&w=300&q=70',
  Tubers:     'https://images.unsplash.com/photo-1524592412331-4fe04e37381d?auto=format&fit=crop&w=300&q=70',
  Spices:     'https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?auto=format&fit=crop&w=300&q=70',
};

function StatusBadge({ status, quantity }) {
  let finalStatus = status;
  if (Number(quantity) <= 0) finalStatus = 'out_of_stock';

  const map = {
    active:       { label: 'Active',        cls: 'fm-badge-verified' },
    paused:       { label: 'Paused',        cls: 'fm-badge-pending'  },
    out_of_stock: { label: 'Out of Stock',  cls: 'fm-badge-suspended'},
  };
  const c = map[finalStatus] || { label: finalStatus, cls: 'fm-badge-pending' };
  return <span className={`fm-badge ${c.cls}`}>{c.label}</span>;
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
    paused:     { icon: '⏸️', msg: 'Crop listing paused.' },
    activated:  { icon: '✅', msg: 'Crop listing activated.' },
    deleted:    { icon: '🗑️', msg: 'Crop listing permanently removed.' },
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
   Crop Detail Modal
────────────────────────────────────────────────────────── */
function CropDetailModal({ crop, open, onClose, onToggleStatus, onDelete }) {
  if (!crop || !open) return null;
  const imgSrc = crop.image_url || FALLBACK_IMAGES[crop.category] || FALLBACK_IMAGES.Vegetables;
  const isPaused = crop.status === 'paused';

  return (
    <div className="fm-modal-overlay" onClick={onClose}>
      <div className="fm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className="fm-modal-header">
          <div>
            <h3 className="fm-modal-title">🌱 Crop Listing Details</h3>
            <div className="fm-modal-subtitle">Listed by {crop.farmerName}</div>
          </div>
          <button type="button" className="fm-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="fm-modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ borderRadius: '12px', overflow: 'hidden', height: '180px', background: '#f0f4f2' }}>
              <img src={imgSrc} alt={crop.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#111', margin: 0 }}>{crop.name}</h2>
                <StatusBadge status={crop.status} quantity={crop.quantity} />
              </div>
              <div style={{ fontSize: '0.85rem', color: '#1e5c3b', fontWeight: 700 }}>
                Category: <span style={{ color: '#444' }}>{crop.category}</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2e7d32', marginTop: '0.2rem' }}>
                ₵{crop.price} <span style={{ fontSize: '0.85rem', color: '#777', fontWeight: 500 }}>per {crop.unit}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#555' }}>
                <strong>Stock Available:</strong> {crop.quantity} {crop.unit}s
              </div>
              <div style={{ fontSize: '0.85rem', color: '#555', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <MapPin size={14} color="#777" /> {crop.location || 'Location not specified'}
              </div>
            </div>
          </div>

          <div style={{ background: '#f9fbf9', padding: '1rem', borderRadius: '8px', border: '1px solid #e8ede9', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#777', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Description</div>
            <p style={{ fontSize: '0.9rem', color: '#333', lineHeight: 1.5, margin: 0 }}>
              {crop.description || 'No description provided for this crop listing.'}
            </p>
          </div>

          <div style={{ background: '#f8f9fa', padding: '0.85rem 1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#666' }}>
            <div><strong>Farmer:</strong> {crop.farmerName} ({crop.farmerEmail})</div>
            <div><strong>Listed:</strong> {crop.created_at ? new Date(crop.created_at).toLocaleDateString() : 'N/A'}</div>
          </div>
        </div>

        <div className="fm-modal-footer" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="fm-btn fm-btn-secondary"
            onClick={() => { onClose(); onToggleStatus(crop); }}
          >
            {isPaused ? <><PlayCircle size={15} /> Activate Listing</> : <><PauseCircle size={15} /> Pause Listing</>}
          </button>
          <button
            type="button"
            className="fm-btn fm-btn-delete"
            onClick={() => { onClose(); onDelete(crop); }}
          >
            <Trash2 size={15} /> Remove Crop
          </button>
          <button type="button" className="fm-btn fm-btn-cancel" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Delete Confirm Modal
────────────────────────────────────────────────────────── */
function DeleteModal({ crop, open, onClose, onConfirm }) {
  if (!crop || !open) return null;
  return (
    <div className="fm-modal-overlay" onClick={onClose}>
      <div className="fm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="fm-modal-delete">
          <div className="fm-modal-delete-icon"><Trash2 size={48} color="#c62828" /></div>
          <h3>Remove crop listing?</h3>
          <p className="fm-modal-delete-warning">
            Are you sure you want to delete <strong>{crop.name}</strong>? It will be removed from the buyer marketplace.
          </p>
          <div className="fm-modal-actions" style={{ marginTop: '1.5rem' }}>
            <button className="fm-btn fm-btn-cancel" onClick={onClose}>Cancel</button>
            <button className="fm-btn fm-btn-delete" onClick={() => { onConfirm(crop.id); onClose(); }}>
              <Trash2 size={14} /> Remove Listing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Main Admin Crop Listings Page
────────────────────────────────────────────────────────── */
export default function AdminCropsPage() {
  const [crops, setCrops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState(null);

  const [detailCrop, setDetailCrop] = useState(null);
  const [deleteCrop, setDeleteCrop] = useState(null);

  const perPage = 8;

  // ── Load crops from Supabase ─────────────────────────────
  const loadCrops = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase
        .from('crops')
        .select('*, profiles:farmer_id ( full_name, email )')
        .order('created_at', { ascending: false });

      if (err) throw err;

      if (data) {
        const formatted = data.map(c => ({
          ...c,
          farmerName:  c.profiles?.full_name || 'Farmer Account',
          farmerEmail: c.profiles?.email || '',
        }));
        setCrops(formatted);
      }
    } catch (e) {
      console.error('Error loading admin crops:', e);
      setError('Failed to fetch crop listings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadCrops(); }, [loadCrops]);

  // ── Stats ────────────────────────────────────────────────
  const totalCrops    = crops.length;
  const activeCrops   = crops.filter(c => c.status === 'active' && Number(c.quantity) > 0).length;
  const oosCrops      = crops.filter(c => c.status === 'paused' || Number(c.quantity) <= 0).length;
  const totalValuation = crops.reduce((sum, c) => sum + (Number(c.price) * Number(c.quantity)), 0);

  // ── Filters ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = crops;
    if (categoryFilter !== 'all') {
      list = list.filter(c => c.category.toLowerCase() === categoryFilter.toLowerCase());
    }
    if (statusFilter !== 'all') {
      list = list.filter(c => {
        if (statusFilter === 'active') return c.status === 'active' && Number(c.quantity) > 0;
        if (statusFilter === 'paused') return c.status === 'paused';
        if (statusFilter === 'out_of_stock') return Number(c.quantity) <= 0;
        return true;
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.farmerName.toLowerCase().includes(q) ||
        (c.location && c.location.toLowerCase().includes(q))
      );
    }
    return list;
  }, [crops, categoryFilter, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated  = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const showToast = type => { setToast(type); setTimeout(() => setToast(null), 4000); };

  // ── Actions ──────────────────────────────────────────────
  const handleToggleStatus = async (crop) => {
    try {
      const nextStatus = crop.status === 'paused' ? 'active' : 'paused';
      const { error: err } = await supabase
        .from('crops')
        .update({ status: nextStatus })
        .eq('id', crop.id);

      if (err) throw err;
      setCrops(prev => prev.map(c => c.id === crop.id ? { ...c, status: nextStatus } : c));
      showToast(nextStatus === 'paused' ? 'paused' : 'activated');
    } catch (e) {
      alert('Failed to update crop status: ' + e.message);
    }
  };

  const handleDeleteCrop = async (cropId) => {
    try {
      const { error: err } = await supabase
        .from('crops')
        .delete()
        .eq('id', cropId);

      if (err) throw err;
      setCrops(prev => prev.filter(c => c.id !== cropId));
      showToast('deleted');
    } catch (e) {
      alert('Failed to delete crop: ' + e.message);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Crop Name', 'Category', 'Price', 'Unit', 'Quantity', 'Farmer', 'Location', 'Status'];
    const rows = crops.map(c => [c.name, c.category, c.price, c.unit, c.quantity, c.farmerName, c.location || '', c.status]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'crop_listings_export.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminDashboardLayout>
      <div className="fm-page">
        <Toast toast={toast} onClose={() => setToast(null)} />

        {/* Header */}
        <div className="fm-header">
          <div>
            <h1 className="fm-page-title">Crop Listings Management</h1>
            <p className="fm-page-subtitle">Monitor and manage all crop listings posted by farmers across AgriLink</p>
          </div>
          <button className="fm-btn fm-btn-export" onClick={handleExportCSV}>
            <Download size={14} /> Export CSV
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#ffebee', color: '#c62828', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>
            <span style={{ flex: 1 }}>{error}</span>
            <button onClick={loadCrops} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#c62828', fontWeight: 700 }}>
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="vr-stats-row">
          <StatCard label="Total Crops Listed"  value={totalCrops}                     color="#1e5c3b" icon={Sprout}        sub="Marketplace wide" />
          <StatCard label="Active Listings"     value={activeCrops}                    color="#2e7d32" icon={CheckCircle}   sub="In stock & available" />
          <StatCard label="Paused / OOS"        value={oosCrops}                       color="#e65100" icon={AlertCircle}   sub="Requires attention" />
          <StatCard label="Total Stock Value"   value={`₵${totalValuation.toLocaleString()}`} color="#1565c0" icon={DollarSign} sub="Combined inventory" />
        </div>

        {/* Toolbar */}
        <div className="fm-toolbar">
          <div className="fm-toolbar-left" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div className="fm-search-wrap">
              <Search size={15} className="fm-search-icon" />
              <input
                className="fm-search-input"
                type="text"
                placeholder="Search crop, category, farmer, location…"
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              />
              {search && (
                <button className="fm-search-clear" onClick={() => setSearch('')}><X size={13} /></button>
              )}
            </div>

            <select
              className="fm-input"
              style={{ width: '160px', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
              value={categoryFilter}
              onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">All Categories</option>
              {cropCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="fm-toolbar-right">
            <div className="fm-filter-tabs">
              {[
                { id: 'all', label: 'All' },
                { id: 'active', label: 'Active' },
                { id: 'paused', label: 'Paused' },
                { id: 'out_of_stock', label: 'Out of Stock' },
              ].map(tab => (
                <button
                  key={tab.id}
                  className={`fm-filter-tab ${statusFilter === tab.id ? 'active' : ''}`}
                  onClick={() => { setStatusFilter(tab.id); setCurrentPage(1); }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table / Loading */}
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '0.75rem', color: '#777' }}>
            <Loader size={22} style={{ animation: 'spin 1s linear infinite' }} />
            <span>Loading crop listings...</span>
          </div>
        ) : (
          <div className="fm-table-wrap">
            <table className="fm-table">
              <thead>
                <tr>
                  <th>Crop</th>
                  <th>Category</th>
                  <th>Farmer</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th className="fm-th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(crop => {
                  const imgSrc = crop.image_url || FALLBACK_IMAGES[crop.category] || FALLBACK_IMAGES.Vegetables;
                  const isPaused = crop.status === 'paused';
                  return (
                    <tr key={crop.id}>
                      <td>
                        <div className="fm-td-farmer">
                          <div style={{ width: 42, height: 42, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#f0f4f2' }}>
                            <img src={imgSrc} alt={crop.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <div className="fm-td-farmer-info">
                            <div className="fm-td-farmer-name">{crop.name}</div>
                            <div className="fm-td-farmer-email">Unit: {crop.unit}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="bm-cat-chip">{crop.category}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#222' }}>{crop.farmerName}</div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#2e7d32' }}>₵{crop.price}</span>
                        <span style={{ fontSize: '0.75rem', color: '#888' }}> /{crop.unit}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: Number(crop.quantity) <= 0 ? '#c62828' : '#333' }}>
                          {crop.quantity} {crop.unit}s
                        </span>
                      </td>
                      <td>
                        <div className="vr-location-cell"><MapPin size={12} color="#aaa" />{crop.location || 'N/A'}</div>
                      </td>
                      <td>
                        <StatusBadge status={crop.status} quantity={crop.quantity} />
                      </td>
                      <td className="fm-td-actions">
                        <div className="fm-actions" style={{ justifyContent: 'flex-end' }}>
                          <button type="button" className="fm-action" title="View Details" onClick={() => setDetailCrop(crop)}>
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            className="fm-action"
                            title={isPaused ? 'Activate Listing' : 'Pause Listing'}
                            onClick={() => handleToggleStatus(crop)}
                          >
                            {isPaused ? <PlayCircle size={15} color="#2e7d32" /> : <PauseCircle size={15} color="#e65100" />}
                          </button>
                          <button
                            type="button"
                            className="fm-action fm-action-danger"
                            title="Delete Crop"
                            onClick={() => setDeleteCrop(crop)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={8} className="fm-empty-row">
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: '#ccc', padding: '2rem 0' }}>
                        <Sprout size={40} />
                        <span>No crop listings found</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && (
          <div className="fm-pagination">
            <div className="fm-pagination-info">
              Showing {filtered.length === 0 ? 0 : (currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filtered.length)} of {filtered.length} crops
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
        <CropDetailModal
          crop={detailCrop}
          open={!!detailCrop}
          onClose={() => setDetailCrop(null)}
          onToggleStatus={handleToggleStatus}
          onDelete={c => setDeleteCrop(c)}
        />
        <DeleteModal
          crop={deleteCrop}
          open={!!deleteCrop}
          onClose={() => setDeleteCrop(null)}
          onConfirm={handleDeleteCrop}
        />
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </AdminDashboardLayout>
  );
}
