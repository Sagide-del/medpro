import { query } from '../config/database.js';

export const StudentNote = {
  async list(studentId) {
    const { rows } = await query(
      `SELECT id, title, body, topic, created_at, updated_at
       FROM student_notes WHERE student_id = $1 ORDER BY updated_at DESC`,
      [studentId]
    );
    return rows;
  },

  async create(studentId, { title, body, topic }) {
    const { rows } = await query(
      `INSERT INTO student_notes (student_id, title, body, topic)
       VALUES ($1, $2, $3, $4) RETURNING id, title, body, topic, created_at, updated_at`,
      [studentId, title, body, topic || null]
    );
    return rows[0];
  },

  async update(studentId, noteId, { title, body, topic }) {
    const { rows } = await query(
      `UPDATE student_notes SET title = $1, body = $2, topic = $3, updated_at = now()
       WHERE id = $4 AND student_id = $5
       RETURNING id, title, body, topic, created_at, updated_at`,
      [title, body, topic || null, noteId, studentId]
    );
    return rows[0] || null;
  },

  async delete(studentId, noteId) {
    const { rowCount } = await query('DELETE FROM student_notes WHERE id = $1 AND student_id = $2', [noteId, studentId]);
    return rowCount > 0;
  },
};
