import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar.jsx';
import HelpRequestForm from '../../components/forms/HelpRequestForm.jsx';
import useRequests from '../../hooks/useRequests.js';
import useAuth from '../../hooks/useAuth.js';
import {
  AlertTriangle,
  FileText,
  MapPin,
  CheckCircle2,
  Check,
  ClipboardList,
  Plus,
  Search,
  Smartphone,
  Siren,
  ShieldCheck,
  Phone,
  Lightbulb,
  ArrowRight,
  Bell,
} from 'lucide-react';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

  .cr-page * { font-family: 'Plus Jakarta Sans', sans-serif !important; }

  @keyframes cr-fade-up {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes cr-scale-in {
    from { opacity: 0; transform: scale(0.88); }
    to   { opacity: 1; transform: scale(1);    }
  }
  @keyframes cr-check-pop {
    0%   { transform: scale(0); }
    60%  { transform: scale(1.18); }
    100% { transform: scale(1); }
  }

  .cr-anim      { animation: cr-fade-up  0.48s cubic-bezier(.22,.68,0,1.2) both; }
  .cr-scale-in  { animation: cr-scale-in 0.42s cubic-bezier(.22,.68,0,1.2) both; }
  .cr-check-pop { animation: cr-check-pop 0.45s cubic-bezier(.22,.68,0,1.2) both; }

  
  .step-connector {
    flex: 1; height: 2px; margin: 0 6px;
    margin-bottom: 22px;
    border-radius: 2px;
    transition: background 0.4s ease;
  }

  
  .step-bubble {
    width: 36px; height: 36px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 800;
    transition: all 0.3s ease;
  }

  
  .tip-item {
    display: flex; gap: 10px; align-items: flex-start;
    font-size: 13px; color: #3a4a35; line-height: 1.55;
    padding: 8px 0;
    border-bottom: 1px solid #f0f4f1;
  }
  .tip-item:last-child { border-bottom: none; }
  .tip-num {
    width: 20px; height: 20px; border-radius: 50%;
    background: #e0f5e9; color: #1a6b3c;
    font-size: 10px; font-weight: 800;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; margin-top: 1px;
  }

  
  .contact-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 9px 0; border-bottom: 1px solid rgba(220,38,38,0.08);
    text-decoration: none; transition: opacity 0.18s;
  }
  .contact-row:last-child { border-bottom: none; }
  .contact-row:hover { opacity: 0.72; }

  
  .cr-sidebar-card {
    background: white; border: 1px solid #e2e8e3;
    border-radius: 16px; overflow: hidden;
  }
  .cr-sidebar-card-header {
    padding: 16px 18px 12px;
    border-bottom: 1px solid #f0f4f1;
    display: flex; align-items: center; gap: 8px;
  }

  
  .cr-warning-banner {
    display: flex; align-items: flex-start; gap: 12px;
    background: #fffbeb; border: 1.5px solid #fde68a;
    border-radius: 14px; padding: 14px 18px;
    margin-bottom: 24px;
    animation: cr-fade-up 0.38s ease both;
  }

  .cr-main-grid {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 22px;
    align-items: start;
  }

  @media (max-width: 980px) {
    .cr-main-grid {
      grid-template-columns: 1fr;
    }
  }

  
  .cr-success-icon {
    width: 84px; height: 84px; border-radius: 50%;
    background: #f0fdf4; border: 3px solid #bbf7d0;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 24px;
  }
  .cr-next-step-item {
    display: flex; align-items: center; gap: 10px;
    padding: 11px 0; border-bottom: 1px solid #f0f5f1;
    font-size: 13px; color: #3a4a35;
  }
  .cr-next-step-item:last-child { border-bottom: none; }
  .cr-next-icon {
    width: 30px; height: 30px; border-radius: 8px;
    background: #e0f5e9; display: flex; align-items: center;
    justify-content: center; flex-shrink: 0;
  }
`;

const STEPS = [
  { Icon: AlertTriangle, label: 'Emergency Type' },
  { Icon: FileText,      label: 'Details'        },
  { Icon: MapPin,        label: 'Location'       },
  { Icon: CheckCircle2,  label: 'Submit'         },
];

function StepIndicator({ current, submitted }) {
  const active = submitted ? 3 : current;
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
      {STEPS.map(({ Icon, label }, i) => {
        const isDone   = i < active;
        const isActive = i === active;
        const isLast   = i === STEPS.length - 1;
        return (
          <React.Fragment key={label}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div
                className="step-bubble"
                style={{
                  background: isDone ? '#16a34a' : isActive ? '#0d3d22' : '#f0f4f1',
                  color:      isDone || isActive ? 'white' : '#9aab94',
                  border:     isActive ? '3px solid #7dd49a' : '3px solid transparent',
                  boxShadow:  isActive ? '0 0 0 4px rgba(26,107,60,0.12)' : 'none',
                }}
              >
                {isDone
                  ? <Check size={15} strokeWidth={3} />
                  : <Icon size={14} />
                }
              </div>
              <span style={{
                fontSize: '10.5px', fontWeight: isActive ? 700 : 500, whiteSpace: 'nowrap',
                color: isActive ? '#0d3d22' : isDone ? '#16a34a' : '#9aab94',
              }}>
                {label}
              </span>
            </div>
            {!isLast && (
              <div
                className="step-connector"
                style={{ background: isDone ? '#16a34a' : '#e2e8e3' }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function SuccessScreen({ onViewRequests, onNewRequest }) {
  const nextSteps = [
    { Icon: Search,    text: 'Matching you with nearby verified volunteers'  },
    { Icon: Bell,      text: 'You will be notified when someone accepts'     },
    { Icon: Siren,     text: 'For life-threatening emergencies, call 1122'   },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '52px 24px', textAlign: 'center' }}>
      <div className="cr-success-icon cr-scale-in">
        <CheckCircle2 size={40} color="#16a34a" strokeWidth={1.8} />
      </div>

      <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#141b11', letterSpacing: '-0.5px', marginBottom: '10px' }}>
        Request Submitted!
      </h2>
      <p style={{ fontSize: '14.5px', color: '#6b7a64', maxWidth: '380px', lineHeight: 1.75, marginBottom: '32px' }}>
        Your emergency request has been posted. Nearby volunteers and
        responders are being notified right now.
      </p>
<div style={{
        background: '#f0faf4', border: '1px solid #c6e8d1',
        borderRadius: '16px', padding: '20px 24px',
        marginBottom: '32px', maxWidth: '420px', width: '100%', textAlign: 'left',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#1a6b3c', marginBottom: '14px' }}>
          What happens next
        </div>
        {nextSteps.map(({ Icon, text }) => (
          <div key={text} className="cr-next-step-item">
            <div className="cr-next-icon"><Icon size={14} color="#1a6b3c" /></div>
            {text}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          className="btn btn-primary btn-lg"
          onClick={onViewRequests}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <ClipboardList size={16} /> View My Requests
        </button>
        <button
          className="btn btn-ghost btn-lg"
          onClick={onNewRequest}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={15} /> New Request
        </button>
      </div>
    </div>
  );
}

const TIPS = [
  'Be specific about your location — include landmarks',
  'Describe the number of people affected',
  'Mention any specific skills or equipment needed',
  'Set urgency accurately — critical requests are prioritized',
  'Add a proof image if it helps describe the situation',
];

const CONTACTS = [
  { label: 'Rescue',          number: '1122' },
  { label: 'Edhi Foundation', number: '115'  },
  { label: 'Police',          number: '15'   },
  { label: 'Ambulance',       number: '1122' },
];

export default function CreateRequest() {
  const navigate = useNavigate();
  const { submitRequest, loading, error, clearError } = useRequests();
  const { user } = useAuth();
  const defaultCity = user?.location?.city || '';

  const [submitted,      setSubmitted]      = useState(false);
  const [createdRequest, setCreatedRequest] = useState(null);

  const handleSubmit = async (payload) => {
    clearError();
    try {
      const request = await submitRequest(payload);
      setCreatedRequest(request);
      setSubmitted(true);
    } catch {  }
  };

  return (
    <Navbar title="Post Emergency Request">
      <style>{STYLES}</style>
      <div className="page-wrapper cr-page">
<div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Siren size={18} color="#dc2626" />
            </div>
            <h1 style={{ fontSize: 'clamp(18px, 3vw, 24px)', fontWeight: 800, color: '#141b11', margin: 0, letterSpacing: '-0.4px' }}>
              Post Emergency Request
            </h1>
          </div>
          <p style={{ fontSize: '13.5px', color: '#6b7a64', margin: 0 }}>
            Describe your situation and we'll match you with the nearest available help.
          </p>
        </div>
<div className="cr-warning-banner">
          <div style={{
            width: '34px', height: '34px', borderRadius: '9px',
            background: '#fef3c7', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0,
          }}>
            <AlertTriangle size={17} color="#d97706" />
          </div>
          <div style={{ fontSize: '13px', color: '#92400e', lineHeight: 1.6 }}>
            <strong>Life-threatening emergency?</strong> Call{' '}
            <strong>1122</strong> (Rescue) or <strong>115</strong> (Edhi) immediately.
            Use this platform for coordination, not as a replacement for emergency services.
          </div>
        </div>
<StepIndicator current={1} submitted={submitted} />
  <div className="cr-main-grid">
<div style={{ background: 'white', border: '1px solid #e2e8e3', borderRadius: '16px', overflow: 'hidden', animationDelay: '100ms' }} className="cr-anim">
            <div style={{ padding: '24px' }}>
              {submitted ? (
                <SuccessScreen
                  request={createdRequest}
                  onViewRequests={() => navigate('/user/my-requests')}
                  onNewRequest={() => { setSubmitted(false); setCreatedRequest(null); clearError(); }}
                />
              ) : (
                <>
                  {error && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      background: '#fef2f2', border: '1px solid #fecaca',
                      borderRadius: '10px', padding: '12px 16px', marginBottom: '18px',
                      fontSize: '13px', color: '#dc2626',
                    }}>
                      <AlertTriangle size={15} />
                      {error}
                    </div>
                  )}
                  <HelpRequestForm
                    onSubmit={handleSubmit}
                    onCancel={() => navigate('/user/dashboard')}
                    loading={loading}
                    defaultCity={defaultCity}
                  />
                </>
              )}
            </div>
          </div>
<div className="cr-anim" style={{ display: 'flex', flexDirection: 'column', gap: '14px', animationDelay: '180ms' }}>
<div className="cr-sidebar-card">
              <div className="cr-sidebar-card-header">
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#fefce8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Lightbulb size={14} color="#ca8a04" />
                </div>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#141b11' }}>Tips for Faster Help</span>
              </div>
              <div style={{ padding: '4px 18px 14px' }}>
                {TIPS.map((tip, i) => (
                  <div key={i} className="tip-item">
                    <div className="tip-num">{i + 1}</div>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
<div style={{
              background: '#f0faf4', border: '1px solid #c6e8d1',
              borderRadius: '14px', padding: '16px 18px',
              display: 'flex', gap: '12px', alignItems: 'flex-start',
            }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: '#e0f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ShieldCheck size={16} color="#1a6b3c" />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#141b11', marginBottom: '5px' }}>Your Safety is Priority</div>
                <p style={{ fontSize: '12px', color: '#6b7a64', margin: 0, lineHeight: 1.65 }}>
                  Your approximate location is shared with verified responders only.
                  Always move to a safe area while waiting for help.
                </p>
              </div>
            </div>
<div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '14px', overflow: 'hidden' }}>
              <div style={{ padding: '13px 18px 10px', borderBottom: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Phone size={13} color="#dc2626" />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  Emergency Contacts
                </span>
              </div>
              <div style={{ padding: '4px 18px 10px' }}>
                {CONTACTS.map(({ label, number }) => (
                  <a key={label} href={`tel:${number}`} className="contact-row">
                    <span style={{ fontSize: '13px', color: '#3a4a35', fontWeight: 500 }}>{label}</span>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#dc2626', letterSpacing: '-0.3px' }}>{number}</span>
                  </a>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </Navbar>
  );
}