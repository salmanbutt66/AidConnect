// src/hooks/useAuth.js
import { useContext } from 'react';
import AuthContext from '../context/AuthContext.jsx';

/**
 * useAuth — primary hook for all authentication needs.
 *
 * Exposes everything from AuthContext in one clean import:
 *
 * STATE
 *   user              → full user object or null
 *   loading           → true while initial /me check is running
 *   error             → string error message or null
 *
 * BOOLEANS
 *   isAuthenticated   → !!user
 *   isAdmin           → user.role === 'admin'
 *   isVolunteer       → user.role === 'volunteer'
 *   isProvider        → user.role === 'provider'
 *   isUser            → user.role === 'user'
 *
 * ACTIONS
 *   login(credentials)        → calls POST /api/auth/login, sets user
 *   register(formData)        → calls POST /api/auth/register, sets user
 *   logout()                  → calls POST /api/auth/logout, clears user
 *   updateUser(partialUser)   → merges partial update into user state locally
 *   clearError()              → resets error to null
 *   setError(msg)             → manually set an error string
 *
 * HELPERS
 *   getDashboardPath(role)    → returns the correct dashboard route string
 *                               e.g. 'admin' → '/admin/dashboard'
 *
 * USAGE
 *   const { user, login, isAdmin, getDashboardPath } = useAuth();
 *
 * THROWS
 *   If used outside <AuthProvider>, throws immediately with a clear message.
 */

const useAuth = () => {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      '[useAuth] must be used inside <AuthProvider>. ' +
      'Wrap your component tree with <AuthProvider> in App.jsx.'
    );
  }

  return ctx;
};


export default useAuth;
export { useAuth }; 