import { useState, useEffect } from 'react';
import api from '../utils/api';
import RequestCard from '../components/RequestCard';
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
            <RequestCard 
              key={req._id} 
              request={req} 
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}
    </div>
  );
}
