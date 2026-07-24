import { query, withTransaction } from '../config/database.js';

function dbExecutor(executor) {
  return executor || { query };
}

async function ensureModuleProgress(studentId, executor) {
  const db = dbExecutor(executor);
  const { rows: modules } = await db.query(
    `SELECT id, order_number
     FROM mcq_modules
     WHERE is_active = true
     ORDER BY order_number ASC`
  );

  if (!modules.length) return [];

  const { rows: existing } = await db.query(
    `SELECT module_id, status
     FROM student_module_progress
     WHERE student_id = $1`,
    [studentId]
  );

  const existingIds = new Set(existing.map((row) => row.module_id));

  if (!existing.length) {
    for (const [index, module] of modules.entries()) {
      await db.query(
        `INSERT INTO student_module_progress (student_id, module_id, status)
         VALUES ($1, $2, $3)`,
        [studentId, module.id, index === 0 ? 'available' : 'locked']
      );
    }
    return modules;
  }

  for (const module of modules) {
    if (!existingIds.has(module.id)) {
      await db.query(
        `INSERT INTO student_module_progress (student_id, module_id, status)
         VALUES ($1, $2, 'locked')
         ON CONFLICT (student_id, module_id) DO NOTHING`,
        [studentId, module.id]
      );
    }
  }

  const hasOpenModule = existing.some((row) => ['available', 'completed'].includes(row.status));
  if (!hasOpenModule && modules[0]) {
    await db.query(
      `UPDATE student_module_progress
       SET status = 'available'
       WHERE student_id = $1
         AND module_id = $2
         AND status = 'locked'`,
      [studentId, modules[0].id]
    );
  }

  return modules;
}

function shuffle(items = []) {
  const clone = [...items];
  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
  }
  return clone;
}

function randomizedOptions(question) {
  return shuffle([
    { key: 'option_a', label: question.option_a },
    { key: 'option_b', label: question.option_b },
    { key: 'option_c', label: question.option_c },
    { key: 'option_d', label: question.option_d },
  ]);
}

function normalizeSelectedAnswers(questionIds = [], selectedAnswers = []) {
  if (Array.isArray(selectedAnswers) && selectedAnswers.length === questionIds.length) {
    return questionIds.map((questionId, index) => ({
      questionId,
      selectedAnswer: selectedAnswers[index],
    }));
  }

  if (selectedAnswers && typeof selectedAnswers === 'object' && !Array.isArray(selectedAnswers)) {
    return questionIds.map((questionId) => ({
      questionId,
      selectedAnswer: selectedAnswers[questionId] ?? null,
    }));
  }

  return [];
}

function reviewRow(question, selectedAnswer) {
  const correctKey = question.correct_option;
  return {
    questionId: question.id,
    topic: question.topic,
    questionText: question.question_text,
    selectedAnswer,
    selectedAnswerText: selectedAnswer ? question[selectedAnswer] : null,
    correctAnswer: correctKey,
    correctAnswerText: question[correctKey],
    explanation: question.explanation,
    isCorrect: selectedAnswer === correctKey,
  };
}

export const Assessment = {
  async list({ type, status = 'published', groupId, institutionId, limit = 50, offset = 0 } = {}) {
    const conditions = [];
    const params = [];
    let i = 1;
    if (type) { conditions.push(`type = $${i++}`); params.push(type); }
    if (status) { conditions.push(`status = $${i++}`); params.push(status); }
    if (groupId) { conditions.push(`group_id = $${i++}`); params.push(groupId); }
    if (institutionId) { conditions.push(`institution_id = $${i++}`); params.push(institutionId); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query(
      `SELECT * FROM assessments ${where} ORDER BY created_at DESC LIMIT $${i++} OFFSET $${i++}`,
      [...params, limit, offset]
    );
    return rows;
  },

  async findById(assessmentId) {
    const { rows } = await query(`SELECT * FROM assessments WHERE assessment_id = $1`, [assessmentId]);
    return rows[0] || null;
  },

  async questions(assessmentId) {
    const { rows } = await query(
      `SELECT * FROM assessment_questions WHERE assessment_id = $1 ORDER BY position`,
      [assessmentId]
    );
    return rows;
  },

  async create({ type, title, description, category, difficulty, bloomLevel, timeLimitMinutes, passingScorePct, clinicalJudgmentSteps, groupId, institutionId, createdBy }, questions = []) {
    return withTransaction(async (tx) => {
      const totalPoints = questions.reduce((sum, question) => sum + (question.points || 5), 0);
      const { rows } = await tx.query(
        `INSERT INTO assessments (type, title, description, category, difficulty, bloom_level, time_limit_minutes, total_points, passing_score_pct, clinical_judgment_steps, group_id, institution_id, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         RETURNING *`,
        [
          type,
          title,
          description || null,
          category || null,
          difficulty || 'intermediate',
          bloomLevel || null,
          timeLimitMinutes || null,
          totalPoints,
          passingScorePct || 70,
          JSON.stringify(clinicalJudgmentSteps || []),
          groupId || null,
          institutionId || null,
          createdBy,
        ]
      );

      const assessment = rows[0];
      let position = 0;
      for (const question of questions) {
        await tx.query(
          `INSERT INTO assessment_questions (assessment_id, question_type, clinical_step, prompt, options, correct_answer, points, position)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            assessment.assessment_id,
            question.questionType || 'mcq',
            question.clinicalStep || null,
            question.prompt,
            question.options ? JSON.stringify(question.options) : null,
            question.correctAnswer || null,
            question.points || 5,
            position++,
          ]
        );
      }

      return assessment;
    });
  },

  async setStatus(assessmentId, status) {
    const { rows } = await query(
      `UPDATE assessments SET status = $1 WHERE assessment_id = $2 RETURNING *`,
      [status, assessmentId]
    );
    return rows[0];
  },

  async delete(assessmentId) {
    await query(`DELETE FROM assessments WHERE assessment_id = $1`, [assessmentId]);
  },

  async startAttempt(assessmentId, studentId) {
    const { rows } = await query(
      `INSERT INTO assessment_attempts (assessment_id, student_id) VALUES ($1,$2) RETURNING *`,
      [assessmentId, studentId]
    );
    return rows[0];
  },

  async findAttempt(attemptId) {
    const { rows } = await query(`SELECT * FROM assessment_attempts WHERE attempt_id = $1`, [attemptId]);
    return rows[0] || null;
  },

  async attemptsForStudent(studentId) {
    const { rows } = await query(
      `SELECT *
       FROM (
         SELECT aa.attempt_id,
                aa.student_id,
                aa.status::text AS status,
                aa.score_pct,
                aa.points_awarded,
                aa.started_at,
                aa.submitted_at,
                aa.graded_at,
                a.title,
                a.type::text AS type,
                a.category
         FROM assessment_attempts aa
         JOIN assessments a ON a.assessment_id = aa.assessment_id
         WHERE aa.student_id = $1

         UNION ALL

         SELECT sma.id AS attempt_id,
                sma.student_id,
                CASE WHEN sma.passed THEN 'graded' ELSE 'submitted' END AS status,
                sma.percentage AS score_pct,
                sma.score AS points_awarded,
                sma.completed_at AS started_at,
                sma.completed_at AS submitted_at,
                sma.completed_at AS graded_at,
                m.title,
                'mcq_module'::text AS type,
                m.title AS category
         FROM student_mcq_attempts sma
         JOIN mcq_modules m ON m.id = sma.module_id
         WHERE sma.student_id = $1
       ) attempts
       ORDER BY submitted_at DESC NULLS LAST, started_at DESC NULLS LAST`,
      [studentId]
    );
    return rows;
  },

  async attemptsForAssessment(assessmentId) {
    const { rows } = await query(
      `SELECT aa.*, u.full_name, u.email
       FROM assessment_attempts aa
       JOIN users u ON u.user_id = aa.student_id
       WHERE aa.assessment_id = $1
       ORDER BY aa.submitted_at DESC NULLS LAST`,
      [assessmentId]
    );
    return rows;
  },

  async recordAnswer(attemptId, { questionId, response, isCorrect, pointsAwarded }) {
    const { rows } = await query(
      `INSERT INTO assessment_answers (attempt_id, question_id, response, is_correct, points_awarded)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [attemptId, questionId, response, isCorrect, pointsAwarded]
    );
    return rows[0];
  },

  async gradeAttempt(attemptId, { scorePct, pointsAwarded }) {
    const { rows } = await query(
      `UPDATE assessment_attempts
       SET status = 'graded',
           score_pct = $1,
           points_awarded = $2,
           graded_at = now(),
           submitted_at = COALESCE(submitted_at, now())
       WHERE attempt_id = $3
       RETURNING *`,
      [scorePct, pointsAwarded, attemptId]
    );
    return rows[0];
  },

  async submitAttempt(attemptId) {
    const { rows } = await query(
      `UPDATE assessment_attempts
       SET status = 'submitted', submitted_at = now()
       WHERE attempt_id = $1
       RETURNING *`,
      [attemptId]
    );
    return rows[0];
  },

  async answersForAttempt(attemptId) {
    const { rows } = await query(
      `SELECT aa.*, q.prompt, q.correct_answer, q.points AS max_points, q.clinical_step
       FROM assessment_answers aa
       JOIN assessment_questions q ON q.question_id = aa.question_id
       WHERE aa.attempt_id = $1`,
      [attemptId]
    );
    return rows;
  },

  async listMcqModules(studentId) {
    await ensureModuleProgress(studentId);

    const { rows } = await query(
      `SELECT m.*,
              p.status,
              p.score,
              p.completed_at,
              COALESCE(stats.attempt_count, 0)::int AS attempt_count,
              stats.best_percentage,
              stats.last_percentage,
              stats.last_completed_at
       FROM mcq_modules m
       LEFT JOIN student_module_progress p
         ON p.module_id = m.id
        AND p.student_id = $1
       LEFT JOIN LATERAL (
         SELECT COUNT(*)::int AS attempt_count,
                MAX(percentage)::int AS best_percentage,
                (
                  SELECT percentage
                  FROM student_mcq_attempts latest
                  WHERE latest.student_id = $1
                    AND latest.module_id = m.id
                  ORDER BY latest.completed_at DESC
                  LIMIT 1
                ) AS last_percentage,
                MAX(completed_at) AS last_completed_at
         FROM student_mcq_attempts sma
         WHERE sma.student_id = $1
           AND sma.module_id = m.id
       ) stats ON true
       WHERE m.is_active = true
       ORDER BY m.order_number ASC`,
      [studentId]
    );

    return rows;
  },

  async findMcqModuleForStudent(studentId, moduleId, executor) {
    const db = dbExecutor(executor);
    await ensureModuleProgress(studentId, db);

    const { rows } = await db.query(
      `SELECT m.*,
              p.status,
              p.score,
              p.completed_at
       FROM mcq_modules m
       LEFT JOIN student_module_progress p
         ON p.module_id = m.id
        AND p.student_id = $1
       WHERE m.id = $2
         AND m.is_active = true
       LIMIT 1`,
      [studentId, moduleId]
    );

    return rows[0] || null;
  },

  async randomizedMcqQuestions(studentId, moduleId) {
    const module = await this.findMcqModuleForStudent(studentId, moduleId);
    if (!module) return null;

    const { rows } = await query(
      `SELECT id, topic, question_text, option_a, option_b, option_c, option_d, difficulty
       FROM mcq_questions
       WHERE module_id = $1
       ORDER BY random()`,
      [moduleId]
    );

    return {
      module,
      questions: rows.map((question) => ({
        id: question.id,
        topic: question.topic,
        question_text: question.question_text,
        difficulty: question.difficulty,
        options: randomizedOptions(question),
      })),
    };
  },

  async submitMcqAttempt({ studentId, moduleId, questionIds = [], selectedAnswers = [] }) {
    return withTransaction(async (tx) => {
      const module = await this.findMcqModuleForStudent(studentId, moduleId, tx);
      if (!module) {
        const error = new Error('Module not found.');
        error.statusCode = 404;
        throw error;
      }

      if (module.status === 'locked') {
        const error = new Error('This module is currently locked.');
        error.statusCode = 403;
        throw error;
      }

      const normalizedAnswers = normalizeSelectedAnswers(questionIds, selectedAnswers);
      if (!normalizedAnswers.length) {
        const error = new Error('No answers were submitted.');
        error.statusCode = 400;
        throw error;
      }

      const { rows: questions } = await tx.query(
        `SELECT *
         FROM mcq_questions
         WHERE module_id = $1
           AND id = ANY($2::uuid[])`,
        [moduleId, questionIds]
      );

      const questionMap = new Map(questions.map((question) => [question.id, question]));
      if (questionMap.size !== questionIds.length) {
        const error = new Error('One or more submitted questions are invalid.');
        error.statusCode = 400;
        throw error;
      }

      const review = normalizedAnswers.map(({ questionId, selectedAnswer }) => reviewRow(questionMap.get(questionId), selectedAnswer));
      const totalQuestions = review.length;
      const correctAnswers = review.filter((item) => item.isCorrect).length;
      const wrongAnswers = totalQuestions - correctAnswers;
      const percentage = totalQuestions ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
      const passed = percentage >= Number(module.passing_score || 90);

      const { rows: countRows } = await tx.query(
        `SELECT COUNT(*)::int AS total
         FROM student_mcq_attempts
         WHERE student_id = $1
           AND module_id = $2`,
        [studentId, moduleId]
      );

      const attemptNumber = Number(countRows[0]?.total || 0) + 1;
      const now = new Date().toISOString();

      const { rows: attemptRows } = await tx.query(
        `INSERT INTO student_mcq_attempts
         (student_id, module_id, score, percentage, total_questions, correct_answers, wrong_answers, passed, attempt_number, completed_at, submitted_answers, review_payload)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12::jsonb)
         RETURNING *`,
        [
          studentId,
          moduleId,
          correctAnswers,
          percentage,
          totalQuestions,
          correctAnswers,
          wrongAnswers,
          passed,
          attemptNumber,
          now,
          JSON.stringify(normalizedAnswers),
          JSON.stringify(review),
        ]
      );

      await tx.query(
        `UPDATE student_module_progress
         SET status = $3,
             score = $4,
             completed_at = $5
         WHERE student_id = $1
           AND module_id = $2`,
        [studentId, moduleId, passed ? 'completed' : 'available', percentage, passed ? now : null]
      );

      const { rows: nextRows } = await tx.query(
        `SELECT id
         FROM mcq_modules
         WHERE is_active = true
           AND order_number > $1
         ORDER BY order_number ASC
         LIMIT 1`,
        [module.order_number]
      );

      let nextModuleUnlocked = null;
      if (nextRows[0]) {
        nextModuleUnlocked = passed ? nextRows[0].id : null;
        await tx.query(
          `UPDATE student_module_progress
           SET status = CASE
             WHEN status = 'completed' THEN status
             ELSE $3
           END
           WHERE student_id = $1
             AND module_id = $2`,
          [studentId, nextRows[0].id, passed ? 'available' : 'locked']
        );
      }

      await tx.query(
        `INSERT INTO student_performance (student_id, item_type, item_id, domain, score_pct, completed_at)
         VALUES ($1, 'assessment', $2, 'knowledge', $3, $4)`,
        [studentId, moduleId, percentage, now]
      );

      const progress = await this.findMcqModuleForStudent(studentId, moduleId, tx);

      return {
        attempt: attemptRows[0],
        review,
        progress,
        nextModuleUnlocked,
      };
    });
  },

  async findMcqAttemptReview(studentId, attemptId) {
    const { rows } = await query(
      `SELECT a.*,
              m.title AS module_title,
              m.description AS module_description,
              m.passing_score
       FROM student_mcq_attempts a
       JOIN mcq_modules m ON m.id = a.module_id
       WHERE a.id = $1
         AND a.student_id = $2
       LIMIT 1`,
      [attemptId, studentId]
    );

    return rows[0] || null;
  },
};
