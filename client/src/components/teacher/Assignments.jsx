import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { ASSIGNMENT_TYPES, DIFFICULTY_OPTIONS, MODULES_BY_PROGRAM, PROGRAM_OPTIONS, toQuestionType } from '../assignment-workflow/catalog';
import Loading from '../shared/Loading';

const EMPTY_FORM = {
  title: '',
  program: 'EMT',
  module: 'EMS Foundations',
  topic: '',
  skill: '',
  difficulty: 'intermediate',
  assignmentType: 'Multiple Choice',
  numberOfQuestions: 5,
  timeLimitMinutes: 20,
  dueDate: '',
  groupId: '',
  instructions: '',
};

function emptyQuestion(assignmentType) {
  return {
    questionType: toQuestionType(assignmentType),
    prompt: '',
    optionsText: '',
    correctAnswer: '',
    explanation: '',
    learningObjective: '',
    markingGuide: '',
    difficulty: 'intermediate',
    points: assignmentType === 'Multiple Choice' ? 5 : 8,
  };
}

export default function TeacherAssignments() {
  const [groups, setGroups] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [questions, setQuestions] = useState([emptyQuestion('Multiple Choice')]);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function loadAssignments() {
    api('/assignment-workflow/teacher/assignments').then((data) => setAssignments(data.assignments)).catch((err) => setError(err.message));
  }

  useEffect(() => {
    Promise.all([
      api('/assignment-workflow/teacher/groups').then((data) => setGroups(data.groups)),
      api('/assignment-workflow/teacher/assignments').then((data) => setAssignments(data.assignments)),
    ]).catch((err) => setError(err.message));
  }, []);

  function addQuestion() {
    setQuestions((current) => [...current, emptyQuestion(form.assignmentType)]);
  }

  function updateQuestion(index, field, value) {
    setQuestions((current) => current.map((question, questionIndex) => (
      questionIndex === index ? { ...question, [field]: value } : question
    )));
  }

  async function createAssignment() {
    setBusy(true);
    setStatus(null);
    try {
      await api('/assignment-workflow/teacher/assignments', {
        method: 'POST',
        body: {
          ...form,
          numberOfQuestions: Number(form.numberOfQuestions),
          timeLimitMinutes: Number(form.timeLimitMinutes),
          questions: questions.map((question) => ({
            questionType: question.questionType,
            prompt: question.prompt,
            options: question.optionsText ? question.optionsText.split(',').map((item) => item.trim()).filter(Boolean) : null,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            learningObjective: question.learningObjective,
            markingGuide: question.markingGuide,
            difficulty: question.difficulty,
            points: Number(question.points),
          })),
        },
      });
      setStatus({ kind: 'ok', text: 'Assignment created successfully.' });
      setForm(EMPTY_FORM);
      setQuestions([emptyQuestion('Multiple Choice')]);
      loadAssignments();
    } catch (err) {
      setStatus({ kind: 'err', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  if (error) return <div className="alert">{error}</div>;
  if (!groups) return <Loading label="Loading assignment workspace..." />;

  return (
    <>
      <div className="page-head"><div><h1>Assignments</h1><div className="sub">Create and assign teacher-controlled EMS coursework to your classes.</div></div></div>

      <div className="card">
        <h2>Create assignment</h2>
        <div className="form-grid">
          <div className="field"><label>Title</label><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></div>
          <div className="field"><label>Program</label>
            <select value={form.program} onChange={(event) => setForm({ ...form, program: event.target.value, module: MODULES_BY_PROGRAM[event.target.value][0] })}>
              {PROGRAM_OPTIONS.map((program) => <option key={program}>{program}</option>)}
            </select>
          </div>
          <div className="field"><label>Module</label>
            <select value={form.module} onChange={(event) => setForm({ ...form, module: event.target.value })}>
              {MODULES_BY_PROGRAM[form.program].map((module) => <option key={module}>{module}</option>)}
            </select>
          </div>
          <div className="field"><label>Topic</label><input value={form.topic} onChange={(event) => setForm({ ...form, topic: event.target.value })} /></div>
          <div className="field"><label>Skill</label><input value={form.skill} onChange={(event) => setForm({ ...form, skill: event.target.value })} /></div>
          <div className="field"><label>Difficulty</label>
            <select value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value })}>
              {DIFFICULTY_OPTIONS.map((difficulty) => <option key={difficulty}>{difficulty}</option>)}
            </select>
          </div>
          <div className="field"><label>Assignment type</label>
            <select
              value={form.assignmentType}
              onChange={(event) => {
                const assignmentType = event.target.value;
                setForm({ ...form, assignmentType });
                setQuestions((current) => current.map(() => emptyQuestion(assignmentType)));
              }}
            >
              {ASSIGNMENT_TYPES.map((type) => <option key={type}>{type}</option>)}
            </select>
          </div>
          <div className="field"><label>Number of questions</label><input type="number" value={form.numberOfQuestions} onChange={(event) => setForm({ ...form, numberOfQuestions: event.target.value })} /></div>
          <div className="field"><label>Time limit (minutes)</label><input type="number" value={form.timeLimitMinutes} onChange={(event) => setForm({ ...form, timeLimitMinutes: event.target.value })} /></div>
          <div className="field"><label>Due date</label><input type="datetime-local" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} /></div>
          <div className="field"><label>Assigned class / group</label>
            <select value={form.groupId} onChange={(event) => setForm({ ...form, groupId: event.target.value })}>
              <option value="">Select a group</option>
              {groups.map((group) => <option key={group.group_id} value={group.group_id}>{group.name} ({group.member_count} students)</option>)}
            </select>
          </div>
        </div>
        <div className="field"><label>Instructions</label><textarea rows="3" value={form.instructions} onChange={(event) => setForm({ ...form, instructions: event.target.value })} /></div>
      </div>

      {questions.map((question, index) => (
        <div className="card" key={index}>
          <h2>Question {index + 1}</h2>
          <div className="form-grid">
            <div className="field"><label>Points</label><input type="number" value={question.points} onChange={(event) => updateQuestion(index, 'points', event.target.value)} /></div>
            <div className="field"><label>Difficulty</label>
              <select value={question.difficulty} onChange={(event) => updateQuestion(index, 'difficulty', event.target.value)}>
                {DIFFICULTY_OPTIONS.map((difficulty) => <option key={difficulty}>{difficulty}</option>)}
              </select>
            </div>
          </div>
          <div className="field"><label>Prompt</label><textarea rows="2" value={question.prompt} onChange={(event) => updateQuestion(index, 'prompt', event.target.value)} /></div>
          {question.questionType === 'mcq' && <div className="field"><label>Answer options (comma separated)</label><input value={question.optionsText} onChange={(event) => updateQuestion(index, 'optionsText', event.target.value)} /></div>}
          <div className="field"><label>Correct answer</label><input value={question.correctAnswer} onChange={(event) => updateQuestion(index, 'correctAnswer', event.target.value)} /></div>
          <div className="field"><label>Explanation</label><textarea rows="2" value={question.explanation} onChange={(event) => updateQuestion(index, 'explanation', event.target.value)} /></div>
          <div className="field"><label>Learning objective</label><input value={question.learningObjective} onChange={(event) => updateQuestion(index, 'learningObjective', event.target.value)} /></div>
          <div className="field"><label>Marking guide</label><textarea rows="2" value={question.markingGuide} onChange={(event) => updateQuestion(index, 'markingGuide', event.target.value)} /></div>
        </div>
      ))}

      <button className="ghost" onClick={addQuestion}>+ Add question</button>
      <div style={{ marginTop: 14 }}>
        <button className="primary" onClick={createAssignment} disabled={busy || !form.title || !form.groupId || !form.topic || !form.skill}>
          {busy ? 'Creating...' : 'Create assignment'}
        </button>
      </div>
      {status && <div className={status.kind === 'ok' ? 'ok-note' : 'error-note'}>{status.text}</div>}

      <div className="card">
        <h2>Existing assignments</h2>
        <table>
          <thead><tr><th>Title</th><th>Group</th><th>Due date</th><th>Submissions</th><th>Status</th></tr></thead>
          <tbody>
            {assignments.map((assignment) => (
              <tr key={assignment.assignment_id}>
                <td>{assignment.title}</td>
                <td>{assignment.group_name}</td>
                <td className="num">{assignment.due_date ? new Date(assignment.due_date).toLocaleString('en-KE') : '-'}</td>
                <td className="num">{assignment.completed_count}/{assignment.submission_count}</td>
                <td><span className={`badge ${assignment.status}`}>{assignment.status}</span></td>
              </tr>
            ))}
            {assignments.length === 0 && <tr><td colSpan="5" style={{ color: 'var(--ink-soft)' }}>No assignments created yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
