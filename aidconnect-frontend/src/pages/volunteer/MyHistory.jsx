// src/pages/volunteer/MyHistory.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar.jsx';
import StatsCard from '../../components/dashboard/StatsCard.jsx';
import Badge from '../../components/common/Badge.jsx';
import Loader from '../../components/common/Loader.jsx';
import useAuth from '../../hooks/useAuth.js';
import { getVolunteerHistory } from '../../api/volunteer.api.js';
import {
  formatDate,
  formatDateTime,
  formatTimeAgo,
  formatDuration,
  formatEmergencyType,
  getInitials,
} from '../../utils/formatters.js';

/* ─── Scoped styles ─────────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');

  .history-root * { font-family: 'DM Sans', sans-serif; }

  @keyframes hist-fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes hist-slideDown {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes hist-fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .history-root .hist-card {
    background: #fff;
    border-radius: 13px;
    border: 1.5px solid #e8ede9;
    box-shadow: 0 2px 8px rgba(26,107,60,0.04);
    overflow: hidden;
    transition: box-shadow 0.22s ease, border-color 0.18s ease, transform 0.2s cubic-bezier(.34,1.3,.64,1);
    animation: hist-fadeUp 0.36s ease both;
  }
  .history-root .hist-card:hover {
    box-shadow: 0 8px 28px rgba(26,107,60,0.11);
    border-color: #b8dfc9;
    transform: translateY(-2px);
  }

  .history-root .hist-header {
    padding: 15px 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    user-select: none;
    transition: background 0.15s ease;
  }
  .history-root .hist-header:hover {
    background: #f9fcfa;
  }

  .history-root .hist-expanded {
    border-top: 1.5px solid #edf2ee;
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    animation: hist-slideDown 0.22s ease both;
    background: #fdfffe;
  }

  .history-root .icon-box {
    width: 42px; height: 42px;
    border-radius: 11px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    transition: transform 0.18s ease;
  }
  .history-root .hist-card:hover .icon-box {
    transform: scale(1.06);
  }

  .history-root .status-completed {
    background: #f0fdf5; color: #1a6b3c;
  }
  .history-root .status-cancelled {
    background: #fff5f5; color: #b03030;
  }
  .history-root .status-in_progress {
    background: #fffbec; color: #d68910;
  }

  .history-root .chevron {
    display: inline-flex; align-items: center; justify-content: center;
    width: 28px; height: 28px;
    border-radius: 7px;
    color: #6b7a64;
    transition: transform 0.22s cubic-bezier(.34,1.3,.64,1), background 0.15s ease;
    flex-shrink: 0;
  }
  .history-root .chevron.open { transform: rotate(180deg); }
  .history-root .hist-header:hover .chevron {
    background: #edf2ee;
  }

  .history-root .time-pill {
    display: inline-flex; align-items: center; gap: 5px;
    background: #f2fbf6; color: #1a6b3c;
    border: 1px solid #c5e8d1;
    border-radius: 20px; padding: 3px 10px;
    font-size: 11px; font-weight: 700;
    font-family: 'DM Mono', monospace;
    flex-shrink: 0;
  }

  .history-root .detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
    gap: 12px;
    padding: 15px 16px;
    background: #f7fbf8;
    border-radius: 10px;
    border: 1px solid #dff0e7;
  }
  .history-root .detail-item-label {
    display: flex; align-items: center; gap: 5px;
    font-size: 10px; font-weight: 700;
    color: #6b7a64;
    text-transform: uppercase; letter-spacing: 0.7px;
    margin-bottom: 3px;
  }
  .history-root .detail-item-value {
    font-size: 13px; font-weight: 600; color: #141b11;
    font-family: 'DM Mono', monospace;
  }

  .history-root .desc-block {
    font-size: 14px; color: #3a4a35;
    line-height: 1.65;
    padding: 12px 14px;
    background: #fff;
    border-radius: 9px;
    border: 1px solid #e8ede9;
  }
  .history-root .desc-label {
    font-size: 10px; font-weight: 700;
    color: #6b7a64; text-transform: uppercase;
    letter-spacing: 0.7px; margin-bottom: 6px;
    display: flex; align-items: center; gap: 5px;
  }

  .history-root .requester-box {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 14px;
    background: #f2fbf6;
    border-radius: 10px;
    border: 1px solid #c5e8d1;
    transition: background 0.15s ease;
  }
  .history-root .requester-box:hover { background: #e5f5ee; }

  .history-root .avatar-circle {
    width: 38px; height: 38px;
    border-radius: 50%;
    background: #1a6b3c; color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700;
    flex-shrink: 0;
    letter-spacing: 0.5px;
  }

  .history-root .call-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 7px;
    background: #fff; color: #1a6b3c;
    border: 1.5px solid #a7e3be;
    font-size: 12px; font-weight: 600;
    text-decoration: none; cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease, transform 0.14s ease;
    flex-shrink: 0;
  }
  .history-root .call-btn:hover {
    background: #eaf7f0; border-color: #1a6b3c;
    transform: translateY(-1px);
  }

  /* Filter tabs */
  .history-root .filter-bar {
    display: flex; gap: 6px; flex-wrap: wrap;
    padding: 16px 20px;
    border-bottom: 1.5px solid #edf2ee;
    background: #fafcfa;
  }
  .history-root .filter-btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 7px 15px; border-radius: 8px;
    font-size: 13px; font-weight: 600;
    border: 1.5px solid #dde8df;
    background: #fff; color: #3a4a35;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease,
                color 0.15s ease, transform 0.14s ease, box-shadow 0.15s ease;
  }
  .history-root .filter-btn:hover {
    background: #f0fdf5; border-color: #7dd49a; color: #1a6b3c;
    transform: translateY(-1px);
  }
  .history-root .filter-btn.active {
    background: #1a6b3c; border-color: #1a6b3c;
    color: #fff; box-shadow: 0 3px 10px rgba(26,107,60,0.22);
  }
  .history-root .filter-btn.active:hover { transform: translateY(-1px); }

  /* Stats row */
  .history-root .stats-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px; margin-bottom: 24px;
    animation: hist-fadeIn 0.3s ease both;
  }
  .history-root .stat-tile {
    background: #fff;
    border: 1.5px solid #e8ede9;
    border-radius: 12px; padding: 16px 18px;
    transition: transform 0.18s ease, box-shadow 0.18s ease;
    animation: hist-fadeUp 0.34s ease both;
  }
  .history-root .stat-tile:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(26,107,60,0.1);
  }
  .history-root .stat-icon {
    width: 36px; height: 36px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 10px;
  }
  .history-root .stat-val {
    font-size: 22px; font-weight: 700;
    color: #141b11; letter-spacing: -0.5px;
    font-family: 'DM Mono', monospace;
    line-height: 1;
  }
  .history-root .stat-lbl {
    font-size: 11px; font-weight: 600;
    color: #6b7a64; text-transform: uppercase;
    letter-spacing: 0.6px; margin-top: 4px;
  }

  /* Pagination */
  .history-root .pag-row {
    display: flex; align-items: center; justify-content: center;
    gap: 6px; margin-top: 24px; flex-wrap: wrap;
  }
  .history-root .pag-btn {
    width: 34px; height: 34px; border-radius: 8px;
    border: 1.5px solid #dde8df;
    background: #fff; color: #3a4a35;
    font-size: 13px; font-weight: 600;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: background 0.14s ease, border-color 0.14s ease,
                color 0.14s ease, transform 0.12s ease;
  }
  .history-root .pag-btn:hover:not(:disabled) {
    background: #f0fdf5; border-color: #7dd49a; color: #1a6b3c;
    transform: scale(1.06);
  }
  .history-root .pag-btn.active {
    background: #1a6b3c; border-color: #1a6b3c;
    color: #fff; box-shadow: 0 2px 8px rgba(26,107,60,0.22);
  }
  .history-root .pag-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* Alert */
  .history-root .alert-banner {
    display: flex; align-items: center; gap: 12px;
    padding: 13px 16px; border-radius: 10px;
    margin-bottom: 18px; font-size: 14px; font-weight: 500;
    animation: hist-fadeUp 0.26s ease both;
  }
  .history-root .alert-error {
    background: #fff5f5; border: 1.5px solid #f5c6c6; color: #b03030;
  }

  .history-root .empty-box {
    text-align: center; padding: 48px 24px;
    animation: hist-fadeUp 0.3s ease both;
  }
  .history-root .empty-icon {
    width: 64px; height: 64px; border-radius: 16px;
    background: #e0f5e9; color: #1a6b3c;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 16px;
  }

  .history-root .page-title {
    font-size: 26px; font-weight: 700;
    color: #141b11; letter-spacing: -0.4px;
  }
  .history-root .page-subtitle {
    font-size: 14px; color: #6b7a64; margin-top: 5px;
  }

  .history-root .outer-card {
    background: #fff; border-radius: 14px;
    border: 1.5px solid #e8ede9;
    box-shadow: 0 2px 10px rgba(26,107,60,0.05);
    overflow: hidden;
    animation: hist-fadeUp 0.38s ease both;
  }

  .history-root .page-wrapper-inner {
    max-width: 900px; margin: 0 auto;
    padding: 28px 20px 52px;
  }
`;

/* ─── SVG Icons ─────────────────────────────────────────────────────────────── */
const Icon = {
  Medical: ({ s = 18 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  ),
  Blood: ({ s = 18 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
    </svg>
  ),
  Accident: ({ s = 18 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Disaster: ({ s = 18 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  Other: ({ s = 18 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  CheckCircle: ({ s = 18 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  XCircle: ({ s = 18 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
  Clock: ({ s = 14 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  MapPin: ({ s = 13 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Calendar: ({ s = 13 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Zap: ({ s = 13 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  Timer: ({ s = 13 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Droplet: ({ s = 13 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
    </svg>
  ),
  Phone: ({ s = 13 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.56a16 16 0 0 0 6.29 6.29l.87-.87a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  User: ({ s = 13 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  ChevronDown: ({ s = 16 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  Clipboard: ({ s = 32 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    </svg>
  ),
  AlertCircle: ({ s = 18 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  X: ({ s = 16 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  List: ({ s = 15 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  ),
  ChevronLeft: ({ s = 16 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  ChevronRight: ({ s = 16 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
};

/* ─── Emergency icon + colour map ───────────────────────────────────────────── */
const emergencyStyle = {
  medical:  { bg: '#fff0ef', color: '#c0392b', Icon: Icon.Medical  },
  blood:    { bg: '#fff0ef', color: '#c0392b', Icon: Icon.Blood    },
  accident: { bg: '#fffbec', color: '#d68910', Icon: Icon.Accident },
  disaster: { bg: '#eef6fb', color: '#1a6b9a', Icon: Icon.Disaster },
  other:    { bg: '#f2fbf6', color: '#1a6b3c', Icon: Icon.Other   },
};

const statusStyle = {
  completed:   { bg: '#f0fdf5', color: '#1a6b3c', Icon: Icon.CheckCircle, label: 'Completed'   },
  cancelled:   { bg: '#fff5f5', color: '#b03030', Icon: Icon.XCircle,     label: 'Cancelled'   },
  in_progress: { bg: '#fffbec', color: '#d68910', Icon: Icon.Zap,         label: 'In Progress' },
};

const urgencyConfig = {
  critical: { color: '#c0392b', bg: '#fff0ef', label: 'Critical' },
  high:     { color: '#d68910', bg: '#fffbec', label: 'High'     },
  medium:   { color: '#1a6b9a', bg: '#eef6fb', label: 'Medium'   },
  low:      { color: '#229450', bg: '#f0fdf5', label: 'Low'      },
};

/* ─── Expandable History Row ────────────────────────────────────────────────── */
function HistoryRow({ request, index }) {
  const [expanded, setExpanded] = useState(false);
  const requester = request.requesterId;

  const locationValue =
    [request.city, request.address].filter(Boolean).join(' · ') || null;

  const eStyle = emergencyStyle[request.emergencyType] || emergencyStyle.other;
  const sStyle = statusStyle[request.status] || statusStyle.cancelled;
  const uConfig = urgencyConfig[request.urgencyLevel];
  const EIcon = eStyle.Icon;
  const SIcon = sStyle.Icon;

  const details = [
    { Icon: Icon.MapPin,   label: 'Location',      value: locationValue },
    { Icon: Icon.Calendar, label: 'Accepted At',   value: request.acceptedAt   ? formatDateTime(request.acceptedAt)  : null },
    { Icon: Icon.Calendar, label: 'Completed At',  value: request.completedAt  ? formatDateTime(request.completedAt) : null },
    { Icon: Icon.Zap,      label: 'Response Time', value: request.responseTime    ? formatDuration(request.responseTime)   : null },
    { Icon: Icon.Timer,    label: 'Resolution',    value: request.resolutionTime  ? formatDuration(request.resolutionTime) : null },
    { Icon: Icon.Droplet,  label: 'Blood Group',   value: request.bloodGroupNeeded || null },
  ].filter(d => !!d.value);

  return (
    <div
      className="hist-card"
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      {/* Collapsed header */}
      <div className="hist-header" onClick={() => setExpanded(p => !p)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '13px', flex: 1, minWidth: 0 }}>

          {/* Emergency icon */}
          <div className="icon-box" style={{ background: eStyle.bg, color: eStyle.color }}>
            <EIcon s={19} />
          </div>

          <div style={{ minWidth: 0 }}>
            {/* Tag row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap', marginBottom: '5px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#141b11' }}>
                {formatEmergencyType(request.emergencyType)}
              </span>

              {/* Urgency */}
              {uConfig && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  background: uConfig.bg, color: uConfig.color,
                  border: `1px solid ${uConfig.color}33`,
                  borderRadius: '5px', padding: '2px 8px',
                  fontSize: '10px', fontWeight: 700,
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: uConfig.color, display: 'inline-block' }} />
                  {uConfig.label}
                </span>
              )}

              {/* Status */}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                background: sStyle.bg, color: sStyle.color,
                border: `1px solid ${sStyle.color}33`,
                borderRadius: '5px', padding: '2px 8px',
                fontSize: '10px', fontWeight: 700,
              }}>
                <SIcon s={11} />
                {sStyle.label}
              </span>
            </div>

            {/* Meta line */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', fontSize: '12px', color: '#6b7a64' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Icon.Calendar s={12} />
                {formatDateTime(request.createdAt)}
              </span>
              {requester?.name && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Icon.User s={12} />
                  {requester.name}
                </span>
              )}
              {request.city && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Icon.MapPin s={12} />
                  {request.city}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {request.resolutionTime && (
            <span className="time-pill">
              <Icon.Clock s={11} />
              {formatDuration(request.resolutionTime)}
            </span>
          )}
          <span className={`chevron${expanded ? ' open' : ''}`}>
            <Icon.ChevronDown s={16} />
          </span>
        </div>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="hist-expanded">

          {/* Description */}
          {request.description && (
            <div>
              <div className="desc-label">
                <Icon.Clipboard s={11} /> Description
              </div>
              <div className="desc-block">{request.description}</div>
            </div>
          )}

          {/* Detail grid */}
          {details.length > 0 && (
            <div className="detail-grid">
              {details.map((d) => (
                <div key={d.label}>
                  <div className="detail-item-label">
                    <d.Icon s={11} />
                    {d.label}
                  </div>
                  <div className="detail-item-value">{d.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Requester info */}
          {requester && (
            <div className="requester-box">
              <div className="avatar-circle">
                {getInitials(requester.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#141b11' }}>
                  {requester.name}
                </div>
                {requester.phone && (
                  <a
                    href={`tel:${requester.phone}`}
                    style={{ fontSize: '12px', color: '#1a6b3c', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}
                  >
                    <Icon.Phone s={12} />
                    {requester.phone}
                  </a>
                )}
              </div>
              {requester.phone && (
                <a href={`tel:${requester.phone}`} className="call-btn">
                  <Icon.Phone s={13} />
                  Call
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Filter config ─────────────────────────────────────────────────────────── */
const FILTERS = [
  { label: 'All',         value: 'all',         Icon: Icon.List        },
  { label: 'Completed',   value: 'completed',   Icon: Icon.CheckCircle },
  { label: 'Cancelled',   value: 'cancelled',   Icon: Icon.XCircle     },
  { label: 'In Progress', value: 'in_progress', Icon: Icon.Zap         },
];

/* ─── Stat tile ─────────────────────────────────────────────────────────────── */
function StatTile({ value, label, iconEl, iconBg, iconColor, delay = 0 }) {
  return (
    <div className="stat-tile" style={{ animationDelay: `${delay}ms` }}>
      <div className="stat-icon" style={{ background: iconBg, color: iconColor }}>
        {iconEl}
      </div>
      <div className="stat-val">{value}</div>
      <div className="stat-lbl">{label}</div>
    </div>
  );
}

/* ─── MyHistory page ────────────────────────────────────────────────────────── */
export default function MyHistory() {
  const navigate = useNavigate();

  const [requests,   setRequests]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [filter,     setFilter]     = useState('all');
  const [pagination, setPagination] = useState(null);
  const [page,       setPage]       = useState(1);

  const load = useCallback(async (statusFilter, pageNum) => {
    setLoading(true);
    setError('');
    try {
      const params = { page: pageNum, limit: 10 };
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await getVolunteerHistory(params);
      setRequests(res.data || []);
      setPagination(res.pagination || null);
    } catch {
      setError('Failed to load history. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(filter, page);
  }, [filter, page, load]);

  const handleFilterChange = (val) => {
    setFilter(val);
    setPage(1);
  };

  const completedCount = requests.filter(r => r.status === 'completed').length;
  const cancelledCount = requests.filter(r => r.status === 'cancelled').length;
  const timedRequests  = requests.filter(r => r.resolutionTime);
  const avgTime        = timedRequests.length
    ? Math.round(timedRequests.reduce((s, r) => s + r.resolutionTime, 0) / timedRequests.length)
    : null;

  return (
    <>
      <style>{STYLES}</style>
      <Navbar title="Request History">
        <div className="history-root">
          <div className="page-wrapper-inner">

            {/* Page header */}
            <div style={{ marginBottom: '26px' }}>
              <h1 className="page-title">Request History</h1>
              <p className="page-subtitle">All emergency requests you've handled as a volunteer.</p>
            </div>

            {/* Stats row */}
            {!loading && requests.length > 0 && (
              <div className="stats-row">
                <StatTile
                  value={requests.length}
                  label="Showing"
                  iconEl={<Icon.Clipboard s={18} />}
                  iconBg="#eef6fb" iconColor="#1a6b9a"
                  delay={0}
                />
                <StatTile
                  value={completedCount}
                  label="Completed"
                  iconEl={<Icon.CheckCircle s={18} />}
                  iconBg="#f0fdf5" iconColor="#1a6b3c"
                  delay={60}
                />
                <StatTile
                  value={cancelledCount}
                  label="Cancelled"
                  iconEl={<Icon.XCircle s={18} />}
                  iconBg="#fff5f5" iconColor="#b03030"
                  delay={120}
                />
                <StatTile
                  value={avgTime ? `${avgTime}m` : '—'}
                  label="Avg Resolution"
                  iconEl={<Icon.Timer s={18} />}
                  iconBg="#fffbec" iconColor="#d68910"
                  delay={180}
                />
              </div>
            )}

            {/* Main card */}
            <div className="outer-card">

              {/* Filter bar */}
              <div className="filter-bar">
                {FILTERS.map(({ label, value, Icon: FIcon }) => (
                  <button
                    key={value}
                    className={`filter-btn${filter === value ? ' active' : ''}`}
                    onClick={() => handleFilterChange(value)}
                  >
                    <FIcon s={14} />
                    {label}
                  </button>
                ))}
              </div>

              {/* Body */}
              <div style={{ padding: '20px' }}>

                {/* Error */}
                {error && (
                  <div className="alert-banner alert-error">
                    <Icon.AlertCircle s={18} />
                    <span style={{ flex: 1 }}>{error}</span>
                    <button
                      onClick={() => setError('')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b03030', display: 'flex', borderRadius: '4px' }}
                    >
                      <Icon.X s={16} />
                    </button>
                  </div>
                )}

                {loading && <Loader variant="skeleton" count={4} />}

                {!loading && requests.length === 0 && (
                  <div className="empty-box">
                    <div className="empty-icon">
                      <Icon.Clipboard s={30} />
                    </div>
                    <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#141b11', marginBottom: '8px' }}>
                      No requests found
                    </h3>
                    <p style={{ fontSize: '14px', color: '#6b7a64', marginBottom: '20px' }}>
                      {filter === 'all'
                        ? "You haven't handled any requests yet."
                        : `No ${filter.replace('_', ' ')} requests found.`
                      }
                    </p>
                    {filter !== 'all' && (
                      <button
                        onClick={() => handleFilterChange('all')}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '7px',
                          padding: '9px 20px', borderRadius: '8px',
                          background: '#1a6b3c', color: '#fff',
                          border: 'none', cursor: 'pointer',
                          fontSize: '13px', fontWeight: 600,
                        }}
                      >
                        <Icon.List s={14} /> View All
                      </button>
                    )}
                  </div>
                )}

                {!loading && requests.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {requests.map((req, i) => (
                      <HistoryRow key={req._id} request={req} index={i} />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {!loading && pagination && pagination.pages > 1 && (
                  <>
                    <div className="pag-row">
                      <button
                        className="pag-btn"
                        disabled={page <= 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                      >
                        <Icon.ChevronLeft s={15} />
                      </button>

                      {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                        .filter(p => Math.abs(p - page) <= 2)
                        .map(p => (
                          <button
                            key={p}
                            className={`pag-btn${p === page ? ' active' : ''}`}
                            onClick={() => setPage(p)}
                          >
                            {p}
                          </button>
                        ))
                      }

                      <button
                        className="pag-btn"
                        disabled={page >= pagination.pages}
                        onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                      >
                        <Icon.ChevronRight s={15} />
                      </button>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '12px', color: '#6b7a64' }}>
                      Page {page} of {pagination.pages}
                      {pagination.total ? ` · ${pagination.total} total requests` : ''}
                    </div>
                  </>
                )}

              </div>
            </div>

          </div>
        </div>
      </Navbar>
    </>
  );
}