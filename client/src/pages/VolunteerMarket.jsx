import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './Dashboard.css';

export default function VolunteerMarket() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAvailableDeliveries();
  }, []);

  const fetchAvailableDeliveries = async () => {
    try {
      const res = await api.get('/transactions/available');
      setTransactions(res.data.transactions);
    } catch (err) {
      console.error('Error fetching deliveries:', err);
      setError('Failed to load available deliveries.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (id) => {
    try {
      await api.put(`/transactions/${id}/assign`);
      // Re-fetch or update local state
      setTransactions(prev => prev.filter(t => t._id !== id));
      alert('Successfully assigned! Redirecting to your deliveries...');
      navigate('/my-deliveries');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign delivery');
    }
  };

  if (loading) return <div className="dashboard-page"><div className="spinner"></div></div>;

  return (
    <div className="dashboard-page">
      <div className="page-header animate-fade-in">
        <h1 className="page-title">🚚 Delivery Marketplace</h1>
        <p className="page-subtitle">Find claimed food donations that need transport to NGOs</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="stats-grid">
        {transactions.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <span className="empty-state-icon">✅</span>
            <p className="empty-state-title">No pending deliveries</p>
            <p className="empty-state-text">Check back later for new food pickups!</p>
          </div>
        ) : (
          transactions.map(t => (
            <div 
              key={t._id} 
              className="glass-card animate-fade-in clickable-card" 
              style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
              onClick={() => navigate(`/donations/${t.donation?._id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{t.donation?.foodName}</h3>
                  <span className="badge badge-info" style={{ marginTop: '0.5rem' }}>{t.donation?.servings} servings</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>From</p>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{t.donor?.name}</p>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
                <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  <strong>📍 Pickup:</strong> {t.donation?.address}
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${t.donation?.location?.coordinates[1]},${t.donation?.location?.coordinates[0]}`} 
                    target="_blank" 
                    rel="noreferrer"
                    style={{ marginLeft: '8px', color: 'var(--primary)', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 600 }}
                  >
                    (View on Maps)
                  </a>
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}><strong>📍 Destination:</strong> {t.receiver?.organization || t.receiver?.name}</p>
              </div>

              <button 
                className="btn btn-primary" 
                style={{ marginTop: 'auto', width: '100%' }}
                onClick={(e) => { e.stopPropagation(); handleAssign(t._id); }}
              >
                🤝 Accept Delivery
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
