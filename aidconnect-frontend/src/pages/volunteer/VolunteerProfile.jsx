// src/pages/volunteer/VolunteerProfile.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/common/Navbar.jsx';
import Badge from '../../components/common/Badge.jsx';
import Loader from '../../components/common/Loader.jsx';
import useAuth from '../../hooks/useAuth.js';
import {
  getMyVolunteerProfile,
  updateVolunteerProfile,
  getMyRatings,
} from '../../api/volunteer.api.js';
import {
  VOLUNTEER_SKILLS,
  EMERGENCY_TYPES,
  PAKISTAN_CITIES,
} from '../../utils/constants.js';
import {
  formatDate,
  formatScore,
  formatStars,
  getInitials,
} from '../../utils/formatters.js';

/* ─── Scoped styles ─────────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');

  .vp-root * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }

  @keyframes vp-up   { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:none; } }
  @keyframes vp-in   { from { opacity:0; } to { opacity:1; } }
  @keyframes vp-bar  { from { width:0; } }
  @keyframes spin    { to { transform:rotate(360deg); } }

  /* ── Page wrapper ── */
  .vp-root .vp-page { max-width:860px; margin:0 auto; padding:28px 20px 56px; }

  /* ── Hero card ── */
  .vp-root .hero-card {
    background: linear-gradient(135deg, #0d3d22 0%, #1a6b3c 60%, #229450 100%);
    border-radius: 16px;
    padding: 28px 28px;
    display: flex; align-items: center; gap: 22px; flex-wrap: wrap;
    margin-bottom: 24px;
    box-shadow: 0 8px 32px rgba(13,61,34,0.28);
    animation: vp-up 0.4s ease both;
    position: relative; overflow: hidden;
  }
  .vp-root .hero-card::before {
    content:''; position:absolute; inset:0;
    background: radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 60%);
    pointer-events: none;
  }
  .vp-root .hero-avatar {
    width: 68px; height: 68px; border-radius: 50%;
    background: rgba(255,255,255,0.15);
    border: 2.5px solid rgba(255,255,255,0.35);
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; font-weight: 800; color: #fff;
    flex-shrink: 0; letter-spacing: 0.5px;
    backdrop-filter: blur(4px);
  }
  .vp-root .hero-name  { font-size:20px; font-weight:800; color:#fff; letter-spacing:-0.3px; }
  .vp-root .hero-role  { font-size:12px; color:rgba(255,255,255,0.6); font-weight:500; margin-top:2px; text-transform:uppercase; letter-spacing:0.8px; }
  .vp-root .hero-email { font-size:13px; color:rgba(255,255,255,0.72); margin-top:3px; }
  .vp-root .hero-tags  { display:flex; gap:7px; margin-top:12px; flex-wrap:wrap; }
  .vp-root .hero-tag {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 11px; border-radius: 20px;
    font-size: 11px; font-weight: 700; letter-spacing: 0.3px;
    border: 1px solid rgba(255,255,255,0.25);
    background: rgba(255,255,255,0.12); color: #fff;
    backdrop-filter: blur(4px);
  }
  .vp-root .hero-stats { display:flex; gap:28px; flex-shrink:0; }
  .vp-root .hero-stat-val { font-size:26px; font-weight:800; color:#fff; letter-spacing:-1px; line-height:1; font-family:'DM Mono',monospace; }
  .vp-root .hero-stat-lbl { font-size:10px; color:rgba(255,255,255,0.55); margin-top:3px; text-transform:uppercase; letter-spacing:0.6px; }

  /* ── Section cards ── */
  .vp-root .section-card {
    background: #fff; border-radius: 13px;
    border: 1.5px solid #e8ede9;
    box-shadow: 0 2px 8px rgba(26,107,60,0.04);
    overflow: hidden; margin-bottom: 18px;
    animation: vp-up 0.36s ease both;
    transition: box-shadow 0.2s ease, border-color 0.18s ease;
  }
  .vp-root .section-card:hover {
    box-shadow: 0 6px 20px rgba(26,107,60,0.09);
    border-color: #c5e8d1;
  }
  .vp-root .section-head {
    padding: 14px 20px;
    border-bottom: 1.5px solid #edf2ee;
    display: flex; align-items: center; gap: 10px;
    background: #fafcfa;
  }
  .vp-root .section-icon {
    width: 32px; height: 32px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .vp-root .section-title-text {
    font-size: 14px; font-weight: 700; color: #141b11;
  }
  .vp-root .section-subtitle-text {
    font-size: 12px; color: #6b7a64; margin-top: 1px;
  }
  .vp-root .section-body { padding: 18px 20px; }

  /* ── Tabs ── */
  .vp-root .tab-bar {
    display: flex; gap: 6px; margin-bottom: 22px;
    border-bottom: 2px solid #e8ede9; padding-bottom: 0;
  }
  .vp-root .vp-tab {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 18px; border-radius: 8px 8px 0 0;
    font-size: 13px; font-weight: 600;
    border: none; background: transparent; color: #6b7a64;
    cursor: pointer;
    transition: color 0.15s ease, background 0.15s ease;
    border-bottom: 2.5px solid transparent;
    margin-bottom: -2px;
  }
  .vp-root .vp-tab:hover { color: #1a6b3c; background: #f2fbf6; }
  .vp-root .vp-tab.active {
    color: #1a6b3c; font-weight: 700;
    border-bottom-color: #1a6b3c;
    background: #f2fbf6;
  }

  /* ── Toggle chips ── */
  .vp-root .chip-grid { display:flex; gap:8px; flex-wrap:wrap; }
  .vp-root .toggle-chip {
    padding: 6px 14px; border-radius: 20px;
    font-size: 12px; font-weight: 600;
    cursor: pointer; white-space: nowrap;
    transition: background 0.15s ease, border-color 0.15s ease,
                color 0.15s ease, transform 0.13s ease, box-shadow 0.15s ease;
    text-transform: capitalize;
    border: 1.5px solid #d4dbd5;
    background: #fff; color: #6b7a64;
  }
  .vp-root .toggle-chip:hover {
    border-color: #7dd49a; color: #1a6b3c;
    background: #f2fbf6; transform: translateY(-1px);
  }
  .vp-root .toggle-chip.selected {
    background: #e0f5e9; border-color: #229450;
    color: #0d3d22; box-shadow: 0 2px 6px rgba(26,107,60,0.14);
  }
  .vp-root .toggle-chip.selected:hover { transform: translateY(-1px); }
  .vp-root .toggle-chip:disabled { opacity:0.5; cursor:not-allowed; }

  /* ── Day buttons ── */
  .vp-root .day-btn {
    padding: 8px 14px; border-radius: 8px;
    font-size: 12px; font-weight: 800; letter-spacing: 0.6px;
    text-transform: uppercase;
    border: 2px solid #d4dbd5;
    background: #fff; color: #6b7a64;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .vp-root .day-btn:hover:not(:disabled) {
    border-color: #7dd49a; color: #1a6b3c;
    background: #f2fbf6; transform: translateY(-1px);
  }
  .vp-root .day-btn.active {
    background: #1a6b3c; border-color: #1a6b3c;
    color: #fff; box-shadow: 0 2px 8px rgba(26,107,60,0.2);
  }
  .vp-root .day-btn.active:hover:not(:disabled) { background: #1e7d46; border-color: #1e7d46; }
  .vp-root .day-btn:disabled { opacity:0.5; cursor:not-allowed; }

  /* ── Form inputs ── */
  .vp-root .vp-input, .vp-root .vp-select, .vp-root .vp-textarea {
    width: 100%; padding: 10px 13px;
    border: 1.5px solid #d4dbd5; border-radius: 9px;
    font-size: 14px; color: #141b11;
    font-family: 'DM Sans', sans-serif;
    background: #fff;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
    outline: none;
  }
  .vp-root .vp-input:focus, .vp-root .vp-select:focus, .vp-root .vp-textarea:focus {
    border-color: #1a6b3c;
    box-shadow: 0 0 0 3px rgba(26,107,60,0.1);
  }
  .vp-root .vp-input:disabled, .vp-root .vp-select:disabled, .vp-root .vp-textarea:disabled {
    opacity: 0.6; cursor: not-allowed; background: #f5f7f5;
  }
  .vp-root .vp-textarea { resize: vertical; min-height: 90px; line-height: 1.6; }
  .vp-root .vp-label {
    display: block; font-size: 12px; font-weight: 700;
    color: #3a4a35; margin-bottom: 6px; letter-spacing: 0.2px;
  }
  .vp-root .vp-hint {
    font-size: 11px; color: #6b7a64; margin-top: 5px;
  }
  .vp-root .form-row-2 {
    display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
  }
  @media (max-width:560px) { .vp-root .form-row-2 { grid-template-columns:1fr; } }
  .vp-root .form-group { margin-bottom: 16px; }
  .vp-root .form-group:last-child { margin-bottom: 0; }

  /* ── Slider ── */
  .vp-root input[type=range] {
    width: 100%; accent-color: #1a6b3c;
    height: 4px; cursor: pointer;
  }

  /* ── Toggle switch ── */
  .vp-root .vp-toggle { position:relative; display:inline-block; width:42px; height:24px; }
  .vp-root .vp-toggle input { opacity:0; width:0; height:0; }
  .vp-root .vp-toggle-track {
    position:absolute; inset:0; border-radius:12px;
    background:#d4dbd5; cursor:pointer;
    transition: background 0.2s ease;
  }
  .vp-root .vp-toggle-track::after {
    content:''; position:absolute;
    width:18px; height:18px; border-radius:50%;
    top:3px; left:3px; background:#fff;
    box-shadow: 0 1px 4px rgba(0,0,0,0.18);
    transition: transform 0.2s cubic-bezier(.34,1.3,.64,1);
  }
  .vp-root .vp-toggle input:checked + .vp-toggle-track { background:#1a6b3c; }
  .vp-root .vp-toggle input:checked + .vp-toggle-track::after { transform:translateX(18px); }

  /* ── Alert banners ── */
  .vp-root .alert-banner {
    display:flex; align-items:center; gap:12px;
    padding:13px 16px; border-radius:10px;
    margin-bottom:18px; font-size:14px; font-weight:500;
    animation: vp-up 0.26s ease both;
  }
  .vp-root .alert-error   { background:#fff5f5; border:1.5px solid #f5c6c6; color:#b03030; }
  .vp-root .alert-success { background:#f0fdf5; border:1.5px solid #a7e3be; color:#1a6b3c; }
  .vp-root .alert-warning { background:#fffbec; border:1.5px solid #f0d080; color:#8a5c00; }

  /* ── Buttons ── */
  .vp-root .btn-primary-vp {
    display:inline-flex; align-items:center; gap:8px;
    padding:11px 26px; border-radius:9px;
    background:#1a6b3c; color:#fff;
    font-weight:700; font-size:14px; border:none; cursor:pointer;
    transition: background 0.18s ease, transform 0.14s ease, box-shadow 0.18s ease;
    box-shadow: 0 3px 10px rgba(26,107,60,0.22);
  }
  .vp-root .btn-primary-vp:hover:not(:disabled) {
    background:#1e7d46; transform:translateY(-1px);
    box-shadow: 0 6px 18px rgba(26,107,60,0.3);
  }
  .vp-root .btn-primary-vp:disabled { opacity:0.55; cursor:not-allowed; }

  .vp-root .btn-ghost-vp {
    display:inline-flex; align-items:center; gap:7px;
    padding:10px 18px; border-radius:9px;
    background:#fff; color:#3a4a35;
    font-weight:600; font-size:14px;
    border:1.5px solid #d4dbd5; cursor:pointer;
    transition: background 0.15s ease, border-color 0.15s ease, transform 0.13s ease;
  }
  .vp-root .btn-ghost-vp:hover:not(:disabled) {
    background:#f5f7f5; border-color:#b8c5ba; transform:translateY(-1px);
  }
  .vp-root .btn-ghost-vp:disabled { opacity:0.5; cursor:not-allowed; }

  .vp-root .inline-spinner {
    width:14px; height:14px; border-radius:50%;
    border:2px solid rgba(255,255,255,0.3);
    border-top-color:#fff;
    animation:spin 0.7s linear infinite;
    display:inline-block;
  }

  /* ── Ratings ── */
  .vp-root .rating-card {
    background:#fff; border-radius:12px;
    border:1.5px solid #e8ede9;
    padding:16px 18px;
    animation: vp-up 0.34s ease both;
    transition: transform 0.18s ease, box-shadow 0.18s ease;
  }
  .vp-root .rating-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(26,107,60,0.09);
    border-color: #c5e8d1;
  }
  .vp-root .rater-avatar {
    width:36px; height:36px; border-radius:50%;
    background:#1a6b3c; color:#fff;
    display:flex; align-items:center; justify-content:center;
    font-size:12px; font-weight:700; flex-shrink:0;
  }
  .vp-root .stars-row { display:flex; gap:3px; }
  .vp-root .star-icon { color:#d4dbd5; font-size:16px; line-height:1; }
  .vp-root .star-icon.lit { color:#f39c12; }
  .vp-root .comment-text {
    font-size:13px; color:#3a4a35;
    line-height:1.65; font-style:italic;
    padding:10px 14px; margin-top:12px;
    background:#f7fbf8; border-radius:8px;
    border-left:3px solid #c5e8d1;
  }

  /* ── Distribution bars ── */
  .vp-root .dist-bar-track {
    flex:1; height:6px; background:#e8ede9;
    border-radius:10px; overflow:hidden;
  }
  .vp-root .dist-bar-fill {
    height:100%; background:#f39c12;
    border-radius:10px;
    animation: vp-bar 0.7s ease both;
  }

  /* ── Rating summary ── */
  .vp-root .rating-summary-card {
    background:#fff; border-radius:13px;
    border:1.5px solid #e8ede9;
    padding:22px 24px; margin-bottom:18px;
    animation: vp-up 0.34s ease both;
  }
  .vp-root .big-score {
    font-size:44px; font-weight:800;
    color:#141b11; letter-spacing:-2px; line-height:1;
    font-family:'DM Mono',monospace;
  }

  /* ── Pagination ── */
  .vp-root .pag-row {
    display:flex; align-items:center; justify-content:center;
    gap:6px; margin-top:22px; flex-wrap:wrap;
  }
  .vp-root .pag-btn {
    width:34px; height:34px; border-radius:8px;
    border:1.5px solid #dde8df;
    background:#fff; color:#3a4a35;
    font-size:13px; font-weight:600;
    cursor:pointer; display:flex; align-items:center; justify-content:center;
    transition: all 0.14s ease;
  }
  .vp-root .pag-btn:hover:not(:disabled) {
    background:#f0fdf5; border-color:#7dd49a; color:#1a6b3c; transform:scale(1.06);
  }
  .vp-root .pag-btn.active {
    background:#1a6b3c; border-color:#1a6b3c; color:#fff;
    box-shadow:0 2px 8px rgba(26,107,60,0.22);
  }
  .vp-root .pag-btn:disabled { opacity:0.4; cursor:not-allowed; }

  /* ── Empty state ── */
  .vp-root .empty-state-vp {
    text-align:center; padding:44px 24px;
    animation: vp-up 0.3s ease both;
  }
  .vp-root .empty-icon-vp {
    width:62px; height:62px; border-radius:16px;
    background:#e0f5e9; color:#1a6b3c;
    display:flex; align-items:center; justify-content:center;
    margin:0 auto 16px;
  }

  /* ── Char counter ── */
  .vp-root .char-counter {
    font-size:11px; color:#6b7a64; text-align:right; margin-top:4px;
  }
  .vp-root .char-counter.near { color:#d68910; }
  .vp-root .char-counter.over { color:#c0392b; }

  /* ── Required star ── */
  .vp-root .req { color:#c0392b; }
`;

/* ─── Icons ─────────────────────────────────────────────────────────────────── */
const Icon = {
  User:    ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Star:    ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  MapPin:  ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Zap:     ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Droplet: ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,
  Calendar:({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Shield:  ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Check:   ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Clock:   ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Alert:   ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  X:       ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  CheckCircle: ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  RotateCcw:   ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>,
  Save:        ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  ChevLeft:  ({ s=15 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  ChevRight: ({ s=15 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  Inbox:     ({ s=30 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>,
  Wrench:    ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
};

/* ─── Days ────────────────────────────────────────────────────────────────────  */
const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

/* ─── Section card wrapper ──────────────────────────────────────────────────── */
function SectionCard({ icon, iconBg, iconColor, title, subtitle, children, delay = 0, style = {} }) {
  return (
    <div className="section-card" style={{ animationDelay: `${delay}ms`, ...style }}>
      <div className="section-head">
        <div className="section-icon" style={{ background: iconBg, color: iconColor }}>
          {icon}
        </div>
        <div>
          <div className="section-title-text">{title}</div>
          {subtitle && <div className="section-subtitle-text">{subtitle}</div>}
        </div>
      </div>
      <div className="section-body">{children}</div>
    </div>
  );
}

/* ─── Toggle chip ───────────────────────────────────────────────────────────── */
function ToggleChip({ label, selected, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`toggle-chip${selected ? ' selected' : ''}`}
    >
      {selected && <Icon.Check s={11} />}
      {label.replace(/_/g, ' ')}
    </button>
  );
}

/* ─── Star display ──────────────────────────────────────────────────────────── */
function StarRow({ score }) {
  const filled = formatStars(score);
  return (
    <div className="stars-row">
      {filled.map((f, i) => (
        <span key={i} className={`star-icon${f ? ' lit' : ''}`}>★</span>
      ))}
    </div>
  );
}

/* ─── Rating card ───────────────────────────────────────────────────────────── */
function RatingCard({ rating, index }) {
  return (
    <div className="rating-card" style={{ animationDelay: `${index * 0.07}s` }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div className="rater-avatar">{getInitials(rating.givenBy?.name || '?')}</div>
          <div>
            <div style={{ fontWeight:700, fontSize:'14px', color:'#141b11' }}>
              {rating.givenBy?.name || 'Anonymous'}
            </div>
            <div style={{ fontSize:'12px', color:'#6b7a64', marginTop:'2px' }}>
              {formatDate(rating.createdAt)}
            </div>
          </div>
        </div>
        <StarRow score={rating.score} />
      </div>
      {rating.comment && (
        <div className="comment-text">"{rating.comment}"</div>
      )}
    </div>
  );
}

/* ─── VolunteerProfile ──────────────────────────────────────────────────────── */
export default function VolunteerProfile() {
  const { user, updateVolunteerProfile: updateContextProfile } = useAuth();

  const [profile,        setProfile]        = useState(null);
  const [ratings,        setRatings]        = useState([]);
  const [ratingsMeta,    setRatingsMeta]    = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [error,          setError]          = useState('');
  const [successMsg,     setSuccessMsg]     = useState('');
  const [activeTab,      setActiveTab]      = useState('profile');
  const [ratingsPage,    setRatingsPage]    = useState(1);

  const [form, setForm] = useState({
    bio: '', skills: [], emergencyTypes: [], cnic: '',
    canDonatBlood: false, lastDonationDate: '', radiusKm: 10,
    city: '', area: '',
    availabilitySchedule: {
      monday:true, tuesday:true, wednesday:true,
      thursday:true, friday:true, saturday:false, sunday:false,
    },
  });

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const buildForm = (p) => ({
    bio:            p.bio            || '',
    skills:         p.skills         || [],
    emergencyTypes: p.emergencyTypes || [],
    cnic:           p.cnic           || '',
    canDonatBlood:  p.canDonatBlood  || false,
    lastDonationDate: p.lastDonationDate
      ? new Date(p.lastDonationDate).toISOString().split('T')[0]
      : '',
    radiusKm: p.serviceArea?.radiusKm ?? 10,
    city:     p.serviceArea?.city     || '',
    area:     p.serviceArea?.area     || '',
    availabilitySchedule: p.availabilitySchedule || {
      monday:true, tuesday:true, wednesday:true,
      thursday:true, friday:true, saturday:false, sunday:false,
    },
  });

  const loadProfile = useCallback(async () => {
    try {
      const res = await getMyVolunteerProfile();
      setProfile(res.profile);
      setForm(buildForm(res.profile));
    } catch {
      setError('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRatings = useCallback(async (page) => {
    setRatingsLoading(true);
    try {
      const res = await getMyRatings({ page, limit: 5 });
      setRatings(res.data || []);
      setRatingsMeta(res.pagination || null);
    } catch { /* silent */ }
    finally { setRatingsLoading(false); }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);
  useEffect(() => {
    if (activeTab === 'ratings') loadRatings(ratingsPage);
  }, [activeTab, ratingsPage, loadRatings]);

  const toggleArrayItem = (field, value) => {
    setForm(prev => {
      const arr = prev[field];
      return { ...prev, [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });
  };

  const toggleDay = (day) => {
    setForm(prev => ({
      ...prev,
      availabilitySchedule: { ...prev.availabilitySchedule, [day]: !prev.availabilitySchedule[day] },
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        bio: form.bio.trim(),
        skills: form.skills,
        emergencyTypes: form.emergencyTypes,
        canDonatBlood: form.canDonatBlood,
        availabilitySchedule: form.availabilitySchedule,
        serviceArea: { city: form.city, area: form.area },
        radiusKm: Number(form.radiusKm),
      };
      if (form.cnic.trim())      payload.cnic             = form.cnic.trim();
      if (form.lastDonationDate) payload.lastDonationDate = form.lastDonationDate;

      const res = await updateVolunteerProfile(payload);
      setProfile(res.profile);
      if (updateContextProfile) updateContextProfile(res.profile);
      showSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const reputationScore = profile?.reputationScore ?? 0;
  const scoreMeta       = formatScore(reputationScore);

  if (loading) {
    return (
      <Navbar title="My Profile">
        <Loader variant="card" message="Loading your profile…" />
      </Navbar>
    );
  }

  return (
    <>
      <style>{STYLES}</style>
      <Navbar title="My Profile">
        <div className="vp-root">
          <div className="vp-page">

            {/* ── Hero ── */}
            <div className="hero-card">
              <div className="hero-avatar">{getInitials(user?.name)}</div>

              <div style={{ flex:1, minWidth:0 }}>
                <div className="hero-name">{user?.name}</div>
                <div className="hero-role">Volunteer Responder</div>
                <div className="hero-email">{user?.email}</div>
                <div className="hero-tags">
                  <span className="hero-tag">
                    <Icon.Star s={11} />
                    {scoreMeta.label} · {reputationScore}/100
                  </span>
                  {profile?.isApproved
                    ? <span className="hero-tag"><Icon.CheckCircle s={11} /> Approved</span>
                    : <span className="hero-tag"><Icon.Clock s={11} /> Pending Approval</span>
                  }
                  {user?.bloodGroup && (
                    <span className="hero-tag"><Icon.Droplet s={11} /> {user.bloodGroup}</span>
                  )}
                  {profile?.serviceArea?.city && (
                    <span className="hero-tag"><Icon.MapPin s={11} /> {profile.serviceArea.city}</span>
                  )}
                </div>
              </div>

              <div className="hero-stats">
                {[
                  { label: 'Completed',  value: profile?.totalCompleted ?? 0 },
                  { label: 'Avg Rating', value: profile?.averageRating ? Number(profile.averageRating).toFixed(1) : '—' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign:'center' }}>
                    <div className="hero-stat-val">{s.value}</div>
                    <div className="hero-stat-lbl">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Alerts ── */}
            {error && (
              <div className="alert-banner alert-error">
                <Icon.Alert s={18} />
                <span style={{ flex:1 }}>{error}</span>
                <button onClick={() => setError('')} style={{ background:'none', border:'none', cursor:'pointer', color:'#b03030', display:'flex' }}>
                  <Icon.X s={16} />
                </button>
              </div>
            )}
            {successMsg && (
              <div className="alert-banner alert-success">
                <Icon.CheckCircle s={18} />
                <span style={{ flex:1 }}>{successMsg}</span>
              </div>
            )}
            {!profile?.serviceArea?.city && (
              <div className="alert-banner alert-warning">
                <Icon.Alert s={18} />
                <div>
                  <strong>City not set</strong> — Set your service area city below so emergency
                  requests in your city appear on your dashboard.
                </div>
              </div>
            )}

            {/* ── Tabs ── */}
            <div className="tab-bar">
              {[
                { id:'profile', label:'Edit Profile', icon:<Icon.User s={14} /> },
                { id:'ratings', label:'My Ratings',   icon:<Icon.Star s={14} /> },
              ].map(({ id, label, icon }) => (
                <button
                  key={id}
                  className={`vp-tab${activeTab === id ? ' active' : ''}`}
                  onClick={() => setActiveTab(id)}
                >
                  {icon} {label}
                </button>
              ))}
            </div>

            {/* ══════════════════════════════════════════
                EDIT PROFILE TAB
            ══════════════════════════════════════════ */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSave} noValidate>

                {/* About You */}
                <SectionCard
                  icon={<Icon.User s={16} />}
                  iconBg="#eef6fb" iconColor="#1a6b9a"
                  title="About You"
                  delay={80}
                >
                  <div className="form-group">
                    <label className="vp-label" htmlFor="vp-bio">
                      Bio
                      <span style={{ color:'#6b7a64', fontWeight:400, marginLeft:'6px' }}>(optional · max 300 chars)</span>
                    </label>
                    <textarea
                      id="vp-bio"
                      className="vp-textarea"
                      value={form.bio}
                      onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                      maxLength={300}
                      rows={3}
                      disabled={saving}
                      placeholder="e.g. Experienced first-aider with 5 years of volunteer work…"
                    />
                    <div className={`char-counter${form.bio.length > 270 ? ' over' : form.bio.length > 240 ? ' near' : ''}`}>
                      {form.bio.length}/300
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="vp-label" htmlFor="vp-cnic">CNIC</label>
                    <input
                      id="vp-cnic"
                      type="text"
                      className="vp-input"
                      value={form.cnic}
                      onChange={e => setForm(p => ({ ...p, cnic: e.target.value }))}
                      placeholder="37405-1234567-9"
                      maxLength={15}
                      disabled={saving}
                    />
                    <div className="vp-hint">Format: XXXXX-XXXXXXX-X (for identity verification)</div>
                  </div>
                </SectionCard>

                {/* Skills */}
                <SectionCard
                  icon={<Icon.Wrench s={16} />}
                  iconBg="#f2fbf6" iconColor="#1a6b3c"
                  title="My Skills"
                  subtitle="Select all that apply"
                  delay={140}
                >
                  <div className="chip-grid">
                    {VOLUNTEER_SKILLS.map(skill => (
                      <ToggleChip
                        key={skill}
                        label={skill}
                        selected={form.skills.includes(skill)}
                        onClick={() => toggleArrayItem('skills', skill)}
                        disabled={saving}
                      />
                    ))}
                  </div>
                </SectionCard>

                {/* Emergency Types */}
                <SectionCard
                  icon={<Icon.Zap s={16} />}
                  iconBg="#fffbec" iconColor="#d68910"
                  title="Emergency Types I Handle"
                  delay={190}
                >
                  <div className="chip-grid">
                    {EMERGENCY_TYPES.map(type => (
                      <ToggleChip
                        key={type.value}
                        label={type.label}
                        selected={form.emergencyTypes.includes(type.value)}
                        onClick={() => toggleArrayItem('emergencyTypes', type.value)}
                        disabled={saving}
                      />
                    ))}
                  </div>
                </SectionCard>

                {/* Service Area */}
                <SectionCard
                  icon={<Icon.MapPin s={16} />}
                  iconBg="#fff0ef" iconColor="#c0392b"
                  title={
                    <span>
                      Service Area
                      {!form.city && (
                        <span style={{ fontSize:'11px', color:'#c0392b', fontWeight:400, marginLeft:'8px' }}>
                          — required for matching
                        </span>
                      )}
                    </span>
                  }
                  delay={240}
                >
                  <div className="form-row-2">
                    <div className="form-group">
                      <label className="vp-label" htmlFor="vp-city">
                        City <span className="req">*</span>
                      </label>
                      <select
                        id="vp-city"
                        className="vp-select"
                        value={form.city}
                        onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                        disabled={saving}
                      >
                        <option value="">Select city…</option>
                        {PAKISTAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <div className="vp-hint">Requests in this city will appear on your dashboard</div>
                    </div>
                    <div className="form-group">
                      <label className="vp-label" htmlFor="vp-area">Area / Neighbourhood</label>
                      <input
                        id="vp-area"
                        type="text"
                        className="vp-input"
                        value={form.area}
                        onChange={e => setForm(p => ({ ...p, area: e.target.value }))}
                        placeholder="e.g. Gulshan-e-Iqbal"
                        disabled={saving}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="vp-label">
                      Service Radius —{' '}
                      <span style={{ color:'#1a6b3c', fontWeight:800, fontFamily:"'DM Mono',monospace" }}>
                        {form.radiusKm} km
                      </span>
                    </label>
                    <input
                      type="range" min={1} max={100}
                      value={form.radiusKm}
                      onChange={e => setForm(p => ({ ...p, radiusKm: e.target.value }))}
                      disabled={saving}
                    />
                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                      <span className="vp-hint">1 km</span>
                      <span className="vp-hint">100 km</span>
                    </div>
                  </div>
                </SectionCard>

                {/* Weekly Availability */}
                <SectionCard
                  icon={<Icon.Calendar s={16} />}
                  iconBg="#f2fbf6" iconColor="#229450"
                  title="Weekly Availability"
                  delay={290}
                >
                  <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                    {DAYS.map(day => (
                      <button
                        key={day}
                        type="button"
                        disabled={saving}
                        onClick={() => toggleDay(day)}
                        className={`day-btn${form.availabilitySchedule[day] ? ' active' : ''}`}
                      >
                        {day.slice(0,3)}
                      </button>
                    ))}
                  </div>
                </SectionCard>

                {/* Blood Donation */}
                <SectionCard
                  icon={<Icon.Droplet s={16} />}
                  iconBg="#fff0ef" iconColor="#c0392b"
                  title="Blood Donation"
                  delay={340}
                >
                  <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom: form.canDonatBlood ? '16px' : 0 }}>
                    <label className="vp-toggle">
                      <input
                        type="checkbox"
                        checked={form.canDonatBlood}
                        onChange={e => setForm(p => ({ ...p, canDonatBlood: e.target.checked }))}
                        disabled={saving}
                      />
                      <span className="vp-toggle-track" />
                    </label>
                    <span style={{ fontSize:'14px', fontWeight:500, color:'#141b11' }}>
                      I can donate blood
                    </span>
                    {user?.bloodGroup && (
                      <span style={{
                        display:'inline-flex', alignItems:'center', gap:'5px',
                        background:'#fff0ef', color:'#c0392b',
                        border:'1px solid #f5c6c6',
                        borderRadius:'6px', padding:'3px 9px',
                        fontSize:'11px', fontWeight:700,
                      }}>
                        <Icon.Droplet s={11} /> {user.bloodGroup}
                      </span>
                    )}
                  </div>

                  {form.canDonatBlood && (
                    <div className="form-group">
                      <label className="vp-label" htmlFor="vp-donation-date">Last Donation Date</label>
                      <input
                        id="vp-donation-date"
                        type="date"
                        className="vp-input"
                        value={form.lastDonationDate}
                        onChange={e => setForm(p => ({ ...p, lastDonationDate: e.target.value }))}
                        max={new Date().toISOString().split('T')[0]}
                        disabled={saving}
                        style={{ maxWidth:260 }}
                      />
                      <div className="vp-hint">Must be at least 3 months ago to be eligible again</div>
                    </div>
                  )}
                </SectionCard>

                {/* Save / Reset */}
                <div style={{ display:'flex', gap:'12px', justifyContent:'flex-end', paddingTop:'4px' }}>
                  <button type="button" className="btn-ghost-vp" disabled={saving} onClick={loadProfile}>
                    <Icon.RotateCcw s={15} /> Reset
                  </button>
                  <button type="submit" className="btn-primary-vp" disabled={saving}>
                    {saving
                      ? <><span className="inline-spinner" /> Saving…</>
                      : <><Icon.Save s={15} /> Save Changes</>
                    }
                  </button>
                </div>
              </form>
            )}

            {/* ══════════════════════════════════════════
                RATINGS TAB
            ══════════════════════════════════════════ */}
            {activeTab === 'ratings' && (
              <div>
                {/* Summary */}
                <div className="rating-summary-card">
                  <div style={{ display:'flex', alignItems:'center', gap:'32px', flexWrap:'wrap' }}>
                    <div style={{ textAlign:'center', flexShrink:0 }}>
                      <div className="big-score">{profile?.averageRating?.toFixed(1) || '—'}</div>
                      <StarRow score={profile?.averageRating || 0} />
                      <div style={{ fontSize:'12px', color:'#6b7a64', marginTop:'5px' }}>
                        {profile?.totalRatings ?? 0} ratings
                      </div>
                    </div>

                    {/* Distribution */}
                    <div style={{ flex:1, minWidth:200 }}>
                      {[5,4,3,2,1].map(star => {
                        const count = ratings.filter(r => Math.round(r.score) === star).length;
                        const pct   = ratings.length > 0 ? (count / ratings.length) * 100 : 0;
                        return (
                          <div key={star} style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
                            <span style={{ fontSize:'12px', color:'#6b7a64', width:20, textAlign:'right', flexShrink:0 }}>
                              {star}
                            </span>
                            <span style={{ color:'#f39c12', fontSize:'13px', flexShrink:0 }}>★</span>
                            <div className="dist-bar-track">
                              <div className="dist-bar-fill" style={{ width:`${pct}%` }} />
                            </div>
                            <span style={{ fontSize:'12px', color:'#6b7a64', width:18, flexShrink:0 }}>{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* List */}
                {ratingsLoading ? (
                  <Loader variant="skeleton" count={3} />
                ) : ratings.length === 0 ? (
                  <div className="empty-state-vp">
                    <div className="empty-icon-vp">
                      <Icon.Inbox s={28} />
                    </div>
                    <h3 style={{ fontSize:'17px', fontWeight:700, color:'#141b11', marginBottom:'8px' }}>
                      No ratings yet
                    </h3>
                    <p style={{ fontSize:'14px', color:'#6b7a64' }}>
                      Complete requests to start receiving ratings from users.
                    </p>
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                    {ratings.map((r, i) => (
                      <RatingCard key={r._id || i} rating={r} index={i} />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {ratingsMeta && ratingsMeta.pages > 1 && (
                  <div className="pag-row">
                    <button className="pag-btn" disabled={ratingsPage <= 1} onClick={() => setRatingsPage(p => Math.max(1, p-1))}>
                      <Icon.ChevLeft s={15} />
                    </button>
                    {Array.from({ length: ratingsMeta.pages }, (_, i) => i + 1).map(p => (
                      <button key={p} className={`pag-btn${p === ratingsPage ? ' active' : ''}`} onClick={() => setRatingsPage(p)}>
                        {p}
                      </button>
                    ))}
                    <button className="pag-btn" disabled={ratingsPage >= ratingsMeta.pages} onClick={() => setRatingsPage(p => Math.min(ratingsMeta.pages, p+1))}>
                      <Icon.ChevRight s={15} />
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </Navbar>
    </>
  );
}