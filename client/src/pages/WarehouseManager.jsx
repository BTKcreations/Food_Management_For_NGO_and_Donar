import { useState, useEffect } from 'react';
import api from '../utils/api';
import './Dashboard.css';

export default function WarehouseManager() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventory();
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
          <h1 className="dashboard-title">NGO Warehouse Inventory</h1>
          <p className="dashboard-subtitle">Track and manage your stockpiled food resources</p>
        </div>
      </div>

      <div className="glass-card animate-slide-up">
        <div className="inventory-header">
          <h2 className="section-title">Current Stock</h2>
          <div className="inventory-stats">
            Total Items: <strong>{inventory.length}</strong>
          </div>
        </div>

        {loading ? (
          <div className="spinner"></div>
        ) : inventory.length === 0 ? (
          <div className="empty-state">
             <p className="empty-text">Your warehouse is currently empty. Start claiming bulk donations to stock up!</p>
          </div>
        ) : (
          <div className="inventory-table-wrapper">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Food Item</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Expiry</th>
                  <th>Status</th>
                  <th>Action</th>
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
                      <td>{item.foodType.toUpperCase()}</td>
                      <td className="quantity-cell">{item.quantity}</td>
                      <td>{new Date(item.expiryDate).toLocaleDateString()}</td>
                      <td>
                        <span className="status-pill" style={{ backgroundColor: status.color + '20', color: status.color }}>
                          {status.label}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-ghost btn-sm">Distribute</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-muted);
          font-weight: 600;
          font-size: 0.875rem;
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
      `}</style>
    </div>
  );
}
