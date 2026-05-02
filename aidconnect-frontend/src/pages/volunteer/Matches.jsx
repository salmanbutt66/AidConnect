// src/pages/volunteer/Matches.jsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar.jsx';
import Badge from '../../components/common/Badge.jsx';
import Loader from '../../components/common/Loader.jsx';
import { acceptRequest } from '../../api/request.api.js';
import { getNearbyRequests } from '../../api/request.api.js';
import { acceptRequest as acceptVolunteerRequest } from '../../api/volunteer.api.js';
import { declineMatch, getMyMatches } from '../../api/match.api.js';
import { formatTimeAgo, formatEmergencyType, getEmergencyEmoji } from '../../utils/formatters.js';

// ─── Match card ───────────────────────────────────────────────────────────────
function MatchCard({ match, onAccept, onDecline, acceptingId, decliningId }) {
  const request   = match.requestId || {};
  const requester = request.requesterId || {};
  const isBusy    = acceptingId === match._id || decliningId === match._id;

  const urgencyColors = {
    critical: 'var(--danger)',
    high:     'var(--warning)',
    medium:   'var(--info)',
    low:      'var(--green-600)',
  };

  return (
    <div
      className="card anim-fade-up"
      style={{
        overflow: 'hidden',
        borderLeft: `4px solid ${urgencyColors[request.urgencyLevel] || 'var(--stone-300)'}`,
      }}
    >
      <div className="card-body" style={{ padding: '18px' }}>

        {/* ── Header row ────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div style={{
              width: '44px', height: '44px', flexShrink: 0,
              borderRadius: 'var(--radius-md)', background: 'var(--green-100)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px',
            }}>
              {getEmergencyEmoji(request.emergencyType)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: '15px', fontWeight: 700, color: 'var(--text-dark)',
                marginBottom: '4px',
                overflow: 'hidden', display: '-webkit-box',
                WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              }}>
                {request.description || 'Help request'}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Badge urgency={request.urgencyLevel} />
                <Badge color="blue">{formatEmergencyType(request.emergencyType)}</Badge>
                {match.matchScore > 0 && (
                  <Badge color="stone">Score {Math.round(match.matchScore)}</Badge>
                )}
                {request.bloodGroupNeeded && (
                  <span className="badge badge-red" style={{ fontSize: '10px' }}>
                    🩸 {request.bloodGroupNeeded}
                  </span>
                )}
              </div>
            </div>
          </div>

          {match.distanceKm > 0 && (
            <span className="badge badge-green" style={{ flexShrink: 0 }}>
              {Number(match.distanceKm).toFixed(1)} km away
            </span>
          )}
        </div>

        {/* ── Detail grid ───────────────────────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px',
          marginBottom: '16px',
          padding: '14px',
          background: 'var(--green-50)',
          borderRadius: 'var(--radius-md)',
        }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              Requester
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>
              {requester.name || 'Anonymous'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {requester.phone || 'No phone listed'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              Posted
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>
              {formatTimeAgo(request.postedAt || request.createdAt)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              Location
            </div>
            {/* FIX: request.city is the primary top-level field — always present */}
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>
              {request.city || 'Unknown city'}
            </div>
            {request.address && request.address !== request.city && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {request.address}
              </div>
            )}
          </div>
        </div>

        {/* ── Action buttons ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            disabled={isBusy}
            onClick={() => onAccept(match)}
            style={{ flex: 1, minWidth: '120px' }}
          >
            {acceptingId === match._id
              ? <><span className="spinner" /> Accepting…</>
              : '✓ Accept Match'
            }
          </button>
          <button
            className="btn btn-ghost"
            disabled={isBusy}
            onClick={() => onDecline(match)}
          >
            {decliningId === match._id
              ? <><span className="spinner" /> Declining…</>
              : '✕ Decline'
            }
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── Matches page ─────────────────────────────────────────────────────────────
export default function Matches() {
  const navigate = useNavigate();

  const [matches,     setMatches]     = useState([]);
  const [nearbyRequests, setNearbyRequests] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [successMsg,  setSuccessMsg]  = useState('');
  const [acceptingId, setAcceptingId] = useState('');
  const [decliningId, setDecliningId] = useState('');

  // FIX: track mount state to prevent setState on unmounted component.
  // Without this, if the user accepts and navigates to active-request
  // before the 800ms delay fires, the finally block tries to call
  // setAcceptingId('') on an already-unmounted component.
  const mountedRef    = useRef(true);
  useEffect(() => { return () => { mountedRef.current = false; }; }, []);

  // FIX: in-flight guard prevents double-clicking Accept or Decline
  // from firing two simultaneous API calls for the same match.
  const actionInFlight = useRef(false);

  const withTimeout = useCallback((promise, ms = 10000) => {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out')), ms)
      ),
    ]);
  }, []);

  // ── Load only pending (notified) matches ───────────────────────────────────
  const loadMatches = useCallback(async () => {
    if (mountedRef.current) { setLoading(true); setError(''); }
    try {
      const [matchRes, nearbyRes] = await Promise.allSettled([
        withTimeout(getMyMatches({ status: 'notified' })),
        withTimeout(getNearbyRequests({ limit: 10 })),
      ]);

      if (!mountedRef.current) return;

      if (matchRes.status === 'fulfilled') {
        setMatches(Array.isArray(matchRes.value.data) ? matchRes.value.data : []);
      } else {
        setMatches([]);
      }

      if (nearbyRes.status === 'fulfilled') {
        const requests = nearbyRes.value?.data ?? nearbyRes.value?.requests ?? [];
        setNearbyRequests(Array.isArray(requests) ? requests : []);
      } else {
        setNearbyRequests([]);
      }
    } catch (err) {
      if (mountedRef.current)
        setError(err.response?.data?.message || 'Failed to load your matches.');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [withTimeout]);

  useEffect(() => { loadMatches(); }, [loadMatches]);

  const showSuccess = useCallback((message) => {
    if (!mountedRef.current) return;
    setSuccessMsg(message);
    setTimeout(() => { if (mountedRef.current) setSuccessMsg(''); }, 3000);
  }, []);

  // ── Accept ─────────────────────────────────────────────────────────────────
  // Flow: acceptRequest(requestId, matchId)
  //   → PUT /api/requests/:id/accept { matchId }
  //   → handleVolunteerResponse in matching.service.js
  //   → marks request accepted, locks volunteer, expires other matches
  const handleAccept = useCallback(async (match) => {
    if (actionInFlight.current) return;

    const requestId = match.requestId?._id || match.requestId;
    if (!requestId || !match?._id) {
      if (mountedRef.current)
        setError('Match data is incomplete. Please refresh and try again.');
      return;
    }

    actionInFlight.current = true;
    if (mountedRef.current) { setAcceptingId(match._id); setError(''); }

    try {
      await acceptRequest(requestId, match._id);
      showSuccess('Match accepted! Heading to your active request…');
      // Small delay so the user sees the success message before navigating
      setTimeout(() => {
        document.body.style.overflow = ''; // safety cleanup
        navigate('/volunteer/active-request');
      }, 800);
    } catch (err) {
      if (mountedRef.current)
        setError(err.response?.data?.message || 'Failed to accept match. The request may have already been taken.');
    } finally {
      // FIX: always clear acceptingId in finally, not just on error.
      // Previously the spinner stayed forever on success until navigation.
      actionInFlight.current = false;
      if (mountedRef.current) setAcceptingId('');
    }
  }, [navigate, showSuccess]);

  // ── Decline ────────────────────────────────────────────────────────────────
  const handleDecline = useCallback(async (match) => {
    if (actionInFlight.current) return;

    actionInFlight.current = true;
    if (mountedRef.current) { setDecliningId(match._id); setError(''); }

    try {
      await declineMatch(match._id);
      if (mountedRef.current)
        setMatches((prev) => prev.filter((m) => m._id !== match._id));
      showSuccess('Match declined.');
    } catch (err) {
      if (mountedRef.current)
        setError(err.response?.data?.message || 'Failed to decline match.');
    } finally {
      actionInFlight.current = false;
      if (mountedRef.current) setDecliningId('');
    }
  }, [showSuccess]);

  const handleAcceptNearby = useCallback(async (requestId) => {
    if (actionInFlight.current) return;
    actionInFlight.current = true;
    if (mountedRef.current) { setAcceptingId(requestId); setError(''); }

    try {
      await acceptVolunteerRequest(requestId);
      showSuccess('Request accepted! Heading to active request…');
      setTimeout(() => {
        navigate('/volunteer/active-request');
      }, 800);
    } catch (err) {
      if (mountedRef.current) {
        setError(err.response?.data?.message || 'Failed to accept request.');
      }
    } finally {
      actionInFlight.current = false;
      if (mountedRef.current) setAcceptingId('');
    }
  }, [navigate, showSuccess]);

  return (
    <Navbar title="Incoming Matches">
      <div className="page-wrapper">

        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1>Incoming Matches</h1>
              <p>Review requests matched to you and accept the one you can handle.</p>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={loadMatches}
              disabled={loading}
            >
              ↻ Refresh
            </button>
          </div>
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

        {/* ── Content ─────────────────────────────────────────────────────── */}
        {loading ? (
          <Loader variant="card" message="Loading matches…" />
        ) : matches.length === 0 ? (
          <div className="card anim-fade-up">
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <h3>No pending match notifications</h3>
              {nearbyRequests.length > 0 ? (
                <>
                  <p>Open requests in your city are available below. You can accept directly.</p>
                  <div style={{ width: '100%', maxWidth: '900px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {nearbyRequests.map((req) => (
                      <div key={req._id} className="card" style={{ textAlign: 'left' }}>
                        <div className="card-body" style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <div>
                              <div style={{ fontWeight: 700, marginBottom: '6px' }}>
                                {formatEmergencyType(req.emergencyType)} — {req.description}
                              </div>
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <Badge urgency={req.urgencyLevel} />
                                {req.city && <Badge color="stone">📍 {req.city}</Badge>}
                                <Badge color="blue">{formatTimeAgo(req.postedAt || req.createdAt)}</Badge>
                              </div>
                            </div>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleAcceptNearby(req._id)}
                              disabled={acceptingId === req._id || decliningId === req._id}
                            >
                              {acceptingId === req._id
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
                  <p>
                    You will be notified here when a request in your city matches your profile.
                    Make sure you are marked as <strong>available</strong> in your dashboard.
                  </p>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '8px' }}>
                    <button className="btn btn-primary" onClick={() => navigate('/volunteer/dashboard')}>
                      ← Back to Dashboard
                    </button>
                    <button className="btn btn-ghost" onClick={() => navigate('/volunteer/profile')}>
                      Update Profile
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {matches.length} pending match{matches.length !== 1 ? 'es' : ''} — you can only accept one at a time
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {matches.map((match) => (
                <MatchCard
                  key={match._id}
                  match={match}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                  acceptingId={acceptingId}
                  decliningId={decliningId}
                />
              ))}
            </div>

            {/* Keep a direct city-requests fallback visible even when matches exist */}
            {nearbyRequests.length > 0 && (
              <div className="card anim-fade-up" style={{ marginTop: '18px' }}>
                <div className="card-header">
                  <div className="section-title">Open City Requests (Direct Accept)</div>
                </div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {nearbyRequests.slice(0, 5).map((req) => (
                    <div key={req._id} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center', border: '1px solid var(--stone-200)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
                      <div>
                        <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                          {formatEmergencyType(req.emergencyType)} — {req.description}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {req.city ? `📍 ${req.city}` : ''} · {formatTimeAgo(req.postedAt || req.createdAt)}
                        </div>
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleAcceptNearby(req._id)}
                        disabled={acceptingId === req._id || decliningId === req._id}
                      >
                        {acceptingId === req._id
                          ? <><span className="spinner" /> Accepting…</>
                          : '✓ Accept'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </Navbar>
  );
}