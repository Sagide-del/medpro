import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

const CLINICAL_STEPS = ['recognize_cues', 'analyze_cues', 'prioritize_hypotheses', 'generate_solutions', 'take_action', 'evaluate_outcomes'];
const BLOOM_LEVELS = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];

export default function CreateAssessment() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    type: 'quiz', title: '', description: '', category: '', difficulty: 'intermediate',
    bloomLevel: 'remember', timeLimitMinutes: 20, passingScorePct: 70,
  });
  const [questions, setQuestions] = useState([{ questionType: 'mcq', prompt: '', options: '', correctAnswer: '', points: 5, clinicalStep: '' }]);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const isScenario = form.type === 'scenario';

  function addQuestion() {
    setQuestions((qs) => [...qs, { questionType: isScenario ? 'scenario_step' : 'mcq', prompt: '', options: '', correctAnswer: '', points: 5, clinicalStep: '' }]);
  }
  function updateQuestion(i, field, value) {
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, [field]: value } : q)));
  }
  function removeQuestion(i) {
    setQuestions((qs) => qs.filter((_, idx) => idx !== i));
  }

  async function create(publish) {
    setBusy(true); setStatus(null);
    try {
      const payload = {
        ...form,
        clinicalJudgmentSteps: isScenario ? CLINICAL_STEPS : [],
        questions: questions.map((q) => ({
          ...q,
          options: q.options ? q.options.split(',').map((o) => o.trim()).filter(Boolean) : undefined,
        })),
      };
      const { assessment } = await api('/assessments', { method: 'POST', body: payload });
      if (publish) await api(`/assessments/${assessment.assessment_id}/publish`, { method: 'PATCH' });
      setStatus({ kind: 'ok', text: `"${form.title}" ${publish ? 'created and published' : 'saved as draft'}.` });
      setTimeout(() => navigate('/teacher'), 1200);
    } catch (e) {
      setStatus({ kind: 'err', text: e.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-head"><div><h1>Create assessment</h1><div className="sub">Quiz, exam, or Clinical Judgment scenario</div></div></div>

      <div className="card">
        <h2>Details</h2>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="type">Type</label>
            <select id="type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="quiz">Quiz</option>
              <option value="exam">Exam</option>
              <option value="scenario">Clinical judgment scenario</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="title">Title</label>
            <input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="category">Category</label>
            <input id="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Cardiology" />
          </div>
          <div className="field">
            <label htmlFor="difficulty">Difficulty</label>
            <select id="difficulty" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="bloom">Bloom's level</label>
            <select id="bloom" value={form.bloomLevel} onChange={(e) => setForm({ ...form, bloomLevel: e.target.value })}>
              {BLOOM_LEVELS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="time">Time limit (minutes)</label>
            <input id="time" type="number" value={form.timeLimitMinutes} onChange={(e) => setForm({ ...form, timeLimitMinutes: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="pass">Passing score (%)</label>
            <input id="pass" type="number" value={form.passingScorePct} onChange={(e) => setForm({ ...form, passingScorePct: e.target.value })} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="desc">Description</label>
          <textarea id="desc" rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
      </div>

      {questions.map((q, i) => (
        <div className="card" key={i}>
          <h2>Question {i + 1}</h2>
          <div className="form-grid">
            {isScenario ? (
              <div className="field">
                <label>Clinical judgment step</label>
                <select value={q.clinicalStep} onChange={(e) => updateQuestion(i, 'clinicalStep', e.target.value)}>
                  <option value="">Select a step</option>
                  {CLINICAL_STEPS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
            ) : (
              <div className="field">
                <label>Question type</label>
                <select value={q.questionType} onChange={(e) => updateQuestion(i, 'questionType', e.target.value)}>
                  <option value="mcq">Multiple choice</option>
                  <option value="short_answer">Short answer</option>
                  <option value="fill_blank">Fill in the blank</option>
                </select>
              </div>
            )}
            <div className="field">
              <label>Points</label>
              <input type="number" value={q.points} onChange={(e) => updateQuestion(i, 'points', Number(e.target.value))} />
            </div>
          </div>
          <div className="field">
            <label>Prompt</label>
            <textarea rows="2" value={q.prompt} onChange={(e) => updateQuestion(i, 'prompt', e.target.value)} />
          </div>
          {q.questionType === 'mcq' && (
            <div className="field">
              <label>Options (comma separated)</label>
              <input value={q.options} onChange={(e) => updateQuestion(i, 'options', e.target.value)} />
            </div>
          )}
          <div className="field">
            <label>Correct / model answer</label>
            <input value={q.correctAnswer} onChange={(e) => updateQuestion(i, 'correctAnswer', e.target.value)} />
          </div>
          {questions.length > 1 && <button className="ghost" onClick={() => removeQuestion(i)}>Remove question</button>}
        </div>
      ))}

      <button className="ghost" onClick={addQuestion}>+ Add question</button>
      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        <button className="primary" onClick={() => create(true)} disabled={busy || !form.title}>
          {busy ? 'Saving…' : 'Create and publish'}
        </button>
        <button className="ghost" onClick={() => create(false)} disabled={busy || !form.title}>Save as draft</button>
      </div>
      {status && <div className={status.kind === 'ok' ? 'ok-note' : 'error-note'}>{status.text}</div>}
    </>
  );
}
