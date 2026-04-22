// src/components/common/Loader.jsx
import React from 'react';

// ─── Loader ───────────────────────────────────────────────────────────────────
/**
 * Loader — versatile loading indicator for all loading states in the app.
 *
 * FOUR variants:
 *
 * 1. 'spinner'  — small inline spinner, used inside buttons or inline states
 *    <Loader />
 *    <Loader size="lg" />
 *
 * 2. 'overlay'  — full-page branded loading screen (same as PageLoader in
 *                 AppRoutes). Used when an entire page is loading.
 *    <Loader variant="overlay" />
 *    <Loader variant="overlay" message="Fetching requests…" />
 *
 * 3. 'card'     — centered spinner inside a white card container.
 *                 Drop inside any card/section that is loading.
 *    <Loader variant="card" />
 *    <Loader variant="card" message="Loading volunteers…" />
 *
 * 4. 'skeleton' — shimmer placeholder rows. Pass count for number of rows.
 *    <Loader variant="skeleton" />
 *    <Loader variant="skeleton" count={5} />
 *
 * Props:
 *   variant   'spinner' | 'overlay' | 'card' | 'skeleton'   default: 'spinner'
 *   size      'sm' | 'md' | 'lg'                            default: 'md'
 *             (only applies to spinner variant)
 *   message   {string}   optional text shown below spinner
 *   count     {number}   number of skeleton rows             default: 3
 *   color     'white' | 'green'                             default: 'white'
 *             'white' for dark backgrounds, 'green' for light backgrounds
 */
export default function Loader({
  variant = 'spinner',
  size    = 'md',
  message,
  count   = 3,
  color   = 'white',
}) {

  // ── Spinner ────────────────────────────────────────────────────────────────
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

  // ── Full-page overlay (mirrors PageLoader in AppRoutes.jsx) ────────────────
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

  // ── Card — centered spinner inside a white container ──────────────────────
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

  // ── Skeleton — shimmer placeholder rows ───────────────────────────────────
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
            {/* Title row */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div
                className="skeleton"
                style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', flexShrink: 0 }}
              />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div className="skeleton" style={{ height: '14px', width: '45%' }} />
                <div className="skeleton" style={{ height: '11px', width: '28%' }} />
              </div>
              {/* Badge placeholder */}
              <div
                className="skeleton"
                style={{ width: '64px', height: '20px', borderRadius: 'var(--radius-full)' }}
              />
            </div>
            {/* Description row */}
            <div className="skeleton" style={{ height: '12px', width: '90%' }} />
            <div className="skeleton" style={{ height: '12px', width: '70%' }} />
            {/* Footer row */}
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