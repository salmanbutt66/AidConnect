// src/components/common/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { APP_NAME, APP_TAGLINE } from '../../utils/constants.js';

// ─── Footer link columns ──────────────────────────────────────────────────────
const LINKS = {
  Platform: [
    { label: 'Home',         to: '/' },
    { label: 'How It Works', to: '/how-it-works' },
    { label: 'About Us',     to: '/about' },
  ],
  'Get Involved': [
    { label: 'Become a Volunteer',   to: '/register?role=volunteer' },
    { label: 'Register as Provider', to: '/register?role=provider' },
    { label: 'Post a Request',       to: '/register?role=user' },
  ],
  Emergency: [
    { label: 'Rescue 1122',     href: 'tel:1122' },
    { label: 'Edhi Foundation', href: 'tel:115'  },
    { label: 'Police',          href: 'tel:15'   },
    { label: 'Ambulance',       href: 'tel:1122' },
  ],
};

// ─── Shared link style ────────────────────────────────────────────────────────
const linkStyle = {
  fontSize: '13px',
  color: 'rgba(255,255,255,0.55)',
  textDecoration: 'none',
  transition: 'color var(--t-fast)',
};
const onHoverIn  = (e) => (e.currentTarget.style.color = 'white');
const onHoverOut = (e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)');

// ─── Footer ───────────────────────────────────────────────────────────────────
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="landing-footer" style={{ flexDirection: 'column', gap: '40px' }}>

      {/* ── Top row: brand + link columns ───────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '40px',
          width: '100%',
        }}
      >

        {/* Brand + tagline + emergency pill */}
        <div style={{ maxWidth: '260px' }}>
          <div className="footer-brand">
            Aid<span style={{ color: 'var(--green-300)' }}>Connect</span>
          </div>
          <p
            style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.5)',
              marginTop: '10px',
              lineHeight: 1.7,
              marginBottom: 0,
            }}
          >
            {APP_TAGLINE}. Built for Pakistan, powered by community.
          </p>

          {/* Emergency hotline pill */}
          <a
            href="tel:1122"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              marginTop: '16px',
              padding: '8px 14px',
              background: 'var(--danger)',
              borderRadius: 'var(--radius-full)',
              fontSize: '13px',
              fontWeight: 700,
              color: 'white',
              textDecoration: 'none',
              transition: 'opacity var(--t-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            🚨 Emergency: 1122
          </a>
        </div>

        {/* Link columns */}
        <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
          {Object.entries(LINKS).map(([section, items]) => (
            <div key={section}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '1.2px',
                  textTransform: 'uppercase',
                  color: 'var(--green-300)',
                  marginBottom: '14px',
                }}
              >
                {section}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {items.map((item) =>
                  item.href ? (
                    <a
                      key={item.label}
                      href={item.href}
                      style={linkStyle}
                      onMouseEnter={onHoverIn}
                      onMouseLeave={onHoverOut}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      key={item.label}
                      to={item.to}
                      style={linkStyle}
                      onMouseEnter={onHoverIn}
                      onMouseLeave={onHoverOut}
                    >
                      {item.label}
                    </Link>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom bar: copyright + legal ───────────────────────────────── */}
      <div
        style={{
          width: '100%',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          paddingTop: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
          © {year} {APP_NAME}. Built with ❤️ for Pakistan. CS 343 Web Technologies — NUST SEECS.
        </p>
        <div style={{ display: 'flex', gap: '20px' }}>
          {['Privacy Policy', 'Terms of Use'].map((label) => (
            <span
              key={label}
              style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', cursor: 'default' }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

    </footer>
  );
}