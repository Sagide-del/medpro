import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import Loading from '../shared/Loading';

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

function flattenAnswerValue(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(flattenAnswerValue).join(' ');
  if (typeof value === 'object') return Object.values(value).map(flattenAnswerValue).join(' ');
  return String(value);
}

function countAnswered(answers, activities) {
  return activities.filter((activity) => flattenAnswerValue(answers[activity.id]).trim().length > 0).length;
}

function extractSourceText(caseStudy) {
  if (caseStudy?.content?.source_text) return String(caseStudy.content.source_text);
  const html = String(caseStudy?.content_html || '').trim();
  return html.replace(/<[^>]+>/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function isCaseTitle(line) {
  return /^CASE STUDY\s+\d+/i.test(line);
}

function isActionHeading(line) {
  return line.includes('STUDENT ACTION REQUIRED');
}

function isSectionHeading(line) {
  return /^(Incident Background|Incident Statistics:?|Part\s+\d+:|Patients observed:?|Patient observations:?|Dispatch Information|Scene Assessment|Evaluation Scoring|FINAL REFLECTION|FINAL CERTIFICATION CHECK|Scoring Summary|Learning Objectives)$/i.test(line);
}

function isTableLine(line) {
  return line.includes('\t');
}

function isQuestionLine(line) {
  return /^\d+\.\s/.test(line);
}

function isMajorBoundary(line) {
  return isCaseTitle(line)
    || isActionHeading(line)
    || isSectionHeading(line)
    || /^Passing Score:/i.test(line)
    || /^TOTAL\b/i.test(line)
    || /^ð/.test(line);
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseGeneratedFields(activity) {
  if (Array.isArray(activity?.fields) && activity.fields.length > 0) return activity.fields;

  const prompt = String(activity?.prompt || '');
  const markerIndex = prompt.indexOf('Your Response:');
  const responseText = markerIndex >= 0 ? prompt.slice(markerIndex) : prompt;
  const lines = responseText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const generated = [];

  lines.forEach((line, index) => {
    if (/^Your Response/i.test(line) || line.toLowerCase() === 'text') return;
    if (/^_+$/.test(line)) return;

    const underscoreMatch = line.match(/^(.+?):\s*_+$/);
    if (underscoreMatch) {
      const label = underscoreMatch[1].trim();
      generated.push({
        id: `generated-${index}`,
        label,
        type: 'textarea',
        placeholder: 'Enter your response',
      });
      return;
    }

    if (/^\d+\.\s/.test(line)) {
      generated.push({
        id: `generated-${index}`,
        label: line,
        type: 'textarea',
        placeholder: 'Enter your response',
      });
      return;
    }

    if (line.endsWith('?')) {
      generated.push({
        id: `generated-${index}`,
        label: line,
        type: 'textarea',
        placeholder: 'Enter your response',
      });
    }
  });

  return generated;
}

function renderResponseInputs(activity, value, setAnswers) {
  if (!activity) return null;

  if (activity.type === 'multiple_choice' && Array.isArray(activity.options) && activity.options.length > 0) {
    return (
      <div className="worksheet-response-group" key={activity.id}>
        {activity.options.map((option) => {
          const optionKey = String(option.key || '').toUpperCase();
          return (
            <label key={optionKey} className="worksheet-option-row">
              <input
                type="radio"
                name={`case-${activity.id}`}
                value={optionKey}
                checked={String(value || '').toUpperCase() === optionKey}
                onChange={(event) => setAnswers((current) => ({
                  ...current,
                  [activity.id]: event.target.value,
                }))}
              />
              <span>{optionKey}. {option.label}</span>
            </label>
          );
        })}
      </div>
    );
  }

  const fields = parseGeneratedFields(activity);
  if (fields.length === 0) {
    return (
      <div className="worksheet-response-group" key={activity.id}>
        <label className="worksheet-field-label">Your Response</label>
        <textarea
          className="worksheet-textarea"
          rows={6}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => setAnswers((current) => ({
            ...current,
            [activity.id]: event.target.value,
          }))}
        />
      </div>
    );
  }

  const responseValue = typeof value === 'object' && value ? value : {};
  return (
    <div className="worksheet-response-group" key={activity.id}>
      {fields.map((field) => (
        <label key={field.id} className="worksheet-field-row">
          <span className="worksheet-field-label">{field.label}</span>
          <textarea
            className="worksheet-textarea"
            rows={field.type === 'textarea' ? 4 : 2}
            value={String(responseValue[field.id] || '')}
            onChange={(event) => setAnswers((current) => ({
              ...current,
              [activity.id]: {
                ...(typeof current[activity.id] === 'object' && current[activity.id] ? current[activity.id] : {}),
                [field.id]: event.target.value,
              },
            }))}
          />
        </label>
      ))}
    </div>
  );
}

function renderWorksheetDocument(sourceText, activities, answers, setAnswers) {
  const lines = String(sourceText || '').split(/\r?\n/);
  const elements = [];
  let index = 0;
  let interactiveIndex = 0;
  let titleSeen = false;

  while (index < lines.length) {
    const rawLine = lines[index] || '';
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (isCaseTitle(trimmed)) {
      elements.push(<h1 key={`line-${index}`} className="worksheet-title">{trimmed}</h1>);
      titleSeen = true;
      index += 1;
      continue;
    }

    if (titleSeen && !isSectionHeading(trimmed) && !isActionHeading(trimmed) && !isQuestionLine(trimmed) && !isTableLine(trimmed)) {
      elements.push(<p key={`line-${index}`} className="worksheet-subtitle">{trimmed}</p>);
      titleSeen = false;
      index += 1;
      continue;
    }

    if (isActionHeading(trimmed)) {
      elements.push(<div key={`line-${index}`} className="worksheet-action-heading">{trimmed.replace(/^ð[^A-Z]*/i, '').trim()}</div>);
      index += 1;
      continue;
    }

    if (isSectionHeading(trimmed)) {
      elements.push(<h2 key={`line-${index}`} className="worksheet-section-heading">{trimmed}</h2>);
      index += 1;
      continue;
    }

    if (isTableLine(trimmed)) {
      const tableLines = [];
      while (index < lines.length && isTableLine(String(lines[index] || '').trim())) {
        tableLines.push(String(lines[index] || '').trim());
        index += 1;
      }
      const rows = tableLines.map((item) => item.split('\t').map((cell) => cell.trim()));
      const [header, ...body] = rows;
      elements.push(
        <div key={`table-${index}`} className="worksheet-table-wrap">
          <table className="worksheet-table">
            <thead>
              <tr>{header.map((cell, cellIndex) => <th key={`head-${cellIndex}`}>{cell}</th>)}</tr>
            </thead>
            <tbody>
              {body.map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`}>
                  {row.map((cell, cellIndex) => <td key={`cell-${rowIndex}-${cellIndex}`}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    if (/^Your Response:/i.test(trimmed)) {
      const activity = activities[interactiveIndex] || null;
      interactiveIndex += activity ? 1 : 0;
      elements.push(<p key={`line-${index}`} className="worksheet-response-marker">{trimmed}</p>);
      index += 1;
      if (String(lines[index] || '').trim().toLowerCase() === 'text') index += 1;

      while (index < lines.length) {
        const nextTrimmed = String(lines[index] || '').trim();
        if (!nextTrimmed) {
          index += 1;
          continue;
        }
        if (activity?.fields?.length) {
          if (isQuestionLine(nextTrimmed) || isMajorBoundary(nextTrimmed)) break;
          index += 1;
          continue;
        }
        if (isMajorBoundary(nextTrimmed)) break;
        index += 1;
      }

      elements.push(
        <div key={`response-${activity?.id || index}`} className="worksheet-response-shell">
          {renderResponseInputs(activity, answers[activity?.id], setAnswers)}
        </div>
      );
      continue;
    }

    if (/^Passing Score:/i.test(trimmed)) {
      elements.push(<div key={`line-${index}`} className="worksheet-score-line">{trimmed}</div>);
      index += 1;
      continue;
    }

    if (isQuestionLine(trimmed)) {
      elements.push(<h3 key={`line-${index}`} className="worksheet-question-heading">{trimmed}</h3>);
      index += 1;
      continue;
    }

    elements.push(<p key={`line-${index}`} className="worksheet-paragraph">{trimmed}</p>);
    index += 1;
  }

  return elements;
}

function CaseLibrary() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/case-studies')
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
          <p>Interactive EMT worksheets based on real Kenyan emergency incidents.</p>
        </header>

        <div className="case-library-list">
          {cases.map((studyCase) => (
            <article key={studyCase.id} className="case-library-row">
              <div className="case-library-main">
                <div className="case-study-order">Case Study {studyCase.order_number}</div>
                <h2>{formatCaseTitle(studyCase.title)}</h2>
                <p>{studyCase.location} | {studyCase.incident_date}</p>
              </div>
              <div className="case-library-side">
                <span className={`badge ${badgeClassForStatus(studyCase.status)}`}>{labelForStatus(studyCase.status)}</span>
                <span>Pass mark: {studyCase.passing_percentage}%</span>
                <span>Best score: {studyCase.score || 0}%</span>
                <button
                  type="button"
                  className="primary"
                  disabled={studyCase.status === 'locked'}
                  onClick={() => navigate(`/student/kenya-ems-cases/${studyCase.id}`)}
                >
                  {studyCase.status === 'completed' ? 'Open Worksheet' : 'Start Case'}
                </button>
              </div>
            </article>
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

  const caseStudy = payload?.caseStudy;
  const interactiveActivities = useMemo(
    () => (payload?.activities || []).filter((activity) => activity.type !== 'scenario_block' && Number(activity.points || 0) > 0),
    [payload]
  );
  const answeredCount = useMemo(() => countAnswered(answers, interactiveActivities), [answers, interactiveActivities]);
  const sourceText = useMemo(() => extractSourceText(caseStudy), [caseStudy]);

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

          <div className="case-sticky-actions">
            <button type="button" className="ghost" onClick={() => navigate('/student/kenya-ems-cases')}>Back to Case Library</button>
            {!result.attempt.passed && (
              <button
                type="button"
                className="primary"
                onClick={() => {
                  setResult(null);
                  setAnswers({});
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
      </section>
    );
  }

  return (
    <section className="case-worksheet-page">
      <div className="case-worksheet-sheet">
        <div className="case-document-meta-row">
          <span>Answered {answeredCount} of {interactiveActivities.length} worksheet sections</span>
          <span>Pass mark: {caseStudy.passing_percentage}%</span>
        </div>

        <article className="case-worksheet-document">
          {renderWorksheetDocument(sourceText, interactiveActivities, answers, setAnswers)}
        </article>
      </div>

      <div className="case-sticky-actions">
        <button type="button" className="ghost" onClick={() => navigate('/student/kenya-ems-cases')}>Back</button>
        <button type="button" className="ghost" onClick={saveDraft}>{saveState === 'saved' ? 'Progress Saved' : 'Save Progress'}</button>
        <button type="button" className="primary" onClick={submit} disabled={busy}>{busy ? 'Submitting...' : 'Submit Case'}</button>
      </div>
    </section>
  );
}

export default function KenyaCaseStudies() {
  const { id } = useParams();
  return id ? <CaseSession /> : <CaseLibrary />;
}


