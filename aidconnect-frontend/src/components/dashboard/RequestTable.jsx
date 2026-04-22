// src/components/dashboard/RequestTable.jsx
import React, { useState } from 'react';
import Badge from '../common/Badge.jsx';
import {
  formatTimeAgo,
  formatEmergencyType,
  getEmergencyEmoji,
  formatStatus,
  formatUrgency,
  getUrgencyClass,
  getStatusClass,
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

      {/* Search */}
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

      {/* Emergency type filter */}
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

      {/* Urgency filter */}
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

      {/* Status filter */}
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

      {/* Reset */}
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

  // Build page numbers — always show first, last, current ± 1
  const pages = new Set([1, totalPages, page, page - 1, page + 1].filter(
    (p) => p >= 1 && p <= totalPages
  ));
  const pageArr = [...pages].sort((a, b) => a - b);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginTop: '16px',
      }}
    >
      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
        Showing {from}–{to} of {total} requests
      </span>
      <div className="pagination">
        {/* Prev */}
        <button
          className="page-btn"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          ‹
        </button>

        {pageArr.map((p, i) => {
          // Insert ellipsis gap
          const prev = pageArr[i - 1];
          return (
            <React.Fragment key={p}>
              {prev && p - prev > 1 && (
                <span
                  style={{
                    width: '36px',
                    textAlign: 'center',
                    fontSize: '13px',
                    color: 'var(--text-muted)',
                  }}
                >
                  …
                </span>
              )}
              <button
                className={`page-btn${p === page ? ' active' : ''}`}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            </React.Fragment>
          );
        })}

        {/* Next */}
        <button
          className="page-btn"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          ›
        </button>
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
/**
 * RequestTable — paginated, filterable table of help requests.
 * Used by ManageRequests (admin), MyRequests (user), MyHistory (volunteer).
 *
 * Props:
 *   requests     {array}    — array of HelpRequest objects
 *   pagination   {object}   — { page, limit, total, totalPages }
 *   loading      {boolean}  — shows skeleton rows
 *   onPageChange {fn}       — (newPage) => void
 *   filters      {object}   — current filter state { search, emergencyType, urgencyLevel, status }
 *   onFilterChange {fn}     — (key, value) => void
 *   onFilterReset  {fn}     — () => void
 *
 *   variant      'user' | 'volunteer' | 'admin'     default: 'admin'
 *
 *   Action props (all optional — only render when provided):
 *   onView       {fn}  — (request) => void   view detail
 *   onCancel     {fn}  — (requestId) => void  cancel request
 *   onDelete     {fn}  — (requestId) => void  delete request  [admin]
 *   actionLoading {boolean} — disables action buttons
 *
 *   showFilters  {boolean}  default: true
 *   showSearch   {boolean}  default: true
 *
 * Usage:
 *   // Admin — ManageRequests
 *   <RequestTable
 *     requests={requests} pagination={pagination} loading={loading}
 *     filters={filters} onFilterChange={handleFilter} onFilterReset={resetFilters}
 *     onPageChange={(p) => fetchAllRequests({ ...filters, page: p })}
 *     variant="admin" onView={openDetail} onCancel={handleCancel} onDelete={removeRequest}
 *     actionLoading={actionLoading}
 *   />
 *
 *   // User — MyRequests
 *   <RequestTable
 *     requests={requests} pagination={pagination} loading={loading}
 *     filters={filters} onFilterChange={handleFilter} onFilterReset={resetFilters}
 *     onPageChange={(p) => fetchMyRequests({ ...filters, page: p })}
 *     variant="user" onView={openDetail} onCancel={cancelMyRequest}
 *     actionLoading={actionLoading}
 *   />
 */
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
      {(isAdmin || isUser || isVolunteer) && (
        <td><div className="skeleton" style={{ height: '28px', width: '80px', borderRadius: 'var(--radius-sm)' }} /></td>
      )}
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

                return (
                  <tr
                    key={r._id}
                    style={{ cursor: onView ? 'pointer' : 'default' }}
                    onClick={onView ? () => onView(r) : undefined}
                  >
                    {/* Description */}
                    <td style={{ maxWidth: '220px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <span style={{ fontSize: '16px', flexShrink: 0 }}>
                          {getEmergencyEmoji(r.emergencyType)}
                        </span>
                        <span
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: '13px',
                            fontWeight: 500,
                            color: 'var(--text-dark)',
                          }}
                        >
                          {r.description}
                        </span>
                      </div>
                      {/* Disaster badge */}
                      {r.isDisasterMode && (
                        <span
                          className="badge badge-red"
                          style={{ fontSize: '9px', marginTop: '4px' }}
                        >
                          ⚠️ DISASTER
                        </span>
                      )}
                    </td>

                    {/* Emergency type */}
                    <td>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'var(--text-mid)',
                        }}
                      >
                        {formatEmergencyType(r.emergencyType)}
                      </span>
                    </td>

                    {/* Urgency */}
                    <td>
                      <Badge urgency={r.urgencyLevel} />
                    </td>

                    {/* Status */}
                    <td>
                      <Badge
                        status={r.status}
                        dot={r.status === 'in_progress'}
                        pulse={r.status === 'in_progress'}
                      />
                    </td>

                    {/* Location */}
                    <td>
                      <span
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-muted)',
                          maxWidth: '150px',
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {r.address || '—'}
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

                        {/* View detail */}
                        {typeof onView === 'function' && (
                          <button
                            className="btn btn-ghost btn-sm"
                            disabled={actionLoading}
                            onClick={() => onView(r)}
                          >
                            View
                          </button>
                        )}

                        {/* Cancel — user (own posted) or admin (any active) */}
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

                        {/* Delete — admin only */}
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
        <PaginationBar
          pagination={pagination}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}