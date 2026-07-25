import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../../../services/api';
import Loading from '../../../shared/Loading';
import CaseDashboard from './components/CaseDashboard';
import CaseCard from './components/CaseCard';
import ScoreCard from './components/ScoreCard';
import { findCaseEntry } from './kenyaEmsRegistry';

// Learn -> Kenya EMS. This module never depends on the `case_studies` database
// table: all 15 cases are hard-coded React components (see ./cases/CaseN.jsx,
// registered in ./kenyaEmsRegistry.js) and are addressed by case NUMBER
// (1-15), never a database id/UUID. The only thing the server stores for this
// module is per-student progress -- case number, score, completion status --
// via the /api/kenya-ems endpoints (server/src/models/KenyaEmsProgress.js).

function KenyaEmsDashboard() {
  const navigate = useNavigate();
  const [cases, setCases] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/kenya-ems')
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
          const entry = findCaseEntry(studyCase.case_number);
          const locked = studyCase.status === 'locked';
          const completed = studyCase.status === 'completed';
          const previous = cases[index - 1];
          return (
            <CaseCard
              key={studyCase.case_number}
              meta={entry?.meta}
              progress={studyCase}
              locked={locked}
              completed={completed}
              previousLabel={previous?.case_number ?? studyCase.case_number - 1}
              onOpen={() => navigate(`/student/learn/kenya-ems/${studyCase.case_number}`)}
            />
          );
        })}
      </div>
    </section>
  );
}

// Case runner: loads lock/score status for this case NUMBER from the server
// (so a direct URL to a locked case is still blocked server-side), then
// hydrates the matching hard-coded Case component. Answers live only in
// local component state until Submit -- per the storage design, the server
// never persists in-progress responses, only the graded outcome.
function KenyaEmsCaseRunner() {
  const { caseNumber } = useParams();
  const navigate = useNavigate();
  const [caseStudy, setCaseStudy] = useState(null);
  const [responses, setResponses] = useState({});
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setBusy(true);
    setError('');
    setResult(null);
    setResponses({});
    api(`/kenya-ems/${caseNumber}`)
      .then((data) => setCaseStudy(data.caseStudy))
      .catch((err) => setError(err.message))
      .finally(() => setBusy(false));
  }, [caseNumber]);

  const entry = findCaseEntry(caseNumber);

  async function submit() {
    setBusy(true);
    setError('');
    try {
      const response = await api(`/kenya-ems/${caseNumber}/submit`, { method: 'POST', body: { answers: responses } });
      setResult(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (error) return <div className="alert">{error}</div>;
  if (busy && !caseStudy) return <Loading label="Loading Kenya EMS case..." />;
  if (!caseStudy || !entry) return <Loading label="Loading Kenya EMS case..." />;

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
      passingScore: result.passingScore,
    };

    return (
      <section className="kems-page">
        <ScoreCard result={scoreResult} />
        <div className="kems-sticky-actions">
          <button type="button" className="ghost" onClick={() => navigate('/student/learn/kenya-ems')}>Back to Case Library</button>
          {!result.attempt.passed && (
            <button type="button" className="primary" onClick={() => setResult(null)}>Retry Case</button>
          )}
          {result.nextCaseUnlocked && (
            <button
              type="button"
              className="primary"
              onClick={() => navigate(`/student/learn/kenya-ems/${result.nextCaseUnlocked.case_number}`)}
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
        onChangeResponse={(activityId, value) => {
          setResponses((current) => ({ ...current, [activityId]: value }));
        }}
      />

      <div className="kems-sticky-actions">
        <button type="button" className="ghost" onClick={() => navigate('/student/learn/kenya-ems')}>Back</button>
        <button type="button" className="primary" onClick={submit} disabled={busy}>
          {busy ? 'Submitting...' : 'Submit Case'}
        </button>
      </div>
    </section>
  );
}

export default function KenyaEmsLearnPage() {
  const { caseNumber } = useParams();
  return caseNumber ? <KenyaEmsCaseRunner /> : <KenyaEmsDashboard />;
}
