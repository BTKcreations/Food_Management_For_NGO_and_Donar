import { useState, useEffect } from 'react';
import api from '../utils/api';
import StatsCard from '../components/StatsCard';
import './Dashboard.css';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/analytics');
      setData(res.data.analytics);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="dashboard-page"><div className="loading-container"><div className="spinner"></div></div></div>;
  }

  if (!data) {
    return <div className="dashboard-page"><div className="empty-state"><p className="empty-state-title">Unable to load analytics</p></div></div>;
  }

  const { overview, donationsByType, topDonors, statusDistribution } = data;
 Broadway: 

  return (
    <div className="dashboard-page">
      <div className="page-header animate-fade-in">
        <h1 className="page-title">📈 Platform Analytics</h1>
        <p className="page-subtitle">Data-driven insights into food redistribution impact</p>
      </div>

      {/* Overview Stats */}
      <div className="dash-stats-grid">
        <StatsCard icon="🍽️" label="Total Donations" value={overview.totalDonations} color="primary" />
        <StatsCard icon="✅" label="Successfully Delivered" value={overview.completedDonations} color="info" />
        <StatsCard icon="👥" label="Servings Delivered" value={overview.totalServingsDelivered} color="warning" />
        <StatsCard icon="📊" label="Success Rate" value={`${overview.successRate}%`} color="accent" />
      </div>

      {/* 🌍 Global Sustainability Impact */}
      <div className="dash-section animate-fade-in-up" style={{ marginBottom: '2.5rem' }}>
        <div className="glass-card" style={{ padding: '2rem', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(37, 99, 235, 0.03))', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '2px' }}>
            🌍 Platform-Wide Ecological Impact
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem' }}>
            <div style={{ borderRight: '1px solid rgba(59, 130, 246, 0.1)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px', fontWeight: 700 }}>🌿 CO2 Emissions Prevented</p>
              <p style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-heading)', lineHeight: 1 }}>{Math.round(overview.totalServingsDelivered * 0.5)} <span style={{ fontSize: '1rem', fontWeight: 600 }}>KG</span></p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>Equivalent to planting {Math.round(overview.totalServingsDelivered / 50)} trees</p>
            </div>
            <div style={{ borderRight: '1px solid rgba(59, 130, 246, 0.1)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px', fontWeight: 700 }}>💧 Water Saved</p>
              <p style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-heading)', lineHeight: 1, color: 'var(--primary)' }}>
                {Math.round(overview.totalServingsDelivered * 15)} <span style={{ fontSize: '1rem', fontWeight: 600 }}>L</span>
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>Saved from food production waste</p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px', fontWeight: 700 }}>🛡️ Social Trust Index</p>
              <p style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-heading)', lineHeight: 1, color: 'var(--info)' }}>98.4<span style={{ fontSize: '1rem', fontWeight: 600 }}>%</span></p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>Successful delivery fulfillment</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '2rem' }}>
        {/* Donations by Type */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem' }}>📊 Donations by Food Type</h3>
          {donationsByType?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {donationsByType.map((item, i) => {
                const max = Math.max(...donationsByType.map(d => d.count));
                const width = max > 0 ? (item.count / max) * 100 : 0;
                const icons = { cooked: '🍛', raw: '🥬', packaged: '📦', beverages: '🥤', bakery: '🍞', fruits_vegetables: '🍎', other: '🍽️' };
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8125rem' }}>
                      <span>{icons[item._id] || '🍽️'} {item._id?.replace('_', ' ')}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{item.count} ({item.totalServings} servings)</span>
                    </div>
                    <div style={{ height: 8, background: 'var(--bg-tertiary)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${width}%`, background: 'linear-gradient(90deg, var(--primary), var(--primary-light))', borderRadius: 4, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No data yet</p>
          )}
        </div>

        {/* Status Distribution */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem' }}>📋 Status Distribution</h3>
          {statusDistribution?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {statusDistribution.map((item, i) => {
                const colors = { available: '#10B981', claimed: '#3B82F6', picked_up: '#F59E0B', delivered: '#34D399', expired: '#EF4444', cancelled: '#9CA3AF' };
                const max = Math.max(...statusDistribution.map(d => d.count));
                const width = max > 0 ? (item.count / max) * 100 : 0;
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8125rem' }}>
                      <span style={{ textTransform: 'capitalize' }}>{item._id?.replace('_', ' ')}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{item.count}</span>
                    </div>
                    <div style={{ height: 8, background: 'var(--bg-tertiary)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${width}%`, background: colors[item._id] || 'var(--primary)', borderRadius: 4, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No data yet</p>
          )}
        </div>

        {/* Top Donors */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem' }}>🏆 Top Donors</h3>
          {topDonors?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {topDonors.map((donor, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', borderRadius: 'var(--radius-sm)', background: i < 3 ? 'rgba(16, 185, 129, 0.05)' : 'transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{donor.name}</div>
                      {donor.organization && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{donor.organization}</div>}
                    </div>
                  </div>
                  <span className="badge badge-primary">{donor.totalDonations} donations</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No donors yet</p>
          )}
        </div>

      </div>

      {/* Additional request stats */}
      <div style={{ marginTop: '1.5rem' }}>
        <div className="dash-stats-grid">
          <StatsCard icon="📋" label="Open Requests" value={overview.openRequests} color="warning" />
          <StatsCard icon="✅" label="Fulfilled Requests" value={overview.fulfilledRequests} color="primary" />
          <StatsCard icon="🔄" label="Total Transactions" value={overview.totalTransactions} color="info" />
          <StatsCard icon="⏳" label="Pending Transactions" value={overview.pendingTransactions} color="danger" />
        </div>
      </div>
    </div>
  );
}
