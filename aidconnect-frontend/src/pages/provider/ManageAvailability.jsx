// src/pages/provider/ManageAvailability.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/common/Navbar.jsx';
import Loader from '../../components/common/Loader.jsx';
import { getProviderProfile, toggleAvailability } from '../../api/provider.api.js';

export default function ManageAvailability() {
  const [profile,   setProfile]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [toggling,  setToggling]  = useState(false);
  const [hours,     setHours]     = useState({ open: '08:00', close: '22:00' });
  const [editHours, setEditHours] = useState(false);
  const [saving,    setSaving]    = useState(false);

  // FIX: replaced toast with local error/success state (consistent with rest of app)
  const [error,      setError]      = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };
  const showError = (msg) => setError(msg);

  // ── Fetch profile ──────────────────────────────────────────────────────────
  // FIX: safe extraction consistent with ProviderDashboard (data.provider || data.data || data)
  const fetchProfile = useCallback(async () => {
    try {
      const data = await getProviderProfile();
      const provider = data.provider || data.data || data;
      setProfile(provider);
      setHours({
        open:  provider.operatingHours?.open  || '08:00',
        close: provider.operatingHours?.close || '22:00',
      });
    } catch (err) {
      showError('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // ── Toggle availability ────────────────────────────────────────────────────
  const handleToggle = useCallback(async () => {
    setToggling(true);
    setError('');
    try {
      const data = await toggleAvailability();
      const updated = data.provider || data.data || data;
      setProfile((prev) => ({ ...prev, isAvailable: updated.isAvailable }));
      showSuccess(
        updated.isAvailable
          ? 'You are now available for requests.'
          : 'You are now unavailable.'
      );
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update availability.');
    } finally {
      setToggling(false);
    }
  }, []);

  // ── Save operating hours ───────────────────────────────────────────────────
  const handleSaveHours = useCallback(async () => {
    if (hours.open >= hours.close) {
      showError('Closing time must be after opening time.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await toggleAvailability({ operatingHours: hours });
      setProfile((prev) => ({ ...prev, operatingHours: hours }));
      setEditHours(false);
      showSuccess('Operating hours updated successfully.');
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update hours.');
    } finally {
      setSaving(false);
    }
  }, [hours]);

  if (loading) {
    return (
      <Navbar title="Manage Availability">
        <div className="page-wrapper">
          <Loader variant="card" message="Loading..." />
        </div>
      </Navbar>
    );
  }

  const isAvailable = profile?.isAvailable;

  return (
    <Navbar title="Manage Availability">
      <div className="page-wrapper">

        {/* ── Page header ───────────────────────────────────────────────── */}
        <div className="page-header">
          <h1>Manage Availability</h1>
          <p>Control when you are available to accept emergency requests.</p>
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

        {/* ── Availability toggle card ─────────────────────────────────── */}
        <div className="card" style={{ marginBottom: '20px' }}>
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
              {/* Status indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: 'var(--radius-full)',
                    // FIX: var(--stone-100) doesn't exist — use var(--stone-200)
                    background: isAvailable ? 'var(--green-100)' : 'var(--stone-200)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '26px',
                    flexShrink: 0,
                  }}
                >
                  {isAvailable ? '🟢' : '🔴'}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, color: 'var(--text-dark)' }}>
                    {isAvailable ? 'Currently Available' : 'Currently Unavailable'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                    {isAvailable
                      ? 'You are visible to requesters and can accept requests.'
                      : 'You are hidden from requesters. Toggle on to receive requests.'}
                  </p>
                </div>
              </div>

              {/* Toggle button */}
              <button
                className={`btn ${isAvailable ? 'btn-danger' : 'btn-primary'}`}
                onClick={handleToggle}
                disabled={toggling}
                style={{ minWidth: '160px' }}
              >
                {toggling ? (
                  <><span className="spinner" /> Updating…</>
                ) : isAvailable ? (
                  '🔴 Go Unavailable'
                ) : (
                  '🟢 Go Available'
                )}
              </button>
            </div>

            {/* Visual status bar */}
            <div
              style={{
                marginTop: '20px',
                height: '6px',
                borderRadius: 'var(--radius-full)',
                // FIX: var(--stone-100) → var(--stone-200)
                background: 'var(--stone-200)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: isAvailable ? '100%' : '0%',
                  background: 'var(--green-500)',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Operating hours card ─────────────────────────────────────── */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-body">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
              }}
            >
              <div>
                <div className="section-title">🕐 Operating Hours</div>
                <div className="section-subtitle">
                  Set the hours during which you accept requests
                </div>
              </div>
              {!editHours && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setEditHours(true)}
                >
                  ✏️ Edit
                </button>
              )}
            </div>

            {editHours ? (
              /* Edit mode */
              <div>
                <div
                  style={{
                    display: 'flex',
                    gap: '20px',
                    flexWrap: 'wrap',
                    marginBottom: '20px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '140px' }}>
                    <label className="form-label">Opening Time</label>
                    {/* FIX: form-control → form-input */}
                    <input
                      type="time"
                      className="form-input"
                      value={hours.open}
                      onChange={(e) =>
                        setHours((prev) => ({ ...prev, open: e.target.value }))
                      }
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: '140px' }}>
                    <label className="form-label">Closing Time</label>
                    {/* FIX: form-control → form-input */}
                    <input
                      type="time"
                      className="form-input"
                      value={hours.close}
                      onChange={(e) =>
                        setHours((prev) => ({ ...prev, close: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleSaveHours}
                    disabled={saving}
                  >
                    {saving ? <><span className="spinner" /> Saving…</> : '💾 Save Hours'}
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setEditHours(false);
                      setError('');
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* View mode */
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Opens At',  value: profile?.operatingHours?.open  || '08:00', icon: '🌅' },
                  { label: 'Closes At', value: profile?.operatingHours?.close || '22:00', icon: '🌙' },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      flex: 1,
                      minWidth: '140px',
                      padding: '16px 20px',
                      // FIX: var(--stone-50) doesn't exist → var(--green-50)
                      background: 'var(--green-50)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--stone-200)',
                    }}
                  >
                    <div style={{ fontSize: '22px', marginBottom: '8px' }}>{item.icon}</div>
                    <div className="stat-label">{item.label}</div>
                    {/* FIX: var(--text-main) doesn't exist → var(--text-dark) */}
                    <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-dark)' }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Info note ────────────────────────────────────────────────── */}
        <div
          style={{
            padding: '14px 18px',
            // FIX: var(--stone-50) → var(--green-50)
            background: 'var(--green-50)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--stone-200)',
            fontSize: '13px',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
          }}
        >
          💡 <strong>Tip:</strong> When you accept a request, your availability
          is automatically set to unavailable until the request is completed.
          You can manually toggle back anytime.
        </div>

      </div>
    </Navbar>
  );
}