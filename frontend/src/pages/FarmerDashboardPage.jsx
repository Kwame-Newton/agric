import React, { useState } from 'react';
import {
  TrendingUp, TrendingDown, Sprout, ShoppingCart,
  DollarSign, Star, Eye, ChevronRight, Plus, LogOut,
  MoreHorizontal, ArrowUpRight
} from 'lucide-react';

// ─── Mock Data ───────────────────────────────────────────────────────────────
const statsData = [
  {
    id: 'crops',
    label: 'Total Crops',
    value: '45',
    change: '+12%',
    trend: 'up',
    desc: 'this week',
    icon: Sprout,
    color: 'stat-green',
  },
  {
    id: 'orders',
    label: 'Total Orders',
    value: '32',
    change: '+8%',
    trend: 'up',
    desc: 'this week',
    icon: ShoppingCart,
    color: 'stat-blue',
  },
  {
    id: 'revenue',
    label: 'Total Revenue',
    value: '₵8,500',
    change: '+25%',
    trend: 'up',
    desc: 'this week',
    icon: DollarSign,
    color: 'stat-gold',
  },
  {
    id: 'rating',
    label: 'Farm Rating',
    value: '4.8',
    change: 'Based on 128 reviews',
    trend: 'neutral',
    desc: '',
    icon: Star,
    color: 'stat-purple',
  },
];

const revenueData = [
  { month: 'Jan', value: 500 },
  { month: 'Feb', value: 900 },
  { month: 'Mar', value: 700 },
  { month: 'Apr', value: 1200 },
  { month: 'May', value: 1000 },
  { month: 'Jun', value: 1500 },
  { month: 'Jul', value: 1800 },
];

const recentOrders = [
  { id: '#ORD001', buyer: 'Kofi Mensah', items: 'Tomatoes, Pepper', amount: '₵260', status: 'Pending' },
  { id: '#ORD002', buyer: 'Ama Owusu', items: 'Maize', amount: '₵180', status: 'Processing' },
  { id: '#ORD003', buyer: 'Kwame Asare', items: 'Cassava', amount: '₵120', status: 'Delivered' },
  { id: '#ORD004', buyer: 'Akua Johnson', items: 'Tomatoes', amount: '₵150', status: 'Pending' },
  { id: '#ORD005', buyer: 'Yaw Boateng', items: 'Pepper', amount: '₵200', status: 'Delivered' },
];

const topCrops = [
  { name: 'Tomatoes', sold: '350 kg sold', revenue: '₵1,800', pct: 85, color: '#e53935' },
  { name: 'Pepper', sold: '90 kg sold', revenue: '₵1,425', pct: 68, color: '#e65100' },
  { name: 'Maize', sold: '210 kg sold', revenue: '₵1,040', pct: 50, color: '#f9a825' },
  { name: 'Cassava', sold: '180 kg sold', revenue: '₵840', pct: 40, color: '#558b2f' },
];

const farmUpdates = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=400&q=70',
    title: 'Harvesting fresh tomatoes today!',
    date: 'May 30, 2024',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=400&q=70',
    title: 'New pepper plants growing well',
    date: 'May 28, 2024',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=70',
    title: 'Farm update video',
    date: 'May 26, 2024',
    isVideo: true,
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1595374882832-21b3efda5f9c?auto=format&fit=crop&w=400&q=70',
    title: 'Maize field looking great!',
    date: 'May 24, 2024',
  },
];

// ─── Mini SVG Line Chart ──────────────────────────────────────────────────────
function MiniLineChart({ data }) {
  const maxVal = Math.max(...data.map(d => d.value));
  const minVal = Math.min(...data.map(d => d.value));
  const W = 560;
  const H = 120;
  const padX = 10;
  const padY = 10;

  const points = data.map((d, i) => {
    const x = padX + (i / (data.length - 1)) * (W - 2 * padX);
    const y = H - padY - ((d.value - minVal) / (maxVal - minVal)) * (H - 2 * padY);
    return `${x},${y}`;
  });

  const polyline = points.join(' ');
  const area = `${padX},${H - padY} ${polyline} ${W - padX},${H - padY}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="revenue-chart-svg" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e5c3b" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#1e5c3b" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#areaGrad)" />
      <polyline
        points={polyline}
        fill="none"
        stroke="#1e5c3b"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {data.map((d, i) => {
        const [x, y] = points[i].split(',').map(Number);
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="5"
            fill="#ffffff"
            stroke="#1e5c3b"
            strokeWidth="2.5"
          />
        );
      })}
    </svg>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    Pending: 'badge-pending',
    Processing: 'badge-processing',
    Delivered: 'badge-delivered',
  };
  return <span className={`order-status-badge ${map[status] || ''}`}>{status}</span>;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FarmerDashboardPage() {
  const [revenueFilter, setRevenueFilter] = useState('This Month');

  return (
    <div className="farmer-dashboard">

      {/* ── Stats Grid ── */}
      <div className="stats-grid">
        {statsData.map(({ id, label, value, change, trend, desc, icon: Icon, color }) => (
          <div key={id} className={`stat-card-db ${color}`}>
            <div className="stat-db-header">
              <div className="stat-db-label">{label}</div>
              <div className="stat-db-icon-wrap">
                <Icon size={20} />
              </div>
            </div>
            <div className="stat-db-value">{value}</div>
            <div className="stat-db-footer">
              {trend === 'up' && (
                <span className="stat-trend-up">
                  <TrendingUp size={14} /> {change}
                </span>
              )}
              {trend === 'down' && (
                <span className="stat-trend-down">
                  <TrendingDown size={14} /> {change}
                </span>
              )}
              {trend === 'neutral' && (
                <span className="stat-trend-neutral">{change}</span>
              )}
              {desc && <span className="stat-desc">{desc}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* ── Revenue + Recent Orders ── */}
      <div className="dashboard-row-2">

        {/* Revenue Chart */}
        <div className="db-card revenue-card">
          <div className="db-card-header">
            <div>
              <h3 className="db-card-title">Revenue Overview</h3>
              <div className="revenue-total">₵8,500 <span className="revenue-period">this month</span></div>
            </div>
            <select
              className="db-filter-select"
              value={revenueFilter}
              onChange={e => setRevenueFilter(e.target.value)}
            >
              <option>This Month</option>
              <option>Last 3 Months</option>
              <option>This Year</option>
            </select>
          </div>

          <div className="revenue-chart-wrap">
            <MiniLineChart data={revenueData} />
          </div>

          <div className="revenue-x-labels">
            {revenueData.map(d => (
              <span key={d.month}>{d.month}</span>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="db-card orders-card">
          <div className="db-card-header">
            <h3 className="db-card-title">Recent Orders</h3>
            <button className="db-view-all-btn">
              View All <ChevronRight size={16} />
            </button>
          </div>

          <div className="orders-table-wrap">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Buyer</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id}>
                    <td className="order-id">{order.id}</td>
                    <td>{order.buyer}</td>
                    <td className="order-items">{order.items}</td>
                    <td className="order-amount">{order.amount}</td>
                    <td><StatusBadge status={order.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Top Selling Crops + Farm Updates ── */}
      <div className="dashboard-row-3">

        {/* Top Selling Crops */}
        <div className="db-card">
          <div className="db-card-header">
            <h3 className="db-card-title">Top Selling Crops</h3>
            <button className="db-view-all-btn">
              View All <ChevronRight size={16} />
            </button>
          </div>

          <div className="top-crops-list">
            {topCrops.map(crop => (
              <div key={crop.name} className="top-crop-item">
                <div className="top-crop-header">
                  <div className="top-crop-dot" style={{ background: crop.color }} />
                  <div className="top-crop-name">{crop.name}</div>
                  <div className="top-crop-revenue">{crop.revenue}</div>
                </div>
                <div className="top-crop-sold">{crop.sold}</div>
                <div className="crop-progress-bar-bg">
                  <div
                    className="crop-progress-bar-fill"
                    style={{ width: `${crop.pct}%`, background: crop.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Farm Updates */}
        <div className="db-card">
          <div className="db-card-header">
            <h3 className="db-card-title">Recent Farm Updates</h3>
            <button className="db-view-all-btn">
              View All <ChevronRight size={16} />
            </button>
          </div>

          <div className="farm-updates-grid">
            {farmUpdates.map(update => (
              <div key={update.id} className="farm-update-item">
                <div className="farm-update-img-wrap">
                  <img src={update.image} alt={update.title} className="farm-update-img" />
                  {update.isVideo && (
                    <div className="video-play-overlay">
                      <div className="play-btn">▶</div>
                    </div>
                  )}
                </div>
                <div className="farm-update-info">
                  <p className="farm-update-title">{update.title}</p>
                  <p className="farm-update-date">{update.date}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Update Button */}
          <button className="db-add-update-btn">
            <Plus size={16} /> Add Farm Update
          </button>
        </div>
      </div>

    </div>
  );
}
