import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  Search,
  Eye,
  X,
  Package,
  Truck,
  Clock,
  DollarSign,
  User,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Download,
  Filter,
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import './FarmerMyOrdersPage.css';

const statusTabs = [
  { value: 'all', label: 'All Orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

function StatusBadge({ status }) {
  const norm = (status || 'pending').toLowerCase();
  const map = {
    pending:    { label: 'Pending',    cls: 'fm-o-status fm-o-pending' },
    processing: { label: 'Processing', cls: 'fm-o-status fm-o-confirmed' },
    confirmed:  { label: 'Confirmed',  cls: 'fm-o-status fm-o-confirmed' },
    delivered:  { label: 'Delivered',  cls: 'fm-o-status fm-o-delivered' },
    cancelled:  { label: 'Cancelled',  cls: 'fm-o-status fm-o-cancelled' },
  };
  const cfg = map[norm] || { label: status, cls: 'fm-o-status fm-o-pending' };
  return <span className={cfg.cls}>{cfg.label}</span>;
}

export default function FarmerMyOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const fetchFarmerOrders = useCallback(async () => {
    setLoading(true);
    try {
      let queryBuilder = supabase.from('orders').select('*');
      if (user?.id) {
        queryBuilder = queryBuilder.eq('farmer_id', user.id);
      }
      const { data, error } = await queryBuilder.order('created_at', { ascending: false });

      if (error || !data) {
        setOrders([]);
      } else {
        const formatted = data.map(o => ({
          id: o.id,
          order_number: o.order_number || `ORD-${o.id.slice(0, 6)}`,
          buyer: {
            name: o.buyer_name || o.phone || 'Marketplace Buyer',
            email: o.buyer_email || 'N/A',
            phone: o.phone || 'N/A',
            deliveryAddress: o.delivery_address || 'N/A',
          },
          items: Array.isArray(o.items) && o.items.length > 0 ? o.items : [
            {
              name: 'Farm Produce Batch',
              category: 'Produce',
              image: 'https://images.unsplash.com/photo-1592921870789-04563d55041c?auto=format&fit=crop&w=300&q=70',
              unit: 'kg',
              quantity: 1,
              unit_price: Number(o.total_amount) || 0
            }
          ],
          totalPrice: Number(o.total_amount) || 0,
          paymentMethod: o.payment_method || 'Mobile Money',
          paymentStatus: 'Paid',
          date: o.created_at ? o.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
          status: (o.status || 'pending').toLowerCase(),
        }));
        setOrders(formatted);
      }
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFarmerOrders();
  }, [fetchFarmerOrders]);

  const selectedOrder = useMemo(() => orders.find(o => o.id === selectedOrderId) || null, [orders, selectedOrderId]);

  const stats = useMemo(() => {
    const total = orders.length;
    const totalEarnings = orders
      .filter(o => o.status === 'delivered')
      .reduce((acc, o) => acc + (o.totalPrice || 0), 0);

    return {
      total,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing' || o.status === 'confirmed').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      earnings: totalEarnings,
    };
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter(o => {
      const normStatus = o.status.toLowerCase();
      const matchesTab = tab === 'all' ? true : normStatus === tab || (tab === 'processing' && normStatus === 'confirmed');
      if (!matchesTab) return false;
      if (!q) return true;
      const firstItem = o.items[0]?.name || '';
      const hay = `${o.order_number || o.id} ${o.buyer.name} ${firstItem}`.toLowerCase();
      return hay.includes(q);
    });
  }, [orders, tab, query]);

  const openDetail = (orderId) => {
    setSelectedOrderId(orderId);
    setIsDetailOpen(true);
  };

  const closeDetail = () => {
    setIsDetailOpen(false);
    setSelectedOrderId(null);
  };

  const updateStatus = async (orderId, nextStatus) => {
    const normStatus = nextStatus.toLowerCase();
    setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: normStatus } : o)));

    try {
      await supabase
        .from('orders')
        .update({ status: normStatus })
        .eq('id', orderId);
    } catch {
      // Local state retained
    }
  };

  const exportOrdersCSV = () => {
    const headers = ['Order Number', 'Buyer Name', 'Phone', 'Delivery Address', 'Total Price (GHc)', 'Status', 'Date'];
    const rows = filtered.map(o => [
      o.order_number || o.id,
      `"${o.buyer.name}"`,
      `"${o.buyer.phone}"`,
      `"${o.buyer.deliveryAddress}"`,
      o.totalPrice,
      o.status,
      o.date
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `my_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fm-orders-page">
      {/* Header */}
      <div className="fm-orders-header">
        <div>
          <h2 className="fm-orders-title">🌾 My Crop Orders</h2>
          <div className="fm-orders-subtitle">Track customer orders, manage fulfillment statuses, and view delivery details.</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className="fm-orders-btn-subtle"
            onClick={fetchFarmerOrders}
            title="Refresh Orders"
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh
          </button>
          <button
            type="button"
            className="fm-orders-btn-subtle"
            onClick={exportOrdersCSV}
          >
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="fm-orders-stats">
        <div className="fm-orders-stat">
          <div className="fm-orders-stat-label">Total Orders</div>
          <div className="fm-orders-stat-value">{stats.total}</div>
        </div>
        <div className="fm-orders-stat">
          <div className="fm-orders-stat-label">Pending Action</div>
          <div className="fm-orders-stat-value fm-orders-stat-pending">{stats.pending}</div>
        </div>
        <div className="fm-orders-stat">
          <div className="fm-orders-stat-label">Processing / Transit</div>
          <div className="fm-orders-stat-value fm-orders-stat-confirmed">{stats.processing}</div>
        </div>
        <div className="fm-orders-stat">
          <div className="fm-orders-stat-label">Completed Deliveries</div>
          <div className="fm-orders-stat-value fm-orders-stat-delivered">{stats.delivered}</div>
        </div>
        <div className="fm-orders-stat" style={{ borderLeft: '3px solid #059669' }}>
          <div className="fm-orders-stat-label">Delivered Revenue</div>
          <div className="fm-orders-stat-value" style={{ color: '#059669' }}>GH₵ {stats.earnings.toLocaleString()}</div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="fm-orders-filters">
        <div className="fm-orders-tabs">
          {statusTabs.map(t => (
            <button
              key={t.value}
              type="button"
              className={`fm-orders-tab ${tab === t.value ? 'active' : ''}`}
              onClick={() => setTab(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="fm-orders-search">
          <Search size={16} className="fm-orders-search-icon" />
          <input
            type="text"
            className="fm-orders-search-input"
            placeholder="Search by order ID, buyer, or crop..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Orders Table */}
      {filtered.length > 0 ? (
        <div className="fm-orders-table-wrap">
          <table className="fm-orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Buyer</th>
                <th>Crop Items</th>
                <th>Total Price</th>
                <th>Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => {
                const mainItem = o.items[0] || {};
                return (
                  <tr key={o.id}>
                    <td className="fm-orders-td-strong">{o.order_number || o.id}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#111' }}>{o.buyer.name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{o.buyer.phone}</div>
                    </td>
                    <td>
                      <div className="fm-orders-crop-cell">
                        <img
                          className="fm-orders-crop-thumb"
                          src={mainItem.image || 'https://images.unsplash.com/photo-1592921870789-04563d55041c?auto=format&fit=crop&w=300&q=70'}
                          alt={mainItem.name || 'Crop'}
                        />
                        <div>
                          <div className="fm-orders-crop-name">
                            {mainItem.name || 'Produce'}
                            {o.items.length > 1 && <span style={{ fontSize: '0.75rem', color: '#059669', marginLeft: '6px' }}>+{o.items.length - 1} more</span>}
                          </div>
                          <div className="fm-orders-crop-cat">{mainItem.quantity || 1} {mainItem.unit || 'kg'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: '#1e5c3b' }}>GH₵ {o.totalPrice}</strong>
                    </td>
                    <td className="fm-orders-date">
                      <Clock size={14} /> {o.date}
                    </td>
                    <td>
                      <StatusBadge status={o.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="fm-orders-actions">
                        <select
                          className="fm-orders-status-select"
                          value={o.status}
                          onChange={(e) => updateStatus(o.id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>

                        <button type="button" className="fm-orders-action" onClick={() => openDetail(o.id)}>
                          <Eye size={16} /> View
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="fm-orders-empty">
          <div className="fm-orders-empty-emoji">📦</div>
          <h3>No matching orders found</h3>
          <p>Try adjusting your search query or status filter.</p>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailOpen && selectedOrder && (
        <div className="fm-orders-modal-overlay" onClick={closeDetail}>
          <div className="fm-orders-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fm-orders-modal-header">
              <div>
                <h3 className="fm-orders-modal-title">Order Details</h3>
                <div className="fm-orders-modal-subtitle">{selectedOrder.order_number || selectedOrder.id} • {selectedOrder.buyer.name}</div>
              </div>
              <button type="button" className="fm-orders-modal-close" onClick={closeDetail}>
                <X size={18} />
              </button>
            </div>

            <div className="fm-orders-modal-body">
              <div className="fm-orders-detail-grid">
                <div className="fm-orders-detail-card">
                  <div className="fm-orders-detail-title">Buyer Contact Info</div>
                  <div className="fm-orders-detail-row"><strong>Name:</strong> {selectedOrder.buyer.name}</div>
                  <div className="fm-orders-detail-row"><strong>Email:</strong> {selectedOrder.buyer.email}</div>
                  <div className="fm-orders-detail-row"><strong>Phone:</strong> {selectedOrder.buyer.phone}</div>
                  <div className="fm-orders-detail-row"><strong>Delivery Address:</strong> {selectedOrder.buyer.deliveryAddress}</div>
                </div>

                <div className="fm-orders-detail-card">
                  <div className="fm-orders-detail-title">Order Items ({selectedOrder.items.length})</div>
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="fm-orders-crop-big" style={{ marginBottom: i < selectedOrder.items.length - 1 ? '10px' : 0 }}>
                      <img
                        className="fm-orders-crop-big-thumb"
                        src={item.image || 'https://images.unsplash.com/photo-1592921870789-04563d55041c?auto=format&fit=crop&w=300&q=70'}
                        alt={item.name}
                      />
                      <div>
                        <div className="fm-orders-crop-big-name">{item.name}</div>
                        <div className="fm-orders-crop-big-cat">{item.category || 'Produce'}</div>
                        <div className="fm-orders-crop-big-qty">{item.quantity} {item.unit || 'kg'}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="fm-orders-detail-card">
                  <div className="fm-orders-detail-title">Payment & Financial Summary</div>
                  <div className="fm-orders-detail-row"><strong>Total Earnings:</strong> <span style={{ color: '#059669', fontWeight: 800 }}>GH₵ {selectedOrder.totalPrice}</span></div>
                  <div className="fm-orders-detail-row"><strong>Payment Method:</strong> {selectedOrder.paymentMethod}</div>
                  <div className="fm-orders-detail-row"><strong>Date Placed:</strong> {selectedOrder.date}</div>
                  <div className="fm-orders-detail-row"><strong>Status:</strong> <StatusBadge status={selectedOrder.status} /></div>
                </div>

                <div className="fm-orders-detail-card">
                  <div className="fm-orders-detail-title">Update Order Progress</div>
                  <div className="fm-orders-update-row">
                    <select
                      className="fm-orders-status-select"
                      value={selectedOrder.status}
                      onChange={(e) => updateStatus(selectedOrder.id, e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing / In Transit</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <div className="fm-orders-detail-note">
                      <Package size={14} />
                      Updating the status notifies the buyer of delivery progress.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="fm-orders-modal-footer">
              <button type="button" className="fm-orders-btn fm-orders-btn-secondary" onClick={closeDetail}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
