import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar.jsx';
import Badge from '../../components/common/Badge.jsx';
import Loader from '../../components/common/Loader.jsx';
import { acceptRequest } from '../../api/request.api.js';
import { getNearbyRequests } from '../../api/request.api.js';
import { acceptRequest as acceptVolunteerRequest } from '../../api/volunteer.api.js';
import { declineMatch, getMyMatches } from '../../api/match.api.js';
import { formatTimeAgo, formatEmergencyType } from '../../utils/formatters.js';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');

  .matches-root * { font-family: 'DM Sans', sans-serif; }

  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes pulse-ring {
    0%   { transform: scale(0.92); opacity: 0.6; }
    50%  { transform: scale(1.06); opacity: 0.2; }
    100% { transform: scale(0.92); opacity: 0.6; }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }

  .matches-root .match-card {
    background: #fff;
    border-radius: 14px;
    border: 1.5px solid #e8ede9;
    box-shadow: 0 2px 8px rgba(26,107,60,0.05);
    transition: transform 0.22s cubic-bezier(.34,1.56,.64,1),
                box-shadow 0.22s ease,
                border-color 0.18s ease;
    animation: fadeSlideUp 0.38s ease both;
    overflow: hidden;
    position: relative;
  }
  .matches-root .match-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 32px rgba(26,107,60,0.13);
    border-color: var(--green-300, #7dd49a);
  }

  .matches-root .nearby-card {
    background: #fff;
    border-radius: 10px;
    border: 1.5px solid #e8ede9;
    padding: 14px 16px;
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.16s ease;
    animation: fadeSlideUp 0.35s ease both;
  }
  .matches-root .nearby-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(26,107,60,0.10);
    border-color: var(--green-300, #7dd49a);
  }

  .matches-root .icon-box {
    width: 46px; height: 46px;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    transition: transform 0.2s ease;
  }
  .matches-root .match-card:hover .icon-box {
    transform: scale(1.08);
  }

  .matches-root .btn-accept {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 22px; border-radius: 8px;
    background: var(--green-800, #1a6b3c);
    color: #fff; font-weight: 600; font-size: 14px;
    border: none; cursor: pointer;
    transition: background 0.18s ease, transform 0.16s ease, box-shadow 0.18s ease;
    box-shadow: 0 2px 8px rgba(26,107,60,0.18);
  }
  .matches-root .btn-accept:hover:not(:disabled) {
    background: var(--green-700, #1e7d46);
    transform: translateY(-1px);
    box-shadow: 0 5px 16px rgba(26,107,60,0.28);
  }
  .matches-root .btn-accept:active:not(:disabled) { transform: translateY(0); }
  .matches-root .btn-accept:disabled { opacity: 0.55; cursor: not-allowed; }

  .matches-root .btn-decline {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 18px; border-radius: 8px;
    background: transparent;
    color: var(--text-mid, #3a4a35); font-weight: 600; font-size: 14px;
    border: 1.5px solid #d4dbd5; cursor: pointer;
    transition: background 0.16s ease, border-color 0.16s ease,
                color 0.16s ease, transform 0.14s ease;
  }
  .matches-root .btn-decline:hover:not(:disabled) {
    background: #fff1f0;
    border-color: #e07a7a;
    color: #c0392b;
    transform: translateY(-1px);
  }
  .matches-root .btn-decline:disabled { opacity: 0.55; cursor: not-allowed; }

  .matches-root .btn-secondary-action {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 9px 18px; border-radius: 8px;
    background: var(--green-50, #f2fbf6);
    color: var(--green-800, #1a6b3c); font-weight: 600; font-size: 13px;
    border: 1.5px solid #c5e8d1; cursor: pointer;
    transition: background 0.16s ease, transform 0.14s ease, box-shadow 0.16s ease;
  }
  .matches-root .btn-secondary-action:hover:not(:disabled) {
    background: #d4f0e1;
    transform: translateY(-1px);
    box-shadow: 0 3px 10px rgba(26,107,60,0.12);
  }
  .matches-root .btn-secondary-action:disabled { opacity: 0.55; cursor: not-allowed; }

  .matches-root .btn-ghost-sm {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 7px;
    background: var(--green-50, #f2fbf6);
    color: var(--green-800, #1a6b3c); font-size: 13px; font-weight: 600;
    border: 1.5px solid #c5e8d1; cursor: pointer;
    transition: background 0.14s ease, transform 0.12s ease;
  }
  .matches-root .btn-ghost-sm:hover:not(:disabled) {
    background: #d4f0e1; transform: translateY(-1px);
  }
  .matches-root .btn-ghost-sm:disabled { opacity: 0.55; cursor: not-allowed; }

  .matches-root .detail-chip {
    display: flex; flex-direction: column; gap: 3px;
  }
  .matches-root .chip-label {
    font-size: 10px; font-weight: 700;
    color: var(--text-muted, #6b7a64);
    text-transform: uppercase; letter-spacing: 0.7px;
  }
  .matches-root .chip-value {
    font-size: 14px; font-weight: 600;
    color: var(--text-dark, #141b11);
  }
  .matches-root .chip-sub {
    font-size: 12px; color: var(--text-muted, #6b7a64);
    margin-top: 1px;
  }

  .matches-root .urgency-bar {
    position: absolute; top: 0; left: 0;
    width: 4px; height: 100%;
    border-radius: 14px 0 0 14px;
  }

  .matches-root .inline-spinner {
    width: 14px; height: 14px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    animation: spin 0.7s linear infinite;
    display: inline-block;
  }
  .matches-root .inline-spinner-dark {
    width: 14px; height: 14px; border-radius: 50%;
    border: 2px solid rgba(26,107,60,0.2);
    border-top-color: var(--green-800, #1a6b3c);
    animation: spin 0.7s linear infinite;
    display: inline-block;
  }

  .matches-root .alert-banner {
    display: flex; align-items: center; gap: 12px;
    padding: 13px 16px; border-radius: 10px;
    margin-bottom: 20px;
    animation: fadeSlideUp 0.28s ease both;
    font-size: 14px; font-weight: 500;
  }
  .matches-root .alert-error {
    background: #fff5f5; border: 1.5px solid #f5c6c6; color: #b03030;
  }
  .matches-root .alert-success {
    background: #f0fdf5; border: 1.5px solid #a7e3be; color: #1a6b3c;
  }

  .matches-root .count-pill {
    display: inline-flex; align-items: center; gap: 6px;
    background: var(--green-100, #e0f5e9);
    color: var(--green-800, #1a6b3c);
    padding: 4px 12px; border-radius: 20px;
    font-size: 12px; font-weight: 700;
    letter-spacing: 0.3px;
  }

  .matches-root .section-divider {
    display: flex; align-items: center; gap: 12px;
    margin: 28px 0 18px;
  }
  .matches-root .section-divider-line {
    flex: 1; height: 1px; background: #e0e8e2;
  }
  .matches-root .section-divider-label {
    font-size: 11px; font-weight: 700;
    color: var(--text-muted, #6b7a64);
    text-transform: uppercase; letter-spacing: 0.8px;
    white-space: nowrap;
  }

  .matches-root .score-badge {
    display: inline-flex; align-items: center; gap: 5px;
    background: var(--green-50, #f2fbf6);
    color: var(--green-800, #1a6b3c);
    border: 1px solid #c5e8d1;
    border-radius: 6px; padding: 3px 9px;
    font-size: 11px; font-weight: 700;
    font-family: 'DM Mono', monospace;
  }

  .matches-root .distance-badge {
    display: inline-flex; align-items: center; gap: 5px;
    background: #f5f7f5; color: var(--text-mid, #3a4a35);
    border: 1px solid #dde3de;
    border-radius: 6px; padding: 4px 10px;
    font-size: 12px; font-weight: 600;
    white-space: nowrap; flex-shrink: 0;
  }

  .matches-root .page-title {
    font-size: 26px; font-weight: 700;
    color: var(--text-dark, #141b11);
    letter-spacing: -0.4px; line-height: 1.2;
  }
  .matches-root .page-subtitle {
    font-size: 14px; color: var(--text-muted, #6b7a64);
    margin-top: 5px; font-weight: 400;
  }

  .matches-root .empty-icon-wrap {
    width: 72px; height: 72px; border-radius: 18px;
    background: var(--green-100, #e0f5e9);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 18px;
  }

  .matches-root .page-wrapper-inner {
    max-width: 860px; margin: 0 auto;
    padding: 28px 20px 48px;
    animation: fadeIn 0.3s ease both;
  }
`;

const EmergencyIcon = ({ type, size = 22 }) => {
  const icons = {
    medical: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    ),
    blood: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
      </svg>
    ),
    accident: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    disaster: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    other: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  };
  return icons[type] || icons.other;
};

const urgencyConfig = {
  critical: { color: '#c0392b', bg: '#fff0ef', label: 'Critical' },
  high:     { color: '#d68910', bg: '#fffbec', label: 'High'     },
  medium:   { color: '#1a6b9a', bg: '#eef6fb', label: 'Medium'   },
  low:      { color: '#229450', bg: '#f0fdf5', label: 'Low'      },
};

const Icon = {
  Check: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  X: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  MapPin: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Clock: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  User: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Navigation: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 11 22 2 13 21 11 13 3 11"/>
    </svg>
  ),
  Star: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  Droplet: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
    </svg>
  ),
  Inbox: ({ size = 44 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
    </svg>
  ),
  Refresh: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  ),
  ArrowLeft: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  Settings: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
};

function MatchCard({ match, onAccept, onDecline, acceptingId, decliningId, index }) {
  const request   = match.requestId || {};
  const requester = request.requesterId || {};
  const isBusy    = acceptingId === match._id || decliningId === match._id;
  const urgency   = urgencyConfig[request.urgencyLevel] || urgencyConfig.low;

  const iconBg = {
    medical:  { bg: '#fff0ef', color: '#c0392b' },
    blood:    { bg: '#fff0ef', color: '#c0392b' },
    accident: { bg: '#fffbec', color: '#d68910' },
    disaster: { bg: '#eef6fb', color: '#1a6b9a' },
    other:    { bg: '#f2fbf6', color: '#1a6b3c' },
  }[request.emergencyType] || { bg: '#f2fbf6', color: '#1a6b3c' };

  return (
    <div
      className="match-card"
      style={{ animationDelay: `${index * 0.07}s` }}
    >
<div className="urgency-bar" style={{ background: urgency.color }} />

      <div style={{ padding: '20px 22px 20px 26px' }}>
<div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', minWidth: 0 }}>
<div
              className="icon-box"
              style={{ background: iconBg.bg, color: iconBg.color }}
            >
              <EmergencyIcon type={request.emergencyType} size={22} />
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: '15px', fontWeight: 700,
                color: 'var(--text-dark, #141b11)',
                lineHeight: 1.35, marginBottom: '10px',
                overflow: 'hidden', display: '-webkit-box',
                WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              }}>
                {request.description || 'Help request'}
              </div>
<div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', alignItems: 'center' }}>
<span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  background: urgency.bg, color: urgency.color,
                  border: `1px solid ${urgency.color}33`,
                  borderRadius: '6px', padding: '3px 9px',
                  fontSize: '11px', fontWeight: 700, letterSpacing: '0.3px',
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: urgency.color, display: 'inline-block' }} />
                  {urgency.label}
                </span>
<span style={{
                  display: 'inline-flex', alignItems: 'center',
                  background: '#eef6fb', color: '#1a6b9a',
                  border: '1px solid #b8d9ee',
                  borderRadius: '6px', padding: '3px 9px',
                  fontSize: '11px', fontWeight: 600,
                }}>
                  {formatEmergencyType(request.emergencyType)}
                </span>
{match.matchScore > 0 && (
                  <span className="score-badge">
                    <Icon.Star size={11} />
                    {Math.round(match.matchScore)}
                  </span>
                )}
{request.bloodGroupNeeded && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    background: '#fff0ef', color: '#c0392b',
                    border: '1px solid #f5c6c6',
                    borderRadius: '6px', padding: '3px 9px',
                    fontSize: '11px', fontWeight: 700,
                  }}>
                    <Icon.Droplet size={11} />
                    {request.bloodGroupNeeded}
                  </span>
                )}
              </div>
            </div>
          </div>
{match.distanceKm > 0 && (
            <div className="distance-badge">
              <Icon.Navigation size={13} />
              {Number(match.distanceKm).toFixed(1)} km
            </div>
          )}
        </div>
<div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '14px', padding: '16px 18px',
          background: 'var(--green-50, #f2fbf6)',
          borderRadius: '10px', marginBottom: '18px',
          border: '1px solid #dff0e7',
        }}>
          <div className="detail-chip">
            <div className="chip-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Icon.User size={11} /> Requester
            </div>
            <div className="chip-value">{requester.name || 'Anonymous'}</div>
            {requester.phone && <div className="chip-sub">{requester.phone}</div>}
          </div>

          <div className="detail-chip">
            <div className="chip-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Icon.Clock size={11} /> Posted
            </div>
            <div className="chip-value">{formatTimeAgo(request.postedAt || request.createdAt)}</div>
          </div>

          <div className="detail-chip">
            <div className="chip-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Icon.MapPin size={11} /> Location
            </div>
            <div className="chip-value">{request.city || 'Unknown city'}</div>
            {request.address && request.address !== request.city && (
              <div className="chip-sub">{request.address}</div>
            )}
          </div>
        </div>
<div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn-accept"
            disabled={isBusy}
            onClick={() => onAccept(match)}
            style={{ flex: 1, minWidth: '140px', justifyContent: 'center' }}
          >
            {acceptingId === match._id
              ? <><span className="inline-spinner" /> Accepting…</>
              : <><Icon.Check size={15} color="#fff" /> Accept Match</>
            }
          </button>
          <button
            className="btn-decline"
            disabled={isBusy}
            onClick={() => onDecline(match)}
          >
            {decliningId === match._id
              ? <><span className="inline-spinner-dark" /> Declining…</>
              : <><Icon.X size={15} /> Decline</>
            }
          </button>
        </div>

      </div>
    </div>
  );
}

function NearbyRow({ req, onAccept, acceptingId, index }) {
  const isAccepting = acceptingId === req._id;
  const iconStyle = {
    medical:  { bg: '#fff0ef', color: '#c0392b' },
    blood:    { bg: '#fff0ef', color: '#c0392b' },
    accident: { bg: '#fffbec', color: '#d68910' },
    disaster: { bg: '#eef6fb', color: '#1a6b9a' },
    other:    { bg: '#f2fbf6', color: '#1a6b3c' },
  }[req.emergencyType] || { bg: '#f2fbf6', color: '#1a6b3c' };

  return (
    <div className="nearby-card" style={{ animationDelay: `${index * 0.06}s` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', minWidth: 0, flex: 1 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9, flexShrink: 0,
            background: iconStyle.bg, color: iconStyle.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <EmergencyIcon type={req.emergencyType} size={17} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-dark, #141b11)', marginBottom: '5px' }}>
              {formatEmergencyType(req.emergencyType)} — {req.description?.slice(0, 80)}{req.description?.length > 80 ? '…' : ''}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {req.urgencyLevel && (() => {
                const u = urgencyConfig[req.urgencyLevel] || urgencyConfig.low;
                return (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    background: u.bg, color: u.color,
                    border: `1px solid ${u.color}33`,
                    borderRadius: '5px', padding: '2px 8px',
                    fontSize: '10px', fontWeight: 700,
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: u.color, display: 'inline-block' }} />
                    {u.label}
                  </span>
                );
              })()}
              {req.city && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted, #6b7a64)' }}>
                  <Icon.MapPin size={12} /> {req.city}
                </span>
              )}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted, #6b7a64)' }}>
                <Icon.Clock size={12} /> {formatTimeAgo(req.postedAt || req.createdAt)}
              </span>
            </div>
          </div>
        </div>
        <button
          className="btn-secondary-action"
          onClick={() => onAccept(req._id)}
          disabled={isAccepting}
          style={{ flexShrink: 0 }}
        >
          {isAccepting
            ? <><span className="inline-spinner-dark" /> Accepting…</>
            : <><Icon.Check size={14} /> Accept</>
          }
        </button>
      </div>
    </div>
  );
}

export default function Matches() {
  const navigate = useNavigate();

  const [matches,        setMatches]        = useState([]);
  const [nearbyRequests, setNearbyRequests] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState('');
  const [successMsg,     setSuccessMsg]     = useState('');
  const [acceptingId,    setAcceptingId]    = useState('');
  const [decliningId,    setDecliningId]    = useState('');

  const mountedRef     = useRef(true);
  const actionInFlight = useRef(false);
useEffect(() => {
  mountedRef.current = true;
  return () => { mountedRef.current = false; };
}, []);

  const withTimeout = useCallback((promise, ms = 10000) => {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out')), ms)
      ),
    ]);
  }, []);

  const loadMatches = useCallback(async () => {
    if (mountedRef.current) { setLoading(true); setError(''); }
    
    try {
      const [matchRes, nearbyRes] = await Promise.allSettled([
        withTimeout(getMyMatches({ status: 'notified' })),
        withTimeout(getNearbyRequests({ limit: 10 })),
      ]);
      if (!mountedRef.current) return;
      if (matchRes.status === 'fulfilled') {
        const raw = matchRes.value;
console.log("Full Match Value:", matchRes.value);
        setMatches(Array.isArray(raw?.data) ? raw.data : []);
      } else {
        setMatches([]);
      }
      if (nearbyRes.status === 'fulfilled') {
        const raw = nearbyRes.value;
        setNearbyRequests(Array.isArray(raw?.data) ? raw.data : []);
      } else {
        setNearbyRequests([]);
      }
    } catch (err) {
      if (mountedRef.current)
        setError(err.response?.data?.message || 'Failed to load your matches.');
    } finally {
      setLoading(false);
    }
  }, [withTimeout]);

  useEffect(() => { loadMatches(); }, [loadMatches]);

  const showSuccess = useCallback((message) => {
    if (!mountedRef.current) return;
    setSuccessMsg(message);
    setTimeout(() => { if (mountedRef.current) setSuccessMsg(''); }, 3000);
  }, []);

  const navigateToActive = useCallback(() => {
    document.body.style.overflow = '';
    navigate('/volunteer/active-request');
  }, [navigate]);

  const handleAccept = useCallback(async (match) => {
    if (actionInFlight.current) return;
    const requestId = match.requestId?._id || match.requestId;
    if (!requestId || !match?._id) {
      if (mountedRef.current)
        setError('Match data is incomplete. Please refresh and try again.');
      return;
    }
    actionInFlight.current = true;
    if (mountedRef.current) { setAcceptingId(match._id); setError(''); }
    try {
      await acceptRequest(requestId, match._id);
      showSuccess('Match accepted — heading to your active request…');
      setTimeout(navigateToActive, 800);
    } catch (err) {
      if (mountedRef.current)
        setError(
          err.response?.data?.message ||
          'Failed to accept. The request may have already been taken.'
        );
    } finally {
      actionInFlight.current = false;
      if (mountedRef.current) setAcceptingId('');
    }
  }, [showSuccess, navigateToActive]);

  const handleDecline = useCallback(async (match) => {
    if (actionInFlight.current) return;
    actionInFlight.current = true;
    if (mountedRef.current) { setDecliningId(match._id); setError(''); }
    try {
      await declineMatch(match._id);
      if (mountedRef.current)
        setMatches((prev) => prev.filter((m) => m._id !== match._id));
      showSuccess('Match declined successfully.');
    } catch (err) {
      if (mountedRef.current)
        setError(err.response?.data?.message || 'Failed to decline match.');
    } finally {
      actionInFlight.current = false;
      if (mountedRef.current) setDecliningId('');
    }
  }, [showSuccess]);

  const handleAcceptNearby = useCallback(async (requestId) => {
    if (actionInFlight.current) return;
    actionInFlight.current = true;
    if (mountedRef.current) { setAcceptingId(requestId); setError(''); }
    try {
      await acceptVolunteerRequest(requestId);
      showSuccess('Request accepted — heading to active request…');
      setTimeout(navigateToActive, 800);
    } catch (err) {
      if (mountedRef.current)
        setError(err.response?.data?.message || 'Failed to accept request.');
    } finally {
      actionInFlight.current = false;
      if (mountedRef.current) setAcceptingId('');
    }
  }, [showSuccess, navigateToActive]);

  return (
    <>
<style>{STYLES}</style>

      <Navbar title="Incoming Matches">
        <div className="matches-root">
          <div className="page-wrapper-inner">
<div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', flexWrap: 'wrap',
              gap: '14px', marginBottom: '28px',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                  <h1 className="page-title">Incoming Matches</h1>
                  {matches.length > 0 && (
                    <span className="count-pill">
                      {matches.length} pending
                    </span>
                  )}
                </div>
                <p className="page-subtitle">
                  Review requests matched to your profile and accept the one you can handle.
                </p>
              </div>
              <button
                className="btn-ghost-sm"
                onClick={loadMatches}
                disabled={loading}
              >
                <Icon.Refresh size={14} />
                Refresh
              </button>
            </div>
{error && (
              <div className="alert-banner alert-error">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span style={{ flex: 1 }}>{error}</span>
                <button
                  onClick={() => setError('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b03030', padding: '2px', borderRadius: '4px', display: 'flex' }}
                >
                  <Icon.X size={16} />
                </button>
              </div>
            )}

            {successMsg && (
              <div className="alert-banner alert-success">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <span style={{ flex: 1 }}>{successMsg}</span>
              </div>
            )}
{loading ? (
              <Loader variant="card" message="Loading matches…" />
            ) : matches.length === 0 ? (
              
              <div style={{
                background: '#fff', borderRadius: 14,
                border: '1.5px solid #e8ede9',
                boxShadow: '0 2px 8px rgba(26,107,60,0.05)',
                padding: '48px 32px', textAlign: 'center',
                animation: 'fadeSlideUp 0.35s ease both',
              }}>
                <div className="empty-icon-wrap">
                  <Icon.Inbox size={36} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-dark, #141b11)', marginBottom: '10px' }}>
                  No pending match notifications
                </h3>

                {nearbyRequests.length > 0 ? (
                  <>
                    <p style={{ color: 'var(--text-muted, #6b7a64)', fontSize: '14px', maxWidth: '440px', margin: '0 auto 24px' }}>
                      Open requests in your city are available below. You can accept any of them directly.
                    </p>
                    <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
                      {nearbyRequests.map((req, i) => (
                        <NearbyRow
                          key={req._id}
                          req={req}
                          onAccept={handleAcceptNearby}
                          acceptingId={acceptingId}
                          index={i}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <p style={{ color: 'var(--text-muted, #6b7a64)', fontSize: '14px', maxWidth: '400px', margin: '0 auto 26px', lineHeight: 1.6 }}>
                      You'll be notified here when a request matches your profile and location.
                      Make sure you're marked as <strong style={{ color: 'var(--text-dark, #141b11)' }}>available</strong> in your dashboard.
                    </p>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button
                        className="btn-accept"
                        onClick={() => navigate('/volunteer/dashboard')}
                      >
                        <Icon.ArrowLeft size={15} color="#fff" />
                        Back to Dashboard
                      </button>
                      <button
                        className="btn-decline"
                        onClick={() => navigate('/volunteer/profile')}
                      >
                        <Icon.Settings size={15} />
                        Update Profile
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
<div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {matches.map((match, i) => (
                    <MatchCard
                      key={match._id}
                      match={match}
                      onAccept={handleAccept}
                      onDecline={handleDecline}
                      acceptingId={acceptingId}
                      decliningId={decliningId}
                      index={i}
                    />
                  ))}
                </div>
{nearbyRequests.length > 0 && (
                  <>
                    <div className="section-divider">
                      <div className="section-divider-line" />
                      <span className="section-divider-label">Open City Requests — Direct Accept</span>
                      <div className="section-divider-line" />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {nearbyRequests.slice(0, 5).map((req, i) => (
                        <NearbyRow
                          key={req._id}
                          req={req}
                          onAccept={handleAcceptNearby}
                          acceptingId={acceptingId}
                          index={i}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

          </div>
        </div>
      </Navbar>
    </>
  );
}