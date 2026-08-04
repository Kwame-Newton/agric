import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, X, Eye, Download, ChevronLeft, ChevronRight,
  Package, Clock, CheckCircle2, XCircle, RefreshCw,
  User, Truck, DollarSign, Phone, MapPin, Calendar,
  Sprout, ShoppingBag, Check, TrendingUp, ShieldCheck
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { AdminDashboardLayout } from './AdminDashboardPage';
import './AdminOrders.css';

/* ──────────────────────────────────────────────────────────
   Status Badge Component
────────────────────────────────────────────────────────── */
function OrderStatusBadge({ status }) {
  const norm = (status || 'pending').toLowerCase();
  const map = {
    pending:    { label: 'Pending',    cls: 'ao-status ao-status-pending',    icon: Clock },
    processing: { label: 'Processing', cls: 'ao-status ao-status-processing', icon: RefreshCw },
    delivered:  { label: 'Delivered',  cls: 'ao-status ao-status-delivered',  icon: CheckCircle2 },
    cancelled:  { label: 'Cancelled',  cls: 'ao-status ao-status-cancelled',  icon: XCircle },
  };
  const cfg = map[norm] || { label: status, cls: 'ao-status ao-status-pending', icon: Clock };
  const Icon = cfg.icon;

  return (
    <span className={cfg.cls}>
      <Icon size={13} className={norm === 'processing' ? 'ao-spin' : ''} />
      {cfg.label}
    </span>
  );
}

/* ──────────────────────────────────────────────────────────
   Order Detail Modal
────────────────────────────────────────────────────────── */
function OrderDetailModal({ order, open, onClose, onUpdateStatus }) {
  if (!order || !open) return null;

  const currentStatus = (order.status || 'pending').toLowerCase();
  const steps = ['pending', 'processing', 'delivered'];
  const isCancelled = currentStatus === 'cancelled';

  return (
    <div className="ao-modal-overlay" onClick={onClose}>
      <div className="ao-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="ao-modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="ao-modal-order-tag">{order.order_number}</span>
              <h3 className="ao-modal-title">Order Overview</h3>
            </div>
            <div className="ao-modal-date">
              Placed on {new Date(order.created_at).toLocaleString()}
            </div>
          </div>
          <button className="ao-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="ao-modal-body">

          {/* Timeline or Cancelled */}
          {!isCancelled ? (
            <div className="ao-timeline-card">
              <div className="ao-timeline-label">Fulfillment Progress</div>
              <div className="ao-timeline-steps">
                {steps.map((step, idx) => {
                  const stepIndex = steps.indexOf(currentStatus);
                  const isDone = stepIndex >= idx;
                  const isCurrent = step === currentStatus;

                  return (
                    <div key={step} className="ao-timeline-step">
                      <div className={`ao-timeline-dot ${isDone ? (isCurrent ? 'current' : 'done') : 'pending'}`}>
                        {isDone ? <Check size={16} /> : idx + 1}
                      </div>
                      <div className={`ao-timeline-step-label ${isDone ? 'done' : 'pending'}`}>
                        {step}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="ao-cancelled-banner">
              <XCircle size={20} />
              This order has been cancelled.
            </div>
          )}

          {/* Update Status Bar */}
          <div className="ao-status-bar">
            <div className="ao-status-bar-info">
              <ShieldCheck size={20} color="#1e5c3b" />
              <div>
                <div className="ao-status-bar-title">Update Order Status</div>
                <div className="ao-status-bar-sub">Changes update instantly in real-time.</div>
              </div>
            </div>
            <select
              className="ao-status-select"
              value={currentStatus}
              onChange={(e) => onUpdateStatus(order.id, e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Info Grid */}
          <div className="ao-info-grid">
            {/* Buyer */}
            <div className="ao-info-card">
              <div className="ao-info-card-title">
                <User size={17} /> Buyer Details
              </div>
              <div className="ao-info-row">
                <span className="ao-info-label">Name:</span>
                <span className="ao-info-value">{order.buyer_name || 'Customer'}</span>
              </div>
              <div className="ao-info-row">
                <span className="ao-info-label">Email:</span>
                <span className="ao-info-value">{order.buyer_email || 'N/A'}</span>
              </div>
              <div className="ao-info-row">
                <span className="ao-info-label">Phone:</span>
                <span className="ao-info-value">{order.phone || 'N/A'}</span>
              </div>
              <div className="ao-info-row">
                <span className="ao-info-label">Address:</span>
                <span className="ao-info-value">{order.delivery_address || 'N/A'}</span>
              </div>
            </div>

            {/* Supplier */}
            <div className="ao-info-card">
              <div className="ao-info-card-title">
                <Sprout size={17} /> Supplier &amp; Payment
              </div>
              <div className="ao-info-row">
                <span className="ao-info-label">Farmer:</span>
                <span className="ao-info-value">{order.farmer_name || 'AgriLink Partner'}</span>
              </div>
              <div className="ao-info-row">
                <span className="ao-info-label">Method:</span>
                <span className="ao-info-value">{order.payment_method || 'Mobile Money'}</span>
              </div>
              <div className="ao-info-row">
                <span className="ao-info-label">Status:</span>
                <span className="ao-info-value">
                  <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '6px', fontWeight: 800, fontSize: '0.76rem' }}>
                    {order.payment_status || 'Paid'}
                  </span>
                </span>
              </div>
              <div className="ao-info-row">
                <span className="ao-info-label">Total:</span>
                <span className="ao-info-value" style={{ color: '#15803d', fontSize: '1.05rem', fontWeight: 900 }}>
                  GH₵ {Number(order.total_amount).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="ao-items-card">
            <div className="ao-items-header">
              <ShoppingBag size={15} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
              Order Items ({order.items?.length || 0})
            </div>
            <div className="ao-items-list">
              {(order.items || []).map((item, i) => (
                <div key={i} className="ao-item-row">
                  <div className="ao-item-left">
                    <img
                      src={item.image || item.image_url || 'https://images.unsplash.com/photo-1592921870789-04563d55041c?auto=format&fit=crop&w=150&q=70'}
                      alt={item.name}
                      className="ao-item-img"
                    />
                    <div>
                      <div className="ao-item-name">{item.name}</div>
                      <div className="ao-item-category">{item.category || item.farm || 'Produce'}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="ao-item-qty">
                      {item.qty || item.quantity || 1} {item.unit || 'kg'}
                    </div>
                    <div className="ao-item-price">
                      GH₵ {(item.price * (item.qty || item.quantity || 1)).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="ao-modal-footer">
          <button className="ao-close-btn" onClick={onClose}>
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Loading Skeleton Row
────────────────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr className="ao-skeleton-row">
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i}>
          <div className="ao-skeleton-bar" style={{ width: i === 0 ? '100px' : i === 7 ? '80px' : `${60 + Math.random() * 60}px` }} />
        </td>
      ))}
    </tr>
  );
}

/* ──────────────────────────────────────────────────────────
   Main Admin Orders Page
────────────────────────────────────────────────────────── */
export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) {
        console.warn('Orders fetch error:', error?.message);
        setOrders([]);
      } else {
        const formatted = data.map(o => ({
          id: o.id,
          order_number: o.order_number || `ORD-${o.id.slice(0, 6).toUpperCase()}`,
          buyer_id: o.buyer_id,
          farmer_id: o.farmer_id,
          buyer_name: o.buyer_name || o.phone || 'Marketplace Buyer',
          buyer_email: o.buyer_email || '',
          phone: o.phone || '',
          delivery_address: o.delivery_address || '',
          farmer_name: o.farmer_name || 'AgriLink Farmer',
          items: Array.isArray(o.items) ? o.items : [],
          total_amount: Number(o.total_amount) || 0,
          payment_method: o.payment_method || 'Mobile Money',
          payment_status: 'Paid',
          status: (o.status || 'pending').toLowerCase(),
          created_at: o.created_at,
        }));
        setOrders(formatted);
      }
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    const norm = newStatus.toLowerCase();
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: norm } : o));
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => ({ ...prev, status: norm }));
    }

    try {
      await supabase
        .from('orders')
        .update({ status: norm })
        .eq('id', orderId);
    } catch {
      // Optimistic local state kept
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesStatus = statusFilter === 'all' ? true : o.status === statusFilter;
      if (!matchesStatus) return false;

      if (!query.trim()) return true;
      const q = query.toLowerCase();
      const hay = `${o.order_number} ${o.buyer_name} ${o.farmer_name} ${o.phone}`.toLowerCase();
      return hay.includes(q);
    });
  }, [orders, statusFilter, query]);

  const stats = useMemo(() => {
    const total = orders.length;
    const totalRev = orders.reduce((acc, o) => acc + (o.total_amount || 0), 0);
    const pending = orders.filter(o => o.status === 'pending').length;
    const processing = orders.filter(o => o.status === 'processing').length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;

    return { total, totalRev, pending, processing, delivered, cancelled };
  }, [orders]);

  const totalPages = Math.ceil(filteredOrders.length / PER_PAGE) || 1;
  const pagedOrders = filteredOrders.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const exportCSV = () => {
    const headers = ['Order Number', 'Buyer', 'Phone', 'Farmer', 'Total Amount (GHc)', 'Status', 'Date'];
    const rows = filteredOrders.map(o => [
      o.order_number,
      `"${o.buyer_name}"`,
      `"${o.phone}"`,
      `"${o.farmer_name}"`,
      o.total_amount,
      o.status,
      new Date(o.created_at).toLocaleDateString()
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `agrilink_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminDashboardLayout>
      <div className="ao-page">

        {/* ── Hero Banner ────────────────────────────────────── */}
        <div className="ao-hero">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="ao-hero-tag">
              <ShieldCheck size={14} /> Control Center
            </div>
            <h1>Order Management</h1>
            <p>Monitor platform-wide crop orders, dispatch progress, and revenue fulfillment.</p>
          </div>

          <div className="ao-hero-actions">
            <button className="ao-btn-ghost" onClick={fetchOrders}>
              <RefreshCw size={15} className={loading ? 'ao-spin' : ''} /> Refresh
            </button>
            <button className="ao-btn-solid" onClick={exportCSV}>
              <Download size={15} /> Export CSV
            </button>
          </div>
        </div>

        {/* ── Stat Cards ─────────────────────────────────────── */}
        <div className="ao-stats-grid">
          <div className="ao-stat-card">
            <div>
              <div className="ao-stat-label">Total Platform Revenue</div>
              <div className="ao-stat-value">GH₵ {stats.totalRev.toLocaleString()}</div>
              <div className="ao-stat-sub">{stats.total} total orders placed</div>
            </div>
            <div className="ao-stat-icon" style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
              <TrendingUp size={21} />
            </div>
          </div>
          <div className="ao-stat-card">
            <div>
              <div className="ao-stat-label">Pending Orders</div>
              <div className="ao-stat-value">{stats.pending}</div>
              <div className="ao-stat-sub">Needs farmer response</div>
            </div>
            <div className="ao-stat-icon" style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)' }}>
              <Clock size={21} />
            </div>
          </div>
          <div className="ao-stat-card">
            <div>
              <div className="ao-stat-label">In Processing / Transit</div>
              <div className="ao-stat-value">{stats.processing}</div>
              <div className="ao-stat-sub">Fulfillment in progress</div>
            </div>
            <div className="ao-stat-icon" style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
              <Truck size={21} />
            </div>
          </div>
          <div className="ao-stat-card">
            <div>
              <div className="ao-stat-label">Completed Deliveries</div>
              <div className="ao-stat-value">{stats.delivered}</div>
              <div className="ao-stat-sub">Delivered to buyer</div>
            </div>
            <div className="ao-stat-icon" style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}>
              <CheckCircle2 size={21} />
            </div>
          </div>
        </div>

        {/* ── Filter Controls ────────────────────────────────── */}
        <div className="ao-filter-bar">
          <div className="ao-tabs">
            {[
              { val: 'all', label: `All (${stats.total})` },
              { val: 'pending', label: `Pending (${stats.pending})` },
              { val: 'processing', label: `Processing (${stats.processing})` },
              { val: 'delivered', label: `Delivered (${stats.delivered})` },
              { val: 'cancelled', label: `Cancelled (${stats.cancelled})` },
            ].map(tab => (
              <button
                key={tab.val}
                className={`ao-tab ${statusFilter === tab.val ? 'active' : ''}`}
                onClick={() => { setStatusFilter(tab.val); setPage(1); }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="ao-search-wrap">
            <Search size={16} className="ao-search-icon" />
            <input
              type="text"
              className="ao-search-input"
              placeholder="Search by order #, buyer, phone, farmer..."
              value={query}
              onChange={e => { setQuery(e.target.value); setPage(1); }}
            />
            {query && (
              <button className="ao-search-clear" onClick={() => setQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* ── Orders Table ───────────────────────────────────── */}
        <div className="ao-table-card">
          <table className="ao-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Buyer</th>
                <th>Farmer / Supplier</th>
                <th>Items</th>
                <th>Total (GH₵)</th>
                <th>Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
              ) : pagedOrders.length > 0 ? (
                pagedOrders.map(o => (
                  <tr key={o.id}>
                    <td>
                      <span className="ao-order-num">{o.order_number}</span>
                    </td>
                    <td>
                      <div className="ao-buyer-name">{o.buyer_name}</div>
                      <div className="ao-buyer-sub">{o.phone || o.buyer_email || '—'}</div>
                    </td>
                    <td style={{ color: '#374151', fontWeight: 600 }}>
                      {o.farmer_name}
                    </td>
                    <td>
                      <span className="ao-items-badge">
                        <Package size={12} />
                        {o.items?.length || 1} item(s)
                      </span>
                    </td>
                    <td>
                      <span className="ao-amount">GH₵ {o.total_amount.toFixed(2)}</span>
                    </td>
                    <td>
                      <span className="ao-date">
                        {new Date(o.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td>
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="ao-actions">
                        <select
                          className="ao-select"
                          value={o.status}
                          onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <button
                          className="ao-view-btn"
                          onClick={() => { setSelectedOrder(o); setModalOpen(true); }}
                        >
                          <Eye size={14} /> View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8}>
                    <div className="ao-empty">
                      <Package size={42} className="ao-empty-icon" />
                      <div className="ao-empty-title">No Orders Found</div>
                      <p className="ao-empty-sub">
                        {orders.length === 0
                          ? 'No orders have been placed yet. Orders will appear here once buyers start purchasing.'
                          : 'No orders match your current filters. Try adjusting the search or status filter.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="ao-pagination">
              <span className="ao-page-info">
                Page {page} of {totalPages} · {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
              </span>
              <div className="ao-page-btns">
                <button
                  className="ao-page-btn"
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={14} style={{ verticalAlign: 'middle', marginRight: '2px' }} /> Prev
                </button>
                <button
                  className="ao-page-btn"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  Next <ChevronRight size={14} style={{ verticalAlign: 'middle', marginLeft: '2px' }} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Order Detail Modal ─────────────────────────────── */}
        <OrderDetailModal
          order={selectedOrder}
          open={modalOpen}
          onClose={() => { setModalOpen(false); setSelectedOrder(null); }}
          onUpdateStatus={handleUpdateStatus}
        />
      </div>
    </AdminDashboardLayout>
  );
}
