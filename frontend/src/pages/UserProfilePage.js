import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import './UserProfilePage.css';

export default function UserProfilePage() {
  const { id } = useParams();
  const targetId = id || 'me';
  const { user: currentUser, login } = useAuth();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', password: '', avatar: '' });
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`/api/auth/profile/${targetId}`);
        setProfileData(res.data);
        setEditForm({
          name: res.data.user.name || '',
          password: '',
          avatar: res.data.user.avatar || ''
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [targetId]);

  const isSelf = profileData && currentUser && profileData.user._id === currentUser._id;

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadingAvatar(true);
      setEditError('');
      const res = await axios.post('/api/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setEditForm(prev => ({ ...prev, avatar: res.data.url }));
    } catch (err) {
      setEditError('Upload error: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditLoading(true);
    try {
      const payload = { name: editForm.name, avatar: editForm.avatar };
      if (editForm.password) payload.password = editForm.password;
      
      const res = await axios.put('/api/auth/me', payload);
      
      // Update local storage and context if we edited ourselves
      localStorage.setItem('userInfo', JSON.stringify(res.data));
      // Hacky way to update context without a full refresh, ideally useAuth would expose an update function
      // But reloading the window is safest for now to sync everything
      window.location.reload();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update profile');
      setEditLoading(false);
    }
  };

  if (loading) return <div className="page-center"><div className="spinner" /></div>;
  if (error) return <div className="page-center"><div className="error-msg">{error}</div></div>;
  if (!profileData) return null;

  const { user, progress, submissions, phaseMappings } = profileData;

  const renderTimeline = () => {
    if (!progress || !progress.phases || progress.phases.length === 0) {
      return <div className="empty-state">No progress data available yet.</div>;
    }

    const unlockedPhases = progress.phases.filter(p => p.status === 'unlocked' || p.status === 'completed');

    return (
      <div className="portfolio-timeline">
        {unlockedPhases.map((p) => {
          const phaseTitle = phaseMappings?.[p.phaseId]?.title || `Phase ${p.phaseId.toUpperCase()}`;
          return (
            <div key={p.phaseId} className={`timeline-item ${p.status === 'completed' ? 'completed' : 'in-progress'}`}>
              <div className="timeline-marker">
                {p.status === 'completed' ? '🏆' : '⏳'}
              </div>
              <div className="timeline-content">
                <h4>{phaseTitle}</h4>
                <p className="status-badge">Status: {p.status}</p>
                {p.status === 'completed' && (
                  <div className="achievement">
                    <span className="badge">Verified Scholar</span>
                    <p>Successfully completed all requirements for this phase.</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSubmissions = () => {
    if (!submissions || submissions.length === 0) {
      return <div className="empty-state">No submissions found for this student.</div>;
    }

    return (
      <div className="submissions-grid">
        {submissions.map((sub) => {
          const phaseTitle = phaseMappings?.[sub.phaseId]?.title || sub.phaseId;
          const subPhaseTitle = phaseMappings?.[sub.phaseId]?.subPhases?.[sub.subPhaseId] || sub.subPhaseId;

          return (
            <div key={sub._id} className="submission-card">
              <div className="submission-header">
                <span className={`status-pill status-${sub.status}`}>{sub.status.toUpperCase()}</span>
                <span className="submission-date">{new Date(sub.updatedAt).toLocaleDateString()}</span>
              </div>
              <h4 className="submission-title">{phaseTitle} - {subPhaseTitle}</h4>
              
              <div className="submission-links">
                {sub.githubLink && <a href={sub.githubLink} target="_blank" rel="noreferrer" className="sub-link github-link">GitHub</a>}
                {sub.deploymentLink && <a href={sub.deploymentLink} target="_blank" rel="noreferrer" className="sub-link deploy-link">Deployment</a>}
                {sub.videoLink && <a href={sub.videoLink} target="_blank" rel="noreferrer" className="sub-link video-link">Video</a>}
              </div>

              {sub.submissionMessage && (
                <div className="submission-text">
                  <strong>Message:</strong>
                  <p>{sub.submissionMessage}</p>
                </div>
              )}
              {sub.reflection && (
                <div className="submission-text">
                  <strong>Reflection:</strong>
                  <p>{sub.reflection}</p>
                </div>
              )}
              {sub.feedback && (
                <div className="submission-feedback">
                  <strong>Mentor Feedback:</strong>
                  <p>{sub.feedback}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <div className="profile-page">
        <div className="profile-header">
          <div className="profile-avatar">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} />
            ) : (
              <div className="avatar-placeholder">{user.name.charAt(0).toUpperCase()}</div>
            )}
        </div>
        <div className="profile-info">
          <h1>{user.name}</h1>
          <div className="profile-tags">
            <span className={`role-tag role-${user.role}`}>{user.role.toUpperCase()}</span>
            {user.house && <span className="house-tag">{user.house.toUpperCase()} HOUSE</span>}
          </div>
          <p className="profile-email">{user.email}</p>
        </div>
        
        {isSelf && !isEditing && (
          <button className="btn btn-secondary edit-btn" onClick={() => setIsEditing(true)}>
            Edit Profile
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="edit-profile-section card">
          <h2>Edit Profile</h2>
          {editError && <div className="error-msg">{editError}</div>}
          <form onSubmit={handleEditSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" name="name" value={editForm.name} onChange={handleEditChange} required />
            </div>
            <div className="form-group">
              <label>Profile Photo</label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {editForm.avatar && (
                  <img src={editForm.avatar} alt="Avatar Preview" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                )}
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                />
                {uploadingAvatar && <span style={{fontSize: 12}}>Uploading...</span>}
              </div>
              <small className="text-muted" style={{ display: 'block', marginTop: 4 }}>Or paste a URL below:</small>
              <input type="text" name="avatar" value={editForm.avatar} onChange={handleEditChange} placeholder="https://..." style={{ marginTop: 4 }} />
            </div>
            <div className="form-group">
              <label>New Password (leave blank to keep current)</label>
              <input type="password" name="password" value={editForm.password} onChange={handleEditChange} minLength="6" />
            </div>
            <div className="edit-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={editLoading}>
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="profile-content">
          {user.role === 'student' && (
            <>
              <div className="portfolio-section card">
                <h2>Learning Portfolio & Progress</h2>
                {renderTimeline()}
              </div>

              {(!isSelf || currentUser?.role === 'admin' || currentUser?.role === 'mentor' || isSelf) && (
                <div className="submissions-section card" style={{ marginTop: '2rem' }}>
                  <h2>Recent Submissions</h2>
                  <p className="text-muted" style={{ marginBottom: '1.5rem' }}>View the data and reflections uploaded for sub-phases.</p>
                  {renderSubmissions()}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
    </>
  );
}
