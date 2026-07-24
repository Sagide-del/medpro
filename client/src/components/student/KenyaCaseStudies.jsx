import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import Loading from '../shared/Loading';
import CaseQuestionBlock from './CaseQuestionBlock';
import CaseResponseForm from './CaseResponseForm';
import CaseScenarioBlock from './CaseScenarioBlock';
import CaseTableActivity from './CaseTableActivity';

function badgeForStatus(status) {
  if (status === 'completed') return 'completed';
  if (status === 'available') return 'approved';
  return 'draft';
}

function labelForStatus(status) {
  if (status === 'completed') return 'Completed';
  if (status === 'available') return 'Available';
  return 'Locked';
}

function formatCaseTitle(title) {
  return String(title || '').toUpperCase();
}

function countAnswered(answers, scoredActivities) {
  return scoredActivities.filter((activity) => {
    const value = answers[activity.id];
    if (!value) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (value.rows) return Object.values(value.rows).some((row) => Object.values(row || {}).some((cell) => String(cell || '').trim().length > 0));
    return Object.values(value).some((item) => String(item || '').trim().length > 0);
  }).length;
}

function buildActivityKind(activity, phase) {
  if (activity.type === 'scenario_block') {
    if (String(phase || '').toLowerCase().includes('dispatch')) return 'dispatch_block';
    return 'scenario_block';
  }
  if (activity.type === 'triage_table') return 'triage_table';
  if (activity.type === 'reflection') return 'reflection_block';
  if (activity.type === 'multiple_choice') return 'question_block';
  return 'response_form';
}

function renderActivity(activity, answerValue, setAnswers, patientTables = []) {
  const kind = buildActivityKind(activity, activity.phase);

  if (kind === 'scenario_block' || kind === 'dispatch_block') {
    return <CaseScenarioBlock activity={activity} patientTables={patientTables} kind={kind} />;
  }

  if (kind === 'triage_table') {
    return (
      <CaseTableActivity
        activity={activity}
        value={answerValue || { rows: {} }}
        onChange={(nextValue) => setAnswers((current) => ({ ...current, [activity.id]: nextValue }))}
      />
    );
  }

  if (kind === 'reflection_block' && activity.fields?.length) {
    return (
      <CaseResponseForm
        activity={activity}
        value={answerValue || {}}
        onChange={(fieldId, fieldValue) => setAnswers((current) => ({
          ...current,
          [activity.id]: {
            ...(current[activity.id] || {}),
            [fieldId]: fieldValue,
          },
        }))}
      />
    );
  }

  if (kind === 'question_block' || kind === 'reflection_block') {
    return (
      <CaseQuestionBlock
        activity={activity}
        value={answerValue || ''}
        onChange={(nextValue) => setAnswers((current) => ({ ...current, [activity.id]: nextValue }))}
      />
    );
  }

  return (
    <CaseResponseForm
      activity={activity}
      value={answerValue || {}}
      onChange={(fieldId, fieldValue) => setAnswers((current) => ({
        ...current,
        [activity.id]: {
          ...(current[activity.id] || {}),
          [fieldId]: fieldValue,
        },
      }))}
    />
  );
}

function CaseLibrary() {
  const navigate = useNavigate();
  const [cases, setCases] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/case-studies')
      .then((data) => {
        setCases(data.cases || []);
        setSubscription(data.subscription || null);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!cases) return <Loading label="Loading Kenya EMS Cases..." />;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Kenya EMS Cases</h1>
          <div className="sub">Digital EMT practical worksheets based on real Kenyan emergency incidents.</div>
        </div>
      </div>

      {subscription && !subscription.allowed && (
        <div className="alert info">
          Your subscription is {subscription.status}. Renew your plan to continue with Kenya EMS Cases.
        </div>
      )}

      <div className="case-library-sheet">
        {cases.map((item) => (
          <article key={item.id} className="case-library-row">
            <div className="case-library-main">
              <div className="case-study-order">Case {item.order_number}</div>
              <h2>{formatCaseTitle(item.title)}</h2>
              <div className="case-study-location">{item.location} | {item.incident_date}</div>
              <p className="case-study-description">{item.description}</p>
            </div>

            <div className="case-library-meta">
              <div className="case-library-meta-line">
                <span>Status</span>
                <strong className={`badge ${badgeForStatus(item.status)}`}>{labelForStatus(item.status)}</strong>
              </div>
              <div className="case-library-meta-line">
                <span>Pass mark</span>
                <strong>{item.passing_percentage}%</strong>
              </div>
              <div className="case-library-meta-line">
                <span>Best score</span>
                <strong>{item.score || 0}%</strong>
              </div>
              <button
                type="button"
                className={item.status === 'locked' ? 'ghost' : 'primary'}
                disabled={item.status === 'locked'}
                onClick={() => navigate(`/student/kenya-ems-cases/${item.id}`)}
              >
                {item.status === 'completed' ? 'Open Worksheet' : 'Start Worksheet'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function CaseSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payload, setPayload] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saveState, setSaveState] = useState('saved');
  const draftKey = `medpro_case_draft_${id}`;

  useEffect(() => {
    setBusy(true);
    api(`/case-studies/${id}`)
      .then((data) => {
        setPayload(data);
        setResult(null);
        try {
          const savedDraft = window.sessionStorage.getItem(draftKey);
          setAnswers(savedDraft ? JSON.parse(savedDraft) : {});
        } catch {
          setAnswers({});
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setBusy(false));
  }, [draftKey, id]);

  useEffect(() => {
    if (!payload) return;
    setSaveState('unsaved');
  }, [answers, payload]);

  const phases = payload?.phases || [];
  const caseStudy = payload?.caseStudy;
  const patientTables = caseStudy?.content?.patient_information?.tables || [];
  const scoredActivities = useMemo(
    () => (payload?.activities || []).filter((activity) => Number(activity.points || 0) > 0),
    [payload]
  );
  const answeredCount = useMemo(() => countAnswered(answers, scoredActivities), [answers, scoredActivities]);

  function saveDraft() {
    try {
      window.sessionStorage.setItem(draftKey, JSON.stringify(answers));
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  }

  async function submit() {
    setBusy(true);
    setError('');
    try {
      const response = await api(`/case-studies/${id}/submit`, {
        method: 'POST',
        body: { answers },
      });
      setResult(response);
      window.sessionStorage.removeItem(draftKey);
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
      <>
        <div className="page-head">
          <div>
            <h1>{formatCaseTitle(caseStudy.title)}</h1>
            <div className="sub">Submitted worksheet result.</div>
          </div>
        </div>

        <section className="case-document-shell">
          <div className="case-result-sheet">
            <div className="case-result-top">
              <div>
                <div className="case-result-label">Score</div>
                <div className="mcq-score-value">{result.attempt.percentage}%</div>
              </div>
              <div className={`case-result-status ${result.attempt.passed ? 'passed' : 'retry'}`}>
                {result.attempt.passed ? 'Passed' : 'Retry Required'}
              </div>
            </div>

            <div className="case-document-meta">
              <span>{result.attempt.score} points earned</span>
              <span>Pass mark: {result.caseStudy.passing_percentage}%</span>
              <span>Attempt #{result.attempt.attempt_number}</span>
            </div>

            <div className="progress-bar">
              <div style={{ width: `${result.attempt.percentage}%` }} />
            </div>

            <div className="case-result-actions">
              <button type="button" className="ghost" onClick={() => navigate('/student/kenya-ems-cases')}>
                Back to Case Library
              </button>
              {!result.attempt.passed && (
                <button
                  type="button"
                  className="primary"
                  onClick={() => {
                    setResult(null);
                    setAnswers({});
                  }}
                >
                  Retry Worksheet
                </button>
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
          </div>

          <div className="case-review-stack">
            {result.review.map((item) => (
              <section key={item.activityId} className="case-review-sheet">
                <div className="case-review-headline">
                  <div className="case-study-order">{item.phase}</div>
                  <h2>{item.title}</h2>
                </div>
                <div className="case-review-row"><strong>Your response:</strong> {item.selectedAnswerText || 'No answer provided'}</div>
                <div className="case-review-row"><strong>Expected focus:</strong> {item.expectedAnswerText || 'Review the worksheet criteria.'}</div>
                <div className="case-review-row"><strong>Points:</strong> {item.earnedPoints} / {item.points}</div>
                <div className="case-review-row"><strong>Feedback:</strong> {item.explanation}</div>
              </section>
            ))}
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Kenya EMS Cases</h1>
          <div className="sub">Clinical worksheet mode</div>
        </div>
      </div>

      <section className="case-document-shell">
        <article className="case-document">
          <header className="case-document-header">
            <div className="case-study-order">Case Study {caseStudy.order_number}</div>
            <h1>{formatCaseTitle(caseStudy.title)}</h1>
            <div className="case-document-location">{caseStudy.location}, {caseStudy.incident_date}</div>
            <div className="case-document-meta">
              <span>Case pass mark: {caseStudy.passing_percentage}%</span>
              <span>Total scored activities: {scoredActivities.length}</span>
              <span>Answered: {answeredCount}</span>
            </div>
          </header>

          {phases.map((phase, phaseIndex) => (
            <section key={`${phase.phase}-${phaseIndex}`} className="case-phase-section" id={`phase-${phaseIndex + 1}`}>
              <div className="case-phase-heading">{phase.phase}</div>
              {(phase.activities || []).map((activity, activityIndex) => {
                const isFirstInteractive = activity.type !== 'scenario_block'
                  && phase.activities.findIndex((item) => item.type !== 'scenario_block') === activityIndex;

                return (
                <div key={activity.id}>
                  {isFirstInteractive && (
                    <div className="case-action-banner">STUDENT ACTION REQUIRED</div>
                  )}
                  {renderActivity(
                    activity,
                    answers[activity.id],
                    setAnswers,
                    activity.type === 'scenario_block' && String(activity.phase).includes('Part 2') ? patientTables : []
                  )}
                </div>
              )})}
            </section>
          ))}
        </article>

        <aside className="case-document-sidebar">
          <div className="case-sidebar-block">
            <div className="case-section-kicker">Worksheet Progress</div>
            <div className="case-sidebar-line"><span>Status</span><strong>{labelForStatus(caseStudy.status)}</strong></div>
            <div className="case-sidebar-line"><span>Pass mark</span><strong>{caseStudy.passing_percentage}%</strong></div>
            <div className="case-sidebar-line"><span>Answered</span><strong>{answeredCount} / {scoredActivities.length}</strong></div>
            <div className="case-sidebar-line"><span>Draft</span><strong>{saveState === 'saved' ? 'Saved' : saveState === 'error' ? 'Error' : 'Unsaved'}</strong></div>
          </div>

          <div className="case-sidebar-block">
            <div className="case-section-kicker">Worksheet Sections</div>
            <div className="case-toc-list">
              {phases.map((phase, index) => (
                <a key={`${phase.phase}-${index}`} href={`#phase-${index + 1}`} className="case-toc-link">
                  {phase.phase}
                </a>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <div className="case-sticky-actions">
        <button type="button" className="ghost" onClick={() => navigate('/student/kenya-ems-cases')}>
          Back
        </button>
        <button type="button" className="ghost" onClick={saveDraft}>
          Save Progress
        </button>
        <button type="button" className="primary" onClick={submit} disabled={busy}>
          {busy ? 'Submitting...' : 'Submit Case'}
        </button>
      </div>
    </>
  );
}

export default function KenyaEmsCases() {
  const { id } = useParams();
  return id ? <CaseSession /> : <CaseLibrary />;
}
