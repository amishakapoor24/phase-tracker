import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import './MentorApprovals.css';

export default function MentorApprovals() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [approvals, setApprovals] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // all, pending, approved, rejected
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [approvalMessage, setApprovalMessage] = useState('');

  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'mentor') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    try {
      const [appRes, statsRes] = await Promise.all([
        axios.get('/api/subphases/approval-requests/pending'),
        axios.get('/api/analytics/summary')
      ]);
      setApprovals(appRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Error loading approvals or stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approval, approved) => {
    try {
      const endpoint = ['reflection', 'reflection1', 'final-reflection'].includes(approval.type)
        ? `/api/subphases/reflection-request/${approval._id}/approve`
        : `/api/subphases/approval-request/${approval._id}/respond`;

      await axios.post(endpoint, {
        approve: approved,
        approvalMessage: approvalMessage
      });

      setApprovalMessage('');
      setSelectedApproval(null);
      loadApprovals();
    } catch (err) {
      toast.error('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <><Navbar /><div className="spinner" style={{ marginTop: 80 }} /></>;

  const filtered = approvals.filter(a => filterType === 'all' || a.status === filterType);

  return (
    <div className="mentor-approvals">
      <Navbar />
      <div className="approvals-inner">
        {stats && (
          <div className="mentor-stats-grid" style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px'
          }}>
            <div className="stat-card" style={{ background: 'var(--surface-color)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Active Students</h3>
              <p className="stat-value" style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--primary-color)' }}>{stats.summary.totalStudents}</p>
            </div>
            <div className="stat-card" style={{ background: 'var(--surface-color)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Total Approvals</h3>
              <p className="stat-value" style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>{stats.summary.approvedRequests}</p>
            </div>
            <div className="stat-card" style={{ background: 'var(--surface-color)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Total Pending</h3>
              <p className="stat-value" style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>{stats.summary.pendingRequests}</p>
            </div>
            <div className="stat-card" style={{ background: 'var(--surface-color)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Total Rejected</h3>
              <p className="stat-value" style={{ fontSize: '28px', fontWeight: 'bold', color: '#ef4444' }}>{stats.summary.rejectedRequests}</p>
            </div>
          </div>
        )}

        <div className="approvals-header">
          <div>
            <h1>📋 Approval Requests</h1>
            <p>Review and approve student sub-phase and reflection submissions</p>
          </div>
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              All ({approvals.length})
            </button>
            <button 
              className={`filter-btn ${filterType === 'pending' ? 'active' : ''}`}
              onClick={() => setFilterType('pending')}
            >
              Pending ({approvals.filter(a => a.status === 'pending').length})
            </button>
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="approvals-list">
            {filtered.map(approval => (
              <div key={approval._id} className="approval-card" onClick={() => setSelectedApproval(approval)}>
                <div className="approval-header-row">
                  <div className="approval-student-info">
                    <div className="student-avatar">
                      {approval.student?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3>
                        <Link to={`/profile/${approval.student?._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          {approval.student?.name}
                        </Link>
                      </h3>
                      <p className="student-email">{approval.student?.email}</p>
                      <p className="student-house">
                        {approval.student?.house || 'No house'}
                      </p>
                    </div>
                  </div>
                  <div className="approval-meta">
                    <span className="approval-type">
                      {['reflection', 'reflection1', 'final-reflection'].includes(approval.type) ? '📌 Reflection' : '📝 Sub-Phase'}
                    </span>
                    <span className={`approval-status status-${approval.status}`}>
                      {approval.status}
                    </span>
                  </div>
                </div>

                <div className="approval-content">
                  <p><strong>Phase:</strong> {approval.phaseId}</p>
                  {approval.type === 'subphase' && (
                    <p><strong>Sub-Phase:</strong> {approval.subPhaseId}</p>
                  )}
                  {approval.submissionMessage && (
                    <div className="submission-message">
                      <p><strong>Student Message:</strong></p>
                      <p>{approval.submissionMessage}</p>
                    </div>
                  )}
                </div>

                <div className="approval-footer">
                  <span className="date">
                    {new Date(approval.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>✨ No pending approval requests</p>
          </div>
        )}

        {selectedApproval && (
          <div className="approval-modal-overlay" onClick={() => setSelectedApproval(null)}>
            <div className="approval-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Review Approval Request</h2>
                <button className="close-btn" onClick={() => setSelectedApproval(null)}>✕</button>
              </div>

              <div className="modal-content">
                <div className="student-section">
                  <h3>{selectedApproval.student?.name}</h3>
                  <p>{selectedApproval.student?.email}</p>
                  <p>
                    {selectedApproval.student?.house || 'No house'}
                  </p>
                </div>

                <div className="request-details">
                  <p><strong>Type:</strong> {['reflection', 'reflection1', 'final-reflection'].includes(selectedApproval.type) ? 'Phase Reflection' : 'Sub-Phase Completion'}</p>
                  <p><strong>Phase:</strong> {selectedApproval.phaseId.toUpperCase()}</p>
                  {selectedApproval.type === 'subphase' && (
                    <p><strong>Sub-Phase:</strong> {selectedApproval.subPhaseId}</p>
                  )}
                  
                  {selectedApproval.githubLink && (
                    <p>
                      <strong>GitHub Repository:</strong>{' '}
                      <a href={selectedApproval.githubLink} target="_blank" rel="noreferrer" style={{ color: '#4f46e5', fontWeight: 'bold' }}>
                        🔗 View Code Repository
                      </a>
                    </p>
                  )}
                  {selectedApproval.deploymentLink && (
                    <p>
                      <strong>Live Deployment:</strong>{' '}
                      <a href={selectedApproval.deploymentLink} target="_blank" rel="noreferrer" style={{ color: '#10b981', fontWeight: 'bold' }}>
                        🌐 View Live Website
                      </a>
                    </p>
                  )}
                  {selectedApproval.videoLink && (
                    <p>
                      <strong>Demo Video:</strong>{' '}
                      <a href={selectedApproval.videoLink} target="_blank" rel="noreferrer" style={{ color: '#ef4444', fontWeight: 'bold' }}>
                        🎥 Watch Demo Video
                      </a>
                    </p>
                  )}
                  {selectedApproval.attachments && selectedApproval.attachments.length > 0 && (
                    <div style={{ margin: '12px 0' }}>
                      <strong>Attached Files:</strong>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                        {selectedApproval.attachments.map((url, i) => (
                          <a 
                            key={i} 
                            href={url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="btn btn-outline btn-sm"
                            style={{ textDecoration: 'none', fontSize: '11px', padding: '4px 8px' }}
                          >
                            📁 Attachment {i + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedApproval.submissionMessage && (
                    <div className="message-box">
                      <p><strong>Student Submission:</strong></p>
                      <p>{selectedApproval.submissionMessage}</p>
                    </div>
                  )}
                </div>

                <div className="approval-textarea">
                  <label>Your Feedback/Message (optional)</label>
                  <textarea
                    value={approvalMessage}
                    onChange={(e) => setApprovalMessage(e.target.value)}
                    placeholder="Add your feedback or approval message..."
                    rows="4"
                  />
                </div>

                <div className="modal-actions">
                  <button
                    className="btn btn-success"
                    onClick={() => handleApprove(selectedApproval, true)}
                  >
                    ✓ Approve
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleApprove(selectedApproval, false)}
                  >
                    ✕ Reject
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => setSelectedApproval(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
