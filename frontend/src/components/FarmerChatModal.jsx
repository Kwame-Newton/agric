import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Phone, ShieldCheck, CheckCheck } from 'lucide-react';
import {
  fetchMessagesBetweenUsers,
  sendMessage,
  subscribeToRealtimeMessages,
} from '../services/chatService';
import './FarmerChatModal.css';

export default function FarmerChatModal({ farmer, open, onClose, user }) {
  const [inputMsg, setInputMsg] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatBodyRef = useRef(null);

  const currentUserId = user?.id || 'buyer-demo-user';
  const currentUserName = user?.name || 'AgriLink Buyer';
  const farmerId = farmer?.id || farmer?.farmer_id || 'farmer-1';

  // Load chat history when modal opens
  useEffect(() => {
    if (!open || !farmer) return;

    let isMounted = true;
    setLoading(true);

    fetchMessagesBetweenUsers(currentUserId, farmerId).then((history) => {
      if (isMounted) {
        setMessages(history);
        setLoading(false);
      }
    });

    // Subscribe to realtime messages
    const unsubscribe = subscribeToRealtimeMessages(currentUserId, (newMsg) => {
      if (
        (newMsg.senderId === farmerId && newMsg.receiverId === currentUserId) ||
        (newMsg.senderId === currentUserId && newMsg.receiverId === farmerId)
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [open, farmer, currentUserId, farmerId]);

  // Auto scroll to bottom
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  if (!open || !farmer) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    const text = inputMsg.trim();
    if (!text) return;

    setInputMsg('');

    // Optimistically add message
    const tempId = `temp-${Date.now()}`;
    const newMsg = {
      id: tempId,
      side: 'sent',
      senderId: currentUserId,
      receiverId: farmerId,
      senderName: currentUserName,
      text: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMsg]);

    const sent = await sendMessage({
      senderId: currentUserId,
      receiverId: farmerId,
      senderName: currentUserName,
      receiverName: farmer.farmName || farmer.name || 'Farmer',
      text: text,
    });

    if (sent) {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, id: sent.id } : m))
      );
    }
  };

  return (
    <div className="chat-modal-overlay" onClick={onClose}>
      <div className="chat-modal-card" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="chat-modal-header">
          <div className="chat-farmer-info">
            <div className="chat-avatar-wrapper">
              <img src={farmer.avatar} alt={farmer.name} className="chat-farmer-avatar" />
              <span className="chat-online-dot" title="Online now" />
            </div>
            <div>
              <div className="chat-farmer-title-row">
                <h3 className="chat-farmer-name">{farmer.farmName}</h3>
                {farmer.verified && <ShieldCheck size={16} className="chat-verified-icon" />}
              </div>
              <p className="chat-farmer-sub">{farmer.name} • {farmer.location}</p>
            </div>
          </div>

          <div className="chat-header-actions">
            <a href={`tel:${farmer.phone}`} className="chat-phone-btn" title="Call Farmer">
              <Phone size={16} />
            </a>
            <button className="chat-close-btn" onClick={onClose} aria-label="Close Chat">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Message History */}
        <div className="chat-modal-body" ref={chatBodyRef}>
          <div className="chat-disclaimer">
            <span>Direct verified AgriLink farmer chat</span>
          </div>

          {messages.length === 0 ? (
            <div className="chat-empty-state" style={{ textAlign: 'center', padding: '2rem 1rem', color: '#6b7280', fontSize: '0.88rem' }}>
              No previous messages with {farmer.farmName || farmer.name || 'this farmer'}. Send a message to start chatting!
            </div>
          ) : (
            messages.map((msg) => {
              const isBuyer = msg.side === 'sent';
              const timeStr = msg.timestamp
                ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Just now';

              return (
                <div
                  key={msg.id}
                  className={`chat-bubble-row ${isBuyer ? 'chat-row-buyer' : 'chat-row-farmer'}`}
                >
                  {!isBuyer && (
                    <img src={farmer.avatar} alt={farmer.name} className="chat-bubble-avatar" />
                  )}
                  <div className={`chat-bubble ${isBuyer ? 'chat-bubble-buyer' : 'chat-bubble-farmer'}`}>
                    <p className="chat-bubble-text">{msg.text}</p>
                    <div className="chat-bubble-meta">
                      <span>{timeStr}</span>
                      {isBuyer && <CheckCheck size={14} className="chat-check" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Form */}
        <form className="chat-modal-footer" onSubmit={handleSend}>
          <input
            type="text"
            className="chat-input"
            placeholder={`Message ${farmer.name}...`}
            value={inputMsg}
            onChange={e => setInputMsg(e.target.value)}
          />
          <button type="submit" className="chat-send-btn" disabled={!inputMsg.trim()}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
