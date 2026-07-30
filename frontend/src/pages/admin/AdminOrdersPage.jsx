import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, X, Eye, Download, ChevronLeft, ChevronRight,
  Package, Clock, CheckCircle2, AlertCircle, XCircle, RefreshCw,
  User, Truck, DollarSign, Filter, Phone, MapPin, Calendar, CreditCard,
  Sprout, ShoppingBag, ArrowUpRight, Check, TrendingUp, ShieldCheck
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { AdminDashboardLayout } from './AdminDashboardPage';
import './admin.css';

function OrderStatusBadge({ status }) {
  const norm = (status || 'pending').toLowerCase();
  const map = {
    pending:    { label: 'Pending',    bg: '#fff7ed', color: '#c2410c', border: '#ffedd5', icon: Clock },
    processing: { label: 'Processing', bg: '#eff6ff', color: '#1d4ed8', border: '#dbeafe', icon: RefreshCw },
    delivered:  { label: 'Delivered',  bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0', icon: CheckCircle2 },
    cancelled:  { label: 'Cancelled',  bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', icon: XCircle },
  };
  const cfg = map[norm] || { label: status, bg: '#f3f4f6', color: '#374151', border: '#e5e7eb', icon: Clock };
  const Icon = cfg.icon;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      padding: '4px 10px',
      borderRadius: '20px',
      fontSize: '0.78rem',
      fontWeight: 700,
      backgroundColor: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.border}`,
      boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
    }}>
      <Icon size={13} className={norm === 'processing' ? 'spin' : ''} />
      {cfg.label}
    </span>
  );
}

function StatCard({ title, value, subtext, icon: Icon, colorGradient, borderAccent }) {
  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '16px',
      padding: '1.25rem 1.5rem',
      border: '1px solid #e8ede9',
      borderTop: `4px solid ${borderAccent}`,
      boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
      display: 'flex',
      alignItems: 'center',
      justify: 'space-between',
      transition: 'all 0.2s ease-in-out',
    }}>
      <div>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {title}
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#111827', marginTop: '4px', letterSpacing: '-0.02em' }}>
          {value}
        </div>
        {subtext && (
          <div style={{ fontSize: '0.8rem', color: '#4b5563', marginTop: '4px', fontWeight: 600 }}>
            {subtext}
          </div>
        )}
      </div>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '14px',
        background: colorGradient,
        display: 'flex',
        alignItems: 'center',
        justify: 'center',
        color: '#ffffff',
        boxShadow: '0 6px 16px rgba(0,0,0,0.08)'
      }}>
        <Icon size={22} />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Admin Order Detail Modal
────────────────────────────────────────────────────────── */
function OrderDetailModal({ order, open, onClose, onUpdateStatus }) {
  if (!order || !open) return null;

  const currentStatus = (order.status || 'pending').toLowerCase();
  const steps = ['pending', 'processing', 'delivered'];
  const isCancelled = currentStatus === 'cancelled';

  return (
    <div className="fm-modal-overlay" onClick={onClose}>
      <div className="fm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 760, borderRadius: '20px', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0f2d1d 0%, #1e5c3b 100%)',
          padding: '1.5rem 1.75rem',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800 }}>
                {order.order_number}
              </span>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>Order Overview</h3>
            </div>
            <div style={{ fontSize: '0.83rem', color: '#a7f3d0', marginTop: '4px' }}>
              Placed on {new Date(order.created_at).toLocaleString()}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', maxHeight: '75vh', overflowY: 'auto' }}>
          {/* Timeline Progress */}
          {!isCancelled ? (
            <div style={{
              background: '#f8faf9',
              border: '1px solid #e1e8e4',
              borderRadius: '14px',
              padding: '1.25rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4b5563', marginBottom: '1rem', textTransform: 'uppercase' }}>
                Fulfillment Progress
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                {steps.map((step, idx) => {
                  const stepIndex = steps.indexOf(currentStatus);
                  const isDone = stepIndex >= idx;
                  const isCurrent = step === currentStatus;

                  return (
                    <div key={step} style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 2 }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: isDone ? '#1e5c3b' : '#e5e7eb',
                        color: isDone ? '#fff' : '#6b7280',
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'center',
                        margin: '0 auto 6px',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        boxShadow: isCurrent ? '0 0 0 4px rgba(30,92,59,0.2)' : 'none'
                      }}>
                        {isDone ? <Check size={16} /> : idx + 1}
                      </div>
                      <div style={{ fontSize: '0.78rem', fontWeight: isDone ? 800 : 500, color: isDone ? '#111827' : '#9ca3af', textTransform: 'capitalize' }}>
                        {step}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '14px',
              padding: '1rem 1.25rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#991b1b',
              fontWeight: 700,
              fontSize: '0.9rem'
            }}>
              <XCircle size={20} />
              This order has been cancelled.
            </div>
          )}

          {/* Quick Action Status Bar */}
          <div style={{
            background: '#ffffff',
            border: '1.5px solid #1e5c3b',
            borderRadius: '14px',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            marginBottom: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={20} color="#1e5c3b" />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#111827' }}>Update Order Status</div>
                <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>Changes update instantly in real-time.</div>
              </div>
            </div>
            <select
              value={currentStatus}
              onChange={(e) => onUpdateStatus(order.id, e.target.value)}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                border: '1.5px solid #1e5c3b',
                background: '#f0faf4',
                color: '#1e5c3b',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Customer & Supplier Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
            {/* Buyer Card */}
            <div style={{ background: '#ffffff', border: '1px solid #e8ede9', borderRadius: '14px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e5c3b', fontWeight: 800, fontSize: '0.92rem', marginBottom: '0.85rem' }}>
                <User size={18} /> Buyer Details
              </div>
              <div style={{ fontSize: '0.86rem', display: 'flex', flexDirection: 'column', gap: '8px', color: '#374151' }}>
                <div><span style={{ color: '#6b7280' }}>Name:</span> <strong>{order.buyer_name || 'Customer'}</strong></div>
                <div><span style={{ color: '#6b7280' }}>Email:</span> <strong>{order.buyer_email || 'N/A'}</strong></div>
                <div><span style={{ color: '#6b7280' }}>Phone:</span> <strong>{order.phone || 'N/A'}</strong></div>
                <div><span style={{ color: '#6b7280' }}>Delivery:</span> <strong>{order.delivery_address || 'N/A'}</strong></div>
              </div>
            </div>

            {/* Farmer Card */}
            <div style={{ background: '#ffffff', border: '1px solid #e8ede9', borderRadius: '14px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e5c3b', fontWeight: 800, fontSize: '0.92rem', marginBottom: '0.85rem' }}>
                <Sprout size={18} /> Supplier & Payment
              </div>
              <div style={{ fontSize: '0.86rem', display: 'flex', flexDirection: 'column', gap: '8px', color: '#374151' }}>
                <div><span style={{ color: '#6b7280' }}>Farmer:</span> <strong>{order.farmer_name || 'AgriLink Partner'}</strong></div>
                <div><span style={{ color: '#6b7280' }}>Method:</span> <strong>{order.payment_method || 'Mobile Money'}</strong></div>
                <div>
                  <span style={{ color: '#6b7280' }}>Status:</span>{' '}
                  <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '6px', fontWeight: 800, fontSize: '0.78rem' }}>
                    {order.payment_status || 'Paid'}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#6b7280' }}>Total:</span>{' '}
                  <span style={{ color: '#15803d', fontSize: '1.05rem', fontWeight: 900 }}>GH₵ {order.total_amount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Items Summary */}
          <div style={{ border: '1px solid #e8ede9', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ background: '#f9fafb', padding: '0.85rem 1.25rem', fontWeight: 800, color: '#111827', fontSize: '0.88rem', borderBottom: '1px solid #e8ede9' }}>
              Order Items ({order.items?.length || 0})
            </div>
            <div style={{ padding: '0.5rem 1.25rem' }}>
              {(order.items || []).map((item, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between',
                  padding: '0.75rem 0',
                  borderBottom: i === (order.items.length - 1) ? 'none' : '1px solid #f3f4f6'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                      src={item.image_url || 'https://images.unsplash.com/photo-1592921870789-04563d55041c?auto=format&fit=crop&w=150&q=70'}
                      alt={item.name}
                      style={{ width: '46px', height: '46px', borderRadius: '10px', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ fontWeight: 800, color: '#111827' }}>{item.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{item.category || 'Produce'}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: '#111827' }}>{item.quantity} {item.unit || 'kg'}</div>
                    <div style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: 700 }}>
                      GH₵ {item.unit_price ? (item.unit_price * item.quantity) : order.total_amount}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid #e8ede9',
          background: '#f9fafb',
          display: 'flex',
          justify: 'flex-end'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.65rem 1.4rem',
              borderRadius: '999px',
              border: '1px solid #d1d5db',
              background: '#ffffff',
              fontWeight: 800,
              color: '#374151',
              cursor: 'pointer'
            }}
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Main Admin Orders Page Component
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
      // Local state kept
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: "'Inter', sans-serif" }}>

        {/* Hero Banner Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0f2d1d 0%, #1e5c3b 100%)',
          borderRadius: '20px',
          padding: '2rem 2.25rem',
          color: '#ffffff',
          boxShadow: '0 10px 30px rgba(15, 45, 29, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              <ShieldCheck size={14} /> Control Center
            </div>
            <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Order Management
            </h1>
            <p style={{ margin: '0.35rem 0 0', color: '#a7f3d0', fontSize: '0.95rem' }}>
              Monitor platform-wide crop orders, dispatch progress, and revenue fulfillment.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={fetchOrders}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.65rem 1.1rem',
                borderRadius: '999px',
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.1)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                backdropFilter: 'blur(4px)'
              }}
            >
              <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh
            </button>
            <button
              onClick={exportCSV}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.65rem 1.25rem',
                borderRadius: '999px',
                border: 'none',
                background: '#ffffff',
                color: '#1e5c3b',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0,0,0,0.12)'
              }}
            >
              <Download size={15} /> Export CSV
            </button>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.25rem' }}>
          <StatCard
            title="Total Platform Revenue"
            value={`GH₵ ${stats.totalRev.toLocaleString()}`}
            subtext={`${stats.total} total orders placed`}
            icon={TrendingUp}
            colorGradient="linear-gradient(135deg, #059669, #10b981)"
            borderAccent="#059669"
          />
          <StatCard
            title="Pending Orders"
            value={stats.pending}
            subtext="Needs farmer response"
            icon={Clock}
            colorGradient="linear-gradient(135deg, #d97706, #f59e0b)"
            borderAccent="#d97706"
          />
          <StatCard
            title="In Processing / Transit"
            value={stats.processing}
            subtext="Fulfillment in progress"
            icon={Truck}
            colorGradient="linear-gradient(135deg, #2563eb, #3b82f6)"
            borderAccent="#2563eb"
          />
          <StatCard
            title="Completed Deliveries"
            value={stats.delivered}
            subtext="Delivered to buyer"
            icon={CheckCircle2}
            colorGradient="linear-gradient(135deg, #16a34a, #22c55e)"
            borderAccent="#16a34a"
          />
        </div>

        {/* Filter Controls Bar */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '1.1rem 1.25rem',
          border: '1px solid #e8ede9',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { val: 'all', label: `All (${stats.total})` },
              { val: 'pending', label: `Pending (${stats.pending})` },
              { val: 'processing', label: `Processing (${stats.processing})` },
              { val: 'delivered', label: `Delivered (${stats.delivered})` },
              { val: 'cancelled', label: `Cancelled (${stats.cancelled})` },
            ].map(tab => (
              <button
                key={tab.val}
                onClick={() => { setStatusFilter(tab.val); setPage(1); }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '999px',
                  border: statusFilter === tab.val ? '1.5px solid #1e5c3b' : '1px solid #e5e7eb',
                  background: statusFilter === tab.val ? '#1e5c3b' : '#ffffff',
                  color: statusFilter === tab.val ? '#ffffff' : '#4b5563',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '280px', flex: '1', maxWidth: '380px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Search by order #, buyer, phone, or farmer..."
              value={query}
              onChange={e => { setQuery(e.target.value); setPage(1); }}
              style={{
                width: '100%',
                padding: '8px 32px 8px 36px',
                borderRadius: '999px',
                border: '1.5px solid #e5e7eb',
                fontSize: '0.86rem',
                outline: 'none',
                background: '#f9fafb'
              }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Orders Table Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: '18px',
          border: '1px solid #e8ede9',
          boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f8faf9', borderBottom: '1px solid #e8ede9' }}>
                <th style={{ padding: '1rem 1.25rem', fontSize: '0.78rem', textTransform: 'uppercase', color: '#6b7280', fontWeight: 800 }}>Order #</th>
                <th style={{ padding: '1rem 1.25rem', fontSize: '0.78rem', textTransform: 'uppercase', color: '#6b7280', fontWeight: 800 }}>Buyer</th>
                <th style={{ padding: '1rem 1.25rem', fontSize: '0.78rem', textTransform: 'uppercase', color: '#6b7280', fontWeight: 800 }}>Farmer / Supplier</th>
                <th style={{ padding: '1rem 1.25rem', fontSize: '0.78rem', textTransform: 'uppercase', color: '#6b7280', fontWeight: 800 }}>Items</th>
                <th style={{ padding: '1rem 1.25rem', fontSize: '0.78rem', textTransform: 'uppercase', color: '#6b7280', fontWeight: 800 }}>Total (GH₵)</th>
                <th style={{ padding: '1rem 1.25rem', fontSize: '0.78rem', textTransform: 'uppercase', color: '#6b7280', fontWeight: 800 }}>Date</th>
                <th style={{ padding: '1rem 1.25rem', fontSize: '0.78rem', textTransform: 'uppercase', color: '#6b7280', fontWeight: 800 }}>Status</th>
                <th style={{ padding: '1rem 1.25rem', fontSize: '0.78rem', textTransform: 'uppercase', color: '#6b7280', fontWeight: 800, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedOrders.length > 0 ? (
                pagedOrders.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.15s ease' }}>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span style={{ fontWeight: 800, color: '#1e5c3b', fontFamily: 'monospace', fontSize: '0.88rem' }}>
                        {o.order_number}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 800, color: '#111827' }}>{o.buyer_name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{o.phone || o.buyer_email}</div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: '#374151', fontWeight: 600 }}>
                      {o.farmer_name}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span style={{ background: '#f0faf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '3px 9px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700 }}>
                        {o.items?.length || 1} item(s)
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span style={{ fontWeight: 900, color: '#15803d', fontSize: '0.95rem' }}>GH₵ {o.total_amount}</span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: '#6b7280', fontSize: '0.83rem' }}>
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                        <select
                          value={o.status}
                          onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
                          style={{
                            padding: '5px 8px',
                            borderRadius: '8px',
                            border: '1px solid #d1d5db',
                            background: '#ffffff',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: '#374151',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => { setSelectedOrder(o); setModalOpen(true); }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: '1.5px solid #1e5c3b',
                            background: '#ffffff',
                            color: '#1e5c3b',
                            fontWeight: 800,
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Eye size={14} /> View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '4rem 1rem', color: '#9ca3af' }}>
                    <Package size={42} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#374151' }}>No Orders Found</div>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.88rem' }}>There are currently no orders matching your selected filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              padding: '1rem 1.25rem',
              borderTop: '1px solid #e8ede9',
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              background: '#fafafa'
            }}>
              <span style={{ fontSize: '0.83rem', color: '#6b7280', fontWeight: 600 }}>
                Page {page} of {totalPages} ({filteredOrders.length} total orders)
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    background: page === 1 ? '#f3f4f6' : '#ffffff',
                    color: page === 1 ? '#9ca3af' : '#374151',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: page === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Prev
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    background: page === totalPages ? '#f3f4f6' : '#ffffff',
                    color: page === totalPages ? '#9ca3af' : '#374151',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: page === totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal */}
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
