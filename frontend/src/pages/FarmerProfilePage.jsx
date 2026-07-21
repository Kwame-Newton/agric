import React, { useMemo, useState } from 'react';
import { ShieldCheck, Eye, Lock, Image as ImageIcon, Save } from 'lucide-react';
import './FarmerProfilePage.css';

const GHANA_REGIONS = [
  'Greater Accra',
  'Ashanti',
  'Brong-Ahafo',
  'Central',
  'Eastern',
  'Northern',
  'North East',
  'Upper East',
  'Upper West',
  'Volta',
  'Western',
  'Western North',
];

function formatDate(d) {
  // d is a Date instance
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

function SuccessToast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div className="fp-toast" role="status" aria-live="polite">
      <div className="fp-toast-inner">
        <span className="fp-toast-icon">✓</span>
        <div className="fp-toast-msg">
          <div className="fp-toast-title">Saved successfully</div>
          <div className="fp-toast-desc">{toast}</div>
        </div>
        <button className="fp-toast-close" onClick={onClose} aria-label="Close toast">
          ×
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="fp-field">
      <span className="fp-label">{label}</span>
      {children}
    </label>
  );
}

export default function FarmerProfilePage() {
  const mock = useMemo(() => {
    const coverPhoto =
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1400&q=70';
    const avatar =
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=70';

    const memberSince = new Date('2019-07-14T00:00:00.000Z');
    const profileVerified = true;

    const farm = {
      name: 'Kofi Green Valley Farm',
      description:
        'We grow high-quality maize, tomatoes, and yam using sustainable farming practices and careful post-harvest handling.',
      location: 'Suhum, Eastern Region, Ghana',
      years: 7,
      cropsSpeciality: 'Maize, Tomatoes, Yam',
      coverPhoto,
      avatar,
      memberSince,
    };

    const personal = {
      fullName: 'Kofi Mensah',
      email: 'kofi.mensah@agrilink.com',
      phone: '+233 24 451 8891',
      region: 'Eastern',
    };

    const account = {
      verified: profileVerified,
      memberSince,
      totalCropsListed: 18,
      totalOrdersReceived: 64,
      profileViews: 1260,
    };

    return { farm, personal, account };
  }, []);

  const [toastMsg, setToastMsg] = useState('');

  const [farmInfo, setFarmInfo] = useState({
    farmName: mock.farm.name,
    farmDescription: mock.farm.description,
    farmLocation: mock.farm.location,
    yearsOfFarming: mock.farm.years,
    cropSpeciality: mock.farm.cropsSpeciality,
  });

  const [personalInfo, setPersonalInfo] = useState({
    fullName: mock.personal.fullName,
    email: mock.personal.email,
    phoneNumber: mock.personal.phone,
    region: mock.personal.region,
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const [coverHover, setCoverHover] = useState(false);

  const verified = mock.account.verified;

  function showToast(message) {
    setToastMsg(message);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToastMsg(''), 2600);
  }

  function onSaveFarm(e) {
    e.preventDefault();
    showToast('Farm information updated.');
  }

  function onSavePersonal(e) {
    e.preventDefault();
    showToast('Personal information updated.');
  }

  function onUpdatePassword(e) {
    e.preventDefault();
    showToast('Password updated successfully.');
    setPasswords({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  }

  return (
    <div className="fp-page">
      <SuccessToast toast={toastMsg} onClose={() => setToastMsg('')} />

      {/* Title */}
      <div className="fp-title-wrap">
        <div>
          <h1 className="fp-title">My Profile</h1>
          <p className="fp-subtitle">Manage your farm and personal information</p>
        </div>
      </div>

      {/* Profile header */}
      <div className="fp-header-card">
        <div
          className={`fp-cover ${coverHover ? 'fp-cover-hover' : ''}`}
          onMouseEnter={() => setCoverHover(true)}
          onMouseLeave={() => setCoverHover(false)}
        >
          <img className="fp-cover-img" src={mock.farm.coverPhoto} alt="Farm cover" />

          <button className="fp-change-cover-btn" type="button">
            <ImageIcon size={16} /> Change Cover Photo
          </button>

          <div className="fp-cover-grad" />
        </div>

        <div className="fp-header-bottom">
          <div className="fp-avatar-block">
            <div className="fp-avatar-wrap">
              <img className="fp-avatar" src={mock.farm.avatar} alt="Farmer avatar" />
            </div>
            <button className="fp-change-photo-btn" type="button">
              Change Photo
            </button>
          </div>

          <div className="fp-header-meta">
            <div className="fp-farm-name">{mock.farm.name}</div>
            <div className="fp-meta-row">
              <div className="fp-meta-item">{mock.farm.location}</div>
              <div className="fp-dot" />
              <div className="fp-meta-item">Member since {formatDate(mock.farm.memberSince)}</div>
            </div>
          </div>
        </div>

        <div className="fp-badges-row">
          <span className={`fp-verified-badge ${verified ? 'verified' : 'pending'}`}>
            <ShieldCheck size={16} /> {verified ? 'Verified Farmer' : 'Verification Pending'}
          </span>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="fp-two-col">
        <div className="fp-col-left">
          {/* Farm Information */}
          <div className="fp-card">
            <div className="fp-card-title">Farm Information</div>

            <form className="fp-form" onSubmit={onSaveFarm}>
              <Field label="Farm Name">
                <input
                  className="fp-input"
                  value={farmInfo.farmName}
                  onChange={(e) => setFarmInfo((s) => ({ ...s, farmName: e.target.value }))}
                  type="text"
                  placeholder="Enter farm name"
                />
              </Field>

              <Field label="Farm Description">
                <textarea
                  className="fp-textarea"
                  value={farmInfo.farmDescription}
                  onChange={(e) => setFarmInfo((s) => ({ ...s, farmDescription: e.target.value }))}
                  rows={4}
                  placeholder="Tell us about your farm"
                />
              </Field>

              <Field label="Farm Location">
                <input
                  className="fp-input"
                  value={farmInfo.farmLocation}
                  onChange={(e) => setFarmInfo((s) => ({ ...s, farmLocation: e.target.value }))}
                  type="text"
                  placeholder="Enter location"
                />
              </Field>

              <div className="fp-grid-2">
                <Field label="Years of Farming">
                  <input
                    className="fp-input"
                    value={farmInfo.yearsOfFarming}
                    onChange={(e) => setFarmInfo((s) => ({ ...s, yearsOfFarming: Number(e.target.value) }))}
                    type="number"
                    min={0}
                  />
                </Field>

                <Field label="Crop Speciality">
                  <input
                    className="fp-input"
                    value={farmInfo.cropSpeciality}
                    onChange={(e) => setFarmInfo((s) => ({ ...s, cropSpeciality: e.target.value }))}
                    type="text"
                    placeholder="e.g Maize, Tomatoes, Yam"
                  />
                </Field>
              </div>

              <div className="fp-form-actions">
                <button className="fp-save-btn" type="submit">
                  <Save size={16} /> Save Changes
                </button>
              </div>
            </form>
          </div>

          {/* Personal Information */}
          <div className="fp-card">
            <div className="fp-card-title">Personal Information</div>
            <form className="fp-form" onSubmit={onSavePersonal}>
              <Field label="Full Name">
                <input
                  className="fp-input"
                  value={personalInfo.fullName}
                  onChange={(e) => setPersonalInfo((s) => ({ ...s, fullName: e.target.value }))}
                  type="text"
                />
              </Field>

              <Field label="Email">
                <input className="fp-input fp-input-readonly" value={personalInfo.email} readOnly />
              </Field>

              <Field label="Phone Number">
                <input
                  className="fp-input"
                  value={personalInfo.phoneNumber}
                  onChange={(e) => setPersonalInfo((s) => ({ ...s, phoneNumber: e.target.value }))}
                  type="text"
                />
              </Field>

              <Field label="Region">
                <select
                  className="fp-select"
                  value={personalInfo.region}
                  onChange={(e) => setPersonalInfo((s) => ({ ...s, region: e.target.value }))}
                >
                  {GHANA_REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="fp-form-actions">
                <button className="fp-save-btn" type="submit">
                  <Save size={16} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="fp-col-right">
          {/* Account Status */}
          <div className="fp-card">
            <div className="fp-card-title">Account Status</div>

            <div className="fp-status-grid">
              <div className={`fp-verified-badge fp-status-badge ${verified ? 'verified' : 'pending'}`}>
                <ShieldCheck size={16} /> {verified ? 'Verified' : 'Pending'}
              </div>

              <div className="fp-status-line">
                <span className="fp-status-label">Member Since</span>
                <span className="fp-status-value">{formatDate(mock.account.memberSince)}</span>
              </div>

              <div className="fp-status-line">
                <span className="fp-status-label">Total Crops Listed</span>
                <span className="fp-status-value">{mock.account.totalCropsListed}</span>
              </div>

              <div className="fp-status-line">
                <span className="fp-status-label">Total Orders Received</span>
                <span className="fp-status-value">{mock.account.totalOrdersReceived}</span>
              </div>

              <div className="fp-status-line">
                <span className="fp-status-label">Profile Views</span>
                <span className="fp-status-value fp-views">
                  <Eye size={16} /> {mock.account.profileViews.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="fp-card">
            <div className="fp-card-title">Change Password</div>

            <form className="fp-form" onSubmit={onUpdatePassword}>
              <Field label="Current Password">
                <input
                  className="fp-input"
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords((s) => ({ ...s, currentPassword: e.target.value }))}
                  required
                />
              </Field>

              <Field label="New Password">
                <input
                  className="fp-input"
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords((s) => ({ ...s, newPassword: e.target.value }))}
                  required
                  minLength={6}
                />
              </Field>

              <Field label="Confirm New Password">
                <input
                  className="fp-input"
                  type="password"
                  value={passwords.confirmNewPassword}
                  onChange={(e) =>
                    setPasswords((s) => ({ ...s, confirmNewPassword: e.target.value }))
                  }
                  required
                  minLength={6}
                />
              </Field>

              <div className="fp-form-actions">
                <button className="fp-save-btn fp-save-btn-alt" type="submit">
                  <Lock size={16} /> Update Password
                </button>
              </div>

              <div className="fp-hint">Use at least 6 characters. This demo stores nothing.</div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

