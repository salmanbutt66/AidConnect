import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';

const IconMail = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/>
  </svg>
);
const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IconEye = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconEyeOff = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const IconAlert = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:'1px'}}>
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const IconArrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/>
  </svg>
);

const LogoMark = ({ dark = false }) => (
  <svg width="40" height="40" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="44" height="44" rx="11" fill={dark ? 'rgba(125,212,154,0.18)' : '#1a6b3c'}/>
    <path d="M22 8L10 13v10c0 7.18 5.15 13.89 12 15.5C28.85 36.89 34 30.18 34 23V13L22 8z"
      fill={dark ? 'rgba(125,212,154,0.2)' : 'rgba(255,255,255,0.1)'}
      stroke={dark ? '#7dd49a' : 'rgba(255,255,255,0.55)'} strokeWidth="1.5"/>
    <polyline points="16,22 20,26 28,18" stroke={dark ? '#7dd49a' : 'white'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const StatPill = ({ value, label }) => (
  <div style={{
    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '12px', padding: '14px 18px', flex: 1,
  }}>
    <div style={{ fontSize: '21px', fontWeight: 800, color: '#7dd49a', letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '4px', lineHeight: 1.3 }}>{label}</div>
  </div>
);

const Feat = ({ iconPath, text }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
    <div style={{
      width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
      background: 'rgba(125,212,154,0.13)', border: '1px solid rgba(125,212,154,0.28)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7dd49a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {iconPath}
      </svg>
    </div>
    <span style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.72)', lineHeight: 1.45 }}>{text}</span>
  </div>
);

const Spinner = () => (
  <span style={{
    width:'16px', height:'16px', border:'2px solid rgba(255,255,255,0.3)',
    borderTopColor:'white', borderRadius:'50%', display:'inline-block',
    animation:'acl-spin 0.65s linear infinite', flexShrink:0,
  }}/>
);

const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800;9..40,900&display=swap');
.acl*{box-sizing:border-box;margin:0;padding:0}
.acl{font-family:'DM Sans',system-ui,sans-serif}
@keyframes acl-spin{to{transform:rotate(360deg)}}
@keyframes acl-up{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:translateY(0)}}
@keyframes acl-lft{from{opacity:0;transform:translateX(-18px)}to{opacity:1;transform:translateX(0)}}
@keyframes acl-fade{from{opacity:0}to{opacity:1}}
@keyframes acl-shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-5px)}40%,80%{transform:translateX(5px)}}
.acl-panel{animation:acl-fade .45s ease both}
.acl-logo {animation:acl-lft .5s ease .05s both}
.acl-tag  {animation:acl-lft .5s ease .15s both}
.acl-feats{animation:acl-lft .5s ease .25s both}
.acl-stats{animation:acl-lft .5s ease .35s both}
.acl-form {animation:acl-up  .6s cubic-bezier(.22,1,.36,1) .1s both}
.acl-input{
  width:100%;padding:12px 14px 12px 42px;
  border:1.5px solid #e0dbd4;border-radius:10px;
  font-size:14.5px;font-family:'DM Sans',sans-serif;
  color:#141b11;background:#faf9f7;
  transition:border-color .18s,box-shadow .18s,background .18s;outline:none;
}
.acl-input::placeholder{color:#b5b09a}
.acl-input:focus{border-color:#229450;box-shadow:0 0 0 4px rgba(34,148,80,.1);background:#fff}
.acl-input.err{border-color:#c0392b}
.acl-input.err:focus{box-shadow:0 0 0 4px rgba(192,57,43,.09)}
.acl-input-pr{padding-right:44px!important}
.acl-wrap{position:relative}
.acl-pre{
  position:absolute;left:13px;top:50%;transform:translateY(-50%);
  color:#b5b09a;display:flex;pointer-events:none;transition:color .18s;
}
.acl-wrap:focus-within .acl-pre{color:#229450}
.acl-eye{
  position:absolute;right:11px;top:50%;transform:translateY(-50%);
  background:none;border:none;cursor:pointer;color:#b5b09a;
  display:flex;padding:5px;border-radius:6px;transition:color .15s,background .15s;
}
.acl-eye:hover{color:#1e7d46;background:rgba(0,0,0,.04)}
.acl-btn{
  width:100%;display:flex;align-items:center;justify-content:center;gap:9px;
  padding:14px 24px;
  background:linear-gradient(135deg,#1a6b3c 0%,#1f8f4a 100%);
  color:white;border:none;border-radius:10px;
  font-size:15px;font-weight:700;font-family:'DM Sans',sans-serif;
  cursor:pointer;letter-spacing:.15px;
  transition:transform .15s,box-shadow .18s,opacity .18s;
  box-shadow:0 4px 18px rgba(26,107,60,.38),0 1px 3px rgba(26,107,60,.2);
  position:relative;overflow:hidden;
}
.acl-btn::before{
  content:'';position:absolute;inset:0;
  background:linear-gradient(135deg,rgba(255,255,255,.1) 0%,transparent 55%);
  pointer-events:none;
}
.acl-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 26px rgba(26,107,60,.44)}
.acl-btn:active:not(:disabled){transform:translateY(0)}
.acl-btn:disabled{opacity:.55;cursor:not-allowed;transform:none}
.acl-lbl{display:block;font-size:13px;font-weight:600;color:#3d4d38;margin-bottom:7px}
.acl-errmsg{font-size:12px;color:#c0392b;margin-top:5px;display:flex;align-items:center;gap:4px}
.acl-alert{
  display:flex;align-items:flex-start;gap:10px;
  padding:13px 15px;background:#fff5f5;border:1px solid #f9cccc;border-radius:10px;
  font-size:13.5px;color:#a93226;font-weight:500;margin-bottom:22px;
  animation:acl-shake .4s ease;line-height:1.5;
}
.acl-divider{display:flex;align-items:center;gap:14px;color:#b5b09a;font-size:13px;margin:22px 0}
.acl-divider::before,.acl-divider::after{content:'';flex:1;height:1px;background:#e8e3dc}
.acl-link{color:#1a6b3c;font-weight:700;text-decoration:none;transition:color .15s}
.acl-link:hover{color:#2aad60}
.acl-fg{margin-bottom:20px}
.acl-right{display:flex;align-items:center;justify-content:center;padding:40px 48px;background:#f5f2ed;position:relative}
@media(max-width:860px){
  .acl-grid{grid-template-columns:1fr!important}
  .acl-panel{display:none!important}
  .acl-right{padding:40px 20px!important}
}
`;

export default function Login() {
  const { login, getDashboardPath } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || null;

  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [fieldErr, setFieldErr] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (fieldErr[name]) setFieldErr(p => ({ ...p, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password.trim()) e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErr(errs); return; }
    setLoading(true);
    try {
      const user = await login(form);
      navigate(from || getDashboardPath(user.role), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{css}</style>
      <div className="acl acl-grid" style={{ minHeight:'100vh', display:'grid', gridTemplateColumns:'46% 1fr' }}>
<div className="acl-panel" style={{
          background: 'linear-gradient(155deg, #081f10 0%, #0c3820 35%, #125430 70%, #176b3c 100%)',
          display: 'flex', flexDirection: 'column', padding: '48px 52px',
          color: 'white', position: 'relative', overflow: 'hidden',
        }}>
<svg style={{ position:'absolute', right:'-90px', top:'-90px', opacity:0.06, pointerEvents:'none' }}
            width="520" height="520" viewBox="0 0 520 520" fill="none">
            <circle cx="360" cy="160" r="290" stroke="white" strokeWidth="1"/>
            <circle cx="360" cy="160" r="210" stroke="white" strokeWidth="1"/>
            <circle cx="360" cy="160" r="130" stroke="white" strokeWidth="0.8"/>
            <circle cx="360" cy="160" r="65"  stroke="white" strokeWidth="0.6"/>
          </svg>
<div style={{
            position:'absolute', bottom:'-120px', left:'-60px',
            width:'380px', height:'380px', borderRadius:'50%',
            background:'radial-gradient(circle, rgba(34,148,80,0.2) 0%, transparent 68%)',
            pointerEvents:'none',
          }}/>
<svg style={{ position:'absolute', inset:0, opacity:0.03, pointerEvents:'none' }}
            width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="diag" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="40" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#diag)"/>
          </svg>
<div className="acl-logo" style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <LogoMark dark />
            <div>
              <div style={{ fontSize:'19px', fontWeight:800, letterSpacing:'-0.5px', lineHeight:1.1 }}>
                Aid<span style={{ color:'#7dd49a' }}>Connect</span>
              </div>
              <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.38)', letterSpacing:'1.8px', textTransform:'uppercase', marginTop:'2px' }}>
                Emergency Network
              </div>
            </div>
          </div>
<div className="acl-tag" style={{ marginTop:'auto', marginBottom:'32px' }}>
            <div style={{
              display:'inline-flex', alignItems:'center', gap:'7px',
              padding:'5px 13px', borderRadius:'99px',
              background:'rgba(125,212,154,0.13)', border:'1px solid rgba(125,212,154,0.28)',
              fontSize:'11px', fontWeight:700, color:'#7dd49a',
              letterSpacing:'1.2px', textTransform:'uppercase', marginBottom:'22px',
            }}>
              <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#7dd49a', animation:'acl-fade 1.5s ease infinite alternate' }}/>
              Pakistan's Relief Network
            </div>

            <h1 style={{
              fontSize:'clamp(30px,3vw,44px)', fontWeight:900,
              lineHeight:1.08, letterSpacing:'-1.5px', marginBottom:'16px',
            }}>
              Help is always<br/>
              <span style={{ color:'#7dd49a' }}>one tap away.</span>
            </h1>

            <p style={{ fontSize:'14px', color:'rgba(255,255,255,0.58)', lineHeight:1.8, marginBottom:'30px', maxWidth:'300px' }}>
              Join thousands of Pakistanis contributing to a faster, stronger emergency response network.
            </p>

            <div className="acl-feats">
              <Feat iconPath={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>} text="Real-time volunteer matching" />
              <Feat iconPath={<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>} text="Verified emergency responders" />
              <Feat iconPath={<><circle cx="12" cy="10" r="3"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></>} text="Geo-aware resource coordination" />
            </div>
          </div>
<div className="acl-stats" style={{ display:'flex', gap:'10px' }}>
            <StatPill value="12K+" label="Active volunteers" />
            <StatPill value="98%"  label="Response rate" />
            <StatPill value="4"    label="Cities covered" />
          </div>
        </div>
<div className="acl-right">
<div style={{
            position:'absolute', top:0, left:0, right:0, height:'3px',
            background:'linear-gradient(90deg, transparent, #1a6b3c 30%, #2aad60 60%, transparent)',
          }}/>

          <div className="acl-form" style={{ width:'100%', maxWidth:'400px' }}>
<div style={{
              background:'white', borderRadius:'20px', padding:'40px 38px',
              boxShadow:'0 2px 4px rgba(0,0,0,0.04), 0 16px 48px rgba(0,0,0,0.09)',
              border:'1px solid rgba(0,0,0,0.055)',
            }}>
              <div style={{ marginBottom:'28px' }}>
                <h2 style={{ fontSize:'26px', fontWeight:800, color:'#0f1a0c', letterSpacing:'-0.8px', marginBottom:'5px' }}>
                  Welcome back
                </h2>
                <p style={{ fontSize:'14px', color:'#7a8470', lineHeight:1.5 }}>
                  Sign in to your AidConnect account
                </p>
              </div>

              {error && (
                <div className="acl-alert"><IconAlert /><span>{error}</span></div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="acl-fg">
                  <label className="acl-lbl" htmlFor="login-email">Email address</label>
                  <div className="acl-wrap">
                    <span className="acl-pre"><IconMail /></span>
                    <input id="login-email" name="email" type="email"
                      className={`acl-input${fieldErr.email ? ' err' : ''}`}
                      placeholder="you@example.com" value={form.email}
                      onChange={handleChange} autoComplete="email" disabled={loading} required />
                  </div>
                  {fieldErr.email && <div className="acl-errmsg"><IconAlert />{fieldErr.email}</div>}
                </div>

                <div className="acl-fg">
                  <label className="acl-lbl" htmlFor="login-pass">Password</label>
                  <div className="acl-wrap">
                    <span className="acl-pre"><IconLock /></span>
                    <input id="login-pass" name="password" type={showPass ? 'text' : 'password'}
                      className={`acl-input acl-input-pr${fieldErr.password ? ' err' : ''}`}
                      placeholder="Your password" value={form.password}
                      onChange={handleChange} autoComplete="current-password" disabled={loading} required />
                    <button type="button" className="acl-eye"
                      onClick={() => setShowPass(p => !p)} aria-label={showPass ? 'Hide' : 'Show'}>
                      {showPass ? <IconEyeOff /> : <IconEye />}
                    </button>
                  </div>
                  {fieldErr.password && <div className="acl-errmsg"><IconAlert />{fieldErr.password}</div>}
                </div>

                <button type="submit" className="acl-btn" disabled={loading}>
                  {loading ? <><Spinner /> Signing in…</> : <>Sign In <IconArrow /></>}
                </button>
              </form>

              <div className="acl-divider">or</div>
              <p style={{ textAlign:'center', fontSize:'14px', color:'#7a8470' }}>
                Don't have an account?{' '}
                <Link to="/register" className="acl-link">Create one free</Link>
              </p>
            </div>
<div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'7px', marginTop:'18px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9aaa93" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span style={{ fontSize:'12px', color:'#9aaa93' }}>Secured with end-to-end encryption</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}