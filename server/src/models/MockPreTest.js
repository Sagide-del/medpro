import { examQuestions } from '../data/examQuestions.js';

// Mock Pre-Test: a self-contained, stateless practice-exam engine layered on
// top of the hardcoded `examQuestions` bank. It does NOT touch the existing
// `mcq_modules` / `mcq_questions` DB-backed MCQ system (models/Assessment.js) --
// that system is untouched. This is a separate, additive feature reachable at
// Exams -> MCQ -> Mock Pre-Test.
//
// Security model: because the question bank is stateless (no server-side
// session/attempt row), grading never trusts the client. `startTest` strips
// `correctAnswer` and `explanation` before the questions leave the server.
// `submitTest` re-looks-up each answered question by id from this same
// in-memory bank and grades against the authoritative `correctAnswer` --
// the client never has a way to learn or spoof the key before submitting.

// Top-level dashboard categories. Only "Airway" has real content today
// (the uploaded EMT-Basic Module 2 Airway MCQ bank); the others are wired up
// and ready to light up automatically the moment questions with that
// `module` value are added to examQuestions.js -- no code changes needed.
const MODULE_DEFINITIONS = [
  { key: 'Airway', label: 'Airway', icon: '🫁' },
  { key: 'Trauma', label: 'Trauma', icon: '🩹' },
  { key: 'Medical Emergencies', label: 'Medical Emergencies', icon: '💊' },
  { key: 'Cardiology', label: 'Cardiology', icon: '❤️' },
];

const QUESTION_COUNT_OPTIONS = [20, 50, 100];

const PERFORMANCE_THRESHOLDS = [
  { min: 85, label: 'Excellent' },
  { min: 70, label: 'Good' },
  { min: 0, label: 'Needs Improvement' },
];

function performanceLabel(percentage) {
  return PERFORMANCE_THRESHOLDS.find((tier) => percentage >= tier.min).label;
}

function shuffle(items = []) {
  const clone = [...items];
  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
  }
  return clone;
}

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function findModuleDefinition(moduleKey) {
  return MODULE_DEFINITIONS.find((def) => def.key === moduleKey);
}

export const MockPreTest = {
  QUESTION_COUNT_OPTIONS,

  listModules() {
    return MODULE_DEFINITIONS.map((def) => {
      const availableQuestions = examQuestions.filter((q) => q.module === def.key).length;
      return {
        ...def,
        availableQuestions,
        enabled: availableQuestions > 0,
      };
    });
  },

  // Sanitized question set for a fresh attempt -- no correctAnswer, no
  // explanation. Options are shuffled per question; questions are shuffled
  // and capped to the requested count (or however many actually exist).
  startTest({ module: moduleKey, questionCount }) {
    const definition = findModuleDefinition(moduleKey);
    if (!definition) throw httpError(400, 'Unknown topic selected.');

    const requestedCount = Number(questionCount);
    if (!QUESTION_COUNT_OPTIONS.includes(requestedCount)) {
      throw httpError(400, `Question count must be one of: ${QUESTION_COUNT_OPTIONS.join(', ')}.`);
    }

    const pool = examQuestions.filter((q) => q.module === moduleKey);
    if (!pool.length) {
      throw httpError(404, `No questions are available for ${moduleKey} yet. Check back soon.`);
    }

    const selected = shuffle(pool).slice(0, requestedCount);

    return {
      module: moduleKey,
      requestedCount,
      actualCount: selected.length,
      questions: selected.map((q) => ({
        id: q.id,
        topic: q.topic,
        module: q.module,
        question: q.question,
        options: shuffle(q.options),
        difficulty: q.difficulty,
      })),
    };
  },

  // Grades a submitted attempt. `answers` is an array of
  // { id, selectedAnswer }, one entry per question the student was shown
  // (selectedAnswer may be null/empty for a skipped question -- it is still
  // graded as incorrect and counted toward the total).
  submitTest({ module: moduleKey, answers = [] }) {
    const definition = findModuleDefinition(moduleKey);
    if (!definition) throw httpError(400, 'Unknown topic selected.');
    if (!Array.isArray(answers) || !answers.length) {
      throw httpError(400, 'No answers were submitted.');
    }

    const bank = new Map(examQuestions.filter((q) => q.module === moduleKey).map((q) => [q.id, q]));

    let correctCount = 0;
    const review = [];

    for (const answer of answers) {
      const question = bank.get(answer?.id);
      if (!question) continue; // ignore ids that don't belong to this module/bank

      const studentAnswer = typeof answer.selectedAnswer === 'string' ? answer.selectedAnswer.trim() : '';
      const isCorrect = studentAnswer.length > 0 && studentAnswer === question.correctAnswer;
      if (isCorrect) correctCount += 1;

      review.push({
        questionId: question.id,
        topic: question.topic,
        question: question.question,
        options: question.options,
        studentAnswer: studentAnswer || 'No answer selected',
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation,
      });
    }

    const totalCount = review.length;
    if (!totalCount) throw httpError(400, 'None of the submitted answers matched this topic.');

    const percentage = Math.round((correctCount / totalCount) * 100);

    return {
      module: moduleKey,
      score: percentage,
      correctCount,
      totalCount,
      performance: performanceLabel(percentage),
      review,
    };
  },
};
