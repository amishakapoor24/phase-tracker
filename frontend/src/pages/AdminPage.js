import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import './AdminPage.css';

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'mentor') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="admin-page">
      <Navbar />
      <div className="admin-inner">
        <div className="admin-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Manage the platform, review requests, and track student progress</p>
          </div>
        </div>

        <div className="admin-sections">
          <div className="admin-card">
            <div className="admin-card-icon">📚</div>
            <h3>Manage Phases</h3>
            <p>Create, edit, and delete learning phases</p>
            <Link to="/admin/phases" className="btn btn-primary btn-sm">Go to Phases →</Link>
          </div>

          <div className="admin-card">
            <div className="admin-card-icon">❓</div>
            <h3>Manage Questions</h3>
            <p>Add and edit questions for each phase</p>
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
            <h3>Student Progress</h3>
            <p>Track student attempts and progress on phases</p>
            <Link to="/admin/student-progress" className="btn btn-primary btn-sm">View Progress →</Link>
          </div>

          <div className="admin-card">
            <div className="admin-card-icon">H</div>
            <h3>Manage Houses</h3>
            <p>Create and edit houses students can join</p>
            <Link to="/admin/houses" className="btn btn-primary btn-sm">Go to Houses →</Link>
          </div>

          <div className="admin-card">
            <div className="admin-card-icon">A</div>
            <h3>Announcements</h3>
            <p>Publish updates for users, roles, or houses</p>
            <Link to="/admin/announcements" className="btn btn-primary btn-sm">Go to Announcements →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
