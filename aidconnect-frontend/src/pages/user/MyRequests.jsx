import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar.jsx';
import RequestTable from '../../components/dashboard/RequestTable.jsx';
import StatsCard from '../../components/dashboard/StatsCard.jsx';
import useRequests from '../../hooks/useRequests.js';

export default function MyRequests() {
  const navigate = useNavigate();
  
  // ─── Request Logic Hook ──────────────────────────────────────────────────
  const {
    requests,
    pagination,
    loading,
    actionLoading,
    filters,
    setFilters,
    resetFilters,
    fetchMyRequests,
    cancelMyRequest,
  } = useRequests();

  // ─── Data Fetching ───────────────────────────────────────────────────────
  useEffect(() => {
    // Initial fetch of user's personal requests
    fetchMyRequests({ ...filters });
  }, [fetchMyRequests]);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handlePageChange = useCallback((newPage) => {
    fetchMyRequests({ ...filters, page: newPage });
  }, [fetchMyRequests, filters]);

  const handleFilterChange = useCallback((key, value) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    fetchMyRequests(newFilters);
  }, [filters, setFilters, fetchMyRequests]);

  const handleFilterReset = useCallback(() => {
    resetFilters();
    fetchMyRequests({ page: 1, limit: 10 });
  }, [resetFilters, fetchMyRequests]);

  const handleViewDetail = (request) => {
    navigate(`/user/requests/${request._id}`);
  };

  const handleCancel = async (requestId) => {
    if (window.confirm('Are you sure you want to cancel this request? Responders will be notified.')) {
      await cancelMyRequest(requestId);
    }
  };

  // ─── Derived Stats ────────────────────────────────────────────────────────
  const activeCount = requests.filter(r => ['posted', 'accepted', 'in_progress'].includes(r.status)).length;
  const completedCount = requests.filter(r => r.status === 'completed').length;

  return (
    <Navbar title="My Help Requests">
      <div className="page-wrapper" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* ─── Summary Stats ─── */}
        <div className="grid-3">
          <StatsCard 
            label="Total Requests" 
            value={pagination.total || 0} 
            icon="📋" 
            color="blue" 
            loading={loading} 
          />
          <StatsCard 
            label="Active Now" 
            value={activeCount} 
            icon="🚨" 
            color="orange" 
            loading={loading} 
          />
          <StatsCard 
            label="Help Received" 
            value={completedCount} 
            icon="✅" 
            color="green" 
            loading={loading} 
          />
        </div>

        {/* ─── Request History Table ─── */}
        <div className="card" style={{ animation: 'fadeSlideUp var(--t-page) var(--ease) both' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className="section-title">Request History</h3>
              <p className="section-subtitle">Manage and track your emergency assistance history</p>
            </div>
            <button className="btn btn-primary" onClick={() => navigate('/user/create-request')}>
              + New Request
            </button>
          </div>
          
          <div className="card-body" style={{ padding: 0 }}>
            <RequestTable 
              requests={requests}
              pagination={pagination}
              loading={loading}
              actionLoading={actionLoading}
              variant="user" // Enables user-specific actions like "Cancel own"
              
              // Filtering Props
              showFilters={true}
              filters={filters}
              onFilterChange={handleFilterChange}
              onFilterReset={handleFilterReset}
              onPageChange={handlePageChange}
              
              // Action Handlers
              onView={handleViewDetail}
              onCancel={handleCancel}
            />
          </div>
        </div>

      </div>
    </Navbar>
  );
}