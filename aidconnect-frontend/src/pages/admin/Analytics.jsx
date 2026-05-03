// src/pages/admin/Analytics.jsx
import React, { useEffect, useState } from 'react';
import {
  RefreshCw,
  AlertTriangle,
  X,
  HelpCircle,
  Zap,
  CheckCircle2,
  UserCheck,
  Building2,
  MapPin,
  TrendingUp,
  BarChart2,
} from 'lucide-react';
import Navbar from '../../components/common/Navbar.jsx';
import StatsCard from '../../components/dashboard/StatsCard.jsx';
import Loader from '../../components/common/Loader.jsx';
import {
  getAnalyticsOverview,
  getEmergencyTypeStats,
  getMonthlyTrends,
  getTopProviders,
  getHighRiskAreas,
} from '../../api/admin.api.js';
import { formatNumber } from '../../utils/formatters.js';

const ADMIN_STATS_REFRESH_EVENT = 'aidconnect:admin-stats-refresh';

// Maps emergency type keys to a colour token
const EMERGENCY_COLORS = {
  medical:  'var(--danger)',
  blood:    'var(--green-600)',
  accident: 'var(--warning)',
  disaster: 'var(--info)',
  other:    'var(--text-muted)',
};

export default function Analytics() {
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [data,      setData]      = useState({
    overview:       null,
    emergencyTypes: [],
    trends:         [],
    highRisk:       [],
    topProviders:   [],
  });

  const fetchAnalytics = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const [overviewRes, typesRes, trendsRes, risksRes, providersRes] = await Promise.all([
        getAnalyticsOverview(),
        getEmergencyTypeStats(),
        getMonthlyTrends(),
        getHighRiskAreas(),
        getTopProviders(),
      ]);
      setData({
        overview:       overviewRes.data    || null,
        emergencyTypes: typesRes.data       || [],
        trends:         trendsRes.data      || [],
        highRisk:       risksRes.data       || [],
        topProviders:   providersRes.data   || [],
      });
    } catch {
      setError('Failed to load analytics data. Please refresh.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  useEffect(() => { fetchAnalytics(); }, []);

  useEffect(() => {
    const handleStatsRefresh = () => fetchAnalytics({ silent: true });
    const interval = setInterval(() => fetchAnalytics({ silent: true }), 15000);
    window.addEventListener(ADMIN_STATS_REFRESH_EVENT, handleStatsRefresh);
    window.addEventListener('focus', handleStatsRefresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener(ADMIN_STATS_REFRESH_EVENT, handleStatsRefresh);
      window.removeEventListener('focus', handleStatsRefresh);
    };
  }, []);

  if (loading) {
    return (
      <Navbar title="Analytics">
        <Loader variant="overlay" message="Analyzing platform data…" />
      </Navbar>
    );
  }

  const totalRequests = data.overview?.totalRequests || 0;
  const maxTrend = data.trends.length > 0
    ? Math.max(...data.trends.map((t) => t.totalRequests ?? t.count ?? 0), 1)
    : 1;

  const formatMonthLabel = (monthNumber, year) => {
    if (!monthNumber || !year) return '—';
    return new Date(year, monthNumber - 1, 1).toLocaleString('en-PK', { month: 'short', year: '2-digit' });
  };

  return (
    <Navbar title="Analytics">
      <div className="page-wrapper">

        {/* ── Page header ───────────────────────────────────────────── */}
        <div className="page-header">
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1>Platform Analytics</h1>
              <p>System-wide performance metrics and emergency trends.</p>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleManualRefresh}
              disabled={refreshing}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw
                size={14}
                style={{
                  transition: 'transform 0.6s',
                  transform: refreshing ? 'rotate(360deg)' : 'none',
                }}
              />
              Refresh Analytics
            </button>
          </div>
        </div>

        {/* ── Error alert ───────────────────────────────────────────── */}
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

        {/* ── Overview stats ────────────────────────────────────────── */}
        <div className="grid-4" style={{ marginBottom: '28px' }}>
          <StatsCard label="Total Requests"        value={totalRequests}                               icon={<HelpCircle size={20} />}   color="blue"   delay={0} />
          <StatsCard label="Avg. Response Time"    value={data.overview?.avgResponseTime ?? 0}        icon={<Zap size={20} />}          color="green"  format="raw" sub="minutes" delay={100} />
          <StatsCard label="Completion Rate"       value={data.overview?.completionRate ?? 0}         icon={<CheckCircle2 size={20} />} color="green"  format="percent" delay={200} />
          <StatsCard label="Active Volunteers"     value={data.overview?.activeVolunteers ?? 0}       icon={<UserCheck size={20} />}    color="orange" delay={300} />
          <StatsCard label="Provider Credibility"  value={data.overview?.averageProviderCredibility ?? 0} icon={<Building2 size={20} />}    color="blue"   delay={400} />
        </div>

        {/* ── Two-column: distribution + high risk ──────────────────── */}
        <div className="grid-2" style={{ marginBottom: '24px' }}>

          {/* Emergency type distribution */}
          <div className="card anim-fade-up delay-200">
            <div className="card-header">
              <div className="section-header" style={{ marginBottom: 0 }}>
                <div>
                  <div className="section-title">Emergency Distribution</div>
                  <div className="section-subtitle">Breakdown by emergency type</div>
                </div>
              </div>
            </div>
            <div className="card-body">
              {data.emergencyTypes.length === 0 ? (
                <div className="empty-state" style={{ padding: '32px 16px' }}>
                  <div className="empty-state-icon"><BarChart2 size={32} strokeWidth={1.5} /></div>
                  <h3>No data yet</h3>
                  <p>Emergency type data will appear here once requests are posted.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {data.emergencyTypes.map((type) => {
                    const pct   = totalRequests > 0 ? ((type.count / totalRequests) * 100).toFixed(1) : 0;
                    const color = EMERGENCY_COLORS[type._id] || 'var(--green-600)';
                    return (
                      <div key={type._id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-dark)', textTransform: 'capitalize' }}>
                            {type._id?.replace(/_/g, ' ') || '—'}
                          </span>
                          <span style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                            {formatNumber(type.count)} <span style={{ opacity: 0.6 }}>({pct}%)</span>
                          </span>
                        </div>
                        <div style={{ height: '6px', background: 'var(--stone-200, #e5e7eb)', borderRadius: '99px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${pct}%`,
                              background: color,
                              borderRadius: '99px',
                              transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* High risk areas */}
          <div className="card anim-fade-up delay-300">
            <div className="card-header">
              <div className="section-header" style={{ marginBottom: 0 }}>
                <div>
                  <div className="section-title">High Risk Areas</div>
                  <div className="section-subtitle">Cities with the most incidents</div>
                </div>
              </div>
            </div>
            <div className="card-body" style={{ paddingTop: '8px' }}>
              {data.highRisk.length === 0 ? (
                <div className="empty-state" style={{ padding: '32px 16px' }}>
                  <div className="empty-state-icon"><MapPin size={32} strokeWidth={1.5} /></div>
                  <h3>No data yet</h3>
                  <p>High risk area data will appear once enough requests are logged.</p>
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Location</th>
                        <th>Incidents</th>
                        <th>Risk Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.highRisk.map((area, i) => {
                        const count = area.totalRequests ?? area.count ?? 0;
                        return (
                          <tr key={i}>
                            <td style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', width: '32px' }}>{i + 1}</td>
                            <td>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                                <MapPin size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                {area.city || '—'}
                              </span>
                            </td>
                            <td style={{ fontVariantNumeric: 'tabular-nums' }}>{count}</td>
                            <td>
                              <span className={`badge ${count > 50 ? 'badge-red' : 'badge-orange'}`}>
                                {count > 50 ? 'Critical' : 'High'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Top Providers ─────────────────────────────────────────── */}
        <div className="card anim-fade-up delay-300" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <div className="section-header" style={{ marginBottom: 0 }}>
              <div>
                <div className="section-title">Top Providers</div>
                <div className="section-subtitle">Highest credibility service providers on the platform</div>
              </div>
            </div>
          </div>
          <div className="card-body">
            {data.topProviders.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 16px' }}>
                <div className="empty-state-icon"><Building2 size={32} strokeWidth={1.5} /></div>
                <h3>No provider ratings yet</h3>
                <p>Provider credibility will appear once users rate completed services.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Provider</th>
                      <th>Rating</th>
                      <th>Credibility</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topProviders.map((provider, index) => (
                      <tr key={provider._id || index}>
                        <td style={{ fontWeight: 500 }}>
                          {provider.organizationName || provider.userId?.name || '—'}
                        </td>
                        <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {Number(provider.averageRating || 0).toFixed(1)}{' '}
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>/ 5</span>
                        </td>
                        <td>
                          <span className={`badge ${
                            provider.credibilityScore >= 85 ? 'badge-green'
                              : provider.credibilityScore >= 70 ? 'badge-blue'
                              : provider.credibilityScore >= 55 ? 'badge-orange'
                              : 'badge-red'
                          }`}>
                            {provider.credibilityScore ?? 0}/100
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── Monthly trends bar chart ───────────────────────────────── */}
        <div className="card anim-fade-up delay-400">
          <div className="card-header">
            <div className="section-header" style={{ marginBottom: 0 }}>
              <div>
                <div className="section-title">Monthly Activity Trends</div>
                <div className="section-subtitle">Request volume over the past 12 months</div>
              </div>
            </div>
          </div>
          <div className="card-body">
            {data.trends.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 16px' }}>
                <div className="empty-state-icon"><TrendingUp size={32} strokeWidth={1.5} /></div>
                <h3>No trend data yet</h3>
                <p>Monthly trends will appear here as the platform accumulates data.</p>
              </div>
            ) : (
              <div
                style={{
                  height: '220px',
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '6px',
                  paddingBottom: '36px',
                  position: 'relative',
                }}
              >
                {data.trends.map((month, i) => {
                  const monthRequests  = month.totalRequests ?? month.count ?? 0;
                  const monthCompleted = month.completedRequests ?? 0;
                  const completionRate = month.completionRate ?? 0;
                  const heightPct      = maxTrend > 0 ? (monthRequests / maxTrend) * 160 : 0;
                  const isActive       = monthRequests > 0;

                  return (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        position: 'relative',
                      }}
                    >
                      {/* Count label */}
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          visibility: isActive ? 'visible' : 'hidden',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {monthRequests}
                      </span>

                      {/* Bar — completed portion stacked on top */}
                      <div
                        style={{
                          width: '100%',
                          height: `${heightPct}px`,
                          minHeight: isActive ? '4px' : '2px',
                          background: isActive ? 'var(--green-100)' : 'var(--stone-200, #e5e7eb)',
                          borderRadius: '4px 4px 0 0',
                          position: 'relative',
                          overflow: 'hidden',
                          transition: 'height 0.8s cubic-bezier(0.4,0,0.2,1)',
                          opacity: isActive ? 1 : 0.3,
                        }}
                      >
                        {/* Completed sub-bar */}
                        {isActive && (
                          <div
                            style={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              height: `${completionRate}%`,
                              background: 'var(--green-600)',
                              transition: 'height 1s cubic-bezier(0.4,0,0.2,1) 0.2s',
                            }}
                          />
                        )}
                      </div>

                      {/* Month label */}
                      <span
                        style={{
                          fontSize: '10px',
                          color: 'var(--text-muted)',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          marginTop: '4px',
                        }}
                      >
                        {formatMonthLabel(month.month, month.year)}
                      </span>

                      {/* Completion rate */}
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                        {completionRate}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Legend */}
            {data.trends.length > 0 && (
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--green-600)', display: 'inline-block' }} />
                  Completed
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--green-100)', display: 'inline-block' }} />
                  Total
                </span>
              </div>
            )}
          </div>
        </div>

      </div>
    </Navbar>
  );
}