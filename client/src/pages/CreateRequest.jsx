import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import MapPicker from '../components/MapPicker';
import './Dashboard.css';

export default function CreateRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    foodType: 'any', description: '', quantity: '', servingsNeeded: '',
    urgency: 'medium', address: user?.address || '', contactPhone: user?.phone || '',
    beneficiaryCount: '', needByTime: '', latitude: 0, longitude: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLocationChange = (lat, lng, addressFromMap) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      ...(addressFromMap && !prev.address ? { address: addressFromMap } : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.latitude || !formData.longitude || (formData.latitude === 0 && formData.longitude === 0)) {
      setError('Please set the delivery location using the map below');
      return;
    }

    setLoading(true);

    try {
      await api.post('/requests', {
        ...formData,
        servingsNeeded: parseInt(formData.servingsNeeded),
        beneficiaryCount: parseInt(formData.beneficiaryCount) || 1,
      });
      setSuccess('Request submitted! Donors have been notified.');
      setTimeout(() => navigate('/my-requests'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="page-header animate-fade-in">
        <h1 className="page-title">📋 Create Food Request</h1>
        <p className="page-subtitle">Submit a request for food support</p>
      </div>

      <div className="form-card glass-card" style={{ maxWidth: 760, padding: '2rem' }}>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="req-foodType">Food Type Needed</label>
              <select id="req-foodType" name="foodType" className="form-select" value={formData.foodType} onChange={handleChange}>
                <option value="any">Any Food</option>
                <option value="cooked">Cooked Food</option>
                <option value="raw">Raw Ingredients</option>
                <option value="packaged">Packaged Food</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="urgency">Urgency Level *</label>
              <select id="urgency" name="urgency" className="form-select" value={formData.urgency} onChange={handleChange}>
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🟠 High</option>
                <option value="critical">🔴 Critical</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="req-description">Description</label>
            <textarea id="req-description" name="description" className="form-input" placeholder="Describe your food needs..." value={formData.description} onChange={handleChange} rows={3} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="req-quantity">Quantity Needed *</label>
              <input id="req-quantity" type="text" name="quantity" className="form-input" placeholder="e.g. 10 kg, 50 meals" value={formData.quantity} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="servingsNeeded">Servings Needed *</label>
              <input id="servingsNeeded" type="number" name="servingsNeeded" className="form-input" placeholder="Number of servings" value={formData.servingsNeeded} onChange={handleChange} min="1" required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="beneficiaryCount">Number of Beneficiaries</label>
              <input id="beneficiaryCount" type="number" name="beneficiaryCount" className="form-input" placeholder="How many people?" value={formData.beneficiaryCount} onChange={handleChange} min="1" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="needByTime">Need By *</label>
              <input id="needByTime" type="datetime-local" name="needByTime" className="form-input" value={formData.needByTime} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="req-address">Delivery Address *</label>
            <input id="req-address" type="text" name="address" className="form-input" placeholder="Where should food be delivered?" value={formData.address} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="req-contactPhone">Contact Phone *</label>
            <input id="req-contactPhone" type="tel" name="contactPhone" className="form-input" value={formData.contactPhone} onChange={handleChange} required />
          </div>

          {/* 🗺️ Interactive Map Picker */}
          <MapPicker
            latitude={formData.latitude}
            longitude={formData.longitude}
            onLocationChange={handleLocationChange}
            height="380px"
            label="Set Delivery Location"
          />

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ flex: 1 }}>
              {loading ? 'Submitting...' : '📋 Submit Request'}
            </button>
            <button type="button" className="btn btn-ghost btn-lg" onClick={() => navigate(-1)}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
