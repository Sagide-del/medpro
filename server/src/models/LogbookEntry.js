import { query } from '../config/database.js';

export const LogbookEntry = {
  async create({ logbookId, studentId, patientScenario, skillsPerformed = [], reflection, fileUrl }) {
    const { rows } = await query(
      `INSERT INTO logbook_entries (logbook_id, student_id, patient_scenario, skills_performed, reflection, file_url)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [logbookId, studentId, patientScenario, skillsPerformed, reflection || null, fileUrl || null]
    );
    return rows[0];
  },

  async listForStudent(studentId) {
    const { rows } = await query(`SELECT * FROM logbook_entries WHERE student_id = $1 ORDER BY submitted_at DESC`, [studentId]);
    return rows;
  },

  async listPendingReview({ institutionId } = {}) {
    const params = [];
    let where = `WHERE e.status = 'submitted'`;
    if (institutionId) { where += ` AND u.institution_id = $1`; params.push(institutionId); }
    const { rows } = await query(
      `SELECT e.*, u.full_name AS student_name, u.email AS student_email
       FROM logbook_entries e JOIN users u ON u.user_id = e.student_id
       ${where} ORDER BY e.submitted_at ASC`,
      params
    );
    return rows;
  },

  async findById(entryId) {
    const { rows } = await query(`SELECT * FROM logbook_entries WHERE entry_id = $1`, [entryId]);
    return rows[0] || null;
  },

  async review(entryId, reviewerId, { status, reviewNotes }) {
    const { rows } = await query(
      `UPDATE logbook_entries SET status = $1, review_notes = $2, reviewed_by = $3, reviewed_at = now()
       WHERE entry_id = $4 RETURNING *`,
      [status, reviewNotes || null, reviewerId, entryId]
    );
    return rows[0];
  },
};
