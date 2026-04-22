// src/components/forms/HelpRequestForm.jsx
import React, { useState, useCallback } from 'react';
import {
  EMERGENCY_TYPES,
  URGENCY_LEVELS,
  BLOOD_GROUPS,
  PAKISTAN_CITIES,
} from '../../utils/constants.js';
import { validateHelpRequest, hasErrors } from '../../utils/validators.js';
import { sanitizeString } from '../../utils/validators.js';

// ─── Emergency type selector card ─────────────────────────────────────────────
function EmergencyTypeSelector({ value, onChange, disabled }) {
  return (
    <div className="form-group">
      <label className="form-label">Emergency Type <span style={{ color: 'var(--danger)' }}>*</span></label>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '8px',
        }}
      >
        {EMERGENCY_TYPES.map((type) => {
          const isSelected = value === type.value;
          return (
            <button
              key={type.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(type.value)}
              style={{
                padding: '12px 6px',
                border: `2px solid ${isSelected ? 'var(--green-600)' : 'var(--stone-300)'}`,
                borderRadius: 'var(--radius-sm)',
                background: isSelected ? 'var(--green-50)' : 'white',
                cursor: disabled ? 'not-allowed' : 'pointer',
                textAlign: 'center',
                transition: 'all var(--t-fast)',
                opacity: disabled ? 0.6 : 1,
              }}
            >
              <div style={{ fontSize: '22px', marginBottom: '4px' }}>{type.emoji}</div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: isSelected ? 'var(--green-800)' : 'var(--text-dark)',
                }}
              >
                {type.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Urgency level selector ───────────────────────────────────────────────────
function UrgencySelector({ value, onChange, disabled }) {
  const styles = {
    low:      { border: 'var(--green-400)',  bg: 'var(--green-50)',   text: 'var(--green-800)'  },
    medium:   { border: 'var(--warning)',    bg: 'var(--warning-bg)', text: 'var(--warning)'    },
    high:     { border: 'var(--danger)',     bg: 'var(--danger-bg)',  text: 'var(--danger)'     },
    critical: { border: '#7a1f1f',           bg: '#4a0f0f',           text: '#ff6b6b'           },
  };

  return (
    <div className="form-group">
      <label className="form-label">Urgency Level <span style={{ color: 'var(--danger)' }}>*</span></label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
        {URGENCY_LEVELS.map((level) => {
          const isSelected = value === level.value;
          const s = styles[level.value];
          return (
            <button
              key={level.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(level.value)}
              style={{
                padding: '10px 8px',
                border: `2px solid ${isSelected ? s.border : 'var(--stone-300)'}`,
                borderRadius: 'var(--radius-sm)',
                background: isSelected ? s.bg : 'white',
                cursor: disabled ? 'not-allowed' : 'pointer',
                textAlign: 'center',
                transition: 'all var(--t-fast)',
                opacity: disabled ? 0.6 : 1,
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: isSelected ? s.text : 'var(--text-dark)',
                }}
              >
                {level.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Location section ─────────────────────────────────────────────────────────
function LocationSection({ form, errors, onChange, disabled }) {
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError,   setGeoError]   = useState('');
  const [geoSuccess, setGeoSuccess] = useState(false);

  const handleGetLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLoading(true);
    setGeoError('');
    setGeoSuccess(false);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange('latitude',  pos.coords.latitude);
        onChange('longitude', pos.coords.longitude);
        setGeoSuccess(true);
        setGeoLoading(false);
      },
      (err) => {
        const messages = {
          1: 'Location permission denied. Please use the city/area fields below.',
          2: 'Location unavailable. Please use the city/area fields below.',
          3: 'Location request timed out. Please use the city/area fields below.',
        };
        setGeoError(messages[err.code] || 'Could not get location.');
        setGeoLoading(false);
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true }
    );
  }, [onChange]);

  return (
    <div className="form-group">
      <label className="form-label">
        Location <span style={{ color: 'var(--danger)' }}>*</span>
      </label>

      {/* Geolocation button */}
      <button
        type="button"
        className="btn btn-secondary btn-full"
        onClick={handleGetLocation}
        disabled={disabled || geoLoading}
        style={{ marginBottom: '12px' }}
      >
        {geoLoading ? (
          <><span className="spinner spinner-green" /> Detecting location…</>
        ) : geoSuccess ? (
          <>✅ Location detected — update</>
        ) : (
          <>📍 Use my current location</>
        )}
      </button>

      {/* Geo success confirmation */}
      {geoSuccess && form.latitude && form.longitude && (
        <div className="alert alert-success" style={{ marginBottom: '10px', padding: '8px 12px' }}>
          <span className="alert-icon">✅</span>
          <span style={{ fontSize: '12px' }}>
            GPS coordinates captured ({form.latitude.toFixed(4)}, {form.longitude.toFixed(4)})
          </span>
        </div>
      )}

      {/* Geo error */}
      {geoError && (
        <div className="alert alert-warning" style={{ marginBottom: '10px', padding: '8px 12px' }}>
          <span className="alert-icon">⚠️</span>
          <span style={{ fontSize: '12px' }}>{geoError}</span>
        </div>
      )}

      {/* Divider */}
      <div className="divider-text" style={{ margin: '10px 0', fontSize: '12px' }}>
        or enter manually
      </div>

      {/* City + Area dropdowns */}
      <div className="form-row cols-2">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="city">City</label>
          <select
            id="city"
            className={`form-select ${errors.city ? 'error' : ''}`}
            value={form.city || ''}
            onChange={(e) => onChange('city', e.target.value)}
            disabled={disabled}
          >
            <option value="">Select city</option>
            {PAKISTAN_CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {errors.city && <div className="form-error">{errors.city}</div>}
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="area">Area / Street</label>
          <input
            id="area"
            type="text"
            className={`form-input ${errors.area ? 'error' : ''}`}
            placeholder="e.g. Gulshan-e-Iqbal, Block 7"
            value={form.area || ''}
            onChange={(e) => onChange('area', e.target.value)}
            disabled={disabled}
          />
          {errors.area && <div className="form-error">{errors.area}</div>}
        </div>
      </div>

      {/* Full address */}
      <div className="form-group" style={{ marginTop: '10px', marginBottom: 0 }}>
        <label className="form-label" htmlFor="address">Full Address (optional)</label>
        <input
          id="address"
          type="text"
          className="form-input"
          placeholder="House/Building number, street name…"
          value={form.address || ''}
          onChange={(e) => onChange('address', e.target.value)}
          disabled={disabled}
        />
        <div className="form-hint">Helps responders find you faster</div>
      </div>

      {/* Location validation error */}
      {errors.location && (
        <div className="form-error" style={{ marginTop: '6px' }}>{errors.location}</div>
      )}
    </div>
  );
}

// ─── HelpRequestForm ──────────────────────────────────────────────────────────
/**
 * HelpRequestForm — controlled form for creating a help request.
 *
 * Props:
 *   onSubmit   {fn}      — async (payload) => void   called with clean payload
 *   onCancel   {fn}      — () => void                optional cancel button
 *   loading    {boolean} — disables form during submission
 *
 * The parent page (CreateRequest.jsx) owns the API call:
 *
 *   const { submitRequest } = useRequests();
 *
 *   const handleSubmit = async (payload) => {
 *     try {
 *       await submitRequest(payload);
 *       navigate('/user/my-requests');
 *     } catch (err) {
 *       // error already set in useRequests
 *     }
 *   };
 *
 *   <HelpRequestForm onSubmit={handleSubmit} onCancel={() => navigate(-1)} loading={loading} />
 */
export default function HelpRequestForm({ onSubmit, onCancel, loading = false }) {
  const [form, setForm] = useState({
    emergencyType: '',
    urgencyLevel:  '',
    description:   '',
    bloodGroupNeeded: '',
    latitude:      null,
    longitude:     null,
    city:          '',
    area:          '',
    address:       '',
    proofImage:    '',
  });

  const [errors,   setErrors]   = useState({});
  const [apiError, setApiError] = useState('');

  // ── Single field updater ───────────────────────────────────────────────────
  const handleChange = useCallback((name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    // Clear location error when any location field changes
    if (['latitude', 'longitude', 'city', 'area'].includes(name)) {
      setErrors((prev) => ({ ...prev, location: '' }));
    }
  }, [errors]);

  // ── Input element onChange adaptor ────────────────────────────────────────
  const handleInputChange = useCallback((e) => {
    handleChange(e.target.name, e.target.value);
  }, [handleChange]);

  // ── Validate ──────────────────────────────────────────────────────────────
  const validate = useCallback(() => {
    const errs = validateHelpRequest({
      emergencyType: form.emergencyType,
      urgencyLevel:  form.urgencyLevel,
      description:   form.description,
      // Location is valid if we have GPS coords OR a city selected
      longitude: form.longitude ?? (form.city ? 0 : null),
      latitude:  form.latitude  ?? (form.city ? 0 : null),
    });

    // Blood group required for blood requests
    if (form.emergencyType === 'blood' && !form.bloodGroupNeeded) {
      errs.bloodGroupNeeded = 'Please select the required blood group';
    }

    return errs;
  }, [form]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    const clientErrors = validate();
    if (hasErrors(clientErrors)) {
      setErrors(clientErrors);
      // Scroll to first error
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Build clean payload
    const payload = {
      emergencyType: form.emergencyType,
      urgencyLevel:  form.urgencyLevel,
      description:   sanitizeString(form.description),
    };

    // Location — prefer GPS coords, fall back to city/area string
    if (form.latitude != null && form.longitude != null) {
      payload.latitude  = form.latitude;
      payload.longitude = form.longitude;
    }

    // Address string — build from fields if not manually entered
    payload.address = form.address.trim() ||
      [form.area, form.city].filter(Boolean).join(', ');

    // Optional fields
    if (form.bloodGroupNeeded) payload.bloodGroupNeeded = form.bloodGroupNeeded;
    if (form.proofImage.trim()) payload.proofImage = form.proofImage.trim();

    try {
      await onSubmit(payload);
    } catch (err) {
      const backendErrors = err.response?.data?.errors;
      if (backendErrors && Array.isArray(backendErrors)) {
        const mapped = {};
        backendErrors.forEach(({ field, message }) => {
          mapped[field] = message;
        });
        setErrors(mapped);
        setApiError('Please fix the errors below.');
      } else {
        setApiError(
          err.response?.data?.message || 'Failed to submit request. Please try again.'
        );
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>

      {/* API error */}
      {apiError && (
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          <span className="alert-icon">⚠️</span>
          {apiError}
        </div>
      )}

      {/* ── Emergency type ──────────────────────────────────────────────── */}
      <EmergencyTypeSelector
        value={form.emergencyType}
        onChange={(v) => handleChange('emergencyType', v)}
        disabled={loading}
      />
      {errors.emergencyType && (
        <div className="form-error" style={{ marginTop: '-12px', marginBottom: '16px' }}>
          {errors.emergencyType}
        </div>
      )}

      {/* ── Urgency level ───────────────────────────────────────────────── */}
      <UrgencySelector
        value={form.urgencyLevel}
        onChange={(v) => handleChange('urgencyLevel', v)}
        disabled={loading}
      />
      {errors.urgencyLevel && (
        <div className="form-error" style={{ marginTop: '-12px', marginBottom: '16px' }}>
          {errors.urgencyLevel}
        </div>
      )}

      {/* ── Blood group (blood requests only) ───────────────────────────── */}
      {form.emergencyType === 'blood' && (
        <div className="form-group">
          <label className="form-label" htmlFor="bloodGroupNeeded">
            Blood Group Needed <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <select
            id="bloodGroupNeeded"
            name="bloodGroupNeeded"
            className={`form-select ${errors.bloodGroupNeeded ? 'error' : ''}`}
            value={form.bloodGroupNeeded}
            onChange={handleInputChange}
            disabled={loading}
          >
            <option value="">Select blood group</option>
            {BLOOD_GROUPS.map((bg) => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
          {errors.bloodGroupNeeded && (
            <div className="form-error">{errors.bloodGroupNeeded}</div>
          )}
        </div>
      )}

      {/* ── Description ─────────────────────────────────────────────────── */}
      <div className="form-group">
        <label className="form-label" htmlFor="description">
          Description <span style={{ color: 'var(--danger)' }}>*</span>
        </label>
        <textarea
          id="description"
          name="description"
          className={`form-textarea ${errors.description ? 'error' : ''}`}
          placeholder="Describe the emergency in detail — what happened, how many people are affected, any specific needs…"
          value={form.description}
          onChange={handleInputChange}
          disabled={loading}
          rows={4}
          maxLength={1000}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '4px',
          }}
        >
          {errors.description
            ? <div className="form-error">{errors.description}</div>
            : <div className="form-hint">Minimum 10 characters</div>
          }
          <div
            style={{
              fontSize: '11px',
              color: form.description.length > 900
                ? 'var(--danger)'
                : 'var(--text-light)',
            }}
          >
            {form.description.length}/1000
          </div>
        </div>
      </div>

      {/* ── Location ────────────────────────────────────────────────────── */}
      <LocationSection
        form={form}
        errors={errors}
        onChange={handleChange}
        disabled={loading}
      />

      {/* ── Proof image URL (optional) ───────────────────────────────────── */}
      <div className="form-group">
        <label className="form-label" htmlFor="proofImage">
          Proof Image URL
          <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: '6px' }}>
            (optional)
          </span>
        </label>
        <input
          id="proofImage"
          name="proofImage"
          type="url"
          className="form-input"
          placeholder="https://… paste an image link"
          value={form.proofImage}
          onChange={handleInputChange}
          disabled={loading}
        />
        <div className="form-hint">Upload your image elsewhere and paste the link here</div>
      </div>

      {/* ── Critical urgency warning ─────────────────────────────────────── */}
      {form.urgencyLevel === 'critical' && (
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          <span className="alert-icon">🚨</span>
          <div>
            <strong>Critical emergency?</strong> Call <strong>1122</strong> (Rescue) or{' '}
            <strong>115</strong> (Edhi) immediately — do not rely solely on this platform.
          </div>
        </div>
      )}

      {/* ── Actions ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
        {typeof onCancel === 'function' && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={loading}
            style={{ flex: 1 }}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={loading}
          style={{ flex: 2 }}
        >
          {loading ? (
            <><span className="spinner" /> Submitting request…</>
          ) : (
            '🆘 Submit Request →'
          )}
        </button>
      </div>

    </form>
  );
}