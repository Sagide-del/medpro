import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Loading from '../shared/Loading';

export default function SimulationPerformance() {
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/simulations/teacher/performance').then((data) => setResults(data.results)).catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!results) return <Loading label="Loading simulation performance..." />;

  return (
    <>
      <div className="page-head"><div><h1>Simulation Performance</h1><div className="sub">Review simulation attempts, competency scores, and weak areas across your students.</div></div></div>
      <div className="card">
        <table>
          <thead><tr><th>Student</th><th>Group</th><th>Simulation</th><th>Score</th><th>Weak areas</th><th>Completed</th></tr></thead>
          <tbody>
            {results.map((result, index) => (
              <tr key={`${result.user_id}-${result.graded_at || index}`}>
                <td>{result.full_name}</td>
                <td>{result.group_name}</td>
                <td>{result.title}<br /><span style={{ color: 'var(--ink-soft)', fontSize: 12 }}>{result.category} · {result.skill}</span></td>
                <td className="num">{result.overall_competency_score}%</td>
                <td>{Array.isArray(result.weak_areas) ? result.weak_areas.join(', ') || '-' : result.weak_areas || '-'}</td>
                <td className="num">{result.graded_at ? new Date(result.graded_at).toLocaleString('en-KE') : '-'}</td>
              </tr>
            ))}
            {results.length === 0 && <tr><td colSpan="6" style={{ color: 'var(--ink-soft)' }}>No simulation attempts recorded yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
