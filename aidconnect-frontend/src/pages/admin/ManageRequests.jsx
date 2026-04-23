import React, { useEffect, useCallback } from 'react';
import Navbar from '../../components/common/Navbar.jsx';
import RequestTable from '../../components/dashboard/RequestTable.jsx';
import StatsCard from '../../components/dashboard/StatsCard.jsx';
import useRequests from '../../hooks/useRequests.js';

export default function ManageRequests() {
  // ─── State & Logic via Custom Hook ──────────────────────────────────────────
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

  // ─── Initial Data Load ──────────────────────────────────────────────────────
  useEffect(() => {
    // Fetches all requests with the current default filter state
    fetchAllRequests({ ...filters });
  }, [fetchAllRequests]);

  // ─── Event Handlers ─────────────────────────────────────────────────────────
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

  const handleCancel = useCallback(async (requestId) => {
    if (window.confirm('Are you sure you want to cancel this request? The user and assigned volunteer will be notified.')) {
      await changeRequestStatus(requestId, 'cancelled');
    }
  }, [changeRequestStatus]);

  const handleDelete = useCallback(async (requestId) => {
    if (window.confirm('WARNING: This will permanently delete the request record. This action cannot be undone.')) {
      await removeRequest(requestId);
    }
  }, [removeRequest]);

  return (
    <Navbar title="Manage All Requests">
      <div className="page-wrapper" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* ─── Top Summary Stats ─── */}
        <div className="grid-3">
          <StatsCard 
            label="Total System Requests" 
            value={pagination.total || 0} 
            icon="📋" 
            color="blue" 
            loading={loading} 
          />
          <StatsCard 
            label="Active Emergencies" 
            value={requests.filter(r => ['posted', 'accepted', 'in_progress'].includes(r.status)).length} 
            icon="🚨" 
            color="red" 
            loading={loading} 
          />
          <StatsCard 
            label="Success Rate" 
            value={78} 
            icon="✅" 
            color="green" 
            format="percent" 
          />
        </div>

        {/* ─── Request Moderation Table ─── */}
        <div className="card" style={{ animation: 'fadeSlideUp var(--t-page) var(--ease) both' }}>
          <div className="card-header">
            <h3 className="section-title">Moderation Queue</h3>
            <p className="section-subtitle">Monitor and moderate incoming emergency requests</p>
          </div>
          
          <div className="card-body" style={{ padding: 0 }}>
            <RequestTable 
              requests={requests}
              pagination={pagination}
              loading={loading}
              actionLoading={actionLoading}
              variant="admin" // Enables admin-only actions like Delete
              
              // Filtering Props
              showFilters={true}
              filters={filters}
              onFilterChange={handleFilterChange}
              onFilterReset={handleFilterReset}
              onPageChange={handlePageChange}
              
              // Admin Action Handlers
              onCancel={handleCancel}
              onDelete={handleDelete}
            />
          </div>
        </div>

      </div>
    </Navbar>
  );
}