import UiIcon from '../../../../shared/UiIcon';
import VitalSignsTable from './VitalSignsTable';
import ResponseBox from './ResponseBox';

const RESPONSE_MARKER = 'Your Response: (fill in)';

function promptOnly(text) {
  const raw = String(text || '');
  const markerIndex = raw.indexOf(RESPONSE_MARKER);
  return (markerIndex === -1 ? raw : raw.slice(0, markerIndex)).trim();
}

function iconForPhase(phase) {
  const label = String(phase || '').toLowerCase();
  if (label.includes('safety') || label.includes('dispatch')) return 'alert';
  if (label.includes('reflection') || label.includes('reasoning')) return 'activity';
  if (label.includes('assessment') || label.includes('triage')) return 'cases';
  return 'question';
}

export default function QuestionCard({ question, answer, value, onChange }) {
  if (!question) return null;
  const prompt = promptOnly(question.text);
  const points = answer?.points;

  return (
    <section className="kems-card kems-card-question" aria-label="Clinical reasoning question">
      <div className="kems-card-head">
        <span className="kems-card-icon" aria-hidden="true"><UiIcon name={iconForPhase(question.phase)} /></span>
        <span className="kems-card-label">{question.phase || 'Clinical reasoning'}</span>
      </div>
      {question.title && <h3 className="kems-question-title">{question.title}</h3>}
      <div className="kems-question-prompt">
        {prompt.split(/\r?\n/).map((line, index) => (
          <p key={index} className={line.trim() ? 'kems-prompt-line' : 'kems-prompt-line kems-prompt-blank'}>
            {line || ' '}
          </p>
        ))}
      </div>

      <div className="kems-student-decision-label">
        <UiIcon name="response" /> Student decision
      </div>
      {answer?.type === 'response' && answer.table ? (
        <VitalSignsTable table={answer.table} value={value} onChange={onChange} points={points} />
      ) : (
        <ResponseBox
          fields={answer?.fields || []}
          value={value}
          onChange={onChange}
          points={points}
          reflection={answer?.type === 'reflection'}
        />
      )}
    </section>
  );
}
