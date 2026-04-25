// src/pages/admin/Analytics.jsx
import React, { useEffect, useState } from 'react';
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

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [data,    setData]    = useState({
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

      // Each api function returns response.data which is { success, message, data: [...] }
      // So we unwrap one level: res.data to get the actual payload.
      setData({
        overview:       overviewRes.data       || null,
        emergencyTypes: typesRes.data          || [],
        trends:         trendsRes.data         || [],
        highRisk:       risksRes.data          || [],  // FIX: was risksRes.data || risksRes — risksRes IS already .data from axios, so risksRes.data is the payload array
        topProviders:   providersRes.data      || [],
      });
    } catch (err) {
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
    ? Math.max(...data.trends.map((t) => t.totalRequests ?? t.count ?? 0), 1)
    : 1;

  const formatMonthLabel = (monthNumber, year) => {
    if (!monthNumber || !year) return '—';
    return new Date(year, monthNumber - 1, 1).toLocaleString('en-PK', {
      month: 'short',
      year: '2-digit',
    });
  };

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
          <StatsCard
            label="Provider Credibility"
            value={data.overview?.averageProviderCredibility ?? 0}
            icon="🏥"
            color="blue"
            delay={400}
          />
        </div>

        {/* ── Two column grid ───────────────────────────────────────────── */}
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
                          <td>{area.totalRequests ?? area.count ?? 0}</td>
                          <td>
                            <span className={`badge ${(area.totalRequests ?? area.count ?? 0) > 50 ? 'badge-red' : 'badge-orange'}`}>
                              {(area.totalRequests ?? area.count ?? 0) > 50 ? 'Critical' : 'High'}
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

        {/* ── Top Providers ─────────────────────────────────────────────── */}
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
                <div className="empty-state-icon">🏥</div>
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
                        <td style={{ fontWeight: 500 }}>{provider.organizationName || provider.userId?.name || '—'}</td>
                        <td>{Number(provider.averageRating || 0).toFixed(1)} / 5</td>
                        <td>
                          <span className={`badge ${provider.credibilityScore >= 85 ? 'badge-green' : provider.credibilityScore >= 70 ? 'badge-blue' : provider.credibilityScore >= 55 ? 'badge-orange' : 'badge-red'}`}>
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
                  const monthRequests  = month.totalRequests ?? month.count ?? 0;
                  const monthCompleted = month.completedRequests ?? 0;
                  const completionRate = month.completionRate ?? 0;
                  const heightPct      = maxTrend > 0 ? (monthRequests / maxTrend) * 150 : 0;
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
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          color: 'var(--text-muted)',
                          visibility: monthRequests > 0 ? 'visible' : 'hidden',
                        }}
                      >
                        {monthRequests}
                      </span>

                      <div
                        style={{
                          width: '100%',
                          height: `${heightPct}px`,
                          minHeight: '4px',
                          background: 'var(--info)',
                          borderRadius: 'var(--radius-sm)',
                          transition: 'height 0.6s var(--ease)',
                          opacity: monthRequests > 0 ? 1 : 0.2,
                        }}
                      />

                      <span
                        style={{
                          fontSize: '10px',
                          color: 'var(--text-muted)',
                          textAlign: 'center',
                          lineHeight: 1.2,
                        }}
                      >
                        {monthCompleted}/{monthRequests}
                      </span>

                      <span
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatMonthLabel(month.month, month.year)}
                      </span>

                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {completionRate}% done
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