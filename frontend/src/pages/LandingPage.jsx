import React from 'react';
import { 
  UserCheck, 
  UploadCloud, 
  ShoppingBag, 
  TrendingUp, 
  Search, 
  Eye, 
  MessageSquare, 
  Truck, 
  Users, 
  CheckCircle,
  ShieldCheck,
  ChevronRight,
  Star
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section id="home" className="hero-section">
        <div className="container hero-container">
          <div className="hero-content">
            <h1 className="heading-xl hero-title">
              From Farm to <br />
              <span className="text-highlight">Table — Directly</span>
            </h1>
            <p className="hero-subtitle">
              Buy fresh produce directly from farmers. Sell your harvest without middlemen. Experience transparency, freshness, and better pricing.
            </p>
            <div className="hero-actions">
              <a href="/register?role=farmer" className="btn btn-primary btn-hero">
                I am a Farmer
              </a>
              <a href="/register?role=buyer" className="btn btn-secondary btn-hero">
                I am a Buyer
              </a>
            </div>
          </div>
          
          <div className="hero-image-container">
            <div className="hero-image-wrapper">
              <img 
                src="https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&q=80&w=800" 
                alt="Farmers with fresh harvest" 
                className="hero-image"
              />
              <div className="hero-badge badge-farmers">
                <Users className="badge-icon" />
                <div>
                  <div className="badge-title">500+ Verified Farmers</div>
                  <div className="badge-desc">Across all regions</div>
                </div>
              </div>
              <div className="hero-badge badge-rating">
                <Star className="badge-icon star-icon" />
                <div>
                  <div className="badge-title">4.9/5 Rating</div>
                  <div className="badge-desc">From 2,000+ Buyers</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container stats-container">
          <div className="stat-card">
            <span className="stat-number">500+</span>
            <span className="stat-label">Farmers</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-card">
            <span className="stat-number">10,000+</span>
            <span className="stat-label">Crops Listed</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-card">
            <span className="stat-number">2,000+</span>
            <span className="stat-label">Orders Delivered</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-card">
            <span className="stat-number">98%</span>
            <span className="stat-label">Happy Customers</span>
          </div>
        </div>
      </section>

      {/* Featured Crops Section */}
      <section id="featured-crops" className="featured-crops-section">
        <div className="container">
          <div className="section-header">
            <h2 className="heading-lg">Featured Crops</h2>
            <p className="section-subtitle">A small preview of what’s available right now</p>
          </div>

          <div className="featured-crops-grid">
            {[
              {
                id: 'tomatoes',
                name: 'Fresh Tomatoes',
                price: '₵12',
                image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=70',
                cta: '/register',
              },
              {
                id: 'pepper',
                name: 'Red Pepper',
                price: '₵15',
                image: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=800&q=70',
                cta: '/register',
              },
              {
                id: 'maize',
                name: 'Fresh Maize',
                price: '₵8',
                image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=70',
                cta: '/register',
              },
              {
                id: 'cassava',
                name: 'Cassava',
                price: '₵6',
                image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=70',
                cta: '/register',
              },
            ].map((crop) => (
              <div key={crop.id} className="featured-crop-card">
                <div className="featured-crop-img-wrap">
                  <img
                    src={crop.image}
                    alt={crop.name}
                    className="featured-crop-img"
                    onError={(e) => {
                      e.target.onerror = null;
                      const emoji = crop.name.includes('Tomat') ? '🍅' : crop.name.includes('Pepper') ? '🌶️' : crop.name.includes('Maize') ? '🌽' : '🥔';
                      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2D6A4F"/><stop offset="100%" stop-color="#52B788"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/><text x="50%" y="45%" text-anchor="middle" font-size="72">${emoji}</text><text x="50%" y="75%" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="24" fill="#ffffff">${crop.name}</text></svg>`;
                      e.target.src = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
                    }}
                  />
                </div>
                <div className="featured-crop-body">
                  <div className="featured-crop-name">{crop.name}</div>
                  <div className="featured-crop-price">
                    <span className="featured-crop-price-value">{crop.price}</span>
                    <span className="featured-crop-price-unit">/kg</span>
                  </div>

                  <div className="featured-crop-actions">
                    <a href={crop.cta} className="btn btn-primary featured-crop-btn">
                      View on Marketplace
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works-section section-bg">
        <div className="container">
          <div className="section-header">
            <h2 className="heading-lg">How It Works</h2>
            <p className="section-subtitle">Connecting local farmers directly with buyers in a few simple steps</p>
          </div>

          <div className="how-it-works-grid">
            {/* For Farmers */}
            <div className="how-column">
              <h3 className="column-title farmer-theme">For Farmers</h3>
              <div className="steps-list">
                <div className="step-item">
                  <div className="step-icon-wrapper farmer-theme">
                    <UserCheck className="step-icon" />
                  </div>
                  <div>
                    <h4 className="step-title">1. Create Profile</h4>
                    <p className="step-desc">Set up your farm profile, list details, and get verified in minutes.</p>
                  </div>
                </div>
                <div className="step-item">
                  <div className="step-icon-wrapper farmer-theme">
                    <UploadCloud className="step-icon" />
                  </div>
                  <div>
                    <h4 className="step-title">2. Upload Crops</h4>
                    <p className="step-desc">List your fresh harvest with photos, pricing, and available quantity.</p>
                  </div>
                </div>
                <div className="step-item">
                  <div className="step-icon-wrapper farmer-theme">
                    <ShoppingBag className="step-icon" />
                  </div>
                  <div>
                    <h4 className="step-title">3. Receive Orders</h4>
                    <p className="step-desc">Get direct orders and messages from buyers in your local area.</p>
                  </div>
                </div>
                <div className="step-item">
                  <div className="step-icon-wrapper farmer-theme">
                    <TrendingUp className="step-icon" />
                  </div>
                  <div>
                    <h4 className="step-title">4. Earn More</h4>
                    <p className="step-desc">Keep 100% of your selling price with zero middleman commissions.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Central Circle Image */}
            <div className="how-center-illustration">
              <div className="circle-bg">
                <img 
                  src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400" 
                  alt="Fresh vegetables basket" 
                  className="circle-image"
                />
              </div>
            </div>

            {/* For Buyers */}
            <div className="how-column">
              <h3 className="column-title buyer-theme">For Buyers</h3>
              <div className="steps-list">
                <div className="step-item">
                  <div className="step-icon-wrapper buyer-theme">
                    <Search className="step-icon" />
                  </div>
                  <div>
                    <h4 className="step-title">1. Browse Crops</h4>
                    <p className="step-desc">Explore a wide variety of fresh, organic produce listed near you.</p>
                  </div>
                </div>
                <div className="step-item">
                  <div className="step-icon-wrapper buyer-theme">
                    <Eye className="step-icon" />
                  </div>
                  <div>
                    <h4 className="step-title">2. View Farmers</h4>
                    <p className="step-desc">Check farm locations, verified reviews, and farm updates.</p>
                  </div>
                </div>
                <div className="step-item">
                  <div className="step-icon-wrapper buyer-theme">
                    <MessageSquare className="step-icon" />
                  </div>
                  <div>
                    <h4 className="step-title">3. Chat & Order</h4>
                    <p className="step-desc">Message farmers directly to negotiate, customize, and place orders.</p>
                  </div>
                </div>
                <div className="step-item">
                  <div className="step-icon-wrapper buyer-theme">
                    <Truck className="step-icon" />
                  </div>
                  <div>
                    <h4 className="step-title">4. Get Fresh Produce</h4>
                    <p className="step-desc">Enjoy fresh produce delivered straight to your door or pick it up.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section (for Navbar #about anchor) */}
      <section id="about" className="section-bg" style={{ paddingTop: '3.5rem', paddingBottom: '3.5rem' }}>
        <div className="container">
          <div className="section-header">
            <h2 className="heading-lg">About AgriLink</h2>
            <p className="section-subtitle">
              AgriLink connects farmers and buyers directly—so you get fresh produce, fair pricing, and reliable delivery.
            </p>
          </div>

          <div className="grid grid-3" style={{ marginTop: '2rem' }}>
            <div className="card hover-lift feature-card">
              <div className="feature-icon-wrapper" style={{ width: 64, height: 64 }}>
                <ShieldCheck className="feature-icon" />
              </div>
              <h3 className="feature-title">Trust First</h3>
              <p className="feature-desc">Verification and transparent information help buyers choose with confidence.</p>
            </div>

            <div className="card hover-lift feature-card">
              <div className="feature-icon-wrapper" style={{ width: 64, height: 64 }}>
                <MessageSquare className="feature-icon" />
              </div>
              <h3 className="feature-title">Talk Directly</h3>
              <p className="feature-desc">Message farmers, confirm details, and place orders without middlemen.</p>
            </div>

            <div className="card hover-lift feature-card">
              <div className="feature-icon-wrapper" style={{ width: 64, height: 64 }}>
                <Truck className="feature-icon" />
              </div>
              <h3 className="feature-title">Delivery That Works</h3>
              <p className="feature-desc">Keep logistics simple and get fresh produce delivered when it matters.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="heading-lg">Why Choose AgriLink?</h2>
            <p className="section-subtitle">We build trust and efficiency in the agricultural supply chain</p>
          </div>

          <div className="grid grid-3">
            <div className="card hover-lift feature-card">
              <div className="feature-icon-wrapper">
                <ShieldCheck className="feature-icon" />
              </div>
              <h3 className="feature-title">Verified Farmers</h3>
              <p className="feature-desc">Every farmer on our platform goes through a strict verification process to ensure quality and authenticity.</p>
            </div>
            
            <div className="card hover-lift feature-card">
              <div className="feature-icon-wrapper">
                <MessageSquare className="feature-icon" />
              </div>
              <h3 className="feature-title">Direct Communication</h3>
              <p className="feature-desc">Chat directly with farmers to ask about farming practices, negotiate prices, or arrange custom logistics.</p>
            </div>

            <div className="card hover-lift feature-card">
              <div className="feature-icon-wrapper">
                <CheckCircle className="feature-icon" />
              </div>
              <h3 className="feature-title">100% Transparent</h3>
              <p className="feature-desc">No hidden fees, no markup. Buyers see the exact price set by the farmers, fostering fair trade.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="cta-section">
        <div className="container cta-container">
          <div className="cta-box">
            <h2 className="heading-lg cta-title">Ready to support local agriculture?</h2>
            <p className="cta-desc">Join AgriLink today to buy fresh or sell your farm harvest. Join our growing community.</p>
            <div className="cta-buttons">
              <a href="/register" className="btn btn-primary btn-cta">
                Get Started Now <ChevronRight size={18} />
              </a>
              <a href="#how-it-works" className="btn btn-secondary btn-cta">
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <div className="logo footer-logo">
              <span>AgriLink</span>
            </div>
            <p className="footer-text">Empowering farmers, connecting communities, and delivering freshness directly to your home.</p>
          </div>
          <div>
            <h4 className="footer-title">Quick Links</h4>
            <ul className="footer-links">
              <li><a href="#home">Home</a></li>
              <li><a href="#about">About</a></li>
              <li><a href="#how-it-works">How It Works</a></li>
              <li><a href="#features">Features</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-title">Contact Us</h4>
            <p className="footer-text">Email: support@agrilink.com</p>
            <p className="footer-text">Phone: +233 24 123 4567</p>
            <p className="footer-text">Location: Kumasi, Ghana</p>
          </div>
        </div>
        <div className="container footer-bottom">
          <p>&copy; {new Date().getFullYear()} AgriLink. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
