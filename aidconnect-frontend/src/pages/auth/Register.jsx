// src/pages/auth/Register.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { BLOOD_GROUPS } from '../../utils/constants.js';

// ─── Password Strength Indicator ─────────────────────────────────────────────
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
          { ok: hasLength, text: '8+ chars' },
          { ok: hasUpper,  text: 'Uppercase' },
          { ok: hasLower,  text: 'Lowercase' },
          { ok: hasDigit,  text: 'Number' },
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

// ─── Reusable Field Component ─────────────────────────────────────────────────
function Field({ id, name, label, type = 'text', placeholder, required, form, errors, onChange, disabled }) {
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
        autoComplete={
          type === 'password' ? 'new-password' : undefined
        }
      />
      {errors[name] && (
        <div className="form-error">{errors[name]}</div>
      )}
    </div>
  );
}

// ─── Register Page ────────────────────────────────────────────────────────────
export default function Register() {
  const { register, getDashboardPath } = useAuth();
  const navigate  = useNavigate();
  const [params]  = useSearchParams();

  const [form, setForm] = useState({
    name:            '',
    email:           '',
    password:        '',
    confirmPassword: '',
    role:            params.get('role') || 'user',
    phone:           '',
    bloodGroup:      '',
  });

  const [errors, setErrors]     = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const validate = () => {
    const errs = {};

    if (!form.name.trim() || form.name.trim().length < 2)
      errs.name = 'Full name must be at least 2 characters';

    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email))
      errs.email = 'Please enter a valid email address';

    if (!form.password)
      errs.password = 'Password is required';
    else if (form.password.length < 8)
      errs.password = 'Password must be at least 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password))
      errs.password = 'Must contain uppercase, lowercase and a number';

    if (!form.confirmPassword)
      errs.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword)
      errs.confirmPassword = 'Passwords do not match';

    if (form.phone && !/^(\+92|0)[0-9]{10}$/.test(form.phone))
      errs.phone = 'Format: 03001234567 or +923001234567';

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    const clientErrors = validate();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name:     form.name.trim(),
        email:    form.email.trim().toLowerCase(),
        password: form.password,
        role:     form.role,
      };
      if (form.phone)      payload.phone      = form.phone;
      if (form.bloodGroup) payload.bloodGroup = form.bloodGroup;

      const user = await register(payload);
      navigate(getDashboardPath(user.role), { replace: true });
    } catch (err) {
      const backendErrors = err.response?.data?.errors;
      if (backendErrors && Array.isArray(backendErrors)) {
        const mappedErrs = {};
        backendErrors.forEach(({ field, message }) => {
          mappedErrs[field] = message;
        });
        setErrors(mappedErrs);
        setApiError('Please fix the errors below.');
      } else {
        setApiError(
          err.response?.data?.message || 'Registration failed. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { value: 'user',      emoji: '👤', label: 'Citizen',      desc: 'I need emergency help' },
    { value: 'volunteer', emoji: '🤝', label: 'Volunteer',     desc: 'I respond to crises' },
    { value: 'provider',  emoji: '🏥', label: 'Organization',  desc: 'We provide aid services' },
  ];

  return (
    <div className="auth-layout">

      {/* ── Left Branding Panel ──────────────────────────────────────── */}
      <div className="auth-left">
        <div className="auth-left-logo">
          Aid<span>Connect</span>
        </div>
        <div>
          <div className="auth-left-tagline">
            Join the<br />
            <span>relief network.</span>
          </div>
          <div className="auth-left-sub">
            Every person who joins makes Pakistan's emergency
            network faster and stronger.
          </div>
        </div>
        <div className="auth-left-crescent">☽</div>
      </div>

      {/* ── Right Form Panel ─────────────────────────────────────────── */}
      <div
        className="auth-right"
        style={{ alignItems: 'flex-start', overflowY: 'auto', padding: '40px' }}
      >
        <div className="auth-box" style={{ maxWidth: 460, paddingTop: '16px' }}>
          <h2>Create your account</h2>
          <p>Join AidConnect — Pakistan's relief network</p>

          {/* API Error */}
          {apiError && (
            <div className="alert alert-error" style={{ marginBottom: '18px' }}>
              <span className="alert-icon">⚠️</span>
              {apiError}
            </div>
          )}

          {/* Role Selector */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '8px',
              marginBottom: '22px',
            }}
          >
            {roles.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setForm((p) => ({ ...p, role: r.value }))}
                disabled={loading}
                style={{
                  padding: '12px 8px',
                  border: `2px solid ${
                    form.role === r.value
                      ? 'var(--green-600)'
                      : 'var(--stone-300)'
                  }`,
                  borderRadius: 'var(--radius-sm)',
                  background:
                    form.role === r.value ? 'var(--green-50)' : 'white',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all var(--t-fast)',
                }}
              >
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>
                  {r.emoji}
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '11px',
                    color:
                      form.role === r.value
                        ? 'var(--green-800)'
                        : 'var(--text-dark)',
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

          <form onSubmit={handleSubmit} noValidate>

            {/* Name + Phone */}
            <div className="form-row cols-2">
              <Field
                id="name" name="name" label="Full Name"
                placeholder="Muhammad Ali" required
                form={form} errors={errors}
                onChange={handleChange} disabled={loading}
              />
              <Field
                id="phone" name="phone" label="Phone (optional)"
                placeholder="03001234567"
                form={form} errors={errors}
                onChange={handleChange} disabled={loading}
              />
            </div>

            {/* Email */}
            <Field
              id="reg-email" name="email" label="Email Address"
              type="email" placeholder="you@example.com" required
              form={form} errors={errors}
              onChange={handleChange} disabled={loading}
            />

            {/* Password with strength */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">
                Password
              </label>
              <input
                id="reg-password"
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

            {/* Confirm Password */}
            <Field
              id="confirmPassword" name="confirmPassword"
              label="Confirm Password" type="password"
              placeholder="Repeat password" required
              form={form} errors={errors}
              onChange={handleChange} disabled={loading}
            />

            {/* Blood Group — hidden for providers */}
            {form.role !== 'provider' && (
              <div className="form-group">
                <label className="form-label" htmlFor="bloodGroup">
                  Blood Group (optional)
                </label>
                <select
                  id="bloodGroup"
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

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              style={{ marginTop: '10px' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Creating account…
                </>
              ) : (
                'Create Account →'
              )}
            </button>
          </form>

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
        </div>
      </div>
    </div>
  );
}