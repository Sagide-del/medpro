import { query } from '../config/database.js';

export const MedicalGraphic = {
  async list({ status = 'published', category, graphicType, limit = 50, offset = 0 } = {}) {
    const conditions = [];
    const params = [];
    let i = 1;
    if (status) { conditions.push(`status = $${i++}`); params.push(status); }
    if (category) { conditions.push(`category = $${i++}`); params.push(category); }
    if (graphicType) { conditions.push(`graphic_type = $${i++}`); params.push(graphicType); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query(
      `SELECT * FROM medical_graphics ${where} ORDER BY created_at DESC LIMIT $${i++} OFFSET $${i++}`,
      [...params, limit, offset]
    );
    return rows;
  },

  async findById(graphicId) {
    const { rows } = await query(`SELECT * FROM medical_graphics WHERE graphic_id = $1`, [graphicId]);
    return rows[0] || null;
  },

  async create({ title, description, category, graphicType, tags = [], price = 10, interactiveFeatures = {}, uploadedBy }) {
    const { rows } = await query(
      `INSERT INTO medical_graphics (title, description, category, graphic_type, tags, price, interactive_features, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [title, description || null, category || null, graphicType || null, tags, price, JSON.stringify(interactiveFeatures), uploadedBy]
    );
    return rows[0];
  },

  async setFiles(graphicId, { fileUrl, thumbnailUrl }) {
    const { rows } = await query(
      `UPDATE medical_graphics SET file_url = COALESCE($1, file_url), thumbnail_url = COALESCE($2, thumbnail_url) WHERE graphic_id = $3 RETURNING *`,
      [fileUrl || null, thumbnailUrl || null, graphicId]
    );
    return rows[0];
  },

  async setStatus(graphicId, status) {
    const { rows } = await query(`UPDATE medical_graphics SET status = $1 WHERE graphic_id = $2 RETURNING *`, [status, graphicId]);
    return rows[0];
  },

  async incrementViews(graphicId) {
    await query(`UPDATE medical_graphics SET view_count = view_count + 1 WHERE graphic_id = $1`, [graphicId]);
  },

  async incrementPurchases(graphicId) {
    await query(`UPDATE medical_graphics SET purchase_count = purchase_count + 1 WHERE graphic_id = $1`, [graphicId]);
  },

  async delete(graphicId) {
    await query(`DELETE FROM medical_graphics WHERE graphic_id = $1`, [graphicId]);
  },
};
