import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import Navbar from '../components/Navbar';
import './AdminUsers.css';

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [form, setForm] = useState({ title: '', body: '', audience: 'all', house: '', isPublished: true });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [annRes, houseRes] = await Promise.all([
        axios.get('/api/admin/announcements'),
        axios.get('/api/admin/houses')
      ]);
      setAnnouncements(annRes.data);
      setHouses(houseRes.data);
    } catch (err) {
      toast.error('Error loading announcements: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingAnnouncement(null);
    setForm({ title: '', body: '', audience: 'all', house: '', isPublished: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAnnouncement) {
        await axios.put(`/api/admin/announcements/${editingAnnouncement._id}`, form);
      } else {
        await axios.post('/api/admin/announcements', form);
      }
      resetForm();
      loadData();
    } catch (err) {
      toast.error('Error saving announcement: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setForm({
      title: announcement.title,
      body: announcement.body,
      audience: announcement.audience,
      house: announcement.house || '',
      isPublished: announcement.isPublished
    });
  };

  const handleDelete = async (announcement) => {
    if (!window.confirm(`Delete "${announcement.title}"?`)) return;
    try {
      await axios.delete(`/api/admin/announcements/${announcement._id}`);
      loadData();
    } catch (err) {
      toast.error('Error deleting announcement: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="admin-users">
      <Navbar />
      <div className="users-inner">
        <div className="users-header">
          <div>
            <h1>Announcements</h1>
            <p>Create updates for all users, roles, or a specific house</p>
          </div>
        </div>

        <form className="filters-panel" onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label>Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label>Body</label>
            <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required rows="4" />
          </div>
          <div className="filter-selects">
            <div className="filter-group">
              <label>Audience</label>
              <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
                <option value="all">All</option>
                <option value="students">Students</option>
                <option value="mentors">Mentors</option>
                <option value="admins">Admins</option>
                <option value="house">House</option>
              </select>
            </div>
            {form.audience === 'house' && (
              <div className="filter-group">
                <label>House</label>
                <select value={form.house} onChange={(e) => setForm({ ...form, house: e.target.value })} required>
                  <option value="">Select House</option>
                  {houses.map((house) => <option key={house._id} value={house.slug}>{house.name}</option>)}
                </select>
              </div>
            )}
            <div className="filter-group">
              <label>Status</label>
              <select value={form.isPublished ? 'published' : 'draft'} onChange={(e) => setForm({ ...form, isPublished: e.target.value === 'published' })}>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="submit" className="btn btn-primary">{editingAnnouncement ? 'Update Announcement' : 'Create Announcement'}</button>
            {editingAnnouncement && <button type="button" className="btn btn-outline" onClick={resetForm}>Cancel</button>}
          </div>
        </form>

        {loading ? (
          <div className="spinner" style={{ marginTop: 40 }} />
        ) : (
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Audience</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {announcements.map((announcement) => (
                  <tr key={announcement._id}>
                    <td><strong>{announcement.title}</strong><br /><small>{announcement.body.substring(0, 80)}</small></td>
                    <td>{announcement.audience === 'house' ? `House: ${announcement.house}` : announcement.audience}</td>
                    <td>{announcement.isPublished ? 'Published' : 'Draft'}</td>
                    <td>{new Date(announcement.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-sm btn-outline" onClick={() => handleEdit(announcement)}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(announcement)} style={{ marginLeft: 8 }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {announcements.length === 0 && <div className="empty-state"><p>No announcements created yet.</p></div>}
          </div>
        )}
      </div>
    </div>
  );
}
