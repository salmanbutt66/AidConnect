import React, { useEffect, useState } from 'react';
import Navbar from '../../components/common/Navbar.jsx';
import StatsCard from '../../components/dashboard/StatsCard.jsx';
import Loader from '../../components/common/Loader.jsx';
import { 
  getAnalyticsOverview, 
  getEmergencyTypeStats, 
  getMonthlyTrends, 
  getHighRiskAreas 
} from '../../api/admin.api.js';
import { formatNumber } from '../../utils/formatters.js';

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    overview: null,
    emergencyTypes: [],
    trends: [],
    highRisk: []
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const [overview, types, trends, risks] = await Promise.all([
          getAnalyticsOverview(),
          getEmergencyTypeStats(),
          getMonthlyTrends(),
          getHighRiskAreas()
        ]);

        setData({
          overview,
          emergencyTypes: types || [],
          trends: trends || [],
          highRisk: risks || []
        });
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) return <Navbar title="Platform Analytics"><Loader variant="overlay" message="Analyzing platform data..." /></Navbar>;

  return (
    <Navbar title="Platform Analytics">
      <div className="page-wrapper" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* ─── Top Level Overview ─── */}
        <div className="grid-4">
          <StatsCard 
            label="Total Requests" 
            value={data.overview?.totalRequests || 0} 
            icon="🆘" 
            color="blue" 
            delay={0} 
          />
          <StatsCard 
            label="Avg. Response Time" 
            value={data.overview?.avgResponseTime || 0} 
            icon="⚡" 
            color="green" 
            format="raw"
            sub="minutes"
            delay={100} 
          />
          <StatsCard 
            label="Completion Rate" 
            value={data.overview?.completionRate || 0} 
            icon="✅" 
            color="green" 
            format="percent"
            delay={200} 
          />
          <StatsCard 
            label="Active Volunteers" 
            value={data.overview?.activeVolunteers || 0} 
            icon="🤝" 
            color="orange" 
            delay={300} 
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          
          {/* ─── Emergency Type Distribution ─── */}
          <div className="card">
            <div className="card-header">
              <h3 className="section-title">Emergency Distribution</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {data.emergencyTypes.map((type) => (
                  <div key={type._id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ fontWeight: 600 }}>{type._id.toUpperCase()}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{formatNumber(type.count)}</span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--stone-200)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          height: '100%', 
                          width: `${(type.count / data.overview?.totalRequests) * 100}%`, 
                          background: 'var(--green-600)' 
                        }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── High Risk Areas ─── */}
          <div className="card">
            <div className="card-header">
              <h3 className="section-title">High Risk Areas</h3>
            </div>
            <div className="card-body">
              <table className="table">
                <thead>
                  <tr>
                    <th>Location</th>
                    <th>Incidents</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.highRisk.map((area, index) => (
                    <tr key={index}>
                      <td style={{ fontSize: '13px', fontWeight: 500 }}>{area.city}</td>
                      <td style={{ fontSize: '13px' }}>{area.count}</td>
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
          </div>

        </div>

        {/* ─── Monthly Trends ─── */}
        <div className="card">
          <div className="card-header">
            <h3 className="section-title">Monthly Activity Trends</h3>
          </div>
          <div className="card-body" style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '10px', paddingBottom: '30px' }}>
            {data.trends.map((month, index) => (
              <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div 
                  className="skeleton" // Reusing skeleton animation for bar grow effect
                  style={{ 
                    width: '100%', 
                    height: `${(month.count / Math.max(...data.trends.map(t => t.count))) * 150}px`, 
                    background: 'var(--blue-500)', 
                    borderRadius: 'var(--radius-sm)' 
                  }} 
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{month.month}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </Navbar>
  );
}