import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';

export default function ProtectedRoute({ children, roles = [] }) {
  const { isAuthenticated, user, loading, getDashboardPath } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }
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