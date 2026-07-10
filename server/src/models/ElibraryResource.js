import { query } from '../config/database.js';

export const ElibraryResource = {
  async list({ status = 'published', category, limit = 50, offset = 0 } = {}) {
    const conditions = [];
    const params = [];
    let i = 1;
    if (status) { conditions.push(`status = $${i++}`); params.push(status); }
    if (category) { conditions.push(`category = $${i++}`); params.push(category); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query(
      `SELECT * FROM elibrary_resources ${where} ORDER BY created_at DESC LIMIT $${i++} OFFSET $${i++}`,
      [...params, limit, offset]
    );
    return rows;
  },

  async findById(resourceId) {
    const { rows } = await query(`SELECT * FROM elibrary_resources WHERE resource_id = $1`, [resourceId]);
    return rows[0] || null;
  },

  async create({ title, description, category, author, price = 20, isPremium = true, uploadedBy }) {
    const { rows } = await query(
      `INSERT INTO elibrary_resources (title, description, category, author, price, is_premium, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [title, description || null, category || null, author || null, price, isPremium, uploadedBy]
    );
    return rows[0];
  },

  async setFiles(resourceId, { fileUrl, thumbnailUrl }) {
    const { rows } = await query(
      `UPDATE elibrary_resources SET file_url = COALESCE($1, file_url), thumbnail_url = COALESCE($2, thumbnail_url) WHERE resource_id = $3 RETURNING *`,
      [fileUrl || null, thumbnailUrl || null, resourceId]
    );
    return rows[0];
  },

  async setStatus(resourceId, status) {
    const { rows } = await query(`UPDATE elibrary_resources SET status = $1 WHERE resource_id = $2 RETURNING *`, [status, resourceId]);
    return rows[0];
  },

  async incrementDownloads(resourceId) {
    await query(`UPDATE elibrary_resources SET download_count = download_count + 1 WHERE resource_id = $1`, [resourceId]);
  },

  // Payment flow reuses `incrementPurchases` naming, alias it to downloads for e-library
  async incrementPurchases(resourceId) {
    await this.incrementDownloads(resourceId);
  },

  async delete(resourceId) {
    await query(`DELETE FROM elibrary_resources WHERE resource_id = $1`, [resourceId]);
  },
};
