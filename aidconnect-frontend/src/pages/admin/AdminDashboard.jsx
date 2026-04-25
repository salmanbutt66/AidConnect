// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar.jsx';
import StatsCard from '../../components/dashboard/StatsCard.jsx';
import RequestTable from '../../components/dashboard/RequestTable.jsx';
import Modal from '../../components/common/Modal.jsx';
import useRequests from '../../hooks/useRequests.js';
import { getAnalyticsOverview } from '../../api/admin.api.js';

const ADMIN_STATS_REFRESH_EVENT = 'aidconnect:admin-stats-refresh';

const isBackendConnectivityIssue = (errOrMsg) => {
  const msg = typeof errOrMsg === 'string'
    ? errOrMsg
    : errOrMsg?.message || errOrMsg?.code || '';
  const text = String(msg).toLowerCase();

  return (
    text.includes('network error') ||
    text.includes('econnrefused') ||
    text.includes('failed to fetch') ||
    text.includes('timeout')
  );
};

export default function AdminDashboard() {
  const navigate = useNavigate();

  const {
    requests,
    pagination,
    loading: requestsLoading,
    actionLoading,
    error: requestsError,
    filters,
    setFilters,
    resetFilters,
    fetchAllRequests,
    removeRequest,
    changeRequestStatus,
  } = useRequests();

  const [stats,        setStats]        = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError,   setStatsError]   = useState('');
  const [backendDisconnected, setBackendDisconnected] = useState(false);

  const loadStats = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setStatsLoading(true);
    try {
      const data = await getAnalyticsOverview();
      setStats(data.data || data);
      setStatsError('');
      setBackendDisconnected(false);
    } catch (err) {
      setStatsError('Failed to load system analytics.');
      if (isBackendConnectivityIssue(err)) {
        setBackendDisconnected(true);
      }
    } finally {
      if (!silent) setStatsLoading(false);
    }
  }, []);

  // FIX: Modal state instead of window.confirm
  const [cancelTarget, setCancelTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── Fetch on mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchAllRequests({ ...filters, limit: 10 });
    loadStats();
  }, []);

  // ── Keep overview cards fresh without requiring hard refresh ──────────────
  useEffect(() => {
    const interval = setInterval(() => {
      loadStats({ silent: true });
    }, 15000);

    const handleFocus = () => loadStats({ silent: true });
    const handleStatsRefresh = () => loadStats({ silent: true });
    window.addEventListener('focus', handleFocus);
    window.addEventListener(ADMIN_STATS_REFRESH_EVENT, handleStatsRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener(ADMIN_STATS_REFRESH_EVENT, handleStatsRefresh);
    };
  }, [loadStats]);

  useEffect(() => {
    if (!requestsError) return;
    if (isBackendConnectivityIssue(requestsError)) {
      setBackendDisconnected(true);
    }
  }, [requestsError]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handlePageChange = useCallback((newPage) => {
    fetchAllRequests({ ...filters, page: newPage });
  }, [fetchAllRequests, filters]);

  const handleFilterChange = useCallback((key, value) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    fetchAllRequests(newFilters);
  }, [filters, setFilters, fetchAllRequests]);

  const handleFilterReset = useCallback(() => {
    resetFilters();
    fetchAllRequests({ page: 1, limit: 10 });
  }, [resetFilters, fetchAllRequests]);

  // FIX: use Modal confirmation instead of window.confirm
  const handleCancelConfirm = useCallback(async () => {
    if (!cancelTarget) return;
    try {
      await changeRequestStatus(cancelTarget, 'cancelled');
    } finally {
      setCancelTarget(null);
    }
  }, [cancelTarget, changeRequestStatus]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await removeRequest(deleteTarget);
    } finally {
      setDeleteTarget(null);
    }
  }, [deleteTarget, removeRequest]);

  return (
    <Navbar title="Dashboard">
      <div className="page-wrapper">

        {/* ── Page header ───────────────────────────────────────────────── */}
        <div className="page-header">
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1>Admin Dashboard</h1>
              <p>System overview and real-time request monitoring.</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => loadStats()}
              >
                🔄 Refresh Stats
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigate('/admin/analytics')}
              >
                📊 Full Analytics
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigate('/admin/users')}
              >
                👥 Manage Users
              </button>
            </div>
          </div>
        </div>

        {/* ── Stats error ───────────────────────────────────────────────── */}
        {backendDisconnected && (
          <div className="alert alert-warning anim-fade-up" style={{ marginBottom: '20px' }}>
            <span className="alert-icon">⚠️</span>
            Backend connection lost. Start or restart the API server on port 5000.
          </div>
        )}

        {statsError && (
          <div className="alert alert-error anim-fade-up" style={{ marginBottom: '20px' }}>
            <span className="alert-icon">⚠️</span>
            {statsError}
          </div>
        )}

        {/* ── Analytics stats row ───────────────────────────────────────── */}
        {/* FIX: removed redundant inline display:grid — grid-4 already handles it */}
        <div className="grid-4" style={{ marginBottom: '28px' }}>
          <StatsCard
            label="Total Users"
            value={stats?.totalUsers ?? 0}
            icon="👥"
            color="blue"
            loading={statsLoading}
            delay={0}
          />
          <StatsCard
            label="Active Volunteers"
            value={stats?.activeVolunteers ?? 0}
            icon="🤝"
            color="green"
            loading={statsLoading}
            delay={100}
          />
          <StatsCard
            label="Verified Providers"
            value={stats?.verifiedProviders ?? 0}
            icon="🏥"
            color="orange"
            loading={statsLoading}
            delay={200}
          />
          <StatsCard
            label="Critical Emergencies"
            value={stats?.criticalRequests ?? 0}
            icon="🚨"
            color="red"
            loading={statsLoading}
            delay={300}
          />
        </div>

        {/* ── Request feed ──────────────────────────────────────────────── */}
        <div className="card anim-fade-up delay-400">
          <div className="card-header">
            <div className="section-header" style={{ marginBottom: 0 }}>
              <div>
                <div className="section-title">System-Wide Request Feed</div>
                <div className="section-subtitle">
                  Monitor, filter, and moderate all platform emergencies
                </div>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigate('/admin/requests')}
              >
                View all →
              </button>
            </div>
          </div>

          {/* FIX: removed padding:0 override — RequestTable handles its own spacing */}
          <div className="card-body">
            <RequestTable
              requests={requests}
              pagination={pagination}
              loading={requestsLoading}
              actionLoading={actionLoading}
              variant="admin"
              onCancel={(id) => setCancelTarget(id)}
              onDelete={(id) => setDeleteTarget(id)}
              showFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onFilterReset={handleFilterReset}
              onPageChange={handlePageChange}
            />
          </div>
        </div>

      </div>

      {/* ── Cancel confirmation modal ──────────────────────────────────── */}
      <Modal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Cancel Request"
        icon="⚠️"
        onConfirm={handleCancelConfirm}
        confirmLabel="Yes, Cancel"
        confirmVariant="danger"
        loading={actionLoading}
      >
        Are you sure you want to cancel this active request? The requester
        and any assigned responders will be notified.
      </Modal>

      {/* ── Delete confirmation modal ──────────────────────────────────── */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Request"
        icon="🗑"
        onConfirm={handleDeleteConfirm}
        confirmLabel="Delete Permanently"
        confirmVariant="danger"
        loading={actionLoading}
      >
        This will permanently delete the request and all associated data.
        This action cannot be undone.
      </Modal>

    </Navbar>
  );
}