import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { getVolunteerHistory } from '../../api/volunteer.api.js';

// ─── Badges ───────────────────────────────────────────────────────────────────
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
      borderRadius: '20px',
      padding: '3px 12px',
      fontSize: '12px',
      fontWeight: 600,
      whiteSpace: 'nowrap',
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
      background: `${color}18`,
      color,
      border: `1px solid ${color}44`,
      borderRadius: '6px',
      padding: '2px 10px',
      fontSize: '12px',
      fontWeight: 600,
      textTransform: 'capitalize',
      whiteSpace: 'nowrap',
    }}>
      {type?.replace(/_/g, ' ')}
    </span>
  );
};

const UrgencyDot = ({ level }) => {
  const map = {
    critical: '#ef4444',
    high:     '#f97316',
    medium:   '#f59e0b',
    low:      '#22c55e',
  };
  return (
    <span style={{
      display: 'inline-block',
      width: '8px', height: '8px',
      borderRadius: '50%',
      background: map[level] || map.low,
      marginRight: '6px',
      flexShrink: 0,
    }} />
  );
};

// ─── Filter Button ────────────────────────────────────────────────────────────
const FilterBtn = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      background: active ? 'var(--accent)' : 'var(--surface)',
      color: active ? '#fff' : 'var(--text-muted)',
      border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: '20px',
      padding: '6px 16px',
      fontSize: '13px',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.15s',
      whiteSpace: 'nowrap',
    }}
  >
    {label}
  </button>
);

// ─── Request Card ─────────────────────────────────────────────────────────────
const RequestCard = ({ request }) => {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-PK', {
      day:   'numeric',
      month: 'short',
      year:  'numeric',
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('en-PK', {
      hour:   '2-digit',
      minute: '2-digit',
    });
  };

  const requester = request.requesterId;

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      overflow: 'hidden',
      transition: 'border-color 0.15s',
    }}>
      {/* ── Card Header ──────────────────────────────────────────────── */}
      <div
        style={{
          padding: '16px 20px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
        onClick={() => setExpanded((p) => !p)}
      >
        {/* Left side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
          <div style={{
            width: '40px', height: '40px',
            borderRadius: '10px',
            background: request.status === 'completed' ? '#22c55e22' : '#ef444422',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', flexShrink: 0,
          }}>
            {request.status === 'completed' ? '✅' : '❌'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              flexWrap: 'wrap', marginBottom: '4px',
            }}>
              <UrgencyDot level={request.urgencyLevel} />
              <EmergencyBadge type={request.emergencyType} />
              <StatusBadge    status={request.status} />
            </div>
            <div style={{
              fontSize: '13px', color: 'var(--text-muted)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {formatDate(request.createdAt)} · {formatTime(request.createdAt)}
              {requester?.name && ` · ${requester.name}`}
            </div>
          </div>
        </div>

        {/* Right side */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0,
        }}>
          {request.resolutionTime && (
            <span style={{
              fontSize: '12px', color: 'var(--text-muted)',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              padding: '2px 10px',
            }}>
              ⏱ {request.resolutionTime}m
            </span>
          )}
          <span style={{
            color: 'var(--text-muted)', fontSize: '16px',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s',
            display: 'inline-block',
          }}>
            ▾
          </span>
        </div>
      </div>

      {/* ── Expanded Details ─────────────────────────────────────────── */}
      {expanded && (
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '16px 20px',
          display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
          {/* Description */}
          {request.description && (
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Description
              </div>
              <div style={{ fontSize: '14px', lineHeight: 1.5 }}>
                {request.description}
              </div>
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '12px',
            marginTop: '4px',
          }}>
            {/* Location */}
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                📍 Location
              </div>
              <div style={{ fontSize: '13px', fontWeight: 500 }}>
                {request.address ||
                  (request.location?.city
                    ? `${request.location.city}${request.location.area ? ', ' + request.location.area : ''}`
                    : '—')}
              </div>
            </div>

            {/* Accepted at */}
            {request.acceptedAt && (
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  ✅ Accepted At
                </div>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>
                  {formatDate(request.acceptedAt)} {formatTime(request.acceptedAt)}
                </div>
              </div>
            )}

            {/* Completed at */}
            {request.completedAt && (
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  🎉 Completed At
                </div>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>
                  {formatDate(request.completedAt)} {formatTime(request.completedAt)}
                </div>
              </div>
            )}

            {/* Response time */}
            {request.responseTime !== undefined && (
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  ⚡ Response Time
                </div>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>
                  {request.responseTime} min
                </div>
              </div>
            )}

            {/* Blood group */}
            {request.bloodGroupNeeded && (
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  🩸 Blood Group
                </div>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>
                  {request.bloodGroupNeeded}
                </div>
              </div>
            )}
          </div>

          {/* Requester info */}
          {requester && (
            <div style={{
              marginTop: '8px',
              padding: '12px 16px',
              background: 'var(--bg)',
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '13px', color: '#fff', flexShrink: 0,
              }}>
                {requester.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>
                  {requester.name}
                </div>
                {requester.phone && (
                  <a href={`tel:${requester.phone}`} style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none' }}>
                    {requester.phone}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MyHistory() {
  const { user } = useAuth();

  const [requests,    setRequests]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [filter,      setFilter]      = useState('all');
  const [pagination,  setPagination]  = useState(null);
  const [page,        setPage]        = useState(1);

  const FILTERS = [
    { label: 'All',         value: 'all'         },
    { label: '✅ Completed', value: 'completed'   },
    { label: '❌ Cancelled', value: 'cancelled'   },
    { label: '🚀 In Progress',value: 'in_progress'},
  ];

  const load = useCallback(async (statusFilter, pageNum) => {
    setLoading(true);
    setError('');
    try {
      const params = { page: pageNum, limit: 10 };
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await getVolunteerHistory(params);
      setRequests(res.requests || []);
      setPagination(res.pagination || null);
    } catch (err) {
      setError('Failed to load history. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(filter, page);
  }, [filter, page, load]);

  const handleFilterChange = (val) => {
    setFilter(val);
    setPage(1);
  };

  // ── Summary counts ─────────────────────────────────────────────────────────
  const completed = requests.filter((r) => r.status === 'completed').length;
  const cancelled = requests.filter((r) => r.status === 'cancelled').length;
  const avgTime   = (() => {
    const timed = requests.filter((r) => r.resolutionTime);
    if (!timed.length) return null;
    return Math.round(timed.reduce((s, r) => s + r.resolutionTime, 0) / timed.length);
  })();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>

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
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px' }}>
            Request History
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
            All emergency requests you've handled
          </p>
        </div>

        {/* ── Quick Stats ───────────────────────────────────────────── */}
        {!loading && requests.length > 0 && (
          <div style={{
            display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px',
          }}>
            {[
              { label: 'Showing',    value: requests.length,          color: 'var(--text)' },
              { label: 'Completed',  value: completed,                color: '#22c55e'     },
              { label: 'Cancelled',  value: cancelled,                color: '#ef4444'     },
              { label: 'Avg Time',   value: avgTime ? `${avgTime}m` : '—', color: '#f59e0b' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '12px 20px',
                flex: '1', minWidth: '100px',
              }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color }}>{value}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Filters ───────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px',
        }}>
          {FILTERS.map(({ label, value }) => (
            <FilterBtn
              key={value}
              label={label}
              active={filter === value}
              onClick={() => handleFilterChange(value)}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-danger" style={{ borderRadius: '10px', marginBottom: '20px' }}>
            ⚠️ {error}
          </div>
        )}

        {/* ── List ──────────────────────────────────────────────────── */}
        {loading ? (
          <div style={{
            display: 'flex', justifyContent: 'center',
            padding: '60px 0',
          }}>
            <div className="spinner-border text-danger" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : requests.length === 0 ? (
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '60px 40px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>
              No requests found
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '0 0 24px' }}>
              {filter === 'all'
                ? "You haven't handled any requests yet."
                : `No ${filter.replace('_', ' ')} requests found.`}
            </p>
            {filter !== 'all' && (
              <button
                onClick={() => handleFilterChange('all')}
                style={{
                  background: 'var(--accent)',
                  color: '#fff', border: 'none',
                  borderRadius: '8px', padding: '10px 24px',
                  fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                }}
              >
                View All
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {requests.map((req) => (
              <RequestCard key={req._id} request={req} />
            ))}
          </div>
        )}

        {/* ── Pagination ────────────────────────────────────────────── */}
        {pagination && pagination.totalPages > 1 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '28px',
          }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '8px 16px',
                color: page === 1 ? 'var(--text-muted)' : 'var(--text)',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                fontSize: '14px', fontWeight: 600,
                opacity: page === 1 ? 0.5 : 1,
              }}
            >
              ← Prev
            </button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter((p) => Math.abs(p - page) <= 2)
              .map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    background: p === page ? 'var(--accent)' : 'var(--surface)',
                    color: p === page ? '#fff' : 'var(--text)',
                    border: `1px solid ${p === page ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '14px', fontWeight: 600,
                    cursor: 'pointer',
                    minWidth: '40px',
                  }}
                >
                  {p}
                </button>
              ))}

            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '8px 16px',
                color: page === pagination.totalPages ? 'var(--text-muted)' : 'var(--text)',
                cursor: page === pagination.totalPages ? 'not-allowed' : 'pointer',
                fontSize: '14px', fontWeight: 600,
                opacity: page === pagination.totalPages ? 0.5 : 1,
              }}
            >
              Next →
            </button>
          </div>
        )}

        {/* Total count */}
        {pagination && (
          <div style={{
            textAlign: 'center',
            marginTop: '12px',
            fontSize: '13px',
            color: 'var(--text-muted)',
          }}>
            Page {page} of {pagination.totalPages} · {pagination.totalRequests} total requests
          </div>
        )}

      </div>
    </div>
  );
}
