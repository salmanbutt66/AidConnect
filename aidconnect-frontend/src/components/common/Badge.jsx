// src/components/common/Badge.jsx
import React from 'react';
import {
  getStatusClass,
  getUrgencyClass,
  formatStatus,
  formatUrgency,
  formatRole,
} from '../../utils/formatters.js';

// ─── Badge ────────────────────────────────────────────────────────────────────
/**
 * Badge — universal chip/pill component built on the design system's
 * .badge + .badge-* classes from index.css.
 *
 * THREE ways to use it:
 *
 * 1. EXPLICIT — you control everything:
 *    <Badge color="green" dot>Active</Badge>
 *    <Badge color="red">Banned</Badge>
 *
 * 2. SEMANTIC SHORTCUTS — pass a typed value, Badge resolves class + label:
 *    <Badge status="in_progress" />       → "In Progress"  (orange)
 *    <Badge urgency="critical" />         → "Critical"     (urgency chip)
 *    <Badge role="volunteer" />           → "Volunteer"    (green)
 *
 * 3. HYBRID — override the label but let Badge resolve the colour:
 *    <Badge status="completed">Done ✓</Badge>
 *
 * Props:
 *   color     'green' | 'red' | 'orange' | 'blue' | 'stone'
 *             Required unless status / urgency / role is provided.
 *
 *   status    REQUEST_STATUSES value — resolves color automatically
 *   urgency   URGENCY_LEVELS value  — resolves color automatically
 *   role      USER_ROLES value      — resolves color automatically
 *
 *   dot       {boolean}  — show a status dot before the label
 *   pulse     {boolean}  — dot pulses (only meaningful with dot=true)
 *   icon      {string}   — emoji/icon before the label e.g. "✓"
 *   children  {node}     — label content; if omitted, formatted value is used
 *   style     {object}   — extra inline styles
 *   className {string}   — extra CSS classes
 *   onClick   {fn}       — makes badge clickable
 */
export default function Badge({
  // Semantic shortcuts
  status,
  urgency,
  role,

  // Explicit
  color,

  // Content
  children,
  icon,

  // Modifiers
  dot   = false,
  pulse = false,

  // Passthrough
  style,
  className = '',
  onClick,
}) {
  // ── Resolve color class ────────────────────────────────────────────────────
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

  // ── Resolve label ──────────────────────────────────────────────────────────
  let label = children;
  if (label === undefined || label === null) {
    if (status)  label = formatStatus(status);
    if (urgency) label = formatUrgency(urgency);
    if (role)    label = formatRole(role);
  }

  // ── Resolve dot colour from badge colour ───────────────────────────────────
  const dotColorMap = {
    'badge-green':  'dot-green',
    'badge-red':    'dot-red',
    'badge-orange': 'dot-orange',
    'badge-blue':   'dot-blue',
    'badge-stone':  'dot-stone',
    // urgency chips use their own backgrounds — default to matching dot
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
        <span style={{ fontSize: '10px' }}>{icon}</span>
      )}
      {label}
    </span>
  );
}