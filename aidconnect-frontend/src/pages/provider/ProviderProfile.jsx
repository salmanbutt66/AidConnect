// src/pages/provider/ProviderProfile.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/common/Navbar.jsx';
import Loader from '../../components/common/Loader.jsx';
import Badge from '../../components/common/Badge.jsx';
import { getProviderProfile, updateProviderProfile } from '../../api/provider.api.js';
import { formatPhone, formatDate } from '../../utils/formatters.js';
import { SERVICE_TYPES, PAKISTAN_CITIES } from '../../utils/constants.js';

export default function ProviderProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [form,    setForm]    = useState({});

  // FIX: replaced toast with local error/success state
  const [error,      setError]      = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };
  const showError = (msg) => setError(msg);

  // ── Build form state from profile ──────────────────────────────────────────
  const buildForm = (p) => ({
    organizationName: p.organizationName || '',
    licenseNumber:    p.licenseNumber    || '',
    contactNumber:    p.contactNumber    || '',
    address:          p.address          || '',
    servicesOffered:  p.servicesOffered?.join(', ') || '',
    operatingHours: {
      open:  p.operatingHours?.open  || '08:00',
      close: p.operatingHours?.close || '22:00',
    },
  });

  // ── Fetch profile ──────────────────────────────────────────────────────────
  // FIX: safe extraction consistent with ProviderDashboard
  const fetchProfile = useCallback(async () => {
    try {
      const data = await getProviderProfile();
      const provider = data.provider || data.data || data;
      setProfile(provider);
      setForm(buildForm(provider));
    } catch (err) {
      showError('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // ── Handle form field change ───────────────────────────────────────────────
  const handleChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError('');
  }, [error]);

  // ── Save changes ───────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    // FIX: validation error now uses local state instead of toast
    if (!form.organizationName?.trim()) {
      showError('Organization name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        servicesOffered: form.servicesOffered
          ? form.servicesOffered.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };
      const data = await updateProviderProfile(payload);
      // FIX: safe extraction
      const updated = data.provider || data.data || data;
      setProfile(updated);
      setForm(buildForm(updated));
      setEditing(false);
      showSuccess('Profile updated successfully.');
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }, [form]);

  // ── Service type label ─────────────────────────────────────────────────────
  const serviceTypeLabel = SERVICE_TYPES.find(
    (s) => s.value === profile?.serviceType
  );

  if (loading) {
    return (
      <Navbar title="My Profile">
        <div className="page-wrapper">
          <Loader variant="card" message="Loading profile..." />
        </div>
      </Navbar>
    );
  }

  return (
    <Navbar title="My Profile">
      <div className="page-wrapper">

        {/* ── Page header ───────────────────────────────────────────────── */}
        <div className="page-header">
          <h1>My Profile</h1>
          <p>Manage your organization's information and service details.</p>
        </div>

        {/* ── Alerts ────────────────────────────────────────────────────── */}
        {error && (
          <div className="alert alert-error anim-fade-up" style={{ marginBottom: '20px' }}>
            <span className="alert-icon">⚠️</span>
            {error}
            <button
              onClick={() => setError('')}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--danger)',
                fontWeight: 700,
              }}
            >✕</button>
          </div>
        )}
        {successMsg && (
          <div className="alert alert-success anim-fade-up" style={{ marginBottom: '20px' }}>
            <span className="alert-icon">✅</span>
            {successMsg}
          </div>
        )}

        {/* ── Profile header card ───────────────────────────────────────── */}
        <div className="card" style={{ marginBottom: '20px' }}>
          {/* FIX: added card-body wrapper */}
          <div className="card-body">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* Org avatar */}
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--green-100)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '30px',
                    flexShrink: 0,
                  }}
                >
                  {serviceTypeLabel?.emoji || '🏥'}
                </div>
                <div>
                  <h2
                    style={{
                      margin: '0 0 6px',
                      fontSize: '20px',
                      fontWeight: 700,
                      color: 'var(--text-dark)',
                    }}
                  >
                    {profile?.organizationName}
                  </h2>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Badge color={profile?.isVerified ? 'green' : 'orange'} dot>
                      {profile?.isVerified ? 'Verified' : 'Pending Verification'}
                    </Badge>
                    <Badge color={profile?.isAvailable ? 'green' : 'stone'}>
                      {profile?.isAvailable ? 'Available' : 'Unavailable'}
                    </Badge>
                    {serviceTypeLabel && (
                      <Badge color="blue">
                        {serviceTypeLabel.emoji} {serviceTypeLabel.label}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Edit button */}
              {!editing && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setEditing(true); setError(''); }}
                >
                  ✏️ Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── View mode ─────────────────────────────────────────────────── */}
        {!editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Organization details */}
            <div className="card">
              {/* FIX: added card-body wrapper */}
              <div className="card-body">
                <div className="section-title" style={{ marginBottom: '16px' }}>
                  Organization Details
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                  }}
                >
                  {[
                    { label: 'Organization Name', value: profile?.organizationName,                   icon: '🏢' },
                    { label: 'Service Type',       value: serviceTypeLabel?.label,                    icon: '🔧' },
                    { label: 'License Number',     value: profile?.licenseNumber || '—',              icon: '📋' },
                    { label: 'Contact Number',     value: formatPhone(profile?.contactNumber) || '—', icon: '📞' },
                    { label: 'Address',            value: profile?.address || '—',                    icon: '📍' },
                    { label: 'Member Since',       value: formatDate(profile?.createdAt),             icon: '📅' },
                  ].map((item) => (
                    <div key={item.label}>
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '4px',
                        }}
                      >
                        {item.icon} {item.label}
                      </div>
                      {/* FIX: var(--text-main) → var(--text-dark) */}
                      <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-dark)' }}>
                        {item.value || '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Operating hours */}
            <div className="card">
              {/* FIX: added card-body wrapper */}
              <div className="card-body">
                <div className="section-title" style={{ marginBottom: '16px' }}>
                  Operating Hours
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Opens At',  value: profile?.operatingHours?.open  || '—', icon: '🌅' },
                    { label: 'Closes At', value: profile?.operatingHours?.close || '—', icon: '🌙' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        flex: 1,
                        minWidth: '120px',
                        padding: '14px 18px',
                        // FIX: var(--stone-50) → var(--green-50)
                        background: 'var(--green-50)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--stone-200)',
                      }}
                    >
                      <div style={{ fontSize: '20px', marginBottom: '6px' }}>{item.icon}</div>
                      <div className="stat-label">{item.label}</div>
                      {/* FIX: var(--text-main) → var(--text-dark) */}
                      <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-dark)' }}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Services offered */}
            {profile?.servicesOffered?.length > 0 && (
              <div className="card">
                {/* FIX: added card-body wrapper */}
                <div className="card-body">
                  <div className="section-title" style={{ marginBottom: '14px' }}>
                    Services Offered
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {profile.servicesOffered.map((service) => (
                      <Badge key={service} color="blue">
                        {service.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

        ) : (
          /* ── Edit mode ──────────────────────────────────────────────── */
          <div className="card">
            {/* FIX: added card-body wrapper */}
            <div className="card-body">
              <div className="section-title" style={{ marginBottom: '20px' }}>
                Edit Profile
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '16px',
                  marginBottom: '16px',
                }}
              >
                {/* Organization name */}
                <div className="form-group">
                  <label className="form-label">
                    Organization Name <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  {/* FIX: form-control → form-input */}
                  <input
                    type="text"
                    className="form-input"
                    value={form.organizationName}
                    onChange={(e) => handleChange('organizationName', e.target.value)}
                    placeholder="e.g. Edhi Foundation"
                  />
                </div>

                {/* License number */}
                <div className="form-group">
                  <label className="form-label">License Number</label>
                  {/* FIX: form-control → form-input */}
                  <input
                    type="text"
                    className="form-input"
                    value={form.licenseNumber}
                    onChange={(e) => handleChange('licenseNumber', e.target.value)}
                    placeholder="e.g. LIC-2024-001"
                  />
                </div>

                {/* Contact number */}
                <div className="form-group">
                  <label className="form-label">Contact Number</label>
                  {/* FIX: form-control → form-input */}
                  <input
                    type="text"
                    className="form-input"
                    value={form.contactNumber}
                    onChange={(e) => handleChange('contactNumber', e.target.value)}
                    placeholder="e.g. 0300-1234567"
                  />
                </div>

                {/* Address — city selector */}
                <div className="form-group">
                  <label className="form-label">City / Address</label>
                  {/* FIX: form-control → form-select */}
                  <select
                    className="form-select"
                    value={form.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                  >
                    <option value="">Select city</option>
                    {PAKISTAN_CITIES.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                {/* Opening time */}
                <div className="form-group">
                  <label className="form-label">Opening Time</label>
                  {/* FIX: form-control → form-input */}
                  <input
                    type="time"
                    className="form-input"
                    value={form.operatingHours?.open}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        operatingHours: { ...prev.operatingHours, open: e.target.value },
                      }))
                    }
                  />
                </div>

                {/* Closing time */}
                <div className="form-group">
                  <label className="form-label">Closing Time</label>
                  {/* FIX: form-control → form-input */}
                  <input
                    type="time"
                    className="form-input"
                    value={form.operatingHours?.close}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        operatingHours: { ...prev.operatingHours, close: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>

              {/* Services offered */}
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">
                  Services Offered
                  <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: '6px' }}>
                    (comma separated)
                  </span>
                </label>
                {/* FIX: form-control → form-input */}
                <input
                  type="text"
                  className="form-input"
                  value={form.servicesOffered}
                  onChange={(e) => handleChange('servicesOffered', e.target.value)}
                  placeholder="e.g. oxygen, ICU, blood storage, ambulance"
                />
                <div className="form-hint">
                  Separate each service with a comma
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving
                    ? <><span className="spinner" /> Saving…</>
                    : '💾 Save Changes'
                  }
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => { setEditing(false); setError(''); }}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Navbar>
  );
}