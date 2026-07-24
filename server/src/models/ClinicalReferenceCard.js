import { query } from '../config/database.js';

function rowToCard(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    difficulty: row.difficulty,
    file_url: row.file_url,
    file_type: row.file_type,
    institution_id: row.institution_id,
    is_active: row.is_active !== false,
    created_at: row.created_at,
    updated_at: row.updated_at,
    clinical_card_id: row.id,
  };
}

function buildListQuery({ user, status, category, search, institutionId, limit = 100, offset = 0 }) {
  const conditions = [];
  const params = [];
  let i = 1;

  if (category) {
    conditions.push(`crc.category = $${i++}`);
    params.push(category);
  }

  if (search) {
    conditions.push(`(
      crc.title ILIKE $${i}
      OR crc.category ILIKE $${i}
      OR COALESCE(crc.difficulty, '') ILIKE $${i}
    )`);
    params.push(`%${search}%`);
    i += 1;
  }

  if (status === 'published' || status === true) {
    conditions.push('crc.is_active = true');
  } else if (status === 'draft' || status === false) {
    conditions.push('crc.is_active = false');
  }

  if (user.role === 'student' || user.role === 'teacher') {
    conditions.push('crc.is_active = true');
  }

  if (institutionId) {
    conditions.push(`crc.institution_id = $${i++}::uuid`);
    params.push(institutionId);
  }

  return { conditions, params, nextIndex: i, limit, offset };
}

export const ClinicalReferenceCard = {
  async list(options = {}) {
    const { conditions, params, nextIndex, limit, offset } = buildListQuery(options);
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query(
      `SELECT
         crc.id,
         crc.title,
         crc.category,
         crc.difficulty,
         crc.file_url,
         crc.file_type,
         crc.institution_id,
         crc.is_active,
         crc.created_at,
         crc.updated_at
       FROM clinical_reference_cards crc
       ${where}
       ORDER BY crc.created_at DESC
       LIMIT $${nextIndex} OFFSET $${nextIndex + 1}`,
      [...params, limit, offset]
    );
    return rows.map(rowToCard);
  },

  async findById(cardId) {
    const { rows } = await query(
      `SELECT
         crc.id,
         crc.title,
         crc.category,
         crc.difficulty,
         crc.file_url,
         crc.file_type,
         crc.institution_id,
         crc.is_active,
         crc.created_at,
         crc.updated_at
       FROM clinical_reference_cards crc
       WHERE crc.id = $1`,
      [cardId]
    );
    return rowToCard(rows[0] || null);
  },

  async create({ title, category, difficulty = 'intermediate', fileUrl, fileType = 'pdf', institutionId = null, isActive = true }) {
    const { rows } = await query(
      `INSERT INTO clinical_reference_cards
       (title, category, difficulty, file_url, file_type, institution_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6::uuid, $7)
       RETURNING id, title, category, difficulty, file_url, file_type, institution_id, is_active, created_at, updated_at`,
      [title, category, difficulty || null, fileUrl, fileType || 'pdf', institutionId || null, isActive]
    );
    return rowToCard(rows[0]);
  },

  async update(cardId, fields) {
    const current = await this.findById(cardId);
    if (!current) return null;

    const allowedFields = ['title', 'category', 'difficulty', 'file_url', 'file_type', 'institution_id', 'is_active'];
    const sets = [];
    const params = [];
    let i = 1;

    for (const [key, value] of Object.entries(fields)) {
      if (allowedFields.includes(key) && value !== undefined) {
        sets.push(key === 'institution_id' ? `${key} = $${i++}::uuid` : `${key} = $${i++}`);
        params.push(value);
      }
    }

    if (!sets.length) return current;

    params.push(cardId);
    const { rows } = await query(
      `UPDATE clinical_reference_cards
       SET ${sets.join(', ')},
           updated_at = now()
       WHERE id = $${i}
       RETURNING id, title, category, difficulty, file_url, file_type, institution_id, is_active, created_at, updated_at`,
      params
    );
    return rowToCard(rows[0] || null);
  },

  async setFile(cardId, { fileUrl }) {
    return this.update(cardId, { file_url: fileUrl, file_type: 'pdf' });
  },

  async delete(cardId) {
    await query(`DELETE FROM clinical_reference_cards WHERE id = $1`, [cardId]);
  },
};
