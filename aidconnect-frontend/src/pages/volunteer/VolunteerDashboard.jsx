// src/pages/volunteer/VolunteerDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar.jsx';
import StatsCard from '../../components/dashboard/StatsCard.jsx';
import Badge from '../../components/common/Badge.jsx';
import Loader from '../../components/common/Loader.jsx';
import NotificationPanel from '../../components/dashboard/NotificationPanel.jsx';
import useAuth from '../../hooks/useAuth.js';
import {
  getMyVolunteerProfile,
  getVolunteerStats,
  toggleAvailability,
  getActiveRequest,
} from '../../api/volunteer.api.js';
import { formatScore, formatPercent } from '../../utils/formatters.js';

// ─── Availability toggle card ─────────────────────────────────────────────────
function AvailabilityCard({ isAvailable, isApproved, isSuspended, toggling, onToggle }) {
  return (
    <div
      className="card"
      style={{
        border: `2px solid ${isAvailable ? 'var(--green-300)' : 'var(--stone-200)'}`,
        transition: 'border-color var(--t-base)',
      }}
    >
      <div className="card-body" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
          Availability Status
        </div>

        {/* Status indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '14px' }}>
          <span className={`status-dot ${isAvailable ? 'dot-green pulse' : 'dot-stone'}`} />
          <span style={{ fontWeight: 700, fontSize: '15px', color: isAvailable ? 'var(--green-700)' : 'var(--text-muted)' }}>
            {isAvailable ? 'Available' : 'Unavailable'}
          </span>
        </div>

        {/* Toggle button */}
        <button
          onClick={onToggle}
          disabled={toggling || !isApproved || isSuspended}
          className={`btn btn-full ${isAvailable ? 'btn-danger' : 'btn-primary'}`}
          style={{ fontSize: '13px' }}
        >
          {toggling
            ? <><span className="spinner" /> Updating…</>
            : isAvailable ? 'Go Unavailable' : 'Go Available'
          }
        </button>

        {!isApproved && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Awaiting admin approval
          </div>
        )}
        {isSuspended && (
          <div style={{ fontSize: '11px', color: 'var(--danger)', marginTop: '8px' }}>
            Account suspended
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Performance bar ──────────────────────────────────────────────────────────
function PerformanceBar({ label, value, color }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>{value}%</span>
      </div>
      <div style={{ height: '6px', background: 'var(--stone-200)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
        <div style={{
          width: `${Math.min(value, 100)}%`,
          height: '100%',
          background: color,
          borderRadius: 'var(--radius-full)',
          transition: 'width 0.6s var(--ease)',
        }} />
      </div>
    </div>
  );
}

// ─── Active request banner ────────────────────────────────────────────────────
function ActiveRequestBanner({ request, onView }) {
  return (
    <div
      className="anim-fade-up"
      style={{
        padding: '16px 20px',
        background: 'var(--danger-bg)',
        border: '1.5px solid #f5c6c2',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        marginBottom: '24px',
        flexWrap: 'wrap',
      }}
    >
      <div style={{
        width: '44px', height: '44px',
        background: 'rgba(192,57,43,0.12)',
        borderRadius: 'var(--radius-md)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '22px', flexShrink: 0,
      }}>
        🚨
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-dark)', marginBottom: '5px' }}>
          You have an active request
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <Badge urgency={request.urgencyLevel} />
          <Badge color="blue">{request.emergencyType?.replace('_', ' ')}</Badge>
        </div>
      </div>
      <button className="btn btn-danger btn-sm" onClick={onView} style={{ flexShrink: 0 }}>
        View Request →
      </button>
    </div>
  );
}

// ─── VolunteerDashboard ───────────────────────────────────────────────────────
export default function VolunteerDashboard() {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [profile,        setProfile]        = useState(null);
  const [stats,          setStats]          = useState(null);
  const [activeRequest,  setActiveRequest]  = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [toggling,       setToggling]       = useState(false);
  const [error,          setError]          = useState('');

  // ── Load all data on mount ─────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        // Run all three in parallel — handle each failure independently
        const [profileRes, statsRes, activeRes] = await Promise.allSettled([
          getMyVolunteerProfile(),
          getVolunteerStats(),
          getActiveRequest(),
        ]);
        if (profileRes.status === 'fulfilled') setProfile(profileRes.value.profile);
        if (statsRes.status   === 'fulfilled') setStats(statsRes.value.stats);
        if (activeRes.status  === 'fulfilled') setActiveRequest(activeRes.value.activeRequest);
        // Only show error if all three failed
        if (
          profileRes.status === 'rejected' &&
          statsRes.status   === 'rejected' &&
          activeRes.status  === 'rejected'
        ) {
          setError('Failed to load dashboard data. Please refresh.');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Toggle availability ────────────────────────────────────────────────────
  const handleToggleAvailability = useCallback(async () => {
    setToggling(true);
    setError('');
    try {
      const res = await toggleAvailability();
      setProfile((prev) => ({ ...prev, isAvailable: res.isAvailable }));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update availability.');
    } finally {
      setToggling(false);
    }
  }, []);

  const isAvailable     = profile?.isAvailable;
  const isApproved      = profile?.isApproved;
  const isSuspended     = profile?.isSuspended;
  const reputationScore = stats?.reputationScore ?? 0;
  const scoreMeta       = formatScore(reputationScore);
  const firstName       = user?.name?.split(' ')[0] || 'there';

  return (
    <Navbar title="Dashboard">
      <div className="page-wrapper">

        {/* ── Page header ───────────────────────────────────────────────── */}
        <div className="page-header">
          <h1>Welcome back, {firstName} 👋</h1>
          <p>Here's your volunteer activity and performance overview.</p>
        </div>

        {/* ── Loading state ─────────────────────────────────────────────── */}
        {loading && <Loader variant="skeleton" count={3} />}

        {!loading && (
          <>
            {/* ── Error alert ─────────────────────────────────────────────── */}
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

            {/* ── Status banners ────────────────────────────────────────── */}
            {!isApproved && (
              <div className="alert alert-warning anim-fade-up" style={{ marginBottom: '20px' }}>
                <span className="alert-icon">⏳</span>
                <div>
                  <strong>Pending Approval</strong> — Your volunteer profile is awaiting
                  admin review. You'll be notified once approved.
                </div>
              </div>
            )}

            {isSuspended && (
              <div className="alert alert-error anim-fade-up" style={{ marginBottom: '20px' }}>
                <span className="alert-icon">⛔</span>
                <div>
                  <strong>Account Suspended</strong> —{' '}
                  {profile?.suspendedReason || 'Please contact the admin for details.'}
                </div>
              </div>
            )}

            {/* ── Active request banner ────────────────────────────────── */}
            {activeRequest && (
              <ActiveRequestBanner
                request={activeRequest}
                onView={() => navigate('/volunteer/active-request')}
              />
            )}

            {/* ── Stats row ─────────────────────────────────────────────── */}
            <div className="grid-4" style={{ marginBottom: '28px' }}>
              <StatsCard
                label="Completed"
                value={stats?.totalCompleted ?? 0}
                icon="✅"
                color="green"
                sub="Total resolved"
                delay={0}
              />
              <StatsCard
                label="Acceptance Rate"
                value={stats?.acceptanceRate ?? 0}
                icon="⚡"
                color="blue"
                format="percent"
                delay={100}
              />
              <StatsCard
                label="Avg Rating"
                value={stats?.averageRating
                  ? Number(stats.averageRating).toFixed(1)
                  : '—'
                }
                icon="⭐"
                color="orange"
                format="raw"
                sub={`${stats?.totalRatings ?? 0} ratings`}
                delay={200}
              />
              <StatsCard
                label="Reputation"
                value={reputationScore}
                icon="🏅"
                color="green"
                sub={scoreMeta.label}
                delay={300}
              />
            </div>

            {/* ── Main content grid ──────────────────────────────────────── */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 300px',
                gap: '24px',
                alignItems: 'start',
              }}
            >
              {/* Left column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* Performance summary card */}
                <div className="card anim-fade-up delay-200">
                  <div className="card-header">
                    <div className="section-header" style={{ marginBottom: 0 }}>
                      <div>
                        <div className="section-title">Performance Summary</div>
                        <div className="section-subtitle">Your response metrics</div>
                      </div>
                    </div>
                  </div>
                  <div className="card-body" style={{ paddingTop: '16px' }}>

                    {/* Performance bars */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                      <PerformanceBar
                        label="Acceptance Rate"
                        value={stats?.acceptanceRate ?? 0}
                        color="var(--info)"
                      />
                      <PerformanceBar
                        label="Completion Rate"
                        value={stats?.completionRate ?? 0}
                        color="var(--green-600)"
                      />
                      <PerformanceBar
                        label="Cancellation Rate"
                        value={stats?.cancellationRate ?? 0}
                        color="var(--danger)"
                      />
                    </div>

                    {/* Breakdown counters */}
                    <div
                      style={{
                        display: 'flex',
                        gap: '0',
                        paddingTop: '20px',
                        borderTop: '1px solid var(--stone-200)',
                        justifyContent: 'space-around',
                      }}
                    >
                      {[
                        { label: 'Assigned',    value: stats?.totalAssigned   ?? 0 },
                        { label: 'Accepted',    value: stats?.totalAccepted   ?? 0 },
                        { label: 'Completed',   value: stats?.totalCompleted  ?? 0 },
                        { label: 'Cancelled',   value: stats?.totalCancelled  ?? 0 },
                        { label: 'No Response', value: stats?.totalNoResponse ?? 0 },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-dark)', letterSpacing: '-0.5px' }}>
                            {value}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 600 }}>
                            {label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quick actions card */}
                <div className="card anim-fade-up delay-300">
                  <div className="card-header">
                    <div className="section-title">Quick Actions</div>
                  </div>
                  <div className="card-body" style={{ paddingTop: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {[
                        { icon: '🚨', label: 'View Active Request', desc: 'Check and manage your current assignment', to: '/volunteer/active-request' },
                        { icon: '📬', label: 'Incoming Matches',    desc: 'Review matches and accept a request',    to: '/volunteer/matches' },
                        { icon: '📋', label: 'Request History',     desc: 'Browse your past responses and ratings',  to: '/volunteer/history'        },
                        { icon: '👤', label: 'Edit Profile',         desc: 'Update your skills and service area',     to: '/volunteer/profile'        },
                      ].map((action) => (
                        <button
                          key={action.to}
                          onClick={() => navigate(action.to)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px',
                            padding: '14px 16px',
                            background: 'white',
                            border: '1.5px solid var(--stone-200)',
                            borderRadius: 'var(--radius-lg)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all var(--t-base)',
                            width: '100%',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--green-300)';
                            e.currentTarget.style.boxShadow  = 'var(--shadow-md)';
                            e.currentTarget.style.transform  = 'translateY(-2px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--stone-200)';
                            e.currentTarget.style.boxShadow  = 'none';
                            e.currentTarget.style.transform  = 'translateY(0)';
                          }}
                        >
                          <div style={{
                            width: '40px', height: '40px',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--green-100)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '18px', flexShrink: 0,
                          }}>
                            {action.icon}
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--green-800)', marginBottom: '2px' }}>
                              {action.label}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              {action.desc}
                            </div>
                          </div>
                          <span style={{ marginLeft: 'auto', color: 'var(--text-light)', fontSize: '16px' }}>›</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Availability card */}
                <div className="anim-fade-up delay-100">
                  <AvailabilityCard
                    isAvailable={isAvailable}
                    isApproved={isApproved}
                    isSuspended={isSuspended}
                    toggling={toggling}
                    onToggle={handleToggleAvailability}
                  />
                </div>

                {/* Reputation card */}
                <div className="card anim-fade-up delay-200">
                  <div className="card-body">
                    <div className="section-title" style={{ marginBottom: '14px' }}>
                      Reputation Score
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                      <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-dark)', letterSpacing: '-1px' }}>
                        {reputationScore}
                      </div>
                      <span className="badge badge-green">{scoreMeta.label}</span>
                    </div>
                    {/* Score bar */}
                    <div style={{ height: '8px', background: 'var(--stone-200)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: '8px' }}>
                      <div style={{
                        width: `${reputationScore}%`,
                        height: '100%',
                        background: reputationScore >= 70
                          ? 'var(--green-600)'
                          : reputationScore >= 40
                            ? 'var(--warning)'
                            : 'var(--danger)',
                        borderRadius: 'var(--radius-full)',
                        transition: 'width 0.6s var(--ease)',
                      }} />
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Out of 100 — based on response rate, completion and ratings
                    </div>
                  </div>
                </div>

                {/* Notifications */}
                <div className="anim-fade-up delay-300">
                  <NotificationPanel limit={5} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Navbar>
  );
}