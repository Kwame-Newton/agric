import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Wallet, TrendingUp, Lock, BadgeDollarSign, Package,
  RefreshCw, Download, Info, CheckCircle2, Clock, XCircle,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import "./FarmerEarningsPage.css";

const BACKEND = "http://localhost:4000";
const GHC = (n) => `GH₵ ${Number(n || 0).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GH", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// ── Escrow status badge ──────────────────────────────────────
function EscrowBadge({ status }) {
  const s = (status || "pending").toLowerCase();
  const map = {
    held:             { cls: "fe-badge fe-badge-held",     label: "🔒 In Escrow" },
    released:         { cls: "fe-badge fe-badge-released", label: "✅ Released" },
    pending:          { cls: "fe-badge fe-badge-pending",  label: "⏳ Pending" },
  };
  const cfg = map[s] || { cls: "fe-badge fe-badge-pending", label: s };
  return <span className={cfg.cls}>{cfg.label}</span>;
}

// ── Transfer status badge ────────────────────────────────────
function TransferBadge({ status }) {
  const s = (status || "pending").toLowerCase();
  const map = {
    success:           { cls: "fe-badge fe-badge-success",   label: "✅ Sent" },
    success_simulated: { cls: "fe-badge fe-badge-simulated", label: "🔵 Simulated" },
    queued:            { cls: "fe-badge fe-badge-queued",     label: "🕐 Queued" },
    failed:            { cls: "fe-badge fe-badge-failed",     label: "❌ Failed" },
  };
  const cfg = map[s] || { cls: "fe-badge fe-badge-pending", label: s };
  return <span className={cfg.cls}>{cfg.label}</span>;
}

// ── Revenue Bar Chart ────────────────────────────────────────
function RevenueChart({ data }) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div className="fe-chart-section">
      <div className="fe-section-title">📈 Monthly Revenue (Last 6 Months)</div>
      <div className="fe-chart-bars">
        {data.map((m) => {
          const revenueH = Math.max((m.revenue / maxRevenue) * 120, m.revenue > 0 ? 6 : 0);
          const payoutH  = Math.max((m.payout  / maxRevenue) * 120, m.payout  > 0 ? 4 : 0);
          return (
            <div key={m.label} className="fe-bar-group" title={`${m.label}: Revenue ${GHC(m.revenue)}, Payout ${GHC(m.payout)}`}>
              <div className="fe-bar-wrap">
                <div className="fe-bar fe-bar-revenue" style={{ height: revenueH }} />
                <div className="fe-bar fe-bar-payout"  style={{ height: payoutH }} />
              </div>
              <div className="fe-bar-label">{m.label}</div>
            </div>
          );
        })}
      </div>
      <div className="fe-chart-legend">
        <span className="fe-legend-item">
          <span className="fe-legend-dot" style={{ background: "rgba(30,92,59,0.25)" }} />
          Total Revenue
        </span>
        <span className="fe-legend-item">
          <span className="fe-legend-dot" style={{ background: "#1e5c3b" }} />
          My Payout (after 5% fee)
        </span>
      </div>
    </div>
  );
}

// ── Main Page Component ──────────────────────────────────────
export default function FarmerEarningsPage() {
  const { user } = useAuth();
  const [loading, setLoading]   = useState(true);
  const [summary, setSummary]   = useState(null);
  const [chart, setChart]       = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [payouts, setPayouts]   = useState([]);
  const [tab, setTab]           = useState("transactions");

  // ── Fetch earnings data ──────────────────────────────────
  const fetchEarnings = useCallback(async () => {
    setLoading(true);
    try {
      const farmerId = user?.id;
      if (!farmerId) return;

      // Try backend API first
      try {
        const res = await fetch(`${BACKEND}/api/payments/farmer/${farmerId}/earnings`);
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setSummary(json.summary);
            setChart(json.monthly_chart || []);
            setTransactions(json.transactions || []);
            setPayouts(json.payout_history || []);
            setLoading(false);
            return;
          }
        }
      } catch (apiErr) {
        console.warn("Backend earnings API unavailable, falling back to Supabase direct:", apiErr.message);
      }

      // Fallback: direct Supabase queries
      const [{ data: orders }, { data: payoutData }] = await Promise.all([
        supabase.from("orders").select("*").eq("farmer_id", farmerId).order("created_at", { ascending: false }),
        supabase.from("payout_transfers").select("*").eq("farmer_id", farmerId).order("created_at", { ascending: false }),
      ]);

      const allOrders  = orders  || [];
      const allPayouts = payoutData || [];

      const totalEarned     = allOrders.filter(o => o.escrow_status === "released").reduce((a, o) => a + Number(o.farmer_amount || 0), 0);
      const inEscrow        = allOrders.filter(o => o.escrow_status === "held" && o.payment_status === "paid").reduce((a, o) => a + Number(o.farmer_amount || 0), 0);
      const totalCommission = allOrders.filter(o => o.payment_status === "paid").reduce((a, o) => a + Number(o.commission_amount || 0), 0);
      const totalRevenue    = allOrders.filter(o => o.payment_status === "paid").reduce((a, o) => a + Number(o.total_amount || 0), 0);

      // Build monthly chart
      const monthlyMap = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label = d.toLocaleString("default", { month: "short", year: "2-digit" });
        monthlyMap[key] = { label, revenue: 0, payout: 0, orders: 0 };
      }
      allOrders.forEach(o => {
        if (!o.created_at || o.payment_status !== "paid") return;
        const d   = new Date(o.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (monthlyMap[key]) {
          monthlyMap[key].revenue += Number(o.total_amount || 0);
          monthlyMap[key].payout  += Number(o.farmer_amount || 0);
          monthlyMap[key].orders  += 1;
        }
      });

      setSummary({
        total_earned:          Number(totalEarned.toFixed(2)),
        in_escrow:             Number(Math.max(inEscrow, 0).toFixed(2)),
        total_commission_paid: Number(totalCommission.toFixed(2)),
        total_revenue:         Number(totalRevenue.toFixed(2)),
        total_orders:          allOrders.length,
        pending_orders:        allOrders.filter(o => o.status === "pending").length,
        processing_orders:     allOrders.filter(o => o.status === "processing").length,
        confirmed_orders:      allOrders.filter(o => o.status === "confirmed" || o.status === "delivered").length,
      });
      setChart(Object.values(monthlyMap));
      setTransactions(allOrders);
      setPayouts(allPayouts);
    } catch (err) {
      console.error("Earnings fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchEarnings(); }, [fetchEarnings]);

  // ── Export Transactions CSV ──────────────────────────────
  const exportCSV = () => {
    const headers = ["Order #", "Date", "Total Amount (GHC)", "AgriLink Fee (GHC)", "My Payout (GHC)", "Payment Status", "Escrow Status", "Order Status"];
    const rows = transactions.map(o => {
      const total      = Number(o.total_amount || 0);
      const commission = Number(o.commission_amount || (total * (o.commission_rate || 0.05)));
      const payout     = Number(o.farmer_amount || (total - commission));
      return [
        o.order_number || o.id,
        fmtDate(o.created_at),
        total.toFixed(2),
        commission.toFixed(2),
        payout.toFixed(2),
        o.payment_status || "pending",
        o.escrow_status  || "pending",
        o.status         || "pending",
      ].join(",");
    });
    const csv  = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.setAttribute("download", `earnings_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // ── Loading state ────────────────────────────────────────
  if (loading) {
    return (
      <div className="fe-page">
        <div className="fe-loading">
          <RefreshCw size={28} className="fe-spin" style={{ color: "#1e5c3b" }} />
          <span>Loading your earnings…</span>
        </div>
      </div>
    );
  }

  const s = summary || {};

  return (
    <div className="fe-page">
      {/* ── Header ── */}
      <div className="fe-header">
        <div>
          <h2 className="fe-title">💰 Earnings & Payouts</h2>
          <div className="fe-subtitle">
            Your complete financial overview — transactions, escrow status, and MoMo payout history.
          </div>
        </div>
        <div className="fe-header-actions">
          <button className="fe-btn-subtle" onClick={fetchEarnings} title="Refresh">
            <RefreshCw size={15} className={loading ? "fe-spin" : ""} /> Refresh
          </button>
          <button className="fe-btn-subtle" onClick={exportCSV}>
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* ── Escrow info banner ── */}
      <div className="fe-escrow-banner">
        <Info size={16} />
        <span>
          <strong>How your payments work:</strong> Buyers pay into <strong>AgriLink Escrow</strong>.
          When you mark an order as Delivered and the buyer confirms receipt,{" "}
          <strong>your payout (minus 5% AgriLink fee) is sent directly to your registered Mobile Money number</strong>.
        </span>
      </div>

      {/* ── Summary Cards ── */}
      <div className="fe-summary-grid">
        <div className="fe-card fe-card-earned">
          <div className="fe-card-top">
            <div className="fe-card-label">Total Earned</div>
            <div className="fe-card-icon fe-card-icon-green"><Wallet size={18} /></div>
          </div>
          <div className="fe-card-value">{GHC(s.total_earned)}</div>
          <div className="fe-card-sub">Escrow payouts released to your MoMo</div>
        </div>

        <div className="fe-card fe-card-escrow">
          <div className="fe-card-top">
            <div className="fe-card-label">In Escrow</div>
            <div className="fe-card-icon fe-card-icon-amber"><Lock size={18} /></div>
          </div>
          <div className="fe-card-value">{GHC(s.in_escrow)}</div>
          <div className="fe-card-sub">Awaiting buyer delivery confirmation</div>
        </div>

        <div className="fe-card">
          <div className="fe-card-top">
            <div className="fe-card-label">AgriLink Fees Paid</div>
            <div className="fe-card-icon fe-card-icon-red"><BadgeDollarSign size={18} /></div>
          </div>
          <div className="fe-card-value">{GHC(s.total_commission_paid)}</div>
          <div className="fe-card-sub">5% platform commission on paid orders</div>
        </div>

        <div className="fe-card">
          <div className="fe-card-top">
            <div className="fe-card-label">Total Orders</div>
            <div className="fe-card-icon fe-card-icon-blue"><Package size={18} /></div>
          </div>
          <div className="fe-card-value">{s.total_orders || 0}</div>
          <div className="fe-card-sub">
            {s.confirmed_orders || 0} confirmed · {s.pending_orders || 0} pending
          </div>
        </div>
      </div>

      {/* ── Revenue Chart ── */}
      <RevenueChart data={chart} />

      {/* ── Tabs: Transactions / Payout History ── */}
      <div className="fe-section">
        <div className="fe-section-header">
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              className={`fe-btn-subtle${tab === "transactions" ? " active" : ""}`}
              style={tab === "transactions" ? { background: "var(--primary)", color: "#fff", borderColor: "var(--primary)" } : {}}
              onClick={() => setTab("transactions")}
            >
              <TrendingUp size={14} /> Transactions ({transactions.length})
            </button>
            <button
              className={`fe-btn-subtle${tab === "payouts" ? " active" : ""}`}
              style={tab === "payouts" ? { background: "var(--primary)", color: "#fff", borderColor: "var(--primary)" } : {}}
              onClick={() => setTab("payouts")}
            >
              <Wallet size={14} /> MoMo Payouts ({payouts.length})
            </button>
          </div>
        </div>

        {/* ── Transactions Table ── */}
        {tab === "transactions" && (
          <div className="fe-table-wrap">
            {transactions.length === 0 ? (
              <div className="fe-empty">
                <div className="fe-empty-icon">📋</div>
                <h3>No transactions yet</h3>
                <p>Orders from buyers will appear here once payments are made.</p>
              </div>
            ) : (
              <table className="fe-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Date</th>
                    <th>Buyer</th>
                    <th>Total Amount</th>
                    <th>AgriLink Fee (5%)</th>
                    <th>My Payout</th>
                    <th>Escrow</th>
                    <th>Order Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((o) => {
                    const total      = Number(o.total_amount || 0);
                    const commission = Number(o.commission_amount || (total * (o.commission_rate || 0.05)));
                    const payout     = Number(o.farmer_amount || (total - commission));
                    return (
                      <tr key={o.id || o.order_number}>
                        <td className="fe-td-strong">{o.order_number || `#${String(o.id).slice(0, 8)}`}</td>
                        <td className="fe-td-muted">{fmtDate(o.created_at)}</td>
                        <td>{o.buyer_name || "Buyer"}</td>
                        <td className="fe-td-strong">{GHC(total)}</td>
                        <td className="fe-td-red">-{GHC(commission)}</td>
                        <td className="fe-td-green">{GHC(payout)}</td>
                        <td><EscrowBadge status={o.escrow_status} /></td>
                        <td style={{ textTransform: "capitalize" }}>{o.status || "pending"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Payout History Table ── */}
        {tab === "payouts" && (
          <div className="fe-table-wrap">
            {payouts.length === 0 ? (
              <div className="fe-empty">
                <div className="fe-empty-icon">💸</div>
                <h3>No MoMo payouts yet</h3>
                <p>Once a buyer confirms delivery, your MoMo payout will appear here.</p>
              </div>
            ) : (
              <table className="fe-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Order ID</th>
                    <th>Transfer Code</th>
                    <th>Amount Sent</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((p) => (
                    <tr key={p.id || p.transfer_code}>
                      <td className="fe-td-muted">{fmtDate(p.created_at)}</td>
                      <td className="fe-td-strong">{p.order_id ? String(p.order_id).slice(0, 8) + "…" : "—"}</td>
                      <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                        {p.transfer_code || p.reference || "—"}
                      </td>
                      <td className="fe-td-green">{GHC(p.amount)}</td>
                      <td><TransferBadge status={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
