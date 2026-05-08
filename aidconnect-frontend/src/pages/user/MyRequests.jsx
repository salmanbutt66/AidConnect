import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar.jsx';
import RequestTable from '../../components/dashboard/RequestTable.jsx';
import RequestCard from '../../components/cards/RequestCard.jsx';
import StatsCard from '../../components/dashboard/StatsCard.jsx';
import Modal from '../../components/common/Modal.jsx';
import Loader from '../../components/common/Loader.jsx';
import useRequests from '../../hooks/useRequests.js';
import { DEFAULT_FILTERS } from '../../hooks/useRequests.js';
import {
  LayoutGrid,
  List,
  Search,
  Siren,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  X,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const REQUEST_STATUS_REFRESH_EVENT = 'aidconnect:request-status-changed';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

  .mr-page * { font-family: 'Plus Jakarta Sans', sans-serif !important; }

  @keyframes mr-fade-up {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .mr-anim { animation: mr-fade-up 0.46s cubic-bezier(.22,.68,0,1.2) both; }

  
  .view-toggle {
    display: flex; background: #f0f4f1;
    border-radius: 10px; padding: 3px; gap: 2px;
  }
  .view-toggle-btn {
    display: flex; align-items: center; gap: 5px;
    padding: 6px 13px; border-radius: 8px; border: none;
    font-size: 12.5px; font-weight: 600; cursor: pointer;
    transition: all 0.18s ease;
  }
  .view-toggle-btn.active {
    background: white; color: #141b11;
    box-shadow: 0 1px 4px rgba(0,0,0,0.10);
  }
  .view-toggle-btn:not(.active) {
    background: transparent; color: #6b7a64;
  }
  .view-toggle-btn:not(.active):hover { color: #141b11; }

  
  .status-tab-bar {
    display: flex; gap: 4px; flex-wrap: wrap;
    margin-bottom: 20px;
  }
  .status-tab {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 999px; border: none;
    font-size: 12.5px; font-weight: 600; cursor: pointer;
    transition: all 0.18s ease;
    background: #f0f4f1; color: #6b7a64;
  }
  .status-tab:hover { background: #e0f5e9; color: #1a6b3c; }
  .status-tab.active { background: #0d3d22; color: white; }
  .status-tab .tab-count {
    font-size: 10px; font-weight: 700;
    padding: 1px 6px; border-radius: 999px;
    background: rgba(255,255,255,0.22);
    color: inherit;
  }
  .status-tab:not(.active) .tab-count { background: #e2e8e3; color: #6b7a64; }

  
  .mr-search-wrap {
    position: relative; flex: 1; max-width: 320px;
  }
  .mr-search-icon {
    position: absolute; left: 11px; top: 50%;
    transform: translateY(-50%); color: #9aab94; pointer-events: none;
  }
  .mr-search-input {
    width: 100%; padding: 9px 14px 9px 36px;
    border: 1.5px solid #e2e8e3; border-radius: 10px;
    font-size: 13px; color: #141b11;
    background: white; outline: none;
    transition: border-color 0.18s, box-shadow 0.18s;
    font-family: inherit;
  }
  .mr-search-input:focus {
    border-color: #1a6b3c;
    box-shadow: 0 0 0 3px rgba(26,107,60,0.10);
  }
  .mr-search-input::placeholder { color: #9aab94; }

  
  .mr-success {
    display: flex; align-items: center; gap: 10px;
    background: #f0fdf4; border: 1px solid #bbf7d0;
    border-radius: 12px; padding: 12px 16px;
    font-size: 13px; font-weight: 600; color: #15803d;
    margin-bottom: 18px;
    animation: mr-fade-up 0.3s ease both;
  }
  .mr-error {
    display: flex; align-items: center; gap: 10px;
    background: #fef2f2; border: 1px solid #fecaca;
    border-radius: 12px; padding: 12px 16px;
    font-size: 13px; font-weight: 600; color: #dc2626;
    margin-bottom: 18px;
    animation: mr-fade-up 0.3s ease both;
  }

  
  .mr-card {
    background: white; border: 1px solid #e2e8e3;
    border-radius: 16px; overflow: hidden;
  }
  .mr-card-header {
    padding: 18px 22px;
    border-bottom: 1px solid #f0f4f1;
  }
  .mr-card-body { padding: 20px 22px; }

  
  .mr-empty {
    display: flex; flex-direction: column; align-items: center;
    padding: 52px 20px; text-align: center; gap: 8px;
  }
  .mr-empty-icon {
    width: 60px; height: 60px; border-radius: 16px;
    background: #f0faf4; display: flex; align-items: center;
    justify-content: center; margin-bottom: 8px;
  }

  
  .mr-pagination {
    display: flex; align-items: center; justify-content: center;
    gap: 4px; margin-top: 24px; flex-wrap: wrap;
  }
  .mr-page-btn {
    width: 34px; height: 34px; border-radius: 9px; border: 1.5px solid #e2e8e3;
    background: white; font-size: 13px; font-weight: 600; color: #3a4a35;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: all 0.18s;
  }
  .mr-page-btn:hover:not(:disabled) { border-color: #1a6b3c; color: #1a6b3c; background: #f0faf4; }
  .mr-page-btn.active { background: #0d3d22; border-color: #0d3d22; color: white; }
  .mr-page-btn:disabled { opacity: 0.38; cursor: not-allowed; }

  
  .new-req-btn {
    display: inline-flex; align-items: center; gap: 7px;
    background: #dc2626; color: white;
    font-weight: 700; font-size: 13.5px;
    padding: 10px 20px; border-radius: 10px; border: none;
    cursor: pointer;
    box-shadow: 0 3px 12px rgba(220,38,38,0.30);
    transition: transform 0.18s, box-shadow 0.18s, background 0.18s;
  }
  .new-req-btn:hover {
    background: #b91c1c;
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(220,38,38,0.36);
  }

  .mr-cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 14px;
  }

  @media (max-width: 720px) {
    .mr-cards-grid {
      grid-template-columns: 1fr;
    }

    .view-toggle,
    .status-tab-bar {
      width: 100%;
    }

    .view-toggle-btn,
    .status-tab {
      flex: 1;
      justify-content: center;
    }

    .mr-card-header {
      padding: 16px;
    }

    .mr-card-body {
      padding: 16px;
    }
  }
`;

function ViewToggle({ view, onChange }) {
  return (
    <div className="view-toggle">
      {[
        { value: 'cards', Icon: LayoutGrid, label: 'Cards' },
        { value: 'table', Icon: List,        label: 'Table' },
      ].map(({ value, Icon, label }) => (
        <button
          key={value}
          className={`view-toggle-btn${view === value ? ' active' : ''}`}
          onClick={() => onChange(value)}
        >
          <Icon size={13} />
          {label}
        </button>
      ))}
    </div>
  );
}

const STATUS_TABS = [
  { value: '',            label: 'All'         },
  { value: 'posted',      label: 'Posted'      },
  { value: 'accepted',    label: 'Accepted'    },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed',   label: 'Completed'   },
  { value: 'cancelled',   label: 'Cancelled'   },
];

function StatusTabs({ active, onChange, counts }) {
  return (
    <div className="status-tab-bar">
      {STATUS_TABS.map(({ value, label }) => (
        <button
          key={value}
          className={`status-tab${active === value ? ' active' : ''}`}
          onClick={() => onChange(value)}
        >
          {label}
          {counts[value] > 0 && (
            <span className="tab-count">{counts[value]}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export default function MyRequests() {
  const navigate = useNavigate();

  const {
    requests, pagination, loading, actionLoading, error, filters,
    setFilters, resetFilters, fetchMyRequests, cancelMyRequest, clearError,
  } = useRequests();

  const [view,         setView]         = useState('cards');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [successMsg,   setSuccessMsg]   = useState('');
  const [statusCounts, setStatusCounts] = useState({});

  useEffect(() => { fetchMyRequests({ page: 1, limit: 10 }); }, []);

  useEffect(() => {
    const handleRefresh = () => fetchMyRequests({ ...filters, page: 1, limit: 10 });
    window.addEventListener(REQUEST_STATUS_REFRESH_EVENT, handleRefresh);
    return () => window.removeEventListener(REQUEST_STATUS_REFRESH_EVENT, handleRefresh);
  }, [filters, fetchMyRequests]);

  useEffect(() => {
    if (!requests.length) return;
    const counts = {};
    requests.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
    counts[''] = requests.length;
    setStatusCounts(counts);
  }, [requests]);

  const activeCount    = requests.filter(r => ['posted', 'accepted', 'in_progress'].includes(r.status)).length;
  const completedCount = requests.filter(r => r.status === 'completed').length;
  const cancelledCount = requests.filter(r => r.status === 'cancelled').length;

  const handleFilterChange = useCallback((key, value) => {
    const updated = { ...filters, [key]: value, page: 1 };
    setFilters(updated);
    fetchMyRequests(updated);
  }, [filters, setFilters, fetchMyRequests]);

  const handleStatusTab = useCallback((status) => {
    const updated = { ...filters, status, page: 1 };
    setFilters(updated);
    fetchMyRequests(updated);
  }, [filters, setFilters, fetchMyRequests]);

  const handleFilterReset = useCallback(() => {
    resetFilters();
    fetchMyRequests({ page: 1, limit: 10 });
  }, [resetFilters, fetchMyRequests]);

  const handlePageChange = useCallback((page) => {
    const updated = { ...filters, page };
    setFilters(updated);
    fetchMyRequests(updated);
  }, [filters, setFilters, fetchMyRequests]);

  const handleCancelConfirm = useCallback(async () => {
    if (!cancelTarget) return;
    try {
      await cancelMyRequest(cancelTarget);
      setCancelTarget(null);
      setSuccessMsg('Request cancelled successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch { setCancelTarget(null); }
  }, [cancelTarget, cancelMyRequest]);

  return (
    <Navbar title="My Requests">
      <style>{STYLES}</style>
      <div className="page-wrapper mr-page">
<div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <h1 style={{ fontSize: 'clamp(18px, 3vw, 24px)', fontWeight: 800, color: '#141b11', margin: 0, letterSpacing: '-0.4px' }}>
                My Requests
              </h1>
              <p style={{ fontSize: '13.5px', color: '#6b7a64', margin: '4px 0 0' }}>
                Track and manage all your emergency requests.
              </p>
            </div>
            <button className="new-req-btn" onClick={() => navigate('/user/create-request')}>
              <Siren size={14} /> New Request
            </button>
          </div>
        </div>
<div className="grid-4" style={{ marginBottom: '24px' }}>
          <StatsCard label="Total Requests" value={pagination.total || requests.length} icon={<ClipboardList size={22} />} color="blue"   loading={loading} delay={0}   />
          <StatsCard label="Active Now"      value={activeCount}                         icon={<Siren size={22} />}        color="orange" loading={loading} delay={100} />
          <StatsCard label="Completed"       value={completedCount}                      icon={<CheckCircle2 size={22} />} color="green"  loading={loading} delay={200} />
          <StatsCard label="Cancelled"       value={cancelledCount}                      icon={<XCircle size={22} />}      color="red"    loading={loading} delay={300} />
        </div>
{successMsg && (
          <div className="mr-success">
            <CheckCircle2 size={15} color="#16a34a" />
            {successMsg}
          </div>
        )}
        {error && (
          <div className="mr-error">
            <AlertTriangle size={15} />
            {error}
            <button
              onClick={clearError}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center' }}
            >
              <X size={14} />
            </button>
          </div>
        )}
<div className="mr-card mr-anim" style={{ animationDelay: '80ms' }}>
          <div className="mr-card-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <StatusTabs
                active={filters.status || ''}
                onChange={handleStatusTab}
                counts={statusCounts}
              />
              <ViewToggle view={view} onChange={setView} />
            </div>
          </div>

          <div className="mr-card-body">
{view === 'cards' && (
              <>
                <div style={{ marginBottom: '18px' }}>
                  <div className="mr-search-wrap">
                    <Search size={14} className="mr-search-icon" />
                    <input
                      type="text"
                      className="mr-search-input"
                      placeholder="Search requests…"
                      value={filters.search || ''}
                      onChange={e => handleFilterChange('search', e.target.value)}
                    />
                  </div>
                </div>

                {loading ? (
                  <Loader variant="skeleton" count={4} />
                ) : requests.length === 0 ? (
                  <div className="mr-empty">
                    <div className="mr-empty-icon">
                      <ClipboardList size={26} color="#1a6b3c" />
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#141b11' }}>
                      {filters.status ? `No ${filters.status.replace('_', ' ')} requests` : 'No requests yet'}
                    </div>
                    <p style={{ fontSize: '13px', color: '#6b7a64', margin: 0, maxWidth: '300px', lineHeight: 1.6 }}>
                      {filters.status
                        ? 'Try a different status filter or post a new request.'
                        : 'Post your first emergency request to get help fast.'}
                    </p>
                    <button
                      className="new-req-btn"
                      onClick={() => navigate('/user/create-request')}
                      style={{ marginTop: '12px' }}
                    >
                      <Siren size={13} /> Post a Request
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mr-cards-grid">
                      {requests.map(r => (
                        <RequestCard
                          key={r._id}
                          request={r}
                          variant="user"
                          onClick={req => navigate(`/user/requests/${req._id}`)}
                          onCancel={id => setCancelTarget(id)}
                          onRate={req => navigate(`/user/requests/${req._id}?rate=1`)}
                          loading={actionLoading}
                        />
                      ))}
                    </div>

                    {pagination.totalPages > 1 && (
                      <div className="mr-pagination">
                        <button
                          className="mr-page-btn"
                          disabled={pagination.page <= 1}
                          onClick={() => handlePageChange(pagination.page - 1)}
                        >
                          <ChevronLeft size={14} />
                        </button>
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                          <button
                            key={p}
                            className={`mr-page-btn${p === pagination.page ? ' active' : ''}`}
                            onClick={() => handlePageChange(p)}
                          >
                            {p}
                          </button>
                        ))}
                        <button
                          className="mr-page-btn"
                          disabled={pagination.page >= pagination.totalPages}
                          onClick={() => handlePageChange(pagination.page + 1)}
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
{view === 'table' && (
              <RequestTable
                requests={requests}
                pagination={pagination}
                loading={loading}
                filters={filters}
                onFilterChange={handleFilterChange}
                onFilterReset={handleFilterReset}
                onPageChange={handlePageChange}
                variant="user"
                onView={r => navigate(`/user/requests/${r._id}`)}
                onCancel={id => setCancelTarget(id)}
                actionLoading={actionLoading}
              />
            )}
          </div>
        </div>

      </div>
<Modal
        isOpen={!!cancelTarget}
        onClose={() => { setCancelTarget(null); clearError(); }}
        title="Cancel Request"
        icon={<AlertTriangle size={16} color="#d97706" />}
        onConfirm={handleCancelConfirm}
        confirmLabel="Yes, Cancel"
        confirmVariant="danger"
        loading={actionLoading}
      >
        Are you sure you want to cancel this request? Any volunteers who were
        notified will be informed. This cannot be undone.
      </Modal>
    </Navbar>
  );
}