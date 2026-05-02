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

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '12px',
      padding: '12px 0', borderBottom: '1px solid var(--stone-200)',
    }}>
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

function TimelineStep({ icon, label, done, active }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%',
        background: done ? 'var(--green-600)' : active ? 'var(--green-800)' : 'var(--stone-200)',
        border: active ? '3px solid var(--green-300)' : '3px solid transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '15px', transition: 'all var(--t-base)',
        boxShadow: active ? '0 0 0 4px rgba(26,107,60,0.12)' : 'none',
        position: 'relative', zIndex: 1,
      }}>
        {done ? '✓' : icon}
      </div>
      <div style={{
        fontSize: '11px', marginTop: '6px',
        fontWeight: done || active ? 700 : 500,
        color: done ? 'var(--green-700)' : active ? 'var(--green-800)' : 'var(--text-muted)',
        textAlign: 'center', whiteSpace: 'nowrap',
      }}>
        {label}
      </div>
    </div>
  );
}

// ─── Response unwrappers ──────────────────────────────────────────────────────
// GET /api/volunteers/active-request → { success, activeRequest }
const unwrapActiveRequest = (res) => res?.activeRequest ?? null;

// sendPaginated → { success, message, data: [...], pagination: {...} }
const unwrapNearby = (res) => ({
  requests: Array.isArray(res?.data) ? res.data : [],
  total:    res?.pagination?.total ?? 0,
  city:     res?.pagination?.city  ?? '',
});

// sendSuccess → { success, message, data: { ...request } }
const unwrapRequest = (res) => res?.data ?? null;

// ─── Main component ───────────────────────────────────────────────────────────
export default function ActiveRequest() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedId    = searchParams.get('requestId');
  const { user }       = useAuth();

  // Core state
  const [request,           setRequest]          = useState(null);
  const [pendingRequest,    setPendingRequest]    = useState(null);
  const [availableRequests, setAvailableRequests] = useState([]);

  // UI state
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [error,         setError]         = useState('');
  const [successMsg,    setSuccessMsg]    = useState('');
  const [showCancel,    setShowCancel]    = useState(false);
  const [cancelReason,  setCancelReason]  = useState('');

  const mountedRef     = useRef(true);
  const actionInFlight = useRef(false);

  useEffect(() => { return () => { mountedRef.current = false; }; }, []);

  const showSuccess = (msg) => {
    if (!mountedRef.current) return;
    setSuccessMsg(msg);
    setTimeout(() => { if (mountedRef.current) setSuccessMsg(''); }, 3500);
  };

  // ── Load active request ────────────────────────────────────────────────────
  // FIX: single clean fetch — no double-fetch race after accept.
  // The old code called loadRequest() then immediately called getActiveRequest()
  // again, so the second response (which might arrive first) could overwrite
  // the first with a stale null, leaving the page stuck in the empty state.
  // Now there is exactly one fetch path and one state-setting call per cycle.
  const loadRequest = useCallback(async () => {
    try {
      const res    = await getActiveRequest();
      const active = unwrapActiveRequest(res);

      if (!mountedRef.current) return;

      if (active) {
        // Volunteer has an active assignment — show the management view
        setRequest(active);
        setPendingRequest(null);
        setAvailableRequests([]);
        return;
      }

      // No active assignment — show preview or nearby list
      setRequest(null);

      if (requestedId) {
        try {
          const reqRes  = await getRequestById(requestedId);
          const fetched = unwrapRequest(reqRes);
          if (mountedRef.current) {
            // Only show as pending if still available to accept
            setPendingRequest(fetched?.status === 'posted' ? fetched : null);
          }
        } catch {
          if (mountedRef.current) setPendingRequest(null);
        }
      } else {
        setPendingRequest(null);
      }

      // Load nearby list regardless so there's always something to show
      try {
        const nearbyRes         = await getNearbyRequests({ limit: 8 });
        const { requests: list } = unwrapNearby(nearbyRes);
        if (mountedRef.current) setAvailableRequests(list);
      } catch {
        if (mountedRef.current) setAvailableRequests([]);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err.response?.data?.message || 'Failed to load active request. Please refresh.');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [requestedId]);

  // Initial load
  useEffect(() => { loadRequest(); }, [loadRequest]);

  // Poll every 30s to catch status changes made by other parties
  useEffect(() => {
    const interval = setInterval(loadRequest, 30000);
    return () => clearInterval(interval);
  }, [loadRequest]);

  const safeNavigate = useCallback((path, delay = 0) => {
    const go = () => {
      document.body.style.overflow = '';
      setShowCancel(false);
      navigate(path);
    };
    if (delay > 0) setTimeout(go, delay);
    else go();
  }, [navigate]);

  // ── Accept ────────────────────────────────────────────────────────────────
  // FIX: after accepting, wait 800ms for all DB writes to complete
  // (request save + profile save + match updates) then do ONE clean
  // loadRequest(). No more double-fetch race condition.
  const handleAccept = async (requestId) => {
    if (!requestId || actionInFlight.current || actionLoading) return;
    actionInFlight.current = true;
    if (mountedRef.current) { setActionLoading('accept'); setError(''); }

    try {
      await acceptVolunteerRequest(requestId);
      if (!mountedRef.current) return;

      showSuccess('Request accepted! Loading your assignment…');
      setPendingRequest(null);
      setAvailableRequests([]);

      // Give the server time to complete all DB writes before polling
      await new Promise((resolve) => setTimeout(resolve, 800));
      if (!mountedRef.current) return;

      // Single clean reload — no race
      await loadRequest();
    } catch (err) {
      if (mountedRef.current)
        setError(err.response?.data?.message || 'Could not accept this request. Please try again.');
    } finally {
      actionInFlight.current = false;
      if (mountedRef.current) setActionLoading('');
    }
  };

  // ── Mark in progress ──────────────────────────────────────────────────────
  const handleMarkInProgress = async () => {
    if (actionInFlight.current || actionLoading) return;
    actionInFlight.current = true;
    if (mountedRef.current) { setActionLoading('progress'); setError(''); }
    try {
      const res = await markInProgress(request._id);
      if (mountedRef.current) {
        // markInProgress returns { success, message, request }
        setRequest(res.request);
        showSuccess('Marked as in progress!');
      }
    } catch (err) {
      if (mountedRef.current)
        setError(err.response?.data?.message || 'Action failed. Please try again.');
    } finally {
      actionInFlight.current = false;
      if (mountedRef.current) setActionLoading('');
    }
  };

  // ── Complete ──────────────────────────────────────────────────────────────
  const handleComplete = async () => {
    if (actionInFlight.current || actionLoading) return;
    actionInFlight.current = true;
    if (mountedRef.current) { setActionLoading('complete'); setError(''); }
    try {
      await completeRequest(request._id);
      showSuccess('Request completed! Great work 🎉');
      safeNavigate('/volunteer/dashboard', 2000);
    } catch (err) {
      if (mountedRef.current)
        setError(err.response?.data?.message || 'Action failed. Please try again.');
    } finally {
      actionInFlight.current = false;
      if (mountedRef.current) setActionLoading('');
    }
  };

  // ── Cancel ────────────────────────────────────────────────────────────────
  const handleCancelConfirm = async () => {
    if (actionInFlight.current) return;
    actionInFlight.current = true;
    if (mountedRef.current) { setActionLoading('cancel'); setError(''); }
    try {
      await cancelRequest(request._id, cancelReason);
      if (mountedRef.current) {
        setCancelReason('');
        showSuccess('Request cancelled and re-posted for other volunteers.');
      }
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

  // ── Timeline helper ───────────────────────────────────────────────────────
  const getTimelineState = (status) => ({
    acceptedDone:    ['accepted', 'in_progress', 'completed'].includes(status),
    acceptedActive:  status === 'accepted',
    progressDone:    ['in_progress', 'completed'].includes(status),
    progressActive:  status === 'in_progress',
    completedDone:   status === 'completed',
    completedActive: status === 'completed',
  });

  const tl            = request ? getTimelineState(request.status) : null;
  const locationValue = request
    ? [request.city, request.address].filter(Boolean).join(' · ') || null
    : null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Navbar title="Active Request">
      <div className="page-wrapper">

        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => safeNavigate('/volunteer/dashboard')}>
              ← Dashboard
            </button>
          </div>
          <h1 style={{ marginTop: '8px' }}>Active Request 🚨</h1>
          <p>Manage your currently assigned emergency request.</p>
        </div>

        {loading && <Loader variant="card" message="Loading active request…" />}

        {!loading && (
          <>
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

            {/* ── No active assignment ─────────────────────────────────── */}
            {!request && (
              <div className="card anim-fade-up">
                <div className="empty-state">

                  {/* Pre-accept preview — arrived via ?requestId= from dashboard */}
                  {pendingRequest ? (
                    <>
                      <div className="empty-state-icon">📬</div>
                      <h3>Request Ready to Accept</h3>
                      <p style={{ maxWidth: '720px', margin: '0 auto 14px' }}>
                        {pendingRequest.description}
                      </p>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
                        <Badge urgency={pendingRequest.urgencyLevel} />
                        <Badge color="blue">{formatEmergencyType(pendingRequest.emergencyType)}</Badge>
                        {pendingRequest.city && <Badge color="stone">📍 {pendingRequest.city}</Badge>}
                        {pendingRequest.bloodGroupNeeded && (
                          <Badge color="red">🩸 {pendingRequest.bloodGroupNeeded}</Badge>
                        )}
                      </div>
                      {/* Requester info if available */}
                      {pendingRequest.requesterId?.name && (
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                          Requested by <strong>{pendingRequest.requesterId.name}</strong>
                          {pendingRequest.requesterId.phone && ` · ${pendingRequest.requesterId.phone}`}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleAccept(pendingRequest._id)}
                          disabled={!!actionLoading}
                        >
                          {actionLoading === 'accept'
                            ? <><span className="spinner" /> Accepting…</>
                            : '✓ Accept Request'
                          }
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
                    /* Nearby requests list */
                    <>
                      <div className="empty-state-icon">📌</div>
                      <h3>No Active Request Yet</h3>
                      <p style={{ marginBottom: '20px' }}>
                        Open requests in your city — accept one to get started.
                      </p>
                      <div style={{ width: '100%', maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {availableRequests.map((req) => (
                          <div key={req._id} className="card" style={{ textAlign: 'left' }}>
                            <div className="card-body" style={{ padding: '14px 16px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontWeight: 700, marginBottom: '4px', fontSize: '14px' }}>
                                    {getEmergencyEmoji(req.emergencyType)}{' '}
                                    {formatEmergencyType(req.emergencyType)}
                                    {req.urgencyLevel && (
                                      <span style={{
                                        marginLeft: '8px', fontSize: '11px', fontWeight: 700,
                                        textTransform: 'uppercase', color: 'var(--text-muted)',
                                      }}>
                                        · {req.urgencyLevel}
                                      </span>
                                    )}
                                  </div>
                                  <div style={{
                                    fontSize: '13px', color: 'var(--text-muted)',
                                    marginBottom: '4px', lineHeight: 1.4,
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                  }}>
                                    {req.description}
                                  </div>
                                  <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                                    {req.city && `📍 ${req.city}`}
                                    {req.address && ` · ${req.address}`}
                                    {req.bloodGroupNeeded && ` · 🩸 ${req.bloodGroupNeeded}`}
                                  </div>
                                </div>
                                <button
                                  className="btn btn-primary btn-sm"
                                  disabled={!!actionLoading}
                                  onClick={() => handleAccept(req._id)}
                                  style={{ flexShrink: 0 }}
                                >
                                  {actionLoading === 'accept'
                                    ? <><span className="spinner" /> Accepting…</>
                                    : '✓ Accept'
                                  }
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>

                  ) : (
                    /* Truly empty */
                    <>
                      <div className="empty-state-icon">🟢</div>
                      <h3>No Active Request</h3>
                      <p>
                        You're not assigned to any request right now.
                        Make sure you're marked as available in your profile to receive assignments.
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
            )}

            {/* ── Active request management view ────────────────────────── */}
            {request && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>

                {/* Left column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                  {/* Timeline */}
                  <div className="card anim-fade-up delay-100">
                    <div className="card-header">
                      <div className="section-title">Request Progress</div>
                    </div>
                    <div className="card-body" style={{ paddingTop: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
                        <div style={{
                          position: 'absolute', top: '17px', left: '16%', right: '16%',
                          height: '2px', background: 'var(--stone-200)', zIndex: 0,
                        }} />
                        <TimelineStep icon="✅" label="Accepted"    done={tl.acceptedDone}  active={tl.acceptedActive} />
                        <TimelineStep icon="🚀" label="In Progress" done={tl.progressDone}  active={tl.progressActive} />
                        <TimelineStep icon="🎉" label="Completed"   done={tl.completedDone} active={tl.completedActive} />
                      </div>
                    </div>
                  </div>

                  {/* Request details */}
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
                      <InfoRow icon="🚨" label="Emergency Type"      value={formatEmergencyType(request.emergencyType)} />
                      <InfoRow icon="📝" label="Description"         value={request.description} />
                      <InfoRow icon="📍" label="Location"            value={locationValue} />
                      <InfoRow icon="🕐" label="Posted"              value={formatTimeAgo(request.postedAt || request.createdAt)} />
                      <InfoRow icon="✅" label="Accepted"            value={request.acceptedAt ? formatTimeAgo(request.acceptedAt) : null} />
                      {request.bloodGroupNeeded && (
                        <InfoRow icon="🩸" label="Blood Group Needed" value={request.bloodGroupNeeded} />
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="card anim-fade-up delay-300">
                    <div className="card-header">
                      <div className="section-title">Update Status</div>
                    </div>
                    <div className="card-body" style={{ paddingTop: '16px' }}>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
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
                        borderRadius: 'var(--radius-md)', fontSize: '12px',
                        color: 'var(--warning)', fontWeight: 500,
                      }}>
                        ⚠️ Cancelling will affect your cancellation rate and reputation score.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                  {/* Status badge card */}
                  <div className="card anim-fade-up delay-100">
                    <div className="card-body" style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '40px', marginBottom: '12px' }}>
                        {request.status === 'in_progress' ? '🚨' : request.status === 'accepted' ? '✅' : '⏳'}
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

                  {/* Requester contact */}
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
                      fontSize: '12px', fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '0.8px', color: 'var(--danger)', marginBottom: '12px',
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
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '7px 0', borderBottom: '1px solid rgba(192,57,43,0.1)',
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

      {/* Cancel modal */}
      <Modal
        isOpen={showCancel}
        onClose={() => {
          if (actionLoading === 'cancel') return;
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