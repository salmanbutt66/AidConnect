// src/pages/volunteer/ActiveRequest.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/common/Navbar.jsx';
import Badge from '../../components/common/Badge.jsx';
import Modal from '../../components/common/Modal.jsx';
import Loader from '../../components/common/Loader.jsx';
import useAuth from '../../hooks/useAuth.js';
import {
  getActiveRequest,
  acceptRequest as acceptVolunteerRequest,
  markInProgress,
  completeRequest,
  cancelRequest,
} from '../../api/volunteer.api.js';
import { getRequestById, getNearbyRequests } from '../../api/request.api.js';
import {
  formatTimeAgo,
  formatEmergencyType,
} from '../../utils/formatters.js';

// ─── Injected styles ──────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .ar-root * { font-family: 'Plus Jakarta Sans', sans-serif; }

  @keyframes arFadeSlide {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes arScaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes arPulseRed {
    0%,100% { box-shadow: 0 0 0 0   rgba(239,68,68,0.45); }
    50%      { box-shadow: 0 0 0 10px rgba(239,68,68,0); }
  }
  @keyframes arPulseGreen {
    0%,100% { box-shadow: 0 0 0 0   rgba(34,148,80,0.4); }
    50%      { box-shadow: 0 0 0 8px rgba(34,148,80,0); }
  }
  @keyframes arSpin {
    to { transform: rotate(360deg); }
  }
  @keyframes arBarFill {
    from { width: 0%; }
  }
  @keyframes arSlideRight {
    from { opacity: 0; transform: translateX(-8px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes arBounce {
    0%,100% { transform: translateY(0); }
    50%      { transform: translateY(-4px); }
  }

  /* Page header */
  .ar-page-header { margin-bottom: 28px; animation: arFadeSlide 0.4s ease both; }
  .ar-back-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 10px;
    border: 1.5px solid #e8eee8; background: #fff;
    font-size: 13px; font-weight: 600; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: var(--text-muted,#6b7a64);
    transition: all 0.2s ease; margin-bottom: 14px;
  }
  .ar-back-btn:hover { border-color: var(--green-300,#7dd49a); color: var(--green-700,#1e7d46); }
  .ar-back-btn svg { width: 14px; height: 14px; }
  .ar-page-header h1 { font-size: 24px; font-weight: 800; color: var(--text-dark,#141b11); letter-spacing: -0.6px; margin: 0 0 4px; }
  .ar-page-header p  { font-size: 14px; color: var(--text-muted,#6b7a64); margin: 0; }

  /* Alert */
  .ar-alert {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 14px 18px; border-radius: 14px; font-size: 13px;
    font-weight: 500; line-height: 1.6; margin-bottom: 20px;
    border: 1px solid; animation: arScaleIn 0.3s ease both;
  }
  .ar-alert.error   { background:#fef2f2; border-color:#fca5a5; color:#b91c1c; }
  .ar-alert.success { background:#f0fdf4; border-color:#86efac; color:#15803d; }
  .ar-alert.warning { background:#fffbeb; border-color:#fcd34d; color:#92400e; }
  .ar-alert-icon { width:18px; height:18px; flex-shrink:0; margin-top:1px; }

  /* Card */
  .ar-card {
    background:#fff; border-radius:18px;
    border:1px solid #e8eee8;
    box-shadow:0 2px 16px rgba(13,61,34,0.06);
    overflow:hidden; animation: arFadeSlide 0.45s ease both;
  }
  .ar-card-header { display:flex; align-items:flex-start; justify-content:space-between; padding:20px 22px 12px; gap:12px; }
  .ar-card-body   { padding:20px 22px; }
  .ar-section-title {
    font-size:14px; font-weight:700; color:var(--text-dark,#141b11);
    display:flex; align-items:center; gap:8px;
  }
  .ar-section-title svg { width:15px; height:15px; color:var(--green-600,#229450); }

  /* Info row */
  .ar-info-row {
    display:flex; align-items:flex-start; gap:14px;
    padding:12px 0; border-bottom:1px solid #f0f5f0;
    transition: background 0.18s;
  }
  .ar-info-row:last-child { border-bottom:none; }
  .ar-info-row:hover { background:var(--green-50,#f2fbf6); border-radius:8px; padding-left:8px; padding-right:8px; margin:0 -8px; }
  .ar-info-icon {
    width:34px; height:34px; flex-shrink:0; border-radius:10px;
    background:var(--green-50,#f2fbf6); border:1px solid var(--green-100,#e0f5e9);
    display:flex; align-items:center; justify-content:center;
  }
  .ar-info-icon svg { width:15px; height:15px; color:var(--green-700,#1e7d46); }
  .ar-info-lbl { font-size:11px; font-weight:600; color:var(--text-muted,#6b7a64); text-transform:uppercase; letter-spacing:0.4px; margin-bottom:3px; }
  .ar-info-val { font-size:14px; color:var(--text-dark,#141b11); font-weight:500; line-height:1.5; }

  /* Timeline */
  .ar-timeline { display:flex; align-items:flex-start; position:relative; }
  .ar-timeline-line {
    position:absolute; top:17px; left:16%; right:16%;
    height:2px; background:#e8eee8; z-index:0;
  }
  .ar-tl-step { display:flex; flex-direction:column; align-items:center; flex:1; }
  .ar-tl-circle {
    width:36px; height:36px; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    position:relative; z-index:1; transition:all 0.3s ease;
  }
  .ar-tl-circle.done   { background:var(--green-600,#229450); border:3px solid transparent; }
  .ar-tl-circle.active { background:var(--green-800,#1a6b3c); border:3px solid var(--green-300,#7dd49a); animation:arPulseGreen 2s ease-in-out infinite; }
  .ar-tl-circle.idle   { background:#e8eee8; border:3px solid transparent; }
  .ar-tl-circle svg { width:16px; height:16px; }
  .ar-tl-circle.done   svg { color:#fff; }
  .ar-tl-circle.active svg { color:#fff; }
  .ar-tl-circle.idle   svg { color:#9ca3af; }
  .ar-tl-label {
    font-size:11px; margin-top:7px; text-align:center; white-space:nowrap;
    font-weight:500; color:var(--text-muted,#6b7a64);
  }
  .ar-tl-label.done   { font-weight:700; color:var(--green-700,#1e7d46); }
  .ar-tl-label.active { font-weight:700; color:var(--green-800,#1a6b3c); }

  /* Action buttons */
  .ar-btn {
    flex:1; padding:12px 18px; border-radius:12px; border:none; cursor:pointer;
    font-size:14px; font-weight:700; font-family:'Plus Jakarta Sans',sans-serif;
    display:flex; align-items:center; justify-content:center; gap:8px;
    transition:all 0.22s ease;
  }
  .ar-btn:disabled { opacity:0.65; cursor:not-allowed; }
  .ar-btn.primary {
    background:linear-gradient(135deg,#1a6b3c,#229450); color:#fff;
    box-shadow:0 4px 14px rgba(26,107,60,0.25);
  }
  .ar-btn.primary:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 22px rgba(26,107,60,0.35); }
  .ar-btn.secondary {
    background:var(--green-50,#f2fbf6); color:var(--green-800,#1a6b3c);
    border:1.5px solid var(--green-200,#a7f3c0);
  }
  .ar-btn.secondary:hover:not(:disabled) { background:var(--green-100,#e0f5e9); transform:translateY(-2px); box-shadow:0 4px 12px rgba(26,107,60,0.12); }
  .ar-btn.danger {
    background:#fef2f2; color:#dc2626; border:1.5px solid #fca5a5;
    flex:0 0 auto; padding:12px 20px;
  }
  .ar-btn.danger:hover:not(:disabled) { background:#dc2626; color:#fff; box-shadow:0 4px 14px rgba(220,38,38,0.3); }
  .ar-btn svg { width:15px; height:15px; }

  /* Spinner */
  .ar-spinner {
    display:inline-block; width:14px; height:14px;
    border:2px solid rgba(255,255,255,0.35); border-top-color:#fff;
    border-radius:50%; animation:arSpin 0.7s linear infinite;
  }
  .ar-spinner.dark {
    border-color:rgba(26,107,60,0.25); border-top-color:var(--green-700,#1e7d46);
  }
  .ar-spinner.red {
    border-color:rgba(220,38,38,0.25); border-top-color:#dc2626;
  }

  /* Status card */
  .ar-status-icon {
    width:64px; height:64px; border-radius:20px; margin:0 auto 16px;
    display:flex; align-items:center; justify-content:center;
  }
  .ar-status-icon.red   { background:rgba(239,68,68,0.1); animation:arPulseRed 2.5s ease-in-out infinite; }
  .ar-status-icon.green { background:rgba(34,148,80,0.1); animation:arPulseGreen 2.5s ease-in-out infinite; }
  .ar-status-icon.stone { background:#f3f4f6; }
  .ar-status-icon svg { width:30px; height:30px; }
  .ar-status-icon.red   svg { color:#dc2626; }
  .ar-status-icon.green svg { color:var(--green-600,#229450); }
  .ar-status-icon.stone svg { color:#9ca3af; }

  /* Contact card */
  .ar-avatar {
    width:44px; height:44px; border-radius:14px; flex-shrink:0;
    background:linear-gradient(135deg,var(--green-600,#229450),var(--green-800,#1a6b3c));
    display:flex; align-items:center; justify-content:center;
    font-size:18px; font-weight:800; color:#fff; letter-spacing:-0.5px;
  }
  .ar-call-btn {
    display:flex; align-items:center; justify-content:center; gap:8px;
    width:100%; padding:12px; border-radius:12px;
    background:linear-gradient(135deg,#1a6b3c,#229450); color:#fff;
    text-decoration:none; font-size:14px; font-weight:700;
    font-family:'Plus Jakarta Sans',sans-serif;
    box-shadow:0 4px 14px rgba(26,107,60,0.25);
    transition:all 0.22s ease;
  }
  .ar-call-btn:hover { transform:translateY(-2px); box-shadow:0 8px 22px rgba(26,107,60,0.35); }
  .ar-call-btn svg { width:16px; height:16px; }

  /* Emergency contacts */
  .ar-emergency-card {
    padding:20px;
    background:linear-gradient(135deg,#fff5f5,#fff);
    border:1.5px solid #fca5a5; border-radius:18px;
    box-shadow:0 4px 16px rgba(239,68,68,0.08);
  }
  .ar-emergency-title {
    font-size:11px; font-weight:700; text-transform:uppercase;
    letter-spacing:0.9px; color:#dc2626; margin-bottom:14px;
    display:flex; align-items:center; gap:7px;
  }
  .ar-emergency-title svg { width:13px; height:13px; }
  .ar-contact-row {
    display:flex; justify-content:space-between; align-items:center;
    padding:9px 0; border-bottom:1px solid rgba(220,38,38,0.1);
    text-decoration:none; transition:background 0.18s; border-radius:6px;
  }
  .ar-contact-row:last-child { border-bottom:none; }
  .ar-contact-row:hover { padding-left:6px; padding-right:6px; margin:0 -6px; background:rgba(239,68,68,0.05); }
  .ar-contact-label { font-size:13px; color:var(--text-mid,#3a4a35); font-weight:500; display:flex; align-items:center; gap:7px; }
  .ar-contact-label svg { width:13px; height:13px; color:#dc2626; }
  .ar-contact-num { font-size:16px; font-weight:800; color:#dc2626; letter-spacing:-0.3px; }

  /* Warning notice */
  .ar-warning-notice {
    margin-top:14px; padding:11px 14px;
    background:#fffbeb; border:1px solid #fcd34d; border-radius:10px;
    font-size:12px; color:#92400e; font-weight:500;
    display:flex; align-items:center; gap:8px; line-height:1.5;
  }
  .ar-warning-notice svg { width:14px; height:14px; flex-shrink:0; color:#d97706; }

  /* Empty state */
  .ar-empty-card {
    background:#fff; border-radius:18px; border:1px solid #e8eee8;
    box-shadow:0 2px 16px rgba(13,61,34,0.06);
    padding:48px 32px; text-align:center;
    animation:arFadeSlide 0.45s ease both;
  }
  .ar-empty-icon {
    width:64px; height:64px; border-radius:20px; margin:0 auto 18px;
    display:flex; align-items:center; justify-content:center;
    background:var(--green-50,#f2fbf6); border:1px solid var(--green-100,#e0f5e9);
    animation:arBounce 2s ease-in-out infinite;
  }
  .ar-empty-icon svg { width:28px; height:28px; color:var(--green-600,#229450); }
  .ar-empty-card h3 { font-size:18px; font-weight:800; color:var(--text-dark,#141b11); margin:0 0 10px; letter-spacing:-0.3px; }
  .ar-empty-card p  { font-size:14px; color:var(--text-muted,#6b7a64); max-width:600px; margin:0 auto 20px; line-height:1.7; }

  /* Available requests list */
  .ar-avail-card {
    background:#fff; border-radius:14px; border:1px solid #e8eee8;
    border-left:4px solid var(--stone-300,#d1d5cf);
    transition:all 0.22s ease; animation:arSlideRight 0.35s ease both;
  }
  .ar-avail-card:hover { transform:translateY(-3px); box-shadow:0 8px 28px rgba(13,61,34,0.1); border-color:#e0f5e9; }
  .ar-avail-inner { padding:14px 16px; display:flex; align-items:center; gap:14px; }
  .ar-avail-icon { width:40px; height:40px; border-radius:12px; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
  .ar-avail-icon svg { width:18px; height:18px; }
  .ar-avail-title { font-size:14px; font-weight:700; color:var(--text-dark,#141b11); margin-bottom:3px; }
  .ar-avail-desc  { font-size:13px; color:var(--text-muted,#6b7a64); line-height:1.4; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .ar-avail-meta  { font-size:12px; color:var(--text-light,#aab5a5); margin-top:3px; display:flex; align-items:center; gap:5px; }
  .ar-avail-meta svg { width:11px; height:11px; }
  .ar-avail-accept {
    flex-shrink:0; padding:8px 16px; border-radius:10px; border:none; cursor:pointer;
    background:linear-gradient(135deg,#1a6b3c,#229450); color:#fff;
    font-size:13px; font-weight:700; font-family:'Plus Jakarta Sans',sans-serif;
    display:flex; align-items:center; gap:6px;
    box-shadow:0 3px 10px rgba(26,107,60,0.25);
    transition:all 0.2s ease;
  }
  .ar-avail-accept:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 6px 16px rgba(26,107,60,0.35); }
  .ar-avail-accept:disabled { opacity:0.65; cursor:not-allowed; }
  .ar-avail-accept svg { width:13px; height:13px; }

  /* Urgency pill */
  .ar-urg-pill {
    display:inline-flex; align-items:center; padding:2px 9px; border-radius:99px;
    font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.4px;
  }

  /* Blood badge */
  .ar-blood { display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:99px; background:rgba(220,38,38,0.1); color:#dc2626; font-size:10px; font-weight:700; }
  .ar-blood svg { width:10px; height:10px; }

  /* Pending preview banner */
  .ar-pending-banner {
    background:linear-gradient(135deg,#f0fdf4,#fff);
    border:1.5px solid #86efac; border-radius:18px;
    padding:32px; text-align:center;
    box-shadow:0 4px 20px rgba(34,148,80,0.1);
    animation:arFadeSlide 0.45s ease both;
  }
  .ar-pending-icon {
    width:60px; height:60px; border-radius:20px; margin:0 auto 16px;
    background:var(--green-100,#e0f5e9);
    display:flex; align-items:center; justify-content:center;
  }
  .ar-pending-icon svg { width:26px; height:26px; color:var(--green-600,#229450); }
  .ar-pending-title { font-size:20px; font-weight:800; color:var(--text-dark,#141b11); margin:0 0 10px; letter-spacing:-0.4px; }
  .ar-pending-desc  { font-size:14px; color:var(--text-muted,#6b7a64); max-width:600px; margin:0 auto 18px; line-height:1.7; }

  /* Main grid */
  .ar-main-grid { display:grid; grid-template-columns:1fr 300px; gap:24px; align-items:start; }
  @media (max-width:860px) { .ar-main-grid { grid-template-columns:1fr; } }

  /* Delay helpers */
  .ar-d1 { animation-delay:0.08s; }
  .ar-d2 { animation-delay:0.16s; }
  .ar-d3 { animation-delay:0.24s; }
`;

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const Icons = {
  ArrowLeft:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>,
  Siren:        () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M4.93 4.93l2.83 2.83M2 12h4M4.93 19.07l2.83-2.83M12 22v-4M19.07 19.07l-2.83-2.83M22 12h-4M19.07 4.93l-2.83 2.83"/><circle cx="12" cy="12" r="4"/></svg>,
  AlertCircle:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  CheckCircle:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>,
  AlertTriangle:() => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  XCircle:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  Check:        () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>,
  Rocket:       () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>,
  Trophy:       () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>,
  Hourglass:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg>,
  MapPin:       () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Clock:        () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  ClipboardText:() => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>,
  Drop:         () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,
  Ambulance:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10 17H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3"/><rect x="14" y="11" width="8" height="10" rx="1"/><circle cx="7" cy="20" r="1"/><circle cx="17" cy="20" r="1"/><path d="M18 11v4M16 13h4"/></svg>,
  Car:          () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>,
  Waves:        () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>,
  HelpCircle:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Phone:        () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.08 3.4 2 2 0 0 1 3.05 1.25h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 9a16 16 0 0 0 5.91 5.91l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21 16.92z"/></svg>,
  User:         () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>,
  List:         () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  Activity:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
};

// Emergency meta
const EMERGENCY_META = {
  medical:  { Icon: Icons.Ambulance,  color: '#2563eb', bg: '#eff6ff' },
  blood:    { Icon: Icons.Drop,       color: '#dc2626', bg: '#fef2f2' },
  accident: { Icon: Icons.Car,        color: '#d97706', bg: '#fffbeb' },
  disaster: { Icon: Icons.Waves,      color: '#7c3aed', bg: '#f5f3ff' },
  other:    { Icon: Icons.HelpCircle, color: '#6b7a64', bg: '#f2fbf6' },
};

const URGENCY_COLOR = { critical:'#dc2626', high:'#d97706', medium:'#2563eb', low:'#229450' };

// ─── Response unwrappers ──────────────────────────────────────────────────────
const unwrapActiveRequest = (res) => res?.activeRequest ?? null;
const unwrapNearby = (res) => ({
  requests: Array.isArray(res?.data) ? res.data : [],
  total:    res?.pagination?.total ?? 0,
  city:     res?.pagination?.city  ?? '',
});
const unwrapRequest = (res) => res?.data ?? null;

// ─── Sub-components ───────────────────────────────────────────────────────────
function InfoRow({ IconComp, label, value }) {
  if (!value) return null;
  return (
    <div className="ar-info-row">
      <div className="ar-info-icon"><IconComp /></div>
      <div style={{ flex: 1 }}>
        <div className="ar-info-lbl">{label}</div>
        <div className="ar-info-val">{value}</div>
      </div>
    </div>
  );
}

function TimelineStep({ StepIcon, label, state }) {
  return (
    <div className="ar-tl-step">
      <div className={`ar-tl-circle ${state}`}>
        {state === 'done'
          ? <Icons.Check />
          : <StepIcon />
        }
      </div>
      <div className={`ar-tl-label ${state}`}>{label}</div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ActiveRequest() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedId    = searchParams.get('requestId');
  const { user }       = useAuth();

  const [request,           setRequest]          = useState(null);
  const [pendingRequest,    setPendingRequest]    = useState(null);
  const [availableRequests, setAvailableRequests] = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [actionLoading,     setActionLoading]     = useState('');
  const [error,             setError]             = useState('');
  const [successMsg,        setSuccessMsg]        = useState('');
  const [showCancel,        setShowCancel]        = useState(false);
  const [cancelReason,      setCancelReason]      = useState('');

  const mountedRef     = useRef(true);
  const actionInFlight = useRef(false);

  useEffect(() => { return () => { mountedRef.current = false; }; }, []);

  const showSuccess = (msg) => {
    if (!mountedRef.current) return;
    setSuccessMsg(msg);
    setTimeout(() => { if (mountedRef.current) setSuccessMsg(''); }, 3500);
  };

  const loadRequest = useCallback(async () => {
    try {
      const res    = await getActiveRequest();
      const active = unwrapActiveRequest(res);
      if (!mountedRef.current) return;
      if (active) {
        setRequest(active); setPendingRequest(null); setAvailableRequests([]); return;
      }
      setRequest(null);
      if (requestedId) {
        try {
          const reqRes  = await getRequestById(requestedId);
          const fetched = unwrapRequest(reqRes);
          if (mountedRef.current) setPendingRequest(fetched?.status === 'posted' ? fetched : null);
        } catch { if (mountedRef.current) setPendingRequest(null); }
      } else { setPendingRequest(null); }
      try {
        const nearbyRes          = await getNearbyRequests({ limit: 8 });
        const { requests: list } = unwrapNearby(nearbyRes);
        if (mountedRef.current) setAvailableRequests(list);
      } catch { if (mountedRef.current) setAvailableRequests([]); }
    } catch (err) {
      if (mountedRef.current) setError(err.response?.data?.message || 'Failed to load active request. Please refresh.');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [requestedId]);

  useEffect(() => { loadRequest(); }, [loadRequest]);
  useEffect(() => { const i = setInterval(loadRequest, 30000); return () => clearInterval(i); }, [loadRequest]);

  const safeNavigate = useCallback((path, delay = 0) => {
    const go = () => { document.body.style.overflow = ''; setShowCancel(false); navigate(path); };
    if (delay > 0) setTimeout(go, delay); else go();
  }, [navigate]);

  const handleAccept = async (requestId) => {
    if (!requestId || actionInFlight.current || actionLoading) return;
    actionInFlight.current = true;
    if (mountedRef.current) { setActionLoading('accept'); setError(''); }
    try {
      await acceptVolunteerRequest(requestId);
      if (!mountedRef.current) return;
      showSuccess('Request accepted! Loading your assignment…');
      setPendingRequest(null); setAvailableRequests([]);
      await new Promise((r) => setTimeout(r, 800));
      if (!mountedRef.current) return;
      await loadRequest();
    } catch (err) {
      if (mountedRef.current) setError(err.response?.data?.message || 'Could not accept this request. Please try again.');
    } finally {
      actionInFlight.current = false;
      if (mountedRef.current) setActionLoading('');
    }
  };

  const handleMarkInProgress = async () => {
    if (actionInFlight.current || actionLoading) return;
    actionInFlight.current = true;
    if (mountedRef.current) { setActionLoading('progress'); setError(''); }
    try {
      const res = await markInProgress(request._id);
      if (mountedRef.current) { setRequest(res.request); showSuccess('Marked as in progress!'); }
    } catch (err) {
      if (mountedRef.current) setError(err.response?.data?.message || 'Action failed. Please try again.');
    } finally {
      actionInFlight.current = false;
      if (mountedRef.current) setActionLoading('');
    }
  };

  const handleComplete = async () => {
    if (actionInFlight.current || actionLoading) return;
    actionInFlight.current = true;
    if (mountedRef.current) { setActionLoading('complete'); setError(''); }
    try {
      await completeRequest(request._id);
      showSuccess('Request completed! Great work.');
      safeNavigate('/volunteer/dashboard', 2000);
    } catch (err) {
      if (mountedRef.current) setError(err.response?.data?.message || 'Action failed. Please try again.');
    } finally {
      actionInFlight.current = false;
      if (mountedRef.current) setActionLoading('');
    }
  };

  const handleCancelConfirm = async () => {
    if (actionInFlight.current) return;
    actionInFlight.current = true;
    if (mountedRef.current) { setActionLoading('cancel'); setError(''); }
    try {
      await cancelRequest(request._id, cancelReason);
      if (mountedRef.current) { setCancelReason(''); showSuccess('Request cancelled and re-posted for other volunteers.'); }
      safeNavigate('/volunteer/dashboard', 2000);
    } catch (err) {
      if (mountedRef.current) { setError(err.response?.data?.message || 'Action failed. Please try again.'); setShowCancel(false); }
    } finally {
      actionInFlight.current = false;
      if (mountedRef.current) setActionLoading('');
    }
  };

  const getTimelineState = (status) => ({
    accepted:    ['accepted','in_progress','completed'].includes(status) ? 'done' : status === 'posted' ? 'active' : 'idle',
    inProgress:  ['in_progress','completed'].includes(status) ? 'done' : status === 'accepted' ? 'active' : 'idle',
    completed:   status === 'completed' ? 'done' : status === 'in_progress' ? 'active' : 'idle',
  });

  const tl            = request ? getTimelineState(request.status) : null;
  const locationValue = request ? [request.city, request.address].filter(Boolean).join(' · ') || null : null;

  const statusIconMeta = request
    ? request.status === 'in_progress'
      ? { cls: 'red',   Icon: Icons.Siren   }
      : request.status === 'accepted'
        ? { cls: 'green', Icon: Icons.CheckCircle }
        : { cls: 'stone', Icon: Icons.Hourglass   }
    : null;

  return (
    <Navbar title="Active Request">
      <style>{STYLES}</style>
      <div className="page-wrapper ar-root">

        {/* Page header */}
        <div className="ar-page-header">
          <button className="ar-back-btn" onClick={() => safeNavigate('/volunteer/dashboard')}>
            <Icons.ArrowLeft /> Dashboard
          </button>
          <h1>Active Request</h1>
          <p>Manage your currently assigned emergency request.</p>
        </div>

        {loading && <Loader variant="card" message="Loading active request…" />}

        {!loading && (
          <>
            {error && (
              <div className="ar-alert error">
                <span className="ar-alert-icon"><Icons.AlertCircle /></span>
                <div style={{ flex: 1 }}>{error}</div>
                <button onClick={() => setError('')} style={{ background:'none', border:'none', cursor:'pointer', color:'#b91c1c', fontWeight:700, padding:0 }}>
                  <Icons.XCircle />
                </button>
              </div>
            )}
            {successMsg && (
              <div className="ar-alert success">
                <span className="ar-alert-icon"><Icons.CheckCircle /></span>
                {successMsg}
              </div>
            )}

            {/* ── No active assignment ── */}
            {!request && (
              <>
                {pendingRequest ? (
                  <div className="ar-pending-banner">
                    <div className="ar-pending-icon"><Icons.ClipboardText /></div>
                    <div className="ar-pending-title">Request Ready to Accept</div>
                    <p className="ar-pending-desc">{pendingRequest.description}</p>
                    <div style={{ display:'flex', gap:'8px', justifyContent:'center', flexWrap:'wrap', marginBottom:'16px' }}>
                      <Badge urgency={pendingRequest.urgencyLevel} />
                      <Badge color="blue">{formatEmergencyType(pendingRequest.emergencyType)}</Badge>
                      {pendingRequest.city && <Badge color="stone">{pendingRequest.city}</Badge>}
                      {pendingRequest.bloodGroupNeeded && <Badge color="red">{pendingRequest.bloodGroupNeeded}</Badge>}
                    </div>
                    {pendingRequest.requesterId?.name && (
                      <p style={{ fontSize:'13px', color:'var(--text-muted)', marginBottom:'20px' }}>
                        Requested by <strong>{pendingRequest.requesterId.name}</strong>
                        {pendingRequest.requesterId.phone && ` · ${pendingRequest.requesterId.phone}`}
                      </p>
                    )}
                    <div style={{ display:'flex', gap:'10px', justifyContent:'center', flexWrap:'wrap' }}>
                      <button
                        className="ar-btn primary"
                        style={{ flex:'0 0 auto', padding:'12px 28px' }}
                        onClick={() => handleAccept(pendingRequest._id)}
                        disabled={!!actionLoading}
                      >
                        {actionLoading === 'accept'
                          ? <><span className="ar-spinner" /> Accepting…</>
                          : <><Icons.Check /> Accept Request</>
                        }
                      </button>
                      <button
                        className="ar-btn secondary"
                        style={{ flex:'0 0 auto', padding:'12px 22px' }}
                        onClick={() => safeNavigate('/volunteer/dashboard')}
                        disabled={!!actionLoading}
                      >
                        <Icons.ArrowLeft /> Back to Dashboard
                      </button>
                    </div>
                  </div>

                ) : availableRequests.length > 0 ? (
                  <div className="ar-empty-card">
                    <div className="ar-empty-icon"><Icons.List /></div>
                    <h3>No Active Request Yet</h3>
                    <p>Open requests in your city — accept one to get started.</p>
                    <div style={{ width:'100%', maxWidth:'900px', display:'flex', flexDirection:'column', gap:'10px', textAlign:'left' }}>
                      {availableRequests.map((req, i) => {
                        const meta  = EMERGENCY_META[req.emergencyType] || EMERGENCY_META.other;
                        const uCol  = URGENCY_COLOR[req.urgencyLevel] || '#6b7a64';
                        const EIcon = meta.Icon;
                        return (
                          <div key={req._id} className="ar-avail-card" style={{ borderLeftColor: uCol, animationDelay: `${i * 60}ms` }}>
                            <div className="ar-avail-inner">
                              <div className="ar-avail-icon" style={{ background: meta.bg }}><EIcon /></div>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap', marginBottom:'3px' }}>
                                  <span className="ar-avail-title" style={{ textTransform:'capitalize' }}>
                                    {formatEmergencyType(req.emergencyType)}
                                  </span>
                                  <span className="ar-urg-pill" style={{ background:`${uCol}18`, color:uCol }}>{req.urgencyLevel}</span>
                                  {req.bloodGroupNeeded && (
                                    <span className="ar-blood"><Icons.Drop />{req.bloodGroupNeeded}</span>
                                  )}
                                </div>
                                <div className="ar-avail-desc">{req.description}</div>
                                <div className="ar-avail-meta">
                                  {req.city && <><Icons.MapPin />{req.city}{req.address ? ` · ${req.address}` : ''}</>}
                                </div>
                              </div>
                              <button
                                className="ar-avail-accept"
                                disabled={!!actionLoading}
                                onClick={() => handleAccept(req._id)}
                              >
                                {actionLoading === 'accept'
                                  ? <><span className="ar-spinner" /> Accepting…</>
                                  : <><Icons.Check /> Accept</>
                                }
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                ) : (
                  <div className="ar-empty-card">
                    <div className="ar-empty-icon"><Icons.CheckCircle /></div>
                    <h3>No Active Request</h3>
                    <p>You're not assigned to any request right now. Make sure you're marked as available to receive assignments.</p>
                    <button
                      className="ar-btn primary"
                      style={{ flex:'0 0 auto', padding:'12px 28px', margin:'0 auto' }}
                      onClick={() => safeNavigate('/volunteer/dashboard')}
                    >
                      <Icons.ArrowLeft /> Back to Dashboard
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ── Active request management view ── */}
            {request && (
              <div className="ar-main-grid">

                {/* Left column */}
                <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>

                  {/* Timeline */}
                  <div className="ar-card ar-d1">
                    <div className="ar-card-header">
                      <div className="ar-section-title"><Icons.Activity />Request Progress</div>
                    </div>
                    <div className="ar-card-body" style={{ paddingTop:'20px' }}>
                      <div className="ar-timeline">
                        <div className="ar-timeline-line" />
                        <TimelineStep StepIcon={Icons.Check}   label="Accepted"    state={tl.accepted}   />
                        <TimelineStep StepIcon={Icons.Rocket}  label="In Progress" state={tl.inProgress} />
                        <TimelineStep StepIcon={Icons.Trophy}  label="Completed"   state={tl.completed}  />
                      </div>
                    </div>
                  </div>

                  {/* Request details */}
                  <div className="ar-card ar-d2">
                    <div className="ar-card-header">
                      <div>
                        <div className="ar-section-title"><Icons.ClipboardText />Request Details</div>
                      </div>
                      <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                        <Badge urgency={request.urgencyLevel} />
                        <Badge status={request.status} dot={request.status === 'in_progress'} pulse={request.status === 'in_progress'} />
                      </div>
                    </div>
                    <div className="ar-card-body" style={{ paddingTop:'8px' }}>
                      <InfoRow IconComp={Icons.Siren}        label="Emergency Type"      value={formatEmergencyType(request.emergencyType)} />
                      <InfoRow IconComp={Icons.ClipboardText}label="Description"         value={request.description} />
                      <InfoRow IconComp={Icons.MapPin}       label="Location"            value={locationValue} />
                      <InfoRow IconComp={Icons.Clock}        label="Posted"              value={formatTimeAgo(request.postedAt || request.createdAt)} />
                      <InfoRow IconComp={Icons.CheckCircle}  label="Accepted"            value={request.acceptedAt ? formatTimeAgo(request.acceptedAt) : null} />
                      {request.bloodGroupNeeded && (
                        <InfoRow IconComp={Icons.Drop} label="Blood Group Needed" value={request.bloodGroupNeeded} />
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="ar-card ar-d3">
                    <div className="ar-card-header">
                      <div className="ar-section-title"><Icons.Activity />Update Status</div>
                    </div>
                    <div className="ar-card-body" style={{ paddingTop:'16px' }}>
                      <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
                        {request.status === 'accepted' && (
                          <button className="ar-btn secondary" disabled={!!actionLoading} onClick={handleMarkInProgress}>
                            {actionLoading === 'progress'
                              ? <><span className="ar-spinner dark" /> Updating…</>
                              : <><Icons.Rocket /> Mark In Progress</>
                            }
                          </button>
                        )}
                        {['accepted','in_progress'].includes(request.status) && (
                          <button className="ar-btn primary" disabled={!!actionLoading} onClick={handleComplete}>
                            {actionLoading === 'complete'
                              ? <><span className="ar-spinner" /> Completing…</>
                              : <><Icons.Trophy /> Mark Completed</>
                            }
                          </button>
                        )}
                        {['accepted','in_progress'].includes(request.status) && (
                          <button className="ar-btn danger" disabled={!!actionLoading} onClick={() => setShowCancel(true)}>
                            <Icons.XCircle /> Cancel
                          </button>
                        )}
                      </div>
                      <div className="ar-warning-notice">
                        <Icons.AlertTriangle />
                        Cancelling will affect your cancellation rate and reputation score.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right column */}
                <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>

                  {/* Status card */}
                  <div className="ar-card ar-d1">
                    <div className="ar-card-body" style={{ textAlign:'center', padding:'28px 22px' }}>
                      {statusIconMeta && (
                        <div className={`ar-status-icon ${statusIconMeta.cls}`}>
                          <statusIconMeta.Icon />
                        </div>
                      )}
                      <Badge
                        status={request.status}
                        dot={request.status === 'in_progress'}
                        pulse={request.status === 'in_progress'}
                        style={{ fontSize:'13px', padding:'6px 14px' }}
                      />
                      <p style={{ fontSize:'12px', color:'var(--text-muted)', marginTop:'12px', lineHeight:1.7 }}>
                        {request.status === 'accepted'    && 'Head to the location — the requester is waiting.'}
                        {request.status === 'in_progress' && "You're on the scene. Stay focused."}
                      </p>
                    </div>
                  </div>

                  {/* Requester contact */}
                  {request.requesterId && (
                    <div className="ar-card ar-d2">
                      <div className="ar-card-header">
                        <div className="ar-section-title"><Icons.User />Requester Contact</div>
                      </div>
                      <div className="ar-card-body" style={{ paddingTop:'14px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px' }}>
                          <div className="ar-avatar">
                            {request.requesterId.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div style={{ fontWeight:700, fontSize:'15px', color:'var(--text-dark)' }}>
                              {request.requesterId.name || 'Unknown'}
                            </div>
                            <div style={{ fontSize:'12px', color:'var(--text-muted)', marginTop:'2px' }}>Help Seeker</div>
                          </div>
                        </div>
                        {request.requesterId.phone ? (
                          <a href={`tel:${request.requesterId.phone}`} className="ar-call-btn">
                            <Icons.Phone /> Call Now — {request.requesterId.phone}
                          </a>
                        ) : (
                          <p style={{ fontSize:'13px', color:'var(--text-muted)', textAlign:'center' }}>No phone number available</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Emergency contacts */}
                  <div className="ar-emergency-card ar-d3">
                    <div className="ar-emergency-title">
                      <Icons.Phone /> Emergency Contacts
                    </div>
                    {[
                      { label:'Rescue', number:'1122' },
                      { label:'Edhi',   number:'115'  },
                      { label:'Police', number:'15'   },
                    ].map((c) => (
                      <a key={c.label} href={`tel:${c.number}`} className="ar-contact-row">
                        <span className="ar-contact-label"><Icons.Phone />{c.label}</span>
                        <span className="ar-contact-num">{c.number}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Cancel modal */}
      <Modal
        isOpen={showCancel}
        onClose={() => { if (actionLoading === 'cancel') return; setShowCancel(false); setCancelReason(''); }}
        title="Cancel Request?"
        icon={<Icons.AlertTriangle />}
        onConfirm={handleCancelConfirm}
        confirmLabel="Yes, Cancel"
        confirmVariant="danger"
        loading={actionLoading === 'cancel'}
      >
        <div>
          <p style={{ fontSize:'14px', color:'var(--text-mid)', lineHeight:1.7, marginBottom:'16px' }}>
            This will re-post the request so another volunteer can pick it up. Your cancellation rate and reputation score will be affected.
          </p>
          <div className="form-group" style={{ marginBottom:0 }}>
            <label className="form-label">Reason for cancelling (optional)</label>
            <textarea
              className="form-textarea"
              placeholder="Let us know why you're cancelling…"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              disabled={actionLoading === 'cancel'}
            />
          </div>
        </div>
      </Modal>
    </Navbar>
  );
}