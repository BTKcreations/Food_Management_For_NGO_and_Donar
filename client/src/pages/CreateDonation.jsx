import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import MapPicker from '../components/MapPicker';
import './Dashboard.css';

export default function CreateDonation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    foodName: '', foodType: 'cooked', description: '', quantity: '',
    servings: '', preparedAt: '', expiresAt: '', address: user?.address || '',
    contactPhone: user?.phone || '', isVegetarian: false,
    latitude: 0, longitude: 0, specialInstructions: '',
    safetyCertified: false, urgency: 'medium',
    images: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'file') {
      const files = Array.from(e.target.files);
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...files]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
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
    setSuccess('');

    if (!formData.latitude || !formData.longitude || (formData.latitude === 0 && formData.longitude === 0)) {
      setError('Please set your pickup location using the map below');
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'images') {
          for (let i = 0; i < formData.images.length; i++) {
            data.append('images', formData.images[i]);
          }
        } else {
          data.append(key, formData[key]);
        }
      });

      await api.post('/donations', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess('Donation created successfully! NGOs have been notified.');
      setTimeout(() => navigate('/my-donations'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create donation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="page-header animate-fade-in">
        <h1 className="page-title">🍽️ Create Food Donation</h1>
        <p className="page-subtitle">Share your surplus food with those in need</p>
      </div>

      <div className="form-card glass-card" style={{ maxWidth: 760, padding: '2rem' }}>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="foodName">Food Name *</label>
              <input id="foodName" type="text" name="foodName" className="form-input" placeholder="e.g. Rice, Dal, Biryani" value={formData.foodName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="foodType">Food Type *</label>
              <select id="foodType" name="foodType" className="form-select" value={formData.foodType} onChange={handleChange}>
                <option value="cooked">🍛 Cooked Food</option>
                <option value="raw">🥬 Raw Ingredients</option>
                <option value="packaged">📦 Packaged Food</option>
                <option value="beverages">🥤 Beverages</option>
                <option value="bakery">🍞 Bakery Items</option>
                <option value="fruits_vegetables">🍎 Fruits & Vegetables</option>
                <option value="other">🍽️ Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">Description</label>
            <textarea id="description" name="description" className="form-input" placeholder="Describe the food, packaging, any special notes..." value={formData.description} onChange={handleChange} rows={3} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="quantity">Quantity *</label>
              <input id="quantity" type="text" name="quantity" className="form-input" placeholder="e.g. 5 kg, 10 boxes" value={formData.quantity} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="servings">Number of Servings *</label>
              <input id="servings" type="number" name="servings" className="form-input" placeholder="How many people can it serve?" value={formData.servings} onChange={handleChange} min="1" required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="urgency">Urgency Level</label>
              <select id="urgency" name="urgency" className="form-select" value={formData.urgency} onChange={handleChange}>
                <option value="low">🟡 Low (Non-perishable/Long life)</option>
                <option value="medium">🟠 Medium (Standard)</option>
                <option value="high">🔴 High (Quick expiry/Immediate need)</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="preparedAt">Prepared At *</label>
              <input id="preparedAt" type="datetime-local" name="preparedAt" className="form-input" value={formData.preparedAt} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="expiresAt">Best Before *</label>
              <input id="expiresAt" type="datetime-local" name="expiresAt" className="form-input" value={formData.expiresAt} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="don-address">Pickup Address *</label>
            <input id="don-address" type="text" name="address" className="form-input" placeholder="Full pickup address" value={formData.address} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="contactPhone">Contact Phone *</label>
            <input id="contactPhone" type="tel" name="contactPhone" className="form-input" placeholder="10-digit number" value={formData.contactPhone} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label">Food Photos</label>
            <div className="media-manager">
              {formData.images.length > 0 && (
                <div className="image-preview-grid">
                  {Array.from(formData.images).map((file, i) => (
                    <div key={i} className="preview-item">
                      <img src={URL.createObjectURL(file)} alt="Preview" />
                      <button type="button" className="preview-remove" onClick={() => removeImage(i)}>×</button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="media-actions">
                <label className="media-btn">
                  <span>📸 Capture Photo</span>
                  <input type="file" accept="image/*" capture="environment" onChange={handleChange} />
                </label>
                <label className="media-btn">
                  <span>➕ Add Files</span>
                  <input type="file" accept="image/*" multiple onChange={handleChange} />
                </label>
              </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              Upload real photos to help with verification. You can add more photos one by one.
            </p>
          </div>

          {/* 🗺️ Interactive Map Picker */}
          <MapPicker
            latitude={formData.latitude}
            longitude={formData.longitude}
            onLocationChange={handleLocationChange}
            height="380px"
            label="Set Pickup Location"
          />

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input type="checkbox" id="isVegetarian" name="isVegetarian" checked={formData.isVegetarian} onChange={handleChange} style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
            <label htmlFor="isVegetarian" className="form-label" style={{ marginBottom: 0, cursor: 'pointer' }}>
              🟢 This is vegetarian food
            </label>
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
            <input type="checkbox" id="safetyCertified" name="safetyCertified" checked={formData.safetyCertified} onChange={handleChange} style={{ width: 22, height: 22, accentColor: 'var(--danger)', marginTop: '2px' }} required />
            <label htmlFor="safetyCertified" className="form-label" style={{ marginBottom: 0, cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-main)', fontWeight: 500 }}>
              ⚠️ I certify that the food is safe for consumption, prepared in a hygienic environment, and does not contain any known restricted substances.
            </label>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} id="create-donation-submit" style={{ flex: 1 }}>
              {loading ? 'Creating...' : '🍽️ Create Donation'}
            </button>
            <button type="button" className="btn btn-ghost btn-lg" onClick={() => navigate(-1)}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
