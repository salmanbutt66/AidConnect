// src/pages/user/CreateRequest.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar.jsx';
import HelpRequestForm from '../../components/forms/HelpRequestForm.jsx';
import useRequests from '../../hooks/useRequests.js';

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ steps, current }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0',
        marginBottom: '32px',
        animation: 'fadeSlideUp var(--t-page) var(--ease) both',
      }}
    >
      {steps.map((step, i) => {
        const isDone   = i < current;
        const isActive = i === current;
        const isLast   = i === steps.length - 1;

        return (
          <React.Fragment key={step.label}>
            {/* Step circle */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isDone ? '16px' : '14px',
                  fontWeight: 700,
                  background: isDone
                    ? 'var(--green-700)'
                    : isActive
                      ? 'var(--green-800)'
                      : 'var(--stone-200)',
                  color: isDone || isActive ? 'white' : 'var(--text-muted)',
                  border: isActive ? '3px solid var(--green-300)' : '3px solid transparent',
                  transition: 'all var(--t-base)',
                  boxShadow: isActive ? '0 0 0 4px rgba(26,107,60,0.12)' : 'none',
                }}
              >
                {isDone ? '✓' : step.icon}
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive
                    ? 'var(--green-800)'
                    : isDone
                      ? 'var(--green-700)'
                      : 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                }}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                style={{
                  flex: 1,
                  height: '2px',
                  background: isDone ? 'var(--green-500)' : 'var(--stone-200)',
                  margin: '0 8px',
                  marginBottom: '22px',
                  transition: 'background var(--t-slow)',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Success screen ───────────────────────────────────────────────────────────
function SuccessScreen({ request, onViewRequests, onNewRequest }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '60px 24px',
        textAlign: 'center',
        animation: 'scaleIn var(--t-base) var(--ease) both',
      }}
    >
      {/* Success icon */}
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'var(--green-100)',
          border: '3px solid var(--green-300)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '36px',
          marginBottom: '24px',
          animation: 'scaleIn var(--t-base) var(--ease) both',
        }}
      >
        ✅
      </div>

      <h2
        style={{
          fontSize: '24px',
          fontWeight: 800,
          color: 'var(--text-dark)',
          letterSpacing: '-0.5px',
          marginBottom: '8px',
        }}
      >
        Request Submitted!
      </h2>
      <p
        style={{
          fontSize: '15px',
          color: 'var(--text-muted)',
          maxWidth: '400px',
          lineHeight: 1.7,
          marginBottom: '32px',
        }}
      >
        Your emergency request has been posted. Nearby volunteers and
        responders are being notified right now.
      </p>

      {/* What happens next */}
      <div
        style={{
          background: 'var(--green-50)',
          border: '1px solid var(--green-200)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          marginBottom: '32px',
          maxWidth: '440px',
          width: '100%',
          textAlign: 'left',
        }}
      >
        <div
          style={{
            fontSize: '12px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: 'var(--green-700)',
            marginBottom: '14px',
          }}
        >
          What happens next
        </div>
        {[
          { icon: '🔍', text: 'We are matching you with nearby volunteers'   },
          { icon: '📱', text: 'You will be notified when someone accepts'    },
          { icon: '🚨', text: 'For life-threatening emergencies, call 1122'  },
        ].map((item) => (
          <div
            key={item.text}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '10px',
              fontSize: '13px',
              color: 'var(--text-mid)',
            }}
          >
            <span style={{ fontSize: '16px' }}>{item.icon}</span>
            {item.text}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button className="btn btn-primary btn-lg" onClick={onViewRequests}>
          📋 View My Requests
        </button>
        <button className="btn btn-ghost btn-lg" onClick={onNewRequest}>
          + New Request
        </button>
      </div>
    </div>
  );
}

// ─── CreateRequest ────────────────────────────────────────────────────────────
const STEPS = [
  { icon: '🆘', label: 'Emergency Type' },
  { icon: '📝', label: 'Details'        },
  { icon: '📍', label: 'Location'       },
  { icon: '✅', label: 'Submit'         },
];

export default function CreateRequest() {
  const navigate = useNavigate();
  const { submitRequest, loading, error, clearError } = useRequests();

  const [step,           setStep]           = useState(1);
  const [submitted,      setSubmitted]      = useState(false);
  const [createdRequest, setCreatedRequest] = useState(null);

  const handleSubmit = async (payload) => {
    clearError();
    try {
      const request = await submitRequest(payload);
      setCreatedRequest(request);
      setSubmitted(true);
      setStep(3);
    } catch {
      // error already set in useRequests
    }
  };

  return (
    <Navbar title="Post Emergency Request">
      <div className="page-wrapper">

        {/* ── Page header ───────────────────────────────────────────────── */}
        <div className="page-header">
          <h1>Post Emergency Request 🆘</h1>
          <p>Describe your situation and we'll match you with the nearest available help.</p>
        </div>

        {/* ── Critical emergency reminder ───────────────────────────────── */}
        <div className="alert alert-warning anim-fade-up" style={{ marginBottom: '24px' }}>
          <span className="alert-icon">⚠️</span>
          <div>
            <strong>Life-threatening emergency?</strong> Call{' '}
            <strong>1122</strong> (Rescue) or <strong>115</strong> (Edhi) immediately.
            Use this platform for coordination — not as a replacement for emergency services.
          </div>
        </div>

        {/* ── Step indicator ────────────────────────────────────────────── */}
        <StepIndicator steps={STEPS} current={submitted ? 3 : 1} />

        {/* ── Main grid ─────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 300px',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          {/* Form / Success card */}
          <div className="card anim-fade-up delay-200">
            <div className="card-body">
              {submitted ? (
                <SuccessScreen
                  request={createdRequest}
                  onViewRequests={() => navigate('/user/my-requests')}
                  onNewRequest={() => {
                    setSubmitted(false);
                    setStep(1);
                    setCreatedRequest(null);
                    clearError();
                  }}
                />
              ) : (
                <>
                  {error && (
                    <div className="alert alert-error" style={{ marginBottom: '20px' }}>
                      <span className="alert-icon">⚠️</span>
                      {error}
                    </div>
                  )}
                  <HelpRequestForm
                    onSubmit={handleSubmit}
                    onCancel={() => navigate('/user/dashboard')}
                    loading={loading}
                  />
                </>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div
            className="anim-fade-up delay-300"
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            {/* Tips card */}
            <div className="card">
              <div className="card-body">
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    color: 'var(--green-700)',
                    marginBottom: '14px',
                  }}
                >
                  💡 Tips for faster help
                </div>
                {[
                  { tip: 'Be specific about your location — include landmarks'       },
                  { tip: 'Describe the number of people affected'                    },
                  { tip: 'Mention any specific skills or equipment needed'           },
                  { tip: 'Set urgency accurately — critical requests are prioritized'},
                  { tip: 'Add a proof image if it helps describe the situation'      },
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: '8px',
                      marginBottom: '10px',
                      fontSize: '13px',
                      color: 'var(--text-mid)',
                      lineHeight: 1.5,
                    }}
                  >
                    <span style={{ color: 'var(--green-600)', fontWeight: 700, flexShrink: 0 }}>
                      {i + 1}.
                    </span>
                    {item.tip}
                  </div>
                ))}
              </div>
            </div>

            {/* Safety disclaimer — from Rabia's branch */}
            <div
              style={{
                padding: '16px 20px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--green-50)',
                border: '1px solid var(--green-100)',
                display: 'flex',
                gap: '12px',
              }}
            >
              <span style={{ fontSize: '22px', flexShrink: 0 }}>🛡️</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '4px' }}>
                  Your Safety is Priority
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
                  Your approximate location will be shared with verified responders only.
                  Always move to a safe area while waiting for help to arrive.
                </p>
              </div>
            </div>

            {/* Emergency contacts card */}
            <div
              style={{
                background: 'var(--danger-bg)',
                border: '1px solid #f5c6c2',
                borderRadius: 'var(--radius-lg)',
                padding: '16px 20px',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  color: 'var(--danger)',
                  marginBottom: '12px',
                }}
              >
                🚨 Emergency Contacts
              </div>
              {[
                { label: 'Rescue',          number: '1122' },
                { label: 'Edhi Foundation', number: '115'  },
                { label: 'Police',          number: '15'   },
                { label: 'Ambulance',       number: '1122' },
              ].map((contact) => (
                <a
                  key={contact.label}
                  href={`tel:${contact.number}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: '1px solid rgba(192,57,43,0.1)',
                    textDecoration: 'none',
                    transition: 'opacity var(--t-fast)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  <span style={{ fontSize: '13px', color: 'var(--text-mid)', fontWeight: 500 }}>
                    {contact.label}
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--danger)', letterSpacing: '-0.3px' }}>
                    {contact.number}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>

      </div>
    </Navbar>
  );
}