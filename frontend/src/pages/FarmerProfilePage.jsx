import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Eye, Lock, Save, AlertTriangle, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import './FarmerProfilePage.css';

const GHANA_REGIONS = [
  'Greater Accra', 'Ashanti', 'Brong-Ahafo', 'Central', 'Eastern',
  'Northern', 'North East', 'Upper East', 'Upper West', 'Volta', 'Western', 'Western North',
];

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

function Toast({ msg, type = 'success', onClose }) {
  if (!msg) return null;
  return (
    <div className={`fp-toast fp-toast-${type}`} role="status" aria-live="polite">
      <div className="fp-toast-inner">
        <span className="fp-toast-icon">
          {type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
        </span>
        <div className="fp-toast-msg">
          <div className="fp-toast-title">{type === 'success' ? 'Success' : 'Error'}</div>
          <div className="fp-toast-desc">{msg}</div>
        </div>
        <button className="fp-toast-close" onClick={onClose} aria-label="Close">×</button>
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
  const { user, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: 'success' });

  // Live data from DB
  const [profile, setProfile] = useState(null);
  const [farmerData, setFarmerData] = useState(null);
  const [stats, setStats] = useState({ crops: 0, orders: 0 });

  // Editable form state
  const [farmInfo, setFarmInfo] = useState({ farmName: '', bio: '', location: '', primaryCategory: 'vegetables' });
  const [personalInfo, setPersonalInfo] = useState({ fullName: '', phone: '', region: 'Ashanti' });
  const [passwords, setPasswords] = useState({ newPassword: '', confirmNewPassword: '' });
  const [pwError, setPwError] = useState('');

  // Danger zone
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDeleteZone, setShowDeleteZone] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    const t = setTimeout(() => setToast({ msg: '', type: 'success' }), 3200);
    return () => clearTimeout(t);
  }, []);

  // ─── Load real data ───────────────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // 1. Core profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // 2. Farmer-specific details
      const { data: farmer } = await supabase
        .from('farmers')
        .select('*')
        .eq('id', user.id)
        .single();

      // 3. Live stats — crops listed
      const { count: cropCount } = await supabase
        .from('crops')
        .select('id', { count: 'exact', head: true })
        .eq('farmer_id', user.id);

      // 4. Live stats — orders received
      const { count: orderCount } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('farmer_id', user.id);

      setProfile(prof);
      setFarmerData(farmer);
      setStats({ crops: cropCount || 0, orders: orderCount || 0 });

      // Seed form state with real values
      setFarmInfo({
        farmName: farmer?.farm_name || '',
        bio: farmer?.farm_bio || '',
        location: farmer?.farm_location || '',
        primaryCategory: farmer?.primary_category || 'vegetables',
      });
      setPersonalInfo({
        fullName: prof?.full_name || '',
        phone: prof?.phone || '',
        region: farmer?.farm_location?.split(',')?.[1]?.trim() || 'Ashanti',
      });
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  // ─── Save farm info ───────────────────────────────────────────────────────
  const onSaveFarm = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('farmers')
        .update({
          farm_name: farmInfo.farmName,
          farm_bio: farmInfo.bio,
          farm_location: farmInfo.location,
          primary_category: farmInfo.primaryCategory,
        })
        .eq('id', user.id);

      if (error) throw error;
      showToast('Farm information updated.');
      loadProfile();
    } catch (err) {
      showToast(err.message || 'Failed to save.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ─── Save personal info ───────────────────────────────────────────────────
  const onSavePersonal = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: personalInfo.fullName, phone: personalInfo.phone })
        .eq('id', user.id);

      if (error) throw error;
      showToast('Personal information updated.');
    } catch (err) {
      showToast(err.message || 'Failed to save.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ─── Change password ──────────────────────────────────────────────────────
  const onUpdatePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    if (passwords.newPassword.length < 6) { setPwError('Password must be at least 6 characters.'); return; }
    if (passwords.newPassword !== passwords.confirmNewPassword) { setPwError('Passwords do not match.'); return; }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwords.newPassword });
      if (error) throw error;
      showToast('Password updated successfully.');
      setPasswords({ newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      showToast(err.message || 'Failed to update password.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ─── Hard delete account ──────────────────────────────────────────────────
  const onDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return;
    setDeleteLoading(true);
    try {
      // Delete from profiles (cascades to farmers via FK)
      await supabase.from('farm_posts').delete().eq('farmer_id', user.id);
      await supabase.from('crops').delete().eq('farmer_id', user.id);
      await supabase.from('farmers').delete().eq('id', user.id);
      await supabase.from('profiles').delete().eq('id', user.id);
      // Sign out and let Supabase handle auth cleanup
      await logout();
    } catch (err) {
      showToast(err.message || 'Failed to delete account.', 'error');
      setDeleteLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="fp-page fp-loading-state">
        <Loader2 className="fp-spinner" size={36} />
        <p>Loading your profile...</p>
      </div>
    );
  }

  const verified = farmerData?.verification_status === 'verified';
  const memberSince = profile?.created_at;

  return (
    <div className="fp-page">
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '', type: 'success' })} />

      {/* Title */}
      <div className="fp-title-wrap">
        <h1 className="fp-title">My Profile</h1>
        <p className="fp-subtitle">Manage your farm and personal information</p>
      </div>

      {/* Profile Header */}
      <div className="fp-header-card">
        <div className="fp-cover">
          <img
            className="fp-cover-img"
            src="https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1400&q=70"
            alt="Farm cover"
          />
          <div className="fp-cover-grad" />
        </div>

        <div className="fp-header-bottom">
          <div className="fp-avatar-block">
            <div className="fp-avatar-wrap">
              <div className="fp-avatar-initials">
                {(profile?.full_name || user?.name || 'F')
                  .split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
              </div>
            </div>
          </div>

          <div className="fp-header-meta">
            <div className="fp-farm-name">{farmerData?.farm_name || 'Your Farm'}</div>
            <div className="fp-meta-row">
              <div className="fp-meta-item">{farmerData?.farm_location || 'Location not set'}</div>
              <div className="fp-dot" />
              <div className="fp-meta-item">Member since {formatDate(memberSince)}</div>
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
                  onChange={e => setFarmInfo(s => ({ ...s, farmName: e.target.value }))}
                  type="text"
                  placeholder="Enter farm name"
                />
              </Field>

              <Field label="Farm Bio / Description">
                <textarea
                  className="fp-textarea"
                  value={farmInfo.bio}
                  onChange={e => setFarmInfo(s => ({ ...s, bio: e.target.value }))}
                  rows={4}
                  placeholder="Tell buyers about your farm, what you grow, and how you farm..."
                />
              </Field>

              <Field label="Farm Location">
                <input
                  className="fp-input"
                  value={farmInfo.location}
                  onChange={e => setFarmInfo(s => ({ ...s, location: e.target.value }))}
                  type="text"
                  placeholder="e.g. Kumasi, Ashanti, Ghana"
                />
              </Field>

              <Field label="Primary Crop Category">
                <select
                  className="fp-select"
                  value={farmInfo.primaryCategory}
                  onChange={e => setFarmInfo(s => ({ ...s, primaryCategory: e.target.value }))}
                >
                  {['vegetables', 'fruits', 'grains', 'tubers', 'legumes', 'spices'].map(c => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </Field>

              <div className="fp-form-actions">
                <button className="fp-save-btn" type="submit" disabled={saving}>
                  {saving ? <Loader2 size={16} className="fp-spin" /> : <Save size={16} />}
                  Save Farm Info
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
                  onChange={e => setPersonalInfo(s => ({ ...s, fullName: e.target.value }))}
                  type="text"
                />
              </Field>

              <Field label="Email Address">
                <input
                  className="fp-input fp-input-readonly"
                  value={user?.email || ''}
                  readOnly
                  title="Email cannot be changed here"
                />
              </Field>

              <Field label="Phone Number">
                <input
                  className="fp-input"
                  value={personalInfo.phone}
                  onChange={e => setPersonalInfo(s => ({ ...s, phone: e.target.value }))}
                  type="text"
                  placeholder="+233 ..."
                />
              </Field>

              <Field label="Region">
                <select
                  className="fp-select"
                  value={personalInfo.region}
                  onChange={e => setPersonalInfo(s => ({ ...s, region: e.target.value }))}
                >
                  {GHANA_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>

              <div className="fp-form-actions">
                <button className="fp-save-btn" type="submit" disabled={saving}>
                  {saving ? <Loader2 size={16} className="fp-spin" /> : <Save size={16} />}
                  Save Personal Info
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="fp-col-right">
          {/* Account Status — real-time */}
          <div className="fp-card">
            <div className="fp-card-title">Account Status</div>
            <div className="fp-status-grid">
              <div className={`fp-verified-badge fp-status-badge ${verified ? 'verified' : 'pending'}`}>
                <ShieldCheck size={16} /> {verified ? 'Verified' : 'Pending Verification'}
              </div>

              <div className="fp-status-line">
                <span className="fp-status-label">Member Since</span>
                <span className="fp-status-value">{formatDate(memberSince)}</span>
              </div>

              <div className="fp-status-line">
                <span className="fp-status-label">Total Crops Listed</span>
                <span className="fp-status-value">{stats.crops}</span>
              </div>

              <div className="fp-status-line">
                <span className="fp-status-label">Orders Received</span>
                <span className="fp-status-value">{stats.orders}</span>
              </div>

              <div className="fp-status-line">
                <span className="fp-status-label">ID Type</span>
                <span className="fp-status-value" style={{ textTransform: 'capitalize' }}>
                  {farmerData?.id_type || '—'}
                </span>
              </div>

              <div className="fp-status-line">
                <span className="fp-status-label">ID Number</span>
                <span className="fp-status-value">
                  {farmerData?.id_number
                    ? `••••${farmerData.id_number.slice(-4)}`
                    : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="fp-card">
            <div className="fp-card-title">Change Password</div>
            <form className="fp-form" onSubmit={onUpdatePassword}>
              <Field label="New Password">
                <input
                  className="fp-input"
                  type="password"
                  value={passwords.newPassword}
                  onChange={e => setPasswords(s => ({ ...s, newPassword: e.target.value }))}
                  required
                  minLength={6}
                  placeholder="Min. 6 characters"
                />
              </Field>

              <Field label="Confirm New Password">
                <input
                  className="fp-input"
                  type="password"
                  value={passwords.confirmNewPassword}
                  onChange={e => setPasswords(s => ({ ...s, confirmNewPassword: e.target.value }))}
                  required
                  minLength={6}
                  placeholder="Repeat new password"
                />
              </Field>

              {pwError && <div className="fp-pw-error"><AlertTriangle size={14} /> {pwError}</div>}

              <div className="fp-form-actions">
                <button className="fp-save-btn fp-save-btn-alt" type="submit" disabled={saving}>
                  <Lock size={16} /> Update Password
                </button>
              </div>
            </form>
          </div>

          {/* Danger Zone */}
          <div className="fp-card fp-card-danger">
            <div className="fp-card-title fp-danger-title">
              <AlertTriangle size={17} /> Danger Zone
            </div>

            {!showDeleteZone ? (
              <div>
                <p className="fp-danger-desc">
                  Permanently delete your account. This action cannot be undone — all your farm posts, crops, and orders will be removed.
                </p>
                <button
                  type="button"
                  className="fp-delete-btn"
                  onClick={() => setShowDeleteZone(true)}
                >
                  Delete My Account
                </button>
              </div>
            ) : (
              <div className="fp-delete-confirm-zone">
                <p className="fp-danger-desc">
                  Type <strong>DELETE</strong> to confirm permanent deletion of your account.
                </p>
                <input
                  className="fp-input fp-delete-input"
                  type="text"
                  placeholder='Type DELETE here'
                  value={deleteConfirm}
                  onChange={e => setDeleteConfirm(e.target.value)}
                />
                <div className="fp-delete-actions">
                  <button
                    type="button"
                    className="fp-cancel-btn"
                    onClick={() => { setShowDeleteZone(false); setDeleteConfirm(''); }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="fp-delete-btn"
                    disabled={deleteConfirm !== 'DELETE' || deleteLoading}
                    onClick={onDeleteAccount}
                  >
                    {deleteLoading ? <Loader2 size={15} className="fp-spin" /> : null}
                    Confirm Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
