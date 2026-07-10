import { query, withTransaction } from '../config/database.js';

export const Worksheet = {
  async list({ status = 'published', category, limit = 50, offset = 0 } = {}) {
    const conditions = [];
    const params = [];
    let i = 1;
    if (status) { conditions.push(`status = $${i++}`); params.push(status); }
    if (category) { conditions.push(`category = $${i++}`); params.push(category); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query(
      `SELECT * FROM worksheets ${where} ORDER BY created_at DESC LIMIT $${i++} OFFSET $${i++}`,
      [...params, limit, offset]
    );
    return rows;
  },

  async findById(worksheetId) {
    const { rows } = await query(`SELECT * FROM worksheets WHERE worksheet_id = $1`, [worksheetId]);
    return rows[0] || null;
  },

  async questions(worksheetId) {
    const { rows } = await query(`SELECT * FROM worksheet_questions WHERE worksheet_id = $1 ORDER BY position`, [worksheetId]);
    return rows;
  },

  async create({ title, description, category, difficulty, bloomLevel, price = 10, timeLimitMinutes, passingScorePct, uploadedBy }, questions = []) {
    return withTransaction(async (tx) => {
      const totalPoints = questions.reduce((sum, q) => sum + (q.points || 5), 0);
      const { rows } = await tx.query(
        `INSERT INTO worksheets (title, description, category, difficulty, bloom_level, price, time_limit_minutes, total_points, passing_score_pct, uploaded_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [title, description || null, category || null, difficulty || 'intermediate', bloomLevel || null, price,
         timeLimitMinutes || null, totalPoints, passingScorePct || 70, uploadedBy]
      );
      const worksheet = rows[0];
      let position = 0;
      for (const q of questions) {
        await tx.query(
          `INSERT INTO worksheet_questions (worksheet_id, question_type, prompt, correct_answer, options, points, position)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [worksheet.worksheet_id, q.questionType || 'short_answer', q.prompt, q.correctAnswer || null,
           q.options ? JSON.stringify(q.options) : null, q.points || 5, position++]
        );
      }
      return worksheet;
    });
  },

  async setStatus(worksheetId, status) {
    const { rows } = await query(`UPDATE worksheets SET status = $1 WHERE worksheet_id = $2 RETURNING *`, [status, worksheetId]);
    return rows[0];
  },

  async setFileUrl(worksheetId, fileUrl) {
    const { rows } = await query(`UPDATE worksheets SET file_url = $1 WHERE worksheet_id = $2 RETURNING *`, [fileUrl, worksheetId]);
    return rows[0];
  },

  async incrementPurchases(worksheetId) {
    await query(`UPDATE worksheets SET purchase_count = purchase_count + 1 WHERE worksheet_id = $1`, [worksheetId]);
  },

  async delete(worksheetId) {
    await query(`DELETE FROM worksheets WHERE worksheet_id = $1`, [worksheetId]);
  },

  async submit(worksheetId, studentId, answers) {
    const { rows } = await query(
      `INSERT INTO worksheet_submissions (worksheet_id, student_id, answers) VALUES ($1,$2,$3) RETURNING *`,
      [worksheetId, studentId, JSON.stringify(answers)]
    );
    return rows[0];
  },

  async gradeSubmission(submissionId, scorePct) {
    const { rows } = await query(
      `UPDATE worksheet_submissions SET score_pct = $1, graded_at = now() WHERE submission_id = $2 RETURNING *`,
      [scorePct, submissionId]
    );
    return rows[0];
  },

  async submissionsForStudent(studentId) {
    const { rows } = await query(
      `SELECT ws.*, w.title FROM worksheet_submissions ws JOIN worksheets w ON w.worksheet_id = ws.worksheet_id
       WHERE ws.student_id = $1 ORDER BY ws.submitted_at DESC`,
      [studentId]
    );
    return rows;
  },

  async submissionsForWorksheet(worksheetId) {
    const { rows } = await query(
      `SELECT ws.*, u.full_name, u.email FROM worksheet_submissions ws JOIN users u ON u.user_id = ws.student_id
       WHERE ws.worksheet_id = $1 ORDER BY ws.submitted_at DESC`,
      [worksheetId]
    );
    return rows;
  },
};
