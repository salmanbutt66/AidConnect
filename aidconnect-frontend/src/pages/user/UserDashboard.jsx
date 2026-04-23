import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar.jsx';
import StatsCard from '../../components/dashboard/StatsCard.jsx';
import RequestTable from '../../components/dashboard/RequestTable.jsx';
import NotificationPanel from '../../components/dashboard/NotificationPanel.jsx';
import useRequests from '../../hooks/useRequests.js';
import useAuth from '../../hooks/useAuth.js';

export default function UserDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    requests, 
    loading, 
    fetchMyRequests, 
    cancelMyRequest 
  } = useRequests();

  // ─── Initial Data Load ───────────────────────────────────────────────────
  useEffect(() => {
    // Fetch latest requests for the dashboard view
    fetchMyRequests({ limit: 5, page: 1 });
  }, [fetchMyRequests]);

  // ─── Derived Stats ────────────────────────────────────────────────────────
  // Calculate quick metrics from the requests array
  const stats = useMemo(() => {
    const active = requests.filter(r => 
      ['posted', 'accepted', 'in_progress'].includes(r.status)
    ).length;
    const completed = requests.filter(r => r.status === 'completed').length;
    
    return { active, completed, total: requests.length };
  }, [requests]);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this request?')) {
      await cancelMyRequest(id);
    }
  };

  const handleViewAll = () => {
    navigate('/user/my-requests');
  };

  const handleCreateNew = () => {
    navigate('/user/create-request');
  };

  return (
    <Navbar title="Citizen Dashboard">
      <div className="page-wrapper" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* ─── Top Row: Welcome & Quick Action ─── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--green-950)', margin: 0 }}>
              Welcome back, {user?.name.split(' ')[0]}!
            </h2>
            <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Your safety is our priority. How can we help you today?
            </p>
          </div>
          <button 
            className="btn btn-danger btn-lg pulse" 
            onClick={handleCreateNew}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', boxShadow: 'var(--shadow-lg)' }}
          >
            <span style={{ fontSize: '20px' }}>🆘</span>
            New Emergency Request
          </button>
        </div>

        {/* ─── Stats Grid ─── */}
        <div className="grid-3">
          <StatsCard 
            label="Total Requests" 
            value={stats.total} 
            icon="📋" 
            color="blue" 
            loading={loading}
            delay={0}
          />
          <StatsCard 
            label="Active Emergencies" 
            value={stats.active} 
            icon="🚨" 
            color="orange" 
            loading={loading}
            delay={100}
          />
          <StatsCard 
            label="Helped Received" 
            value={stats.completed} 
            icon="✅" 
            color="green" 
            loading={loading}
            delay={200}
          />
        </div>

        {/* ─── Main Content Split ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          
          {/* Left: Recent Activity */}
          <div className="card" style={{ animation: 'fadeSlideUp var(--t-page) var(--ease) both' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 className="section-title">Recent Requests</h3>
                <p className="section-subtitle">Your 5 most recent emergency postings</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={handleViewAll}>
                View All →
              </button>
            </div>
            
            <div className="card-body" style={{ padding: 0 }}>
              <RequestTable 
                requests={requests.slice(0, 5)} 
                loading={loading} 
                variant="user" 
                showFilters={false} 
                onCancel={handleCancel}
              />
            </div>
          </div>

          {/* Right: Notification Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <NotificationPanel limit={6} />
            
            {/* Helpful Tip Card */}
            <div className="card" style={{ background: 'var(--green-900)', color: 'white', border: 'none' }}>
              <div className="card-body" style={{ padding: '24px' }}>
                <div style={{ fontSize: '24px', marginBottom: '12px' }}>💡</div>
                <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Emergency Tip</h4>
                <p style={{ fontSize: '13px', opacity: 0.8, lineHeight: 1.6, margin: 0 }}>
                  Ensure your phone's GPS is enabled when posting a request to help responders find you faster.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Navbar>
  );
}