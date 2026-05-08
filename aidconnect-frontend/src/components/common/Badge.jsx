import React from 'react';
import {
  getStatusClass,
  getUrgencyClass,
  formatStatus,
  formatUrgency,
  formatRole,
} from '../../utils/formatters.js';

export default function Badge({
  status,
  urgency,
  role,
  color,
  children,
  icon,
  dot   = false,
  pulse = false,
  style,
  className = '',
  onClick,
}) {
  let colorClass = `badge-${color || 'stone'}`;

  if (status)  colorClass = getStatusClass(status);
  if (urgency) colorClass = getUrgencyClass(urgency);
  if (role) {
    const roleColorMap = {
      admin:     'badge-red',
      volunteer: 'badge-green',
      provider:  'badge-blue',
      user:      'badge-stone',
    };
    colorClass = roleColorMap[role] || 'badge-stone';
  }
  let label = children;
  if (label === undefined || label === null) {
    if (status)  label = formatStatus(status);
    if (urgency) label = formatUrgency(urgency);
    if (role)    label = formatRole(role);
  }
  const dotColorMap = {
    'badge-green':  'dot-green',
    'badge-red':    'dot-red',
    'badge-orange': 'dot-orange',
    'badge-blue':   'dot-blue',
    'badge-stone':  'dot-stone',
    'urgency-critical': 'dot-red',
    'urgency-high':     'dot-orange',
    'urgency-medium':   'dot-orange',
    'urgency-low':      'dot-green',
  };
  const dotClass = dotColorMap[colorClass] || 'dot-stone';

  const isClickable = typeof onClick === 'function';

  return (
    <span
      className={`badge ${colorClass} ${className}`.trim()}
      style={{
        cursor: isClickable ? 'pointer' : 'default',
        ...style,
      }}
      onClick={onClick}
    >
      {dot && (
        <span className={`status-dot ${dotClass}${pulse ? ' pulse' : ''}`} />
      )}
      {icon && (
        <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
      )}
      {label}
    </span>
  );
}