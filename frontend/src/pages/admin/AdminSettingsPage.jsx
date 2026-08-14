import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminDashboardLayout } from './AdminDashboardPage';
import { 
  Settings, 
  Shield, 
  Bell, 
  Users, 
  Globe, 
  AlertTriangle, 
  Save,
  CheckCircle2,
  X
} from 'lucide-react';
import './AdminSettingsPage.css';

const AdminSettingsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [showToast, setShowToast] = useState(false);

  // Form states
  const [general, setGeneral] = useState({
    platformName: 'AgriLink Marketplace',
    timezone: 'GMT (Accra)',
    currency: 'GHS',
    language: 'English'
  });

  const [users, setUsers] = useState({
    autoApproveBuyers: false,
    requireVerification: true,
    maxLoginAttempts: 5,
    sessionTimeout: 60
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    systemMaintenance: true,
    weeklyAnalytics: true
  });

  const [security, setSecurity] = useState({
    twoFactor: true,
    minPasswordLength: 8,
    ipWhitelist: false
  });

  const [platform, setPlatform] = useState({
    commissionRate: 5,
    maintenanceMode: false,
    analyticsTracking: true
  });

  const handleSave = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const tabs = [
    { id: 'general', label: 'General Settings', icon: Globe },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'platform', label: 'Platform', icon: Settings },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
  ];

  return (
    <AdminDashboardLayout>
      <div className="as-container">
        {showToast && (
          <div className="as-toast">
            <CheckCircle2 size={20} />
            <span>Settings saved successfully</span>
            <button type="button" onClick={() => setShowToast(false)} className="as-toast-close">
              <X size={16} />
            </button>
          </div>
        )}

        <div className="as-header">
          <div>
            <h1 className="as-title">Platform Settings</h1>
            <p className="as-subtitle">Manage AgriLink system configuration and preferences</p>
          </div>
          <button type="button" className="as-save-btn" onClick={handleSave}>
            <Save size={18} />
            Save Changes
          </button>
        </div>

        <div className="as-layout">
          <div className="as-sidebar">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`as-tab-btn ${activeTab === tab.id ? 'active' : ''} ${tab.id === 'danger' ? 'danger-tab' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="as-content">
            {activeTab === 'general' && (
              <div className="as-section">
                <h2>General Settings</h2>
                <div className="as-card">
                  <div className="as-form-group">
                    <label>Platform Name</label>
                    <input 
                      type="text" 
                      value={general.platformName}
                      onChange={e => setGeneral({...general, platformName: e.target.value})}
                    />
                  </div>
                  <div className="as-form-row">
                    <div className="as-form-group">
                      <label>Timezone</label>
                      <select 
                        value={general.timezone}
                        onChange={e => setGeneral({...general, timezone: e.target.value})}
                      >
                        <option>GMT (Accra)</option>
                        <option>UTC</option>
                        <option>WAT</option>
                        <option>EAT</option>
                      </select>
                    </div>
                    <div className="as-form-group">
                      <label>Currency</label>
                      <select
                        value={general.currency}
                        onChange={e => setGeneral({...general, currency: e.target.value})}
                      >
                        <option>GHS</option>
                        <option>USD</option>
                        <option>NGN</option>
                        <option>KES</option>
                      </select>
                    </div>
                  </div>
                  <div className="as-form-group">
                    <label>Default Language</label>
                    <select
                      value={general.language}
                      onChange={e => setGeneral({...general, language: e.target.value})}
                    >
                      <option>English</option>
                      <option>French</option>
                      <option>Swahili</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="as-section">
                <h2>User Management</h2>
                <div className="as-card">
                  <div className="as-toggle-group">
                    <div className="as-toggle-label">
                      <strong>Auto-approve Buyers</strong>
                      <p>Automatically approve new buyer registrations</p>
                    </div>
                    <label className="as-toggle">
                      <input 
                        type="checkbox" 
                        checked={users.autoApproveBuyers}
                        onChange={e => setUsers({...users, autoApproveBuyers: e.target.checked})}
                      />
                      <span className="as-slider"></span>
                    </label>
                  </div>

                  <div className="as-toggle-group">
                    <div className="as-toggle-label">
                      <strong>Require Farmer Verification</strong>
                      <p>Farmers must be verified before listing products</p>
                    </div>
                    <label className="as-toggle">
                      <input 
                        type="checkbox" 
                        checked={users.requireVerification}
                        onChange={e => setUsers({...users, requireVerification: e.target.checked})}
                      />
                      <span className="as-slider"></span>
                    </label>
                  </div>

                  <div className="as-divider"></div>

                  <div className="as-form-row">
                    <div className="as-form-group">
                      <label>Max Login Attempts</label>
                      <input 
                        type="number" 
                        value={users.maxLoginAttempts}
                        onChange={e => setUsers({...users, maxLoginAttempts: parseInt(e.target.value) || 5})}
                        min="1" max="10"
                      />
                    </div>
                    <div className="as-form-group">
                      <label>Session Timeout (minutes)</label>
                      <input 
                        type="number" 
                        value={users.sessionTimeout}
                        onChange={e => setUsers({...users, sessionTimeout: parseInt(e.target.value) || 60})}
                        min="15" max="1440"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="as-section">
                <h2>Notifications</h2>
                <div className="as-card">
                  <div className="as-toggle-group">
                    <div className="as-toggle-label">
                      <strong>Email Alerts for New Farmers</strong>
                      <p>Send an email to admin when a new farmer registers</p>
                    </div>
                    <label className="as-toggle">
                      <input 
                        type="checkbox" 
                        checked={notifications.emailAlerts}
                        onChange={e => setNotifications({...notifications, emailAlerts: e.target.checked})}
                      />
                      <span className="as-slider"></span>
                    </label>
                  </div>

                  <div className="as-toggle-group">
                    <div className="as-toggle-label">
                      <strong>SMS Alerts for High-value Orders</strong>
                      <p>Send an SMS for orders above 10,000 GHS</p>
                    </div>
                    <label className="as-toggle">
                      <input 
                        type="checkbox" 
                        checked={notifications.smsAlerts}
                        onChange={e => setNotifications({...notifications, smsAlerts: e.target.checked})}
                      />
                      <span className="as-slider"></span>
                    </label>
                  </div>

                  <div className="as-toggle-group">
                    <div className="as-toggle-label">
                      <strong>System Maintenance Notifications</strong>
                      <p>Broadcast maintenance alerts to all active users</p>
                    </div>
                    <label className="as-toggle">
                      <input 
                        type="checkbox" 
                        checked={notifications.systemMaintenance}
                        onChange={e => setNotifications({...notifications, systemMaintenance: e.target.checked})}
                      />
                      <span className="as-slider"></span>
                    </label>
                  </div>

                  <div className="as-toggle-group">
                    <div className="as-toggle-label">
                      <strong>Weekly Analytics Report Email</strong>
                      <p>Send weekly platform performance summary</p>
                    </div>
                    <label className="as-toggle">
                      <input 
                        type="checkbox" 
                        checked={notifications.weeklyAnalytics}
                        onChange={e => setNotifications({...notifications, weeklyAnalytics: e.target.checked})}
                      />
                      <span className="as-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="as-section">
                <h2>Security Settings</h2>
                <div className="as-card">
                  <div className="as-toggle-group">
                    <div className="as-toggle-label">
                      <strong>Two-Factor Authentication (Admin)</strong>
                      <p>Require 2FA for all administrator accounts</p>
                    </div>
                    <label className="as-toggle">
                      <input 
                        type="checkbox" 
                        checked={security.twoFactor}
                        onChange={e => setSecurity({...security, twoFactor: e.target.checked})}
                      />
                      <span className="as-slider"></span>
                    </label>
                  </div>

                  <div className="as-toggle-group">
                    <div className="as-toggle-label">
                      <strong>IP Whitelist Enabled</strong>
                      <p>Restrict admin access to specific IP addresses</p>
                    </div>
                    <label className="as-toggle">
                      <input 
                        type="checkbox" 
                        checked={security.ipWhitelist}
                        onChange={e => setSecurity({...security, ipWhitelist: e.target.checked})}
                      />
                      <span className="as-slider"></span>
                    </label>
                  </div>

                  <div className="as-divider"></div>

                  <div className="as-form-group">
                    <label>Minimum Password Length</label>
                    <select
                      value={security.minPasswordLength}
                      onChange={e => setSecurity({...security, minPasswordLength: parseInt(e.target.value) || 8})}
                    >
                      <option value="8">8 Characters</option>
                      <option value="10">10 Characters</option>
                      <option value="12">12 Characters (Recommended)</option>
                      <option value="16">16 Characters</option>
                    </select>
                  </div>

                  <div className="as-divider"></div>
                  
                  <div className="as-sub-section">
                    <h3>Recent Admin Login Activity</h3>
                    <div className="as-table-container">
                      <table className="as-table">
                        <thead>
                          <tr>
                            <th>User</th>
                            <th>IP Address</th>
                            <th>Date & Time</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>{user?.email || 'admin@agrilink.com'}</td>
                            <td>192.168.1.104</td>
                            <td>Today, 10:45 AM</td>
                            <td><span className="as-badge success">Success</span></td>
                          </tr>
                          <tr>
                            <td>{user?.email || 'admin@agrilink.com'}</td>
                            <td>192.168.1.104</td>
                            <td>Yesterday, 09:12 AM</td>
                            <td><span className="as-badge success">Success</span></td>
                          </tr>
                          <tr>
                            <td>unknown@agrilink.com</td>
                            <td>10.0.0.52</td>
                            <td>Oct 20, 11:30 PM</td>
                            <td><span className="as-badge danger">Failed</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'platform' && (
              <div className="as-section">
                <h2>Platform Settings</h2>
                <div className="as-card">
                  <div className="as-form-group">
                    <label>Commission Rate (%)</label>
                    <div className="as-input-with-icon">
                      <input 
                        type="number" 
                        value={platform.commissionRate}
                        onChange={e => setPlatform({...platform, commissionRate: parseFloat(e.target.value) || 0})}
                        step="0.1" min="0" max="100"
                      />
                      <span className="as-input-suffix">%</span>
                    </div>
                    <p className="as-help-text">Percentage taken from each successful transaction.</p>
                  </div>

                  <div className="as-divider"></div>

                  <div className="as-toggle-group">
                    <div className="as-toggle-label">
                      <strong>Maintenance Mode</strong>
                      <p>Temporarily disable user access. Admins can still log in.</p>
                    </div>
                    <label className="as-toggle warning-toggle">
                      <input 
                        type="checkbox" 
                        checked={platform.maintenanceMode}
                        onChange={e => setPlatform({...platform, maintenanceMode: e.target.checked})}
                      />
                      <span className="as-slider"></span>
                    </label>
                  </div>

                  <div className="as-toggle-group">
                    <div className="as-toggle-label">
                      <strong>Enable Analytics Tracking</strong>
                      <p>Collect usage data to improve platform performance</p>
                    </div>
                    <label className="as-toggle">
                      <input 
                        type="checkbox" 
                        checked={platform.analyticsTracking}
                        onChange={e => setPlatform({...platform, analyticsTracking: e.target.checked})}
                      />
                      <span className="as-slider"></span>
                    </label>
                  </div>
                  
                  <div className="as-divider"></div>
                  
                  <div className="as-info-row">
                    <span>Platform Version</span>
                    <strong>v1.2.4 (Stable)</strong>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'danger' && (
              <div className="as-section">
                <h2>Danger Zone</h2>
                <p className="as-warning-text">Proceed with caution. Actions taken here are often irreversible.</p>
                <div className="as-card as-danger-card">
                  <div className="as-danger-action">
                    <div>
                      <strong>Export All Data</strong>
                      <p>Download a complete backup of the database in CSV format.</p>
                    </div>
                    <button type="button" className="as-btn-outline">Export Data</button>
                  </div>
                  
                  <div className="as-divider"></div>

                  <div className="as-danger-action">
                    <div>
                      <strong>Reset Platform Data</strong>
                      <p>Clear all transactions, orders, and logs. User accounts will be preserved.</p>
                    </div>
                    <button type="button" className="as-btn-danger">Reset Data</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminSettingsPage;
