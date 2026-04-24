// src/pages/provider/ProviderDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/common/Navbar.jsx';
import Loader from '../../components/common/Loader.jsx';
import Badge from '../../components/common/Badge.jsx';
import Modal from '../../components/common/Modal.jsx';
import { getProviderProfile, getRelevantRequests, acceptRequest } from '../../api/provider.api.js';
import { formatTimeAgo, formatEmergencyType, getEmergencyEmoji, getInitials } from '../../utils/formatters.js';
import { SERVICE_TYPES } from '../../utils/constants.js';

export default function ProviderDashboard() {
  const [profile,         setProfile]         = useState(null);
  const [requests,        setRequests]         = useState([]);
  const [loadingProfile,  setLoadingProfile]   = useState(true);
  const [loadingRequests, setLoadingRequests]  = useState(true);
  const [acceptingId,     setAcceptingId]      = useState(null);
  const [confirmModal,    setConfirmModal]      = useState({ open: false, request: null });

  // FIX: replaced toast with local error/success state
  const [error,      setError]      = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };
  const showError = (msg) => setError(msg);

  // ── Fetch profile ──────────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    try {
      const data = await getProviderProfile();
      setProfile(data.provider || data.data || data);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load profile.');
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  // ── Fetch relevant requests ────────────────────────────────────────────────
  const fetchRequests = useCallback(async () => {
    try {
      const data = await getRelevantRequests();
      setRequests(data.requests || data.data || []);
    } catch (err) {
      // 403 = not verified yet — show empty state, not an error
      if (err.response?.status !== 403) {
        showError('Failed to load requests.');
      }
      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchRequests();
  }, [fetchProfile, fetchRequests]);

  // ── Accept request ─────────────────────────────────────────────────────────
  const handleAccept = useCallback(async () => {
    const request = confirmModal.request;
    if (!request) return;
    setAcceptingId(request._id);
    setConfirmModal({ open: false, request: null });
    try {
      await acceptRequest(request._id);
      showSuccess('Request accepted! You are now assigned.');
      setRequests((prev) => prev.filter((r) => r._id !== request._id));
      fetchProfile();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to accept request.');
    } finally {
      setAcceptingId(null);
    }
  }, [confirmModal, fetchProfile]);

  const serviceTypeMeta = SERVICE_TYPES.find((s) => s.value === profile?.serviceType);

  return (
    <Navbar title="Dashboard">
      <div className="page-wrapper">

        {/* ── Page header ───────────────────────────────────────────────── */}
        <div className="page-header">
          <h1>Provider Dashboard</h1>
          <p>Manage incoming emergency requests and your availability.</p>
        </div>

        {/* ── Alerts ────────────────────────────────────────────────────── */}
        {error && (
          <div className="alert alert-error anim-fade-up" style={{ marginBottom: '20px' }}>
            <span className="alert-icon">⚠️</span>
            {error}
            <button
              onClick={() => setError('')}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontWeight: 700 }}
            >✕</button>
          </div>
        )}
        {successMsg && (
          <div className="alert alert-success anim-fade-up" style={{ marginBottom: '20px' }}>
            <span className="alert-icon">✅</span>
            {successMsg}
          </div>
        )}

        {/* ── Profile hero ──────────────────────────────────────────────── */}
        {loadingProfile ? (
          <Loader variant="card" message="Loading your profile…" />
        ) : profile ? (
          <>
            {/* FIX: uses .profile-hero CSS class instead of inline gradient card */}
            <div className="profile-hero" style={{ marginBottom: '24px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  flexShrink: 0,
                }}
              >
                {serviceTypeMeta?.emoji || '🏥'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="profile-hero-name">{profile.organizationName}</div>
                <div className="profile-hero-role">
                  {serviceTypeMeta?.label || profile.serviceType}
                  {profile.address ? ` · ${profile.address}` : ''}
                </div>
                {/* Badges */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                  {profile.isVerified
                    ? <span className="badge badge-green" style={{ fontSize: '11px' }}>✅ Verified</span>
                    : <span className="badge badge-orange" style={{ fontSize: '11px' }}>⏳ Pending Verification</span>
                  }
                  <span
                    className={`badge ${profile.isAvailable ? 'badge-green' : 'badge-stone'}`}
                    style={{ fontSize: '11px' }}
                  >
                    <span className={`status-dot ${profile.isAvailable ? 'dot-green pulse' : 'dot-stone'}`} />
                    {profile.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                {/* Services offered */}
                {profile.servicesOffered?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                    {profile.servicesOffered.map((service) => (
                      <span
                        key={service}
                        style={{
                          padding: '3px 10px',
                          background: 'rgba(255,255,255,0.15)',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: 'white',
                          textTransform: 'capitalize',
                        }}
                      >
                        {service.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* FIX: pending verification uses alert-warning instead of var(--orange-*) */}
            {!profile.isVerified && (
              <div className="alert alert-warning anim-fade-up" style={{ marginBottom: '24px' }}>
                <span className="alert-icon">⏳</span>
                <div>
                  <strong>Awaiting Admin Verification</strong> — Your account is under review.
                  Once verified, you will be able to view and accept emergency requests.
                </div>
              </div>
            )}
          </>
        ) : null}

        {/* ── Incoming requests ─────────────────────────────────────────── */}
        <div className="section-header" style={{ marginBottom: '16px' }}>
          <div>
            <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              Incoming Requests
              {requests.length > 0 && (
                <span className="badge badge-red" style={{ fontSize: '11px' }}>
                  {requests.length} new
                </span>
              )}
            </div>
            <div className="section-subtitle">
              Emergency requests matching your service type
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={fetchRequests}
          >
            🔄 Refresh
          </button>
        </div>

        {loadingRequests ? (
          <Loader variant="skeleton" count={3} />
        ) : requests.length === 0 ? (
          // FIX: uses .empty-state CSS classes
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <h3>No incoming requests</h3>
              <p>
                {profile?.isVerified
                  ? 'No open requests match your service type right now. Check back soon.'
                  : 'You will see requests here once your account is verified.'
                }
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {requests.map((req) => (
              <div key={req._id} className="card anim-fade-up">
                {/* FIX: uses card-body instead of inline padding */}
                <div className="card-body">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>

                    {/* Left — type + description */}
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: 'var(--radius-md)',
                          // FIX: var(--stone-100) doesn't exist — use var(--green-100)
                          background: 'var(--green-100)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                          flexShrink: 0,
                        }}
                      >
                        {getEmergencyEmoji(req.emergencyType)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-dark)' }}>
                            {formatEmergencyType(req.emergencyType)}
                          </span>
                          <Badge urgency={req.urgencyLevel} />
                          <Badge status={req.status} />
                        </div>
                        <p
                          style={{
                            margin: '0 0 8px',
                            fontSize: '13px',
                            color: 'var(--text-mid)',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {req.description}
                        </p>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                          {req.address && (
                            <span className="request-card-meta">
                              <span>📍</span> {req.address}
                            </span>
                          )}
                          <span className="request-card-meta">
                            <span>🕐</span> {formatTimeAgo(req.postedAt)}
                          </span>
                          {req.requesterId?.name && (
                            <span className="request-card-meta">
                              <span>👤</span> {req.requesterId.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right — accept button */}
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={!!acceptingId}
                      onClick={() => setConfirmModal({ open: true, request: req })}
                      style={{ flexShrink: 0 }}
                    >
                      {acceptingId === req._id
                        ? <><span className="spinner" /> Accepting…</>
                        : '✅ Accept'
                      }
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ── Confirm accept modal ───────────────────────────────────────── */}
      <Modal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, request: null })}
        title="Accept Request"
        icon="✅"
        onConfirm={handleAccept}
        confirmLabel="Yes, Accept"
        cancelLabel="Cancel"
        loading={!!acceptingId}
      >
        {confirmModal.request && (
          <p style={{ fontSize: '14px', color: 'var(--text-mid)', lineHeight: 1.7, margin: 0 }}>
            You are about to accept a{' '}
            <strong>{formatEmergencyType(confirmModal.request.emergencyType)}</strong> request.
            Your availability will be set to <strong>unavailable</strong> until you complete it.
            Are you sure?
          </p>
        )}
      </Modal>

    </Navbar>
  );
}