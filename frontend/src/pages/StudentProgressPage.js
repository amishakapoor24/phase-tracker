import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './AdminPage.css'; // Reuse existing styles, might need to extract to StudentProgressPage.css later

export default function StudentProgressPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [phases, setPhases] = useState([]);
  const [students, setStudents] = useState([]);
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'mentor') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    const load = async () => {
      try {
        const phasesRes = await axios.get('/api/admin/phases');
        setPhases(phasesRes.data);

        const housesRes = await axios.get('/api/admin/houses');
        setHouses(housesRes.data);
        
        const progressRes = await axios.get('/api/admin/student-progress');
        setStudents(progressRes.data);
      } catch (err) {
        console.error('Error loading student progress:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <><Navbar /><div className="spinner" style={{ marginTop: 80 }} /></>;

  // Prepare chart data
  // 1. Progress by House (Avg Score or Total Completed Phases)
  const houseChartData = houses.map(house => {
    const houseStudents = students.filter(s => s.progressData?.user?.house === house.slug);
    const totalStudents = houseStudents.length;
    let totalCompleted = 0;
    houseStudents.forEach(s => {
      const completed = s.progressData?.phases?.filter(p => p.status === 'completed').length || 0;
      totalCompleted += completed;
    });
    return {
      name: house.name,
      students: totalStudents,
      completedPhases: totalCompleted,
      color: house.color || '#4A90E2'
    };
  });

  // 2. Phase completion distribution (Pie Chart)
  let overallCompleted = 0;
  let overallInProgress = 0;
  let overallLocked = 0;

  students.forEach(s => {
    const sPhases = s.progressData?.phases || [];
    sPhases.forEach(p => {
      if (p.status === 'completed') overallCompleted++;
      else if (p.status === 'unlocked') overallInProgress++;
      else overallLocked++;
    });
  });

  const phasePieData = [
    { name: 'Completed', value: overallCompleted, color: '#10B981' },
    { name: 'In Progress', value: overallInProgress, color: '#F59E0B' },
    { name: 'Locked', value: overallLocked, color: '#6B7280' }
  ];

  return (
    <div className="admin-page">
      <Navbar />
      <div className="admin-inner" style={{ maxWidth: 1200 }}>
        <div className="admin-header">
          <div>
            <h1>Student Progress Analytics</h1>
            <p>Detailed view of student progress across houses and phases</p>
          </div>
          <button className="btn btn-outline" onClick={() => navigate('/admin')}>← Back to Admin</button>
        </div>

        {/* Charts Section */}
        {!selectedStudent && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px' }}>
            <div className="chart-card" style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
              <h3 style={{ marginBottom: '16px', color: '#374151' }}>House Progress Overview</h3>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={houseChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip cursor={{fill: '#f3f4f6'}} />
                    <Legend />
                    <Bar dataKey="completedPhases" name="Total Completed Phases" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="students" name="Total Students" fill="#93C5FD" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card" style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
              <h3 style={{ marginBottom: '16px', color: '#374151' }}>Global Phase Status</h3>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={phasePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {phasePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Drill-down Section */}
        {!selectedStudent && (
          <div className="student-progress-section">
            <h2>📚 Student Progress by House</h2>
            {students.length > 0 ? (
              <div className="houses-grid">
                {houses.map((houseData) => {
                  const houseStudents = students.filter(s => s.progressData?.user?.house === houseData.slug);
                  return (
                    <div key={houseData._id} className="house-card" style={{ borderTop: `4px solid ${houseData.color || '#4A90E2'}` }}>
                      <h3>{houseData.name}</h3>
                      <div className="students-list">
                        {houseStudents.length > 0 ? (
                          houseStudents.map((student) => (
                            <div
                              key={student._id}
                              className="student-item"
                              onClick={() => setSelectedStudent(student)}
                            >
                              <span className="student-item-name">{student.name}</span>
                              <span className="student-item-arrow">→</span>
                            </div>
                          ))
                        ) : (
                          <p className="no-students">No students in this house</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No student data available yet.
              </p>
            )}
          </div>
        )}

        {selectedStudent && (
          <div className="student-profile-section">
            <div className="profile-header">
              <button className="btn btn-outline btn-sm" onClick={() => setSelectedStudent(null)}>
                ← Back to Houses
              </button>
              <h2>📌 {selectedStudent.name}'s Progress</h2>
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{selectedStudent.email}</div>
            </div>

            <div className="profile-phases">
              <table className="profile-table">
                <thead>
                  <tr>
                    <th>Phase</th>
                    <th>Status</th>
                    <th>Attempts</th>
                    <th>Best Score</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedStudent.progressData?.phases?.map((phase, idx) => (
                    <tr key={idx}>
                      <td className="phase-name">{phases.find(p => p.id === phase.phaseId)?.name || phase.phaseId}</td>
                      <td>
                        <span className={`status-badge status-${phase.status}`}>
                          {phase.status}
                        </span>
                      </td>
                      <td className="attempts-center">{phase.attempts?.length || 0}</td>
                      <td className="score-highlight"><strong>{phase.bestScore}%</strong></td>
                      <td>
                        {phase.attempts?.length > 0 ? (
                          <span className="last-attempt">
                            {new Date(phase.attempts[0].attemptedAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="no-attempt">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="profile-stats">
              <div className="stat-card">
                <span className="stat-label">Total Phases</span>
                <span className="stat-value">{selectedStudent.progressData?.phases?.length || 0}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Completed</span>
                <span className="stat-value">{selectedStudent.progressData?.phases?.filter(p => p.status === 'completed').length || 0}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Average Score</span>
                <span className="stat-value">
                  {selectedStudent.progressData?.phases?.length > 0
                    ? Math.round(selectedStudent.progressData.phases.reduce((sum, p) => sum + p.bestScore, 0) / selectedStudent.progressData.phases.length)
                    : 0}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
