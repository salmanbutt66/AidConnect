// src/pages/admin/ManageProviders.jsx
import React, { useEffect, useState, useCallback } from 'react';
import Navbar from '../../components/common/Navbar.jsx';
import ProviderCard from '../../components/cards/ProviderCard.jsx';
import Loader from '../../components/common/Loader.jsx';
import Modal from '../../components/common/Modal.jsx';
import { getAllProviders, verifyProvider, suspendProvider } from '../../api/provider.api.js';

export default function ManageProviders() {
  const [providers,     setProviders]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  // FIX: local error state instead of console.error / alert
  const [error,         setError]         = useState('');
  const [successMsg,    setSuccessMsg]    = useState('');

  const [suspendModal, setSuspendModal] = useState({ isOpen: false, providerId: null });
  const [filters,      setFilters]      = useState({ search: '', status: 'all' });

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // ── Fetch providers ────────────────────────────────────────────────────────
  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllProviders();
      setProviders(data.data || data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load providers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  // ── Verify ─────────────────────────────────────────────────────────────────
  const handleVerify = useCallback(async (id) => {
    setActionLoading(true);
    setError('');
    try {
      await verifyProvider(id);
      setProviders((prev) =>
        prev.map((p) => p._id === id ? { ...p, isVerified: true } : p)
      );
      showSuccess('Provider verified successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  }, []);

  // ── Suspend ────────────────────────────────────────────────────────────────
  const handleSuspend = useCallback(async () => {
    setActionLoading(true);
    setError('');
    try {
      await suspendProvider(suspendModal.providerId);
      setProviders((prev) =>
        prev.map((p) =>
          p._id === suspendModal.providerId ? { ...p, isAvailable: false } : p
        )
      );
      setSuspendModal({ isOpen: false, providerId: null });
      showSuccess('Provider suspended successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Suspension failed. Please try again.');
      setSuspendModal({ isOpen: false, providerId: null });
    } finally {
      setActionLoading(false);
    }
  }, [suspendModal.providerId]);

  // ── Client-side filter ─────────────────────────────────────────────────────
  const filteredProviders = providers.filter((p) => {
    const matchesSearch = p.organizationName
      ?.toLowerCase()
      .includes(filters.search.toLowerCase());
    const matchesStatus =
      filters.status === 'all'
        ? true
        : filters.status === 'pending'
          ? !p.isVerified
          : p.isVerified;
    return matchesSearch && matchesStatus;
  });

  return (
    <Navbar title="Manage Providers">
      <div className="page-wrapper">

        {/* ── Page header ───────────────────────────────────────────────── */}
        <div className="page-header">
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1>Manage Organizations</h1>
              <p>Verify, monitor and manage all registered service providers.</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={fetchProviders}>
              🔄 Refresh
            </button>
          </div>
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

        {/* ── Filter bar ────────────────────────────────────────────────── */}
        {/* FIX: removed redundant marginBottom — filter-bar class already has it */}
        <div className="filter-bar">
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="form-input search-input"
              placeholder="Search by organization name…"
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            />
          </div>
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '170px' }}
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
          >
            <option value="all">All Providers</option>
            <option value="verified">Verified Only</option>
            <option value="pending">Pending Verification</option>
          </select>

          {/* Result count */}
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {filteredProviders.length} result{filteredProviders.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── Content ───────────────────────────────────────────────────── */}
        {loading ? (
          <Loader variant="skeleton" count={4} />
        ) : filteredProviders.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">🏥</div>
              <h3>No providers found</h3>
              <p>
                {filters.search || filters.status !== 'all'
                  ? 'Adjust your filters or clear search.'
                  : 'No organizations have registered yet.'}
              </p>
              {(filters.search || filters.status !== 'all') && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setFilters({ search: '', status: 'all' })}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid-3">
            {/* FIX: removed unused i parameter */}
            {filteredProviders.map((provider) => (
              <ProviderCard
                key={provider._id}
                provider={provider}
                variant="admin"
                loading={actionLoading}
                onVerify={handleVerify}
                onSuspend={(id) => setSuspendModal({ isOpen: true, providerId: id })}
              />
            ))}
          </div>
        )}

      </div>

      {/* ── Suspend confirmation modal ─────────────────────────────────── */}
      <Modal
        isOpen={suspendModal.isOpen}
        onClose={() => setSuspendModal({ isOpen: false, providerId: null })}
        title="Suspend Organization"
        icon="⚠️"
        onConfirm={handleSuspend}
        confirmLabel="Suspend"
        confirmVariant="danger"
        loading={actionLoading}
      >
        Are you sure you want to suspend this organization? They will no longer
        be able to accept emergency requests until unsuspended.
      </Modal>

    </Navbar>
  );
}