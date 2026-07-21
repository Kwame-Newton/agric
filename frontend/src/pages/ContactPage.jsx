import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  MapPin,
  Phone,
  Send,
  ChevronRight,
} from 'lucide-react';
import './ContactPage.css';


function ContactCard({ icon: Icon, title, lines }) {
  return (
    <div className="contact-card">
      <div className="contact-card-icon">
        <Icon size={20} />
      </div>
      <div className="contact-card-content">
        <h3 className="contact-card-title">{title}</h3>
        {lines.map((l, idx) => (
          <p key={idx} className="contact-card-line">
            {l}
          </p>
        ))}
      </div>
    </div>
  );
}

export default function ContactPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('General Enquiry');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState({ type: null, text: '' });

  const subjectOptions = useMemo(
    () => [
      'General Enquiry',
      'farmer Verification Request',
      'Technical Support',
      'Report a Problem',
      'Partnership / Business',
      'Other',
    ],
    []
  );

  const onSubmit = (e) => {
    e.preventDefault();

    if (!fullName.trim()) {
      setStatus({ type: 'error', text: 'Full name is required.' });
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setStatus({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }
    if (!message.trim() || message.trim().length < 10) {
      setStatus({ type: 'error', text: 'Please write a short message (at least 10 characters).' });
      return;
    }

    // Demo-only submit
    setStatus({ type: 'success', text: 'Message sent! Our team will get back to you shortly.' });
    setFullName('');
    setEmail('');
    setSubject('General Enquiry');
    setMessage('');
  };

  return (
    <div className="contact-page">
      <section className="contact-hero">
        <div className="container contact-hero-inner">
          <div className="contact-hero-copy">
            <h1 className="heading-xl contact-title">Get In Touch</h1>
            <p className="contact-subtitle">
              Have a question, complaint, or want to learn more about AgriLink? We are here to help.
            </p>
          </div>
        </div>
      </section>

      <section className="contact-section">
        <div className="container contact-section-inner">
          <div className="contact-grid">
            {/* Section 1 — Contact Form */}
            <div className="contact-form-wrap">
              <h2 className="contact-section-title">Send Us a Message</h2>

              <form className="contact-form" onSubmit={onSubmit}>
                <div className="contact-form-row">
                  <label className="contact-label" htmlFor="fullName">Full Name</label>
                  <input
                    id="fullName"
                    className="contact-input"
                    placeholder="Your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="contact-form-row">
                  <label className="contact-label" htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    className="contact-input"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    type="email"
                  />
                </div>

                <div className="contact-form-row">
                  <label className="contact-label" htmlFor="subject">Subject</label>
                  <select
                    id="subject"
                    className="contact-input"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  >
                    {subjectOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="contact-form-row">
                  <label className="contact-label" htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    className="contact-textarea"
                    placeholder="Write your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={6}
                  />
                </div>

                {status.type && (
                  <div className={`contact-status ${status.type}`}>{status.text}</div>
                )}

                <button type="submit" className="btn btn-primary contact-send">
                  <Send size={18} />
                  Send Message
                </button>
              </form>
            </div>

            {/* Section 2 — Contact Information Cards */}
            <div className="contact-info-wrap">
              <h2 className="contact-section-title">Contact Information</h2>
              <div className="contact-cards">
                <ContactCard
                  icon={Mail}
                  title="📧 Email Us"
                  lines={[
                    'General: support@agrilink.com',
                    'Admin: admin@agrilink.com',
                  ]}
                />
                <ContactCard
                  icon={MapPin}
                  title="📍 Location"
                  lines={[
                    'Kumasi, Ashanti Region',
                    'Ghana, West Africa',
                  ]}
                />
                <ContactCard
                  icon={Phone}
                  title="📞 Call Us"
                  lines={[
                    '+233 24 123 4567',
                    'Mon – Fri, 8am – 5pm',
                  ]}
                />
              </div>

              {/* Section 3 — Farmer Verification Info Box */}
              <div className="contact-verify-box">
                <h3 className="contact-verify-title">Are You a Farmer? Get Verified ✅</h3>
                <p className="contact-verify-text">
                  After registering as a farmer on AgriLink, your account must be verified by our admin team before your crops appear on the marketplace. Verification ensures buyers can trust that all farmers on the platform are genuine and their produce is authentic.
                </p>

                <div className="contact-verify-steps">
                  <h4 className="contact-verify-subtitle">How to get verified:</h4>
                  <ol className="contact-verify-list">
                    <li>Register as a Farmer on AgriLink</li>
                    <li>Complete your farm profile fully</li>
                    <li>
                      Send an email to <strong>admin@agrilink.com</strong> with the subject{' '}
                      <strong>"Farmer Verification Request"</strong> and include your full name, farm name, location, and a valid ID
                    </li>
                    <li>Our admin team will review and verify your account within 24 to 48 hours</li>
                    <li>You will receive a confirmation email once verified</li>
                  </ol>
                </div>
              </div>

              {/* Section 4 — FAQ */}
              <div className="contact-faq">
                <h2 className="contact-section-title">FAQ</h2>

                <div className="contact-faq-list">
                  <div className="contact-faq-item">
                    <h3 className="contact-faq-q">Q: How long does farmer verification take?</h3>
                    <p className="contact-faq-a">A: Typically 24 to 48 hours after submitting your verification request to our admin team.</p>
                  </div>

                  <div className="contact-faq-item">
                    <h3 className="contact-faq-q">Q: Can buyers contact farmers directly?</h3>
                    <p className="contact-faq-a">A: Yes — once logged in, buyers can message any verified farmer directly through the AgriLink chat feature.</p>
                  </div>

                  <div className="contact-faq-item">
                    <h3 className="contact-faq-q">Q: What if I have a problem with an order?</h3>
                    <p className="contact-faq-a">A: Contact us at support@agrilink.com and our team will assist you in resolving any disputes.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Banner */}
      <section className="contact-bottom-banner">
        <div className="container contact-bottom-banner-inner">
          <div className="contact-bottom-copy">
            <h2 className="contact-bottom-title">Ready to join AgriLink?</h2>
          </div>
          <div className="contact-bottom-actions">
            <Link to="/register?role=farmer" className="btn btn-secondary contact-bottom-btn">
              Register as Farmer <ChevronRight size={18} />
            </Link>
            <Link to="/register?role=buyer" className="btn btn-primary contact-bottom-btn">
              Register as Buyer
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

