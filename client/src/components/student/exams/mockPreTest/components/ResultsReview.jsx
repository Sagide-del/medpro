// Post-submission results: score / correct-count / performance tier, then a
// full per-question review (student answer, correct answer, explanation).
// This is the ONLY point in the flow where correctAnswer/explanation ever
// exist client-side -- they arrive already-revealed in the submit response.
function performanceClass(performance) {
  if (performance === 'Excellent') return 'excellent';
  if (performance === 'Good') return 'good';
  return 'needs-improvement';
}

export default function ResultsReview({ result, onRetake, onBackToDashboard }) {
  const { score, correctCount, totalCount, performance, review, module } = result;
  const tierClass = performanceClass(performance);
  const isPass = score >= 70;

  return (
    <section className="mpt-results">
      <div className={`card mpt-card mpt-score-card ${tierClass}`}>
        <div className="mpt-score-headline">
          <div>
            <div className="mpt-score-label">Score</div>
            <div className="mpt-score-value">{score}%</div>
          </div>
          <div>
            <div className="mpt-score-label">Correct</div>
            <div className="mpt-score-value mpt-score-value-sm">{correctCount}/{totalCount}</div>
          </div>
          <div className="mpt-performance-pill-wrap">
            <span className={`mpt-performance-pill ${tierClass}`}>{performance}</span>
          </div>
        </div>
        <div className="mpt-score-summary">
          {isPass ? 'Pass achieved.' : 'Review the missed items and retake when ready.'}
        </div>
        <div className="mpt-progress-track">
          <div className="mpt-progress-fill" style={{ width: `${score}%` }} />
        </div>
        <div className="mpt-score-actions">
          <button type="button" className="ghost" onClick={onBackToDashboard}>Back to modules</button>
          <button type="button" className="primary" onClick={() => onRetake(module)}>Retake topic</button>
        </div>
      </div>

      <h2 className="mpt-review-heading">Question Review</h2>
      <div className="mpt-review-stack">
        {review.map((item, index) => (
          <div key={item.questionId} className={`card mpt-card mpt-review-card${item.isCorrect ? ' correct' : ' incorrect'}`}>
            <div className="mpt-review-head">
              <span className="mpt-review-number">Question {index + 1}</span>
              <span className={`mpt-review-badge${item.isCorrect ? ' correct' : ' incorrect'}`}>
                {item.isCorrect ? 'Correct' : 'Needs review'}
              </span>
            </div>
            <p className="mpt-review-question">{item.question}</p>
            <div className="mpt-review-grid">
              <div className="mpt-review-row"><strong>Your answer</strong><span>{item.studentAnswer}</span></div>
              <div className="mpt-review-row"><strong>Correct answer</strong><span>{item.correctAnswer}</span></div>
            </div>
            <div className="mpt-review-explanation"><strong>Explanation</strong><span>{item.explanation}</span></div>
          </div>
        ))}
      </div>
    </section>
  );
}
