import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import './AdminUsers.css';

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('student');
  const [houseFilter, setHouseFilter] = useState('all');
  const [houses, setHouses] = useState([]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('mentor');
  const [house, setHouse] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [search, roleFilter, houseFilter]);

  useEffect(() => {
    loadHouses();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/users', {
        params: { search, role: roleFilter, house: houseFilter }
      });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadHouses = async () => {
    try {
      const res = await axios.get('/api/admin/houses');
      setHouses(res.data);
    } catch (err) {
      console.error(err);
      setHouses([]);
    }
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'active' ? 'disabled' : 'active';
    const confirmMsg = `Are you sure you want to ${nextStatus === 'active' ? 'enable' : 'disable'} ${user.name}'s account?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await axios.put(`/api/admin/users/${user._id}/status`, { status: nextStatus });
      loadUsers();
      toast.error(`✓ Account status changed to ${nextStatus}`);
    } catch (err) {
      toast.error('Error changing status: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !role) {
      toast.error('Please fill out all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      await axios.post('/api/admin/users', {
        name,
        email,
        password,
        role,
        house: role === 'student' ? house : null
      });
      setName('');
      setEmail('');
      setPassword('');
      setRole('mentor');
      setHouse('');
      setShowCreateModal(false);
      loadUsers();
      toast.success('✓ User created successfully!');
    } catch (err) {
      toast.error('Error creating user: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const houseBySlug = houses.reduce((map, currentHouse) => {
    map[currentHouse.slug] = currentHouse;
    return map;
  }, {});

  return (
    <div className="admin-users">
      <Navbar />
      <div className="users-inner">
        <div className="users-header">
          <div>
            <h1>{currentUser?.role === 'admin' ? '👥 User Management' : '🎓 Student Data'}</h1>
            <p>
              {currentUser?.role === 'admin'
                ? 'Administer student and mentor accounts, change roles, or toggle access'
                : 'Search and browse students by house, and click to view their portfolios'}
            </p>
          </div>
          {currentUser?.role === 'admin' && (
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              + Create Account
            </button>
          )}
        </div>

        <div className="filters-panel">
          <div className="search-box" style={{ flex: 1, maxWidth: currentUser?.role === 'mentor' ? '400px' : 'none' }}>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-selects">
            {currentUser?.role === 'admin' && (
              <div className="filter-group">
                <label>Role</label>
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                  <option value="student">Student</option>
                  <option value="mentor">Mentor</option>
                </select>
              </div>
            )}
            <div className="filter-group">
              <label>House</label>
              <select value={houseFilter} onChange={(e) => setHouseFilter(e.target.value)}>
                <option value="all">All Houses</option>
                {houses.map((houseOption) => (
                  <option key={houseOption._id} value={houseOption.slug}>{houseOption.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="spinner" style={{ marginTop: 40 }} />
        ) : users.length > 0 ? (
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  {currentUser?.role === 'admin' && <th>Role</th>}
                  <th>House</th>
                  <th>Status</th>
                  {currentUser?.role === 'admin' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className={u.status === 'disabled' ? 'row-disabled' : ''}>
                    <td className="font-bold">
                      <Link to={`/profile/${u._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        {u.name}
                      </Link>
                    </td>
                    <td>{u.email}</td>
                    {currentUser?.role === 'admin' && (
                      <td>
                        <span className={`role-badge role-${u.role}`}>
                          {u.role}
                        </span>
                      </td>
                    )}
                    <td>
                      {u.house ? (
                        <span>
                          {houseBySlug[u.house]?.name || u.house}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className={`status-dot dot-${u.status}`} />
                        <span style={{ textTransform: 'capitalize', fontSize: 13 }}>{u.status}</span>
                      </div>
                    </td>
                    {currentUser?.role === 'admin' && (
                      <td>
                        <button
                          className={`btn btn-sm ${u.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                          onClick={() => handleToggleStatus(u)}
                        >
                          {u.status === 'active' ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No matching users found.</p>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Account</h2>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label>Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter name"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label>Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label>Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    minLength="6"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label>Role</label>
                  <select value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="mentor">Mentor</option>
                    <option value="admin">Admin</option>
                    <option value="student">Student</option>
                  </select>
                </div>
                {role === 'student' && (
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label>House Assignment</label>
                    <select required value={house} onChange={(e) => setHouse(e.target.value)}>
                      <option value="">Select House</option>
                      {houses.map((houseOption) => (
                        <option key={houseOption._id} value={houseOption.slug}>{houseOption.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
