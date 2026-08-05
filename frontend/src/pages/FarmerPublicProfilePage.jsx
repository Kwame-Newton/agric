import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Leaf, MapPin, Star, Phone, MessageCircle, ShoppingCart,
  ShieldCheck, ArrowLeft, Check, Play, Pause, Eye
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchFarmerPosts, fetchFarmerProfile } from '../services/farmBlogService';
import FarmerChatModal from '../components/FarmerChatModal';
import './FarmerPublicProfilePage.css';

export default function FarmerPublicProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [farmer, setFarmer] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('crops'); // 'crops' | 'posts'
  const [chatOpen, setChatOpen] = useState(false);
  const [addedItems, setAddedItems] = useState({});
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('agrilink_cart') || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const loadData = async () => {
      // 1. Fetch Farmer Profile
      const foundFarmer = await fetchFarmerProfile(id);
      setFarmer(foundFarmer);

      // 2. Fetch Farmer Posts
      const farmerPosts = await fetchFarmerPosts(id);
      setPosts(farmerPosts);
    };

    loadData();
  }, [id]);

  const handleAddToCart = (crop) => {
    setCart(prev => {
      const nextQty = (prev[crop.id] || 0) + 1;
      const updated = { ...prev, [crop.id]: nextQty };
      localStorage.setItem('agrilink_cart', JSON.stringify(updated));
      return updated;
    });

    setAddedItems(prev => ({ ...prev, [crop.id]: true }));
    setTimeout(() => {
      setAddedItems(prev => ({ ...prev, [crop.id]: false }));
    }, 1500);
  };

  const totalCartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  if (!farmer) return <div className="fpp-loading">Loading farmer profile...</div>;

  return (
    <div className="fpp-page">
      {/* Top Navigation Bar */}
      <header className="fpp-navbar">
        <div className="fpp-nav-left">
          <button className="fpp-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} /> Back
          </button>
          <Link to="/" className="fpp-logo">
            <Leaf className="fpp-logo-icon" />
            <span>AgriLink</span>
          </Link>
        </div>

        <div className="fpp-nav-center">
          <div className="fpp-tab-toggles">
            <Link to="/marketplace" className="fpp-tab-btn inactive">
              <span>Marketplace</span>
            </Link>
            <Link to="/blog" className="fpp-tab-btn inactive">
              <span>Farm Blog</span>
            </Link>
          </div>
        </div>

        <div className="fpp-nav-right">
          <Link to="/marketplace" className="fpp-cart-btn" title="View Cart in Marketplace">
            <ShoppingCart size={20} />
            {totalCartCount > 0 && <span className="fpp-cart-badge">{totalCartCount}</span>}
          </Link>
        </div>
      </header>

      {/* Hero Banner Section */}
      <div className="fpp-hero">
        <div className="fpp-hero-bg" />
        <div className="fpp-hero-content">
          <div className="fpp-avatar-wrap">
            <img src={farmer.avatar} alt={farmer.name} className="fpp-avatar" />
            {farmer.verified && <ShieldCheck size={22} className="fpp-verified-badge" title="Verified Farmer" />}
          </div>

          <div className="fpp-profile-details">
            <div className="fpp-title-row">
              <h1 className="fpp-farm-name">{farmer.farmName}</h1>
            </div>
            <p className="fpp-farmer-name">Operated by <strong>{farmer.name}</strong></p>

            <div className="fpp-meta-tags">
              <span className="fpp-tag">
                <MapPin size={14} /> {farmer.location}
              </span>
              <span className="fpp-tag">
                <Star size={14} fill="#F4A261" color="#F4A261" /> {farmer.rating} ({farmer.reviewsCount} reviews)
              </span>
            </div>

            <p className="fpp-bio">{farmer.bio}</p>

            <div className="fpp-hero-actions">
              <button className="fpp-btn-chat" onClick={() => setChatOpen(true)}>
                <MessageCircle size={18} /> Message Farmer
              </button>
              <a href={`tel:${farmer.phone}`} className="fpp-btn-call">
                <Phone size={18} /> Call Farmer
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="fpp-tabs-container">
        <button
          className={`fpp-sub-tab ${activeTab === 'crops' ? 'active' : ''}`}
          onClick={() => setActiveTab('crops')}
        >
          Available Crops ({farmer.crops?.length || 0})
        </button>
        <button
          className={`fpp-sub-tab ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          Farm Feed Posts ({posts.length})
        </button>
      </div>

      {/* Content Section */}
      <main className="fpp-main-content">
        {activeTab === 'crops' ? (
          <div className="fpp-crops-grid">
            {farmer.crops && farmer.crops.length > 0 ? (
              farmer.crops.map((crop) => (
                <div key={crop.id} className="fpp-crop-card">
                  <div className="fpp-crop-img-wrap">
                    <img src={crop.image} alt={crop.name} className="fpp-crop-img" />
                    <span className="fpp-crop-cat-chip">{crop.category}</span>
                  </div>
                  <div className="fpp-crop-body">
                    <h3 className="fpp-crop-title">{crop.name}</h3>
                    <p className="fpp-crop-desc">{crop.description}</p>
                    <div className="fpp-crop-price-row">
                      <span className="fpp-crop-price">₵{crop.price} <small>/ {crop.unit}</small></span>
                      <button
                        className={`fpp-add-cart-btn ${addedItems[crop.id] ? 'added' : ''}`}
                        onClick={() => handleAddToCart(crop)}
                      >
                        {addedItems[crop.id] ? (
                          <>
                            <Check size={16} /> Added
                          </>
                        ) : (
                          <>
                            <ShoppingCart size={16} /> Add to Cart
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="fpp-empty">No crops listed for this farm yet.</div>
            )}
          </div>
        ) : (
          <div className="fpp-posts-grid">
            {posts.length > 0 ? (
              posts.map((post) => (
                <div key={post.id} className="fpp-post-card">
                  <div className="fpp-post-media-wrap">
                    {post.media_type === 'video' ? (
                      <video src={post.media_url} poster={post.poster_image} className="fpp-post-media" controls />
                    ) : (
                      <img src={post.media_url} alt="Farm post" className="fpp-post-media" />
                    )}
                    <span className="fpp-media-badge">
                      {post.media_type === 'video' ? 'Video' : 'Photo'}
                    </span>
                  </div>
                  <div className="fpp-post-info">
                    <div className="fpp-post-time"><Eye size={14} /> {post.views} views • {post.time_ago}</div>
                    <p className="fpp-post-caption">{post.caption}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="fpp-empty">No farm feed posts shared by this farmer yet.</div>
            )}
          </div>
        )}
      </main>

      {/* Interactive Chat Modal */}
      <FarmerChatModal
        farmer={farmer}
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        user={user}
      />
    </div>
  );
}
