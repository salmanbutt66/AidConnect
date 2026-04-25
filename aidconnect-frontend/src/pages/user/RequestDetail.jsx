// src/pages/user/RequestDetail.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

const REQUEST_STATUS_REFRESH_EVENT = 'aidconnect:request-status-changed';

// ─── Detail row ───────────────────────────────────────────────────────────────
function DetailRow({ icon, label, value, valueStyle }) {
  if (!value && value !== 0) return null;
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
      <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>
          {label}
        </div>
        <div style={{ fontSize: '14px', color: 'var(--text-dark)', fontWeight: 500, ...valueStyle }}>
          {value}
        </div>
      </div>
    </div>
  );
}

// ─── Timeline item ────────────────────────────────────────────────────────────
function TimelineItem({ icon, label, time, isLast, color = 'var(--green-500)' }) {
  if (!time) return null;
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
      <div className="feed-dot-line" style={{ alignItems: 'center' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'var(--green-100)',
            border: `2px solid ${color}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        {!isLast && (
          <div style={{ width: '2px', flex: 1, background: 'var(--stone-200)', minHeight: '24px', margin: '4px 0' }} />
        )}
      </div>
      <div style={{ paddingTop: '6px', paddingBottom: isLast ? 0 : '16px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>{label}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
          {formatDateTime(time)}
        </div>
      </div>
    </div>
  );
}

// ─── Star rating picker ───────────────────────────────────────────────────────
function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '28px',
            color: star <= (hovered || value)
              ? '#f39c12'
              : 'var(--stone-300)',
            transition: 'color var(--t-fast), transform var(--t-fast)',
            transform: star <= (hovered || value) ? 'scale(1.15)' : 'scale(1)',
            padding: '2px',
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ─── Rating form (inside modal) ───────────────────────────────────────────────
function RatingForm({ onSubmit, loading }) {
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
      {/* Stars */}
      <div className="form-group">
        <label className="form-label">
          Rating <span style={{ color: 'var(--danger)' }}>*</span>
        </label>
        <StarPicker value={rating} onChange={(v) => { setRating(v); setErrors((p) => ({ ...p, rating: '' })); }} />
        {errors.rating && <div className="form-error">{errors.rating}</div>}
        {rating > 0 && (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
          </div>
        )}
      </div>

      {/* Comment */}
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Comment <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
        <textarea
          className="form-textarea"
          placeholder="Share your experience with the responder…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={300}
          disabled={loading}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {errors.comment
            ? <div className="form-error">{errors.comment}</div>
            : <span />
          }
          <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>{comment.length}/300</span>
        </div>
      </div>

      {/* Submit */}
      <button
        className="btn btn-primary btn-full"
        style={{ marginTop: '16px' }}
        onClick={handleSubmit}
        disabled={loading || rating === 0}
      >
        {loading ? <><span className="spinner" /> Submitting…</> : '⭐ Submit Rating'}
      </button>
    </div>
  );
}

// ─── RequestDetail ────────────────────────────────────────────────────────────
export default function RequestDetail() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { user }  = useAuth();

  const {
    currentRequest: request,
    loading,
    actionLoading,
    error,
    fetchRequestById,
    cancelMyRequest,
    submitRating,
    clearError,
    clearCurrentRequest,
  } = useRequests();

  const [showCancel,  setShowCancel]  = useState(false);
  const [showRating,  setShowRating]  = useState(false);
  const [successMsg,  setSuccessMsg]  = useState('');
  const [ratingDone,  setRatingDone]  = useState(false);

  // ── Fetch on mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchRequestById(id);
    return () => clearCurrentRequest();
  }, [id]);

  useEffect(() => {
    const handleRefresh = () => fetchRequestById(id);

    window.addEventListener(REQUEST_STATUS_REFRESH_EVENT, handleRefresh);
    return () => window.removeEventListener(REQUEST_STATUS_REFRESH_EVENT, handleRefresh);
  }, [id, fetchRequestById]);

  // ── Cancel ─────────────────────────────────────────────────────────────────
  const handleCancelConfirm = useCallback(async () => {
    try {
      await cancelMyRequest(id);
      setShowCancel(false);
      setSuccessMsg('Request cancelled successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch {
      setShowCancel(false);
    }
  }, [id, cancelMyRequest]);

  // ── Rating ─────────────────────────────────────────────────────────────────
  const handleRatingSubmit = useCallback(async (ratingData) => {
    try {
      await submitRating(id, ratingData);
      setShowRating(false);
      setRatingDone(true);
      setSuccessMsg('Thank you for your rating!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch {
      setShowRating(false);
    }
  }, [id, submitRating]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Navbar title="Request Detail">
        <div className="page-wrapper">
          <Loader variant="card" message="Loading request details…" />
        </div>
      </Navbar>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────────────
  if (!loading && !request && error) {
    return (
      <Navbar title="Request Detail">
        <div className="page-wrapper">
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>Request not found</h3>
            <p>This request may have been deleted or you don't have permission to view it.</p>
            <button className="btn btn-primary" onClick={() => navigate('/user/my-requests')}>
              ← Back to My Requests
            </button>
          </div>
        </div>
      </Navbar>
    );
  }

  if (!request) return null;

  const {
    emergencyType,
    urgencyLevel,
    description,
    status,
    address,
    bloodGroupNeeded,
    proofImage,
    postedAt,
    acceptedAt,
    completedAt,
    cancelledAt,
    responseTime,
    resolutionTime,
    isDisasterMode,
    assignedTo,
    assignedType,
  } = request;

  const isOwner  = request.requesterId?._id === user?._id ||
                   request.requesterId === user?._id;
  const isActive = ['posted', 'accepted', 'in_progress'].includes(status);
  const canCancel = isOwner && status === 'posted';
  const canRate   = isOwner && status === 'completed' && !ratingDone;

  // Build timeline events
  const timeline = [
    { icon: '📋', label: 'Request Posted',   time: postedAt,    color: 'var(--info)'        },
    { icon: '✅', label: 'Request Accepted',  time: acceptedAt,  color: 'var(--warning)'     },
    { icon: '🚨', label: 'Responder En Route', time: acceptedAt, color: 'var(--warning)'     },
    { icon: '🎉', label: 'Request Completed', time: completedAt, color: 'var(--green-600)'   },
    { icon: '❌', label: 'Request Cancelled', time: cancelledAt, color: 'var(--danger)'      },
  ].filter((t) => !!t.time);

  return (
    <Navbar title="Request Detail">
      <div className="page-wrapper">

        {/* ── Back button + header ──────────────────────────────────────── */}
        <div className="page-header">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/user/my-requests')}
            style={{ marginBottom: '12px' }}
          >
            ← Back to My Requests
          </button>
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px' }}>{getEmergencyEmoji(emergencyType)}</span>
              <div>
                <h1 style={{ marginBottom: '6px' }}>{formatEmergencyType(emergencyType)} Emergency</h1>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <Badge status={status} dot={status === 'in_progress'} pulse={status === 'in_progress'} />
                  <Badge urgency={urgencyLevel} />
                  {isDisasterMode && <Badge color="red" icon="⚠️">Disaster Mode</Badge>}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {canCancel && (
                <button className="btn btn-danger" onClick={() => setShowCancel(true)}>
                  ✕ Cancel Request
                </button>
              )}
              {canRate && (
                <button className="btn btn-primary" onClick={() => setShowRating(true)}>
                  ⭐ Rate Responder
                </button>
              )}
              {ratingDone && (
                <span className="badge badge-green" style={{ padding: '8px 14px' }}>
                  ✓ Rated
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Success alert ─────────────────────────────────────────────── */}
        {successMsg && (
          <div className="alert alert-success anim-fade-up" style={{ marginBottom: '20px' }}>
            <span className="alert-icon">✅</span>
            {successMsg}
          </div>
        )}

        {/* ── Main content ──────────────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 320px',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          {/* Left — details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Description card */}
            <div className="card anim-fade-up delay-100">
              <div className="card-header">
                <div className="section-title">Description</div>
              </div>
              <div className="card-body" style={{ paddingTop: '14px' }}>
                <p style={{ fontSize: '15px', color: 'var(--text-mid)', lineHeight: 1.8 }}>
                  {description}
                </p>

                {/* Blood group needed */}
                {bloodGroupNeeded && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginTop: '16px',
                      padding: '8px 14px',
                      background: 'var(--danger-bg)',
                      border: '1px solid #f5c6c2',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--danger)',
                    }}
                  >
                    🩸 Blood Group Needed: {bloodGroupNeeded}
                  </div>
                )}

                {/* Proof image */}
                {proofImage && (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Proof Image
                    </div>
                    <a href={proofImage} target="_blank" rel="noopener noreferrer">
                      <img
                        src={proofImage}
                        alt="Proof"
                        style={{
                          maxHeight: '220px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--stone-200)',
                          objectFit: 'cover',
                          width: '100%',
                        }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Details card */}
            <div className="card anim-fade-up delay-200">
              <div className="card-header">
                <div className="section-title">Request Details</div>
              </div>
              <div className="card-body" style={{ paddingTop: '8px' }}>
                <DetailRow icon="📍" label="Location"       value={address} />
                <DetailRow icon="🕐" label="Posted"         value={formatDateTime(postedAt)} />
                <DetailRow icon="✅" label="Accepted At"    value={acceptedAt ? formatDateTime(acceptedAt) : null} />
                <DetailRow icon="🎉" label="Completed At"   value={completedAt ? formatDateTime(completedAt) : null} />
                <DetailRow icon="❌" label="Cancelled At"   value={cancelledAt ? formatDateTime(cancelledAt) : null} />
                <DetailRow
                  icon="⚡"
                  label="Response Time"
                  value={responseTime ? formatDuration(responseTime) : null}
                />
                <DetailRow
                  icon="⏱"
                  label="Resolution Time"
                  value={resolutionTime ? formatDuration(resolutionTime) : null}
                />
              </div>
            </div>

            {/* Assigned responder card */}
            {assignedTo && (
              <div className="card anim-fade-up delay-300">
                <div className="card-header">
                  <div className="section-title">
                    {assignedType === 'Volunteer' ? '🤝 Assigned Volunteer' : '🏥 Assigned Provider'}
                  </div>
                </div>
                <div className="card-body" style={{ paddingTop: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div className="avatar avatar-md">
                      {assignedTo.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-dark)' }}>
                        {assignedTo.name || assignedTo.organizationName || 'Responder'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {assignedType === 'Volunteer' ? 'Volunteer Responder' : 'Service Provider'}
                      </div>
                    </div>
                    {isActive && (
                      <span className="badge badge-green" style={{ marginLeft: 'auto' }}>
                        <span className="status-dot dot-green pulse" />
                        On the way
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right — timeline + status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Status card */}
            <div className="card anim-fade-up delay-100">
              <div className="card-body">
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>
                    {status === 'completed'   ? '🎉'
                   : status === 'cancelled'   ? '❌'
                   : status === 'in_progress' ? '🚨'
                   : status === 'accepted'    ? '✅'
                   : '⏳'}
                  </div>
                  <Badge
                    status={status}
                    dot={status === 'in_progress'}
                    pulse={status === 'in_progress'}
                    style={{ fontSize: '13px', padding: '6px 14px' }}
                  />
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '10px', lineHeight: 1.6 }}>
                    {status === 'posted'      && 'Your request is live. Nearby responders are being notified.'}
                    {status === 'accepted'    && 'A responder has accepted your request and is on the way.'}
                    {status === 'in_progress' && 'Help is on the way. Stay at your location.'}
                    {status === 'completed'   && 'Your request has been resolved. We hope you received the help you needed.'}
                    {status === 'cancelled'   && 'This request was cancelled.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline card */}
            {timeline.length > 0 && (
              <div className="card anim-fade-up delay-200">
                <div className="card-header">
                  <div className="section-title">Timeline</div>
                </div>
                <div className="card-body" style={{ paddingTop: '16px' }}>
                  {timeline.map((item, i) => (
                    <TimelineItem
                      key={i}
                      {...item}
                      isLast={i === timeline.length - 1}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Posted time */}
            <div
              style={{
                padding: '14px 16px',
                background: 'var(--green-50)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--green-100)',
                fontSize: '12px',
                color: 'var(--text-muted)',
                textAlign: 'center',
              }}
            >
              Posted {formatTimeAgo(postedAt)}
            </div>

          </div>
        </div>

      </div>

      {/* ── Cancel modal ──────────────────────────────────────────────────── */}
      <Modal
        isOpen={showCancel}
        onClose={() => { setShowCancel(false); clearError(); }}
        title="Cancel Request"
        icon="⚠️"
        onConfirm={handleCancelConfirm}
        confirmLabel="Yes, Cancel"
        confirmVariant="danger"
        loading={actionLoading}
      >
        Are you sure you want to cancel this request? Volunteers who have been
        notified will be informed. This action cannot be undone.
      </Modal>

      {/* ── Rating modal ──────────────────────────────────────────────────── */}
      <Modal
        isOpen={showRating}
        onClose={() => setShowRating(false)}
        title="Rate Your Responder"
        icon="⭐"
        size="md"
        footer={<span />}
      >
        <RatingForm
          onSubmit={handleRatingSubmit}
          loading={actionLoading}
        />
      </Modal>

    </Navbar>
  );
}