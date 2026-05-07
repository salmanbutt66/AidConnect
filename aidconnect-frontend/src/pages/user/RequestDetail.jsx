// src/pages/user/RequestDetail.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/common/Navbar.jsx';
import Badge from '../../components/common/Badge.jsx';
import Modal from '../../components/common/Modal.jsx';
import Loader from '../../components/common/Loader.jsx';
import useRequests from '../../hooks/useRequests.js';
import useAuth from '../../hooks/useAuth.js';
import {
  formatDate,
  formatTimeAgo,
  formatDateTime,
  formatEmergencyType,
  getEmergencyEmoji,
  formatUrgency,
  formatStatus,
  formatDuration,
  formatStars,
} from '../../utils/formatters.js';
import { validateRating, hasErrors } from '../../utils/validators.js';
import {
  MapPin,
  Home,
  Clock,
  CheckCircle2,
  PartyPopper,
  XCircle,
  Zap,
  Timer,
  Droplets,
  Image,
  ArrowLeft,
  Star,
  X,
  AlertTriangle,
  ClipboardList,
  Handshake,
  Building2,
  Search,
  Activity,
  PackageCheck,
  Ban,
  Hourglass,
  Navigation,
  ChevronRight,
  Loader2,
  ShieldAlert,
} from 'lucide-react';

const REQUEST_STATUS_REFRESH_EVENT = 'aidconnect:request-status-changed';

/* ── Styles ──────────────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

  .rd-page * { font-family: 'Plus Jakarta Sans', sans-serif !important; }

  @keyframes rd-fade-up {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes rd-scale-in {
    from { opacity: 0; transform: scale(0.94); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes star-pop {
    0%   { transform: scale(1); }
    40%  { transform: scale(1.35); }
    100% { transform: scale(1); }
  }

  .rd-anim    { animation: rd-fade-up  0.46s cubic-bezier(.22,.68,0,1.2) both; }
  .rd-scale   { animation: rd-scale-in 0.4s  cubic-bezier(.22,.68,0,1.2) both; }

  /* back button */
  .rd-back-btn {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 13px; font-weight: 600; color: #3a4a35;
    background: white; border: 1.5px solid #e2e8e3;
    border-radius: 9px; padding: 7px 14px;
    cursor: pointer; text-decoration: none;
    transition: border-color 0.18s, color 0.18s, background 0.18s;
    margin-bottom: 16px;
  }
  .rd-back-btn:hover { border-color: #1a6b3c; color: #1a6b3c; background: #f0faf4; }

  /* card */
  .rd-card {
    background: white; border: 1px solid #e2e8e3;
    border-radius: 16px; overflow: hidden;
  }
  .rd-card-header {
    padding: 16px 20px;
    border-bottom: 1px solid #f0f4f1;
    font-size: 13px; font-weight: 800; color: #141b11; letter-spacing: -0.2px;
  }
  .rd-card-body { padding: 18px 20px; }

  /* detail row */
  .detail-row {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 11px 0; border-bottom: 1px solid #f4f6f4;
  }
  .detail-row:last-child { border-bottom: none; padding-bottom: 0; }
  .detail-row-icon {
    width: 30px; height: 30px; border-radius: 8px;
    background: #f0f4f1; display: flex; align-items: center;
    justify-content: center; flex-shrink: 0; margin-top: 1px;
  }
  .detail-label {
    font-size: 10.5px; font-weight: 700; color: #9aab94;
    text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 3px;
  }
  .detail-value { font-size: 13.5px; color: #141b11; font-weight: 500; }

  /* timeline */
  .timeline-item {
    display: flex; gap: 14px; align-items: flex-start;
  }
  .timeline-bubble {
    width: 34px; height: 34px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; border: 2px solid;
  }
  .timeline-line {
    width: 2px; background: #e8ede9;
    flex: 1; min-height: 20px; margin: 4px auto 4px;
  }
  .timeline-col { display: flex; flex-direction: column; align-items: center; }

  /* status centre card */
  .status-centre {
    text-align: center; padding: 28px 20px;
  }
  .status-icon-wrap {
    width: 68px; height: 68px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 16px;
  }

  /* star picker */
  .star-btn {
    background: none; border: none; cursor: pointer;
    padding: 3px; transition: transform 0.15s;
  }
  .star-btn:disabled { cursor: not-allowed; opacity: 0.55; }
  .star-btn.active { animation: star-pop 0.25s ease; }

  /* rate btn */
  .rate-btn {
    display: inline-flex; align-items: center; gap: 7px;
    background: #0d3d22; color: white;
    font-weight: 700; font-size: 13px;
    padding: 10px 20px; border-radius: 10px; border: none;
    cursor: pointer;
    box-shadow: 0 3px 12px rgba(13,61,34,0.28);
    transition: transform 0.18s, box-shadow 0.18s, background 0.18s;
  }
  .rate-btn:hover { background: #1a6b3c; transform: translateY(-2px); box-shadow: 0 7px 20px rgba(13,61,34,0.30); }

  /* cancel btn */
  .cancel-req-btn {
    display: inline-flex; align-items: center; gap: 7px;
    background: white; color: #dc2626;
    font-weight: 700; font-size: 13px;
    padding: 10px 20px; border-radius: 10px;
    border: 1.5px solid #fecaca; cursor: pointer;
    transition: background 0.18s, border-color 0.18s;
  }
  .cancel-req-btn:hover { background: #fef2f2; border-color: #dc2626; }

  /* rated badge */
  .rated-chip {
    display: inline-flex; align-items: center; gap: 6px;
    background: #f0fdf4; border: 1.5px solid #bbf7d0;
    color: #16a34a; font-size: 12.5px; font-weight: 700;
    padding: 8px 14px; border-radius: 999px;
  }

  /* alerts */
  .rd-success {
    display: flex; align-items: center; gap: 10px;
    background: #f0fdf4; border: 1px solid #bbf7d0;
    border-radius: 12px; padding: 12px 16px;
    font-size: 13px; font-weight: 600; color: #15803d;
    margin-bottom: 18px; animation: rd-fade-up 0.3s ease both;
  }
  .rd-error {
    display: flex; align-items: center; gap: 10px;
    background: #fef2f2; border: 1px solid #fecaca;
    border-radius: 10px; padding: 11px 14px;
    font-size: 13px; font-weight: 600; color: #dc2626;
    margin-bottom: 14px;
  }

  /* blood group pill */
  .blood-pill {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 7px 14px; background: #fef2f2;
    border: 1.5px solid #fecaca; border-radius: 999px;
    font-size: 13px; font-weight: 700; color: #dc2626;
    margin-top: 14px;
  }

  /* assigned responder */
  .responder-row {
    display: flex; align-items: center; gap: 14px;
  }
  .responder-avatar {
    width: 46px; height: 46px; border-radius: 50%;
    background: linear-gradient(135deg, #0d3d22, #1a6b3c);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; font-weight: 800; color: white;
    flex-shrink: 0;
  }

  /* posted time chip */
  .posted-chip {
    padding: 11px 16px; background: #f0faf4;
    border-radius: 12px; border: 1px solid #c6e8d1;
    font-size: 12px; color: #6b7a64; text-align: center;
  }

  /* not found */
  .rd-not-found {
    display: flex; flex-direction: column; align-items: center;
    padding: 60px 20px; text-align: center; gap: 10px;
  }
  .rd-not-found-icon {
    width: 64px; height: 64px; border-radius: 18px;
    background: #f0f4f1; display: flex; align-items: center;
    justify-content: center; margin-bottom: 8px;
  }
`;

/* ── Status config ───────────────────────────────────────────────────────── */
const STATUS_CONFIG = {
  posted:      { Icon: Hourglass,    bg: '#eff6ff', color: '#2563eb', text: 'Your request is live. Nearby responders are being notified.' },
  accepted:    { Icon: CheckCircle2, bg: '#fffbeb', color: '#d97706', text: 'A responder has accepted your request and is on the way.'   },
  in_progress: { Icon: Activity,     bg: '#fff7ed', color: '#ea580c', text: 'Help is on the way. Stay at your location.'                 },
  completed:   { Icon: PackageCheck, bg: '#f0fdf4', color: '#16a34a', text: 'Your request has been resolved. We hope you received the help you needed.' },
  cancelled:   { Icon: Ban,          bg: '#fef2f2', color: '#dc2626', text: 'This request was cancelled.'                               },
};

/* ── Timeline config ─────────────────────────────────────────────────────── */
function buildTimeline(request) {
  const { postedAt, acceptedAt, completedAt, cancelledAt } = request;
  return [
    { Icon: ClipboardList, label: 'Request Posted',     time: postedAt,    bg: '#eff6ff', color: '#2563eb' },
    { Icon: CheckCircle2,  label: 'Request Accepted',   time: acceptedAt,  bg: '#fffbeb', color: '#d97706' },
    { Icon: Navigation,    label: 'Responder En Route', time: acceptedAt,  bg: '#fff7ed', color: '#ea580c' },
    { Icon: PackageCheck,  label: 'Request Completed',  time: completedAt, bg: '#f0fdf4', color: '#16a34a' },
    { Icon: Ban,           label: 'Request Cancelled',  time: cancelledAt, bg: '#fef2f2', color: '#dc2626' },
  ].filter(t => !!t.time);
}

/* ── Detail Row ──────────────────────────────────────────────────────────── */
function DetailRow({ Icon, label, value, iconColor = '#1a6b3c' }) {
  if (!value && value !== 0) return null;
  return (
    <div className="detail-row">
      <div className="detail-row-icon">
        <Icon size={14} color={iconColor} />
      </div>
      <div style={{ flex: 1 }}>
        <div className="detail-label">{label}</div>
        <div className="detail-value">{value}</div>
      </div>
    </div>
  );
}

/* ── Timeline Item ───────────────────────────────────────────────────────── */
function TimelineItem({ Icon, label, time, bg, color, isLast }) {
  if (!time) return null;
  return (
    <div className="timeline-item" style={{ marginBottom: isLast ? 0 : '4px' }}>
      <div className="timeline-col">
        <div className="timeline-bubble" style={{ background: bg, borderColor: color }}>
          <Icon size={14} color={color} />
        </div>
        {!isLast && <div className="timeline-line" />}
      </div>
      <div style={{ paddingTop: '7px', paddingBottom: isLast ? 0 : '14px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#141b11' }}>{label}</div>
        <div style={{ fontSize: '11.5px', color: '#6b7a64', marginTop: '2px' }}>{formatDateTime(time)}</div>
      </div>
    </div>
  );
}

/* ── Star Picker ─────────────────────────────────────────────────────────── */
function StarPicker({ value, onChange, disabled }) {
  const [hovered, setHovered] = useState(0);
  const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
  return (
    <div>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
        {[1, 2, 3, 4, 5].map(star => {
          const filled = star <= (hovered || value);
          return (
            <button
              key={star}
              type="button"
              className={`star-btn${filled ? ' active' : ''}`}
              onClick={() => !disabled && onChange(star)}
              onMouseEnter={() => !disabled && setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              disabled={disabled}
              style={{ transform: filled ? 'scale(1.18)' : 'scale(1)' }}
            >
              <Star
                size={30}
                fill={filled ? '#f59e0b' : 'none'}
                color={filled ? '#f59e0b' : '#d1d5db'}
                strokeWidth={1.5}
              />
            </button>
          );
        })}
      </div>
      {(hovered || value) > 0 && (
        <div style={{ fontSize: '12px', color: '#6b7a64', marginTop: '2px' }}>
          {labels[hovered || value]}
        </div>
      )}
    </div>
  );
}

/* ── Rating Form ─────────────────────────────────────────────────────────── */
function RatingForm({ onSubmit, loading, error: externalError }) {
  const [rating,  setRating]  = useState(0);
  const [comment, setComment] = useState('');
  const [errors,  setErrors]  = useState({});

  const handleSubmit = () => {
    const errs = validateRating({ rating, comment });
    if (hasErrors(errs)) { setErrors(errs); return; }
    onSubmit({ score: rating, comment: comment.trim() });
  };

  return (
    <div>
      {externalError && (
        <div className="rd-error">
          <AlertTriangle size={14} />
          {externalError}
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Rating <span style={{ color: '#dc2626' }}>*</span></label>
        <StarPicker
          value={rating}
          onChange={v => { setRating(v); setErrors(p => ({ ...p, rating: '' })); }}
          disabled={loading}
        />
        {errors.rating && <div className="form-error">{errors.rating}</div>}
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">
          Comment <span style={{ color: '#9aab94', fontWeight: 400 }}>(optional)</span>
        </label>
        <textarea
          className="form-textarea"
          placeholder="Share your experience with the responder…"
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={3}
          maxLength={300}
          disabled={loading}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {errors.comment ? <div className="form-error">{errors.comment}</div> : <span />}
          <span style={{ fontSize: '11px', color: '#9aab94' }}>{comment.length}/300</span>
        </div>
      </div>

      <button
        className="btn btn-primary btn-full"
        style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        onClick={handleSubmit}
        disabled={loading || rating === 0}
      >
        {loading
          ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</>
          : <><Star size={14} fill="white" /> Submit Rating</>
        }
      </button>
    </div>
  );
}

/* ── RequestDetail ───────────────────────────────────────────────────────── */
export default function RequestDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const {
    currentRequest: request,
    loading, error,
    fetchRequestById, cancelMyRequest, submitRating,
    clearError, clearCurrentRequest,
  } = useRequests();

  const [showCancel,       setShowCancel]       = useState(false);
  const [showRating,       setShowRating]       = useState(false);
  const [successMsg,       setSuccessMsg]       = useState('');
  const [ratingDone,       setRatingDone]       = useState(false);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingError,      setRatingError]      = useState('');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  useEffect(() => {
    fetchRequestById(id);
    return () => clearCurrentRequest();
  }, [id, fetchRequestById, clearCurrentRequest]);

  useEffect(() => {
    const handleRefresh = () => fetchRequestById(id);
    window.addEventListener(REQUEST_STATUS_REFRESH_EVENT, handleRefresh);
    return () => window.removeEventListener(REQUEST_STATUS_REFRESH_EVENT, handleRefresh);
  }, [id, fetchRequestById]);

  useEffect(() => {
    const shouldOpenRating = new URLSearchParams(location.search).get('rate') === '1';
    if (shouldOpenRating && request?.status === 'completed' && !ratingDone) {
      setShowRating(true);
    }
  }, [location.search, request?.status, ratingDone]);

  const handleCancelConfirm = useCallback(async () => {
    setCancelSubmitting(true);
    try {
      await cancelMyRequest(id);
      setShowCancel(false);
      setSuccessMsg('Request cancelled successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch { setShowCancel(false); }
    finally { setCancelSubmitting(false); }
  }, [id, cancelMyRequest]);

  const handleRatingSubmit = useCallback(async (ratingData) => {
    setRatingSubmitting(true);
    setRatingError('');
    try {
      await submitRating(id, ratingData);
      setShowRating(false);
      setRatingDone(true);
      setSuccessMsg('Thank you for your rating!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setRatingError(err?.response?.data?.message || err?.message || 'Failed to submit rating.');
    } finally { setRatingSubmitting(false); }
  }, [id, submitRating]);

  const handleCloseRatingModal = useCallback(() => {
    if (ratingSubmitting) return;
    setShowRating(false);
    setRatingError('');
  }, [ratingSubmitting]);

  /* ── Loading ── */
  if (loading) {
    return (
      <Navbar title="Request Detail">
        <div className="page-wrapper"><Loader variant="card" message="Loading request details…" /></div>
      </Navbar>
    );
  }

  /* ── Not found ── */
  if (!loading && !request && error) {
    return (
      <Navbar title="Request Detail">
        <div className="page-wrapper">
          <div className="rd-not-found">
            <div className="rd-not-found-icon"><Search size={28} color="#6b7a64" /></div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#141b11' }}>Request not found</div>
            <p style={{ fontSize: '13px', color: '#6b7a64', margin: 0 }}>
              This request may have been deleted or you don't have permission to view it.
            </p>
            <button className="btn btn-primary" style={{ marginTop: '12px' }} onClick={() => navigate('/user/my-requests')}>
              Back to My Requests
            </button>
          </div>
        </div>
      </Navbar>
    );
  }

  if (!request) return null;

  const {
    emergencyType, urgencyLevel, description, status,
    address, city, bloodGroupNeeded, proofImage,
    postedAt, acceptedAt, completedAt, cancelledAt,
    responseTime, resolutionTime, isDisasterMode,
    assignedTo, assignedType,
  } = request;

  const requesterId = request.requesterId?._id || request.requesterId;
  const isOwner     = requesterId?.toString() === user?._id?.toString();
  const isActive    = ['posted', 'accepted', 'in_progress'].includes(status);
  const canCancel   = isOwner && status === 'posted';
  const canRate     = isOwner && status === 'completed' && !ratingDone;
  const rateLabel   = assignedType === 'Provider' ? 'Rate Service' : 'Rate Responder';

  const timeline    = buildTimeline(request);
  const statusCfg   = STATUS_CONFIG[status] || STATUS_CONFIG.posted;
  const StatusIcon  = statusCfg.Icon;

  return (
    <Navbar title="Request Detail">
      <style>{STYLES}</style>
      <div className="page-wrapper rd-page">

        {/* ── Page header ──────────────────────────────────────────────── */}
        <div className="page-header">
          <button className="rd-back-btn" onClick={() => navigate('/user/my-requests')}>
            <ArrowLeft size={14} /> Back to My Requests
          </button>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <h1 style={{ fontSize: 'clamp(18px, 3vw, 24px)', fontWeight: 800, color: '#141b11', margin: '0 0 10px', letterSpacing: '-0.4px' }}>
                {formatEmergencyType(emergencyType)} Emergency
              </h1>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <Badge status={status} dot={status === 'in_progress'} pulse={status === 'in_progress'} />
                <Badge urgency={urgencyLevel} />
                {isDisasterMode && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    background: '#fef2f2', border: '1px solid #fecaca',
                    color: '#dc2626', fontSize: '11px', fontWeight: 700,
                    padding: '3px 10px', borderRadius: '999px',
                  }}>
                    <ShieldAlert size={11} /> Disaster Mode
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              {canCancel && (
                <button className="cancel-req-btn" onClick={() => setShowCancel(true)}>
                  <XCircle size={14} /> Cancel Request
                </button>
              )}
              {canRate && (
                <button className="rate-btn" onClick={() => setShowRating(true)}>
                  <Star size={14} fill="white" /> {rateLabel}
                </button>
              )}
              {ratingDone && (
                <div className="rated-chip">
                  <CheckCircle2 size={13} /> Rated
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Success alert ────────────────────────────────────────────── */}
        {successMsg && (
          <div className="rd-success">
            <CheckCircle2 size={15} color="#16a34a" />
            {successMsg}
          </div>
        )}

        {/* ── Main grid ────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '22px', alignItems: 'start' }}>

          {/* ── Left column ──────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Description */}
            <div className="rd-card rd-anim" style={{ animationDelay: '60ms' }}>
              <div className="rd-card-header">Description</div>
              <div className="rd-card-body">
                <p style={{ fontSize: '14.5px', color: '#3a4a35', lineHeight: 1.8, margin: 0 }}>
                  {description}
                </p>
                {bloodGroupNeeded && (
                  <div className="blood-pill">
                    <Droplets size={14} /> Blood Group Needed: {bloodGroupNeeded}
                  </div>
                )}
                {proofImage && (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#9aab94', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Image size={11} /> Proof Image
                    </div>
                    <a href={proofImage} target="_blank" rel="noopener noreferrer">
                      <img src={proofImage} alt="Proof" style={{ maxHeight: '220px', borderRadius: '12px', border: '1px solid #e2e8e3', objectFit: 'cover', width: '100%' }}
                        onError={e => { e.currentTarget.style.display = 'none'; }} />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="rd-card rd-anim" style={{ animationDelay: '120ms' }}>
              <div className="rd-card-header">Request Details</div>
              <div className="rd-card-body" style={{ paddingTop: '10px' }}>
                <DetailRow Icon={MapPin}        label="City"            value={city} />
                <DetailRow Icon={Home}          label="Address"         value={address} />
                <DetailRow Icon={Clock}         label="Posted"          value={formatDateTime(postedAt)} />
                <DetailRow Icon={CheckCircle2}  label="Accepted At"     value={acceptedAt  ? formatDateTime(acceptedAt)  : null} iconColor="#d97706" />
                <DetailRow Icon={PartyPopper}   label="Completed At"    value={completedAt ? formatDateTime(completedAt) : null} iconColor="#16a34a" />
                <DetailRow Icon={XCircle}       label="Cancelled At"    value={cancelledAt ? formatDateTime(cancelledAt) : null} iconColor="#dc2626" />
                <DetailRow Icon={Zap}           label="Response Time"   value={responseTime   ? formatDuration(responseTime)   : null} />
                <DetailRow Icon={Timer}         label="Resolution Time" value={resolutionTime ? formatDuration(resolutionTime) : null} />
              </div>
            </div>

            {/* Assigned responder */}
            {assignedTo && (
              <div className="rd-card rd-anim" style={{ animationDelay: '180ms' }}>
                <div className="rd-card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {assignedType === 'Volunteer'
                    ? <><Handshake size={14} color="#1a6b3c" /> Assigned Volunteer</>
                    : <><Building2 size={14} color="#1a6b3c" /> Assigned Provider</>
                  }
                </div>
                <div className="rd-card-body">
                  <div className="responder-row">
                    <div className="responder-avatar">
                      {(assignedTo.name?.[0] || assignedTo.organizationName?.[0] || '?').toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '14.5px', color: '#141b11' }}>
                        {assignedTo.organizationName || assignedTo.name || 'Responder'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7a64', marginTop: '2px' }}>
                        {assignedType === 'Volunteer' ? 'Volunteer Responder' : 'Service Provider'}
                      </div>
                      {assignedType === 'Provider' && assignedTo.totalRatings > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#6b7a64', marginTop: '4px' }}>
                          <Star size={11} fill="#f59e0b" color="#f59e0b" />
                          {assignedTo.averageRating?.toFixed(1)} · {assignedTo.totalRatings} ratings
                        </div>
                      )}
                    </div>
                    {isActive && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        background: '#f0fdf4', border: '1px solid #bbf7d0',
                        color: '#16a34a', fontSize: '11.5px', fontWeight: 700,
                        padding: '5px 10px', borderRadius: '999px',
                      }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#16a34a', animation: 'pulse 1.5s infinite' }} />
                        On the way
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Right column ─────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Status card */}
            <div className="rd-card rd-anim" style={{ animationDelay: '60ms' }}>
              <div className="status-centre">
                <div className="status-icon-wrap" style={{ background: statusCfg.bg }}>
                  <StatusIcon size={30} color={statusCfg.color} strokeWidth={1.8} />
                </div>
                <Badge status={status} dot={status === 'in_progress'} pulse={status === 'in_progress'} />
                <p style={{ fontSize: '13px', color: '#6b7a64', marginTop: '12px', lineHeight: 1.65, marginBottom: canRate ? '14px' : 0 }}>
                  {statusCfg.text}
                </p>
                {canRate && (
                  <button className="rate-btn" onClick={() => setShowRating(true)}>
                    <Star size={13} fill="white" /> {rateLabel}
                  </button>
                )}
              </div>
            </div>

            {/* Timeline */}
            {timeline.length > 0 && (
              <div className="rd-card rd-anim" style={{ animationDelay: '120ms' }}>
                <div className="rd-card-header">Timeline</div>
                <div className="rd-card-body" style={{ paddingTop: '14px' }}>
                  {timeline.map((item, i) => (
                    <TimelineItem key={i} {...item} isLast={i === timeline.length - 1} />
                  ))}
                </div>
              </div>
            )}

            {/* Posted time */}
            <div className="posted-chip rd-anim" style={{ animationDelay: '180ms' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Clock size={12} color="#6b7a64" />
                Posted {formatTimeAgo(postedAt)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Cancel Modal ─────────────────────────────────────────────────── */}
      <Modal
        isOpen={showCancel}
        onClose={() => { if (cancelSubmitting) return; setShowCancel(false); clearError(); }}
        title="Cancel Request"
        icon={<AlertTriangle size={16} color="#d97706" />}
        onConfirm={handleCancelConfirm}
        confirmLabel={cancelSubmitting ? 'Cancelling…' : 'Yes, Cancel'}
        confirmVariant="danger"
        loading={cancelSubmitting}
      >
        Are you sure you want to cancel this request? Volunteers who have been notified will be informed. This action cannot be undone.
      </Modal>

      {/* ── Rating Modal ─────────────────────────────────────────────────── */}
      <Modal
        isOpen={showRating}
        onClose={handleCloseRatingModal}
        title={assignedType === 'Provider' ? 'Rate Your Service Provider' : 'Rate Your Responder'}
        icon={<Star size={16} color="#f59e0b" fill="#f59e0b" />}
        size="md"
        footer={<span />}
      >
        <RatingForm
          onSubmit={handleRatingSubmit}
          loading={ratingSubmitting}
          error={ratingError}
        />
      </Modal>
    </Navbar>
  );
}