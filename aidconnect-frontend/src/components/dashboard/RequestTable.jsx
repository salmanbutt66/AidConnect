// src/components/dashboard/RequestTable.jsx
import React, { useState } from 'react';
import Badge from '../common/Badge.jsx';
import {
  formatTimeAgo,
  formatEmergencyType,
  getEmergencyEmoji,
} from '../../utils/formatters.js';
import {
  EMERGENCY_TYPES,
  URGENCY_LEVELS,
  REQUEST_STATUSES,
} from '../../utils/constants.js';

// ─── Filter bar ───────────────────────────────────────────────────────────────
function FilterBar({ filters, onChange, onReset, showSearch = true }) {
  return (
    <div className="filter-bar">

      {showSearch && (
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="form-input search-input"
            placeholder="Search by description or address…"
            value={filters.search || ''}
            onChange={(e) => onChange('search', e.target.value)}
          />
        </div>
      )}

      <select
        className="form-select"
        style={{ width: 'auto', minWidth: '140px' }}
        value={filters.emergencyType || ''}
        onChange={(e) => onChange('emergencyType', e.target.value)}
      >
        <option value="">All Types</option>
        {EMERGENCY_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.emoji} {t.label}
          </option>
        ))}
      </select>

      <select
        className="form-select"
        style={{ width: 'auto', minWidth: '130px' }}
        value={filters.urgencyLevel || ''}
        onChange={(e) => onChange('urgencyLevel', e.target.value)}
      >
        <option value="">All Urgency</option>
        {URGENCY_LEVELS.map((u) => (
          <option key={u.value} value={u.value}>
            {u.label}
          </option>
        ))}
      </select>

      <select
        className="form-select"
        style={{ width: 'auto', minWidth: '130px' }}
        value={filters.status || ''}
        onChange={(e) => onChange('status', e.target.value)}
      >
        <option value="">All Status</option>
        {REQUEST_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      {(filters.search || filters.emergencyType || filters.urgencyLevel || filters.status) && (
        <button className="btn btn-ghost btn-sm" onClick={onReset}>
          ✕ Clear
        </button>
      )}
    </div>
  );
}

// ─── Pagination bar ───────────────────────────────────────────────────────────
function PaginationBar({ pagination, onPageChange }) {
  const { page, totalPages, total, limit } = pagination;
  if (totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to   = Math.min(page * limit, total);

  const pages = new Set(
    [1, totalPages, page, page - 1, page + 1].filter(
      (p) => p >= 1 && p <= totalPages
    )
  );
  const pageArr = [...pages].sort((a, b) => a - b);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
        Showing {from}–{to} of {total} requests
      </span>
      <div className="pagination">
        <button className="page-btn" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page">‹</button>
        {pageArr.map((p, i) => {
          const prev = pageArr[i - 1];
          return (
            <React.Fragment key={p}>
              {prev && p - prev > 1 && (
                <span style={{ width: '36px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>…</span>
              )}
              <button className={`page-btn${p === page ? ' active' : ''}`} onClick={() => onPageChange(p)}>
                {p}
              </button>
            </React.Fragment>
          );
        })}
        <button className="page-btn" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Next page">›</button>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ filtered }) {
  return (
    <div className="empty-state" style={{ padding: '48px 24px' }}>
      <div className="empty-state-icon">{filtered ? '🔍' : '📋'}</div>
      <h3>{filtered ? 'No matching requests' : 'No requests yet'}</h3>
      <p>
        {filtered
          ? 'Try adjusting your filters or clearing the search.'
          : 'Requests will appear here once they are posted.'}
      </p>
    </div>
  );
}

// ─── RequestTable ─────────────────────────────────────────────────────────────
export default function RequestTable({
  requests      = [],
  pagination    = { page: 1, limit: 10, total: 0, totalPages: 1 },
  loading       = false,
  onPageChange,
  filters       = {},
  onFilterChange,
  onFilterReset,
  variant       = 'admin',
  onView,
  onCancel,
  onDelete,
  actionLoading = false,
  showFilters   = true,
  showSearch    = true,
}) {
  const isFiltered = !!(
    filters.search || filters.emergencyType ||
    filters.urgencyLevel || filters.status
  );

  const isAdmin     = variant === 'admin';
  const isUser      = variant === 'user';
  const isVolunteer = variant === 'volunteer';

  // ── Skeleton rows ──────────────────────────────────────────────────────────
  const skeletonRows = Array.from({ length: 5 }).map((_, i) => (
    <tr key={`sk-${i}`}>
      <td><div className="skeleton" style={{ height: '13px', width: '80%' }} /></td>
      <td><div className="skeleton" style={{ height: '20px', width: '72px', borderRadius: 'var(--radius-full)' }} /></td>
      <td><div className="skeleton" style={{ height: '20px', width: '64px', borderRadius: 'var(--radius-full)' }} /></td>
      <td><div className="skeleton" style={{ height: '20px', width: '80px', borderRadius: 'var(--radius-full)' }} /></td>
      <td><div className="skeleton" style={{ height: '13px', width: '60%' }} /></td>
      <td><div className="skeleton" style={{ height: '13px', width: '50%' }} /></td>
      <td><div className="skeleton" style={{ height: '28px', width: '80px', borderRadius: 'var(--radius-sm)' }} /></td>
    </tr>
  ));

  return (
    <div>
      {/* ── Filters ───────────────────────────────────────────────────────── */}
      {showFilters && onFilterChange && (
        <FilterBar
          filters={filters}
          onChange={onFilterChange}
          onReset={onFilterReset}
          showSearch={showSearch}
        />
      )}

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Type</th>
              <th>Urgency</th>
              <th>Status</th>
              <th>Location</th>
              <th>Posted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              skeletonRows
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 0, border: 'none' }}>
                  <EmptyState filtered={isFiltered} />
                </td>
              </tr>
            ) : (
              requests.map((r) => {
                const isActive = ['posted', 'accepted', 'in_progress'].includes(r.status);

                // FIX: show city as fallback when address is missing.
                // r.city is the top-level field always present on HelpRequest.
                // Previously showed '—' whenever address was null, even though
                // city was always available.
                const locationText =
                  [r.city, r.address].filter(Boolean).join(' · ') || '—';

                return (
                  <tr
                    key={r._id}
                    style={{ cursor: onView ? 'pointer' : 'default' }}
                    onClick={onView ? () => onView(r) : undefined}
                  >
                    {/* Description */}
                    <td style={{ maxWidth: '220px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px', flexShrink: 0 }}>
                          {getEmergencyEmoji(r.emergencyType)}
                        </span>
                        <span style={{
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap', fontSize: '13px',
                          fontWeight: 500, color: 'var(--text-dark)',
                        }}>
                          {r.description}
                        </span>
                      </div>
                      {r.isDisasterMode && (
                        <span className="badge badge-red" style={{ fontSize: '9px', marginTop: '4px' }}>
                          ⚠️ DISASTER
                        </span>
                      )}
                    </td>

                    {/* Emergency type */}
                    <td>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-mid)' }}>
                        {formatEmergencyType(r.emergencyType)}
                      </span>
                    </td>

                    {/* Urgency */}
                    <td><Badge urgency={r.urgencyLevel} /></td>

                    {/* Status */}
                    <td>
                      <Badge
                        status={r.status}
                        dot={r.status === 'in_progress'}
                        pulse={r.status === 'in_progress'}
                      />
                    </td>

                    {/* Location — FIX: city · address fallback chain */}
                    <td>
                      <span style={{
                        fontSize: '12px', color: 'var(--text-muted)',
                        maxWidth: '150px', display: 'block',
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {locationText}
                      </span>
                    </td>

                    {/* Posted time */}
                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {formatTimeAgo(r.postedAt)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>

                        {typeof onView === 'function' && (
                          <button
                            className="btn btn-ghost btn-sm"
                            disabled={actionLoading}
                            onClick={() => onView(r)}
                          >
                            View
                          </button>
                        )}

                        {typeof onCancel === 'function' &&
                          ((isUser && r.status === 'posted') ||
                           (isAdmin && isActive)) && (
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--warning)', borderColor: 'var(--warning)' }}
                            disabled={actionLoading}
                            onClick={() => onCancel(r._id)}
                          >
                            {actionLoading ? <span className="spinner" /> : 'Cancel'}
                          </button>
                        )}

                        {isAdmin && typeof onDelete === 'function' && (
                          <button
                            className="btn btn-danger btn-sm"
                            disabled={actionLoading}
                            onClick={() => onDelete(r._id)}
                          >
                            {actionLoading ? <span className="spinner" /> : '🗑'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      {!loading && requests.length > 0 && (
        <PaginationBar pagination={pagination} onPageChange={onPageChange} />
      )}
    </div>
  );
}