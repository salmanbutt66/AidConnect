// src/pages/user/MyRequests.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar.jsx';
import RequestTable from '../../components/dashboard/RequestTable.jsx';
import RequestCard from '../../components/cards/RequestCard.jsx';
import StatsCard from '../../components/dashboard/StatsCard.jsx';
import Modal from '../../components/common/Modal.jsx';
import Loader from '../../components/common/Loader.jsx';
import useRequests from '../../hooks/useRequests.js';
import { DEFAULT_FILTERS } from '../../hooks/useRequests.js';

const REQUEST_STATUS_REFRESH_EVENT = 'aidconnect:request-status-changed';

// ─── View toggle ──────────────────────────────────────────────────────────────
function ViewToggle({ view, onChange }) {
  return (
    <div
      style={{
        display: 'flex',
        background: 'var(--stone-200)',
        borderRadius: 'var(--radius-sm)',
        padding: '3px',
        gap: '2px',
      }}
    >
      {[
        { value: 'cards', icon: '▦', label: 'Cards' },
        { value: 'table', icon: '☰', label: 'Table' },
      ].map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: '5px 12px',
            borderRadius: 'var(--radius-xs)',
            border: 'none',
            background: view === opt.value ? 'white' : 'transparent',
            color: view === opt.value ? 'var(--text-dark)' : 'var(--text-muted)',
            fontWeight: view === opt.value ? 600 : 500,
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all var(--t-fast)',
            boxShadow: view === opt.value ? 'var(--shadow-xs)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <span>{opt.icon}</span>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Status tab bar ───────────────────────────────────────────────────────────
function StatusTabs({ active, onChange, counts }) {
  const tabs = [
    { value: '',            label: 'All'         },
    { value: 'posted',      label: 'Posted'      },
    { value: 'accepted',    label: 'Accepted'    },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed',   label: 'Completed'   },
    { value: 'cancelled',   label: 'Cancelled'   },
  ];

  return (
    <div className="tabs" style={{ marginBottom: '20px' }}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          className={`tab-btn${active === tab.value ? ' active' : ''}`}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
          {counts[tab.value] !== undefined && counts[tab.value] > 0 && (
            <span
              style={{
                marginLeft: '6px',
                fontSize: '10px',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: 'var(--radius-full)',
                background: active === tab.value ? 'var(--green-700)' : 'var(--stone-200)',
                color: active === tab.value ? 'white' : 'var(--text-muted)',
              }}
            >
              {counts[tab.value]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── MyRequests ───────────────────────────────────────────────────────────────
export default function MyRequests() {
  const navigate = useNavigate();

  const {
    requests,
    pagination,
    loading,
    actionLoading,
    error,
    filters,
    setFilters,
    resetFilters,
    fetchMyRequests,
    cancelMyRequest,
    clearError,
  } = useRequests();

  const [view,         setView]         = useState('cards');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [successMsg,   setSuccessMsg]   = useState('');
  const [statusCounts, setStatusCounts] = useState({});

  // ── Initial fetch ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetchMyRequests({ page: 1, limit: 10 });
  }, []);

  useEffect(() => {
    const handleRefresh = () => fetchMyRequests({ ...filters, page: 1, limit: 10 });

    window.addEventListener(REQUEST_STATUS_REFRESH_EVENT, handleRefresh);
    return () => window.removeEventListener(REQUEST_STATUS_REFRESH_EVENT, handleRefresh);
  }, [filters, fetchMyRequests]);

  // ── Derive status counts ───────────────────────────────────────────────────
  useEffect(() => {
    if (!requests.length) return;
    const counts = {};
    requests.forEach((r) => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });
    counts[''] = requests.length;
    setStatusCounts(counts);
  }, [requests]);

  // ── Derived stats — from Rabia's branch ───────────────────────────────────
  const activeCount    = requests.filter((r) =>
    ['posted', 'accepted', 'in_progress'].includes(r.status)
  ).length;
  const completedCount = requests.filter((r) => r.status === 'completed').length;
  const cancelledCount = requests.filter((r) => r.status === 'cancelled').length;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleFilterChange = useCallback((key, value) => {
    const updated = { ...filters, [key]: value, page: 1 };
    setFilters(updated);
    fetchMyRequests(updated);
  }, [filters, setFilters, fetchMyRequests]);

  const handleStatusTab = useCallback((status) => {
    const updated = { ...filters, status, page: 1 };
    setFilters(updated);
    fetchMyRequests(updated);
  }, [filters, setFilters, fetchMyRequests]);

  const handleFilterReset = useCallback(() => {
    resetFilters();
    fetchMyRequests({ page: 1, limit: 10 });
  }, [resetFilters, fetchMyRequests]);

  const handlePageChange = useCallback((page) => {
    const updated = { ...filters, page };
    setFilters(updated);
    fetchMyRequests(updated);
  }, [filters, setFilters, fetchMyRequests]);

  const handleCancelConfirm = useCallback(async () => {
    if (!cancelTarget) return;
    try {
      await cancelMyRequest(cancelTarget);
      setCancelTarget(null);
      setSuccessMsg('Request cancelled successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
      setCancelTarget(null);
    }
  }, [cancelTarget, cancelMyRequest]);

  return (
    <Navbar title="My Requests">
      <div className="page-wrapper">

        {/* ── Page header ───────────────────────────────────────────────── */}
        <div className="page-header">
          <div className="flex-between">
            <div>
              <h1>My Requests</h1>
              <p>Track and manage all your emergency requests.</p>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/user/create-request')}
            >
              🆘 New Request
            </button>
          </div>
        </div>

        {/* ── Stats row — from Rabia's branch ───────────────────────────── */}
        <div className="grid-4" style={{ marginBottom: '24px' }}>
          <StatsCard
            label="Total Requests"
            value={pagination.total || requests.length}
            icon="📋"
            color="blue"
            loading={loading}
            delay={0}
          />
          <StatsCard
            label="Active Now"
            value={activeCount}
            icon="🚨"
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
            value={cancelledCount}
            icon="✕"
            color="red"
            loading={loading}
            delay={300}
          />
        </div>

        {/* ── Success alert ─────────────────────────────────────────────── */}
        {successMsg && (
          <div className="alert alert-success anim-fade-up" style={{ marginBottom: '20px' }}>
            <span className="alert-icon">✅</span>
            {successMsg}
          </div>
        )}

        {/* ── Error alert ───────────────────────────────────────────────── */}
        {error && (
          <div className="alert alert-error anim-fade-up" style={{ marginBottom: '20px' }}>
            <span className="alert-icon">⚠️</span>
            {error}
            <button
              onClick={clearError}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--danger)',
                fontWeight: 700,
                fontSize: '14px',
              }}
            >✕</button>
          </div>
        )}

        {/* ── Main card ─────────────────────────────────────────────────── */}
        <div className="card anim-fade-up delay-100">
          <div className="card-header">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <StatusTabs
                active={filters.status || ''}
                onChange={handleStatusTab}
                counts={statusCounts}
              />
              <ViewToggle view={view} onChange={setView} />
            </div>
          </div>

          <div className="card-body">

            {/* ── Cards view ──────────────────────────────────────────── */}
            {view === 'cards' && (
              <>
                <div className="filter-bar">
                  <div className="search-input-wrap">
                    <span className="search-icon">🔍</span>
                    <input
                      type="text"
                      className="form-input search-input"
                      placeholder="Search requests…"
                      value={filters.search || ''}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                  </div>
                </div>

                {loading ? (
                  <Loader variant="skeleton" count={4} />
                ) : requests.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <h3>
                      {filters.status
                        ? `No ${filters.status.replace('_', ' ')} requests`
                        : 'No requests yet'
                      }
                    </h3>
                    <p>
                      {filters.status
                        ? 'Try a different status filter or post a new request.'
                        : 'Post your first emergency request to get help fast.'
                      }
                    </p>
                    <button
                      className="btn btn-primary"
                      onClick={() => navigate('/user/create-request')}
                    >
                      🆘 Post a Request
                    </button>
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: '16px',
                      }}
                    >
                      {requests.map((r) => (
                        <RequestCard
                          key={r._id}
                          request={r}
                          variant="user"
                          onClick={(req) => navigate(`/user/requests/${req._id}`)}
                          onCancel={(id) => setCancelTarget(id)}
                          loading={actionLoading}
                        />
                      ))}
                    </div>

                    {pagination.totalPages > 1 && (
                      <div className="pagination" style={{ marginTop: '24px' }}>
                        <button
                          className="page-btn"
                          disabled={pagination.page <= 1}
                          onClick={() => handlePageChange(pagination.page - 1)}
                        >‹</button>
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                          <button
                            key={p}
                            className={`page-btn${p === pagination.page ? ' active' : ''}`}
                            onClick={() => handlePageChange(p)}
                          >
                            {p}
                          </button>
                        ))}
                        <button
                          className="page-btn"
                          disabled={pagination.page >= pagination.totalPages}
                          onClick={() => handlePageChange(pagination.page + 1)}
                        >›</button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* ── Table view ──────────────────────────────────────────── */}
            {view === 'table' && (
              <RequestTable
                requests={requests}
                pagination={pagination}
                loading={loading}
                filters={filters}
                onFilterChange={handleFilterChange}
                onFilterReset={handleFilterReset}
                onPageChange={handlePageChange}
                variant="user"
                onView={(r) => navigate(`/user/requests/${r._id}`)}
                onCancel={(id) => setCancelTarget(id)}
                actionLoading={actionLoading}
              />
            )}
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
        Are you sure you want to cancel this request? Any volunteers who were
        notified will be informed. This cannot be undone.
      </Modal>

    </Navbar>
  );
}