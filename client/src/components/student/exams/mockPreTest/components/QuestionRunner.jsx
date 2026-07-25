// One-question-at-a-time runner: progress bar, question number, 4 answer
// options, and Previous/Next navigation. Never has access to the correct
// answer -- `questions` here are the sanitized set the server returned.
export default function QuestionRunner({
  questions,
  currentIndex,
  answers,
  onSelectAnswer,
  onNext,
  onPrevious,
  onJumpTo,
  onSubmit,
  submitting,
}) {
  const total = questions.length;
  const question = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progressPct = Math.round(((currentIndex + 1) / total) * 100);
  const isLast = currentIndex === total - 1;

  return (
    <section className="mpt-runner">
      <div className="mpt-runner-topbar">
        <div className="mpt-progress-track">
          <div className="mpt-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="mpt-runner-meta">
          <span className="mpt-question-count">Question {currentIndex + 1} of {total}</span>
          <span className="mpt-answered-count">{answeredCount}/{total} answered</span>
        </div>
      </div>

      <div className="card mpt-card mpt-question-card">
        <div className="mpt-question-topic">{question.topic}</div>
        <h2 className="mpt-question-text">{question.question}</h2>

        <div className="mpt-option-list">
          {question.options.map((option, index) => {
            const letter = String.fromCharCode(65 + index);
            const selected = answers[question.id] === option;
            return (
              <button
                type="button"
                key={`${question.id}-${index}`}
                className={`mpt-option${selected ? ' selected' : ''}`}
                onClick={() => onSelectAnswer(question.id, option)}
              >
                <span className="mpt-option-letter">{letter}</span>
                <span className="mpt-option-text">{option}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mpt-jump-strip" aria-label="Jump to question">
        {questions.map((q, index) => (
          <button
            type="button"
            key={q.id}
            className={`mpt-jump-dot${index === currentIndex ? ' current' : ''}${answers[q.id] ? ' answered' : ''}`}
            onClick={() => onJumpTo(index)}
            title={`Question ${index + 1}${answers[q.id] ? ' (answered)' : ''}`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      <div className="mpt-nav-bar">
        <button type="button" className="ghost" onClick={onPrevious} disabled={currentIndex === 0}>
          ← Previous
        </button>
        {isLast ? (
          <button type="button" className="mpt-submit-btn" onClick={onSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Mock Test'}
          </button>
        ) : (
          <button type="button" className="primary" onClick={onNext}>
            Next →
          </button>
        )}
      </div>
    </section>
  );
}
