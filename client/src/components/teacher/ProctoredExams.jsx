import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Loading from '../shared/Loading';

const initialForm = {
  title: '',
  examType: 'CAT',
  durationMinutes: 60,
  questionCount: 20,
  passingScore: 50,
  randomQuestions: true,
  randomAnswerOrder: true,
  startsAt: '',
  endsAt: '',
  studentIds: '',
};

export default function ProctoredExams() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [selectedExam, setSelectedExam] = useState('');
  const [status, setStatus] = useState('');

  async function load(examId = selectedExam) {
    const [exams, reports] = await Promise.all([
      api('/proctored-exams'),
      api('/proctored-exams/reports/institution'),
    ]);
    const candidates = examId ? await api(`/proctored-exams/${examId}/candidates`) : { candidates: [] };
    setData({ exams: exams.exams, reports, candidates: candidates.candidates });
  }

  useEffect(() => {
    load().catch((error) => setStatus(error.message));
  }, []);

  async function createExam() {
    await api('/proctored-exams', {
      method: 'POST',
      body: {
        ...form,
        studentIds: form.studentIds.split(',').map((value) => value.trim()).filter(Boolean),
      },
    });
    setForm(initialForm);
    setStatus('Proctored exam created.');
    await load();
  }

  async function releaseResults(examId) {
    await api(`/proctored-exams/${examId}/release-results`, { method: 'POST' });
    setStatus('Results released.');
    await load(examId);
  }

  async function viewCandidates(examId) {
    setSelectedExam(examId);
    await load(examId);
  }

  if (!data) return <Loading label="Loading proctored exams..." />;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Institutional proctored exams</h1>
          <div className="sub">Manage CATs, mid-semester exams, and finals without replacing existing assessments.</div>
        </div>
      </div>

      {status && <div className="ok-note">{status}</div>}

      <div className="card">
        <h2>Create exam</h2>
        <div className="form-grid">
          <div className="field"><label>Title</label><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></div>
          <div className="field"><label>Type</label><select value={form.examType} onChange={(event) => setForm({ ...form, examType: event.target.value })}><option value="CAT">CAT</option><option value="mid_semester">Mid-semester</option><option value="final_assessment">Final assessment</option></select></div>
          <div className="field"><label>Duration (minutes)</label><input type="number" value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: Number(event.target.value) })} /></div>
          <div className="field"><label>Question count</label><input type="number" value={form.questionCount} onChange={(event) => setForm({ ...form, questionCount: Number(event.target.value) })} /></div>
          <div className="field"><label>Passing score</label><input type="number" value={form.passingScore} onChange={(event) => setForm({ ...form, passingScore: Number(event.target.value) })} /></div>
          <div className="field"><label>Candidate student IDs</label><input value={form.studentIds} onChange={(event) => setForm({ ...form, studentIds: event.target.value })} /></div>
          <div className="field"><label>Starts at</label><input type="datetime-local" value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} /></div>
          <div className="field"><label>Ends at</label><input type="datetime-local" value={form.endsAt} onChange={(event) => setForm({ ...form, endsAt: event.target.value })} /></div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <label><input type="checkbox" checked={form.randomQuestions} onChange={(event) => setForm({ ...form, randomQuestions: event.target.checked })} /> Random questions</label>
          <label><input type="checkbox" checked={form.randomAnswerOrder} onChange={(event) => setForm({ ...form, randomAnswerOrder: event.target.checked })} /> Random answer order</label>
        </div>
        <button className="primary" style={{ marginTop: 14 }} onClick={createExam}>Create proctored exam</button>
      </div>

      <div className="card">
        <h2>Exam management</h2>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Candidates</th>
              <th>Attempts</th>
              <th>Average</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.exams.map((exam) => (
              <tr key={exam.exam_id}>
                <td>{exam.title}</td>
                <td>{exam.exam_type}</td>
                <td>{exam.candidate_count}</td>
                <td>{exam.attempt_count}</td>
                <td>{exam.average_score}</td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <button className="ghost" onClick={() => viewCandidates(exam.exam_id)}>View candidates</button>
                  <button className="ghost" onClick={() => releaseResults(exam.exam_id)}>Release results</button>
                </td>
              </tr>
            ))}
            {data.exams.length === 0 && <tr><td colSpan="6" style={{ color: 'var(--ink-soft)' }}>No proctored exams yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Proctor view</h2>
        {selectedExam ? (
          <table>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Status</th>
                <th>Started</th>
                <th>Submitted</th>
                <th>Suspicious events</th>
              </tr>
            </thead>
            <tbody>
              {data.candidates.map((candidate) => (
                <tr key={candidate.attempt_id || candidate.student_id}>
                  <td>{candidate.full_name}</td>
                  <td>{candidate.status}</td>
                  <td>{candidate.started_at ? new Date(candidate.started_at).toLocaleString('en-KE') : '—'}</td>
                  <td>{candidate.submitted_at ? new Date(candidate.submitted_at).toLocaleString('en-KE') : '—'}</td>
                  <td>{candidate.suspicious_events}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div className="sub">Select an exam to monitor active candidates.</div>}
      </div>

      <div className="card">
        <h2>Reports</h2>
        <div className="stats-grid">
          <div className="stat-card"><strong>{data.reports.analytics.total_exams}</strong><span>Total exams</span></div>
          <div className="stat-card"><strong>{data.reports.analytics.scheduled_exams}</strong><span>Scheduled</span></div>
        </div>
      </div>
    </>
  );
}
