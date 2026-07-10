import { query, withTransaction } from '../config/database.js';

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
      const totalPoints = questions.reduce((sum, q) => sum + (q.points || 5), 0);
      const { rows } = await tx.query(
        `INSERT INTO assessments (type, title, description, category, difficulty, bloom_level, time_limit_minutes, total_points, passing_score_pct, clinical_judgment_steps, group_id, institution_id, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
        [type, title, description || null, category || null, difficulty || 'intermediate', bloomLevel || null,
         timeLimitMinutes || null, totalPoints, passingScorePct || 70, JSON.stringify(clinicalJudgmentSteps || []),
         groupId || null, institutionId || null, createdBy]
      );
      const assessment = rows[0];
      let position = 0;
      for (const q of questions) {
        await tx.query(
          `INSERT INTO assessment_questions (assessment_id, question_type, clinical_step, prompt, options, correct_answer, points, position)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [assessment.assessment_id, q.questionType || 'mcq', q.clinicalStep || null, q.prompt,
           q.options ? JSON.stringify(q.options) : null, q.correctAnswer || null, q.points || 5, position++]
        );
      }
      return assessment;
    });
  },

  async setStatus(assessmentId, status) {
    const { rows } = await query(`UPDATE assessments SET status = $1 WHERE assessment_id = $2 RETURNING *`, [status, assessmentId]);
    return rows[0];
  },

  async delete(assessmentId) {
    await query(`DELETE FROM assessments WHERE assessment_id = $1`, [assessmentId]);
  },

  // ---- Attempts ----
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
      `SELECT aa.*, a.title, a.type, a.category FROM assessment_attempts aa
       JOIN assessments a ON a.assessment_id = aa.assessment_id
       WHERE aa.student_id = $1 ORDER BY aa.started_at DESC`,
      [studentId]
    );
    return rows;
  },

  async attemptsForAssessment(assessmentId) {
    const { rows } = await query(
      `SELECT aa.*, u.full_name, u.email FROM assessment_attempts aa
       JOIN users u ON u.user_id = aa.student_id
       WHERE aa.assessment_id = $1 ORDER BY aa.submitted_at DESC NULLS LAST`,
      [assessmentId]
    );
    return rows;
  },

  async recordAnswer(attemptId, { questionId, response, isCorrect, pointsAwarded }) {
    const { rows } = await query(
      `INSERT INTO assessment_answers (attempt_id, question_id, response, is_correct, points_awarded)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [attemptId, questionId, response, isCorrect, pointsAwarded]
    );
    return rows[0];
  },

  async gradeAttempt(attemptId, { scorePct, pointsAwarded }) {
    const { rows } = await query(
      `UPDATE assessment_attempts SET status = 'graded', score_pct = $1, points_awarded = $2, graded_at = now(), submitted_at = COALESCE(submitted_at, now())
       WHERE attempt_id = $3 RETURNING *`,
      [scorePct, pointsAwarded, attemptId]
    );
    return rows[0];
  },

  async submitAttempt(attemptId) {
    const { rows } = await query(
      `UPDATE assessment_attempts SET status = 'submitted', submitted_at = now() WHERE attempt_id = $1 RETURNING *`,
      [attemptId]
    );
    return rows[0];
  },

  async answersForAttempt(attemptId) {
    const { rows } = await query(
      `SELECT aa.*, q.prompt, q.correct_answer, q.points AS max_points, q.clinical_step
       FROM assessment_answers aa JOIN assessment_questions q ON q.question_id = aa.question_id
       WHERE aa.attempt_id = $1`,
      [attemptId]
    );
    return rows;
  },
};
