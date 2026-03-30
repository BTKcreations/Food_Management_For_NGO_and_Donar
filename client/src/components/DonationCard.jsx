import { useNavigate } from 'react-router-dom';
import './DonationCard.css';

export default function DonationCard({ donation, onClaim, showActions = true }) {
  const navigate = useNavigate();

  const handleCardClick = (e) => {
    // Prevent navigation if clicking on an interactive button/element inside the card
    if (e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.tagName === 'A' || e.target.closest('a')) {
      return;
    }
    navigate(`/donations/${donation._id}`);
  };

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

  const sourceDetails = {
    restaurant: { icon: '🍴', label: 'Restaurant' },
    hotel: { icon: '🏨', label: 'Hotel / Banquet' },
    marriage_event: { icon: '💍', label: 'Marriage / Wedding' },
    corporate_event: { icon: '🏢', label: 'Corporate Event' },
    household: { icon: '🏠', label: 'Household' },
    canteen: { icon: '🏫', label: 'Canteen / Mess' },
    other: { icon: '🍽️', label: 'Other Source' }
  };

  const isExpiringSoon = () => {
    const diff = new Date(donation.expiresAt) - new Date();
    return diff > 0 && diff < 3 * 60 * 60 * 1000; // less than 3 hours
  };

  return (
    <div 
      className={`donation-card glass-card ${isExpiringSoon() ? 'expiring-soon' : ''} clickable-card`}
      onClick={handleCardClick}
    >
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h3 className="donation-food-name" style={{ marginBottom: 0 }}>{donation.foodName}</h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
          {sourceDetails[donation.source]?.icon || '🍽️'} {sourceDetails[donation.source]?.label || 'Other'}
        </span>
      </div>
      
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
          <div className="btn btn-ghost btn-sm">
            View Details
          </div>
          
          {donation.status === 'in_transit' && (
            <div className="btn btn-primary btn-sm" style={{ background: 'var(--accent)', borderColor: 'var(--accent)' }}>
              📡 Track Live
            </div>
          )}

          {donation.status === 'available' && onClaim && (
            <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); onClaim(donation._id); }}>
              Claim Food
            </button>
          )}
        </div>
      )}
    </div>
  );
}
