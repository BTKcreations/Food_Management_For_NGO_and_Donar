import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import RequestCard from '../components/RequestCard';
import { DonationCardSkeleton } from '../components/Skeleton';
import './Dashboard.css';

export default function Requests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');
  const [message, setMessage] = useState('');
  
  // Phase 2: Hub & Spoke Outbound Mapping
  const [showFulfillModal, setShowFulfillModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [fulfillData, setFulfillData] = useState({ inventoryId: '', allocatedQuantity: '' });

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/requests?status=${filter}`);
      setRequests(res.data.requests);
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFulfillInit = async (req) => {
    try {
      const res = await api.get('/inventory');
      const validInv = res.data.inventory.filter(i => i.quantity > 0);
      setInventory(validInv);
      setSelectedRequest(req);
      setFulfillData({ 
        inventoryId: validInv.length > 0 ? validInv[0]._id : '', 
        allocatedQuantity: req.servingsNeeded 
      });
      setShowFulfillModal(true);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    }
  };

  const handleFulfillSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/transactions/outbound', {
        requestId: selectedRequest._id,
        inventoryId: fulfillData.inventoryId,
        allocatedQuantity: fulfillData.allocatedQuantity
      });
      setMessage('✅ Outbound Logistics Initialized! Live Tracker activated.');
      setShowFulfillModal(false);
      fetchRequests();
      setTimeout(() => {
         setMessage('');
         navigate('/transactions');
      }, 2500);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error creating delivery routing.');
      setTimeout(() => setMessage(''), 4000);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="page-header animate-fade-in">
        <div>
          <h1 className="page-title">🤝 Community Needs</h1>
          <p className="page-subtitle">Browse and help fulfill active food requests from your community</p>
        </div>
        <div className="filter-tabs">
          <button 
            className={`tab ${filter === 'open' ? 'active' : ''}`} 
            onClick={() => setFilter('open')}
          >
            Open Requests
          </button>
          <button 
            className={`tab ${filter === 'matched' ? 'active' : ''}`} 
            onClick={() => setFilter('matched')}
          >
            Matched
          </button>
        </div>
      </div>

      {message && <div className="alert alert-success animate-fade-in" style={{ marginBottom: '1rem' }}>{message}</div>}

      {loading ? (
        <div className="donations-grid">
          {[1, 2, 3, 4, 5, 6].map(i => <DonationCardSkeleton key={i} />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="empty-state animate-fade-in">
          <span className="empty-state-icon">📋</span>
          <p className="empty-state-title">No requests found</p>
          <p className="empty-state-text">Everything looks good in your community right now!</p>
        </div>
      ) : (
        <div className="donations-grid animate-fade-in">
          {requests.map(req => (
            <RequestCard 
              key={req._id} 
              request={req} 
              onFulfill={user?.role === 'ngo' ? handleFulfillInit : undefined}
            />
          ))}
        </div>
      )}

      {/* Hub & Spoke Modal */}
      {showFulfillModal && selectedRequest && (
        <div className="modal-overlay">
          <div className="modal-content glass-card animate-zoom-in">
            <h2 style={{ marginBottom: '1rem' }}>Fulfill Request from Hub</h2>
            <form onSubmit={handleFulfillSubmit}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                You are dispatching inventory to {selectedRequest.address}.
              </p>

              <div className="form-group">
                <label className="form-label">Select Inventory Source</label>
                <select 
                  className="form-select" 
                  value={fulfillData.inventoryId}
                  onChange={(e) => setFulfillData({...fulfillData, inventoryId: e.target.value})}
                  required
                >
                  <option value="" disabled>Select available item...</option>
                  {inventory.map(inv => (
                    <option key={inv._id} value={inv._id}>
                      {inv.foodName} ({inv.quantity} {inv.unit} available)
                    </option>
                  ))}
                </select>
                {inventory.length === 0 && <p style={{color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.5rem'}}>You don't have enough claimed items in your Hub.</p>}
              </div>

              <div className="form-group">
                <label className="form-label">Units to Dispatch (Receiver needs {selectedRequest.servingsNeeded})</label>
                <input 
                  type="number" 
                  className="form-input" 
                  min="1"
                  max={inventory.find(i => i._id === fulfillData.inventoryId)?.quantity || 1}
                  value={fulfillData.allocatedQuantity}
                  onChange={(e) => setFulfillData({...fulfillData, allocatedQuantity: e.target.value})}
                  required
                />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowFulfillModal(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={inventory.length === 0}>Deploy Delivery</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; padding: 1.5rem;
        }
        .modal-content {
          width: 100%; max-width: 500px; padding: 2.5rem;
          background: var(--bg-secondary); border: 1px solid var(--border-light);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .animate-zoom-in { animation: zoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
      `}</style>
    </div>
  );
}
