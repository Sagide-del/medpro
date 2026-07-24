import CaseRenderer from './CaseRenderer';

function countAnswered(responses, blocks) {
  return blocks.filter((block) => {
    if (!block.activityId) return false;
    const value = responses[block.activityId];
    if (value == null) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    return Object.values(value).some((item) => String(item || '').trim().length > 0);
  }).length;
}

export default function KenyaEMSWorksheet({
  caseStudy,
  blocks = [],
  responses = {},
  saveState = 'saved',
  onChange,
}) {
  const answeredCount = countAnswered(responses, blocks);

  return (
    <article className="case-renderer-document case-worksheet-document kenya-case-workbook">
      <header className="worksheet-header">
        <h1 className="worksheet-title">{String(caseStudy?.title || '').toUpperCase()}</h1>
        <p className="worksheet-subtitle">
          {caseStudy?.location ? `${caseStudy.location}${caseStudy.incident_date ? `, ${caseStudy.incident_date}` : ''}` : caseStudy?.incident_date || ''}
        </p>
        <div className="case-document-meta-row">
          <span>Case {caseStudy?.order_number || caseStudy?.case_number || 1}</span>
          <span>Answered {answeredCount} of {blocks.filter((block) => block.activityId).length} response sections</span>
          <span>Pass mark: {Number(caseStudy?.passing_percentage || 80)}%</span>
          <span>Save status: {saveState}</span>
        </div>
      </header>

      <CaseRenderer blocks={blocks} responses={responses} onChange={onChange} />
    </article>
  );
}
