import { query } from '../config/database.js';

export const Research = {
  async list({ status = 'published', category, uploadedBy, limit = 50, offset = 0 } = {}) {
    const conditions = [];
    const params = [];
    let i = 1;
    if (uploadedBy) {
      conditions.push(`uploaded_by = $${i++}`);
      params.push(uploadedBy);
    } else if (status) {
      conditions.push(`status = $${i++}`);
      params.push(status);
    }
    if (category) { conditions.push(`category = $${i++}`); params.push(category); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query(
      `SELECT * FROM research_items ${where} ORDER BY created_at DESC LIMIT $${i++} OFFSET $${i++}`,
      [...params, limit, offset]
    );
    return rows;
  },

  // Draft submissions from students, awaiting a teacher/admin's publish decision.
  async pending() {
    const { rows } = await query(
      `SELECT r.*, u.name AS student_name, u.email AS student_email
       FROM research_items r
       JOIN users u ON u.user_id = r.uploaded_by
       WHERE r.status = 'draft' AND u.role = 'student'
       ORDER BY r.created_at ASC`
    );
    return rows;
  },

  async findById(researchId) {
    const { rows } = await query(`SELECT * FROM research_items WHERE research_id = $1`, [researchId]);
    return rows[0] || null;
  },

  async create({ title, authors, abstract, category, publicationDate, externalUrl, uploadedBy }) {
    const { rows } = await query(
      `INSERT INTO research_items (title, authors, abstract, category, publication_date, external_url, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [title, authors || null, abstract || null, category || null, publicationDate || null, externalUrl || null, uploadedBy]
    );
    return rows[0];
  },

  async setFile(researchId, fileUrl) {
    const { rows } = await query(`UPDATE research_items SET file_url = $1 WHERE research_id = $2 RETURNING *`, [fileUrl, researchId]);
    return rows[0];
  },

  async setStatus(researchId, status) {
    const { rows } = await query(`UPDATE research_items SET status = $1 WHERE research_id = $2 RETURNING *`, [status, researchId]);
    return rows[0];
  },

  async incrementViews(researchId) {
    await query(`UPDATE research_items SET view_count = view_count + 1 WHERE research_id = $1`, [researchId]);
  },

  async delete(researchId) {
    await query(`DELETE FROM research_items WHERE research_id = $1`, [researchId]);
  },
};
