import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  Search,
  Phone,
  Paperclip,
  Send,
  ChevronLeft,
  MessageCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  fetchUserConversations,
  sendMessage,
  subscribeToRealtimeMessages,
} from '../services/chatService';
import './FarmerMessagesPage.css';

function initials(name) {
  if (!name) return 'B';
  const parts = String(name).trim().split(/\s+/);
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[1] || '';
  return (first + last).toUpperCase();
}

function formatTime(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(date) {
  if (!date) return 'Today';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return 'Today';

  const now = new Date();
  if (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  ) {
    return 'Today';
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  ) {
    return 'Yesterday';
  }

  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: '2-digit' });
}

function groupByDay(messages) {
  const map = new Map();
  for (const m of messages) {
    const d = m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp);
    const dayKey = Number.isNaN(d.getTime()) ? 'today' : d.toDateString();

    if (!map.has(dayKey)) {
      map.set(dayKey, {
        dayKey,
        label: formatDateLabel(d),
        items: [],
      });
    }
    map.get(dayKey).items.push(m);
  }

  return Array.from(map.values());
}

export default function FarmerMessagesPage() {
  const { user } = useAuth();
  const farmerId = user?.id || 'farmer-1';
  const farmerName = user?.name || user?.profileDetails?.farm_name || 'Farmer';

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [draft, setDraft] = useState('');
  const [mobileChatOnly, setMobileChatOnly] = useState(false);

  const chatEndRef = useRef(null);
  const chatScrollRef = useRef(null);

  // Load real user conversations
  const loadConversations = useCallback(async () => {
    setLoading(true);
    const convs = await fetchUserConversations(farmerId);
    setConversations(convs);
    setLoading(false);
  }, [farmerId]);

  useEffect(() => {
    loadConversations();

    // Subscribe to realtime incoming messages
    const unsubscribe = subscribeToRealtimeMessages(farmerId, () => {
      loadConversations();
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [farmerId, loadConversations]);

  useEffect(() => {
    if (!selectedId && conversations.length > 0) {
      setSelectedId(conversations[0].id);
    }
  }, [conversations, selectedId]);

  const selectedConv = useMemo(() => {
    if (!selectedId) return null;
    return conversations.find((c) => c.id === selectedId) || null;
  }, [conversations, selectedId]);

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => (c.buyer?.name || '').toLowerCase().includes(q));
  }, [conversations, search]);

  const unreadCountByConv = useMemo(() => {
    const result = {};
    for (const c of conversations) {
      const msgs = c.messages || [];
      result[c.id] = msgs.filter((m) => m.side === 'received' && !m.read).length;
    }
    return result;
  }, [conversations]);

  const totalUnread = useMemo(() => {
    return Object.values(unreadCountByConv).reduce((a, b) => a + b, 0);
  }, [unreadCountByConv]);

  const messages = selectedConv ? selectedConv.messages || [] : [];
  const grouped = useMemo(() => groupByDay(messages), [messages]);

  useEffect(() => {
    if (!chatEndRef.current) return;
    chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [grouped.length, selectedId]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileChatOnly(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function setToast(message) {
    setToastMsg(message);
    window.clearTimeout(setToast._t);
    setToast._t = window.setTimeout(() => setToastMsg(''), 2400);
  }

  async function onSend() {
    if (!selectedId || !selectedConv) return;
    const text = draft.trim();
    if (!text) return;

    setDraft('');

    await sendMessage({
      senderId: farmerId,
      receiverId: selectedId,
      senderName: farmerName,
      receiverName: selectedConv.buyer?.name || 'Buyer',
      text: text,
    });

    setToast('Message sent');
    await loadConversations();
  }

  function onAttach() {
    setToast('Attachment added');
  }

  function selectConv(id) {
    setSelectedId(id);
    setMobileChatOnly(true);
  }

  return (
    <div className="fm-page">
      {/* Toast */}
      {toastMsg ? (
        <div className="fm-toast" role="status" aria-live="polite">
          <div className="fm-toast-inner">
            <div className="fm-toast-icon">✓</div>
            <div className="fm-toast-text">{toastMsg}</div>
          </div>
        </div>
      ) : null}

      <div className="fm-messages-shell">
        {/* Left panel */}
        <section className={`fm-left ${mobileChatOnly ? 'fm-hidden-mobile' : ''}`}>
          <div className="fm-left-header">
            <div className="fm-left-title">
              <div className="fm-title">Messages</div>
              <div className="fm-unread-pill" aria-label="Unread messages">
                {totalUnread}
              </div>
            </div>
          </div>

          <div className="fm-search">
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search buyers by name..."
            />
          </div>

          <div className="fm-conv-list">
            {loading ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#6b7280', fontSize: '0.85rem' }}>
                Loading conversations...
              </div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((c) => {
                const msgs = c.messages || [];
                const last = msgs.slice(-1)[0];
                const unread = unreadCountByConv[c.id] || 0;
                const active = selectedId === c.id;

                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`fm-conv-card ${active ? 'active' : ''}`}
                    onClick={() => selectConv(c.id)}
                  >
                    <div
                      className="fm-buyer-avatar"
                      style={{ background: active ? 'linear-gradient(135deg, #2D6A4F, #F4A261)' : c.buyer.avatarColor }}
                    >
                      {initials(c.buyer.name)}
                    </div>

                    <div className="fm-conv-meta">
                      <div className="fm-conv-top">
                        <div className="fm-conv-name">{c.buyer.name}</div>
                        {last ? (
                          <div className="fm-conv-time">{formatTime(last.timestamp)}</div>
                        ) : null}
                      </div>

                      <div className="fm-conv-bottom">
                        <div className="fm-conv-preview">{last ? last.text : 'No messages yet.'}</div>
                        {unread > 0 ? <div className="fm-unread-badge">{unread}</div> : null}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.88rem' }}>
                No messages yet. Messages sent by buyers will appear here.
              </div>
            )}
          </div>
        </section>

        {/* Right panel */}
        <section
          className={`fm-right ${!mobileChatOnly ? 'fm-hidden-mobile' : ''}`}
        >
          {!selectedConv ? (
            <div className="fm-empty">
              <div className="fm-empty-icon">
                <MessageCircle size={56} />
              </div>
              <div className="fm-empty-title">
                {conversations.length === 0
                  ? 'No incoming buyer messages yet'
                  : 'Select a conversation to start messaging'}
              </div>
            </div>
          ) : (
            <div className="fm-chat-wrap">
              {/* Mobile back */}
              <div className="fm-chat-mobile-top">
                <button
                  type="button"
                  className="fm-mobile-back"
                  onClick={() => setMobileChatOnly(false)}
                >
                  <ChevronLeft size={18} />
                  Back
                </button>
              </div>

              <div className="fm-chat-topbar">
                <div className="fm-chat-buyer">
                  <div
                    className="fm-buyer-avatar sm"
                    style={{ background: selectedConv.buyer.avatarColor }}
                  >
                    {initials(selectedConv.buyer.name)}
                  </div>
                  <div>
                    <div className="fm-chat-name">{selectedConv.buyer.name}</div>
                    <div className="fm-chat-status">
                      <span
                        className={`fm-online-dot ${selectedConv.buyer.online ? 'online' : 'offline'}`}
                      />
                      {selectedConv.buyer.online ? 'Online' : 'Offline'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="fm-phone-btn"
                  onClick={() => setToast('Call initiated')}
                  aria-label="Phone"
                >
                  <Phone size={18} />
                </button>
              </div>

              <div className="fm-chat-area" ref={chatScrollRef}>
                {grouped.map((g) => (
                  <div key={g.dayKey} className="fm-day-group">
                    <div className="fm-day-divider">{g.label}</div>
                    <div className="fm-day-messages">
                      {g.items.map((m) => (
                        <div
                          key={m.id}
                          className={`fm-msg-row ${m.side === 'sent' ? 'sent' : 'received'}`}
                        >
                          {m.side === 'received' ? (
                            <div className="fm-msg-left">
                              <div className="fm-msg-sender">{m.senderName}</div>
                              <div className="fm-bubble received">{m.text}</div>
                            </div>
                          ) : (
                            <div className="fm-msg-right">
                              <div className="fm-bubble sent">{m.text}</div>
                              <div className="fm-msg-meta">
                                <div className="fm-msg-time">{formatTime(m.timestamp)}</div>
                                <div className="fm-read-receipt">✓✓</div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="fm-input-bar">
                <button type="button" className="fm-attach-btn" onClick={onAttach} aria-label="Attach">
                  <Paperclip size={18} />
                </button>

                <input
                  className="fm-message-input"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onSend();
                  }}
                />

                <button type="button" className="fm-send-btn" onClick={onSend} aria-label="Send">
                  <Send size={18} />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
