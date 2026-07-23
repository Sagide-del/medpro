import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import Loading from '../shared/Loading';

export default function ProctoredExams() {
  const [exams, setExams] = useState(null);
  const [status, setStatus] = useState('');
  const [activeExamId, setActiveExamId] = useState('');
  const [manualScore, setManualScore] = useState({});

  async function load() {
    const data = await api('/proctored-exams');
    setExams(data.exams);
  }

  useEffect(() => {
    load().catch((error) => setStatus(error.message));
  }, []);

  const activeExam = useMemo(() => exams?.find((exam) => exam.exam_id === activeExamId) || null, [exams, activeExamId]);

  async function startExam(examId) {
    await api(`/proctored-exams/${examId}/start`, { method: 'POST' });
    setActiveExamId(examId);
    await load();
  }

  async function submitExam(examId, autoSubmitted = false) {
    await api(`/proctored-exams/${examId}/submit`, {
      method: 'POST',
      body: { score: Number(manualScore[examId] || 0), autoSubmitted },
    });
    setActiveExamId('');
    await load();
  }

  async function flagSuspicious(examId) {
    await api(`/proctored-exams/${examId}/activity`, {
      method: 'POST',
      body: {
        eventType: 'suspicious_activity',
        details: { source: 'student-self-report', time: new Date().toISOString() },
      },
    });
    await load();
  }

  if (!exams) return <Loading label="Loading proctored exams..." />;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Proctored exams</h1>
          <div className="sub">Timed institutional exams remain separate from standard assessments.</div>
        </div>
      </div>

      {status && <div className="alert">{status}</div>}

      <div className="card">
        <h2>Your exam schedule</h2>
        <table>
          <thead>
            <tr>
              <th>Exam</th>
              <th>Type</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Score</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {exams.map((exam) => (
              <tr key={exam.exam_id}>
                <td>{exam.title}</td>
                <td>{exam.exam_type}</td>
                <td>{exam.duration_minutes} min</td>
                <td>{exam.attempt_status || exam.candidate_status}</td>
                <td>{exam.result_released ? (exam.score ?? 'Pending') : 'Hidden'}</td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <button className="ghost" onClick={() => startExam(exam.exam_id)} disabled={exam.attempt_status === 'submitted'}>
                    Start
                  </button>
                  <button className="ghost" onClick={() => flagSuspicious(exam.exam_id)} disabled={!exam.attempt_id}>
                    Report issue
                  </button>
                </td>
              </tr>
            ))}
            {exams.length === 0 && <tr><td colSpan="6" style={{ color: 'var(--ink-soft)' }}>No proctored exams assigned yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {activeExam && (
        <div className="card">
          <h2>{activeExam.title}</h2>
          <div className="sub">Exam window: {activeExam.duration_minutes} minutes • Passing score {activeExam.passing_score}%</div>
          <div className="field" style={{ marginTop: 16 }}>
            <label>Practice/manual score entry for local QA</label>
            <input
              type="number"
              min="0"
              max="100"
              value={manualScore[activeExam.exam_id] || ''}
              onChange={(event) => setManualScore({ ...manualScore, [activeExam.exam_id]: event.target.value })}
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="primary" onClick={() => submitExam(activeExam.exam_id, false)}>Submit exam</button>
            <button className="ghost" onClick={() => submitExam(activeExam.exam_id, true)}>Auto-submit simulation</button>
          </div>
        </div>
      )}
    </>
  );
}
