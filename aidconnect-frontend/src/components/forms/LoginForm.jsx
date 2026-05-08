import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { validateLogin, hasErrors } from '../../utils/validators.js';
import { AlertTriangle, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginForm({ onSubmit, loading = false, apiError = '' }) {
  const [form, setForm]         = useState({ email: '', password: '' });
  const [errors, setErrors]     = useState({});
  const [showPass, setShowPass] = useState(false);
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }, [errors]);
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
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
{apiError && (
        <div className="alert alert-error" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={18} color="var(--danger)" />
          <span>{apiError}</span>
        </div>
      )}
<div className="form-group">
        <label className="form-label" htmlFor="login-email">
          Email address
        </label>
        <div className="input-icon-wrap">
          <span className="input-icon"><Mail size={18} /></span>
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
        </div>
        {errors.email && (
          <div className="form-error">{errors.email}</div>
        )}
      </div>
<div className="form-group">
        <label className="form-label" htmlFor="login-password">
          Password
        </label>
        <div className="input-icon-wrap" style={{ position: 'relative' }}>
          <span className="input-icon"><Lock size={18} /></span>
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
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
              borderRadius: '4px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && (
          <div className="form-error">{errors.password}</div>
        )}
      </div>
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