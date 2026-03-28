import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('foodbridge_token');
    const savedUser = localStorage.getItem('foodbridge_user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: userData } = res.data;
    
    localStorage.setItem('foodbridge_token', newToken);
    localStorage.setItem('foodbridge_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    
    return userData;
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    const { token: newToken, user: userData } = res.data;
    
    localStorage.setItem('foodbridge_token', newToken);
    localStorage.setItem('foodbridge_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('foodbridge_token');
    localStorage.removeItem('foodbridge_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('foodbridge_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ 
      user, token, loading, 
      login, register, logout, updateUser,
      isAuthenticated: !!token 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
