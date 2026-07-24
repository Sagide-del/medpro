import { query, withTransaction } from '../config/database.js';

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function requiredKeywordMatches(keywords) {
  const count = keywords?.length || 0;
  if (count <= 2) return count;
  return Math.max(2, Math.ceil(count * 0.4));
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
      matchedKeywords: [],
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
    matchedKeywords,
  };
}

function phaseSortValue(label) {
  const match = String(label || '').match(/(\d+)/);
  if (match) return Number(match[1]);
  if (String(label || '').toLowerCase().includes('reflection')) return 99;
  if (String(label || '').toLowerCase().includes('analysis')) return 50;
  return 75;
}

function summarizeCompetencyPerformance(competencies, percentage) {
  return competencies.map((name) => ({
    name,
    score_pct: percentage,
  }));
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
           MAX(sca.submitted_at) AS last_attempt_at
         FROM student_case_attempts sca
         WHERE sca.student_id = $1
         GROUP BY sca.case_id
       )
       SELECT
         cs.id,
         cs.title,
         cs.location,
         cs.incident_date,
         cs.category,
         cs.difficulty,
         cs.description,
         cs.content,
         cs.order_number,
         cs.passing_percentage,
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

    return rows.map((row) => ({
      ...row,
      competencies: Array.isArray(row.content?.competencies) ? row.content.competencies : [],
    }));
  },

  async findForStudent(studentId, caseId) {
    const { rows } = await query(
      `SELECT
         cs.id,
         cs.title,
         cs.location,
         cs.incident_date,
         cs.category,
         cs.difficulty,
         cs.description,
         cs.content,
         cs.order_number,
         cs.passing_percentage,
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

    if (!rows[0]) return null;
    return {
      ...rows[0],
      competencies: Array.isArray(rows[0].content?.competencies) ? rows[0].content.competencies : [],
    };
  },

  async questionSet(caseId) {
    const { rows } = await query(
      `SELECT
         id,
         case_id,
         phase,
         question,
         question_type,
         options,
         correct_answer,
         explanation,
         points
       FROM case_questions
       WHERE case_id = $1
       ORDER BY phase ASC, created_at ASC, id ASC`,
      [caseId]
    );

    return rows
      .map((row) => {
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
      })
      .sort((left, right) => {
        const leftPhase = phaseSortValue(left.phase);
        const rightPhase = phaseSortValue(right.phase);
        if (leftPhase !== rightPhase) return leftPhase - rightPhase;
        return left.id.localeCompare(right.id);
      });
  },

  async startPayload(studentId, caseId) {
    const studyCase = await this.findForStudent(studentId, caseId);
    if (!studyCase) return null;

    const questions = await this.questionSet(caseId);
    const phaseBodies = Array.isArray(studyCase.content?.phases) ? studyCase.content.phases : [];

    const phases = [];
    const grouped = new Map();
    for (const question of questions) {
      if (!grouped.has(question.phase)) grouped.set(question.phase, []);
      grouped.get(question.phase).push({
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
      });
    }

    for (const [phase, phaseQuestions] of grouped.entries()) {
      const phaseContent = phaseBodies.find((item) => item.phase === phase);
      phases.push({
        phase,
        content: phaseContent?.body || '',
        questions: phaseQuestions,
      });
    }

    phases.sort((left, right) => phaseSortValue(left.phase) - phaseSortValue(right.phase));

    return {
      caseStudy: studyCase,
      phases,
      questions: questions.map((question) => ({
        id: question.id,
        phase: question.phase,
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
        `SELECT id, title, order_number, passing_percentage, content
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
        `SELECT id, phase, question, question_type, options, correct_answer, explanation, points
         FROM case_questions
         WHERE case_id = $1
         ORDER BY phase ASC, created_at ASC, id ASC`,
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

      questions.sort((left, right) => {
        const leftPhase = phaseSortValue(left.phase);
        const rightPhase = phaseSortValue(right.phase);
        if (leftPhase !== rightPhase) return leftPhase - rightPhase;
        return left.id.localeCompare(right.id);
      });

      const totalPoints = questions.reduce((sum, question) => sum + Number(question.points || 0), 0);
      const gradedReview = questions.map((question, index) => {
        const response = answers[question.id];
        const grade = gradeQuestion(question, response);
        const earnedPoints = grade.isCorrect ? Number(question.points || 0) : 0;
        return {
          questionId: question.id,
          phase: question.phase,
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
          matchedKeywords: grade.matchedKeywords,
          isCorrect: grade.isCorrect,
        };
      });

      const score = gradedReview.reduce((sum, item) => sum + item.earnedPoints, 0);
      const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
      const passed = percentage >= Number(studyCase.passing_percentage || 70);

      const { rows: attemptCountRows } = await db.query(
        `SELECT COUNT(*)::int AS total
         FROM student_case_attempts
         WHERE student_id = $1
           AND case_id = $2`,
        [studentId, caseId]
      );
      const attemptNumber = Number(attemptCountRows[0]?.total || 0) + 1;
      const now = new Date().toISOString();

      const { rows: insertedAttemptRows } = await db.query(
        `INSERT INTO student_case_attempts (
           student_id,
           case_id,
           score,
           percentage,
           passed,
           submitted_at,
           submitted_answers,
           review_payload
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb)
         RETURNING *`,
        [studentId, caseId, score, percentage, passed, now, JSON.stringify(answers || {}), JSON.stringify(gradedReview)]
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
        [studentId, caseId, passed ? 'completed' : 'available', percentage, passed ? now : null]
      );

      const competencies = Array.isArray(studyCase.content?.competencies) ? studyCase.content.competencies : [];
      for (const competency of summarizeCompetencyPerformance(competencies, percentage)) {
        await db.query(
          `INSERT INTO student_performance (student_id, item_type, item_id, domain, score_pct, completed_at)
           VALUES ($1, 'case_study', $2, $3, $4, $5)`,
          [studentId, caseId, competency.name, competency.score_pct, now]
        );
      }

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

      const strengths = gradedReview.filter((item) => item.isCorrect).map((item) => item.phase);
      const missedCompetencies = competencies.filter((competency) => !passed || percentage < Number(studyCase.passing_percentage || 70));

      return {
        caseStudy: {
          id: studyCase.id,
          title: studyCase.title,
          order_number: studyCase.order_number,
          passing_percentage: Number(studyCase.passing_percentage || 70),
          competencies,
        },
        attempt: {
          ...attempt,
          attempt_number: attemptNumber,
        },
        review: gradedReview,
        nextCaseUnlocked,
        strengths: [...new Set(strengths)],
        missedCompetencies: [...new Set(missedCompetencies)],
      };
    });
  },

  async attemptReview(studentId, attemptId) {
    const { rows } = await query(
      `SELECT
         sca.*,
         cs.title,
         cs.order_number,
         cs.passing_percentage,
         cs.content
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
