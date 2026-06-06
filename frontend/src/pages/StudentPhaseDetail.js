import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import './StudentPhaseDetail.css';

export default function StudentPhaseDetail() {
  const { phaseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [phase, setPhase] = useState(null);
  const [subPhases, setSubPhases] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submittingSubPhaseId, setSubmittingSubPhaseId] = useState(null);
  const [submissionMessage, setSubmissionMessage] = useState('');
  const [selectedSubPhase, setSelectedSubPhase] = useState(null);
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [reflectionType, setReflectionType] = useState('reflection1');
  const [githubLink, setGithubLink] = useState('');
  const [deploymentLink, setDeploymentLink] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    if (user && (user.role === 'student' || user.role === 'mentor' || user.role === 'admin')) {
      loadData();
    } else if (user) {
      navigate('/login');
    }
  }, [phaseId, user, navigate]);

  const loadData = async () => {
    try {
      // Load phase
      const phasesRes = await axios.get('/api/phases');
      const ph = phasesRes.data.find(p => p.id === phaseId);
      setPhase(ph);

      // Load sub-phases
      const subRes = await axios.get(`/api/subphases/phases/${phaseId}/subphases`);
      setSubPhases(subRes.data.sort((a, b) => a.order - b.order));

      // Load student progress
      if (user?.role === 'student') {
        const progRes = await axios.get('/api/progress/my-progress');
        const phaseProgress = progRes.data.phases?.find(p => p.phaseId === phaseId);
        setProgress(phaseProgress || {});
      } else {
        setProgress({});
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadingFile(true);
      const res = await axios.post('/api/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAttachments(prev => [...prev, res.data.url]);
      toast.success('✓ File uploaded successfully!');
    } catch (err) {
      toast.error('Upload error: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadingFile(false);
    }
  };

  const loadDraft = async (subPhaseId) => {
    try {
      const res = await axios.get(`/api/subphases/draft/${phaseId}/${subPhaseId}`);
      if (res.data && Object.keys(res.data).length > 0) {
        setSubmissionMessage(res.data.submissionMessage || '');
        setGithubLink(res.data.githubLink || '');
        setDeploymentLink(res.data.deploymentLink || '');
        setVideoLink(res.data.videoLink || '');
        setAttachments(res.data.attachments || []);
      } else {
        setSubmissionMessage('');
        setGithubLink('');
        setDeploymentLink('');
        setVideoLink('');
        setAttachments([]);
      }
    } catch (err) {
      console.error('Error loading draft', err);
    }
  };

  useEffect(() => {
    if (selectedSubPhase) {
      loadDraft(selectedSubPhase.id);
    }
  }, [selectedSubPhase]);

  const handleSubmitSubPhase = async (subPhaseId, action = 'submit') => {
    try {
      if (action === 'submit') {
        const requirements = selectedSubPhase?.requirements || {};
        if (requirements.githubRequired && !githubLink) return toast.error('Please add the GitHub link for this sub-phase.');
        if (requirements.deploymentRequired && !deploymentLink) return toast.error('Please add the deployment link for this sub-phase.');
        if (requirements.videoRequired && !videoLink) return toast.error('Please add the video link for this sub-phase.');
        if (requirements.reflectionRequired !== false && !submissionMessage) return toast.error('Please write your reflection for this sub-phase.');
      }

      setSubmittingSubPhaseId(subPhaseId);
      
      if (action === 'draft') {
        await axios.post('/api/subphases/draft', {
          phaseId: phaseId,
          subPhaseId: subPhaseId,
          submissionMessage: submissionMessage,
          githubLink: githubLink,
          deploymentLink: deploymentLink,
          videoLink: videoLink,
          attachments: attachments
        });
        toast.success('✓ Draft saved successfully!');
      } else {
        await axios.post('/api/subphases/approval-request', {
          phaseId: phaseId,
          subPhaseId: subPhaseId,
          type: 'subphase',
          submissionMessage: submissionMessage,
          githubLink: githubLink,
          deploymentLink: deploymentLink,
          videoLink: videoLink,
          attachments: attachments
        });
        toast.success('✓ Request submitted! Waiting for mentor approval.');
        setSubmissionMessage('');
        setGithubLink('');
        setDeploymentLink('');
        setVideoLink('');
        setAttachments([]);
        setSelectedSubPhase(null);
        loadData();
      }
    } catch (err) {
      toast.error('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmittingSubPhaseId(null);
    }
  };

  const handleReflectionSubmit = async () => {
    try {
      await axios.post('/api/subphases/reflection-request', {
        phaseId: phaseId,
        submissionMessage: submissionMessage,
        reflectionType
      });
      setShowReflectionModal(false);
      setSubmissionMessage('');
      loadData();
      toast.success('✓ Reflection request submitted! Waiting for mentor approval.');
    } catch (err) {
      toast.error('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const getSubPhaseProgress = (subPhaseId) => {
    return progress?.subPhases?.find(sp => sp.subPhaseId === subPhaseId);
  };

  const isSubPhaseUnlocked = (index) => {
    if (user?.role !== 'student') return true;
    if (index === 0) return true; // First is always unlocked
    const prevStatus = progress?.subPhases?.[index - 1]?.status;
    return prevStatus === 'completed';
  };

  const allSubPhasesCompleted = progress?.subPhases?.length > 0 && progress?.subPhases?.every(sp => sp.status === 'completed');
  const reflection1Status = progress?.reflection1Status || (progress?.reflectionStatus === 'ready-for-review' ? 'ready' : 'not-ready');
  const finalReflectionStatus = progress?.finalReflectionStatus || (progress?.reflectionStatus === 'approved' ? 'approved' : 'not-ready');
  const canSubmitReflection1 = allSubPhasesCompleted && !['pending', 'approved'].includes(reflection1Status);
  const canSubmitFinalReflection = reflection1Status === 'approved' && !['pending', 'approved'].includes(finalReflectionStatus);
  const isPhaseComplete = finalReflectionStatus === 'approved' || progress?.reflectionStatus === 'approved';

  if (loading) return <><Navbar /><div className="spinner" style={{ marginTop: 80 }} /></>;

  return (
    <div className="student-phase-detail">
      <Navbar />
      <div className="phase-detail-inner">
        <div className="phase-header">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>
          <div className="phase-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1>
                <span className="phase-icon">{phase?.icon}</span>
                {phase?.name}
              </h1>
              <p>{phase?.description}</p>
            </div>
            <Link to={`/quiz/${phaseId}`} className="btn btn-primary" style={{ height: 'fit-content' }}>
              Take Practice Quiz
            </Link>
          </div>
        </div>

        <div className="progress-section">
          <h2>Sub-Phase Progress</h2>
          <div className="subphases-grid">
            {subPhases.map((sp, idx) => {
              const spProg = getSubPhaseProgress(sp.id);
              const status = spProg?.status || 'locked';
              const isUnlocked = isSubPhaseUnlocked(idx);
              const isCompleted = status === 'completed';
              const isPending = spProg?.approvalStatus === 'pending';

              return (
                <div 
                  key={sp._id} 
                  className={`subphase-card status-${isCompleted ? 'completed' : isPending ? 'pending' : isUnlocked ? 'unlocked' : 'locked'}`}
                >
                  <div className="subphase-header">
                    <div className="subphase-order">
                      {isCompleted ? '✓' : isPending ? '⏳' : idx + 1}
                    </div>
                    <h3>{sp.title}</h3>
                  </div>

                  <p className="subphase-desc">{sp.description}</p>
                  <div className="subphase-status">
                    {[
                      sp.requirements?.githubRequired && 'GitHub',
                      sp.requirements?.deploymentRequired && 'Deployment',
                      sp.requirements?.videoRequired && 'Video',
                      sp.requirements?.reflectionRequired !== false && 'Reflection'
                    ].filter(Boolean).map(item => (
                      <span key={item} className="badge badge-pending" style={{ marginRight: 4 }}>{item}</span>
                    ))}
                  </div>

                  <div className="subphase-status">
                    {isCompleted && <span className="badge badge-success">✓ Completed</span>}
                    {isPending && <span className="badge badge-pending">⏳ Awaiting Approval</span>}
                    {!isUnlocked && user?.role === 'student' && <span className="badge badge-locked">🔒 Locked</span>}
                  </div>

                  {isUnlocked && !isCompleted && user?.role === 'student' && (
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => setSelectedSubPhase(sp)}
                    >
                      Submit Completion
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {(canSubmitReflection1 || canSubmitFinalReflection || reflection1Status === 'pending' || finalReflectionStatus === 'pending') && !isPhaseComplete && user?.role === 'student' && (
          <div className="reflection-section">
            <div className="reflection-card">
              <h2>{canSubmitFinalReflection ? 'Final Reflection' : 'Reflection 1'}</h2>
              <p>
                {canSubmitFinalReflection
                  ? 'Reflection 1 is approved. Submit your final reflection to complete this phase.'
                  : reflection1Status === 'pending' || finalReflectionStatus === 'pending'
                    ? 'Your reflection is waiting for mentor review.'
                    : "Congratulations! You've completed all sub-phases. Submit Reflection 1 to continue."}
              </p>
              {(canSubmitReflection1 || canSubmitFinalReflection) && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setReflectionType(canSubmitFinalReflection ? 'final-reflection' : 'reflection1');
                    setShowReflectionModal(true);
                  }}
                >
                  {canSubmitFinalReflection ? 'Submit Final Reflection' : 'Submit Reflection 1'}
                </button>
              )}
            </div>
          </div>
        )}

        {isPhaseComplete && (
          <div className="completion-message">
            <h2>Phase Complete!</h2>
            <p>Your final reflection has been approved. The next phase is now unlocked.</p>
          </div>
        )}
      </div>

      {/* Sub-Phase Submission Modal */}
      {selectedSubPhase && (
        <div className="modal-overlay" onClick={() => {
          setSelectedSubPhase(null);
          setGithubLink('');
          setDeploymentLink('');
          setVideoLink('');
          setAttachments([]);
        }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Submit: {selectedSubPhase.title}</h2>
              <button className="close-btn" onClick={() => {
                setSelectedSubPhase(null);
                setGithubLink('');
                setDeploymentLink('');
                setVideoLink('');
                setAttachments([]);
              }}>✕</button>
            </div>
            <div className="modal-body">
              <p className="modal-description">{selectedSubPhase.description}</p>
              <p className="modal-description">
                Required: {[
                  selectedSubPhase.requirements?.githubRequired && 'GitHub link',
                  selectedSubPhase.requirements?.deploymentRequired && 'Deployment link',
                  selectedSubPhase.requirements?.videoRequired && 'Video link',
                  selectedSubPhase.requirements?.reflectionRequired !== false && 'Reflection'
                ].filter(Boolean).join(', ') || 'No specific requirements'}
              </p>
              <div className="submission-form">
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 4 }}>GitHub Repository Link {selectedSubPhase.requirements?.githubRequired ? '*' : ''}</label>
                  <input
                    type="url"
                    value={githubLink}
                    onChange={(e) => setGithubLink(e.target.value)}
                    placeholder="https://github.com/username/repo"
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 4 }}>Live Deployment Link {selectedSubPhase.requirements?.deploymentRequired ? '*' : ''}</label>
                  <input
                    type="url"
                    value={deploymentLink}
                    onChange={(e) => setDeploymentLink(e.target.value)}
                    placeholder="https://yourproject.vercel.app"
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 4 }}>Video Link (Loom/Drive) {selectedSubPhase.requirements?.videoRequired ? '*' : ''}</label>
                  <input
                    type="url"
                    value={videoLink}
                    onChange={(e) => setVideoLink(e.target.value)}
                    placeholder="https://loom.com/share/..."
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 4 }}>File Attachments</label>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploadingFile}
                    style={{ display: 'block', marginBottom: 8 }}
                  />
                  {uploadingFile && <span style={{ fontSize: 12, color: '#666' }}>⏳ Uploading to server/Cloudinary...</span>}
                  {attachments.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <span style={{ fontWeight: 'bold', fontSize: 13 }}>Uploaded Files:</span>
                      <ul style={{ paddingLeft: 20, margin: '4px 0', fontSize: 12 }}>
                        {attachments.map((url, i) => (
                          <li key={i}>
                            <a href={url} target="_blank" rel="noreferrer" style={{ color: '#4f46e5' }}>
                              File {i + 1}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 4 }}>What did you learn? {selectedSubPhase.requirements?.reflectionRequired !== false ? '*' : ''}</label>
                  <textarea
                    value={submissionMessage}
                    onChange={(e) => setSubmissionMessage(e.target.value)}
                    placeholder="Share what you've learned or any challenges you faced..."
                    rows="3"
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-outline"
                onClick={() => handleSubmitSubPhase(selectedSubPhase.id, 'draft')}
                disabled={submittingSubPhaseId === selectedSubPhase.id || uploadingFile}
                style={{ marginRight: 8 }}
              >
                💾 Save as Draft
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleSubmitSubPhase(selectedSubPhase.id, 'submit')}
                disabled={submittingSubPhaseId === selectedSubPhase.id || uploadingFile}
              >
                {submittingSubPhaseId === selectedSubPhase.id ? '⏳ Submitting...' : '✓ Submit for Approval'}
              </button>
              <button 
                className="btn btn-outline"
                onClick={() => {
                  setSelectedSubPhase(null);
                  setGithubLink('');
                  setDeploymentLink('');
                  setVideoLink('');
                  setAttachments([]);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reflection Modal */}
      {showReflectionModal && (
        <div className="modal-overlay" onClick={() => setShowReflectionModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{reflectionType === 'final-reflection' ? 'Final Reflection' : 'Reflection 1'}: {phase?.name}</h2>
              <button className="close-btn" onClick={() => setShowReflectionModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                {reflectionType === 'final-reflection'
                  ? 'Summarize your full phase journey and how you will apply what you learned.'
                  : 'Take a moment to reflect on your learning journey through this phase. What did you learn? What was challenging?'}
              </p>
              <div className="submission-form">
                <label>{reflectionType === 'final-reflection' ? 'Your Final Reflection' : 'Your Reflection 1'}</label>
                <textarea
                  value={submissionMessage}
                  onChange={(e) => setSubmissionMessage(e.target.value)}
                  placeholder={reflectionType === 'final-reflection'
                    ? 'Write your final reflection here...'
                    : "Write your Reflection 1 here. Think about what you've learned and the challenges you've overcome..."}
                  rows="6"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-primary"
                onClick={handleReflectionSubmit}
              >
                ✓ Submit Reflection
              </button>
              <button 
                className="btn btn-outline"
                onClick={() => setShowReflectionModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
