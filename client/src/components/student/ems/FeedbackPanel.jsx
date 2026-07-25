// Post-submission score + clinical feedback panel: ✅ passed / 🔓 next case
// unlocked, or ❌ incomplete with room to retry.
export default function FeedbackPanel({ result }) {
  if (!result) return null;
  const { percentage, passed, earnedPoints, totalPoints, attemptNumber, strengths = [], improvements = [], nextCaseUnlocked } = result;

  return (
    <section className={`ems-card ems-feedback-panel ${passed ? 'ems-feedback-pass' : 'ems-feedback-fail'}`}>
      <div className="ems-feedback-headline">
        <span className="ems-feedback-icon" aria-hidden="true">{passed ? '✅' : '❌'}</span>
        <div>
          <div className="ems-feedback-score-label">Case Score</div>
          <div className="ems-feedback-score">{percentage}%</div>
        </div>
        <div className="ems-feedback-status">
          <div className="ems-feedback-status-label">Status</div>
          <div className={`ems-feedback-status-value ${passed ? 'pass' : 'fail'}`}>
            {passed ? 'PASSED' : 'CASE INCOMPLETE'}
          </div>
        </div>
      </div>

      <div className="ems-feedback-meta">
        <span>{earnedPoints} / {totalPoints} points earned</span>
        <span>Attempt #{attemptNumber}</span>
      </div>

      <div className="ems-feedback-clinical">
        <h3>🧠 Clinical Feedback</h3>
        {strengths.length > 0 && (
          <div className="ems-feedback-block">
            <div className="ems-feedback-block-label">Strengths</div>
            <ul>
              {strengths.map((item, index) => <li key={`strength-${index}`}>{item}</li>)}
            </ul>
          </div>
        )}
        {improvements.length > 0 && (
          <div className="ems-feedback-block">
            <div className="ems-feedback-block-label">Improve</div>
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
        <div className="ems-feedback-unlock">
          <span className="ems-card-icon" aria-hidden="true">🔓</span>
          Case {nextCaseUnlocked.order_number} unlocked: {nextCaseUnlocked.title}
        </div>
      )}
      {!passed && (
        <div className="ems-feedback-retry">
          <span className="ems-card-icon" aria-hidden="true">🔒</span>
          Retry this case to reach the {result.passingScore}% pass mark and unlock the next one.
        </div>
      )}
    </section>
  );
}
