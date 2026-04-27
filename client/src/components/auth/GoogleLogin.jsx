import React from 'react';
import { auth, googleProvider } from '../../config/firebase';
import { signInWithPopup } from 'firebase/auth';
import axios from 'axios';

const GoogleLogin = ({ role, onLoginSuccess, onLoginError }) => {
  const handleGoogleLogin = async () => {
    try {
      // 1. Sign in with Google on the client
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // 2. Get the ID Token
      const idToken = await user.getIdToken();
      
      // 3. Send the token to our backend for verification and user sync
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
      console.error('Google Login Error:', error);
      onLoginError(error.message);
    }
  };

  return (
    <button 
      onClick={handleGoogleLogin}
      className="google-login-btn"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        padding: '10px 20px',
        borderRadius: '8px',
        border: '1px solid #ddd',
        backgroundColor: 'white',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '500',
        transition: 'background-color 0.3s'
      }}
    >
      <img 
        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
        alt="Google" 
        style={{ width: '18px', height: '18px' }}
      />
      Sign in with Google
    </button>
  );
};

export default GoogleLogin;
