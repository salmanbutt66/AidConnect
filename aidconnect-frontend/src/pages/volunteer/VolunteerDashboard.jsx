// src/pages/volunteer/VolunteerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import {
  getMyVolunteerProfile,
  getVolunteerStats,
  toggleAvailability,
  getActiveRequest,
} from '../../api/volunteer.api.js';

const StatCard = ({ label, value, sub, color = 'var(--accent)' }) => (
  <div style={{
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '20px 24px',
    flex: '1',
    minWidth: '140px',
  }}>
    <div style={{ fontSize: '28px', fontWeight: 700, color }}>{value}</div>
    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{label}</div>
    {sub && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{sub}</div>}
  </div>
);

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
      background: `${color}22`,
      color,
      border: `1px solid ${color}44`,
      borderRadius: '20px',
      padding: '3px 12px',
      fontSize: '12px',
      fontWeight: 600,
    }}>
      {label}
    </span>
  );
};

const EmergencyBadge = ({ type }) => {
  const colors = {
    medical:        '#ef4444',
    fire:           '#f97316',
    flood:          '#3b82f6',
    earthquake:     '#a855f7',
    accident:       '#f59e0b',
    blood_request:  '#dc2626',
    food_shortage:  '#84cc16',
    mental_health:  '#06b6d4',
    missing_person: '#8b5cf6',
    other:          '#6b7280',
  };
  const color = colors[type] || colors.other;
  return (
    <span style={{
      background: `${color}22`,
      color,
      border: `1px solid ${color}55`,
      borderRadius: '6px',
      padding: '2px 10px',
      fontSize: '12px',
      fontWeight: 600,
      textTransform: 'capitalize',
    }}>
      {type?.replace('_', ' ')}
    </span>
  );
};

const UrgencyBadge = ({ level }) => {
  const map = {
    critical: { color: '#ef4444', label: '🔴 Critical' },
    high:     { color: '#f97316', label: '🟠 High' },
    medium:   { color: '#f59e0b', label: '🟡 Medium' },
    low:      { color: '#22c55e', label: '🟢 Low' },
  };
  const { color, label } = map[level] || map.low;
  return (
    <span style={{ color, fontSize: '13px', fontWeight: 600 }}>{label}</span>
  );
};

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile,       setProfile]       = useState(null);
  const [stats,         setStats]         = useState(null);
  const [activeRequest, setActiveRequest] = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [toggling,      setToggling]      = useState(false);
  const [error,         setError]         = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, statsRes, activeRes] = await Promise.all([
          getMyVolunteerProfile(),
          getVolunteerStats(),
          getActiveRequest(),
        ]);
        setProfile(profileRes.profile);
        setStats(statsRes.stats);
        setActiveRequest(activeRes.activeRequest);
      } catch (err) {
        setError('Failed to load dashboard data. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleToggleAvailability = async () => {
    setToggling(true);
    try {
      const res = await toggleAvailability();
      setProfile((prev) => ({ ...prev, isAvailable: res.isAvailable }));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update availability.');
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const isAvailable    = profile?.isAvailable;
  const isApproved     = profile?.isApproved;
  const isSuspended    = profile?.isSuspended;
  const reputationScore = stats?.reputationScore ?? 50;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>

      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
      }}>
        <div style={{ fontWeight: 800, fontSize: '20px', letterSpacing: '-0.5px' }}>
          Aid<span style={{ color: 'var(--accent)' }}>Connect</span>
        </div>
        <nav style={{ display: 'flex', gap: '8px' }}>
          {[
            { label: 'Dashboard',  to: '/volunteer' },
            { label: 'Active',     to: '/volunteer/active' },
            { label: 'History',    to: '/volunteer/history' },
            { label: 'Profile',    to: '/volunteer/profile' },
          ].map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                color: window.location.pathname === to ? 'var(--accent)' : 'var(--text-muted)',
                background: window.location.pathname === to ? 'var(--accent-dim)' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            {user?.name}
          </span>
          <div style={{
            width: '36px', height: '36px',
            borderRadius: '50%',
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '14px', color: '#fff',
          }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Error */}
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '24px', borderRadius: '10px' }}>
            ⚠️ {error}
          </div>
        )}

        {/* ── Status Banners ─────────────────────────────────────────────── */}
        {!isApproved && (
          <div style={{
            background: '#f59e0b22',
            border: '1px solid #f59e0b55',
            borderRadius: '10px',
            padding: '14px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <span style={{ fontSize: '20px' }}>⏳</span>
            <div>
              <div style={{ fontWeight: 600, color: '#f59e0b' }}>Pending Approval</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Your volunteer profile is awaiting admin approval. You'll be notified once approved.
              </div>
            </div>
          </div>
        )}

        {isSuspended && (
          <div style={{
            background: '#ef444422',
            border: '1px solid #ef444455',
            borderRadius: '10px',
            padding: '14px 20px',
            marginBottom: '24px',
          }}>
            <div style={{ fontWeight: 600, color: '#ef4444' }}>⛔ Account Suspended</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {profile?.suspendedReason || 'Contact admin for details.'}
            </div>
          </div>
        )}

        {/* ── Welcome Row ────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '32px',
        }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0 }}>
              Welcome back, {user?.name?.split(' ')[0]} 👋
            </h1>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginTop: '8px',
            }}>
              <ScoreBadge score={reputationScore} />
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Reputation Score: <strong style={{ color: 'var(--text)' }}>{reputationScore}/100</strong>
              </span>
            </div>
          </div>

          {/* Availability Toggle */}
          <div style={{
            background: 'var(--surface)',
            border: `2px solid ${isAvailable ? '#22c55e55' : 'var(--border)'}`,
            borderRadius: '12px',
            padding: '16px 24px',
            textAlign: 'center',
            minWidth: '200px',
          }}>
            <div style={{
              fontSize: '13px',
              color: 'var(--text-muted)',
              marginBottom: '10px',
            }}>
              Availability Status
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '12px',
            }}>
              <div style={{
                width: '10px', height: '10px',
                borderRadius: '50%',
                background: isAvailable ? '#22c55e' : '#6b7280',
                boxShadow: isAvailable ? '0 0 8px #22c55e' : 'none',
              }} />
              <span style={{
                fontWeight: 700,
                color: isAvailable ? '#22c55e' : 'var(--text-muted)',
              }}>
                {isAvailable ? 'Available' : 'Unavailable'}
              </span>
            </div>
            <button
              onClick={handleToggleAvailability}
              disabled={toggling || !isApproved || isSuspended}
              style={{
                background: isAvailable ? '#ef444422' : '#22c55e22',
                color: isAvailable ? '#ef4444' : '#22c55e',
                border: `1px solid ${isAvailable ? '#ef444444' : '#22c55e44'}`,
                borderRadius: '8px',
                padding: '7px 16px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: (!isApproved || isSuspended) ? 'not-allowed' : 'pointer',
                opacity: (!isApproved || isSuspended) ? 0.5 : 1,
                width: '100%',
              }}
            >
              {toggling ? '...' : isAvailable ? 'Go Unavailable' : 'Go Available'}
            </button>
          </div>
        </div>

        {/* ── Active Request Alert ────────────────────────────────────────── */}
        {activeRequest && (
          <div style={{
            background: 'linear-gradient(135deg, #ef444415, #f9731615)',
            border: '1px solid #ef444444',
            borderRadius: '12px',
            padding: '20px 24px',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '44px', height: '44px',
                background: '#ef444422',
                borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px',
              }}>
                🚨
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>
                  You have an active request
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '5px', flexWrap: 'wrap' }}>
                  <EmergencyBadge type={activeRequest.emergencyType} />
                  <UrgencyBadge level={activeRequest.urgencyLevel} />
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/volunteer/active')}
              style={{
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              View Request →
            </button>
          </div>
        )}

        {/* ── Stats Row ──────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '32px',
        }}>
          <StatCard
            label="Completed"
            value={stats?.totalCompleted ?? 0}
            sub="Total requests resolved"
            color="#22c55e"
          />
          <StatCard
            label="Acceptance Rate"
            value={`${stats?.acceptanceRate ?? 0}%`}
            sub="Requests responded to"
            color="#3b82f6"
          />
          <StatCard
            label="Completion Rate"
            value={`${stats?.completionRate ?? 0}%`}
            sub="Accepted & finished"
            color="#06b6d4"
          />
          <StatCard
            label="Avg Rating"
            value={stats?.averageRating ? stats.averageRating.toFixed(1) : '—'}
            sub={`From ${stats?.totalRatings ?? 0} ratings`}
            color="#f59e0b"
          />
          <StatCard
            label="Reputation"
            value={reputationScore}
            sub="Out of 100"
            color="var(--accent)"
          />
        </div>

        {/* ── Quick Actions ──────────────────────────────────────────────── */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '16px' }}>
            Quick Actions
          </h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {[
              { label: '🚨 View Active Request', to: '/volunteer/active',  color: '#ef4444' },
              { label: '📋 Request History',     to: '/volunteer/history', color: '#3b82f6' },
              { label: '👤 Edit Profile',         to: '/volunteer/profile', color: '#8b5cf6' },
            ].map(({ label, to, color }) => (
              <Link
                key={to}
                to={to}
                style={{
                  background: `${color}15`,
                  border: `1px solid ${color}33`,
                  color,
                  borderRadius: '10px',
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* ── Performance Summary ────────────────────────────────────────── */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '24px',
        }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '20px' }}>
            Performance Summary
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { label: 'Acceptance Rate',   value: stats?.acceptanceRate   ?? 0, color: '#3b82f6' },
              { label: 'Completion Rate',   value: stats?.completionRate   ?? 0, color: '#22c55e' },
              { label: 'Cancellation Rate', value: stats?.cancellationRate ?? 0, color: '#ef4444' },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{value}%</span>
                </div>
                <div style={{
                  height: '6px',
                  background: 'var(--border)',
                  borderRadius: '99px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${Math.min(value, 100)}%`,
                    height: '100%',
                    background: color,
                    borderRadius: '99px',
                    transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{
            display: 'flex',
            gap: '24px',
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border)',
            flexWrap: 'wrap',
          }}>
            {[
              { label: 'Assigned',    value: stats?.totalAssigned   ?? 0 },
              { label: 'Accepted',    value: stats?.totalAccepted   ?? 0 },
              { label: 'Completed',   value: stats?.totalCompleted  ?? 0 },
              { label: 'Cancelled',   value: stats?.totalCancelled  ?? 0 },
              { label: 'No Response', value: stats?.totalNoResponse ?? 0 },
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 700 }}>{value}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}