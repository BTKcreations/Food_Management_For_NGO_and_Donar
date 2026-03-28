import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import MapPicker from '../components/MapPicker';
import MapboxTracker from '../components/MapboxTracker';
import './Dashboard.css';

export default function DonationDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [donation, setDonation] = useState(null);
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [deliveryImages, setDeliveryImages] = useState([]);
  const [codeError, setCodeError] = useState('');

  useEffect(() => {
    fetchDonation();
  }, [id]);

  const fetchDonation = async () => {
    try {
      const res = await api.get(`/donations/${id}`);
      setDonation(res.data.donation);
      
      // If claimed, try to find the associated transaction to get codes/details
      if (res.data.donation.status !== 'available') {
        const transRes = await api.get('/transactions');
        const relatedTrans = transRes.data.transactions.find(t => t.donation?._id === id);
        if (relatedTrans) {
          // Fetch full transaction details (including codes if authorized)
          const fullTransRes = await api.get(`/transactions/${relatedTrans._id}`);
          setTransaction(fullTransRes.data.transaction);
        }
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 📡 High-Accuracy Live Tracking Logic (Zomato-style)
  useEffect(() => {
    let watchId = null;
    let heartbeatInterval = null;

    if (user?.role === 'volunteer' && transaction?.status === 'in_transit') {
      // 1. Precise Browser Geolocation Tracking
      if ("geolocation" in navigator) {
        watchId = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            // Immediate local update for volunteer
            setTransaction(prev => ({
              ...prev,
              liveLocation: { type: 'Point', coordinates: [longitude, latitude] }
            }));
          },
          (err) => console.error("GPS Error:", err),
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );

        // 2. Periodic "Pulse" to the Server
        heartbeatInterval = setInterval(async () => {
          try {
            const pos = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject);
            });
            await api.put(`/transactions/${transaction._id}/location`, {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude
            });
          } catch (err) {}
        }, 15000); // Pulse every 15 seconds
      }
    }

    // 🔄 Live Polling for NGOs/Donors to see the movement
    let observerInterval = null;
    if (user?.role !== 'volunteer' && transaction?.status === 'in_transit') {
      observerInterval = setInterval(async () => {
        try {
          const transRes = await api.get(`/transactions/${transaction._id}`);
          setTransaction(transRes.data.transaction);
        } catch (err) {}
      }, 10000); // Refresh observer map every 10 seconds
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (observerInterval) clearInterval(observerInterval);
    };
  }, [user, transaction?.status, transaction?._id]);

  const handleClaim = async () => {
    try {
      await api.put(`/donations/${id}/claim`);
      setMessage('Donation claimed successfully!');
      fetchDonation();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error claiming donation');
    }
  };

  const handleStatusUpdate = async (status) => {
    try {
      if ((status === 'picked_up' || status === 'delivered') && !verificationCode) {
        setCodeError('Please enter the 4-digit verification code provided by the other party.');
        return;
      }
      
      const formData = new FormData();
      formData.append('status', status === 'picked_up' ? 'in_transit' : status === 'delivered' ? 'completed' : status);
      formData.append('verificationCode', verificationCode);
      
      if (status === 'delivered' && deliveryImages.length > 0) {
        for (let i = 0; i < deliveryImages.length; i++) {
          formData.append('deliveryImages', deliveryImages[i]);
        }
      }

      const endpoint = transaction ? `/transactions/${transaction._id}/status` : `/donations/${id}/status`;
      await api.put(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setMessage(`Status updated successfully!`);
      setVerificationCode('');
      setDeliveryImages([]);
      setCodeError('');
      fetchDonation();
    } catch (err) {
      setCodeError(err.response?.data?.message || 'Verification failed. Please check the code.');
    }
  };

  const foodTypeIcons = {
    cooked: '🍛', raw: '🥬', packaged: '📦', beverages: '🥤',
    bakery: '🍞', fruits_vegetables: '🍎', other: '🍽️'
  };

  if (loading) {
    return <div className="dashboard-page"><div className="loading-container"><div className="spinner"></div></div></div>;
  }

  if (!donation) {
    return (
      <div className="dashboard-page">
        <div className="empty-state">
          <span className="empty-state-icon">❌</span>
          <p className="empty-state-title">Donation not found</p>
          <button className="btn btn-primary" onClick={() => navigate('/donations')}>Browse Donations</button>
        </div>
      </div>
    );
  }

  const isExpired = new Date(donation.expiresAt) < new Date();
  const isOwner = donation.donor?._id === user?.id;
  const canClaim = ['ngo', 'volunteer', 'admin'].includes(user?.role) && donation.status === 'available' && !isExpired;

  return (
    <div className="dashboard-page">
      <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>
        ← Back
      </button>

      {message && <div className="alert alert-success">{message}</div>}

      <div className="glass-card animate-fade-in" style={{ padding: '2rem', maxWidth: 800 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '2rem' }}>{foodTypeIcons[donation.foodType]}</span>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{donation.foodName}</h1>
            </div>
            <span className={`badge status-${donation.status}`} style={{ fontSize: '0.8125rem', padding: '6px 14px' }}>
              {donation.status?.replace('_', ' ')}
            </span>
          </div>
          {donation.isVegetarian && (
            <span className="badge badge-success" style={{ fontSize: '0.8125rem' }}>🟢 Vegetarian</span>
          )}
        </div>

        {donation.description && (
          <p style={{ color: 'var(--text-main)', marginBottom: '1.5rem', lineHeight: 1.6 }}>{donation.description}</p>
        )}

        {/* 📸 Food Photos (Donor Provided) */}
        {donation.images?.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-muted)' }}>📸 Proof of Food (Donor)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem' }}>
              {donation.images.map((img, i) => (
                <img 
                  key={i} 
                  src={`http://localhost:5000${img}`} 
                  alt="Food" 
                  style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }} 
                />
              ))}
            </div>
          </div>
        )}

        {/* Details grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Quantity</p>
            <p style={{ fontWeight: 600 }}>{donation.quantity}</p>
          </div>
          <div className="glass-card" style={{ padding: '1rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Servings</p>
            <p style={{ fontWeight: 600 }}>{donation.servings} servings</p>
          </div>
          <div className="glass-card" style={{ padding: '1rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Prepared At</p>
            <p style={{ fontWeight: 600 }}>{new Date(donation.preparedAt).toLocaleString()}</p>
          </div>
          <div className="glass-card" style={{ padding: '1rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Expires At</p>
            <p style={{ fontWeight: 600, color: isExpired ? 'var(--danger)' : 'inherit' }}>
              {new Date(donation.expiresAt).toLocaleString()}
              {isExpired && ' (EXPIRED)'}
            </p>
          </div>
        </div>

        {/* Location */}
        <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem', background: 'var(--bg-light)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>📍 Location Details</p>
          <p style={{ fontSize: '1rem', fontWeight: 600 }}>{donation.address}</p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '4px' }}>📞 {donation.contactPhone}</p>
          <a 
            href={`https://www.google.com/maps/search/?api=1&query=${donation.location?.coordinates[1]},${donation.location?.coordinates[0]}`} 
            target="_blank" 
            rel="noreferrer"
            style={{ display: 'inline-block', marginTop: '0.75rem', color: 'var(--primary)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}
          >
            🗺️ Open in Google Maps
          </a>
        </div>

        {/* Map View - Dynamic Tracking Engine */}
        {transaction?.status === 'in_transit' && transaction.liveLocation?.coordinates[0] !== 0 ? (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--primary)' }}>📡 Live Delivery Progress (Zomato Style)</h3>
            <MapboxTracker 
              volunteerLocation={{ 
                lng: transaction.liveLocation.coordinates[0], 
                lat: transaction.liveLocation.coordinates[1] 
              }} 
              destinationLocation={{ 
                lng: donation.location.coordinates[0], 
                lat: donation.location.coordinates[1] 
              }}
              height="400px"
            />
            {user?.role === 'volunteer' && (
              <a 
                href={`https://www.google.com/maps/dir/?api=1&destination=${donation.location.coordinates[1]},${donation.location.coordinates[0]}`} 
                target="_blank" 
                rel="noreferrer"
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: '1rem', textDecoration: 'none', textAlign: 'center', display: 'block' }}
              >
                🗺️ GET GOOGLE MAPS NAVIGATION
              </a>
            )}
          </div>
        ) : donation.location?.coordinates && donation.location.coordinates[0] !== 0 && (
          <MapPicker
            latitude={donation.location.coordinates[1]}
            longitude={donation.location.coordinates[0]}
            readOnly={true}
            showSearch={false}
            height="300px"
            label="Pickup Location on Map"
          />
        )}

        {/* Donor info */}
        {donation.donor && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>🏪 Donor Information</h3>
            <p style={{ fontWeight: 600 }}>{donation.donor.name}</p>
            {donation.donor.organization && <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{donation.donor.organization}</p>}
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>📧 {donation.donor.email} • 📞 {donation.donor.phone}</p>
          </div>
        )}

        {/* Verification Codes - Securely exposed based on role */}
        {transaction && (
          <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Show Pickup Code to Donor */}
            {user?.id === transaction.donor?._id && transaction.pickupCode && (
              <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '2px dashed var(--primary)', textAlign: 'center' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>🔐 Pickup Verification Code</p>
                <p style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '4px', color: 'var(--primary)' }}>{transaction.pickupCode}</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Give this code to the volunteer when they arrive for pickup.</p>
              </div>
            )}

            {/* Show Delivery Code to Receiver */}
            {user?.id === transaction.receiver?._id && transaction.deliveryCode && (
              <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '2px dashed var(--secondary)', textAlign: 'center' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>🔐 Delivery Verification Code</p>
                <p style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '4px', color: 'var(--secondary)' }}>{transaction.deliveryCode}</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Give this code to the volunteer when the food is delivered.</p>
              </div>
            )}

            {/* Show Verification Input for Volunteer */}
            {user?.id === transaction.volunteer?._id && (transaction.status === 'accepted' || transaction.status === 'in_transit') && (
              <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid var(--primary)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>🛡️ Verify Handoff</h3>
                <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                  Ask the {transaction.status === 'accepted' ? 'Donor' : 'NGO'} for their 4-digit verification code to proceed.
                </p>
                <input 
                  type="text" 
                  maxLength="4" 
                  placeholder="Enter 4-digit code" 
                  className="form-input" 
                  style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '4px', fontWeight: 700, marginBottom: '1rem' }}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                />

                {transaction.status === 'in_transit' && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label">📸 Add Proof of Distribution (Volunteer)</label>
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*" 
                      className="form-input" 
                      onChange={(e) => setDeliveryImages(Array.from(e.target.files))}
                    />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Please upload a photo of the food being received by the NGO.
                    </p>
                  </div>
                )}

                {codeError && <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '1rem' }}>{codeError}</p>}
                
                <button 
                  className="btn btn-primary btn-lg" 
                  style={{ width: '100%' }}
                  onClick={() => handleStatusUpdate(transaction.status === 'accepted' ? 'picked_up' : 'delivered')}
                >
                  {transaction.status === 'accepted' ? '📦 Confirm Pickup' : '✅ Confirm Delivery'}
                </button>
              </div>
            )}

            {/* 📸 Distribution Photos (Proof of Delivery) */}
            {transaction.status === 'completed' && transaction.deliveryImages?.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-muted)' }}>🤝 Proof of Impact (Distribution)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem' }}>
                  {transaction.deliveryImages.map((img, i) => (
                    <img 
                      key={i} 
                      src={`http://localhost:5000${img}`} 
                      alt="Distribution" 
                      style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--primary-light)' }} 
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {donation.specialInstructions && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>ℹ️ Special Instructions</h3>
            <p style={{ fontSize: '0.875rem' }}>{donation.specialInstructions}</p>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
          {canClaim && (
            <button className="btn btn-primary" onClick={handleClaim}>
              🤝 Claim This Food
            </button>
          )}
          
          {/* Legend/Alert for safety */}
          {donation.safetyCertified && (
            <div style={{ width: '100%', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', margin: '0.5rem 0' }}>
              🛡️ This donation is Safety Certified by the donor.
            </div>
          )}

          {isOwner && donation.status === 'available' && (
            <button className="btn btn-warning" onClick={() => handleStatusUpdate('cancelled')}>
              Cancel Donation
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
