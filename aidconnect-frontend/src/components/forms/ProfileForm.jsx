import React, { useState, useEffect, useCallback } from 'react';
import { BLOOD_GROUPS, PAKISTAN_CITIES } from '../../utils/constants.js';
import { validateProfile, hasErrors } from '../../utils/validators.js';
import { AlertTriangle, CheckCircle, User, Phone, Droplet, MapPin, Navigation } from 'lucide-react';
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

export default function ProfileForm({
  user,
  onSubmit,
  loading        = false,
  apiError       = '',
  successMessage = '',
}) {
  const [form,    setForm]    = useState(() => buildFormFromUser(user));
  const [errors,  setErrors]  = useState({});
  const [changed, setChanged] = useState(false);
  useEffect(() => {
    if (!user) return;
    setForm(buildFormFromUser(user));
    setChanged(false);
  }, [user]);
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
  const handleDiscard = useCallback(() => {
    setForm(buildFormFromUser(user));
    setErrors({});
    setChanged(false);
  }, [user]);
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
    const payload = {};
    if (form.name.trim())  payload.name  = form.name.trim();
    if (form.phone.trim()) payload.phone = form.phone.trim();
    if (form.bloodGroup)   payload.bloodGroup = form.bloodGroup;
    if (form.city.trim()) payload.city = form.city.trim();
    if (form.area.trim()) payload.area = form.area.trim();

    payload.notificationPreferences = form.notificationPreferences;

    try {
      await onSubmit(payload);
      setChanged(false);
    } catch {
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
{apiError && (
        <div className="alert alert-error" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={18} color="var(--danger)" />
          <span>{apiError}</span>
        </div>
      )}
{successMessage && (
        <div className="alert alert-success" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={18} color="var(--green-700)" />
          <span>{successMessage}</span>
        </div>
      )}
<div className="form-row cols-2">
        <div className="form-group">
          <label className="form-label" htmlFor="pf-name">
            Full Name <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <div className="input-icon-wrap">
            <span className="input-icon"><User size={18} /></span>
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
          </div>
          {errors.name && <div className="form-error">{errors.name}</div>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="pf-phone">
            Phone
            <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: '6px' }}>
              (optional)
            </span>
          </label>
          <div className="input-icon-wrap">
            <span className="input-icon"><Phone size={18} /></span>
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
          </div>
          {errors.phone && <div className="form-error">{errors.phone}</div>}
        </div>
      </div>
<div className="form-group">
        <label className="form-label" htmlFor="pf-bloodGroup">
          Blood Group
          <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: '6px' }}>
            (optional)
          </span>
        </label>
        <div className="input-icon-wrap">
          <span className="input-icon"><Droplet size={18} /></span>
          <select
            id="pf-bloodGroup"
            name="bloodGroup"
            className="form-select"
            value={form.bloodGroup}
            onChange={handleChange}
            disabled={loading}
            style={{ paddingLeft: '38px' }}
          >
            <option value="">Select blood group</option>
            {BLOOD_GROUPS.map((bg) => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
        </div>
        <div className="form-hint">
          Helps us match you with blood donation requests
        </div>
      </div>
<div className="form-row cols-2">
        <div className="form-group">
          <label className="form-label" htmlFor="pf-city">City</label>
          <div className="input-icon-wrap">
            <span className="input-icon"><MapPin size={18} /></span>
            <select
              id="pf-city"
              name="city"
              className="form-select"
              value={form.city}
              onChange={handleChange}
              disabled={loading}
              style={{ paddingLeft: '38px' }}
            >
              <option value="">Select city</option>
              {PAKISTAN_CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="pf-area">Area / Street</label>
          <div className="input-icon-wrap">
            <span className="input-icon"><Navigation size={18} /></span>
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
      </div>
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
{}
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