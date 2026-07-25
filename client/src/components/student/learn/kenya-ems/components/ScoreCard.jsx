// Post-submission score + clinical feedback panel: ✅ passed / 🔓 next case
// unlocked, or ❌ incomplete with room to retry.
export default function ScoreCard({ result }) {
  if (!result) return null;
  const { percentage, passed, earnedPoints, totalPoints, attemptNumber, strengths = [], improvements = [], nextCaseUnlocked } = result;

  return (
    <section className={`kems-card kems-score-card ${passed ? 'kems-score-pass' : 'kems-score-fail'}`}>
      <div className="kems-score-headline">
        <span className="kems-score-icon" aria-hidden="true">{passed ? '✅' : '❌'}</span>
        <div>
          <div className="kems-score-label">Case Score</div>
          <div className="kems-score-value">{percentage}%</div>
        </div>
        <div className="kems-score-status">
          <div className="kems-score-status-label">Status</div>
          <div className={`kems-score-status-value ${passed ? 'pass' : 'fail'}`}>
            {passed ? 'PASSED' : 'CASE INCOMPLETE'}
          </div>
        </div>
      </div>

      <div className="kems-score-meta">
        <span>{earnedPoints} / {totalPoints} points earned</span>
        <span>Attempt #{attemptNumber}</span>
      </div>

      <div className="kems-score-clinical">
        <h3>🧠 Clinical Feedback</h3>
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
          <span className="kems-card-icon" aria-hidden="true">🔓</span>
          Case {nextCaseUnlocked.order_number} unlocked: {nextCaseUnlocked.title}
        </div>
      )}
      {!passed && (
        <div className="kems-score-retry">
          <span className="kems-card-icon" aria-hidden="true">🔒</span>
          Retry this case to reach the {result.passingScore}% pass mark and unlock the next one.
        </div>
      )}
    </section>
  );
}
