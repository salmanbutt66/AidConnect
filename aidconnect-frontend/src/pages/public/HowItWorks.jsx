// src/pages/public/HowItWorks.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../../components/common/Footer.jsx';
import { APP_NAME } from '../../utils/constants.js';
import {
  Zap,
  UserPlus,
  AlertTriangle,
  MapPin,
  Star,
  ClipboardList,
  CheckCircle2,
  Bell,
  TrendingUp,
  Building2,
  ShieldCheck,
  ToggleRight,
  FileText,
  Handshake,
  ArrowRight,
  ChevronDown,
  Upload,
  Navigation,
  Activity,
  PackageCheck,
  Users,
  Stethoscope,
} from 'lucide-react';

/* ── Styles ────────────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

  .hiw-page * { font-family: 'Plus Jakarta Sans', sans-serif; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0);    }
  }

  .hiw-fade-up  { animation: fadeUp  0.52s cubic-bezier(.22,.68,0,1.2) both; }
  .hiw-fade-in  { animation: fadeIn  0.35s ease both; }
  .hiw-slide-dn { animation: slideDown 0.28s ease both; }

  /* role tab buttons */
  .role-tab {
    display: flex; align-items: center; gap: 8px;
    padding: 11px 22px; border-radius: 999px;
    font-size: 13px; font-weight: 700; cursor: pointer;
    border: 2px solid #e2e8e3;
    background: white; color: #3a4a35;
    transition: all 0.22s ease;
  }
  .role-tab:hover { border-color: #1a6b3c; color: #1a6b3c; }
  .role-tab.active-citizen  { background: #0d3d22; border-color: #0d3d22; color: white; box-shadow: 0 6px 20px rgba(13,61,34,0.30); }
  .role-tab.active-volunteer{ background: #1a6b9a; border-color: #1a6b9a; color: white; box-shadow: 0 6px 20px rgba(26,107,154,0.30); }
  .role-tab.active-provider { background: #b45309; border-color: #b45309; color: white; box-shadow: 0 6px 20px rgba(180,83,9,0.28);  }

  /* step card */
  .step-card {
    background: white;
    border: 1px solid #e2e8e3;
    border-radius: 14px;
    padding: 0;
    position: relative; z-index: 1;
    transition: transform 0.22s ease, box-shadow 0.22s ease;
    overflow: hidden;
  }
  .step-card:hover { transform: translateX(6px); box-shadow: 0 8px 28px rgba(0,0,0,0.09); }
  .step-card-inner { display: flex; gap: 20px; align-items: flex-start; padding: 20px 22px; }

  /* lifecycle stages */
  .lifecycle-stage {
    display: flex; flex-direction: column; align-items: center; gap: 10px;
    flex: 1; min-width: 80px;
    padding: 20px 12px;
    border-radius: 14px;
    border: 1px solid #e2e8e3;
    background: white;
    transition: transform 0.22s ease, box-shadow 0.22s ease;
    cursor: default;
  }
  .lifecycle-stage:hover { transform: translateY(-5px); box-shadow: 0 14px 36px rgba(0,0,0,0.09); }

  /* faq */
  .faq-item {
    background: white; border: 1px solid #e2e8e3;
    border-radius: 14px; overflow: hidden;
    transition: box-shadow 0.22s ease;
  }
  .faq-item:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.07); }
  .faq-question {
    display: flex; align-items: center; justify-content: space-between; gap: 14px;
    padding: 18px 22px; cursor: pointer;
    user-select: none;
  }
  .faq-answer {
    padding: 0 22px 18px;
    font-size: 14px; color: #6b7a64; line-height: 1.75;
    border-top: 1px solid #f0f4f1;
    padding-top: 14px;
  }
  .faq-chevron {
    flex-shrink: 0; transition: transform 0.25s ease; color: #6b7a64;
  }
  .faq-chevron.open { transform: rotate(180deg); color: #1a6b3c; }

  /* cta */
  .hiw-cta {
    background: linear-gradient(135deg, #071f12 0%, #0d3d22 60%, #1a6b3c 100%);
    padding: 80px 24px; text-align: center; color: white;
    position: relative; overflow: hidden;
  }
  .hiw-cta::before {
    content: '';
    position: absolute; inset: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    pointer-events: none;
  }
  .cta-primary-btn {
    display: inline-flex; align-items: center; gap: 8px;
    background: white; color: #0d3d22;
    font-weight: 700; font-size: 14px;
    padding: 13px 28px; border-radius: 999px;
    text-decoration: none;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 8px 28px rgba(0,0,0,0.22);
  }
  .cta-primary-btn:hover { transform: translateY(-3px); box-shadow: 0 16px 40px rgba(0,0,0,0.30); color: #0d3d22; }
  .cta-ghost-btn {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
    color: white; font-weight: 600; font-size: 14px;
    padding: 13px 28px; border-radius: 999px;
    text-decoration: none;
    transition: background 0.2s;
  }
  .cta-ghost-btn:hover { background: rgba(255,255,255,0.14); color: white; }

  /* eyebrow */
  .hiw-eyebrow {
    display: inline-block;
    font-size: 10.5px; font-weight: 700; letter-spacing: 1.5px;
    text-transform: uppercase; color: #1a6b3c;
    background: #e0f5e9; padding: 4px 14px; border-radius: 999px;
    margin-bottom: 12px;
  }
  .hiw-h2 {
    font-size: clamp(21px, 3.5vw, 30px); font-weight: 800;
    color: #141b11; margin: 0 0 10px; letter-spacing: -0.4px;
  }

  /* connector arrow */
  .lifecycle-arrow { color: #c4d4c6; font-size: 18px; display: flex; align-items: center; padding-bottom: 24px; }
`;

/* ── Role step data ────────────────────────────────────────────────────── */
const ROLE_STEPS = {
  citizen: {
    label:    'Citizen',
    Icon:     Users,
    activeClass: 'active-citizen',
    accentColor: '#0d3d22',
    iconBg:   '#e0f5e9',
    iconColor: '#1a6b3c',
    steps: [
      { Icon: UserPlus,      title: 'Create Account',  desc: 'Register in under a minute — just your name, email, and location.' },
      { Icon: AlertTriangle, title: 'Post a Request',  desc: 'Describe your emergency, set urgency level, and confirm your location.' },
      { Icon: Zap,           title: 'Get Matched',     desc: 'Our engine instantly finds the nearest verified helpers for your need.' },
      { Icon: Navigation,    title: 'Track Progress',  desc: 'See real-time status updates as your request moves from posted to completed.' },
      { Icon: Star,          title: 'Rate & Review',   desc: 'After the emergency, rate your responder to help build community trust.' },
    ],
  },
  volunteer: {
    label:    'Volunteer',
    Icon:     Handshake,
    activeClass: 'active-volunteer',
    accentColor: '#1a6b9a',
    iconBg:   '#dbeafe',
    iconColor: '#2563eb',
    steps: [
      { Icon: ClipboardList, title: 'Register & Profile', desc: 'Sign up, add your skills, blood group, and set your service radius.'       },
      { Icon: ShieldCheck,   title: 'Get Verified',       desc: 'Admin reviews your profile. Once approved, you can start responding.'      },
      { Icon: Bell,          title: 'Receive Alerts',     desc: 'Get notified of nearby emergencies that match your skills and location.'    },
      { Icon: Activity,      title: 'Accept & Respond',   desc: 'Accept a request and head to the location. Your status updates in real time.' },
      { Icon: TrendingUp,    title: 'Build Reputation',   desc: 'Every completed request improves your reliability score and ranking.'       },
    ],
  },
  provider: {
    label:    'Organization',
    Icon:     Stethoscope,
    activeClass: 'active-provider',
    accentColor: '#b45309',
    iconBg:   '#fef3c7',
    iconColor: '#d97706',
    steps: [
      { Icon: Building2,    title: 'Register Organization', desc: 'Add your org details, service type, license number, and operating hours.' },
      { Icon: ShieldCheck,  title: 'Admin Verification',    desc: 'Our team verifies your license and organization before you go live.'     },
      { Icon: ToggleRight,  title: 'Set Availability',      desc: 'Toggle availability on/off anytime. Set your operating hours easily.'    },
      { Icon: FileText,     title: 'View Requests',         desc: 'See incoming requests relevant to your service type, sorted by urgency.' },
      { Icon: CheckCircle2, title: 'Accept & Help',         desc: 'Accept a request to get assigned. The requester is notified instantly.'  },
    ],
  },
};

/* ── Lifecycle stages ──────────────────────────────────────────────────── */
const LIFECYCLE = [
  { label: 'Posted',      Icon: Upload,      bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  { label: 'Accepted',    Icon: CheckCircle2,bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  { label: 'In Progress', Icon: Activity,    bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  { label: 'Completed',   Icon: PackageCheck,bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
];

/* ── FAQ data ──────────────────────────────────────────────────────────── */
const FAQS = [
  { q: 'Is AidConnect free to use?',               a: 'Yes — completely free for citizens, volunteers, and organizations.' },
  { q: 'How are volunteers and providers verified?',a: 'Every volunteer and provider goes through an admin review before they can respond to requests. Providers must submit a valid license number.' },
  { q: 'How fast is the response?',                 a: 'Our matching engine notifies nearby responders instantly. Average acceptance time is under 3 minutes.' },
  { q: 'What cities does AidConnect cover?',        a: 'We support all major cities in Pakistan including Karachi, Lahore, Islamabad, Rawalpindi, Peshawar, and more.' },
  { q: 'Can I be both a citizen and a volunteer?',  a: 'Currently each account has one role. You can register a second account with a different email to use both roles.' },
  { q: 'What if no one accepts my request?',        a: 'Your request stays visible to all nearby responders until accepted. For life-threatening emergencies always call 1122 directly.' },
];

/* ── Nav link style ────────────────────────────────────────────────────── */
const navLinkStyle = {
  fontSize: '13px', color: 'rgba(255,255,255,0.65)',
  textDecoration: 'none', padding: '6px 12px',
  borderRadius: '6px', transition: 'color 0.2s',
};

export default function HowItWorks() {
  const [activeRole, setActiveRole] = useState('citizen');
  const [openFaq,    setOpenFaq]    = useState(null);
  const observerRef = useRef(null);

  /* scroll-reveal */
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.animationPlayState = 'running';
          observerRef.current.unobserve(e.target);
        }
      }),
      { threshold: 0.10 }
    );
    document.querySelectorAll('.scroll-reveal').forEach(el => {
      el.style.animationPlayState = 'paused';
      observerRef.current.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, []);

  /* re-observe when role changes (new step cards mount) */
  useEffect(() => {
    setTimeout(() => {
      document.querySelectorAll('.scroll-reveal').forEach(el => {
        el.style.animationPlayState = 'paused';
        observerRef.current?.observe(el);
      });
    }, 50);
  }, [activeRole]);

  const current = ROLE_STEPS[activeRole];

  return (
    <div className="hiw-page" style={{ background: '#f5f7f5', minHeight: '100vh' }}>
      <style>{STYLES}</style>

      {/* ── Navbar ──────────────────────────────────────────────────── */}
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
          <Link to="/about" style={navLinkStyle}
            onMouseEnter={e => e.currentTarget.style.color = 'white'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.65)'}>
            About
          </Link>
          <Link to="/login" className="btn btn-ghost btn-sm" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>Login</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(140deg, #071f12 0%, #0d3d22 55%, #1a6b3c 100%)',
        color: 'white', padding: '148px 24px 88px', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* decorative rings */}
        {[500, 320].map(size => (
          <div key={size} style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: `${size}px`, height: `${size}px`,
            border: '1px solid rgba(125,212,154,0.07)',
            borderRadius: '50%', pointerEvents: 'none',
          }} />
        ))}

        <div className="hiw-fade-up" style={{ animationDelay: '0ms' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '7px',
            background: 'rgba(125,212,154,0.13)', border: '1px solid rgba(125,212,154,0.28)',
            borderRadius: '999px', padding: '6px 16px',
            fontSize: '11px', fontWeight: 700, color: '#7dd49a',
            letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '20px',
          }}>
            <Zap size={11} />
            Emergency to Response in Under 3 Minutes
          </div>
        </div>

        <h1 className="hiw-fade-up" style={{
          fontSize: 'clamp(28px, 6vw, 52px)', fontWeight: 900,
          marginBottom: '18px', letterSpacing: '-1px', lineHeight: 1.1,
          animationDelay: '80ms',
        }}>
          How <span style={{
            background: 'linear-gradient(90deg, #7dd49a, #34d399)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>{APP_NAME}</span> Works
        </h1>

        <p className="hiw-fade-up" style={{
          fontSize: '16px', color: 'rgba(255,255,255,0.62)',
          maxWidth: '500px', margin: '0 auto', lineHeight: 1.8,
          animationDelay: '160ms',
        }}>
          A smart, real-time coordination platform. Here's exactly how it works
          for each type of user — step by step.
        </p>
      </section>

      {/* ── Role Tabs + Steps ────────────────────────────────────────── */}
      <section style={{ padding: '72px 24px', maxWidth: '820px', margin: '0 auto' }}>

        {/* Tab switcher */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '52px', flexWrap: 'wrap' }}>
          {Object.entries(ROLE_STEPS).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setActiveRole(key)}
              className={`role-tab ${activeRole === key ? val.activeClass : ''}`}
            >
              <val.Icon size={15} />
              {val.label}
            </button>
          ))}
        </div>

        {/* Steps */}
        <div style={{ position: 'relative' }}>
          {/* Vertical line */}
          <div style={{
            position: 'absolute', left: '31px', top: '44px', bottom: '44px',
            width: '2px',
            background: `linear-gradient(to bottom, ${current.accentColor}40, ${current.accentColor}10)`,
            borderRadius: '2px', zIndex: 0,
          }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {current.steps.map((step, i) => (
              <div
                key={step.title}
                className="step-card scroll-reveal hiw-fade-up"
                style={{ animationDelay: `${i * 75}ms` }}
              >
                <div className="step-card-inner">
                  {/* number bubble */}
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: current.accentColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 800, fontSize: '15px', flexShrink: 0,
                    boxShadow: `0 0 0 4px white, 0 0 0 5px ${current.accentColor}30`,
                  }}>
                    {i + 1}
                  </div>

                  {/* icon + text */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                      <div style={{
                        width: '30px', height: '30px', borderRadius: '8px',
                        background: current.iconBg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <step.Icon size={15} color={current.iconColor} />
                      </div>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#141b11' }}>
                        {step.title}
                      </h3>
                    </div>
                    <p style={{ fontSize: '13.5px', color: '#6b7a64', lineHeight: 1.65, margin: 0, paddingLeft: '40px' }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Request Lifecycle ────────────────────────────────────────── */}
      <section style={{ background: 'white', padding: '80px 24px' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <div className="hiw-eyebrow">The Journey</div>
            <h2 className="hiw-h2">Request Lifecycle</h2>
            <p style={{ fontSize: '14px', color: '#6b7a64', maxWidth: '380px', margin: '0 auto', lineHeight: 1.7 }}>
              Every help request moves through these four stages
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {LIFECYCLE.map((stage, i) => (
              <React.Fragment key={stage.label}>
                <div
                  className="lifecycle-stage scroll-reveal hiw-fade-up"
                  style={{
                    animationDelay: `${i * 90}ms`,
                    borderColor: stage.border,
                    background: stage.bg,
                  }}
                >
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: 'white', display: 'flex', alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 4px 14px ${stage.color}22`,
                    border: `1px solid ${stage.border}`,
                  }}>
                    <stage.Icon size={22} color={stage.color} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#3a4a35', textAlign: 'center' }}>
                    {stage.label}
                  </span>
                </div>
                {i < LIFECYCLE.length - 1 && (
                  <div className="lifecycle-arrow">
                    <ArrowRight size={18} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div className="hiw-eyebrow">Got Questions?</div>
          <h2 className="hiw-h2">Frequently Asked Questions</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="faq-item scroll-reveal hiw-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#141b11', lineHeight: 1.4 }}>
                  {faq.q}
                </span>
                <ChevronDown size={18} className={`faq-chevron ${openFaq === i ? 'open' : ''}`} />
              </div>
              {openFaq === i && (
                <div className="faq-answer hiw-slide-dn">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="hiw-cta">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            width: '54px', height: '54px', borderRadius: '15px',
            background: 'rgba(125,212,154,0.14)', border: '1px solid rgba(125,212,154,0.24)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <Zap size={24} color="#7dd49a" />
          </div>
          <h2 style={{
            fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 900,
            marginBottom: '12px', letterSpacing: '-0.5px',
          }}>
            Ready to Get Started?
          </h2>
          <p style={{
            fontSize: '15px', color: 'rgba(255,255,255,0.60)',
            maxWidth: '360px', margin: '0 auto 32px', lineHeight: 1.75,
          }}>
            Join {APP_NAME} today — whether you need help or want to give it.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="cta-primary-btn">
              Create Account <ArrowRight size={15} />
            </Link>
            <Link to="/" className="cta-ghost-btn">
              Back to Home
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}