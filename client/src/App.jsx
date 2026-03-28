import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateDonation from './pages/CreateDonation';
import Donations from './pages/Donations';
import MyDonations from './pages/MyDonations';
import DonationDetails from './pages/DonationDetails';
import CreateRequest from './pages/CreateRequest';
import MyRequests from './pages/MyRequests';
import Transactions from './pages/Transactions';
import Analytics from './pages/Analytics';
import AdminUsers from './pages/AdminUsers';
import VolunteerMarket from './pages/VolunteerMarket';
import './index.css';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const isLandingOrAuth = ['/', '/login', '/register'].includes(location.pathname);

  return (
    <>
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} />

        {/* Protected - All roles */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/donations" element={<ProtectedRoute><Donations /></ProtectedRoute>} />
        <Route path="/donations/:id" element={<ProtectedRoute><DonationDetails /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />

        {/* Donor routes */}
        <Route path="/donations/create" element={<ProtectedRoute roles={['donor', 'admin']}><CreateDonation /></ProtectedRoute>} />
        <Route path="/my-donations" element={<ProtectedRoute roles={['donor', 'admin']}><MyDonations /></ProtectedRoute>} />

        {/* NGO routes */}
        <Route path="/requests/create" element={<ProtectedRoute roles={['ngo', 'admin']}><CreateRequest /></ProtectedRoute>} />
        <Route path="/my-requests" element={<ProtectedRoute roles={['ngo', 'admin']}><MyRequests /></ProtectedRoute>} />

        {/* Volunteer routes */}
        <Route path="/my-deliveries" element={<ProtectedRoute roles={['volunteer', 'admin']}><Transactions /></ProtectedRoute>} />
        <Route path="/volunteer-market" element={<ProtectedRoute roles={['volunteer', 'admin']}><VolunteerMarket /></ProtectedRoute>} />

        {/* Admin routes */}
        <Route path="/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
