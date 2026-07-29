import { useMemo } from 'react';
import UiIcon from '../../shared/UiIcon';
import EMSSection from './EMSSection';
import { groupCaseSections, gradableActivityIds } from './groupSections';

function isAnswered(value) {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'object') {
    if (value.rows) {
      return Object.values(value.rows).some((row) => Object.values(row || {}).some((cell) => String(cell || '').trim().length > 0));
    }
    return Object.values(value).some((cell) => String(cell || '').trim().length > 0);
  }
  return false;
}

export default function EMSCaseContainer({ caseData, responses = {}, onChangeResponse, saveState }) {
  const nodes = useMemo(() => groupCaseSections(caseData?.sections || []), [caseData]);
  const gradableIds = useMemo(() => gradableActivityIds(caseData?.sections || []), [caseData]);
  const answeredCount = gradableIds.filter((id) => isAnswered(responses[id])).length;

  if (!caseData) return null;

  return (
    <article className="ems-case-container">
      <header className="ems-case-header">
        <div className="ems-case-header-kicker">
          <span className="ems-card-icon" aria-hidden="true"><UiIcon name="cases" /></span>
          Case {caseData.id}
        </div>
        <h1 className="ems-case-title">{caseData.title}</h1>
        <p className="ems-case-subtitle">
          {caseData.location}{caseData.incidentDate ? `, ${caseData.incidentDate}` : ''}
        </p>
        <div className="ems-case-meta-row">
          <span className="ems-meta-chip">{caseData.category}</span>
          <span className="ems-meta-chip">{caseData.difficulty}</span>
          <span className="ems-meta-chip">Pass mark: {caseData.passingScore}%</span>
          <span className="ems-meta-chip">Answered {answeredCount} of {gradableIds.length}</span>
          {saveState && <span className="ems-meta-chip">Save status: {saveState}</span>}
        </div>
      </header>

      <div className="ems-case-body">
        {nodes.map((node, index) => {
          if (node.type === 'qa') {
            const activityId = node.answer?.id;
            return (
              <EMSSection
                key={node.id || index}
                node={node}
                response={activityId ? responses[activityId] : undefined}
                onChange={(value) => activityId && onChangeResponse?.(activityId, value)}
              />
            );
          }
          return <EMSSection key={node.id || index} node={node} />;
        })}
      </div>
    </article>
  );
}
