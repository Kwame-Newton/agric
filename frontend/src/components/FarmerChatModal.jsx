import React, { useState } from 'react';
import { X, Send, Phone, ShieldCheck, CheckCheck } from 'lucide-react';
import './FarmerChatModal.css';

export default function FarmerChatModal({ farmer, open, onClose, user }) {
  const [inputMsg, setInputMsg] = useState('');
  const [messages, setMessages] = useState(() => [
    {
      id: 1,
      sender: 'farmer',
      text: `Hello! Welcome to ${farmer?.farmName || 'our farm'}. How can I assist you with crop orders or deliveries today?`,
      time: 'Just now'
    }
  ]);

  if (!open || !farmer) return null;

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: 'buyer',
      text: inputMsg.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    setInputMsg('');

    // Simulate farmer reply
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'farmer',
          text: `Thank you for contacting ${farmer.farmName}! I received your message: "${newMsg.text}". I can prepare fresh harvest for you right away. Feel free to add items to your cart or ask for bulk pricing!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 1200);
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
        <div className="chat-modal-body">
          <div className="chat-disclaimer">
            <span>Direct verified AgriLink farmer chat</span>
          </div>

          {messages.map(msg => (
            <div
              key={msg.id}
              className={`chat-bubble-row ${msg.sender === 'buyer' ? 'chat-row-buyer' : 'chat-row-farmer'}`}
            >
              {msg.sender === 'farmer' && (
                <img src={farmer.avatar} alt={farmer.name} className="chat-bubble-avatar" />
              )}
              <div className={`chat-bubble ${msg.sender === 'buyer' ? 'chat-bubble-buyer' : 'chat-bubble-farmer'}`}>
                <p className="chat-bubble-text">{msg.text}</p>
                <div className="chat-bubble-meta">
                  <span>{msg.time}</span>
                  {msg.sender === 'buyer' && <CheckCheck size={14} className="chat-check" />}
                </div>
              </div>
            </div>
          ))}
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
