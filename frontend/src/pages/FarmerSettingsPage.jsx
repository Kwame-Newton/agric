import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Download,
  Save,
  ShieldCheck,
  Trash2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import './FarmerSettingsPage.css';

function SuccessToast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div className="fs-toast" role="status" aria-live="polite">
      <div className="fs-toast-inner">
        <span className="fs-toast-icon">✓</span>
        <div className="fs-toast-msg">
          <div className="fs-toast-title">Success</div>
          <div className="fs-toast-desc">{toast}</div>
        </div>
        <button className="fs-toast-close" onClick={onClose} aria-label="Close toast">
          ×
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="fs-field">
      <span className="fs-label">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ checked, onChange, ariaLabel }) {
  return (
    <button
      type="button"
      className={`fs-toggle ${checked ? 'on' : ''}`}
      onClick={() => onChange(!checked)}
      aria-label={ariaLabel}
      role="switch"
      aria-checked={checked}
    >
      <span className="fs-toggle-knob" />
    </button>
  );
}

function formatDate(d) {
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

export default function FarmerSettingsPage() {
  const tabs = useMemo(
    () => [
      { id: 'account', label: 'Account' },
      { id: 'notifications', label: 'Notifications' },
      { id: 'privacy', label: 'Privacy & Security' },
      { id: 'payment', label: 'Payment' },
      { id: 'help', label: 'Help & Support' },
      { id: 'danger', label: 'Danger Zone', danger: true },
    ],
    []
  );

  const [activeTab, setActiveTab] = useState('account');

  const [toastMsg, setToastMsg] = useState('');
  function showToast(message) {
    setToastMsg(message);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToastMsg(''), 2600);
  }

  // ─── ACCOUNT ────────────────────────────────────────────────────────────────
  const [language, setLanguage] = useState('English');
  const [timezone, setTimezone] = useState('Africa/Accra');
  const [currency, setCurrency] = useState('GHS');

  function onSaveAccount(e) {
    e.preventDefault();
    showToast('Account preferences saved successfully.');
  }

  // ─── NOTIFICATIONS ──────────────────────────────────────────────────────────
  const [notif, setNotif] = useState({
    newOrdersEmail: true,
    smsAlerts: false,
    weeklySummaryEmail: true,
    buyerProfileViewAlerts: true,
    promotionalUpdates: false,
    systemAnnouncements: true,
  });

  function onSaveNotifications(e) {
    e.preventDefault();
    showToast('Notification preferences saved successfully.');
  }

  // ─── PRIVACY & SECURITY ────────────────────────────────────────────────────
  const [twoFactor, setTwoFactor] = useState(true);

  const mockLogins = useMemo(
    () => [
      { device: 'Samsung Galaxy A14', location: 'Accra, Ghana', date: new Date('2024-05-30T10:12:00.000Z') },
      { device: 'Infinix Note 12', location: 'Kumasi, Ghana', date: new Date('2024-05-27T07:44:00.000Z') },
      { device: 'Chrome on Windows', location: 'Tema, Ghana', date: new Date('2024-05-22T18:05:00.000Z') },
      { device: 'iPhone 13', location: 'Cape Coast, Ghana', date: new Date('2024-05-15T12:29:00.000Z') },
    ],
    []
  );

  const [sessions, setSessions] = useState([
    { id: 's1', device: 'Samsung Galaxy A14', location: 'Accra, Ghana', lastActive: new Date('2024-05-30T10:12:00.000Z') },
    { id: 's2', device: 'Chrome on Windows', location: 'Tema, Ghana', lastActive: new Date('2024-05-22T18:05:00.000Z') },
    { id: 's3', device: 'iPhone 13', location: 'Cape Coast, Ghana', lastActive: new Date('2024-05-15T12:29:00.000Z') },
  ]);

  function onRevoke(sessionId) {
    const ok = window.confirm('Revoke this session? This will sign the session out immediately (demo).');
    if (!ok) return;
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    showToast('Session revoked successfully.');
  }

  function onDownloadData() {
    showToast('Download started (demo).');
  }

  function onSavePrivacy(e) {
    e.preventDefault();
    showToast('Privacy & Security preferences saved successfully.');
  }

  // ─── PAYMENT ────────────────────────────────────────────────────────────────
  const [paymentMethod, setPaymentMethod] = useState('Mobile Money');
  const [network, setNetwork] = useState('MTN');
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState('+233 20 123 4567');
  const [bankName, setBankName] = useState('GCB Bank');
  const [accountNumber, setAccountNumber] = useState('0123456789');

  function onSavePayment(e) {
    e.preventDefault();
    showToast('Payment information saved successfully.');
  }

  // ─── FAQ ─────────────────────────────────────────────────────────────────────
  const faqs = useMemo(
    () => [
      {
        q: 'How do I get verified?',
        a: 'Submit your farm details and a valid ID (demo). After review, your profile gets a Verified Farmer badge.',
      },
      {
        q: 'How do orders work?',
        a: 'Buyers place orders based on your listed crops. You accept, confirm availability, and fulfill delivery/pickup plans.',
      },
      {
        q: 'How do I upload crops?',
        a: 'Go to My Crops, click “Add Crop”, then fill pricing, quantity, and availability dates. Your listing becomes visible to buyers.',
      },
      {
        q: 'How do I chat with buyers?',
        a: 'Open Messages, select a buyer, and send details. Quick replies help reduce order cancellations.',
      },
      {
        q: 'How do I delete my account?',
        a: 'Use the Danger Zone. You’ll be prompted to confirm before deactivation or permanent deletion (demo).',
      },
    ],
    []
  );

  const [openFaq, setOpenFaq] = useState(0);

  function onContactSupport() {
    showToast('Contacting support… (demo)');
  }

  // ─── DANGER ZONE ────────────────────────────────────────────────────────────
  function onDeactivate() {
    const ok = window.confirm('Deactivate your account? Temporarily hide your profile and listings (demo).');
    if (!ok) return;
    showToast('Account deactivated (demo).');
  }

  function onDeleteAccount() {
    const ok = window.confirm('Delete your account permanently? This will remove all data (demo).');
    if (!ok) return;
    showToast('Account deleted permanently (demo).');
  }

  return (
    <div className="fs-page">
      <SuccessToast toast={toastMsg} onClose={() => setToastMsg('')} />

      {/* Title */}
      <div className="fs-title-wrap">
        <div>
          <h1 className="fs-title">Settings</h1>
          <p className="fs-subtitle">Manage your account preferences</p>
        </div>
      </div>

      <div className="fs-settings-layout">
        {/* Sidebar */}
        <aside className="fs-sidebar" aria-label="Settings navigation">
          <div className="fs-sidebar-title">Navigation</div>
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`fs-tab-btn ${activeTab === t.id ? 'active' : ''} ${t.danger ? 'danger' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              <span>{t.label}</span>
              {t.id === 'danger' ? <AlertTriangle size={16} color="#F4A261" /> : null}
            </button>
          ))}
        </aside>

        {/* Content */}
        <div className="fs-content-card">
          {activeTab === 'account' && (
            <>
              <div className="fs-card-title">Account</div>
              <form className="fs-form" onSubmit={onSaveAccount}>
                <div className="fs-grid-2">
                  <Field label="Language preference">
                    <select className="fs-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
                      <option>English</option>
                      <option>Twi (Asante Twi)</option>
                      <option>Ga</option>
                      <option>Ewe</option>
                    </select>
                  </Field>

                  <Field label="Timezone">
                    <select className="fs-select" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                      <option>Africa/Accra</option>
                      <option>Africa/Lagos</option>
                      <option>Africa/Kampala</option>
                      <option>Africa/Johannesburg</option>
                    </select>
                  </Field>
                </div>

                <div className="fs-grid-2">
                  <Field label="Currency display">
                    <select className="fs-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                      <option value="GHS">GHS</option>
                      <option value="USD">USD</option>
                    </select>
                  </Field>

                  <div className="fs-field">
                    <span className="fs-label">Preview</span>
                    <div
                      style={{
                        border: '1px solid rgba(0,0,0,0.08)',
                        borderRadius: 12,
                        padding: '0.75rem 0.9rem',
                        fontWeight: 900,
                        color: '#163226',
                        background: 'rgba(45,106,79,0.05)',
                      }}
                    >
                      Example: 1 crate price shown in <span style={{ color: 'var(--fs-green)' }}>{currency}</span>
                    </div>
                  </div>
                </div>

                <div className="fs-form-actions">
                  <button className="fs-save-btn" type="submit">
                    <Save size={16} /> Save Preferences
                  </button>
                </div>
              </form>
            </>
          )}

          {activeTab === 'notifications' && (
            <>
              <div className="fs-card-title">Notifications</div>
              <form className="fs-form" onSubmit={onSaveNotifications}>
                <div className="fs-switch-row">
                  <div className="fs-switch-left">
                    <div className="fs-switch-title">Email notifications for new orders</div>
                    <div className="fs-switch-desc">Get email alerts when buyers place new orders.</div>
                  </div>
                  <Toggle
                    checked={notif.newOrdersEmail}
                    onChange={(v) => setNotif((s) => ({ ...s, newOrdersEmail: v }))}
                    ariaLabel="Email notifications for new orders"
                  />
                </div>

                <div className="fs-switch-row">
                  <div className="fs-switch-left">
                    <div className="fs-switch-title">SMS alerts for new messages</div>
                    <div className="fs-switch-desc">SMS notifications when a buyer messages you.</div>
                  </div>
                  <Toggle
                    checked={notif.smsAlerts}
                    onChange={(v) => setNotif((s) => ({ ...s, smsAlerts: v }))}
                    ariaLabel="SMS alerts for new messages"
                  />
                </div>

                <div className="fs-switch-row">
                  <div className="fs-switch-left">
                    <div className="fs-switch-title">Weekly sales summary email</div>
                    <div className="fs-switch-desc">A weekly email with sales activity and trends.</div>
                  </div>
                  <Toggle
                    checked={notif.weeklySummaryEmail}
                    onChange={(v) => setNotif((s) => ({ ...s, weeklySummaryEmail: v }))}
                    ariaLabel="Weekly sales summary email"
                  />
                </div>

                <div className="fs-switch-row">
                  <div className="fs-switch-left">
                    <div className="fs-switch-title">Buyer profile view alerts</div>
                    <div className="fs-switch-desc">Notify you when buyers view your profile.</div>
                  </div>
                  <Toggle
                    checked={notif.buyerProfileViewAlerts}
                    onChange={(v) => setNotif((s) => ({ ...s, buyerProfileViewAlerts: v }))}
                    ariaLabel="Buyer profile view alerts"
                  />
                </div>

                <div className="fs-switch-row">
                  <div className="fs-switch-left">
                    <div className="fs-switch-title">Promotional updates</div>
                    <div className="fs-switch-desc">Product updates and promotions from AgriLink.</div>
                  </div>
                  <Toggle
                    checked={notif.promotionalUpdates}
                    onChange={(v) => setNotif((s) => ({ ...s, promotionalUpdates: v }))}
                    ariaLabel="Promotional updates"
                  />
                </div>

                <div className="fs-switch-row">
                  <div className="fs-switch-left">
                    <div className="fs-switch-title">System announcements</div>
                    <div className="fs-switch-desc">Important changes to the platform and security.</div>
                  </div>
                  <Toggle
                    checked={notif.systemAnnouncements}
                    onChange={(v) => setNotif((s) => ({ ...s, systemAnnouncements: v }))}
                    ariaLabel="System announcements"
                  />
                </div>

                <div className="fs-form-actions">
                  <button className="fs-save-btn" type="submit">
                    <Save size={16} /> Save
                  </button>
                </div>
              </form>
            </>
          )}

          {activeTab === 'privacy' && (
            <>
              <div className="fs-card-title">Privacy & Security</div>
              <form className="fs-form" onSubmit={onSavePrivacy}>
                <div className="fs-switch-row">
                  <div className="fs-switch-left">
                    <div className="fs-switch-title">Two factor authentication</div>
                    <div className="fs-switch-desc">Add an extra layer of security when signing in.</div>
                  </div>
                  <Toggle checked={twoFactor} onChange={setTwoFactor} ariaLabel="Two factor authentication" />
                </div>

                <div className="fs-divider" />

                <div className="fs-card-title" style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>
                  Login activity
                </div>

                <div className="fs-table-wrap">
                  <table className="fs-table" aria-label="Recent logins">
                    <thead>
                      <tr>
                        <th>Device</th>
                        <th>Location</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockLogins.map((l, idx) => (
                        <tr key={idx}>
                          <td>{l.device}</td>
                          <td>{l.location}</td>
                          <td>{formatDate(l.date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="fs-divider" />

                <div className="fs-card-title" style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>
                  Active sessions
                </div>

                <div className="fs-table-wrap">
                  <table className="fs-table" aria-label="Active sessions">
                    <thead>
                      <tr>
                        <th>Session</th>
                        <th>Last active</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((s) => (
                        <tr key={s.id}>
                          <td>
                            <span className="fs-session-chip">
                              <RotateCcw size={14} /> {s.device}
                            </span>
                            <div style={{ fontSize: '0.86rem', fontWeight: 750, color: '#6b776f', marginTop: '0.25rem' }}>
                              {s.location}
                            </div>
                          </td>
                          <td>{formatDate(s.lastActive)}</td>
                          <td>
                            <button type="button" className="fs-revoke-btn" onClick={() => onRevoke(s.id)}>
                              Revoke
                            </button>
                          </td>
                        </tr>
                      ))}
                      {sessions.length === 0 && (
                        <tr>
                          <td colSpan={3} style={{ padding: '1rem 0.6rem', color: '#6b776f' }}>
                            No active sessions.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="fs-form-actions" style={{ justifyContent: 'space-between' }}>
                  <button
                    type="button"
                    className="fs-revoke-btn"
                    onClick={onDownloadData}
                    style={{ borderColor: 'rgba(45,106,79,0.35)', color: 'var(--fs-green)', background: 'rgba(45,106,79,0.06)' }}
                  >
                    <Download size={16} /> Download my data
                  </button>
                  <button className="fs-save-btn" type="submit">
                    <Save size={16} /> Save Changes
                  </button>
                </div>
              </form>
            </>
          )}

          {activeTab === 'payment' && (
            <>
              <div className="fs-card-title">Payment</div>
              <form className="fs-form" onSubmit={onSavePayment}>
                <div className="fs-grid-2">
                  <Field label="Preferred payment method">
                    <select className="fs-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                      <option>Mobile Money</option>
                      <option>Bank Transfer</option>
                    </select>
                  </Field>

                  <div className="fs-field">
                    <span className="fs-label">Status</span>
                    <div
                      style={{
                        border: '1px solid rgba(0,0,0,0.08)',
                        borderRadius: 12,
                        padding: '0.75rem 0.9rem',
                        fontWeight: 900,
                        color: '#163226',
                        background: 'rgba(45,106,79,0.05)',
                      }}
                    >
                      {paymentMethod === 'Mobile Money' ? 'Mobile money enabled' : 'Bank transfer enabled'}
                    </div>
                  </div>
                </div>

                <div className="fs-divider" />

                {paymentMethod === 'Mobile Money' ? (
                  <>
                    <div className="fs-grid-2">
                      <Field label="Mobile money number">
                        <input
                          className="fs-input"
                          value={mobileMoneyNumber}
                          onChange={(e) => setMobileMoneyNumber(e.target.value)}
                          type="text"
                          placeholder="e.g. +233 20 123 4567"
                        />
                      </Field>

                      <Field label="Network">
                        <select className="fs-select" value={network} onChange={(e) => setNetwork(e.target.value)}>
                          <option>MTN</option>
                          <option>Telecel</option>
                          <option>AirtelTigo</option>
                        </select>
                      </Field>
                    </div>

                    <div className="fs-divider" />

                    <div className="fs-field">
                      <span className="fs-label">Demo preview</span>
                      <div
                        style={{
                          border: '1px solid rgba(244,162,97,0.28)',
                          borderRadius: 12,
                          padding: '0.85rem 0.9rem',
                          fontWeight: 900,
                          color: '#9a5a1e',
                          background: 'rgba(244,162,97,0.10)',
                        }}
                      >
                        Sending payments via <span style={{ color: 'var(--fs-orange)' }}>{network}</span> to{' '}
                        <span style={{ color: '#163226' }}>{mobileMoneyNumber}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="fs-grid-2">
                      <Field label="Bank name">
                        <input
                          className="fs-input"
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          type="text"
                          placeholder="e.g. GCB Bank"
                        />
                      </Field>

                      <Field label="Account number">
                        <input
                          className="fs-input"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          type="text"
                          placeholder="e.g. 0123456789"
                        />
                      </Field>
                    </div>

                    <div className="fs-divider" />

                    <div className="fs-field">
                      <span className="fs-label">Demo preview</span>
                      <div
                        style={{
                          border: '1px solid rgba(45,106,79,0.20)',
                          borderRadius: 12,
                          padding: '0.85rem 0.9rem',
                          fontWeight: 900,
                          color: '#163226',
                          background: 'rgba(45,106,79,0.06)',
                        }}
                      >
                        Bank transfer enabled for <span style={{ color: 'var(--fs-green)' }}>{bankName}</span> • Account{' '}
                        <span style={{ color: '#4a5c51' }}>{accountNumber}</span>
                      </div>
                    </div>
                  </>
                )}

                <div className="fs-form-actions">
                  <button className="fs-save-btn" type="submit">
                    <Save size={16} /> Save Payment Info
                  </button>
                </div>
              </form>
            </>
          )}

          {activeTab === 'help' && (
            <>
              <div className="fs-card-title">Help & Support</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {faqs.map((item, idx) => {
                  const open = openFaq === idx;
                  return (
                    <div className="fs-accordion-item" key={item.q}>
                      <button type="button" className="fs-accordion-btn" onClick={() => setOpenFaq(open ? -1 : idx)}>
                        <span>{item.q}</span>
                        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      {open ? <div className="fs-accordion-panel">{item.a}</div> : null}
                    </div>
                  );
                })}
              </div>

              <div className="fs-divider" />

              <div className="fs-form" style={{ gap: '0.75rem' }}>
                <button type="button" className="fs-save-btn" style={{ justifyContent: 'center' }} onClick={onContactSupport}>
                  <ShieldCheck size={16} /> Contact support
                </button>

                <div style={{ color: '#6b776f', fontWeight: 800 }}>
                  Documentation:{' '}
                  <a
                    className="fs-link"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      showToast('Opening documentation (demo).');
                    }}
                  >
                    Link to documentation
                  </a>
                </div>
              </div>
            </>
          )}

          {activeTab === 'danger' && (
            <>
              <div className="fs-card-title">Danger Zone</div>

              <div className="fs-content-card fs-danger-card" style={{ padding: '1.25rem', borderRadius: 16 }}>
                <div style={{ fontWeight: 950, color: '#163226' }}>Take actions that affect your account</div>
                <div style={{ color: '#6b776f', fontWeight: 750, marginTop: '0.35rem' }}>
                  Be careful—these actions are irreversible.
                </div>

                <div className="fs-danger-actions">
                  <button type="button" className="fs-deactivate-btn" onClick={onDeactivate}>
                    <div>
                      <div style={{ fontWeight: 1000 }}>Deactivate Account</div>
                      <small>Temporarily hide your profile and listings</small>
                    </div>
                    <AlertTriangle size={18} color="#ffffff" />
                  </button>

                  <button type="button" className="fs-delete-btn" onClick={onDeleteAccount}>
                    <div>
                      <div style={{ fontWeight: 1000 }}>Delete Account</div>
                      <small>Permanently delete your account and all data</small>
                    </div>
                    <Trash2 size={18} color="#ffffff" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

