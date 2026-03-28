import { useState, useEffect } from 'react';
import api from '../utils/api';
import './Dashboard.css';

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/requests/my');
      setRequests(res.data.requests);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      await api.put(`/requests/${id}/cancel`);
      fetchRequests();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const urgencyColors = { low: 'success', medium: 'warning', high: 'danger', critical: 'danger' };

  if (loading) {
    return <div className="dashboard-page"><div className="loading-container"><div className="spinner"></div></div></div>;
  }

  return (
    <div className="dashboard-page">
      <div className="page-header animate-fade-in">
        <h1 className="page-title">📝 My Requests</h1>
        <p className="page-subtitle">Track your food requests</p>
      </div>

      {requests.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">📋</span>
          <p className="empty-state-title">No requests yet</p>
          <p className="empty-state-text">Submit a food request when your community needs support.</p>
        </div>
      ) : (
        <div className="donations-grid">
          {requests.map(req => (
            <div key={req._id} className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span className={`badge badge-${urgencyColors[req.urgency]}`}>{req.urgency} urgency</span>
                <span className={`badge status-${req.status === 'open' ? 'available' : req.status}`}>{req.status}</span>
              </div>
              
              <p style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                {req.servingsNeeded} servings of {req.foodType} food
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                📍 {req.address}
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                ⏰ Need by: {new Date(req.needByTime).toLocaleString()}
              </p>
              {req.description && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{req.description}</p>
              )}

              {req.status === 'open' && (
                <button className="btn btn-ghost btn-sm" style={{ marginTop: '1rem' }} onClick={() => handleCancel(req._id)}>
                  Cancel Request
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
