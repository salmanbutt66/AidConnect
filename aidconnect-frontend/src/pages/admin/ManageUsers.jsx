import React, { useEffect, useState, useCallback } from 'react';
import Navbar from '../../components/common/Navbar.jsx';
import Badge from '../../components/common/Badge.jsx';
import Loader from '../../components/common/Loader.jsx';
import Modal from '../../components/common/Modal.jsx';
import { getAllUsers, verifyUser, banUser, deleteUser } from '../../api/admin.api.js';
import { formatDateTime, getInitials } from '../../utils/formatters.js';

export default function ManageUsers() {
  // ─── State ─────────────────────────────────────────────────────────────────
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modals
  const [banModal, setBanModal] = useState({ isOpen: false, userId: null, reason: '' });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, userId: null });

  // ─── Data Fetching ─────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllUsers();
      setUsers(response.data || response);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ─── Action Handlers ───────────────────────────────────────────────────────
  const handleVerify = async (id) => {
    setActionLoading(true);
    try {
      await verifyUser(id);
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isVerified: true } : u));
    } catch (err) {
      alert("Failed to verify user.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBan = async () => {
    if (!banModal.reason.trim()) return alert("Please provide a reason.");
    setActionLoading(true);
    try {
      await banUser(banModal.userId, banModal.reason);
      setUsers(prev => prev.map(u => u._id === banModal.userId ? { ...u, isBanned: true } : u));
      setBanModal({ isOpen: false, userId: null, reason: '' });
    } catch (err) {
      alert("Failed to ban user.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await deleteUser(deleteModal.userId);
      setUsers(prev => prev.filter(u => u._id !== deleteModal.userId));
      setDeleteModal({ isOpen: false, userId: null });
    } catch (err) {
      alert("Failed to delete user.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Navbar title="Manage Platform Users">
      <div className="page-wrapper" style={{ padding: '24px' }}>
        
        <div className="card" style={{ animation: 'fadeSlideUp var(--t-page) var(--ease) both' }}>
          <div className="card-header">
            <h3 className="section-title">User Directory</h3>
            <p className="section-subtitle">Verify, moderate, or remove user accounts across the network</p>
          </div>

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
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan="5"><Loader variant="skeleton" count={1} /></td>
                    </tr>
                  ))
                ) : users.map((u) => (
                  <tr key={u._id}>
                    {/* User Info */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="avatar avatar-sm">{getInitials(u.name)}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-dark)' }}>{u.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td><Badge role={u.role} /></td>

                    {/* Status */}
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {u.isBanned && <Badge color="red">Banned</Badge>}
                        <Badge color={u.isVerified ? 'green' : 'orange'}>
                          {u.isVerified ? 'Verified' : 'Unverified'}
                        </Badge>
                      </div>
                    </td>

                    {/* Joined */}
                    <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {formatDateTime(u.createdAt)}
                    </td>

                    {/* Actions */}
                    <td>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        {!u.isVerified && (
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleVerify(u._id)}
                            disabled={actionLoading}
                          >
                            Verify
                          </button>
                        )}
                        {!u.isBanned && (
                          <button 
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--danger)' }}
                            onClick={() => setBanModal({ isOpen: true, userId: u._id, reason: '' })}
                            disabled={actionLoading}
                          >
                            Ban
                          </button>
                        )}
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => setDeleteModal({ isOpen: true, userId: u._id })}
                          disabled={actionLoading}
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Ban Modal ── */}
        <Modal
          isOpen={banModal.isOpen}
          title="Ban User"
          icon="🚫"
          confirmLabel="Confirm Ban"
          confirmVariant="danger"
          loading={actionLoading}
          onClose={() => setBanModal({ isOpen: false, userId: null, reason: '' })}
          onConfirm={handleBan}
        >
          <div className="form-group">
            <label className="form-label">Reason for banning</label>
            <textarea 
              className="form-input" 
              rows="3"
              placeholder="e.g. Repeated spam or false emergency requests..."
              value={banModal.reason}
              onChange={(e) => setBanModal(p => ({ ...p, reason: e.target.value }))}
            />
          </div>
        </Modal>

        {/* ── Delete Modal ── */}
        <Modal
          isOpen={deleteModal.isOpen}
          title="Delete Account"
          icon="⚠️"
          confirmLabel="Delete Permanently"
          confirmVariant="danger"
          loading={actionLoading}
          onClose={() => setDeleteModal({ isOpen: false, userId: null })}
          onConfirm={handleDelete}
        >
          Are you sure you want to delete this account? This action is permanent and will remove all associated user data from the system.
        </Modal>

      </div>
    </Navbar>
  );
}