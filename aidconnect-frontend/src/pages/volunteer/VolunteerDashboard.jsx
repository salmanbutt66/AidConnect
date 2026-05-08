import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar.jsx';
import StatsCard from '../../components/dashboard/StatsCard.jsx';
import Badge from '../../components/common/Badge.jsx';
import Loader from '../../components/common/Loader.jsx';
import NotificationPanel from '../../components/dashboard/NotificationPanel.jsx';
import useAuth from '../../hooks/useAuth.js';
import {
  getMyVolunteerProfile,
  getVolunteerStats,
  toggleAvailability,
  getActiveRequest,
} from '../../api/volunteer.api.js';
import { getNearbyRequests } from '../../api/request.api.js';
import { formatScore, formatTimeAgo } from '../../utils/formatters.js';
import { EMERGENCY_TYPES } from '../../utils/constants.js';
const unwrapActive = (res) => res?.activeRequest ?? null;
const unwrapNearby = (res) => ({
  requests: Array.isArray(res?.data) ? res.data : [],
  total:    res?.pagination?.total ?? 0,
  city:     res?.pagination?.city  ?? '',
});
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .vd-root * { font-family: 'Plus Jakarta Sans', sans-serif; }

  @keyframes vdFadeSlide {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes vdScaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to   { opacity: 1; transform: scale(1);    }
  }
  @keyframes vdPulseGreen {
    0%, 100% { box-shadow: 0 0 0 0   rgba(34,148,80,0.4); }
    50%       { box-shadow: 0 0 0 10px rgba(34,148,80,0);  }
  }
  @keyframes vdPulseRed {
    0%, 100% { box-shadow: 0 0 0 0   rgba(239,68,68,0.4); }
    50%       { box-shadow: 0 0 0 8px rgba(239,68,68,0);   }
  }
  @keyframes vdBarFill {
    from { width: 0%; }
  }
  @keyframes vdSpinRing {
    to { transform: rotate(360deg); }
  }
  @keyframes vdSlideRight {
    from { transform: translateX(-6px); opacity: 0; }
    to   { transform: translateX(0);    opacity: 1; }
  }

  
  .vd-page-header {
    margin-bottom: 28px;
    animation: vdFadeSlide 0.4s ease both;
  }
  .vd-page-header h1 {
    font-size: 24px; font-weight: 800;
    color: var(--text-dark, #141b11);
    letter-spacing: -0.6px; margin: 0 0 4px;
  }
  .vd-page-header p {
    font-size: 14px; color: var(--text-muted, #6b7a64); margin: 0;
  }

  
  .vd-alert {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 14px 18px; border-radius: 14px;
    font-size: 13px; font-weight: 500; line-height: 1.6;
    margin-bottom: 16px; border: 1px solid;
    animation: vdScaleIn 0.3s ease both;
  }
  .vd-alert.error   { background: #fef2f2; border-color: #fca5a5; color: #b91c1c; }
  .vd-alert.warning { background: #fffbeb; border-color: #fcd34d; color: #92400e; }
  .vd-alert-icon { width: 18px; height: 18px; flex-shrink: 0; margin-top: 1px; }

  
  .vd-active-banner {
    display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
    padding: 18px 22px;
    background: linear-gradient(135deg, #fff5f5, #fff);
    border: 1.5px solid #fca5a5;
    border-radius: 16px; margin-bottom: 24px;
    animation: vdScaleIn 0.35s ease both;
    box-shadow: 0 4px 20px rgba(239,68,68,0.1);
  }
  .vd-active-icon {
    width: 48px; height: 48px; flex-shrink: 0;
    background: rgba(239,68,68,0.1);
    border-radius: 14px; display: flex;
    align-items: center; justify-content: center;
    animation: vdPulseRed 2.5s ease-in-out infinite;
  }
  .vd-active-icon svg { width: 22px; height: 22px; color: #dc2626; }
  .vd-active-title { font-weight: 700; font-size: 14px; color: #7f1d1d; margin-bottom: 6px; }
  .vd-active-btn {
    flex-shrink: 0;
    padding: 9px 18px; border-radius: 10px;
    background: #dc2626; color: #fff;
    border: none; cursor: pointer;
    font-size: 13px; font-weight: 700;
    font-family: 'Plus Jakarta Sans', sans-serif;
    display: flex; align-items: center; gap: 6px;
    transition: all 0.2s ease;
    box-shadow: 0 4px 12px rgba(220,38,38,0.3);
  }
  .vd-active-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(220,38,38,0.35); }
  .vd-active-btn svg { width: 14px; height: 14px; }

  
  .vd-stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px; margin-bottom: 28px;
  }
  @media (max-width: 900px) { .vd-stats-grid { grid-template-columns: repeat(2,1fr); } }
  @media (max-width: 520px) { .vd-stats-grid { grid-template-columns: 1fr; } }

  
  .vd-main-grid {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 24px; align-items: start;
  }
  @media (max-width: 860px) { .vd-main-grid { grid-template-columns: 1fr; } }

  
  .vd-card {
    background: #fff; border-radius: 18px;
    border: 1px solid #e8eee8;
    box-shadow: 0 2px 16px rgba(13,61,34,0.06);
    overflow: hidden;
    animation: vdFadeSlide 0.45s ease both;
  }
  .vd-card-header {
    display: flex; align-items: flex-start; justify-content: space-between;
    padding: 20px 22px 12px; gap: 12px;
  }
  .vd-card-body { padding: 20px 22px; }
  .vd-section-title {
    font-size: 14px; font-weight: 700; color: var(--text-dark,#141b11); margin-bottom: 2px;
    display: flex; align-items: center; gap: 8px;
  }
  .vd-section-title svg { width: 15px; height: 15px; color: var(--green-600,#229450); }
  .vd-section-sub { font-size: 12px; color: var(--text-muted,#6b7a64); }

  
  .vd-avail-card {
    background: #fff; border-radius: 18px;
    border: 2px solid var(--stone-200, #e5e7e3);
    box-shadow: 0 2px 16px rgba(13,61,34,0.06);
    padding: 22px; text-align: center;
    animation: vdFadeSlide 0.45s ease both;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
  }
  .vd-avail-card.available {
    border-color: var(--green-300,#7dd49a);
    box-shadow: 0 4px 20px rgba(34,148,80,0.12);
  }
  .vd-avail-label {
    font-size: 11px; font-weight: 700; color: var(--text-muted,#6b7a64);
    text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 14px;
  }
  .vd-avail-dot-wrap {
    display: flex; align-items: center; justify-content: center;
    gap: 10px; margin-bottom: 16px;
  }
  .vd-avail-dot {
    width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0;
  }
  .vd-avail-dot.green { background: #22c55e; animation: vdPulseGreen 2s ease-in-out infinite; }
  .vd-avail-dot.stone { background: #9ca3af; }
  .vd-avail-status { font-size: 16px; font-weight: 800; letter-spacing: -0.3px; }
  .vd-avail-status.green { color: var(--green-700,#1e7d46); }
  .vd-avail-status.stone { color: var(--text-muted,#6b7a64); }
  .vd-avail-btn {
    width: 100%; padding: 11px; border-radius: 12px; border: none;
    font-size: 13px; font-weight: 700; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: all 0.22s ease;
  }
  .vd-avail-btn.go-unavail {
    background: #fef2f2; color: #dc2626; border: 1.5px solid #fca5a5;
  }
  .vd-avail-btn.go-unavail:hover:not(:disabled) {
    background: #dc2626; color: #fff;
    box-shadow: 0 4px 14px rgba(220,38,38,0.3);
  }
  .vd-avail-btn.go-avail {
    background: linear-gradient(135deg, #1a6b3c, #229450);
    color: #fff; box-shadow: 0 4px 14px rgba(26,107,60,0.25);
  }
  .vd-avail-btn.go-avail:hover:not(:disabled) {
    transform: translateY(-2px); box-shadow: 0 8px 22px rgba(26,107,60,0.35);
  }
  .vd-avail-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .vd-avail-note { font-size: 11px; color: var(--text-muted,#6b7a64); margin-top: 8px; }
  .vd-avail-note.danger { color: #dc2626; }
  .vd-avail-btn svg { width: 14px; height: 14px; }

  
  .vd-rep-card {
    background: #fff; border-radius: 18px;
    border: 1px solid #e8eee8;
    box-shadow: 0 2px 16px rgba(13,61,34,0.06);
    padding: 22px;
    animation: vdFadeSlide 0.45s ease both;
  }
  .vd-rep-score { font-size: 36px; font-weight: 800; color: var(--text-dark,#141b11); letter-spacing: -2px; line-height: 1; }
  .vd-rep-bar-track {
    height: 8px; background: #e8eee8; border-radius: 99px; overflow: hidden; margin: 10px 0 6px;
  }
  .vd-rep-bar-fill {
    height: 100%; border-radius: 99px;
    animation: vdBarFill 0.8s cubic-bezier(0.34,1.56,0.64,1) both;
    animation-delay: 0.3s;
    transition: width 0.6s ease;
  }
  .vd-rep-note { font-size: 11px; color: var(--text-muted,#6b7a64); line-height: 1.5; }

  
  .vd-chip {
    padding: 5px 13px; border-radius: 99px;
    border: 1.5px solid var(--stone-300,#d1d5cf);
    background: #fff; color: var(--text-muted,#6b7a64);
    font-size: 12px; font-weight: 600; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: all 0.18s ease;
    display: inline-flex; align-items: center; gap: 4px;
  }
  .vd-chip:hover { border-color: var(--green-400,#4ade80); color: var(--green-700,#1e7d46); }
  .vd-chip.active {
    border-color: var(--green-600,#229450);
    background: var(--green-50,#f2fbf6);
    color: var(--green-800,#1a6b3c);
    box-shadow: 0 2px 8px rgba(34,148,80,0.12);
  }

  
  .vd-req-card {
    background: #fff; border-radius: 14px;
    border: 1px solid #e8eee8;
    border-left: 4px solid var(--stone-300, #d1d5cf);
    cursor: pointer; overflow: hidden;
    transition: all 0.22s ease;
    animation: vdSlideRight 0.35s ease both;
  }
  .vd-req-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 28px rgba(13,61,34,0.1);
    border-color: var(--green-200,#a7f3c0);
    border-left-color: inherit;
  }
  .vd-req-inner { padding: 14px 16px; display: flex; align-items: flex-start; gap: 12px; }
  .vd-req-icon {
    width: 42px; height: 42px; flex-shrink: 0; border-radius: 12px;
    background: var(--green-50,#f2fbf6);
    display: flex; align-items: center; justify-content: center;
  }
  .vd-req-icon svg { width: 20px; height: 20px; }
  .vd-req-title { font-weight: 700; font-size: 14px; color: var(--text-dark,#141b11); }
  .vd-req-urg {
    display: inline-flex; align-items: center;
    padding: 2px 9px; border-radius: 99px;
    font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.5px;
  }
  .vd-req-desc {
    font-size: 13px; color: var(--text-muted,#6b7a64); line-height: 1.5; margin: 4px 0 8px;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  .vd-req-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .vd-req-meta-item {
    display: flex; align-items: center; gap: 4px;
    font-size: 12px; color: var(--text-muted,#6b7a64);
  }
  .vd-req-meta-item svg { width: 12px; height: 12px; }
  .vd-req-chevron { color: var(--text-light,#aab5a5); flex-shrink: 0; align-self: center; }
  .vd-req-chevron svg { width: 16px; height: 16px; }

  
  .vd-perf-bar { margin-bottom: 16px; }
  .vd-perf-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
  .vd-perf-label { font-size: 13px; color: var(--text-muted,#6b7a64); display: flex; align-items: center; gap: 6px; }
  .vd-perf-label svg { width: 12px; height: 12px; }
  .vd-perf-val { font-size: 13px; font-weight: 700; color: var(--text-dark,#141b11); }
  .vd-perf-track { height: 7px; background: #e8eee8; border-radius: 99px; overflow: hidden; }
  .vd-perf-fill {
    height: 100%; border-radius: 99px;
    animation: vdBarFill 0.8s cubic-bezier(0.34,1.56,0.64,1) both;
    animation-delay: 0.2s;
  }

  
  .vd-perf-stats { display: flex; justify-content: space-around; padding-top: 20px; border-top: 1px solid #e8eee8; }
  .vd-perf-stat  { text-align: center; }
  .vd-perf-stat-num { font-size: 20px; font-weight: 800; color: var(--text-dark,#141b11); letter-spacing: -0.5px; }
  .vd-perf-stat-lbl { font-size: 11px; color: var(--text-muted,#6b7a64); margin-top: 2px; font-weight: 600; }

  
  .vd-quick-btn {
    display: flex; align-items: center; gap: 14px;
    padding: 14px 16px; background: #fff;
    border: 1.5px solid #e8eee8; border-radius: 14px;
    cursor: pointer; text-align: left; width: 100%;
    transition: all 0.22s ease;
    font-family: 'Plus Jakarta Sans', sans-serif;
    animation: vdFadeSlide 0.4s ease both;
  }
  .vd-quick-btn:hover {
    border-color: var(--green-300,#7dd49a);
    box-shadow: 0 6px 22px rgba(13,61,34,0.1);
    transform: translateY(-3px);
  }
  .vd-quick-icon {
    width: 42px; height: 42px; border-radius: 12px;
    background: var(--green-50,#f2fbf6);
    border: 1px solid var(--green-100,#e0f5e9);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: background 0.2s ease;
  }
  .vd-quick-btn:hover .vd-quick-icon { background: var(--green-100,#e0f5e9); }
  .vd-quick-icon svg { width: 18px; height: 18px; color: var(--green-700,#1e7d46); }
  .vd-quick-title { font-size: 14px; font-weight: 700; color: var(--green-800,#1a6b3c); margin-bottom: 2px; }
  .vd-quick-desc  { font-size: 12px; color: var(--text-muted,#6b7a64); }
  .vd-quick-arrow { margin-left: auto; flex-shrink: 0; }
  .vd-quick-arrow svg { width: 16px; height: 16px; color: var(--text-light,#aab5a5); transition: transform 0.2s ease; }
  .vd-quick-btn:hover .vd-quick-arrow svg { transform: translateX(3px); color: var(--green-600,#229450); }

  
  .vd-empty {
    padding: 32px 20px; text-align: center;
  }
  .vd-empty-icon {
    width: 52px; height: 52px; border-radius: 16px;
    background: var(--green-50,#f2fbf6);
    border: 1px solid var(--green-100,#e0f5e9);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 12px;
  }
  .vd-empty-icon svg { width: 24px; height: 24px; color: var(--green-600,#229450); }
  .vd-empty p { font-size: 13px; color: var(--text-muted,#6b7a64); margin: 0; line-height: 1.6; }

  
  .vd-refresh-btn {
    padding: 7px 14px; border-radius: 10px;
    border: 1.5px solid #e8eee8; background: #fff;
    font-size: 12px; font-weight: 600; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: var(--text-muted,#6b7a64);
    display: flex; align-items: center; gap: 6px;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }
  .vd-refresh-btn:hover { border-color: var(--green-300,#7dd49a); color: var(--green-700,#1e7d46); }
  .vd-refresh-btn svg { width: 13px; height: 13px; }

  
  .vd-view-all {
    padding: 8px 16px; border-radius: 10px;
    border: 1.5px solid #e8eee8; background: #fff;
    font-size: 12px; font-weight: 600; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: var(--green-700,#1e7d46);
    display: inline-flex; align-items: center; gap: 6px;
    transition: all 0.2s ease;
  }
  .vd-view-all:hover { background: var(--green-50,#f2fbf6); border-color: var(--green-300,#7dd49a); }
  .vd-view-all svg { width: 13px; height: 13px; }

  
  .vd-spinner {
    display: inline-block; width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,0.35);
    border-top-color: #fff; border-radius: 50%;
    animation: vdSpinRing 0.7s linear infinite;
    vertical-align: middle;
  }
  .vd-spinner.dark {
    border-color: rgba(26,107,60,0.25);
    border-top-color: var(--green-700,#1e7d46);
  }

  
  .vd-blood-badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 8px; border-radius: 99px;
    background: rgba(220,38,38,0.1); color: #dc2626;
    font-size: 10px; font-weight: 700;
  }
  .vd-blood-badge svg { width: 10px; height: 10px; }

  
  .vd-d0 { animation-delay: 0.0s; }
  .vd-d1 { animation-delay: 0.08s; }
  .vd-d2 { animation-delay: 0.16s; }
  .vd-d3 { animation-delay: 0.24s; }
  .vd-d4 { animation-delay: 0.32s; }
`;
const Icons = {
  Siren: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4M4.93 4.93l2.83 2.83M2 12h4M4.93 19.07l2.83-2.83M12 22v-4M19.07 19.07l-2.83-2.83M22 12h-4M19.07 4.93l-2.83 2.83"/>
      <circle cx="12" cy="12" r="4"/>
    </svg>
  ),
  Arrow: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  ),
  Chevron: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6"/>
    </svg>
  ),
  Refresh: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  ),
  MapPin: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Drop: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
    </svg>
  ),
  AlertCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  AlertTriangle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Ban: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
    </svg>
  ),
  Hourglass: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
    </svg>
  ),
  Star: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  Award: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
    </svg>
  ),
  Zap: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  Activity: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  List: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
      <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  ),
  User: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  ),
  ToggleOn: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="5" width="22" height="14" rx="7"/>
      <circle cx="16" cy="12" r="3" fill="currentColor" stroke="none"/>
    </svg>
  ),
  ToggleOff: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="5" width="22" height="14" rx="7"/>
      <circle cx="8" cy="12" r="3" fill="currentColor" stroke="none"/>
    </svg>
  ),
  Heart: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  Ambulance: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 17H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3"/>
      <rect x="14" y="11" width="8" height="10" rx="1"/><circle cx="7" cy="20" r="1"/><circle cx="17" cy="20" r="1"/>
      <path d="M18 11v4M16 13h4"/>
    </svg>
  ),
  Car: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-2"/>
      <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
    </svg>
  ),
  Waves: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
      <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
      <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
    </svg>
  ),
  HelpCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  BarChart: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6"  y1="20" x2="6"  y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  XCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
};
const EMERGENCY_META = {
  medical:  { Icon: Icons.Ambulance, color: '#2563eb', bg: '#eff6ff' },
  blood:    { Icon: Icons.Drop,      color: '#dc2626', bg: '#fef2f2' },
  accident: { Icon: Icons.Car,       color: '#d97706', bg: '#fffbeb' },
  disaster: { Icon: Icons.Waves,     color: '#7c3aed', bg: '#f5f3ff' },
  other:    { Icon: Icons.HelpCircle,color: '#6b7a64', bg: '#f2fbf6' },
};

const URGENCY_COLOR = {
  critical: '#dc2626', high: '#d97706', medium: '#2563eb', low: '#229450',
};
function AvailabilityCard({ isAvailable, isApproved, isSuspended, toggling, onToggle }) {
  return (
    <div className={`vd-avail-card${isAvailable ? ' available' : ''}`}>
      <div className="vd-avail-label">Availability Status</div>
      <div className="vd-avail-dot-wrap">
        <div className={`vd-avail-dot ${isAvailable ? 'green' : 'stone'}`} />
        <span className={`vd-avail-status ${isAvailable ? 'green' : 'stone'}`}>
          {isAvailable ? 'Available' : 'Unavailable'}
        </span>
      </div>
      <button
        onClick={onToggle}
        disabled={toggling || !isApproved || isSuspended}
        className={`vd-avail-btn ${isAvailable ? 'go-unavail' : 'go-avail'}`}
      >
        {toggling
          ? <><span className={`vd-spinner${isAvailable ? ' dark' : ''}`} /> Updating…</>
          : isAvailable
            ? <><Icons.ToggleOff /> Go Unavailable</>
            : <><Icons.ToggleOn  /> Go Available</>
        }
      </button>
      {!isApproved && !isSuspended && (
        <div className="vd-avail-note">Awaiting admin approval</div>
      )}
      {isSuspended && (
        <div className="vd-avail-note danger">Account suspended</div>
      )}
    </div>
  );
}
function PerformanceBar({ label, value, color, Icon: BarIcon }) {
  return (
    <div className="vd-perf-bar">
      <div className="vd-perf-row">
        <span className="vd-perf-label">
          {BarIcon && <BarIcon />}{label}
        </span>
        <span className="vd-perf-val">{value}%</span>
      </div>
      <div className="vd-perf-track">
        <div className="vd-perf-fill" style={{ width: `${Math.min(value, 100)}%`, background: color }} />
      </div>
    </div>
  );
}
function ActiveRequestBanner({ request, onView }) {
  return (
    <div className="vd-active-banner">
      <div className="vd-active-icon"><Icons.Siren /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="vd-active-title">You have an active request in progress</div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <Badge urgency={request.urgencyLevel} />
          <Badge color="blue">{request.emergencyType?.replace('_', ' ')}</Badge>
        </div>
      </div>
      <button className="vd-active-btn" onClick={onView}>
        <Icons.Arrow /> View Request
      </button>
    </div>
  );
}
function IncomingRequestCard({ request, onView, delay = 0 }) {
  const meta   = EMERGENCY_META[request.emergencyType] || EMERGENCY_META.other;
  const uColor = URGENCY_COLOR[request.urgencyLevel] || '#6b7a64';
  const EIcon  = meta.Icon;

  return (
    <div
      className="vd-req-card"
      style={{ borderLeftColor: uColor, animationDelay: `${delay}ms` }}
      onClick={() => onView(request._id)}
    >
      <div className="vd-req-inner">
        <div className="vd-req-icon" style={{ background: meta.bg }}>
          <EIcon />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <span className="vd-req-title" style={{ textTransform: 'capitalize' }}>
              {request.emergencyType?.replace('_', ' ')} Emergency
            </span>
            <span
              className="vd-req-urg"
              style={{ background: uColor + '18', color: uColor }}
            >
              {request.urgencyLevel}
            </span>
            {request.bloodGroupNeeded && (
              <span className="vd-blood-badge">
                <Icons.Drop /> {request.bloodGroupNeeded}
              </span>
            )}
          </div>
          <div className="vd-req-desc">{request.description}</div>
          <div className="vd-req-meta">
            {request.city && (
              <span className="vd-req-meta-item">
                <Icons.MapPin />{request.city}{request.address ? ` · ${request.address}` : ''}
              </span>
            )}
            <span className="vd-req-meta-item">
              <Icons.Clock />{formatTimeAgo(request.postedAt || request.createdAt)}
            </span>
          </div>
        </div>
        <div className="vd-req-chevron"><Icons.Chevron /></div>
      </div>
    </div>
  );
}
export default function VolunteerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile,        setProfile]        = useState(null);
  const [stats,          setStats]          = useState(null);
  const [activeRequest,  setActiveRequest]  = useState(null);
  const [nearbyRequests, setNearbyRequests] = useState([]);
  const [requestsCity,   setRequestsCity]   = useState('');
  const [requestsTotal,  setRequestsTotal]  = useState(0);
  const [filterType,     setFilterType]     = useState('');
  const [loading,        setLoading]        = useState(true);
  const [toggling,       setToggling]       = useState(false);
  const [error,          setError]          = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, statsRes, activeRes, nearbyRes] = await Promise.allSettled([
          getMyVolunteerProfile(),
          getVolunteerStats(),
          getActiveRequest(),
          getNearbyRequests({ limit: 5 }),
        ]);
        if (profileRes.status === 'fulfilled') setProfile(profileRes.value.profile);
        if (statsRes.status   === 'fulfilled') setStats(statsRes.value.stats);
        if (activeRes.status  === 'fulfilled') setActiveRequest(unwrapActive(activeRes.value));
        if (nearbyRes.status  === 'fulfilled') {
          const { requests, total, city } = unwrapNearby(nearbyRes.value);
          setNearbyRequests(requests);
          setRequestsTotal(total);
          setRequestsCity(city);
        }
        if (
          profileRes.status === 'rejected' &&
          statsRes.status   === 'rejected' &&
          activeRes.status  === 'rejected'
        ) setError('Failed to load dashboard data. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const refreshRequests = useCallback(async (type) => {
    try {
      const params = { limit: 5 };
      if (type) params.emergencyType = type;
      const data = await getNearbyRequests(params);
      const { requests, total, city } = unwrapNearby(data);
      setNearbyRequests(requests);
      setRequestsTotal(total);
      if (city) setRequestsCity(city);
    } catch {  }
  }, []);

  const handleFilterChange = (type) => {
    setFilterType(type);
    refreshRequests(type);
  };

  const handleToggleAvailability = useCallback(async () => {
    setToggling(true);
    setError('');
    try {
      const res = await toggleAvailability();
      setProfile((prev) => ({ ...prev, isAvailable: res.isAvailable }));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update availability.');
    } finally {
      setToggling(false);
    }
  }, []);

  const handleViewRequest = (requestId) => navigate(`/volunteer/active-request?requestId=${requestId}`);

  const isAvailable     = profile?.isAvailable;
  const isApproved      = profile?.isApproved;
  const isSuspended     = profile?.isSuspended;
  const reputationScore = stats?.reputationScore ?? 0;
  const scoreMeta       = formatScore(reputationScore);
  const firstName       = user?.name?.split(' ')[0] || 'there';

  const repBarColor = reputationScore >= 70
    ? 'linear-gradient(90deg,#22c55e,#16a34a)'
    : reputationScore >= 40
      ? 'linear-gradient(90deg,#f59e0b,#d97706)'
      : 'linear-gradient(90deg,#ef4444,#dc2626)';

  return (
    <Navbar title="Dashboard">
      <style>{STYLES}</style>
      <div className="page-wrapper vd-root">
<div className="vd-page-header">
          <h1>Welcome back, {firstName}</h1>
          <p>Your volunteer activity and performance overview.</p>
        </div>

        {loading && <Loader variant="skeleton" count={3} />}

        {!loading && (
          <>
{error && (
              <div className="vd-alert error">
                <span className="vd-alert-icon"><Icons.AlertCircle /></span>
                <div style={{ flex: 1 }}>{error}</div>
                <button
                  onClick={() => setError('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c', fontWeight: 700, padding: 0 }}
                >
                  <Icons.XCircle />
                </button>
              </div>
            )}
{!isApproved && (
              <div className="vd-alert warning">
                <span className="vd-alert-icon"><Icons.Hourglass /></span>
                <div>
                  <strong>Pending Approval</strong> — Your volunteer profile is awaiting admin review. You'll be notified once approved.
                </div>
              </div>
            )}
{isSuspended && (
              <div className="vd-alert error">
                <span className="vd-alert-icon"><Icons.Ban /></span>
                <div>
                  <strong>Account Suspended</strong> —{' '}
                  {profile?.suspendedReason || 'Please contact the admin for details.'}
                </div>
              </div>
            )}
{activeRequest && (
              <ActiveRequestBanner
                request={activeRequest}
                onView={() => navigate('/volunteer/active-request')}
              />
            )}
<div className="vd-stats-grid">
              <StatsCard label="Completed"       value={stats?.totalCompleted ?? 0}                                  icon="check" color="green" sub="Total resolved"                    delay={0}   />
              <StatsCard label="Acceptance Rate" value={stats?.acceptanceRate ?? 0}                                  icon="zap"   color="blue"  format="percent"                        delay={100} />
              <StatsCard label="Avg Rating"      value={stats?.averageRating ? Number(stats.averageRating).toFixed(1) : '—'} icon="star" color="orange" format="raw" sub={`${stats?.totalRatings ?? 0} ratings`} delay={200} />
              <StatsCard label="Reputation"      value={reputationScore}                                             icon="award" color="green" sub={scoreMeta.label}                   delay={300} />
            </div>
<div className="vd-main-grid">
<div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
<div className="vd-card vd-d1">
                  <div className="vd-card-header">
                    <div>
                      <div className="vd-section-title">
                        <Icons.List />
                        Requests in Your City
                        {requestsCity && (
                          <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Icons.MapPin />{requestsCity}
                          </span>
                        )}
                      </div>
                      <div className="vd-section-sub">
                        {requestsTotal > 0
                          ? `${requestsTotal} open request${requestsTotal !== 1 ? 's' : ''} awaiting response`
                          : 'No open requests in your city right now'}
                      </div>
                    </div>
                    <button className="vd-refresh-btn" onClick={() => refreshRequests(filterType)}>
                      <Icons.Refresh /> Refresh
                    </button>
                  </div>
<div style={{ padding: '0 20px 14px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button className={`vd-chip${filterType === '' ? ' active' : ''}`} onClick={() => handleFilterChange('')}>All</button>
                    {EMERGENCY_TYPES.map((t) => (
                      <button
                        key={t.value}
                        className={`vd-chip${filterType === t.value ? ' active' : ''}`}
                        onClick={() => handleFilterChange(t.value)}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
<div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {!isApproved ? (
                      <div className="vd-empty">
                        <div className="vd-empty-icon"><Icons.Hourglass /></div>
                        <p>Requests will appear here once your account is approved by an admin.</p>
                      </div>
                    ) : nearbyRequests.length === 0 ? (
                      <div className="vd-empty">
                        <div className="vd-empty-icon"><Icons.CheckCircle /></div>
                        <p>
                          No open requests in your city right now.
                          {!profile?.serviceArea?.city && (
                            <span> Set your city in{' '}
                              <button
                                onClick={() => navigate('/volunteer/profile')}
                                style={{ background: 'none', border: 'none', color: 'var(--green-700)', fontWeight: 700, cursor: 'pointer', padding: 0, textDecoration: 'underline', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                              >your profile</button>.
                            </span>
                          )}
                        </p>
                      </div>
                    ) : (
                      nearbyRequests.map((req, i) => (
                        <IncomingRequestCard
                          key={req._id}
                          request={req}
                          onView={handleViewRequest}
                          delay={i * 60}
                        />
                      ))
                    )}
                  </div>

                  {nearbyRequests.length > 0 && (
                    <div style={{ padding: '0 16px 18px', textAlign: 'center' }}>
                      <button className="vd-view-all" onClick={() => navigate('/volunteer/active-request')}>
                        View all {requestsTotal} requests <Icons.Chevron />
                      </button>
                    </div>
                  )}
                </div>
<div className="vd-card vd-d2">
                  <div className="vd-card-header">
                    <div>
                      <div className="vd-section-title"><Icons.BarChart />Performance Summary</div>
                      <div className="vd-section-sub">Your response metrics</div>
                    </div>
                  </div>
                  <div className="vd-card-body" style={{ paddingTop: '8px' }}>
                    <PerformanceBar label="Acceptance Rate"   value={stats?.acceptanceRate  ?? 0} color="#2563eb"  Icon={Icons.Zap}         />
                    <PerformanceBar label="Completion Rate"   value={stats?.completionRate  ?? 0} color="#16a34a"  Icon={Icons.CheckCircle} />
                    <PerformanceBar label="Cancellation Rate" value={stats?.cancellationRate ?? 0} color="#dc2626" Icon={Icons.XCircle}     />

                    <div className="vd-perf-stats">
                      {[
                        { label: 'Assigned',    value: stats?.totalAssigned   ?? 0 },
                        { label: 'Accepted',    value: stats?.totalAccepted   ?? 0 },
                        { label: 'Completed',   value: stats?.totalCompleted  ?? 0 },
                        { label: 'Cancelled',   value: stats?.totalCancelled  ?? 0 },
                        { label: 'No Response', value: stats?.totalNoResponse ?? 0 },
                      ].map(({ label, value }) => (
                        <div className="vd-perf-stat" key={label}>
                          <div className="vd-perf-stat-num">{value}</div>
                          <div className="vd-perf-stat-lbl">{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
<div className="vd-card vd-d3">
                  <div className="vd-card-header">
                    <div className="vd-section-title"><Icons.Zap />Quick Actions</div>
                  </div>
                  <div className="vd-card-body" style={{ paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      { Icon: Icons.Siren,    label: 'View Active Request', desc: 'Check and manage your current assignment', to: '/volunteer/active-request', delay: '0.0s' },
                      { Icon: Icons.List,     label: 'Request History',     desc: 'Browse your past responses and ratings',   to: '/volunteer/history',        delay: '0.06s' },
                      { Icon: Icons.User,     label: 'Edit Profile',        desc: 'Update your skills and service area',      to: '/volunteer/profile',        delay: '0.12s' },
                    ].map((action) => (
                      <button
                        key={action.to}
                        className="vd-quick-btn"
                        style={{ animationDelay: action.delay }}
                        onClick={() => navigate(action.to)}
                      >
                        <div className="vd-quick-icon"><action.Icon /></div>
                        <div>
                          <div className="vd-quick-title">{action.label}</div>
                          <div className="vd-quick-desc">{action.desc}</div>
                        </div>
                        <div className="vd-quick-arrow"><Icons.Chevron /></div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
<div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                <div className="vd-d1">
                  <AvailabilityCard
                    isAvailable={isAvailable}
                    isApproved={isApproved}
                    isSuspended={isSuspended}
                    toggling={toggling}
                    onToggle={handleToggleAvailability}
                  />
                </div>
<div className="vd-rep-card vd-d2">
                  <div className="vd-section-title" style={{ marginBottom: '14px' }}>
                    <Icons.Award />Reputation Score
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                    <div className="vd-rep-score">{reputationScore}</div>
                    <span className="badge badge-green">{scoreMeta.label}</span>
                  </div>
                  <div className="vd-rep-bar-track">
                    <div
                      className="vd-rep-bar-fill"
                      style={{ width: `${reputationScore}%`, background: repBarColor }}
                    />
                  </div>
                  <div className="vd-rep-note">
                    Out of 100 — based on response rate, completion &amp; ratings
                  </div>
                </div>
<div className="vd-d3">
                  <NotificationPanel limit={5} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Navbar>
  );
}