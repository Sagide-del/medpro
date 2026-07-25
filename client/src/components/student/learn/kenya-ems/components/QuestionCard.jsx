import VitalSignsTable from './VitalSignsTable';
import ResponseBox from './ResponseBox';

const RESPONSE_MARKER = 'Your Response: (fill in)';

// Strips the worksheet's trailing "Your Response: (fill in) / text / blanks"
// template from a question's prompt text -- the blanks themselves are already
// rendered as real inputs by VitalSignsTable/ResponseBox immediately below, so
// showing the template text again would just repeat the same blanks as text.
function promptOnly(text) {
  const raw = String(text || '');
  const markerIndex = raw.indexOf(RESPONSE_MARKER);
  return (markerIndex === -1 ? raw : raw.slice(0, markerIndex)).trim();
}

function iconForPhase(phase) {
  const label = String(phase || '').toLowerCase();
  if (label.includes('safety') || label.includes('dispatch')) return '⚠️';
  if (label.includes('reflection') || label.includes('reasoning')) return '🧠';
  if (label.includes('assessment') || label.includes('triage')) return '🩸';
  return '🧠';
}

export default function QuestionCard({ question, answer, value, onChange }) {
  if (!question) return null;
  const prompt = promptOnly(question.text);
  const points = answer?.points;

  return (
    <section className="kems-card kems-card-question" aria-label="Clinical reasoning question">
      <div className="kems-card-head">
        <span className="kems-card-icon" aria-hidden="true">{iconForPhase(question.phase)}</span>
        <span className="kems-card-label">{question.phase || 'Clinical Reasoning'}</span>
      </div>
      {question.title && <h3 className="kems-question-title">{question.title}</h3>}
      <div className="kems-question-prompt">
        {prompt.split(/\r?\n/).map((line, index) => (
          <p key={index} className={line.trim() ? 'kems-prompt-line' : 'kems-prompt-line kems-prompt-blank'}>
            {line || ' '}
          </p>
        ))}
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
