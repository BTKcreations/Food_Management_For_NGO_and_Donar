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
    safetyCertified: false, urgency: 'medium', source: 'other'
  });
  const [basket, setBasket] = useState([]);
  const [currentItemName, setCurrentItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemServings, setItemServings] = useState(0);
  const [itemPrepAt, setItemPrepAt] = useState('');
  const [itemExpAt, setItemExpAt] = useState('');
  const [currentFile, setCurrentFile] = useState(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addToBasket = () => {
    if (!currentItemName || !currentFile) return;
    setBasket(prev => [...prev, { 
      name: currentItemName, 
      file: currentFile,
      quantityOrWeight: itemQuantity,
      servings: itemServings,
      preparedAt: itemPrepAt,
      expiresAt: itemExpAt
    }]);
    setCurrentItemName('');
    setItemQuantity('');
    setItemServings(0);
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
    setLoading(true);
    setError('');
    setSuccess('');

    if (!formData.latitude || !formData.longitude || (formData.latitude === 0 && formData.longitude === 0)) {
      setError('Please set your pickup location using the map below');
      setLoading(false);
      return;
    }

    if (basket.length === 0) {
      setError('Please add at least one food item to your basket');
      setLoading(false);
      return;
    }

    try {
      const data = new FormData();
      
      // Auto-generate collective name and total quantity from basket
      const itemNames = basket.map(item => item.name);
      const collectiveName = itemNames.length > 3 
        ? `${itemNames.slice(0, 3).join(', ')} + ${itemNames.length - 3} more`
        : itemNames.join(' + ');

      // Also auto-suggest overall quantity if left blank
      const totalItemsQuantity = basket.length === 1 
        ? (basket[0].quantityOrWeight || '1 item')
        : `${basket.length} items (${itemNames.slice(0, 2).join(', ')}...)`;
      
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });

      data.set('foodName', collectiveName);
      if (!formData.quantity) {
        data.set('quantity', totalItemsQuantity);
      }

      basket.forEach((item, index) => {
        data.append('itemNames', item.name);
        data.append('itemPreparedDates', item.preparedAt || formData.preparedAt);
        data.append('itemExpiresDates', item.expiresAt || formData.expiresAt);
        data.append('itemQuantities', item.quantityOrWeight || '1 unit');
        data.append('itemServings', item.servings || 0);
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
          {/* 🍲 FOOD BASKET SECTION (FIRST PLACE) */}
          <div className="form-group" style={{ marginBottom: '2.5rem', paddingBottom: '2.5rem', borderBottom: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontSize: '1.125rem', color: 'var(--primary)', marginBottom: 0 }}>🍲 Your Food Basket *</label>
              <span className="badge badge-primary">{basket.length} items added</span>
            </div>

            <div className="media-manager">
              {basket.length > 0 && (
                <div className="image-preview-grid" style={{ marginBottom: '1.5rem' }}>
                  {basket.map((item, i) => (
                    <div key={i} className="preview-item" style={{ height: 'auto', width: '150px', borderStyle: 'solid' }}>
                      <img src={URL.createObjectURL(item.file)} alt="Preview" style={{ height: '110px' }} />
                      <div style={{ padding: '10px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-light)' }}>
                        <p style={{ fontSize: '0.8125rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px' }}>{item.name}</p>
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{item.quantityOrWeight || 'No qty'}</p>
                      </div>
                      <button type="button" className="preview-remove" onClick={() => removeFromBasket(i)}>×</button>
                    </div>
                  ))}
                </div>
              )}
              
              {!showItemForm ? (
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '1.25rem', fontSize: '1rem', border: '2px dashed var(--primary)', background: 'rgba(16, 185, 129, 0.05)', color: 'var(--primary)' }}
                  onClick={() => setShowItemForm(true)}
                >
                  ➕ Click to Add Food Item
                </button>
              ) : (
                <div className="glass-card" style={{ padding: '1.5rem', border: '2px solid var(--primary-light)', animation: 'slideDown 0.3s ease', background: 'var(--bg-secondary)' }}>
                  <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    
                    {/* Step 1: Image & Preview */}
                    <div style={{ flex: '1 1 250px' }}>
                      <h4 style={{ fontSize: '0.875rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>STEP 1: CAPTURE PHOTO</h4>
                      {currentFile ? (
                        <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '2px solid var(--primary)', marginBottom: '1rem' }}>
                          <img src={URL.createObjectURL(currentFile)} alt="Captured" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button type="button" className="preview-remove" style={{ top: '8px', right: '8px' }} onClick={() => setCurrentFile(null)}>×</button>
                        </div>
                      ) : (
                        <div className="media-actions" style={{ flexDirection: 'column', gap: '0.75rem' }}>
                          <label className="media-btn" style={{ padding: '2rem', borderStyle: 'dashed', background: 'var(--bg-tertiary)' }}>
                            <span style={{ fontSize: '1.5rem' }}>📸</span>
                            <span>Take Live Photo</span>
                            <input type="file" accept="image/*" capture="environment" onChange={(e) => setCurrentFile(e.target.files[0])} />
                          </label>
                          <label className="media-btn">
                            <span>📁 Upload from Gallery</span>
                            <input type="file" accept="image/*" onChange={(e) => setCurrentFile(e.target.files[0])} />
                          </label>
                        </div>
                      )}
                    </div>

                    {/* Step 2: Item Details */}
                    {currentFile && (
                      <div style={{ flex: '1 1 300px' }} className="animate-fade-in">
                        <h4 style={{ fontSize: '0.875rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>STEP 2: ITEM DETAILS</h4>
                        
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>What is this food? *</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="e.g. Tomato Soup, Veg Biryani..." 
                            value={currentItemName} 
                            onChange={(e) => setCurrentItemName(e.target.value)} 
                            autoFocus
                          />
                        </div>

                        <div className="form-row" style={{ gap: '0.75rem', marginBottom: '1rem' }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.75rem' }}>Qty / Weight</label>
                            <input type="text" className="form-input" placeholder="e.g. 2 kg, 1 box" value={itemQuantity} onChange={e => setItemQuantity(e.target.value)} />
                          </div>

                        </div>

                        <div className="form-row" style={{ gap: '0.75rem', marginBottom: '1.5rem' }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.75rem' }}>Prep Time</label>
                            <input type="datetime-local" className="form-input" value={itemPrepAt} onChange={e => setItemPrepAt(e.target.value)} />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.75rem' }}>Expiry Time</label>
                            <input type="datetime-local" className="form-input" value={itemExpAt} onChange={e => setItemExpAt(e.target.value)} />
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                          <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={addToBasket}>
                            ✅ Add to My Basket
                          </button>
                          <button type="button" className="btn btn-ghost" onClick={() => { setShowItemForm(false); setCurrentFile(null); setCurrentItemName(''); setItemQuantity(''); setItemServings(0); }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1.25rem', marginTop: '2.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.25rem' }}>📍</span> Logistics & Security
          </p>

          <div className="form-row">

            <div className="form-group">
              <label className="form-label" htmlFor="urgency">Urgency Level</label>
              <select id="urgency" name="urgency" className="form-select" value={formData.urgency} onChange={handleChange}>
                <option value="low">🟡 Low (Non-perishable/Long life)</option>
                <option value="medium">🟠 Medium (Standard)</option>
                <option value="high">🔴 High (Quick expiry/Immediate need)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="source">Donation Source *</label>
            <select id="source" name="source" className="form-select" value={formData.source} onChange={handleChange}>
              <option value="restaurant">🍴 Restaurant</option>
              <option value="hotel">🏨 Hotel / Banquet</option>
              <option value="marriage_event">💍 Marriage / Wedding</option>
              <option value="corporate_event">🏢 Corporate Event</option>
              <option value="household">🏠 Household / Individual</option>
              <option value="canteen">🏫 Canteen / Mess</option>
              <option value="other">🍽️ Other</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">Bulk Description (Optional)</label>
            <textarea id="description" name="description" className="form-input" placeholder="General notes about the overall donation..." value={formData.description} onChange={handleChange} rows={3} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="preparedAt">Universal Prep Time *</label>
              <input id="preparedAt" type="datetime-local" name="preparedAt" className="form-input" value={formData.preparedAt} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="expiresAt">Universal Best Before *</label>
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

          <MapPicker
            latitude={formData.latitude}
            longitude={formData.longitude}
            onLocationChange={handleLocationChange}
            height="380px"
            label="Set Pickup Location"
          />

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem' }}>
            <input type="checkbox" id="isVegetarian" name="isVegetarian" checked={formData.isVegetarian} onChange={handleChange} style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
            <label htmlFor="isVegetarian" className="form-label" style={{ marginBottom: 0, cursor: 'pointer' }}>
              🟢 This is vegetarian food
            </label>
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.1)', marginTop: '1rem' }}>
            <input type="checkbox" id="safetyCertified" name="safetyCertified" checked={formData.safetyCertified} onChange={handleChange} style={{ width: 22, height: 22, accentColor: 'var(--primary)', marginTop: '2px' }} required />
            <label htmlFor="safetyCertified" className="form-label" style={{ marginBottom: 0, cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-main)', fontWeight: 500 }}>
              🛡️ I certify that the food is safe, hygienic, and follows all distribution guidelines.
            </label>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} id="create-donation-submit" style={{ flex: 1 }}>
              {loading ? 'Creating Your Basket...' : '🚀 Submit Donation Basket'}
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
