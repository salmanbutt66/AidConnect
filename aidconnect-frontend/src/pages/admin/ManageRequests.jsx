// src/pages/admin/ManageRequests.jsx
import React, { useEffect, useState, useCallback } from 'react';
import Navbar from '../../components/common/Navbar.jsx';
import RequestTable from '../../components/dashboard/RequestTable.jsx';
import StatsCard from '../../components/dashboard/StatsCard.jsx';
import Modal from '../../components/common/Modal.jsx';
import useRequests from '../../hooks/useRequests.js';

export default function ManageRequests() {
  const {
    requests,
    pagination,
    loading,
    actionLoading,
    filters,
    setFilters,
    resetFilters,
    fetchAllRequests,
    removeRequest,
    changeRequestStatus,
  } = useRequests();

  // FIX: Modal state instead of window.confirm
  const [cancelTarget, setCancelTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error,        setError]        = useState('');
  const [successMsg,   setSuccessMsg]   = useState('');

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // ── Initial fetch ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetchAllRequests({ ...filters });
  }, [fetchAllRequests]);

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

  const handleCancelConfirm = useCallback(async () => {
    if (!cancelTarget) return;
    setError('');
    try {
      await changeRequestStatus(cancelTarget, 'cancelled');
      setCancelTarget(null);
      showSuccess('Request cancelled successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel request.');
      setCancelTarget(null);
    }
  }, [cancelTarget, changeRequestStatus]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setError('');
    try {
      await removeRequest(deleteTarget);
      setDeleteTarget(null);
      showSuccess('Request deleted successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete request.');
      setDeleteTarget(null);
    }
  }, [deleteTarget, removeRequest]);

  // FIX: derive success rate from real data instead of hardcoded 78
  const activeCount    = requests.filter((r) =>
    ['posted', 'accepted', 'in_progress'].includes(r.status)
  ).length;
  const completedCount = requests.filter((r) => r.status === 'completed').length;
  const totalCount     = pagination.total || 0;
  const successRate    = totalCount > 0
    ? Math.round((completedCount / totalCount) * 100)
    : 0;

  return (
    <Navbar title="Manage Requests">
      <div className="page-wrapper">

        {/* ── Page header ───────────────────────────────────────────────── */}
        <div className="page-header">
          <h1>Manage Requests</h1>
          <p>Monitor, moderate, and manage all emergency requests on the platform.</p>
        </div>

        {/* ── Alerts ────────────────────────────────────────────────────── */}
        {error && (
          <div className="alert alert-error anim-fade-up" style={{ marginBottom: '20px' }}>
            <span className="alert-icon">⚠️</span>
            {error}
            <button
              onClick={() => setError('')}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--danger)',
                fontWeight: 700,
              }}
            >✕</button>
          </div>
        )}
        {successMsg && (
          <div className="alert alert-success anim-fade-up" style={{ marginBottom: '20px' }}>
            <span className="alert-icon">✅</span>
            {successMsg}
          </div>
        )}

        {/* ── Stats row ─────────────────────────────────────────────────── */}
        <div className="grid-3" style={{ marginBottom: '28px' }}>
          <StatsCard
            label="Total Requests"
            value={totalCount}
            icon="📋"
            color="blue"
            loading={loading}
            delay={0}
          />
          <StatsCard
            label="Active Emergencies"
            value={activeCount}
            icon="🚨"
            color="red"
            loading={loading}
            delay={100}
          />
          {/* FIX: derived from real data, not hardcoded */}
          <StatsCard
            label="Success Rate"
            value={successRate}
            icon="✅"
            color="green"
            format="percent"
            loading={loading}
            delay={200}
          />
        </div>

        {/* ── Moderation table ──────────────────────────────────────────── */}
        <div className="card anim-fade-up delay-200">
          <div className="card-header">
            {/* FIX: section-title on div, section-subtitle wrapped properly */}
            <div className="section-header" style={{ marginBottom: 0 }}>
              <div>
                <div className="section-title">Moderation Queue</div>
                <div className="section-subtitle">
                  Monitor and moderate incoming emergency requests
                </div>
              </div>
            </div>
          </div>

          {/* FIX: removed padding:0 override */}
          <div className="card-body">
            <RequestTable
              requests={requests}
              pagination={pagination}
              loading={loading}
              actionLoading={actionLoading}
              variant="admin"
              showFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onFilterReset={handleFilterReset}
              onPageChange={handlePageChange}
              onCancel={(id) => setCancelTarget(id)}
              onDelete={(id) => setDeleteTarget(id)}
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
        Are you sure you want to cancel this request? The user and any assigned
        volunteer will be notified. This cannot be undone.
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
        This will permanently delete the request record and all associated data.
        This action cannot be undone.
      </Modal>

    </Navbar>
  );
}