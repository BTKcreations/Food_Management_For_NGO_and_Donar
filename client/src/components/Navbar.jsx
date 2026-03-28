import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import api from '../utils/api';
import './Navbar.css';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const notifRef = useRef(null);

  const isLanding = location.pathname === '/';
  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications?limit=10');
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      // silently fail
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {}
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    return '/dashboard';
  };

  const getNavLinks = () => {
    if (!user) return [];
    
    const links = [
      { path: '/dashboard', label: 'Dashboard', icon: '📊' }
    ];

    if (user.role === 'donor') {
      links.push(
        { path: '/donations/create', label: 'New Donation', icon: '➕' },
        { path: '/my-donations', label: 'My Donations', icon: '🍽️' }
      );
    }

    if (user.role === 'ngo') {
      links.push(
        { path: '/donations', label: 'Browse Food', icon: '🔍' },
        { path: '/requests/create', label: 'New Request', icon: '📋' },
        { path: '/my-requests', label: 'My Requests', icon: '📝' }
      );
    }

    if (user.role === 'volunteer') {
      links.push(
        { path: '/donations', label: 'Browse Food', icon: '🔍' },
        { path: '/volunteer-market', label: 'Delivery Market', icon: '📦' },
        { path: '/my-deliveries', label: 'My Deliveries', icon: '🚗' }
      );
    }

    if (user.role === 'admin') {
      links.push(
        { path: '/donations', label: 'All Donations', icon: '🍽️' },
        { path: '/users', label: 'Users', icon: '👥' },
        { path: '/analytics', label: 'Analytics', icon: '📈' }
      );
    }

    links.push({ path: '/transactions', label: 'Transactions', icon: '🔄' });

    return links;
  };

  // Landing/Auth page navbar
  if (isLanding || isAuthPage) {
    return (
      <nav className="top-navbar landing-nav">
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            <span className="logo-icon">🌿</span>
            <span className="logo-text">FoodBridge</span>
          </Link>
          <div className="nav-actions">
            <ThemeToggle />
            {isAuthenticated ? (
              <Link to={getDashboardLink()} className="btn btn-primary btn-sm">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>
    );
  }

  // Dashboard navbar with sidebar
  const navLinks = getNavLinks();

  return (
    <>
      {/* Top Bar */}
      <header className="top-bar">
        <div className="top-bar-left">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <span></span><span></span><span></span>
          </button>
          <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <span></span><span></span><span></span>
          </button>
        </div>

        <div className="top-bar-right">
          <ThemeToggle />
          {/* Notifications */}
          <div className="notif-wrapper" ref={notifRef}>
            <button className="notif-btn" onClick={() => setNotifOpen(!notifOpen)} id="notification-bell">
              🔔
              {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>
            
            {notifOpen && (
              <div className="notif-dropdown">
                <div className="notif-header">
                  <h4>Notifications</h4>
                  {unreadCount > 0 && (
                    <button className="notif-mark-all" onClick={markAllRead}>Mark all read</button>
                  )}
                </div>
                <div className="notif-list">
                  {notifications.length === 0 ? (
                    <p className="notif-empty">No notifications yet</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n._id} className={`notif-item ${!n.isRead ? 'unread' : ''}`}>
                        <div className="notif-title">{n.title}</div>
                        <div className="notif-message">{n.message}</div>
                        <div className="notif-time">{new Date(n.createdAt).toLocaleDateString()}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="user-info">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.name}</span>
              <span className="user-role">{user?.role}</span>
            </div>
          </div>

          <button className="btn btn-ghost btn-sm" onClick={handleLogout} id="logout-btn">
            Logout
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo">
            <span className="logo-icon">🌿</span>
            {sidebarOpen && <span className="logo-text">FoodBridge</span>}
          </Link>
        </div>

        <nav className="sidebar-nav">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`sidebar-link ${location.pathname === link.path ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sidebar-icon">{link.icon}</span>
              {sidebarOpen && <span className="sidebar-label">{link.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          {sidebarOpen && (
            <div className="sidebar-user-card">
              <div className="user-avatar sm">{user?.name?.charAt(0).toUpperCase()}</div>
              <div>
                <div className="sidebar-user-name" style={{ textTransform: 'capitalize' }}>{user?.name}</div>
                <div className="sidebar-user-role">{user?.role?.toUpperCase()}</div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && <div className="sidebar-overlay" onClick={() => setMobileMenuOpen(false)} />}
    </>
  );
}
