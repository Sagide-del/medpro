import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Vital from '../Vital';
import Loading from '../shared/Loading';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [groups, setGroups] = useState(null);
  const [pendingLogbook, setPendingLogbook] = useState([]);
  const [pendingVideos, setPendingVideos] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api('/groups').then((d) => setGroups(d.groups)),
      api('/logbook/entries/pending').then((d) => setPendingLogbook(d.entries)),
      api('/videos/pending').then((d) => setPendingVideos(d.videos)),
    ]).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!groups) return <Loading label="Loading your dashboard…" />;

  const studentCount = groups.reduce((s, g) => s + (g.member_count || 0), 0);

  return (
    <>
      <div className="page-head">
        <div><h1>Welcome, {user.name?.split(' ')[0]}</h1><div className="sub">Teacher dashboard</div></div>
      </div>

      <div className="vitals">
        <Vital label="Groups" value={groups.length} />
        <Vital label="Students" value={studentCount} />
        <Vital label="Logbook entries pending" value={pendingLogbook.length} />
        <Vital label="Videos pending" value={pendingVideos.length} />
      </div>

      <div className="form-grid">
        <Link to="/teacher/create-assessment" style={{ textDecoration: 'none' }}>
          <div className="card"><h2>Create an assessment</h2><p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>Build a quiz, exam, or clinical judgment scenario.</p></div>
        </Link>
        <Link to="/teacher/review-logbook" style={{ textDecoration: 'none' }}>
          <div className="card"><h2>Review logbook entries</h2><p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>{pendingLogbook.length} awaiting your review.</p></div>
        </Link>
        <Link to="/teacher/analytics" style={{ textDecoration: 'none' }}>
          <div className="card"><h2>Class analytics</h2><p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>See how each group is performing.</p></div>
        </Link>
      </div>

      <div className="card">
        <h2>My groups</h2>
        <table>
          <thead><tr><th>Group</th><th>Students</th></tr></thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.group_id}><td>{g.name}</td><td className="num">{g.member_count}</td></tr>
            ))}
            {groups.length === 0 && <tr><td colSpan="2" style={{ color: 'var(--ink-soft)' }}>No groups yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
