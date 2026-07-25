import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { kenyaEmsCaseStudies } from '../../data/CaseStudyData';
import Loading from '../shared/Loading';
import EMSCaseContainer from './ems/EMSCaseContainer';
import FeedbackPanel from './ems/FeedbackPanel';

function findCaseData(orderNumber) {
  return kenyaEmsCaseStudies.find((c) => c.id === Number(orderNumber)) || null;
}

function CaseLibrary() {
  const navigate = useNavigate();
  const [cases, setCases] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/cases')
      .then((data) => {
        setCases(Array.isArray(data?.cases) ? data.cases : []);
        setSubscription(data?.subscription || null);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!cases) return <Loading label="Loading Kenya EMS case simulation..." />;

  return (
    <section className="ems-library-page">
      <header className="ems-library-header">
        <h1><span aria-hidden="true">🚑</span> Kenya EMS Case Simulation</h1>
        <p>15 real Kenya EMS worksheets, digitized case by case. Pass each case to unlock the next.</p>
      </header>

      {subscription && !subscription.allowed ? (
        <div className="alert info">Your subscription is {subscription.status}. Renew to continue with Kenya EMS Cases.</div>
      ) : null}

      <div className="ems-library-grid">
        {cases.map((studyCase, index) => {
          const caseData = findCaseData(studyCase.order_number);
          const locked = studyCase.status === 'locked';
          const completed = studyCase.status === 'completed';
          const previous = cases[index - 1];
          return (
            <button
              key={studyCase.id}
              type="button"
              className={`ems-library-card${locked ? ' locked' : ''}${completed ? ' completed' : ''}`}
              disabled={locked}
              onClick={() => navigate(`/student/kenya-ems-cases/${studyCase.id}`)}
            >
              <div className="ems-library-card-top">
                <span className="ems-lock-icon" aria-hidden="true">{locked ? '🔒' : completed ? '✅' : '🔓'}</span>
                <span className="ems-library-case-number">Case {studyCase.order_number}</span>
              </div>
              <h2>{caseData?.shortTitle || `Case ${studyCase.order_number}`}</h2>
              {!locked && <p className="ems-library-location">{caseData?.location} · {caseData?.incidentDate}</p>}
              {locked ? (
                <p className="ems-library-locked-hint">
                  Locked — complete Case {previous?.order_number ?? studyCase.order_number - 1} with {previous?.passing_percentage ?? 70}% to unlock.
                </p>
              ) : (
                <div className="ems-library-card-meta">
                  <span>{caseData?.category}</span>
                  <span>{caseData?.difficulty}</span>
                  <span>Best score: {studyCase.score || 0}%</span>
                </div>
              )}
              <div className="ems-library-card-action">
                {completed ? 'Review Case' : locked ? 'Locked' : 'Start Case'}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function CaseSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(null);
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
    setError('');
    hydratedRef.current = false;
    api(`/cases/${id}`)
      .then((data) => {
        setProgress(data.caseStudy);
        setResult(null);
        setResponses(data.responses || {});
        setSaveState('saved');
        skipAutosaveRef.current = true;
        hydratedRef.current = true;
      })
      .catch((err) => setError(err.message))
      .finally(() => setBusy(false));
  }, [id]);

  useEffect(() => {
    if (!progress || !hydratedRef.current) return undefined;
    if (skipAutosaveRef.current) {
      skipAutosaveRef.current = false;
      return undefined;
    }
    setSaveState('unsaved');

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await api(`/cases/${id}/progress`, { method: 'POST', body: { responses } });
        setSaveState('saved');
      } catch {
        setSaveState('error');
      }
    }, 900);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [id, progress, responses]);

  const caseData = progress ? findCaseData(progress.order_number) : null;

  async function submit() {
    setBusy(true);
    setError('');
    try {
      const response = await api(`/cases/${id}/submit`, { method: 'POST', body: { answers: responses } });
      setResult(response);
      setSaveState('saved');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (error) return <div className="alert">{error}</div>;
  if (busy && !progress) return <Loading label="Loading Kenya EMS case..." />;
  if (!progress || !caseData) return <Loading label="Loading Kenya EMS case..." />;

  if (result) {
    const feedbackResult = {
      percentage: result.attempt.percentage,
      passed: result.attempt.passed,
      earnedPoints: result.attempt.score,
      totalPoints: result.totalPoints,
      attemptNumber: result.attempt.attempt_number,
      strengths: result.strengths,
      improvements: result.improvements,
      nextCaseUnlocked: result.nextCaseUnlocked,
      passingScore: result.caseStudy.passing_percentage,
    };

    return (
      <section className="ems-case-simulation-page">
        <FeedbackPanel result={feedbackResult} />
        <div className="ems-sticky-actions">
          <button type="button" className="ghost" onClick={() => navigate('/student/kenya-ems-cases')}>Back to Case Library</button>
          {!result.attempt.passed && (
            <button type="button" className="primary" onClick={() => setResult(null)}>Retry Case</button>
          )}
          {result.nextCaseUnlocked && (
            <button
              type="button"
              className="primary"
              onClick={() => navigate(`/student/kenya-ems-cases/${result.nextCaseUnlocked.id}`)}
            >
              Open Next Case
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="ems-case-simulation-page">
      <EMSCaseContainer
        caseData={caseData}
        responses={responses}
        saveState={saveState}
        onChangeResponse={(activityId, value) => {
          hydratedRef.current = true;
          setResponses((current) => ({ ...current, [activityId]: value }));
        }}
      />

      <div className="ems-sticky-actions">
        <button type="button" className="ghost" onClick={() => navigate('/student/kenya-ems-cases')}>Back</button>
        <button
          type="button"
          className="ghost"
          onClick={async () => {
            setSaveState('saving');
            try {
              await api(`/cases/${id}/progress`, { method: 'POST', body: { responses } });
              setSaveState('saved');
            } catch {
              setSaveState('error');
            }
          }}
        >
          {saveState === 'saving' ? 'Saving...' : 'Save Progress'}
        </button>
        <button type="button" className="primary" onClick={submit} disabled={busy}>
          {busy ? 'Submitting...' : 'Submit Case'}
        </button>
      </div>
    </section>
  );
}

export default function EMSCaseSimulation() {
  const { id } = useParams();
  return id ? <CaseSession /> : <CaseLibrary />;
}
