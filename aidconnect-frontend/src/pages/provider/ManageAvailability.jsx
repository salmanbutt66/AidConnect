// src/pages/provider/ManageAvailability.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
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

  // ── Fetch profile ──────────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    try {
      const data = await getProviderProfile();
      setProfile(data.data);
      setHours({
        open:  data.data.operatingHours?.open  || '08:00',
        close: data.data.operatingHours?.close || '22:00',
      });
    } catch (err) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // ── Toggle availability ────────────────────────────────────────────────────
  const handleToggle = useCallback(async () => {
    setToggling(true);
    try {
      const data = await toggleAvailability();
      setProfile((prev) => ({ ...prev, isAvailable: data.data.isAvailable }));
      toast.success(
        data.data.isAvailable
          ? '✅ You are now available for requests'
          : '🔴 You are now unavailable'
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update availability');
    } finally {
      setToggling(false);
    }
  }, []);

  // ── Save operating hours ───────────────────────────────────────────────────
  const handleSaveHours = useCallback(async () => {
    if (hours.open >= hours.close) {
      toast.error('Closing time must be after opening time');
      return;
    }
    setSaving(true);
    try {
      await toggleAvailability({ operatingHours: hours });
      setProfile((prev) => ({ ...prev, operatingHours: hours }));
      setEditHours(false);
      toast.success('Operating hours updated');
    } catch (err) {
      toast.error('Failed to update hours');
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

        {/* ── Availability toggle card ─────────────────────────────────── */}
        <div className="card" style={{ marginBottom: '20px' }}>
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
                  background: isAvailable ? 'var(--green-100)' : 'var(--stone-100)',
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
                <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700 }}>
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
              background: 'var(--stone-100)',
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

        {/* ── Operating hours card ─────────────────────────────────────── */}
        <div className="card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}
          >
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700 }}>
                🕐 Operating Hours
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                Set the hours during which you accept requests
              </p>
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
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      marginBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Opening Time
                  </label>
                  <input
                    type="time"
                    className="form-control"
                    value={hours.open}
                    onChange={(e) =>
                      setHours((prev) => ({ ...prev, open: e.target.value }))
                    }
                  />
                </div>
                <div style={{ flex: 1, minWidth: '140px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      marginBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Closing Time
                  </label>
                  <input
                    type="time"
                    className="form-control"
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
                  onClick={() => setEditHours(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* View mode */
            <div
              style={{
                display: 'flex',
                gap: '20px',
                flexWrap: 'wrap',
              }}
            >
              {[
                { label: 'Opens At', value: profile?.operatingHours?.open  || '08:00', icon: '🌅' },
                { label: 'Closes At', value: profile?.operatingHours?.close || '22:00', icon: '🌙' },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    flex: 1,
                    minWidth: '140px',
                    padding: '16px 20px',
                    background: 'var(--stone-50)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--stone-200)',
                  }}
                >
                  <div style={{ fontSize: '22px', marginBottom: '8px' }}>{item.icon}</div>
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
                    {item.label}
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Info note ────────────────────────────────────────────────── */}
        <div
          style={{
            marginTop: '20px',
            padding: '14px 18px',
            background: 'var(--stone-50)',
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