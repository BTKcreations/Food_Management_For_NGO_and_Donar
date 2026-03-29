import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    phone: '', role: 'donor', organization: '', address: '', city: '', state: '', pincode: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setLoading(true);

    try {
      const { confirmPassword, ...submitData } = formData;
      await register(submitData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
      </div>

      <div className="auth-container">
        <div className="auth-card auth-card-wide glass-card">
          <div className="auth-header">
            <Link to="/" className="auth-logo">
              <span>🌿</span> FoodBridge
            </Link>
            <h1>Create Account</h1>
            <p>Join the fight against food waste and hunger</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="name">Full Name *</label>
                <input id="name" type="text" name="name" className="form-input" placeholder="Your full name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-email">Email Address *</label>
                <input id="reg-email" type="email" name="email" className="form-input" placeholder="you@example.com" value={formData.email} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-password">Password *</label>
                <input id="reg-password" type="password" name="password" className="form-input" placeholder="Min 6 characters" value={formData.password} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">Confirm Password *</label>
                <input id="confirmPassword" type="password" name="confirmPassword" className="form-input" placeholder="Confirm password" value={formData.confirmPassword} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="phone">Phone Number *</label>
                <input id="phone" type="tel" name="phone" className="form-input" placeholder="10-digit number" value={formData.phone} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="role">I want to join as *</label>
                <select id="role" name="role" className="form-select" value={formData.role} onChange={handleChange}>
                  <option value="donor">🏪 Food Donor</option>
                  <option value="ngo">🏛️ NGO / Food Bank</option>
                  <option value="volunteer">🙋 Volunteer</option>
                  <option value="receiver">😋 Recipient / Receiver</option>
                </select>
              </div>
            </div>

            {formData.role === 'ngo' && (
              <div className="form-group">
                <label className="form-label" htmlFor="organization">Organization Name</label>
                <input id="organization" type="text" name="organization" className="form-input" placeholder="Your NGO / Organization name" value={formData.organization} onChange={handleChange} />
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="address">Address</label>
              <input id="address" type="text" name="address" className="form-input" placeholder="Street address" value={formData.address} onChange={handleChange} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="city">City</label>
                <input id="city" type="text" name="city" className="form-input" placeholder="City" value={formData.city} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="state">State</label>
                <input id="state" type="text" name="state" className="form-input" placeholder="State" value={formData.state} onChange={handleChange} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading} id="register-submit">
              {loading ? (
                <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div> Creating account...</>
              ) : (
                'Create Account →'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>Already have an account? <Link to="/login" className="auth-link">Sign In</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
