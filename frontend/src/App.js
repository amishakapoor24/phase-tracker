import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import QuizPage from './pages/QuizPage';
import ResultPage from './pages/ResultPage';
import StudentPhaseDetail from './pages/StudentPhaseDetail';
import UserProfilePage from './pages/UserProfilePage';
import AdminPage from './pages/AdminPage';
import AdminPhases from './pages/AdminPhases';
import AdminQuestions from './pages/AdminQuestions';
import AdminSubPhases from './pages/AdminSubPhases';
import MentorDashboard from './pages/MentorDashboard';
import MentorApprovals from './pages/MentorApprovals';
import AdminUsers from './pages/AdminUsers';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminAuditLogs from './pages/AdminAuditLogs';
import AdminHouses from './pages/AdminHouses';
import AdminAnnouncements from './pages/AdminAnnouncements';
import NotificationsPage from './pages/NotificationsPage';
import StudentProgressPage from './pages/StudentProgressPage';
import AssistantPage from './pages/AssistantPage';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-center"><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-center"><div className="spinner" /></div>;
  return user && user.role === 'admin' ? children : <Navigate to="/dashboard" />;
};

const MentorRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-center"><div className="spinner" /></div>;
  return user && (user.role === 'admin' || user.role === 'mentor') ? children : <Navigate to="/dashboard" />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-center"><div className="spinner" /></div>;
  if (user) {
    if (user.role === 'admin') return <Navigate to="/admin" />;
    if (user.role === 'mentor') return <Navigate to="/mentor" />;
    return <Navigate to="/dashboard" />;
  }
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
          <Route path="/reset-password/:resettoken" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/phase/:phaseId" element={<PrivateRoute><StudentPhaseDetail /></PrivateRoute>} />
          <Route path="/quiz/:phaseId" element={<PrivateRoute><QuizPage /></PrivateRoute>} />
          <Route path="/result/:phaseId" element={<PrivateRoute><ResultPage /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><UserProfilePage /></PrivateRoute>} />
          <Route path="/profile/:id" element={<PrivateRoute><UserProfilePage /></PrivateRoute>} />
          <Route path="/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
          <Route path="/assistant" element={<PrivateRoute><AssistantPage /></PrivateRoute>} />
          <Route path="/assistant/:role" element={<PrivateRoute><AssistantPage /></PrivateRoute>} />
          
          
          {/* Admin/Mentor Routes */}
          <Route path="/mentor" element={<MentorRoute><MentorDashboard /></MentorRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
          <Route path="/admin/phases" element={<MentorRoute><AdminPhases /></MentorRoute>} />
          <Route path="/admin/phases/:phaseId" element={<MentorRoute><AdminPhases /></MentorRoute>} />
          <Route path="/admin/subphases/:phaseId" element={<MentorRoute><AdminSubPhases /></MentorRoute>} />
          <Route path="/admin/questions" element={<MentorRoute><AdminQuestions /></MentorRoute>} />
          <Route path="/admin/approvals" element={<MentorRoute><MentorApprovals /></MentorRoute>} />
          <Route path="/admin/users" element={<MentorRoute><AdminUsers /></MentorRoute>} />
          <Route path="/admin/houses" element={<AdminRoute><AdminHouses /></AdminRoute>} />
          <Route path="/admin/announcements" element={<MentorRoute><AdminAnnouncements /></MentorRoute>} />
          <Route path="/admin/analytics" element={<MentorRoute><AdminAnalytics /></MentorRoute>} />
          <Route path="/admin/student-progress" element={<MentorRoute><StudentProgressPage /></MentorRoute>} />
          <Route path="/admin/audit-logs" element={<AdminRoute><AdminAuditLogs /></AdminRoute>} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
