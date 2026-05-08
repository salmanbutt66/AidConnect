import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe, login as loginApi, register as registerApi, logout as logoutApi } from '../api/auth.api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,             setUser]             = useState(null);
  const [volunteerProfile, setVolunteerProfile] = useState(null); // FIX: was discarded
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);
  const applyAuthResponse = useCallback((data) => {
    const rawUser    = data.user;
    const volProfile = data.volunteerProfile || null;
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
  const login = useCallback(async (credentials) => {
    setError(null);
    try {
      const data = await loginApi(credentials);
      setUser(data.user);
      setVolunteerProfile(null);

      if (data.user?.role === 'volunteer') {
        try {
          const meData = await getMe();
          applyAuthResponse(meData);
        } catch {
        }
      }

      return data.user;
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      throw err;
    }
  }, [applyAuthResponse]);
  const register = useCallback(async (formData) => {
    setError(null);
    try {
      const data = await registerApi(formData);
      setUser(data.user);
      setVolunteerProfile(null);

      if (data.user?.role === 'volunteer') {
        try {
          const meData = await getMe();
          applyAuthResponse(meData);
        } catch {
        }
      }

      return data.user;
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      throw err;
    }
  }, [applyAuthResponse]);
  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
    }
    localStorage.removeItem('accessToken');
    setUser(null);
    setVolunteerProfile(null);
  }, []);
  const updateUser = useCallback((updatedUser) => {
    setUser((prev) => ({ ...prev, ...updatedUser }));
  }, []);
  const updateVolunteerProfile = useCallback((updatedProfile) => {
    setVolunteerProfile((prev) => ({ ...prev, ...updatedProfile }));
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
  const clearError = useCallback(() => setError(null), []);
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
    isAuthenticated: !!user,
    isAdmin:         user?.role === 'admin',
    isVolunteer:     user?.role === 'volunteer',
    isProvider:      user?.role === 'provider',
    isUser:          user?.role === 'user',
    login,
    register,
    logout,
    updateUser,
    updateVolunteerProfile,
    clearError,
    setError,
    getDashboardPath,
  };
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