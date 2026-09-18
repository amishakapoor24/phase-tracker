import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../utils/axiosConfig';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(null);
  const [phases, setPhases] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [prog, ph, ann] = await Promise.all([
          axiosInstance.get('/api/progress'),
          axiosInstance.get('/api/phases'),
          axiosInstance.get('/api/announcements')
        ]);
        setProgress(prog.data);
        setPhases(ph.data);
        setAnnouncements(ann.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <><Navbar /><div className="spinner" style={{ marginTop: 80 }} /></>;

  const completed = progress?.phases?.filter(p => p.status === 'completed').length || 0;
  const total = phases.length;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  const bestScore = progress?.phases?.reduce((acc, p) => Math.max(acc, p.bestScore || 0), 0) || 0;

  const QUICK_LINKS = ['Dashboard', 'Settings', 'Marks', 'Themes', 'Tasks', 'Reports', 'Analytics', 'Calendar'];
  const FOR_USERS = ['How it Works', 'Features', 'Pricing', 'Guidelines', 'FAQ', 'Blog'];
  const RESOURCES = ['Documentation', 'Video Tutorials', 'API Docs', 'Code of Conduct', 'Privacy Policy', 'Accessibility'];
  const SOCIAL = [
    { icon: '🐙', name: 'GitHub' },
    { icon: '💼', name: 'LinkedIn' },
    { icon: '🐦', name: 'Twitter' },
    { icon: '▶️', name: 'YouTube' },
    { icon: '📸', name: 'Instagram' }
  ];

  // Removed notifications logic as it was moved to Navbar

  return (
    <div className="dashboard">
      <Navbar />
      <div className="dash-inner">
        
        {/* Welcome Section */}
        <div className="dash-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div>
              <h1>Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
              <p>Continue your learning journey — you're making great progress!</p>
              
              {/* Current Progress Banner */}
              {progress?.currentPhase && (
                <div className="current-progress-grid" style={{ marginTop: '12px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <div className="current-progress-card current-progress-card-phase" style={{ background: '#EEF2FF', padding: '8px 16px', borderRadius: '8px', border: '1px solid #C7D2FE' }}>
                    <span style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Current Phase</span>
                    <strong style={{ color: '#4F46E5', fontSize: '15px' }}>
                      {phases.find(p => p.id === progress.currentPhase)?.name || progress.currentPhase}
                    </strong>
                  </div>
                  <div className="current-progress-card current-progress-card-subphase" style={{ background: '#FEF3C7', padding: '8px 16px', borderRadius: '8px', border: '1px solid #FDE68A' }}>
                    <span style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Current Sub-Phase</span>
                    <strong style={{ color: '#D97706', fontSize: '15px' }}>
                      {(() => {
                        const curPhase = progress.phases.find(p => p.phaseId === progress.currentPhase);
                        if (!curPhase) return 'Not Started';
                        if (!curPhase.subPhases || curPhase.subPhases.length === 0) return 'Sub-Phase 1';
                        
                        const formatSlug = (slug) => slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

                        const unlocked = curPhase.subPhases.find(sp => sp.status === 'unlocked');
                        if (unlocked) return formatSlug(unlocked.subPhaseId);
                        
                        const allCompleted = curPhase.subPhases.every(sp => sp.status === 'completed');
                        if (allCompleted) return 'Reflections / Review';
                        
                        return 'Pending Review';
                      })()}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="dash-progress-summary" style={{ alignSelf: 'center' }}>
            <div className="dash-prog-nums">
              <span>{completed}</span>/<span>{total}</span>
              <label>phases done</label>
            </div>
            <div className="progress-bar-wrap" style={{ width: 160 }}>
              <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="dash-pct">{pct}%</span>
          </div>
        </div>



        {/* Learning Path */}
        <h2 className="phases-title">Your learning path</h2>
        <div className="phases-grid">
          {phases.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>
              <p>📚 No phases available yet. Contact your mentor/admin to create phases.</p>
            </div>
          ) : (
            phases.map((phase, i) => {
              const prog = progress?.phases?.find(p => p.phaseId === phase.id);
              const status = prog?.status || 'locked';
              const best = prog?.bestScore || 0;
              const attempts = prog?.attempts?.length || 0;
              const isUnlocked = status === 'unlocked';
              const isCompleted = status === 'completed';
              const isLocked = status === 'locked';

              return (
                <div key={phase.id} className={`phase-card ${status}`}>
                  <div className="phase-card-top" style={{ background: isLocked ? '#F3F4F6' : phase.bg }}>
                    <span className="phase-emoji">{isLocked ? '🔒' : phase.icon}</span>
                    <span className={`phase-badge ${status}`}>
                      {isCompleted ? '✓ Passed' : isUnlocked ? 'Active' : 'Locked'}
                    </span>
                  </div>
                  <div className="phase-card-body">
                    <div className="phase-num">Phase {i + 1}</div>
                    <h3 style={{ color: isLocked ? '#9CA3AF' : phase.color }}>{phase.name}</h3>
                    <p>{phase.description}</p>
                    {!isLocked && (
                      <div className="phase-meta">
                        <span>Best: {best}%</span>
                        <span>Attempts: {attempts}</span>
                      </div>
                    )}
                    {!isLocked && best > 0 && (
                      <div className="progress-bar-wrap" style={{ marginBottom: 12 }}>
                        <div className="progress-bar-fill" style={{ width: `${best}%`, background: isCompleted ? '#1D9E75' : '#EF9F27' }} />
                      </div>
                    )}
                    <div className="phase-buttons" style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className={`btn ${isLocked ? 'btn-locked' : 'btn-primary'} btn-sm`}
                        style={{ flex: 1 }}
                        disabled={isLocked}
                        onClick={() => !isLocked && navigate(`/phase/${phase.id}`)}
                      >
                        {isLocked ? '🔒 Locked' : 'View Phase →'}
                      </button>
                      <button
                        className={`btn ${isLocked ? 'btn-locked' : 'btn-outline'} btn-sm`}
                        style={{ flex: 1 }}
                        disabled={isLocked}
                        onClick={() => !isLocked && navigate(`/quiz/${phase.id}`)}
                      >
                        {isCompleted ? 'Retake Quiz' : 'Practice Quiz'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
