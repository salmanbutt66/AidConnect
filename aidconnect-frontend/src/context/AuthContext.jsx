// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe, login as loginApi, register as registerApi, logout as logoutApi } from '../api/auth.api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,             setUser]             = useState(null);
  const [volunteerProfile, setVolunteerProfile] = useState(null); // FIX: was discarded
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);

  // ─── Helper: apply a getMe/login/register response to state ───────────────
  // FIX: centralised so login, register, and mount all set state the same way.
  // Merges volunteerProfile.serviceArea.city into user.location.city so every
  // part of the app (CreateRequest defaultCity, etc.) can read city from
  // user.location.city without knowing about the Volunteer schema.
  const applyAuthResponse = useCallback((data) => {
    const rawUser    = data.user;
    const volProfile = data.volunteerProfile || null;

    // If the user is a volunteer and has a city on their volunteer profile
    // but NOT on their user record, merge it in so city is always accessible
    // from user.location.city regardless of which record has it.
    if (
      rawUser?.role === 'volunteer' &&
      volProfile?.serviceArea?.city &&
      !rawUser?.location?.city
    ) {
      rawUser.location = {
        ...(rawUser.location || {}),
        city: volProfile.serviceArea.city,
      };
    }

    setUser(rawUser);
    setVolunteerProfile(volProfile);
  }, []);

  // ─── Load user on mount from stored token ─────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      getMe()
        .then((data) => applyAuthResponse(data))
        .catch(() => {
          localStorage.removeItem('accessToken');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [applyAuthResponse]);

  // ─── Login ────────────────────────────────────────────────────────────────
  const login = useCallback(async (credentials) => {
    setError(null);
    try {
      const data = await loginApi(credentials);
      // FIX: loginApi response doesn't include volunteerProfile —
      // do a getMe() after login to get the full profile including
      // serviceArea.city for volunteers.
      // We set the basic user immediately for fast UI, then enrich.
      setUser(data.user);
      setVolunteerProfile(null);

      if (data.user?.role === 'volunteer') {
        try {
          const meData = await getMe();
          applyAuthResponse(meData);
        } catch {
          // getMe failed — user is still logged in, just no volunteer profile
        }
      }

      return data.user;
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      throw err;
    }
  }, [applyAuthResponse]);

  // ─── Register ─────────────────────────────────────────────────────────────
  const register = useCallback(async (formData) => {
    setError(null);
    try {
      const data = await registerApi(formData);
      // FIX: same as login — registerApi returns basic user.
      // For volunteers, fetch full profile to get serviceArea.city.
      setUser(data.user);
      setVolunteerProfile(null);

      if (data.user?.role === 'volunteer') {
        try {
          const meData = await getMe();
          applyAuthResponse(meData);
        } catch {
          // non-fatal
        }
      }

      return data.user;
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      throw err;
    }
  }, [applyAuthResponse]);

  // ─── Logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Even if API call fails, clear local state
    }
    localStorage.removeItem('accessToken');
    setUser(null);
    setVolunteerProfile(null);
  }, []);

  // ─── Update user locally (after profile update) ───────────────────────────
  const updateUser = useCallback((updatedUser) => {
    setUser((prev) => ({ ...prev, ...updatedUser }));
  }, []);

  // ─── Update volunteer profile locally ─────────────────────────────────────
  const updateVolunteerProfile = useCallback((updatedProfile) => {
    setVolunteerProfile((prev) => ({ ...prev, ...updatedProfile }));
    // Keep user.location.city in sync if serviceArea.city changed
    if (updatedProfile?.serviceArea?.city) {
      setUser((prev) => ({
        ...prev,
        location: {
          ...(prev?.location || {}),
          city: updatedProfile.serviceArea.city,
        },
      }));
    }
  }, []);

  // ─── Clear error ──────────────────────────────────────────────────────────
  const clearError = useCallback(() => setError(null), []);

  // ─── Role-based redirect helper ───────────────────────────────────────────
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
    volunteerProfile,   // FIX: exposed so VolunteerProfile page can read it
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
    updateVolunteerProfile,
    clearError,
    setError,

    // Helpers
    getDashboardPath,
  };

  // ─── Show nothing while checking auth status ──────────────────────────────
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