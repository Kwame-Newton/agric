import React, { useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Eye,
  X,
  Package,
  Truck,
  Clock,
  DollarSign,
  Pencil,
} from 'lucide-react';

import './FarmerMyOrdersPage.css';

const mockOrders = [
  {
    id: 'ORD-1001',
    buyer: {
      name: 'Kofi Mensah',
      email: 'kofi@example.com',
      phone: '+233 24 000 111',
      deliveryAddress: 'Kumasi, Ashanti — Street 12, House A',
    },
    crop: {
      name: 'Fresh Tomatoes',
      category: 'Vegetables',
      image: 'https://images.unsplash.com/photo-1592921870789-04563d55041c?auto=format&fit=crop&w=300&q=70',
      unit: 'kg',
    },
    quantity: 40,
    totalPrice: 480,
    date: '2024-05-24',
    status: 'Pending',
  },
  {
    id: 'ORD-1002',
    buyer: {
      name: 'Ama Owusu',
      email: 'ama@example.com',
      phone: '+233 55 000 222',
      deliveryAddress: 'Ejisu, Ashanti — Near the market gate',
    },
    crop: {
      name: 'Fresh Maize',
      category: 'Grains',
      image: 'https://images.unsplash.com/photo-1601593346740-925612772716?auto=format&fit=crop&w=300&q=70',
      unit: 'kg',
    },
    quantity: 25,
    totalPrice: 200,
    date: '2024-05-26',
    status: 'Confirmed',
  },
  {
    id: 'ORD-1003',
    buyer: {
      name: 'Kwame Asare',
      email: 'kwame@example.com',
      phone: '+233 24 000 333',
      deliveryAddress: 'Kumasi, Ashanti — Adum road, Block 4',
    },
    crop: {
      name: 'Cassava',
      category: 'Tubers',
      image: 'https://images.unsplash.com/photo-1631207558636-d24c18bcfd6e?auto=format&fit=crop&w=300&q=70',
      unit: 'kg',
    },
    quantity: 60,
    totalPrice: 360,
    date: '2024-05-28',
    status: 'Delivered',
  },
  {
    id: 'ORD-1004',
    buyer: {
      name: 'Akua Johnson',
      email: 'akua@example.com',
      phone: '+233 20 000 444',
      deliveryAddress: 'Obuasi, Ashanti — No. 8, Main Street',
    },
    crop: {
      name: 'Red Pepper',
      category: 'Vegetables',
      image: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=300&q=70',
      unit: 'kg',
    },
    quantity: 15,
    totalPrice: 225,
    date: '2024-05-29',
    status: 'Cancelled',
  },
];

const statusTabs = [
  { value: 'all', label: 'All' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Confirmed', label: 'Confirmed' },
  { value: 'Delivered', label: 'Delivered' },
  { value: 'Cancelled', label: 'Cancelled' },
];

function StatusBadge({ status }) {
  const map = {
    Pending: 'fm-o-status fm-o-pending',
    Confirmed: 'fm-o-status fm-o-confirmed',
    Delivered: 'fm-o-status fm-o-delivered',
    Cancelled: 'fm-o-status fm-o-cancelled',
  };
  return <span className={map[status] || 'fm-o-status'}>{status}</span>;
}

export default function FarmerMyOrdersPage() {
  const [orders, setOrders] = useState(mockOrders);
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const selectedOrder = useMemo(() => orders.find(o => o.id === selectedOrderId) || null, [orders, selectedOrderId]);

  const stats = useMemo(() => {
    const total = orders.length;
    return {
      total,
      pending: orders.filter(o => o.status === 'Pending').length,
      confirmed: orders.filter(o => o.status === 'Confirmed').length,
      delivered: orders.filter(o => o.status === 'Delivered').length,
    };
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter(o => {
      const matchesTab = tab === 'all' ? true : o.status === tab;
      if (!matchesTab) return false;
      if (!q) return true;
      const hay = `${o.id} ${o.buyer.name} ${o.crop.name}`.toLowerCase();
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

  const updateStatus = (orderId, nextStatus) => {
    setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: nextStatus } : o)));
  };

  return (
    <div className="fm-orders-page">
      <div className="fm-orders-header">
        <div>
          <h2 className="fm-orders-title">My Orders</h2>
          <div className="fm-orders-subtitle">Manage order statuses and view delivery details.</div>
        </div>
      </div>

      {/* Stats row */}
      <div className="fm-orders-stats">
        <div className="fm-orders-stat">
          <div className="fm-orders-stat-label">Total</div>
          <div className="fm-orders-stat-value">{stats.total}</div>
        </div>
        <div className="fm-orders-stat">
          <div className="fm-orders-stat-label">Pending</div>
          <div className="fm-orders-stat-value fm-orders-stat-pending">{stats.pending}</div>
        </div>
        <div className="fm-orders-stat">
          <div className="fm-orders-stat-label">Confirmed</div>
          <div className="fm-orders-stat-value fm-orders-stat-confirmed">{stats.confirmed}</div>
        </div>
        <div className="fm-orders-stat">
          <div className="fm-orders-stat-label">Delivered</div>
          <div className="fm-orders-stat-value fm-orders-stat-delivered">{stats.delivered}</div>
        </div>
      </div>

      {/* Filters */}
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
            placeholder="Search by order id, buyer, or crop..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      {filtered.length > 0 ? (
        <div className="fm-orders-table-wrap">
          <table className="fm-orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Buyer</th>
                <th>Crop</th>
                <th>Quantity</th>
                <th>Total Price</th>
                <th>Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id}>
                  <td className="fm-orders-td-strong">{o.id}</td>
                  <td>{o.buyer.name}</td>
                  <td>
                    <div className="fm-orders-crop-cell">
                      <img className="fm-orders-crop-thumb" src={o.crop.image} alt={o.crop.name} />
                      <div>
                        <div className="fm-orders-crop-name">{o.crop.name}</div>
                        <div className="fm-orders-crop-cat">{o.crop.category}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {o.quantity} {o.crop.unit}
                  </td>
                  <td>₵{o.totalPrice}</td>
                  <td className="fm-orders-date">
                    <Clock size={14} /> {new Date(o.date).toLocaleDateString()}
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
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>

                      <button type="button" className="fm-orders-action" onClick={() => openDetail(o.id)}>
                        <Eye size={16} /> View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="fm-orders-empty">
          <div className="fm-orders-empty-emoji">📦</div>
          <h3>No orders found</h3>
          <p>Try adjusting your filters.</p>
        </div>
      )}

      {/* Detail modal */}
      {isDetailOpen && selectedOrder && (
        <div className="fm-orders-modal-overlay" onClick={closeDetail}>
          <div className="fm-orders-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fm-orders-modal-header">
              <div>
                <h3 className="fm-orders-modal-title">Order Details</h3>
                <div className="fm-orders-modal-subtitle">{selectedOrder.id} • {selectedOrder.buyer.name}</div>
              </div>
              <button type="button" className="fm-orders-modal-close" onClick={closeDetail}>
                <X size={18} />
              </button>
            </div>

            <div className="fm-orders-modal-body">
              <div className="fm-orders-detail-grid">
                <div className="fm-orders-detail-card">
                  <div className="fm-orders-detail-title">Buyer</div>
                  <div className="fm-orders-detail-row"><strong>Name:</strong> {selectedOrder.buyer.name}</div>
                  <div className="fm-orders-detail-row"><strong>Email:</strong> {selectedOrder.buyer.email}</div>
                  <div className="fm-orders-detail-row"><strong>Phone:</strong> {selectedOrder.buyer.phone}</div>
                  <div className="fm-orders-detail-row"><strong>Delivery:</strong> {selectedOrder.buyer.deliveryAddress}</div>
                </div>

                <div className="fm-orders-detail-card">
                  <div className="fm-orders-detail-title">Crop</div>
                  <div className="fm-orders-crop-big">
                    <img className="fm-orders-crop-big-thumb" src={selectedOrder.crop.image} alt={selectedOrder.crop.name} />
                    <div>
                      <div className="fm-orders-crop-big-name">{selectedOrder.crop.name}</div>
                      <div className="fm-orders-crop-big-cat">{selectedOrder.crop.category}</div>
                      <div className="fm-orders-crop-big-qty">{selectedOrder.quantity} {selectedOrder.crop.unit}</div>
                    </div>
                  </div>
                </div>

                <div className="fm-orders-detail-card">
                  <div className="fm-orders-detail-title">Price & Status</div>
                  <div className="fm-orders-detail-row"><strong>Total Price:</strong> ₵{selectedOrder.totalPrice}</div>
                  <div className="fm-orders-detail-row"><strong>Date:</strong> {new Date(selectedOrder.date).toLocaleDateString()}</div>
                  <div className="fm-orders-detail-row"><strong>Status:</strong> <StatusBadge status={selectedOrder.status} /></div>
                </div>

                <div className="fm-orders-detail-card">
                  <div className="fm-orders-detail-title">Update Status</div>
                  <div className="fm-orders-update-row">
                    <select
                      className="fm-orders-status-select"
                      value={selectedOrder.status}
                      onChange={(e) => updateStatus(selectedOrder.id, e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                    <div className="fm-orders-detail-note">
                      <Package size={14} />
                      Use the dropdown to update order progress.
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

