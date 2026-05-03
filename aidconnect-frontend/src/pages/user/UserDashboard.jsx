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
import {
  AlertTriangle,
  ClipboardList,
  User,
  ChevronRight,
  CheckCircle2,
  Loader2,
  Lightbulb,
  MapPin,
  ArrowRight,
  Siren,
  RefreshCw,
  XCircle,
} from 'lucide-react';

const REQUEST_STATUS_REFRESH_EVENT = 'aidconnect:request-status-changed';

/* ── Injected styles ─────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

  .ud-page * { font-family: 'Plus Jakarta Sans', sans-serif !important; }

  @keyframes ud-fade-up {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes ud-pulse-ring {
    0%   { box-shadow: 0 0 0 0 rgba(220,38,38,0.4); }
    70%  { box-shadow: 0 0 0 10px rgba(220,38,38,0); }
    100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); }
  }
  @keyframes ud-blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.4; }
  }

  .ud-anim { animation: ud-fade-up 0.48s cubic-bezier(.22,.68,0,1.2) both; }

  /* quick action button */
  .quick-action-btn {
    display: flex; align-items: center; gap: 14px;
    padding: 15px 18px; background: white;
    border: 1.5px solid #e2e8e3; border-radius: 14px;
    cursor: pointer; text-align: left; width: 100%;
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
  }
  .quick-action-btn:hover {
    border-color: #1a6b3c;
    box-shadow: 0 8px 24px rgba(26,107,60,0.12);
    transform: translateY(-2px);
  }
  .quick-action-btn:hover .qa-icon { background: #1a6b3c; }
  .quick-action-btn:hover .qa-icon svg { color: white !important; }
  .quick-action-btn:hover .qa-chevron { color: #1a6b3c; transform: translateX(3px); }

  .qa-icon {
    width: 42px; height: 42px; border-radius: 11px;
    background: #e0f5e9; display: flex; align-items: center;
    justify-content: center; flex-shrink: 0;
    transition: background 0.2s;
  }
  .qa-chevron { margin-left: auto; color: #c4d4c6; transition: color 0.2s, transform 0.2s; }

  /* active banner */
  .active-banner {
    border-radius: 14px; padding: 16px 20px;
    display: flex; align-items: center; gap: 14px;
    flex-wrap: wrap; margin-bottom: 24px;
    border: 1.5px solid;
  }
  .active-banner.posted    { background: #eff6ff; border-color: #bfdbfe; }
  .active-banner.accepted  { background: #fffbeb; border-color: #fde68a; }
  .active-banner.in_progress { background: #fff7ed; border-color: #fed7aa; }

  .pulse-dot {
    width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
    animation: ud-blink 1.6s ease-in-out infinite;
  }
  .pulse-dot.blue   { background: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.2); }
  .pulse-dot.amber  { background: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,0.2); }
  .pulse-dot.orange { background: #f97316; box-shadow: 0 0 0 3px rgba(249,115,22,0.2); }

  /* emergency cta button */
  .emergency-cta {
    display: inline-flex; align-items: center; gap: 9px;
    background: #dc2626; color: white;
    font-weight: 700; font-size: 14px;
    padding: 12px 22px; border-radius: 12px; border: none;
    cursor: pointer; white-space: nowrap;
    box-shadow: 0 4px 16px rgba(220,38,38,0.35);
    transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
    animation: ud-pulse-ring 2.5s infinite;
  }
  .emergency-cta:hover {
    background: #b91c1c;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(220,38,38,0.40);
  }

  /* tip card */
  .tip-card {
    background: linear-gradient(135deg, #0d3d22 0%, #1a6b3c 100%);
    border-radius: 16px; padding: 22px;
    border: none;
  }

  /* section card */
  .ud-card {
    background: white; border: 1px solid #e2e8e3;
    border-radius: 16px; overflow: hidden;
  }
  .ud-card-header {
    padding: 18px 22px 0;
    display: flex; align-items: center; justify-content: space-between;
  }
  .ud-card-body { padding: 16px 22px 22px; }

  /* success alert */
  .ud-success-alert {
    display: flex; align-items: center; gap: 10px;
    background: #f0fdf4; border: 1px solid #bbf7d0;
    border-radius: 12px; padding: 13px 18px;
    font-size: 13px; font-weight: 600; color: #15803d;
    margin-bottom: 20px;
    animation: ud-fade-up 0.3s ease both;
  }

  /* empty state */
  .ud-empty {
    display: flex; flex-direction: column; align-items: center;
    padding: 44px 16px; text-align: center; gap: 8px;
  }
  .ud-empty-icon {
    width: 56px; height: 56px; border-radius: 16px;
    background: #f0faf4; display: flex; align-items: center;
    justify-content: center; margin-bottom: 8px;
  }

  /* view all link */
  .view-all-btn {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 12px; font-weight: 600; color: #1a6b3c;
    background: none; border: none; cursor: pointer;
    padding: 4px 8px; border-radius: 6px;
    transition: background 0.2s;
    text-decoration: none;
  }
  .view-all-btn:hover { background: #e0f5e9; }
`;

/* ── Quick Action ────────────────────────────────────────────────────────── */
function QuickAction({ Icon, label, desc, onClick }) {
  return (
    <button className="quick-action-btn" onClick={onClick}>
      <div className="qa-icon">
        <Icon size={18} color="#1a6b3c" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#141b11', marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '12px', color: '#6b7a64' }}>{desc}</div>
      </div>
      <ChevronRight size={16} className="qa-chevron" />
    </button>
  );
}

/* ── Active Request Banner ───────────────────────────────────────────────── */
function ActiveRequestBanner({ request, onView, onCancel, loading }) {
  const config = {
    posted:      { cls: 'posted',      dot: 'blue',   label: 'Awaiting a responder'  },
    accepted:    { cls: 'accepted',    dot: 'amber',  label: 'Request accepted'       },
    in_progress: { cls: 'in_progress', dot: 'orange', label: 'Responder on the way'  },
  };
  const c = config[request.status] || config.posted;

  return (
    <div className={`active-banner ${c.cls} ud-anim`}>
      <div className={`pulse-dot ${c.dot}`} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#141b11', marginBottom: '2px' }}>
          Active Request — {c.label}
        </div>
        <div style={{ fontSize: '12px', color: '#6b7a64', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {request.description}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => onView(request)}
          style={{ fontSize: '12px' }}
        >
          View
        </button>
        {request.status === 'posted' && (
          <button
            className="btn btn-danger btn-sm"
            onClick={() => onCancel(request._id)}
            disabled={loading}
            style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            {loading ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <XCircle size={13} />}
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

/* ── UserDashboard ───────────────────────────────────────────────────────── */
export default function UserDashboard() {
  const navigate  = useNavigate();
  const { user }  = useAuth();

  const {
    requests, loading, actionLoading,
    fetchMyRequests, cancelMyRequest, clearError,
  } = useRequests();

  const [cancelTarget,  setCancelTarget]  = useState(null);
  const [cancelSuccess, setCancelSuccess] = useState('');

  useEffect(() => { fetchMyRequests({ limit: 10 }); }, []);

  useEffect(() => {
    const handleRefresh = () => fetchMyRequests({ limit: 10 });
    window.addEventListener(REQUEST_STATUS_REFRESH_EVENT, handleRefresh);
    return () => window.removeEventListener(REQUEST_STATUS_REFRESH_EVENT, handleRefresh);
  }, [fetchMyRequests]);

  const activeRequests = requests.filter(r => ['posted', 'accepted', 'in_progress'].includes(r.status));
  const completedCount = requests.filter(r => r.status === 'completed').length;
  const cancelledCount = requests.filter(r => r.status === 'cancelled').length;
  const latestActive   = activeRequests[0] || null;

  const handleCancelConfirm = useCallback(async () => {
    if (!cancelTarget) return;
    try {
      await cancelMyRequest(cancelTarget);
      setCancelTarget(null);
      setCancelSuccess('Request cancelled successfully.');
      setTimeout(() => setCancelSuccess(''), 3000);
    } catch { setCancelTarget(null); }
  }, [cancelTarget, cancelMyRequest]);

  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <Navbar title="Dashboard">
      <style>{STYLES}</style>
      <div className="page-wrapper ud-page">

        {/* ── Welcome header ───────────────────────────────────────────── */}
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 800, color: '#141b11', margin: 0, letterSpacing: '-0.4px' }}>
                {greeting}, {firstName}
              </h1>
              <p style={{ fontSize: '13.5px', color: '#6b7a64', margin: '4px 0 0' }}>
                Here's an overview of your emergency requests and activity.
              </p>
            </div>
            <button
              className="emergency-cta"
              onClick={() => navigate('/user/create-request')}
            >
              <Siren size={16} />
              New Emergency Request
            </button>
          </div>
        </div>

        {/* ── Cancel success ───────────────────────────────────────────── */}
        {cancelSuccess && (
          <div className="ud-success-alert">
            <CheckCircle2 size={16} color="#16a34a" />
            {cancelSuccess}
          </div>
        )}

        {/* ── Active request banner ────────────────────────────────────── */}
        {latestActive && (
          <ActiveRequestBanner
            request={latestActive}
            onView={r => navigate(`/user/requests/${r._id}`)}
            onCancel={id => setCancelTarget(id)}
            loading={actionLoading}
          />
        )}

        {/* ── Stats row ────────────────────────────────────────────────── */}
        <div className="grid-4" style={{ marginBottom: '28px' }}>
          <StatsCard label="Total Requests" value={requests.length} icon="📋"  color="blue"   loading={loading} delay={0}   />
          <StatsCard label="Active"          value={activeRequests.length}      icon="🔄"  color="orange" loading={loading} delay={100} />
          <StatsCard label="Completed"       value={completedCount}             icon="✅"  color="green"  loading={loading} delay={200} />
          <StatsCard label="Cancelled"       value={cancelledCount}             icon="✕"   color="red"    loading={loading} delay={300} />
        </div>

        {/* ── Main grid ────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '22px', alignItems: 'start' }}>

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Quick actions */}
            <div className="ud-card ud-anim" style={{ animationDelay: '100ms' }}>
              <div className="ud-card-header">
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#141b11' }}>Quick Actions</div>
                  <div style={{ fontSize: '12px', color: '#6b7a64', marginTop: '2px' }}>What do you need help with?</div>
                </div>
              </div>
              <div className="ud-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                <QuickAction
                  Icon={AlertTriangle}
                  label="Post Emergency Request"
                  desc="Get immediate help from volunteers and responders"
                  onClick={() => navigate('/user/create-request')}
                />
                <QuickAction
                  Icon={ClipboardList}
                  label="View All My Requests"
                  desc="Track the status of all your requests"
                  onClick={() => navigate('/user/my-requests')}
                />
                <QuickAction
                  Icon={User}
                  label="Update My Profile"
                  desc="Keep your information and location up to date"
                  onClick={() => navigate('/user/profile')}
                />
              </div>
            </div>

            {/* Recent requests */}
            <div className="ud-card ud-anim" style={{ animationDelay: '180ms' }}>
              <div className="ud-card-header">
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#141b11' }}>Recent Requests</div>
                  <div style={{ fontSize: '12px', color: '#6b7a64', marginTop: '2px' }}>Your latest 5 requests</div>
                </div>
                <button className="view-all-btn" onClick={() => navigate('/user/my-requests')}>
                  View all <ArrowRight size={12} />
                </button>
              </div>
              <div className="ud-card-body">
                {loading ? (
                  <Loader variant="skeleton" count={3} />
                ) : requests.length === 0 ? (
                  <div className="ud-empty">
                    <div className="ud-empty-icon">
                      <ClipboardList size={24} color="#1a6b3c" />
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#141b11' }}>No requests yet</div>
                    <p style={{ fontSize: '13px', color: '#6b7a64', margin: 0 }}>
                      Post your first emergency request and get help fast.
                    </p>
                    <button
                      className="btn btn-primary"
                      onClick={() => navigate('/user/create-request')}
                      style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '7px' }}
                    >
                      <Siren size={14} /> Post a Request
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {requests.slice(0, 5).map(r => (
                      <RequestCard
                        key={r._id}
                        request={r}
                        variant="user"
                        onClick={req => navigate(`/user/requests/${req._id}`)}
                        onCancel={id => setCancelTarget(id)}
                        actionLoading={actionLoading}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            <div className="ud-anim" style={{ animationDelay: '220ms' }}>
              <NotificationPanel limit={6} />
            </div>

            {/* Tip card */}
            <div className="tip-card ud-anim" style={{ animationDelay: '300ms' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '10px',
                background: 'rgba(125,212,154,0.18)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', marginBottom: '14px',
              }}>
                <Lightbulb size={18} color="#7dd49a" />
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'white', marginBottom: '7px' }}>
                Emergency Tip
              </div>
              <p style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.72)', lineHeight: 1.65, margin: '0 0 14px' }}>
                Ensure your phone's GPS is enabled when posting a request to
                help responders find you faster.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>
                <MapPin size={11} />
                Location accuracy matters
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Cancel confirmation modal ─────────────────────────────────── */}
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