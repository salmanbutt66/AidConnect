import React, { useEffect, useState, useCallback } from 'react';
import {
  ClipboardList,
  Siren,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react';
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

  const [cancelTarget, setCancelTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error,        setError]        = useState('');
  const [successMsg,   setSuccessMsg]   = useState('');

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  useEffect(() => {
    fetchAllRequests({ ...filters });
  }, [fetchAllRequests]);

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

  const activeCount    = requests.filter((r) => ['posted', 'accepted', 'in_progress'].includes(r.status)).length;
  const completedCount = requests.filter((r) => r.status === 'completed').length;
  const totalCount     = pagination.total || 0;
  const successRate    = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <Navbar title="Manage Requests">
      <div className="page-wrapper">
<div className="page-header">
          <h1>Manage Requests</h1>
          <p>Monitor, moderate, and manage all emergency requests on the platform.</p>
        </div>
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
<div className="grid-3" style={{ marginBottom: '28px' }}>
          <StatsCard label="Total Requests"    value={totalCount}   icon={<ClipboardList size={20} />} color="blue"  loading={loading} delay={0} />
          <StatsCard label="Active Emergencies" value={activeCount} icon={<Siren size={20} />}         color="red"   loading={loading} delay={100} />
          <StatsCard label="Success Rate"       value={successRate} icon={<CheckCircle2 size={20} />}  color="green" format="percent" loading={loading} delay={200} />
        </div>
<div className="card anim-fade-up delay-200">
          <div className="card-header">
            <div className="section-header" style={{ marginBottom: 0 }}>
              <div>
                <div className="section-title">Moderation Queue</div>
                <div className="section-subtitle">Monitor and moderate incoming emergency requests</div>
              </div>
            </div>
          </div>
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
<Modal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Cancel Request"
        icon={<AlertTriangle size={18} />}
        onConfirm={handleCancelConfirm}
        confirmLabel="Yes, Cancel"
        confirmVariant="danger"
        loading={actionLoading}
      >
        Are you sure you want to cancel this request? The user and any assigned
        volunteer will be notified. This cannot be undone.
      </Modal>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Request"
        icon={<AlertTriangle size={18} />}
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