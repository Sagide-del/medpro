import UiIcon from '../../../../shared/UiIcon';

export default function ScoreCard({ result }) {
  if (!result) return null;
  const { percentage, passed, earnedPoints, totalPoints, attemptNumber, strengths = [], improvements = [], nextCaseUnlocked } = result;

  return (
    <section className={`kems-card kems-score-card ${passed ? 'kems-score-pass' : 'kems-score-fail'}`}>
      <div className="kems-score-headline">
        <span className="kems-score-icon" aria-hidden="true"><UiIcon name={passed ? 'result' : 'document'} /></span>
        <div>
          <div className="kems-score-headline-eyebrow">{passed ? 'Case completed' : 'Simulation review required'}</div>
          <div className="kems-score-title">{passed ? 'Case completed' : 'Simulation review required'}</div>
        </div>
        <div className="kems-score-status">
          <div className="kems-score-status-label">Score</div>
          <div className="kems-score-value">{percentage}%</div>
          <div className={`kems-score-status-value ${passed ? 'pass' : 'fail'}`}>
            {passed ? 'PASSED' : 'CASE INCOMPLETE'}
          </div>
        </div>
      </div>

      {passed && (
        <p className="kems-score-congrats">
          Congratulations{nextCaseUnlocked ? " -- you've passed this case!" : " -- you've passed every Kenya EMS case!"}
        </p>
      )}

      <div className="kems-score-meta">
        <span>{earnedPoints} / {totalPoints} points earned</span>
        <span>Attempt #{attemptNumber}</span>
      </div>

      <div className="kems-score-clinical">
        <h3>Clinical feedback</h3>
        {strengths.length > 0 && (
          <div className="kems-score-block">
            <div className="kems-score-block-label">Strengths</div>
            <ul>
              {strengths.map((item, index) => <li key={`strength-${index}`}>{item}</li>)}
            </ul>
          </div>
        )}
        {improvements.length > 0 && (
          <div className="kems-score-block">
            <div className="kems-score-block-label">Improve</div>
            <ul>
              {improvements.map((item, index) => <li key={`improve-${index}`}>{item}</li>)}
            </ul>
          </div>
        )}
        {strengths.length === 0 && improvements.length === 0 && (
          <p>No scored questions in this case -- reviewed as a reading case.</p>
        )}
      </div>

      {passed && nextCaseUnlocked && (
        <div className="kems-score-unlock">
          <UiIcon name="unlock" /> Next simulation unlocked: Case {nextCaseUnlocked.case_number} — {nextCaseUnlocked.title}
        </div>
      )}
      {!passed && (
        <div className="kems-score-retry">
          <UiIcon name="lock" /> Retry this simulation to reach the {result.passingScore}% pass mark and unlock the next case.
        </div>
      )}
    </section>
  );
}
