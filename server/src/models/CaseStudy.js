import { query, withTransaction } from '../config/database.js';

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function requiredKeywordMatches(keywords) {
  return Math.max(2, Math.ceil((keywords?.length || 0) * 0.4));
}

function gradeQuestion(question, response) {
  if (question.question_type === 'multiple_choice') {
    const selected = String(response || '').trim().toUpperCase();
    const correct = String(question.correct_answer?.option || '').trim().toUpperCase();
    return {
      isCorrect: selected && selected === correct,
      selectedAnswer: selected,
      correctAnswer: correct,
      selectedAnswerText: question.option_map?.[selected] || 'No answer selected',
      correctAnswerText: question.option_map?.[correct] || '',
    };
  }

  const answerText = String(response || '').trim();
  const normalizedAnswer = normalizeText(answerText);
  const keywords = Array.isArray(question.correct_answer?.keywords) ? question.correct_answer.keywords : [];
  const matchedKeywords = keywords.filter((keyword) => normalizedAnswer.includes(normalizeText(keyword)));
  const minimumMatches = requiredKeywordMatches(keywords);
  const isCorrect = keywords.length > 0 && matchedKeywords.length >= minimumMatches;

  return {
    isCorrect,
    selectedAnswer: answerText,
    correctAnswer: keywords.join(', '),
    selectedAnswerText: answerText || 'No answer provided',
    correctAnswerText: keywords.join(', '),
  };
}

export const CaseStudy = {
  async listForStudent(studentId) {
    const { rows } = await query(
      `WITH progress AS (
         SELECT
           scp.case_id,
           scp.status,
           scp.score,
           scp.completed_at
         FROM student_case_progress scp
         WHERE scp.student_id = $1
       ),
       attempts AS (
         SELECT
           sca.case_id,
           COUNT(*)::int AS attempt_count,
           MAX(sca.percentage)::int AS best_percentage,
           MAX(sca.completed_at) AS last_attempt_at
         FROM student_case_attempts sca
         WHERE sca.student_id = $1
         GROUP BY sca.case_id
       )
       SELECT
         cs.id,
         cs.title,
         cs.location,
         cs."date",
         cs.category,
         cs.description,
         cs.difficulty,
         cs.order_number,
         COALESCE(progress.status, CASE WHEN cs.order_number = 1 THEN 'available' ELSE 'locked' END) AS status,
         COALESCE(progress.score, attempts.best_percentage, 0) AS score,
         COALESCE(attempts.attempt_count, 0) AS attempt_count,
         attempts.best_percentage,
         attempts.last_attempt_at,
         COALESCE(question_totals.total_points, 0) AS total_points
       FROM case_studies cs
       LEFT JOIN progress ON progress.case_id = cs.id
       LEFT JOIN attempts ON attempts.case_id = cs.id
       LEFT JOIN (
         SELECT case_id, SUM(points)::int AS total_points
         FROM case_questions
         GROUP BY case_id
       ) question_totals ON question_totals.case_id = cs.id
       WHERE cs.is_active = true
       ORDER BY cs.order_number ASC`,
      [studentId]
    );
    return rows;
  },

  async findForStudent(studentId, caseId) {
    const { rows } = await query(
      `SELECT
         cs.id,
         cs.title,
         cs.location,
         cs."date",
         cs.category,
         cs.description,
         cs.difficulty,
         cs.order_number,
         COALESCE(progress.status, CASE WHEN cs.order_number = 1 THEN 'available' ELSE 'locked' END) AS status,
         COALESCE(progress.score, 0) AS score,
         COALESCE(question_totals.total_points, 0) AS total_points
       FROM case_studies cs
       LEFT JOIN student_case_progress progress
         ON progress.case_id = cs.id
        AND progress.student_id = $1
       LEFT JOIN (
         SELECT case_id, SUM(points)::int AS total_points
         FROM case_questions
         GROUP BY case_id
       ) question_totals ON question_totals.case_id = cs.id
       WHERE cs.id = $2
         AND cs.is_active = true
       LIMIT 1`,
      [studentId, caseId]
    );
    return rows[0] || null;
  },

  async questionSet(caseId) {
    const { rows } = await query(
      `SELECT
         id,
         case_id,
         question,
         question_type,
         options,
         correct_answer,
         explanation,
         points
       FROM case_questions
       WHERE case_id = $1
       ORDER BY created_at ASC, id ASC`,
      [caseId]
    );

    return rows.map((row) => {
      const options = Array.isArray(row.options) ? row.options : [];
      const optionMap = {
        A: options[0] || '',
        B: options[1] || '',
        C: options[2] || '',
        D: options[3] || '',
      };
      return { ...row, option_map: optionMap };
    });
  },

  async startPayload(studentId, caseId) {
    const studyCase = await this.findForStudent(studentId, caseId);
    if (!studyCase) return null;

    const questions = await this.questionSet(caseId);
    return {
      caseStudy: studyCase,
      questions: questions.map((question) => ({
        id: question.id,
        question: question.question,
        question_type: question.question_type,
        options: Array.isArray(question.options)
          ? question.options.map((label, index) => ({
              key: String.fromCharCode(65 + index),
              label,
            }))
          : [],
        points: question.points,
      })),
    };
  },

  async submitAttempt({ studentId, caseId, answers = {} }) {
    return withTransaction(async (db) => {
      const { rows: caseRows } = await db.query(
        `SELECT id, title, order_number
         FROM case_studies
         WHERE id = $1
           AND is_active = true
         LIMIT 1`,
        [caseId]
      );
      const studyCase = caseRows[0];
      if (!studyCase) return null;

      const { rows: progressRows } = await db.query(
        `SELECT *
         FROM student_case_progress
         WHERE student_id = $1
           AND case_id = $2
         LIMIT 1`,
        [studentId, caseId]
      );
      const progress = progressRows[0];
      const status = progress?.status || (studyCase.order_number === 1 ? 'available' : 'locked');
      if (status === 'locked') {
        const error = new Error('This case is currently locked.');
        error.status = 403;
        throw error;
      }

      const { rows: questionRows } = await db.query(
        `SELECT id, question, question_type, options, correct_answer, explanation, points
         FROM case_questions
         WHERE case_id = $1
         ORDER BY created_at ASC, id ASC`,
        [caseId]
      );

      const questions = questionRows.map((row) => {
        const options = Array.isArray(row.options) ? row.options : [];
        return {
          ...row,
          option_map: {
            A: options[0] || '',
            B: options[1] || '',
            C: options[2] || '',
            D: options[3] || '',
          },
        };
      });

      const totalPoints = questions.reduce((sum, question) => sum + Number(question.points || 0), 0);
      const gradedReview = questions.map((question, index) => {
        const response = answers[question.id];
        const grade = gradeQuestion(question, response);
        const earnedPoints = grade.isCorrect ? Number(question.points || 0) : 0;
        return {
          questionId: question.id,
          questionNumber: index + 1,
          questionText: question.question,
          questionType: question.question_type,
          points: Number(question.points || 0),
          earnedPoints,
          selectedAnswer: grade.selectedAnswer,
          selectedAnswerText: grade.selectedAnswerText,
          correctAnswer: grade.correctAnswer,
          correctAnswerText: grade.correctAnswerText,
          explanation: question.explanation,
          isCorrect: grade.isCorrect,
        };
      });

      const score = gradedReview.reduce((sum, item) => sum + item.earnedPoints, 0);
      const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
      const passed = percentage >= 80;

      const { rows: attemptCountRows } = await db.query(
        `SELECT COUNT(*)::int AS total
         FROM student_case_attempts
         WHERE student_id = $1
           AND case_id = $2`,
        [studentId, caseId]
      );
      const attemptNumber = Number(attemptCountRows[0]?.total || 0) + 1;

      const { rows: insertedAttemptRows } = await db.query(
        `INSERT INTO student_case_attempts (
           student_id,
           case_id,
           score,
           percentage,
           passed,
           completed_at,
           submitted_answers,
           review_payload
         )
         VALUES ($1, $2, $3, $4, $5, now(), $6::jsonb, $7::jsonb)
         RETURNING *`,
        [studentId, caseId, score, percentage, passed, JSON.stringify(answers || {}), JSON.stringify(gradedReview)]
      );
      const attempt = insertedAttemptRows[0];

      await db.query(
        `INSERT INTO student_case_progress (student_id, case_id, status, score, completed_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (student_id, case_id)
         DO UPDATE SET
           status = EXCLUDED.status,
           score = EXCLUDED.score,
           completed_at = EXCLUDED.completed_at`,
        [
          studentId,
          caseId,
          passed ? 'completed' : 'available',
          percentage,
          passed ? new Date().toISOString() : null,
        ]
      );

      let nextCaseUnlocked = null;
      if (passed) {
        const { rows: nextCaseRows } = await db.query(
          `SELECT id, title
           FROM case_studies
           WHERE is_active = true
             AND order_number = $1
           LIMIT 1`,
          [Number(studyCase.order_number) + 1]
        );
        const nextCase = nextCaseRows[0];
        if (nextCase) {
          await db.query(
            `INSERT INTO student_case_progress (student_id, case_id, status)
             VALUES ($1, $2, 'available')
             ON CONFLICT (student_id, case_id)
             DO UPDATE SET status = CASE
               WHEN student_case_progress.status = 'completed' THEN student_case_progress.status
               ELSE 'available'
             END`,
            [studentId, nextCase.id]
          );
          nextCaseUnlocked = nextCase;
        }
      }

      return {
        caseStudy: {
          id: studyCase.id,
          title: studyCase.title,
          order_number: studyCase.order_number,
        },
        attempt: {
          ...attempt,
          attempt_number: attemptNumber,
        },
        review: gradedReview,
        nextCaseUnlocked,
      };
    });
  },

  async attemptReview(studentId, attemptId) {
    const { rows } = await query(
      `SELECT
         sca.*,
         cs.title,
         cs.order_number
       FROM student_case_attempts sca
       INNER JOIN case_studies cs ON cs.id = sca.case_id
       WHERE sca.id = $1
         AND sca.student_id = $2
       LIMIT 1`,
      [attemptId, studentId]
    );
    return rows[0] || null;
  },
};
