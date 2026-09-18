import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axiosInstance from '../utils/axiosConfig';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import './AdminPhases.css';

export default function AdminPhases() {
  const { phaseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [phases, setPhases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPhase, setEditingPhase] = useState(null);
  const [showSuccessOption, setShowSuccessOption] = useState(false);
  const [lastCreatedPhaseId, setLastCreatedPhaseId] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    icon: '📚',
    color: '#000',
    bg: '#f0f0f0',
    order: 0,
    isStarting: false,
    isEnding: false
  });

  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'mentor') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    loadPhases();
  }, []);

  const loadPhases = async () => {
    try {
      const res = await axiosInstance.get('/api/admin/phases');
      setPhases(res.data);
      if (phaseId) {
        const selectedPhase = res.data.find((phase) => phase.id === phaseId);
        if (selectedPhase) {
          setEditingPhase(selectedPhase);
          setFormData(selectedPhase);
          setShowForm(true);
        }
      }
    } catch (err) {
      console.error('Error loading phases:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === 'id' ? value.toLowerCase().trim().replace(/\s+/g, '-') : value;
    setFormData(prev => ({ ...prev, [name]: nextValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const normalizedForm = { ...formData, id: formData.id.toLowerCase().trim().replace(/\s+/g, '-') };
      const createdPhaseId = editingPhase ? editingPhase.id : normalizedForm.id;
      if (editingPhase) {
        await axiosInstance.put(`/api/admin/phases/${editingPhase.id}`, normalizedForm);
      } else {
        await axiosInstance.post('/api/admin/phases', normalizedForm);
      }
      setShowForm(false);
      setEditingPhase(null);
      setFormData({ id: '', name: '', description: '', icon: '📚', color: '#000', bg: '#f0f0f0', order: 0, isStarting: false, isEnding: false });
      loadPhases();
      setShowSuccessOption(true);
      setLastCreatedPhaseId(createdPhaseId);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Unable to save phase');
    }
  };

  const handleEdit = (phase) => {
    setEditingPhase(phase);
    setFormData(phase);
    setShowForm(true);
  };

  const handleDelete = async (phaseId) => {
    if (!window.confirm('Are you sure you want to delete this phase?')) return;
    try {
      await axiosInstance.delete(`/api/admin/phases/${phaseId}`);
      loadPhases();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Unable to delete phase');
    }
  };

  if (loading) return <><Navbar /><div className="spinner" style={{ marginTop: 80 }} /></>;

  return (
    <div className="admin-phases">
      <Navbar />
      <div className="admin-phases-inner">
        <div className="admin-phases-header">
          <div>
            <h1>Manage Phases</h1>
            <p>Create and edit learning phases for your platform</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => {
            setEditingPhase(null);
            setFormData({ id: '', name: '', description: '', icon: '📚', color: '#000', bg: '#f0f0f0', order: 0, isStarting: false, isEnding: false });
            setShowForm(!showForm);
          }}>
            {showForm ? '✕ Cancel' : '+ New Phase'}
          </button>
        </div>

        {showSuccessOption && (
          <div className="success-option-card">
            <h3>✓ Phase {editingPhase ? 'updated' : 'created'} successfully!</h3>
            <p>What would you like to do next?</p>
            <div className="success-options">
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setShowSuccessOption(false);
                  navigate(`/admin/subphases/${lastCreatedPhaseId}`);
                }}
              >
                ➕ Add Sub-Phases
              </button>
              <button 
                className="btn btn-outline"
                onClick={() => {
                  setShowSuccessOption(false);
                  navigate(`/admin/questions?phase=${lastCreatedPhaseId}`);
                }}
              >
                ➕ Add Questions
              </button>
              <button 
                className="btn btn-outline"
                onClick={() => {
                  setShowSuccessOption(false);
                  setShowForm(true);
                  setEditingPhase(null);
                  setFormData({ id: '', name: '', description: '', icon: '📚', color: '#000', bg: '#f0f0f0', order: 0 });
                }}
              >
                ➕ Create Another Phase
              </button>
              <button 
                className="btn btn-outline"
                onClick={() => {
                  setShowSuccessOption(false);
                  navigate('/admin');
                }}
              >
                ⬅ Back to Admin Dashboard
              </button>
            </div>
          </div>
        )}

        {showForm && (
          <div className="phase-form">
            <h3>{editingPhase ? 'Edit Phase' : 'Create New Phase'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Phase ID (unique, lowercase)</label>
                  <input
                    type="text"
                    name="id"
                    value={formData.id}
                    onChange={handleInputChange}
                    disabled={!!editingPhase}
                    required
                    placeholder="e.g., html, css, javascript"
                  />
                </div>
                <div className="form-group">
                  <label>Phase Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., HTML Basics"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="3"
                  placeholder="Describe what students will learn..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Icon (emoji)</label>
                  <input
                    type="text"
                    name="icon"
                    value={formData.icon}
                    onChange={handleInputChange}
                    maxLength="2"
                    placeholder="🌐"
                  />
                </div>
                <div className="form-group">
                  <label>Color</label>
                  <input
                    type="color"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Background Color</label>
                  <input
                    type="color"
                    name="bg"
                    value={formData.bg}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Order</label>
                  <input
                    type="number"
                    name="order"
                    value={formData.order}
                    onChange={handleInputChange}
                    required
                    min="0"
                  />
                </div>
              </div>

              <div className="form-row" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      name="isStarting"
                      checked={formData.isStarting}
                      onChange={(e) => setFormData(prev => ({ ...prev, isStarting: e.target.checked }))}
                    />
                    🚀 Set as Starting Phase (students begin here)
                  </label>
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      name="isEnding"
                      checked={formData.isEnding}
                      onChange={(e) => setFormData(prev => ({ ...prev, isEnding: e.target.checked }))}
                    />
                    🏁 Set as Ending Phase (final phase in the course)
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingPhase ? 'Update Phase' : 'Create Phase'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="phases-table">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Icon</th>
                <th>Phase</th>
                <th>Description</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {phases.map(phase => (
                <tr key={phase.id}>
                  <td>{phase.order}</td>
                  <td style={{ fontSize: 20 }}>{phase.icon}</td>
                  <td><strong>{phase.name}</strong> <br/> <small style={{ color: '#999' }}>{phase.id}</small></td>
                  <td style={{ fontSize: 13 }}>{phase.description.substring(0, 50)}...</td>
                  <td>
                    {phase.isStarting && <span style={{ background: '#d1fae5', color: '#059669', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', marginRight: '4px' }}>🚀 Starting</span>}
                    {phase.isEnding && <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>🏁 Ending</span>}
                  </td>
                  <td><small>{phase.createdBy?.name || 'Unknown'}</small></td>
                  <td>
                    <Link to={`/admin/subphases/${phase.id}`} className="btn-small btn-subphases">Manage Sub-Phases</Link>
                    <button className="btn-small btn-edit" onClick={() => handleEdit(phase)}>Edit</button>
                    <button className="btn-small btn-delete" onClick={() => handleDelete(phase.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {phases.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No phases created yet. Create one to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
