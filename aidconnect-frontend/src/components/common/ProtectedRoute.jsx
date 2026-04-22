// src/components/common/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';

/**
 * ProtectedRoute — role-based route guard.
 *
 * Behaviour:
 *   1. While auth is loading      → render nothing (AuthProvider shows spinner)
 *   2. Not authenticated          → redirect to /login, preserving intended path
 *   3. Wrong role                 → redirect to own dashboard
 *   4. Correct role               → render children
 *
 * Usage:
 *   <ProtectedRoute roles={['admin']}>
 *     <AdminDashboard />
 *   </ProtectedRoute>
 *
 *   <ProtectedRoute roles={['user', 'volunteer']}>
 *     <RequestDetail />
 *   </ProtectedRoute>
 */
export default function ProtectedRoute({ children, roles = [] }) {
  const { isAuthenticated, user, loading, getDashboardPath } = useAuth();
  const location = useLocation();

  // FIX: explicit loading guard — prevents premature redirect on hard refresh
  // while AuthContext is still running the /me check.
  // AuthProvider already renders a full-screen spinner during this phase,
  // so returning null here is safe and never causes a flash.
  if (loading) return null;

  // Not logged in → preserve intended destination for post-login redirect
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // Logged in but wrong role → redirect to their own dashboard
  // FIX: uses getDashboardPath from AuthContext instead of a duplicated
  // inline object — single source of truth for dashboard paths
  if (roles.length > 0 && !roles.includes(user?.role)) {
    return (
      <Navigate
        to={getDashboardPath(user?.role)}
        replace
      />
    );
  }

  return children;
}