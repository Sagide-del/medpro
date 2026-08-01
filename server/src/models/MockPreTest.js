import { query } from '../config/database.js';

const QUESTION_COUNT_OPTIONS = [20, 50, 100];

const PERFORMANCE_THRESHOLDS = [
  { min: 85, label: 'Excellent' },
  { min: 70, label: 'Good' },
  { min: 0, label: 'Needs Improvement' },
];

function performanceLabel(percentage) {
  return PERFORMANCE_THRESHOLDS.find((tier) => percentage >= tier.min)?.label || 'Needs Improvement';
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

function iconForModule(title = '') {
  const label = String(title).toLowerCase();
  if (label.includes('airway')) return '🫁';
  if (label.includes('trauma')) return '🩹';
  if (label.includes('cardio')) return '❤️';
  if (label.includes('medical')) return '💊';
  return '📘';
}

function sortAndMixByTopic(questions = []) {
  const topicBuckets = new Map();
  for (const question of questions) {
    const topic = String(question.topic || 'General').trim() || 'General';
    if (!topicBuckets.has(topic)) topicBuckets.set(topic, []);
    topicBuckets.get(topic).push(question);
  }

  const topics = shuffle([...topicBuckets.keys()]);
  for (const topic of topics) {
    topicBuckets.set(topic, shuffle(topicBuckets.get(topic)));
  }

  const mixed = [];
  let remaining = true;
  while (remaining) {
    remaining = false;
    for (const topic of topics) {
      const bucket = topicBuckets.get(topic) || [];
      if (bucket.length) {
        mixed.push(bucket.shift());
        remaining = true;
      }
    }
  }
  return mixed;
}

function normalizeModuleRow(row, availableQuestions = 0) {
  return {
    id: row.id,
    key: row.id,
    label: row.title,
    title: row.title,
    description: row.description || '',
    order_number: row.order_number || 0,
    passing_score: row.passing_score || 90,
    icon: iconForModule(row.title),
    availableQuestions,
    enabled: availableQuestions > 0,
  };
}

function normalizeQuestionRow(question) {
  return {
    id: question.id,
    topic: question.topic || 'General',
    module: question.module_id,
    question: question.question_text,
    options: shuffle([
      question.option_a,
      question.option_b,
      question.option_c,
      question.option_d,
    ].filter(Boolean)),
    difficulty: question.difficulty || 'intermediate',
  };
}

function chooseQuestionMix(questions, requestedCount) {
  if (questions.length <= requestedCount) return shuffle(questions);
  return sortAndMixByTopic(questions).slice(0, requestedCount);
}

export const MockPreTest = {
  QUESTION_COUNT_OPTIONS,

  async listModules() {
    const [{ rows: modules }, { rows: counts }] = await Promise.all([
      query(
        `SELECT id, title, description, order_number, passing_score
         FROM mcq_modules
         WHERE is_active = true
         ORDER BY order_number ASC, title ASC`
      ),
      query(
        `SELECT module_id, COUNT(*)::int AS available_questions
         FROM mcq_questions
         GROUP BY module_id`
      ),
    ]);

    const countsByModuleId = new Map(counts.map((row) => [row.module_id, Number(row.available_questions || 0)]));
    return modules.map((module) => normalizeModuleRow(module, countsByModuleId.get(module.id) || 0));
  },

  async startTest({ module: moduleId, questionCount }) {
    const requestedCount = Number(questionCount);
    if (!QUESTION_COUNT_OPTIONS.includes(requestedCount)) {
      throw httpError(400, `Question count must be one of: ${QUESTION_COUNT_OPTIONS.join(', ')}.`);
    }

    const { rows: moduleRows } = await query(
      `SELECT id, title, description, order_number, passing_score
       FROM mcq_modules
       WHERE id = $1 AND is_active = true
       LIMIT 1`,
      [moduleId]
    );
    const module = moduleRows[0];
    if (!module) throw httpError(404, 'Unknown topic selected.');

    const { rows: pool } = await query(
      `SELECT id, module_id, topic, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, difficulty
       FROM mcq_questions
       WHERE module_id = $1
       ORDER BY topic ASC, created_at ASC`,
      [moduleId]
    );

    if (!pool.length) {
      throw httpError(404, `No questions are available for ${module.title} yet. Check back soon.`);
    }

    const selected = chooseQuestionMix(pool.map(normalizeQuestionRow), requestedCount);

    return {
      module: module.id,
      moduleTitle: module.title,
      requestedCount,
      actualCount: selected.length,
      questions: selected,
    };
  },

  async submitTest({ module: moduleId, answers = [] }) {
    const { rows: moduleRows } = await query(
      `SELECT id, title, description, order_number, passing_score
       FROM mcq_modules
       WHERE id = $1 AND is_active = true
       LIMIT 1`,
      [moduleId]
    );
    const module = moduleRows[0];
    if (!module) throw httpError(400, 'Unknown topic selected.');
    if (!Array.isArray(answers) || !answers.length) {
      throw httpError(400, 'No answers were submitted.');
    }

    const questionIds = answers.map((answer) => answer?.id).filter(Boolean);
    const { rows: bankRows } = await query(
      `SELECT id, module_id, topic, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, difficulty
       FROM mcq_questions
       WHERE module_id = $1
         AND id = ANY($2::uuid[])`,
      [moduleId, questionIds]
    );

    const bank = new Map(bankRows.map((row) => [row.id, row]));
    let correctCount = 0;
    const review = [];

    for (const answer of answers) {
      const question = bank.get(answer?.id);
      if (!question) continue;

      const selectedAnswer = typeof answer.selectedAnswer === 'string' ? answer.selectedAnswer.trim() : '';
      const correctAnswer = question[question.correct_option];
      const isCorrect = selectedAnswer.length > 0 && selectedAnswer === correctAnswer;
      if (isCorrect) correctCount += 1;

      review.push({
        questionId: question.id,
        topic: question.topic || 'General',
        question: question.question_text,
        studentAnswer: selectedAnswer || 'No answer selected',
        correctAnswer,
        isCorrect,
        explanation: question.explanation || '',
      });
    }

    const totalCount = review.length;
    if (!totalCount) throw httpError(400, 'None of the submitted answers matched this topic.');

    const percentage = Math.round((correctCount / totalCount) * 100);

    return {
      module: module.id,
      moduleTitle: module.title,
      score: percentage,
      correctCount,
      totalCount,
      performance: performanceLabel(percentage),
      review,
    };
  },
};
