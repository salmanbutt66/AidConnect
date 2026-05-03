// src/pages/provider/ManageAvailability.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2, Clock, Edit2, Save, X,
  AlertTriangle, Sunrise, Sunset, Lightbulb,
  Wifi, WifiOff, Radio,
} from 'lucide-react';
import Navbar from '../../components/common/Navbar.jsx';
import Loader from '../../components/common/Loader.jsx';
import { getProviderProfile, toggleAvailability } from '../../api/provider.api.js';

export default function ManageAvailability() {
  const [profile,    setProfile]   = useState(null);
  const [loading,    setLoading]   = useState(true);
  const [toggling,   setToggling]  = useState(false);
  const [hours,      setHours]     = useState({ open: '08:00', close: '22:00' });
  const [editHours,  setEditHours] = useState(false);
  const [saving,     setSaving]    = useState(false);
  const [error,      setError]     = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 4000); };
  const showError   = (msg) => setError(msg);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await getProviderProfile();
      const provider = data.provider || data.data || data;
      setProfile(provider);
      setHours({ open: provider.operatingHours?.open || '08:00', close: provider.operatingHours?.close || '22:00' });
    } catch { showError('Failed to load profile.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleToggle = useCallback(async () => {
    setToggling(true); setError('');
    try {
      const next = !profile?.isAvailable;
      const data = await toggleAvailability({ isAvailable: next });
      const updated = data.provider || data.data || data;
      setProfile(prev => ({ ...prev, isAvailable: updated.isAvailable }));
      await fetchProfile();
      showSuccess(updated.isAvailable ? 'You are now available for requests.' : 'You are now unavailable.');
    } catch (err) { showError(err.response?.data?.message || 'Failed to update availability.'); }
    finally { setToggling(false); }
  }, [profile?.isAvailable, fetchProfile]);

  const handleSaveHours = useCallback(async () => {
    if (hours.open >= hours.close) { showError('Closing time must be after opening time.'); return; }
    setSaving(true); setError('');
    try {
      await toggleAvailability({ operatingHours: hours, isAvailable: profile?.isAvailable });
      await fetchProfile(); setEditHours(false);
      showSuccess('Operating hours updated successfully.');
    } catch (err) { showError(err.response?.data?.message || 'Failed to update hours.'); }
    finally { setSaving(false); }
  }, [hours, profile?.isAvailable, fetchProfile]);

  if (loading) return <Navbar title="Manage Availability"><div className="page-wrapper"><Loader variant="card" message="Loading..." /></div></Navbar>;

  const isAvailable = profile?.isAvailable;

  return (
    <Navbar title="Manage Availability">
      <div className="page-wrapper">

        <div className="page-header">
          <h1>Manage Availability</h1>
          <p>Control when you are available to accept emergency requests.</p>
        </div>

        {error && (
          <div className="alert alert-error anim-fade-up" style={{ marginBottom: '20px' }}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{error}</span>
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', display: 'flex' }}><X size={15} /></button>
          </div>
        )}
        {successMsg && (
          <div className="alert alert-success anim-fade-up" style={{ marginBottom: '20px' }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />{successMsg}
          </div>
        )}

        {/* ── BIG STATUS CARD ───────────────────────────────────── */}
        <div
          className="anim-fade-up"
          style={{
            marginBottom: '20px',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            border: isAvailable ? '1.5px solid var(--green-200)' : '1.5px solid var(--stone-300)',
            boxShadow: isAvailable ? '0 8px 40px rgba(26,107,60,0.14)' : 'var(--shadow-sm)',
            transition: 'box-shadow 0.5s ease, border-color 0.5s ease',
          }}
        >
          {/* Gradient hero band */}
          <div style={{
            background: isAvailable
              ? 'linear-gradient(135deg, var(--green-900) 0%, var(--green-700) 60%, var(--green-500) 100%)'
              : 'linear-gradient(135deg, #2c2c2c 0%, #4a4a4a 60%, #686868 100%)',
            padding: '40px 36px',
            position: 'relative',
            overflow: 'hidden',
            transition: 'background 0.6s ease',
          }}>
            {/* dot pattern overlay */}
            <div style={{
              position: 'absolute', inset: 0, opacity: 0.07,
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '28px 28px',
              pointerEvents: 'none',
            }} />
            {/* glow orb */}
            <div style={{
              position: 'absolute', right: '-60px', top: '-60px',
              width: '280px', height: '280px', borderRadius: '50%',
              background: isAvailable ? 'rgba(42,173,96,0.3)' : 'rgba(255,255,255,0.05)',
              filter: 'blur(50px)', pointerEvents: 'none',
              transition: 'background 0.6s ease',
            }} />

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
              {/* Animated icon ring */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {isAvailable && (
                  <div style={{
                    position: 'absolute', inset: '-10px', borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.25)',
                    animation: 'pulse 2.4s ease-in-out infinite',
                  }} />
                )}
                <div style={{
                  width: '76px', height: '76px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.13)',
                  border: '1.5px solid rgba(255,255,255,0.22)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isAvailable
                    ? <Wifi size={34} color="white" strokeWidth={1.8} />
                    : <WifiOff size={34} color="rgba(255,255,255,0.55)" strokeWidth={1.8} />
                  }
                </div>
              </div>

              {/* Labels */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0, fontSize: '26px', fontWeight: 800, color: 'white', letterSpacing: '-0.7px' }}>
                    {isAvailable ? 'Currently Available' : 'Currently Unavailable'}
                  </h2>
                  {isAvailable && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
                      borderRadius: 'var(--radius-full)', padding: '3px 10px',
                      fontSize: '10px', fontWeight: 800, color: 'white', letterSpacing: '1px',
                    }}>
                      <Radio size={8} style={{ animation: 'pulse 1.5s ease-in-out infinite' }} /> LIVE
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.68)', lineHeight: 1.55, maxWidth: '400px' }}>
                  {isAvailable
                    ? 'You are visible to requesters and accepting incoming emergency requests.'
                    : 'You are hidden from requesters. Toggle on to start receiving requests.'}
                </p>
              </div>

              {/* Toggle button */}
              <button
                onClick={handleToggle}
                disabled={toggling}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '13px 26px', borderRadius: 'var(--radius-sm)',
                  background: isAvailable ? 'rgba(192,57,43,0.85)' : 'rgba(255,255,255,0.95)',
                  color: isAvailable ? 'white' : 'var(--green-900)',
                  border: isAvailable ? '1.5px solid rgba(255,255,255,0.2)' : 'none',
                  fontSize: '14px', fontWeight: 700, cursor: 'pointer', flexShrink: 0,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                  transition: 'all 0.25s ease',
                  opacity: toggling ? 0.7 : 1,
                }}
              >
                {toggling
                  ? <><span className="spinner" style={{ borderTopColor: isAvailable ? 'white' : 'var(--green-700)', borderColor: isAvailable ? 'rgba(255,255,255,0.3)' : 'var(--green-200)' }} /> Updating…</>
                  : isAvailable
                    ? <><WifiOff size={15} strokeWidth={2.5} /> Go Unavailable</>
                    : <><Wifi size={15} strokeWidth={2.5} /> Go Available</>
                }
              </button>
            </div>

            {/* Progress bar */}
            <div style={{ position: 'relative', marginTop: '30px' }}>
              <div style={{ height: '4px', borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.14)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: isAvailable ? '100%' : '0%',
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.4), rgba(255,255,255,0.85))',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '10px', color: 'rgba(255,255,255,0.38)', fontWeight: 700, letterSpacing: '1px' }}>
                <span>OFFLINE</span><span>ONLINE</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── OPERATING HOURS ────────────────────────────────────── */}
        <div className="card anim-fade-up" style={{ marginBottom: '20px', animationDelay: '80ms', overflow: 'hidden' }}>
          <div style={{ height: '3px', background: 'linear-gradient(90deg, var(--green-700), var(--green-400))' }} />
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                  <Clock size={16} color="var(--green-700)" strokeWidth={2.5} />
                  <span className="section-title">Operating Hours</span>
                </div>
                <div className="section-subtitle">Set the hours during which you accept requests</div>
              </div>
              {!editHours && (
                <button className="btn btn-ghost btn-sm" onClick={() => setEditHours(true)} style={{ gap: '6px' }}>
                  <Edit2 size={13} /> Edit
                </button>
              )}
            </div>

            {editHours ? (
              <div>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '24px' }}>
                  {[
                    { label: 'Opening Time', Icon: Sunrise, key: 'open' },
                    { label: 'Closing Time', Icon: Sunset,  key: 'close' },
                  ].map(({ label, Icon, key }) => (
                    <div key={key} style={{ flex: 1, minWidth: '140px' }}>
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Icon size={13} color="var(--green-700)" /> {label}
                      </label>
                      <input type="time" className="form-input" value={hours[key]}
                        onChange={e => setHours(prev => ({ ...prev, [key]: e.target.value }))} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn btn-primary btn-sm" onClick={handleSaveHours} disabled={saving} style={{ gap: '6px' }}>
                    {saving ? <><span className="spinner" /> Saving…</> : <><Save size={13} /> Save Hours</>}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setEditHours(false); setError(''); }} disabled={saving} style={{ gap: '6px' }}>
                    <X size={13} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {[
                  { label: 'Opens At',  value: profile?.operatingHours?.open  || '08:00', Icon: Sunrise },
                  { label: 'Closes At', value: profile?.operatingHours?.close || '22:00', Icon: Sunset  },
                ].map(item => (
                  <div key={item.label} style={{
                    padding: '24px', borderRadius: 'var(--radius-lg)',
                    background: 'linear-gradient(135deg, var(--green-50) 0%, white 100%)',
                    border: '1.5px solid var(--green-100)',
                    display: 'flex', alignItems: 'center', gap: '20px',
                  }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: 'var(--radius-md)',
                      background: 'var(--green-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <item.Icon size={22} color="var(--green-700)" strokeWidth={2} />
                    </div>
                    <div>
                      <div className="stat-label" style={{ marginBottom: '4px' }}>{item.label}</div>
                      <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text-dark)', letterSpacing: '-1.5px', lineHeight: 1 }}>
                        {item.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── TIP ──────────────────────────────────────────────────── */}
        <div className="anim-fade-up" style={{
          padding: '16px 20px', background: 'var(--green-50)',
          borderRadius: 'var(--radius-md)', border: '1.5px solid var(--green-100)',
          display: 'flex', gap: '14px', alignItems: 'flex-start', animationDelay: '160ms',
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', flexShrink: 0,
            background: 'var(--green-100)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Lightbulb size={17} color="var(--green-700)" />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '3px' }}>Quick tip</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.65 }}>
              When you accept a request, your availability is automatically set to unavailable until the request is completed. You can manually toggle back anytime.
            </div>
          </div>
        </div>

      </div>
    </Navbar>
  );
}