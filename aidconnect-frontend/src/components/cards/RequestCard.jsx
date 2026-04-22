// src/components/cards/RequestCard.jsx
import React from 'react';
import {
  formatTimeAgo,
  formatEmergencyType,
  getEmergencyEmoji,
  formatUrgency,
  getUrgencyClass,
  formatStatus,
  getStatusClass,
} from '../../utils/formatters.js';

// ─── Emergency type → request-card stripe class (defined in index.css) ────────
function getCardTypeClass(emergencyType) {
  const map = {
    medical:  'medical',
    blood:    'blood',
    accident: 'accident',
    disaster: 'disaster',
    other:    'other',
  };
  return map[emergencyType] || 'other';
}

// ─── Single action button — stops propagation so card onClick doesn't fire ────
function ActionBtn({ label, icon, onClick, variant = 'primary', loading = false }) {
  const cls = {
    primary:   'btn btn-primary btn-sm',
    secondary: 'btn btn-secondary btn-sm',
    danger:    'btn btn-danger btn-sm',
    ghost:     'btn btn-ghost btn-sm',
  }[variant] || 'btn btn-primary btn-sm';

  return (
    <button
      className={cls}
      disabled={loading}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {loading
        ? <span className="spinner" />
        : <>{icon && <span>{icon}</span>} {label}</>
      }
    </button>
  );
}

// ─── RequestCard ──────────────────────────────────────────────────────────────
/**
 * RequestCard — displays a single help request across all role views.
 *
 * Props:
 *   request    {object}   — HelpRequest document from API
 *   onClick    {fn}       — (request) => void   makes card clickable [optional]
 *   loading    {boolean}  — disables action buttons during API calls
 *   variant    'user' | 'volunteer' | 'admin'
 *
 * variant='user'
 *   onCancel   {fn}  — (requestId) => void   shown when status === 'posted'
 *   onRate     {fn}  — (request)   => void   shown when status === 'completed'
 *
 * variant='volunteer'
 *   onAccept   {fn}  — (requestId) => void   shown when status === 'posted'
 *
 * variant='admin'
 *   onCancel   {fn}  — (requestId) => void   shown for active requests
 *   onDelete   {fn}  — (requestId) => void   always shown
 *
 * Usage:
 *   // User — My Requests list
 *   <RequestCard request={r} variant="user" onCancel={cancelMyRequest} onRate={openRating} />
 *
 *   // Volunteer — Nearby Requests feed
 *   <RequestCard request={r} variant="volunteer" onAccept={acceptNearbyRequest} />
 *
 *   // Admin — Manage Requests table alternative
 *   <RequestCard request={r} variant="admin" onCancel={handleCancel} onDelete={removeRequest} />
 */
export default function RequestCard({
  request,
  onClick,
  loading = false,
  variant = 'user',
  onCancel,
  onRate,
  onAccept,
  onDelete,
}) {
  if (!request) return null;

  const {
    _id,
    emergencyType,
    urgencyLevel,
    description,
    status,
    location,
    address,
    bloodGroupNeeded,
    postedAt,
    assignedTo,
    isDisasterMode,
  } = request;

  const isClickable   = typeof onClick === 'function';
  const typeClass     = getCardTypeClass(emergencyType);
  const isActive      = ['posted', 'accepted', 'in_progress'].includes(status);

  return (
    <div
      className={`request-card ${typeClass}`}
      onClick={isClickable ? () => onClick(request) : undefined}
      style={{ cursor: isClickable ? 'pointer' : 'default' }}
    >
      {/* ── Header: type label + badges ─────────────────────────────────── */}
      <div className="request-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>{getEmergencyEmoji(emergencyType)}</span>
          <span className="request-card-type">
            {formatEmergencyType(emergencyType)}
          </span>
          {isDisasterMode && (
            <span className="badge badge-red" style={{ fontSize: '9px' }}>
              ⚠️ DISASTER
            </span>
          )}
        </div>

        {/* Urgency + Status badges */}
        <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
          <span className={`badge ${getUrgencyClass(urgencyLevel)}`}>
            {formatUrgency(urgencyLevel)}
          </span>
          <span className={`badge ${getStatusClass(status)}`}>
            {status === 'in_progress' && (
              <span className="status-dot dot-orange pulse" />
            )}
            {formatStatus(status)}
          </span>
        </div>
      </div>

      {/* ── Description ─────────────────────────────────────────────────── */}
      <p className="request-card-desc">{description}</p>

      {/* ── Blood group needed (blood requests only) ─────────────────────── */}
      {emergencyType === 'blood' && bloodGroupNeeded && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            background: 'var(--danger-bg)',
            border: '1px solid #f5c6c2',
            borderRadius: 'var(--radius-full)',
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--danger)',
            marginBottom: '12px',
          }}
        >
          🩸 Blood needed: {bloodGroupNeeded}
        </div>
      )}

      {/* ── Footer: meta + actions ───────────────────────────────────────── */}
      <div className="request-card-footer">

        {/* Meta: location + time */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {address && (
            <div className="request-card-meta">
              <span>📍</span>
              <span
                style={{
                  maxWidth: '200px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {address}
              </span>
            </div>
          )}
          <div className="request-card-meta">
            <span>🕐</span>
            <span>{formatTimeAgo(postedAt)}</span>
          </div>
        </div>

        {/* Role-specific action buttons */}
        <div style={{ display: 'flex', gap: '7px', flexShrink: 0 }}>

          {/* USER: cancel posted request */}
          {variant === 'user' && status === 'posted' && typeof onCancel === 'function' && (
            <ActionBtn
              label="Cancel"
              icon="✕"
              variant="ghost"
              loading={loading}
              onClick={() => onCancel(_id)}
            />
          )}

          {/* USER: rate completed request */}
          {variant === 'user' && status === 'completed' && typeof onRate === 'function' && (
            <ActionBtn
              label="Rate"
              icon="⭐"
              variant="secondary"
              loading={loading}
              onClick={() => onRate(request)}
            />
          )}

          {/* VOLUNTEER: accept posted request */}
          {variant === 'volunteer' && status === 'posted' && typeof onAccept === 'function' && (
            <ActionBtn
              label="Accept"
              icon="✓"
              variant="primary"
              loading={loading}
              onClick={() => onAccept(_id)}
            />
          )}

          {/* ADMIN: cancel active request */}
          {variant === 'admin' && isActive && typeof onCancel === 'function' && (
            <ActionBtn
              label="Cancel"
              icon="✕"
              variant="ghost"
              loading={loading}
              onClick={() => onCancel(_id)}
            />
          )}

          {/* ADMIN: delete request */}
          {variant === 'admin' && typeof onDelete === 'function' && (
            <ActionBtn
              label="Delete"
              icon="🗑"
              variant="danger"
              loading={loading}
              onClick={() => onDelete(_id)}
            />
          )}
        </div>
      </div>
    </div>
  );
}