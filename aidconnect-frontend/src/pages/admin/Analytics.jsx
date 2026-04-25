// src/pages/admin/Analytics.jsx
import React, { useEffect, useState } from 'react';
import Navbar from '../../components/common/Navbar.jsx';
import StatsCard from '../../components/dashboard/StatsCard.jsx';
import Loader from '../../components/common/Loader.jsx';
import {
  getAnalyticsOverview,
  getEmergencyTypeStats,
  getMonthlyTrends,
  getHighRiskAreas,
} from '../../api/admin.api.js';
import { formatNumber } from '../../utils/formatters.js';

const ADMIN_STATS_REFRESH_EVENT = 'aidconnect:admin-stats-refresh';

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [data,    setData]    = useState({
    overview:       null,
    emergencyTypes: [],
    trends:         [],
    highRisk:       [],
  });

  const fetchAnalytics = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const [overviewRes, typesRes, trendsRes, risksRes] = await Promise.all([
        getAnalyticsOverview(),
        getEmergencyTypeStats(),
        getMonthlyTrends(),
        getHighRiskAreas(),
      ]);

      // FIX: safe extraction consistent with rest of admin pages
      setData({
        overview:       overviewRes.data  || overviewRes,
        emergencyTypes: typesRes.data     || typesRes     || [],
        trends:         trendsRes.data    || trendsRes    || [],
        highRisk:       risksRes.data     || risksRes     || [],
      });
    } catch (err) {
      // FIX: local error state instead of console.error
      setError('Failed to load analytics data. Please refresh.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

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
  const maxTrend      = data.trends.length > 0
    ? Math.max(...data.trends.map((t) => t.count), 1)
    : 1;

  return (
    <Navbar title="Analytics">
      <div className="page-wrapper">

        {/* ── Page header ───────────────────────────────────────────────── */}
        <div className="page-header">
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1>Platform Analytics</h1>
              <p>System-wide performance metrics and emergency trends.</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => fetchAnalytics()}>
              🔄 Refresh Analytics
            </button>
          </div>
        </div>

        {/* ── Error alert ───────────────────────────────────────────────── */}
        {error && (
          <div className="alert alert-error anim-fade-up" style={{ marginBottom: '20px' }}>
            <span className="alert-icon">⚠️</span>
            {error}
            <button
              onClick={() => setError('')}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--danger)',
                fontWeight: 700,
              }}
            >✕</button>
          </div>
        )}

        {/* ── Overview stats ────────────────────────────────────────────── */}
        <div className="grid-4" style={{ marginBottom: '28px' }}>
          <StatsCard
            label="Total Requests"
            value={totalRequests}
            icon="🆘"
            color="blue"
            delay={0}
          />
          <StatsCard
            label="Avg. Response Time"
            value={data.overview?.avgResponseTime ?? 0}
            icon="⚡"
            color="green"
            format="raw"
            sub="minutes"
            delay={100}
          />
          <StatsCard
            label="Completion Rate"
            value={data.overview?.completionRate ?? 0}
            icon="✅"
            color="green"
            format="percent"
            delay={200}
          />
          <StatsCard
            label="Active Volunteers"
            value={data.overview?.activeVolunteers ?? 0}
            icon="🤝"
            color="orange"
            delay={300}
          />
        </div>

        {/* ── Two column grid ───────────────────────────────────────────── */}
        {/* FIX: use grid-2 class instead of inline style */}
        <div className="grid-2" style={{ marginBottom: '24px' }}>

          {/* Emergency type distribution */}
          <div className="card anim-fade-up delay-200">
            <div className="card-header">
              <div className="section-header" style={{ marginBottom: 0 }}>
                <div>
                  {/* FIX: section-title on div not h3 */}
                  <div className="section-title">Emergency Distribution</div>
                  <div className="section-subtitle">Breakdown by emergency type</div>
                </div>
              </div>
            </div>
            <div className="card-body">
              {data.emergencyTypes.length === 0 ? (
                <div className="empty-state" style={{ padding: '32px 16px' }}>
                  <div className="empty-state-icon">📊</div>
                  <h3>No data yet</h3>
                  <p>Emergency type data will appear here once requests are posted.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {data.emergencyTypes.map((type) => {
                    const pct = totalRequests > 0
                      ? ((type.count / totalRequests) * 100).toFixed(1)
                      : 0;
                    return (
                      <div key={type._id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-dark)', textTransform: 'capitalize' }}>
                            {type._id?.replace(/_/g, ' ') || '—'}
                          </span>
                          <span style={{ color: 'var(--text-muted)' }}>
                            {formatNumber(type.count)} ({pct}%)
                          </span>
                        </div>
                        <div
                          style={{
                            height: '8px',
                            background: 'var(--stone-200)',
                            // FIX: hardcoded 4px → var(--radius-sm)
                            borderRadius: 'var(--radius-sm)',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${pct}%`,
                              background: 'var(--green-600)',
                              borderRadius: 'var(--radius-sm)',
                              transition: 'width 0.6s var(--ease)',
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
                  <div className="section-subtitle">Cities with most incidents</div>
                </div>
              </div>
            </div>
            <div className="card-body" style={{ paddingTop: '8px' }}>
              {data.highRisk.length === 0 ? (
                <div className="empty-state" style={{ padding: '32px 16px' }}>
                  <div className="empty-state-icon">📍</div>
                  <h3>No data yet</h3>
                  <p>High risk area data will appear once enough requests are logged.</p>
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Location</th>
                        <th>Incidents</th>
                        <th>Risk Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.highRisk.map((area, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 500 }}>{area.city || '—'}</td>
                          <td>{area.count}</td>
                          <td>
                            <span className={`badge ${area.count > 50 ? 'badge-red' : 'badge-orange'}`}>
                              {area.count > 50 ? 'Critical' : 'High'}
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
        </div>

        {/* ── Monthly trends bar chart ──────────────────────────────────── */}
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
                <div className="empty-state-icon">📈</div>
                <h3>No trend data yet</h3>
                <p>Monthly trends will appear here as the platform accumulates data.</p>
              </div>
            ) : (
              <div
                style={{
                  height: '200px',
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '8px',
                  paddingBottom: '28px',
                  position: 'relative',
                }}
              >
                {data.trends.map((month, i) => {
                  const heightPct = maxTrend > 0
                    ? (month.count / maxTrend) * 150
                    : 0;
                  return (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {/* Count label */}
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          color: 'var(--text-muted)',
                          visibility: month.count > 0 ? 'visible' : 'hidden',
                        }}
                      >
                        {month.count}
                      </span>

                      {/* Bar — FIX: plain div with transition, not .skeleton class */}
                      <div
                        style={{
                          width: '100%',
                          height: `${heightPct}px`,
                          minHeight: '4px',
                          // FIX: var(--blue-500) doesn't exist → var(--info)
                          background: 'var(--info)',
                          borderRadius: 'var(--radius-sm)',
                          transition: 'height 0.6s var(--ease)',
                          opacity: month.count > 0 ? 1 : 0.2,
                        }}
                      />

                      {/* Month label */}
                      <span
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {month.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </Navbar>
  );
}