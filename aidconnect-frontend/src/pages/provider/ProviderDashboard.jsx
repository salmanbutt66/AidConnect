import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, CheckCircle2, Clock, AlertTriangle, RefreshCw,
  Inbox, MapPin, User, Zap, BadgeCheck, ShieldAlert,
  X, ArrowRight, CheckCheck, Radio,
} from 'lucide-react';
import Navbar from '../../components/common/Navbar.jsx';
import Loader from '../../components/common/Loader.jsx';
import Badge from '../../components/common/Badge.jsx';
import {
  getProviderProfile, getRelevantRequests,
  getActiveRequest as getActiveProviderRequest, acceptRequest,
} from '../../api/provider.api.js';
import { updateRequestStatus } from '../../api/request.api.js';
import { formatTimeAgo, formatEmergencyType } from '../../utils/formatters.js';
import { SERVICE_TYPES } from '../../utils/constants.js';

const EMERGENCY_ACCENT = {
  medical:  { color: 'var(--info)',    bg: 'var(--info-bg)' },
  blood:    { color: 'var(--danger)',  bg: 'var(--danger-bg)' },
  accident: { color: 'var(--warning)', bg: 'var(--warning-bg)' },
  disaster: { color: '#8e44ad',        bg: '#f5eeff' },
  other:    { color: 'var(--stone-400)', bg: 'var(--stone-200)' },
};

const REQUEST_STATUS_REFRESH_EVENT = 'aidconnect:request-status-changed';

export default function ProviderDashboard() {
  const navigate = useNavigate();
  const [profile,         setProfile]         = useState(null);
  const [activeRequest,   setActiveRequest]   = useState(null);
  const [requests,        setRequests]         = useState([]);
  const [loadingProfile,  setLoadingProfile]   = useState(true);
  const [loadingActive,   setLoadingActive]    = useState(true);
  const [loadingRequests, setLoadingRequests]  = useState(true);
  const [acceptingId,     setAcceptingId]      = useState(null);
  const [statusLoading,   setStatusLoading]    = useState('');
  const [confirmAcceptId, setConfirmAcceptId]  = useState(null);
  const [confirmCompleteOpen, setConfirmCompleteOpen] = useState(false);
  const [error,      setError]      = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 4000); };
  const showError   = (msg) => setError(msg);

  const withTimeout = useCallback((promise, ms = 15000, msg = 'Request timed out. Please try again.') => {
    let timer;
    const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(msg)), ms); });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await getProviderProfile();
      setProfile(data.provider || data.data || data);
    } catch (err) {
      if (err.response?.status === 404) navigate('/provider/profile', { replace: true });
      else showError(err.response?.data?.message || 'Failed to load profile.');
    } finally { setLoadingProfile(false); }
  }, [navigate]);

  const fetchRequests = useCallback(async () => {
    try {
      const data = await getRelevantRequests();
      setRequests(data.requests || data.data || []);
    } catch (err) {
      if (err.response?.status !== 403) showError('Failed to load requests.');
      setRequests([]);
    } finally { setLoadingRequests(false); }
  }, []);

  const fetchActiveRequest = useCallback(async () => {
    try {
      const data = await getActiveProviderRequest();
      setActiveRequest(data.activeRequest || data.data || null);
    } catch (err) {
      if (err.response?.status !== 404) showError(err.response?.data?.message || 'Failed to load active request.');
      setActiveRequest(null);
    } finally { setLoadingActive(false); }
  }, []);

  useEffect(() => {
    fetchProfile(); fetchActiveRequest(); fetchRequests();
  }, [fetchProfile, fetchActiveRequest, fetchRequests]);

  const openAcceptConfirm  = useCallback((id) => setConfirmAcceptId(id), []);
  const closeAcceptConfirm = useCallback(() => { if (acceptingId) return; setConfirmAcceptId(null); }, [acceptingId]);

  const handleAccept = useCallback(async (request) => {
    setConfirmAcceptId(null);
    if (!request?._id) { showError('Request context was lost. Please try again.'); return; }
    setAcceptingId(request._id);
    try {
      await withTimeout(acceptRequest(request._id));
      showSuccess('Request accepted! You are now assigned.');
      setRequests(prev => prev.filter(r => r._id !== request._id));
      window.dispatchEvent(new Event(REQUEST_STATUS_REFRESH_EVENT));
      fetchActiveRequest(); fetchProfile();
    } catch (err) { showError(err.response?.data?.message || err.message || 'Failed to accept request.'); }
    finally { setAcceptingId(null); }
  }, [fetchActiveRequest, fetchProfile, withTimeout]);

  const handleMarkInProgress = useCallback(async () => {
    if (!activeRequest) return;
    setStatusLoading('in_progress');
    try {
      await withTimeout(updateRequestStatus(activeRequest._id, 'in_progress'));
      setActiveRequest(prev => prev ? { ...prev, status: 'in_progress' } : prev);
      showSuccess('Active request marked as in progress.');
      window.dispatchEvent(new Event(REQUEST_STATUS_REFRESH_EVENT));
      await Promise.allSettled([fetchActiveRequest()]);
    } catch (err) { showError(err.response?.data?.message || err.message || 'Failed to update request status.'); }
    finally { setStatusLoading(''); }
  }, [activeRequest, fetchActiveRequest, withTimeout]);

  const handleMarkCompleted = useCallback(async () => {
    setConfirmCompleteOpen(false);
    if (!activeRequest) { showError('Active request context was lost. Please refresh and try again.'); return; }
    setStatusLoading('completed');
    try {
      await withTimeout(updateRequestStatus(activeRequest._id, 'completed'));
      setActiveRequest(null);
      showSuccess('Request marked as completed. Great work.');
      window.dispatchEvent(new Event(REQUEST_STATUS_REFRESH_EVENT));
      await Promise.allSettled([fetchProfile(), fetchRequests(), fetchActiveRequest()]);
    } catch (err) { showError(err.response?.data?.message || err.message || 'Failed to complete request.'); }
    finally { setStatusLoading(''); }
  }, [activeRequest, fetchProfile, fetchRequests, fetchActiveRequest, withTimeout]);

  const closeCompleteModal = useCallback(() => {
    if (statusLoading === 'completed') return;
    setConfirmCompleteOpen(false);
  }, [statusLoading]);

  const serviceTypeMeta = SERVICE_TYPES.find(s => s.value === profile?.serviceType);

  return (
    <Navbar title="Dashboard">
      <div className="page-wrapper">

        <div className="page-header">
          <h1>Provider Dashboard</h1>
          <p>Manage incoming emergency requests and your availability.</p>
        </div>

        {error && (
          <div className="alert alert-error anim-fade-up" style={{ marginBottom: '20px' }}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{error}</span>
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', display: 'flex' }}><X size={15} /></button>
          </div>
        )}
        {successMsg && (
          <div className="alert alert-success anim-fade-up" style={{ marginBottom: '20px' }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />{successMsg}
          </div>
        )}
{loadingProfile ? <Loader variant="card" message="Loading your profile…" /> : profile ? (
          <>
            <div className="anim-fade-up" style={{
              background: 'linear-gradient(135deg, var(--green-900) 0%, var(--green-700) 55%, var(--green-600) 100%)',
              borderRadius: 'var(--radius-xl)', padding: '28px 32px', marginBottom: '20px',
              display: 'flex', alignItems: 'center', gap: '22px', flexWrap: 'wrap',
              position: 'relative', overflow: 'hidden',
              boxShadow: '0 8px 40px rgba(13,61,34,0.25)',
            }}>
<div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />
<div style={{ position: 'absolute', right: '-40px', top: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(42,173,96,0.2)', filter: 'blur(40px)', pointerEvents: 'none' }} />

              <div style={{ position: 'relative', width: '60px', height: '60px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Building2 size={28} color="white" strokeWidth={1.8} />
              </div>

              <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '22px', fontWeight: 800, color: 'white', letterSpacing: '-0.5px', marginBottom: '4px' }}>
                  {profile.organizationName}
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', marginBottom: '12px' }}>
                  {serviceTypeMeta?.label || profile.serviceType}{profile.address ? ` · ${profile.address}` : ''}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {profile.isVerified
                    ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 'var(--radius-full)', padding: '4px 12px', fontSize: '11px', fontWeight: 700, color: 'white' }}>
                        <BadgeCheck size={12} /> Verified
                      </span>
                    : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(214,137,16,0.3)', border: '1px solid rgba(214,137,16,0.5)', borderRadius: 'var(--radius-full)', padding: '4px 12px', fontSize: '11px', fontWeight: 700, color: '#ffd166' }}>
                        <Clock size={12} /> Pending Verification
                      </span>
                  }
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: profile.isAvailable ? 'rgba(42,173,96,0.25)' : 'rgba(255,255,255,0.1)', border: `1px solid ${profile.isAvailable ? 'rgba(42,173,96,0.4)' : 'rgba(255,255,255,0.15)'}`, borderRadius: 'var(--radius-full)', padding: '4px 12px', fontSize: '11px', fontWeight: 700, color: 'white' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: profile.isAvailable ? 'var(--green-400)' : 'rgba(255,255,255,0.4)', ...(profile.isAvailable ? { animation: 'pulse 2s ease-in-out infinite' } : {}) }} />
                    {profile.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </div>
            </div>

            {!profile.isVerified && (
              <div className="alert alert-warning anim-fade-up" style={{ marginBottom: '20px' }}>
                <ShieldAlert size={16} style={{ flexShrink: 0 }} />
                <div><strong>Awaiting Admin Verification</strong> — Your account is under review. Once verified, you will be able to view and accept emergency requests.</div>
              </div>
            )}
          </>
        ) : null}
<div className="section-header" style={{ marginBottom: '16px' }}>
          <div>
            <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Radio size={14} color="var(--green-700)" />
              Active Request
            </div>
            <div className="section-subtitle">Manage the request currently assigned to your organization</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={fetchActiveRequest} style={{ gap: '6px' }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {loadingActive ? <Loader variant="card" message="Checking active request…" />
          : !activeRequest ? (
            <div className="card" style={{ marginBottom: '20px' }}>
              <div className="empty-state" style={{ padding: '44px 24px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-full)', background: 'var(--green-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', animation: 'float 3s ease-in-out infinite' }}>
                  <CheckCircle2 size={30} color="var(--green-500)" strokeWidth={1.8} />
                </div>
                <h3>No active request</h3>
                <p>Accept a request below to start helping someone in need.</p>
              </div>
            </div>
          ) : (
            <div className="card anim-fade-up" style={{ marginBottom: '20px', overflow: 'hidden' }}>
<div style={{ height: '4px', background: EMERGENCY_ACCENT[activeRequest.emergencyType]?.color || 'var(--stone-400)' }} />
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: 'var(--radius-md)', flexShrink: 0,
                      background: EMERGENCY_ACCENT[activeRequest.emergencyType]?.bg || 'var(--green-100)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Zap size={22} color={EMERGENCY_ACCENT[activeRequest.emergencyType]?.color || 'var(--green-700)'} strokeWidth={2} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-dark)' }}>{formatEmergencyType(activeRequest.emergencyType)}</span>
                        <Badge urgency={activeRequest.urgencyLevel} />
                        <Badge status={activeRequest.status} />
                      </div>
                      <p style={{ margin: '0 0 10px', fontSize: '13px', color: 'var(--text-mid)', lineHeight: 1.55, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {activeRequest.description}
                      </p>
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        {activeRequest.address && <span className="request-card-meta"><MapPin size={12} /> {activeRequest.address}</span>}
                        <span className="request-card-meta"><Clock size={12} /> {formatTimeAgo(activeRequest.postedAt)}</span>
                        {activeRequest.requesterId?.name && <span className="request-card-meta"><User size={12} /> {activeRequest.requesterId.name}</span>}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {activeRequest.status === 'accepted' && (
                      <button className="btn btn-secondary btn-sm" onClick={handleMarkInProgress} disabled={!!statusLoading} style={{ gap: '6px' }}>
                        {statusLoading === 'in_progress' ? <><span className="spinner spinner-green" /> Updating…</> : <><ArrowRight size={13} /> Mark In Progress</>}
                      </button>
                    )}
                    {['accepted', 'in_progress'].includes(activeRequest.status) && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        <button className="btn btn-primary btn-sm" onClick={() => setConfirmCompleteOpen(true)} disabled={!!statusLoading} style={{ gap: '6px' }}>
                          {statusLoading === 'completed' ? <><span className="spinner" /> Completing…</> : <><CheckCheck size={13} /> Mark Completed</>}
                        </button>
                        {confirmCompleteOpen && (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '10px 14px', background: 'var(--green-50)', border: '1.5px solid var(--green-100)', borderRadius: 'var(--radius-md)' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Mark this request completed?</span>
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
          )
        }
<div className="section-header" style={{ marginBottom: '16px' }}>
          <div>
            <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Inbox size={15} color="var(--green-700)" />
              Incoming Requests
              {requests.length > 0 && <span className="badge badge-red" style={{ fontSize: '11px' }}>{requests.length} new</span>}
            </div>
            <div className="section-subtitle">Emergency requests matching your service type</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={fetchRequests} style={{ gap: '6px' }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {loadingRequests ? <Loader variant="skeleton" count={3} />
          : requests.length === 0 ? (
            <div className="card">
              <div className="empty-state" style={{ padding: '52px 24px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-full)', background: 'var(--stone-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', animation: 'float 3s ease-in-out infinite' }}>
                  <Inbox size={28} color="var(--stone-400)" strokeWidth={1.8} />
                </div>
                <h3>No incoming requests</h3>
                <p>{profile?.isVerified ? 'No open requests match your service type right now. Check back soon.' : 'You will see requests here once your account is verified.'}</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {requests.map((req, idx) => {
                const accent = EMERGENCY_ACCENT[req.emergencyType] || EMERGENCY_ACCENT.other;
                return (
                  <div key={req._id} className="card card-hover anim-fade-up" style={{ overflow: 'hidden', animationDelay: `${idx * 50}ms` }}>
                    <div style={{ height: '3px', background: accent.color }} />
                    <div className="card-body">
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                          <div style={{
                            width: '48px', height: '48px', borderRadius: 'var(--radius-md)', flexShrink: 0,
                            background: accent.bg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Zap size={22} color={accent.color} strokeWidth={2} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                              <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-dark)' }}>{formatEmergencyType(req.emergencyType)}</span>
                              <Badge urgency={req.urgencyLevel} />
                              <Badge status={req.status} />
                            </div>
                            <p style={{ margin: '0 0 10px', fontSize: '13px', color: 'var(--text-mid)', lineHeight: 1.55, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {req.description}
                            </p>
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                              {req.address && <span className="request-card-meta"><MapPin size={12} /> {req.address}</span>}
                              <span className="request-card-meta"><Clock size={12} /> {formatTimeAgo(req.postedAt)}</span>
                              {req.requesterId?.name && <span className="request-card-meta"><User size={12} /> {req.requesterId.name}</span>}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
                          <button className="btn btn-primary btn-sm" disabled={!!acceptingId} onClick={() => openAcceptConfirm(req._id)} style={{ gap: '6px' }}>
                            {acceptingId === req._id ? <><span className="spinner" /> Accepting…</> : <><CheckCircle2 size={13} /> Accept</>}
                          </button>
                          {confirmAcceptId === req._id && (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '10px 14px', background: 'var(--green-50)', border: '1.5px solid var(--green-100)', borderRadius: 'var(--radius-md)' }}>
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Accept this request?</span>
                              <button className="btn btn-primary btn-sm" onClick={() => handleAccept(req)} disabled={!!acceptingId}>Yes</button>
                              <button className="btn btn-ghost btn-sm" onClick={closeAcceptConfirm} disabled={!!acceptingId}>Cancel</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        }
      </div>
    </Navbar>
  );
}