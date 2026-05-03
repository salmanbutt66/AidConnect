// src/components/dashboard/StatsCard.jsx
import React from 'react';
import { formatNumber, formatPercent } from '../../utils/formatters.js';
import {
  TrendingUp, TrendingDown, Minus,
  CheckCircle, Zap, Star, Award,
  Users, AlertCircle, Activity, Clock,
  Shield, Heart, BarChart2, MapPin,
  ThumbsUp, Target, Flame, Bell,
} from 'lucide-react';

// ─── Icon map: string name → Lucide component ─────────────────────────────────
const ICON_MAP = {
  check:       CheckCircle,
  zap:         Zap,
  star:        Star,
  award:       Award,
  users:       Users,
  alert:       AlertCircle,
  activity:    Activity,
  clock:       Clock,
  shield:      Shield,
  heart:       Heart,
  bar:         BarChart2,
  map:         MapPin,
  thumbsup:    ThumbsUp,
  target:      Target,
  flame:       Flame,
  bell:        Bell,
};

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
      <span style={{ display: 'flex', alignItems: 'center' }}>
        {isNeutral
          ? <Minus size={12} />
          : isPositive
            ? <TrendingUp size={12} />
            : <TrendingDown size={12} />
        }
      </span>
      {isNeutral ? 'No change' : `${Math.abs(value)}% ${label || ''}`}
    </div>
  );
}

// ─── StatsCard ────────────────────────────────────────────────────────────────
/**
 * StatsCard — single metric display card for dashboards.
 *
 * Props:
 *   label       {string}              metric label               required
 *   value       {number}              raw numeric value          required
 *   icon        {string | ReactNode}  lucide name OR JSX node    required
 *                 string → looked up in ICON_MAP (e.g. "check", "zap", "star", "award")
 *                 node   → rendered directly (e.g. <Users size={22} />)
 *   color       'green' | 'orange' | 'red' | 'blue'             default: 'green'
 *   format      'number' | 'percent' | 'raw'                    default: 'number'
 *   sub         {string}   small text below the value
 *   trend       {number}   percent change — shows ▲/▼ indicator
 *   trendLabel  {string}   appended to trend text
 *   loading     {boolean}  shows skeleton state
 *   onClick     {fn}       makes card clickable
 *   delay       {number}   animation delay in ms (stagger grids)
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

  // ── Resolve icon → either from map or use directly as JSX ─────────────────
  const resolvedIcon = (() => {
    if (loading) return null;
    if (typeof icon === 'string') {
      const LucideIcon = ICON_MAP[icon.toLowerCase()];
      return LucideIcon ? <LucideIcon size={22} strokeWidth={2} /> : null;
    }
    // Already a React node (e.g. <Users size={22} />)
    return icon;
  })();

  // ── Animation delay class ──────────────────────────────────────────────────
  const delayClass = delay > 0 ? `delay-${delay}` : '';

  return (
    <div
      className={`stat-card ${delayClass} card-hover`}
      style={{
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onClick={isClickable ? onClick : undefined}
    >
      {/* ── Icon bubble ───────────────────────────────────────────────────── */}
      <div className={`stat-icon ${color}`}>
        {loading
          ? <div className="skeleton" style={{ width: '24px', height: '24px', borderRadius: 'var(--radius-sm)' }} />
          : resolvedIcon
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
            {sub && <span className="stat-sub">{sub}</span>}
            {trend !== undefined && <Trend value={trend} label={trendLabel} />}
          </div>
        )}
      </div>
    </div>
  );
}