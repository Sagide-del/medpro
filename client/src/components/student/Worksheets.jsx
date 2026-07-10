import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { kes } from '../format';
import Loading from '../shared/Loading';

function WorksheetList() {
  const [worksheets, setWorksheets] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/worksheets').then((d) => setWorksheets(d.worksheets)).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!worksheets) return <Loading label="Loading worksheets…" />;

  return (
    <>
      <div className="page-head">
        <div><h1>Worksheets</h1><div className="sub">Ksh 10 each — 48 hour access after purchase</div></div>
      </div>
      <div className="form-grid">
        {worksheets.map((w) => (
          <Link key={w.worksheet_id} to={`/student/worksheets/${w.worksheet_id}`} style={{ textDecoration: 'none' }}>
            <div className="card">
              <h2>{w.title}</h2>
              <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 8 }}>{w.description}</p>
              <span className="badge draft">{w.category}</span>
              <div style={{ marginTop: 10, fontFamily: 'var(--font-mono)', color: 'var(--red)', fontWeight: 600 }}>{kes(w.price)}</div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

function WorksheetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [worksheet, setWorksheet] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [unlocked, setUnlocked] = useState(false);
  const [answers, setAnswers] = useState({});
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  function load() {
    api(`/worksheets/${id}`).then((d) => { setWorksheet(d.worksheet); setQuestions(d.questions); setUnlocked(d.unlocked); });
  }
  useEffect(load, [id]);

  async function purchase() {
    setBusy(true); setStatus('');
    try {
      const res = await api('/payments/purchase', { method: 'POST', body: { itemType: 'worksheet', itemId: id, phone } });
      setStatus(res.simulated ? 'Purchase simulated (dev mode) — access granted.' : 'Check your phone to complete the M-Pesa payment.');
      setTimeout(load, 1500);
    } catch (e) { setStatus(e.message); } finally { setBusy(false); }
  }

  async function submit() {
    setBusy(true);
    try {
      await api(`/worksheets/${id}/submit`, { method: 'POST', body: { answers: Object.entries(answers).map(([questionId, response]) => ({ questionId, response })) } });
      navigate('/student/worksheets');
    } catch (e) { setStatus(e.message); } finally { setBusy(false); }
  }

  if (!worksheet) return <Loading />;

  return (
    <>
      <div className="page-head"><h1>{worksheet.title}</h1></div>
      {!unlocked ? (
        <div className="card">
          <p style={{ marginBottom: 12 }}>{worksheet.description}</p>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="phone">M-Pesa phone number</label>
              <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XX XXX XXX" />
            </div>
          </div>
          <button className="primary" onClick={purchase} disabled={busy || !phone}>
            {busy ? 'Processing…' : `Unlock for ${kes(worksheet.price)}`}
          </button>
          {status && <div className="ok-note">{status}</div>}
        </div>
      ) : (
        <>
          {questions.map((q, i) => (
            <div className="card" key={q.question_id}>
              <h2>Question {i + 1}</h2>
              <p style={{ marginBottom: 10 }}>{q.prompt}</p>
              <textarea rows="2" value={answers[q.question_id] || ''} onChange={(e) => setAnswers((a) => ({ ...a, [q.question_id]: e.target.value }))} />
            </div>
          ))}
          <button className="primary" onClick={submit} disabled={busy}>{busy ? 'Submitting…' : 'Submit worksheet'}</button>
          {status && <div className="error-note">{status}</div>}
        </>
      )}
    </>
  );
}

export default function Worksheets() {
  const { id } = useParams();
  return id ? <WorksheetDetail /> : <WorksheetList />;
}
