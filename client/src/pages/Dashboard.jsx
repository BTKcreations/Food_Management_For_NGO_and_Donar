import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import StatsCard from '../components/StatsCard';
import DonationCard from '../components/DonationCard';
import { DonationCardSkeleton } from '../components/Skeleton';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [recentItems, setRecentItems] = useState([]);
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

      // Role-specific data fetch
      if (user.role === 'donor') {
        const donationsRes = await api.get('/donations/my?limit=6');
        setRecentItems(donationsRes.data.donations);
      } else if (user.role === 'volunteer' || user.role === 'ngo') {
        const transRes = await api.get('/transactions?activeOnly=true&limit=6');
        // Map transactions to donation shape for easier rendering via DonationCard
        const mapped = transRes.data.transactions.map(t => ({
          ...t.donation,
          status: t.status, // Use transaction status
          _id: t.donation?._id || t._id,
          donor: t.donor,
          receiver: t.receiver
        }));
        setRecentItems(mapped);
      } else {
        const donationsRes = await api.get('/donations?limit=6');
        setRecentItems(donationsRes.data.donations);
      }
    } catch (err) {
      console.error('Dashboard data error:', err);
    } finally {
      setLoading(false);
    }
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
        { icon: '🍽️', label: 'Total Donations', value: analytics.myDonations || 0, color: 'primary' },
        { icon: '✅', label: 'Successfully Delivered', value: analytics.deliveredDonations || 0, color: 'info' },
        { icon: '👥', label: 'Servings Provided', value: analytics.totalServingsProvided || 0, color: 'warning' },
        { icon: '⭐', label: 'Impact Score', value: analytics.impactScore || 0, color: 'accent' }
      ];
    }

    if (user.role === 'ngo') {
      return [
        { icon: '📦', label: 'Claimed Donations', value: analytics.claimedDonations || 0, color: 'primary' },
        { icon: '📋', label: 'My Requests', value: analytics.myRequests || 0, color: 'info' },
        { icon: '✅', label: 'Fulfilled Requests', value: analytics.fulfilledRequests || 0, color: 'warning' },
        { icon: '🍽️', label: 'Total Received', value: analytics.totalReceived || 0, color: 'accent' }
      ];
    }

    if (user.role === 'volunteer') {
      return [
        { icon: '🚗', label: 'My Deliveries', value: analytics.myDeliveries || 0, color: 'primary' },
        { icon: '✅', label: 'Completed', value: analytics.completedDeliveries || 0, color: 'info' },
        { icon: '📦', label: 'Total Deliveries', value: analytics.totalDeliveries || 0, color: 'warning' }
      ];
    }

    return [];
  };

  const getQuickActions = () => {
    if (user.role === 'donor') {
      return [
        { label: 'Create Donation', icon: '➕', path: '/donations/create', color: 'primary' },
        { label: 'My Donations', icon: '🍽️', path: '/my-donations', color: 'info' },
        { label: 'Transactions', icon: '🔄', path: '/transactions', color: 'warning' }
      ];
    }
    if (user.role === 'ngo') {
      return [
        { label: 'Browse Food', icon: '🔍', path: '/donations', color: 'primary' },
        { label: 'Create Request', icon: '📋', path: '/requests/create', color: 'warning' },
        { label: 'My Requests', icon: '📝', path: '/my-requests', color: 'info' }
      ];
    }
    if (user.role === 'volunteer') {
      return [
        { label: 'Available Pickups', icon: '📦', path: '/donations', color: 'primary' },
        { label: 'My Deliveries', icon: '🚗', path: '/my-deliveries', color: 'info' },
        { label: 'Transactions', icon: '🔄', path: '/transactions', color: 'warning' }
      ];
    }
    if (user.role === 'admin') {
      return [
        { label: 'All Donations', icon: '🍽️', path: '/donations', color: 'primary' },
        { label: 'Manage Users', icon: '👥', path: '/users', color: 'info' },
        { label: 'Analytics', icon: '📈', path: '/analytics', color: 'warning' }
      ];
    }
    return [];
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dash-welcome">
          <div style={{ width: '200px', height: '32px', background: 'var(--bg-tertiary)', borderRadius: '4px' }}></div>
        </div>
        <div className="dash-stats-grid">
          {[1,2,3,4].map(i => <div key={i} className="glass-card" style={{ height: '120px' }}></div>)}
        </div>
        <div className="dash-section">
          <div className="donations-grid">
            {[1,2,3,4,5,6].map(i => <DonationCardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Welcome */}
      <div className="dash-welcome animate-fade-in">
        <div>
          <h1 className="dash-greeting">{getGreeting()}, <span style={{ textTransform: 'capitalize' }}>{user?.name?.split(' ')[0]}</span>! 👋</h1>
          <p className="dash-greeting-sub">
            {user.role === 'donor' && 'Thank you for your generosity. Check your impact below.'}
            {user.role === 'ngo' && 'Browse available food donations and manage your requests.'}
            {user.role === 'volunteer' && 'Check available pickups and track your deliveries.'}
            {user.role === 'admin' && 'Platform overview and management dashboard.'}
          </p>
        </div>
        <span className={`badge badge-primary`} style={{ fontSize: '0.875rem', padding: '6px 16px' }}>
          {user.role?.toUpperCase()}
          {user.isVerifiedOrg && ' ✅ VERIFIED'}
        </span>
      </div>

      {/* 🌍 Sustainability Impact Dashboard (CSR) */}
      <div className="dash-section animate-fade-in" style={{ marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05))', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🌍 Your Sustainability Impact
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
            <div style={{ borderRight: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>🥗 Meals Provided</p>
              <p style={{ fontSize: '2rem', fontWeight: 800 }}>{user.role === 'donor' ? (analytics?.totalServingsProvided || 0) : (analytics?.totalReceived || 0) * 10 || 0}</p>
            </div>
            <div style={{ borderRight: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>📉 CO2 offset (KG)</p>
              <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>
                {Math.round((user.role === 'donor' ? (analytics?.myDonations || 0) : (analytics?.totalReceived || 0)) * 2.5)} kg
              </p>
            </div>
            {user.role === 'volunteer' && (
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>✨ Karma Points</p>
                <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)' }}>{user.karmaPoints || 0}</p>
              </div>
            )}
            {user.role !== 'volunteer' && (
               <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>🛡️ Trust Score</p>
                <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--info)' }}>{user.isVerifiedOrg ? '99+' : '65'}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="dash-stats-grid">
        {getStatsCards().map((stat, i) => (
          <StatsCard key={i} {...stat} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="dash-section">
        <h2 className="dash-section-title">Quick Actions</h2>
        <div className="quick-actions-grid">
          {getQuickActions().map((action, i) => (
            <Link key={i} to={action.path} className={`quick-action-card glass-card`}>
              <span className="quick-action-icon">{action.icon}</span>
              <span className="quick-action-label">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Active Tasks / Recent Items Section */}
      <div className="dash-section">
        <div className="dash-section-header">
          <h2 className="dash-section-title">
            {user.role === 'donor' && '⚡ My Recent Contributions'}
            {user.role === 'volunteer' && '🚚 Active Deliveries'}
            {user.role === 'ngo' && '📦 My Active Claims'}
            {user.role === 'admin' && '📊 Overall Platform Activity'}
          </h2>
          <Link 
            to={user.role === 'donor' ? '/my-donations' : user.role === 'volunteer' ? '/my-deliveries' : '/donations'} 
            className="btn btn-ghost btn-sm"
          >
            View All →
          </Link>
        </div>

        {recentItems.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">🍽️</span>
            <p className="empty-state-title">No donations available</p>
            <p className="empty-state-text">
              {user.role === 'donor' 
                ? 'Create your first donation to get started!'
                : 'Check back later for available food donations.'}
            </p>
            {user.role === 'donor' && (
              <Link to="/donations/create" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
                Create Donation
              </Link>
            )}
          </div>
        ) : (
          <div className="donations-grid">
            {recentItems.map(item => (
              <DonationCard key={item._id} donation={item} showActions={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
