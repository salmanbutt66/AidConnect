// src/pages/provider/ProviderDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import Navbar from '../../components/common/Navbar.jsx';
import Loader from '../../components/common/Loader.jsx';
import Badge from '../../components/common/Badge.jsx';
import Modal from '../../components/common/Modal.jsx';
import { getProviderProfile, getRelevantRequests, acceptRequest } from '../../api/provider.api.js';
import { formatTimeAgo, formatEmergencyType, getEmergencyEmoji } from '../../utils/formatters.js';
import { SERVICE_TYPES } from '../../utils/constants.js';

export default function ProviderDashboard() {
  const [profile,         setProfile]         = useState(null);
  const [requests,        setRequests]         = useState([]);
  const [loadingProfile,  setLoadingProfile]   = useState(true);
  const [loadingRequests, setLoadingRequests]  = useState(true);
  const [acceptingId,     setAcceptingId]      = useState(null);
  const [confirmModal,    setConfirmModal]      = useState({ open: false, request: null });

  // ── Fetch profile ──────────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    try {
      const data = await getProviderProfile();
      setProfile(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  // ── Fetch relevant requests ────────────────────────────────────────────────
  const fetchRequests = useCallback(async () => {
    try {
      const data = await getRelevantRequests();
      setRequests(data.data || []);
    } catch (err) {
      // If not verified yet, show empty state — not an error
      if (err.response?.status !== 403) {
        toast.error('Failed to load requests');
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
      toast.success('Request accepted! You are now assigned.');
      // Remove from list + refresh profile
      setRequests((prev) => prev.filter((r) => r._id !== request._id));
      fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept request');
    } finally {
      setAcceptingId(null);
    }
  }, [confirmModal, fetchProfile]);

  // ── Service type label ─────────────────────────────────────────────────────
  const serviceTypeLabel = SERVICE_TYPES.find(
    (s) => s.value === profile?.serviceType
  );

  return (
    <Navbar title="Dashboard">
      <div className="page-wrapper">

        {/* ── Welcome banner ───────────────────────────────────────────── */}
        {loadingProfile ? (
          <Loader variant="card" message="Loading your profile..." />
        ) : profile ? (
          <div
            className="card"
            style={{
              background: 'linear-gradient(135deg, var(--green-700), var(--green-600))',
              color: 'white',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255,255,255,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '26px',
                    flexShrink: 0,
                  }}
                >
                  {serviceTypeLabel?.emoji || '🏥'}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>
                    {profile.organizationName}
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.8 }}>
                    {serviceTypeLabel?.label || profile.serviceType}
                    {profile.address ? ` · ${profile.address}` : ''}
                  </p>
                </div>
              </div>

              {/* Verified / pending badge */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {profile.isVerified ? (
                  <span
                    style={{
                      padding: '6px 14px',
                      background: 'rgba(255,255,255,0.2)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    ✅ Verified
                  </span>
                ) : (
                  <span
                    style={{
                      padding: '6px 14px',
                      background: 'rgba(255,165,0,0.3)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    ⏳ Pending Verification
                  </span>
                )}
                <span
                  style={{
                    padding: '6px 14px',
                    background: profile.isAvailable
                      ? 'rgba(255,255,255,0.2)'
                      : 'rgba(255,0,0,0.2)',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {profile.isAvailable ? '🟢 Available' : '🔴 Unavailable'}
                </span>
              </div>
            </div>

            {/* Services offered */}
            {profile.servicesOffered?.length > 0 && (
              <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {profile.servicesOffered.map((service) => (
                  <span
                    key={service}
                    style={{
                      padding: '4px 10px',
                      background: 'rgba(255,255,255,0.15)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '12px',
                    }}
                  >
                    {service}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {/* ── Pending verification notice ──────────────────────────────── */}
        {profile && !profile.isVerified && (
          <div
            className="card"
            style={{
              background: 'var(--orange-50, #fff7ed)',
              border: '1px solid var(--orange-200, #fed7aa)',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
            }}
          >
            <span style={{ fontSize: '24px', flexShrink: 0 }}>⏳</span>
            <div>
              <h4 style={{ margin: '0 0 4px', color: 'var(--orange-700, #c2410c)' }}>
                Awaiting Admin Verification
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-mid)' }}>
                Your account is under review. Once verified, you will be able
                to view and accept emergency requests.
              </p>
            </div>
          </div>
        )}

        {/* ── Relevant requests ────────────────────────────────────────── */}
        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
            Incoming Requests
            {requests.length > 0 && (
              <span
                className="badge badge-red"
                style={{ marginLeft: '10px', fontSize: '11px' }}
              >
                {requests.length} new
              </span>
            )}
          </h3>
          <button
            className="btn btn-ghost btn-sm"
            onClick={fetchRequests}
            style={{ fontSize: '12px' }}
          >
            🔄 Refresh
          </button>
        </div>

        {loadingRequests ? (
          <Loader variant="skeleton" count={3} />
        ) : requests.length === 0 ? (
          <div
            className="card"
            style={{ textAlign: 'center', padding: '48px 24px' }}
          >
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
            <h4 style={{ margin: '0 0 8px' }}>No incoming requests</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              {profile?.isVerified
                ? 'No open requests match your service type right now. Check back soon.'
                : 'You will see requests here once your account is verified.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {requests.map((req) => (
              <div
                key={req._id}
                className="card"
                style={{ padding: '20px 22px' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>

                  {/* Left: type + description */}
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--stone-100)',
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
                        <span style={{ fontWeight: 700, fontSize: '15px' }}>
                          {formatEmergencyType(req.emergencyType)}
                        </span>
                        <Badge urgency={req.urgencyLevel} />
                        <Badge status={req.status} />
                      </div>
                      <p
                        style={{
                          margin: '0 0 6px',
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
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            📍 {req.address}
                          </span>
                        )}
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          🕐 {formatTimeAgo(req.postedAt)}
                        </span>
                        {req.requesterId?.name && (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            👤 {req.requesterId.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: accept button */}
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={acceptingId === req._id}
                    onClick={() => setConfirmModal({ open: true, request: req })}
                    style={{ flexShrink: 0 }}
                  >
                    {acceptingId === req._id ? (
                      <><span className="spinner" /> Accepting…</>
                    ) : (
                      '✅ Accept'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Confirm accept modal ─────────────────────────────────────── */}
      <Modal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, request: null })}
        title="Accept Request"
        icon="✅"
        onConfirm={handleAccept}
        confirmLabel="Yes, Accept"
        cancelLabel="Cancel"
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