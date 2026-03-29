import { useNavigate } from 'react-router-dom';
import './RequestCard.css';

export default function RequestCard({ request, onCancel }) {
  const navigate = useNavigate();

  const handleCardClick = (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
      return;
    }
    // Deep linking to matched donation if exists, or just the request view
    if (request.matchedDonation) {
      navigate(`/donations/${request.matchedDonation._id || request.matchedDonation}`);
    }
  };

  const urgencyColors = { 
    low: 'success', 
    medium: 'warning', 
    high: 'danger', 
    critical: 'danger' 
  };

  return (
    <div 
      className={`request-card glass-card clickable-card urgency-${request.urgency}`}
      onClick={handleCardClick}
    >
      <div className="request-card-header">
        <span className={`badge badge-${urgencyColors[request.urgency]}`}>
          {request.urgency} urgency
        </span>
        <span className={`badge status-${request.status === 'open' ? 'available' : request.status}`}>
          {request.status.replace('_', ' ')}
        </span>
      </div>
      
      <div className="request-content">
        <h3 className="request-title">
          {request.servingsNeeded} servings of {request.foodType} food
        </h3>
        <p className="request-meta">📍 {request.address}</p>
        <p className="request-meta">⏰ Need by: {new Date(request.needByTime).toLocaleString()}</p>
        
        {request.description && (
          <p className="request-description">{request.description}</p>
        )}
      </div>

      {request.status === 'open' && onCancel && (
        <div className="request-actions">
          <button 
            className="btn btn-ghost btn-sm" 
            style={{ width: '100%' }}
            onClick={(e) => { e.stopPropagation(); onCancel(request._id); }}
          >
            Cancel Request
          </button>
        </div>
      )}
      
      {request.matchedDonation && (
        <div className="match-indicator">
          🎯 Matched with Donation
        </div>
      )}
    </div>
  );
}
