import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Target,
  Zap,
  Users,
  ShieldCheck,
  Clock,
  ArrowRight,
  Activity,
  Droplets,
  Car,
  CloudLightning,
  Heart,
  HelpCircle,
  Ambulance,
  Building2,
  HandHeart,
  ChevronRight,
  MapPin,
  Star,
  TrendingUp,
  Phone,
  Menu,
  X,
} from 'lucide-react';
import Footer from '../../components/common/Footer.jsx';
import { APP_NAME, APP_TAGLINE } from '../../utils/constants.js';

const STATS = [
  { value: '10,000+', label: 'Lives Impacted',       icon: Heart },
  { value: '500+',    label: 'Verified Volunteers',   icon: Users },
  { value: '200+',    label: 'Partner Organizations', icon: Building2 },
  { value: '<3 min',  label: 'Avg. Response Time',    icon: Clock },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    Icon: AlertTriangle,
    iconColor: '#ef4444',
    iconBg: 'rgba(239,68,68,0.12)',
    title: 'Post a Request',
    desc: 'Describe your emergency, set urgency level, and share your location in seconds.',
  },
  {
    step: '02',
    Icon: Target,
    iconColor: 'var(--green-400)',
    iconBg: 'rgba(77,184,112,0.12)',
    title: 'Smart Matching',
    desc: 'Our system instantly finds the nearest verified volunteers and providers for your need.',
  },
  {
    step: '03',
    Icon: Zap,
    iconColor: '#f59e0b',
    iconBg: 'rgba(245,158,11,0.12)',
    title: 'Help Arrives',
    desc: 'A responder accepts your request and is on the way. Track status in real time.',
  },
];

const ROLES = [
  {
    Icon: HelpCircle,
    iconColor: 'var(--green-400)',
    iconBg: 'rgba(77,184,112,0.12)',
    borderAccent: 'var(--green-500)',
    title: 'Citizens',
    desc: 'Post emergency requests and get connected to help instantly from your community.',
    cta: 'Post a Request',
    to: '/register?role=user',
  },
  {
    Icon: HandHeart,
    iconColor: '#60a5fa',
    iconBg: 'rgba(96,165,250,0.12)',
    borderAccent: '#3b82f6',
    title: 'Volunteers',
    desc: 'Sign up to respond to nearby emergencies with your skills and make a real difference.',
    cta: 'Become a Volunteer',
    to: '/register?role=volunteer',
  },
  {
    Icon: Building2,
    iconColor: '#f59e0b',
    iconBg: 'rgba(245,158,11,0.12)',
    borderAccent: '#f59e0b',
    title: 'Organizations',
    desc: 'Register your NGO, hospital, or service to be part of the national response network.',
    cta: 'Register Organization',
    to: '/register?role=provider',
  },
];

const EMERGENCY_TYPES = [
  { Icon: Activity,        label: 'Medical',        color: '#60a5fa' },
  { Icon: Droplets,        label: 'Blood Request',  color: '#f87171' },
  { Icon: Car,             label: 'Accident',       color: '#fbbf24' },
  { Icon: CloudLightning,  label: 'Disaster',       color: '#a78bfa' },
  { Icon: Heart,           label: 'Mental Health',  color: '#f472b6' },
  { Icon: Users,           label: 'Missing Person', color: '#34d399' },
];

const SERVICE_CHIPS = [
  { Icon: Ambulance,   label: 'Ambulance',   color: '#f87171' },
  { Icon: Building2,   label: 'Hospital',    color: '#60a5fa' },
  { Icon: Droplets,    label: 'Blood Bank',  color: '#fb7185' },
  { Icon: ShieldCheck, label: 'Rescue',      color: '#34d399' },
  { Icon: HandHeart,   label: 'NGO',         color: '#a78bfa' },
  { Icon: HelpCircle,  label: 'Other',       color: '#94a3b8' },
];

const STYLES = `
  .lp-stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
  }

  .lp-how-grid,
  .lp-roles-grid,
  .lp-trust-grid {
    display: grid;
    gap: 24px;
  }

  .lp-how-grid {
    grid-template-columns: repeat(3, 1fr);
    position: relative;
  }

  .lp-roles-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .lp-trust-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 32px;
    text-align: center;
  }

  .lp-network-chips {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 14px;
  }

  @media (max-width: 1100px) {
    .lp-stats-grid,
    .lp-how-grid,
    .lp-roles-grid,
    .lp-trust-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 720px) {
    .lp-stats-grid,
    .lp-how-grid,
    .lp-roles-grid,
    .lp-trust-grid {
      grid-template-columns: 1fr;
    }

    .lp-how-grid::before {
      display: none;
    }

    .lp-network-chips {
      gap: 10px;
    }
  }
`;

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function StatCounter({ value }) {
  return <span>{value}</span>;
}

function NavLink({ to, children }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      to={to}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontSize: '13px',
        fontWeight: 500,
        color: hovered ? 'white' : 'rgba(255,255,255,0.6)',
        textDecoration: 'none',
        padding: '6px 10px',
        borderRadius: '6px',
        transition: 'color 0.2s',
        letterSpacing: '0.1px',
      }}
    >
      {children}
    </Link>
  );
}

function RevealSection({ children, style = {}, delay = 0 }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <style>{STYLES}</style>
<nav style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 200,
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        background: scrolled
          ? 'rgba(7,31,18,0.97)'
          : 'rgba(7,31,18,0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${scrolled ? 'rgba(255,255,255,0.09)' : 'transparent'}`,
        transition: 'background 0.3s, border-color 0.3s, box-shadow 0.3s',
        boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.3)' : 'none',
      }}>
<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px', height: '34px',
            background: 'linear-gradient(135deg, var(--green-600), var(--green-400))',
            borderRadius: '9px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 12px rgba(42,173,96,0.4)',
          }}>
            <ShieldCheck size={18} color="white" strokeWidth={2.5} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '17px', color: 'white', letterSpacing: '-0.4px' }}>
            Aid<span style={{ color: 'var(--green-400)' }}>Connect</span>
          </span>
        </div>
<div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="desktop-nav">
          <NavLink to="/how-it-works">How It Works</NavLink>
          <NavLink to="/about">About</NavLink>
          <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.12)', margin: '0 8px' }} />
          <Link to="/login" style={{
            fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.8)',
            textDecoration: 'none', padding: '8px 16px',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: '8px',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
          >
            Sign In
          </Link>
          <Link to="/register" style={{
            fontSize: '13px', fontWeight: 700, color: 'white',
            textDecoration: 'none', padding: '8px 18px',
            background: 'linear-gradient(135deg, var(--green-700), var(--green-600))',
            borderRadius: '8px',
            boxShadow: '0 2px 12px rgba(42,173,96,0.35)',
            transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(42,173,96,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(42,173,96,0.35)'; }}
          >
            Get Started <ChevronRight size={14} strokeWidth={2.5} />
          </Link>
        </div>
<button
          onClick={() => setMobileMenuOpen(v => !v)}
          style={{
            display: 'none', background: 'transparent', border: 'none',
            color: 'white', cursor: 'pointer', padding: '4px',
          }}
          className="mobile-menu-btn"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>
{mobileMenuOpen && (
        <div style={{
          position: 'fixed', top: '64px', left: 0, right: 0,
          background: 'rgba(7,31,18,0.98)', backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.09)',
          zIndex: 199, padding: '20px',
          display: 'flex', flexDirection: 'column', gap: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          animation: 'fadeSlideDown 0.3s var(--ease)',
        }}>
          <Link to="/how-it-works" onClick={() => setMobileMenuOpen(false)} style={{ color: 'white', textDecoration: 'none', fontSize: '15px', fontWeight: 500 }}>How It Works</Link>
          <Link to="/about" onClick={() => setMobileMenuOpen(false)} style={{ color: 'white', textDecoration: 'none', fontSize: '15px', fontWeight: 500 }}>About</Link>
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <Link to="/login" onClick={() => setMobileMenuOpen(false)} style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '15px', fontWeight: 600 }}>Sign In</Link>
          <Link to="/register" onClick={() => setMobileMenuOpen(false)} style={{
            color: 'white', textDecoration: 'none', fontSize: '15px', fontWeight: 700,
            background: 'linear-gradient(135deg, var(--green-700), var(--green-600))',
            padding: '12px', borderRadius: '8px', textAlign: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
          }}>
            Get Started <ChevronRight size={16} />
          </Link>
        </div>
      )}
<section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(170deg, var(--green-950) 0%, var(--green-900) 55%, #0a2d18 100%)',
        color: 'white',
        padding: '120px 24px 80px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
<div style={{ position: 'absolute', top: '15%', left: '10%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(42,173,96,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '8%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(42,173,96,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
<div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />
<div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '6px 16px 6px 10px',
          background: 'rgba(239,68,68,0.12)',
          border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: '100px',
          fontSize: '12px', fontWeight: 600, color: '#fca5a5',
          marginBottom: '32px',
          animation: 'fadeSlideUp 0.5s ease both',
        }}>
          <span style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: '#ef4444',
            boxShadow: '0 0 0 0 rgba(239,68,68,0.6)',
            animation: 'pulse 2s infinite',
          }} />
          Pakistan's Emergency Coordination Network — Live Now
        </div>
<h1 style={{
          fontSize: 'clamp(40px, 6vw, 72px)',
          fontWeight: 900,
          lineHeight: 1.08,
          letterSpacing: '-2.5px',
          margin: '0 auto 24px',
          maxWidth: '820px',
          animation: 'fadeSlideUp 0.55s ease 80ms both',
        }}>
          Emergency Help,{' '}
          <br />
          <span style={{
            background: 'linear-gradient(90deg, var(--green-400) 0%, var(--green-300) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            When It Matters Most
          </span>
        </h1>
<p style={{
          fontSize: 'clamp(15px, 2vw, 18px)',
          color: 'rgba(255,255,255,0.58)',
          maxWidth: '520px',
          margin: '0 auto 44px',
          lineHeight: 1.75,
          fontWeight: 400,
          animation: 'fadeSlideUp 0.6s ease 160ms both',
        }}>
          {APP_TAGLINE}. Instantly connect with verified volunteers,
          hospitals, blood banks and rescue teams across Pakistan.
        </p>
<div style={{
          display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap',
          marginBottom: '64px',
          animation: 'fadeSlideUp 0.65s ease 240ms both',
        }}>
          <Link to="/register" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '14px 28px', fontSize: '15px', fontWeight: 700,
            background: 'linear-gradient(135deg, var(--green-700), var(--green-600))',
            color: 'white', textDecoration: 'none', borderRadius: '10px',
            boxShadow: '0 4px 24px rgba(42,173,96,0.4)',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(42,173,96,0.55)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(42,173,96,0.4)'; }}
          >
            <AlertTriangle size={16} strokeWidth={2.5} />
            Request Help Now
          </Link>
          <Link to="/how-it-works" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '14px 28px', fontSize: '15px', fontWeight: 600,
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.14)',
            color: 'rgba(255,255,255,0.85)', textDecoration: 'none', borderRadius: '10px',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.13)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
          >
            See How It Works
            <ArrowRight size={15} />
          </Link>
        </div>
<div style={{
          display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap',
          animation: 'fadeSlideUp 0.7s ease 320ms both',
        }}>
          {EMERGENCY_TYPES.map(({ Icon, label, color }) => (
            <div key={label} style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              padding: '7px 14px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '100px',
              fontSize: '12px', fontWeight: 500,
              color: 'rgba(255,255,255,0.65)',
              transition: 'all 0.2s', cursor: 'default',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
            >
              <Icon size={12} color={color} strokeWidth={2.5} />
              {label}
            </div>
          ))}
        </div>
<div style={{
          position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
          color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: 500,
          animation: 'float 3s ease-in-out infinite',
        }}>
          <span>Scroll</span>
          <div style={{ width: '1px', height: '28px', background: 'linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)' }} />
        </div>
      </section>
<section style={{
        background: 'linear-gradient(90deg, var(--green-900), var(--green-800))',
        padding: '0',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div className="lp-stats-grid" style={{ maxWidth: '1000px', margin: '0 auto' }}>
          {STATS.map(({ value, label, icon: Icon }, i) => (
            <div key={label} style={{
              padding: '32px 24px',
              textAlign: 'center',
              borderRight: i < STATS.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
            }}>
              <div style={{
                width: '40px', height: '40px',
                background: 'rgba(255,255,255,0.07)',
                borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px',
              }}>
                <Icon size={18} color="var(--green-300)" strokeWidth={1.8} />
              </div>
              <div style={{
                fontSize: '30px', fontWeight: 900, color: 'white',
                letterSpacing: '-1px', lineHeight: 1, marginBottom: '6px',
              }}>
                <StatCounter value={value} />
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>
<section style={{ padding: '96px 24px', maxWidth: '1040px', margin: '0 auto' }}>
        <RevealSection>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              fontSize: '11px', fontWeight: 700, letterSpacing: '2px',
              textTransform: 'uppercase', color: 'var(--green-600)',
              marginBottom: '12px',
            }}>
              <TrendingUp size={12} />
              The Process
            </div>
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 800, color: 'var(--text-dark)', letterSpacing: '-1px', lineHeight: 1.15, marginBottom: '12px' }}>
              From Emergency to Response
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-muted)', maxWidth: '460px', margin: '0 auto', lineHeight: 1.7 }}>
              Under 3 minutes from posting to help arriving. Here's how it works.
            </p>
          </div>
        </RevealSection>

        <div className="lp-how-grid">
<div style={{
            position: 'absolute', top: '72px', left: 'calc(16.66% + 20px)', right: 'calc(16.66% + 20px)',
            height: '2px',
            background: 'linear-gradient(90deg, rgba(42,173,96,0.2), var(--green-400), rgba(42,173,96,0.2))',
            zIndex: 0, pointerEvents: 'none',
          }} />

          {HOW_IT_WORKS.map(({ step, Icon, iconColor, iconBg, title, desc }, i) => (
            <RevealSection key={step} delay={i * 120}>
              <div style={{
                background: 'white', borderRadius: '16px',
                border: '1px solid var(--stone-200)',
                padding: '32px 28px',
                textAlign: 'center',
                position: 'relative', zIndex: 1,
                transition: 'all 0.25s ease',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.12)'; e.currentTarget.style.borderColor = 'var(--green-200)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = 'var(--stone-200)'; }}
              >
<div style={{
                  position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--green-800)', color: 'white',
                  fontSize: '11px', fontWeight: 800, letterSpacing: '1px',
                  padding: '4px 12px', borderRadius: '100px',
                  boxShadow: '0 2px 8px rgba(26,107,60,0.35)',
                }}>
                  STEP {step}
                </div>

                <div style={{
                  width: '64px', height: '64px', borderRadius: '16px',
                  background: iconBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '16px auto 20px',
                  border: `1px solid ${iconColor}20`,
                }}>
                  <Icon size={28} color={iconColor} strokeWidth={1.8} />
                </div>

                <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '10px' }}>
                  {title}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.75, margin: 0 }}>
                  {desc}
                </p>
              </div>
            </RevealSection>
          ))}
        </div>
      </section>
<section style={{ padding: '96px 24px', background: 'white' }}>
        <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
          <RevealSection>
            <div style={{ textAlign: 'center', marginBottom: '56px' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                fontSize: '11px', fontWeight: 700, letterSpacing: '2px',
                textTransform: 'uppercase', color: 'var(--green-600)',
                marginBottom: '12px',
              }}>
                <Users size={12} />
                For Everyone
              </div>
              <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 800, color: 'var(--text-dark)', letterSpacing: '-1px', lineHeight: 1.15, marginBottom: '12px' }}>
                Who Is AidConnect For?
              </h2>
              <p style={{ fontSize: '15px', color: 'var(--text-muted)', maxWidth: '460px', margin: '0 auto', lineHeight: 1.7 }}>
                Built for every role in Pakistan's emergency ecosystem.
              </p>
            </div>
          </RevealSection>

          <div className="lp-roles-grid">
            {ROLES.map(({ Icon, iconColor, iconBg, borderAccent, title, desc, cta, to }, i) => (
              <RevealSection key={title} delay={i * 100}>
                <div style={{
                  background: 'white', borderRadius: '18px',
                  border: '1px solid var(--stone-200)',
                  padding: '32px 28px',
                  display: 'flex', flexDirection: 'column',
                  height: '100%',
                  position: 'relative', overflow: 'hidden',
                  transition: 'all 0.28s ease',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.boxShadow = '0 20px 48px rgba(0,0,0,0.12)';
                    e.currentTarget.style.borderColor = borderAccent + '55';
                    e.currentTarget.querySelector('.role-accent-line').style.width = '100%';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)';
                    e.currentTarget.style.borderColor = 'var(--stone-200)';
                    e.currentTarget.querySelector('.role-accent-line').style.width = '40px';
                  }}
                >
<div className="role-accent-line" style={{
                    position: 'absolute', top: 0, left: 0,
                    height: '3px', width: '40px',
                    background: borderAccent,
                    borderRadius: '0 3px 3px 0',
                    transition: 'width 0.35s ease',
                  }} />

                  <div style={{
                    width: '56px', height: '56px', borderRadius: '14px',
                    background: iconBg, border: `1px solid ${iconColor}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '20px',
                  }}>
                    <Icon size={24} color={iconColor} strokeWidth={1.8} />
                  </div>

                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '10px' }}>
                    {title}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.75, flex: 1, marginBottom: '24px' }}>
                    {desc}
                  </p>

                  <Link to={to} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '7px',
                    fontSize: '13px', fontWeight: 700,
                    color: iconColor, textDecoration: 'none',
                    transition: 'gap 0.2s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.gap = '11px'; }}
                    onMouseLeave={e => { e.currentTarget.style.gap = '7px'; }}
                  >
                    {cta} <ArrowRight size={14} strokeWidth={2.5} />
                  </Link>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>
<section style={{ padding: '96px 24px', background: 'var(--green-50)' }}>
        <div style={{ maxWidth: '840px', margin: '0 auto' }}>
          <RevealSection>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                fontSize: '11px', fontWeight: 700, letterSpacing: '2px',
                textTransform: 'uppercase', color: 'var(--green-600)',
                marginBottom: '12px',
              }}>
                <MapPin size={12} />
                Our Network
              </div>
              <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 800, color: 'var(--text-dark)', letterSpacing: '-1px', lineHeight: 1.15, marginBottom: '12px' }}>
                Verified Services Nationwide
              </h2>
              <p style={{ fontSize: '15px', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto', lineHeight: 1.7 }}>
                Partner organizations across Pakistan ready to respond the moment you need them.
              </p>
            </div>
          </RevealSection>

          <RevealSection delay={100}>
            <div className="lp-network-chips">
              {SERVICE_CHIPS.map(({ Icon, label, color }) => (
                <div key={label} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '10px',
                  padding: '14px 22px',
                  background: 'white',
                  border: '1px solid var(--stone-200)',
                  borderRadius: '12px',
                  fontSize: '14px', fontWeight: 600,
                  color: 'var(--text-dark)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  cursor: 'default',
                  transition: 'all 0.22s ease',
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.11)';
                    e.currentTarget.style.borderColor = color + '55';
                    e.currentTarget.style.background = color + '08';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                    e.currentTarget.style.borderColor = 'var(--stone-200)';
                    e.currentTarget.style.background = 'white';
                  }}
                >
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: color + '18',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={16} color={color} strokeWidth={2} />
                  </div>
                  {label}
                </div>
              ))}
            </div>
          </RevealSection>
        </div>
      </section>
<section style={{ padding: '64px 24px', background: 'white', borderTop: '1px solid var(--stone-200)', borderBottom: '1px solid var(--stone-200)' }}>
        <RevealSection>
          <div className="lp-trust-grid" style={{ maxWidth: '800px', margin: '0 auto' }}>
            {[
              { Icon: ShieldCheck, color: 'var(--green-700)', bg: 'var(--green-100)', title: 'Verified Responders', desc: 'Every volunteer and organization is manually verified before joining the network.' },
              { Icon: Phone, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', title: '24/7 Availability', desc: 'Our platform and partner network operates around the clock, every day of the year.' },
              { Icon: Star, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', title: 'Rated & Reviewed', desc: 'Transparent ratings keep quality high and help seekers informed about who is helping.' },
            ].map(({ Icon, color, bg, title, desc }) => (
              <div key={title}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Icon size={22} color={color} strokeWidth={1.8} />
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '8px' }}>{title}</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </RevealSection>
      </section>
<section style={{
        background: 'linear-gradient(170deg, var(--green-950) 0%, var(--green-900) 100%)',
        color: 'white',
        padding: '100px 24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '600px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(42,173,96,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />

        <RevealSection>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: 'clamp(30px, 4.5vw, 52px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: '16px' }}>
              Ready to Make a Difference?
            </h2>
            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.58)', maxWidth: '440px', margin: '0 auto 40px', lineHeight: 1.75 }}>
              Join thousands of Pakistanis already connected through {APP_NAME}.
              Every second counts in an emergency.
            </p>
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register" style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '14px 30px', fontSize: '15px', fontWeight: 700,
                background: 'linear-gradient(135deg, var(--green-700), var(--green-600))',
                color: 'white', textDecoration: 'none', borderRadius: '10px',
                boxShadow: '0 4px 24px rgba(42,173,96,0.4)',
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(42,173,96,0.55)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(42,173,96,0.4)'; }}
              >
                Join {APP_NAME} <ChevronRight size={16} />
              </Link>
              <Link to="/about" style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '14px 28px', fontSize: '15px', fontWeight: 600,
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)',
                color: 'rgba(255,255,255,0.85)', textDecoration: 'none', borderRadius: '10px',
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.13)'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
              >
                Learn More
              </Link>
            </div>
          </div>
        </RevealSection>
      </section>
<style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
        @media (max-width: 900px) {
          section > div[style*="grid-template-columns: repeat(3"] ,
          section > div > div[style*="grid-template-columns: repeat(3"] {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 640px) {
          section > div[style*="grid-template-columns: repeat(4"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>

      <Footer />
    </div>
  );
}