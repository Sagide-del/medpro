import { useMemo } from 'react';
import ScenarioHeader from './components/ScenarioHeader';
import IncidentBriefing from './components/IncidentBriefing';
import DispatchPanel from './components/DispatchPanel';
import PatientAssessmentTable from './components/PatientAssessmentTable';
import QuestionCard from './components/QuestionCard';
import { groupCaseSections, gradableActivityIds, isAnswered } from './groupSections';

// Shared premium rendering shell reused by every Case1..Case15 component.
// Each case component hardcodes its own worksheet content and hands it to
// CaseRunner, which reproduces the original EMT worksheet flow end to end:
// scenario briefing -> dispatch -> safety questions -> patient assessment ->
// vitals/triage entry -> treatment decisions -> reflection.
export default function CaseRunner({ caseData, responses = {}, onChangeResponse, saveState }) {
  const nodes = useMemo(() => groupCaseSections(caseData?.sections || []), [caseData]);
  const gradableIds = useMemo(() => gradableActivityIds(caseData?.sections || []), [caseData]);
  const answeredCount = gradableIds.filter((id) => isAnswered(responses[id])).length;

  if (!caseData) return null;

  return (
    <article className="kems-case-runner">
      <ScenarioHeader
        caseData={caseData}
        answeredCount={answeredCount}
        totalGradable={gradableIds.length}
        saveState={saveState}
      />

      <div className="kems-case-body">
        {nodes.map((node, index) => {
          if (node.type === 'heading' || node.type === 'paragraph') {
            return <IncidentBriefing key={node.id || index} node={node} />;
          }
          if (node.type === 'dispatch') {
            return <DispatchPanel key={node.id || index} text={node.text} />;
          }
          if (node.type === 'table') {
            return <PatientAssessmentTable key={node.id || index} headers={node.headers} rows={node.rows} />;
          }
          if (node.type === 'qa') {
            const activityId = node.answer?.id;
            return (
              <QuestionCard
                key={node.id || index}
                question={node.question}
                answer={node.answer}
                value={activityId ? responses[activityId] : undefined}
                onChange={(value) => activityId && onChangeResponse?.(activityId, value)}
              />
            );
          }
          return null;
        })}
      </div>
    </article>
  );
}
