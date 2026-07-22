import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { ASSIGNMENT_TYPES, DIFFICULTY_OPTIONS, MODULES_BY_PROGRAM, PROGRAM_OPTIONS } from '../assignment-workflow/catalog';
import Loading from '../shared/Loading';

const EMPTY_FORM = {
  program: 'EMT',
  module: 'EMS Foundations',
  topic: '',
  skill: '',
  difficulty: 'intermediate',
  questionType: 'Multiple Choice',
  prompt: '',
  optionsText: '',
  correctAnswer: '',
  explanation: '',
  learningObjective: '',
  markingGuide: '',
};

export default function QuestionBank() {
  const [questions, setQuestions] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState(null);

  function load() {
    api('/assignment-workflow/teacher/question-bank')
      .then((data) => setQuestions(data.questions))
      .catch((err) => setStatus({ kind: 'err', text: err.message }));
  }

  useEffect(load, []);

  async function save() {
    setStatus(null);
    try {
      await api('/assignment-workflow/teacher/question-bank', {
        method: 'POST',
        body: {
          ...form,
          options: form.optionsText ? form.optionsText.split(',').map((item) => item.trim()).filter(Boolean) : null,
        },
      });
      setForm(EMPTY_FORM);
      setStatus({ kind: 'ok', text: 'Question added to the bank.' });
      load();
    } catch (err) {
      setStatus({ kind: 'err', text: err.message });
    }
  }

  if (!questions) return <Loading label="Loading question bank..." />;

  return (
    <>
      <div className="page-head"><div><h1>Question Bank</h1><div className="sub">Create and reuse institution-scoped assessment questions.</div></div></div>
      <div className="card">
        <h2>Add question</h2>
        <div className="form-grid">
          <div className="field"><label>Program</label><select value={form.program} onChange={(event) => setForm({ ...form, program: event.target.value, module: MODULES_BY_PROGRAM[event.target.value][0] })}>{PROGRAM_OPTIONS.map((program) => <option key={program}>{program}</option>)}</select></div>
          <div className="field"><label>Module</label><select value={form.module} onChange={(event) => setForm({ ...form, module: event.target.value })}>{MODULES_BY_PROGRAM[form.program].map((module) => <option key={module}>{module}</option>)}</select></div>
          <div className="field"><label>Topic</label><input value={form.topic} onChange={(event) => setForm({ ...form, topic: event.target.value })} /></div>
          <div className="field"><label>Skill</label><input value={form.skill} onChange={(event) => setForm({ ...form, skill: event.target.value })} /></div>
          <div className="field"><label>Difficulty</label><select value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value })}>{DIFFICULTY_OPTIONS.map((difficulty) => <option key={difficulty}>{difficulty}</option>)}</select></div>
          <div className="field"><label>Question type</label><select value={form.questionType} onChange={(event) => setForm({ ...form, questionType: event.target.value })}>{ASSIGNMENT_TYPES.map((type) => <option key={type}>{type}</option>)}</select></div>
        </div>
        <div className="field"><label>Question</label><textarea rows="2" value={form.prompt} onChange={(event) => setForm({ ...form, prompt: event.target.value })} /></div>
        {form.questionType === 'Multiple Choice' && <div className="field"><label>Options</label><input value={form.optionsText} onChange={(event) => setForm({ ...form, optionsText: event.target.value })} placeholder="Option A, Option B, Option C" /></div>}
        <div className="field"><label>Correct answer</label><input value={form.correctAnswer} onChange={(event) => setForm({ ...form, correctAnswer: event.target.value })} /></div>
        <div className="field"><label>Explanation</label><textarea rows="2" value={form.explanation} onChange={(event) => setForm({ ...form, explanation: event.target.value })} /></div>
        <div className="field"><label>Learning objective</label><input value={form.learningObjective} onChange={(event) => setForm({ ...form, learningObjective: event.target.value })} /></div>
        <div className="field"><label>Marking guide</label><textarea rows="2" value={form.markingGuide} onChange={(event) => setForm({ ...form, markingGuide: event.target.value })} /></div>
        <button className="primary" onClick={save} disabled={!form.prompt || !form.topic || !form.skill}>Save to question bank</button>
        {status && <div className={status.kind === 'ok' ? 'ok-note' : 'error-note'}>{status.text}</div>}
      </div>
      <div className="card">
        <h2>Saved questions</h2>
        <table>
          <thead><tr><th>Prompt</th><th>Program</th><th>Module</th><th>Type</th><th>Difficulty</th></tr></thead>
          <tbody>
            {questions.map((question) => (
              <tr key={question.bank_question_id}>
                <td>{question.prompt}</td>
                <td>{question.program}</td>
                <td>{question.module}</td>
                <td>{question.question_type}</td>
                <td>{question.difficulty}</td>
              </tr>
            ))}
            {questions.length === 0 && <tr><td colSpan="5" style={{ color: 'var(--ink-soft)' }}>No question-bank entries yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
