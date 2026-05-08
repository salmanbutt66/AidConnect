import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../../components/common/Footer.jsx';
import { APP_NAME } from '../../utils/constants.js';
import {
  Zap,
  ShieldCheck,
  Globe,
  Heart,
  Droplets,
  Ambulance,
  CloudRain,
  HelpCircle,
  Code2,
  Lock,
  LayoutDashboard,
  BarChart3,
  ArrowRight,
  Users,
  Target,
  CheckCircle2,
} from 'lucide-react';

const TEAM = [
  {
    name:    'Haseeb',
    role:    'Team Lead & Full Stack',
    Icon:    Code2,
    iconBg:  '#d1fae5',
    iconColor: '#059669',
    desc:    'Architecture, auth system, help requests, matching engine, and project coordination.',
    initial: 'H',
  },
  {
    name:    'Salman',
    role:    'Backend & Auth',
    Icon:    Lock,
    iconBg:  '#dbeafe',
    iconColor: '#2563eb',
    desc:    'Authentication, JWT security, volunteer system, and user management.',
    initial: 'S',
  },
  {
    name:    'Samrah',
    role:    'Provider System & Public UI',
    Icon:    LayoutDashboard,
    iconBg:  '#fce7f3',
    iconColor: '#db2777',
    desc:    'Provider dashboard, notification system, landing page, and public-facing pages.',
    initial: 'S',
  },
  {
    name:    'Rabia',
    role:    'Admin Panel & Analytics',
    Icon:    BarChart3,
    iconBg:  '#fef3c7',
    iconColor: '#d97706',
    desc:    'Admin dashboard, analytics, user management, and data visualization.',
    initial: 'R',
  },
];

const VALUES = [
  { Icon: Zap,         title: 'Speed',     desc: 'Every second matters in an emergency. Our system is built for instant response.',          color: '#f59e0b', bg: '#fffbeb' },
  { Icon: ShieldCheck, title: 'Trust',     desc: 'All volunteers and providers are verified before they can respond to requests.',            color: '#10b981', bg: '#ecfdf5' },
  { Icon: Globe,       title: 'Reach',     desc: 'Built for Pakistan — covering cities from Karachi to Peshawar.',                           color: '#3b82f6', bg: '#eff6ff' },
  { Icon: Heart,       title: 'Community', desc: 'Powered by ordinary citizens who care about their neighbors.',                             color: '#ef4444', bg: '#fef2f2' },
];

const PROBLEMS = [
  { Icon: Droplets,   text: 'Blood urgently needed but no structured search system' },
  { Icon: Ambulance,  text: 'Ambulances not easily reachable during crises'         },
  { Icon: CloudRain,  text: 'During floods and disasters — complete coordination failure' },
  { Icon: HelpCircle, text: "People don't know what help is available nearby"       },
];

const TECH = ['React 18', 'Node.js', 'Express.js', 'MongoDB Atlas', 'Mongoose', 'JWT Auth', 'Vite', 'Bootstrap 5'];

const navLinkStyle = {
  fontSize: '13px',
  color: 'rgba(255,255,255,0.65)',
  textDecoration: 'none',
  padding: '6px 12px',
  borderRadius: 'var(--radius-sm)',
  transition: 'color 0.2s',
};

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

  .about-page * { font-family: 'Plus Jakarta Sans', sans-serif; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.94); }
    to   { opacity: 1; transform: scale(1);    }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }

  .about-fade-up   { animation: fadeUp  0.55s cubic-bezier(.22,.68,0,1.2) both; }
  .about-scale-in  { animation: scaleIn 0.5s  cubic-bezier(.22,.68,0,1.2) both; }

  .about-problem-grid,
  .about-values-grid,
  .about-team-grid {
    display: grid;
    gap: 18px;
  }

  .about-problem-grid {
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  }

  .about-values-grid,
  .about-team-grid {
    grid-template-columns: repeat(auto-fit, minmax(185px, 1fr));
  }

  @media (max-width: 720px) {
    .about-problem-grid,
    .about-values-grid,
    .about-team-grid {
      grid-template-columns: 1fr;
    }
  }

  
  .value-card {
    background: white;
    border: 1px solid #e8ede9;
    border-radius: 16px;
    padding: 28px 24px;
    text-align: center;
    transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
    cursor: default;
  }
  .value-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 20px 48px rgba(0,0,0,0.10);
    border-color: transparent;
  }

  
  .problem-card {
    background: white;
    border: 1px solid #e8ede9;
    border-radius: 14px;
    padding: 20px 22px;
    display: flex;
    align-items: flex-start;
    gap: 16px;
    transition: transform 0.25s ease, box-shadow 0.25s ease;
  }
  .problem-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0,0,0,0.09);
  }

  
  .team-card {
    background: white;
    border: 1px solid #e8ede9;
    border-radius: 16px;
    padding: 28px 22px;
    text-align: center;
    transition: transform 0.28s ease, box-shadow 0.28s ease;
    position: relative;
    overflow: hidden;
  }
  .team-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--green-700), var(--green-400));
    opacity: 0;
    transition: opacity 0.25s;
  }
  .team-card:hover { transform: translateY(-7px); box-shadow: 0 22px 52px rgba(0,0,0,0.11); }
  .team-card:hover::before { opacity: 1; }

  
  .tech-pill {
    padding: 8px 18px;
    background: #f0faf4;
    border: 1px solid #c6e8d1;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 600;
    color: #1a6b3c;
    transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
  }
  .tech-pill:hover {
    background: #1a6b3c;
    color: white;
    border-color: #1a6b3c;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(26,107,60,0.28);
  }

  
  .mission-card {
    background: linear-gradient(135deg, #0d3d22 0%, #1a6b3c 100%);
    border-radius: 20px;
    padding: 56px 40px;
    text-align: center;
    color: white;
    position: relative;
    overflow: hidden;
    box-shadow: 0 24px 64px rgba(13,61,34,0.35);
  }
  .mission-card::after {
    content: '';
    position: absolute;
    top: -60px; right: -60px;
    width: 200px; height: 200px;
    background: radial-gradient(circle, rgba(125,212,154,0.18) 0%, transparent 70%);
    pointer-events: none;
  }

  
  .stat-strip {
    display: flex;
    justify-content: center;
    gap: 0;
    background: white;
    border-radius: 16px;
    border: 1px solid #e8ede9;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(0,0,0,0.06);
  }
  .stat-strip-item {
    flex: 1;
    padding: 28px 20px;
    text-align: center;
    border-right: 1px solid #e8ede9;
    transition: background 0.2s;
  }
  .stat-strip-item:last-child { border-right: none; }
  .stat-strip-item:hover { background: #f0faf4; }

  
  .cta-section {
    background: linear-gradient(135deg, #071f12 0%, #0d3d22 60%, #1a6b3c 100%);
    color: white;
    padding: 80px 24px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .cta-section::before {
    content: '';
    position: absolute;
    inset: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    pointer-events: none;
  }
  .cta-btn-main {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: white;
    color: #0d3d22;
    font-weight: 700;
    font-size: 15px;
    padding: 14px 32px;
    border-radius: 999px;
    text-decoration: none;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 8px 28px rgba(0,0,0,0.22);
  }
  .cta-btn-main:hover {
    transform: translateY(-3px);
    box-shadow: 0 16px 40px rgba(0,0,0,0.30);
    color: #0d3d22;
  }

  
  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(125,212,154,0.15);
    border: 1px solid rgba(125,212,154,0.3);
    border-radius: 999px;
    padding: 6px 16px;
    font-size: 12px;
    font-weight: 600;
    color: #7dd49a;
    letter-spacing: 0.4px;
    text-transform: uppercase;
    margin-bottom: 20px;
  }

  
  .about-eyebrow {
    display: inline-block;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #1a6b3c;
    background: #e0f5e9;
    padding: 4px 14px;
    border-radius: 999px;
    margin-bottom: 12px;
  }
  .about-h2 {
    font-size: clamp(22px, 4vw, 32px);
    font-weight: 800;
    color: #141b11;
    margin: 0 0 10px;
    letter-spacing: -0.5px;
  }
`;

export default function AboutUs() {
  
  const observerRef = useRef(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.animationPlayState = 'running';
            observerRef.current.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    document.querySelectorAll('.scroll-reveal').forEach((el) => {
      el.style.animationPlayState = 'paused';
      observerRef.current.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="about-page" style={{ background: '#f5f7f5', minHeight: '100vh' }}>
<style>{STYLES}</style>
<nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(7,31,18,0.97)', backdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 32px', height: '62px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link to="/" style={{ fontWeight: 800, fontSize: '18px', color: 'white', textDecoration: 'none', letterSpacing: '-0.3px' }}>
          Aid<span style={{ color: '#7dd49a' }}>Connect</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link to="/how-it-works" style={navLinkStyle}
            onMouseEnter={e => e.currentTarget.style.color = 'white'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.65)'}>
            How It Works
          </Link>
          <Link to="/login" className="btn btn-ghost btn-sm" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>Login</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
        </div>
      </nav>
<section style={{
        background: 'linear-gradient(140deg, #071f12 0%, #0d3d22 55%, #1a6b3c 100%)',
        color: 'white', padding: '148px 24px 88px', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
<div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px', height: '600px',
          border: '1px solid rgba(125,212,154,0.08)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '400px', height: '400px',
          border: '1px solid rgba(125,212,154,0.06)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />

        <div className="about-fade-up" style={{ animationDelay: '0ms' }}>
          <div className="hero-badge">
            <Users size={11} />
            NUST SEECS · CS 343 · Spring 2026
          </div>
        </div>

        <h1 className="about-fade-up" style={{
          fontSize: 'clamp(30px, 6vw, 54px)', fontWeight: 900,
          marginBottom: '18px', letterSpacing: '-1px', lineHeight: 1.1,
          animationDelay: '80ms',
        }}>
          About <span style={{
            background: 'linear-gradient(90deg, #7dd49a, #34d399)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>{APP_NAME}</span>
        </h1>

        <p className="about-fade-up" style={{
          fontSize: '16px', color: 'rgba(255,255,255,0.65)',
          maxWidth: '540px', margin: '0 auto', lineHeight: 1.8,
          animationDelay: '160ms',
        }}>
          Four computer science students from NUST SEECS who built Pakistan's first
          real-time emergency coordination platform — because no one should face a
          crisis alone.
        </p>
<div className="about-fade-up" style={{
          display: 'flex', justifyContent: 'center', gap: '40px',
          marginTop: '52px', animationDelay: '240ms',
        }}>
          {[
            { value: '4',    label: 'Roles Supported' },
            { value: '24',   label: 'Pages Built' },
            { value: '49+',  label: 'API Endpoints' },
            { value: '100%', label: 'Open Source' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#7dd49a', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>
<section style={{ padding: '88px 24px 0', maxWidth: '860px', margin: '0 auto' }}>
        <div className="mission-card scroll-reveal about-fade-up">
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'rgba(125,212,154,0.18)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
          }}>
            <Target size={26} color="#7dd49a" />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '16px', letterSpacing: '-0.4px' }}>
            Our Mission
          </h2>
          <p style={{ fontSize: '15px', lineHeight: 1.85, color: 'rgba(255,255,255,0.80)', maxWidth: '580px', margin: '0 auto' }}>
            To eliminate the chaos of emergency response in Pakistan by building a smart,
            real-time coordination system that connects help seekers with verified volunteers,
            hospitals, blood banks, and rescue teams — in under three minutes.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '28px', flexWrap: 'wrap' }}>
            {['Verified Responders', 'Geo-matched Alerts', 'Real-time Updates'].map(tag => (
              <div key={tag} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '12px', color: 'rgba(255,255,255,0.6)',
              }}>
                <CheckCircle2 size={13} color="#7dd49a" />
                {tag}
              </div>
            ))}
          </div>
        </div>
      </section>
<section style={{ padding: '80px 24px', maxWidth: '860px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div className="about-eyebrow">Why We Built This</div>
          <h2 className="about-h2">The Problem We Solve</h2>
          <p style={{ fontSize: '14px', color: '#6b7a64', maxWidth: '420px', margin: '0 auto', lineHeight: 1.7 }}>
            Pakistan's emergency response gap is real — these are the gaps we're closing.
          </p>
        </div>
        <div className="about-problem-grid" style={{ gap: '14px' }}>
          {PROBLEMS.map(({ Icon, text }, i) => (
            <div key={text} className="problem-card scroll-reveal about-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: '#e0f5e9', display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon size={18} color="#1a6b3c" />
              </div>
              <p style={{ fontSize: '14px', color: '#3a4a35', lineHeight: 1.65, margin: 0, fontWeight: 500 }}>
                {text}
              </p>
            </div>
          ))}
        </div>
      </section>
<section style={{ background: 'white', padding: '80px 24px' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div className="about-eyebrow">Our Principles</div>
            <h2 className="about-h2">What We Stand For</h2>
          </div>
          <div className="about-values-grid">
            {VALUES.map(({ Icon, title, desc, color, bg }, i) => (
              <div key={title} className="value-card scroll-reveal about-fade-up" style={{ animationDelay: `${i * 90}ms` }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '14px',
                  background: bg, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', margin: '0 auto 16px',
                  transition: 'transform 0.2s',
                }}>
                  <Icon size={22} color={color} />
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px', color: '#141b11' }}>{title}</h3>
                <p style={{ fontSize: '13px', color: '#6b7a64', lineHeight: 1.65, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
<section style={{ padding: '80px 24px', maxWidth: '860px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div className="about-eyebrow">The People</div>
          <h2 className="about-h2">Meet the Team</h2>
          <p style={{ fontSize: '14px', color: '#6b7a64', margin: 0 }}>
            CS 343 Web Technologies — NUST SEECS, Spring 2026
          </p>
        </div>
        <div className="about-team-grid">
          {TEAM.map(({ name, role, Icon, iconBg, iconColor, desc, initial }, i) => (
            <div key={name} className="team-card scroll-reveal about-fade-up" style={{ animationDelay: `${i * 90}ms` }}>
<div style={{
                width: '68px', height: '68px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #0d3d22, #1a6b3c)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '22px', fontWeight: 800, color: 'white',
                boxShadow: '0 8px 24px rgba(13,61,34,0.28)',
                letterSpacing: '-0.5px',
              }}>
                {initial}
              </div>
<div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: iconBg, display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 12px',
              }}>
                <Icon size={15} color={iconColor} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '4px', color: '#141b11' }}>{name}</h3>
              <div style={{
                fontSize: '10px', fontWeight: 700, color: '#1a6b3c',
                textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px',
              }}>
                {role}
              </div>
              <p style={{ fontSize: '12px', color: '#6b7a64', lineHeight: 1.65, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>
<section style={{ background: 'white', padding: '64px 24px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center' }}>
          <div className="about-eyebrow">The Stack</div>
          <h2 className="about-h2" style={{ marginBottom: '32px' }}>Built With</h2>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px' }}>
            {TECH.map(t => (
              <span key={t} className="tech-pill">{t}</span>
            ))}
          </div>
        </div>
      </section>
<section className="cta-section">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'rgba(125,212,154,0.15)', border: '1px solid rgba(125,212,154,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <Heart size={24} color="#7dd49a" />
          </div>
          <h2 style={{
            fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 900,
            marginBottom: '12px', letterSpacing: '-0.6px',
          }}>
            Be Part of the Solution
          </h2>
          <p style={{
            fontSize: '15px', color: 'rgba(255,255,255,0.60)',
            maxWidth: '380px', margin: '0 auto 32px', lineHeight: 1.75,
          }}>
            Join {APP_NAME} today and help build a safer Pakistan — one request at a time.
          </p>
          <Link to="/register" className="cta-btn-main">
            Join {APP_NAME}
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}