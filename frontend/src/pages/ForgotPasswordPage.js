import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/axiosConfig';
import './AuthPage.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgotpassword', { email });
      setMessage(res.data.message || 'Password reset email sent. Please check your inbox.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
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
        <h1>Reset Password</h1>
        <p className="auth-sub">Enter your email to receive a password reset link.</p>
        
        {message && <div className="success-msg" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '12px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>{message}</div>}
        {error && <div className="error-msg">{error}</div>}
        
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Email address</label>
            <input name="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link →'}
          </button>
        </form>
        <p className="auth-switch">Remember your password? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
