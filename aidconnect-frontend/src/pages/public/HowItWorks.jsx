// src/pages/public/HowItWorks.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../../components/common/Footer.jsx';

// ── Detailed steps per role ────────────────────────────────────────────────
const ROLE_STEPS = {
  citizen: {
    label: 'As a Citizen',
    emoji: '🙋',
    color: 'var(--green-600)',
    steps: [
      { icon: '📝', title: 'Create Account',    desc: 'Register in under a minute. Just your name, email, and location.' },
      { icon: '🆘', title: 'Post a Request',    desc: 'Describe your emergency, set urgency level, and confirm your location.' },
      { icon: '⚡', title: 'Get Matched',       desc: 'Our system instantly finds the nearest verified helpers for your need.' },
      { icon: '📍', title: 'Track Progress',    desc: 'See real-time status updates as your request moves from posted to completed.' },
      { icon: '⭐', title: 'Rate & Review',     desc: 'After the emergency, rate your responder to help build community trust.' },
    ],
  },
  volunteer: {
    label: 'As a Volunteer',
    emoji: '🤝',
    color: 'var(--blue-600, #2563eb)',
    steps: [
      { icon: '📋', title: 'Register & Profile', desc: 'Sign up, add your skills, blood group, and set your service radius.' },
      { icon: '✅', title: 'Get Verified',        desc: 'Admin reviews your profile. Once approved, you can start responding.' },
      { icon: '🔔', title: 'Receive Alerts',      desc: 'Get notified of nearby emergencies that match your skills and location.' },
      { icon: '🚀', title: 'Accept & Respond',    desc: 'Accept a request and head to the location. Your status updates in real time.' },
      { icon: '📈', title: 'Build Reputation',    desc: 'Every completed request improves your reliability score and community ranking.' },
    ],
  },
  provider: {
    label: 'As an Organization',
    emoji: '🏥',
    color: 'var(--orange-600, #ea580c)',
    steps: [
      { icon: '🏢', title: 'Register Organization', desc: 'Add your org details, service type, license number, and operating hours.' },
      { icon: '🛡️', title: 'Admin Verification',    desc: 'Our team verifies your license and organization before you go live.' },
      { icon: '🟢', title: 'Set Availability',      desc: 'Toggle availability on/off anytime. Set your operating hours easily.' },
      { icon: '📨', title: 'View Requests',         desc: 'See incoming requests relevant to your service type, sorted by urgency.' },
      { icon: '🤝', title: 'Accept & Help',         desc: 'Accept a request to get assigned. The requester is notified instantly.' },
    ],
  },
};

// ── FAQ data ───────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: 'Is AidConnect free to use?',
    a: 'Yes — completely free for citizens, volunteers, and organizations.',
  },
  {
    q: 'How are volunteers and providers verified?',
    a: 'Every volunteer and provider goes through an admin review before they can respond to requests. Providers must submit a valid license number.',
  },
  {
    q: 'How fast is the response?',
    a: 'Our matching engine notifies nearby responders instantly. Average acceptance time is under 3 minutes.',
  },
  {
    q: 'What cities does AidConnect cover?',
    a: 'We currently support all major cities in Pakistan including Karachi, Lahore, Islamabad, Rawalpindi, Peshawar, and more.',
  },
  {
    q: 'Can I be both a citizen and a volunteer?',
    a: 'Currently each account has one role. You can register a second account with a different email to use both roles.',
  },
  {
    q: 'What happens if no one accepts my request?',
    a: 'Your request stays visible to all nearby responders until accepted. For life-threatening emergencies always call 1122 directly.',
  },
];

export default function HowItWorks() {
  const [activeRole, setActiveRole] = useState('citizen');
  const [openFaq,    setOpenFaq]    = useState(null);

  const current = ROLE_STEPS[activeRole];

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
          <Link
            to="/about"
            style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', textDecoration: 'none', padding: '6px 12px' }}
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
          background: 'linear-gradient(135deg, #0f172a 0%, #1a2744 100%)',
          color: 'white',
          padding: '80px 24px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '52px', marginBottom: '20px' }}>⚡</div>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 900, marginBottom: '16px' }}>
          How AidConnect Works
        </h1>
        <p
          style={{
            fontSize: '16px',
            color: 'rgba(255,255,255,0.65)',
            maxWidth: '520px',
            margin: '0 auto',
            lineHeight: 1.7,
          }}
        >
          From emergency to response in under 3 minutes.
          Here's exactly how the platform works for each type of user.
        </p>
      </section>

      {/* ── Role tabs ───────────────────────────────────────────────────── */}
      <section style={{ padding: '64px 24px', maxWidth: '860px', margin: '0 auto' }}>
        {/* Tab switcher */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '48px',
            flexWrap: 'wrap',
          }}
        >
          {Object.entries(ROLE_STEPS).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setActiveRole(key)}
              style={{
                padding: '10px 20px',
                borderRadius: 'var(--radius-full)',
                border: activeRole === key
                  ? `2px solid ${val.color}`
                  : '2px solid var(--stone-200)',
                background: activeRole === key ? val.color : 'white',
                color: activeRole === key ? 'white' : 'var(--text-mid)',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
            >
              {val.emoji} {val.label}
            </button>
          ))}
        </div>

        {/* Steps for active role */}
        <div style={{ position: 'relative' }}>
          {/* Vertical connector line */}
          <div
            style={{
              position: 'absolute',
              left: '27px',
              top: '40px',
              bottom: '40px',
              width: '2px',
              background: 'var(--stone-200)',
              zIndex: 0,
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {current.steps.map((step, index) => (
              <div
                key={step.title}
                className="card"
                style={{
                  display: 'flex',
                  gap: '20px',
                  alignItems: 'flex-start',
                  position: 'relative',
                  zIndex: 1,
                  padding: '20px 24px',
                }}
              >
                {/* Step number circle */}
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: 'var(--radius-full)',
                    background: current.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 800,
                    fontSize: '16px',
                    flexShrink: 0,
                    boxShadow: '0 0 0 4px white',
                  }}
                >
                  {index + 1}
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '20px' }}>{step.icon}</span>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                      {step.title}
                    </h3>
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Request lifecycle ────────────────────────────────────────────── */}
      <section style={{ background: 'white', padding: '80px 24px' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <h2
            style={{
              fontSize: '26px',
              fontWeight: 800,
              marginBottom: '12px',
              textAlign: 'center',
            }}
          >
            Request Lifecycle
          </h2>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-muted)',
              textAlign: 'center',
              marginBottom: '40px',
            }}
          >
            Every help request goes through these stages
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            {[
              { label: 'Posted',      color: 'var(--blue-500,  #3b82f6)', emoji: '📤' },
              { label: 'Accepted',    color: 'var(--orange-500,#f97316)', emoji: '✅' },
              { label: 'In Progress', color: 'var(--orange-600,#ea580c)', emoji: '🚀' },
              { label: 'Completed',   color: 'var(--green-600)',           emoji: '🎉' },
            ].map((stage, i, arr) => (
              <React.Fragment key={stage.label}>
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: 'var(--radius-full)',
                      background: stage.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                      margin: '0 auto 8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }}
                  >
                    {stage.emoji}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-mid)' }}>
                    {stage.label}
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <div
                    style={{
                      fontSize: '20px',
                      color: 'var(--stone-300)',
                      marginBottom: '20px',
                    }}
                  >
                    →
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', maxWidth: '720px', margin: '0 auto' }}>
        <h2
          style={{
            fontSize: '26px',
            fontWeight: 800,
            marginBottom: '40px',
            textAlign: 'center',
          }}
        >
          Frequently Asked Questions
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="card"
              style={{ padding: '0', overflow: 'hidden', cursor: 'pointer' }}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
            >
              {/* Question row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  gap: '12px',
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{faq.q}</span>
                <span
                  style={{
                    fontSize: '18px',
                    color: 'var(--text-muted)',
                    flexShrink: 0,
                    transition: 'transform 0.2s',
                    transform: openFaq === i ? 'rotate(45deg)' : 'none',
                  }}
                >
                  +
                </span>
              </div>

              {/* Answer */}
              {openFaq === i && (
                <div
                  style={{
                    padding: '0 20px 16px',
                    fontSize: '14px',
                    color: 'var(--text-muted)',
                    lineHeight: 1.7,
                    borderTop: '1px solid var(--stone-100)',
                    paddingTop: '14px',
                  }}
                >
                  {faq.a}
                </div>
              )}
            </div>
          ))}
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
          Ready to Get Started?
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
          Join AidConnect today — whether you need help or want to give it.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register" className="btn btn-primary"
            style={{ fontSize: '15px', padding: '12px 28px' }}
          >
            Create Account
          </Link>
          <Link to="/"
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
            Back to Home
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}