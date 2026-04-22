// src/components/cards/ProviderCard.jsx
import React from 'react';
import { SERVICE_TYPES } from '../../utils/constants.js';
import { formatPhone } from '../../utils/formatters.js';

// ─── Service type meta lookup ─────────────────────────────────────────────────
function getServiceMeta(serviceType) {
  return (
    SERVICE_TYPES.find((s) => s.value === serviceType) || {
      emoji: '🏥',
      label: serviceType || 'Provider',
    }
  );
}

// ─── Info Row — icon + text ───────────────────────────────────────────────────
function InfoRow({ icon, text, muted = false }) {
  if (!text) return null;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
        fontSize: '13px',
        color: muted ? 'var(--text-muted)' : 'var(--text-mid)',
      }}
    >
      <span style={{ fontSize: '13px', flexShrink: 0 }}>{icon}</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {text}
      </span>
    </div>
  );
}

// ─── ProviderCard ─────────────────────────────────────────────────────────────
/**
 * ProviderCard — displays a single provider in list/grid views.
 *
 * Props:
 *   provider   {object}   — provider document from API
 *   onVerify   {fn}       — (providerId) => void  [admin only, optional]
 *   onSuspend  {fn}       — (providerId) => void  [admin only, optional]
 *   onClick    {fn}       — (provider)   => void  [optional, makes card clickable]
 *   loading    {boolean}  — disables action buttons during API call
 *   variant    'default' | 'admin'
 *              default → show contact info, availability
 *              admin   → show verify/suspend actions, license number
 *
 * Provider object shape (from backend):
 *   _id, userId, organizationName, serviceType, licenseNumber,
 *   isVerified, isAvailable, operatingHours: { open, close },
 *   servicesOffered[], contactNumber, address,
 *   location: GeoJSON
 */
export default function ProviderCard({
  provider,
  onVerify,
  onSuspend,
  onClick,
  loading = false,
  variant = 'default',
}) {
  if (!provider) return null;

  const {
    _id,
    organizationName,
    serviceType,
    licenseNumber,
    isVerified,
    isAvailable,
    operatingHours,
    servicesOffered = [],
    contactNumber,
    address,
  } = provider;

  const serviceMeta = getServiceMeta(serviceType);
  const isAdmin     = variant === 'admin';
  const isClickable = typeof onClick === 'function';

  const operatingText =
    operatingHours?.open && operatingHours?.close
      ? `${operatingHours.open} – ${operatingHours.close}`
      : null;

  return (
    <div
      className={`card card-hover${isClickable ? '' : ''}`}
      onClick={isClickable ? () => onClick(provider) : undefined}
      style={{
        cursor: isClickable ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        animation: 'fadeSlideUp var(--t-page) var(--ease) both',
      }}
    >
      <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* ── Header: icon + name + badges ─────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>

          {/* Service type icon bubble */}
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--green-100)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              flexShrink: 0,
            }}
          >
            {serviceMeta.emoji}
          </div>

          {/* Name + service type label */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: '15px',
                color: 'var(--text-dark)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                marginBottom: '4px',
              }}
            >
              {organizationName || 'Unnamed Organization'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
              {serviceMeta.label}
            </div>
          </div>

          {/* Status badges — stacked top-right */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end', flexShrink: 0 }}>
            <span className={`badge ${isVerified ? 'badge-green' : 'badge-orange'}`}>
              {isVerified ? '✓ Verified' : 'Unverified'}
            </span>
            <span className={`badge ${isAvailable ? 'badge-green' : 'badge-stone'}`}>
              <span
                className={`status-dot ${isAvailable ? 'dot-green pulse' : 'dot-stone'}`}
              />
              {isAvailable ? 'Available' : 'Offline'}
            </span>
          </div>
        </div>

        {/* ── Info rows ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {contactNumber && (
            <InfoRow icon="📞" text={formatPhone(contactNumber)} />
          )}
          {address && (
            <InfoRow icon="📍" text={address} muted />
          )}
          {operatingText && (
            <InfoRow icon="🕐" text={`Open: ${operatingText}`} muted />
          )}
          {isAdmin && licenseNumber && (
            <InfoRow icon="🪪" text={`License: ${licenseNumber}`} muted />
          )}
        </div>

        {/* ── Services offered chips ────────────────────────────────────── */}
        {servicesOffered.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {servicesOffered.slice(0, 4).map((s) => (
              <span
                key={s}
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--green-100)',
                  color: 'var(--green-800)',
                  textTransform: 'capitalize',
                }}
              >
                {s.replace(/_/g, ' ')}
              </span>
            ))}
            {servicesOffered.length > 4 && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--stone-200)',
                  color: 'var(--text-muted)',
                }}
              >
                +{servicesOffered.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* ── Admin actions ─────────────────────────────────────────────── */}
        {isAdmin && (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginTop: 'auto',
              paddingTop: '4px',
            }}
          >
            {!isVerified && typeof onVerify === 'function' && (
              <button
                className="btn btn-secondary btn-sm"
                style={{ flex: 1 }}
                disabled={loading}
                onClick={(e) => {
                  e.stopPropagation();
                  onVerify(_id);
                }}
              >
                {loading ? <span className="spinner spinner-green" /> : '✓ Verify'}
              </button>
            )}
            {typeof onSuspend === 'function' && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ flex: 1, color: 'var(--danger)', borderColor: 'var(--danger)' }}
                disabled={loading}
                onClick={(e) => {
                  e.stopPropagation();
                  onSuspend(_id);
                }}
              >
                {loading ? <span className="spinner" /> : 'Suspend'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}