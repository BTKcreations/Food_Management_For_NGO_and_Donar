import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import DonationCard from '../components/DonationCard';
import { getImageUrl } from '../utils/imageHelper';
import './Dashboard.css';

export default function MyDonations() {
  const { user } = useAuth();
  const navigate = useNavigate();
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

  const handlePostAgain = (donation) => {
    // Navigate to create donation with pre-fill data (omitting IDs and times)
    const prefill = {
      foodName: donation.foodName,
      foodType: donation.foodType,
      description: donation.description,
      quantity: donation.quantity,
      servings: donation.servings,
      address: donation.address,
      contactPhone: donation.contactPhone,
      isVegetarian: donation.isVegetarian,
      latitude: donation.location?.coordinates[1],
      longitude: donation.location?.coordinates[0],
      specialInstructions: donation.specialInstructions,
      source: donation.source,
      urgency: donation.urgency,
      // Carry over item names/servings but not the files or times
      items: (donation.items || []).map(i => ({
        name: i.name,
        quantityOrWeight: i.quantityOrWeight,
        servings: i.servings
      }))
    };
    navigate('/donations/create', { state: { prefill } });
  };

  if (loading) {
    return <div className="dashboard-page"><div className="loading-container"><div className="spinner"></div></div></div>;
  }

  return (
    <div className="dashboard-page">
      <div className="page-header animate-fade-in">
        <h1 className="page-title">🍽️ My Donations</h1>
        <p className="page-subtitle">Manage your food donations and track your impact</p>
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
          {donations.map(donation => {
            const imageUrl = getImageUrl(donation.images?.[0] || donation.items?.[0]?.image);
            const canCancel = donation.status === 'available';
            const showPIN = donation.pickupCode && (donation.status === 'claimed' || donation.status === 'picked_up');

            return (
              <div key={donation._id} className="glass-card animate-fade-in-up" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: '160px', width: '100%', position: 'relative', overflow: 'hidden' }}>
                  {imageUrl ? (
                    <img src={imageUrl} alt={donation.foodName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', opacity: 0.5 }}>
                      🍽️
                    </div>
                  )}
                  <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                    <span className={`badge status-${donation.status}`}>{donation.status?.replace('_', ' ')}</span>
                  </div>
                </div>

                <div style={{ padding: '1.25rem', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '4px' }}>{donation.foodName}</h3>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {donation.remainingServings !== undefined && donation.remainingServings < donation.servings 
                        ? `${donation.remainingServings} Servings left` 
                        : `${donation.servings || 0} Servings total`}
                      {donation.foodType && ` • ${donation.foodType.replace('_', ' ')}`}
                    </p>
                  </div>
              
              {donation.claimedBy && (
                <div style={{ marginBottom: '1.25rem', padding: '0.75rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>NGO Contact</p>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{donation.claimedBy.name}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📞 {donation.claimedBy.phone || donation.claimedBy.organization}</p>
                </div>
              )}

              {showPIN && (
                <div style={{ marginBottom: '1.25rem', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '2px dashed var(--primary)', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>🔑 Pickup Verification Code</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '4px', color: 'var(--primary)' }}>{donation.pickupCode}</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', flexWrap: 'wrap' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/donations/${donation._id}`)}>
                  Details
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => handlePostAgain(donation)}>
                  🔄 Post Again
                </button>
                {canCancel && (
                  <button className="btn btn-warning btn-sm" onClick={() => handleStatusUpdate(donation._id, 'cancelled')}>
                    Cancel
                  </button>
                )}
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(donation._id)}>
                  Delete
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
