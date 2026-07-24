function valueForField(responseValue, fieldId) {
  if (responseValue == null) return '';
  if (typeof responseValue === 'string') return responseValue;
  return String(responseValue[fieldId] || '');
}

function HeadingBlock({ block }) {
  if (block.level === 1) return <h1 className="case-renderer-title">{block.text}</h1>;
  if (block.level === 2) return <h2 className="case-renderer-section">{block.text}</h2>;
  return <h3 className="case-renderer-subsection">{block.text}</h3>;
}

function ParagraphBlock({ block }) {
  return (
    <p className={`case-renderer-paragraph${block.variant === 'subtitle' ? ' subtitle' : ''}`}>
      {block.text}
    </p>
  );
}

function StatisticsTableBlock({ block }) {
  return (
    <div className="case-renderer-table-wrap">
      <table className="case-renderer-table">
        <thead>
          <tr>
            {(block.headers || []).map((header, index) => (
              <th key={`${block.id}-header-${index}`}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(block.rows || []).map((row, rowIndex) => (
            <tr key={`${block.id}-row-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td key={`${block.id}-cell-${rowIndex}-${cellIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InformationBox({ block }) {
  return <pre className="case-renderer-info">{block.text}</pre>;
}

function QuestionBlock({ block }) {
  return <pre className="case-renderer-question">{block.text}</pre>;
}

function InstructionBlock({ block }) {
  return <div className="case-renderer-instruction">{block.text}</div>;
}

function DispatchBlock({ block }) {
  return <div className="case-renderer-info">{block.text}</div>;
}

function ResponseTableBlock({ block, value, onChange }) {
  if (block.input_type === 'multiple_choice' && Array.isArray(block.options) && block.options.length > 0) {
    return (
      <div className="case-renderer-response">
        <div className="case-renderer-response-meta">
          <span>{block.grading?.points || 0} points</span>
        </div>
        <div className="case-renderer-options">
          {block.options.map((option) => {
            const optionKey = String(option.key || '').toUpperCase();
            return (
              <label key={`${block.id}-${optionKey}`} className="case-renderer-option">
                <input
                  type="radio"
                  name={block.activityId}
                  value={optionKey}
                  checked={String(value || '').toUpperCase() === optionKey}
                  onChange={(event) => onChange(block.activityId, event.target.value)}
                />
                <span>{optionKey}. {option.label}</span>
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  const fields = Array.isArray(block.fields) ? block.fields : [];
  return (
    <div className="case-renderer-response">
      <div className="case-renderer-response-meta">
        <span>{block.grading?.points || 0} points</span>
        {block.grading?.criteria ? <span>{block.grading.criteria}</span> : null}
      </div>
      <div className="case-renderer-field-grid">
        {fields.length > 0 ? fields.map((field) => (
          <label key={`${block.id}-${field.id}`} className="case-renderer-field">
            <span>{field.label}</span>
            <textarea
              rows={field.type === 'textarea' ? 5 : 3}
              value={valueForField(value, field.id)}
              onChange={(event) => onChange(block.activityId, {
                ...(typeof value === 'object' && value ? value : {}),
                [field.id]: event.target.value,
              })}
            />
          </label>
        )) : (
          <label className="case-renderer-field">
            <span>Your Response</span>
            <textarea
              rows={6}
              value={typeof value === 'string' ? value : ''}
              onChange={(event) => onChange(block.activityId, event.target.value)}
            />
          </label>
        )}
      </div>
    </div>
  );
}

function ReflectionBlock({ block, value, onChange }) {
  return (
    <div className="case-renderer-reflection">
      {Array.isArray(block.fields) && block.fields.length > 0 ? block.fields.map((field) => (
        <label key={`${block.id}-${field.id}`} className="case-renderer-field">
          <span>{field.label}</span>
          <textarea
            rows={5}
            value={valueForField(value, field.id)}
            onChange={(event) => onChange(block.activityId, {
              ...(typeof value === 'object' && value ? value : {}),
              [field.id]: event.target.value,
            })}
          />
        </label>
      )) : (
        <label className="case-renderer-field">
          <span>Reflection</span>
          <textarea
            rows={6}
            value={typeof value === 'string' ? value : ''}
            onChange={(event) => onChange(block.activityId, event.target.value)}
          />
        </label>
      )}
    </div>
  );
}

export default function CaseRenderer({ blocks = [], responses = {}, onChange }) {
  return (
    <article className="case-renderer-document">
      {blocks.map((block) => {
        if (block.type === 'heading') return <HeadingBlock key={block.id} block={block} />;
        if (block.type === 'paragraph') return <ParagraphBlock key={block.id} block={block} />;
        if (block.type === 'statistics_table') return <StatisticsTableBlock key={block.id} block={block} />;
        if (block.type === 'table') return <StatisticsTableBlock key={block.id} block={block} />;
        if (block.type === 'patient_table') return <StatisticsTableBlock key={block.id} block={block} />;
        if (block.type === 'information_box') return <InformationBox key={block.id} block={block} />;
        if (block.type === 'dispatch') return <DispatchBlock key={block.id} block={block} />;
        if (block.type === 'question_block' || block.type === 'question') return <QuestionBlock key={block.id} block={block} />;
        if (block.type === 'instruction_block') return <InstructionBlock key={block.id} block={block} />;
        if (block.type === 'reflection_block') {
          return (
            <ReflectionBlock
              key={block.id}
              block={block}
              value={responses[block.activityId]}
              onChange={onChange}
            />
          );
        }
        if (block.type === 'response_table' || block.type === 'response_field') {
          return (
            <ResponseTableBlock
              key={block.id}
              block={block}
              value={responses[block.activityId]}
              onChange={onChange}
            />
          );
        }
        return null;
      })}
    </article>
  );
}
