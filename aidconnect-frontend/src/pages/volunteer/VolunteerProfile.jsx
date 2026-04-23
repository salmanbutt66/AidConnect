// src/pages/volunteer/VolunteerProfile.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import {
  getMyVolunteerProfile,
  updateVolunteerProfile,
  getMyRatings,
} from '../../api/volunteer.api.js';

// ─── Constants ────────────────────────────────────────────────────────────────
const SKILLS = [
  'first_aid', 'firefighting', 'rescue', 'medical', 'counseling',
  'logistics', 'driving', 'blood_donation', 'food_distribution',
  'shelter_setup', 'translation', 'it_support', 'other',
];

const EMERGENCY_TYPES = [
  'medical', 'fire', 'flood', 'earthquake', 'accident',
  'blood_request', 'food_shortage', 'mental_health', 'missing_person', 'other',
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const PAKISTAN_CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad',
  'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala',
  'Hyderabad', 'Abbottabad', 'Bahawalpur', 'Sargodha', 'Sukkur',
];

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

// ─── Small Components ─────────────────────────────────────────────────────────
const SectionCard = ({ title, children }) => (
  <div style={{
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '20px',
  }}>
    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 20px' }}>
      {title}
    </h3>
    {children}
  </div>
);

const ToggleChip = ({ label, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      background: selected ? 'var(--accent)' : 'var(--bg)',
      color: selected ? '#fff' : 'var(--text-muted)',
      border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: '20px',
      padding: '5px 14px',
      fontSize: '13px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.15s',
      textTransform: 'capitalize',
    }}
  >
    {label.replace(/_/g, ' ')}
  </button>
);

const FormField = ({ label, hint, children }) => (
  <div style={{ marginBottom: '18px' }}>
    <label style={{
      display: 'block',
      fontSize: '13px',
      fontWeight: 600,
      color: 'var(--text)',
      marginBottom: '6px',
    }}>
      {label}
    </label>
    {hint && (
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
        {hint}
      </div>
    )}
    {children}
  </div>
);

const inputStyle = {
  width: '100%',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  padding: '10px 14px',
  color: 'var(--text)',
  fontSize: '14px',
  boxSizing: 'border-box',
  outline: 'none',
};

const StarRating = ({ score }) => {
  return (
    <span>
      {[1,2,3,4,5].map((s) => (
        <span
          key={s}
          style={{
            color: s <= Math.round(score) ? '#f59e0b' : 'var(--border)',
            fontSize: '16px',
          }}
        >
          ★
        </span>
      ))}
    </span>
  );
};

const ScoreBadge = ({ score }) => {
  const getLabel = (s) => {
    if (s >= 85) return { label: 'Elite',      color: '#22c55e' };
    if (s >= 70) return { label: 'Trusted',    color: '#3b82f6' };
    if (s >= 55) return { label: 'Reliable',   color: '#06b6d4' };
    if (s >= 40) return { label: 'Developing', color: '#f59e0b' };
    return             { label: 'At Risk',     color: '#ef4444' };
  };
  const { label, color } = getLabel(score);
  return (
    <span style={{
      background: `${color}22`, color,
      border: `1px solid ${color}44`,
      borderRadius: '20px',
      padding: '3px 12px',
      fontSize: '12px', fontWeight: 600,
    }}>
      {label}
    </span>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function VolunteerProfile() {
  const { user, updateUser } = useAuth();

  const [profile,       setProfile]       = useState(null);
  const [ratings,       setRatings]       = useState([]);
  const [ratingsMeta,   setRatingsMeta]   = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState('');
  const [success,       setSuccess]       = useState('');
  const [activeTab,     setActiveTab]     = useState('profile');
  const [ratingsPage,   setRatingsPage]   = useState(1);
  const [ratingsLoading,setRatingsLoading]= useState(false);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    bio:                  '',
    skills:               [],
    emergencyTypes:       [],
    cnic:                 '',
    canDonatBlood:        false,
    lastDonationDate:     '',
    radiusKm:             10,
    city:                 '',
    area:                 '',
    availabilitySchedule: {
      monday: true, tuesday: true, wednesday: true,
      thursday: true, friday: true, saturday: false, sunday: false,
    },
  });

  // ── Load profile ───────────────────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    try {
      const res = await getMyVolunteerProfile();
      const p   = res.profile;
      setProfile(p);
      setForm({
        bio:            p.bio            || '',
        skills:         p.skills         || [],
        emergencyTypes: p.emergencyTypes || [],
        cnic:           p.cnic           || '',
        canDonatBlood:  p.canDonatBlood  || false,
        lastDonationDate: p.lastDonationDate
          ? new Date(p.lastDonationDate).toISOString().split('T')[0]
          : '',
        radiusKm:   p.serviceArea?.radiusKm ?? 10,
        city:       p.serviceArea?.city     || '',
        area:       p.serviceArea?.area     || '',
        availabilitySchedule: p.availabilitySchedule || {
          monday: true, tuesday: true, wednesday: true,
          thursday: true, friday: true, saturday: false, sunday: false,
        },
      });
    } catch {
      setError('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Load ratings ───────────────────────────────────────────────────────────
  const loadRatings = useCallback(async (page) => {
    setRatingsLoading(true);
    try {
      const res = await getMyRatings({ page, limit: 5 });
      setRatings(res.ratings || []);
      setRatingsMeta(res.pagination || null);
    } catch {
      // fail silently on ratings
    } finally {
      setRatingsLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  useEffect(() => {
    if (activeTab === 'ratings') loadRatings(ratingsPage);
  }, [activeTab, ratingsPage, loadRatings]);

  // ── Toggle skill/emergencyType ─────────────────────────────────────────────
  const toggleArrayItem = (field, value) => {
    setForm((prev) => {
      const arr     = prev[field];
      const updated = arr.includes(value)
        ? arr.filter((v) => v !== value)
        : [...arr, value];
      return { ...prev, [field]: updated };
    });
  };

  // ── Toggle day ─────────────────────────────────────────────────────────────
  const toggleDay = (day) => {
    setForm((prev) => ({
      ...prev,
      availabilitySchedule: {
        ...prev.availabilitySchedule,
        [day]: !prev.availabilitySchedule[day],
      },
    }));
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        bio:            form.bio.trim(),
        skills:         form.skills,
        emergencyTypes: form.emergencyTypes,
        canDonatBlood:  form.canDonatBlood,
        availabilitySchedule: form.availabilitySchedule,
        serviceArea: {
          city: form.city,
          area: form.area,
        },
        radiusKm: Number(form.radiusKm),
      };

      if (form.cnic.trim())           payload.cnic             = form.cnic.trim();
      if (form.lastDonationDate)      payload.lastDonationDate = form.lastDonationDate;

      const res = await updateVolunteerProfile(payload);
      setProfile(res.profile);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const formatDate = (d) => d
    ? new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>

      {/* ── Top Bar ───────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0 32px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
      }}>
        <div style={{ fontWeight: 800, fontSize: '20px', letterSpacing: '-0.5px' }}>
          Aid<span style={{ color: 'var(--accent)' }}>Connect</span>
        </div>
        <nav style={{ display: 'flex', gap: '8px' }}>
          {[
            { label: 'Dashboard', to: '/volunteer'         },
            { label: 'Active',    to: '/volunteer/active'  },
            { label: 'History',   to: '/volunteer/history' },
            { label: 'Profile',   to: '/volunteer/profile' },
          ].map(({ label, to }) => (
            <Link key={to} to={to} style={{
              padding: '6px 14px', borderRadius: '8px',
              fontSize: '14px', fontWeight: 500,
              color: window.location.pathname === to
                ? 'var(--accent)' : 'var(--text-muted)',
              background: window.location.pathname === to
                ? 'var(--accent-dim)' : 'transparent',
              textDecoration: 'none',
            }}>
              {label}
            </Link>
          ))}
        </nav>
        <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          {user?.name}
        </div>
      </div>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '32px 24px' }}>

        {/* ── Profile Header ────────────────────────────────────────── */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '28px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          flexWrap: 'wrap',
        }}>
          {/* Avatar */}
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '28px', color: '#fff', flexShrink: 0,
          }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>
                {user?.name}
              </h2>
              <ScoreBadge score={profile?.reputationScore ?? 50} />
              {profile?.isApproved ? (
                <span style={{
                  background: '#22c55e22', color: '#22c55e',
                  border: '1px solid #22c55e44',
                  borderRadius: '20px', padding: '2px 10px',
                  fontSize: '12px', fontWeight: 600,
                }}>
                  ✓ Approved
                </span>
              ) : (
                <span style={{
                  background: '#f59e0b22', color: '#f59e0b',
                  border: '1px solid #f59e0b44',
                  borderRadius: '20px', padding: '2px 10px',
                  fontSize: '12px', fontWeight: 600,
                }}>
                  ⏳ Pending
                </span>
              )}
            </div>
            <div style={{
              fontSize: '14px', color: 'var(--text-muted)',
              marginTop: '6px', display: 'flex', gap: '16px', flexWrap: 'wrap',
            }}>
              <span>{user?.email}</span>
              {user?.phone && <span>📞 {user.phone}</span>}
              {user?.bloodGroup && <span>🩸 {user.bloodGroup}</span>}
            </div>
          </div>

          {/* Reputation score circle */}
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              border: '3px solid var(--accent)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ fontSize: '18px', fontWeight: 800, lineHeight: 1 }}>
                {profile?.reputationScore ?? 50}
              </div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '1px' }}>
                SCORE
              </div>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {profile?.totalCompleted ?? 0} done
            </div>
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', gap: '4px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '4px',
          marginBottom: '24px',
          width: 'fit-content',
        }}>
          {[
            { id: 'profile',  label: '👤 Edit Profile' },
            { id: 'ratings',  label: '⭐ My Ratings'   },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                background: activeTab === id ? 'var(--accent)' : 'transparent',
                color: activeTab === id ? '#fff' : 'var(--text-muted)',
                border: 'none', borderRadius: '7px',
                padding: '8px 20px',
                fontSize: '14px', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Alerts */}
        {error && (
          <div className="alert alert-danger" style={{ borderRadius: '10px', marginBottom: '20px' }}>
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div style={{
            background: '#22c55e22', border: '1px solid #22c55e55',
            borderRadius: '10px', padding: '12px 16px',
            color: '#22c55e', fontWeight: 600, marginBottom: '20px',
          }}>
            ✅ {success}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            TAB: EDIT PROFILE
        ════════════════════════════════════════════════════════════ */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSave}>

            {/* ── Bio ─────────────────────────────────────────────── */}
            <SectionCard title="About You">
              <FormField
                label="Bio"
                hint="Tell people about yourself and your experience (max 300 characters)"
              >
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                  maxLength={300}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  placeholder="e.g. Experienced first-aider with 5 years of volunteer work..."
                />
                <div style={{
                  textAlign: 'right', fontSize: '12px',
                  color: form.bio.length > 270 ? '#ef4444' : 'var(--text-muted)',
                  marginTop: '4px',
                }}>
                  {form.bio.length}/300
                </div>
              </FormField>

              <FormField label="CNIC" hint="Format: XXXXX-XXXXXXX-X (for identity verification)">
                <input
                  type="text"
                  value={form.cnic}
                  onChange={(e) => setForm((p) => ({ ...p, cnic: e.target.value }))}
                  style={inputStyle}
                  placeholder="37405-1234567-9"
                  maxLength={15}
                />
              </FormField>
            </SectionCard>

            {/* ── Skills ──────────────────────────────────────────── */}
            <SectionCard title="Skills">
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {SKILLS.map((skill) => (
                  <ToggleChip
                    key={skill}
                    label={skill}
                    selected={form.skills.includes(skill)}
                    onClick={() => toggleArrayItem('skills', skill)}
                  />
                ))}
              </div>
            </SectionCard>

            {/* ── Emergency Types ──────────────────────────────────── */}
            <SectionCard title="Emergency Types I Handle">
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {EMERGENCY_TYPES.map((type) => (
                  <ToggleChip
                    key={type}
                    label={type}
                    selected={form.emergencyTypes.includes(type)}
                    onClick={() => toggleArrayItem('emergencyTypes', type)}
                  />
                ))}
              </div>
            </SectionCard>

            {/* ── Service Area ─────────────────────────────────────── */}
            <SectionCard title="Service Area">
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '16px',
              }}>
                <FormField label="City">
                  <select
                    value={form.city}
                    onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="">Select city...</option>
                    {PAKISTAN_CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Area / Neighbourhood">
                  <input
                    type="text"
                    value={form.area}
                    onChange={(e) => setForm((p) => ({ ...p, area: e.target.value }))}
                    style={inputStyle}
                    placeholder="e.g. Gulshan-e-Iqbal"
                  />
                </FormField>

                <FormField label={`Service Radius: ${form.radiusKm} km`}>
                  <input
                    type="range"
                    min={1}
                    max={100}
                    value={form.radiusKm}
                    onChange={(e) => setForm((p) => ({ ...p, radiusKm: e.target.value }))}
                    style={{ width: '100%', accentColor: 'var(--accent)' }}
                  />
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px',
                  }}>
                    <span>1 km</span><span>100 km</span>
                  </div>
                </FormField>
              </div>
            </SectionCard>

            {/* ── Availability Schedule ─────────────────────────── */}
            <SectionCard title="Weekly Availability">
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {DAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    style={{
                      background: form.availabilitySchedule[day]
                        ? 'var(--accent)' : 'var(--bg)',
                      color: form.availabilitySchedule[day]
                        ? '#fff' : 'var(--text-muted)',
                      border: `1px solid ${form.availabilitySchedule[day]
                        ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: '8px',
                      padding: '8px 14px',
                      fontSize: '13px', fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.15s',
                      textTransform: 'capitalize',
                    }}
                  >
                    {day.slice(0, 3).toUpperCase()}
                  </button>
                ))}
              </div>
            </SectionCard>

            {/* ── Blood Donation ───────────────────────────────────── */}
            <SectionCard title="Blood Donation">
              <div style={{
                display: 'flex', alignItems: 'center',
                gap: '12px', marginBottom: '16px',
              }}>
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, canDonatBlood: !p.canDonatBlood }))}
                  style={{
                    width: '44px', height: '24px',
                    borderRadius: '12px',
                    background: form.canDonatBlood ? 'var(--accent)' : 'var(--border)',
                    border: 'none', cursor: 'pointer',
                    position: 'relative', transition: 'background 0.2s',
                    flexShrink: 0,
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '2px',
                    left: form.canDonatBlood ? '22px' : '2px',
                    width: '20px', height: '20px',
                    borderRadius: '50%', background: '#fff',
                    transition: 'left 0.2s',
                  }} />
                </button>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>
                  I can donate blood
                </span>
                {user?.bloodGroup && (
                  <span style={{
                    background: '#ef444422', color: '#ef4444',
                    border: '1px solid #ef444444',
                    borderRadius: '20px', padding: '2px 10px',
                    fontSize: '12px', fontWeight: 700,
                  }}>
                    🩸 {user.bloodGroup}
                  </span>
                )}
              </div>

              {form.canDonatBlood && (
                <FormField
                  label="Last Donation Date"
                  hint="Must be at least 3 months ago to be eligible again"
                >
                  <input
                    type="date"
                    value={form.lastDonationDate}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, lastDonationDate: e.target.value }))
                    }
                    max={new Date().toISOString().split('T')[0]}
                    style={inputStyle}
                  />
                </FormField>
              )}
            </SectionCard>

            {/* ── Save Button ──────────────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={loadProfile}
                disabled={saving}
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '10px 24px',
                  color: 'var(--text)',
                  fontSize: '14px', fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  background: saving ? 'var(--border)' : 'var(--accent)',
                  color: '#fff', border: 'none',
                  borderRadius: '8px',
                  padding: '10px 32px',
                  fontSize: '14px', fontWeight: 700,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Saving...
                  </>
                ) : (
                  'Save Changes →'
                )}
              </button>
            </div>
          </form>
        )}

        {/* ════════════════════════════════════════════════════════════
            TAB: RATINGS
        ════════════════════════════════════════════════════════════ */}
        {activeTab === 'ratings' && (
          <div>
            {/* Summary */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '32px',
              flexWrap: 'wrap',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '40px', fontWeight: 800, lineHeight: 1 }}>
                  {profile?.averageRating?.toFixed(1) || '—'}
                </div>
                <StarRating score={profile?.averageRating || 0} />
                <div style={{
                  fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px',
                }}>
                  {profile?.totalRatings ?? 0} ratings
                </div>
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                {[5,4,3,2,1].map((star) => {
                  const count = ratings.filter((r) => Math.round(r.score) === star).length;
                  const pct   = ratings.length > 0
                    ? (count / ratings.length) * 100 : 0;
                  return (
                    <div key={star} style={{
                      display: 'flex', alignItems: 'center',
                      gap: '8px', marginBottom: '6px',
                    }}>
                      <span style={{
                        fontSize: '12px', color: 'var(--text-muted)',
                        width: '20px', textAlign: 'right', flexShrink: 0,
                      }}>
                        {star}★
                      </span>
                      <div style={{
                        flex: 1, height: '6px',
                        background: 'var(--border)', borderRadius: '99px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${pct}%`, height: '100%',
                          background: '#f59e0b', borderRadius: '99px',
                        }} />
                      </div>
                      <span style={{
                        fontSize: '12px', color: 'var(--text-muted)',
                        width: '24px', flexShrink: 0,
                      }}>
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ratings list */}
            {ratingsLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div className="spinner-border text-danger" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : ratings.length === 0 ? (
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '48px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>⭐</div>
                <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>No ratings yet</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
                  Complete requests to start receiving ratings from users.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {ratings.map((rating, idx) => (
                  <div key={rating._id || idx} style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '18px 20px',
                  }}>
                    <div style={{
                      display: 'flex', alignItems: 'flex-start',
                      justifyContent: 'space-between', gap: '12px',
                      marginBottom: rating.comment ? '10px' : 0,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: 'var(--accent)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '14px', color: '#fff', flexShrink: 0,
                        }}>
                          {rating.givenBy?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '14px' }}>
                            {rating.givenBy?.name || 'Anonymous'}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {rating.createdAt
                              ? new Date(rating.createdAt).toLocaleDateString('en-PK', {
                                  day: 'numeric', month: 'short', year: 'numeric',
                                })
                              : ''}
                          </div>
                        </div>
                      </div>
                      <div style={{ flexShrink: 0 }}>
                        <StarRating score={rating.score} />
                      </div>
                    </div>
                    {rating.comment && (
                      <div style={{
                        fontSize: '14px', color: 'var(--text-muted)',
                        lineHeight: 1.5, paddingLeft: '46px',
                        fontStyle: 'italic',
                      }}>
                        "{rating.comment}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Ratings pagination */}
            {ratingsMeta && ratingsMeta.totalPages > 1 && (
              <div style={{
                display: 'flex', justifyContent: 'center',
                gap: '8px', marginTop: '20px',
              }}>
                <button
                  onClick={() => setRatingsPage((p) => Math.max(1, p - 1))}
                  disabled={ratingsPage === 1}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px', padding: '7px 14px',
                    color: 'var(--text)', fontSize: '13px',
                    fontWeight: 600, cursor: 'pointer',
                    opacity: ratingsPage === 1 ? 0.5 : 1,
                  }}
                >
                  ← Prev
                </button>
                <span style={{
                  padding: '7px 16px', fontSize: '13px',
                  color: 'var(--text-muted)',
                }}>
                  {ratingsPage} / {ratingsMeta.totalPages}
                </span>
                <button
                  onClick={() => setRatingsPage((p) =>
                    Math.min(ratingsMeta.totalPages, p + 1)
                  )}
                  disabled={ratingsPage === ratingsMeta.totalPages}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px', padding: '7px 14px',
                    color: 'var(--text)', fontSize: '13px',
                    fontWeight: 600, cursor: 'pointer',
                    opacity: ratingsPage === ratingsMeta.totalPages ? 0.5 : 1,
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}