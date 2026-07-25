import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../../../services/api';
import Loading from '../../../shared/Loading';
import CaseDashboard from './components/CaseDashboard';
import CaseCard from './components/CaseCard';
import ScoreCard from './components/ScoreCard';
import { kenyaEmsCaseRegistry, findCaseEntry } from './casesRegistry';

// Learn -> Kenya EMS Dashboard -> Case Library. Fetches progress/unlock state
// from the existing /cases API; all worksheet content is hard-coded per-case
// (see ./cases/CaseN.jsx) and never fetched from a database or JSON file.
function KenyaEmsDashboard() {
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
    <section className="kems-page">
      <CaseDashboard cases={cases} subscription={subscription} />

      <div className="kems-case-grid">
        {cases.map((studyCase, index) => {
          const entry = findCaseEntry(studyCase.order_number);
          const locked = studyCase.status === 'locked';
          const completed = studyCase.status === 'completed';
          const previous = cases[index - 1];
          return (
            <CaseCard
              key={studyCase.id}
              meta={entry?.meta}
              progress={studyCase}
              locked={locked}
              completed={completed}
              previousLabel={previous?.order_number ?? studyCase.order_number - 1}
              onOpen={() => navigate(`/student/kenya-ems-cases/${studyCase.id}`)}
            />
          );
        })}
      </div>
    </section>
  );
}

// Case runner: fetches progress + hydrates the hard-coded case component for
// this order_number, autosaves responses, and submits for grading -- all
// through the same /cases API the backend progress/unlock system already uses.
function KenyaEmsCaseRunner() {
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

  const entry = progress ? findCaseEntry(progress.order_number) : null;

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
  if (!progress || !entry) return <Loading label="Loading Kenya EMS case..." />;

  const CaseComponent = entry.Component;

  if (result) {
    const scoreResult = {
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
      <section className="kems-page">
        <ScoreCard result={scoreResult} />
        <div className="kems-sticky-actions">
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
    <section className="kems-page">
      <CaseComponent
        responses={responses}
        saveState={saveState}
        onChangeResponse={(activityId, value) => {
          hydratedRef.current = true;
          setResponses((current) => ({ ...current, [activityId]: value }));
        }}
      />

      <div className="kems-sticky-actions">
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

export default function KenyaEmsLearnPage() {
  const { id } = useParams();
  return id ? <KenyaEmsCaseRunner /> : <KenyaEmsDashboard />;
}

export { kenyaEmsCaseRegistry };
