import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Mail,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Trash2,
  Send,
  MessageSquare,
  User,
  Tag,
  AlertCircle,
  RefreshCw,
  X,
} from 'lucide-react';
import { AdminDashboardLayout } from './AdminDashboardPage';
import { fetchAdminContactMessages } from '../../services/chatService';
import './admin.css';

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [toast, setToast] = useState('');

  const loadMessages = useCallback(async () => {
    setLoading(true);
    const data = await fetchAdminContactMessages();
    setMessages(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const filteredMessages = useMemo(() => {
    let list = messages;
    if (filterSubject !== 'all') {
      list = list.filter((m) =>
        m.subject && m.subject.toLowerCase().includes(filterSubject.toLowerCase())
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          (m.fullName && m.fullName.toLowerCase().includes(q)) ||
          (m.email && m.email.toLowerCase().includes(q)) ||
          (m.message && m.message.toLowerCase().includes(q)) ||
          (m.subject && m.subject.toLowerCase().includes(q))
      );
    }
    return list;
  }, [messages, filterSubject, search]);

  const stats = useMemo(() => {
    const total = messages.length;
    const pending = messages.filter((m) => m.status === 'pending').length;
    const verificationReqs = messages.filter(
      (m) => m.subject && m.subject.toLowerCase().includes('verification')
    ).length;
    const resolved = messages.filter((m) => m.status === 'resolved').length;

    return { total, pending, verificationReqs, resolved };
  }, [messages]);

  const handleToggleStatus = (id) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const nextStatus = m.status === 'resolved' ? 'pending' : 'resolved';
          return { ...m, status: nextStatus };
        }
        return m;
      })
    );
    showToast('Message status updated.');
  };

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedMsg) return;

    setMessages((prev) =>
      prev.map((m) =>
        m.id === selectedMsg.id
          ? { ...m, status: 'resolved', reply: replyText.trim() }
          : m
      )
    );

    showToast(`Reply sent to ${selectedMsg.email}`);
    setReplyText('');
    setSelectedMsg(null);
  };

  return (
    <AdminDashboardLayout>
      <div className="fm-page">
        {toast && (
          <div className="fm-toast" style={{ position: 'fixed', right: 20, top: 80, zIndex: 9999 }}>
            <div className="fm-toast-inner">
              <div className="fm-toast-icon">✓</div>
              <div className="fm-toast-text">{toast}</div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="fm-header">
          <div>
            <h1 className="fm-page-title">Admin Messages & Enquiries</h1>
            <p className="fm-page-subtitle">
              Manage user contact enquiries, support tickets, and farmer verification requests
            </p>
          </div>
          <button className="fm-btn fm-btn-export" onClick={loadMessages}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>

        {/* Stats Row */}
        <div className="vr-stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="stat-card" style={{ background: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 600 }}>TOTAL MESSAGES</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', marginTop: '0.2rem' }}>{stats.total}</div>
          </div>
          <div className="stat-card" style={{ background: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '0.8rem', color: '#f57f17', fontWeight: 600 }}>PENDING ACTION</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f57f17', marginTop: '0.2rem' }}>{stats.pending}</div>
          </div>
          <div className="stat-card" style={{ background: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600 }}>VERIFICATION REQUESTS</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563eb', marginTop: '0.2rem' }}>{stats.verificationReqs}</div>
          </div>
          <div className="stat-card" style={{ background: '#fff', padding: '1rem', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}>RESOLVED</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a', marginTop: '0.2rem' }}>{stats.resolved}</div>
          </div>
        </div>

        {/* Controls Row */}
        <div className="fm-controls" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div className="fm-search" style={{ flex: 1, minWidth: '240px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.5rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Search size={16} color="#9ca3af" />
            <input
              type="text"
              placeholder="Search by name, email, or content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Filter size={16} color="#6b7280" />
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              style={{ padding: '0.55rem 0.9rem', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', fontSize: '0.85rem', fontWeight: 600 }}
            >
              <option value="all">All Categories</option>
              <option value="verification">Farmer Verification</option>
              <option value="general">General Enquiry</option>
              <option value="support">Technical Support</option>
              <option value="report">Report Problem</option>
            </select>
          </div>
        </div>

        {/* Table / List */}
        <div className="fm-table-wrap" style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Loading contact messages...</div>
          ) : filteredMessages.length > 0 ? (
            <table className="fm-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: '0.78rem', color: '#6b7280', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Sender</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Subject</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Message Preview</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMessages.map((msg) => (
                  <tr key={msg.id} style={{ borderBottom: '1px solid #f3f4f6', fontSize: '0.88rem' }}>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <div style={{ fontWeight: 700, color: '#111827' }}>{msg.fullName}</div>
                      <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{msg.email}</div>
                    </td>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: msg.subject?.toLowerCase().includes('verification') ? '#eff6ff' : '#f3f4f6',
                          color: msg.subject?.toLowerCase().includes('verification') ? '#1d4ed8' : '#374151',
                        }}
                      >
                        {msg.subject}
                      </span>
                    </td>
                    <td style={{ padding: '0.9rem 1rem', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#4b5563' }}>
                      {msg.message}
                    </td>
                    <td style={{ padding: '0.9rem 1rem', fontSize: '0.8rem', color: '#6b7280' }}>
                      {new Date(msg.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: msg.status === 'resolved' ? '#dcfce7' : '#fef3c7',
                          color: msg.status === 'resolved' ? '#15803d' : '#b45309',
                        }}
                      >
                        {msg.status === 'resolved' ? 'Resolved' : 'Pending'}
                      </span>
                    </td>
                    <td style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedMsg(msg)}
                          style={{ background: '#eff6ff', color: '#1d4ed8', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
                        >
                          View / Reply
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(msg.id)}
                          style={{ background: '#f3f4f6', color: '#374151', border: 'none', padding: '0.4rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
                          title="Toggle Status"
                        >
                          {msg.status === 'resolved' ? 'Mark Pending' : 'Mark Resolved'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
              No messages found. Submitted contact messages will appear here.
            </div>
          )}
        </div>

        {/* Message Modal */}
        {selectedMsg && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1rem' }}>
            <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '600px', width: '100%', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>{selectedMsg.subject}</h3>
                  <p style={{ fontSize: '0.82rem', color: '#6b7280' }}>From: <strong>{selectedMsg.fullName}</strong> ({selectedMsg.email})</p>
                </div>
                <button onClick={() => setSelectedMsg(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#9ca3af' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '1rem', fontSize: '0.9rem', color: '#374151', lineHeight: '1.5' }}>
                {selectedMsg.message}
              </div>

              {selectedMsg.reply && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', color: '#166534' }}>
                  <strong>Previous Reply:</strong> {selectedMsg.reply}
                </div>
              )}

              <form onSubmit={handleSendReply}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '0.4rem' }}>Reply Message</label>
                  <textarea
                    rows={4}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your response to the sender..."
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', fontFamily: 'inherit', fontSize: '0.88rem' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button type="button" onClick={() => setSelectedMsg(null)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                    Cancel
                  </button>
                  <button type="submit" style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', background: '#1e5c3b', color: '#fff', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Send size={14} /> Send Reply
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  );
}
