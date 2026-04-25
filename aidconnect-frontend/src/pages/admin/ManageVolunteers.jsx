// src/pages/admin/ManageVolunteers.jsx
import React, { useEffect, useState, useCallback } from 'react';
import Navbar from '../../components/common/Navbar.jsx';
import VolunteerCard from '../../components/cards/VolunteerCard.jsx';
import Loader from '../../components/common/Loader.jsx';
import Modal from '../../components/common/Modal.jsx';
import {
  getAllVolunteers,
  approveVolunteer,
  suspendVolunteer,
  unsuspendVolunteer,
} from '../../api/volunteer.api.js';

const ADMIN_STATS_REFRESH_EVENT = 'aidconnect:admin-stats-refresh';

export default function ManageVolunteers() {

  const [volunteers,    setVolunteers]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // FIX: replaced all alert() calls with local error state + alert-error div
  const [error,      setError]      = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [filters, setFilters] = useState({ search: '', status: 'all' });

  // Suspend modal
  const [suspendModal,      setSuspendModal]      = useState({ isOpen: false, volunteerId: null, reason: '' });
  const [suspendReasonError, setSuspendReasonError] = useState('');

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // ── Fetch volunteers ───────────────────────────────────────────────────────
  const fetchVolunteers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getAllVolunteers();
      setVolunteers(response.volunteers || response.data || response || []);
    } catch (err) {
      // FIX: console.error + alert → local error state
      setError('Failed to load volunteers. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVolunteers(); }, [fetchVolunteers]);

  // ── Approve ────────────────────────────────────────────────────────────────
  const handleApprove = useCallback(async (id) => {
    setActionLoading(true);
    setError('');
    try {
      await approveVolunteer(id);
      setVolunteers((prev) =>
        prev.map((v) => v._id === id ? { ...v, isApproved: true } : v)
      );
      window.dispatchEvent(new Event(ADMIN_STATS_REFRESH_EVENT));
      showSuccess('Volunteer approved successfully.');
    } catch (err) {
      // FIX: alert() → local error state
      setError(err.response?.data?.message || 'Approval failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  }, []);

  // ── Suspend ────────────────────────────────────────────────────────────────
  const handleSuspend = useCallback(async () => {
    // FIX: alert() for validation → inline error inside modal
    if (!suspendModal.reason.trim()) {
      setSuspendReasonError('Please provide a reason for suspension.');
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      await suspendVolunteer(suspendModal.volunteerId, suspendModal.reason);
      setVolunteers((prev) =>
        prev.map((v) =>
          v._id === suspendModal.volunteerId
            ? { ...v, isSuspended: true, suspendedReason: suspendModal.reason }
            : v
        )
      );
      window.dispatchEvent(new Event(ADMIN_STATS_REFRESH_EVENT));
      setSuspendModal({ isOpen: false, volunteerId: null, reason: '' });
      setSuspendReasonError('');
      showSuccess('Volunteer suspended.');
    } catch (err) {
      // FIX: alert() → local error state
      setError(err.response?.data?.message || 'Failed to suspend volunteer.');
      setSuspendModal({ isOpen: false, volunteerId: null, reason: '' });
    } finally {
      setActionLoading(false);
    }
  }, [suspendModal]);

  // ── Unsuspend ──────────────────────────────────────────────────────────────
  const handleUnsuspend = useCallback(async (id) => {
    setActionLoading(true);
    setError('');
    try {
      await unsuspendVolunteer(id);
      setVolunteers((prev) =>
        prev.map((v) =>
          v._id === id ? { ...v, isSuspended: false, suspendedReason: null } : v
        )
      );
      window.dispatchEvent(new Event(ADMIN_STATS_REFRESH_EVENT));
      showSuccess('Suspension lifted.');
    } catch (err) {
      // FIX: alert() → local error state
      setError(err.response?.data?.message || 'Failed to lift suspension.');
    } finally {
      setActionLoading(false);
    }
  }, []);

  // ── Local filtering ────────────────────────────────────────────────────────
  const filteredVolunteers = volunteers.filter((v) => {
    const name         = v.user?.name || '';
    const matchSearch  = name.toLowerCase().includes(filters.search.toLowerCase());
    const matchStatus  =
      filters.status === 'all'      ? true :
      filters.status === 'pending'  ? !v.isApproved :
      filters.status === 'approved' ? v.isApproved  : true;
    return matchSearch && matchStatus;
  });

  return (
    <Navbar title="Manage Volunteers">
      <div className="page-wrapper">

        {/* ── Page header ───────────────────────────────────────────────── */}
        <div className="page-header">
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1>Manage Volunteers 🤝</h1>
              <p>Approve, suspend, and oversee all volunteer accounts.</p>
            </div>
            <div
              style={{
                fontSize: '13px',
                color: 'var(--text-muted)',
                fontWeight: 600,
              }}
            >
              {filteredVolunteers.length} volunteer{filteredVolunteers.length !== 1 ? 's' : ''} shown
            </div>
          </div>
        </div>

        {/* ── Alerts ────────────────────────────────────────────────────── */}
        {error && (
          <div className="alert alert-error anim-fade-up" style={{ marginBottom: '20px' }}>
            <span className="alert-icon">⚠️</span>
            {error}
            <button
              onClick={() => setError('')}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontWeight: 700 }}
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
        <div className="filter-bar">
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="form-input search-input"
              placeholder="Search volunteers by name…"
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            />
          </div>
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '160px' }}
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
          >
            <option value="all">All Volunteers</option>
            <option value="approved">Approved Only</option>
            <option value="pending">Pending Approval</option>
          </select>
        </div>

        {/* ── Content ───────────────────────────────────────────────────── */}
        {loading ? (
          <Loader variant="skeleton" count={4} />
        ) : filteredVolunteers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🤝</div>
            <h3>No volunteers found</h3>
            <p>
              {filters.search || filters.status !== 'all'
                ? 'Adjust your search or filter to see results.'
                : 'No volunteer applications yet.'
              }
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
        ) : (
          <div className="grid-3">
            {filteredVolunteers.map((volunteer) => (
              <VolunteerCard
                key={volunteer._id}
                volunteer={volunteer}
                variant="admin"
                loading={actionLoading}
                onApprove={handleApprove}
                onUnsuspend={handleUnsuspend}
                onSuspend={(id) => {
                  setSuspendModal({ isOpen: true, volunteerId: id, reason: '' });
                  setSuspendReasonError('');
                }}
              />
            ))}
          </div>
        )}

      </div>

      {/* ── Suspend modal ──────────────────────────────────────────────── */}
      <Modal
        isOpen={suspendModal.isOpen}
        title="Suspend Volunteer"
        icon="🚫"
        confirmLabel="Confirm Suspension"
        confirmVariant="danger"
        loading={actionLoading}
        onClose={() => {
          setSuspendModal({ isOpen: false, volunteerId: null, reason: '' });
          setSuspendReasonError('');
        }}
        onConfirm={handleSuspend}
      >
        <div>
          <p style={{ fontSize: '14px', color: 'var(--text-mid)', lineHeight: 1.7, marginBottom: '16px' }}>
            This volunteer will be suspended and unable to accept requests
            until the suspension is lifted.
          </p>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              Reason for suspension <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            {/* FIX: form-input → form-textarea on textarea element */}
            <textarea
              className={`form-textarea ${suspendReasonError ? 'error' : ''}`}
              rows={3}
              placeholder="e.g. Inactivity or community policy violation…"
              value={suspendModal.reason}
              onChange={(e) => {
                setSuspendModal((p) => ({ ...p, reason: e.target.value }));
                if (suspendReasonError) setSuspendReasonError('');
              }}
            />
            {/* FIX: inline reason validation error instead of alert() */}
            {suspendReasonError
              ? <div className="form-error">{suspendReasonError}</div>
              : <div className="form-hint">This reason will be visible to the volunteer.</div>
            }
          </div>
        </div>
      </Modal>

    </Navbar>
  );
}