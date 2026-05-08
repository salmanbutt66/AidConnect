import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { BLOOD_GROUPS } from '../../utils/constants.js';
const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconPhone = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.06 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z"/>
  </svg>
);
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
const IconDroplet = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
  </svg>
);
const IconAlert = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:'1px'}}>
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const IconArrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/>
  </svg>
);
const IconCheck = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
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

const Spinner = () => (
  <span style={{
    width:'16px', height:'16px', border:'2px solid rgba(255,255,255,0.3)',
    borderTopColor:'white', borderRadius:'50%', display:'inline-block',
    animation:'acr-spin 0.65s linear infinite', flexShrink:0,
  }}/>
);
function PasswordStrength({ password }) {
  if (!password) return null;
  const c = { len: password.length >= 8, up: /[A-Z]/.test(password), lo: /[a-z]/.test(password), num: /\d/.test(password) };
  const score = Object.values(c).filter(Boolean).length;
  const colors = ['','#c0392b','#d68910','#1a6b9a','#1e7d46'];
  const labels = ['','Weak','Fair','Good','Strong'];
  return (
    <div style={{ marginTop:'8px' }}>
      <div style={{ display:'flex', gap:'4px', alignItems:'center', marginBottom:'7px' }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{
            flex:1, height:'4px', borderRadius:'99px',
            background: i <= score ? colors[score] : '#e0dbd4',
            transition:'background .3s ease',
          }}/>
        ))}
        <span style={{ fontSize:'11px', fontWeight:700, color: score > 0 ? colors[score] : '#b5b09a', minWidth:'42px', textAlign:'right', transition:'color .3s' }}>
          {labels[score]}
        </span>
      </div>
      <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
        {[{ok:c.len,t:'8+ chars'},{ok:c.up,t:'Uppercase'},{ok:c.lo,t:'Lowercase'},{ok:c.num,t:'Number'}].map(r => (
          <span key={r.t} style={{
            fontSize:'11px', fontWeight:600, display:'flex', alignItems:'center', gap:'4px',
            color: r.ok ? '#1e7d46' : '#b5b09a', transition:'color .2s',
          }}>
            <span style={{
              width:'14px', height:'14px', borderRadius:'50%', display:'inline-flex',
              alignItems:'center', justifyContent:'center',
              background: r.ok ? '#e0f5e9' : '#f0ede8', transition:'background .2s',
            }}>
              {r.ok
                ? <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#1e7d46" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                : <span style={{width:'4px',height:'4px',borderRadius:'50%',background:'#c5c0b8',display:'block'}}/>
              }
            </span>
            {r.t}
          </span>
        ))}
      </div>
    </div>
  );
}
const ROLES = [
  {
    value: 'user', label: 'Citizen', desc: 'I need emergency help',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active?'#1a6b3c':'#8a9585'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
  {
    value: 'volunteer', label: 'Volunteer', desc: 'I respond to crises',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active?'#1a6b3c':'#8a9585'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    value: 'provider', label: 'Organization', desc: 'We provide services',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active?'#1a6b3c':'#8a9585'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
];
function Field({ id, name, label, type='text', placeholder, required, icon, form, errors, onChange, disabled }) {
  return (
    <div style={{ marginBottom:'16px' }}>
      <label htmlFor={id} style={{ display:'block', fontSize:'13px', fontWeight:600, color:'#3d4d38', marginBottom:'7px' }}>
        {label}{required && <span style={{ color:'#c0392b', marginLeft:'3px' }}>*</span>}
      </label>
      <div style={{ position:'relative' }}>
        {icon && (
          <span style={{
            position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)',
            color: errors[name] ? '#c0392b' : '#b5b09a',
            display:'flex', alignItems:'center', pointerEvents:'none', transition:'color .18s',
          }}>{icon}</span>
        )}
        <input id={id} name={name} type={type}
          className={`acr-input${icon?' acr-ipad':''}${errors[name]?' err':''}`}
          placeholder={placeholder} value={form[name]} onChange={onChange}
          required={required} disabled={disabled}
          autoComplete={type==='password'?'new-password':undefined} />
      </div>
      {errors[name] && (
        <div style={{ fontSize:'12px', color:'#c0392b', marginTop:'5px', display:'flex', alignItems:'center', gap:'4px' }}>
          <IconAlert/>{errors[name]}
        </div>
      )}
    </div>
  );
}
const Step = ({ num, text, delay }) => (
  <div style={{
    display:'flex', gap:'14px', alignItems:'flex-start', marginBottom:'18px',
    animation:`acr-lft .5s ease ${delay}s both`,
  }}>
    <div style={{
      width:'32px', height:'32px', borderRadius:'9px', flexShrink:0,
      background:'rgba(125,212,154,0.15)', border:'1px solid rgba(125,212,154,0.3)',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:'11px', fontWeight:800, color:'#7dd49a', letterSpacing:'0.5px',
    }}>{num}</div>
    <p style={{ fontSize:'13.5px', color:'rgba(255,255,255,0.65)', lineHeight:1.6, paddingTop:'6px' }}>{text}</p>
  </div>
);

const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800;9..40,900&display=swap');
.acr*{box-sizing:border-box;margin:0;padding:0}
.acr{font-family:'DM Sans',system-ui,sans-serif}
@keyframes acr-spin{to{transform:rotate(360deg)}}
@keyframes acr-up{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:translateY(0)}}
@keyframes acr-lft{from{opacity:0;transform:translateX(-18px)}to{opacity:1;transform:translateX(0)}}
@keyframes acr-fade{from{opacity:0}to{opacity:1}}
@keyframes acr-shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-5px)}40%,80%{transform:translateX(5px)}}
.acr-panel{animation:acr-fade .45s ease both}
.acr-logo {animation:acr-lft .5s ease .05s both}
.acr-tag  {animation:acr-lft .5s ease .15s both}
.acr-form {animation:acr-up  .6s cubic-bezier(.22,1,.36,1) .08s both}
.acr-input{
  width:100%;padding:11px 14px;
  border:1.5px solid #e0dbd4;border-radius:10px;
  font-size:14.5px;font-family:'DM Sans',sans-serif;
  color:#141b11;background:#faf9f7;
  transition:border-color .18s,box-shadow .18s,background .18s;outline:none;
}
.acr-ipad{padding-left:42px}
.acr-input::placeholder{color:#b5b09a}
.acr-input:focus{border-color:#229450;box-shadow:0 0 0 4px rgba(34,148,80,.1);background:#fff}
.acr-input.err{border-color:#c0392b}
.acr-input.err:focus{box-shadow:0 0 0 4px rgba(192,57,43,.09)}
.acr-select{
  width:100%;padding:11px 14px 11px 42px;
  border:1.5px solid #e0dbd4;border-radius:10px;
  font-size:14.5px;font-family:'DM Sans',sans-serif;
  color:#141b11;background:#faf9f7;
  transition:border-color .18s,box-shadow .18s;outline:none;
  appearance:none;cursor:pointer;
}
.acr-select:focus{border-color:#229450;box-shadow:0 0 0 4px rgba(34,148,80,.1);background:#fff}
.acr-swrap{position:relative}
.acr-swrap::after{
  content:'';position:absolute;right:14px;top:50%;transform:translateY(-50%);
  width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;
  border-top:5px solid #8a9585;pointer-events:none;
}
.acr-role{
  padding:15px 10px 13px;border:1.5px solid #e0dbd4;border-radius:11px;
  background:#faf9f7;cursor:pointer;text-align:center;
  transition:all .18s ease;display:flex;flex-direction:column;
  align-items:center;gap:7px;font-family:'DM Sans',sans-serif;
  position:relative;
}
.acr-role:hover:not(:disabled){border-color:#aaddbb;background:#f2fbf6;transform:translateY(-2px);box-shadow:0 4px 16px rgba(26,107,60,.1)}
.acr-role.active{border-color:#1a6b3c;background:#f2fbf6;box-shadow:0 0 0 3.5px rgba(26,107,60,.12)}
.acr-role:disabled{opacity:.6;cursor:not-allowed;transform:none}
.acr-btn{
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
.acr-btn::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.1) 0%,transparent 55%);pointer-events:none}
.acr-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 26px rgba(26,107,60,.44)}
.acr-btn:active:not(:disabled){transform:translateY(0)}
.acr-btn:disabled{opacity:.55;cursor:not-allowed;transform:none}
.acr-alert{
  display:flex;align-items:flex-start;gap:10px;
  padding:13px 15px;background:#fff5f5;border:1px solid #f9cccc;border-radius:10px;
  font-size:13.5px;color:#a93226;font-weight:500;margin-bottom:20px;
  animation:acr-shake .4s ease;line-height:1.5;
}
.acr-divider{display:flex;align-items:center;gap:14px;color:#b5b09a;font-size:13px;margin:20px 0}
.acr-divider::before,.acr-divider::after{content:'';flex:1;height:1px;background:#e8e3dc}
.acr-link{color:#1a6b3c;font-weight:700;text-decoration:none;transition:color .15s}
.acr-link:hover{color:#2aad60}
.acr-right{display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:40px 48px;background:#f5f2ed;position:relative}
@media(max-width:860px){
  .acr-grid{grid-template-columns:1fr!important}
  .acr-panel{display:none!important}
  .acr-right{padding:40px 20px!important}
}
`;

export default function Register() {
  const { register, getDashboardPath } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [form, setForm] = useState({
    name:'', email:'', password:'', confirmPassword:'',
    role: params.get('role') || 'user', phone:'', bloodGroup:'',
  });
  const [errors, setErrors]   = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = 'Full name must be at least 2 characters';
    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Please enter a valid email address';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) e.password = 'Must contain uppercase, lowercase and a number';
    if (!form.confirmPassword) e.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (form.phone && !/^(\+92|0)[0-9]{10}$/.test(form.phone)) e.phone = 'Format: 03001234567 or +923001234567';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    const clientErrors = validate();
    if (Object.keys(clientErrors).length) { setErrors(clientErrors); return; }
    setLoading(true);
    try {
      const payload = { name: form.name.trim(), email: form.email.trim().toLowerCase(), password: form.password, role: form.role };
      if (form.phone)      payload.phone      = form.phone;
      if (form.bloodGroup) payload.bloodGroup = form.bloodGroup;
      const user = await register(payload);
      navigate(getDashboardPath(user.role), { replace: true });
    } catch (err) {
      const be = err.response?.data?.errors;
      if (be && Array.isArray(be)) {
        const m = {}; be.forEach(({ field, message }) => { m[field] = message; });
        setErrors(m); setApiError('Please fix the errors below.');
      } else {
        setApiError(err.response?.data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{css}</style>
      <div className="acr acr-grid" style={{ minHeight:'100vh', display:'grid', gridTemplateColumns:'40% 1fr' }}>
<div className="acr-panel" style={{
          background:'linear-gradient(155deg, #081f10 0%, #0c3820 35%, #125430 70%, #176b3c 100%)',
          display:'flex', flexDirection:'column', padding:'48px 48px',
          color:'white', position:'relative', overflow:'hidden',
        }}>
<svg style={{ position:'absolute', right:'-90px', top:'-90px', opacity:0.06, pointerEvents:'none' }}
            width="520" height="520" viewBox="0 0 520 520" fill="none">
            <circle cx="360" cy="160" r="290" stroke="white" strokeWidth="1"/>
            <circle cx="360" cy="160" r="210" stroke="white" strokeWidth="1"/>
            <circle cx="360" cy="160" r="130" stroke="white" strokeWidth="0.8"/>
            <circle cx="360" cy="160" r="65"  stroke="white" strokeWidth="0.6"/>
          </svg>
<div style={{
            position:'absolute', bottom:'-100px', left:'-60px',
            width:'360px', height:'360px', borderRadius:'50%',
            background:'radial-gradient(circle, rgba(34,148,80,0.2) 0%, transparent 68%)',
            pointerEvents:'none',
          }}/>
<svg style={{ position:'absolute', inset:0, opacity:0.03, pointerEvents:'none' }}
            width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="rdiag" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="40" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#rdiag)"/>
          </svg>
<div className="acr-logo" style={{ display:'flex', alignItems:'center', gap:'12px' }}>
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
<div className="acr-tag" style={{ marginTop:'auto', marginBottom:'28px' }}>
            <div style={{
              display:'inline-flex', alignItems:'center', gap:'7px', padding:'5px 13px',
              borderRadius:'99px', background:'rgba(125,212,154,0.13)',
              border:'1px solid rgba(125,212,154,0.28)', fontSize:'11px', fontWeight:700,
              color:'#7dd49a', letterSpacing:'1.2px', textTransform:'uppercase', marginBottom:'20px',
            }}>
              <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#7dd49a' }}/>
              Get Started Today
            </div>

            <h1 style={{
              fontSize:'clamp(28px,2.8vw,40px)', fontWeight:900,
              lineHeight:1.1, letterSpacing:'-1.3px', marginBottom:'14px',
            }}>
              Join the<br/>
              <span style={{ color:'#7dd49a' }}>relief network.</span>
            </h1>

            <p style={{ fontSize:'13.5px', color:'rgba(255,255,255,0.58)', lineHeight:1.75, marginBottom:'28px', maxWidth:'280px' }}>
              Every person who joins makes Pakistan's emergency network faster and stronger.
            </p>

            <Step num="01" text="Choose your role — citizen, volunteer, or organization" delay={0.25} />
            <Step num="02" text="Complete your profile with location and skills" delay={0.35} />
            <Step num="03" text="Start responding to or posting emergency requests" delay={0.45} />
          </div>
<div style={{
            display:'flex', alignItems:'center', gap:'12px', padding:'14px 16px',
            background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:'12px',
          }}>
            <svg width="28" height="28" viewBox="0 0 44 44" fill="none">
              <rect width="44" height="44" rx="9" fill="rgba(125,212,154,0.15)"/>
              <path d="M22 8L10 13v10c0 7.18 5.15 13.89 12 15.5C28.85 36.89 34 30.18 34 23V13L22 8z"
                stroke="#7dd49a" strokeWidth="1.5" fill="rgba(125,212,154,0.1)"/>
              <polyline points="16,22 20,26 28,18" stroke="#7dd49a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div>
              <div style={{ fontSize:'12px', fontWeight:700, color:'rgba(255,255,255,0.85)', letterSpacing:'0.3px' }}>
                Pakistan Emergency Network
              </div>
              <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.42)', marginTop:'2px' }}>
                Trusted by 12,000+ volunteers
              </div>
            </div>
          </div>
        </div>
<div className="acr-right">
<div style={{
            position:'fixed', top:0, left:'40%', right:0, height:'3px',
            background:'linear-gradient(90deg, transparent, #1a6b3c 30%, #2aad60 60%, transparent)',
            zIndex:10,
          }}/>

          <div className="acr-form" style={{ width:'100%', maxWidth:'430px', paddingTop:'8px', paddingBottom:'40px' }}>
            <div style={{
              background:'white', borderRadius:'20px', padding:'36px 36px',
              boxShadow:'0 2px 4px rgba(0,0,0,0.04), 0 16px 48px rgba(0,0,0,0.09)',
              border:'1px solid rgba(0,0,0,0.055)',
            }}>
              <div style={{ marginBottom:'24px' }}>
                <h2 style={{ fontSize:'24px', fontWeight:800, color:'#0f1a0c', letterSpacing:'-0.8px', marginBottom:'4px' }}>
                  Create your account
                </h2>
                <p style={{ fontSize:'14px', color:'#7a8470', lineHeight:1.5 }}>
                  Join AidConnect — Pakistan's relief network
                </p>
              </div>

              {apiError && (
                <div className="acr-alert"><IconAlert /><span>{apiError}</span></div>
              )}
<div style={{ marginBottom:'22px' }}>
                <p style={{ fontSize:'12px', fontWeight:700, color:'#7a8470', letterSpacing:'1px', textTransform:'uppercase', marginBottom:'10px' }}>
                  I am a
                </p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px' }}>
                  {ROLES.map(r => {
                    const active = form.role === r.value;
                    return (
                      <button key={r.value} type="button"
                        className={`acr-role${active?' active':''}`}
                        onClick={() => setForm(p => ({ ...p, role: r.value }))}
                        disabled={loading}>
{active && (
                          <div style={{
                            position:'absolute', top:'8px', right:'8px',
                            width:'18px', height:'18px', borderRadius:'50%',
                            background:'#1a6b3c', display:'flex',
                            alignItems:'center', justifyContent:'center',
                          }}>
                            <IconCheck />
                          </div>
                        )}
                        {r.icon(active)}
                        <div style={{ fontWeight:700, fontSize:'12px', color: active?'#1a6b3c':'#141b11', transition:'color .15s' }}>
                          {r.label}
                        </div>
                        <div style={{ color:'#8a9585', fontSize:'10.5px', lineHeight:1.4 }}>
                          {r.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handleSubmit} noValidate>
<div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
                  <Field id="name" name="name" label="Full Name" placeholder="Muhammad Ali" required icon={<IconUser />} form={form} errors={errors} onChange={handleChange} disabled={loading} />
                  <Field id="phone" name="phone" label="Phone" placeholder="03001234567" icon={<IconPhone />} form={form} errors={errors} onChange={handleChange} disabled={loading} />
                </div>
<Field id="reg-email" name="email" label="Email Address" type="email" placeholder="you@example.com" required icon={<IconMail />} form={form} errors={errors} onChange={handleChange} disabled={loading} />
<div style={{ marginBottom:'16px' }}>
                  <label htmlFor="reg-pw" style={{ display:'block', fontSize:'13px', fontWeight:600, color:'#3d4d38', marginBottom:'7px' }}>
                    Password <span style={{ color:'#c0392b' }}>*</span>
                  </label>
                  <div style={{ position:'relative' }}>
                    <span style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', color: errors.password?'#c0392b':'#b5b09a', display:'flex', alignItems:'center', pointerEvents:'none' }}>
                      <IconLock />
                    </span>
                    <input id="reg-pw" name="password" type="password"
                      className={`acr-input acr-ipad${errors.password?' err':''}`}
                      placeholder="Min 8 chars, uppercase + number"
                      value={form.password} onChange={handleChange}
                      required disabled={loading} autoComplete="new-password" />
                  </div>
                  {errors.password
                    ? <div style={{ fontSize:'12px', color:'#c0392b', marginTop:'5px', display:'flex', alignItems:'center', gap:'4px' }}><IconAlert/>{errors.password}</div>
                    : <PasswordStrength password={form.password} />
                  }
                </div>
<Field id="confirmPassword" name="confirmPassword" label="Confirm Password" type="password" placeholder="Repeat password" required icon={<IconLock />} form={form} errors={errors} onChange={handleChange} disabled={loading} />
{form.role !== 'provider' && (
                  <div style={{ marginBottom:'16px' }}>
                    <label htmlFor="bloodGroup" style={{ display:'block', fontSize:'13px', fontWeight:600, color:'#3d4d38', marginBottom:'7px' }}>
                      Blood Group <span style={{ color:'#9aaa93', fontWeight:400, fontSize:'12px' }}>(optional)</span>
                    </label>
                    <div className="acr-swrap">
                      <span style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', color:'#b5b09a', display:'flex', alignItems:'center', pointerEvents:'none', zIndex:1 }}>
                        <IconDroplet />
                      </span>
                      <select id="bloodGroup" name="bloodGroup" className="acr-select"
                        value={form.bloodGroup} onChange={handleChange} disabled={loading}>
                        <option value="">Select blood group</option>
                        {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                <button type="submit" className="acr-btn" style={{ marginTop:'6px' }} disabled={loading}>
                  {loading ? <><Spinner /> Creating account…</> : <>Create Account <IconArrow /></>}
                </button>
              </form>

              <div className="acr-divider">or</div>
              <p style={{ textAlign:'center', fontSize:'14px', color:'#7a8470' }}>
                Already have an account?{' '}
                <Link to="/login" className="acr-link">Sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}