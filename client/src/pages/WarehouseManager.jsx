import { useState, useEffect } from 'react';
import api from '../utils/api';
import './Dashboard.css';

export default function WarehouseManager() {
  const [inventory, setInventory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [distData, setDistData] = useState({
    quantity: '',
    requestId: '',
    manualRecipient: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchInventory();
    fetchRequests();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory');
      setInventory(res.data.inventory);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await api.get('/requests?status=open');
      setRequests(res.data.requests);
    } catch (err) {}
  };

  const handleOpenDistribute = (item) => {
    setSelectedItem(item);
    setDistData({ quantity: item.quantity, requestId: '', manualRecipient: '' });
    setShowModal(true);
  };

  const handleDistribute = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/inventory/${selectedItem._id}/distribute`, distData);
      setMessage({ text: 'Distribution successful! Stock updated.', type: 'success' });
      setShowModal(false);
      fetchInventory();
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Error distributing item');
    }
  };

  const getStatus = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { label: 'Expired', color: 'var(--danger)' };
    if (diffDays <= 3) return { label: 'Expiring Soon', color: 'var(--warning)' };
    return { label: 'Fresh', color: 'var(--primary)' };
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header animate-fade-in">
        <div>
          <h1 className="dashboard-title">📦 Warehouse Hub</h1>
          <p className="dashboard-subtitle">Manage stockpiled resources and fulfill community needs</p>
        </div>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type} animate-fade-in`}>
          {message.text}
        </div>
      )}

      <div className="glass-card animate-slide-up">
        <div className="inventory-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className="section-title" style={{ margin: 0 }}>Current Inventory</h2>
          <div className="inventory-stats" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            📊 Total Unique Batches: {inventory.length}
          </div>
        </div>

        {loading ? (
          <div className="loading-container"><div className="spinner"></div></div>
        ) : inventory.length === 0 ? (
          <div className="empty-state" style={{ padding: '4rem 2rem' }}>
             <span style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}>📦</span>
             <p className="empty-text" style={{ fontSize: '1.125rem', color: 'var(--text-muted)' }}>Warehouse is empty. Start claiming bulk donations to build stock!</p>
          </div>
        ) : (
          <div className="inventory-table-wrapper">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Food Batch</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Expires On</th>
                  <th>Safety Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map(item => {
                  const status = getStatus(item.expiryDate);
                  return (
                    <tr key={item._id}>
                      <td className="item-name-cell">
                        <strong>{item.foodName}</strong>
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>{item.foodType}</td>
                      <td className="quantity-cell">{item.quantity} units</td>
                      <td>{new Date(item.expiryDate).toLocaleDateString()}</td>
                      <td>
                        <span className="status-pill" style={{ backgroundColor: status.color + '15', color: status.color }}>
                          {status.label}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-primary btn-sm" onClick={() => handleOpenDistribute(item)}>
                          🤝 Distribute
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Distribution Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-card animate-zoom-in" style={{ maxWidth: '500px' }}>
            <h2 style={{ marginBottom: '0.5rem' }}>Fulfill Request</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Distributing: <strong>{selectedItem.foodName}</strong> ({selectedItem.quantity} units available)
            </p>

            <form onSubmit={handleDistribute}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Quantity to Distribute</label>
                <input 
                  type="number" 
                  className="form-input" 
                  max={selectedItem.quantity}
                  min="1"
                  required
                  value={distData.quantity}
                  onChange={e => setDistData({ ...distData, quantity: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Link to Open Request (Optional)</label>
                <select 
                  className="form-select" 
                  value={distData.requestId}
                  onChange={e => setDistData({ ...distData, requestId: e.target.value })}
                >
                  <option value="">Manual Distribution (No specific app request)</option>
                  {requests
                    .filter(r => r.foodType === 'any' || r.foodType === selectedItem.foodType)
                    .map(r => (
                      <option key={r._id} value={r._id}>
                        {r.requester?.name} - {r.servingsNeeded} Servs ({r.urgency.toUpperCase()})
                      </option>
                    ))}
                </select>
              </div>

              {!distData.requestId && (
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Manual Recipient Name/Group</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Local Food Bank, St. Jude Orphanage"
                    value={distData.manualRecipient}
                    onChange={e => setDistData({ ...distData, manualRecipient: e.target.value })}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>Confirm Distribution</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .inventory-table-wrapper {
          overflow-x: auto;
          margin-top: 1rem;
        }
        .inventory-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .inventory-table th {
          padding: 1rem;
          background: rgba(255, 255, 255, 0.03);
          color: var(--text-muted);
          font-weight: 600;
          font-size: 0.8125rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .inventory-table td {
          padding: 1.25rem 1rem;
          border-bottom: 1px solid var(--border-light);
          font-size: 0.9375rem;
        }
        .item-name-cell {
          color: var(--text-primary);
        }
        .quantity-cell {
          font-weight: 700;
          color: var(--primary);
        }
        .status-pill {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          white-space: nowrap;
        }
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }
        .modal-content {
          width: 100%;
          padding: 2rem;
          background: var(--bg-secondary);
        }
      `}</style>
    </div>
  );
}
