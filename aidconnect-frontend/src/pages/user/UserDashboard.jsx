// src/pages/user/UserDashboard.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar.jsx';
import StatsCard from '../../components/dashboard/StatsCard.jsx';
import RequestCard from '../../components/cards/RequestCard.jsx';
import NotificationPanel from '../../components/dashboard/NotificationPanel.jsx';
import Modal from '../../components/common/Modal.jsx';
import Loader from '../../components/common/Loader.jsx';
import useAuth from '../../hooks/useAuth.js';
import useRequests from '../../hooks/useRequests.js';

const REQUEST_STATUS_REFRESH_EVENT = 'aidconnect:request-status-changed';

// ─── Quick action button ──────────────────────────────────────────────────────
function QuickAction({ icon, label, desc, onClick, color = 'var(--green-800)' }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '16px 20px',
        background: 'white',
        border: '1.5px solid var(--stone-200)',
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all var(--t-base)',
        width: '100%',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--green-300)';
        e.currentTarget.style.boxShadow   = 'var(--shadow-md)';
        e.currentTarget.style.transform   = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--stone-200)';
        e.currentTarget.style.boxShadow   = 'none';
        e.currentTarget.style.transform   = 'translateY(0)';
      }}
    >
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--green-100)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '14px', fontWeight: 700, color, marginBottom: '2px' }}>
          {label}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{desc}</div>
      </div>
      <span style={{ marginLeft: 'auto', color: 'var(--text-light)', fontSize: '16px' }}>›</span>
    </button>
  );
}

// ─── Active request banner ────────────────────────────────────────────────────
function ActiveRequestBanner({ request, onView, onCancel, loading }) {
  const statusColors = {
    posted:      { bg: 'var(--info-bg)',    border: '#b8d9f0', dot: 'dot-blue'   },
    accepted:    { bg: 'var(--warning-bg)', border: '#fce4b3', dot: 'dot-orange' },
    in_progress: { bg: 'var(--warning-bg)', border: '#fce4b3', dot: 'dot-orange' },
  };
  const style = statusColors[request.status] || statusColors.posted;

  return (
    <div
      className="anim-fade-up"
      style={{
        padding: '16px 20px',
        background: style.bg,
        border: `1.5px solid ${style.border}`,
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        marginBottom: '24px',
        flexWrap: 'wrap',
      }}
    >
      <span className={`status-dot ${style.dot} pulse`} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-dark)' }}>
          Active Request —{' '}
          {request.status === 'in_progress'
            ? 'Responder on the way'
            : request.status === 'accepted'
              ? 'Request accepted'
              : 'Awaiting responder'
          }
        </div>
        <div
          style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {request.description}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => onView(request)}>
          View
        </button>
        {request.status === 'posted' && (
          <button
            className="btn btn-danger btn-sm"
            onClick={() => onCancel(request._id)}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : 'Cancel'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── UserDashboard ────────────────────────────────────────────────────────────
export default function UserDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    requests,
    loading,
    actionLoading,
    fetchMyRequests,
    cancelMyRequest,
    clearError,
  } = useRequests();

  const [cancelTarget,  setCancelTarget]  = useState(null);
  const [cancelSuccess, setCancelSuccess] = useState('');

  // ── Fetch on mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchMyRequests({ limit: 10 });
  }, []);

  useEffect(() => {
    const handleRefresh = () => fetchMyRequests({ limit: 10 });

    window.addEventListener(REQUEST_STATUS_REFRESH_EVENT, handleRefresh);
    return () => window.removeEventListener(REQUEST_STATUS_REFRESH_EVENT, handleRefresh);
  }, [fetchMyRequests]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalRequests  = requests.length;
  const activeRequests = requests.filter((r) =>
    ['posted', 'accepted', 'in_progress'].includes(r.status)
  );
  const completedCount = requests.filter((r) => r.status === 'completed').length;
  const latestActive   = activeRequests[0] || null;

  // ── Cancel flow ────────────────────────────────────────────────────────────
  const handleCancelConfirm = useCallback(async () => {
    if (!cancelTarget) return;
    try {
      await cancelMyRequest(cancelTarget);
      setCancelTarget(null);
      setCancelSuccess('Request cancelled successfully.');
      setTimeout(() => setCancelSuccess(''), 3000);
    } catch {
      setCancelTarget(null);
    }
  }, [cancelTarget, cancelMyRequest]);

  // ── Greeting ───────────────────────────────────────────────────────────────
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <Navbar title="Dashboard">
      <div className="page-wrapper">

        {/* ── Welcome header ────────────────────────────────────────────── */}
        <div className="page-header">
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1>{greeting}, {firstName} 👋</h1>
              <p>Here's an overview of your emergency requests and activity.</p>
            </div>
            {/* Prominent CTA — from Rabia's branch */}
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/user/create-request')}
              style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              <span style={{ fontSize: '18px' }}>🆘</span>
              New Emergency Request
            </button>
          </div>
        </div>

        {/* ── Cancel success alert ──────────────────────────────────────── */}
        {cancelSuccess && (
          <div className="alert alert-success anim-fade-up" style={{ marginBottom: '20px' }}>
            <span className="alert-icon">✅</span>
            {cancelSuccess}
          </div>
        )}

        {/* ── Active request banner ─────────────────────────────────────── */}
        {latestActive && (
          <ActiveRequestBanner
            request={latestActive}
            onView={(r) => navigate(`/user/requests/${r._id}`)}
            onCancel={(id) => setCancelTarget(id)}
            loading={actionLoading}
          />
        )}

        {/* ── Stats row ─────────────────────────────────────────────────── */}
        <div className="grid-4" style={{ marginBottom: '28px' }}>
          <StatsCard
            label="Total Requests"
            value={totalRequests}
            icon="📋"
            color="blue"
            loading={loading}
            delay={0}
          />
          <StatsCard
            label="Active"
            value={activeRequests.length}
            icon="🔄"
            color="orange"
            loading={loading}
            delay={100}
          />
          <StatsCard
            label="Completed"
            value={completedCount}
            icon="✅"
            color="green"
            loading={loading}
            delay={200}
          />
          <StatsCard
            label="Cancelled"
            value={requests.filter((r) => r.status === 'cancelled').length}
            icon="✕"
            color="red"
            loading={loading}
            delay={300}
          />
        </div>

        {/* ── Main content grid ─────────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 360px',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Quick actions */}
            <div className="card anim-fade-up delay-200">
              <div className="card-header">
                <div className="section-header" style={{ marginBottom: 0 }}>
                  <div>
                    <div className="section-title">Quick Actions</div>
                    <div className="section-subtitle">What do you need help with?</div>
                  </div>
                </div>
              </div>
              <div className="card-body" style={{ paddingTop: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <QuickAction
                    icon="🆘"
                    label="Post Emergency Request"
                    desc="Get immediate help from volunteers and responders"
                    onClick={() => navigate('/user/create-request')}
                  />
                  <QuickAction
                    icon="📋"
                    label="View All My Requests"
                    desc="Track the status of all your requests"
                    onClick={() => navigate('/user/my-requests')}
                  />
                  <QuickAction
                    icon="👤"
                    label="Update My Profile"
                    desc="Keep your information and location up to date"
                    onClick={() => navigate('/user/profile')}
                  />
                </div>
              </div>
            </div>

            {/* Recent requests */}
            <div className="card anim-fade-up delay-300">
              <div className="card-header">
                <div className="section-header" style={{ marginBottom: 0 }}>
                  <div>
                    <div className="section-title">Recent Requests</div>
                    <div className="section-subtitle">Your latest 5 requests</div>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => navigate('/user/my-requests')}
                  >
                    View all →
                  </button>
                </div>
              </div>
              <div className="card-body" style={{ paddingTop: '16px' }}>
                {loading ? (
                  <Loader variant="skeleton" count={3} />
                ) : requests.length === 0 ? (
                  <div className="empty-state" style={{ padding: '40px 16px' }}>
                    <div className="empty-state-icon">📋</div>
                    <h3>No requests yet</h3>
                    <p>Post your first emergency request and get help fast.</p>
                    <button
                      className="btn btn-primary"
                      onClick={() => navigate('/user/create-request')}
                    >
                      🆘 Post a Request
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {requests.slice(0, 5).map((r) => (
                      <RequestCard
                        key={r._id}
                        request={r}
                        variant="user"
                        onClick={(req) => navigate(`/user/requests/${req._id}`)}
                        onCancel={(id) => setCancelTarget(id)}
                        actionLoading={actionLoading}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Notifications */}
            <div className="anim-fade-up delay-400">
              <NotificationPanel limit={6} />
            </div>

            {/* Emergency tip card — from Rabia's branch */}
            <div
              className="card anim-fade-up delay-500"
              style={{ background: 'var(--green-900)', border: 'none' }}
            >
              <div className="card-body">
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>💡</div>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'white',
                    marginBottom: '6px',
                  }}
                >
                  Emergency Tip
                </div>
                <p
                  style={{
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.75)',
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  Ensure your phone's GPS is enabled when posting a request to
                  help responders find you faster.
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* ── Cancel confirmation modal ──────────────────────────────────── */}
      <Modal
        isOpen={!!cancelTarget}
        onClose={() => { setCancelTarget(null); clearError(); }}
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

    </Navbar>
  );
}