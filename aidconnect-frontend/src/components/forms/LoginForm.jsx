// src/components/forms/LoginForm.jsx
import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { validateLogin, hasErrors } from '../../utils/validators.js';

// ─── LoginForm ────────────────────────────────────────────────────────────────
/**
 * LoginForm — controlled login form extracted from Login.jsx.
 *
 * Login.jsx remains the page (handles layout, auth context, navigation).
 * This component owns only the form UI and validation.
 *
 * Props:
 *   onSubmit   {fn}      — async ({ email, password }) => void   required
 *   loading    {boolean} — disables form during submission
 *   apiError   {string}  — error string from the parent page (auth failure etc.)
 *
 * Usage in Login.jsx:
 *   const [apiError, setApiError] = useState('');
 *
 *   const handleSubmit = async (credentials) => {
 *     try {
 *       const user = await login(credentials);
 *       navigate(getDashboardPath(user.role), { replace: true });
 *     } catch (err) {
 *       setApiError(err.response?.data?.message || 'Login failed.');
 *     }
 *   };
 *
 *   <LoginForm onSubmit={handleSubmit} loading={loading} apiError={apiError} />
 */
export default function LoginForm({ onSubmit, loading = false, apiError = '' }) {
  const [form, setForm]         = useState({ email: '', password: '' });
  const [errors, setErrors]     = useState({});
  const [showPass, setShowPass] = useState(false);

  // ── Field change — clears field error on edit ──────────────────────────────
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }, [errors]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    const clientErrors = validateLogin(form);
    if (hasErrors(clientErrors)) {
      setErrors(clientErrors);
      return;
    }

    try {
      await onSubmit({
        email:    form.email.trim().toLowerCase(),
        password: form.password,
      });
    } catch {
      // apiError is managed by the parent — nothing to do here
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>

      {/* API / auth error */}
      {apiError && (
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          <span className="alert-icon">⚠️</span>
          {apiError}
        </div>
      )}

      {/* ── Email ───────────────────────────────────────────────────────── */}
      <div className="form-group">
        <label className="form-label" htmlFor="login-email">
          Email address
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          className={`form-input ${errors.email ? 'error' : ''}`}
          placeholder="you@example.com"
          value={form.email}
          onChange={handleChange}
          autoComplete="email"
          disabled={loading}
          required
        />
        {errors.email && (
          <div className="form-error">{errors.email}</div>
        )}
      </div>

      {/* ── Password ────────────────────────────────────────────────────── */}
      <div className="form-group">
        <label className="form-label" htmlFor="login-password">
          Password
        </label>
        <div style={{ position: 'relative' }}>
          <input
            id="login-password"
            name="password"
            type={showPass ? 'text' : 'password'}
            className={`form-input ${errors.password ? 'error' : ''}`}
            placeholder="Your password"
            value={form.password}
            onChange={handleChange}
            autoComplete="current-password"
            disabled={loading}
            required
            style={{ paddingRight: '44px' }}
          />
          <button
            type="button"
            onClick={() => setShowPass((p) => !p)}
            disabled={loading}
            aria-label={showPass ? 'Hide password' : 'Show password'}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              color: 'var(--text-muted)',
              fontSize: '16px',
              padding: 0,
            }}
          >
            {showPass ? '🙈' : '👁️'}
          </button>
        </div>
        {errors.password && (
          <div className="form-error">{errors.password}</div>
        )}
      </div>

      {/* ── Submit ──────────────────────────────────────────────────────── */}
      <button
        type="submit"
        className="btn btn-primary btn-full btn-lg"
        disabled={loading}
      >
        {loading ? (
          <><span className="spinner" /> Signing in…</>
        ) : (
          'Sign In →'
        )}
      </button>

      {/* ── Divider + register link ──────────────────────────────────────── */}
      <div className="divider-text" style={{ margin: '24px 0' }}>or</div>

      <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
        Don't have an account?{' '}
        <Link to="/register" style={{ fontWeight: 600 }}>
          Create one free
        </Link>
      </p>

    </form>
  );
}