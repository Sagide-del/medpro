import { query } from '../config/database.js';

export const Video = {
  async create({ studentId, title, description, skillCategory, fileUrl, thumbnailUrl }) {
    const { rows } = await query(
      `INSERT INTO videos (student_id, title, description, skill_category, file_url, thumbnail_url)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [studentId, title, description || null, skillCategory || null, fileUrl, thumbnailUrl || null]
    );
    return rows[0];
  },

  async listForStudent(studentId) {
    const { rows } = await query(`SELECT * FROM videos WHERE student_id = $1 ORDER BY uploaded_at DESC`, [studentId]);
    return rows;
  },

  async listPendingReview({ institutionId } = {}) {
    const params = [];
    let where = `WHERE v.status = 'submitted'`;
    if (institutionId) { where += ` AND u.institution_id = $1`; params.push(institutionId); }
    const { rows } = await query(
      `SELECT v.*, u.full_name AS student_name, u.email AS student_email
       FROM videos v JOIN users u ON u.user_id = v.student_id
       ${where} ORDER BY v.uploaded_at ASC`,
      params
    );
    return rows;
  },

  async findById(videoId) {
    const { rows } = await query(`SELECT * FROM videos WHERE video_id = $1`, [videoId]);
    return rows[0] || null;
  },

  async review(videoId, reviewerId, { status, reviewNotes }) {
    const { rows } = await query(
      `UPDATE videos SET status = $1, review_notes = $2, reviewed_by = $3, reviewed_at = now()
       WHERE video_id = $4 RETURNING *`,
      [status, reviewNotes || null, reviewerId, videoId]
    );
    return rows[0];
  },

  async delete(videoId) {
    await query(`DELETE FROM videos WHERE video_id = $1`, [videoId]);
  },
};
