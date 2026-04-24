// src/pages/volunteer/MyHistory.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar.jsx';
import StatsCard from '../../components/dashboard/StatsCard.jsx';
import Badge from '../../components/common/Badge.jsx';
import Loader from '../../components/common/Loader.jsx';
import useAuth from '../../hooks/useAuth.js';
import { getVolunteerHistory } from '../../api/volunteer.api.js';
import {
  formatDate,
  formatDateTime,
  formatTimeAgo,
  formatDuration,
  formatEmergencyType,
  getEmergencyEmoji,
  getInitials,
} from '../../utils/formatters.js';

// ─── Expandable history row ───────────────────────────────────────────────────
function HistoryRow({ request }) {
  const [expanded, setExpanded] = useState(false);
  const requester = request.requesterId;

  return (
    <div
      className="card"
      style={{
        overflow: 'hidden',
        transition: 'box-shadow var(--t-base)',
        animation: 'fadeSlideUp var(--t-page) var(--ease) both',
      }}
    >
      {/* ── Collapsed header ──────────────────────────────────────────── */}
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
        {/* Left — icon + badges + meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background: request.status === 'completed'
                ? 'var(--green-100)'
                : 'var(--danger-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              flexShrink: 0,
            }}
          >
            {request.status === 'completed' ? '✅' : '❌'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <span style={{ fontSize: '14px' }}>{getEmergencyEmoji(request.emergencyType)}</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>
                {formatEmergencyType(request.emergencyType)}
              </span>
              <Badge urgency={request.urgencyLevel} />
              <Badge status={request.status} />
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {formatDateTime(request.createdAt)}
              {requester?.name && ` · ${requester.name}`}
            </div>
          </div>
        </div>

        {/* Right — resolution time + chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {request.resolutionTime && (
            <span
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                background: 'var(--stone-200)',
                borderRadius: 'var(--radius-full)',
                padding: '2px 10px',
                fontWeight: 600,
              }}
            >
              ⏱ {formatDuration(request.resolutionTime)}
            </span>
          )}
          <span
            style={{
              color: 'var(--text-muted)',
              fontSize: '14px',
              display: 'inline-block',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform var(--t-base)',
            }}
          >
            ▾
          </span>
        </div>
      </div>

      {/* ── Expanded details ──────────────────────────────────────────── */}
      {expanded && (
        <div
          style={{
            borderTop: '1px solid var(--stone-200)',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            animation: 'fadeSlideDown var(--t-base) var(--ease)',
          }}
        >
          {/* Description */}
          {request.description && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>
                Description
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-mid)', lineHeight: 1.6 }}>
                {request.description}
              </div>
            </div>
          )}

          {/* Detail grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '12px',
            }}
          >
            {[
              {
                icon: '📍',
                label: 'Location',
                value: request.address ||
                  (request.location?.city
                    ? `${request.location.city}${request.location.area ? ', ' + request.location.area : ''}`
                    : null),
              },
              { icon: '✅', label: 'Accepted At',  value: request.acceptedAt  ? formatDateTime(request.acceptedAt)  : null },
              { icon: '🎉', label: 'Completed At', value: request.completedAt ? formatDateTime(request.completedAt) : null },
              { icon: '⚡', label: 'Response Time', value: request.responseTime   ? formatDuration(request.responseTime)   : null },
              { icon: '⏱', label: 'Resolution',    value: request.resolutionTime ? formatDuration(request.resolutionTime) : null },
              { icon: '🩸', label: 'Blood Group',   value: request.bloodGroupNeeded || null },
            ].filter((item) => !!item.value).map((item) => (
              <div key={item.label}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '3px' }}>
                  {item.icon} {item.label}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-dark)', fontWeight: 500 }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {/* Requester info */}
          {requester && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                background: 'var(--green-50)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--green-100)',
              }}
            >
              <div className="avatar avatar-sm">
                {getInitials(requester.name)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>
                  {requester.name}
                </div>
                {requester.phone && (
                  <a
                    href={`tel:${requester.phone}`}
                    style={{ fontSize: '12px', color: 'var(--green-700)', textDecoration: 'none', fontWeight: 500 }}
                  >
                    📞 {requester.phone}
                  </a>
                )}
              </div>
              {requester.phone && (
                <a
                  href={`tel:${requester.phone}`}
                  className="btn btn-secondary btn-sm"
                  style={{ textDecoration: 'none' }}
                >
                  Call
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MyHistory ────────────────────────────────────────────────────────────────
const FILTERS = [
  { label: 'All',           value: 'all'         },
  { label: '✅ Completed',   value: 'completed'   },
  { label: '❌ Cancelled',   value: 'cancelled'   },
  { label: '🚀 In Progress', value: 'in_progress' },
];

export default function MyHistory() {
  const navigate = useNavigate();

  const [requests,   setRequests]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [filter,     setFilter]     = useState('all');
  const [pagination, setPagination] = useState(null);
  const [page,       setPage]       = useState(1);

  // ── Load history ───────────────────────────────────────────────────────────
  const load = useCallback(async (statusFilter, pageNum) => {
    setLoading(true);
    setError('');
    try {
      const params = { page: pageNum, limit: 10 };
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await getVolunteerHistory(params);
      setRequests(res.requests || []);
      setPagination(res.pagination || null);
    } catch {
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

  // ── Derived stats from current page ───────────────────────────────────────
  const completedCount = requests.filter((r) => r.status === 'completed').length;
  const cancelledCount = requests.filter((r) => r.status === 'cancelled').length;
  const timedRequests  = requests.filter((r) => r.resolutionTime);
  const avgTime        = timedRequests.length
    ? Math.round(timedRequests.reduce((s, r) => s + r.resolutionTime, 0) / timedRequests.length)
    : null;

  return (
    <Navbar title="Request History">
      <div className="page-wrapper">

        {/* ── Page header ───────────────────────────────────────────────── */}
        <div className="page-header">
          <h1>Request History 📋</h1>
          <p>All emergency requests you've handled as a volunteer.</p>
        </div>

        {/* ── Quick stats ───────────────────────────────────────────────── */}
        {!loading && requests.length > 0 && (
          <div className="grid-4" style={{ marginBottom: '28px' }}>
            <StatsCard
              label="Showing"
              value={requests.length}
              icon="📋"
              color="blue"
              delay={0}
            />
            <StatsCard
              label="Completed"
              value={completedCount}
              icon="✅"
              color="green"
              delay={100}
            />
            <StatsCard
              label="Cancelled"
              value={cancelledCount}
              icon="❌"
              color="red"
              delay={200}
            />
            <StatsCard
              label="Avg Resolution"
              value={avgTime ? `${avgTime}m` : '—'}
              icon="⏱"
              color="orange"
              format="raw"
              delay={300}
            />
          </div>
        )}

        {/* ── Main card ─────────────────────────────────────────────────── */}
        <div className="card anim-fade-up delay-100">
          <div className="card-header">

            {/* Status filter tabs */}
            <div className="tabs" style={{ marginBottom: 0 }}>
              {FILTERS.map(({ label, value }) => (
                <button
                  key={value}
                  className={`tab-btn${filter === value ? ' active' : ''}`}
                  onClick={() => handleFilterChange(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="card-body">

            {/* Error */}
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

            {/* Loading */}
            {loading && <Loader variant="skeleton" count={4} />}

            {/* Empty state */}
            {!loading && requests.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <h3>No requests found</h3>
                <p>
                  {filter === 'all'
                    ? "You haven't handled any requests yet."
                    : `No ${filter.replace('_', ' ')} requests found.`
                  }
                </p>
                {filter !== 'all' && (
                  <button
                    className="btn btn-primary"
                    onClick={() => handleFilterChange('all')}
                  >
                    View All
                  </button>
                )}
              </div>
            )}

            {/* History list */}
            {!loading && requests.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {requests.map((req) => (
                  <HistoryRow key={req._id} request={req} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && pagination && pagination.totalPages > 1 && (
              <div style={{ marginTop: '24px' }}>
                <div className="pagination">
                  <button
                    className="page-btn"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    ‹
                  </button>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter((p) => Math.abs(p - page) <= 2)
                    .map((p) => (
                      <button
                        key={p}
                        className={`page-btn${p === page ? ' active' : ''}`}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </button>
                    ))}
                  <button
                    className="page-btn"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  >
                    ›
                  </button>
                </div>

                {/* Page info */}
                <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Page {page} of {pagination.totalPages}
                  {pagination.total ? ` · ${pagination.total} total requests` : ''}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </Navbar>
  );
}