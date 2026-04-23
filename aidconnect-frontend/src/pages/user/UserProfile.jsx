import React, { useState } from 'react';
import Navbar from '../../components/common/Navbar.jsx';
import ProfileForm from '../../components/forms/ProfileForm.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { getInitials, formatRole } from '../../utils/formatters.js';

export default function UserProfile() {
  // ─── Auth Context ──────────────────────────────────────────────────────────
  const { user, updateUser, loading: authLoading } = useAuth();
  
  // ─── Local State ───────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleUpdateProfile = async (formData) => {
    setLoading(true);
    setApiError('');
    setSuccessMessage('');

    try {
      // In a real app, this would call your updateProfile API first
      // For now, we update the local context state
      await updateUser(formData);
      setSuccessMessage('Your profile has been updated successfully.');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Navbar title="My Profile">
      <div className="page-wrapper" style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
        
        {/* ─── Profile Header ─── */}
        <div 
          className="card" 
          style={{ 
            marginBottom: '24px', 
            padding: '32px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '24px',
            background: 'linear-gradient(to right, var(--green-900), var(--green-800))',
            border: 'none'
          }}
        >
          {user?.profilePicture ? (
            <img 
              src={user.profilePicture} 
              alt={user.name} 
              className="avatar avatar-lg"
              style={{ width: '100px', height: '100px', border: '4px solid rgba(255,255,255,0.2)' }}
            />
          ) : (
            <div 
              className="avatar avatar-lg" 
              style={{ 
                width: '100px', 
                height: '100px', 
                fontSize: '32px', 
                border: '4px solid rgba(255,255,255,0.2)',
                background: 'var(--green-700)',
                color: 'white'
              }}
            >
              {getInitials(user?.name)}
            </div>
          )}

          <div style={{ color: 'white' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 800, margin: 0 }}>{user?.name}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span className="badge badge-green" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                {formatRole(user?.role)}
              </span>
              <span style={{ fontSize: '14px', opacity: 0.8 }}>•</span>
              <span style={{ fontSize: '14px', opacity: 0.8 }}>{user?.email}</span>
            </div>
          </div>
        </div>

        {/* ─── Profile Edit Form ─── */}
        <div className="card">
          <div className="card-header">
            <h3 className="section-title">Personal Information</h3>
            <p className="section-subtitle">Update your contact details and preferences</p>
          </div>
          <div className="card-body">
            <ProfileForm 
              user={user}
              onSubmit={handleUpdateProfile}
              loading={loading || authLoading}
              apiError={apiError}
              successMessage={successMessage}
            />
          </div>
        </div>

        {/* ─── Security Info ─── */}
        <div 
          className="card" 
          style={{ 
            marginTop: '24px', 
            padding: '20px', 
            background: 'var(--green-50)', 
            border: '1px solid var(--green-200)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--green-900)', margin: 0 }}>Password & Security</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Want to change your login credentials?
            </p>
          </div>
          <button className="btn btn-secondary">
            Change Password
          </button>
        </div>

      </div>
    </Navbar>
  );
}