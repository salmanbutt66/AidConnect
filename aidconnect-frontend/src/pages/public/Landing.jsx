// src/pages/public/Landing.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '../../components/common/Footer.jsx';
import { APP_NAME, APP_TAGLINE, EMERGENCY_TYPES, SERVICE_TYPES } from '../../utils/constants.js';

// ── Stats data ─────────────────────────────────────────────────────────────
const STATS = [
  { value: '10,000+', label: 'Lives Impacted'      },
  { value: '500+',    label: 'Verified Volunteers'  },
  { value: '200+',    label: 'Partner Organizations'},
  { value: '<3 min',  label: 'Avg. Response Time'   },
];

// ── How it works steps ─────────────────────────────────────────────────────
const HOW_IT_WORKS = [
  {
    step: '01',
    icon: '🆘',
    title: 'Post a Request',
    desc:  'Describe your emergency, set urgency level, and share your location in seconds.',
  },
  {
    step: '02',
    icon: '🎯',
    title: 'Smart Matching',
    desc:  'Our system instantly finds the nearest verified volunteers and providers for your need.',
  },
  {
    step: '03',
    icon: '🚀',
    title: 'Help Arrives',
    desc:  'A responder accepts your request and is on the way. Track status in real time.',
  },
];

// ── Who can use ────────────────────────────────────────────────────────────
const ROLES = [
  {
    emoji: '🙋',
    title: 'Citizens',
    color: 'var(--green-600)',
    desc:  'Post emergency requests and get connected to help instantly.',
    cta:   'Post a Request',
    to:    '/register?role=user',
  },
  {
    emoji: '🤝',
    title: 'Volunteers',
    color: 'var(--blue-600, #2563eb)',
    desc:  'Sign up to respond to nearby emergencies with your skills.',
    cta:   'Become a Volunteer',
    to:    '/register?role=volunteer',
  },
  {
    emoji: '🏥',
    title: 'Organizations',
    color: 'var(--orange-600, #ea580c)',
    desc:  'Register your NGO, hospital, or service to be part of the network.',
    cta:   'Register Organization',
    to:    '/register?role=provider',
  },
];

export default function Landing() {
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
        {/* Logo */}
        <div style={{ fontWeight: 800, fontSize: '18px', color: 'white' }}>
          Aid<span style={{ color: 'var(--green-400)' }}>Connect</span>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link
            to="/how-it-works"
            style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.65)',
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              transition: 'color var(--t-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
          >
            How It Works
          </Link>
          <Link
            to="/about"
            style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.65)',
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              transition: 'color var(--t-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
          >
            About
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
          background: 'linear-gradient(135deg, #0f172a 0%, #1a2744 60%, #0f2d1f 100%)',
          color: 'white',
          padding: '100px 24px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '600px',
            height: '400px',
            background: 'radial-gradient(ellipse, rgba(34,197,94,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Emergency badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 'var(--radius-full)',
            fontSize: '12px',
            fontWeight: 600,
            color: '#fca5a5',
            marginBottom: '28px',
            letterSpacing: '0.5px',
          }}
        >
          🚨 Pakistan's Emergency Coordination Network
        </div>

        <h1
          style={{
            fontSize: 'clamp(36px, 6vw, 68px)',
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: '24px',
            maxWidth: '800px',
            margin: '0 auto 24px',
          }}
        >
          Help Finds You{' '}
          <span
            style={{
              background: 'linear-gradient(90deg, var(--green-400), var(--green-300))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Faster
          </span>
        </h1>

        <p
          style={{
            fontSize: 'clamp(15px, 2vw, 18px)',
            color: 'rgba(255,255,255,0.65)',
            maxWidth: '560px',
            margin: '0 auto 40px',
            lineHeight: 1.7,
          }}
        >
          {APP_TAGLINE}. Connect with verified volunteers,
          hospitals, blood banks, and rescue teams — in real time.
        </p>

        {/* CTA buttons */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '64px',
          }}
        >
          <Link
            to="/register"
            className="btn btn-primary"
            style={{ fontSize: '15px', padding: '12px 28px' }}
          >
            🆘 Request Help Now
          </Link>
          <Link
            to="/how-it-works"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 28px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 'var(--radius-md)',
              color: 'white',
              fontSize: '15px',
              textDecoration: 'none',
              fontWeight: 600,
              transition: 'background var(--t-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.13)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
          >
            ▶ See How It Works
          </Link>
        </div>

        {/* Emergency types chips */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          {EMERGENCY_TYPES.map((type) => (
            <span
              key={type.value}
              style={{
                padding: '6px 14px',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 'var(--radius-full)',
                fontSize: '13px',
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              {type.emoji} {type.label}
            </span>
          ))}
        </div>
      </section>

      {/* ── Stats bar ───────────────────────────────────────────────────── */}
      <section
        style={{
          background: 'var(--green-700)',
          padding: '32px 24px',
        }}
      >
        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '24px',
            textAlign: 'center',
          }}
        >
          {STATS.map((stat) => (
            <div key={stat.label}>
              <div
                style={{
                  fontSize: '32px',
                  fontWeight: 900,
                  color: 'white',
                  lineHeight: 1,
                  marginBottom: '6px',
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', maxWidth: '960px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px' }}>
            How AidConnect Works
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto' }}>
            From emergency to response in under 3 minutes.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '24px',
          }}
        >
          {HOW_IT_WORKS.map((step) => (
            <div
              key={step.step}
              className="card"
              style={{ textAlign: 'center', padding: '32px 24px' }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--green-600)',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  marginBottom: '16px',
                }}
              >
                Step {step.step}
              </div>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>{step.icon}</div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '10px' }}>
                {step.title}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Who is it for ───────────────────────────────────────────────── */}
      <section
        style={{
          padding: '80px 24px',
          background: 'white',
        }}
      >
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px' }}>
              Who Is AidConnect For?
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto' }}>
              A platform built for every person in Pakistan's emergency ecosystem.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '24px',
            }}
          >
            {ROLES.map((role) => (
              <div
                key={role.title}
                className="card"
                style={{ padding: '32px 24px', textAlign: 'center' }}
              >
                <div style={{ fontSize: '44px', marginBottom: '16px' }}>{role.emoji}</div>
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    marginBottom: '10px',
                    color: role.color,
                  }}
                >
                  {role.title}
                </h3>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-muted)',
                    lineHeight: 1.7,
                    marginBottom: '20px',
                  }}
                >
                  {role.desc}
                </p>
                <Link
                  to={role.to}
                  className="btn btn-ghost btn-sm"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {role.cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Service types ───────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', maxWidth: '960px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '10px' }}>
            Our Network Covers
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Verified organizations across Pakistan ready to respond.
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {SERVICE_TYPES.map((type) => (
            <div
              key={type.value}
              style={{
                padding: '12px 20px',
                background: 'white',
                border: '1px solid var(--stone-200)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: 600,
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <span style={{ fontSize: '20px' }}>{type.emoji}</span>
              {type.label}
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────── */}
      <section
        style={{
          background: 'linear-gradient(135deg, #0f172a, #1a2744)',
          color: 'white',
          padding: '80px 24px',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 900,
            marginBottom: '16px',
          }}
        >
          Ready to Make a Difference?
        </h2>
        <p
          style={{
            fontSize: '15px',
            color: 'rgba(255,255,255,0.65)',
            maxWidth: '460px',
            margin: '0 auto 36px',
            lineHeight: 1.7,
          }}
        >
          Join thousands of Pakistanis already connected through AidConnect.
          Every second counts in an emergency.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/register"
            className="btn btn-primary"
            style={{ fontSize: '15px', padding: '12px 28px' }}
          >
            Join AidConnect
          </Link>
          <Link
            to="/about"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '12px 28px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 'var(--radius-md)',
              color: 'white',
              fontSize: '15px',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Learn More
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}