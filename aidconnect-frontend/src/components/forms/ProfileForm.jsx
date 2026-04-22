// src/components/forms/ProfileForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { BLOOD_GROUPS, PAKISTAN_CITIES } from '../../utils/constants.js';
import { validateProfile, hasErrors } from '../../utils/validators.js';

// ─── Build form state from user object ───────────────────────────────────────
// Extracted so both useEffect and the Discard button use the same mapping.
// If fields are added later, update only this function.
function buildFormFromUser(user) {
  return {
    name:       user?.name       || '',
    phone:      user?.phone      || '',
    bloodGroup: user?.bloodGroup || '',
    city:       user?.location?.city || '',
    area:       user?.location?.area || '',
    notificationPreferences: {
      email: user?.notificationPreferences?.email ?? true,
      inApp: user?.notificationPreferences?.inApp ?? true,
    },
  };
}

// ─── ProfileForm ──────────────────────────────────────────────────────────────
/**
 * ProfileForm — reusable profile editing form for all roles.
 *
 * Props:
 *   user           {object}  — current user object from AuthContext
 *   onSubmit       {fn}      — async (payload) => void
 *   loading        {boolean} — disables form during submission
 *   apiError       {string}  — error message from parent
 *   successMessage {string}  — success message from parent
 *
 * Usage:
 *   const { user, updateUser } = useAuth();
 *   const [apiError, setApiError] = useState('');
 *   const [successMessage, setSuccessMessage] = useState('');
 *
 *   const handleSubmit = async (payload) => {
 *     try {
 *       const data = await updateMyProfile(payload);
 *       updateUser(data.user);
 *       setSuccessMessage('Profile updated successfully.');
 *     } catch (err) {
 *       setApiError(err.response?.data?.message || 'Update failed.');
 *     }
 *   };
 *
 *   <ProfileForm
 *     user={user} onSubmit={handleSubmit} loading={loading}
 *     apiError={apiError} successMessage={successMessage}
 *   />
 */
export default function ProfileForm({
  user,
  onSubmit,
  loading        = false,
  apiError       = '',
  // FIX: renamed from onSuccess (misleading — sounds like a callback)
  // to successMessage to match apiError naming convention
  successMessage = '',
}) {
  const [form,    setForm]    = useState(() => buildFormFromUser(user));
  const [errors,  setErrors]  = useState({});
  const [changed, setChanged] = useState(false);

  // ── Sync form when user object updates (e.g. after save) ──────────────────
  useEffect(() => {
    if (!user) return;
    // FIX: uses shared buildFormFromUser — no duplication with Discard button
    setForm(buildFormFromUser(user));
    setChanged(false);
  }, [user]);

  // ── Field change ──────────────────────────────────────────────────────────
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'notif-email' || name === 'notif-inApp') {
      const key = name === 'notif-email' ? 'email' : 'inApp';
      setForm((prev) => ({
        ...prev,
        notificationPreferences: {
          ...prev.notificationPreferences,
          [key]: checked,
        },
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    setChanged(true);
  }, [errors]);

  // ── Discard — resets to last saved user state ─────────────────────────────
  const handleDiscard = useCallback(() => {
    // FIX: uses shared buildFormFromUser — single source of truth
    setForm(buildFormFromUser(user));
    setErrors({});
    setChanged(false);
  }, [user]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    const clientErrors = validateProfile({
      name:  form.name,
      phone: form.phone,
    });

    if (hasErrors(clientErrors)) {
      setErrors(clientErrors);
      return;
    }

    // Build payload — only include non-empty values
    const payload = {};
    if (form.name.trim())  payload.name  = form.name.trim();
    if (form.phone.trim()) payload.phone = form.phone.trim();
    if (form.bloodGroup)   payload.bloodGroup = form.bloodGroup;

    // FIX: only send location fields that are actually filled
    // Previous version sent empty strings if only one field was filled
    if (form.city.trim()) payload.city = form.city.trim();
    if (form.area.trim()) payload.area = form.area.trim();

    payload.notificationPreferences = form.notificationPreferences;

    try {
      await onSubmit(payload);
      setChanged(false);
    } catch {
      // apiError handled by parent
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>

      {/* API error */}
      {apiError && (
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          <span className="alert-icon">⚠️</span>
          {apiError}
        </div>
      )}

      {/* Success message */}
      {successMessage && (
        <div className="alert alert-success" style={{ marginBottom: '20px' }}>
          <span className="alert-icon">✅</span>
          {successMessage}
        </div>
      )}

      {/* ── Name + Phone ─────────────────────────────────────────────────── */}
      <div className="form-row cols-2">
        <div className="form-group">
          <label className="form-label" htmlFor="pf-name">
            Full Name <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <input
            id="pf-name"
            name="name"
            type="text"
            className={`form-input ${errors.name ? 'error' : ''}`}
            placeholder="Muhammad Ali"
            value={form.name}
            onChange={handleChange}
            disabled={loading}
            autoComplete="name"
          />
          {errors.name && <div className="form-error">{errors.name}</div>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="pf-phone">
            Phone
            <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: '6px' }}>
              (optional)
            </span>
          </label>
          <input
            id="pf-phone"
            name="phone"
            type="tel"
            className={`form-input ${errors.phone ? 'error' : ''}`}
            placeholder="03001234567"
            value={form.phone}
            onChange={handleChange}
            disabled={loading}
            autoComplete="tel"
          />
          {errors.phone && <div className="form-error">{errors.phone}</div>}
        </div>
      </div>

      {/* ── Blood Group ──────────────────────────────────────────────────── */}
      <div className="form-group">
        <label className="form-label" htmlFor="pf-bloodGroup">
          Blood Group
          <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: '6px' }}>
            (optional)
          </span>
        </label>
        <select
          id="pf-bloodGroup"
          name="bloodGroup"
          className="form-select"
          value={form.bloodGroup}
          onChange={handleChange}
          disabled={loading}
        >
          <option value="">Select blood group</option>
          {BLOOD_GROUPS.map((bg) => (
            <option key={bg} value={bg}>{bg}</option>
          ))}
        </select>
        <div className="form-hint">
          Helps us match you with blood donation requests
        </div>
      </div>

      {/* ── Location ─────────────────────────────────────────────────────── */}
      <div className="form-row cols-2">
        <div className="form-group">
          <label className="form-label" htmlFor="pf-city">City</label>
          <select
            id="pf-city"
            name="city"
            className="form-select"
            value={form.city}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="">Select city</option>
            {PAKISTAN_CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="pf-area">Area / Street</label>
          <input
            id="pf-area"
            name="area"
            type="text"
            className="form-input"
            placeholder="e.g. Gulshan-e-Iqbal"
            value={form.area}
            onChange={handleChange}
            disabled={loading}
          />
        </div>
      </div>

      {/* ── Notification Preferences ─────────────────────────────────────── */}
      <div className="form-group">
        <label className="form-label">Notification Preferences</label>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            padding: '16px',
            background: 'var(--green-50)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--green-100)',
          }}
        >
          {/* Email notifications */}
          {/* FIX: outer <label> replaced with <div> — nesting <label> inside
              <label> is invalid HTML and causes double-fire on checkbox click.
              The toggle-switch <label> already handles the click target. */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: loading ? 'not-allowed' : 'default',
            }}
          >
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>
                Email Notifications
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Receive updates about your requests via email
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                name="notif-email"
                checked={form.notificationPreferences.email}
                onChange={handleChange}
                disabled={loading}
              />
              <span className="toggle-track" />
            </label>
          </div>

          <div style={{ height: '1px', background: 'var(--green-100)' }} />

          {/* In-app notifications */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: loading ? 'not-allowed' : 'default',
            }}
          >
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>
                In-App Notifications
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                See alerts inside the AidConnect dashboard
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                name="notif-inApp"
                checked={form.notificationPreferences.inApp}
                onChange={handleChange}
                disabled={loading}
              />
              <span className="toggle-track" />
            </label>
          </div>
        </div>
      </div>

      {/* ── Submit + Discard ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={loading || !changed}
          style={{ flex: 1 }}
        >
          {loading ? (
            <><span className="spinner" /> Saving…</>
          ) : (
            'Save Changes'
          )}
        </button>

        {/* Discard — only shown when there are unsaved changes */}
        {changed && !loading && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleDiscard}
          >
            Discard
          </button>
        )}
      </div>

    </form>
  );
}