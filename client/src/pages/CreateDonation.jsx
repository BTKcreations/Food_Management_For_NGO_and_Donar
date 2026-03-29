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
    latitude: 0, longitude: 0, specialInstructions: '',
    safetyCertified: false, urgency: 'medium'
  });
  const [basket, setBasket] = useState([]);
  const [currentItemName, setCurrentItemName] = useState('');
  const [itemPrepAt, setItemPrepAt] = useState('');
  const [itemExpAt, setItemExpAt] = useState('');
  const [currentFile, setCurrentFile] = useState(null);
  const [showItemForm, setShowItemForm] = useState(false);
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

  const addToBasket = () => {
    if (!currentItemName || !currentFile) return;
    setBasket(prev => [...prev, { 
      name: currentItemName, 
      file: currentFile,
      preparedAt: itemPrepAt,
      expiresAt: itemExpAt
    }]);
    setCurrentItemName('');
    setItemPrepAt('');
    setItemExpAt('');
    setCurrentFile(null);
    setShowItemForm(false);
  };

  const removeFromBasket = (index) => {
    setBasket(prev => prev.filter((_, i) => i !== index));
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

    if (basket.length === 0) {
      setError('Please add at least one food item to your basket');
      setLoading(false);
      return;
    }

    try {
      const data = new FormData();
      
      // Auto-generate collective food name if not provided or just use items
      const collectiveName = basket.map(item => item.name).join(' + ');
      
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });

      // Override foodName with collective name if items exist
      data.set('foodName', collectiveName);

      // Append items
      basket.forEach((item, index) => {
        data.append('itemNames', item.name);
        data.append('itemPreparedDates', item.preparedAt);
        data.append('itemExpiresDates', item.expiresAt);
        data.append('images', item.file);
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
            <label className="form-label">🍲 Your Food Basket *</label>
            <div className="media-manager">
              {basket.length > 0 && (
                <div className="image-preview-grid" style={{ marginBottom: '1.5rem' }}>
                  {basket.map((item, i) => (
                    <div key={i} className="preview-item" style={{ height: 'auto', width: '140px', borderStyle: 'solid' }}>
                      <img src={URL.createObjectURL(item.file)} alt="Preview" style={{ height: '100px' }} />
                      <div style={{ padding: '8px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-light)' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</p>
                      </div>
                      <button type="button" className="preview-remove" onClick={() => removeFromBasket(i)}>×</button>
                    </div>
                  ))}
                </div>
              )}
              
              {!showItemForm ? (
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ width: '100%', border: '2px dashed var(--border-light)', background: 'transparent' }}
                  onClick={() => setShowItemForm(true)}
                >
                  ➕ Add Food Item
                </button>
              ) : (
                <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--primary-light)', animation: 'slideDown 0.3s ease' }}>
                  <h4 style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>Step 1: Capture or Select Photo</h4>
                  <div className="media-actions" style={{ marginBottom: '1rem' }}>
                    <label className="media-btn" style={{ background: currentFile ? 'rgba(16, 185, 129, 0.1)' : '' }}>
                      <span>{currentFile ? '📸 Image Ready' : '📸 Take Photo'}</span>
                      <input type="file" accept="image/*" capture="environment" onChange={(e) => setCurrentFile(e.target.files[0])} />
                    </label>
                    <label className="media-btn">
                      <span>📁 Select File</span>
                      <input type="file" accept="image/*" onChange={(e) => setCurrentFile(e.target.files[0])} />
                    </label>
                  </div>

                  {currentFile && (
                    <div className="item-details animate-fade-in">
                      <h4 style={{ fontSize: '0.875rem', marginBottom: '0.75rem' }}>Step 2: Enter Item Details</h4>
                      
                      <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Small Item Name *</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="e.g. Tomato Soup, Biryani..." 
                          value={currentItemName} 
                          onChange={(e) => setCurrentItemName(e.target.value)} 
                          autoFocus
                        />
                      </div>

                      <div className="form-row" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.7rem' }}>Prep Time (Optional)</label>
                          <input type="datetime-local" className="form-input" style={{ fontSize: '0.8125rem', padding: '8px' }} value={itemPrepAt} onChange={e => setItemPrepAt(e.target.value)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.7rem' }}>Expiry Time (Optional)</label>
                          <input type="datetime-local" className="form-input" style={{ fontSize: '0.8125rem', padding: '8px' }} value={itemExpAt} onChange={e => setItemExpAt(e.target.value)} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                        <button type="button" className="btn btn-primary" style={{ flex: 1, padding: '12px' }} onClick={addToBasket}>
                          ✅ Add to Basket
                        </button>
                        <button type="button" className="btn btn-ghost" style={{ padding: '12px' }} onClick={() => { setShowItemForm(false); setCurrentFile(null); setCurrentItemName(''); setItemPrepAt(''); setItemExpAt(''); }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '12px' }}>
              Add each food item individually with its photo for faster NGO matching.
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
