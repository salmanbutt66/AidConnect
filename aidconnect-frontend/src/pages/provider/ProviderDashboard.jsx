// src/pages/provider/ProviderDashboard.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar.jsx';
import Loader from '../../components/common/Loader.jsx';
import Badge from '../../components/common/Badge.jsx';
import {
  getProviderProfile,
  getRelevantRequests,
  getActiveRequest as getActiveProviderRequest,
  acceptRequest,
} from '../../api/provider.api.js';
import { updateRequestStatus } from '../../api/request.api.js';
import { formatTimeAgo, formatEmergencyType, getEmergencyEmoji } from '../../utils/formatters.js';
import { SERVICE_TYPES } from '../../utils/constants.js';

const REQUEST_STATUS_REFRESH_EVENT = 'aidconnect:request-status-changed';

export default function ProviderDashboard() {
  const navigate = useNavigate();

  const [profile,         setProfile]         = useState(null);
  const [activeRequest,   setActiveRequest]   = useState(null);
  const [requests,        setRequests]        = useState([]);
  const [requestsCity,    setRequestsCity]    = useState('');

  // FIX: separate "initial load" booleans from "background refresh" booleans.
  // Initial load = show skeleton. Background refresh = never show skeleton,
  // just silently update state. This eliminates the blur/skeleton flash that
  // appeared every time an action triggered a data refresh.
  const [initProfile,   setInitProfile]   = useState(true);
  const [initActive,    setInitActive]    = useState(true);
  const [initRequests,  setInitRequests]  = useState(true);

  const [acceptingId,         setAcceptingId]         = useState(null);
  const [statusLoading,       setStatusLoading]       = useState('');
  const [confirmAcceptId,     setConfirmAcceptId]     = useState(null);
  const [confirmCompleteOpen, setConfirmCompleteOpen] = useState(false);

  const [error,      setError]      = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Track mounted state to avoid setState after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const safeSet = (setter) => (val) => {
    if (mountedRef.current) setter(val);
  };

  const showSuccess = useCallback((msg) => {
    safeSet(setSuccessMsg)(msg);
    setTimeout(() => safeSet(setSuccessMsg)(''), 4000);
  }, []);

  const showError = useCallback((msg) => {
    safeSet(setError)(msg);
  }, []);

  const withTimeout = useCallback((promise, ms = 15000, timeoutMessage = 'Request timed out. Please try again.') => {
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(timeoutMessage)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
  }, []);

  // ── Fetch profile ─────────────────────────────────────────────────────────
  // silent=true means don't show skeleton (used for post-action refreshes)
  const fetchProfile = useCallback(async ({ silent = false } = {}) => {
    if (!silent) safeSet(setInitProfile)(true);
    try {
      const data = await getProviderProfile();
      safeSet(setProfile)(data.data ?? data.provider ?? data);
    } catch (err) {
      if (err.response?.status === 404) {
        navigate('/provider/profile', { replace: true });
      } else if (!silent) {
        showError(err.response?.data?.message || 'Failed to load profile.');
      }
    } finally {
      safeSet(setInitProfile)(false);
    }
  }, [navigate, showError]);

  // ── Fetch relevant requests ───────────────────────────────────────────────
  const fetchRequests = useCallback(async ({ silent = false } = {}) => {
    if (!silent) safeSet(setInitRequests)(true);
    try {
      const data = await getRelevantRequests();
      safeSet(setRequests)(data.data ?? data.requests ?? []);
      safeSet(setRequestsCity)(data.city ?? '');
    } catch (err) {
      if (err.response?.status !== 403 && !silent) {
        showError('Failed to load requests.');
      }
      safeSet(setRequests)([]);
      safeSet(setRequestsCity)('');
    } finally {
      safeSet(setInitRequests)(false);
    }
  }, [showError]);

  // ── Fetch active request ──────────────────────────────────────────────────
  const fetchActiveRequest = useCallback(async ({ silent = false } = {}) => {
    if (!silent) safeSet(setInitActive)(true);
    try {
      const data = await getActiveProviderRequest();
      safeSet(setActiveRequest)(data.activeRequest ?? data.data ?? null);
    } catch (err) {
      if (err.response?.status !== 404 && !silent) {
        showError(err.response?.data?.message || 'Failed to load active request.');
      }
      safeSet(setActiveRequest)(null);
    } finally {
      safeSet(setInitActive)(false);
    }
  }, [showError]);

  // Initial load — show skeletons
  useEffect(() => {
    fetchProfile();
    fetchActiveRequest();
    fetchRequests();
  }, [fetchProfile, fetchActiveRequest, fetchRequests]);

  // ── Accept flow ───────────────────────────────────────────────────────────
  const openAcceptConfirm  = useCallback((requestId) => setConfirmAcceptId(requestId), []);
  const closeAcceptConfirm = useCallback(() => {
    if (acceptingId) return;
    setConfirmAcceptId(null);
  }, [acceptingId]);

  const handleAccept = useCallback(async (request) => {
    setConfirmAcceptId(null);
    if (!request?._id) {
      showError('Request context was lost. Please try again.');
      return;
    }
    setAcceptingId(request._id);
    try {
      await withTimeout(acceptRequest(request._id));
      showSuccess('Request accepted! You are now assigned.');
      // Remove from list optimistically — no skeleton needed
      safeSet(setRequests)((prev) => prev.filter((r) => r._id !== request._id));
      window.dispatchEvent(new Event(REQUEST_STATUS_REFRESH_EVENT));
      // Silent refresh — no skeleton flash
      fetchActiveRequest({ silent: true });
      fetchProfile({ silent: true });
    } catch (err) {
      showError(err.response?.data?.message || err.message || 'Failed to accept request.');
    } finally {
      safeSet(setAcceptingId)(null);
    }
  }, [fetchActiveRequest, fetchProfile, withTimeout, showError, showSuccess]);

  // ── Mark In Progress ──────────────────────────────────────────────────────
  const handleMarkInProgress = useCallback(async () => {
    if (!activeRequest) return;
    setStatusLoading('in_progress');
    try {
      await withTimeout(updateRequestStatus(activeRequest._id, 'in_progress'));
      // Optimistic update — no skeleton
      safeSet(setActiveRequest)((prev) => prev ? { ...prev, status: 'in_progress' } : prev);
      showSuccess('Marked as in progress.');
      window.dispatchEvent(new Event(REQUEST_STATUS_REFRESH_EVENT));
      // Silent background sync
      fetchActiveRequest({ silent: true });
    } catch (err) {
      showError(err.response?.data?.message || err.message || 'Failed to update status.');
    } finally {
      safeSet(setStatusLoading)('');
    }
  }, [activeRequest, fetchActiveRequest, withTimeout, showError, showSuccess]);

  // ── Mark Completed ────────────────────────────────────────────────────────
  const handleMarkCompleted = useCallback(async () => {
    setConfirmCompleteOpen(false);
    if (!activeRequest) {
      showError('Active request context was lost. Please refresh and try again.');
      return;
    }
    setStatusLoading('completed');
    try {
      await withTimeout(updateRequestStatus(activeRequest._id, 'completed'));
      // Optimistic clear — no skeleton
      safeSet(setActiveRequest)(null);
      showSuccess('Request marked as completed. Great work!');
      window.dispatchEvent(new Event(REQUEST_STATUS_REFRESH_EVENT));
      // Silent background sync — all three, in parallel, no skeleton
      Promise.allSettled([
        fetchProfile({ silent: true }),
        fetchRequests({ silent: true }),
        fetchActiveRequest({ silent: true }),
      ]);
    } catch (err) {
      showError(err.response?.data?.message || err.message || 'Failed to complete request.');
    } finally {
      safeSet(setStatusLoading)('');
    }
  }, [activeRequest, fetchProfile, fetchRequests, fetchActiveRequest, withTimeout, showError, showSuccess]);

  const closeCompleteModal = useCallback(() => {
    if (statusLoading === 'completed') return;
    setConfirmCompleteOpen(false);
  }, [statusLoading]);

  const serviceTypeMeta = SERVICE_TYPES.find((s) => s.value === profile?.serviceType);

  return (
    <Navbar title="Dashboard">
      <div className="page-wrapper">

        <div className="page-header">
          <h1>Provider Dashboard</h1>
          <p>Manage incoming emergency requests and your availability.</p>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────────── */}
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

        {/* ── Profile hero ─────────────────────────────────────────────────── */}
        {initProfile ? (
          <Loader variant="card" message="Loading your profile…" />
        ) : profile ? (
          <>
            <div className="profile-hero" style={{ marginBottom: '24px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: 'var(--radius-md)',
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px', flexShrink: 0,
              }}>
                {serviceTypeMeta?.emoji || '🏥'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="profile-hero-name">{profile.organizationName}</div>
                <div className="profile-hero-role">
                  {serviceTypeMeta?.label || profile.serviceType}
                  {profile.city
                    ? ` · ${profile.city}`
                    : profile.address
                      ? ` · ${profile.address}`
                      : ''
                  }
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                  {profile.isVerified
                    ? <span className="badge badge-green" style={{ fontSize: '11px' }}>✅ Verified</span>
                    : <span className="badge badge-orange" style={{ fontSize: '11px' }}>⏳ Pending Verification</span>
                  }
                  <span className={`badge ${profile.isAvailable ? 'badge-green' : 'badge-stone'}`} style={{ fontSize: '11px' }}>
                    <span className={`status-dot ${profile.isAvailable ? 'dot-green pulse' : 'dot-stone'}`} />
                    {profile.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                  {/* Warn if city is not set */}
                  {!profile.city && !profile.address && (
                    <span
                      className="badge badge-orange"
                      style={{ fontSize: '11px', cursor: 'pointer' }}
                      onClick={() => navigate('/provider/profile')}
                      title="Set your city so requests in your area appear here"
                    >
                      ⚠️ City not set — update profile
                    </span>
                  )}
                  {/* Show credibility score if rated */}
                  {profile.totalRatings > 0 && (
                    <span className="badge badge-blue" style={{ fontSize: '11px' }}>
                      ⭐ {profile.averageRating?.toFixed(1)} ({profile.totalRatings} ratings)
                    </span>
                  )}
                </div>
              </div>
            </div>

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

        {/* ── Active Request ───────────────────────────────────────────────── */}
        <div className="section-header" style={{ marginBottom: '16px' }}>
          <div>
            <div className="section-title">Active Request</div>
            <div className="section-subtitle">The request currently assigned to your organisation</div>
          </div>
          {/* Manual refresh still available — uses silent mode */}
          <button className="btn btn-ghost btn-sm" onClick={() => fetchActiveRequest({ silent: true })}>🔄 Refresh</button>
        </div>

        {initActive ? (
          <Loader variant="card" message="Checking active request…" />
        ) : !activeRequest ? (
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="empty-state">
              <div className="empty-state-icon">✅</div>
              <h3>No active request</h3>
              <p>Accept a request below to start helping someone in need.</p>
            </div>
          </div>
        ) : (
          <div className="card anim-fade-up" style={{ marginBottom: '20px' }}>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: 'var(--radius-md)',
                    background: 'var(--green-100)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '20px', flexShrink: 0,
                  }}>
                    {getEmergencyEmoji(activeRequest.emergencyType)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-dark)' }}>
                        {formatEmergencyType(activeRequest.emergencyType)}
                      </span>
                      <Badge urgency={activeRequest.urgencyLevel} />
                      <Badge status={activeRequest.status} />
                    </div>
                    <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--text-mid)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {activeRequest.description}
                    </p>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      {activeRequest.city && (
                        <span className="request-card-meta"><span>📍</span> {activeRequest.city}</span>
                      )}
                      {activeRequest.address && (
                        <span className="request-card-meta"><span>🏠</span> {activeRequest.address}</span>
                      )}
                      <span className="request-card-meta"><span>🕐</span> {formatTimeAgo(activeRequest.postedAt)}</span>
                      {activeRequest.requesterId?.name && (
                        <span className="request-card-meta"><span>👤</span> {activeRequest.requesterId.name}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {activeRequest.status === 'accepted' && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={handleMarkInProgress}
                      disabled={!!statusLoading}
                    >
                      {statusLoading === 'in_progress'
                        ? <><span className="spinner spinner-green" /> Updating…</>
                        : '🚀 Mark In Progress'
                      }
                    </button>
                  )}

                  {['accepted', 'in_progress'].includes(activeRequest.status) && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setConfirmCompleteOpen(true)}
                        disabled={!!statusLoading}
                      >
                        {statusLoading === 'completed'
                          ? <><span className="spinner" /> Completing…</>
                          : '✅ Mark Completed'
                        }
                      </button>

                      {confirmCompleteOpen && (
                        <div style={{
                          display: 'flex', gap: '8px', alignItems: 'center',
                          padding: '10px 12px', background: 'var(--green-50)',
                          border: '1px solid var(--stone-200)', borderRadius: 'var(--radius-md)',
                        }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mark this request completed?</span>
                          <button className="btn btn-primary btn-sm" onClick={handleMarkCompleted} disabled={!!statusLoading}>Yes</button>
                          <button className="btn btn-ghost btn-sm" onClick={closeCompleteModal} disabled={!!statusLoading}>Cancel</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Incoming Requests ────────────────────────────────────────────── */}
        <div className="section-header" style={{ marginBottom: '16px' }}>
          <div>
            <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              Incoming Requests
              {requests.length > 0 && (
                <span className="badge badge-red" style={{ fontSize: '11px' }}>{requests.length} new</span>
              )}
              {requestsCity && (
                <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-muted)' }}>
                  📍 {requestsCity}
                </span>
              )}
            </div>
            <div className="section-subtitle">
              {requestsCity
                ? `Emergency requests in ${requestsCity} matching your service type`
                : 'Emergency requests matching your service type'
              }
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => fetchRequests({ silent: true })}>🔄 Refresh</button>
        </div>

        {initRequests ? (
          <Loader variant="skeleton" count={3} />
        ) : requests.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <h3>No incoming requests</h3>
              <p>
                {!profile?.isVerified
                  ? 'You will see requests here once your account is verified.'
                  : !profile?.city && !profile?.address
                    ? 'Set your city in your profile so we can show you local requests.'
                    : `No open requests in ${requestsCity || 'your area'} right now. Check back soon.`
                }
              </p>
              {!profile?.city && !profile?.address && profile?.isVerified && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate('/provider/profile')}
                  style={{ marginTop: '12px' }}
                >
                  Update Profile →
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {requests.map((req) => (
              <div key={req._id} className="card anim-fade-up">
                <div className="card-body">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                      <div style={{
                        width: '44px', height: '44px', borderRadius: 'var(--radius-md)',
                        background: 'var(--green-100)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '20px', flexShrink: 0,
                      }}>
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
                        <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--text-mid)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {req.description}
                        </p>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                          {req.city && <span className="request-card-meta"><span>📍</span> {req.city}</span>}
                          {req.address && <span className="request-card-meta"><span>🏠</span> {req.address}</span>}
                          <span className="request-card-meta"><span>🕐</span> {formatTimeAgo(req.postedAt)}</span>
                          {req.requesterId?.name && <span className="request-card-meta"><span>👤</span> {req.requesterId.name}</span>}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={!!acceptingId}
                        onClick={() => openAcceptConfirm(req._id)}
                      >
                        {acceptingId === req._id
                          ? <><span className="spinner" /> Accepting…</>
                          : '✅ Accept'
                        }
                      </button>

                      {confirmAcceptId === req._id && (
                        <div style={{
                          display: 'flex', gap: '8px', alignItems: 'center',
                          padding: '10px 12px', background: 'var(--green-50)',
                          border: '1px solid var(--stone-200)', borderRadius: 'var(--radius-md)',
                        }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Accept this request?</span>
                          <button className="btn btn-primary btn-sm" onClick={() => handleAccept(req)} disabled={!!acceptingId}>Yes</button>
                          <button className="btn btn-ghost btn-sm" onClick={closeAcceptConfirm} disabled={!!acceptingId}>Cancel</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Navbar>
  );
}