// src/pages/user/UserProfile.jsx
import React, { useState, useCallback } from 'react';
import Navbar from '../../components/common/Navbar.jsx';
import ProfileForm from '../../components/forms/ProfileForm.jsx';
import Modal from '../../components/common/Modal.jsx';
import useAuth from '../../hooks/useAuth.js';
import { updateProfile, changePassword, deleteAccount } from '../../api/auth.api.js';
import { validateChangePassword, hasErrors } from '../../utils/validators.js';
import { getInitials, formatRole, formatDate } from '../../utils/formatters.js';

// ─── Section tab bar ──────────────────────────────────────────────────────────
function SectionTabs({ active, onChange }) {
  const tabs = [
    { value: 'profile',  icon: '👤', label: 'Profile'   },
    { value: 'password', icon: '🔒', label: 'Password'  },
    { value: 'danger',   icon: '⚠️', label: 'Account'   },
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

// ─── Change password form ─────────────────────────────────────────────────────
function ChangePasswordForm({ onSuccess }) {
  const [form, setForm]       = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors]   = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  }, [errors]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    const errs = validateChangePassword(form);
    if (hasErrors(errs)) { setErrors(errs); return; }
    setLoading(true);
    try {
      await changePassword({
        currentPassword: form.currentPassword,
        newPassword:     form.newPassword,
      });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      onSuccess('Password changed successfully.');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  const passwordField = (id, name, label, show, setShow, placeholder, autoComplete) => (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          name={name}
          type={show ? 'text' : 'password'}
          className={`form-input ${errors[name] ? 'error' : ''}`}
          placeholder={placeholder}
          value={form[name]}
          onChange={handleChange}
          disabled={loading}
          autoComplete={autoComplete}
          style={{ paddingRight: '44px' }}
        />
        <button
          type="button"
          onClick={() => setShow((p) => !p)}
          disabled={loading}
          style={{
            position: 'absolute', right: '12px', top: '50%',
            transform: 'translateY(-50%)', background: 'none',
            border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontSize: '16px', padding: 0,
          }}
        >
          {show ? '🙈' : '👁️'}
        </button>
      </div>
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
      {passwordField('cp-current', 'currentPassword', 'Current Password', showCurrent, setShowCurrent, 'Enter current password', 'current-password')}
      {passwordField('cp-new',     'newPassword',     'New Password',     showNew,     setShowNew,     'Min 8 chars, uppercase + number', 'new-password')}
      {passwordField('cp-confirm', 'confirmPassword', 'Confirm New Password', showConfirm, setShowConfirm, 'Repeat new password', 'new-password')}
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

// ─── Danger zone ──────────────────────────────────────────────────────────────
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

      {/* Delete account */}
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
              Active requests will be cancelled. This cannot be undone.
            </div>
          </div>
          <button
            className="btn btn-danger"
            onClick={onDeleteAccount}
          >
            🗑 Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── UserProfile ──────────────────────────────────────────────────────────────
export default function UserProfile() {
  const { user, updateUser, logout } = useAuth();

  const [activeTab,    setActiveTab]    = useState('profile');
  const [profileLoad,  setProfileLoad]  = useState(false);
  const [successMsg,   setSuccessMsg]   = useState('');
  const [apiError,     setApiError]     = useState('');
  const [showDelete,   setShowDelete]   = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // ── Profile update ─────────────────────────────────────────────────────────
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

  // ── Delete account ─────────────────────────────────────────────────────────
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
    <Navbar title="My Profile">
      <div className="page-wrapper">

        {/* ── Profile hero ──────────────────────────────────────────────── */}
        <div className="profile-hero">
          {/* Avatar */}
          {user?.profilePicture ? (
            <img
              src={user.profilePicture}
              alt={user.name}
              className="avatar avatar-xl"
              style={{ objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div className="avatar avatar-xl" style={{ flexShrink: 0 }}>
              {getInitials(user?.name)}
            </div>
          )}

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="profile-hero-name">{user?.name}</div>
            <div className="profile-hero-role">{formatRole(user?.role)}</div>
            <div className="profile-hero-email">{user?.email}</div>

            {/* Badges row */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
              {user?.isVerified && (
                <span className="badge badge-green" style={{ fontSize: '11px' }}>
                  ✓ Verified
                </span>
              )}
              {user?.bloodGroup && (
                <span className="badge badge-red" style={{ fontSize: '11px' }}>
                  🩸 {user.bloodGroup}
                </span>
              )}
              {user?.location?.city && (
                <span className="badge badge-stone" style={{ fontSize: '11px' }}>
                  📍 {user.location.city}
                </span>
              )}
              <span className="badge badge-stone" style={{ fontSize: '11px' }}>
                📅 Joined {formatDate(user?.createdAt)}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div
            style={{
              display: 'flex',
              gap: '24px',
              flexShrink: 0,
            }}
          >
            {[
              { label: 'Requests',  value: user?.totalRequestsMade || 0 },
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'white', letterSpacing: '-1px' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Success / error alerts ────────────────────────────────────── */}
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

        {/* ── Card with tabs ────────────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 300px',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          {/* Main form card */}
          <div className="card anim-fade-up delay-100">
            <div className="card-body">
              <SectionTabs active={activeTab} onChange={setActiveTab} />

              {/* Profile tab */}
              {activeTab === 'profile' && (
                <ProfileForm
                  user={user}
                  onSubmit={handleProfileSubmit}
                  loading={profileLoad}
                  apiError={apiError}
                  successMessage={successMsg}
                />
              )}

              {/* Password tab */}
              {activeTab === 'password' && (
                <ChangePasswordForm onSuccess={showSuccess} />
              )}

              {/* Danger zone tab */}
              {activeTab === 'danger' && (
                <DangerZone onDeleteAccount={() => setShowDelete(true)} />
              )}
            </div>
          </div>

          {/* Right sidebar — account info */}
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            className="anim-fade-up delay-200"
          >
            {/* Account info card */}
            <div className="card">
              <div className="card-body">
                <div className="section-title" style={{ marginBottom: '16px' }}>
                  Account Info
                </div>

                {[
                  { icon: '📧', label: 'Email',    value: user?.email              },
                  { icon: '📱', label: 'Phone',    value: user?.phone || 'Not set' },
                  { icon: '🩸', label: 'Blood',    value: user?.bloodGroup || 'Not set' },
                  { icon: '📍', label: 'City',     value: user?.location?.city || 'Not set' },
                  { icon: '📅', label: 'Member since', value: formatDate(user?.createdAt) },
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

            {/* Tips card */}
            <div
              style={{
                padding: '16px 20px',
                background: 'var(--green-50)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--green-100)',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--green-700)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>
                💡 Profile Tips
              </div>
              {[
                'Add your blood group to help with donation requests',
                'Keep your location updated for faster matching',
                'A verified profile gets prioritised by responders',
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

      {/* ── Delete account modal ───────────────────────────────────────── */}
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
            This will permanently delete your account and all your data including:
          </p>
          <ul style={{ paddingLeft: '20px', fontSize: '13px', color: 'var(--text-mid)', lineHeight: 2 }}>
            <li>All your emergency requests</li>
            <li>Your profile and location data</li>
            <li>All notifications and history</li>
          </ul>
          <div className="alert alert-error" style={{ marginTop: '16px' }}>
            <span className="alert-icon">⚠️</span>
            This action is permanent and cannot be undone.
          </div>
        </div>
      </Modal>

    </Navbar>
  );
}