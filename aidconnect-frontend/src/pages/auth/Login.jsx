// src/pages/auth/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';

export default function Login() {
  const { login, getDashboardPath } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from?.pathname || null;

  const [form, setForm]         = useState({ email: '', password: '' });
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const validate = () => {
    if (!form.email.trim())    return 'Email is required';
    if (!form.password.trim()) return 'Password is required';
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(form.email)) return 'Please enter a valid email';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const user = await login(form);
      const dest = from || getDashboardPath(user.role);
      navigate(dest, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || 'Login failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">

      {/* ── Left Panel ─────────────────────────────────────────────────── */}
      <div className="auth-left">
        <div className="auth-left-logo">
          Aid<span>Connect</span>
        </div>
        <div>
          <div className="auth-left-tagline">
            Help is always<br />
            <span>one tap away.</span>
          </div>
          <div className="auth-left-sub">
            Join thousands of Pakistanis contributing to a faster,
            stronger emergency response network.
          </div>
        </div>
        <div className="auth-left-crescent">☽</div>
      </div>

      {/* ── Right Panel ────────────────────────────────────────────────── */}
      <div className="auth-right">
        <div className="auth-box">
          <h2>Welcome back</h2>
          <p>Sign in to your AidConnect account</p>

          {/* Error Alert */}
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '20px' }}>
              <span className="alert-icon">⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Your password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  disabled={loading}
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    fontSize: '16px',
                    padding: 0,
                  }}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Signing in…
                </>
              ) : (
                'Sign In →'
              )}
            </button>
          </form>

          <div className="divider-text" style={{ margin: '24px 0' }}>
            or
          </div>

          <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ fontWeight: 600 }}>
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}