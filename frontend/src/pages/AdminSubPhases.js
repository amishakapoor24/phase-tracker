import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './AdminSubPhases.css';

function SortableTableRow({ subPhase, handleEdit, handleDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subPhase._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    position: isDragging ? 'relative' : 'static',
    opacity: isDragging ? 0.8 : 1,
    background: isDragging ? 'var(--surface-color)' : 'transparent',
    boxShadow: isDragging ? '0 5px 15px rgba(0,0,0,0.1)' : 'none',
  };

  return (
    <tr ref={setNodeRef} style={style}>
      <td className="order-col">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span 
            {...attributes} 
            {...listeners}
            style={{ cursor: 'grab', color: 'var(--text-muted)' }}
            title="Drag to reorder"
          >
            ☰
          </span>
          {subPhase.order}
        </div>
      </td>
      <td className="id-col"><code>{subPhase.id}</code></td>
      <td className="title-col"><strong>{subPhase.title}</strong></td>
      <td className="desc-col">{subPhase.description.substring(0, 60)}...</td>
      <td className="desc-col">
        {[
          subPhase.requirements?.githubRequired && 'GitHub',
          subPhase.requirements?.deploymentRequired && 'Deployment',
          subPhase.requirements?.videoRequired && 'Video',
          subPhase.requirements?.reflectionRequired !== false && 'Reflection'
        ].filter(Boolean).join(', ') || 'None'}
      </td>
      <td className="actions-col">
        <button className="btn-small btn-edit" onClick={() => handleEdit(subPhase)}>✏️ Edit</button>
        <button className="btn-small btn-delete" onClick={() => handleDelete(subPhase._id)}>🗑️ Delete</button>
      </td>
    </tr>
  );
}

export default function AdminSubPhases() {
  const { phaseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [phase, setPhase] = useState(null);
  const [subPhases, setSubPhases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSubPhase, setEditingSubPhase] = useState(null);
  const [showSuccessOption, setShowSuccessOption] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    order: 0,
    requirements: {
      githubRequired: false,
      deploymentRequired: false,
      videoRequired: false,
      reflectionRequired: true
    }
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'mentor') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    loadData();
  }, [phaseId]);

  const loadData = async () => {
    try {
      const phasesRes = await axios.get('/api/admin/phases');
      const ph = phasesRes.data.find(p => p.id === phaseId);
      setPhase(ph);

      const subRes = await axios.get(`/api/subphases/phases/${phaseId}/subphases`);
      // Sort by order initially
      const sorted = [...subRes.data].sort((a, b) => a.order - b.order);
      setSubPhases(sorted);
    } catch (err) {
      console.error('Error loading:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = subPhases.findIndex(sp => sp._id === active.id);
      const newIndex = subPhases.findIndex(sp => sp._id === over.id);
      
      const reordered = arrayMove(subPhases, oldIndex, newIndex);
      // Update orders sequentially
      const updated = reordered.map((item, index) => ({
        ...item,
        order: index + 1
      }));
      
      setSubPhases(updated);

      // Save to backend
      try {
        await axios.post(`/api/subphases/phases/${phaseId}/subphases/reorder`, {
          updates: updated.map(sp => ({ id: sp._id, order: sp.order }))
        });
      } catch (err) {
        toast.error('Failed to save new order. ' + (err.response?.data?.message || err.message));
        loadData(); // Revert on failure
      }
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
      if (editingSubPhase) {
        await axios.put(`/api/subphases/${editingSubPhase._id}`, normalizedForm);
      } else {
        await axios.post(`/api/subphases/phases/${phaseId}/subphases`, normalizedForm);
      }
      setShowForm(false);
      setEditingSubPhase(null);
      setFormData({ id: '', title: '', description: '', order: 0, requirements: { githubRequired: false, deploymentRequired: false, videoRequired: false, reflectionRequired: true } });
      loadData();
      setShowSuccessOption(true);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Unable to save sub-phase');
    }
  };

  const handleEdit = (subPhase) => {
    setEditingSubPhase(subPhase);
    setFormData({
      ...subPhase,
      requirements: {
        githubRequired: !!subPhase.requirements?.githubRequired,
        deploymentRequired: !!subPhase.requirements?.deploymentRequired,
        videoRequired: !!subPhase.requirements?.videoRequired,
        reflectionRequired: subPhase.requirements?.reflectionRequired !== false
      }
    });
    setShowForm(true);
  };

  const handleDelete = async (subPhaseId) => {
    if (!window.confirm('Delete this sub-phase?')) return;
    try {
      await axios.delete(`/api/subphases/${subPhaseId}`);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Unable to delete sub-phase');
    }
  };

  if (loading) return <><Navbar /><div className="spinner" style={{ marginTop: 80 }} /></>;

  return (
    <div className="admin-subphases">
      <Navbar />
      <div className="admin-subphases-inner">
        <div className="subphases-breadcrumb">
          <Link to="/admin/phases" className="link">← Back to Phases</Link>
          <span className="separator">/</span>
          <span className="current">{phase?.name}</span>
        </div>

        <div className="subphases-header">
          <div>
            <h1>Manage Sub-Phases: {phase?.name}</h1>
            <p>Create and manage sub-phases for {phase?.name}</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => {
            setEditingSubPhase(null);
            setFormData({ id: '', title: '', description: '', order: subPhases.length > 0 ? Math.max(...subPhases.map(sp => sp.order)) + 1 : 1, requirements: { githubRequired: false, deploymentRequired: false, videoRequired: false, reflectionRequired: true } });
            setShowForm(!showForm);
          }}>
            {showForm ? '✕ Cancel' : '+ New Sub-Phase'}
          </button>
        </div>

        {showSuccessOption && (
          <div className="success-option-card">
            <h3>✓ Sub-phase {editingSubPhase ? 'updated' : 'created'} successfully!</h3>
            <p>What would you like to do next?</p>
            <div className="success-options">
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setShowSuccessOption(false);
                  setShowForm(true);
                  setEditingSubPhase(null);
                  setFormData({ id: '', title: '', description: '', order: subPhases.length > 0 ? Math.max(...subPhases.map(sp => sp.order)) + 1 : 1, requirements: { githubRequired: false, deploymentRequired: false, videoRequired: false, reflectionRequired: true } });
                }}
              >
                ➕ Add Another Sub-Phase
              </button>
              <button 
                className="btn btn-outline"
                onClick={() => {
                  setShowSuccessOption(false);
                  navigate('/admin/phases');
                }}
              >
                ⬅ Back to Phases
              </button>
            </div>
          </div>
        )}

        {showForm && (
          <div className="subphase-form">
            <h3>{editingSubPhase ? 'Edit Sub-Phase' : 'Create New Sub-Phase'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Sub-Phase ID (unique, lowercase)</label>
                  <input
                    type="text"
                    name="id"
                    value={formData.id}
                    onChange={handleInputChange}
                    disabled={!!editingSubPhase}
                    required
                    placeholder="e.g., intro, basics, advanced"
                  />
                </div>
                <div className="form-group">
                  <label>Order (Auto-calculated on Drag)</label>
                  <input
                    type="number"
                    name="order"
                    value={formData.order}
                    onChange={handleInputChange}
                    required
                    min="1"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., HTML Basics"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="3"
                  placeholder="What will students learn in this sub-phase?"
                />
              </div>

              <div className="form-row" style={{ marginTop: 16 }}>
                {[
                  ['githubRequired', 'GitHub Required'],
                  ['deploymentRequired', 'Deployment Required'],
                  ['videoRequired', 'Video Required'],
                  ['reflectionRequired', 'Reflection Required']
                ].map(([key, label]) => (
                  <div className="form-group" key={key}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={!!formData.requirements?.[key]}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          requirements: { ...prev.requirements, [key]: e.target.checked }
                        }))}
                      />
                      {label}
                    </label>
                  </div>
                ))}
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingSubPhase ? 'Update Sub-Phase' : 'Create Sub-Phase'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="subphases-table">
          <h2>Sub-Phases List ({subPhases.length})</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '13px' }}>
            ℹ️ Drag and drop the ☰ icon to reorder sub-phases. Changes are saved automatically.
          </p>
          {subPhases.length > 0 ? (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Requirements</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={subPhases.map(sp => sp._id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <tbody>
                      {subPhases.map(sp => (
                        <SortableTableRow 
                          key={sp._id} 
                          subPhase={sp} 
                          handleEdit={handleEdit} 
                          handleDelete={handleDelete} 
                        />
                      ))}
                    </tbody>
                  </SortableContext>
                </DndContext>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>No sub-phases yet. Create one to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
