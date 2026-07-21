import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, SlidersHorizontal, ShoppingCart, Star,
  MapPin, ChevronDown, X, Filter, Leaf, Heart,
  Plus, Minus, Eye
} from 'lucide-react';

// ─── Mock Product Data ─────────────────────────────────────────────────────
const allProducts = [
  {
    id: 1, name: 'Fresh Tomatoes', farm: 'Green Valley Farms', location: 'Kumasi, Ashanti',
    price: 12, unit: 'kg', category: 'vegetables', rating: 4.8, reviews: 319,
    image: 'https://images.unsplash.com/photo-1592921870789-04563d55041c?auto=format&fit=crop&w=400&q=70',
    inStock: true, badge: 'Best Seller',
  },
  {
    id: 2, name: 'Red Pepper', farm: 'Ama Organic Farm', location: 'Ejisu, Ashanti',
    price: 15, unit: 'kg', category: 'vegetables', rating: 4.7, reviews: 196,
    image: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=400&q=70',
    inStock: true, badge: '',
  },
  {
    id: 3, name: 'Fresh Maize', farm: 'Happy Farm', location: 'Ejisu, Ashanti',
    price: 8, unit: 'kg', category: 'grains', rating: 4.4, reviews: 110,
    image: 'https://images.unsplash.com/photo-1601593346740-925612772716?auto=format&fit=crop&w=400&q=70',
    inStock: true, badge: '',
  },
  {
    id: 4, name: 'Cassava', farm: 'Nkompong Farm', location: 'Kumasi, Ashanti',
    price: 6, unit: 'kg', category: 'tubers', rating: 4.5, reviews: 98,
    image: 'https://images.unsplash.com/photo-1631207558636-d24c18bcfd6e?auto=format&fit=crop&w=400&q=70',
    inStock: true, badge: '',
  },
  {
    id: 5, name: 'Garden Eggs', farm: 'Nature\'s Gift Farm', location: 'Obuasi, Ashanti',
    price: 10, unit: 'kg', category: 'vegetables', rating: 4.6, reviews: 84,
    image: 'https://images.unsplash.com/photo-1615484477778-ca3b77940c25?auto=format&fit=crop&w=400&q=70',
    inStock: true, badge: 'Organic',
  },
  {
    id: 6, name: 'Ripe Plantain', farm: 'Obuasi Farms', location: 'Obuasi, Ashanti',
    price: 9, unit: 'kg', category: 'fruits', rating: 4.8, reviews: 152,
    image: 'https://images.unsplash.com/photo-1481349518771-20055b2a7b24?auto=format&fit=crop&w=400&q=70',
    inStock: true, badge: '',
  },
  {
    id: 7, name: 'Adom Pepper', farm: 'Adom Farms', location: 'Mampong, Ashanti',
    price: 18, unit: 'kg', category: 'spices', rating: 4.8, reviews: 66,
    image: 'https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?auto=format&fit=crop&w=400&q=70',
    inStock: false, badge: 'Hot Deal',
  },
  {
    id: 8, name: 'Sweet Potatoes', farm: 'Green Valley Farms', location: 'Kumasi, Ashanti',
    price: 7, unit: 'kg', category: 'tubers', rating: 4.3, reviews: 45,
    image: 'https://images.unsplash.com/photo-1596097388983-eef2f3c0d5b4?auto=format&fit=crop&w=400&q=70',
    inStock: true, badge: '',
  },
  {
    id: 9, name: 'Fresh Cabbage', farm: 'Ama Organic Farm', location: 'Ejisu, Ashanti',
    price: 5, unit: 'kg', category: 'vegetables', rating: 4.6, reviews: 73,
    image: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?auto=format&fit=crop&w=400&q=70',
    inStock: true, badge: 'Fresh',
  },
  {
    id: 10, name: 'Orange', farm: 'Nature\'s Gift Farm', location: 'Obuasi, Ashanti',
    price: 11, unit: 'kg', category: 'fruits', rating: 4.9, reviews: 201,
    image: 'https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=400&q=70',
    inStock: true, badge: 'Best Seller',
  },
  {
    id: 11, name: 'Brown Rice', farm: 'Happy Farm', location: 'Ejisu, Ashanti',
    price: 14, unit: 'kg', category: 'grains', rating: 4.5, reviews: 88,
    image: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=400&q=70',
    inStock: true, badge: 'Organic',
  },
  {
    id: 12, name: 'Ginger Root', farm: 'Adom Farms', location: 'Mampong, Ashanti',
    price: 22, unit: 'kg', category: 'spices', rating: 4.7, reviews: 57,
    image: 'https://images.unsplash.com/photo-1604514628550-37477afdf4e3?auto=format&fit=crop&w=400&q=70',
    inStock: true, badge: '',
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

// ─── Star Rating Component ─────────────────────────────────────────────────
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
function ProductCard({ product, cartQty, onAddToCart }) {
  const [wished, setWished] = useState(false);

  return (
    <div className={`mp-product-card ${!product.inStock ? 'out-of-stock' : ''}`}>
      <div className="mp-product-img-wrap">
        <img src={product.image} alt={product.name} className="mp-product-img" />
        {product.badge && <span className="mp-product-badge">{product.badge}</span>}
        {!product.inStock && <div className="mp-out-of-stock-overlay">Out of Stock</div>}
        <button
          className={`mp-wish-btn ${wished ? 'wished' : ''}`}
          onClick={() => setWished(w => !w)}
          aria-label="Wishlist"
        >
          <Heart size={16} fill={wished ? '#e53935' : 'none'} />
        </button>
        <button className="mp-quick-view-btn">
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

// ─── Main Marketplace Page ─────────────────────────────────────────────────
export default function MarketplacePage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [location, setLocation] = useState('All Locations');
  const [priceRange, setPriceRange] = useState([0, 50]);
  const [sortBy, setSortBy] = useState('newest');
  const [cart, setCart] = useState({}); // { productId: qty }
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Total cart items count
  const totalCartItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  const handleCartChange = (product, delta) => {
    setCart(prev => {
      const current = prev[product.id] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [product.id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [product.id]: next };
    });
  };

  const filtered = useMemo(() => {
    let list = [...allProducts];
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
  }, [search, selectedCategory, priceRange, location, sortBy]);

  const FilterSidebar = () => (
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
        <button
          className="mp-apply-btn"
          onClick={() => {}}
        >
          Apply Filters
        </button>
      </div>

      <div className="mp-sidebar-section">
        <h4 className="mp-sidebar-title">Location</h4>
        <div className="mp-category-list">
          {['All Locations', 'Kumasi', 'Ejisu', 'Obuasi', 'Mampong'].map(loc => (
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
  );

  return (
    <div className="mp-page">
      {/* ── Topbar ── */}
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

          {/* Cart & User */}
          <div className="mp-topbar-right">
            <button className="mp-cart-btn">
              <ShoppingCart size={20} />
              {totalCartItems > 0 && (
                <span className="mp-cart-badge">{totalCartItems}</span>
              )}
            </button>
            <div className="mp-topbar-avatar">NK</div>
          </div>
        </div>
      </header>

      <div className="mp-body">
        {/* Mobile filter toggle */}
        <div className="mp-mobile-filter-bar">
          <h1 className="mp-page-title">Marketplace</h1>
          <button
            className="mp-mobile-filter-btn"
            onClick={() => setMobileFiltersOpen(true)}
          >
            <Filter size={16} /> Filters
          </button>
        </div>

        {/* Mobile filter drawer overlay */}
        {mobileFiltersOpen && (
          <div className="mp-filter-overlay" onClick={() => setMobileFiltersOpen(false)}>
            <div className="mp-filter-drawer" onClick={e => e.stopPropagation()}>
              <div className="mp-filter-drawer-header">
                <h3>Filters</h3>
                <button onClick={() => setMobileFiltersOpen(false)}><X size={20} /></button>
              </div>
              <FilterSidebar />
            </div>
          </div>
        )}

        <div className="mp-content-wrap">
          {/* Desktop Sidebar */}
          <div className="mp-sidebar-wrap">
            <FilterSidebar />
          </div>

          {/* Product Grid Area */}
          <main className="mp-products-area">
            {/* Toolbar */}
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

            {/* Product Grid */}
            {filtered.length > 0 ? (
              <div className="mp-grid">
                {filtered.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    cartQty={cart[product.id] || 0}
                    onAddToCart={handleCartChange}
                  />
                ))}
              </div>
            ) : (
              <div className="mp-empty-state">
                <div className="mp-empty-icon">🌾</div>
                <h3>No products found</h3>
                <p>Try adjusting your filters or search term</p>
                <button
                  className="btn btn-primary"
                  onClick={() => { setSearch(''); setSelectedCategory('all'); setPriceRange([0, 50]); }}
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Floating Cart Summary */}
      {totalCartItems > 0 && (
        <div className="mp-cart-float">
          <div className="mp-cart-float-left">
            <ShoppingCart size={20} />
            <span>{totalCartItems} item{totalCartItems > 1 ? 's' : ''} in cart</span>
          </div>
          <button className="mp-cart-float-btn">
            View Cart →
          </button>
        </div>
      )}

      {/* Marketplace Logout Bottom */}
      <div className="mp-bottom-logout-wrap">
        <button
          type="button"
          className="mp-bottom-logout-btn"
          onClick={() => {
            // delegate to existing navbar logout behavior via navigation.
            // In this demo app, we simply go home; real logout is handled in Navbar.
            // (If you want real logout here, we can wire useAuth().logout.)
            window.location.href = '/';
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

