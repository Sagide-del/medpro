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
  if (!cases) return <Loading label="Loading Kenya case studies..." />;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Kenya's Case Studies</h1>
          <div className="sub">Interactive EMS scenarios with case-by-case progression.</div>
        </div>
      </div>

      {subscription && !subscription.allowed && (
        <div className="alert info">
          Your subscription is {subscription.status}. Renew your plan to continue with Kenya case studies.
        </div>
      )}

      <div className="case-study-grid">
        {cases.map((item) => (
          <div key={item.id} className="card case-study-card">
            <div className="case-study-card-top">
              <div>
                <div className="case-study-order">Case {item.order_number}</div>
                <h2>{item.title}</h2>
              </div>
              <span className={`badge ${badgeForStatus(item.status)}`}>{labelForStatus(item.status)}</span>
            </div>

            <div className="case-study-meta">
              <span>{item.category}</span>
              <span>{item.location}</span>
              <span>{item.difficulty}</span>
            </div>

            <p className="case-study-description">{item.description}</p>

            <div className="case-study-progress-row">
              <div className="progress-bar">
                <div style={{ width: `${Math.max(0, Math.min(100, Number(item.score || 0)))}%` }} />
              </div>
              <strong>{item.score || 0}%</strong>
            </div>

            <div className="case-study-summary">
              <span>{item.total_points} Points</span>
              <span>Attempts: {item.attempt_count || 0}</span>
              <span>Best: {item.best_percentage != null ? `${item.best_percentage}%` : '--'}</span>
            </div>

            <button
              type="button"
              className={item.status === 'locked' ? 'ghost' : 'primary'}
              disabled={item.status === 'locked'}
              onClick={() => navigate(`/student/kenya-case-studies/${item.id}`)}
            >
              {item.status === 'completed' ? 'Review Case' : item.status === 'available' ? 'Continue Case' : 'Locked'}
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setBusy(true);
    api(`/case-studies/${id}`)
      .then((data) => setPayload(data))
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
        body: {
          answers,
        },
      });
      setResult(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (error) return <div className="alert">{error}</div>;
  if (busy && !payload) return <Loading label="Loading case study..." />;
  if (!payload) return <Loading label="Loading case study..." />;

  const { caseStudy, questions } = payload;

  if (result) {
    return (
      <>
        <div className="page-head">
          <div>
            <h1>{caseStudy.title}</h1>
            <div className="sub">Case result and guided feedback.</div>
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
            <span>{result.attempt.score} / {caseStudy.total_points} points</span>
            <span>80% required</span>
            <span>Attempt #{result.attempt.attempt_number}</span>
          </div>

          <div className="progress-bar">
            <div style={{ width: `${result.attempt.percentage}%` }} />
          </div>

          <div className="case-study-actions">
            <button type="button" className="ghost" onClick={() => navigate('/student/kenya-case-studies')}>
              Back to Library
            </button>
            {!result.attempt.passed && (
              <button type="button" className="primary" onClick={() => {
                setResult(null);
                setAnswers({});
              }}>
                Retry Case
              </button>
            )}
            {result.nextCaseUnlocked && (
              <button
                type="button"
                className="primary"
                onClick={() => navigate(`/student/kenya-case-studies/${result.nextCaseUnlocked.id}`)}
              >
                Start Next Case
              </button>
            )}
          </div>
        </div>

        <div className="case-review-stack">
          {result.review.map((item) => (
            <div key={item.questionId} className="card case-review-card">
              <div className="mcq-review-head">
                <h2>Question {item.questionNumber}</h2>
                <span className={`badge ${item.isCorrect ? 'approved' : 'rejected'}`}>
                  {item.isCorrect ? 'Correct' : 'Incorrect'}
                </span>
              </div>
              <p className="mcq-review-question">{item.questionText}</p>
              <div className="case-review-row"><strong>Your answer:</strong> {item.selectedAnswerText || 'No answer provided'}</div>
              <div className="case-review-row"><strong>Correct answer:</strong> {item.correctAnswerText}</div>
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
          <h1>{caseStudy.title}</h1>
          <div className="sub">{caseStudy.location} • {caseStudy.date} • {caseStudy.category}</div>
        </div>
      </div>

      <div className="case-study-layout">
        <div className="card case-study-overview-card">
          <div className="case-section-kicker">Case Introduction</div>
          <h2>Incident briefing</h2>
          <p className="case-study-description">{caseStudy.description}</p>

          <div className="case-study-brief-grid">
            <div>
              <div className="case-study-brief-label">Location</div>
              <strong>{caseStudy.location}</strong>
            </div>
            <div>
              <div className="case-study-brief-label">Date</div>
              <strong>{caseStudy.date}</strong>
            </div>
            <div>
              <div className="case-study-brief-label">Category</div>
              <strong>{caseStudy.category}</strong>
            </div>
            <div>
              <div className="case-study-brief-label">Pass mark</div>
              <strong>80%</strong>
            </div>
          </div>
        </div>

        <div className="card case-study-overview-card">
          <div className="case-section-kicker">Student Scenario</div>
          <h2>You are the responding EMT</h2>
          <p className="case-study-description">
            You are arriving as part of the first response team. Stabilize the scene, prioritise casualties,
            and make safe clinical decisions using EMT principles suited to the Kenyan emergency context.
          </p>

          <div className="case-study-summary">
            <span>{answeredCount}/{questions.length} answered</span>
            <span>{caseStudy.total_points} total points</span>
            <span className={`badge ${badgeForStatus(caseStudy.status)}`}>{labelForStatus(caseStudy.status)}</span>
          </div>
        </div>
      </div>

      <div className="case-review-stack">
        {questions.map((question, index) => (
          <div key={question.id} className="card case-question-card">
            <div className="mcq-review-head">
              <h2>Question {index + 1}</h2>
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
                  rows={4}
                  placeholder="Enter your scene decision or safety plan"
                  value={answers[question.id] || ''}
                  onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="case-study-actions">
        <button type="button" className="ghost" onClick={() => navigate('/student/kenya-case-studies')}>
          Back to Library
        </button>
        <button type="button" className="primary" onClick={submit} disabled={busy}>
          {busy ? 'Submitting...' : 'Submit Responses'}
        </button>
      </div>
    </>
  );
}

export default function KenyaCaseStudies() {
  const { id } = useParams();
  return id ? <CaseSession /> : <CaseLibrary />;
}
