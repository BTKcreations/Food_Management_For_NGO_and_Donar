import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import DonationCard from '../components/DonationCard';
import './Dashboard.css';

export default function MyDonations() {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchMyDonations();
  }, []);

  const fetchMyDonations = async () => {
    try {
      const res = await api.get('/donations/my');
      setDonations(res.data.donations);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (donationId, newStatus) => {
    try {
      await api.put(`/donations/${donationId}/status`, { status: newStatus });
      setMessage(`Donation status updated to ${newStatus}`);
      fetchMyDonations();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error updating status');
    }
  };

  const handleDelete = async (donationId) => {
    if (!window.confirm('Are you sure you want to delete this donation?')) return;
    try {
      await api.delete(`/donations/${donationId}`);
      setMessage('Donation deleted');
      fetchMyDonations();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error deleting donation');
    }
  };

  if (loading) {
    return <div className="dashboard-page"><div className="loading-container"><div className="spinner"></div></div></div>;
  }

  return (
    <div className="dashboard-page">
      <div className="page-header animate-fade-in">
        <h1 className="page-title">🍽️ My Donations</h1>
        <p className="page-subtitle">Manage your food donations</p>
      </div>

      {message && <div className="alert alert-success">{message}</div>}

      {donations.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">📦</span>
          <p className="empty-state-title">No donations yet</p>
          <p className="empty-state-text">Create your first donation to start making a difference!</p>
        </div>
      ) : (
        <div className="donations-grid">
          {donations.map(donation => (
            <div key={donation._id} className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{donation.foodName}</h3>
                <span className={`badge status-${donation.status}`}>{donation.status?.replace('_', ' ')}</span>
              </div>
              
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                {donation.servings} servings • {donation.quantity} • {donation.foodType}
              </p>
              
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                📍 {donation.address}
              </p>

              {donation.claimedBy && (
                <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem' }}>
                  Claimed by: <strong>{donation.claimedBy.name}</strong> ({donation.claimedBy.organization || donation.claimedBy.email})
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                {donation.status === 'claimed' && (
                  <button className="btn btn-primary btn-sm" onClick={() => handleStatusUpdate(donation._id, 'picked_up')}>
                    Mark Picked Up
                  </button>
                )}
                {donation.status === 'picked_up' && (
                  <button className="btn btn-primary btn-sm" onClick={() => handleStatusUpdate(donation._id, 'delivered')}>
                    Mark Delivered
                  </button>
                )}
                {donation.status === 'available' && (
                  <>
                    <button className="btn btn-warning btn-sm" onClick={() => handleStatusUpdate(donation._id, 'cancelled')}>
                      Cancel
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(donation._id)}>
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
