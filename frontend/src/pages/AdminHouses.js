import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import Navbar from '../components/Navbar';
import './AdminUsers.css';

export default function AdminHouses() {
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingHouse, setEditingHouse] = useState(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', color: '#2563eb', isActive: true });

  useEffect(() => {
    loadHouses();
  }, []);

  const loadHouses = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/houses');
      setHouses(res.data);
    } catch (err) {
      toast.error('Error loading houses: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingHouse(null);
    setForm({ name: '', slug: '', description: '', color: '#2563eb', isActive: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingHouse) {
        await axios.put(`/api/admin/houses/${editingHouse._id}`, form);
      } else {
        await axios.post('/api/admin/houses', form);
      }
      resetForm();
      loadHouses();
    } catch (err) {
      toast.error('Error saving house: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEdit = (house) => {
    setEditingHouse(house);
    setForm({
      name: house.name,
      slug: house.slug,
      description: house.description || '',
      color: house.color || '#2563eb',
      isActive: house.isActive
    });
  };

  const handleDelete = async (house) => {
    if (!window.confirm(`Delete ${house.name}?`)) return;
    try {
      await axios.delete(`/api/admin/houses/${house._id}`);
      loadHouses();
    } catch (err) {
      toast.error('Error deleting house: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="admin-users">
      <Navbar />
      <div className="users-inner">
        <div className="users-header">
          <div>
            <h1>House Management</h1>
            <p>Create and maintain the houses students can join during registration</p>
          </div>
        </div>

        <form className="filters-panel" onSubmit={handleSubmit}>
          <div className="filter-selects" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
            <div className="filter-group">
              <label>Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="filter-group">
              <label>Slug</label>
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto from name" />
            </div>
            <div className="filter-group">
              <label>Description</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="filter-group">
              <label>Color</label>
              <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
            </div>
            <div className="filter-group">
              <label>Status</label>
              <select value={form.isActive ? 'active' : 'inactive'} onChange={(e) => setForm({ ...form, isActive: e.target.value === 'active' })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="submit" className="btn btn-primary">{editingHouse ? 'Update House' : 'Create House'}</button>
            {editingHouse && <button type="button" className="btn btn-outline" onClick={resetForm}>Cancel</button>}
          </div>
        </form>

        {loading ? (
          <div className="spinner" style={{ marginTop: 40 }} />
        ) : (
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {houses.map((house) => (
                  <tr key={house._id}>
                    <td><span style={{ color: house.color, fontWeight: 700 }}>{house.name}</span></td>
                    <td>{house.slug}</td>
                    <td>{house.description || '-'}</td>
                    <td>{house.isActive ? 'Active' : 'Inactive'}</td>
                    <td>
                      <button className="btn btn-sm btn-outline" onClick={() => handleEdit(house)}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(house)} style={{ marginLeft: 8 }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {houses.length === 0 && <div className="empty-state"><p>No houses created yet.</p></div>}
          </div>
        )}
      </div>
    </div>
  );
}
