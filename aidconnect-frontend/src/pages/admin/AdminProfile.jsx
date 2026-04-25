// src/pages/admin/AdminProfile.jsx
import React, { useState, useCallback } from 'react';
import Navbar from '../../components/common/Navbar.jsx';
import ProfileForm from '../../components/forms/ProfileForm.jsx';
import Modal from '../../components/common/Modal.jsx';
import useAuth from '../../hooks/useAuth.js';
import { updateProfile, changePassword, deleteAccount } from '../../api/auth.api.js';
import { validateChangePassword, hasErrors } from '../../utils/validators.js';
import { getInitials, formatRole, formatDate } from '../../utils/formatters.js';

function SectionTabs({ active, onChange }) {
  const tabs = [
    { value: 'profile',  icon: '👤', label: 'Profile'  },
    { value: 'password', icon: '🔒', label: 'Password' },
    { value: 'danger',   icon: '⚠️', label: 'Account'  },
  ];

  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          className={`tab-btn${active === tab.value ? ' active' : ''}`}
          onClick={() => onChange(tab.value)}
        >
          <span style={{ marginRight: '6px' }}>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function ChangePasswordForm({ onSuccess }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  }, [errors]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    const errs = validateChangePassword(form);
    if (hasErrors(errs)) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      onSuccess('Password changed successfully.');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  const passwordField = (id, name, label, type, placeholder, autoComplete) => (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>{label}</label>
      <input
        id={id}
        name={name}
        type={type}
        className={`form-input ${errors[name] ? 'error' : ''}`}
        placeholder={placeholder}
        value={form[name]}
        onChange={handleChange}
        disabled={loading}
        autoComplete={autoComplete}
      />
      {errors[name] && <div className="form-error">{errors[name]}</div>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} noValidate>
      {apiError && (
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          <span className="alert-icon">⚠️</span>
          {apiError}
        </div>
      )}
      {passwordField('ap-current', 'currentPassword', 'Current Password', 'password', 'Enter current password', 'current-password')}
      {passwordField('ap-new', 'newPassword', 'New Password', 'password', 'Min 8 chars, uppercase + number', 'new-password')}
      {passwordField('ap-confirm', 'confirmPassword', 'Confirm New Password', 'password', 'Repeat new password', 'new-password')}
      <button
        type="submit"
        className="btn btn-primary btn-lg"
        disabled={loading}
        style={{ width: '100%' }}
      >
        {loading ? <><span className="spinner" /> Updating…</> : '🔒 Update Password'}
      </button>
    </form>
  );
}

function DangerZone({ onDeleteAccount }) {
  return (
    <div>
      <div className="alert alert-warning" style={{ marginBottom: '24px' }}>
        <span className="alert-icon">⚠️</span>
        <div>
          <strong>Danger Zone</strong> — Actions here are irreversible.
          Please proceed with caution.
        </div>
      </div>
      <div
        style={{
          padding: '20px',
          border: '1.5px solid #f5c6c2',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--danger-bg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-dark)', marginBottom: '4px' }}>
              Delete Account
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '380px', lineHeight: 1.6 }}>
              Permanently delete your account and all associated data.
              This cannot be undone.
            </div>
          </div>
          <button className="btn btn-danger" onClick={onDeleteAccount}>
            🗑 Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminProfile() {
  const { user, updateUser, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('profile');
  const [profileLoad, setProfileLoad] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [apiError, setApiError] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleProfileSubmit = useCallback(async (payload) => {
    setApiError('');
    setProfileLoad(true);
    try {
      const data = await updateProfile(payload);
      updateUser(data.user || data.data);
      showSuccess('Profile updated successfully.');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to update profile.');
      throw err;
    } finally {
      setProfileLoad(false);
    }
  }, [updateUser]);

  const handleDeleteConfirm = useCallback(async () => {
    setDeleteLoading(true);
    try {
      await deleteAccount();
      await logout();
    } catch {
      setDeleteLoading(false);
      setShowDelete(false);
    }
  }, [logout]);

  return (
    <Navbar title="Admin Profile">
      <div className="page-wrapper">
        <div className="profile-hero">
          {user?.profilePicture ? (
            <img
              src={user.profilePicture}
              alt={user.name}
              className="avatar avatar-xl"
              style={{ objectFit: 'cover', flexShrink: 0, border: '4px solid rgba(255,255,255,0.2)' }}
            />
          ) : (
            <div className="avatar avatar-xl" style={{ flexShrink: 0 }}>
              {getInitials(user?.name)}
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="profile-hero-name">{user?.name}</div>
            <div className="profile-hero-role">{formatRole(user?.role)} Access</div>
            <div className="profile-hero-email">{user?.email}</div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
              {user?.isVerified && (
                <span className="badge badge-green" style={{ fontSize: '11px' }}>✓ Verified</span>
              )}
              <span className="badge badge-blue" style={{ fontSize: '11px' }}>🛡 System Admin</span>
              <span className="badge badge-stone" style={{ fontSize: '11px' }}>
                📅 Joined {formatDate(user?.createdAt)}
              </span>
            </div>
          </div>

          <div style={{ flexShrink: 0, textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'white', letterSpacing: '-1px' }}>
              {user?.isActive ? 'ON' : 'OFF'}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
              Account
            </div>
          </div>
        </div>

        {successMsg && (
          <div className="alert alert-success anim-fade-up" style={{ marginBottom: '20px' }}>
            <span className="alert-icon">✅</span>
            {successMsg}
          </div>
        )}
        {apiError && activeTab === 'profile' && (
          <div className="alert alert-error anim-fade-up" style={{ marginBottom: '20px' }}>
            <span className="alert-icon">⚠️</span>
            {apiError}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>
          <div className="card anim-fade-up delay-100">
            <div className="card-body">
              <SectionTabs active={activeTab} onChange={setActiveTab} />

              {activeTab === 'profile' && (
                <ProfileForm
                  user={user}
                  onSubmit={handleProfileSubmit}
                  loading={profileLoad}
                  apiError={apiError}
                  successMessage={successMsg}
                />
              )}

              {activeTab === 'password' && (
                <ChangePasswordForm onSuccess={showSuccess} />
              )}

              {activeTab === 'danger' && (
                <DangerZone onDeleteAccount={() => setShowDelete(true)} />
              )}
            </div>
          </div>

          <div className="anim-fade-up delay-200" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card">
              <div className="card-body">
                <div className="section-title" style={{ marginBottom: '16px' }}>
                  Account Info
                </div>
                {[
                  { icon: '📧', label: 'Email', value: user?.email },
                  { icon: '📱', label: 'Phone', value: user?.phone || 'Not set' },
                  { icon: '🛡️', label: 'Role', value: formatRole(user?.role) },
                  { icon: '📅', label: 'Member Since', value: formatDate(user?.createdAt) },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 0',
                      borderBottom: '1px solid var(--stone-200)',
                    }}
                  >
                    <span style={{ fontSize: '15px', flexShrink: 0 }}>{item.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        {item.label}
                      </div>
                      <div
                        style={{
                          fontSize: '13px',
                          color: item.value === 'Not set' ? 'var(--text-light)' : 'var(--text-dark)',
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                padding: '16px 20px',
                background: 'var(--green-50)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--green-100)',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--green-700)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  marginBottom: '12px',
                }}
              >
                💡 Admin Notes
              </div>
              {[
                'Use the Users, Volunteers, Providers, and Analytics pages for platform management',
                'Keep your profile updated for accurate admin identity display',
                'Changes here update the same shared account used across the platform',
              ].map((tip, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '8px',
                    fontSize: '12px',
                    color: 'var(--text-mid)',
                    lineHeight: 1.5,
                  }}
                >
                  <span style={{ color: 'var(--green-600)', fontWeight: 700, flexShrink: 0 }}>
                    {i + 1}.
                  </span>
                  {tip}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        title="Delete Account"
        icon="🗑"
        onConfirm={handleDeleteConfirm}
        confirmLabel="Delete My Account"
        confirmVariant="danger"
        loading={deleteLoading}
      >
        <div>
          <p style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--text-mid)', lineHeight: 1.7 }}>
            This will permanently delete your account and all associated data.
          </p>
          <div className="alert alert-error" style={{ marginTop: '16px' }}>
            <span className="alert-icon">⚠️</span>
            This action is permanent and cannot be undone.
          </div>
        </div>
      </Modal>
    </Navbar>
  );
}