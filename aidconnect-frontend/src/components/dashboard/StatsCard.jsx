import React from 'react';
import { formatNumber, formatPercent } from '../../utils/formatters.js';
import {
  TrendingUp, TrendingDown, Minus,
  CheckCircle, Zap, Star, Award,
  Users, AlertCircle, Activity, Clock,
  Shield, Heart, BarChart2, MapPin,
  ThumbsUp, Target, Flame, Bell,
} from 'lucide-react';
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
  const displayValue = (() => {
    if (loading) return '—';
    if (format === 'percent') return formatPercent(value);
    if (format === 'number')  return formatNumber(value);
    return value; // raw
  })();
  const resolvedIcon = (() => {
    if (loading) return null;
    if (typeof icon === 'string') {
      const LucideIcon = ICON_MAP[icon.toLowerCase()];
      return LucideIcon ? <LucideIcon size={22} strokeWidth={2} /> : null;
    }
    return icon;
  })();
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
<div className={`stat-icon ${color}`}>
        {loading
          ? <div className="skeleton" style={{ width: '24px', height: '24px', borderRadius: 'var(--radius-sm)' }} />
          : resolvedIcon
        }
      </div>
<div style={{ flex: 1, minWidth: 0 }}>
<div className="stat-label">
          {loading
            ? <div className="skeleton" style={{ height: '10px', width: '60%' }} />
            : label
          }
        </div>
<div className="stat-value">
          {loading
            ? <div className="skeleton" style={{ height: '28px', width: '50%', marginTop: '4px' }} />
            : displayValue
          }
        </div>
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