import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, ChevronDown, ShoppingCart, Star,
  MapPin, X, Filter, Leaf, Heart,
  Plus, Minus, Eye, User, Package, MessageCircle, LogOut,
  Trash2, CheckCircle2, ArrowRight, ShieldCheck, Truck, CreditCard, Clock, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import './MarketplacePage.css';

// ─── Mock Fallback Data ─────────────────────────────────────────────────────
const allProducts = [
  {
    id: 'demo-1', name: 'Fresh Tomatoes', farm: 'Green Valley Farms', location: 'Kumasi, Ashanti',
    price: 12, unit: 'kg', category: 'vegetables', rating: 4.8, reviews: 319,
    image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=400&q=70',
    inStock: true, badge: 'Best Seller', description: 'Fresh, organic greenhouse tomatoes harvested daily.'
  },
  {
    id: 'demo-2', name: 'Red Pepper', farm: 'Ama Organic Farm', location: 'Ejisu, Ashanti',
    price: 15, unit: 'kg', category: 'vegetables', rating: 4.7, reviews: 196,
    image: 'https://images.unsplash.com/photo-1562967916-eb82221dfb35?auto=format&fit=crop&w=400&q=70',
    inStock: true, badge: '', description: 'Spicy, vibrant red peppers carefully sorted.'
  },
  {
    id: 'demo-3', name: 'Fresh Maize', farm: 'Happy Farm', location: 'Ejisu, Ashanti',
    price: 8, unit: 'kg', category: 'grains', rating: 4.4, reviews: 110,
    image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=400&q=70',
    inStock: true, badge: '', description: 'Sweet corn maize freshly harvested from Ejisu fields.'
  },
  {
    id: 'demo-4', name: 'Cassava', farm: 'Nkompong Farm', location: 'Kumasi, Ashanti',
    price: 6, unit: 'kg', category: 'tubers', rating: 4.5, reviews: 98,
    image: 'https://images.unsplash.com/photo-1524592412331-4fe04e37381d?auto=format&fit=crop&w=400&q=70',
    inStock: true, badge: '', description: 'High-yield fresh cassava roots ideal for local markets.'
  },
];

const categories = [
  { id: 'all', label: 'All Categories', icon: '🛒' },
  { id: 'vegetables', label: 'Vegetables', icon: '🥦' },
  { id: 'fruits', label: 'Fruits', icon: '🍊' },
  { id: 'grains', label: 'Grains', icon: '🌾' },
  { id: 'tubers', label: 'Tubers', icon: '🥔' },
  { id: 'spices', label: 'Spices', icon: '🌶️' },
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
  const deliveryFee = subtotal > 0 ? 15 : 0;
  const grandTotal = subtotal + deliveryFee;

  const handlePlaceOrder = async () => {
    if (!deliveryAddress.trim()) { alert('Please enter a delivery address.'); return; }
    if (!phone.trim()) { alert('Please enter a phone number.'); return; }

    setIsSubmitting(true);
    try {
      const orderNum = `#ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      const orderItems = cartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        unit: item.unit,
        qty: item.qty,
        farm: item.farm,
        image: item.image,
      }));

      const newOrderObj = {
        id: `ord-${Date.now()}`,
        order_number: orderNum,
        buyer_id: user?.id || 'guest',
        farmer_id: cartItems[0]?.farmer_id || null,
        items: orderItems,
        total_amount: grandTotal,
        delivery_address: deliveryAddress,
        phone,
        payment_method: paymentMethod,
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      // Try saving to Supabase orders table
      try {
        await supabase.from('orders').insert({
          order_number: orderNum,
          buyer_id: user?.id,
          farmer_id: cartItems[0]?.farmer_id || null,
          items: orderItems,
          total_amount: grandTotal,
          delivery_address: deliveryAddress,
          phone,
          payment_method: paymentMethod,
          status: 'pending',
        });
      } catch (err) {
        console.warn('Supabase orders save error:', err);
      }

      // Also save to localStorage for permanent persistence
      const existing = JSON.parse(localStorage.getItem('agrilink_orders') || '[]');
      localStorage.setItem('agrilink_orders', JSON.stringify([newOrderObj, ...existing]));

      setLastPlacedOrder(newOrderObj);
      onClearCart();
      onOrderPlaced(newOrderObj);
      setStep('success');
    } catch (e) {
      console.error(e);
      alert('Failed to place order. Please try again.');
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
                  Payment Method *
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {[
                    { id: 'momo', label: 'MTN Mobile Money / Telecel Cash', icon: CreditCard },
                    { id: 'cash', label: 'Cash on Delivery', icon: Truck },
                    { id: 'card', label: 'Credit / Debit Card', icon: ShieldCheck },
                  ].map(pm => (
                    <label
                      key={pm.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.75rem 1rem', borderRadius: '10px', border: paymentMethod === pm.id ? '2px solid #1e5c3b' : '1px solid #e5e7eb',
                        background: paymentMethod === pm.id ? '#f0fdf4' : '#ffffff', cursor: 'pointer'
                      }}
                    >
                      <input
                        type="radio"
                        name="pm"
                        checked={paymentMethod === pm.id}
                        onChange={() => setPaymentMethod(pm.id)}
                      />
                      <pm.icon size={18} color={paymentMethod === pm.id ? '#1e5c3b' : '#6b7280'} />
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111827' }}>{pm.label}</span>
                    </label>
                  ))}
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

// ─── Buyer Orders Modal ─────────────────────────────────────────────────────
function OrdersModal({ open, onClose, user, newOrders }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

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

  if (!open) return null;

  const filteredOrders = orders.filter(o => {
    if (filter === 'all') return true;
    return o.status === filter;
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
        <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: '0.5rem', background: '#f9fafb' }}>
          {['all', 'pending', 'processing', 'delivered'].map(t => (
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
              {t}
            </button>
          ))}
        </div>

        <div style={{ padding: '1.5rem', maxHeight: '65vh', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>Loading orders...</div>
          ) : filteredOrders.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredOrders.map(order => (
                <div key={order.order_number} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.25rem', background: '#ffffff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
                    <div>
                      <span style={{ fontWeight: 800, fontSize: '1rem', color: '#1e5c3b' }}>{order.order_number}</span>
                      <span style={{ fontSize: '0.8rem', color: '#9ca3af', marginLeft: '0.75rem' }}>
                        {order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                      </span>
                    </div>
                    <span style={{
                      textTransform: 'capitalize', fontSize: '0.78rem', fontWeight: 700,
                      padding: '0.25rem 0.6rem', borderRadius: '6px',
                      background: order.status === 'delivered' ? '#e8f5e9' : '#fff3e0',
                      color: order.status === 'delivered' ? '#2e7d32' : '#e65100'
                    }}>
                      {order.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {(order.items || []).map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img
                          src={item.image || getCropFallbackImage(item.name)}
                          alt={item.name}
                          style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }}
                          onError={e => { e.target.src = getCropFallbackImage(item.name); }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#111827' }}>{item.name}</div>
                          <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>From {item.farm} • ₵{item.price}/{item.unit}</div>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Qty: {item.qty}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                      📍 {order.delivery_address}
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#2e7d32' }}>
                      Total: ₵{Number(order.total_amount || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
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
  const [placedOrdersList, setPlacedOrdersList] = useState([]);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const avatarMenuRef = useRef(null);

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
      {/* Topbar */}
      <header className="mp-topbar">
        <div className="mp-topbar-inner">
          <Link to="/" className="mp-logo">
            <Leaf className="mp-logo-icon" />
            <span>AgriLink</span>
          </Link>

          {/* Search */}
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
                  onClick={() => { setSearch(''); setSelectedCategory('all'); setLocation('All Locations'); }}
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ── MODALS ── */}
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
    </div>
  );
}
