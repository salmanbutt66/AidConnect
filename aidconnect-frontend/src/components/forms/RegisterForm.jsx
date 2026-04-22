// src/components/forms/RegisterForm.jsx
import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { BLOOD_GROUPS } from '../../utils/constants.js';
import { validateRegister, hasErrors } from '../../utils/validators.js';

// ─── Role selector cards (same as Register.jsx) ───────────────────────────────
const ROLES = [
  { value: 'user',      emoji: '👤', label: 'Citizen',      desc: 'I need emergency help'   },
  { value: 'volunteer', emoji: '🤝', label: 'Volunteer',    desc: 'I respond to crises'      },
  { value: 'provider',  emoji: '🏥', label: 'Organization', desc: 'We provide aid services'  },
];

// ─── Password strength indicator (lifted from Register.jsx) ───────────────────
function PasswordStrength({ password }) {
  if (!password) return null;

  const hasUpper  = /[A-Z]/.test(password);
  const hasLower  = /[a-z]/.test(password);
  const hasDigit  = /\d/.test(password);
  const hasLength = password.length >= 8;
  const score     = [hasUpper, hasLower, hasDigit, hasLength].filter(Boolean).length;
  const colors    = ['', '#c0392b', '#d68910', '#1a6b9a', '#1a6b3c'];

  return (
    <div style={{ marginTop: '6px' }}>
      <div style={{ display: 'flex', gap: '3px', marginBottom: '4px' }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i <= score ? colors[score] : 'var(--stone-200)',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {[
          { ok: hasLength, text: '8+ chars'  },
          { ok: hasUpper,  text: 'Uppercase' },
          { ok: hasLower,  text: 'Lowercase' },
          { ok: hasDigit,  text: 'Number'    },
        ].map((req) => (
          <span
            key={req.text}
            style={{
              fontSize: '10px', fontWeight: 600,
              color: req.ok ? 'var(--green-700)' : 'var(--text-light)',
              transition: 'color 0.2s',
            }}
          >
            {req.ok ? '✓' : '○'} {req.text}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Reusable field (same as Register.jsx) ────────────────────────────────────
function Field({
  id, name, label, type = 'text', placeholder,
  required, form, errors, onChange, disabled,
}) {
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>{label}</label>
      <input
        id={id}
        name={name}
        type={type}
        className={`form-input ${errors[name] ? 'error' : ''}`}
        placeholder={placeholder}
        value={form[name]}
        onChange={onChange}
        required={required}
        disabled={disabled}
        autoComplete={type === 'password' ? 'new-password' : undefined}
      />
      {errors[name] && (
        <div className="form-error">{errors[name]}</div>
      )}
    </div>
  );
}

// ─── RegisterForm ─────────────────────────────────────────────────────────────
/**
 * RegisterForm — controlled registration form extracted from Register.jsx.
 *
 * Register.jsx remains the page (handles layout, auth context, navigation).
 * This component owns only the form UI and validation.
 *
 * Props:
 *   onSubmit   {fn}      — async (payload) => void   required
 *                          payload shape:
 *                          { name, email, password, role,
 *                            phone?, bloodGroup? }
 *   loading    {boolean} — disables form during submission
 *   apiError   {string}  — top-level error from parent
 *
 * Backend error handling:
 *   If onSubmit throws and err.response.data.errors is an array,
 *   RegisterForm maps field errors automatically.
 *   Otherwise the raw message is shown in the top-level alert.
 *
 * Usage in Register.jsx:
 *   const handleSubmit = async (payload) => {
 *     const user = await register(payload);
 *     navigate(getDashboardPath(user.role), { replace: true });
 *   };
 *
 *   <RegisterForm onSubmit={handleSubmit} loading={loading} apiError={error} />
 */
export default function RegisterForm({ onSubmit, loading = false, apiError = '' }) {
  const [params] = useSearchParams();

  const [form, setForm] = useState({
    name:            '',
    email:           '',
    password:        '',
    confirmPassword: '',
    role:            params.get('role') || 'user',
    phone:           '',
    bloodGroup:      '',
  });

  const [errors,        setErrors]        = useState({});
  const [inlineApiError, setInlineApiError] = useState('');

  // ── Field change — clears field error on edit ──────────────────────────────
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }, [errors]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setInlineApiError('');

    const clientErrors = validateRegister({
      name:            form.name,
      email:           form.email,
      password:        form.password,
      confirmPassword: form.confirmPassword,
      phone:           form.phone,
    });

    if (hasErrors(clientErrors)) {
      setErrors(clientErrors);
      return;
    }

    // Build clean payload
    const payload = {
      name:     form.name.trim(),
      email:    form.email.trim().toLowerCase(),
      password: form.password,
      role:     form.role,
    };
    if (form.phone.trim()) payload.phone      = form.phone.trim();
    if (form.bloodGroup)   payload.bloodGroup = form.bloodGroup;

    try {
      await onSubmit(payload);
    } catch (err) {
      // Map backend field errors if returned as array
      const backendErrors = err.response?.data?.errors;
      if (backendErrors && Array.isArray(backendErrors)) {
        const mapped = {};
        backendErrors.forEach(({ field, message }) => {
          mapped[field] = message;
        });
        setErrors(mapped);
        setInlineApiError('Please fix the errors below.');
      } else {
        setInlineApiError(
          err.response?.data?.message || 'Registration failed. Please try again.'
        );
      }
    }
  };

  // Use parent apiError if no inline error is set
  const displayError = inlineApiError || apiError;

  return (
    <form onSubmit={handleSubmit} noValidate>

      {/* API / backend error */}
      {displayError && (
        <div className="alert alert-error" style={{ marginBottom: '18px' }}>
          <span className="alert-icon">⚠️</span>
          {displayError}
        </div>
      )}

      {/* ── Role selector ───────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '8px',
          marginBottom: '22px',
        }}
      >
        {ROLES.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => setForm((prev) => ({ ...prev, role: r.value }))}
            disabled={loading}
            style={{
              padding: '12px 8px',
              border: `2px solid ${
                form.role === r.value ? 'var(--green-600)' : 'var(--stone-300)'
              }`,
              borderRadius: 'var(--radius-sm)',
              background: form.role === r.value ? 'var(--green-50)' : 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              textAlign: 'center',
              transition: 'all var(--t-fast)',
              opacity: loading ? 0.6 : 1,
            }}
          >
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>{r.emoji}</div>
            <div
              style={{
                fontWeight: 700,
                fontSize: '11px',
                color: form.role === r.value ? 'var(--green-800)' : 'var(--text-dark)',
              }}
            >
              {r.label}
            </div>
            <div
              style={{
                color: 'var(--text-muted)',
                fontSize: '10px',
                marginTop: '2px',
                lineHeight: 1.4,
              }}
            >
              {r.desc}
            </div>
          </button>
        ))}
      </div>

      {/* ── Name + Phone ────────────────────────────────────────────────── */}
      <div className="form-row cols-2">
        <Field
          id="rf-name" name="name" label="Full Name"
          placeholder="Muhammad Ali" required
          form={form} errors={errors}
          onChange={handleChange} disabled={loading}
        />
        <Field
          id="rf-phone" name="phone" label="Phone (optional)"
          placeholder="03001234567"
          form={form} errors={errors}
          onChange={handleChange} disabled={loading}
        />
      </div>

      {/* ── Email ───────────────────────────────────────────────────────── */}
      <Field
        id="rf-email" name="email" label="Email Address"
        type="email" placeholder="you@example.com" required
        form={form} errors={errors}
        onChange={handleChange} disabled={loading}
      />

      {/* ── Password with strength indicator ────────────────────────────── */}
      <div className="form-group">
        <label className="form-label" htmlFor="rf-password">
          Password <span style={{ color: 'var(--danger)' }}>*</span>
        </label>
        <input
          id="rf-password"
          name="password"
          type="password"
          className={`form-input ${errors.password ? 'error' : ''}`}
          placeholder="Min 8 chars, uppercase + number"
          value={form.password}
          onChange={handleChange}
          required
          disabled={loading}
          autoComplete="new-password"
        />
        {errors.password
          ? <div className="form-error">{errors.password}</div>
          : <PasswordStrength password={form.password} />
        }
      </div>

      {/* ── Confirm password ────────────────────────────────────────────── */}
      <Field
        id="rf-confirmPassword" name="confirmPassword"
        label="Confirm Password" type="password"
        placeholder="Repeat password" required
        form={form} errors={errors}
        onChange={handleChange} disabled={loading}
      />

      {/* ── Blood group (hidden for providers) ──────────────────────────── */}
      {form.role !== 'provider' && (
        <div className="form-group">
          <label className="form-label" htmlFor="rf-bloodGroup">
            Blood Group
            <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: '6px' }}>
              (optional)
            </span>
          </label>
          <select
            id="rf-bloodGroup"
            name="bloodGroup"
            className="form-select"
            value={form.bloodGroup}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="">Select blood group</option>
            {BLOOD_GROUPS.map((bg) => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
        </div>
      )}

      {/* ── Submit ──────────────────────────────────────────────────────── */}
      <button
        type="submit"
        className="btn btn-primary btn-full btn-lg"
        style={{ marginTop: '10px' }}
        disabled={loading}
      >
        {loading ? (
          <><span className="spinner" /> Creating account…</>
        ) : (
          'Create Account →'
        )}
      </button>

      {/* ── Sign in link ─────────────────────────────────────────────────── */}
      <p
        style={{
          textAlign: 'center',
          fontSize: '14px',
          color: 'var(--text-muted)',
          marginTop: '20px',
        }}
      >
        Already have an account?{' '}
        <Link to="/login" style={{ fontWeight: 600 }}>
          Sign in
        </Link>
      </p>

    </form>
  );
}