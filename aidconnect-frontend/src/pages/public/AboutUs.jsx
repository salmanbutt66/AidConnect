// src/pages/public/AboutUs.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '../../components/common/Footer.jsx';

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
  { emoji: '⚡', title: 'Speed',       desc: 'Every second matters in an emergency. Our system is built for instant response.' },
  { emoji: '🔒', title: 'Trust',       desc: 'All volunteers and providers are verified before they can respond to requests.' },
  { emoji: '🌍', title: 'Reach',       desc: 'Built for Pakistan — covering cities from Karachi to Peshawar.' },
  { emoji: '❤️', title: 'Community',   desc: 'Powered by ordinary citizens who care about their neighbors.' },
];

export default function AboutUs() {
  return (
    <div style={{ background: 'var(--stone-50)', minHeight: '100vh' }}>

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(15,23,42,0.97)',
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
          <Link to="/how-it-works"
            style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', textDecoration: 'none', padding: '6px 12px' }}
          >
            How It Works
          </Link>
          <Link to="/login" className="btn btn-ghost btn-sm"
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
      <section
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1a2744 100%)',
          color: 'white',
          padding: '80px 24px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '52px', marginBottom: '20px' }}>🤝</div>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 900, marginBottom: '16px' }}>
          About AidConnect
        </h1>
        <p
          style={{
            fontSize: '16px',
            color: 'rgba(255,255,255,0.65)',
            maxWidth: '560px',
            margin: '0 auto',
            lineHeight: 1.7,
          }}
        >
          We are four computer science students from NUST SEECS who built
          Pakistan's first real-time emergency coordination platform — because
          we believe no one should face a crisis alone.
        </p>
      </section>

      {/* ── Mission ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', maxWidth: '860px', margin: '0 auto' }}>
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '48px 40px',
            background: 'linear-gradient(135deg, var(--green-700), var(--green-600))',
            color: 'white',
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '16px' }}>🎯</div>
          <h2 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '16px' }}>
            Our Mission
          </h2>
          <p style={{ fontSize: '16px', lineHeight: 1.8, opacity: 0.9, maxWidth: '600px', margin: '0 auto' }}>
            To eliminate the chaos of emergency response in Pakistan by building
            a smart, real-time coordination system that connects help seekers
            with verified volunteers, hospitals, blood banks, and rescue teams
            — in under three minutes.
          </p>
        </div>
      </section>

      {/* ── The problem we solve ─────────────────────────────────────────── */}
      <section style={{ padding: '0 24px 80px', maxWidth: '860px', margin: '0 auto' }}>
        <h2
          style={{
            fontSize: '28px',
            fontWeight: 800,
            marginBottom: '32px',
            textAlign: 'center',
          }}
        >
          The Problem We Solve
        </h2>
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
            { emoji: '❓', problem: 'People don\'t know what help is available nearby'      },
          ].map((item) => (
            <div
              key={item.problem}
              className="card"
              style={{
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start',
                padding: '20px',
              }}
            >
              <span style={{ fontSize: '28px', flexShrink: 0 }}>{item.emoji}</span>
              <p style={{ fontSize: '14px', color: 'var(--text-mid)', lineHeight: 1.6, margin: 0 }}>
                {item.problem}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Values ──────────────────────────────────────────────────────── */}
      <section
        style={{
          background: 'white',
          padding: '80px 24px',
        }}
      >
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <h2
            style={{
              fontSize: '28px',
              fontWeight: 800,
              marginBottom: '40px',
              textAlign: 'center',
            }}
          >
            What We Stand For
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '20px',
            }}
          >
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="card"
                style={{ textAlign: 'center', padding: '28px 20px' }}
              >
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>{v.emoji}</div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>
                  {v.title}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ────────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', maxWidth: '860px', margin: '0 auto' }}>
        <h2
          style={{
            fontSize: '28px',
            fontWeight: 800,
            marginBottom: '12px',
            textAlign: 'center',
          }}
        >
          Meet the Team
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: 'var(--text-muted)',
            textAlign: 'center',
            marginBottom: '40px',
          }}
        >
          CS 343 Web Technologies — NUST SEECS, Semester 4
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '20px',
          }}
        >
          {TEAM.map((member) => (
            <div
              key={member.name}
              className="card"
              style={{ textAlign: 'center', padding: '28px 20px' }}
            >
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
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>
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
          ))}
        </div>
      </section>

      {/* ── Tech stack ──────────────────────────────────────────────────── */}
      <section
        style={{
          background: 'white',
          padding: '60px 24px',
        }}
      >
        <div style={{ maxWidth: '860px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '28px' }}>
            Built With
          </h2>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            {[
              { label: 'React',     emoji: '⚛️'  },
              { label: 'Node.js',   emoji: '🟢'  },
              { label: 'Express',   emoji: '🚂'  },
              { label: 'MongoDB',   emoji: '🍃'  },
              { label: 'Mongoose',  emoji: '🔗'  },
              { label: 'JWT Auth',  emoji: '🔐'  },
              { label: 'Vite',      emoji: '⚡'  },
            ].map((tech) => (
              <span
                key={tech.label}
                style={{
                  padding: '8px 16px',
                  background: 'var(--stone-50)',
                  border: '1px solid var(--stone-200)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  fontWeight: 600,
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
      <section
        style={{
          background: 'linear-gradient(135deg, #0f172a, #1a2744)',
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
          Join AidConnect today and help build a safer Pakistan.
        </p>
        <Link
          to="/register"
          className="btn btn-primary"
          style={{ fontSize: '15px', padding: '12px 28px' }}
        >
          Join AidConnect →
        </Link>
      </section>

      <Footer />
    </div>
  );
}