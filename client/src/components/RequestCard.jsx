import { useNavigate } from 'react-router-dom';
import './RequestCard.css';

export default function RequestCard({ request, onCancel, onFulfill }) {
  const navigate = useNavigate();

  const handleCardClick = (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
      return;
    }
    if (request.matchedDonation) {
      const donationId = request.matchedDonation._id || request.matchedDonation;
      navigate(`/donations/${donationId}`);
    }
  };

  const calculateHoursLeft = (time) => {
    const hours = Math.floor((new Date(time) - new Date()) / (1000 * 60 * 60));
    return hours;
  };

  const urgencyColors = { 
    low: 'success', 
    medium: 'warning', 
    high: 'danger', 
    critical: 'danger' 
  };

  const hoursLeft = calculateHoursLeft(request.needByTime);

  return (
    <div 
      className={`request-card glass-card clickable-card urgency-${request.urgency}`}
      onClick={handleCardClick}
    >
      <div className="request-card-header">
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span className={`badge badge-${urgencyColors[request.urgency]}`}>
            {request.urgency} urgency
          </span>
          {hoursLeft > 0 && hoursLeft < 12 && (
            <span className="badge badge-danger">Ends in {hoursLeft}h</span>
          )}
        </div>
        <span className={`badge status-${request.status === 'open' ? 'available' : request.status}`}>
          {request.status.replace('_', ' ')}
        </span>
      </div>
      
      <div className="request-content">
        <h3 className="request-title">
          {request.servingsNeeded} units of {request.foodType} food
        </h3>
        <p className="request-address">📍 {request.address}</p>
        <p className="request-meta">⏰ Need by: {new Date(request.needByTime).toLocaleString()}</p>
        
        {request.description && (
          <p className="request-description">{request.description}</p>
        )}
      </div>

      {request.status === 'open' && (onCancel || onFulfill) && (
        <div className="request-actions" style={{ marginTop: '1rem' }}>
          {onFulfill && (
            <button 
              className="btn btn-primary btn-sm" 
              style={{ width: '100%', marginBottom: '0.5rem' }}
              onClick={(e) => { e.stopPropagation(); onFulfill(request); }}
            >
              🤝 Distribute from Warehouse
            </button>
          )}
          {onCancel && (
            <button 
              className="btn btn-ghost btn-sm" 
              style={{ width: '100%' }}
              onClick={(e) => { e.stopPropagation(); onCancel(request._id); }}
            >
              Cancel Request
            </button>
          )}
        </div>
      )}
      
      {request.matchedDonation && (
        <div className="match-indicator" style={{ marginTop: '1rem', background: 'var(--bg-tertiary)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '0.8125rem' }}>
          🎯 <span style={{ fontWeight: 600 }}>Matched!</span> Assistance is processing.
        </div>
      )}
    </div>
  );
}
