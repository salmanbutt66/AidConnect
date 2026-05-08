import React from 'react';
import { VOLUNTEER_SKILLS } from '../../utils/constants.js';
import {
  getInitials,
  formatScore,
  formatPercent,
  formatStars,
} from '../../utils/formatters.js';
import { MapPin, AlertTriangle, Check, Star } from 'lucide-react';
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
      <div style={{ display: 'flex', gap: '2px' }}>
        {stars.map((filled, i) => (
          <Star 
            key={i} 
            size={14} 
            fill={filled ? "currentColor" : "none"} 
            color={filled ? "var(--warning)" : "var(--stone-300)"} 
          />
        ))}
      </div>
      <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>
        {(rating || 0).toFixed(1)}
      </span>
      <span>({totalRatings})</span>
    </div>
  );
}
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
  const acceptanceRate = totalAssigned > 0
    ? formatPercent((totalCompleted / totalAssigned) * 100)
    : '—';
  const locationText = serviceArea?.city
    ? [serviceArea.city, serviceArea.area].filter(Boolean).join(', ')
    : null;
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
<div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
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
                <MapPin size={12} color="var(--text-light)" /> {locationText}
                {serviceArea?.radiusKm && (
                  <span style={{ color: 'var(--text-light)' }}>
                    · {serviceArea.radiusKm}km radius
                  </span>
                )}
              </div>
            )}
          </div>
<span className={`badge ${statusBadgeClass}`} style={{ flexShrink: 0 }}>
            <span className={`status-dot ${dotClass}`} />
            {statusLabel}
          </span>
        </div>
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
<StarRow rating={averageRating} totalRatings={totalRatings} />
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
{isAdmin && isSuspended && suspendedReason && (
          <div className="alert alert-error" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={14} color="var(--danger)" />
            <span style={{ fontSize: '12px' }}>{suspendedReason}</span>
          </div>
        )}
{isAdmin && (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginTop: 'auto',
              paddingTop: '4px',
            }}
          >
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
                {loading ? <span className="spinner" /> : <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}><Check size={14} /> Approve</div>}
              </button>
            )}
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