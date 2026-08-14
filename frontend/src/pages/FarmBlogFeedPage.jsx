import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Leaf, Search, ShoppingCart, ChevronDown, Eye, MessageCircle,
  Volume2, VolumeX, Play, Pause, X, User, ShoppingBasket, LogOut, Loader, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchAllFarmPosts, subscribeToFarmPosts } from '../services/farmBlogService';
import CropsBottomSheet from '../components/CropsBottomSheet';
import FarmerChatModal from '../components/FarmerChatModal';
import './FarmBlogFeedPage.css';

const CATEGORY_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'vegetables', label: 'Vegetables' },
  { id: 'fruits', label: 'Fruits' },
  { id: 'grains', label: 'Grains' },
  { id: 'tubers', label: 'Tubers' },
  { id: 'legumes', label: 'Legumes' }
];

// Single Post Card Component
function PostCard({ post, onOpenCrops, onOpenChat, globalMuted, setGlobalMuted }) {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const cardRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [playIconType, setPlayIconType] = useState('play');
  const [isExpanded, setIsExpanded] = useState(false);

  const mediaType = post.media_type || post.type || 'image';
  const mediaUrl = post.media_url || post.mediaUrl;
  const farmer = post.farmer || {};

  // IntersectionObserver for video autoplay
  useEffect(() => {
    if (mediaType !== 'video' || !videoRef.current || !cardRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = videoRef.current;
          if (!video) return;

          if (entry.intersectionRatio >= 0.8) {
            // Pause other videos
            document.querySelectorAll('video').forEach((v) => {
              if (v !== video) v.pause();
            });

            video.play().then(() => {
              setIsPlaying(true);
            }).catch(() => {});
          } else if (entry.intersectionRatio < 0.5) {
            video.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: [0.5, 0.8] }
    );

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [mediaType]);

  // Sync mute state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = globalMuted;
    }
  }, [globalMuted]);

  const togglePlayPause = () => {
    if (mediaType !== 'video' || !videoRef.current) return;
    const video = videoRef.current;

    if (video.paused) {
      document.querySelectorAll('video').forEach((v) => {
        if (v !== video) v.pause();
      });
      video.play();
      setIsPlaying(true);
      setPlayIconType('play');
    } else {
      video.pause();
      setIsPlaying(false);
      setPlayIconType('pause');
    }

    setShowPlayIcon(true);
    setTimeout(() => setShowPlayIcon(false), 800);
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    setGlobalMuted(!globalMuted);
  };

  const isLongCaption = post.caption && post.caption.length > 90;

  return (
    <div className="blog-post-card" ref={cardRef}>
      {/* ─── Media Section (Top 70%) ─── */}
      <div className="blog-media-section" onClick={togglePlayPause}>
        {mediaType === 'image' ? (
          <img
            src={mediaUrl}
            alt={post.caption || 'Farm post'}
            className="blog-media-content"
          />
        ) : (
          <video
            ref={videoRef}
            src={mediaUrl}
            className="blog-media-content"
            playsInline
            loop
            muted={globalMuted}
          />
        )}

        {/* Gradient dark overlay */}
        <div className="blog-media-overlay" />

        {/* Crop Category Chip */}
        <span className="blog-crop-chip">
          {post.crop_type || post.cropType || 'Crop'}
        </span>

        {/* Video mute/unmute toggle */}
        {mediaType === 'video' && (
          <button
            type="button"
            className="blog-mute-btn"
            onClick={toggleMute}
            aria-label={globalMuted ? 'Unmute video' : 'Mute video'}
          >
            {globalMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        )}

        {/* Play/Pause indicator */}
        {showPlayIcon && (
          <div className="blog-play-indicator">
            {playIconType === 'play' ? <Play size={48} fill="#ffffff" /> : <Pause size={48} fill="#ffffff" />}
          </div>
        )}
      </div>

      {/* ─── Bottom Info Section (Bottom 30%) ─── */}
      <div className="blog-info-section">
        {/* Row 1 — Farmer Identity */}
        <div className="blog-row-farmer">
          <div
            className="blog-farmer-clickable"
            onClick={() => navigate(`/farmers/${farmer.id || post.farmer_id || 'farmer-1'}`)}
          >
            <img
              src={farmer.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'}
              alt={farmer.name || farmer.farmName}
              className="blog-farmer-avatar"
            />
            <div className="blog-farmer-names">
              <span className="blog-farm-name">{farmer.farmName || 'Green Valley Farm'}</span>
              <span className="blog-farmer-meta">
                {farmer.location || 'Ghana'} • {post.time_ago || 'Recently'}
              </span>
            </div>
          </div>
        </div>

        {/* Row 2 — Caption */}
        <div className="blog-row-caption">
          <p className={`blog-caption-text ${isExpanded ? 'expanded' : 'truncated'}`}>
            {post.caption}
          </p>
          {isLongCaption && (
            <button
              type="button"
              className="blog-read-more-btn"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Show less' : '...Read more'}
            </button>
          )}
        </div>

        {/* Row 3 — Action Row */}
        <div className="blog-row-actions">
          <div className="blog-views-count" title="Times viewed">
            <Eye size={15} />
            <span>{(post.views || 120).toLocaleString()}</span>
          </div>

          <div className="blog-action-buttons">
            <button
              type="button"
              className="blog-btn-view-crops"
              onClick={() => onOpenCrops(farmer)}
            >
              View Crops
            </button>
            <button
              type="button"
              className="blog-btn-message"
              onClick={() => onOpenChat(farmer)}
            >
              Message Farmer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Farm Blog Feed Page Component ───
export default function FarmBlogFeedPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [globalMuted, setGlobalMuted] = useState(true);

  // Modals state
  const [selectedFarmerForCrops, setSelectedFarmerForCrops] = useState(null);
  const [selectedFarmerForChat, setSelectedFarmerForChat] = useState(null);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);

  // Persistent cart state
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('agrilink_cart') || '{}');
    } catch {
      return {};
    }
  });

  const avatarMenuRef = useRef(null);

  // Load real posts from service
  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const realPosts = await fetchAllFarmPosts();
      setPosts(realPosts);
    } catch (err) {
      console.error('Error fetching farm blog posts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();

    // Subscribe to Realtime DB updates
    const unsubscribe = subscribeToFarmPosts((updatedPosts) => {
      setPosts(updatedPosts);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [loadPosts]);

  // Close avatar dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target)) {
        setAvatarMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddToCart = (crop, quantityDelta = 1) => {
    setCart((prev) => {
      const current = prev[crop.id] || 0;
      const updatedQty = Math.max(0, current + quantityDelta);
      const newCart = { ...prev };
      if (updatedQty === 0) {
        delete newCart[crop.id];
      } else {
        newCart[crop.id] = updatedQty;
      }
      localStorage.setItem('agrilink_cart', JSON.stringify(newCart));
      return newCart;
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Filter real posts by category pill and search query
  const filteredPosts = posts.filter((post) => {
    const cropCat = (post.crop_type || post.cropType || '').toLowerCase();
    const matchesCategory = activeCategory === 'all' || cropCat === activeCategory.toLowerCase();

    const farmName = (post.farmer?.farmName || '').toLowerCase();
    const location = (post.farmer?.location || '').toLowerCase();
    const caption = (post.caption || '').toLowerCase();

    const matchesSearch =
      !searchQuery.trim() ||
      caption.includes(searchQuery.toLowerCase()) ||
      farmName.includes(searchQuery.toLowerCase()) ||
      location.includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const totalCartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  return (
    <div className="blog-feed-page">
      {/* ═══════════════════════ TOP NAVBAR ═══════════════════════ */}
      <header className="blog-navbar">
        <div className="blog-navbar-main">
          {/* Left Side: Logo */}
          <Link to="/" className="blog-logo">
            <img src="/favicon.jpg" alt="AgriLink Logo" style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'cover' }} />
            <span className="blog-logo-text">AgriLink</span>
          </Link>

          {/* Center: Two Tab Toggles */}
          <div className="blog-tabs-center">
            <Link to="/marketplace" className="blog-tab-btn inactive">
              <span>Marketplace</span>
            </Link>
            <Link to="/blog" className="blog-tab-btn active">
              <span>Farm Blog</span>
            </Link>
          </div>

          {/* Right Side: Search, Cart, Avatar */}
          <div className="blog-nav-right">
            {/* Search Input Box */}
            <div className="blog-search-wrapper">
              {showSearchInput ? (
                <div className="blog-search-input-box">
                  <Search size={16} className="blog-search-box-icon" />
                  <input
                    type="text"
                    placeholder="Search posts or farmers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  <button
                    className="blog-search-close"
                    onClick={() => {
                      setSearchQuery('');
                      setShowSearchInput(false);
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="blog-icon-btn"
                  onClick={() => setShowSearchInput(true)}
                  title="Search feed"
                >
                  <Search size={20} />
                </button>
              )}
            </div>

            {/* Cart Icon */}
            <Link
              to="/marketplace"
              className="blog-cart-btn"
              title="View Cart in Marketplace"
            >
              <ShoppingCart size={20} />
              {totalCartCount > 0 && (
                <span className="blog-cart-badge">{totalCartCount}</span>
              )}
            </Link>

            {/* Avatar Dropdown */}
            <div className="blog-avatar-wrapper" ref={avatarMenuRef}>
              <button
                type="button"
                className="blog-avatar-btn"
                onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
                aria-label="User menu"
              >
                <span className="blog-avatar-initials">
                  {user?.name
                    ? user.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
                    : 'NK'}
                </span>
                <ChevronDown size={14} className={`blog-chevron ${avatarMenuOpen ? 'open' : ''}`} />
              </button>

              {avatarMenuOpen && (
                <div className="blog-avatar-dropdown">
                  <div className="blog-dd-header">
                    <p className="blog-dd-name">{user?.name || 'Guest User'}</p>
                    <p className="blog-dd-email">{user?.email || 'buyer@agrilink.com'}</p>
                    <span className="blog-dd-role">
                      {user?.role === 'farmer' ? 'Farmer' : user?.role === 'admin' ? 'Admin' : 'AgriLink Buyer'}
                    </span>
                  </div>
                  <div className="blog-dd-divider" />
                  <Link to="/marketplace" className="blog-dd-item" onClick={() => setAvatarMenuOpen(false)}>
                    <ShoppingBasket size={16} />
                    <span>Marketplace</span>
                  </Link>
                  <div className="blog-dd-divider" />
                  <button type="button" className="blog-dd-item blog-dd-logout" onClick={handleLogout}>
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="blog-filters-row">
          {CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`blog-filter-pill ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </header>

      {/* ═══════════════════════ FEED CONTAINER ═══════════════════════ */}
      <main className="blog-feed-container">
        {loading ? (
          <div className="blog-empty-state">
            <Loader size={40} className="spin" color="#2D6A4F" />
            <p style={{ marginTop: 12, color: '#9ca3af' }}>Loading live farm updates...</p>
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="blog-feed-scroll">
            {filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onOpenCrops={(farmer) => setSelectedFarmerForCrops(farmer)}
                onOpenChat={(farmer) => setSelectedFarmerForChat(farmer)}
                globalMuted={globalMuted}
                setGlobalMuted={setGlobalMuted}
              />
            ))}
          </div>
        ) : (
          /* ═══════════════════════ EMPTY STATE ═══════════════════════ */
          <div className="blog-empty-state">
            <div className="blog-empty-illustration">
              <Leaf size={64} className="blog-empty-leaf-icon" />
            </div>
            <h2 className="blog-empty-title">No farm posts yet</h2>
            <p className="blog-empty-desc">
              Check back soon for updates from our farmers
            </p>
            {activeCategory !== 'all' && (
              <button
                type="button"
                className="blog-reset-filter-btn"
                onClick={() => {
                  setActiveCategory('all');
                  setSearchQuery('');
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </main>

      {/* ═══════════════════════ CROPS BOTTOM SHEET ═══════════════════════ */}
      <CropsBottomSheet
        farmer={selectedFarmerForCrops}
        open={Boolean(selectedFarmerForCrops)}
        onClose={() => setSelectedFarmerForCrops(null)}
        onAddToCart={handleAddToCart}
        cart={cart}
      />

      {/* ═══════════════════════ FARMER CHAT MODAL ═══════════════════════ */}
      <FarmerChatModal
        farmer={selectedFarmerForChat}
        open={Boolean(selectedFarmerForChat)}
        onClose={() => setSelectedFarmerForChat(null)}
        user={user}
      />
    </div>
  );
}
