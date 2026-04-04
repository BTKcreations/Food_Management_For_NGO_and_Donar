import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import ReceiverDashboard from './ReceiverDashboard';
import StatsCard from '../components/StatsCard';
import DonationCard from '../components/DonationCard';
import MapboxTracker from '../components/MapboxTracker';
import { DonationCardSkeleton } from '../components/Skeleton';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  
  if (user?.role === 'receiver') {
    return <ReceiverDashboard />;
  }

  const [analytics, setAnalytics] = useState(null);
  const [recentItems, setRecentItems] = useState([]);
  const [globalDeliveries, setGlobalDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [analyticsRes] = await Promise.all([
        api.get('/analytics/me')
      ]);
      setAnalytics(analyticsRes.data.analytics);

      if (user.role === 'donor') {
        const donationsRes = await api.get('/donations/my?limit=6');
        setRecentItems(donationsRes.data.donations);
      } else if (user.role === 'ngo') {
        const transRes = await api.get('/transactions?activeOnly=true&limit=6');
        const mapped = transRes.data.transactions.map(t => ({
          ...t.donation,
          status: t.status,
          _id: t.donation?._id || t._id,
          donor: t.donor,
          receiver: t.receiver
        }));
        setRecentItems(mapped);
      } else if (user.role === 'admin') {
        const [donationsRes, transRes] = await Promise.all([
          api.get('/donations?limit=6'),
          api.get('/transactions?activeOnly=true&limit=50')
        ]);
        setRecentItems(donationsRes.data.donations);
        setGlobalDeliveries(transRes.data.transactions);
      }
    } catch (err) {
      console.error('Dashboard data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    accepted: 'badge-info',
    picked_up: 'badge-warning',
    in_transit: 'badge-warning',
    completed: 'badge-success'
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getStatsCards = () => {
    if (!analytics) return [];

    if (user.role === 'donor') {
      return [
        { icon: '🍽️', label: 'Total Donations', value: analytics.myDonations || 0, color: 'primary', path: '/my-donations' },
        { icon: '✅', label: 'Successfully Delivered', value: analytics.deliveredDonations || 0, color: 'info', path: '/transactions' },
        { icon: '👥', label: 'Servings Provided', value: analytics.totalServingsProvided || 0, color: 'warning', path: '/my-donations' },
        { icon: '⭐', label: 'Impact Score', value: analytics.impactScore || 0, color: 'accent' }
      ];
    }

    if (user.role === 'ngo') {
      return [
        { icon: '📦', label: 'Claimed Donations', value: analytics.claimedDonations || 0, color: 'primary', path: '/donations' },
        { icon: '🏭', label: 'Warehouse Items', value: analytics.inventoryCount || 0, color: 'info', path: '/warehouse' },
        { icon: '🚚', label: 'My Deliveries', value: analytics.myDeliveries || 0, color: 'warning', path: '/transactions' },
        { icon: '🍽️', label: 'Total Distributed', value: analytics.totalReceived || 0, color: 'accent', path: '/donations' }
      ];
    }

    if (user.role === 'admin') {
      return [
        { icon: '👥', label: 'Active Users', value: analytics.totalUsers || 0, color: 'primary', path: '/users' },
        { icon: '🍽️', label: 'Total Success', value: analytics.totalDonations || 0, color: 'info', path: '/analytics' },
        { icon: '🚚', label: 'Active Deliveries', value: globalDeliveries.length, color: 'warning', path: '/transactions' },
        { icon: '🌍', label: 'Daily Impact', value: 'High', color: 'accent', path: '/analytics' }
      ];
    }

    return [];
  };

  const isAdmin = user.role === 'admin';

  if (loading) {
    return <div className="dashboard-page"><div className="loading-container"><div className="spinner"></div></div></div>;
  }

  return (
    <div className="dashboard-page">
      {/* Welcome */}
      <div className="dash-welcome animate-fade-in">
        <div>
          <h1 className="dash-greeting">{getGreeting()}, <span style={{ textTransform: 'capitalize', color: 'var(--primary)' }}>{user?.name?.split(' ')[0]}</span>! 👋</h1>
          <p className="dash-greeting-sub" style={{ fontSize: '1.0625rem', fontWeight: 500 }}>
            {user.role === 'donor' && 'Thank you for your generosity. Check your impact below.'}
            {user.role === 'ngo' && 'Browse available food donations and manage your requests.'}
            {user.role === 'admin' && 'Platform overview and global logistics monitor.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {isAdmin && <Link to="/analytics" className="btn btn-ghost btn-sm">Full Analytics Panel</Link>}
          <span className={`badge badge-primary`} style={{ fontSize: '0.875rem', padding: '6px 16px' }}>
            {user.role?.toUpperCase()}
            {user.isVerifiedOrg && ' ✅ VERIFIED'}
          </span>
        </div>
      </div>

      {/* Admin Global Monitor */}
      {isAdmin && (
        <div className="dash-section animate-slide-up">
           <div className="glass-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-light)' }}>
             <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--primary)', margin: 0 }}>
                  📍 Global Logistics Command Center
                </h2>
                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.75rem', fontWeight: 600 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: 8, height: 8, background: 'var(--info)', borderRadius: '50%' }}></span> Pickups</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: 8, height: 8, background: 'var(--warning)', borderRadius: '50%' }}></span> In Transit</span>
                </div>
             </div>
             
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', height: '480px' }}>
                <div style={{ background: 'var(--bg-tertiary)', position: 'relative' }}>
                  {/* Reuse MapboxTracker logic for a global view if needed, or simple markers */}
                  <MapboxTracker 
                     allDeliveries={globalDeliveries}
                     height="480px"
                     isAdminMode={true}
                  />
                </div>
                <div style={{ padding: '1.25rem', overflowY: 'auto', borderLeft: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.01)' }}>
                  <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase' }}>Live Activity Feed</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {globalDeliveries.slice(0, 8).map(d => (
                      <div key={d._id} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '0.8125rem', borderLeft: `3px solid ${d.status === 'in_transit' ? 'var(--warning)' : 'var(--info)'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700 }}>{d.donation?.foodName}</span>
                          <span className={`badge badge-sm ${statusColors[d.status]}`} style={{ fontSize: '0.6rem' }}>{d.status}</span>
                        </div>
                        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.75rem' }}> NGO: {d.ngo?.name}</p>
                        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.75rem' }}> 🕒 Updated {new Date(d.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    ))}
                    {globalDeliveries.length === 0 && <p className="empty-text">No active deliveries at the moment.</p>}
                  </div>
                </div>
             </div>
           </div>
        </div>
      )}

      {/* Sustainability Impact (CSR) - Hidden for Admin as it's personal CSR */}
      {!isAdmin && (
        <div className="dash-section animate-fade-in-up" style={{ marginBottom: '2.5rem' }}>
          <div className="glass-card" style={{ padding: '2rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(5, 150, 105, 0.03))', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
            <h2 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '2px' }}>
              🌍 Sustainability Impact
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '2rem' }}>
              <div style={{ borderRight: '1px solid rgba(16, 185, 129, 0.1)' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px', fontWeight: 700 }}>🥗 Meals Provided</p>
                <p style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-heading)', lineHeight: 1 }}>{user.role === 'donor' ? (analytics?.totalServingsProvided || 0) : (analytics?.totalReceived || 0) * 10 || 0}</p>
              </div>
              <div style={{ borderRight: '1px solid rgba(16, 185, 129, 0.1)' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px', fontWeight: 700 }}>📉 CO2 offset (KG)</p>
                <p style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-heading)', lineHeight: 1, color: 'var(--primary)' }}>
                  {Math.round((user.role === 'donor' ? (analytics?.myDonations || 0) : (analytics?.totalReceived || 0)) * 2.5)}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px', fontWeight: 700 }}>🛡️ Trust Score</p>
                <p style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-heading)', lineHeight: 1, color: 'var(--info)' }}>{user.isVerifiedOrg ? '99+' : '65'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Platforms Stats for Admin */}
      {isAdmin && (
        <div className="dash-stats-grid animate-slide-up" style={{ marginTop: '2rem' }}>
          {getStatsCards().map((stat, i) => (
            <StatsCard key={i} {...stat} />
          ))}
        </div>
      )}

      {/* Standard Stats for others */}
      {!isAdmin && (
        <div className="dash-stats-grid">
          {getStatsCards().map((stat, i) => (
            <StatsCard key={i} {...stat} />
          ))}
        </div>
      )}

      {/* Recent Activity */}
      <div className="dash-section animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="dash-section-header">
          <h2 className="dash-section-title">
            {user.role === 'donor' && '⚡ My Recent Contributions'}
            {user.role === 'ngo' && '📦 My Active Claims'}
            {user.role === 'admin' && '📋 Platform Content Moderation'}
          </h2>
          <Link to={isAdmin ? '/donations' : '/my-donations'} className="btn btn-ghost btn-sm">View All →</Link>
        </div>

        {recentItems.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">🍽️</span>
            <p className="empty-state-title">No activity found</p>
          </div>
        ) : (
          <div className="donations-grid">
            {recentItems.map(item => (
              <DonationCard key={item._id} donation={item} showActions={isAdmin} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
