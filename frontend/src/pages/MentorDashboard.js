import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import './AdminPage.css'; // We can reuse AdminPage.css styles

export default function MentorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role !== 'mentor' && user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="admin-page">
      <Navbar />
      <div className="admin-inner">
        <div className="admin-header">
          <div>
            <h1>Mentor Dashboard</h1>
            <p>Welcome back! Review approvals, manage the curriculum, and guide your students.</p>
          </div>
        </div>

        <div className="admin-sections">
          <div className="admin-card">
            <div className="admin-card-icon">📚</div>
            <h3>Manage Phases</h3>
            <p>Create and edit learning phases</p>
            <Link to="/admin/phases" className="btn btn-primary btn-sm">Go to Phases →</Link>
          </div>

          <div className="admin-card">
            <div className="admin-card-icon">❓</div>
            <h3>Manage Quizzes</h3>
            <p>Add and edit quiz questions</p>
            <Link to="/admin/questions" className="btn btn-primary btn-sm">Go to Questions →</Link>
          </div>

          <div className="admin-card">
            <div className="admin-card-icon">📋</div>
            <h3>Approvals</h3>
            <p>Review student sub-phase and reflection requests</p>
            <Link to="/admin/approvals" className="btn btn-primary btn-sm">View Requests →</Link>
          </div>

          <div className="admin-card">
            <div className="admin-card-icon">👥</div>
            <h3>Student Directory</h3>
            <p>Search students and view their portfolios & progress</p>
            <Link to="/admin/users" className="btn btn-primary btn-sm">Search Students →</Link>
          </div>

          <div className="admin-card">
            <div className="admin-card-icon">A</div>
            <h3>Announcements</h3>
            <p>Publish updates for your students</p>
            <Link to="/admin/announcements" className="btn btn-primary btn-sm">Go to Announcements →</Link>
          </div>
          
          <div className="admin-card">
            <div className="admin-card-icon">📈</div>
            <h3>Analytics</h3>
            <p>View platform-wide metrics and stats</p>
            <Link to="/admin/analytics" className="btn btn-primary btn-sm">Go to Analytics →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
