// src/components/cards/ProviderCard.jsx
import React from 'react';
import {
  Phone,
  MapPin,
  Star,
  ShieldCheck,
  Clock,
  CreditCard,
  Ambulance,
  Hospital,
  Droplets,
  Users,
  Heart,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { SERVICE_TYPES } from '../../utils/constants.js';
import { formatPhone } from '../../utils/formatters.js';

// ─── Service type icon lookup ─────────────────────────────────────────────────
function ServiceIcon({ serviceType, size = 22 }) {
  const props = { size, strokeWidth: 1.6, color: 'var(--green-700)' };
  switch (serviceType) {
    case 'ambulance':   return <Ambulance  {...props} />;
    case 'hospital':    return <Hospital   {...props} />;
    case 'blood_bank':  return <Droplets   {...props} />;
    case 'rescue':      return <Users      {...props} />;
    case 'ngo':         return <Heart      {...props} />;
    default:            return <Building2  {...props} />;
  }
}

function getServiceLabel(serviceType) {
  return (
    SERVICE_TYPES.find((s) => s.value === serviceType)?.label ||
    serviceType ||
    'Provider'
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
        gap: '8px',
        fontSize: '13px',
        color: muted ? 'var(--text-muted)' : 'var(--text-mid)',
      }}
    >
      <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
        {icon}
      </span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {text}
      </span>
    </div>
  );
}

// ─── ProviderCard ─────────────────────────────────────────────────────────────
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
    averageRating    = 0,
    totalRatings     = 0,
    credibilityScore = 50,
  } = provider;

  const isAdmin     = variant === 'admin';
  const isClickable = typeof onClick === 'function';

  const operatingText =
    operatingHours?.open && operatingHours?.close
      ? `${operatingHours.open} – ${operatingHours.close}`
      : null;

  return (
    <div
      className="card card-hover"
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

        {/* ── Header ────────────────────────────────────────────────────── */}
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
              flexShrink: 0,
            }}
          >
            <ServiceIcon serviceType={serviceType} size={22} />
          </div>

          {/* Name + service type */}
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
              {getServiceLabel(serviceType)}
            </div>
          </div>

          {/* Status badges */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end', flexShrink: 0 }}>
            <span className={`badge ${isVerified ? 'badge-green' : 'badge-orange'}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              {isVerified && <CheckCircle2 size={10} />}
              {isVerified ? 'Verified' : 'Unverified'}
            </span>
            <span className={`badge ${isAvailable ? 'badge-green' : 'badge-stone'}`}>
              <span className={`status-dot ${isAvailable ? 'dot-green pulse' : 'dot-stone'}`} />
              {isAvailable ? 'Available' : 'Offline'}
            </span>
          </div>
        </div>

        {/* ── Info rows ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {contactNumber && (
            <InfoRow icon={<Phone size={13} />} text={formatPhone(contactNumber)} />
          )}
          {address && (
            <InfoRow icon={<MapPin size={13} />} text={address} muted />
          )}
          {(totalRatings > 0 || isAdmin) && (
            <InfoRow
              icon={<Star size={13} />}
              text={`${Number(averageRating || 0).toFixed(1)} / 5 (${totalRatings} ratings)`}
              muted
            />
          )}
          <InfoRow
            icon={<ShieldCheck size={13} />}
            text={`Credibility: ${credibilityScore}/100`}
            muted
          />
          {operatingText && (
            <InfoRow icon={<Clock size={13} />} text={`Open: ${operatingText}`} muted />
          )}
          {isAdmin && licenseNumber && (
            <InfoRow icon={<CreditCard size={13} />} text={`License: ${licenseNumber}`} muted />
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
        {isAdmin && (typeof onVerify === 'function' || typeof onSuspend === 'function') && (
          <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '4px' }}>
            {!isVerified && typeof onVerify === 'function' && (
              <button
                className="btn btn-secondary btn-sm"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                disabled={loading}
                onClick={(e) => { e.stopPropagation(); onVerify(_id); }}
              >
                {loading
                  ? <span className="spinner spinner-green" />
                  : <><CheckCircle2 size={13} /> Verify</>
                }
              </button>
            )}
            {typeof onSuspend === 'function' && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ flex: 1, color: 'var(--danger)', borderColor: 'var(--danger)' }}
                disabled={loading}
                onClick={(e) => { e.stopPropagation(); onSuspend(_id); }}
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