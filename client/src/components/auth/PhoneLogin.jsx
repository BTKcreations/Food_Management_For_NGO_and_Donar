import React, { useState, useEffect } from 'react';
import { auth } from '../../config/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import axios from 'axios';

const PhoneLogin = ({ role, onLoginSuccess, onLoginError }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible',
      'callback': (response) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
      }
    });
  }, []);

  const handleSendOtp = async () => {
    setLoading(true);
    try {
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(confirmation);
    } catch (error) {
      console.error('OTP Send Error:', error);
      onLoginError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;
      
      const idToken = await user.getIdToken();
      
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/firebase`, {
        idToken,
        role
      });
      
      if (response.data.success) {
        onLoginSuccess(response.data);
      } else {
        onLoginError(response.data.message);
      }
    } catch (error) {
      console.error('OTP Verify Error:', error);
      onLoginError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="phone-login-container" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <div id="recaptcha-container"></div>
      
      {!confirmationResult ? (
        <>
          <input 
            type="tel" 
            placeholder="+1234567890" 
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
          />
          <button 
            onClick={handleSendOtp}
            disabled={loading}
            style={{ padding: '10px', backgroundColor: '#10b981', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </>
      ) : (
        <>
          <input 
            type="text" 
            placeholder="Enter 6-digit OTP" 
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
          />
          <button 
            onClick={handleVerifyOtp}
            disabled={loading}
            style={{ padding: '10px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
          <button 
            onClick={() => setConfirmationResult(null)}
            style={{ backgroundColor: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px' }}
          >
            Change Phone Number
          </button>
        </>
      )}
    </div>
  );
};

export default PhoneLogin;
