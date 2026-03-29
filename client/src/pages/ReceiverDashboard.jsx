import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import RequestCard from '../components/RequestCard';
import StatsCard from '../components/StatsCard';
import './Dashboard.css';

export default function ReceiverDashboard() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="dashboard-page">
      <div className="dashboard-header animate-fade-in">
        <div>
          <h1 className="dashboard-title">Receiver Dashboard</h1>
          <p className="dashboard-subtitle">Manage your food needs and track incoming support</p>
        </div>
        <Link to="/requests/create" className="btn btn-primary">
          ➕ Post New Need
        </Link>
      </div>

      <div className="stats-grid">
        <StatsCard 
          icon="📝" 
          label="Active Requests" 
          value={requests.length} 
          color="primary" 
          path="/my-requests"
        />
        <StatsCard 
          icon="🚚" 
          label="Incoming Deliveries" 
          value={deliveries.length} 
          color="info" 
          path="/transactions"
        />
      </div>

      <div className="dashboard-grid">
        <div className="glass-card animate-fade-in">
          <h2 className="section-title">Incoming Support</h2>
          {deliveries.length === 0 ? (
            <p className="empty-text">No active deliveries at the moment.</p>
          ) : (
            <div className="active-list">
              {deliveries.map(delivery => (
                <div 
                  key={delivery._id} 
                  className="list-item clickable-item"
                  onClick={() => navigate(`/donations/${delivery.donation?._id}`)}
                >
                  <div className="item-info">
                    <h4>{delivery.donation?.foodName || 'Food Items'}</h4>
                    <p>{delivery.allocatedServings} servings • {delivery.status.replace('_', ' ')}</p>
                  </div>
                  <div className="btn btn-ghost btn-sm">
                    View Map
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card animate-fade-in">
          <h2 className="section-title">Your Recent Requests</h2>
          {requests.length === 0 ? (
            <p className="empty-text">You haven't posted any requests yet.</p>
          ) : (
            <div className="active-list grid-gap-small">
              {requests.slice(0, 5).map(req => (
                <RequestCard key={req._id} request={req} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
