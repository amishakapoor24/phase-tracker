import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import './AdminAuditLogs.css';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const res = await axios.get('/api/admin/audit-logs');
      setLogs(res.data);
    } catch (err) {
      console.error('Error loading audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionClass = (action) => {
    if (action.includes('approve') || action.includes('create') || action.includes('register') || action.includes('login')) return 'action-success';
    if (action.includes('reject') || action.includes('delete') || action.includes('disabled') || action.includes('status')) return 'action-danger';
    if (action.includes('submit')) return 'action-warning';
    return 'action-info';
  };

  return (
    <div className="admin-audit-logs">
      <Navbar />
      <div className="logs-inner">
        <div className="logs-header">
          <h1>📋 System Audit Logs</h1>
          <p>Trace administrative operations, submissions, reviews, and sign-ins</p>
        </div>

        {loading ? (
          <div className="spinner" style={{ marginTop: 40 }} />
        ) : logs.length > 0 ? (
          <div className="logs-table-container">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>IP Address</th>
                  <th>Metadata Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td className="timestamp">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td>
                      {log.user ? (
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{log.user.name}</div>
                          <div style={{ fontSize: 11, color: '#6b7280' }}>{log.user.email} ({log.user.role})</div>
                        </div>
                      ) : (
                        <span className="text-muted">Unknown User</span>
                      )}
                    </td>
                    <td>
                      <span className={`action-badge ${getActionClass(log.action)}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="ip-address">{log.ipAddress || '—'}</td>
                    <td>
                      {log.details ? (
                        <div className="meta-details">
                          {Object.entries(log.details).map(([key, val]) => (
                            <div key={key} style={{ margin: '2px 0' }}>
                              <strong style={{ textTransform: 'capitalize' }}>{key}:</strong> {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>No audit logs available.</p>
          </div>
        )}
      </div>
    </div>
  );
}
