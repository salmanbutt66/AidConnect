// src/pages/provider/ProviderProfile.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import Navbar from '../../components/common/Navbar.jsx';
import Loader from '../../components/common/Loader.jsx';
import Badge from '../../components/common/Badge.jsx';
import { getProviderProfile, updateProviderProfile } from '../../api/provider.api.js';
import { formatPhone, formatDate } from '../../utils/formatters.js';
import { SERVICE_TYPES, PAKISTAN_CITIES } from '../../utils/constants.js';

export default function ProviderProfile() {
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState({});

  // ── Fetch profile ──────────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    try {
      const data = await getProviderProfile();
      setProfile(data.data);
      setForm({
        organizationName: data.data.organizationName || '',
        licenseNumber:    data.data.licenseNumber    || '',
        contactNumber:    data.data.contactNumber    || '',
        address:          data.data.address          || '',
        servicesOffered:  data.data.servicesOffered?.join(', ') || '',
        operatingHours: {
          open:  data.data.operatingHours?.open  || '08:00',
          close: data.data.operatingHours?.close || '22:00',
        },
      });
    } catch (err) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // ── Handle form field change ───────────────────────────────────────────────
  const handleChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  // ── Save changes ───────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!form.organizationName?.trim()) {
      toast.error('Organization name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        servicesOffered: form.servicesOffered
          ? form.servicesOffered.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };
      const data = await updateProviderProfile(payload);
      setProfile(data.data);
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
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

        {/* ── Profile header ───────────────────────────────────────────── */}
        <div
          className="card"
          style={{ marginBottom: '20px' }}
        >
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
                <h2 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 700 }}>
                  {profile?.organizationName}
                </h2>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <Badge
                    color={profile?.isVerified ? 'green' : 'orange'}
                    dot
                  >
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
                onClick={() => setEditing(true)}
              >
                ✏️ Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* ── View mode ────────────────────────────────────────────────── */}
        {!editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Organization details */}
            <div className="card">
              <h4
                style={{
                  margin: '0 0 16px',
                  fontSize: '13px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  color: 'var(--text-muted)',
                }}
              >
                Organization Details
              </h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                }}
              >
                {[
                  { label: 'Organization Name', value: profile?.organizationName,          icon: '🏢' },
                  { label: 'Service Type',       value: serviceTypeLabel?.label,            icon: '🔧' },
                  { label: 'License Number',     value: profile?.licenseNumber || '—',      icon: '📋' },
                  { label: 'Contact Number',     value: formatPhone(profile?.contactNumber) || '—', icon: '📞' },
                  { label: 'Address',            value: profile?.address || '—',            icon: '📍' },
                  { label: 'Member Since',       value: formatDate(profile?.createdAt),     icon: '📅' },
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
                    <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>
                      {item.value || '—'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Operating hours */}
            <div className="card">
              <h4
                style={{
                  margin: '0 0 16px',
                  fontSize: '13px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  color: 'var(--text-muted)',
                }}
              >
                Operating Hours
              </h4>
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
                      background: 'var(--stone-50)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--stone-200)',
                    }}
                  >
                    <div style={{ fontSize: '20px', marginBottom: '6px' }}>{item.icon}</div>
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        marginBottom: '2px',
                      }}
                    >
                      {item.label}
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 700 }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Services offered */}
            {profile?.servicesOffered?.length > 0 && (
              <div className="card">
                <h4
                  style={{
                    margin: '0 0 14px',
                    fontSize: '13px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    color: 'var(--text-muted)',
                  }}
                >
                  Services Offered
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {profile.servicesOffered.map((service) => (
                    <Badge key={service} color="blue">{service}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

        ) : (
          /* ── Edit mode ────────────────────────────────────────────────── */
          <div className="card">
            <h4
              style={{
                margin: '0 0 20px',
                fontSize: '13px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                color: 'var(--text-muted)',
              }}
            >
              Edit Profile
            </h4>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '16px',
                marginBottom: '16px',
              }}
            >
              {/* Organization name */}
              <div>
                <label className="form-label">Organization Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.organizationName}
                  onChange={(e) => handleChange('organizationName', e.target.value)}
                  placeholder="e.g. Edhi Foundation"
                />
              </div>

              {/* License number */}
              <div>
                <label className="form-label">License Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.licenseNumber}
                  onChange={(e) => handleChange('licenseNumber', e.target.value)}
                  placeholder="e.g. LIC-2024-001"
                />
              </div>

              {/* Contact number */}
              <div>
                <label className="form-label">Contact Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.contactNumber}
                  onChange={(e) => handleChange('contactNumber', e.target.value)}
                  placeholder="e.g. 0300-1234567"
                />
              </div>

              {/* Address */}
              <div>
                <label className="form-label">Address</label>
                <select
                  className="form-control"
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
              <div>
                <label className="form-label">Opening Time</label>
                <input
                  type="time"
                  className="form-control"
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
              <div>
                <label className="form-label">Closing Time</label>
                <input
                  type="time"
                  className="form-control"
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
            <div style={{ marginBottom: '24px' }}>
              <label className="form-label">
                Services Offered
                <span
                  style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: '6px' }}
                >
                  (comma separated)
                </span>
              </label>
              <input
                type="text"
                className="form-control"
                value={form.servicesOffered}
                onChange={(e) => handleChange('servicesOffered', e.target.value)}
                placeholder="e.g. oxygen, ICU, blood storage, ambulance"
              />
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
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </Navbar>
  );
}