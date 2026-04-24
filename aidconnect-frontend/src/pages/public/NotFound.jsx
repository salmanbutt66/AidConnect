// src/pages/public/NotFound.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1a2744 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: '480px', width: '100%' }}>

        {/* 404 number */}
        <div
          style={{
            fontSize: 'clamp(80px, 20vw, 140px)',
            fontWeight: 900,
            lineHeight: 1,
            background: 'linear-gradient(90deg, var(--green-400), var(--green-300))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px',
          }}
        >
          404
        </div>

        {/* Icon */}
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🗺️</div>

        {/* Heading */}
        <h1
          style={{
            fontSize: 'clamp(22px, 4vw, 30px)',
            fontWeight: 800,
            color: 'white',
            marginBottom: '12px',
          }}
        >
          Page Not Found
        </h1>

        {/* Description */}
        <p
          style={{
            fontSize: '15px',
            color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.7,
            marginBottom: '36px',
          }}
        >
          The page you are looking for doesn't exist or has been moved.
          Let's get you back to safety.
        </p>

        {/* Action buttons */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '32px',
          }}
        >
          <button
            className="btn btn-ghost"
            onClick={() => navigate(-1)}
            style={{
              color: 'rgba(255,255,255,0.8)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            ← Go Back
          </button>
          <Link
            to="/"
            className="btn btn-primary"
          >
            🏠 Back to Home
          </Link>
        </div>

        {/* Quick links */}
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: '24px',
          }}
        >
          <p
            style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.35)',
              marginBottom: '14px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontWeight: 600,
            }}
          >
            Quick Links
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { label: 'Login',        to: '/login'       },
              { label: 'Register',     to: '/register'    },
              { label: 'How It Works', to: '/how-it-works'},
              { label: 'About',        to: '/about'       },
            ].map((link) => (
              <Link
                key={link.label}
                to={link.to}
                style={{
                  fontSize: '13px',
                  color: 'var(--green-400)',
                  textDecoration: 'none',
                  fontWeight: 500,
                  transition: 'opacity var(--t-fast)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* AidConnect branding */}
        <div
          style={{
            marginTop: '40px',
            fontSize: '13px',
            color: 'rgba(255,255,255,0.2)',
            fontWeight: 600,
          }}
        >
          Aid<span style={{ color: 'var(--green-600)' }}>Connect</span>
        </div>

      </div>
    </div>
  );
}