import { Link } from 'react-router-dom';
import './DonationCard.css';

export default function DonationCard({ donation, onClaim, showActions = true }) {
  const timeLeft = () => {
    const expires = new Date(donation.expiresAt);
    const now = new Date();
    const diff = expires - now;
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h left`;
    if (hours > 0) return `${hours}h ${mins}m left`;
    return `${mins}m left`;
  };

  const foodTypeIcons = {
    cooked: '🍛',
    raw: '🥬',
    packaged: '📦',
    beverages: '🥤',
    bakery: '🍞',
    fruits_vegetables: '🍎',
    other: '🍽️'
  };

  const isExpiringSoon = () => {
    const diff = new Date(donation.expiresAt) - new Date();
    return diff > 0 && diff < 3 * 60 * 60 * 1000; // less than 3 hours
  };

  return (
    <div className={`donation-card glass-card ${isExpiringSoon() ? 'expiring-soon' : ''}`}>
      <div className="donation-card-header">
        <div className="food-type-badge">
          <span className="food-icon">{foodTypeIcons[donation.foodType] || '🍽️'}</span>
          <span>{donation.foodType?.replace('_', ' ')}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {donation.donor?.isVerifiedOrg && (
            <span className="verified-badge" title="Verified Organization">✅</span>
          )}
          <span className={`badge status-${donation.status}`}>
            {donation.status?.replace('_', ' ')}
          </span>
        </div>
      </div>

      <h3 className="donation-food-name">{donation.foodName}</h3>
      
      {donation.description && (
        <p className="donation-description">{donation.description}</p>
      )}

      <div className="donation-meta">
        <div className="meta-item">
          <span className="meta-icon">👥</span>
          <span>{donation.servings} servings</span>
        </div>
        <div className="meta-item">
          <span className="meta-icon">📦</span>
          <span>{donation.quantity}</span>
        </div>
        <div className="meta-item">
          <span className="meta-icon">⏰</span>
          <span className={isExpiringSoon() ? 'text-danger' : ''} style={isExpiringSoon() ? { fontWeight: 800, animation: 'pulse-danger 2s infinite' } : {}}>
            {isExpiringSoon() ? '⚡ URGENT: ' : ''}{timeLeft()}
          </span>
        </div>
        {donation.isVegetarian && (
          <div className="meta-item veg-badge">
            <span className="meta-icon">🟢</span>
            <span>Veg</span>
          </div>
        )}
      </div>

      <div className="donation-location">
        <span className="meta-icon">📍</span>
        <span>{donation.address}</span>
      </div>

      {donation.donor && (
        <div className="donation-donor">
          <div className="donor-avatar">
            {donation.donor.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="donor-name">{donation.donor.name}</span>
            {donation.donor.organization && (
              <span className="donor-org">{donation.donor.organization}</span>
            )}
          </div>
        </div>
      )}

      {showActions && (
        <div className="donation-actions">
          <Link to={`/donations/${donation._id}`} className="btn btn-ghost btn-sm">
            View Details
          </Link>
          
          {donation.status === 'in_transit' && (
            <Link to={`/donations/${donation._id}`} className="btn btn-primary btn-sm" style={{ background: 'var(--accent)', borderColor: 'var(--accent)' }}>
              📡 Track Live
            </Link>
          )}

          {donation.status === 'available' && onClaim && (
            <button className="btn btn-primary btn-sm" onClick={() => onClaim(donation._id)}>
              Claim Food
            </button>
          )}
        </div>
      )}
    </div>
  );
}
