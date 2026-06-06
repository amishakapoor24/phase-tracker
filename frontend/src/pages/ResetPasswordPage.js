import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { resettoken } = useParams();
  const navigate = useNavigate();
  const { loadUserFromToken } = useAuth(); // We might need to implement this or just navigate to login

  const submit = async e => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    setError(''); 
    setLoading(true);
    try {
      const res = await api.put(`/auth/resetpassword/${resettoken}`, { password });
      // On success, we can login the user with the new token or just redirect to login
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed. Token might be invalid or expired.');
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
        <h1>Create New Password</h1>
        <p className="auth-sub">Please enter your new password below.</p>
        
        {error && <div className="error-msg">{error}</div>}
        
        <form onSubmit={submit}>
          <div className="form-group">
            <label>New Password</label>
            <input name="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter new password" required minLength="6" />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input name="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" required minLength="6" />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password →'}
          </button>
        </form>
        <p className="auth-switch"><Link to="/login">Back to Sign in</Link></p>
      </div>
    </div>
  );
}
