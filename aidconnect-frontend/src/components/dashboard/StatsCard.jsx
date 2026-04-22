// src/components/dashboard/StatsCard.jsx
import React from 'react';
import { formatNumber, formatPercent } from '../../utils/formatters.js';

// ─── Trend indicator ──────────────────────────────────────────────────────────
function Trend({ value, label }) {
  if (value === undefined || value === null) return null;

  const isPositive = value > 0;
  const isNeutral  = value === 0;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        fontSize: '11px',
        fontWeight: 600,
        color: isNeutral
          ? 'var(--text-muted)'
          : isPositive
            ? 'var(--green-700)'
            : 'var(--danger)',
      }}
    >
      <span style={{ fontSize: '10px' }}>
        {isNeutral ? '─' : isPositive ? '▲' : '▼'}
      </span>
      {isNeutral ? 'No change' : `${Math.abs(value)}% ${label || ''}`}
    </div>
  );
}

// ─── StatsCard ────────────────────────────────────────────────────────────────
/**
 * StatsCard — single metric display card for dashboards.
 * Built on the .stat-card design system class from index.css.
 *
 * Props:
 *   label       {string}   metric label e.g. "Total Requests"       required
 *   value       {number}   raw numeric value                         required
 *   icon        {string}   emoji icon e.g. "🆘"                     required
 *   color       'green' | 'orange' | 'red' | 'blue'   default: 'green'
 *
 *   format      'number' | 'percent' | 'raw'
 *               number  → formatNumber (1200 → "1.2k")
 *               percent → formatPercent (85.6 → "85.6%")
 *               raw     → value as-is (for strings like "4.8 ★")
 *               default: 'number'
 *
 *   sub         {string}   small text below the value e.g. "vs last month"
 *   trend       {number}   percent change — shows ▲/▼ indicator
 *               positive → green ▲, negative → red ▼, zero → neutral
 *   trendLabel  {string}   appended to trend e.g. "this month"
 *
 *   loading     {boolean}  shows skeleton state
 *   onClick     {fn}       makes card clickable
 *   delay       {number}   animation delay in ms (0 | 100 | 200 … 800)
 *               used to stagger cards in a grid
 *
 * USAGE:
 *
 *   // Basic
 *   <StatsCard label="Total Requests" value={342} icon="🆘" color="red" />
 *
 *   // With trend
 *   <StatsCard
 *     label="Completed" value={128} icon="✅" color="green"
 *     trend={12} trendLabel="vs last month"
 *     sub="This month"
 *   />
 *
 *   // Percentage
 *   <StatsCard
 *     label="Response Rate" value={87.5} icon="⚡" color="blue"
 *     format="percent"
 *   />
 *
 *   // Staggered grid (AdminDashboard)
 *   {stats.map((s, i) => (
 *     <StatsCard key={s.label} {...s} delay={i * 100} />
 *   ))}
 *
 *   // Loading skeleton
 *   <StatsCard label="…" value={0} icon="🆘" loading />
 */
export default function StatsCard({
  label,
  value,
  icon,
  color      = 'green',
  format     = 'number',
  sub,
  trend,
  trendLabel,
  loading    = false,
  onClick,
  delay      = 0,
}) {
  const isClickable = typeof onClick === 'function';

  // ── Format the display value ───────────────────────────────────────────────
  const displayValue = (() => {
    if (loading) return '—';
    if (format === 'percent') return formatPercent(value);
    if (format === 'number')  return formatNumber(value);
    return value; // raw
  })();

  // ── Animation delay class ──────────────────────────────────────────────────
  const delayClass = delay > 0 ? `delay-${delay}` : '';

  return (
    <div
      className={`stat-card ${delayClass}`}
      style={{ cursor: isClickable ? 'pointer' : 'default' }}
      onClick={isClickable ? onClick : undefined}
    >
      {/* ── Icon bubble ───────────────────────────────────────────────────── */}
      <div className={`stat-icon ${color}`}>
        {loading
          ? <div className="skeleton" style={{ width: '24px', height: '24px', borderRadius: 'var(--radius-sm)' }} />
          : <span>{icon}</span>
        }
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Label */}
        <div className="stat-label">
          {loading
            ? <div className="skeleton" style={{ height: '10px', width: '60%' }} />
            : label
          }
        </div>

        {/* Value */}
        <div className="stat-value">
          {loading
            ? <div className="skeleton" style={{ height: '28px', width: '50%', marginTop: '4px' }} />
            : displayValue
          }
        </div>

        {/* Sub text + trend */}
        {!loading && (sub || trend !== undefined) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '5px',
              flexWrap: 'wrap',
            }}
          >
            {sub && (
              <span className="stat-sub">{sub}</span>
            )}
            {trend !== undefined && (
              <Trend value={trend} label={trendLabel} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}