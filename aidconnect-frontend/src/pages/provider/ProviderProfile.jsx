// src/pages/provider/ProviderProfile.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/common/Navbar.jsx';
import Loader from '../../components/common/Loader.jsx';
import Badge from '../../components/common/Badge.jsx';
import { getProviderProfile, updateProviderProfile, registerProvider } from '../../api/provider.api.js';
import { formatPhone, formatDate } from '../../utils/formatters.js';
import { SERVICE_TYPES, PAKISTAN_CITIES } from '../../utils/constants.js';

// FIX: city is now a dedicated field separate from address.
// Previously both city and address were stored in form.address,
// so the payload never had a `city` key — the Provider.city field
// was always null, breaking getRelevantRequests city filtering.
const EMPTY_FORM = {
  organizationName: '',
  serviceType:      '',
  licenseNumber:    '',
  contactNumber:    '',
  city:             '',   // ← FIX: was `address`, now separate `city`
  address:          '',   // ← street/building address (optional, freetext)
  servicesOffered:  '',
  operatingHours: { open: '08:00', close: '22:00' },
};

export default function ProviderProfile() {
  const [profile,     setProfile]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [editing,     setEditing]     = useState(false);
  const [registering, setRegistering] = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [form,        setForm]        = useState(EMPTY_FORM);

  const [error,      setError]      = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 4000); };
  const showError   = (msg) => setError(msg);

  // FIX: buildForm now reads p.city for the city dropdown and p.address
  // for the freetext address field. Previously both read from p.address,
  // so the city dropdown was always blank when editing an existing profile.
  const buildForm = (p) => ({
    organizationName: p.organizationName || '',
    serviceType:      p.serviceType      || '',
    licenseNumber:    p.licenseNumber    || '',
    contactNumber:    p.contactNumber    || '',
    city:             p.city             || '',   // ← FIX: read from p.city
    address:          p.address          || '',
    servicesOffered:  p.servicesOffered?.join(', ') || '',
    operatingHours: {
      open:  p.operatingHours?.open  || '08:00',
      close: p.operatingHours?.close || '22:00',
    },
  });

  // ── Fetch profile ──────────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    try {
      const data     = await getProviderProfile();
      const provider = data.data ?? data.provider ?? data;
      setProfile(provider);
      setForm(buildForm(provider));
      setRegistering(false);
    } catch (err) {
      if (err.response?.status === 404) {
        setRegistering(true);
        setForm(EMPTY_FORM);
      } else {
        showError('Failed to load profile.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError('');
  }, [error]);

  // ── Build payload — always sends city as its own field ────────────────────
  const buildPayload = (f) => ({
    organizationName: f.organizationName,
    serviceType:      f.serviceType,
    licenseNumber:    f.licenseNumber  || null,
    contactNumber:    f.contactNumber  || null,
    city:             f.city           || null,   // ← FIX: explicit city field
    address:          f.address        || null,
    operatingHours:   f.operatingHours,
    servicesOffered:  f.servicesOffered
      ? f.servicesOffered.split(',').map((s) => s.trim()).filter(Boolean)
      : [],
  });

  // ── Register (first time) ──────────────────────────────────────────────────
  const handleRegister = useCallback(async () => {
    if (!form.organizationName?.trim()) { showError('Organization name is required.'); return; }
    if (!form.serviceType)              { showError('Service type is required.');       return; }
    if (!form.city)                     { showError('City is required so we can show you local requests.'); return; }

    setSaving(true);
    setError('');
    try {
      await registerProvider(buildPayload(form));
      showSuccess('Organization registered! Awaiting admin verification.');
      await fetchProfile();
    } catch (err) {
      showError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setSaving(false);
    }
  }, [form, fetchProfile]);

  // ── Update existing profile ────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!form.organizationName?.trim()) { showError('Organization name is required.'); return; }
    if (!form.city)                     { showError('City is required.'); return; }

    setSaving(true);
    setError('');
    try {
      const data    = await updateProviderProfile(buildPayload(form));
      const updated = data.data ?? data.provider ?? data;
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

  const serviceTypeLabel = SERVICE_TYPES.find((s) => s.value === profile?.serviceType);
  const credibilityScore = profile?.credibilityScore ?? 50;

  if (loading) {
    return (
      <Navbar title="My Profile">
        <div className="page-wrapper">
          <Loader variant="card" message="Loading profile..." />
        </div>
      </Navbar>
    );
  }

  // ── Shared form fields ────────────────────────────────────────────────────
  const renderFormFields = (showServiceType = false) => (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>

        <div className="form-group">
          <label className="form-label">Organization Name <span style={{ color: 'var(--danger)' }}>*</span></label>
          <input
            type="text" className="form-input"
            value={form.organizationName}
            onChange={(e) => handleChange('organizationName', e.target.value)}
            placeholder="e.g. Edhi Foundation"
          />
        </div>

        {showServiceType && (
          <div className="form-group">
            <label className="form-label">Service Type <span style={{ color: 'var(--danger)' }}>*</span></label>
            <select
              className="form-select"
              value={form.serviceType}
              onChange={(e) => handleChange('serviceType', e.target.value)}
            >
              <option value="">Select service type</option>
              {SERVICE_TYPES.map((s) => (
                <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>
              ))}
            </select>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">License Number</label>
          <input
            type="text" className="form-input"
            value={form.licenseNumber}
            onChange={(e) => handleChange('licenseNumber', e.target.value)}
            placeholder="e.g. LIC-2024-001"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Contact Number</label>
          <input
            type="text" className="form-input"
            value={form.contactNumber}
            onChange={(e) => handleChange('contactNumber', e.target.value)}
            placeholder="e.g. 03001234567"
          />
        </div>

        {/* FIX: City is now a dedicated dropdown — its value maps to Provider.city */}
        <div className="form-group">
          <label className="form-label">
            City <span style={{ color: 'var(--danger)' }}>*</span>
            <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: '6px', fontSize: '11px' }}>
              (used to match you with local requests)
            </span>
          </label>
          <select
            className="form-select"
            value={form.city}
            onChange={(e) => handleChange('city', e.target.value)}
          >
            <option value="">Select city</option>
            {PAKISTAN_CITIES.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        {/* Address is now a separate freetext field for street/building */}
        <div className="form-group">
          <label className="form-label">Street Address <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
          <input
            type="text" className="form-input"
            value={form.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="e.g. Street 5, Block B, Gulshan"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Opening Time</label>
          <input
            type="time" className="form-input"
            value={form.operatingHours?.open}
            onChange={(e) => setForm((prev) => ({ ...prev, operatingHours: { ...prev.operatingHours, open: e.target.value } }))}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Closing Time</label>
          <input
            type="time" className="form-input"
            value={form.operatingHours?.close}
            onChange={(e) => setForm((prev) => ({ ...prev, operatingHours: { ...prev.operatingHours, close: e.target.value } }))}
          />
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: '24px' }}>
        <label className="form-label">
          Services Offered
          <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: '6px' }}>(comma separated)</span>
        </label>
        <input
          type="text" className="form-input"
          value={form.servicesOffered}
          onChange={(e) => handleChange('servicesOffered', e.target.value)}
          placeholder="e.g. oxygen, ICU, blood storage, ambulance"
        />
        <div className="form-hint">Separate each service with a comma</div>
      </div>
    </>
  );

  return (
    <Navbar title="My Profile">
      <div className="page-wrapper">

        <div className="page-header">
          <h1>My Profile</h1>
          <p>
            {registering
              ? 'Complete your organization profile to start receiving emergency requests.'
              : "Manage your organization's information and service details."
            }
          </p>
        </div>

        {/* ── Alerts ────────────────────────────────────────────────────── */}
        {error && (
          <div className="alert alert-error anim-fade-up" style={{ marginBottom: '20px' }}>
            <span className="alert-icon">⚠️</span>
            {error}
            <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontWeight: 700 }}>✕</button>
          </div>
        )}
        {successMsg && (
          <div className="alert alert-success anim-fade-up" style={{ marginBottom: '20px' }}>
            <span className="alert-icon">✅</span>
            {successMsg}
          </div>
        )}

        {/* ── Registration form ─────────────────────────────────────────── */}
        {registering ? (
          <div className="card">
            <div className="card-body">
              <div className="section-title" style={{ marginBottom: '8px' }}>Complete Your Organization Profile</div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Fill in your organization details. An admin will verify your account before you can accept requests.
              </p>
              {renderFormFields(true)}
              <button className="btn btn-primary" onClick={handleRegister} disabled={saving}>
                {saving ? <><span className="spinner" /> Registering…</> : '🏥 Register Organization →'}
              </button>
            </div>
          </div>

        ) : (
          <>
            {/* ── Profile header ───────────────────────────────────────── */}
            <div className="card" style={{ marginBottom: '20px' }}>
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-md)', background: 'var(--green-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', flexShrink: 0 }}>
                      {serviceTypeLabel?.emoji || '🏥'}
                    </div>
                    <div>
                      <h2 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 700, color: 'var(--text-dark)' }}>
                        {profile?.organizationName}
                      </h2>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        {profile?.city && `📍 ${profile.city}`}
                        {profile?.city && profile?.address && ' · '}
                        {profile?.address}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <Badge color={profile?.isVerified ? 'green' : 'orange'} dot>
                          {profile?.isVerified ? 'Verified' : 'Pending Verification'}
                        </Badge>
                        <Badge color={profile?.isAvailable ? 'green' : 'stone'}>
                          {profile?.isAvailable ? 'Available' : 'Unavailable'}
                        </Badge>
                        <Badge color={
                          credibilityScore >= 85 ? 'green'  :
                          credibilityScore >= 70 ? 'blue'   :
                          credibilityScore >= 55 ? 'orange' : 'red'
                        }>
                          Credibility {credibilityScore}/100
                        </Badge>
                        {serviceTypeLabel && (
                          <Badge color="blue">{serviceTypeLabel.emoji} {serviceTypeLabel.label}</Badge>
                        )}
                        {/* Warn if city not set — will get nationwide requests */}
                        {!profile?.city && (
                          <Badge color="orange">⚠️ City not set</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {!editing && (
                    <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(true); setError(''); }}>
                      ✏️ Edit Profile
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ── View mode ───────────────────────────────────────────── */}
            {!editing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                <div className="card">
                  <div className="card-body">
                    <div className="section-title" style={{ marginBottom: '16px' }}>Organization Details</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                      {[
                        { label: 'Organization Name', value: profile?.organizationName,                   icon: '🏢' },
                        { label: 'Service Type',       value: serviceTypeLabel?.label,                    icon: '🔧' },
                        { label: 'License Number',     value: profile?.licenseNumber    || '—',           icon: '📋' },
                        { label: 'Contact Number',     value: formatPhone(profile?.contactNumber) || '—', icon: '📞' },
                        { label: 'City',               value: profile?.city             || '—',           icon: '📍' },
                        { label: 'Street Address',     value: profile?.address          || '—',           icon: '🏠' },
                        { label: 'Member Since',       value: formatDate(profile?.createdAt),             icon: '📅' },
                      ].map((item) => (
                        <div key={item.label}>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                            {item.icon} {item.label}
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-dark)' }}>{item.value || '—'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body">
                    <div className="section-title" style={{ marginBottom: '16px' }}>Operating Hours</div>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      {[
                        { label: 'Opens At',  value: profile?.operatingHours?.open  || '—', icon: '🌅' },
                        { label: 'Closes At', value: profile?.operatingHours?.close || '—', icon: '🌙' },
                      ].map((item) => (
                        <div key={item.label} style={{ flex: 1, minWidth: '120px', padding: '14px 18px', background: 'var(--green-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--stone-200)' }}>
                          <div style={{ fontSize: '20px', marginBottom: '6px' }}>{item.icon}</div>
                          <div className="stat-label">{item.label}</div>
                          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-dark)' }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body">
                    <div className="section-title" style={{ marginBottom: '16px' }}>Credibility</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                      {[
                        { label: 'Average Rating',    value: profile?.averageRating ? Number(profile.averageRating).toFixed(1) : '—', icon: '⭐' },
                        { label: 'Total Ratings',     value: profile?.totalRatings  ?? 0,                                             icon: '🧮' },
                        { label: 'Credibility Score', value: `${credibilityScore}/100`,                                               icon: '🛡️' },
                      ].map((item) => (
                        <div key={item.label} style={{ padding: '14px 18px', background: 'var(--green-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--stone-200)' }}>
                          <div style={{ fontSize: '20px', marginBottom: '6px' }}>{item.icon}</div>
                          <div className="stat-label">{item.label}</div>
                          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-dark)' }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {profile?.servicesOffered?.length > 0 && (
                  <div className="card">
                    <div className="card-body">
                      <div className="section-title" style={{ marginBottom: '14px' }}>Services Offered</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {profile.servicesOffered.map((service) => (
                          <Badge key={service} color="blue">{service.replace(/_/g, ' ')}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

            ) : (
              /* ── Edit mode ──────────────────────────────────────────── */
              <div className="card">
                <div className="card-body">
                  <div className="section-title" style={{ marginBottom: '20px' }}>Edit Profile</div>
                  {renderFormFields(false)}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                      {saving ? <><span className="spinner" /> Saving…</> : '💾 Save Changes'}
                    </button>
                    <button className="btn btn-ghost" onClick={() => { setEditing(false); setForm(buildForm(profile)); setError(''); }} disabled={saving}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Navbar>
  );
}