import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../utils/axiosConfig';
import Navbar from '../components/Navbar';
import './ResultPage.css';

export default function ResultPage() {
  const { phaseId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [phase, setPhase] = useState(null);
  const [phases, setPhases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [phaseRes, phasesRes] = await Promise.all([
          axiosInstance.get(`/api/phases/${phaseId}`),
          axiosInstance.get('/api/phases')
        ]);
        setPhase(phaseRes.data);
        setPhases(phasesRes.data);
      } catch (err) {
        console.error('Error loading phases:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [phaseId]);

  if (!state) { navigate('/dashboard'); return null; }

  const { score, total, percentage, results } = state;
  const passed = percentage >= 70;

  // Find next phase by order
  const nextPhase = phases.find(p => p.order === (phase?.order ?? -1) + 1) || null;

  return (
    <div className="result-page">
      <Navbar />
      <div className="result-inner">
        <div className={`result-hero ${passed ? 'pass' : 'fail'}`}>
          <div className="result-icon">{passed ? '🎉' : '😔'}</div>
          <h1>{passed ? 'Congratulations! You passed!' : 'Almost there! Keep trying!'}</h1>
          <p>{passed
            ? `You've passed the ${phase?.name} phase and unlocked the next phase!`
            : `You need 70% to pass. Your score was ${percentage}%. Retry to improve!`
          }</p>
          <div className="result-score-ring">
            <div className="score-big" style={{ color: passed ? '#0F6E56' : '#D85A30' }}>{percentage}%</div>
            <div className="score-sub">{score}/{total} correct</div>
          </div>
        </div>

        <div className="result-actions">
          <button className="btn btn-outline" onClick={() => navigate('/dashboard')}>← Back to dashboard</button>
          {passed && nextPhase && (
            <button className="btn btn-primary" onClick={() => navigate(`/quiz/${nextPhase.id}`)}>
              Start {nextPhase.name} phase →
            </button>
          )}
          {!passed && (
            <button className="btn btn-primary" onClick={() => navigate(`/quiz/${phaseId}`)}>Retry quiz →</button>
          )}
        </div>

        <div className="result-breakdown">
          <h2>Question breakdown</h2>
          <div className="breakdown-list">
            {results?.map((r, i) => (
              <div key={i} className={`breakdown-item ${r.correct ? 'correct' : 'wrong'}`}>
                <span className="breakdown-icon">{r.correct ? '✓' : '✗'}</span>
                <span>Question {i + 1}</span>
                <span className="breakdown-status">{r.correct ? 'Correct' : 'Incorrect'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
