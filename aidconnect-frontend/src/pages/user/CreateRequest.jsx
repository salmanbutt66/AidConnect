import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar.jsx';
import HelpRequestForm from '../../components/forms/HelpRequestForm.jsx';
import useRequests from '../../hooks/useRequests.js';

export default function CreateRequest() {
  const navigate = useNavigate();
  const { submitRequest, loading, error: apiError } = useRequests();
  const [success, setSuccess] = useState(false);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleFormSubmit = async (formData) => {
    setSuccess(false);
    try {
      // Submits data to POST /api/requests
      await submitRequest(formData);
      setSuccess(true);
      
      // Redirect to "My Requests" after a short delay to show success state
      setTimeout(() => {
        navigate('/user/my-requests');
      }, 2000);
    } catch (err) {
      // Error is handled by the useRequests hook and exposed via apiError
      console.error('Request submission failed:', err);
    }
  };

  const handleCancel = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <Navbar title="Create Help Request">
      <div className="page-wrapper" style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
        
        {/* ─── Header Info ─── */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--green-900)' }}>
            Post an Emergency
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            Fill out the details below. Our system will notify the nearest volunteers 
            and emergency organizations immediately.
          </p>
        </div>

        {/* ─── Submission Alerts ─── */}
        {success && (
          <div className="alert alert-success" style={{ marginBottom: '24px', animation: 'fadeIn 0.3s' }}>
            <span className="alert-icon">✅</span>
            <div>
              <strong>Request Posted!</strong> Your emergency has been broadcasted to responders in your area.
            </div>
          </div>
        )}

        {apiError && (
          <div className="alert alert-error" style={{ marginBottom: '24px' }}>
            <span className="alert-icon">⚠️</span>
            <div>{apiError}</div>
          </div>
        )}

        {/* ─── The Form ─── */}
        <div className="card" style={{ animation: 'fadeSlideUp var(--t-page) var(--ease) both' }}>
          <div className="card-body" style={{ padding: '32px' }}>
            <HelpRequestForm 
              onSubmit={handleFormSubmit}
              onCancel={handleCancel}
              loading={loading}
            />
          </div>
        </div>

        {/* ─── Safety Disclaimer ─── */}
        <div 
          style={{ 
            marginTop: '32px', 
            padding: '20px', 
            borderRadius: 'var(--radius-md)', 
            background: 'var(--stone-100)',
            border: '1px solid var(--stone-200)',
            display: 'flex',
            gap: '16px'
          }}
        >
          <span style={{ fontSize: '24px' }}>🛡️</span>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--text-dark)' }}>
              Your Safety is Priority
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>
              By submitting this request, your approximate location will be shared with verified responders. 
              Always try to move to a safe area while waiting for help to arrive.
            </p>
          </div>
        </div>

      </div>
    </Navbar>
  );
}