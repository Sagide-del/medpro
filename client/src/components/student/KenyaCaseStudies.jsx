import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import Loading from '../shared/Loading';
import KenyaEMSWorksheet from './KenyaEMSWorksheet';

function formatCaseTitle(title) {
  return String(title || '').toUpperCase();
}

function labelForStatus(status) {
  if (status === 'completed') return 'Completed';
  if (status === 'available') return 'Available';
  return 'Locked';
}

function badgeClassForStatus(status) {
  if (status === 'completed') return 'completed';
  if (status === 'available') return 'approved';
  return 'draft';
}

function CaseLibrary() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/cases')
      .then((data) => {
        setCases(Array.isArray(data?.cases) ? data.cases : []);
        setSubscription(data?.subscription || null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading label="Loading Kenya EMS cases..." />;
  if (error) return <div className="alert">{error}</div>;

  return (
    <section className="case-library-page">
      <div className="case-library-sheet">
        <header className="case-library-header">
          <h1>Kenya EMS Cases</h1>
          <p>Interactive EMS clinical worksheets with scoring, progress saving, and case-by-case unlocking.</p>
        </header>

        {subscription && !subscription.allowed ? (
          <div className="alert info">Your subscription is {subscription.status}. Renew to continue with Kenya EMS Cases.</div>
        ) : null}

        <div className="case-card-grid">
          {cases.map((studyCase) => (
            <button
              key={studyCase.id}
              type="button"
              className="case-card"
              disabled={studyCase.status === 'locked'}
              onClick={() => navigate(`/student/kenya-ems-cases/${studyCase.id}`)}
            >
              <div className="case-card-top">
                <div className="case-study-order">Case {studyCase.order_number}</div>
                <span className={`badge ${badgeClassForStatus(studyCase.status)}`}>{labelForStatus(studyCase.status)}</span>
              </div>
              <h2>{formatCaseTitle(studyCase.title)}</h2>
              <p className="case-card-location">{studyCase.location} | {studyCase.incident_date}</p>
              <div className="case-card-meta">
                <span>Completion: {studyCase.completed ? 'Completed' : 'In progress'}</span>
                <span>Lock: {studyCase.status === 'locked' ? 'Locked' : 'Unlocked'}</span>
                <span>Best score: {studyCase.score || 0}%</span>
              </div>
              <div className="case-card-action">
                {studyCase.status === 'completed' ? 'Open Worksheet' : studyCase.status === 'locked' ? 'Locked' : 'Start Case'}
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function CaseSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payload, setPayload] = useState(null);
  const [responses, setResponses] = useState({});
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saveState, setSaveState] = useState('saved');
  const hydratedRef = useRef(false);
  const skipAutosaveRef = useRef(true);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    setBusy(true);
    hydratedRef.current = false;
    api(`/cases/${id}`)
      .then((data) => {
        setPayload(data);
        setResult(null);
        setResponses(data?.responses || {});
        setSaveState('saved');
        skipAutosaveRef.current = true;
        hydratedRef.current = true;
      })
      .catch((err) => setError(err.message))
      .finally(() => setBusy(false));
  }, [id]);

  useEffect(() => {
    if (!payload || !hydratedRef.current) return undefined;
    if (skipAutosaveRef.current) {
      skipAutosaveRef.current = false;
      return undefined;
    }
    setSaveState('unsaved');

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await api(`/cases/${id}/progress`, {
          method: 'POST',
          body: { responses },
        });
        setSaveState('saved');
      } catch {
        setSaveState('error');
      }
    }, 900);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [id, payload, responses]);

  const blocks = payload?.blocks || [];
  const caseStudy = payload?.caseStudy;

  async function saveNow() {
    setSaveState('saving');
    try {
      await api(`/cases/${id}/progress`, {
        method: 'POST',
        body: { responses },
      });
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  }

  async function submit() {
    setBusy(true);
    setError('');
    try {
      const response = await api(`/cases/${id}/submit`, {
        method: 'POST',
        body: { answers: responses },
      });
      setResult(response);
      setSaveState('saved');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (error) return <div className="alert">{error}</div>;
  if (busy && !payload) return <Loading label="Loading Kenya EMS case..." />;
  if (!payload || !caseStudy) return <Loading label="Loading Kenya EMS case..." />;

  if (result) {
    return (
      <section className="case-worksheet-page">
        <div className="case-worksheet-sheet">
          <header className="case-result-sheet-simple">
            <h1>{formatCaseTitle(result.caseStudy.title)}</h1>
            <div className="case-result-summary-line">
              <span>Score: {result.attempt.percentage}%</span>
              <span>{result.attempt.score} points earned</span>
              <span>Attempt #{result.attempt.attempt_number}</span>
              <span>{result.attempt.passed ? 'Passed' : 'Retry Required'}</span>
            </div>
          </header>

          <div className="case-review-stack-simple">
            {result.review.map((item) => (
              <section key={item.activityId} className="case-review-sheet-simple">
                <h2>{item.phase} - {item.title}</h2>
                <p><strong>Your response:</strong> {item.selectedAnswerText || 'No answer provided'}</p>
                <p><strong>Expected focus:</strong> {item.expectedAnswerText || 'Review the worksheet criteria.'}</p>
                <p><strong>Points:</strong> {item.earnedPoints} / {item.points}</p>
                <p><strong>Feedback:</strong> {item.explanation}</p>
              </section>
            ))}
          </div>
        </div>

        <div className="case-sticky-actions">
          <button type="button" className="ghost" onClick={() => navigate('/student/kenya-ems-cases')}>Back to Case Library</button>
          {!result.attempt.passed ? (
            <button
              type="button"
              className="primary"
              onClick={() => {
                setResult(null);
              }}
            >
              Retry Case
            </button>
          ) : null}
          {result.nextCaseUnlocked ? (
            <button
              type="button"
              className="primary"
              onClick={() => navigate(`/student/kenya-ems-cases/${result.nextCaseUnlocked.id}`)}
            >
              Open Next Case
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="case-worksheet-page">
      <div className="case-worksheet-sheet">
        <KenyaEMSWorksheet
          caseStudy={caseStudy}
          blocks={blocks}
          responses={responses}
          saveState={saveState}
          onChange={(activityId, nextValue) => {
            hydratedRef.current = true;
            setResponses((current) => ({
              ...current,
              [activityId]: nextValue,
            }));
          }}
        />
      </div>

      <div className="case-sticky-actions">
        <button type="button" className="ghost" onClick={() => navigate('/student/kenya-ems-cases')}>Back</button>
        <button type="button" className="ghost" onClick={saveNow}>{saveState === 'saving' ? 'Saving...' : 'Save Progress'}</button>
        <button type="button" className="primary" onClick={submit} disabled={busy}>{busy ? 'Submitting...' : 'Submit Case'}</button>
      </div>
    </section>
  );
}

export default function KenyaCaseStudies() {
  const { id } = useParams();
  return id ? <CaseSession /> : <CaseLibrary />;
}
