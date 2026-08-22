import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, ChevronDown, ShoppingCart, Star,
  MapPin, X, Filter, Leaf, Heart,
  Plus, Minus, Eye, User, Package, MessageCircle, LogOut,
  Trash2, CheckCircle2, ArrowRight, ShieldCheck, Truck, CreditCard, Clock, RefreshCw,
  Settings, Lock, Bell, AlertTriangle, CheckCircle, Loader2, Camera, Image as ImageIcon, BellRing
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import './MarketplacePage.css';

// ─── Visual Search Modal ───────────────────────────────────────────────────
function VisualSearchModal({ open, onClose, onSearchComplete }) {
  const [photoState, setPhotoState] = useState('idle'); // 'idle' | 'camera' | 'selected' | 'loading' | 'error'
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [errorDetails, setErrorDetails] = useState('');
  
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const stopLiveCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!open) {
      stopLiveCamera();
      setPhotoState('idle');
      setSelectedFile(null);
      setPreviewUrl('');
      setErrorDetails('');
    }
  }, [open, stopLiveCamera]);

  if (!open) return null;

  const startLiveCamera = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        setPhotoState('camera');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        streamRef.current = stream;
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }, 100);
      } catch (err) {
        console.warn('Camera access denied or unsupported, falling back to file picker:', err);
        cameraInputRef.current?.click();
      }
    } else {
      cameraInputRef.current?.click();
    }
  };

  const snapLivePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg');
    setPreviewUrl(dataUrl);
    stopLiveCamera();

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'camera-snap.jpg', { type: 'image/jpeg' });
        setSelectedFile(file);
        startAnalysis(file);
      } else {
        setPhotoState('error');
      }
    }, 'image/jpeg');
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    startAnalysis(file);
  };

  const startAnalysis = async (file) => {
    setPhotoState('loading');
    setErrorDetails('');

    try {
      // 1. Read file as Base64 for Google Cloud Vision API endpoint
      const reader = new FileReader();
      const base64Promise = new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
      const imageBase64 = await base64Promise;

      // 2. Call backend API POST /api/visual-search (Google Cloud Vision + Web Detection + Knowledge)
      const res = await fetch('http://localhost:4000/api/visual-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          imageName: file.name
        })
      });

      if (res.ok) {
        const data = await res.json();
        onSearchComplete(data);
        onClose();
        return;
      }

      // Backend returned an error response
      setErrorDetails('Backend returned an error. Please try again.');
      setPhotoState('error');
    } catch (err) {
      // Backend is offline or network error
      setErrorDetails('Cannot connect to AgriLink server. Make sure the backend is running on port 4000.');
      setPhotoState('error');
    }
  };

  return (
    <div className="vsm-overlay" onClick={() => { stopLiveCamera(); onClose(); }}>
      <div className="vsm-card" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        {/* Header */}
        <div className="vsm-header">
          <div>
            <h3 className="vsm-title">Search by Photo</h3>
            <p className="vsm-subtitle">
              Take or upload a photo of any crop and we will find it for you
            </p>
          </div>
          <button className="vsm-close-btn" onClick={() => { stopLiveCamera(); onClose(); }} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Hidden File Inputs */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={cameraInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <input
          type="file"
          accept="image/*"
          ref={galleryInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* IDLE STATE */}
        {photoState === 'idle' && (
          <div className="vsm-body">
            <div className="vsm-buttons-grid">
              <button
                className="vsm-btn vsm-btn-primary"
                onClick={startLiveCamera}
              >
                <Camera size={20} /> Take a Photo
              </button>
              <button
                className="vsm-btn vsm-btn-outline"
                onClick={() => galleryInputRef.current?.click()}
              >
                <ImageIcon size={20} /> Upload from Gallery
              </button>
            </div>
            <p className="vsm-tip-text">
              Works best with clear, well-lit photos of a single crop or vegetable
            </p>
          </div>
        )}

        {/* LIVE CAMERA VIEW */}
        {photoState === 'camera' && (
          <div className="vsm-body vsm-body-centered">
            <div className="vsm-preview-wrap" style={{ height: '240px', background: '#000000', position: 'relative' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div className="vsm-buttons-grid" style={{ marginTop: '0.75rem' }}>
              <button
                className="vsm-btn vsm-btn-primary"
                onClick={snapLivePhoto}
              >
                <Camera size={20} /> Snap Photo
              </button>
              <button
                className="vsm-btn vsm-btn-outline"
                onClick={() => { stopLiveCamera(); setPhotoState('idle'); }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* LOADING STATE */}
        {photoState === 'loading' && (
          <div className="vsm-body vsm-body-centered">
            <div className="vsm-preview-wrap">
              <img src={previewUrl} alt="Crop preview" className="vsm-preview-img" />
            </div>

            <button
              className="vsm-change-link"
              onClick={() => {
                stopLiveCamera();
                setPhotoState('idle');
                setSelectedFile(null);
                setPreviewUrl('');
              }}
            >
              Change Photo
            </button>

            <div className="vsm-loading-box">
              <div className="vsm-loading-status">
                <Leaf className="vsm-spin-leaf" size={20} />
                <span>Analysing your photo...</span>
              </div>
              <div className="vsm-progress-bar-track">
                <div className="vsm-progress-bar-fill" />
              </div>
            </div>
          </div>
        )}

        {/* ERROR STATE */}
        {photoState === 'error' && (
          <div className="vsm-body">
            <div className="vsm-error-box">
              <div className="vsm-error-title">
                <AlertTriangle size={20} /> {errorDetails || 'We could not identify this crop.'}
              </div>
              <div className="vsm-error-tips">
                <div style={{ fontWeight: 700, marginBottom: '0.4rem' }}>Tips:</div>
                <ul>
                  <li>Make sure the crop fills the frame</li>
                  <li>Use good lighting</li>
                  <li>Avoid blurry photos</li>
                </ul>
              </div>
              <div className="vsm-error-actions">
                <button
                  className="vsm-btn vsm-btn-primary"
                  onClick={() => {
                    stopLiveCamera();
                    setPhotoState('idle');
                    setSelectedFile(null);
                    setPreviewUrl('');
                  }}
                >
                  <RefreshCw size={16} /> Try Again
                </button>
                <button
                  className="vsm-btn vsm-btn-outline"
                  onClick={() => { stopLiveCamera(); onClose(); }}
                >
                  Search by text instead
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Notify Crop Modal ────────────────────────────────────────────────────
function NotifyCropModal({ cropName, open, onClose, onConfirm }) {
  if (!open) return null;
  return (
    <div className="vsm-overlay" onClick={onClose}>
      <div className="vsm-card" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
        <div className="vsm-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <BellRing size={22} color="#F4A261" />
            <h3 className="vsm-title">Crop Availability Alert</h3>
          </div>
          <button className="vsm-close-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="vsm-body">
          <p style={{ fontSize: '0.92rem', color: '#374151', lineHeight: 1.5, margin: '0 0 1.25rem 0' }}>
            We will notify you when <strong>{cropName}</strong> becomes available on AgriLink.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button className="vsm-btn vsm-btn-outline" style={{ flex: 1, height: '48px' }} onClick={onClose}>
              Cancel
            </button>
            <button className="vsm-btn vsm-btn-primary" style={{ flex: 1, height: '48px' }} onClick={onConfirm}>
              Yes, notify me
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Buyer Settings Modal ────────────────────────────────────────────────────
function BuyerSettingsModal({ user, onClose, onLogout }) {
  const [activeTab, setActiveTab] = useState('account');
  const [passwords, setPasswords] = useState({ newPw: '', confirmPw: '' });
  const [pwError, setPwError] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: 'success' });

  // Notification preferences (persisted to localStorage)
  const [notifs, setNotifs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('agrilink_notif_prefs') || '{"emailOrders":true,"emailPromos":false,"smsUpdates":false}'); }
    catch { return { emailOrders: true, emailPromos: false, smsUpdates: false }; }
  });

  // Delete account state
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3000);
  };

  const toggleNotif = (key) => {
    const updated = { ...notifs, [key]: !notifs[key] };
    setNotifs(updated);
    localStorage.setItem('agrilink_notif_prefs', JSON.stringify(updated));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    if (passwords.newPw.length < 6) { setPwError('Password must be at least 6 characters.'); return; }
    if (passwords.newPw !== passwords.confirmPw) { setPwError('Passwords do not match.'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwords.newPw });
      if (error) throw error;
      showToast('Password updated successfully.');
      setPasswords({ newPw: '', confirmPw: '' });
    } catch (err) {
      showToast(err.message || 'Failed to update password.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return;
    setDeleteLoading(true);
    try {
      // Hard-delete buyer data
      await supabase.from('orders').delete().eq('buyer_id', user.id);
      await supabase.from('buyers').delete().eq('id', user.id);
      await supabase.from('profiles').delete().eq('id', user.id);
      await onLogout();
    } catch (err) {
      showToast(err.message || 'Failed to delete account.', 'error');
      setDeleteLoading(false);
    }
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'danger', label: 'Delete', icon: AlertTriangle },
  ];

  return (
    <div className="bsm-overlay" onClick={onClose}>
      <div className="bsm-card" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        {/* Header */}
        <div className="bsm-header">
          <div>
            <div className="bsm-header-title">Account Settings</div>
            <div className="bsm-header-sub">Manage your buyer account</div>
          </div>
          <button className="bsm-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        {/* Tab Bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', overflowX: 'auto' }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isDanger = tab.id === 'danger';
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1, minWidth: 70, padding: '0.85rem 0.5rem', display: 'flex',
                  flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
                  fontSize: '0.78rem', fontWeight: 800,
                  color: isActive ? (isDanger ? '#dc2626' : '#2D6A4F') : '#9ca3af',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  borderBottom: isActive ? `2.5px solid ${isDanger ? '#dc2626' : '#2D6A4F'}` : '2.5px solid transparent',
                  transition: 'color 0.15s',
                }}
              >
                <Icon size={17} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="bsm-body">
          {/* Toast */}
          {toast.msg && (
            <div className={`bsm-toast bsm-toast-${toast.type}`}>
              {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
              {toast.msg}
            </div>
          )}

          {/* ── Account Tab ── */}
          {activeTab === 'account' && (
            <div>
              <div className="bsm-section-title">Account Info</div>
              <div className="bsm-info-row">
                <span className="bsm-info-label">Full Name</span>
                <span className="bsm-info-val">{user?.name || '—'}</span>
              </div>
              <div className="bsm-info-row">
                <span className="bsm-info-label">Email</span>
                <span className="bsm-info-val">{user?.email || '—'}</span>
              </div>
              <div className="bsm-info-row">
                <span className="bsm-info-label">Phone</span>
                <span className="bsm-info-val">{user?.phone || '—'}</span>
              </div>
              <div className="bsm-info-row">
                <span className="bsm-info-label">Role</span>
                <span className="bsm-info-val" style={{ textTransform: 'capitalize' }}>{user?.role || 'buyer'}</span>
              </div>
              <div className="bsm-info-row">
                <span className="bsm-info-label">Member Since</span>
                <span className="bsm-info-val">
                  {user?.loginTime ? new Date(user.loginTime).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : '—'}
                </span>
              </div>
            </div>
          )}

          {/* ── Password Tab ── */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword}>
              <div className="bsm-section-title">Change Password</div>
              <div className="bsm-field">
                <label className="bsm-label">New Password</label>
                <input
                  className="bsm-input"
                  type="password"
                  placeholder="Min. 6 characters"
                  value={passwords.newPw}
                  onChange={e => setPasswords(s => ({ ...s, newPw: e.target.value }))}
                  required
                  minLength={6}
                />
              </div>
              <div className="bsm-field">
                <label className="bsm-label">Confirm New Password</label>
                <input
                  className="bsm-input"
                  type="password"
                  placeholder="Repeat new password"
                  value={passwords.confirmPw}
                  onChange={e => setPasswords(s => ({ ...s, confirmPw: e.target.value }))}
                  required
                  minLength={6}
                />
              </div>
              {pwError && <div className="bsm-error"><AlertTriangle size={14} /> {pwError}</div>}
              <button
                type="submit"
                className="bsm-btn bsm-btn-primary"
                style={{ marginTop: '0.5rem', width: '100%' }}
                disabled={saving}
              >
                {saving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Lock size={15} />}
                Update Password
              </button>
            </form>
          )}

          {/* ── Notifications Tab ── */}
          {activeTab === 'notifications' && (
            <div>
              <div className="bsm-section-title">Notification Preferences</div>
              {[
                { key: 'emailOrders', label: 'Order Confirmations', sub: 'Get notified when your orders are confirmed' },
                { key: 'emailPromos', label: 'Promotions & Deals', sub: 'Receive weekly deals from farmers' },
                { key: 'smsUpdates', label: 'SMS Delivery Updates', sub: 'Text updates when your order is on the way' },
              ].map(n => (
                <div key={n.key} className="bsm-toggle-row">
                  <div>
                    <div className="bsm-toggle-label">{n.label}</div>
                    <div className="bsm-toggle-sub">{n.sub}</div>
                  </div>
                  <button
                    type="button"
                    className={`bsm-toggle-switch ${notifs[n.key] ? 'on' : ''}`}
                    onClick={() => toggleNotif(n.key)}
                    aria-label={`Toggle ${n.label}`}
                  >
                    <span className="bsm-toggle-knob" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ── Danger Zone Tab ── */}
          {activeTab === 'danger' && (
            <div>
              <div className="bsm-section-title">Danger Zone</div>
              <div className="bsm-danger-box">
                <div className="bsm-danger-title">
                  <AlertTriangle size={15} /> Delete Account
                </div>
                <div className="bsm-danger-desc">
                  Permanently delete your buyer account. All your order history and account data will be erased. This action cannot be undone.
                </div>
                {!showDelete ? (
                  <button
                    type="button"
                    className="bsm-btn bsm-btn-danger"
                    onClick={() => setShowDelete(true)}
                  >
                    Delete My Account
                  </button>
                ) : (
                  <div className="bsm-delete-confirm-row">
                    <div style={{ fontSize: '0.85rem', color: '#9b1c1c', fontWeight: 700 }}>
                      Type <strong>DELETE</strong> to confirm:
                    </div>
                    <input
                      className="bsm-input"
                      style={{ borderColor: 'rgba(220,38,38,0.4)' }}
                      placeholder="Type DELETE here"
                      value={deleteConfirm}
                      onChange={e => setDeleteConfirm(e.target.value)}
                    />
                    <div className="bsm-delete-actions">
                      <button
                        type="button"
                        className="bsm-btn bsm-btn-ghost"
                        onClick={() => { setShowDelete(false); setDeleteConfirm(''); }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="bsm-btn bsm-btn-danger"
                        disabled={deleteConfirm !== 'DELETE' || deleteLoading}
                        onClick={handleDeleteAccount}
                      >
                        {deleteLoading ? <Loader2 size={14} /> : null}
                        Confirm Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Mock Fallback Data ─────────────────────────────────────────────────────
const allProducts = [
  {
    id: 'demo-1', name: 'Fresh Tomatoes', farm: 'Green Valley Farms', location: 'Kumasi, Ashanti', farmer_id: 'farmer-1',
    price: 12, unit: 'kg', category: 'vegetables', rating: 4.8, reviews: 319,
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=70',
    inStock: true, badge: 'Best Seller', description: 'Fresh, organic greenhouse tomatoes harvested daily.'
  },
  {
    id: 'demo-2', name: 'Red Pepper', farm: 'Ama Organic Farm', location: 'Ejisu, Ashanti', farmer_id: 'farmer-2',
    price: 15, unit: 'kg', category: 'vegetables', rating: 4.7, reviews: 196,
    image: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=400&q=70',
    inStock: true, badge: '', description: 'Spicy, vibrant red peppers carefully sorted.'
  },
  {
    id: 'demo-3', name: 'Fresh Maize', farm: 'Happy Farm', location: 'Ejisu, Ashanti', farmer_id: 'farmer-3',
    price: 8, unit: 'kg', category: 'grains', rating: 4.4, reviews: 110,
    image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=400&q=70',
    inStock: true, badge: '', description: 'Sweet corn maize freshly harvested from Ejisu fields.'
  },
  {
    id: 'demo-4', name: 'Cassava', farm: 'Nkompong Farm', location: 'Kumasi, Ashanti', farmer_id: 'farmer-4',
    price: 6, unit: 'kg', category: 'tubers', rating: 4.5, reviews: 98,
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=70',
    inStock: true, badge: '', description: 'High-yield fresh cassava roots ideal for local markets.'
  },
];

const categories = [
  { id: 'all', label: 'All Categories' },
  { id: 'vegetables', label: 'Vegetables' },
  { id: 'fruits', label: 'Fruits' },
  { id: 'grains', label: 'Grains' },
  { id: 'tubers', label: 'Tubers' },
  { id: 'spices', label: 'Spices' },
];

const sortOptions = [
  { value: 'newest', label: 'Sort By: Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
function escapeSvgText(text) {
  return (text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function getCropFallbackImage(name) {
  const label = escapeSvgText(name || 'Crop');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2e7d32"/><stop offset="100%" stop-color="#66bb6a"/></linearGradient></defs><rect width="400" height="300" rx="32" fill="url(#g)"/><text x="50%" y="42%" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="74" fill="#ffffff">🍃</text><text x="50%" y="72%" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="28" fill="#e8f5e9">${label}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function Stars({ rating }) {
  return (
    <div className="mp-stars">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={13}
          className={i <= Math.round(rating) ? 'star-filled' : 'star-empty'}
        />
      ))}
      <span className="mp-rating-num">{rating}</span>
    </div>
  );
}

// ─── Product Card ──────────────────────────────────────────────────────────
function ProductCard({ product, cartQty, onAddToCart, onQuickView }) {
  const [wished, setWished] = useState(false);
  const [imageSrc, setImageSrc] = useState(product.image || getCropFallbackImage(product.name));

  useEffect(() => {
    setImageSrc(product.image || getCropFallbackImage(product.name));
  }, [product.image, product.name]);

  const handleImageError = () => {
    const fallback = getCropFallbackImage(product.name);
    if (imageSrc !== fallback) {
      setImageSrc(fallback);
    }
  };

  return (
    <div className={`mp-product-card ${!product.inStock ? 'out-of-stock' : ''}`}>
      <div className="mp-product-img-wrap">
        <img
          src={imageSrc}
          alt={product.name}
          className="mp-product-img"
          onError={handleImageError}
        />
        {product.badge && <span className="mp-product-badge">{product.badge}</span>}
        {!product.inStock && <div className="mp-out-of-stock-overlay">Out of Stock</div>}
        <button
          className={`mp-wish-btn ${wished ? 'wished' : ''}`}
          onClick={() => setWished(w => !w)}
          aria-label="Wishlist"
        >
          <Heart size={16} fill={wished ? '#e53935' : 'none'} />
        </button>
        <button className="mp-quick-view-btn" onClick={() => onQuickView(product)}>
          <Eye size={14} /> Quick View
        </button>
      </div>

      <div className="mp-product-body">
        <p className="mp-farm-name">{product.farm}</p>
        <h3 className="mp-product-name">{product.name}</h3>
        <div className="mp-product-location">
          <MapPin size={12} />
          <span>{product.location}</span>
        </div>
        <Stars rating={product.rating} />
        <div className="mp-product-footer">
          <div className="mp-product-price">
            ₵{product.price}<span className="mp-unit">/{product.unit}</span>
          </div>
          {product.inStock ? (
            cartQty > 0 ? (
              <div className="mp-qty-ctrl">
                <button onClick={() => onAddToCart(product, -1)}><Minus size={14} /></button>
                <span>{cartQty}</span>
                <button onClick={() => onAddToCart(product, 1)}><Plus size={14} /></button>
              </div>
            ) : (
              <button className="mp-add-btn" onClick={() => onAddToCart(product, 1)}>
                Add to Cart
              </button>
            )
          ) : (
            <button className="mp-add-btn mp-add-btn-disabled" disabled>
              Unavailable
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Quick View Modal ───────────────────────────────────────────────────────
function QuickViewModal({ product, open, onClose, cartQty, onAddToCart }) {
  if (!product || !open) return null;
  const imgSrc = product.image || getCropFallbackImage(product.name);

  return (
    <div className="mp-modal-overlay" onClick={onClose}>
      <div className="mp-modal-card" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '1rem', right: '1rem',
            background: '#f3f4f6', border: 'none', borderRadius: '50%',
            width: '34px', height: '34px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', zIndex: 10
          }}
        >
          <X size={18} color="#374151" />
        </button>

        <div className="mp-qv-grid">
          <div className="mp-qv-image-wrap">
            <img src={imgSrc} alt={product.name} className="mp-qv-image" onError={e => { e.target.src = getCropFallbackImage(product.name); }} />
          </div>

          <div className="mp-qv-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="bm-cat-chip" style={{ textTransform: 'capitalize' }}>{product.category}</span>
              {product.inStock
                ? <span style={{ fontSize: '0.75rem', color: '#2e7d32', fontWeight: 700, background: '#e8f5e9', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>In Stock</span>
                : <span style={{ fontSize: '0.75rem', color: '#c62828', fontWeight: 700, background: '#ffebee', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>Out of Stock</span>
              }
            </div>

            <h2 className="mp-qv-title">{product.name}</h2>

            <div className="mp-qv-farm">
              <Leaf size={15} />
              <span>{product.farm}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#6b7280', fontSize: '0.85rem' }}>
              <MapPin size={13} />
              <span>{product.location}</span>
            </div>

            <Stars rating={product.rating} />

            <div className="mp-qv-price">
              ₵{product.price} <span>/ {product.unit}</span>
            </div>

            <div className="mp-qv-desc">
              {product.description || `Fresh, farm-harvested ${product.name.toLowerCase()} sourced directly from ${product.farm} in ${product.location}.`}
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {product.inStock ? (
                cartQty > 0 ? (
                  <div className="mp-qty-ctrl" style={{ width: '140px', padding: '0.5rem' }}>
                    <button onClick={() => onAddToCart(product, -1)}><Minus size={16} /></button>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>{cartQty}</span>
                    <button onClick={() => onAddToCart(product, 1)}><Plus size={16} /></button>
                  </div>
                ) : (
                  <button
                    className="mp-checkout-btn"
                    style={{ margin: 0, flex: 1 }}
                    onClick={() => onAddToCart(product, 1)}
                  >
                    Add to Cart
                  </button>
                )
              ) : (
                <button className="mp-add-btn mp-add-btn-disabled" style={{ flex: 1 }} disabled>
                  Currently Out of Stock
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Cart Drawer & Checkout Flow ───────────────────────────────────────────
function CartDrawer({ open, onClose, cart, crops, onCartChange, onClearCart, user, onOrderPlaced }) {
  const [step, setStep] = useState('cart'); // 'cart' | 'checkout' | 'success'
  const [deliveryAddress, setDeliveryAddress] = useState(user?.profileDetails?.delivery_address || user?.location || 'Accra, Greater Accra');
  const [phone, setPhone] = useState(user?.phone || '+233 24 000 1122');
  const [deliveryMethod, setDeliveryMethod] = useState('farmer_deliver');
  const [paymentMethod, setPaymentMethod] = useState('momo');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastPlacedOrder, setLastPlacedOrder] = useState(null);

  if (!open) return null;

  // Build cart items array
  const cartItems = Object.entries(cart).map(([id, qty]) => {
    const crop = crops.find(c => String(c.id) === String(id));
    return crop ? { ...crop, qty } : null;
  }).filter(Boolean);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const deliveryFee = (subtotal > 0 && deliveryMethod !== 'farm_pickup') ? 15 : 0;
  const grandTotal = subtotal + deliveryFee;

  const handlePlaceOrder = async () => {
    if (!deliveryAddress.trim()) { alert('Please enter a delivery address.'); return; }
    if (!phone.trim()) { alert('Please enter a phone number.'); return; }

    setIsSubmitting(true);
    try {
      const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
      const orderNum = `#ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      const targetFarmerId = cartItems.find(i => i.farmer_id)?.farmer_id || user?.id || null;
      const validBuyerId = isUUID(user?.id) ? user.id : null;
      const validFarmerId = isUUID(targetFarmerId) ? targetFarmerId : null;
      const commissionRate = 0.05;
      const commissionAmount = Number((grandTotal * commissionRate).toFixed(2));
      const farmerAmount = Number((grandTotal - commissionAmount).toFixed(2));

      const orderItems = cartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        unit: item.unit,
        qty: item.qty,
        farm: item.farm,
        image: item.image,
        farmer_id: item.farmer_id || targetFarmerId,
      }));

      const newOrderObj = {
        id: `ord-${Date.now()}`,
        order_number: orderNum,
        buyer_id: validBuyerId || 'guest',
        farmer_id: validFarmerId || targetFarmerId,
        items: orderItems,
        total_amount: grandTotal,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        farmer_amount: farmerAmount,
        delivery_address: deliveryAddress,
        delivery_method: deliveryMethod,
        phone,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'cash' ? 'pending' : 'pending',
        escrow_status: paymentMethod === 'cash' ? 'pending' : 'pending',
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      // 1. If buyer chose Paystack Escrow (Mobile Money or Card), open Paystack Popup
      if (paymentMethod !== 'cash') {
        const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_b8e4dc35d57cdd8526f6641b42fc4a67cfdc8677';
        const reference = `AGR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const buyerEmail = (user?.email && user.email.includes('@')) ? user.email : 'buyer@agrilink.gh';
        const amountInPesewas = Math.max(100, Math.round(grandTotal * 100));

        const handlePaymentSuccess = (response) => {
          const paidRef = (response && response.reference) ? response.reference : reference;
          newOrderObj.paystack_reference = paidRef;
          newOrderObj.payment_status = 'paid';
          newOrderObj.escrow_status = 'held';
          newOrderObj.status = 'processing';

          // Notify backend of payment verification
          fetch(`http://localhost:4000/api/payments/verify/${encodeURIComponent(paidRef)}`).catch(() => {});

          // Save to Supabase orders table
          supabase.from('orders').insert({
            order_number: orderNum,
            buyer_id: validBuyerId,
            farmer_id: validFarmerId,
            items: orderItems,
            total_amount: grandTotal,
            commission_rate: commissionRate,
            commission_amount: commissionAmount,
            farmer_amount: farmerAmount,
            delivery_address: deliveryAddress,
            delivery_method: deliveryMethod,
            phone,
            payment_method: paymentMethod,
            payment_status: 'paid',
            escrow_status: 'held',
            status: 'processing',
            paystack_reference: paidRef,
          }).then(() => {}).catch(sbErr => console.warn('Supabase orders save note:', sbErr));

          // Save to localStorage
          const existing = JSON.parse(localStorage.getItem('agrilink_orders') || '[]');
          localStorage.setItem('agrilink_orders', JSON.stringify([newOrderObj, ...existing]));

          setLastPlacedOrder(newOrderObj);
          onClearCart();
          onOrderPlaced(newOrderObj);
          setStep('success');
          setIsSubmitting(false);
        };

        const handlePaymentClose = () => {
          setIsSubmitting(false);
        };

        const triggerPaystack = () => {
          if (window.PaystackPop) {
            try {
              // Compatibility for both Paystack inline v1 and popup v2
              if (typeof window.PaystackPop.setup === 'function') {
                const handler = window.PaystackPop.setup({
                  key: paystackKey,
                  email: buyerEmail,
                  amount: amountInPesewas,
                  currency: 'GHS',
                  ref: reference,
                  channels: ['mobile_money', 'card', 'bank', 'ussd', 'qr'],
                  metadata: {
                    custom_fields: [
                      { display_name: "Order Number", variable_name: "order_number", value: orderNum },
                      { display_name: "Delivery Phone", variable_name: "phone", value: phone },
                    ]
                  },
                  callback: function(res) {
                    handlePaymentSuccess(res);
                  },
                  onSuccess: function(res) {
                    handlePaymentSuccess(res);
                  },
                  onClose: function() {
                    handlePaymentClose();
                  },
                  onCancel: function() {
                    handlePaymentClose();
                  }
                });

                handler.openIframe();
                return true;
              } else {
                const paystack = new window.PaystackPop();
                paystack.newTransaction({
                  key: paystackKey,
                  email: buyerEmail,
                  amount: amountInPesewas,
                  currency: 'GHS',
                  ref: reference,
                  channels: ['mobile_money', 'card', 'bank', 'ussd', 'qr'],
                  onSuccess: function(res) {
                    handlePaymentSuccess(res);
                  },
                  onCancel: function() {
                    handlePaymentClose();
                  }
                });
                return true;
              }
            } catch (setupErr) {
              console.warn('Paystack setup error:', setupErr);
              return false;
            }
          }
          return false;
        };

        if (triggerPaystack()) {
          return;
        }

        // Dynamically load Paystack if not ready
        const script = document.createElement('script');
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.async = true;
        script.onload = () => {
          if (!triggerPaystack()) {
            setIsSubmitting(false);
            alert('Could not initialize Paystack popup.');
          }
        };
        script.onerror = () => {
          setIsSubmitting(false);
          alert('Could not load Paystack gateway. Please check your internet connection.');
        };
        document.body.appendChild(script);
        return;
      }

      // 2. Save to Supabase orders table (for Cash on Delivery)
      try {
        await supabase.from('orders').insert({
          order_number: orderNum,
          buyer_id: validBuyerId,
          farmer_id: validFarmerId,
          items: orderItems,
          total_amount: grandTotal,
          commission_rate: commissionRate,
          commission_amount: commissionAmount,
          farmer_amount: farmerAmount,
          delivery_address: deliveryAddress,
          delivery_method: deliveryMethod,
          phone,
          payment_method: paymentMethod,
          status: 'pending',
          payment_status: 'pending',
          escrow_status: 'pending',
        });
      } catch (insertErr) {
        console.warn('Supabase orders insert note:', insertErr);
      }

      // Also save to localStorage for permanent persistence
      const existing = JSON.parse(localStorage.getItem('agrilink_orders') || '[]');
      localStorage.setItem('agrilink_orders', JSON.stringify([newOrderObj, ...existing]));

      setLastPlacedOrder(newOrderObj);
      onClearCart();
      onOrderPlaced(newOrderObj);
      setStep('success');
    } catch (e) {
      console.error('Order placement error details:', e);
      alert(`Failed to place order: ${e.message || 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mp-modal-overlay" onClick={onClose} style={{ padding: 0 }}>
      <div className="mp-cart-drawer" onClick={e => e.stopPropagation()}>
        {/* Cart Header */}
        <div className="mp-cart-header">
          <div className="mp-cart-title">
            <ShoppingCart size={20} color="#1e5c3b" />
            <span>
              {step === 'cart' && 'Your Cart'}
              {step === 'checkout' && 'Checkout & Payment'}
              {step === 'success' && 'Order Confirmed!'}
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
            <X size={20} />
          </button>
        </div>

        {/* STEP 1: CART LIST */}
        {step === 'cart' && (
          <>
            <div className="mp-cart-body">
              {cartItems.length > 0 ? (
                cartItems.map(item => (
                  <div key={item.id} className="mp-cart-item">
                    <img
                      src={item.image || getCropFallbackImage(item.name)}
                      alt={item.name}
                      className="mp-cart-item-img"
                      onError={e => { e.target.src = getCropFallbackImage(item.name); }}
                    />
                    <div className="mp-cart-item-info">
                      <div className="mp-cart-item-name">{item.name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>From {item.farm}</div>
                      <div className="mp-cart-item-price">₵{item.price} /{item.unit}</div>
                    </div>
                    <div className="mp-qty-ctrl" style={{ padding: '0.2rem 0.4rem' }}>
                      <button onClick={() => onCartChange(item, -1)}><Minus size={13} /></button>
                      <span style={{ fontSize: '0.85rem' }}>{item.qty}</span>
                      <button onClick={() => onCartChange(item, 1)}><Plus size={13} /></button>
                    </div>
                    <button
                      onClick={() => onCartChange(item, -item.qty)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.25rem' }}
                      title="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#9ca3af' }}>
                  <ShoppingCart size={54} strokeWidth={1.2} style={{ marginBottom: '1rem' }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#374151' }}>Your cart is empty</h3>
                  <p style={{ fontSize: '0.85rem', marginTop: '0.4rem' }}>Add fresh crops from the marketplace to get started.</p>
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="mp-cart-footer">
                <div className="mp-cart-summary-line">
                  <span>Subtotal</span>
                  <span>₵{subtotal.toFixed(2)}</span>
                </div>
                <div className="mp-cart-summary-line">
                  <span>Delivery Fee</span>
                  <span>₵{deliveryFee.toFixed(2)}</span>
                </div>
                <div className="mp-cart-summary-line mp-cart-summary-total">
                  <span>Total Amount</span>
                  <span style={{ color: '#2e7d32' }}>₵{grandTotal.toFixed(2)}</span>
                </div>
                <button className="mp-checkout-btn" onClick={() => setStep('checkout')}>
                  Proceed to Checkout <ArrowRight size={16} style={{ display: 'inline', marginLeft: 4 }} />
                </button>
              </div>
            )}
          </>
        )}

        {/* STEP 2: CHECKOUT */}
        {step === 'checkout' && (
          <>
            <div className="mp-cart-body" style={{ gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.35rem' }}>
                  Delivery Address *
                </label>
                <input
                  type="text"
                  className="fm-input"
                  value={deliveryAddress}
                  onChange={e => setDeliveryAddress(e.target.value)}
                  placeholder="e.g. House No 12, Spintex Road, Accra"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.35rem' }}>
                  Phone Number for Delivery *
                </label>
                <input
                  type="tel"
                  className="fm-input"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+233 24 000 0000"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.5rem' }}>
                  Delivery Method *
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {[
                    {
                      id: 'farmer_deliver',
                      label: 'Farmer will deliver',
                      sub: '(coordinate via chat)',
                      icon: User,
                    },
                    {
                      id: 'farm_pickup',
                      label: 'I will pick up from farm',
                      sub: '',
                      icon: MapPin,
                    },
                    {
                      id: 'agrilink_partner',
                      label: 'Request AgriLink delivery partner',
                      sub: '(available in selected areas)',
                      icon: Truck,
                    },
                  ].map(dm => (
                    <label
                      key={dm.id}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                        padding: '0.75rem 1rem', borderRadius: '10px',
                        border: deliveryMethod === dm.id ? '2px solid #1e5c3b' : '1px solid #e5e7eb',
                        background: deliveryMethod === dm.id ? '#f0fdf4' : '#ffffff', cursor: 'pointer'
                      }}
                    >
                      <input
                        type="radio"
                        name="deliveryMethod"
                        checked={deliveryMethod === dm.id}
                        onChange={() => setDeliveryMethod(dm.id)}
                        style={{ marginTop: '0.2rem' }}
                      />
                      <dm.icon size={18} color={deliveryMethod === dm.id ? '#1e5c3b' : '#6b7280'} style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111827' }}>{dm.label}</div>
                        {dm.sub && <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '0.1rem' }}>{dm.sub}</div>}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.5rem' }}>
                  Payment Method (Protected by AgriLink Escrow) *
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {[
                    { id: 'momo', label: 'MTN Mobile Money / Telecel / AirtelTigo (Paystack Escrow)', badge: 'Recommended', icon: CreditCard },
                    { id: 'card', label: 'Debit / Credit Card (Paystack Escrow)', icon: ShieldCheck },
                    { id: 'cash', label: 'Cash on Delivery (Direct to Farmer)', icon: Truck },
                  ].map(pm => (
                    <label
                      key={pm.id}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0.75rem 1rem', borderRadius: '10px', border: paymentMethod === pm.id ? '2px solid #1e5c3b' : '1px solid #e5e7eb',
                        background: paymentMethod === pm.id ? '#f0fdf4' : '#ffffff', cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <input
                          type="radio"
                          name="pm"
                          checked={paymentMethod === pm.id}
                          onChange={() => setPaymentMethod(pm.id)}
                        />
                        <pm.icon size={18} color={paymentMethod === pm.id ? '#1e5c3b' : '#6b7280'} />
                        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#111827' }}>{pm.label}</span>
                      </div>
                      {pm.badge && (
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, background: '#dcfce7', color: '#15803d', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                          {pm.badge}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Escrow Guarantee Box */}
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '0.85rem 1rem', display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                <ShieldCheck size={20} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.82rem', color: '#065f46', lineHeight: 1.4 }}>
                  <strong>AgriLink 100% Escrow Protection:</strong> Your payment of <strong>GH₵ {grandTotal.toFixed(2)}</strong> is held in AgriLink's secure Paystack escrow. The farmer is paid only after you confirm receiving your fresh produce.
                </div>
              </div>

              <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '10px', border: '1px solid #f3f4f6' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', marginBottom: '0.4rem' }}>Order Summary</div>
                {cartItems.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#6b7280', marginBottom: '0.2rem' }}>
                    <span>{item.name} (x{item.qty})</span>
                    <span>₵{(item.price * item.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mp-cart-footer">
              <div className="mp-cart-summary-line mp-cart-summary-total">
                <span>Total Payment</span>
                <span style={{ color: '#2e7d32' }}>₵{grandTotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="fm-btn fm-btn-secondary"
                  onClick={() => setStep('cart')}
                  style={{ padding: '0.85rem 1.25rem' }}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="mp-checkout-btn"
                  style={{ margin: 0, flex: 1 }}
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Placing Order...' : `Confirm & Pay ₵${grandTotal.toFixed(2)}`}
                </button>
              </div>
            </div>
          </>
        )}

        {/* STEP 3: SUCCESS */}
        {step === 'success' && (
          <div className="mp-cart-body" style={{ textAlign: 'center', padding: '3rem 1.5rem', justifyContent: 'center' }}>
            <div style={{ width: '64px', height: '64px', background: '#e8f5e9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <CheckCircle2 size={38} color="#2e7d32" />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827' }}>Order Placed Successfully!</h2>
            <p style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '0.5rem' }}>
              Your order number is <strong style={{ color: '#1e5c3b' }}>{lastPlacedOrder?.order_number}</strong>. The farmer has been notified to prepare your shipment.
            </p>
            <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '12px', marginTop: '1.5rem', textAlign: 'left', fontSize: '0.85rem' }}>
              <div><strong>Delivery to:</strong> {deliveryAddress}</div>
              <div style={{ marginTop: '0.3rem' }}><strong>Payment:</strong> {paymentMethod.toUpperCase()} (₵{lastPlacedOrder?.total_amount?.toFixed(2)})</div>
              <div style={{ marginTop: '0.3rem' }}><strong>Estimated Delivery:</strong> Within 24-48 Hours</div>
            </div>
            <button
              className="mp-checkout-btn"
              style={{ marginTop: '2rem' }}
              onClick={() => { setStep('cart'); onClose(); }}
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function OrdersModal({ open, onClose, user, newOrders }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [confirmingId, setConfirmingId] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Get from localStorage
      const localOrders = JSON.parse(localStorage.getItem('agrilink_orders') || '[]');

      // 2. Get from Supabase
      let dbOrders = [];
      if (user?.id) {
        const { data } = await supabase
          .from('orders')
          .select('*')
          .eq('buyer_id', user.id)
          .order('created_at', { ascending: false });
        dbOrders = data || [];
      }

      // Merge unique orders
      const mergedMap = new Map();
      [...localOrders, ...dbOrders, ...newOrders].forEach(o => {
        if (o && o.order_number) mergedMap.set(o.order_number, o);
      });

      setOrders(Array.from(mergedMap.values()));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user?.id, newOrders]);

  useEffect(() => {
    if (open) loadOrders();
  }, [open, loadOrders]);

  const handleConfirmDelivery = async (order) => {
    const farmerPayout = order.farmer_amount || Number((Number(order.total_amount || 0) * 0.95).toFixed(2));
    const confirmMsg = `Have you received your order (${order.order_number}) in good condition?\n\nConfirming delivery will release GH₵ ${farmerPayout.toFixed(2)} from AgriLink Escrow directly to the farmer's Mobile Money account.`;
    
    if (!window.confirm(confirmMsg)) return;

    setConfirmingId(order.id || order.order_number);
    try {
      // Call backend API to release Paystack transfer
      const res = await fetch(`http://localhost:4000/api/orders/${order.id || order.order_number}/confirm`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await res.json();
      if (res.ok) {
        alert(result.message || `Delivery confirmed! GH₵ ${farmerPayout} released to the farmer.`);
      }
    } catch (apiErr) {
      console.warn('Backend escrow release warning (proceeding with local & supabase state):', apiErr);
    }

    // Update in Supabase
    try {
      if (order.id && !String(order.id).startsWith('ord-')) {
        await supabase
          .from('orders')
          .update({
            status: 'confirmed',
            escrow_status: 'released',
            confirmed_at: new Date().toISOString(),
          })
          .eq('id', order.id);
      }
    } catch (sbErr) {
      console.warn('Supabase update note:', sbErr);
    }

    // Update in LocalStorage & local state
    const localOrders = JSON.parse(localStorage.getItem('agrilink_orders') || '[]');
    const updated = localOrders.map(o => {
      if (o.id === order.id || o.order_number === order.order_number) {
        return {
          ...o,
          status: 'confirmed',
          escrow_status: 'released',
          confirmed_at: new Date().toISOString(),
        };
      }
      return o;
    });
    localStorage.setItem('agrilink_orders', JSON.stringify(updated));

    setOrders(prev => prev.map(o => {
      if (o.id === order.id || o.order_number === order.order_number) {
        return {
          ...o,
          status: 'confirmed',
          escrow_status: 'released',
          confirmed_at: new Date().toISOString(),
        };
      }
      return o;
    }));

    setConfirmingId(null);
  };

  if (!open) return null;

  const filteredOrders = orders.filter(o => {
    if (filter === 'all') return true;
    return (o.status || '').toLowerCase() === filter;
  });

  return (
    <div className="mp-modal-overlay" onClick={onClose}>
      <div className="mp-modal-card mp-orders-modal" onClick={e => e.stopPropagation()}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Package size={22} color="#1e5c3b" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', margin: 0 }}>My Marketplace Orders</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
            <X size={20} />
          </button>
        </div>

        {/* Filter Tabs */}
        <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: '0.5rem', background: '#f9fafb', flexWrap: 'wrap' }}>
          {['all', 'pending', 'processing', 'delivered', 'confirmed'].map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              style={{
                padding: '0.4rem 0.85rem', borderRadius: '8px', border: 'none',
                fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
                background: filter === t ? '#1e5c3b' : 'transparent',
                color: filter === t ? '#ffffff' : '#4b5563',
                textTransform: 'capitalize'
              }}
            >
              {t === 'confirmed' ? 'Completed' : t}
            </button>
          ))}
        </div>

        <div style={{ padding: '1.5rem', maxHeight: '65vh', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Loading orders...</div>
          ) : filteredOrders.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {filteredOrders.map(order => {
                const isDelivered = (order.status || '').toLowerCase() === 'delivered';
                const isConfirmed = (order.status || '').toLowerCase() === 'confirmed' || order.escrow_status === 'released';
                const isEscrowHeld = order.escrow_status === 'held' || order.payment_status === 'paid' || (!isConfirmed && !isDelivered && order.payment_method !== 'cash');
                const farmerPayout = order.farmer_amount || Number((Number(order.total_amount || 0) * 0.95).toFixed(2));

                return (
                  <div key={order.order_number || order.id} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.25rem', background: '#ffffff', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f3f4f6', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: '#1e5c3b' }}>{order.order_number || order.id}</span>
                        <span style={{ fontSize: '0.8rem', color: '#9ca3af', marginLeft: '0.75rem' }}>
                          {order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {isConfirmed ? (
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.6rem', borderRadius: '6px', background: '#dcfce7', color: '#15803d' }}>
                            ✓ Escrow Released
                          </span>
                        ) : isEscrowHeld ? (
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.6rem', borderRadius: '6px', background: '#e0f2fe', color: '#0369a1' }}>
                            🔒 Escrow Secured
                          </span>
                        ) : null}

                        <span style={{
                          textTransform: 'capitalize', fontSize: '0.78rem', fontWeight: 700,
                          padding: '0.25rem 0.6rem', borderRadius: '6px',
                          background: isConfirmed ? '#dcfce7' : isDelivered ? '#fef3c7' : '#f3f4f6',
                          color: isConfirmed ? '#15803d' : isDelivered ? '#b45309' : '#374151'
                        }}>
                          {order.status}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {(order.items || []).map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <img
                            src={item.image || getCropFallbackImage(item.name)}
                            alt={item.name}
                            style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover' }}
                            onError={e => { e.target.src = getCropFallbackImage(item.name); }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#111827' }}>{item.name}</div>
                            <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>From {item.farm || 'Farmer'} • ₵{item.price}/{item.unit || 'kg'}</div>
                          </div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Qty: {item.qty}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                        📍 {order.delivery_address}
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#2e7d32' }}>
                        Total: ₵{Number(order.total_amount || 0).toFixed(2)}
                      </div>
                    </div>

                    {/* ESCROW CONFIRMATION ACTION FOR DELIVERED ORDERS */}
                    {isDelivered && !isConfirmed && (
                      <div style={{
                        marginTop: '0.85rem',
                        padding: '0.85rem 1rem',
                        background: '#f0fdf4',
                        border: '1.5px solid #86efac',
                        borderRadius: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.6rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#166534', fontWeight: 700, fontSize: '0.88rem' }}>
                          <CheckCircle2 size={18} color="#16a34a" />
                          <span>Farmer has marked this order as Delivered</span>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#15803d', lineHeight: 1.4 }}>
                          Please inspect your produce. When confirmed, AgriLink will instantly disburse <strong>GH₵ {farmerPayout.toFixed(2)}</strong> to the farmer's Mobile Money wallet via Paystack.
                        </div>
                        <button
                          type="button"
                          onClick={() => handleConfirmDelivery(order)}
                          disabled={confirmingId === (order.id || order.order_number)}
                          style={{
                            background: '#16a34a',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.65rem 1.1rem',
                            fontWeight: 800,
                            fontSize: '0.88rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 2px 8px rgba(22,163,74,0.25)'
                          }}
                        >
                          {confirmingId === (order.id || order.order_number) ? (
                            <>
                              <Loader2 size={16} className="vsm-spin-leaf" /> Releasing Payout...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={16} /> Confirm Receipt & Release Payment (GH₵ {farmerPayout.toFixed(2)})
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
              <Package size={48} strokeWidth={1.2} style={{ marginBottom: '0.75rem' }} />
              <p style={{ fontWeight: 600 }}>No orders found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Marketplace Page ─────────────────────────────────────────────────
export default function MarketplacePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [location, setLocation] = useState('All Locations');
  const [priceRange, setPriceRange] = useState([0, 50]);
  const [sortBy, setSortBy] = useState('newest');
  const [cart, setCart] = useState({}); // { productId: qty }
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [placedOrdersList, setPlacedOrdersList] = useState([]);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Visual Search AI States
  const [isVisualSearchModalOpen, setIsVisualSearchModalOpen] = useState(false);
  const [visualSearchResult, setVisualSearchResult] = useState(null);
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [notifyCropName, setNotifyCropName] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const avatarMenuRef = useRef(null);

  const handleVisualSearchComplete = (resultData) => {
    const identifiedName = typeof resultData === 'string' ? resultData : resultData.identified;
    const matchTerm = (typeof resultData === 'object' && resultData.identifiedKey ? resultData.identifiedKey : identifiedName).toLowerCase();
    
    const matches = crops.filter(c => c.name.toLowerCase().includes(matchTerm) || c.category.toLowerCase().includes(matchTerm));
    const isFound = typeof resultData === 'object' && resultData.foundInMarketplace !== undefined
      ? resultData.foundInMarketplace
      : matches.length > 0;

    const knowledgeObj = typeof resultData === 'object' && resultData.knowledge
      ? resultData.knowledge
      : {
          name: identifiedName.charAt(0).toUpperCase() + identifiedName.slice(1),
          category: 'Agricultural Produce',
          description: `Identified crop via Lens AI visual search.`,
          healthBenefits: ['Rich in plant nutrients & vitamins', 'Supports dietary wellness'],
          uses: 'Used in fresh cooking, salads, and culinary recipes.',
          growingRegions: 'Local agricultural regions',
          similarCrops: ['Fresh Tomatoes', 'Red Pepper', 'Cabbage']
        };

    setVisualSearchResult({
      identified: knowledgeObj.name || identifiedName,
      found: isFound,
      count: matches.length,
      knowledge: knowledgeObj,
      similar: knowledgeObj.similarCrops || ['Cabbage', 'Garden Eggs', 'Lettuce']
    });

    setSearch(matchTerm);
  };

  const handleClearVisualSearch = () => {
    setVisualSearchResult(null);
    setSearch('');
  };

  const handleConfirmNotify = async () => {
    try {
      await supabase.from('crop_requests').insert({
        crop_name: notifyCropName,
        buyer_id: user?.id || null,
        buyer_email: user?.email || 'buyer@agrilink.com',
        created_at: new Date().toISOString()
      }).catch(() => {});
    } catch {}
    setNotifyModalOpen(false);
    setToastMessage(`We will notify you when ${notifyCropName} becomes available on AgriLink!`);
    setTimeout(() => setToastMessage(''), 4500);
  };

  // Fetch crops from Supabase on component mount
  useEffect(() => {
    const fetchCrops = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from('crops')
          .select(`
            id,
            name,
            category,
            description,
            price,
            unit,
            quantity,
            location,
            image_url,
            status,
            farmer_id,
            profiles:farmer_id ( full_name )
          `)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Marketplace fetch error:', error.message);
          setCrops(allProducts);
        } else if (data && data.length > 0) {
          const transformedCrops = data.map(crop => {
            const hasValidImage = crop.image_url && !crop.image_url.startsWith('blob:');
            return {
              id:          crop.id,
              name:        crop.name,
              farm:        crop.profiles?.full_name || 'Agrilink Farm',
              location:    crop.location || 'Accra',
              price:       Number(crop.price),
              unit:        crop.unit,
              category:    crop.category.toLowerCase(),
              rating:      4.8,
              reviews:     24,
              image:       hasValidImage ? crop.image_url : null,
              inStock:     Number(crop.quantity) > 0,
              badge:       '',
              description: crop.description || '',
              farmer_id:   crop.farmer_id,
            };
          });
          setCrops(transformedCrops);
        } else {
          setCrops(allProducts);
        }
      } catch (err) {
        console.error('Marketplace error:', err);
        setCrops(allProducts);
      } finally {
        setLoading(false);
      }
    };

    fetchCrops();
  }, []);

  // ─── Listen for Paystack Escrow Payment Callback ─────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('reference');
    const payment = params.get('payment');

    if (ref && (payment === 'callback' || payment === 'success')) {
      const verifyPaystack = async () => {
        try {
          const res = await fetch(`http://localhost:4000/api/payments/verify/${encodeURIComponent(ref)}`);
          const result = await res.json();

          if (result.success) {
            setToastMessage('Payment successful! Your funds are securely held in AgriLink Escrow.');
            setTimeout(() => setToastMessage(''), 5000);

            // Update local storage order
            const localOrders = JSON.parse(localStorage.getItem('agrilink_orders') || '[]');
            const updated = localOrders.map(o => {
              if (o.paystack_reference === ref || o.id === ref || o.order_number === ref) {
                return { ...o, payment_status: 'paid', escrow_status: 'held', status: 'processing' };
              }
              return o;
            });
            localStorage.setItem('agrilink_orders', JSON.stringify(updated));
            setIsOrdersOpen(true);
          }
        } catch (err) {
          console.warn('Paystack verification notice:', err);
        } finally {
          // Clean up the URL query parameters
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      };

      verifyPaystack();
    }
  }, []);

  const totalCartItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  useEffect(() => {
    const handleDocumentClick = (event) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(event.target)) {
        setAvatarMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleCartChange = (product, delta) => {
    setCart(prev => {
      const current = prev[product.id] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [product.id]: removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [product.id]: next };
    });
  };

  const filtered = useMemo(() => {
    let list = [...crops];
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.farm.toLowerCase().includes(search.toLowerCase()));
    if (selectedCategory !== 'all') list = list.filter(p => p.category === selectedCategory);
    list = list.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    if (location !== 'All Locations') list = list.filter(p => p.location.includes(location));
    switch (sortBy) {
      case 'price_asc': list.sort((a, b) => a.price - b.price); break;
      case 'price_desc': list.sort((a, b) => b.price - a.price); break;
      case 'rating': list.sort((a, b) => b.rating - a.rating); break;
      default: break;
    }
    return list;
  }, [search, selectedCategory, priceRange, location, sortBy, crops]);

  return (
    <div className="mp-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="vsm-toast-popup">
          <CheckCircle size={20} color="#2D6A4F" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Topbar */}
      <header className="mp-topbar">
        <div className="mp-topbar-inner">
          <Link to="/" className="mp-logo">
            <Leaf className="mp-logo-icon" />
            <span>AgriLink</span>
          </Link>

          {/* Center Tabs: Marketplace & Farm Blog */}
          <div className="mp-tabs-center">
            <Link to="/marketplace" className="mp-tab-link mp-tab-link-active">
              Marketplace
            </Link>
            <Link to="/blog" className="mp-tab-link">
              Farm Blog
            </Link>
          </div>

          {/* Search Bar + Visual Search Camera Button */}
          <div className="mp-search-container-wrap">
            <div className="mp-search-wrap">
              <Search className="mp-search-icon" size={18} />
              <input
                className="mp-search-input"
                placeholder="Search for crops, farmers, or products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button className="mp-search-clear" onClick={() => setSearch('')}>
                  <X size={16} />
                </button>
              )}
            </div>
            <button
              type="button"
              className="mp-camera-search-btn"
              onClick={() => setIsVisualSearchModalOpen(true)}
              title="Search by photo"
              aria-label="Search by photo"
            >
              <Camera size={19} color="#ffffff" />
            </button>
          </div>

          {/* Cart & User Avatar */}
          <div className="mp-topbar-right">
            <button className="mp-cart-btn" onClick={() => setIsCartOpen(true)}>
              <ShoppingCart size={20} />
              {totalCartItems > 0 && (
                <span className="mp-cart-badge">{totalCartItems}</span>
              )}
            </button>

            <div className="mp-user-menu-wrapper" ref={avatarMenuRef}>
              <button
                type="button"
                className="mp-topbar-avatar mp-topbar-avatar-button"
                onClick={() => setAvatarMenuOpen(open => !open)}
              >
                <span>{user?.name ? user.name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase() : 'NK'}</span>
                <ChevronDown size={14} />
              </button>

              {avatarMenuOpen && (
                <div className="mp-avatar-dropdown" role="menu">
                  <div className="mp-avatar-dropdown-header">
                    <div className="mp-avatar-dropdown-name">{user?.name || 'AgriLink Buyer'}</div>
                    <div className="mp-avatar-dropdown-email">{user?.email || 'buyer@agrilink.com'}</div>
                  </div>
                  <div className="mp-avatar-dropdown-divider" />
                  <button
                    type="button"
                    className="mp-avatar-dropdown-item"
                    onClick={() => { setAvatarMenuOpen(false); setIsOrdersOpen(true); }}
                  >
                    <Package size={18} className="mp-avatar-dropdown-item-icon" />
                    <span>My Orders</span>
                  </button>
                  <button
                    type="button"
                    className="mp-avatar-dropdown-item"
                    onClick={() => { setAvatarMenuOpen(false); setIsSettingsOpen(true); }}
                  >
                    <Settings size={18} className="mp-avatar-dropdown-item-icon" />
                    <span>Settings</span>
                  </button>
                  <button
                    type="button"
                    className="mp-avatar-dropdown-item mp-avatar-dropdown-logout"
                    onClick={handleLogout}
                  >
                    <LogOut size={18} className="mp-avatar-dropdown-item-icon mp-avatar-dropdown-item-icon-logout" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="mp-body">
        {/* Mobile filter bar */}
        <div className="mp-mobile-filter-bar">
          <h1 className="mp-page-title">Marketplace</h1>
          <button className="mp-mobile-filter-btn" onClick={() => setMobileFilterOpen(true)}>
            <Filter size={16} /> Filters
          </button>
        </div>

        {/* Mobile filter drawer */}
        {mobileFilterOpen && (
          <div className="mp-filter-overlay" onClick={() => setMobileFilterOpen(false)}>
            <div className="mp-filter-drawer" onClick={e => e.stopPropagation()}>
              <div className="mp-filter-drawer-header">
                <span>Filters</span>
                <button onClick={() => setMobileFilterOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                  <X size={20} />
                </button>
              </div>

              <div className="mp-sidebar-section">
                <h4 className="mp-sidebar-title">Categories</h4>
                <div className="mp-category-list">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      className={`mp-category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                      onClick={() => { setSelectedCategory(cat.id); setMobileFilterOpen(false); }}
                    >
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mp-sidebar-section">
                <h4 className="mp-sidebar-title">Price Range</h4>
                <div className="mp-price-display">
                  <span>₵{priceRange[0]}</span>
                  <span>₵{priceRange[1]}</span>
                </div>
                <input
                  type="range"
                  min={0} max={50}
                  value={priceRange[1]}
                  onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
                  className="mp-price-slider"
                />
              </div>

              <div className="mp-sidebar-section">
                <h4 className="mp-sidebar-title">Location</h4>
                <div className="mp-category-list">
                  {['All Locations', 'Accra', 'Kumasi', 'Ejisu', 'Obuasi', 'Mampong'].map(loc => (
                    <button
                      key={loc}
                      className={`mp-category-btn ${location === loc ? 'active' : ''}`}
                      onClick={() => { setLocation(loc); setMobileFilterOpen(false); }}
                    >
                      <MapPin size={14} />
                      <span>{loc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ padding: '1rem' }}>
                <button
                  className="mp-apply-btn"
                  onClick={() => setMobileFilterOpen(false)}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mp-content-wrap">
          {/* Sidebar Filters (desktop) */}
          <div className="mp-sidebar-wrap">
            <aside className="mp-sidebar">
              <div className="mp-sidebar-section">
                <h4 className="mp-sidebar-title">Categories</h4>
                <div className="mp-category-list">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      className={`mp-category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mp-sidebar-section">
                <h4 className="mp-sidebar-title">Price Range</h4>
                <div className="mp-price-display">
                  <span>₵{priceRange[0]}</span>
                  <span>₵{priceRange[1]}</span>
                </div>
                <input
                  type="range"
                  min={0} max={50}
                  value={priceRange[1]}
                  onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
                  className="mp-price-slider"
                />
              </div>

              <div className="mp-sidebar-section">
                <h4 className="mp-sidebar-title">Location</h4>
                <div className="mp-category-list">
                  {['All Locations', 'Accra', 'Kumasi', 'Ejisu', 'Obuasi', 'Mampong'].map(loc => (
                    <button
                      key={loc}
                      className={`mp-category-btn ${location === loc ? 'active' : ''}`}
                      onClick={() => setLocation(loc)}
                    >
                      <MapPin size={14} />
                      <span>{loc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          </div>

          {/* Products area */}
          <main className="mp-products-area">
            {/* Visual Search Results Banners */}
            {visualSearchResult && visualSearchResult.found && (
              <div className="vsm-banner vsm-banner-found">
                <div className="vsm-banner-text">
                  <span className="vsm-banner-icon">✅</span>
                  <div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#166534' }}>
                      We found: {visualSearchResult.identified}
                    </div>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.86rem', color: '#15803d' }}>
                      Showing {filtered.length} listing{filtered.length !== 1 ? 's' : ''} matching your photo.
                    </p>
                  </div>
                </div>
                <div className="vsm-banner-actions">
                  <button className="vsm-banner-btn vsm-banner-btn-secondary" onClick={handleClearVisualSearch}>
                    Clear
                  </button>
                  <button className="vsm-banner-btn vsm-banner-btn-primary" onClick={() => setIsVisualSearchModalOpen(true)}>
                    Try again 📷
                  </button>
                </div>

                {/* Crop Knowledge Card — Found in Marketplace */}
                {visualSearchResult.knowledge && (
                  <div className="vsm-knowledge-card">
                    <div className="vsm-knowledge-header">
                      <span className="vsm-knowledge-icon">🔬</span>
                      <div>
                        <div className="vsm-knowledge-title">{visualSearchResult.knowledge.name}</div>
                        <div className="vsm-knowledge-category">{visualSearchResult.knowledge.category}</div>
                      </div>
                    </div>
                    <p className="vsm-knowledge-desc">{visualSearchResult.knowledge.description}</p>

                    <div className="vsm-knowledge-grid">
                      <div className="vsm-knowledge-section">
                        <div className="vsm-knowledge-section-title">💚 Health Benefits</div>
                        <ul className="vsm-knowledge-list">
                          {(visualSearchResult.knowledge.healthBenefits || []).map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="vsm-knowledge-section">
                        <div className="vsm-knowledge-section-title">🍳 Common Uses</div>
                        <p className="vsm-knowledge-text">{visualSearchResult.knowledge.uses}</p>
                      </div>
                      <div className="vsm-knowledge-section">
                        <div className="vsm-knowledge-section-title">📍 Growing Regions</div>
                        <p className="vsm-knowledge-text">{visualSearchResult.knowledge.growingRegions}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {visualSearchResult && !visualSearchResult.found && (
              <div className="vsm-banner vsm-banner-not-found">
                <div className="vsm-banner-text">
                  <span className="vsm-banner-icon">🌱</span>
                  <div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#9a3412' }}>
                      We identified: {visualSearchResult.identified}
                    </div>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.88rem', color: '#c2410c' }}>
                      Not currently available on our marketplace — here's what we found from the internet:
                    </p>
                  </div>
                </div>

                {/* Crop Knowledge Card — Internet Info */}
                {visualSearchResult.knowledge && (
                  <div className="vsm-knowledge-card vsm-knowledge-card-orange">
                    <div className="vsm-knowledge-header">
                      <span className="vsm-knowledge-icon">🔬</span>
                      <div>
                        <div className="vsm-knowledge-title">{visualSearchResult.knowledge.name}</div>
                        <div className="vsm-knowledge-category">{visualSearchResult.knowledge.category}</div>
                      </div>
                    </div>
                    <p className="vsm-knowledge-desc">{visualSearchResult.knowledge.description}</p>

                    <div className="vsm-knowledge-grid">
                      <div className="vsm-knowledge-section">
                        <div className="vsm-knowledge-section-title">💚 Health Benefits</div>
                        <ul className="vsm-knowledge-list">
                          {(visualSearchResult.knowledge.healthBenefits || []).map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="vsm-knowledge-section">
                        <div className="vsm-knowledge-section-title">🍳 Common Uses</div>
                        <p className="vsm-knowledge-text">{visualSearchResult.knowledge.uses}</p>
                      </div>
                      <div className="vsm-knowledge-section">
                        <div className="vsm-knowledge-section-title">📍 Growing Regions</div>
                        <p className="vsm-knowledge-text">{visualSearchResult.knowledge.growingRegions}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ marginTop: '0.85rem', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <button
                    className="vsm-notify-btn"
                    onClick={() => {
                      setNotifyCropName(visualSearchResult.identified);
                      setNotifyModalOpen(true);
                    }}
                  >
                    <BellRing size={16} /> Notify me when available
                  </button>
                  <button className="vsm-banner-btn vsm-banner-btn-primary" onClick={() => setIsVisualSearchModalOpen(true)}>
                    Try again 📷
                  </button>
                  <button className="vsm-banner-btn vsm-banner-btn-secondary" onClick={handleClearVisualSearch}>
                    Clear
                  </button>
                </div>

                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(244, 162, 97, 0.4)' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#9a3412', marginBottom: '0.5rem' }}>
                    Similar crops you might like:
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {(visualSearchResult.similar || ['Cabbage', 'Garden Eggs', 'Lettuce']).map(crop => (
                      <button
                        key={crop}
                        className="vsm-similar-tag"
                        onClick={() => { handleClearVisualSearch(); setSearch(crop.toLowerCase()); }}
                      >
                        {crop}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="mp-toolbar">
              <div className="mp-results-count">
                <span className="mp-results-num">{filtered.length}</span> products found
                {selectedCategory !== 'all' && (
                  <span className="mp-active-filter">
                    {categories.find(c => c.id === selectedCategory)?.label}
                    <button onClick={() => setSelectedCategory('all')}><X size={12} /></button>
                  </span>
                )}
              </div>
              <select
                className="mp-sort-select"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Product Cards Grid */}
            <div className="mp-grid">
              {filtered.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  cartQty={cart[product.id] || 0}
                  onAddToCart={handleCartChange}
                  onQuickView={p => setQuickViewProduct(p)}
                />
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="mp-empty-state">
                <span className="mp-empty-icon">🌿</span>
                <h3>No crops match your filters</h3>
                <p>Try clearing your search or switching categories.</p>
                <button
                  className="mp-apply-btn"
                  style={{ width: 'auto', marginTop: '0.5rem', padding: '0.6rem 1.5rem' }}
                  onClick={() => { setSearch(''); setSelectedCategory('all'); setLocation('All Locations'); handleClearVisualSearch(); }}
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ── MODALS ── */}
      {/* Visual Search AI Modal */}
      <VisualSearchModal
        open={isVisualSearchModalOpen}
        onClose={() => setIsVisualSearchModalOpen(false)}
        onSearchComplete={handleVisualSearchComplete}
      />

      {/* Notify Crop Availability Modal */}
      <NotifyCropModal
        cropName={notifyCropName}
        open={notifyModalOpen}
        onClose={() => setNotifyModalOpen(false)}
        onConfirm={handleConfirmNotify}
      />

      {/* 1. Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        open={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        cartQty={quickViewProduct ? (cart[quickViewProduct.id] || 0) : 0}
        onAddToCart={handleCartChange}
      />

      {/* 2. Cart & Checkout Drawer */}
      <CartDrawer
        open={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        crops={crops}
        onCartChange={handleCartChange}
        onClearCart={() => setCart({})}
        user={user}
        onOrderPlaced={newOrder => setPlacedOrdersList(prev => [newOrder, ...prev])}
      />

      {/* 3. My Orders Modal */}
      <OrdersModal
        open={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
        user={user}
        newOrders={placedOrdersList}
      />

      {/* 4. Buyer Settings Modal */}
      {isSettingsOpen && (
        <BuyerSettingsModal
          user={user}
          onClose={() => setIsSettingsOpen(false)}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
