import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import ProtectedRoute from '../components/common/ProtectedRoute.jsx';
const Landing    = lazy(() => import('../pages/public/Landing.jsx'));
const AboutUs    = lazy(() => import('../pages/public/AboutUs.jsx'));
const HowItWorks = lazy(() => import('../pages/public/HowItWorks.jsx'));
const NotFound   = lazy(() => import('../pages/public/NotFound.jsx'));
const Login    = lazy(() => import('../pages/auth/Login.jsx'));
const Register = lazy(() => import('../pages/auth/Register.jsx'));
const UserDashboard = lazy(() => import('../pages/user/UserDashboard.jsx'));
const CreateRequest = lazy(() => import('../pages/user/CreateRequest.jsx'));
const MyRequests    = lazy(() => import('../pages/user/MyRequests.jsx'));
const RequestDetail = lazy(() => import('../pages/user/RequestDetail.jsx'));
const UserProfile   = lazy(() => import('../pages/user/UserProfile.jsx'));
const VolunteerDashboard = lazy(() => import('../pages/volunteer/VolunteerDashboard.jsx'));
const VolunteerMatches   = lazy(() => import('../pages/volunteer/Matches.jsx'));
const ActiveRequest      = lazy(() => import('../pages/volunteer/ActiveRequest.jsx'));
const MyHistory          = lazy(() => import('../pages/volunteer/MyHistory.jsx'));
const VolunteerProfile   = lazy(() => import('../pages/volunteer/VolunteerProfile.jsx'));
const ProviderDashboard  = lazy(() => import('../pages/provider/ProviderDashboard.jsx'));
const ManageAvailability = lazy(() => import('../pages/provider/ManageAvailability.jsx'));
const ProviderProfile    = lazy(() => import('../pages/provider/ProviderProfile.jsx'));
const AdminDashboard   = lazy(() => import('../pages/admin/AdminDashboard.jsx'));
const AdminProfile     = lazy(() => import('../pages/admin/AdminProfile.jsx'));
const ManageUsers      = lazy(() => import('../pages/admin/ManageUsers.jsx'));
const ManageRequests   = lazy(() => import('../pages/admin/ManageRequests.jsx'));
const ManageVolunteers = lazy(() => import('../pages/admin/ManageVolunteers.jsx'));
const ManageProviders  = lazy(() => import('../pages/admin/ManageProviders.jsx'));
const Analytics        = lazy(() => import('../pages/admin/Analytics.jsx'));
function PageLoader() {
  return (
    <div className="loading-screen">
      <div className="loading-logo">
        Aid<span>Connect</span>
      </div>
      <div className="loading-bar">
        <div className="loading-bar-fill" />
      </div>
    </div>
  );
}
function GuestRoute({ children }) {
  const { isAuthenticated, user, loading, getDashboardPath } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return children;
  return <Navigate to={getDashboardPath(user?.role)} replace />;
}
export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
<Route path="/"             element={<Landing />} />
        <Route path="/about"        element={<AboutUs />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
<Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
<Route path="/user/dashboard" element={
          <ProtectedRoute roles={['user']}><UserDashboard /></ProtectedRoute>
        } />
        <Route path="/user/create-request" element={
          <ProtectedRoute roles={['user']}><CreateRequest /></ProtectedRoute>
        } />
        <Route path="/user/my-requests" element={
          <ProtectedRoute roles={['user']}><MyRequests /></ProtectedRoute>
        } />
        <Route path="/user/requests/:id" element={
          <ProtectedRoute roles={['user']}><RequestDetail /></ProtectedRoute>
        } />
        <Route path="/user/profile" element={
          <ProtectedRoute roles={['user']}><UserProfile /></ProtectedRoute>
        } />
<Route path="/volunteer/dashboard" element={
          <ProtectedRoute roles={['volunteer']}><VolunteerDashboard /></ProtectedRoute>
        } />
        <Route path="/volunteer/matches" element={
          <ProtectedRoute roles={['volunteer']}><VolunteerMatches /></ProtectedRoute>
        } />
        <Route path="/volunteer/active-request" element={
          <ProtectedRoute roles={['volunteer']}><ActiveRequest /></ProtectedRoute>
        } />
        <Route path="/volunteer/history" element={
          <ProtectedRoute roles={['volunteer']}><MyHistory /></ProtectedRoute>
        } />
        <Route path="/volunteer/profile" element={
          <ProtectedRoute roles={['volunteer']}><VolunteerProfile /></ProtectedRoute>
        } />
<Route path="/provider/dashboard" element={
          <ProtectedRoute roles={['provider']}><ProviderDashboard /></ProtectedRoute>
        } />
        <Route path="/provider/availability" element={
          <ProtectedRoute roles={['provider']}><ManageAvailability /></ProtectedRoute>
        } />
        <Route path="/provider/profile" element={
          <ProtectedRoute roles={['provider']}><ProviderProfile /></ProtectedRoute>
        } />
<Route path="/admin/dashboard" element={
          <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="/admin/profile" element={
          <ProtectedRoute roles={['admin']}><AdminProfile /></ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute roles={['admin']}><ManageUsers /></ProtectedRoute>
        } />
        <Route path="/admin/requests" element={
          <ProtectedRoute roles={['admin']}><ManageRequests /></ProtectedRoute>
        } />
        <Route path="/admin/volunteers" element={
          <ProtectedRoute roles={['admin']}><ManageVolunteers /></ProtectedRoute>
        } />
        <Route path="/admin/providers" element={
          <ProtectedRoute roles={['admin']}><ManageProviders /></ProtectedRoute>
        } />
        <Route path="/admin/analytics" element={
          <ProtectedRoute roles={['admin']}><Analytics /></ProtectedRoute>
        } />
<Route path="*" element={<NotFound />} />

      </Routes>
    </Suspense>
  );
}