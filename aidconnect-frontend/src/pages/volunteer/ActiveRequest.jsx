// src/pages/volunteer/ActiveRequest.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/common/Navbar.jsx';
import Badge from '../../components/common/Badge.jsx';
import Modal from '../../components/common/Modal.jsx';
import Loader from '../../components/common/Loader.jsx';
import useAuth from '../../hooks/useAuth.js';
import {
  getActiveRequest,
  acceptRequest as acceptVolunteerRequest,
  markInProgress,
  completeRequest,
  cancelRequest,
} from '../../api/volunteer.api.js';
import { getRequestById, getNearbyRequests } from '../../api/request.api.js';
import {
  formatTimeAgo,
  formatEmergencyType,
  getEmergencyEmoji,
} from '../../utils/formatters.js';

// ─── Detail row ───────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '12px 0',
        borderBottom: '1px solid var(--stone-200)',
      }}
    >
      <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '2px' }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px',
        }}>
          {label}
        </div>
        <div style={{ fontSize: '14px', color: 'var(--text-dark)', fontWeight: 500 }}>
          {value}
        </div>
      </div>
    </div>
  );
}

// ─── Timeline step ────────────────────────────────────────────────────────────
function TimelineStep({ icon, label, done, active, isLast }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
      <div
        style={{
          width: '36px', height: '36px', borderRadius: '50%',
          background: done
            ? 'var(--green-600)'
            : active
              ? 'var(--green-800)'
              : 'var(--stone-200)',
          border: active ? '3px solid var(--green-300)' : '3px solid transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '15px',
          transition: 'all var(--t-base)',
          boxShadow: active ? '0 0 0 4px rgba(26,107,60,0.12)' : 'none',
          position: 'relative', zIndex: 1,
        }}
      >
        {done ? '✓' : icon}
      </div>
      <div
        style={{
          fontSize: '11px', marginTop: '6px',
          fontWeight: done || active ? 700 : 500,
          color: done
            ? 'var(--green-700)'
            : active
              ? 'var(--green-800)'
              : 'var(--text-muted)',
          textAlign: 'center', whiteSpace: 'nowrap',
        }}
      >
        {label}
      </div>
    </div>
  );
}

// ─── ActiveRequest ────────────────────────────────────────────────────────────
export default function ActiveRequest() {
  const navigate    = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedId = searchParams.get('requestId');
  const { user }    = useAuth();

  const [request,       setRequest]       = useState(null);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [availableRequests, setAvailableRequests] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [error,         setError]         = useState('');
  const [successMsg,    setSuccessMsg]    = useState('');

  // Cancel modal
  const [showCancel,   setShowCancel]   = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // FIX: track whether component is still mounted before calling setState
  // after async operations. Prevents "state update on unmounted component"
  // which caused the React warning and contributed to the frozen overlay.
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  // FIX: track in-flight action to prevent double-clicks from firing
  // two simultaneous API calls (complete + complete, etc.)
  const actionInFlight = useRef(false);

  const showSuccess = (msg) => {
    if (!mountedRef.current) return;
    setSuccessMsg(msg);
    setTimeout(() => { if (mountedRef.current) setSuccessMsg(''); }, 3000);
  };

  const withTimeout = useCallback((promise, ms = 10000) => {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out')), ms)
      ),
    ]);
  }, []);

  // ── Load active request ────────────────────────────────────────────────────
  const loadRequest = useCallback(async () => {
    try {
      const res = await withTimeout(getActiveRequest());
      if (!mountedRef.current) return;

      const active = res.activeRequest || null;
      setRequest(active);

      // If volunteer opened this page from dashboard with ?requestId=...
      // and they don't have an active assignment yet, preload that request
      // so they can accept directly from here.
      if (!active && requestedId) {
        try {
          const reqRes = await withTimeout(getRequestById(requestedId));
          const fetched = reqRes?.data || null;
          setPendingRequest(fetched && fetched.status === 'posted' ? fetched : null);
        } catch {
          setPendingRequest(null);
        }
      } else {
        setPendingRequest(null);
      }

      // Additional fallback feed: keep this page actionable even without
      // an active assignment or explicit requestId query param.
      if (!active) {
        try {
          const nearbyRes = await withTimeout(getNearbyRequests({ limit: 8 }));
          const requests = nearbyRes?.data ?? nearbyRes?.requests ?? [];
          setAvailableRequests(Array.isArray(requests) ? requests : []);
        } catch {
          setAvailableRequests([]);
        }
      } else {
        setAvailableRequests([]);
      }
    } catch {
      if (mountedRef.current) setError('Failed to load active request.');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [requestedId, withTimeout]);

  useEffect(() => { loadRequest(); }, [loadRequest]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(loadRequest, 30000);
    return () => clearInterval(interval);
  }, [loadRequest]);

  // ── Safe navigate: cleans up body overflow before navigating ─────────────
  // FIX: always restore body overflow before navigating away. If a modal is
  // open when navigate() is called, the Modal cleanup effect may not fire
  // in time, leaving body locked as overflow:hidden on the next page.
  const safeNavigate = useCallback((path, delay = 0) => {
    const go = () => {
      document.body.style.overflow = '';  // always clean up
      setShowCancel(false);               // close modal if open
      navigate(path);
    };
    if (delay > 0) setTimeout(go, delay);
    else go();
  }, [navigate]);

  // ── Mark in progress ───────────────────────────────────────────────────────
  const handleMarkInProgress = async () => {
    // FIX: guard against double-clicks
    if (actionInFlight.current || actionLoading) return;
    actionInFlight.current = true;

    if (mountedRef.current) { setActionLoading('progress'); setError(''); }
    try {
      const res = await markInProgress(request._id);
      if (mountedRef.current) {
        setRequest(res.request);
        showSuccess('Request marked as in progress!');
      }
    } catch (err) {
      if (mountedRef.current)
        setError(err.response?.data?.message || 'Action failed. Please try again.');
    } finally {
      actionInFlight.current = false;
      if (mountedRef.current) setActionLoading('');
    }
  };

  // ── Accept from pending request preview ────────────────────────────────────
  const handleAcceptPending = async () => {
    if (!pendingRequest?._id || actionInFlight.current || actionLoading) return;
    actionInFlight.current = true;

    if (mountedRef.current) { setActionLoading('accept'); setError(''); }
    try {
      const res = await acceptVolunteerRequest(pendingRequest._id);
      if (!mountedRef.current) return;
      setRequest(res.request || null);
      setPendingRequest(null);
      showSuccess('Request accepted successfully. You can now update its status.');
    } catch (err) {
      if (mountedRef.current) {
        setError(err.response?.data?.message || 'Could not accept this request.');
      }
    } finally {
      actionInFlight.current = false;
      if (mountedRef.current) setActionLoading('');
    }
  };

  const handleAcceptById = async (requestId) => {
    if (!requestId || actionInFlight.current || actionLoading) return;
    actionInFlight.current = true;

    if (mountedRef.current) { setActionLoading('accept'); setError(''); }
    try {
      const res = await acceptVolunteerRequest(requestId);
      if (!mountedRef.current) return;
      setRequest(res.request || null);
      setPendingRequest(null);
      setAvailableRequests((prev) => prev.filter((r) => r._id !== requestId));
      showSuccess('Request accepted successfully. You can now update its status.');
    } catch (err) {
      if (mountedRef.current) {
        setError(err.response?.data?.message || 'Could not accept this request.');
      }
    } finally {
      actionInFlight.current = false;
      if (mountedRef.current) setActionLoading('');
    }
  };

  // ── Complete ───────────────────────────────────────────────────────────────
  const handleComplete = async () => {
    // FIX: guard against double-clicks
    if (actionInFlight.current || actionLoading) return;
    actionInFlight.current = true;

    if (mountedRef.current) { setActionLoading('complete'); setError(''); }
    try {
      await completeRequest(request._id);
      showSuccess('Request completed! Great work 🎉');
      // FIX: use safeNavigate so body overflow is cleaned up before leaving
      safeNavigate('/volunteer/dashboard', 2000);
    } catch (err) {
      if (mountedRef.current)
        setError(err.response?.data?.message || 'Action failed. Please try again.');
    } finally {
      actionInFlight.current = false;
      if (mountedRef.current) setActionLoading('');
    }
  };

  // ── Cancel ─────────────────────────────────────────────────────────────────
  const handleCancelConfirm = async () => {
    // FIX: guard against double-clicks inside the modal confirm button
    if (actionInFlight.current) return;
    actionInFlight.current = true;

    if (mountedRef.current) { setActionLoading('cancel'); setError(''); }
    try {
      await cancelRequest(request._id, cancelReason);
      if (mountedRef.current) {
        setCancelReason('');
        showSuccess('Request cancelled and re-posted for other volunteers.');
      }
      // FIX: use safeNavigate — this closes the modal AND restores overflow
      // before navigating, preventing the frozen dark screen
      safeNavigate('/volunteer/dashboard', 2000);
    } catch (err) {
      if (mountedRef.current) {
        setError(err.response?.data?.message || 'Action failed. Please try again.');
        setShowCancel(false);
      }
    } finally {
      actionInFlight.current = false;
      if (mountedRef.current) setActionLoading('');
    }
  };

  // ── Timeline helpers ───────────────────────────────────────────────────────
  const getTimelineState = (status) => ({
    acceptedDone:    ['accepted', 'in_progress', 'completed'].includes(status),
    acceptedActive:  status === 'accepted',
    progressDone:    ['in_progress', 'completed'].includes(status),
    progressActive:  status === 'in_progress',
    completedDone:   status === 'completed',
    completedActive: status === 'completed',
  });

  const tl = request ? getTimelineState(request.status) : null;

  // FIX: read request.city (top-level string field) — NOT request.location.city
  // request.location is a GeoJSON point { type, coordinates } — city is never
  // nested inside it. The old code read request.location?.city which is always
  // undefined, causing the location row to never render.
  const locationValue = request
    ? [request.city, request.address].filter(Boolean).join(' · ') || null
    : null;

  return (
    <Navbar title="Active Request">
      <div className="page-wrapper">

        {/* ── Page header ───────────────────────────────────────────────── */}
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => safeNavigate('/volunteer/dashboard')}
            >
              ← Dashboard
            </button>
          </div>
          <h1 style={{ marginTop: '8px' }}>Active Request 🚨</h1>
          <p>Manage your currently assigned emergency request.</p>
        </div>

        {/* ── Loading ───────────────────────────────────────────────────── */}
        {loading && <Loader variant="card" message="Loading active request…" />}

        {!loading && (
          <>
            {/* ── Alerts ────────────────────────────────────────────────── */}
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

            {/* ── No active request ─────────────────────────────────────── */}
            {!request ? (
              <div className="card anim-fade-up">
                <div className="empty-state">
                  {pendingRequest ? (
                    <>
                      <div className="empty-state-icon">📬</div>
                      <h3>Request Ready to Accept</h3>
                      <p style={{ maxWidth: '720px', margin: '0 auto 14px' }}>
                        {pendingRequest.description}
                      </p>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
                        <Badge urgency={pendingRequest.urgencyLevel} />
                        <Badge color="blue">{formatEmergencyType(pendingRequest.emergencyType)}</Badge>
                        {pendingRequest.city && <Badge color="stone">📍 {pendingRequest.city}</Badge>}
                      </div>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-primary"
                          onClick={handleAcceptPending}
                          disabled={!!actionLoading}
                        >
                          {actionLoading === 'accept'
                            ? <><span className="spinner" /> Accepting…</>
                            : '✓ Accept Request'}
                        </button>
                        <button
                          className="btn btn-ghost"
                          onClick={() => safeNavigate('/volunteer/dashboard')}
                          disabled={!!actionLoading}
                        >
                          ← Back to Dashboard
                        </button>
                      </div>
                    </>
                  ) : availableRequests.length > 0 ? (
                    <>
                      <div className="empty-state-icon">📌</div>
                      <h3>No Active Request Yet</h3>
                      <p style={{ marginBottom: '14px' }}>
                        You can accept an open request from your city directly below.
                      </p>
                      <div style={{ width: '100%', maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {availableRequests.map((req) => (
                          <div key={req._id} className="card" style={{ textAlign: 'left' }}>
                            <div className="card-body" style={{ padding: '14px 16px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <div>
                                  <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                                    {formatEmergencyType(req.emergencyType)} — {req.description}
                                  </div>
                                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    {req.city ? `📍 ${req.city}` : ''} {req.address ? `· ${req.address}` : ''}
                                  </div>
                                </div>
                                <button
                                  className="btn btn-primary btn-sm"
                                  disabled={!!actionLoading}
                                  onClick={() => handleAcceptById(req._id)}
                                >
                                  {actionLoading === 'accept'
                                    ? <><span className="spinner" /> Accepting…</>
                                    : '✓ Accept'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="empty-state-icon">🟢</div>
                      <h3>No Active Request</h3>
                      <p>
                        You're not assigned to any request right now. Make sure
                        you're marked as available to receive new assignments.
                      </p>
                      <button
                        className="btn btn-primary"
                        onClick={() => safeNavigate('/volunteer/dashboard')}
                      >
                        ← Back to Dashboard
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 300px',
                  gap: '24px',
                  alignItems: 'start',
                }}
              >
                {/* ── Left column ─────────────────────────────────────── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                  {/* Timeline card */}
                  <div className="card anim-fade-up delay-100">
                    <div className="card-header">
                      <div className="section-title">Request Progress</div>
                    </div>
                    <div className="card-body" style={{ paddingTop: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
                        <div style={{
                          position: 'absolute', top: '17px',
                          left: '16%', right: '16%',
                          height: '2px', background: 'var(--stone-200)', zIndex: 0,
                        }} />
                        <TimelineStep icon="✅" label="Accepted"    done={tl.acceptedDone}  active={tl.acceptedActive}  />
                        <TimelineStep icon="🚀" label="In Progress" done={tl.progressDone}  active={tl.progressActive}  />
                        <TimelineStep icon="🎉" label="Completed"   done={tl.completedDone} active={tl.completedActive} isLast />
                      </div>
                    </div>
                  </div>

                  {/* Request details card */}
                  <div className="card anim-fade-up delay-200">
                    <div className="card-header">
                      <div className="section-header" style={{ marginBottom: 0 }}>
                        <div className="section-title">Request Details</div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <Badge urgency={request.urgencyLevel} />
                          <Badge
                            status={request.status}
                            dot={request.status === 'in_progress'}
                            pulse={request.status === 'in_progress'}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="card-body" style={{ paddingTop: '8px' }}>
                      <InfoRow icon="🚨" label="Emergency Type" value={formatEmergencyType(request.emergencyType)} />
                      <InfoRow icon="📝" label="Description"    value={request.description} />
                      {/* FIX: request.city is the top-level field — not request.location.city */}
                      <InfoRow icon="📍" label="Location"       value={locationValue} />
                      <InfoRow icon="🕐" label="Posted"         value={formatTimeAgo(request.postedAt   || request.createdAt)} />
                      <InfoRow icon="✅" label="Accepted"       value={formatTimeAgo(request.acceptedAt)} />
                      {request.bloodGroupNeeded && (
                        <InfoRow icon="🩸" label="Blood Group Needed" value={request.bloodGroupNeeded} />
                      )}
                    </div>
                  </div>

                  {/* Action buttons card */}
                  <div className="card anim-fade-up delay-300">
                    <div className="card-header">
                      <div className="section-title">Update Status</div>
                    </div>
                    <div className="card-body" style={{ paddingTop: '16px' }}>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>

                        {/* Mark in progress — only when status is accepted */}
                        {request.status === 'accepted' && (
                          <button
                            className="btn btn-secondary"
                            style={{ flex: 1 }}
                            disabled={!!actionLoading}
                            onClick={handleMarkInProgress}
                          >
                            {actionLoading === 'progress'
                              ? <><span className="spinner spinner-green" /> Updating…</>
                              : '🚀 Mark In Progress'
                            }
                          </button>
                        )}

                        {/* Complete */}
                        {['accepted', 'in_progress'].includes(request.status) && (
                          <button
                            className="btn btn-primary"
                            style={{ flex: 1 }}
                            disabled={!!actionLoading}
                            onClick={handleComplete}
                          >
                            {actionLoading === 'complete'
                              ? <><span className="spinner" /> Completing…</>
                              : '✅ Mark Completed'
                            }
                          </button>
                        )}

                        {/* Cancel */}
                        {['accepted', 'in_progress'].includes(request.status) && (
                          <button
                            className="btn btn-danger"
                            disabled={!!actionLoading}
                            onClick={() => setShowCancel(true)}
                          >
                            ✕ Cancel
                          </button>
                        )}
                      </div>

                      <div style={{
                        marginTop: '14px', padding: '10px 14px',
                        background: 'var(--warning-bg)', border: '1px solid #fce4b3',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '12px', color: 'var(--warning)', fontWeight: 500,
                      }}>
                        ⚠️ Cancelling will affect your cancellation rate and reputation score.
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Right column ──────────────────────────────────────── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                  {/* Status card */}
                  <div className="card anim-fade-up delay-100">
                    <div className="card-body" style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '40px', marginBottom: '12px' }}>
                        {request.status === 'in_progress' ? '🚨'
                          : request.status === 'accepted'  ? '✅'
                          : '⏳'}
                      </div>
                      <Badge
                        status={request.status}
                        dot={request.status === 'in_progress'}
                        pulse={request.status === 'in_progress'}
                        style={{ fontSize: '13px', padding: '6px 14px' }}
                      />
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '10px', lineHeight: 1.6 }}>
                        {request.status === 'accepted'    && 'Head to the location — the requester is waiting.'}
                        {request.status === 'in_progress' && "You're on the scene. Stay focused."}
                      </p>
                    </div>
                  </div>

                  {/* Requester contact card */}
                  {request.requesterId && (
                    <div className="card anim-fade-up delay-200">
                      <div className="card-header">
                        <div className="section-title">Requester Contact</div>
                      </div>
                      <div className="card-body" style={{ paddingTop: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                          <div className="avatar avatar-md">
                            {request.requesterId.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-dark)' }}>
                              {request.requesterId.name || 'Unknown'}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              Help Seeker
                            </div>
                          </div>
                        </div>

                        {request.requesterId.phone ? (
                          <a
                            href={`tel:${request.requesterId.phone}`}
                            className="btn btn-primary btn-full"
                            style={{ textDecoration: 'none', textAlign: 'center' }}
                          >
                            📞 Call Now — {request.requesterId.phone}
                          </a>
                        ) : (
                          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
                            No phone number available
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Emergency contacts */}
                  <div style={{
                    padding: '16px 20px',
                    background: 'var(--danger-bg)',
                    border: '1px solid #f5c6c2',
                    borderRadius: 'var(--radius-lg)',
                  }}>
                    <div style={{
                      fontSize: '12px', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.8px',
                      color: 'var(--danger)', marginBottom: '12px',
                    }}>
                      🚨 Emergency Contacts
                    </div>
                    {[
                      { label: 'Rescue', number: '1122' },
                      { label: 'Edhi',   number: '115'  },
                      { label: 'Police', number: '15'   },
                    ].map((c) => (
                      <a
                        key={c.label}
                        href={`tel:${c.number}`}
                        style={{
                          display: 'flex', justifyContent: 'space-between',
                          alignItems: 'center', padding: '7px 0',
                          borderBottom: '1px solid rgba(192,57,43,0.1)',
                          textDecoration: 'none',
                        }}
                      >
                        <span style={{ fontSize: '13px', color: 'var(--text-mid)', fontWeight: 500 }}>
                          {c.label}
                        </span>
                        <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--danger)' }}>
                          {c.number}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Cancel modal ──────────────────────────────────────────────────── */}
      <Modal
        isOpen={showCancel}
        onClose={() => {
          if (actionLoading === 'cancel') return; // don't close mid-action
          setShowCancel(false);
          setCancelReason('');
        }}
        title="Cancel Request?"
        icon="⚠️"
        onConfirm={handleCancelConfirm}
        confirmLabel="Yes, Cancel"
        confirmVariant="danger"
        loading={actionLoading === 'cancel'}
      >
        <div>
          <p style={{ fontSize: '14px', color: 'var(--text-mid)', lineHeight: 1.7, marginBottom: '16px' }}>
            This will re-post the request so another volunteer can pick it up.
            Your cancellation rate and reputation score will be affected.
          </p>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Reason for cancelling (optional)</label>
            <textarea
              className="form-textarea"
              placeholder="Let us know why you're cancelling…"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              disabled={actionLoading === 'cancel'}
            />
          </div>
        </div>
      </Modal>

    </Navbar>
  );
}