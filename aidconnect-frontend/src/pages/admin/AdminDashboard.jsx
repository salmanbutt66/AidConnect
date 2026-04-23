import React, { useEffect, useState, useCallback } from 'react';
import Navbar from '../../components/common/Navbar.jsx';
import StatsCard from '../../components/dashboard/StatsCard.jsx';
import RequestTable from '../../components/dashboard/RequestTable.jsx';
import useRequests from '../../hooks/useRequests.js';
import { getAnalyticsOverview } from '../../api/admin.api.js';

export default function AdminDashboard() {
  // ─── State & Hooks ─────────────────────────────────────────────────────────
  const { 
    requests, 
    pagination, 
    loading: requestsLoading, 
    actionLoading,
    filters,
    setFilters,
    resetFilters,
    fetchAllRequests, 
    removeRequest,
    changeRequestStatus
  } = useRequests();

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  // ─── Fetch Data on Mount ───────────────────────────────────────────────────
  useEffect(() => {
    // 1. Fetch the paginated request feed
    fetchAllRequests({ ...filters, limit: 10 });
    
    // 2. Fetch the top-level analytics overview
    setStatsLoading(true);
    getAnalyticsOverview()
      .then((data) => {
        setStats(data);
        setStatsError(null);
      })
      .catch((err) => {
        setStatsError('Failed to load system analytics.');
      })
      .finally(() => {
        setStatsLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount; subsequent fetches happen via onPageChange/onFilterChange

  // ─── Handlers ──────────────────────────────────────────────────────────────
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

  const handleCancelRequest = useCallback(async (requestId) => {
    if (window.confirm('Are you sure you want to cancel this active request?')) {
      await changeRequestStatus(requestId, 'cancelled');
    }
  }, [changeRequestStatus]);

  const handleDeleteRequest = useCallback(async (requestId) => {
    if (window.confirm('WARNING: This will permanently delete the request. Proceed?')) {
      await removeRequest(requestId);
    }
  }, [removeRequest]);

  return (
    <Navbar title="Admin Command Center">
      <div 
        className="page-wrapper" 
        style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}
      >
        
        {/* ─── Global Analytics Error ─── */}
        {statsError && (
          <div className="alert alert-error" style={{ marginBottom: '0' }}>
            <span className="alert-icon">⚠️</span>
            {statsError}
          </div>
        )}

        {/* ─── Analytics Top Row ─── */}
        <div 
          className="grid-4" 
          style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(4, 1fr)' }}
        >
          <StatsCard 
            label="Total Users" 
            value={stats?.totalUsers || 0} 
            icon="👥" 
            color="blue" 
            loading={statsLoading} 
            delay={0}
          />
          <StatsCard 
            label="Active Volunteers" 
            value={stats?.activeVolunteers || 0} 
            icon="🤝" 
            color="green" 
            loading={statsLoading} 
            delay={100}
          />
          <StatsCard 
            label="Verified Providers" 
            value={stats?.verifiedProviders || 0} 
            icon="🏥" 
            color="orange" 
            loading={statsLoading} 
            delay={200}
          />
          <StatsCard 
            label="Critical Emergencies" 
            value={stats?.criticalRequests || 0} 
            icon="🚨" 
            color="red" 
            loading={statsLoading} 
            delay={300}
          />
        </div>

        {/* ─── System-Wide Request Feed ─── */}
        <div className="card" style={{ animation: 'fadeSlideUp var(--t-page) var(--ease) 400ms both' }}>
          <div className="card-header">
            <div>
              <h3 className="section-title">System-Wide Request Feed</h3>
              <div className="section-subtitle">Monitor, filter, and moderate all platform emergencies</div>
            </div>
          </div>
          
          <div className="card-body" style={{ padding: 0 }}>
            <RequestTable 
              requests={requests} 
              pagination={pagination}
              loading={requestsLoading} 
              actionLoading={actionLoading}
              
              // Admin Variant Controls
              variant="admin" 
              onCancel={handleCancelRequest}
              onDelete={handleDeleteRequest}
              
              // Filtering & Pagination
              showFilters={true}
              filters={filters}
              onFilterChange={handleFilterChange}
              onFilterReset={handleFilterReset}
              onPageChange={handlePageChange}
            />
          </div>
        </div>

      </div>
    </Navbar>
  );
}