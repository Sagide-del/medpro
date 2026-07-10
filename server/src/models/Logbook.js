import { query } from '../config/database.js';

export const Logbook = {
  async findOrCreateForStudent(studentId, { title = 'Clinical Logbook', requiredEntries = 20 } = {}) {
    const { rows } = await query(`SELECT * FROM logbooks WHERE student_id = $1 ORDER BY created_at DESC LIMIT 1`, [studentId]);
    if (rows[0]) return rows[0];
    const { rows: created } = await query(
      `INSERT INTO logbooks (student_id, title, required_entries) VALUES ($1,$2,$3) RETURNING *`,
      [studentId, title, requiredEntries]
    );
    return created[0];
  },

  async findById(logbookId) {
    const { rows } = await query(`SELECT * FROM logbooks WHERE logbook_id = $1`, [logbookId]);
    return rows[0] || null;
  },

  async progress(logbookId) {
    const { rows } = await query(
      `SELECT l.required_entries,
              COUNT(e.*) FILTER (WHERE e.status = 'approved')::int AS approved_count,
              COUNT(e.*)::int AS total_count
       FROM logbooks l LEFT JOIN logbook_entries e ON e.logbook_id = l.logbook_id
       WHERE l.logbook_id = $1 GROUP BY l.logbook_id, l.required_entries`,
      [logbookId]
    );
    return rows[0];
  },
};
