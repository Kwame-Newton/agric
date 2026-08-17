import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Leaf, Lock, Mail, User, Phone, CheckSquare, ShieldCheck, MapPin } from 'lucide-react';
import GoogleAuthModal from '../components/GoogleAuthModal';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [role, setRole] = useState('buyer'); // 'buyer' or 'farmer'
  
  // Shared fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Farmer specific fields
  const [farmName, setFarmName] = useState('');
  const [farmLocation, setFarmLocation] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [primaryCategory, setPrimaryCategory] = useState('vegetables');
  const [idType, setIdType] = useState('national');
  const [idNumber, setIdNumber] = useState('');
  const [farmBio, setFarmBio] = useState('');

  // Buyer specific fields
  const [buyerType, setBuyerType] = useState('individual');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('momo');

  const [isPendingVerification, setIsPendingVerification] = useState(false);
  const [verificationType, setVerificationType] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { register, user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate(user.role === 'farmer' ? '/dashboard' : '/marketplace');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (!agreeTerms) {
      setError("You must agree to the terms and privacy policy");
      return;
    }
    
    setIsLoading(true);

    // Construct registration data
    const regData = {
      fullName,
      email,
      phone,
      password,
      role,
      ...(role === 'farmer' && { farmName, farmLocation, farmSize, primaryCategory, idType, idNumber, farmBio }),
      ...(role === 'buyer' && { buyerType, deliveryAddress, paymentMethod }),
    };

    // Register and handle confirmation email alert
    const result = await register(regData);
    
    if (result.success) {
      console.log('Registration successful:', result);
      setVerificationType(role === 'farmer' ? 'adminVerification' : 'emailConfirmation');
      setIsPendingVerification(true);
      setIsLoading(false);
    } else {
      setError(result.error || 'Registration failed');
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = (selectedEmail) => {
    setEmail(selectedEmail);
    const namePart = selectedEmail.split('@')[0];
    const formattedName = namePart
      .split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
    setFullName(formattedName);
    alert(`Autofilled with Google Account: ${selectedEmail}. Please review details and complete registration.`);
  };

  return (
    <div className="auth-page">
      {/* Back to Home Button */}
      <Link to="/" className="back-home-btn">
        <ArrowLeft size={18} />
        <span>Back to Home</span>
      </Link>

      <div className="auth-container">
        {/* Left Side: Image Panel (Visible on Desktop) */}
        <div className="auth-image-panel">
          <div className="auth-image-overlay"></div>
          <img 
            src={role === 'farmer' 
              ? "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&q=80&w=800"
              : "https://images.unsplash.com/photo-1506485338023-6ce5f36692df?auto=format&fit=crop&q=80&w=800"
            } 
            alt="Agricultural background" 
            className="auth-bg-image"
          />
          <div className="auth-image-content">
            <Link to="/" className="auth-logo">
              <Leaf className="logo-icon" />
              <span>AgriLink</span>
            </Link>
            <h2 className="auth-image-title">
              {role === 'farmer' 
                ? "Join as a Producer and gain direct marketplace access." 
                : "Create a Buyer account and enjoy fresh local farm produce."
              }
            </h2>
            <p className="auth-image-desc">
              Make fair trade the new normal. Supporting local farming community with transparent supply chains.
            </p>
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="auth-form-panel">
          <div className="auth-form-wrapper register-wrapper">
            {isPendingVerification ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1.25rem' }}>
                <div style={{
                  width: '72px',
                  height: '72px',
                  background: 'rgba(46, 125, 50, 0.12)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  color: '#2e7d32',
                  boxShadow: '0 8px 24px rgba(46, 125, 50, 0.15)'
                }}>
                  <Mail size={38} />
                </div>

                <h2 className="heading-md" style={{ marginBottom: '0.75rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                  Account Created Successfully!
                </h2>

                <div style={{
                  background: '#f0fdf4',
                  border: '1.5px solid #86efac',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  marginBottom: '1.5rem',
                  textAlign: 'left'
                }}>
                  <p style={{ color: '#166534', fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={20} color="#16a34a" /> Confirmation Email Sent
                  </p>
                  <p style={{ color: '#1e293b', fontSize: '0.92rem', lineHeight: '1.6', margin: 0 }}>
                    A confirmation email has been sent to <strong>{email}</strong>.
                  </p>
                  <p style={{ color: '#334155', fontSize: '0.88rem', lineHeight: '1.6', marginTop: '0.75rem', marginBottom: 0 }}>
                    Please check your email inbox and click the confirmation link inside. <strong>The link will automatically redirect you back here to log in</strong> to your AgriLink account.
                  </p>
                </div>

                {role === 'farmer' && (
                  <div style={{
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '10px',
                    padding: '0.85rem 1rem',
                    marginBottom: '1.5rem',
                    textAlign: 'left',
                    fontSize: '0.85rem',
                    color: '#92400e'
                  }}>
                    ℹ️ <strong>Note for Farmers:</strong> After confirming your email, your farm details will also be reviewed by our admin team for verification.
                  </div>
                )}

                <Link 
                  to="/login" 
                  className="btn btn-primary w-full" 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    textDecoration: 'none', 
                    textAlign: 'center', 
                    padding: '0.9rem',
                    fontSize: '0.98rem',
                    fontWeight: 700
                  }}
                >
                  Proceed to Login Page
                </Link>
              </div>
            ) : (
              <>
                <div className="auth-header">
                  <div className="mobile-logo-wrapper">
                    <Link to="/" className="auth-logo dark-theme">
                      <Leaf className="logo-icon" />
                      <span>AgriLink</span>
                    </Link>
                  </div>
                  <h1 className="heading-md auth-title">Create Account</h1>
                  <p className="auth-subtitle">Get started with AgriLink by signing up</p>
                </div>

                {/* Role Tab Selector */}
                <div className="role-selector-tabs">
                  <button 
                    type="button"
                    className={`role-tab ${role === 'buyer' ? 'active' : ''}`}
                    onClick={() => setRole('buyer')}
                  >
                    <User size={16} />
                    <span>Buyer / Consumer</span>
                  </button>
                  <button 
                    type="button"
                    className={`role-tab ${role === 'farmer' ? 'active' : ''}`}
                    onClick={() => setRole('farmer')}
                  >
                    <Leaf size={16} />
                    <span>Farmer / Producer</span>
                  </button>
                </div>

                {/* Google Authentication */}
                <button 
                  type="button" 
                  className="btn-google-auth w-full"
                  onClick={() => setIsGoogleModalOpen(true)}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" className="google-btn-icon">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Sign up with Google</span>
                </button>

                <div className="auth-separator">
                  <span className="separator-text">or sign up with email</span>
                </div>

                {/* Error Message */}
                {error && (
                  <div style={{ 
                    padding: '12px', 
                    background: '#ffebee', 
                    border: '1px solid #ef5350',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '16px',
                    color: '#c62828',
                    fontSize: '0.9rem'
                  }}>
                    {error}
                  </div>
                )}

                {/* Registration Form */}
                <form onSubmit={handleSubmit} className="auth-form">
                  <h3 className="form-section-title">Personal Details</h3>
                  
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label" htmlFor="fullName">Full Name</label>
                      <div className="input-icon-wrapper">
                        <User className="input-icon" size={18} />
                        <input 
                          type="text" 
                          id="fullName"
                          className="form-input" 
                          placeholder="John Doe"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="phone">Phone Number</label>
                      <div className="input-icon-wrapper">
                        <Phone className="input-icon" size={18} />
                        <input 
                          type="tel" 
                          id="phone"
                          className="form-input" 
                          placeholder="+233 24 123 4567"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="email">Email Address</label>
                    <div className="input-icon-wrapper">
                      <Mail className="input-icon" size={18} />
                      <input 
                        type="email" 
                        id="email"
                        className="form-input" 
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label" htmlFor="password">Password</label>
                      <div className="input-icon-wrapper">
                        <Lock className="input-icon" size={18} />
                        <input 
                          type="password" 
                          id="password"
                          className="form-input" 
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                      <div className="input-icon-wrapper">
                        <Lock className="input-icon" size={18} />
                        <input 
                          type="password" 
                          id="confirmPassword"
                          className="form-input" 
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Role-Specific Fields */}
                  <div className="role-specific-section">
                    <h3 className="form-section-title">
                      {role === 'farmer' ? 'Farm Information' : 'Delivery & Account Preferences'}
                    </h3>

                    {role === 'farmer' ? (
                      /* Farmer Fields */
                      <>
                        <div className="form-grid">
                          <div className="form-group">
                            <label className="form-label" htmlFor="farmName">Farm Name</label>
                            <div className="input-icon-wrapper">
                              <Leaf className="input-icon" size={18} />
                              <input 
                                type="text" 
                                id="farmName"
                                className="form-input" 
                                placeholder="Green Valley Farms"
                                value={farmName}
                                onChange={(e) => setFarmName(e.target.value)}
                                required={role === 'farmer'}
                              />
                            </div>
                          </div>

                          <div className="form-group">
                            <label className="form-label" htmlFor="farmLocation">Farm Location (City/Region)</label>
                            <div className="input-icon-wrapper">
                              <MapPin className="input-icon" size={18} />
                              <input 
                                type="text" 
                                id="farmLocation"
                                className="form-input" 
                                placeholder="Kumasi, Ashanti"
                                value={farmLocation}
                                onChange={(e) => setFarmLocation(e.target.value)}
                                required={role === 'farmer'}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="form-grid">
                          <div className="form-group">
                            <label className="form-label" htmlFor="farmSize">Farm Size (Acres)</label>
                            <input 
                              type="number" 
                              id="farmSize"
                              className="form-input" 
                              placeholder="e.g. 5"
                              value={farmSize}
                              onChange={(e) => setFarmSize(e.target.value)}
                              required={role === 'farmer'}
                              min="1"
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label" htmlFor="primaryCategory">Primary Crop Category</label>
                            <select 
                              id="primaryCategory"
                              className="form-select"
                              value={primaryCategory}
                              onChange={(e) => setPrimaryCategory(e.target.value)}
                            >
                              <option value="vegetables">Vegetables</option>
                              <option value="fruits">Fruits</option>
                              <option value="grains">Grains</option>
                              <option value="spices">Spices</option>
                              <option value="tubers">Tubers</option>
                            </select>
                          </div>
                        </div>

                        <div className="form-grid">
                          <div className="form-group">
                            <label className="form-label" htmlFor="idType">Verification ID Type</label>
                            <select 
                              id="idType"
                              className="form-select"
                              value={idType}
                              onChange={(e) => setIdType(e.target.value)}
                            >
                              <option value="national">National ID (Ghana Card)</option>
                              <option value="voter">Voter's ID</option>
                              <option value="association">Farmer Association ID</option>
                            </select>
                          </div>

                          <div className="form-group">
                            <label className="form-label" htmlFor="idNumber">ID Card Number</label>
                            <div className="input-icon-wrapper">
                              <ShieldCheck className="input-icon" size={18} />
                              <input 
                                type="text" 
                                id="idNumber"
                                className="form-input" 
                                placeholder="e.g. GHA-123456789-0"
                                value={idNumber}
                                onChange={(e) => setIdNumber(e.target.value)}
                                required={role === 'farmer'}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label" htmlFor="farmBio">About the Farm (Short Bio)</label>
                          <textarea 
                            id="farmBio"
                            className="form-textarea" 
                            placeholder="Tell buyers a bit about your farming practices and produce..."
                            value={farmBio}
                            onChange={(e) => setFarmBio(e.target.value)}
                            rows="3"
                          />
                        </div>
                      </>
                    ) : (
                      /* Buyer Fields */
                      <>
                        <div className="form-grid">
                          <div className="form-group">
                            <label className="form-label" htmlFor="buyerType">Buyer Account Type</label>
                            <select 
                              id="buyerType"
                              className="form-select"
                              value={buyerType}
                              onChange={(e) => setBuyerType(e.target.value)}
                            >
                              <option value="individual">Individual Consumer</option>
                              <option value="restaurant">Restaurant / Hotel</option>
                              <option value="wholesaler">Wholesaler / Retailer</option>
                              <option value="processor">Food Processor</option>
                            </select>
                          </div>

                          <div className="form-group">
                            <label className="form-label" htmlFor="paymentMethod">Preferred Payment Method</label>
                            <select 
                              id="paymentMethod"
                              className="form-select"
                              value={paymentMethod}
                              onChange={(e) => setPaymentMethod(e.target.value)}
                            >
                              <option value="momo">Mobile Money (MTN / Telecel / AT)</option>
                              <option value="cash">Cash on Delivery</option>
                              <option value="bank">Bank Transfer</option>
                            </select>
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label" htmlFor="deliveryAddress">Delivery Address Details</label>
                          <div className="input-icon-wrapper">
                            <MapPin className="input-icon" size={18} />
                            <input 
                              type="text" 
                              id="deliveryAddress"
                              className="form-input" 
                              placeholder="Street Address, City, Region"
                              value={deliveryAddress}
                              onChange={(e) => setDeliveryAddress(e.target.value)}
                              required={role === 'buyer'}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="form-options">
                    <label className="checkbox-container">
                      <input 
                        type="checkbox" 
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        required
                      />
                      <span className="checkbox-checkmark"></span>
                      <span className="checkbox-label">
                        I agree to the <a href="#terms" className="forgot-password-link">Terms of Service</a> and <a href="#privacy" className="forgot-password-link">Privacy Policy</a>
                      </span>
                    </label>
                  </div>

                  <button type="submit" className="btn btn-primary btn-submit w-full" disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : `Register as ${role === 'buyer' ? 'Buyer' : 'Farmer'}`}
                  </button>
                </form>

                <div className="auth-footer">
                  <p>Already have an account? <Link to="/login" className="auth-footer-link">Sign in</Link></p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <GoogleAuthModal 
        isOpen={isGoogleModalOpen} 
        onClose={() => setIsGoogleModalOpen(false)}
        onSelectAccount={handleGoogleSignUp}
      />
    </div>
  );
}
