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
import { Activity, Droplet, Car, CloudLightning, Heart, Users, MapPin, Clock, X, Star, Check, Trash2, AlertTriangle } from 'lucide-react';

const getEmergencyIcon = (type) => {
  const props = { size: 20, strokeWidth: 2.5 };
  switch (type) {
    case 'medical': return <Activity {...props} color="var(--primary)" />;
    case 'blood': return <Droplet {...props} color="var(--danger)" />;
    case 'accident': return <Car {...props} color="var(--warning)" />;
    case 'disaster': return <CloudLightning {...props} color="var(--danger)" />;
    case 'other': return <Heart {...props} color="var(--green-600)" />;
    default: return <Users {...props} color="var(--text-light)" />;
  }
};
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
<div className="request-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ display: 'flex', alignItems: 'center' }}>{getEmergencyIcon(emergencyType)}</span>
          <span className="request-card-type">
            {formatEmergencyType(emergencyType)}
          </span>
          {isDisasterMode && (
            <span className="badge badge-red" style={{ fontSize: '9px', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <AlertTriangle size={10} /> DISASTER
            </span>
          )}
        </div>
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
<p className="request-card-desc">{description}</p>
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
          <Droplet size={14} /> Blood needed: {bloodGroupNeeded}
        </div>
      )}
<div className="request-card-footer">
<div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {address && (
            <div className="request-card-meta" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={14} color="var(--text-light)" />
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
          <div className="request-card-meta" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={14} color="var(--text-light)" />
            <span>{formatTimeAgo(postedAt)}</span>
          </div>
        </div>
<div style={{ display: 'flex', gap: '7px', flexShrink: 0 }}>
{variant === 'user' && status === 'posted' && typeof onCancel === 'function' && (
            <ActionBtn
              label="Cancel"
              icon={<X size={14} />}
              variant="ghost"
              loading={loading}
              onClick={() => onCancel(_id)}
            />
          )}
{variant === 'user' && status === 'completed' && typeof onRate === 'function' && (
            <ActionBtn
              label={request.assignedType === 'Provider' ? 'Rate Service' : 'Rate'}
              icon={<Star size={14} />}
              variant="secondary"
              loading={loading}
              onClick={() => onRate(request)}
            />
          )}
{variant === 'volunteer' && status === 'posted' && typeof onAccept === 'function' && (
            <ActionBtn
              label="Accept"
              icon={<Check size={14} />}
              variant="primary"
              loading={loading}
              onClick={() => onAccept(_id)}
            />
          )}
{variant === 'admin' && isActive && typeof onCancel === 'function' && (
            <ActionBtn
              label="Cancel"
              icon={<X size={14} />}
              variant="ghost"
              loading={loading}
              onClick={() => onCancel(_id)}
            />
          )}
{variant === 'admin' && typeof onDelete === 'function' && (
            <ActionBtn
              label="Delete"
              icon={<Trash2 size={14} />}
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