import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import './AdminAnalytics.css';

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
    
    // Poll every 5 seconds to keep charts and tables real-time
    const intervalId = setInterval(loadAnalytics, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const loadAnalytics = async () => {
    try {
      const res = await axios.get('/api/admin/analytics/summary');
      setData(res.data);
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <><Navbar /><div className="spinner" style={{ marginTop: 80 }} /></>;
  if (!data) return <><Navbar /><div className="empty-state">Failed to load analytics data</div></>;

  const { summary, houses: housesData, phaseDistribution, mentorActivity } = data;

  const maxVal = Math.max(...phaseDistribution.map(p => p.total), 5);

  return (
    <div className="admin-analytics">
      <Navbar />
      <div className="analytics-inner">
        <div className="analytics-header">
          <h1>📊 Program Analytics</h1>
          <p>Real-time updates on student progress, house performance, and mentor activity</p>
        </div>

        <div className="summary-cards">
          {[
            { label: 'Total Students', value: summary.totalStudents, emoji: '🎓', color: '#4f46e5', bg: '#f5f3ff' },
            { label: 'Total Mentors', value: summary.totalMentors, emoji: '🧑‍🏫', color: '#10b981', bg: '#ecfdf5' },
            { label: 'Reviews Processed', value: summary.totalRequests, emoji: '📝', color: '#ef4444', bg: '#fef2f2' },
            { label: 'Pending Reviews', value: summary.pendingRequests, emoji: '⏳', color: '#f59e0b', bg: '#fffbeb' },
          ].map((card, i) => (
            <div key={i} className="summary-card" style={{ borderLeft: `4px solid ${card.color}` }}>
              <div className="summary-card-content">
                <span className="summary-val">{card.value}</span>
                <span className="summary-label">{card.label}</span>
              </div>
              <div className="summary-icon" style={{ backgroundColor: card.bg }}>{card.emoji}</div>
            </div>
          ))}
        </div>

        <div className="analytics-grid">
          <div className="analytics-section">
            <h2>🏆 House Championship Leaderboard</h2>
            <p className="section-desc">Houses ranked by total phases completed and average score</p>
            <div className="leaderboard-list">
              {housesData
                .sort((a, b) => b.totalCompletedPhases - a.totalCompletedPhases || b.avgScore - a.avgScore)
                .map((h, index) => {
                  return (
                    <div key={h.house} className="leaderboard-item">
                      <div className="rank-badge">#{index + 1}</div>
                      <div className="house-avatar" style={{ backgroundColor: h.color || '#4f46e5' }}>
                        {h.name?.charAt(0).toUpperCase() || h.house?.charAt(0).toUpperCase()}
                      </div>
                      <div className="house-details">
                        <h3>{h.name || h.house} House</h3>
                        <p>{h.studentCount} active students</p>
                      </div>
                      <div className="house-stats">
                        <div className="h-stat">
                          <span className="h-stat-val">{h.totalCompletedPhases}</span>
                          <span className="h-stat-lbl">Phases Done</span>
                        </div>
                        <div className="h-stat">
                          <span className="h-stat-val">{h.avgScore}%</span>
                          <span className="h-stat-lbl">Avg Score</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="analytics-section">
            <h2>📈 Phase Progression Distribution</h2>
            <p className="section-desc">Count of students currently working or finished with each Phase</p>
            
            <div className="chart-container" style={{ position: 'relative', height: 260, marginTop: 20 }}>
              <svg width="100%" height="220" viewBox="0 0 500 220" preserveAspectRatio="none">
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                  const y = 20 + ratio * 140;
                  const labelVal = Math.round(maxVal * (1 - ratio));
                  return (
                    <g key={idx}>
                      <line x1="40" y1={y} x2="480" y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
                      <text x="20" y={y + 4} fill="#9ca3af" fontSize="10" textAnchor="middle">{labelVal}</text>
                    </g>
                  );
                })}

                {phaseDistribution.map((p, idx) => {
                  const colWidth = 60;
                  const x = 50 + idx * 70;
                  
                  const compHeight = (p.completed / maxVal) * 140;
                  const unlHeight = (p.unlocked / maxVal) * 140;

                  return (
                    <g key={p.phaseId}>
                      <rect 
                        x={x} 
                        y={160 - compHeight} 
                        width={colWidth - 25} 
                        height={compHeight} 
                        fill="#10b981" 
                        rx="3"
                      />
                      <rect 
                        x={x} 
                        y={160 - compHeight - unlHeight} 
                        width={colWidth - 25} 
                        height={unlHeight} 
                        fill="#4f46e5" 
                        rx="3"
                      />
                      
                      <text x={x + 18} y="180" fill="#4b5563" fontSize="10" fontWeight="bold" textAnchor="middle">
                        {p.phaseId.substring(0, 4).toUpperCase()}
                      </text>
                    </g>
                  );
                })}
              </svg>
              <div className="chart-legend" style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4b5563' }}>
                  <span style={{ display: 'inline-block', width: 12, height: 12, backgroundColor: '#10b981', borderRadius: 3 }} />
                  Completed Phase
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4b5563' }}>
                  <span style={{ display: 'inline-block', width: 12, height: 12, backgroundColor: '#4f46e5', borderRadius: 3 }} />
                  Currently Active
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="analytics-section" style={{ marginTop: 24 }}>
          <h2>🧑‍🏫 Mentor Review Activity</h2>
          <p className="section-desc">Track approvals and rejections processed per mentor/admin</p>
          <div className="mentor-table-wrapper" style={{ marginTop: 16 }}>
            {mentorActivity.length > 0 ? (
              <table className="mentor-table">
                <thead>
                  <tr>
                    <th>Mentor Name</th>
                    <th>Email Address</th>
                    <th>Total Reviews</th>
                    <th>Approvals</th>
                    <th>Rejections</th>
                    <th>Approval Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {mentorActivity.map((m, idx) => {
                    const rate = m.totalReviews > 0 ? Math.round((m.approvals / m.totalReviews) * 100) : 0;
                    return (
                      <tr key={idx}>
                        <td style={{ fontWeight: 'bold' }}>{m.name}</td>
                        <td>{m.email}</td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{m.totalReviews}</td>
                        <td style={{ textAlign: 'center', color: '#10b981', fontWeight: 'bold' }}>{m.approvals}</td>
                        <td style={{ textAlign: 'center', color: '#ef4444', fontWeight: 'bold' }}>{m.rejections}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="progress-bar-wrap" style={{ width: 80, height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                              <div className="progress-bar-fill" style={{ width: `${rate}%`, height: '100%', backgroundColor: '#4f46e5' }} />
                            </div>
                            <span>{rate}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">No mentor activity recorded yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
