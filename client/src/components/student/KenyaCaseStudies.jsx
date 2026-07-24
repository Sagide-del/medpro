import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import Loading from '../shared/Loading';

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
          <div className="sub">Real Kenyan emergency scenarios organised into guided clinical learning phases.</div>
        </div>
      </div>

      {subscription && !subscription.allowed && (
        <div className="alert info">
          Your subscription is {subscription.status}. Renew your plan to continue with Kenya EMS Cases.
        </div>
      )}

      <div className="case-study-grid">
        {cases.map((item) => (
          <div key={item.id} className="card case-study-card">
            <div className="case-study-card-top">
              <div>
                <div className="case-study-order">Case {item.order_number}</div>
                <h2>{formatCaseTitle(item.title)}</h2>
              </div>
              <span className={`badge ${badgeForStatus(item.status)}`}>{labelForStatus(item.status)}</span>
            </div>

            <div className="case-study-location">{item.location} | {item.incident_date}</div>

            <div className="case-study-meta case-study-meta-block">
              <span>Category: {item.category}</span>
              <span>Difficulty: {item.difficulty}</span>
            </div>

            <div className="case-study-competencies">
              {(item.competencies || []).map((competency) => (
                <span key={`${item.id}-${competency}`}>{competency}</span>
              ))}
            </div>

            <p className="case-study-description">{item.description}</p>

            <div className="case-study-progress-row">
              <div className="progress-bar">
                <div style={{ width: `${Math.max(0, Math.min(100, Number(item.score || 0)))}%` }} />
              </div>
              <strong>{item.score || 0}%</strong>
            </div>

            <div className="case-study-summary">
              <span>{item.total_points} points</span>
              <span>Pass mark: {item.passing_percentage}%</span>
              <span>Attempts: {item.attempt_count || 0}</span>
            </div>

            <button
              type="button"
              className={item.status === 'locked' ? 'ghost' : 'primary'}
              disabled={item.status === 'locked'}
              onClick={() => navigate(`/student/kenya-ems-cases/${item.id}`)}
            >
              {item.status === 'completed' ? 'Review Case' : 'Start Case'}
            </button>
          </div>
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
  const [activePhase, setActivePhase] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setBusy(true);
    api(`/case-studies/${id}`)
      .then((data) => {
        setPayload(data);
        setActivePhase(0);
      })
      .catch((err) => setError(err.message))
      .finally(() => setBusy(false));
  }, [id]);

  const answeredCount = useMemo(
    () => Object.values(answers).filter((value) => String(value || '').trim().length > 0).length,
    [answers]
  );

  async function submit() {
    setBusy(true);
    setError('');
    try {
      const response = await api(`/case-studies/${id}/submit`, {
        method: 'POST',
        body: { answers },
      });
      setResult(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (error) return <div className="alert">{error}</div>;
  if (busy && !payload) return <Loading label="Loading Kenya EMS case..." />;
  if (!payload) return <Loading label="Loading Kenya EMS case..." />;

  const { caseStudy, phases } = payload;
  const currentPhase = phases[activePhase] || phases[0];
  const totalQuestions = phases.reduce((sum, phase) => sum + phase.questions.length, 0);

  if (result) {
    return (
      <>
        <div className="page-head">
          <div>
            <h1>{formatCaseTitle(caseStudy.title)}</h1>
            <div className="sub">Case result, competency feedback, and next-step guidance.</div>
          </div>
        </div>

        <div className="card case-study-result-card">
          <div className="mcq-result-top">
            <div>
              <div className="mcq-score-label">Score</div>
              <div className="mcq-score-value">{result.attempt.percentage}%</div>
            </div>
            <span className={`badge ${result.attempt.passed ? 'approved' : 'rejected'}`}>
              {result.attempt.passed ? 'Passed' : 'Retry Required'}
            </span>
          </div>

          <div className="case-study-summary">
            <span>{result.attempt.score} points earned</span>
            <span>Pass mark: {result.caseStudy.passing_percentage}%</span>
            <span>Attempt #{result.attempt.attempt_number}</span>
          </div>

          <div className="progress-bar">
            <div style={{ width: `${result.attempt.percentage}%` }} />
          </div>

          <div className="case-study-feedback-grid">
            <div className="card case-study-feedback-card">
              <h2>Strengths</h2>
              <ul className="objective-list">
                {(result.strengths || []).length > 0
                  ? result.strengths.map((item) => <li key={item}>{item}</li>)
                  : <li>Build stronger phase-by-phase reasoning on retry.</li>}
              </ul>
            </div>
            <div className="card case-study-feedback-card">
              <h2>Recommended Review</h2>
              <ul className="objective-list">
                {(result.missedCompetencies || []).length > 0
                  ? result.missedCompetencies.map((item) => <li key={item}>{item}</li>)
                  : <li>Maintain your current EMS case competencies.</li>}
              </ul>
            </div>
          </div>

          <div className="case-study-actions">
            <button type="button" className="ghost" onClick={() => navigate('/student/kenya-ems-cases')}>
              Back to Library
            </button>
            {!result.attempt.passed && (
              <button
                type="button"
                className="primary"
                onClick={() => {
                  setResult(null);
                  setAnswers({});
                  setActivePhase(0);
                }}
              >
                Retry Case
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
            <div key={item.questionId} className="card case-review-card">
              <div className="mcq-review-head">
                <div>
                  <div className="case-section-kicker">{item.phase}</div>
                  <h2>Question {item.questionNumber}</h2>
                </div>
                <span className={`badge ${item.isCorrect ? 'approved' : 'rejected'}`}>
                  {item.isCorrect ? 'Correct' : 'Needs Review'}
                </span>
              </div>
              <p className="mcq-review-question">{item.questionText}</p>
              <div className="case-review-row"><strong>Your answer:</strong> {item.selectedAnswerText || 'No answer provided'}</div>
              <div className="case-review-row"><strong>Expected focus:</strong> {item.correctAnswerText}</div>
              <div className="case-review-row"><strong>Points:</strong> {item.earnedPoints} / {item.points}</div>
              <div className="case-review-row"><strong>Feedback:</strong> {item.explanation}</div>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{formatCaseTitle(caseStudy.title)}</h1>
          <div className="sub">{caseStudy.location} | {caseStudy.incident_date} | {caseStudy.category}</div>
        </div>
      </div>

      <div className="case-shell">
        <aside className="card case-phase-sidebar">
          <div className="case-section-kicker">Case Navigation</div>
          <h2>Learning Phases</h2>
          <div className="case-phase-list">
            {phases.map((phase, index) => (
              <button
                key={`${phase.phase}-${index}`}
                type="button"
                className={`case-phase-link ${index === activePhase ? 'active' : ''}`}
                onClick={() => setActivePhase(index)}
              >
                <span>{phase.phase}</span>
                <small>{phase.questions.length} prompts</small>
              </button>
            ))}
          </div>
        </aside>

        <section className="case-main-panel">
          <div className="card case-study-overview-card">
            <div className="case-section-kicker">Case Briefing</div>
            <h2>Incident overview</h2>
            <div className="case-study-location">{caseStudy.location} | {caseStudy.incident_date}</div>
            <p className="case-study-description">{caseStudy.description}</p>
            <div className="case-study-competencies">
              {(caseStudy.competencies || []).map((competency) => (
                <span key={`${caseStudy.id}-${competency}`}>{competency}</span>
              ))}
            </div>
          </div>

          <div className="card case-study-overview-card">
            <div className="case-section-kicker">{currentPhase.phase}</div>
            <h2>{currentPhase.phase === 'Reflection' ? 'Reflection' : 'Scenario content'}</h2>
            <pre className="case-phase-body">{currentPhase.content}</pre>
          </div>

          <div className="case-review-stack">
            {currentPhase.questions.map((question, index) => (
              <div key={question.id} className="card case-question-card">
                <div className="mcq-review-head">
                  <h2>Prompt {index + 1}</h2>
                  <span className="badge draft">{question.points} pts</span>
                </div>
                <p className="mcq-review-question">{question.question}</p>

                {question.question_type === 'multiple_choice' ? (
                  <div className="mcq-option-list">
                    {question.options.map((option) => (
                      <label key={`${question.id}-${option.key}`} className={`mcq-option ${answers[question.id] === option.key ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name={question.id}
                          value={option.key}
                          checked={answers[question.id] === option.key}
                          onChange={() => setAnswers((current) => ({ ...current, [question.id]: option.key }))}
                        />
                        <span>{option.key}. {option.label}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="field" style={{ marginBottom: 0 }}>
                    <textarea
                      rows={6}
                      placeholder="Enter your EMS decision-making response"
                      value={answers[question.id] || ''}
                      onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <aside className="card case-progress-panel">
          <div className="case-section-kicker">Progress & Scoring</div>
          <h2>Case status</h2>
          <div className="case-progress-stat">
            <span>Status</span>
            <strong className={`badge ${badgeForStatus(caseStudy.status)}`}>{labelForStatus(caseStudy.status)}</strong>
          </div>
          <div className="case-progress-stat">
            <span>Answered</span>
            <strong>{answeredCount} / {totalQuestions}</strong>
          </div>
          <div className="case-progress-stat">
            <span>Pass mark</span>
            <strong>{caseStudy.passing_percentage}%</strong>
          </div>
          <div className="case-progress-stat">
            <span>Total points</span>
            <strong>{caseStudy.total_points}</strong>
          </div>
          <div className="case-progress-stat">
            <span>Current score</span>
            <strong>{caseStudy.score || 0}%</strong>
          </div>

          <div className="progress-bar case-progress-bar">
            <div style={{ width: `${Math.max(0, Math.min(100, Number(caseStudy.score || 0)))}%` }} />
          </div>

          <div className="case-study-actions case-study-actions-stack">
            <button type="button" className="ghost" onClick={() => navigate('/student/kenya-ems-cases')}>
              Back to Library
            </button>
            {activePhase > 0 && (
              <button type="button" className="ghost" onClick={() => setActivePhase((current) => current - 1)}>
                Previous Phase
              </button>
            )}
            {activePhase < phases.length - 1 ? (
              <button type="button" className="primary" onClick={() => setActivePhase((current) => current + 1)}>
                Next Phase
              </button>
            ) : (
              <button type="button" className="primary" onClick={submit} disabled={busy}>
                {busy ? 'Submitting...' : 'Submit Case'}
              </button>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}

export default function KenyaEmsCases() {
  const { id } = useParams();
  return id ? <CaseSession /> : <CaseLibrary />;
}
