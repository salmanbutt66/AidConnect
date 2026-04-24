// src/pages/public/AboutUs.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '../../components/common/Footer.jsx';
import { APP_NAME } from '../../utils/constants.js';

// ── Team members ───────────────────────────────────────────────────────────
const TEAM = [
  {
    name:  'Haseeb',
    role:  'Team Lead & Full Stack',
    emoji: '👨‍💻',
    desc:  'Architecture, auth system, help requests, matching engine, and project coordination.',
  },
  {
    name:  'Salman',
    role:  'Backend & Auth',
    emoji: '🔐',
    desc:  'Authentication, JWT security, volunteer system, and user management.',
  },
  {
    name:  'Samrah',
    role:  'Provider System & Public UI',
    emoji: '🏥',
    desc:  'Provider dashboard, notification system, landing page, and public-facing pages.',
  },
  {
    name:  'Rabia',
    role:  'Admin Panel & Analytics',
    emoji: '📊',
    desc:  'Admin dashboard, analytics, user management, and data visualization.',
  },
];

// ── Core values ────────────────────────────────────────────────────────────
const VALUES = [
  { emoji: '⚡', title: 'Speed',     desc: 'Every second matters in an emergency. Our system is built for instant response.'  },
  { emoji: '🔒', title: 'Trust',     desc: 'All volunteers and providers are verified before they can respond to requests.'    },
  { emoji: '🌍', title: 'Reach',     desc: 'Built for Pakistan — covering cities from Karachi to Peshawar.'                   },
  { emoji: '❤️', title: 'Community', desc: 'Powered by ordinary citizens who care about their neighbors.'                     },
];

// ── Shared nav link style ──────────────────────────────────────────────────
const navLinkStyle = {
  fontSize: '13px',
  color: 'rgba(255,255,255,0.65)',
  textDecoration: 'none',
  padding: '6px 12px',
  borderRadius: 'var(--radius-sm)',
  transition: 'color var(--t-fast)',
};

export default function AboutUs() {
  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      {/* FIX: position sticky → fixed, consistent with Landing.jsx */}
      <nav
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 100,
          background: 'rgba(7,31,18,0.97)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          padding: '0 24px',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link
          to="/"
          style={{ fontWeight: 800, fontSize: '18px', color: 'white', textDecoration: 'none' }}
        >
          Aid<span style={{ color: 'var(--green-400)' }}>Connect</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link
            to="/how-it-works"
            style={navLinkStyle}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
          >
            How It Works
          </Link>
          <Link
            to="/login"
            className="btn btn-ghost btn-sm"
            style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}
          >
            Login
          </Link>
          <Link to="/register" className="btn btn-primary btn-sm">
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      {/* FIX: hardcoded hex → design system vars. paddingTop compensates for fixed nav */}
      <section
        style={{
          background: `linear-gradient(135deg, var(--green-950) 0%, var(--green-900) 100%)`,
          color: 'white',
          padding: '140px 24px 80px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: '52px',
            marginBottom: '20px',
            animation: 'fadeSlideUp var(--t-page) var(--ease) both',
          }}
        >
          🤝
        </div>
        <h1
          style={{
            fontSize: 'clamp(28px, 5vw, 48px)',
            fontWeight: 900,
            marginBottom: '16px',
            animation: 'fadeSlideUp var(--t-page) var(--ease) 100ms both',
          }}
        >
          About {APP_NAME}
        </h1>
        <p
          style={{
            fontSize: '16px',
            color: 'rgba(255,255,255,0.65)',
            maxWidth: '560px',
            margin: '0 auto',
            lineHeight: 1.7,
            animation: 'fadeSlideUp var(--t-page) var(--ease) 200ms both',
          }}
        >
          We are four computer science students from NUST SEECS who built
          Pakistan's first real-time emergency coordination platform — because
          we believe no one should face a crisis alone.
        </p>
      </section>

      {/* ── Mission ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', maxWidth: '860px', margin: '0 auto' }}>
        {/* FIX: inline gradient card → profile-hero CSS class */}
        <div
          className="profile-hero anim-fade-up"
          style={{ justifyContent: 'center', textAlign: 'center', flexDirection: 'column', alignItems: 'center' }}
        >
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🎯</div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '14px', color: 'white' }}>
            Our Mission
          </h2>
          <p style={{ fontSize: '15px', lineHeight: 1.8, color: 'rgba(255,255,255,0.85)', maxWidth: '600px', margin: 0 }}>
            To eliminate the chaos of emergency response in Pakistan by building
            a smart, real-time coordination system that connects help seekers
            with verified volunteers, hospitals, blood banks, and rescue teams
            — in under three minutes.
          </p>
        </div>
      </section>

      {/* ── The problem we solve ─────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 80px', maxWidth: '860px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="section-eyebrow">Why We Built This</div>
          <h2 className="section-h2">The Problem We Solve</h2>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
          }}
        >
          {[
            { emoji: '🩸', problem: 'Blood urgently needed but no structured search system' },
            { emoji: '🚑', problem: 'Ambulances not easily reachable during crises'         },
            { emoji: '🌊', problem: 'During floods and disasters — complete chaos'          },
            { emoji: '❓', problem: "People don't know what help is available nearby"       },
          ].map((item, i) => (
            // FIX: inline padding on .card → .card-body wrapper
            <div
              key={item.problem}
              className="card card-hover anim-fade-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="card-body" style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '28px', flexShrink: 0 }}>{item.emoji}</span>
                <p style={{ fontSize: '14px', color: 'var(--text-mid)', lineHeight: 1.6, margin: 0 }}>
                  {item.problem}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Values ──────────────────────────────────────────────────────── */}
      <section style={{ background: 'white', padding: '80px 24px' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div className="section-eyebrow">Our Principles</div>
            <h2 className="section-h2">What We Stand For</h2>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '20px',
            }}
          >
            {VALUES.map((v, i) => (
              // FIX: inline padding on .card → .card-body wrapper
              <div
                key={v.title}
                className="card card-hover anim-fade-up"
                style={{ textAlign: 'center', animationDelay: `${i * 100}ms` }}
              >
                <div className="card-body">
                  <div style={{ fontSize: '36px', marginBottom: '12px' }}>{v.emoji}</div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-dark)' }}>
                    {v.title}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                    {v.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ────────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', maxWidth: '860px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div className="section-eyebrow">The People</div>
          <h2 className="section-h2">Meet the Team</h2>
          <p className="section-p" style={{ margin: '0 auto' }}>
            CS 343 Web Technologies — NUST SEECS, Semester 4
          </p>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '20px',
          }}
        >
          {TEAM.map((member, i) => (
            // FIX: inline padding on .card → .card-body wrapper
            <div
              key={member.name}
              className="card card-hover anim-fade-up"
              style={{ textAlign: 'center', animationDelay: `${i * 100}ms` }}
            >
              <div className="card-body">
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--green-100)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    margin: '0 auto 14px',
                  }}
                >
                  {member.emoji}
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px', color: 'var(--text-dark)' }}>
                  {member.name}
                </h3>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--green-600)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '10px',
                  }}
                >
                  {member.role}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                  {member.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tech stack ──────────────────────────────────────────────────── */}
      <section style={{ background: 'white', padding: '60px 24px' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '28px', color: 'var(--text-dark)' }}>
            Built With
          </h2>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '12px' }}>
            {[
              { label: 'React',    emoji: '⚛️' },
              { label: 'Node.js',  emoji: '🟢' },
              { label: 'Express',  emoji: '🚂' },
              { label: 'MongoDB',  emoji: '🍃' },
              { label: 'Mongoose', emoji: '🔗' },
              { label: 'JWT Auth', emoji: '🔐' },
              { label: 'Vite',     emoji: '⚡' },
            ].map((tech) => (
              <span
                key={tech.label}
                style={{
                  padding: '8px 16px',
                  background: 'var(--green-50)',
                  border: '1px solid var(--stone-200)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {tech.emoji} {tech.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      {/* FIX: hardcoded hex → design system vars */}
      <section
        style={{
          background: `linear-gradient(135deg, var(--green-950), var(--green-900))`,
          color: 'white',
          padding: '64px 24px',
          textAlign: 'center',
        }}
      >
        <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '12px' }}>
          Be Part of the Solution
        </h2>
        <p
          style={{
            fontSize: '15px',
            color: 'rgba(255,255,255,0.65)',
            maxWidth: '400px',
            margin: '0 auto 28px',
            lineHeight: 1.7,
          }}
        >
          Join {APP_NAME} today and help build a safer Pakistan.
        </p>
        <Link
          to="/register"
          className="btn btn-primary"
          style={{ fontSize: '15px', padding: '12px 28px' }}
        >
          Join {APP_NAME} →
        </Link>
      </section>

      <Footer />
    </div>
  );
}