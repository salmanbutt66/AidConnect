// src/components/cards/VolunteerCard.jsx
import React from 'react';
import { VOLUNTEER_SKILLS } from '../../utils/constants.js';
import {
  getInitials,
  formatScore,
  formatPercent,
  formatStars,
} from '../../utils/formatters.js';

// ─── Stat pill — small label + value pair ─────────────────────────────────────
function StatPill({ label, value, color = 'var(--text-mid)' }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
        minWidth: '52px',
      }}
    >
      <span
        style={{
          fontSize: '15px',
          fontWeight: 800,
          color,
          letterSpacing: '-0.5px',
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: '10px',
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.4px',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Star rating row ──────────────────────────────────────────────────────────
function StarRow({ rating, totalRatings }) {
  if (!totalRatings) return null;
  const stars = formatStars(rating);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '12px',
        color: 'var(--text-muted)',
      }}
    >
      <div className="stars">
        {stars.map((filled, i) => (
          <span key={i} className={`star${filled ? ' filled' : ''}`}>★</span>
        ))}
      </div>
      <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>
        {(rating || 0).toFixed(1)}
      </span>
      <span>({totalRatings})</span>
    </div>
  );
}

// ─── Skill chip ───────────────────────────────────────────────────────────────
function SkillChip({ skill }) {
  return (
    <span
      style={{
        fontSize: '10px',
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: 'var(--radius-full)',
        background: 'var(--green-100)',
        color: 'var(--green-800)',
        textTransform: 'capitalize',
        whiteSpace: 'nowrap',
      }}
    >
      {skill.replace(/_/g, ' ')}
    </span>
  );
}

// ─── VolunteerCard ────────────────────────────────────────────────────────────
/**
 * VolunteerCard — displays a single volunteer in list/grid views.
 *
 * Props:
 *   volunteer   {object}   — Volunteer document from API (with user populated)
 *   onClick     {fn}       — (volunteer) => void  [optional, makes card clickable]
 *   loading     {boolean}  — disables action buttons during API calls
 *   variant     'default' | 'admin'
 *               default → availability, skills, stats, rating
 *               admin   → adds approve / suspend / unsuspend actions
 *
 * Admin-only action props:
 *   onApprove   {fn}  — (volunteerId) => void
 *   onSuspend   {fn}  — (volunteerId) => void
 *   onUnsuspend {fn}  — (volunteerId) => void
 *
 * Volunteer object shape (from backend):
 *   _id, user: { name, email, profilePicture },
 *   isAvailable, isApproved, isSuspended, suspendedReason,
 *   skills[], emergencyTypes[],
 *   reputationScore (0–100),
 *   totalCompleted, totalAssigned,
 *   averageRating, totalRatings,
 *   serviceArea: { city, area, radiusKm },
 *   bio
 */
export default function VolunteerCard({
  volunteer,
  onClick,
  loading = false,
  variant = 'default',
  onApprove,
  onSuspend,
  onUnsuspend,
}) {
  if (!volunteer) return null;

  const {
    _id,
    user,
    isAvailable,
    isApproved,
    isSuspended,
    suspendedReason,
    skills = [],
    reputationScore,
    totalCompleted = 0,
    totalAssigned  = 0,
    averageRating  = 0,
    totalRatings   = 0,
    serviceArea,
    bio,
  } = volunteer;

  const name        = user?.name || 'Unknown Volunteer';
  const initials    = getInitials(name);
  const scoreMeta   = formatScore(reputationScore);
  const isAdmin     = variant === 'admin';
  const isClickable = typeof onClick === 'function';

  // Acceptance rate — guard divide-by-zero
  const acceptanceRate = totalAssigned > 0
    ? formatPercent((totalCompleted / totalAssigned) * 100)
    : '—';

  // Location string
  const locationText = serviceArea?.city
    ? [serviceArea.city, serviceArea.area].filter(Boolean).join(', ')
    : null;

  // Status label + colour
  const statusLabel = isSuspended
    ? 'Suspended'
    : isApproved
      ? isAvailable ? 'Available' : 'Offline'
      : 'Pending';

  const statusBadgeClass = isSuspended
    ? 'badge-red'
    : isApproved
      ? isAvailable ? 'badge-green' : 'badge-stone'
      : 'badge-orange';

  const dotClass = isSuspended
    ? 'dot-red'
    : isApproved
      ? isAvailable ? 'dot-green pulse' : 'dot-stone'
      : 'dot-orange';

  return (
    <div
      className="card card-hover"
      onClick={isClickable ? () => onClick(volunteer) : undefined}
      style={{
        cursor: isClickable ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        animation: 'fadeSlideUp var(--t-page) var(--ease) both',
      }}
    >
      <div
        className="card-body"
        style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}
      >

        {/* ── Header: avatar + name + status ──────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>

          {/* Avatar — profile picture or initials fallback */}
          {user?.profilePicture ? (
            <img
              src={user.profilePicture}
              alt={name}
              className="avatar avatar-md"
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div className="avatar avatar-md">
              {initials}
            </div>
          )}

          {/* Name + location */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: '15px',
                color: 'var(--text-dark)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                marginBottom: '3px',
              }}
            >
              {name}
            </div>
            {locationText && (
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>📍</span> {locationText}
                {serviceArea?.radiusKm && (
                  <span style={{ color: 'var(--text-light)' }}>
                    · {serviceArea.radiusKm}km radius
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Status badge */}
          <span className={`badge ${statusBadgeClass}`} style={{ flexShrink: 0 }}>
            <span className={`status-dot ${dotClass}`} />
            {statusLabel}
          </span>
        </div>

        {/* ── Reputation score bar ─────────────────────────────────────── */}
        {reputationScore !== undefined && reputationScore !== null && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '5px',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Reputation
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: `var(--${scoreMeta.color === 'stone' ? 'text-muted' : scoreMeta.color === 'blue' ? 'info' : scoreMeta.color === 'orange' ? 'warning' : scoreMeta.color === 'red' ? 'danger' : 'green-700'})`,
                }}
              >
                {scoreMeta.label} · {reputationScore}
              </span>
            </div>
            <div
              style={{
                height: '5px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--stone-200)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${reputationScore}%`,
                  borderRadius: 'var(--radius-full)',
                  background:
                    reputationScore >= 70
                      ? 'var(--green-600)'
                      : reputationScore >= 40
                        ? 'var(--warning)'
                        : 'var(--danger)',
                  transition: 'width 0.6s var(--ease)',
                }}
              />
            </div>
          </div>
        )}

        {/* ── Star rating ───────────────────────────────────────────────── */}
        <StarRow rating={averageRating} totalRatings={totalRatings} />

        {/* ── Stats row ─────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '10px 0',
            borderTop: '1px solid var(--stone-200)',
            borderBottom: '1px solid var(--stone-200)',
            justifyContent: 'space-around',
          }}
        >
          <StatPill
            label="Completed"
            value={totalCompleted}
            color="var(--green-700)"
          />
          <div style={{ width: '1px', background: 'var(--stone-200)' }} />
          <StatPill
            label="Assigned"
            value={totalAssigned}
            color="var(--text-dark)"
          />
          <div style={{ width: '1px', background: 'var(--stone-200)' }} />
          <StatPill
            label="Success"
            value={acceptanceRate}
            color={
              totalAssigned > 0 && totalCompleted / totalAssigned >= 0.7
                ? 'var(--green-700)'
                : 'var(--warning)'
            }
          />
        </div>

        {/* ── Skills chips ──────────────────────────────────────────────── */}
        {skills.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {skills.slice(0, 4).map((s) => (
              <SkillChip key={s} skill={s} />
            ))}
            {skills.length > 4 && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--stone-200)',
                  color: 'var(--text-muted)',
                }}
              >
                +{skills.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* ── Bio snippet ───────────────────────────────────────────────── */}
        {bio && (
          <p
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              margin: 0,
            }}
          >
            {bio}
          </p>
        )}

        {/* ── Suspension reason (admin only) ────────────────────────────── */}
        {isAdmin && isSuspended && suspendedReason && (
          <div className="alert alert-error" style={{ padding: '8px 12px' }}>
            <span className="alert-icon">⚠️</span>
            <span style={{ fontSize: '12px' }}>{suspendedReason}</span>
          </div>
        )}

        {/* ── Admin actions ─────────────────────────────────────────────── */}
        {isAdmin && (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginTop: 'auto',
              paddingTop: '4px',
            }}
          >
            {/* Approve — only shown if not yet approved */}
            {!isApproved && typeof onApprove === 'function' && (
              <button
                className="btn btn-primary btn-sm"
                style={{ flex: 1 }}
                disabled={loading}
                onClick={(e) => {
                  e.stopPropagation();
                  onApprove(_id);
                }}
              >
                {loading ? <span className="spinner" /> : '✓ Approve'}
              </button>
            )}

            {/* Suspend / Unsuspend toggle */}
            {isSuspended
              ? typeof onUnsuspend === 'function' && (
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                    disabled={loading}
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnsuspend(_id);
                    }}
                  >
                    {loading ? <span className="spinner spinner-green" /> : 'Lift Suspension'}
                  </button>
                )
              : typeof onSuspend === 'function' && (
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{
                      flex: 1,
                      color: 'var(--danger)',
                      borderColor: 'var(--danger)',
                    }}
                    disabled={loading}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSuspend(_id);
                    }}
                  >
                    {loading ? <span className="spinner" /> : 'Suspend'}
                  </button>
                )
            }
          </div>
        )}

      </div>
    </div>
  );
}