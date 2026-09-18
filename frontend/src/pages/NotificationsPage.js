import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/axiosConfig';
import Navbar from '../components/Navbar';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifs = async () => {
      setLoading(true);
      try {
        const [annRes, progRes, phasesRes] = await Promise.all([
          axiosInstance.get('/api/announcements').catch(() => ({ data: [] })),
          user?.role === 'student' ? axiosInstance.get('/api/progress').catch(() => ({ data: null })) : { data: null },
          axiosInstance.get('/api/phases').catch(() => ({ data: [] }))
        ]);
        
        const notifs = [];
        if (annRes.data && Array.isArray(annRes.data)) {
          annRes.data.forEach(ann => {
            notifs.push({ id: `ann-${ann._id}`, type: 'announcement', title: ann.title, message: ann.body });
          });
        }

        if (progRes.data?.phases && Array.isArray(phasesRes.data)) {
          progRes.data.phases.forEach(p => {
            const phaseData = phasesRes.data.find(ph => ph.id === p.phaseId);
            const phaseName = phaseData ? phaseData.name : p.phaseId;

            if (p.reflection1Status === 'pending') {
              notifs.push({ id: `ref1-${p.phaseId}`, type: 'pending', title: 'Reflection Pending', message: `Reflection 1 for ${phaseName} is awaiting approval.` });
            } else if (p.reflection1Status === 'rejected') {
              notifs.push({ id: `ref1-rej-${p.phaseId}`, type: 'rejected', title: 'Reflection Needs Review', message: `Reflection 1 for ${phaseName} was rejected.` });
            } else if (p.reflection1Status === 'approved') {
              notifs.push({ id: `ref1-app-${p.phaseId}`, type: 'approved', title: 'Reflection Approved', message: `Great job! Reflection 1 for ${phaseName} was approved.` });
            }

            if (p.finalReflectionStatus === 'pending') {
              notifs.push({ id: `fref-${p.phaseId}`, type: 'pending', title: 'Final Reflection Pending', message: `Final Reflection for ${phaseName} is awaiting approval.` });
            } else if (p.finalReflectionStatus === 'rejected') {
              notifs.push({ id: `fref-rej-${p.phaseId}`, type: 'rejected', title: 'Final Reflection Needs Review', message: `Final Reflection for ${phaseName} was rejected.` });
            } else if (p.finalReflectionStatus === 'approved') {
              notifs.push({ id: `fref-app-${p.phaseId}`, type: 'approved', title: 'Final Reflection Approved', message: `Congratulations! Final Reflection for ${phaseName} was approved.` });
            }

            p.subPhases?.forEach(sp => {
              if (sp.approvalStatus === 'pending') {
                notifs.push({ id: `sp-pen-${sp.subPhaseId}`, type: 'pending', title: 'Sub-Phase Pending', message: `Sub-phase ${sp.subPhaseId} is awaiting approval.` });
              } else if (sp.approvalStatus === 'rejected') {
                notifs.push({ id: `sp-rej-${sp.subPhaseId}`, type: 'rejected', title: 'Sub-Phase Needs Review', message: `Sub-phase ${sp.subPhaseId} was rejected.` });
              } else if (sp.approvalStatus === 'approved') {
                notifs.push({ id: `sp-app-${sp.subPhaseId}`, type: 'approved', title: 'Sub-Phase Approved', message: `Sub-phase ${sp.subPhaseId} was approved!` });
              }
            });
          });
        }

        notifs.sort((a, b) => {
          if (a.type !== 'announcement' && b.type === 'announcement') return -1;
          if (a.type === 'announcement' && b.type !== 'announcement') return 1;
          return 0;
        });

        setNotifications(notifs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchNotifs();
    }
  }, [user]);

  return (
    <div className="page-layout">
      <Navbar />
      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
        <h1 style={{ marginBottom: '24px', fontSize: '28px', color: '#111827' }}>Notifications</h1>
        
        {loading ? (
          <div className="spinner" style={{ margin: '40px auto' }}></div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#F9FAFB', borderRadius: '12px', color: '#6B7280' }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>📭</span>
            <p>You have no notifications at the moment.</p>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {notifications.map(notif => (
              <li key={notif.id} style={{ 
                display: 'flex', gap: '16px', padding: '20px', borderRadius: '12px',
                background: notif.type === 'announcement' ? '#F3F4F6' : notif.type === 'pending' ? '#FEF3C7' : notif.type === 'approved' ? '#D1FAE5' : '#FEE2E2',
                border: `1px solid ${notif.type === 'announcement' ? '#E5E7EB' : notif.type === 'pending' ? '#FDE68A' : notif.type === 'approved' ? '#34D399' : '#FECACA'}`
              }}>
                <div style={{ fontSize: '24px' }}>
                  {notif.type === 'announcement' ? '📢' : notif.type === 'pending' ? '⏳' : notif.type === 'approved' ? '✅' : '❌'}
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '16px', marginBottom: '4px', color: '#1F2937' }}>{notif.title}</strong>
                  <p style={{ margin: 0, fontSize: '15px', color: '#4B5563', lineHeight: '1.5' }}>{notif.message}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
