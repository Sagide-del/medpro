import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { ASSIGNMENT_TYPES, DIFFICULTY_OPTIONS, MODULES_BY_PROGRAM, PROGRAM_OPTIONS } from '../assignment-workflow/catalog';
import Loading from '../shared/Loading';

const EMPTY_FORM = {
  title: '',
  program: 'EMT',
  module: 'EMS Foundations',
  topic: '',
  skill: '',
  difficulty: 'intermediate',
  questionType: 'Multiple Choice',
  numberOfQuestions: 5,
  timeLimitMinutes: 20,
  dueDate: '',
  groupId: '',
  instructions: '',
};

export default function AiAssignmentGenerator() {
  const [groups, setGroups] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [generated, setGenerated] = useState([]);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/assignment-workflow/teacher/groups').then((data) => setGroups(data.groups)).catch((err) => setStatus({ kind: 'err', text: err.message }));
  }, []);

  async function generate() {
    setBusy(true);
    setStatus(null);
    try {
      const response = await api('/assignment-workflow/teacher/ai-generate', { method: 'POST', body: form });
      setGenerated(response.questions);
      setStatus({ kind: 'ok', text: 'AI draft generated. Review before creating the assignment.' });
    } catch (err) {
      setStatus({ kind: 'err', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  function updateQuestion(index, field, value) {
    setGenerated((current) => current.map((question, questionIndex) => questionIndex === index ? { ...question, [field]: value } : question));
  }

  async function createAssignment() {
    setBusy(true);
    setStatus(null);
    try {
      await api('/assignment-workflow/teacher/assignments', {
        method: 'POST',
        body: {
          ...form,
          assignmentType: form.questionType,
          aiGenerated: true,
          questions: generated,
        },
      });
      setGenerated([]);
      setForm(EMPTY_FORM);
      setStatus({ kind: 'ok', text: 'AI-assisted assignment created after teacher review.' });
    } catch (err) {
      setStatus({ kind: 'err', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  if (!groups) return <Loading label="Loading AI assignment generator..." />;

  return (
    <>
      <div className="page-head"><div><h1>AI Assignment Generator</h1><div className="sub">Generate draft questions, review them, then create the final teacher-controlled assignment.</div></div></div>
      <div className="card">
        <div className="form-grid">
          <div className="field"><label>Assignment title</label><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></div>
          <div className="field"><label>Program</label><select value={form.program} onChange={(event) => setForm({ ...form, program: event.target.value, module: MODULES_BY_PROGRAM[event.target.value][0] })}>{PROGRAM_OPTIONS.map((program) => <option key={program}>{program}</option>)}</select></div>
          <div className="field"><label>Module</label><select value={form.module} onChange={(event) => setForm({ ...form, module: event.target.value })}>{MODULES_BY_PROGRAM[form.program].map((module) => <option key={module}>{module}</option>)}</select></div>
          <div className="field"><label>Topic</label><input value={form.topic} onChange={(event) => setForm({ ...form, topic: event.target.value })} /></div>
          <div className="field"><label>Skill</label><input value={form.skill} onChange={(event) => setForm({ ...form, skill: event.target.value })} /></div>
          <div className="field"><label>Difficulty</label><select value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value })}>{DIFFICULTY_OPTIONS.map((difficulty) => <option key={difficulty}>{difficulty}</option>)}</select></div>
          <div className="field"><label>Question type</label><select value={form.questionType} onChange={(event) => setForm({ ...form, questionType: event.target.value })}>{ASSIGNMENT_TYPES.map((type) => <option key={type}>{type}</option>)}</select></div>
          <div className="field"><label>Number of questions</label><input type="number" value={form.numberOfQuestions} onChange={(event) => setForm({ ...form, numberOfQuestions: event.target.value })} /></div>
          <div className="field"><label>Time limit (minutes)</label><input type="number" value={form.timeLimitMinutes} onChange={(event) => setForm({ ...form, timeLimitMinutes: event.target.value })} /></div>
          <div className="field"><label>Due date</label><input type="datetime-local" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} /></div>
          <div className="field"><label>Assigned class / group</label><select value={form.groupId} onChange={(event) => setForm({ ...form, groupId: event.target.value })}><option value="">Select a group</option>{groups.map((group) => <option key={group.group_id} value={group.group_id}>{group.name}</option>)}</select></div>
        </div>
        <div className="field"><label>Teacher instructions</label><textarea rows="2" value={form.instructions} onChange={(event) => setForm({ ...form, instructions: event.target.value })} /></div>
        <button className="primary" onClick={generate} disabled={busy || !form.topic || !form.skill || !form.groupId}>{busy ? 'Generating...' : 'Generate draft questions'}</button>
        {status && <div className={status.kind === 'ok' ? 'ok-note' : 'error-note'}>{status.text}</div>}
      </div>

      {generated.map((question, index) => (
        <div className="card" key={index}>
          <h2>Generated question {index + 1}</h2>
          <div className="field"><label>Prompt</label><textarea rows="2" value={question.prompt} onChange={(event) => updateQuestion(index, 'prompt', event.target.value)} /></div>
          {question.options && <div className="field"><label>Options</label><input value={question.options.join(', ')} onChange={(event) => updateQuestion(index, 'options', event.target.value.split(',').map((item) => item.trim()).filter(Boolean))} /></div>}
          <div className="field"><label>Correct answer</label><input value={question.correctAnswer} onChange={(event) => updateQuestion(index, 'correctAnswer', event.target.value)} /></div>
          <div className="field"><label>Explanation</label><textarea rows="2" value={question.explanation} onChange={(event) => updateQuestion(index, 'explanation', event.target.value)} /></div>
          <div className="field"><label>Learning objective</label><input value={question.learningObjective} onChange={(event) => updateQuestion(index, 'learningObjective', event.target.value)} /></div>
          <div className="field"><label>Marking guide</label><textarea rows="2" value={question.markingGuide} onChange={(event) => updateQuestion(index, 'markingGuide', event.target.value)} /></div>
          <button className="ghost danger" onClick={() => setGenerated((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Delete question</button>
        </div>
      ))}

      {generated.length > 0 && <button className="primary" onClick={createAssignment} disabled={busy || !form.title}>Create reviewed assignment</button>}
    </>
  );
}
