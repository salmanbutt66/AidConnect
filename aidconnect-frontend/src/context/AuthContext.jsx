// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe, login as loginApi, register as registerApi, logout as logoutApi } from '../api/auth.api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // ─── Load user on mount from stored token ──────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      getMe()
        .then((data) => setUser(data.user))
        .catch(() => {
          localStorage.removeItem('accessToken');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // ─── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (credentials) => {
    setError(null);
    try {
      const data = await loginApi(credentials);
      // loginApi already stores token in localStorage
      setUser(data.user);
      return data.user;
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      throw err;
    }
  }, []);

  // ─── Register ──────────────────────────────────────────────────────────────
  const register = useCallback(async (formData) => {
    setError(null);
    try {
      const data = await registerApi(formData);
      // registerApi stores token in localStorage
      setUser(data.user);
      return data.user;
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      throw err;
    }
  }, []);

  // ─── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Even if API call fails, clear local state
    }
    localStorage.removeItem('accessToken');
    setUser(null);
  }, []);

  // ─── Update user locally (after profile update) ────────────────────────────
  const updateUser = useCallback((updatedUser) => {
    setUser((prev) => ({ ...prev, ...updatedUser }));
  }, []);

  // ─── Clear error ───────────────────────────────────────────────────────────
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ─── Role-based redirect helper ────────────────────────────────────────────
  const getDashboardPath = useCallback((role) => {
    const paths = {
      admin:     '/admin/dashboard',
      volunteer: '/volunteer/dashboard',
      provider:  '/provider/dashboard',
      user:      '/user/dashboard',
    };
    return paths[role] || '/';
  }, []);

  const value = {
    user,
    loading,
    error,

    // Auth state
    isAuthenticated: !!user,
    isAdmin:         user?.role === 'admin',
    isVolunteer:     user?.role === 'volunteer',
    isProvider:      user?.role === 'provider',
    isUser:          user?.role === 'user',

    // Auth actions
    login,
    register,
    logout,
    updateUser,
    clearError,
    setError,

    // Helpers
    getDashboardPath,
  };

  // ─── Show nothing while checking auth status ───────────────────────────────
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: '#0f172a',
        }}
      >
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;