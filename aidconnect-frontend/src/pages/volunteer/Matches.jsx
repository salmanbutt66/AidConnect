// src/pages/volunteer/Matches.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar.jsx';
import Badge from '../../components/common/Badge.jsx';
import Loader from '../../components/common/Loader.jsx';
import { acceptRequest } from '../../api/request.api.js';
import { declineMatch, getMyMatches } from '../../api/match.api.js';
import { formatTimeAgo, formatEmergencyType, getEmergencyEmoji } from '../../utils/formatters.js';

function MatchCard({ match, onAccept, onDecline, acceptingId, decliningId }) {
  const request = match.requestId || {};
  const requester = request.requesterId || {};
  const isBusy = acceptingId === match._id || decliningId === match._id;

  return (
    <div className="card anim-fade-up" style={{ overflow: 'hidden' }}>
      <div className="card-body" style={{ padding: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', background: 'var(--green-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
              {getEmergencyEmoji(request.emergencyType)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '4px' }}>
                {request.description || 'Help request'}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Badge urgency={request.urgencyLevel} />
                <Badge color="blue">{formatEmergencyType(request.emergencyType)}</Badge>
                <Badge color="stone">Score {Math.round(match.matchScore || 0)}</Badge>
              </div>
            </div>
          </div>
          <span className="badge badge-green" style={{ flexShrink: 0 }}>
            {Number(match.distanceKm || 0).toFixed(1)} km away
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Requester</div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>{requester.name || 'Unknown'}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{requester.phone || 'No phone number'}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Posted</div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>{formatTimeAgo(request.postedAt || request.createdAt)}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Location</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)' }}>{request.address || 'Location not provided'}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            disabled={isBusy}
            onClick={() => onAccept(match)}
          >
            {acceptingId === match._id ? <><span className="spinner" /> Accepting…</> : '✓ Accept Match'}
          </button>
          <button
            className="btn btn-ghost"
            disabled={isBusy}
            onClick={() => onDecline(match)}
          >
            {decliningId === match._id ? <><span className="spinner" /> Declining…</> : '✕ Decline'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Matches() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [acceptingId, setAcceptingId] = useState('');
  const [decliningId, setDecliningId] = useState('');

  const loadMatches = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getMyMatches();
      setMatches(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your matches.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const showSuccess = useCallback((message) => {
    setSuccessMsg(message);
    window.setTimeout(() => setSuccessMsg(''), 3000);
  }, []);

  const handleAccept = useCallback(async (match) => {
    const requestId = match.requestId?._id || match.requestId;
    if (!requestId || !match?._id) {
      setError('This match is missing request data. Please refresh and try again.');
      return;
    }

    setAcceptingId(match._id);
    setError('');
    try {
      await acceptRequest(requestId, match._id);
      showSuccess('Match accepted. Opening your active request.');
      await loadMatches();
      navigate('/volunteer/active-request');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept match.');
    } finally {
      setAcceptingId('');
    }
  }, [loadMatches, navigate, showSuccess]);

  const handleDecline = useCallback(async (match) => {
    setDecliningId(match._id);
    setError('');
    try {
      await declineMatch(match._id);
      setMatches((prev) => prev.filter((item) => item._id !== match._id));
      showSuccess('Match declined.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to decline match.');
    } finally {
      setDecliningId('');
    }
  }, [showSuccess]);

  return (
    <Navbar title="Incoming Matches">
      <div className="page-wrapper">
        <div className="page-header">
          <h1>Incoming Matches</h1>
          <p>Review the requests matched to you and accept the one you can handle.</p>
        </div>

        {error && (
          <div className="alert alert-error anim-fade-up" style={{ marginBottom: '20px' }}>
            <span className="alert-icon">⚠️</span>
            {error}
            <button
              onClick={() => setError('')}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontWeight: 700 }}
            >
              ✕
            </button>
          </div>
        )}

        {successMsg && (
          <div className="alert alert-success anim-fade-up" style={{ marginBottom: '20px' }}>
            <span className="alert-icon">✅</span>
            {successMsg}
          </div>
        )}

        {loading ? (
          <Loader variant="card" message="Loading matches…" />
        ) : matches.length === 0 ? (
          <div className="card anim-fade-up">
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <h3>No incoming matches</h3>
              <p>You will see matched requests here once the system finds a good fit for you.</p>
              <button className="btn btn-primary" onClick={() => navigate('/volunteer/dashboard')}>
                ← Back to Dashboard
              </button>
            </div>
          </div>
        ) : (
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
        )}
      </div>
    </Navbar>
  );
}
