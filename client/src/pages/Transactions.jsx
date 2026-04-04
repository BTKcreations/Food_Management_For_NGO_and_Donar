import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import MapboxTracker from '../components/MapboxTracker';
import './Dashboard.css';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [verificationCodes, setVerificationCodes] = useState({});
  const [statusMessage, setStatusMessage] = useState('');
  
  const location = useLocation();
  const navigate = useNavigate();
  const isNGOMode = location.pathname === '/my-deliveries';

  useEffect(() => {
    fetchTransactions();
  }, [filter, isNGOMode]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const statusParam = filter ? `status=${filter}` : '';
      const roleParam = isNGOMode ? 'role=ngo' : '';
      const queryParams = [statusParam, roleParam].filter(Boolean).join('&');
      const res = await api.get(`/transactions${queryParams ? `?${queryParams}` : ''}`);
      setTransactions(res.data.transactions);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAction = async (transactionId, newStatus) => {
    const code = verificationCodes[transactionId];
    if (!code || code.length !== 4) {
      alert('Please enter the 4-digit verification code.');
      return;
    }

    try {
      await api.put(`/transactions/${transactionId}/status`, {
        status: newStatus === 'pickup' ? 'in_transit' : 'completed',
        verificationCode: code
      });
      
      setStatusMessage(`Transaction updated successfully!`);
      setTimeout(() => setStatusMessage(''), 3000);
      fetchTransactions();
    } catch (err) {
      alert(err.response?.data?.message || 'Verification failed. Please check the code.');
    }
  };

  const handleCodeChange = (id, val) => {
    setVerificationCodes(prev => ({ ...prev, [id]: val }));
  };

  const statusColors = {
    pending: 'badge-warning',
    accepted: 'badge-info',
    in_transit: 'badge-info',
    completed: 'badge-success',
    failed: 'badge-danger',
    cancelled: 'badge-neutral'
  };

  if (loading) {
    return <div className="dashboard-page"><div className="loading-container"><div className="spinner"></div></div></div>;
  }

  return (
    <div className="dashboard-page">
      <div className="page-header animate-fade-in">
        <h1 className="page-title">{isNGOMode ? '🚚 Logistics Hub' : '🔄 Transactions'}</h1>
        <p className="page-subtitle">
          {isNGOMode 
            ? 'Manage active food pickups and deliveries in real-time' 
            : 'Track the complete redistribution lifecycle'}
        </p>
      </div>

      {statusMessage && <div className="alert alert-success">{statusMessage}</div>}

      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>Filter Status:</span>
        <select className="form-select" style={{ width: 'auto', minWidth: 160 }} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All Transactions</option>
          <option value="accepted">Accepted (Ready for Pickup)</option>
          <option value="in_transit">In Transit (Out for Delivery)</option>
          <option value="completed">Completed (Successfully Redistributed)</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {transactions.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">🔄</span>
          <p className="empty-state-title">No active deliveries found</p>
          <button className="btn btn-primary" onClick={() => navigate('/donations')}>Browse New Donations</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
          {transactions.map(t => {
            const isAccepted = t.status === 'accepted';
            const isInTransit = t.status === 'in_transit';
            const canVerify = isNGOMode && (isAccepted || isInTransit);
            
            return (
              <div key={t._id} className="glass-card animate-fade-in-up" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* Header with Status */}
                <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                   <div>
                     <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{t.donation?.foodName}</h3>
                     <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: #{t._id.slice(-6).toUpperCase()}</p>
                   </div>
                   <span className={`badge ${statusColors[t.status]}`}>{t.status?.replace('_', ' ')}</span>
                </div>

                {/* Tracking Map for Active Deliveries */}
                {isNGOMode && isInTransit && t.liveLocation?.coordinates[0] !== 0 && (
                  <div style={{ height: '180px', borderBottom: '1px solid var(--border-light)' }}>
                    <MapboxTracker 
                      volunteerLocation={{ lng: t.liveLocation.coordinates[0], lat: t.liveLocation.coordinates[1] }}
                      destinationLocation={{ lng: t.donation?.location?.coordinates[0], lat: t.donation?.location?.coordinates[1] }}
                      height="180px"
                    />
                  </div>
                )}

                <div style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                      <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Donor</p>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{t.donor?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Receiver</p>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{t.receiver?.name || 'Central Warehouse'}</p>
                    </div>
                  </div>

                  {/* Verification Area */}
                  {canVerify && (
                    <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                      <p style={{ fontSize: '0.8125rem', marginBottom: '0.75rem', fontWeight: 600 }}>
                        🛡️ {isAccepted ? 'Confirm Pickup' : 'Confirm Delivery'}
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input 
                          type="text" 
                          maxLength="4" 
                          placeholder="Code" 
                          className="form-input" 
                          style={{ flex: 1, textAlign: 'center', letterSpacing: '4px', fontWeight: 800 }} 
                          value={verificationCodes[t._id] || ''}
                          onChange={(e) => handleCodeChange(t._id, e.target.value)}
                        />
                        <button 
                          className="btn btn-primary btn-sm" 
                          style={{ whiteSpace: 'nowrap' }}
                          onClick={() => handleVerifyAction(t._id, isAccepted ? 'pickup' : 'delivery')}
                        >
                          Verify PIN
                        </button>
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/donations/${t.donation?._id}`)}>
                      View Full Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
