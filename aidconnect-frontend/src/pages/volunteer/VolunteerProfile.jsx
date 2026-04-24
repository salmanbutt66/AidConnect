// src/pages/volunteer/VolunteerProfile.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/common/Navbar.jsx';
import Badge from '../../components/common/Badge.jsx';
import Loader from '../../components/common/Loader.jsx';
import useAuth from '../../hooks/useAuth.js';
import {
  getMyVolunteerProfile,
  updateVolunteerProfile,
  getMyRatings,
} from '../../api/volunteer.api.js';
import {
  VOLUNTEER_SKILLS,
  EMERGENCY_TYPES,
  PAKISTAN_CITIES,
} from '../../utils/constants.js';
import {
  formatDate,
  formatDateTime,
  formatScore,
  formatStars,
  getInitials,
} from '../../utils/formatters.js';

// ─── Days of week ─────────────────────────────────────────────────────────────
const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

// ─── Toggle chip — skill / emergency type selector ────────────────────────────
function ToggleChip({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '5px 14px',
        borderRadius: 'var(--radius-full)',
        border: `1.5px solid ${selected ? 'var(--green-600)' : 'var(--stone-300)'}`,
        background: selected ? 'var(--green-50)' : 'white',
        color: selected ? 'var(--green-800)' : 'var(--text-muted)',
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all var(--t-fast)',
        textTransform: 'capitalize',
        whiteSpace: 'nowrap',
      }}
    >
      {label.replace(/_/g, ' ')}
    </button>
  );
}

// ─── Star rating display ──────────────────────────────────────────────────────
function StarDisplay({ score }) {
  const stars = formatStars(score);
  return (
    <div className="stars">
      {stars.map((filled, i) => (
        <span key={i} className={`star${filled ? ' filled' : ''}`}>★</span>
      ))}
    </div>
  );
}

// ─── Rating card ──────────────────────────────────────────────────────────────
function RatingCard({ rating }) {
  return (
    <div className="card" style={{ animation: 'fadeSlideUp var(--t-page) var(--ease) both' }}>
      <div className="card-body">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: rating.comment ? '12px' : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="avatar avatar-sm">
              {getInitials(rating.givenBy?.name || '?')}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-dark)' }}>
                {rating.givenBy?.name || 'Anonymous'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {formatDate(rating.createdAt)}
              </div>
            </div>
          </div>
          <StarDisplay score={rating.score} />
        </div>
        {rating.comment && (
          <div
            style={{
              fontSize: '13px',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              paddingLeft: '46px',
              fontStyle: 'italic',
            }}
          >
            "{rating.comment}"
          </div>
        )}
      </div>
    </div>
  );
}

// ─── VolunteerProfile ─────────────────────────────────────────────────────────
export default function VolunteerProfile() {
  const { user } = useAuth();

  const [profile,        setProfile]        = useState(null);
  const [ratings,        setRatings]        = useState([]);
  const [ratingsMeta,    setRatingsMeta]    = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [error,          setError]          = useState('');
  const [successMsg,     setSuccessMsg]     = useState('');
  const [activeTab,      setActiveTab]      = useState('profile');
  const [ratingsPage,    setRatingsPage]    = useState(1);

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

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // ── Build form from profile ────────────────────────────────────────────────
  const buildForm = (p) => ({
    bio:            p.bio            || '',
    skills:         p.skills         || [],
    emergencyTypes: p.emergencyTypes || [],
    cnic:           p.cnic           || '',
    canDonatBlood:  p.canDonatBlood  || false,
    lastDonationDate: p.lastDonationDate
      ? new Date(p.lastDonationDate).toISOString().split('T')[0]
      : '',
    radiusKm: p.serviceArea?.radiusKm ?? 10,
    city:     p.serviceArea?.city     || '',
    area:     p.serviceArea?.area     || '',
    availabilitySchedule: p.availabilitySchedule || {
      monday: true, tuesday: true, wednesday: true,
      thursday: true, friday: true, saturday: false, sunday: false,
    },
  });

  // ── Load profile ───────────────────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    try {
      const res = await getMyVolunteerProfile();
      setProfile(res.profile);
      setForm(buildForm(res.profile));
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
      // fail silently
    } finally {
      setRatingsLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  useEffect(() => {
    if (activeTab === 'ratings') loadRatings(ratingsPage);
  }, [activeTab, ratingsPage, loadRatings]);

  // ── Toggle helpers ─────────────────────────────────────────────────────────
  const toggleArrayItem = (field, value) => {
    setForm((prev) => {
      const arr = prev[field];
      return {
        ...prev,
        [field]: arr.includes(value)
          ? arr.filter((v) => v !== value)
          : [...arr, value],
      };
    });
  };

  const toggleDay = (day) => {
    setForm((prev) => ({
      ...prev,
      availabilitySchedule: {
        ...prev.availabilitySchedule,
        [day]: !prev.availabilitySchedule[day],
      },
    }));
  };

  // ── Save profile ───────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        bio:            form.bio.trim(),
        skills:         form.skills,
        emergencyTypes: form.emergencyTypes,
        canDonatBlood:  form.canDonatBlood,
        availabilitySchedule: form.availabilitySchedule,
        serviceArea: { city: form.city, area: form.area },
        radiusKm: Number(form.radiusKm),
      };
      if (form.cnic.trim())      payload.cnic             = form.cnic.trim();
      if (form.lastDonationDate) payload.lastDonationDate = form.lastDonationDate;

      const res = await updateVolunteerProfile(payload);
      setProfile(res.profile);
      showSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  // ── Reputation meta ────────────────────────────────────────────────────────
  const reputationScore = profile?.reputationScore ?? 0;
  const scoreMeta       = formatScore(reputationScore);

  if (loading) {
    return (
      <Navbar title="My Profile">
        <Loader variant="card" message="Loading your profile…" />
      </Navbar>
    );
  }

  return (
    <Navbar title="My Profile">
      <div className="page-wrapper">

        {/* ── Profile hero ──────────────────────────────────────────────── */}
        <div className="profile-hero">
          <div className="avatar avatar-xl" style={{ flexShrink: 0 }}>
            {getInitials(user?.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="profile-hero-name">{user?.name}</div>
            <div className="profile-hero-role">Volunteer Responder</div>
            <div className="profile-hero-email">{user?.email}</div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
              <span className="badge badge-green" style={{ fontSize: '11px' }}>
                {scoreMeta.label} · {reputationScore}/100
              </span>
              {profile?.isApproved
                ? <span className="badge badge-green" style={{ fontSize: '11px' }}>✓ Approved</span>
                : <span className="badge badge-orange" style={{ fontSize: '11px' }}>⏳ Pending</span>
              }
              {user?.bloodGroup && (
                <span className="badge badge-red" style={{ fontSize: '11px' }}>
                  🩸 {user.bloodGroup}
                </span>
              )}
            </div>
          </div>
          {/* Stats */}
          <div style={{ display: 'flex', gap: '28px', flexShrink: 0 }}>
            {[
              { label: 'Completed',  value: profile?.totalCompleted  ?? 0 },
              { label: 'Avg Rating', value: profile?.averageRating
                  ? Number(profile.averageRating).toFixed(1) : '—'
              },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'white', letterSpacing: '-1px' }}>
                  {s.value}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Alerts ────────────────────────────────────────────────────── */}
        {error && (
          <div className="alert alert-error anim-fade-up" style={{ marginBottom: '20px' }}>
            <span className="alert-icon">⚠️</span>
            {error}
            <button
              onClick={() => setError('')}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontWeight: 700 }}
            >✕</button>
          </div>
        )}
        {successMsg && (
          <div className="alert alert-success anim-fade-up" style={{ marginBottom: '20px' }}>
            <span className="alert-icon">✅</span>
            {successMsg}
          </div>
        )}

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <div className="tabs" style={{ marginBottom: '24px' }}>
          {[
            { id: 'profile', label: '👤 Edit Profile' },
            { id: 'ratings', label: '⭐ My Ratings'   },
          ].map(({ id, label }) => (
            <button
              key={id}
              className={`tab-btn${activeTab === id ? ' active' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════════
            TAB: EDIT PROFILE
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSave} noValidate>

            {/* ── Bio + CNIC ────────────────────────────────────────────── */}
            <div className="card anim-fade-up delay-100" style={{ marginBottom: '20px' }}>
              <div className="card-header">
                <div className="section-title">About You</div>
              </div>
              <div className="card-body" style={{ paddingTop: '16px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="vp-bio">
                    Bio
                    <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: '6px' }}>
                      (optional — max 300 chars)
                    </span>
                  </label>
                  <textarea
                    id="vp-bio"
                    className="form-textarea"
                    value={form.bio}
                    onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                    maxLength={300}
                    rows={3}
                    disabled={saving}
                    placeholder="e.g. Experienced first-aider with 5 years of volunteer work…"
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        color: form.bio.length > 270 ? 'var(--danger)' : 'var(--text-light)',
                      }}
                    >
                      {form.bio.length}/300
                    </span>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="vp-cnic">CNIC</label>
                  <input
                    id="vp-cnic"
                    type="text"
                    className="form-input"
                    value={form.cnic}
                    onChange={(e) => setForm((p) => ({ ...p, cnic: e.target.value }))}
                    placeholder="37405-1234567-9"
                    maxLength={15}
                    disabled={saving}
                  />
                  <div className="form-hint">Format: XXXXX-XXXXXXX-X (for identity verification)</div>
                </div>
              </div>
            </div>

            {/* ── Skills ───────────────────────────────────────────────── */}
            <div className="card anim-fade-up delay-200" style={{ marginBottom: '20px' }}>
              <div className="card-header">
                <div className="section-title">My Skills</div>
                <div className="section-subtitle">Select all that apply</div>
              </div>
              <div className="card-body" style={{ paddingTop: '14px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {VOLUNTEER_SKILLS.map((skill) => (
                    <ToggleChip
                      key={skill}
                      label={skill}
                      selected={form.skills.includes(skill)}
                      onClick={() => toggleArrayItem('skills', skill)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* ── Emergency types ───────────────────────────────────────── */}
            <div className="card anim-fade-up delay-200" style={{ marginBottom: '20px' }}>
              <div className="card-header">
                <div className="section-title">Emergency Types I Handle</div>
              </div>
              <div className="card-body" style={{ paddingTop: '14px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {EMERGENCY_TYPES.map((type) => (
                    <ToggleChip
                      key={type.value}
                      label={type.label}
                      selected={form.emergencyTypes.includes(type.value)}
                      onClick={() => toggleArrayItem('emergencyTypes', type.value)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* ── Service area ──────────────────────────────────────────── */}
            <div className="card anim-fade-up delay-300" style={{ marginBottom: '20px' }}>
              <div className="card-header">
                <div className="section-title">Service Area</div>
              </div>
              <div className="card-body" style={{ paddingTop: '16px' }}>
                <div className="form-row cols-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="vp-city">City</label>
                    <select
                      id="vp-city"
                      className="form-select"
                      value={form.city}
                      onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                      disabled={saving}
                    >
                      <option value="">Select city…</option>
                      {PAKISTAN_CITIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="vp-area">Area / Neighbourhood</label>
                    <input
                      id="vp-area"
                      type="text"
                      className="form-input"
                      value={form.area}
                      onChange={(e) => setForm((p) => ({ ...p, area: e.target.value }))}
                      placeholder="e.g. Gulshan-e-Iqbal"
                      disabled={saving}
                    />
                  </div>
                </div>

                {/* Radius slider */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">
                    Service Radius —{' '}
                    <span style={{ color: 'var(--green-700)', fontWeight: 700 }}>
                      {form.radiusKm} km
                    </span>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={100}
                    value={form.radiusKm}
                    onChange={(e) => setForm((p) => ({ ...p, radiusKm: e.target.value }))}
                    disabled={saving}
                    style={{ width: '100%', accentColor: 'var(--green-700)' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="form-hint">1 km</span>
                    <span className="form-hint">100 km</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Weekly availability ───────────────────────────────────── */}
            <div className="card anim-fade-up delay-300" style={{ marginBottom: '20px' }}>
              <div className="card-header">
                <div className="section-title">Weekly Availability</div>
              </div>
              <div className="card-body" style={{ paddingTop: '14px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {DAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      disabled={saving}
                      onClick={() => toggleDay(day)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: `2px solid ${form.availabilitySchedule[day] ? 'var(--green-600)' : 'var(--stone-300)'}`,
                        background: form.availabilitySchedule[day] ? 'var(--green-50)' : 'white',
                        color: form.availabilitySchedule[day] ? 'var(--green-800)' : 'var(--text-muted)',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: saving ? 'not-allowed' : 'pointer',
                        transition: 'all var(--t-fast)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Blood donation ────────────────────────────────────────── */}
            <div className="card anim-fade-up delay-400" style={{ marginBottom: '24px' }}>
              <div className="card-header">
                <div className="section-title">Blood Donation</div>
              </div>
              <div className="card-body" style={{ paddingTop: '14px' }}>
                {/* Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={form.canDonatBlood}
                      onChange={(e) => setForm((p) => ({ ...p, canDonatBlood: e.target.checked }))}
                      disabled={saving}
                    />
                    <span className="toggle-track" />
                  </label>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-dark)' }}>
                    I can donate blood
                  </span>
                  {user?.bloodGroup && (
                    <span className="badge badge-red" style={{ fontSize: '11px' }}>
                      🩸 {user.bloodGroup}
                    </span>
                  )}
                </div>

                {/* Last donation date */}
                {form.canDonatBlood && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="vp-donation-date">
                      Last Donation Date
                    </label>
                    <input
                      id="vp-donation-date"
                      type="date"
                      className="form-input"
                      value={form.lastDonationDate}
                      onChange={(e) => setForm((p) => ({ ...p, lastDonationDate: e.target.value }))}
                      max={new Date().toISOString().split('T')[0]}
                      disabled={saving}
                    />
                    <div className="form-hint">Must be at least 3 months ago to be eligible again</div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Save / Reset ──────────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={saving}
                onClick={loadProfile}
              >
                Reset
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={saving}
              >
                {saving
                  ? <><span className="spinner" /> Saving…</>
                  : 'Save Changes →'
                }
              </button>
            </div>
          </form>
        )}

        {/* ════════════════════════════════════════════════════════════════
            TAB: RATINGS
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'ratings' && (
          <div>

            {/* Rating summary card */}
            <div className="card anim-fade-up delay-100" style={{ marginBottom: '20px' }}>
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>

                  {/* Average + stars */}
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: '40px', fontWeight: 800, color: 'var(--text-dark)', letterSpacing: '-1.5px', lineHeight: 1 }}>
                      {profile?.averageRating?.toFixed(1) || '—'}
                    </div>
                    <StarDisplay score={profile?.averageRating || 0} />
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {profile?.totalRatings ?? 0} ratings
                    </div>
                  </div>

                  {/* Distribution bars */}
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = ratings.filter((r) => Math.round(r.score) === star).length;
                      const pct   = ratings.length > 0 ? (count / ratings.length) * 100 : 0;
                      return (
                        <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', width: '20px', textAlign: 'right', flexShrink: 0 }}>
                            {star}★
                          </span>
                          <div style={{ flex: 1, height: '6px', background: 'var(--stone-200)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: '#f39c12', borderRadius: 'var(--radius-full)', transition: 'width 0.6s var(--ease)' }} />
                          </div>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', width: '20px', flexShrink: 0 }}>
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Ratings list */}
            {ratingsLoading ? (
              <Loader variant="skeleton" count={3} />
            ) : ratings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">⭐</div>
                <h3>No ratings yet</h3>
                <p>Complete requests to start receiving ratings from users.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {ratings.map((rating, idx) => (
                  <RatingCard key={rating._id || idx} rating={rating} />
                ))}
              </div>
            )}

            {/* Ratings pagination */}
            {ratingsMeta && ratingsMeta.totalPages > 1 && (
              <div className="pagination" style={{ marginTop: '20px' }}>
                <button
                  className="page-btn"
                  disabled={ratingsPage <= 1}
                  onClick={() => setRatingsPage((p) => Math.max(1, p - 1))}
                >
                  ‹
                </button>
                {Array.from({ length: ratingsMeta.totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={`page-btn${p === ratingsPage ? ' active' : ''}`}
                    onClick={() => setRatingsPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  className="page-btn"
                  disabled={ratingsPage >= ratingsMeta.totalPages}
                  onClick={() => setRatingsPage((p) => Math.min(ratingsMeta.totalPages, p + 1))}
                >
                  ›
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </Navbar>
  );
}