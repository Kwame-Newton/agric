import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Phone,
  Paperclip,
  Send,
  ChevronLeft,
  MessageCircle,
} from 'lucide-react';
import './FarmerMessagesPage.css';

const GHANA_REGIONS = [
  'Greater Accra',
  'Ashanti',
  'Brong-Ahafo',
  'Central',
  'Eastern',
  'Northern',
  'North East',
  'Upper East',
  'Upper West',
  'Volta',
  'Western',
  'Western North',
];

function initials(name) {
  const parts = String(name).trim().split(/\s+/);
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[1] || '';
  return (first + last).toUpperCase();
}

function formatTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: '2-digit' });
}

function groupByDay(messages) {
  const groups = [];
  const map = new Map();
  for (const m of messages) {
    const dayKey = new Date(m.timestamp).toDateString();
    if (!map.has(dayKey)) {
      map.set(dayKey, []);
    }
    map.get(dayKey).push(m);
  }
  for (const [dayKey, arr] of map.entries()) {
    groups.push({
      dayKey,
      label: formatDateLabel(arr[0].timestamp),
      items: arr,
    });
  }
  return groups;
}

export default function FarmerMessagesPage() {
  const mockConversations = useMemo(() => {
    const now = new Date('2024-06-01T10:20:00.000Z');

    const convs = [
      {
        id: 'c1',
        buyer: {
          name: 'Ama Owusu',
          avatarColor: '#2D6A4F',
          phone: '+233 20 555 0136',
          region: 'Greater Accra',
          online: true,
        },
        messages: [
          {
            id: 'm1',
            side: 'received',
            senderName: 'Ama Owusu',
            text: 'Hi Kofi! Is your tomato harvest ready for pickup this week?',
            timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 26),
            read: true,
          },
          {
            id: 'm2',
            side: 'sent',
            senderName: 'You',
            text: 'Yes Ama. We have fresh tomatoes available from Tuesday. I can reserve 200kg for you.',
            timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24),
            readReceipt: true,
          },
          {
            id: 'm3',
            side: 'received',
            senderName: 'Ama Owusu',
            text: 'Perfect. Please share the expected price per crate and packaging details.',
            timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 5),
            read: false,
          },
          {
            id: 'm4',
            side: 'sent',
            senderName: 'You',
            text: '₵95 per crate (12kg). We use clean plastic crates and seal bags for freshness.',
            timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 4.5),
            readReceipt: false,
          },
          {
            id: 'm5',
            side: 'received',
            senderName: 'Ama Owusu',
            text: 'Great—can we do delivery in Accra Friday afternoon?',
            timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 1.2),
            read: false,
          },
        ],
      },
      {
        id: 'c2',
        buyer: {
          name: 'Kofi Mensah',
          avatarColor: '#F4A261',
          phone: '+233 26 330 7890',
          region: 'Ashanti',
          online: false,
        },
        messages: [
          {
            id: 'm1',
            side: 'received',
            senderName: 'Kofi Mensah',
            text: 'Hello! Do you still have maize for sale? I need 150 bags.',
            timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 48),
            read: true,
          },
          {
            id: 'm2',
            side: 'sent',
            senderName: 'You',
            text: 'Yes. We have dried white maize available. 150 bags can be prepared and delivered next Monday.',
            timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 46),
            readReceipt: true,
          },
          {
            id: 'm3',
            side: 'received',
            senderName: 'Kofi Mensah',
            text: 'How much per bag and what’s the storage condition?',
            timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 14),
            read: true,
          },
          {
            id: 'm4',
            side: 'sent',
            senderName: 'You',
            text: '₵230 per 50kg bag. Stored in a dry warehouse with proper ventilation and pallets.',
            timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 12.5),
            readReceipt: true,
          },
          {
            id: 'm5',
            side: 'received',
            senderName: 'Kofi Mensah',
            text: 'Nice. Please confirm availability for Monday morning collection.',
            timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 3),
            read: false,
          },
        ],
      },
      {
        id: 'c3',
        buyer: {
          name: 'John Boateng',
          avatarColor: '#1E88E5',
          phone: '+233 55 144 2298',
          region: 'Western',
          online: true,
        },
        messages: [
          {
            id: 'm1',
            side: 'received',
            senderName: 'John Boateng',
            text: 'Good morning! Is yam available? I want 20 medium tubers.',
            timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 30),
            read: true,
          },
          {
            id: 'm2',
            side: 'sent',
            senderName: 'You',
            text: 'Good morning John. Yes—20 medium yam tubers are available. We can deliver to your area within 2 days.',
            timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 28),
            readReceipt: true,
          },
          {
            id: 'm3',
            side: 'received',
            senderName: 'John Boateng',
            text: 'What is the price and do you include delivery?',
            timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 9.2),
            read: false,
          },
        ],
      },
      {
        id: 'c4',
        buyer: {
          name: 'Naana Ayitey',
          avatarColor: '#6A1B9A',
          phone: '+233 24 987 4401',
          region: 'Volta',
          online: false,
        },
        messages: [
          {
            id: 'm1',
            side: 'received',
            senderName: 'Naana Ayitey',
            text: 'Hi! Can you send a quick video of your pepper plants?',
            timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 15),
            read: false,
          },
          {
            id: 'm2',
            side: 'sent',
            senderName: 'You',
            text: 'Sure Naana. I will upload a short farm update video today and share it here.',
            timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 13.6),
            readReceipt: false,
          },
          {
            id: 'm3',
            side: 'received',
            senderName: 'Naana Ayitey',
            text: 'Thank you. Also, what’s the best time to deliver in Ho?',
            timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 2.5),
            read: false,
          },
        ],
      },
    ];

    return convs;
  }, []);

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const [messagesByConv, setMessagesByConv] = useState(() => {
    const obj = {};
    for (const c of mockConversations) obj[c.id] = c.messages;
    return obj;
  });

  useEffect(() => {
    // Select the first conversation by default (unless none)
    if (!selectedId && mockConversations.length > 0) {
      setSelectedId(mockConversations[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mockConversations.length]);

  const selectedConv = useMemo(() => {
    if (!selectedId) return null;
    return mockConversations.find((c) => c.id === selectedId) || null;
  }, [mockConversations, selectedId]);

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return mockConversations;
    return mockConversations.filter((c) => c.buyer.name.toLowerCase().includes(q));
  }, [mockConversations, search]);

  const unreadCountByConv = useMemo(() => {
    const result = {};
    for (const c of mockConversations) {
      const msgs = messagesByConv[c.id] || [];
      result[c.id] = msgs.filter((m) => m.side === 'received' && !m.read).length;
    }
    return result;
  }, [mockConversations, messagesByConv]);

  const totalUnread = useMemo(() => {
    return Object.values(unreadCountByConv).reduce((a, b) => a + b, 0);
  }, [unreadCountByConv]);

  const messages = (selectedId && messagesByConv[selectedId]) || [];
  const grouped = useMemo(() => groupByDay(messages), [messages]);

  const [draft, setDraft] = useState('');
  const chatEndRef = useRef(null);
  const chatScrollRef = useRef(null);

  useEffect(() => {
    if (!selectedId) return;

    // Mark all received as read
    setMessagesByConv((prev) => {
      const next = { ...prev };
      const msgs = next[selectedId] || [];
      next[selectedId] = msgs.map((m) => (m.side === 'received' ? { ...m, read: true } : m));
      return next;
    });
  }, [selectedId]);

  useEffect(() => {
    if (!chatEndRef.current) return;
    chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [grouped.length, selectedId]);

  function setToast(message) {
    setToastMsg(message);
    window.clearTimeout(setToast._t);
    setToast._t = window.setTimeout(() => setToastMsg(''), 2400);
  }

  function onSend() {
    if (!selectedId) return;
    const text = draft.trim();
    if (!text) return;

    const newMsg = {
      id: `local-${Date.now()}`,
      side: 'sent',
      senderName: 'You',
      text,
      timestamp: new Date(),
      readReceipt: false,
    };

    setMessagesByConv((prev) => {
      const next = { ...prev };
      next[selectedId] = [...(next[selectedId] || []), newMsg];
      return next;
    });

    setDraft('');

    // Demo: auto-receive a response shortly
    window.setTimeout(() => {
      const conv = mockConversations.find((c) => c.id === selectedId);
      if (!conv) return;
      const responseTemplates = [
        'Thanks! I will confirm after checking my stocks.',
        'That sounds good. Please proceed with the order.',
        'Great—can you deliver on Thursday morning?',
        'Perfect. What’s the total cost including delivery?',
      ];
      const reply = responseTemplates[Math.floor(Math.random() * responseTemplates.length)];

      const receivedMsg = {
        id: `auto-${Date.now()}`,
        side: 'received',
        senderName: conv.buyer.name,
        text: reply,
        timestamp: new Date(),
        read: false,
      };

      setMessagesByConv((prev) => {
        const next = { ...prev };
        next[selectedId] = [...(next[selectedId] || []), receivedMsg];
        return next;
      });
    }, 900);

    setToast('Message sent');
  }

  function onAttach() {
    // Demo-only
    setToast('Attachment added (demo)');
  }

  const [mobileChatOnly, setMobileChatOnly] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileChatOnly(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
            {filteredConversations.map((c) => {
              const last = (messagesByConv[c.id] || []).slice(-1)[0];
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
            })}
          </div>
        </section>

        {/* Right panel */}
        <section
          className={`fm-right ${mobileChatOnly && selectedId ? '' : ''} ${mobileChatOnly ? '' : ''}`}
        >
          {!selectedConv ? (
            <div className="fm-empty">
              <div className="fm-empty-icon">
                <MessageCircle size={56} />
              </div>
              <div className="fm-empty-title">Select a conversation to start messaging</div>
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
                  onClick={() => setToast('Calling (demo)')}
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

