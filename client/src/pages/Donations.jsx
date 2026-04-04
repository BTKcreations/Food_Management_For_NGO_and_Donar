import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import DonationCard from '../components/DonationCard';
import './Dashboard.css';

export default function Donations() {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: 'available', foodType: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchDonations();
  }, [filter]);

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (filter.foodType) params.append('foodType', filter.foodType);
      params.append('limit', '50');

      const res = await api.get(`/donations?${params.toString()}`);
      setDonations(res.data.donations);
    } catch (err) {
      console.error('Error fetching donations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (donationId) => {
    try {
      const donation = donations.find(d => d._id === donationId);
      let claimQuantity = donation?.remainingServings || 1;
      
      if (claimQuantity > 1) {
        const input = window.prompt(`How many servings would you like to claim? (Available: ${claimQuantity})`, claimQuantity);
        if (input === null) return; // Cancelled
        const num = parseInt(input);
        if (isNaN(num) || num <= 0 || num > claimQuantity) {
          alert(`Please enter a valid number between 1 and ${claimQuantity}`);
          return;
        }
        claimQuantity = num;
      }

      await api.put(`/donations/${donationId}/claim`, { claimQuantity });
      setMessage(`${claimQuantity} servings claimed successfully! Contact the donor for pickup.`);
      fetchDonations();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error claiming donation');
    }
  };

  return (
    <div className="dashboard-page">
      <div className="page-header animate-fade-in">
        <div>
          <h1 className="page-title">🔍 Available Food Donations</h1>
          <p className="page-subtitle">Browse and claim available food near you</p>
        </div>
      </div>

      {message && <div className="alert alert-success">{message}</div>}

      {/* Filters */}
      <div className="filters-bar glass-card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <select className="form-select" style={{ width: 'auto', minWidth: 160 }} value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}>
          <option value="available">Available</option>
          <option value="claimed">Claimed</option>
          <option value="delivered">Delivered</option>
          <option value="">All Status</option>
        </select>

        <select className="form-select" style={{ width: 'auto', minWidth: 160 }} value={filter.foodType} onChange={e => setFilter({ ...filter, foodType: e.target.value })}>
          <option value="">All Types</option>
          <option value="cooked">🍛 Cooked</option>
          <option value="raw">🥬 Raw</option>
          <option value="packaged">📦 Packaged</option>
          <option value="beverages">🥤 Beverages</option>
          <option value="bakery">🍞 Bakery</option>
          <option value="fruits_vegetables">🍎 Fruits & Vegetables</option>
        </select>

        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginLeft: 'auto' }}>
          {donations.length} donation{donations.length !== 1 ? 's' : ''} found
        </span>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Loading donations...</p>
        </div>
      ) : donations.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">🍽️</span>
          <p className="empty-state-title">No donations found</p>
          <p className="empty-state-text">Try changing the filters or check back later.</p>
        </div>
      ) : (
        <div className="donations-grid">
          {donations.map(donation => (
            <DonationCard 
              key={donation._id} 
              donation={donation} 
              onClaim={['ngo', 'volunteer', 'admin'].includes(user.role) ? handleClaim : null} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
