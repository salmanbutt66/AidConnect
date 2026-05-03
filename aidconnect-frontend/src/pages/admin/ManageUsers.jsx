// src/pages/admin/ManageUsers.jsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  X,
  Users,
  ShieldCheck,
  Ban,
  Trash2,
} from 'lucide-react';
import Navbar from '../../components/common/Navbar.jsx';
import Badge from '../../components/common/Badge.jsx';
import Loader from '../../components/common/Loader.jsx';
import Modal from '../../components/common/Modal.jsx';
import { getAllUsers, verifyUser, banUser, deleteUser } from '../../api/admin.api.js';
import { formatDate, getInitials, formatRole } from '../../utils/formatters.js';

export default function ManageUsers() {
  const [users,         setUsers]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error,         setError]         = useState('');
  const [successMsg,    setSuccessMsg]    = useState('');
  const [refreshing,    setRefreshing]    = useState(false);

  const [banModal,    setBanModal]    = useState({ isOpen: false, userId: null, reason: '', reasonError: '' });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, userId: null });

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getAllUsers();
      setUsers(response.data || response);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleVerify = useCallback(async (id) => {
    setActionLoading(true);
    setError('');
    try {
      await verifyUser(id);
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, isVerified: true } : u));
      showSuccess('User verified successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify user.');
    } finally {
      setActionLoading(false);
    }
  }, []);

  const handleBan = useCallback(async () => {
    if (!banModal.reason.trim()) {
      setBanModal((p) => ({ ...p, reasonError: 'Please provide a reason for banning.' }));
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      await banUser(banModal.userId, banModal.reason);
      setUsers((prev) => prev.map((u) => u._id === banModal.userId ? { ...u, isBanned: true } : u));
      setBanModal({ isOpen: false, userId: null, reason: '', reasonError: '' });
      showSuccess('User banned successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to ban user.');
      setBanModal({ isOpen: false, userId: null, reason: '', reasonError: '' });
    } finally {
      setActionLoading(false);
    }
  }, [banModal]);

  const handleDelete = useCallback(async () => {
    setActionLoading(true);
    setError('');
    try {
      await deleteUser(deleteModal.userId);
      setUsers((prev) => prev.filter((u) => u._id !== deleteModal.userId));
      setDeleteModal({ isOpen: false, userId: null });
      showSuccess('User account deleted.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user.');
      setDeleteModal({ isOpen: false, userId: null });
    } finally {
      setActionLoading(false);
    }
  }, [deleteModal.userId]);

  return (
    <Navbar title="Manage Users">
      <div className="page-wrapper">

        {/* ── Page header ───────────────────────────────────────────── */}
        <div className="page-header">
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1>Manage Users</h1>
              <p>Verify, moderate, and remove user accounts across the platform.</p>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleManualRefresh}
              disabled={refreshing}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw
                size={14}
                style={{ transition: 'transform 0.6s', transform: refreshing ? 'rotate(360deg)' : 'none' }}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* ── Alerts ────────────────────────────────────────────────── */}
        {error && (
          <div
            className="alert alert-error anim-fade-up"
            style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <AlertTriangle size={16} />
            <span style={{ flex: 1 }}>{error}</span>
            <button
              onClick={() => setError('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', display: 'flex' }}
            >
              <X size={16} />
            </button>
          </div>
        )}
        {successMsg && (
          <div
            className="alert alert-success anim-fade-up"
            style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <CheckCircle2 size={16} />
            {successMsg}
          </div>
        )}

        {/* ── User table card ───────────────────────────────────────── */}
        <div className="card anim-fade-up delay-100">
          <div className="card-header">
            <div className="section-header" style={{ marginBottom: 0 }}>
              <div>
                <div className="section-title">User Directory</div>
                <div className="section-subtitle">Verify, moderate, or remove user accounts across the network</div>
              </div>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
                {users.length} user{users.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="card-body" style={{ paddingTop: '8px' }}>
            {loading ? (
              <Loader variant="skeleton" count={5} />
            ) : users.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><Users size={36} strokeWidth={1.5} /></div>
                <h3>No users found</h3>
                <p>No registered users on the platform yet.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id}>

                        {/* User info */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="avatar avatar-sm">{getInitials(u.name)}</div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-dark)' }}>
                                {u.name}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                {u.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td><Badge role={u.role} /></td>

                        {/* Status */}
                        <td>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {u.isBanned && <Badge color="red">Banned</Badge>}
                            <Badge color={u.isVerified ? 'green' : 'orange'}>
                              {u.isVerified ? 'Verified' : 'Unverified'}
                            </Badge>
                          </div>
                        </td>

                        {/* Joined */}
                        <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          {formatDate(u.createdAt)}
                        </td>

                        {/* Actions */}
                        <td onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            {!u.isVerified && (
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleVerify(u._id)}
                                disabled={actionLoading}
                                title="Verify user"
                                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <ShieldCheck size={13} />
                                Verify
                              </button>
                            )}
                            {!u.isBanned && (
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ color: 'var(--warning)', borderColor: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '4px' }}
                                onClick={() => setBanModal({ isOpen: true, userId: u._id, reason: '', reasonError: '' })}
                                disabled={actionLoading}
                                title="Ban user"
                              >
                                <Ban size={13} />
                                Ban
                              </button>
                            )}
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => setDeleteModal({ isOpen: true, userId: u._id })}
                              disabled={actionLoading}
                              title="Delete account"
                              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── Ban modal ──────────────────────────────────────────────── */}
      <Modal
        isOpen={banModal.isOpen}
        onClose={() => setBanModal({ isOpen: false, userId: null, reason: '', reasonError: '' })}
        title="Ban User"
        icon={<Ban size={18} />}
        onConfirm={handleBan}
        confirmLabel="Confirm Ban"
        confirmVariant="danger"
        loading={actionLoading}
      >
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">
            Reason for banning <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <textarea
            className={`form-textarea ${banModal.reasonError ? 'error' : ''}`}
            rows={3}
            placeholder="e.g. Repeated spam or false emergency requests…"
            value={banModal.reason}
            onChange={(e) => setBanModal((p) => ({ ...p, reason: e.target.value, reasonError: '' }))}
          />
          {banModal.reasonError && (
            <div className="form-error">{banModal.reasonError}</div>
          )}
        </div>
      </Modal>

      {/* ── Delete modal ───────────────────────────────────────────── */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, userId: null })}
        title="Delete Account"
        icon={<AlertTriangle size={18} />}
        onConfirm={handleDelete}
        confirmLabel="Delete Permanently"
        confirmVariant="danger"
        loading={actionLoading}
      >
        Are you sure you want to delete this account? This action is permanent
        and will remove all associated user data from the system.
      </Modal>

    </Navbar>
  );
}