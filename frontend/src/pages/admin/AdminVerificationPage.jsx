import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Search, X, CheckCircle, AlertTriangle, Eye, Clock,
  MapPin, Mail, Phone, Calendar, FileText, Sprout,
  ChevronLeft, ChevronRight, Download, RefreshCw,
  Shield, ShieldCheck, ShieldX, Filter,
} from 'lucide-react';
import { AdminDashboardLayout } from './AdminDashboardPage';
import { fetchAdminContactMessages, fetchAllVerificationRequests } from '../../services/chatService';
import { supabase } from '../../supabaseClient';
import './admin.css';

/* ──────────────────────────────────────────────────────────
   Mock Data – mirrors the shape of the real API response
────────────────────────────────────────────────────────── */
const MOCK_REQUESTS = [
  {
    id: 'VR-001',
    farmerName: 'Yaw Boateng',
    email: 'yaw.boateng@yahoo.com',
    phone: '+233 54 321 0987',
    farmName: 'Boateng Agro Farm',
    location: 'Mampong, Ashanti',
    dateSubmitted: '2024-04-10',
    status: 'pending',
    cropSpecialty: 'Peppers & Tomatoes',
    farmSize: '3 acres',
    farmDescription: 'New farmer looking to expand into commercial vegetable production.',
    documents: [
      { name: 'National ID Card', type: 'id', submitted: true },
      { name: 'Land Title / Lease Agreement', type: 'land', submitted: true },
      { name: 'Farm Photo', type: 'photo', submitted: false },
    ],
    notes: '',
  },
  {
    id: 'VR-002',
    farmerName: 'Akua Gyamfi',
    email: 'akua.gyamfi@yahoo.com',
    phone: '+233 50 111 2222',
    farmName: 'Gyamfi Fresh Produce',
    location: 'Sunyani, Bono',
    dateSubmitted: '2024-04-12',
    status: 'pending',
    cropSpecialty: 'Mixed Vegetables',
    farmSize: '1.5 acres',
    farmDescription: 'Starting a small-scale vegetable farm focused on supplying local restaurants.',
    documents: [
      { name: 'National ID Card', type: 'id', submitted: true },
      { name: 'Land Title / Lease Agreement', type: 'land', submitted: true },
      { name: 'Farm Photo', type: 'photo', submitted: true },
    ],
    notes: '',
  },
  {
    id: 'VR-003',
    farmerName: 'Kwabena Asiedu',
    email: 'k.asiedu@farmlink.gh',
    phone: '+233 24 777 3311',
    farmName: 'Asiedu Heritage Farm',
    location: 'Koforidua, Eastern',
    dateSubmitted: '2024-04-08',
    status: 'approved',
    cropSpecialty: 'Cocoa & Cassava',
    farmSize: '8 acres',
    farmDescription: 'Third-generation cocoa farmer modernizing production with precision agriculture.',
    documents: [
      { name: 'National ID Card', type: 'id', submitted: true },
      { name: 'Land Title / Lease Agreement', type: 'land', submitted: true },
      { name: 'Farm Photo', type: 'photo', submitted: true },
    ],
    notes: 'All documents verified. Land title confirmed with Lands Commission.',
  },
  {
    id: 'VR-004',
    farmerName: 'Abena Frimpong',
    email: 'abena.f@gmail.com',
    phone: '+233 20 444 5566',
    farmName: 'Frimpong Organics',
    location: 'Kumasi, Ashanti',
    dateSubmitted: '2024-04-05',
    status: 'rejected',
    cropSpecialty: 'Leafy Greens',
    farmSize: '0.5 acres',
    farmDescription: 'Urban rooftop farming focused on organic leafy vegetables.',
    documents: [
      { name: 'National ID Card', type: 'id', submitted: true },
      { name: 'Land Title / Lease Agreement', type: 'land', submitted: false },
      { name: 'Farm Photo', type: 'photo', submitted: true },
    ],
    notes: 'Land title not submitted. Rooftop lease agreement does not qualify for AgriLink marketplace.',
  },
  {
    id: 'VR-005',
    farmerName: 'Nana Ama Ofori',
    email: 'nanaama@ofori.farm',
    phone: '+233 27 888 0099',
    farmName: 'Ofori Valley Farms',
    location: 'Techiman, Bono East',
    dateSubmitted: '2024-04-14',
    status: 'pending',
    cropSpecialty: 'Yam & Plantain',
    farmSize: '5 acres',
    farmDescription: 'Family-operated farm supplying yam and plantain to Techiman central market.',
    documents: [
      { name: 'National ID Card', type: 'id', submitted: true },
      { name: 'Land Title / Lease Agreement', type: 'land', submitted: false },
      { name: 'Farm Photo', type: 'photo', submitted: true },
    ],
    notes: '',
  },
  {
    id: 'VR-006',
    farmerName: 'Kofi Dankwah',
    email: 'dankwah.k@farms.com',
    phone: '+233 55 123 9988',
    farmName: 'Dankwah Agribiz',
    location: 'Tamale, Northern',
    dateSubmitted: '2024-04-15',
    status: 'pending',
    cropSpecialty: 'Maize & Groundnuts',
    farmSize: '12 acres',
    farmDescription: 'Large-scale grain production serving northern Ghana markets.',
    documents: [
      { name: 'National ID Card', type: 'id', submitted: true },
      { name: 'Land Title / Lease Agreement', type: 'land', submitted: true },
      { name: 'Farm Photo', type: 'photo', submitted: true },
    ],
    notes: '',
  },
];

/* ──────────────────────────────────────────────────────────
   Helper: get initials
────────────────────────────────────────────────────────── */
function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

/* ──────────────────────────────────────────────────────────
   Status Badge
────────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    pending:  { label: 'Pending Review', cls: 'vr-badge-pending',  icon: Clock },
    approved: { label: 'Approved',       cls: 'vr-badge-approved', icon: ShieldCheck },
    rejected: { label: 'Rejected',       cls: 'vr-badge-rejected', icon: ShieldX },
  };
  const c = map[status] || map.pending;
  const Icon = c.icon;
  return (
    <span className={`vr-badge ${c.cls}`}>
      <Icon size={11} />
      {c.label}
    </span>
  );
}

/* ──────────────────────────────────────────────────────────
   Document checklist item
────────────────────────────────────────────────────────── */
function DocItem({ doc }) {
  return (
    <div className={`vr-doc-item ${doc.submitted ? 'submitted' : 'missing'}`}>
      <FileText size={14} />
      <span>{doc.name}</span>
      <span className="vr-doc-status">{doc.submitted ? '✓ Submitted' : '✗ Missing'}</span>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Stat Card
────────────────────────────────────────────────────────── */
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

/* ──────────────────────────────────────────────────────────
   Toast
────────────────────────────────────────────────────────── */
function Toast({ toast, onClose }) {
  if (!toast) return null;
  const map = {
    approved: { icon: '✅', msg: 'Farmer approved. Confirmation email sent.' },
    rejected: { icon: '❌', msg: 'Verification rejected. Farmer notified.' },
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
   Approve Modal
────────────────────────────────────────────────────────── */
function ApproveModal({ req, open, onClose, onConfirm }) {
  if (!req || !open) return null;
  return (
    <div className="fm-modal-overlay" onClick={onClose}>
      <div className="fm-modal" onClick={e => e.stopPropagation()}>
        <div className="fm-modal-verify" style={{ maxWidth: 440 }}>
          <div className="fm-modal-verify-icon"><ShieldCheck size={52} color="#2e7d32" /></div>
          <h3>Approve {req.farmerName}?</h3>
          <p>
            Their farm <strong>{req.farmName}</strong> will be verified and their crops
            will appear on the AgriLink marketplace. A confirmation email will be sent.
          </p>
          <div className="fm-modal-actions">
            <button className="fm-btn fm-btn-cancel" onClick={onClose}>Cancel</button>
            <button className="fm-btn fm-btn-approve" onClick={() => { onConfirm(req.id); onClose(); }}>
              <ShieldCheck size={14} /> Approve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Reject Modal
────────────────────────────────────────────────────────── */
function RejectModal({ req, open, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  if (!req || !open) return null;
  return (
    <div className="fm-modal-overlay" onClick={onClose}>
      <div className="fm-modal" onClick={e => e.stopPropagation()}>
        <div className="fm-modal-reject" style={{ textAlign: 'left', maxWidth: 460 }}>
          <h3 style={{ marginBottom: '0.25rem' }}>Reject Verification Request</h3>
          <p className="fm-modal-reject-name" style={{ marginBottom: '1rem', color: '#555' }}>
            {req.farmerName} — {req.farmName}
          </p>
          <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#444', display: 'block', marginBottom: '0.4rem' }}>
            Reason for rejection <span style={{ color: '#c62828' }}>*</span>
          </label>
          <textarea
            className="fm-textarea"
            rows={4}
            placeholder="Explain why this request is rejected (will be emailed to farmer)…"
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
          <div className="fm-modal-actions" style={{ justifyContent: 'flex-end' }}>
            <button className="fm-btn fm-btn-cancel" onClick={() => { onClose(); setReason(''); }}>Cancel</button>
            <button
              className="fm-btn fm-btn-reject"
              disabled={!reason.trim()}
              onClick={() => { onConfirm(req.id, reason); onClose(); setReason(''); }}
            >
              <ShieldX size={14} /> Reject & Notify
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Detail Drawer / Modal
────────────────────────────────────────────────────────── */
function RequestDetailModal({ req, open, onClose, onApprove, onReject }) {
  if (!req || !open) return null;
  const allDocs = req.documents.every(d => d.submitted);

  return (
    <div className="fm-modal-overlay" onClick={onClose}>
      <div className="fm-modal fm-modal-detail" onClick={e => e.stopPropagation()} style={{ maxWidth: 780 }}>
        <div className="vr-detail-layout">
          {/* Left */}
          <div className="vr-detail-left">
            <div className="vr-detail-avatar">
              <div className="fm-avatar" style={{ width: 68, height: 68, fontSize: 26 }}>
                {getInitials(req.farmerName)}
              </div>
            </div>
            <h2 className="vr-detail-name">{req.farmerName}</h2>
            <StatusBadge status={req.status} />

            <div className="vr-detail-meta">
              <div className="fm-detail-info-item"><Mail size={13} className="fm-detail-info-icon" /><span>{req.email}</span></div>
              <div className="fm-detail-info-item"><Phone size={13} className="fm-detail-info-icon" /><span>{req.phone}</span></div>
              <div className="fm-detail-info-item"><MapPin size={13} className="fm-detail-info-icon" /><span>{req.location}</span></div>
              <div className="fm-detail-info-item"><Calendar size={13} className="fm-detail-info-icon" /><span>Submitted {new Date(req.dateSubmitted).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></div>
            </div>

            <div className="vr-detail-id">
              <span>Request ID</span>
              <code>{req.id}</code>
            </div>
          </div>

          {/* Right */}
          <div className="vr-detail-right">
            <button className="vr-close-btn" onClick={onClose}><X size={18} /></button>

            <h3 className="vr-section-title">Farm Information</h3>
            <div className="vr-info-grid">
              <div className="vr-info-block"><label>Farm Name</label><span>{req.farmName}</span></div>
              <div className="vr-info-block"><label>Farm Size</label><span>{req.farmSize}</span></div>
              <div className="vr-info-block"><label>Crop Specialty</label><span>{req.cropSpecialty}</span></div>
              <div className="vr-info-block" style={{ gridColumn: '1/-1' }}><label>Description</label><span>{req.farmDescription}</span></div>
            </div>

            <h3 className="vr-section-title" style={{ marginTop: '1.5rem' }}>
              Submitted Documents
              {!allDocs && <span className="vr-doc-warning"><AlertTriangle size={13} /> Documents incomplete</span>}
            </h3>
            <div className="vr-doc-list">
              {req.documents.map((doc, i) => <DocItem key={i} doc={doc} />)}
            </div>

            {req.notes && (
              <>
                <h3 className="vr-section-title" style={{ marginTop: '1.25rem' }}>Admin Notes</h3>
                <div className="vr-notes-box">{req.notes}</div>
              </>
            )}

            {req.status === 'pending' && (
              <div className="vr-detail-actions">
                <button className="fm-btn fm-btn-reject" onClick={() => { onClose(); onReject(req); }}>
                  <ShieldX size={14} /> Reject
                </button>
                <button
                  className="fm-btn fm-btn-approve"
                  onClick={() => { onClose(); onApprove(req); }}
                  style={!allDocs ? { opacity: 0.55, cursor: 'not-allowed' } : {}}
                  title={!allDocs ? 'All documents must be submitted before approval' : ''}
                >
                  <ShieldCheck size={14} /> Approve
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Main Page
────────────────────────────────────────────────────────── */
export default function AdminVerificationPage() {
  const [requests, setRequests] = useState(MOCK_REQUESTS);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState(null);
  const [detailReq, setDetailReq] = useState(null);
  const [approveReq, setApproveReq] = useState(null);
  const [rejectReq, setRejectReq] = useState(null);
  const perPage = 8;

  const loadRequests = useCallback(async () => {
    try {
      const liveReqs = await fetchAllVerificationRequests();
      if (liveReqs && liveReqs.length > 0) {
        setRequests(liveReqs);
      }
    } catch (e) {
      console.warn('Error loading live verification requests:', e);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  /* Stats */
  const totalPending  = requests.filter(r => r.status === 'pending').length;
  const totalApproved = requests.filter(r => r.status === 'approved').length;
  const totalRejected = requests.filter(r => r.status === 'rejected').length;
  const avgDays       = 2;

  /* Filter */
  const filtered = useMemo(() => {
    let list = requests;
    if (filterStatus !== 'all') list = list.filter(r => r.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.farmerName.toLowerCase().includes(q) ||
        r.farmName.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [requests, filterStatus, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated  = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const showToast = type => { setToast(type); setTimeout(() => setToast(null), 4000); };

  const handleApprove = (id) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved', notes: 'Verified by admin.' } : r));
    showToast('approved');
  };

  const handleReject = (id, reason) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected', notes: reason } : r));
    showToast('rejected');
  };

  return (
    <AdminDashboardLayout>
      <div className="fm-page">
        <Toast toast={toast} onClose={() => setToast(null)} />

        {/* Header */}
        <div className="fm-header">
          <div>
            <h1 className="fm-page-title">Verification Requests</h1>
            <p className="fm-page-subtitle">Review and action farmer verification applications</p>
          </div>
          <button className="fm-btn fm-btn-export" onClick={() => window.location.reload()}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="vr-stats-row">
          <StatCard label="Pending Review"    value={totalPending}  color="#f57f17" icon={Clock}       sub="Requires action" />
          <StatCard label="Approved"          value={totalApproved} color="#2e7d32" icon={ShieldCheck} sub="This month" />
          <StatCard label="Rejected"          value={totalRejected} color="#c62828" icon={ShieldX}     sub="This month" />
          <StatCard label="Avg. Review Time"  value={`${avgDays}d`} color="#1565c0" icon={RefreshCw}   sub="Per request" />
        </div>

        {/* Toolbar */}
        <div className="fm-toolbar">
          <div className="fm-toolbar-left">
            <div className="fm-search-wrap">
              <Search size={15} className="fm-search-icon" />
              <input
                className="fm-search-input"
                type="text"
                placeholder="Search by name, farm, location or ID…"
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
              {['all', 'pending', 'approved', 'rejected'].map(tab => (
                <button
                  key={tab}
                  className={`fm-filter-tab ${filterStatus === tab ? 'active' : ''}`}
                  onClick={() => { setFilterStatus(tab); setCurrentPage(1); }}
                >
                  {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="fm-table-wrap">
          <table className="fm-table">
            <thead>
              <tr>
                <th>Farmer</th>
                <th>Farm Name</th>
                <th>Location</th>
                <th>Submitted</th>
                <th>Documents</th>
                <th>Status</th>
                <th className="fm-th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(req => {
                const docsComplete = req.documents.every(d => d.submitted);
                const docsCount   = req.documents.filter(d => d.submitted).length;
                return (
                  <tr key={req.id}>
                    <td>
                      <div className="fm-td-farmer">
                        <div className="fm-avatar-wrap">
                          <div className="fm-avatar" style={{ width: 38, height: 38, fontSize: 14 }}>
                            {getInitials(req.farmerName)}
                          </div>
                        </div>
                        <div className="fm-td-farmer-info">
                          <div className="fm-td-farmer-name">{req.farmerName}</div>
                          <div className="fm-td-farmer-email">{req.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="vr-farm-name">{req.farmName}</span>
                      <div className="vr-farm-specialty">{req.cropSpecialty}</div>
                    </td>
                    <td>
                      <div className="vr-location-cell">
                        <MapPin size={12} color="#aaa" />
                        {req.location}
                      </div>
                    </td>
                    <td>
                      <span className="vr-date">
                        {new Date(req.dateSubmitted).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                    <td>
                      <div className={`vr-docs-pill ${docsComplete ? 'complete' : 'incomplete'}`}>
                        <FileText size={12} />
                        {docsCount}/{req.documents.length}
                        {!docsComplete && <AlertTriangle size={11} />}
                      </div>
                    </td>
                    <td><StatusBadge status={req.status} /></td>
                    <td>
                      <div className="vr-action-btns">
                        <button
                          className="vr-action-view"
                          onClick={() => setDetailReq(req)}
                          title="View details"
                        >
                          <Eye size={14} />
                        </button>
                        {req.status === 'pending' && (
                          <>
                            <button
                              className="vr-action-approve"
                              onClick={() => setApproveReq(req)}
                              title="Approve"
                            >
                              <CheckCircle size={14} />
                            </button>
                            <button
                              className="vr-action-reject"
                              onClick={() => setRejectReq(req)}
                              title="Reject"
                            >
                              <X size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={7} className="fm-empty-row">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: '#ccc' }}>
                      <Shield size={40} />
                      <span>No verification requests found</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="fm-pagination">
          <div className="fm-pagination-info">
            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filtered.length)} of {filtered.length} requests
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

        {/* Modals */}
        <RequestDetailModal
          req={detailReq}
          open={!!detailReq}
          onClose={() => setDetailReq(null)}
          onApprove={r => setApproveReq(r)}
          onReject={r => setRejectReq(r)}
        />
        <ApproveModal
          req={approveReq}
          open={!!approveReq}
          onClose={() => setApproveReq(null)}
          onConfirm={handleApprove}
        />
        <RejectModal
          req={rejectReq}
          open={!!rejectReq}
          onClose={() => setRejectReq(null)}
          onConfirm={handleReject}
        />
      </div>
    </AdminDashboardLayout>
  );
}
