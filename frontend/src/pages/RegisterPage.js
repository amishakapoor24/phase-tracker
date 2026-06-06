import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', house: '' });
  const [houses, setHouses] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadHouses = async () => {
      try {
        const res = await axios.get('/api/houses');
        setHouses(res.data);
        if (res.data.length > 0) {
          setForm((current) => ({ ...current, house: current.house || res.data[0].slug }));
        }
      } catch (err) {
        setHouses([]);
      }
    };
    loadHouses();
  }, []);

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    if (!form.house) return setError('Please select a house');
    setError(''); setLoading(true);
    try {
      await register(form.name, form.email, form.password, 'student', form.house);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
        <h1>Create your account</h1>
        <p className="auth-sub">Start your structured learning journey today</p>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Full name</label>
            <input name="name" type="text" value={form.name} onChange={handle} placeholder="Your name" required />
          </div>
          <div className="form-group">
            <label>Email address</label>
            <input name="email" type="email" value={form.email} onChange={handle} placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input name="password" type="password" value={form.password} onChange={handle} placeholder="Min. 6 characters" required />
          </div>
          <div className="form-group">
            <label>Select Your House</label>
            <select name="house" value={form.house} onChange={handle} required disabled={houses.length === 0}>
              {houses.length === 0 && <option value="">No houses available</option>}
              {houses.map((house) => (
                <option key={house._id} value={house.slug}>{house.name}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Creating account...' : 'Sign up free →'}
          </button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
