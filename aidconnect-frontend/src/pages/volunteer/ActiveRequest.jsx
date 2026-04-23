import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import {
  getActiveRequest,
  markInProgress,
  completeRequest,
  cancelRequest,
} from '../../api/volunteer.api.js';

// ─── Reusable Badges ─────────────────────────────────────────────────────────
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
      padding: '3px 12px',
      fontSize: '13px',
      fontWeight: 600,
      textTransform: 'capitalize',
    }}>
      {type?.replace(/_/g, ' ')}
    </span>
  );
};

const UrgencyBadge = ({ level }) => {
  const map = {
    critical: { color: '#ef4444', bg: '#ef444420', label: '🔴 Critical' },
    high:     { color: '#f97316', bg: '#f9731620', label: '🟠 High'     },
    medium:   { color: '#f59e0b', bg: '#f59e0b20', label: '🟡 Medium'   },
    low:      { color: '#22c55e', bg: '#22c55e20', label: '🟢 Low'      },
  };
  const { color, bg, label } = map[level] || map.low;
  return (
    <span style={{
      background: bg,
      color,
      border: `1px solid ${color}44`,
      borderRadius: '6px',
      padding: '3px 12px',
      fontSize: '13px',
      fontWeight: 600,
    }}>
      {label}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    posted:      { color: '#6b7280', label: 'Posted'      },
    accepted:    { color: '#3b82f6', label: 'Accepted'    },
    in_progress: { color: '#f59e0b', label: 'In Progress' },
    completed:   { color: '#22c55e', label: 'Completed'   },
    cancelled:   { color: '#ef4444', label: 'Cancelled'   },
  };
  const { color, label } = map[status] || map.posted;
  return (
    <span style={{
      background: `${color}22`,
      color,
      border: `1px solid ${color}44`,
      borderRadius: '6px',
      padding: '3px 12px',
      fontSize: '13px',
      fontWeight: 600,
    }}>
      {label}
    </span>
  );
};

// ─── Info Row ─────────────────────────────────────────────────────────────────
const InfoRow = ({ icon, label, value }) => (
  <div style={{
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '14px 0',
    borderBottom: '1px solid var(--border)',
  }}>
    <span style={{ fontSize: '18px', marginTop: '1px' }}>{icon}</span>
    <div>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>
        {label}
      </div>
      <div style={{ fontSize: '14px', fontWeight: 500 }}>{value || '—'}</div>
    </div>
  </div>
);

// ─── Timeline Step ────────────────────────────────────────────────────────────
const TimelineStep = ({ icon, label, done, active }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
  }}>
    <div style={{
      width: '36px', height: '36px',
      borderRadius: '50%',
      background: done
        ? '#22c55e'
        : active
          ? 'var(--accent)'
          : 'var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '16px',
      transition: 'background 0.3s',
      boxShadow: active ? '0 0 12px var(--accent)66' : 'none',
    }}>
      {icon}
    </div>
    <div style={{
      fontSize: '11px',
      marginTop: '6px',
      color: done || active ? 'var(--text)' : 'var(--text-muted)',
      fontWeight: done || active ? 600 : 400,
      textAlign: 'center',
    }}>
      {label}
    </div>
  </div>
);

// ─── Cancel Modal ─────────────────────────────────────────────────────────────
const CancelModal = ({ onConfirm, onClose, loading }) => {
  const [reason, setReason] = useState('');
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '32px',
        width: '100%',
        maxWidth: '440px',
      }}>
        <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700 }}>
          Cancel Request?
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '0 0 20px' }}>
          This will re-post the request so another volunteer can pick it up.
          Your cancellation rate will be affected.
        </p>
        <textarea
          placeholder="Reason for cancelling (optional)..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          style={{
            width: '100%',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '10px 14px',
            color: 'var(--text)',
            fontSize: '14px',
            resize: 'vertical',
            marginBottom: '20px',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1,
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '10px',
              color: 'var(--text)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Keep Request
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading}
            style={{
              flex: 1,
              background: '#ef444422',
              border: '1px solid #ef444455',
              borderRadius: '8px',
              padding: '10px',
              color: '#ef4444',
              fontSize: '14px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Cancelling...' : 'Yes, Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ActiveRequest() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [request,      setRequest]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [actionLoading,setActionLoading]= useState('');
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState('');
  const [showCancel,   setShowCancel]   = useState(false);

  const loadRequest = useCallback(async () => {
    try {
      const res = await getActiveRequest();
      setRequest(res.activeRequest);
    } catch (err) {
      setError('Failed to load active request.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRequest(); }, [loadRequest]);

  // ── Auto-refresh every 30s ─────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(loadRequest, 30000);
    return () => clearInterval(interval);
  }, [loadRequest]);

  const handleMarkInProgress = async () => {
    setActionLoading('progress');
    setError('');
    try {
      const res = await markInProgress(request._id);
      setRequest(res.request);
      setSuccess('Request marked as in progress!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed.');
    } finally {
      setActionLoading('');
    }
  };

  const handleComplete = async () => {
    setActionLoading('complete');
    setError('');
    try {
      await completeRequest(request._id);
      setSuccess('Request completed! Great work 🎉');
      setTimeout(() => {
        navigate('/volunteer');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed.');
    } finally {
      setActionLoading('');
    }
  };

  const handleCancel = async (reason) => {
    setActionLoading('cancel');
    setError('');
    try {
      await cancelRequest(request._id, reason);
      setShowCancel(false);
      setSuccess('Request cancelled and re-posted.');
      setTimeout(() => navigate('/volunteer'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed.');
    } finally {
      setActionLoading('');
    }
  };

  // ── Timeline helper ────────────────────────────────────────────────────────
  const getTimelineState = (status) => ({
    acceptedDone:    ['accepted', 'in_progress', 'completed'].includes(status),
    acceptedActive:  status === 'accepted',
    progressDone:    ['in_progress', 'completed'].includes(status),
    progressActive:  status === 'in_progress',
    completedDone:   status === 'completed',
    completedActive: status === 'completed',
  });

  // ── Format time elapsed ────────────────────────────────────────────────────
  const timeElapsed = (dateStr) => {
    if (!dateStr) return '—';
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 60000);
    if (diff < 1)  return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ${diff % 60}m ago`;
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

  const tl = request ? getTimelineState(request.status) : null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>

      {/* ── Cancel Modal ───────────────────────────────────────────────── */}
      {showCancel && (
        <CancelModal
          onConfirm={handleCancel}
          onClose={() => setShowCancel(false)}
          loading={actionLoading === 'cancel'}
        />
      )}

      {/* ── Top Bar ───────────────────────────────────────────────────── */}
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

      {/* ── Content ───────────────────────────────────────────────────── */}
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px' }}>
            Active Request
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
            Manage your currently assigned emergency request
          </p>
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

        {/* No active request */}
        {!request ? (
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '60px 40px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🟢</div>
            <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>
              No Active Request
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
              You're not assigned to any request right now.
              Make sure you're marked as available to receive new assignments.
            </p>
            <Link
              to="/volunteer"
              style={{
                background: 'var(--accent)',
                color: '#fff',
                borderRadius: '8px',
                padding: '10px 24px',
                fontWeight: 600,
                fontSize: '14px',
                textDecoration: 'none',
              }}
            >
              Back to Dashboard
            </Link>
          </div>
        ) : (
          <>
            {/* ── Status Timeline ─────────────────────────────────────── */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '20px',
            }}>
              <div style={{
                fontSize: '13px',
                color: 'var(--text-muted)',
                marginBottom: '20px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Request Progress
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
                {/* Connector line */}
                <div style={{
                  position: 'absolute',
                  top: '18px',
                  left: '10%',
                  right: '10%',
                  height: '2px',
                  background: 'var(--border)',
                  zIndex: 0,
                }} />
                <TimelineStep
                  icon="✅"
                  label="Accepted"
                  done={tl.acceptedDone}
                  active={tl.acceptedActive}
                />
                <TimelineStep
                  icon="🚀"
                  label="In Progress"
                  done={tl.progressDone}
                  active={tl.progressActive}
                />
                <TimelineStep
                  icon="🎉"
                  label="Completed"
                  done={tl.completedDone}
                  active={tl.completedActive}
                />
              </div>
            </div>

            {/* ── Request Details ──────────────────────────────────────── */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '20px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '10px',
              }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                  Request Details
                </h2>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <EmergencyBadge type={request.emergencyType} />
                  <UrgencyBadge   level={request.urgencyLevel} />
                  <StatusBadge    status={request.status} />
                </div>
              </div>

              <InfoRow icon="📝" label="Description"   value={request.description} />
              <InfoRow icon="📍" label="Location"
                value={
                  request.address ||
                  (request.location?.city
                    ? `${request.location.city}${request.location.area ? ', ' + request.location.area : ''}`
                    : 'Location not specified')
                }
              />
              <InfoRow icon="⏰" label="Posted"         value={timeElapsed(request.postedAt || request.createdAt)} />
              <InfoRow icon="✅" label="Accepted"        value={timeElapsed(request.acceptedAt)} />
              {request.bloodGroupNeeded && (
                <InfoRow icon="🩸" label="Blood Group Needed" value={request.bloodGroupNeeded} />
              )}
            </div>

            {/* ── Requester Contact ────────────────────────────────────── */}
            {request.requesterId && (
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '20px',
              }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
                  Requester Contact
                </h2>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}>
                  <div style={{
                    width: '48px', height: '48px',
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '18px', color: '#fff',
                    flexShrink: 0,
                  }}>
                    {request.requesterId.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '16px' }}>
                      {request.requesterId.name || 'Unknown'}
                    </div>
                    {request.requesterId.phone && (
                      <a
                        href={`tel:${request.requesterId.phone}`}
                        style={{
                          color: 'var(--accent)',
                          fontSize: '14px',
                          textDecoration: 'none',
                          fontWeight: 500,
                        }}
                      >
                        📞 {request.requesterId.phone}
                      </a>
                    )}
                  </div>
                  {request.requesterId.phone && (
                    <a
                      href={`tel:${request.requesterId.phone}`}
                      style={{
                        background: '#22c55e22',
                        color: '#22c55e',
                        border: '1px solid #22c55e44',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontSize: '14px',
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      📞 Call Now
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* ── Action Buttons ───────────────────────────────────────── */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '24px',
            }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
                Update Status
              </h2>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>

                {/* Mark In Progress */}
                {request.status === 'accepted' && (
                  <button
                    onClick={handleMarkInProgress}
                    disabled={!!actionLoading}
                    style={{
                      flex: 1, minWidth: '160px',
                      background: '#f59e0b22',
                      color: '#f59e0b',
                      border: '1px solid #f59e0b44',
                      borderRadius: '8px',
                      padding: '12px 20px',
                      fontSize: '14px', fontWeight: 600,
                      cursor: actionLoading ? 'not-allowed' : 'pointer',
                      opacity: actionLoading === 'progress' ? 0.7 : 1,
                    }}
                  >
                    {actionLoading === 'progress' ? '...' : '🚀 Mark In Progress'}
                  </button>
                )}

                {/* Complete */}
                {['accepted', 'in_progress'].includes(request.status) && (
                  <button
                    onClick={handleComplete}
                    disabled={!!actionLoading}
                    style={{
                      flex: 1, minWidth: '160px',
                      background: '#22c55e22',
                      color: '#22c55e',
                      border: '1px solid #22c55e44',
                      borderRadius: '8px',
                      padding: '12px 20px',
                      fontSize: '14px', fontWeight: 600,
                      cursor: actionLoading ? 'not-allowed' : 'pointer',
                      opacity: actionLoading === 'complete' ? 0.7 : 1,
                    }}
                  >
                    {actionLoading === 'complete' ? '...' : '✅ Mark Completed'}
                  </button>
                )}

                {/* Cancel */}
                {['accepted', 'in_progress'].includes(request.status) && (
                  <button
                    onClick={() => setShowCancel(true)}
                    disabled={!!actionLoading}
                    style={{
                      minWidth: '120px',
                      background: '#ef444415',
                      color: '#ef4444',
                      border: '1px solid #ef444433',
                      borderRadius: '8px',
                      padding: '12px 20px',
                      fontSize: '14px', fontWeight: 600,
                      cursor: actionLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    ✕ Cancel
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
