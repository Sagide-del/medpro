import {
  DispatchRenderer,
  IncidentBackgroundRenderer,
  PatientTableRenderer,
  ReflectionRenderer,
  StatisticsTableRenderer,
  StudentResponseRenderer,
  TriageRenderer,
} from './caseRenderers';

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

function InformationBox({ block }) {
  return <pre className="case-renderer-info">{block.text}</pre>;
}

function QuestionBlock({ block }) {
  return <pre className="case-renderer-question">{block.text}</pre>;
}

function InstructionBlock({ block }) {
  return <div className="case-renderer-instruction">{block.text}</div>;
}

export default function CaseRenderer({ blocks = [], responses = {}, onChange }) {
  return (
    <article className="case-renderer-document">
      {blocks.map((block) => {
        if (block.type === 'heading') return <HeadingBlock key={block.id} block={block} />;
        if (block.type === 'paragraph') return <ParagraphBlock key={block.id} block={block} />;
        if (block.type === 'statistics_table') return <StatisticsTableRenderer key={block.id} headers={block.headers} rows={block.rows} />;
        if (block.type === 'table') return <StatisticsTableRenderer key={block.id} headers={block.headers} rows={block.rows} />;
        if (block.type === 'patient_table') return <PatientTableRenderer key={block.id} headers={block.headers} rows={block.rows} />;
        if (block.type === 'information_box') return <InformationBox key={block.id} block={block} />;
        if (block.type === 'dispatch') return <DispatchRenderer key={block.id} text={block.text} />;
        if (block.type === 'question_block' || block.type === 'question') return <QuestionBlock key={block.id} block={block} />;
        if (block.type === 'instruction_block') return <InstructionBlock key={block.id} block={block} />;
        if (block.type === 'reflection_block' || block.type === 'reflection') {
          return <ReflectionRenderer key={block.id} block={block} value={responses[block.activityId]} onChange={onChange} />;
        }
        if (block.type === 'response_table' || block.type === 'response_field') {
          return <StudentResponseRenderer key={block.id} block={block} value={responses[block.activityId]} onChange={onChange} />;
        }
        if (block.type === 'triage_table') {
          return <TriageRenderer key={block.id} block={block} value={responses[block.activityId]} onChange={onChange} />;
        }
        if (block.type === 'incident_background') {
          return (
            <IncidentBackgroundRenderer
              key={block.id}
              title={block.title}
              locationLine={block.locationLine}
              background={block.text}
            />
          );
        }
        return null;
      })}
    </article>
  );
}
