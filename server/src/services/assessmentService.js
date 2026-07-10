import { isAnswerCorrect } from '../utils/helpers.js';

/**
 * Grades a set of submitted answers against assessment questions.
 * For MCQ/short_answer/fill_blank questions this does exact/loose-match grading.
 * For scenario_step questions (Clinical Judgment Model) it flags them for
 * teacher review since clinical reasoning free-text can't be auto-graded reliably —
 * partial credit (50%) is pre-assigned pending manual review.
 */
export function gradeAnswers(questions, submittedAnswers) {
  const answerMap = new Map(submittedAnswers.map((a) => [a.questionId, a.response]));
  const graded = [];
  let pointsAwarded = 0;
  let totalPoints = 0;
  let needsManualReview = false;

  for (const q of questions) {
    totalPoints += q.points;
    const response = answerMap.get(q.question_id) ?? '';

    if (q.question_type === 'scenario_step') {
      needsManualReview = true;
      const provisional = response.trim().length > 10 ? Math.round(q.points * 0.5) : 0;
      pointsAwarded += provisional;
      graded.push({ questionId: q.question_id, response, isCorrect: null, pointsAwarded: provisional });
      continue;
    }

    const correct = isAnswerCorrect(q.correct_answer, response);
    const awarded = correct ? q.points : 0;
    pointsAwarded += awarded;
    graded.push({ questionId: q.question_id, response, isCorrect: correct, pointsAwarded: awarded });
  }

  const scorePct = totalPoints > 0 ? Math.round((pointsAwarded / totalPoints) * 10000) / 100 : 0;
  return { graded, pointsAwarded, totalPoints, scorePct, needsManualReview };
}

/** The NCSBN Clinical Judgment Measurement Model — the 6 steps used for scenario assessments */
export const CLINICAL_JUDGMENT_STEPS = [
  'recognize_cues',
  'analyze_cues',
  'prioritize_hypotheses',
  'generate_solutions',
  'take_action',
  'evaluate_outcomes',
];

/** Blooms's Taxonomy ordering, low to high cognitive demand */
export const BLOOM_LEVELS = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];
