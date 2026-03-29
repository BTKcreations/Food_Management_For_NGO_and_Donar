import { useState, useEffect } from 'react';
import api from '../utils/api';
import RequestCard from '../components/RequestCard';
import { DonationCardSkeleton } from '../components/Skeleton';
import './Dashboard.css';

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/requests?status=${filter}`);
      setRequests(res.data.requests);
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="page-header animate-fade-in">
        <div>
          <h1 className="page-title">🤝 Community Needs</h1>
          <p className="page-subtitle">Browse and help fulfill active food requests from your community</p>
        </div>
        <div className="filter-tabs">
          <button 
            className={`tab ${filter === 'open' ? 'active' : ''}`} 
            onClick={() => setFilter('open')}
          >
            Open Requests
          </button>
          <button 
            className={`tab ${filter === 'matched' ? 'active' : ''}`} 
            onClick={() => setFilter('matched')}
          >
            Matched
          </button>
        </div>
      </div>

      {loading ? (
        <div className="donations-grid">
          {[1, 2, 3, 4, 5, 6].map(i => <DonationCardSkeleton key={i} />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="empty-state animate-fade-in">
          <span className="empty-state-icon">📋</span>
          <p className="empty-state-title">No requests found</p>
          <p className="empty-state-text">Everything looks good in your community right now!</p>
        </div>
      ) : (
        <div className="donations-grid animate-fade-in">
          {requests.map(req => (
            <RequestCard key={req._id} request={req} />
          ))}
        </div>
      )}
    </div>
  );
}
