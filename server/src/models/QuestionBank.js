import { query } from '../config/database.js';

function featureEnabled() {
  // Active by default so the production workspace is visible immediately;
  // set QUESTION_BANK_SAAS=false for an instant rollback to legacy routes.
  return process.env.QUESTION_BANK_SAAS !== 'false';
}

function featureError() {
  const error = new Error('The Question Bank workspace is not enabled.');
  error.statusCode = 404;
  return error;
}

export const QuestionBank = {
  assertEnabled() {
    if (!featureEnabled()) throw featureError();
  },

  async listQuestions({ studentId, topic, difficulty, questionId, page = 1, limit = 20, includeAnswer = false } = {}) {
    this.assertEnabled();
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(50, Math.max(1, Number(limit) || 20));
    const values = [];
    const conditions = [];
    if (topic) { values.push(topic); conditions.push(`q.topic = $${values.length}`); }
    if (difficulty) { values.push(difficulty); conditions.push(`q.difficulty = $${values.length}`); }
    if (questionId) { values.push(questionId); conditions.push(`q.id = $${values.length}`); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (safePage - 1) * safeLimit;
    const select = includeAnswer
      ? `q.id, q.topic, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d,
         q.correct_option, q.explanation, q.difficulty, true AS answer_included`
      : `q.id, q.topic, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d,
         q.difficulty, false AS answer_included`;
    const count = await query(`SELECT COUNT(*)::int AS total FROM mcq_questions q ${where}`, values);
    const rows = await query(
      `SELECT ${select}, EXISTS(
         SELECT 1 FROM student_question_bookmarks b
         WHERE b.student_id = $${values.length + 1} AND b.question_id = q.id
       ) AS bookmarked
       FROM mcq_questions q ${where}
       ORDER BY q.topic ASC, q.created_at ASC, q.id ASC
       LIMIT $${values.length + 2} OFFSET $${values.length + 3}`,
      [...values, studentId, safeLimit, offset]
    );
    return {
      questions: rows.rows.map((row) => ({ ...row, source: 'MedPro question bank' })),
      pagination: { page: safePage, limit: safeLimit, total: count.rows[0]?.total || 0 },
    };
  },

  async setBookmark({ studentId, questionId, bookmarked = true }) {
    this.assertEnabled();
    if (bookmarked) {
      const { rows } = await query(
        `INSERT INTO student_question_bookmarks (student_id, question_id)
         VALUES ($1, $2) ON CONFLICT (student_id, question_id) DO NOTHING RETURNING *`,
        [studentId, questionId]
      );
      return rows[0] || { student_id: studentId, question_id: questionId };
    }
    await query('DELETE FROM student_question_bookmarks WHERE student_id = $1 AND question_id = $2', [studentId, questionId]);
    return { student_id: studentId, question_id: questionId, bookmarked: false };
  },

  async progress(studentId) {
    this.assertEnabled();
    const { rows } = await query(
      `SELECT
         (SELECT COUNT(*)::int FROM mcq_questions) AS total_questions,
         (SELECT COUNT(DISTINCT question_id)::int FROM student_question_bookmarks WHERE student_id = $1) AS bookmarked,
         (SELECT COUNT(*)::int FROM student_mcq_attempts WHERE student_id = $1) AS attempts,
         COALESCE((SELECT ROUND(AVG(percentage))::int FROM student_mcq_attempts WHERE student_id = $1), 0) AS accuracy,
         COALESCE((SELECT COUNT(*)::int FROM student_mcq_attempts WHERE student_id = $1), 0) AS answered`,
      [studentId]
    );
    return rows[0] || {};
  },

  async mockExams(studentId) {
    this.assertEnabled();
    const { rows } = await query(
      `SELECT m.id, m.title, 50::int AS question_count, 60::int AS time_limit_minutes,
              COALESCE(MAX(a.percentage), 0)::int AS best_score
       FROM mcq_modules m
       LEFT JOIN student_mcq_attempts a ON a.module_id = m.id AND a.student_id = $1
       WHERE m.is_active = true
       GROUP BY m.id, m.title, m.order_number
       ORDER BY m.order_number ASC
       LIMIT 3`,
      [studentId]
    );
    return rows.map((row, index) => ({ ...row, exam_number: index + 1, mixed_topics: true }));
  },
};
