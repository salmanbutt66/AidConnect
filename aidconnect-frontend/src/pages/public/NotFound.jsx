import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, MapPin } from 'lucide-react';
import { APP_NAME } from '../../utils/constants.js';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, var(--green-950) 0%, var(--green-900) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
<div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />
<div style={{
        position: 'absolute', top: '30%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '500px', height: '300px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(42,173,96,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: '480px', width: '100%', position: 'relative', zIndex: 1 }}>
<div
          style={{
            fontSize: 'clamp(80px, 20vw, 140px)',
            fontWeight: 900,
            lineHeight: 1,
            background: 'linear-gradient(90deg, var(--green-400), var(--green-300))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '8px',
            animation: 'fadeSlideUp var(--t-page) var(--ease) both',
            letterSpacing: '-4px',
          }}
        >
          404
        </div>
<div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            animation: 'fadeSlideUp var(--t-page) var(--ease) 100ms both',
          }}
        >
          <div style={{
            width: '72px', height: '72px',
            borderRadius: '20px',
            background: 'rgba(77,184,112,0.1)',
            border: '1px solid rgba(77,184,112,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'float 3s ease-in-out infinite',
          }}>
            <MapOff size={32} color="var(--green-400)" strokeWidth={1.6} />
          </div>
        </div>
<h1
          style={{
            fontSize: 'clamp(22px, 4vw, 30px)',
            fontWeight: 800,
            color: 'white',
            marginBottom: '12px',
            letterSpacing: '-0.5px',
            animation: 'fadeSlideUp var(--t-page) var(--ease) 150ms both',
          }}
        >
          Page Not Found
        </h1>
<p
          style={{
            fontSize: '15px',
            color: 'rgba(255,255,255,0.5)',
            lineHeight: 1.75,
            marginBottom: '36px',
            animation: 'fadeSlideUp var(--t-page) var(--ease) 200ms both',
          }}
        >
          The page you're looking for doesn't exist or has been moved.
          Let's get you back to safety.
        </p>
<div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '36px',
            animation: 'fadeSlideUp var(--t-page) var(--ease) 250ms both',
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '11px 20px',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 'var(--radius-sm)',
              color: 'rgba(255,255,255,0.8)',
              fontSize: '14px', fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
            }}
          >
            <ArrowLeft size={15} strokeWidth={2.5} />
            Go Back
          </button>

          <Link
            to="/"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '11px 22px',
              background: 'linear-gradient(135deg, var(--green-700), var(--green-600))',
              borderRadius: 'var(--radius-sm)',
              color: 'white',
              fontSize: '14px', fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(42,173,96,0.35)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(42,173,96,0.5)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(42,173,96,0.35)';
            }}
          >
            <Home size={15} strokeWidth={2.5} />
            Back to Home
          </Link>
        </div>
<div style={{
          borderTop: '1px solid rgba(255,255,255,0.07)',
          paddingTop: '28px',
          animation: 'fadeSlideUp var(--t-page) var(--ease) 300ms both',
        }}>
          <p style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.3)',
            marginBottom: '16px',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            fontWeight: 600,
          }}>
            Quick Links
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { label: 'Login',        to: '/login'        },
              { label: 'Register',     to: '/register'     },
              { label: 'How It Works', to: '/how-it-works' },
              { label: 'About',        to: '/about'        },
            ].map((link) => (
              <Link
                key={link.label}
                to={link.to}
                style={{
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.45)',
                  textDecoration: 'none',
                  fontWeight: 500,
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  transition: 'all 0.18s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = 'var(--green-400)';
                  e.currentTarget.style.borderColor = 'rgba(77,184,112,0.3)';
                  e.currentTarget.style.background = 'rgba(77,184,112,0.07)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
<div style={{
          marginTop: '48px',
          fontSize: '13px',
          color: 'rgba(255,255,255,0.18)',
          fontWeight: 700,
          letterSpacing: '-0.3px',
        }}>
          Aid<span style={{ color: 'var(--green-700)' }}>Connect</span>
        </div>

      </div>
    </div>
  );
}