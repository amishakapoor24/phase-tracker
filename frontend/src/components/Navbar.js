import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); setMenuOpen(false); };
  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      {/* Logo Section - Left */}
      <div className="nav-brand-shell">
        <button 
          className="btn btn-outline btn-sm nav-back-button" 
          onClick={() => navigate(-1)}
          style={{ padding: '4px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Go Back"
          aria-label="Go back"
        >
          <span aria-hidden="true">←</span><span className="nav-back-label"> Back</span>
        </button>
        <Link to="/" className="nav-logo">
          <div className="nav-logo-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div className="nav-logo-text-group">
            <span className="nav-logo-text">PhaseTracker</span>
            <div className="nav-logo-by-group">
              <span className="nav-logo-by">by</span>
              <span className="nav-logo-nav">navgurukul</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation Links - Center */}
      <div className="nav-links">
        {user && user.role === 'admin' ? (
          <>
            <Link to="/admin">Dashboard</Link>
            <Link to="/admin/phases">Phases</Link>
            <Link to="/admin/questions">Manage Quizzes</Link>
            <Link to="/admin/approvals">Approvals</Link>
            <Link to="/admin/users">Students</Link>
            <Link to="/admin/houses">Houses</Link>
            <Link to="/admin/announcements">Announcements</Link>
            <Link to="/admin/analytics">Analytics</Link>
            <Link to="/admin/audit-logs">Audit Logs</Link>
          </>
        ) : user && user.role === 'mentor' ? (
          <>
            <Link to="/mentor">Dashboard</Link>
            <Link to="/admin/phases">Phases</Link>
            <Link to="/admin/questions">Manage Quizzes</Link>
            <Link to="/admin/approvals">Approvals</Link>
            <Link to="/admin/users">Students</Link>
            <Link to="/admin/announcements">Announcements</Link>
            <Link to="/admin/analytics">Analytics</Link>
          </>
        ) : (
          <>
            <Link to="/">Home</Link>
            {user && <Link to="/dashboard">Dashboard</Link>}
            {!user && (
              <>
                <a href="#features">Features</a>
                <a href="#faq">FAQ</a>
                <a href="#faq">Resources</a>
              </>
            )}
          </>
        )}
      </div>

      {/* Auth Section - Right */}
      <div className="nav-actions">
        {user ? (
          <>
            <Link to="/assistant" className="btn btn-outline btn-sm" style={{ padding: '4px 8px', marginRight: '8px', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              🎙️ Assistant
            </Link>
            <Link to="/notifications" className="btn btn-outline btn-sm" style={{ padding: '4px 8px', marginRight: '8px', textDecoration: 'none' }}>
              🔔
            </Link>
            <Link to="/profile" className="nav-user" style={{ textDecoration: 'none' }}>
              Hi, {user.name.split(' ')[0]}
            </Link>
            <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Create free account</Link>
          </>
        )}
      </div>
      <button
        className="nav-menu-toggle"
        type="button"
        aria-expanded={menuOpen}
        aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        onClick={() => setMenuOpen(open => !open)}
      >
        {menuOpen ? '×' : '☰'}
      </button>
      <div className={`nav-mobile-menu${menuOpen ? ' is-open' : ''}`}>
        <div className="nav-mobile-links" onClick={closeMenu}>
          {user?.role === 'admin' ? (
            <>
              <Link to="/admin">Dashboard</Link><Link to="/admin/phases">Phases</Link>
              <Link to="/admin/questions">Manage Quizzes</Link><Link to="/admin/approvals">Approvals</Link>
              <Link to="/admin/users">Students</Link><Link to="/admin/houses">Houses</Link>
              <Link to="/admin/announcements">Announcements</Link><Link to="/admin/analytics">Analytics</Link>
              <Link to="/admin/audit-logs">Audit Logs</Link>
            </>
          ) : user?.role === 'mentor' ? (
            <>
              <Link to="/mentor">Dashboard</Link><Link to="/admin/phases">Phases</Link>
              <Link to="/admin/questions">Manage Quizzes</Link><Link to="/admin/approvals">Approvals</Link>
              <Link to="/admin/users">Students</Link><Link to="/admin/announcements">Announcements</Link>
              <Link to="/admin/analytics">Analytics</Link>
            </>
          ) : (
            <><Link to="/">Home</Link>{user && <Link to="/dashboard">Dashboard</Link>}</>
          )}
        </div>
        <div className="nav-mobile-actions" onClick={closeMenu}>
          {user ? <><Link to="/assistant">🎙️ Assistant</Link><Link to="/notifications">🔔 Notifications</Link><Link to="/profile">Profile</Link></> : <><Link to="/login">Login</Link><Link to="/register">Create free account</Link></>}
        </div>
      </div>
    </nav>
  );
}
