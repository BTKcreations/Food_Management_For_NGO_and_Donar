import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import RequestCard from '../components/RequestCard';
import StatsCard from '../components/StatsCard';
import MapboxTracker from '../components/MapboxTracker';
import './Dashboard.css';

export default function ReceiverDashboard() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMapFor, setShowMapFor] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqRes, delRes] = await Promise.all([
        api.get('/requests/my'),
        api.get('/transactions?role=receiver&activeOnly=true')
      ]);
      setRequests(reqRes.data.requests);
      setDeliveries(delRes.data.transactions);
    } catch (err) {
      console.error('Error fetching receiver data:', err);
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    accepted: 'badge-info',
    in_transit: 'badge-warning',
    completed: 'badge-success',
    cancelled: 'badge-danger'
  };

  if (loading) {
    return <div className="dashboard-page"><div className="loading-container"><div className="spinner"></div></div></div>;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header animate-fade-in">
        <div>
          <h1 className="dashboard-title">🥘 Receiver Dashboard</h1>
          <p className="dashboard-subtitle">Manage your community needs and track incoming relief</p>
        </div>
        <Link to="/requests/create" className="btn btn-primary shadow-sm">
          ➕ Post New Need
        </Link>
      </div>

      <div className="dash-stats-grid">
        <StatsCard 
          icon="📋" 
          label="Active Needs" 
          value={requests.filter(r => r.status === 'open').length} 
          color="primary" 
          path="/my-requests"
        />
        <StatsCard 
          icon="🚚" 
          label="Inbound Food" 
          value={deliveries.length} 
          color="info" 
          path="/transactions"
        />
      </div>

      <div className="dash-section animate-slide-up">
        <h2 className="dash-section-title">📍 Live Incoming Support</h2>
        {deliveries.length === 0 ? (
          <div className="glass-card empty-state-inline" style={{ padding: '3rem' }}>
            <p className="empty-text">No active deliveries are currently matched to your requests.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
            {deliveries.map(delivery => {
              const isInTransit = delivery.status === 'in_transit';
              const isTracking = showMapFor === delivery._id;
              
              return (
                <div key={delivery._id} className="glass-card animate-fade-in" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                       <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{delivery.donation?.foodName}</h3>
                       <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>From: {delivery.ngo?.name || 'Local Volunteer'}</p>
                    </div>
                    <span className={`badge ${statusColors[delivery.status]}`}>{delivery.status.replace('_', ' ')}</span>
                  </div>

                  {/* Tracking Section */}
                  {isInTransit && isTracking && (
                    <div style={{ height: '220px', background: 'var(--bg-tertiary)' }}>
                      <MapboxTracker 
                        volunteerLocation={{ lng: delivery.liveLocation?.coordinates[0], lat: delivery.liveLocation?.coordinates[1] }}
                        destinationLocation={{ lng: delivery.deliveryLocation?.coordinates[0], lat: delivery.deliveryLocation?.coordinates[1] }}
                        height="220px"
                      />
                    </div>
                  )}

                  <div style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <p style={{ fontSize: '0.875rem' }}><strong>📦 Quantity:</strong> {delivery.allocatedServings} servings</p>
                    </div>

                    {/* Security PIN Area */}
                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px dashed var(--border-light)', textAlign: 'center' }}>
                      <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '1px' }}>🔑 Handoff Verification PIN</p>
                      <p style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '6px', color: 'var(--primary)' }}>
                        {delivery.deliveryCode || '****'}
                      </p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Provide this code to the volunteer upon delivery.</p>
                    </div>

                    <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
                      <button 
                        className="btn btn-primary btn-sm" 
                        style={{ flex: 1 }}
                        onClick={() => setShowMapFor(isTracking ? null : delivery._id)}
                      >
                        {isTracking ? '✕ Close Map' : '📍 Track Delivery'}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/donations/${delivery.donation?._id}`)}>Details</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="dash-section animate-slide-up" style={{ marginTop: '3rem' }}>
        <div className="dash-section-header">
          <h2 className="dash-section-title">📋 Your Active Needs</h2>
          <Link to="/my-requests" className="btn btn-ghost btn-sm">View All History →</Link>
        </div>
        {requests.length === 0 ? (
          <p className="empty-text">You haven't posted any requests yet.</p>
        ) : (
          <div className="donations-grid">
            {requests.slice(0, 6).map(req => (
              <RequestCard key={req._id} request={req} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
