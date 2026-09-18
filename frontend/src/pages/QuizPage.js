import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosConfig';
import Navbar from '../components/Navbar';
import './QuizPage.css';

export default function QuizPage() {
  const { phaseId } = useParams();
  const navigate = useNavigate();

  const [phase, setPhase] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [phaseRes, quizRes] = await Promise.all([
          axiosInstance.get(`/api/phases/${phaseId}`),
          axiosInstance.get(`/api/quiz/${phaseId}`)
        ]);
        setPhase(phaseRes.data);
        setQuestions(quizRes.data);
      } catch (err) {
        setError('Failed to load quiz. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [phaseId]);

  const select = (qIdx, optIdx) => setAnswers(a => ({ ...a, [qIdx]: optIdx }));

  const submit = useCallback(async () => {
    if (Object.keys(answers).length < questions.length) {
      toast.error('Please answer all questions before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const answersArr = questions.map((_, i) => answers[i] ?? -1);
      const { data: valData } = await axiosInstance.post(`/api/quiz/${phaseId}/validate`, { answers: answersArr });
      await axiosInstance.post('/api/progress/submit', { phaseId, score: valData.score, total: valData.total });
      navigate(`/result/${phaseId}`, { state: { ...valData, phaseId } });
    } catch { setError('Submission failed. Please try again.'); setSubmitting(false); }
  }, [answers, questions, phaseId, navigate]);

  if (loading) return <><Navbar /><div className="spinner" style={{ marginTop: 80 }} /></>;
  if (error) return <><Navbar /><div style={{ textAlign: 'center', padding: 60 }}><p>{error}</p><button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Back to dashboard</button></div></>;

  const q = questions[current];
  const answered = Object.keys(answers).length;

  return (
    <div className="quiz-page">
      <Navbar />
      <div className="quiz-inner">
        <div className="quiz-header">
          <div>
            <div className="quiz-phase-tag" style={{ background: phase?.bg, color: phase?.color }}>{phase?.name} quiz</div>
            <h1>Phase assessment</h1>
            <p>Answer all 10 questions. Score ≥70% to pass and unlock the next phase.</p>
          </div>
          <div className="quiz-progress-box">
            <div className="quiz-answered">{answered}/10 answered</div>
            <div className="progress-bar-wrap" style={{ width: 140 }}>
              <div className="progress-bar-fill" style={{ width: `${(answered / questions.length) * 100}%` }} />
            </div>
          </div>
        </div>

        <div className="quiz-layout">
          <div className="quiz-main">
            <div className="quiz-card">
              <div className="q-number">Question {current + 1} of {questions.length}</div>
              <h2 className="q-text">{q.question}</h2>
              <div className="q-options">
                {q.options.map((opt, i) => (
                  <button
                    key={i}
                    className={`q-option ${answers[current] === i ? 'selected' : ''}`}
                    onClick={() => select(current, i)}
                  >
                    <span className="q-opt-letter">{String.fromCharCode(65 + i)}</span>
                    {opt}
                  </button>
                ))}
              </div>
              <div className="q-nav">
                <button className="btn btn-outline" onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}>← Previous</button>
                {current < questions.length - 1
                  ? <button className="btn btn-primary" onClick={() => setCurrent(c => c + 1)}>Next →</button>
                  : <button className="btn btn-primary" onClick={submit} disabled={submitting}>
                      {submitting ? 'Submitting...' : 'Submit quiz ✓'}
                    </button>
                }
              </div>
            </div>
          </div>

          <div className="quiz-sidebar">
            <div className="sidebar-card">
              <h4>Questions</h4>
              <div className="q-dots">
                {questions.map((_, i) => (
                  <button key={i} className={`q-dot ${answers[i] !== undefined ? 'answered' : ''} ${current === i ? 'active' : ''}`}
                    onClick={() => setCurrent(i)}>{i + 1}</button>
                ))}
              </div>
            </div>
            <div className="sidebar-card info-card">
              <h4>Instructions</h4>
              <ul>
                <li>10 multiple choice questions</li>
                <li>Score ≥70% to pass</li>
                <li>Retake allowed if failed</li>
                <li>Use the grid to navigate</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
