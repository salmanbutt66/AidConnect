import React from 'react';

export default function Loader({
  variant = 'spinner',
  size    = 'md',
  message,
  count   = 3,
  color   = 'white',
}) {
  if (variant === 'spinner') {
    const spinnerClass = [
      'spinner',
      color === 'green' ? 'spinner-green' : '',
      size === 'lg'     ? 'spinner-lg'    : '',
    ].filter(Boolean).join(' ');

    return (
      <div
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span className={spinnerClass} />
        {message && (
          <span
            style={{
              fontSize: '13px',
              color: color === 'green' ? 'var(--text-muted)' : 'rgba(255,255,255,0.7)',
              fontWeight: 500,
            }}
          >
            {message}
          </span>
        )}
      </div>
    );
  }
  if (variant === 'overlay') {
    return (
      <div className="loading-screen">
        <div className="loading-logo">
          Aid<span>Connect</span>
        </div>
        {message && (
          <p
            style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.55)',
              marginBottom: '16px',
              marginTop: '-16px',
              fontWeight: 500,
              letterSpacing: '0.2px',
            }}
          >
            {message}
          </p>
        )}
        <div className="loading-bar">
          <div className="loading-bar-fill" />
        </div>
      </div>
    );
  }
  if (variant === 'card') {
    return (
      <div
        className="card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 24px',
          gap: '14px',
          animation: 'fadeIn var(--t-slow) var(--ease)',
        }}
      >
        <span className="spinner spinner-green spinner-lg" />
        {message && (
          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-muted)',
              fontWeight: 500,
              margin: 0,
            }}
          >
            {message}
          </p>
        )}
      </div>
    );
  }
  if (variant === 'skeleton') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          width: '100%',
          animation: 'fadeIn var(--t-slow) var(--ease)',
        }}
      >
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '20px 22px',
              background: 'white',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--stone-200)',
            }}
          >
<div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div
                className="skeleton"
                style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', flexShrink: 0 }}
              />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div className="skeleton" style={{ height: '14px', width: '45%' }} />
                <div className="skeleton" style={{ height: '11px', width: '28%' }} />
              </div>
<div
                className="skeleton"
                style={{ width: '64px', height: '20px', borderRadius: 'var(--radius-full)' }}
              />
            </div>
<div className="skeleton" style={{ height: '12px', width: '90%' }} />
            <div className="skeleton" style={{ height: '12px', width: '70%' }} />
<div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <div className="skeleton" style={{ height: '11px', width: '30%' }} />
              <div className="skeleton" style={{ height: '28px', width: '72px', borderRadius: 'var(--radius-sm)' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}