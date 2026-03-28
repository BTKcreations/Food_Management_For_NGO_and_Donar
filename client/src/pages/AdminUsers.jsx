import { useState, useEffect } from 'react';
import api from '../utils/api';
import './Dashboard.css';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [filter, search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter) params.append('role', filter);
      if (search) params.append('search', search);
      params.append('limit', '100');
      const res = await api.get(`/users?${params.toString()}`);
      setUsers(res.data.users);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id) => {
    try {
      await api.put(`/users/${id}/verify`);
      setMessage('User verified');
      fetchUsers();
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      setMessage('Error verifying user');
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await api.put(`/users/${id}/toggle-active`);
      setMessage('User status updated');
      fetchUsers();
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      setMessage('Error updating user');
    }
  };

  const roleColors = { donor: 'badge-success', ngo: 'badge-info', volunteer: 'badge-warning', admin: 'badge-danger' };

  if (loading) {
    return <div className="dashboard-page"><div className="loading-container"><div className="spinner"></div></div></div>;
  }

  return (
    <div className="dashboard-page">
      <div className="page-header animate-fade-in">
        <h1 className="page-title">👥 User Management</h1>
        <p className="page-subtitle">Manage platform users</p>
      </div>

      {message && <div className="alert alert-success">{message}</div>}

      <div className="glass-card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input 
          type="text" 
          className="form-input" 
          placeholder="Search by name, email..." 
          style={{ width: 'auto', minWidth: 250 }} 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
        <select className="form-select" style={{ width: 'auto', minWidth: 160 }} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All Roles</option>
          <option value="donor">Donors</option>
          <option value="ngo">NGOs</option>
          <option value="volunteer">Volunteers</option>
          <option value="admin">Admins</option>
        </select>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginLeft: 'auto' }}>{users.length} users</span>
      </div>

      <div className="table-container glass-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Verified</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id}>
                <td>
                  <strong>{u.name}</strong>
                  {u.organization && <><br /><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.organization}</span></>}
                </td>
                <td>{u.email}</td>
                <td>{u.phone}</td>
                <td><span className={`badge ${roleColors[u.role]}`}>{u.role}</span></td>
                <td>{u.isVerified ? '✅' : '❌'}</td>
                <td>{u.isActive ? <span className="badge badge-success">Active</span> : <span className="badge badge-danger">Inactive</span>}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {!u.isVerified && (
                      <button className="btn btn-primary btn-sm" onClick={() => handleVerify(u._id)}>Verify</button>
                    )}
                    <button className="btn btn-ghost btn-sm" onClick={() => handleToggleActive(u._id)}>
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
