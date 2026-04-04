import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { getImageUrl } from '../utils/imageHelper';
import './Dashboard.css';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications?limit=50');
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => 
        n._id === id ? { ...n, isRead: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {}
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {}
  };

  const deleteNotif = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(notifications.filter(n => n._id !== id));
      const removedItem = notifications.find(n => n._id === id);
      if (removedItem && !removedItem.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {}
  };

  const getIcon = (type) => {
    switch(type) {
      case 'donation_claimed': return '🤝';
      case 'donation_picked_up': return '📦';
      case 'donation_delivered': return '✅';
      case 'new_donation': return '🍛';
      case 'volunteer_assigned': return '🛵';
      default: return '🔔';
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header animate-fade-in">
        <div>
          <h1 className="dashboard-title">Notifications</h1>
          <p className="dashboard-subtitle">Stay updated on your food redistribution impact</p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={markAllRead}>
            Mark all as read
          </button>
        )}
      </div>

      <div className="glass-card animate-fade-in" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="spinner"></div>
            <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading alerts...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state" style={{ padding: '5rem 2rem' }}>
            <span className="empty-state-icon" style={{ fontSize: '4rem', opacity: 0.3 }}>📬</span>
            <p className="empty-state-title">No notifications yet</p>
            <p className="empty-state-text">We'll alert you when there's an update on your donations or claims.</p>
          </div>
        ) : (
          <div className="notif-full-list">
            {notifications.map((n, index) => (
              <div 
                key={n._id} 
                className={`notif-full-item ${!n.isRead ? 'unread' : ''}`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="notif-full-icon">{getIcon(n.type)}</div>
                <div 
                  className="notif-full-content" 
                  onClick={() => {
                    markRead(n._id);
                    if (n.relatedDonation) navigate(`/donations/${n.relatedDonation}`);
                  }}
                >
                  <div className="notif-full-title">{n.title} {!n.isRead && <span className="notif-new-tag">NEW</span>}</div>
                  <p className="notif-full-message">{n.message}</p>
                  
                  {n.images && n.images.length > 0 && (
                    <div className="notif-gallery" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                      {n.images.map((img, i) => (
                        <img 
                          key={i} 
                          src={getImageUrl(img)} 
                          alt="Proof" 
                          style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-light)' }} 
                        />
                      ))}
                    </div>
                  )}

                  <div className="notif-full-meta">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="notif-full-actions">
                  {!n.isRead && (
                    <button className="notif-action-btn" title="Mark as read" onClick={() => markRead(n._id)}>👁️</button>
                  )}
                  <button className="notif-action-btn delete" title="Delete" onClick={() => deleteNotif(n._id)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .notif-full-item {
          display: flex;
          align-items: flex-start;
          gap: 1.5rem;
          padding: 1.5rem 2rem;
          border-bottom: 1px solid var(--border-light);
          transition: all 0.3s ease;
          animation: fadeInUp 0.5s ease both;
        }
        .notif-full-item:hover {
          background: var(--bg-card-hover);
        }
        .notif-full-item.unread {
          background: var(--glass-highlight);
          border-left: 4px solid var(--primary);
        }
        .notif-full-icon {
          font-size: 2rem;
          min-width: 3rem;
          height: 3rem;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .notif-full-content {
          flex: 1;
          cursor: pointer;
        }
        .notif-full-title {
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .notif-new-tag {
          font-size: 0.625rem;
          background: var(--primary);
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 800;
        }
        .notif-full-message {
          font-size: 0.9375rem;
          color: var(--text-main);
          line-height: 1.6;
          opacity: 0.8;
        }
        .notif-full-meta {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 0.5rem;
        }
        .notif-full-actions {
          display: flex;
          gap: 0.5rem;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .notif-full-item:hover .notif-full-actions {
          opacity: 1;
        }
        .notif-action-btn {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-light);
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s;
        }
        .notif-action-btn:hover {
          border-color: var(--primary);
          transform: translateY(-2px);
        }
        .notif-action-btn.delete:hover {
          border-color: var(--danger);
          color: var(--danger);
        }
      `}</style>
    </div>
  );
}
