import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../utils/api';
import './Dashboard.css';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const location = useLocation();
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

  const statusColors = {
    pending: 'badge-warning',
    accepted: 'badge-info',
    in_transit: 'badge-info',
    completed: 'badge-success',
    failed: 'badge-danger',
    cancelled: 'badge-neutral'
  };

  const sourceIcons = {
    restaurant: '🍴 Restaurant', 
    hotel: '🏨 Hotel / Banquet', 
    marriage_event: '💍 Marriage', 
    corporate_event: '🏢 Corporate', 
    household: '🏠 Household', 
    canteen: '🏫 Canteen', 
    other: '🍽️ Other'
  };

  if (loading) {
    return <div className="dashboard-page"><div className="loading-container"><div className="spinner"></div></div></div>;
  }

  return (
    <div className="dashboard-page">
      <div className="page-header animate-fade-in">
        <h1 className="page-title">{isNGOMode ? '🚚 My Deliveries' : '🔄 Transactions'}</h1>
        <p className="page-subtitle">
          {isNGOMode 
            ? 'Track your assigned food pickups and deliveries' 
            : 'Track food redistribution transactions'}
        </p>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <select className="form-select" style={{ width: 'auto', minWidth: 160 }} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="in_transit">In Transit</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>

        </select>
      </div>

      {transactions.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">🔄</span>
          <p className="empty-state-title">No transactions yet</p>
          <p className="empty-state-text">Transactions will appear when donations are claimed and processed.</p>
        </div>
      ) : (
        <div className="table-container glass-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Food</th>
                <th>Donor</th>
                <th>Source</th>
                <th>Receiver</th>
                {!isNGOMode && <th>NGO</th>}
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t._id}>
                  <td>
                    <strong>{t.donation?.foodName || 'N/A'}</strong>
                    <br />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {t.donation?.quantity || 'Unspecified'}
                      {t.donation?.servings > 0 && ` • ${t.donation.servings} Servs`}
                    </span>
                  </td>
                  <td>{t.donor?.name || 'N/A'}</td>
                  <td>
                    <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>
                      {sourceIcons[t.donation?.source] || '🍽️ Other'}
                    </span>
                  </td>
                  <td>{t.receiver?.name || 'N/A'}</td>
                  {!isNGOMode && <td>{t.ngo?.name || '—'}</td>}
                  <td><span className={`badge ${statusColors[t.status]}`}>{t.status?.replace('_', ' ')}</span></td>
                  <td style={{ fontSize: '0.8125rem' }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
