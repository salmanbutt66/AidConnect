import React, { useState, useCallback } from 'react';
import Navbar from '../../components/common/Navbar.jsx';
import ProfileForm from '../../components/forms/ProfileForm.jsx';
import Modal from '../../components/common/Modal.jsx';
import useAuth from '../../hooks/useAuth.js';
import { updateProfile, changePassword, deleteAccount } from '../../api/auth.api.js';
import { validateChangePassword, hasErrors } from '../../utils/validators.js';
import { getInitials, formatRole, formatDate } from '../../utils/formatters.js';
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .up-root * { font-family: 'Plus Jakarta Sans', sans-serif; }

  @keyframes upFadeSlide {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes upScaleIn {
    from { opacity: 0; transform: scale(0.96); }
    to   { opacity: 1; transform: scale(1);    }
  }
  @keyframes upPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(30,125,70,0.35); }
    50%       { box-shadow: 0 0 0 8px rgba(30,125,70,0);  }
  }
  @keyframes spinnerRing {
    to { transform: rotate(360deg); }
  }
  @keyframes upShimmer {
    0%   { background-position: -400px 0; }
    100% { background-position:  400px 0; }
  }

  
  .up-hero {
    position: relative;
    overflow: hidden;
    background: linear-gradient(135deg, #0d3d22 0%, #1a6b3c 55%, #229450 100%);
    border-radius: 20px;
    padding: 36px 40px;
    display: flex;
    align-items: center;
    gap: 28px;
    margin-bottom: 28px;
    animation: upFadeSlide 0.5s ease both;
    box-shadow: 0 8px 40px rgba(13,61,34,0.28);
  }
  .up-hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 60% 80% at 85% -10%, rgba(255,255,255,0.07) 0%, transparent 70%),
      radial-gradient(ellipse 40% 60% at -5% 110%, rgba(255,255,255,0.05) 0%, transparent 60%);
    pointer-events: none;
  }
  .up-hero-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
  }

  
  .up-avatar {
    width: 80px; height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1));
    border: 3px solid rgba(255,255,255,0.25);
    display: flex; align-items: center; justify-content: center;
    font-size: 26px; font-weight: 800;
    color: #fff;
    flex-shrink: 0;
    animation: upPulse 3s ease-in-out infinite;
    backdrop-filter: blur(4px);
    letter-spacing: -0.5px;
  }
  .up-avatar img {
    width: 100%; height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }

  
  .up-hero-name  { font-size: 22px; font-weight: 800; color: #fff; letter-spacing: -0.5px; line-height: 1.2; }
  .up-hero-role  { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.65); text-transform: uppercase; letter-spacing: 1.2px; margin-top: 3px; }
  .up-hero-email { font-size: 13px; color: rgba(255,255,255,0.75); margin-top: 4px; }

  
  .up-hero-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 11px; font-weight: 600;
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.18);
  }
  .up-hero-badge.green { background: rgba(34,148,80,0.4); color: #a7f3c0; }
  .up-hero-badge.red   { background: rgba(192,57,43,0.35); color: #fca5a5; }
  .up-hero-badge.stone { background: rgba(255,255,255,0.12); color: rgba(255,255,255,0.8); }

  
  .up-hero-stat {
    flex-shrink: 0;
    text-align: center;
    padding: 16px 24px;
    background: rgba(255,255,255,0.1);
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.15);
    backdrop-filter: blur(8px);
  }
  .up-hero-stat-num  { font-size: 32px; font-weight: 800; color: #fff; letter-spacing: -2px; line-height: 1; }
  .up-hero-stat-lbl  { font-size: 11px; color: rgba(255,255,255,0.6); margin-top: 4px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.8px; }

  
  .up-alert {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 14px 18px;
    border-radius: 12px;
    font-size: 13px; font-weight: 500; line-height: 1.6;
    margin-bottom: 20px;
    animation: upScaleIn 0.3s ease both;
    border: 1px solid;
  }
  .up-alert.success { background: #f0fdf4; border-color: #86efac; color: #15803d; }
  .up-alert.error   { background: #fef2f2; border-color: #fca5a5; color: #b91c1c; }
  .up-alert.warning { background: #fffbeb; border-color: #fcd34d; color: #92400e; }
  .up-alert-icon {
    width: 18px; height: 18px; flex-shrink: 0; margin-top: 1px;
  }

  
  .up-tabs {
    display: flex; gap: 4px;
    background: var(--green-50, #f2fbf6);
    border-radius: 14px;
    padding: 5px;
    margin-bottom: 28px;
    border: 1px solid var(--green-100, #e0f5e9);
  }
  .up-tab-btn {
    flex: 1;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    padding: 10px 14px;
    border-radius: 10px;
    border: none; background: transparent;
    font-size: 13px; font-weight: 600;
    color: var(--text-muted, #6b7a64);
    cursor: pointer;
    transition: all 0.22s ease;
  }
  .up-tab-btn:hover { color: var(--green-700, #1e7d46); background: rgba(30,125,70,0.06); }
  .up-tab-btn.active {
    background: #fff;
    color: var(--green-800, #1a6b3c);
    box-shadow: 0 2px 10px rgba(13,61,34,0.12);
  }
  .up-tab-icon { width: 16px; height: 16px; }

  
  .up-card {
    background: #fff;
    border-radius: 18px;
    border: 1px solid #e8eee8;
    box-shadow: 0 2px 16px rgba(13,61,34,0.06);
    overflow: hidden;
    animation: upFadeSlide 0.45s ease both;
  }
  .up-card-body { padding: 28px; }

  
  .up-section-title {
    font-size: 13px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 1px;
    color: var(--text-muted, #6b7a64);
    margin-bottom: 18px;
    display: flex; align-items: center; gap: 8px;
  }
  .up-section-title::after {
    content: ''; flex: 1; height: 1px;
    background: linear-gradient(to right, #e0f5e9, transparent);
  }

  
  .up-info-row {
    display: flex; align-items: center; gap: 12px;
    padding: 11px 0;
    border-bottom: 1px solid #f0f5f0;
    transition: background 0.18s;
  }
  .up-info-row:last-child { border-bottom: none; }
  .up-info-row:hover { background: var(--green-50, #f2fbf6); border-radius: 8px; padding-left: 8px; padding-right: 8px; margin: 0 -8px; }
  .up-info-icon {
    width: 34px; height: 34px; flex-shrink: 0;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    background: var(--green-50, #f2fbf6);
    border: 1px solid var(--green-100, #e0f5e9);
  }
  .up-info-icon svg { width: 15px; height: 15px; color: var(--green-700, #1e7d46); }
  .up-info-lbl { font-size: 11px; color: var(--text-muted, #6b7a64); font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; }
  .up-info-val { font-size: 13px; color: var(--text-dark, #141b11); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .up-info-val.muted { color: var(--text-muted, #6b7a64); font-style: italic; }

  
  .up-tips {
    padding: 20px;
    background: linear-gradient(135deg, var(--green-50,#f2fbf6), #fff);
    border-radius: 16px;
    border: 1px solid var(--green-100,#e0f5e9);
  }
  .up-tips-title {
    font-size: 11px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.9px;
    color: var(--green-700,#1e7d46);
    margin-bottom: 14px;
    display: flex; align-items: center; gap: 7px;
  }
  .up-tip-row {
    display: flex; gap: 10px; align-items: flex-start;
    margin-bottom: 10px; font-size: 12px;
    color: var(--text-mid,#3a4a35); line-height: 1.55;
  }
  .up-tip-num {
    width: 20px; height: 20px; flex-shrink: 0;
    border-radius: 50%;
    background: var(--green-600,#229450);
    color: #fff; font-size: 10px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    margin-top: 1px;
  }

  
  .up-pw-field { position: relative; }
  .up-pw-toggle {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer;
    color: var(--text-muted,#6b7a64); padding: 4px;
    display: flex; align-items: center;
    transition: color 0.18s;
  }
  .up-pw-toggle:hover { color: var(--green-700,#1e7d46); }
  .up-pw-toggle svg { width: 16px; height: 16px; }

  
  .up-spinner {
    display: inline-block; width: 15px; height: 15px;
    border: 2px solid rgba(255,255,255,0.35);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spinnerRing 0.7s linear infinite;
    vertical-align: middle; margin-right: 7px;
  }

  
  .up-danger-box {
    padding: 20px;
    border: 1.5px solid #fca5a5;
    border-radius: 14px;
    background: #fff5f5;
    display: flex; align-items: flex-start;
    justify-content: space-between;
    gap: 16px; flex-wrap: wrap;
  }
  .up-danger-title { font-weight: 700; font-size: 15px; color: #7f1d1d; margin-bottom: 4px; }
  .up-danger-desc  { font-size: 13px; color: #991b1b; max-width: 380px; line-height: 1.6; }

  
  .up-grid {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 24px;
    align-items: start;
  }
  @media (max-width: 840px) {
    .up-grid { grid-template-columns: 1fr; }
    .up-hero { flex-direction: column; text-align: center; padding: 28px 24px; }
    .up-hero-badge-row { justify-content: center !important; }
    .up-hero-stat { width: 100%; }
  }

  
  .up-btn-submit {
    width: 100%;
    padding: 13px;
    border: none; border-radius: 12px; cursor: pointer;
    background: linear-gradient(135deg, #1a6b3c, #229450);
    color: #fff; font-size: 14px; font-weight: 700;
    font-family: 'Plus Jakarta Sans', sans-serif;
    letter-spacing: 0.2px;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: all 0.22s ease;
    box-shadow: 0 4px 16px rgba(26,107,60,0.25);
  }
  .up-btn-submit:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(26,107,60,0.35);
  }
  .up-btn-submit:disabled { opacity: 0.65; cursor: not-allowed; }

  .up-btn-danger {
    padding: 10px 20px;
    border: 1.5px solid #ef4444; border-radius: 10px; cursor: pointer;
    background: transparent; color: #dc2626;
    font-size: 13px; font-weight: 700;
    font-family: 'Plus Jakarta Sans', sans-serif;
    display: flex; align-items: center; gap: 7px;
    transition: all 0.22s ease;
    white-space: nowrap;
  }
  .up-btn-danger:hover {
    background: #dc2626; color: #fff;
    box-shadow: 0 4px 14px rgba(220,38,38,0.3);
    transform: translateY(-1px);
  }
  .up-btn-danger svg { width: 14px; height: 14px; }

  
  .up-d1 { animation-delay: 0.08s; }
  .up-d2 { animation-delay: 0.16s; }
  .up-d3 { animation-delay: 0.24s; }
`;
const Icon = {
  User: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  ),
  Lock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  Shield: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Mail: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  ),
  Phone: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.08 3.4 2 2 0 0 1 3.05 1.25h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 9a16 16 0 0 0 5.91 5.91l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21 16.92z"/>
    </svg>
  ),
  Drop: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
    </svg>
  ),
  MapPin: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Calendar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  ),
  Eye: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  EyeOff: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
    </svg>
  ),
  AlertCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  AlertTriangle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  ),
  Lightbulb: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
      <path d="M9 18h6M10 22h4"/>
    </svg>
  ),
  CheckBadge: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 4.8 5.3.8-3.8 3.7.9 5.3L12 14l-4.8 2.6.9-5.3L4.3 7.6l5.3-.8z"/>
    </svg>
  ),
};
function SectionTabs({ active, onChange }) {
  const tabs = [
    { value: 'profile',  Icon: Icon.User,   label: 'Profile'  },
    { value: 'password', Icon: Icon.Lock,   label: 'Password' },
    { value: 'danger',   Icon: Icon.Shield, label: 'Account'  },
  ];
  return (
    <div className="up-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          className={`up-tab-btn${active === tab.value ? ' active' : ''}`}
          onClick={() => onChange(tab.value)}
        >
          <span className="up-tab-icon"><tab.Icon /></span>
          {tab.label}
        </button>
      ))}
    </div>
  );
}
function UPAlert({ type = 'error', children }) {
  const IconComp = type === 'success' ? Icon.CheckCircle : Icon.AlertCircle;
  return (
    <div className={`up-alert ${type}`}>
      <span className="up-alert-icon"><IconComp /></span>
      <div>{children}</div>
    </div>
  );
}
function ChangePasswordForm({ onSuccess }) {
  const [form,     setForm]     = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [errors,   setErrors]   = useState({});
  const [apiError, setApiError] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [show, setShow] = useState({ currentPassword: false, newPassword: false, confirmPassword: false });

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  }, [errors]);

  const toggleShow = (field) => setShow((p) => ({ ...p, [field]: !p[field] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    const errs = validateChangePassword(form);
    if (hasErrors(errs)) { setErrors(errs); return; }
    setLoading(true);
    try {
      await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      onSuccess('Password changed successfully.');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { id: 'cp-current', name: 'currentPassword', label: 'Current Password',     placeholder: 'Enter current password',          autoComplete: 'current-password' },
    { id: 'cp-new',     name: 'newPassword',     label: 'New Password',         placeholder: 'Min 8 chars, uppercase + number', autoComplete: 'new-password'     },
    { id: 'cp-confirm', name: 'confirmPassword', label: 'Confirm New Password', placeholder: 'Repeat new password',             autoComplete: 'new-password'     },
  ];

  return (
    <form onSubmit={handleSubmit} noValidate>
      {apiError && <UPAlert type="error" style={{ marginBottom: 20 }}>{apiError}</UPAlert>}

      {fields.map((f) => (
        <div className="form-group" key={f.id}>
          <label className="form-label" htmlFor={f.id}>{f.label}</label>
          <div className="up-pw-field">
            <input
              id={f.id}
              name={f.name}
              type={show[f.name] ? 'text' : 'password'}
              className={`form-input${errors[f.name] ? ' error' : ''}`}
              placeholder={f.placeholder}
              value={form[f.name]}
              onChange={handleChange}
              disabled={loading}
              autoComplete={f.autoComplete}
              style={{ paddingRight: '44px' }}
            />
            <button type="button" className="up-pw-toggle" onClick={() => toggleShow(f.name)} disabled={loading}>
              {show[f.name] ? <Icon.EyeOff /> : <Icon.Eye />}
            </button>
          </div>
          {errors[f.name] && <div className="form-error">{errors[f.name]}</div>}
        </div>
      ))}

      <button type="submit" className="up-btn-submit" disabled={loading}>
        {loading ? <><span className="up-spinner" /> Updating…</> : <><Icon.Lock /> Update Password</>}
      </button>
    </form>
  );
}
function DangerZone({ onDeleteAccount }) {
  return (
    <div>
      <div className="up-alert warning" style={{ marginBottom: '24px' }}>
        <span className="up-alert-icon"><Icon.AlertTriangle /></span>
        <div>
          <strong>Danger Zone</strong> — Actions here are irreversible. Please proceed with caution.
        </div>
      </div>
      <div className="up-danger-box">
        <div>
          <div className="up-danger-title">Delete Account</div>
          <div className="up-danger-desc">
            Permanently delete your account and all associated data.
            Active requests will be cancelled. This cannot be undone.
          </div>
        </div>
        <button className="up-btn-danger" onClick={onDeleteAccount}>
          <Icon.Trash /> Delete Account
        </button>
      </div>
    </div>
  );
}
function InfoRow({ IconComp, label, value }) {
  const isEmpty = !value || value === 'Not set';
  return (
    <div className="up-info-row">
      <div className="up-info-icon"><IconComp /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="up-info-lbl">{label}</div>
        <div className={`up-info-val${isEmpty ? ' muted' : ''}`}>{value || 'Not set'}</div>
      </div>
    </div>
  );
}
export default function UserProfile() {
  const { user, updateUser, logout } = useAuth();

  const [activeTab,     setActiveTab]     = useState('profile');
  const [profileLoad,   setProfileLoad]   = useState(false);
  const [successMsg,    setSuccessMsg]    = useState('');
  const [apiError,      setApiError]      = useState('');
  const [showDelete,    setShowDelete]    = useState(false);
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
    <Navbar title="My Profile">
<style>{STYLES}</style>

      <div className="page-wrapper up-root">
<div className="up-hero">
          <div className="up-hero-grid" />
<div className="up-avatar">
            {user?.profilePicture
              ? <img src={user.profilePicture} alt={user.name} />
              : getInitials(user?.name)
            }
          </div>
<div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
            <div className="up-hero-name">{user?.name}</div>
            <div className="up-hero-role">{formatRole(user?.role)}</div>
            <div className="up-hero-email">{user?.email}</div>

            <div
              className="up-hero-badge-row"
              style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}
            >
              {user?.isVerified && (
                <span className="up-hero-badge green">
                  <Icon.CheckBadge /> Verified
                </span>
              )}
              {user?.bloodGroup && (
                <span className="up-hero-badge red">
                  <Icon.Drop /> {user.bloodGroup}
                </span>
              )}
              {user?.location?.city && (
                <span className="up-hero-badge stone">
                  <Icon.MapPin /> {user.location.city}
                </span>
              )}
              <span className="up-hero-badge stone">
                <Icon.Calendar /> Joined {formatDate(user?.createdAt)}
              </span>
            </div>
          </div>
<div className="up-hero-stat" style={{ position: 'relative', zIndex: 1 }}>
            <div className="up-hero-stat-num">{user?.totalRequestsMade || 0}</div>
            <div className="up-hero-stat-lbl">Requests</div>
          </div>
        </div>
{successMsg && <UPAlert type="success">{successMsg}</UPAlert>}
        {apiError && activeTab === 'profile' && <UPAlert type="error">{apiError}</UPAlert>}
<div className="up-grid">
<div className="up-card up-d1">
            <div className="up-card-body">
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
<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
<div className="up-card up-d2">
              <div className="up-card-body">
                <div className="up-section-title">Account Info</div>
                <InfoRow IconComp={Icon.Mail}     label="Email"        value={user?.email} />
                <InfoRow IconComp={Icon.Phone}    label="Phone"        value={user?.phone} />
                <InfoRow IconComp={Icon.Drop}     label="Blood Group"  value={user?.bloodGroup} />
                <InfoRow IconComp={Icon.MapPin}   label="City"         value={user?.location?.city} />
                <InfoRow IconComp={Icon.Calendar} label="Member Since" value={formatDate(user?.createdAt)} />
              </div>
            </div>
<div className="up-tips up-d3" style={{ animation: 'upFadeSlide 0.45s ease both', animationDelay: '0.24s' }}>
              <div className="up-tips-title">
                <Icon.Lightbulb /> Profile Tips
              </div>
              {[
                'Add your blood group to help with donation requests.',
                'Keep your location updated for faster matching.',
                'A verified profile gets prioritised by responders.',
              ].map((tip, i) => (
                <div className="up-tip-row" key={i}>
                  <span className="up-tip-num">{i + 1}</span>
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
        icon={<Icon.Trash />}
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
          <div className="up-alert error" style={{ marginTop: '16px' }}>
            <span className="up-alert-icon"><Icon.AlertCircle /></span>
            This action is permanent and cannot be undone.
          </div>
        </div>
      </Modal>

    </Navbar>
  );
}