import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Loading from '../shared/Loading';

export default function StudentPerformance() {
  const [performance, setPerformance] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/assignment-workflow/teacher/performance').then((data) => setPerformance(data.performance)).catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!performance) return <Loading label="Loading student performance..." />;

  return (
    <>
      <div className="page-head"><div><h1>Student Performance</h1><div className="sub">Track average scores and submission activity across your assigned groups.</div></div></div>
      <div className="card">
        <table>
          <thead><tr><th>Student</th><th>Group</th><th>Submissions</th><th>Average score</th></tr></thead>
          <tbody>
            {performance.map((student) => (
              <tr key={student.user_id}>
                <td>{student.full_name}</td>
                <td>{student.group_name}</td>
                <td className="num">{student.submissions}</td>
                <td className="num">{student.average_score != null ? `${student.average_score}%` : '-'}</td>
              </tr>
            ))}
            {performance.length === 0 && <tr><td colSpan="4" style={{ color: 'var(--ink-soft)' }}>No student performance data yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
