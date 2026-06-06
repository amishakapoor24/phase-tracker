import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import './AdminQuestions.css';

export default function AdminQuestions() {
  const [searchParams] = useSearchParams();
  const phaseParam = searchParams.get('phase');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [phases, setPhases] = useState([]);
  const [selectedPhase, setSelectedPhase] = useState(phaseParam || '');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showSuccessOption, setShowSuccessOption] = useState(false);
  const [formData, setFormData] = useState({
    question: '',
    options: ['', '', '', ''],
    answer: 0
  });

  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'mentor') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    loadPhases();
  }, []);

  useEffect(() => {
    if (selectedPhase) {
      loadQuestions();
    }
  }, [selectedPhase]);

  const loadPhases = async () => {
    try {
      const res = await axios.get('/api/admin/phases');
      setPhases(res.data);
      if (phaseParam && res.data.find(p => p.id === phaseParam)) {
        setSelectedPhase(phaseParam);
      }
    } catch (err) {
      console.error('Error loading phases:', err);
    }
  };

  const loadQuestions = async () => {
    if (!selectedPhase) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/admin/questions/${selectedPhase}`);
      setQuestions(res.data);
    } catch (err) {
      console.error('Error loading questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData(prev => ({ ...prev, options: newOptions }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.options.some(opt => !opt.trim())) {
      toast.error('All options must be filled');
      return;
    }

    try {
      if (editingQuestion) {
        await axios.put(`/api/admin/question/${editingQuestion._id}`, formData);
      } else {
        await axios.post('/api/admin/questions', { phaseId: selectedPhase, ...formData });
      }
      setShowForm(false);
      setEditingQuestion(null);
      setFormData({ question: '', options: ['', '', '', ''], answer: 0 });
      loadQuestions();
      setShowSuccessOption(true);
    } catch (err) {
      toast.error('Error: ' + err.response?.data?.message || err.message);
    }
  };

  const handleEdit = (question) => {
    setEditingQuestion(question);
    setFormData({
      question: question.question,
      options: question.options,
      answer: question.answer
    });
    setShowForm(true);
  };

  const handleDelete = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await axios.delete(`/api/admin/question/${questionId}`);
      loadQuestions();
    } catch (err) {
      toast.error('Error: ' + err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="admin-questions">
      <Navbar />
      <div className="admin-questions-inner">
        <div className="admin-questions-header">
          <div>
            <h1>Manage Questions</h1>
            <p>Create and edit questions for each phase</p>
          </div>
          <button 
            className="btn btn-primary btn-sm" 
            disabled={!selectedPhase}
            onClick={() => {
              setEditingQuestion(null);
              setFormData({ question: '', options: ['', '', '', ''], answer: 0 });
              setShowForm(!showForm);
            }}
          >
            {showForm ? '✕ Cancel' : '+ New Question'}
          </button>
        </div>

        <div className="phase-selector">
          <label>Select Phase</label>
          <select value={selectedPhase} onChange={(e) => setSelectedPhase(e.target.value)}>
            <option value="">Choose a phase...</option>
            {phases.map(phase => (
              <option key={phase.id} value={phase.id}>
                {phase.name} ({phase.id})
              </option>
            ))}
          </select>
        </div>

        {selectedPhase && showForm && (
          <div className="question-form">
            <h3>{editingQuestion ? 'Edit Question' : 'Create New Question'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Question</label>
                <textarea
                  name="question"
                  value={formData.question}
                  onChange={handleInputChange}
                  required
                  rows="2"
                  placeholder="Enter the question..."
                />
              </div>

              <div className="options-group">
                <label>Options</label>
                {formData.options.map((option, i) => (
                  <div key={i} className="option-row">
                    <label className="option-label">
                      <input
                        type="radio"
                        name="answer"
                        value={i}
                        checked={parseInt(formData.answer) === i}
                        onChange={(e) => setFormData(prev => ({ ...prev, answer: parseInt(e.target.value) }))}
                      />
                      <span>Option {i + 1}</span>
                    </label>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(i, e.target.value)}
                      placeholder={`Enter option ${i + 1}...`}
                      required
                    />
                  </div>
                ))}
              </div>

              <div className="correct-answer">
                <p><strong>Correct Answer:</strong> Option {parseInt(formData.answer) + 1}</p>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingQuestion ? 'Update Question' : 'Create Question'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {showSuccessOption && (
          <div className="success-option-card">
            <h3>✓ Question {editingQuestion ? 'updated' : 'created'} successfully!</h3>
            <p>What would you like to do next?</p>
            <div className="success-options">
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setShowSuccessOption(false);
                  setShowForm(true);
                  setFormData({ question: '', options: ['', '', '', ''], answer: 0 });
                }}
              >
                ➕ Add Another Question
              </button>
              <button 
                className="btn btn-outline"
                onClick={() => {
                  setShowSuccessOption(false);
                  navigate('/admin/phases');
                }}
              >
                ➕ Manage Phases
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

        {selectedPhase && (
          <div className="questions-list">
            <div className="questions-header">
              <h3>Questions for {phases.find(p => p.id === selectedPhase)?.name}</h3>
              <span className="question-count">{questions.length} questions</span>
            </div>

            {loading ? (
              <div className="spinner" />
            ) : questions.length > 0 ? (
              questions.map((q, i) => (
                <div key={q._id} className="question-card">
                  <div className="question-content">
                    <div className="question-number">{i + 1}</div>
                    <div className="question-details">
                      <h4>{q.question}</h4>
                      <div className="options-display">
                        {q.options.map((opt, idx) => (
                          <div key={idx} className={`option ${idx === q.answer ? 'correct' : ''}`}>
                            <span className="option-letter">{String.fromCharCode(65 + idx)}.</span>
                            <span className="option-text">{opt}</span>
                            {idx === q.answer && <span className="checkmark">✓</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="question-actions">
                    <button className="btn-small btn-edit" onClick={() => handleEdit(q)}>✏️ Edit</button>
                    <button className="btn-small btn-delete" onClick={() => handleDelete(q._id)}>🗑️ Delete</button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No questions yet. Create one to get started.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
