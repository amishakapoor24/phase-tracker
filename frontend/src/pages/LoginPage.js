import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const userData = await login(form.email, form.password);
      if (userData.role === 'admin') {
        navigate('/admin');
      } else if (userData.role === 'mentor') {
        navigate('/mentor');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo">
          <div className="auth-logo-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <span>PhaseTracker</span>
        </Link>
        <h1>Welcome back</h1>
        <p className="auth-sub">Sign in to continue your learning journey</p>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Email address</label>
            <input name="email" type="email" value={form.email} onChange={handle} placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label>Password</label>
              <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: '#4f46e5', textDecoration: 'none' }}>Forgot password?</Link>
            </div>
            <input name="password" type="password" value={form.password} onChange={handle} placeholder="Your password" required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in →'}
          </button>
        </form>
        <p className="auth-switch">Don't have an account? <Link to="/register">Sign up free</Link></p>
      </div>
    </div>
  );
}
