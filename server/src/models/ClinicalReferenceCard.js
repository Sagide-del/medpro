import { query, withTransaction } from '../config/database.js';

function cleanCategory(category, fallback = '') {
  const value = String(category || fallback || '').trim();
  return value;
}

function effectiveImageUrl(row) {
  return row?.image_url || row?.file_url || row?.thumbnail_url || null;
}

function buildListQuery({ user, status, category, search, limit = 100, offset = 0 }) {
  const conditions = [];
  const params = [];
  let i = 1;

  if (category) {
    conditions.push(`COALESCE(NULLIF(crc.category, ''), NULLIF(crc.module, '')) = $${i++}`);
    params.push(category);
  }

  if (search) {
    conditions.push(`(
      crc.title ILIKE $${i}
      OR COALESCE(crc.category, '') ILIKE $${i}
      OR COALESCE(crc.module, '') ILIKE $${i}
      OR COALESCE(crc.topic, '') ILIKE $${i}
      OR COALESCE(crc.skill, '') ILIKE $${i}
    )`);
    params.push(`%${search}%`);
    i += 1;
  }

  if (status === 'published') {
    conditions.push('crc.is_active = true');
  } else if (status === 'draft') {
    conditions.push('crc.is_active = false');
  }

  if (user.role === 'student' || user.role === 'teacher') {
    conditions.push('crc.is_active = true');
  }

  if (user.role === 'student' || user.role === 'teacher' || user.role === 'institution_admin') {
    conditions.push(`(crc.institution_id IS NULL OR crc.institution_id = $${i++})`);
    params.push(user.institutionId || null);
  }

  return { conditions, params, nextIndex: i, limit, offset };
}

function rowToCard(row) {
  return {
    ...row,
    category: cleanCategory(row.category, row.module),
    image_url: effectiveImageUrl(row),
    file_url: effectiveImageUrl(row),
    is_active: row.is_active !== false,
  };
}

export const ClinicalReferenceCard = {
  async list(options = {}) {
    const { conditions, params, nextIndex, limit, offset } = buildListQuery(options);
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query(
      `SELECT crc.*,
              COALESCE(NULLIF(crc.category, ''), NULLIF(crc.module, '')) AS effective_category,
              COALESCE(crc.image_url, crc.file_url, mg.file_url) AS image_url,
              COALESCE(crc.image_url, crc.file_url, mg.file_url) AS file_url,
              mg.price,
              mg.thumbnail_url,
              mg.view_count,
              mg.purchase_count,
              creator.full_name AS created_by_name,
              inst.name AS institution_name
       FROM clinical_reference_cards crc
       LEFT JOIN medical_graphics mg ON mg.graphic_id = crc.graphic_id
       LEFT JOIN users creator ON creator.user_id = crc.created_by
       LEFT JOIN institutions inst ON inst.institution_id = crc.institution_id
       ${where}
       ORDER BY COALESCE(NULLIF(crc.category, ''), NULLIF(crc.module, '')), crc.title ASC, crc.created_at DESC
       LIMIT $${nextIndex} OFFSET $${nextIndex + 1}`,
      [...params, limit, offset]
    );
    return rows.map(rowToCard);
  },

  async findById(clinicalCardId) {
    const { rows } = await query(
      `SELECT crc.*,
              COALESCE(NULLIF(crc.category, ''), NULLIF(crc.module, '')) AS effective_category,
              COALESCE(crc.image_url, crc.file_url, mg.file_url) AS image_url,
              COALESCE(crc.image_url, crc.file_url, mg.file_url) AS file_url,
              mg.price,
              mg.thumbnail_url,
              mg.view_count,
              mg.purchase_count,
              creator.full_name AS created_by_name,
              inst.name AS institution_name
       FROM clinical_reference_cards crc
       LEFT JOIN medical_graphics mg ON mg.graphic_id = crc.graphic_id
       LEFT JOIN users creator ON creator.user_id = crc.created_by
       LEFT JOIN institutions inst ON inst.institution_id = crc.institution_id
       WHERE crc.clinical_card_id = $1 OR crc.id = $1`,
      [clinicalCardId]
    );
    return rows[0] ? rowToCard(rows[0]) : null;
  },

  async create({
    title,
    category,
    difficulty = 'intermediate',
    imageUrl = null,
    isActive = true,
    institutionId,
    createdBy,
    program = 'EMT',
    module = '',
    topic = '',
    skill = '',
    description = null,
  }) {
    return withTransaction(async (tx) => {
      const resolvedCategory = cleanCategory(category, module);
      const status = isActive ? 'published' : 'draft';
      const { rows: graphics } = await tx.query(
        `INSERT INTO medical_graphics (title, description, category, graphic_type, tags, price, file_url, thumbnail_url, status, uploaded_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING graphic_id`,
        [
          title,
          description || null,
          resolvedCategory || null,
          'Clinical Reference Card',
          [resolvedCategory].filter(Boolean),
          0,
          imageUrl || null,
          imageUrl || null,
          status,
          createdBy,
        ]
      );

      const graphicId = graphics[0]?.graphic_id || null;
      const { rows: cards } = await tx.query(
        `INSERT INTO clinical_reference_cards
         (graphic_id, institution_id, title, category, difficulty, image_url, file_url, file_kind, program, module, topic, skill, description, is_active, status, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'image',$8,$9,$10,$11,$12,$13,$14,$15)
         RETURNING *`,
        [
          graphicId,
          institutionId || null,
          title,
          resolvedCategory || null,
          difficulty,
          imageUrl || null,
          imageUrl || null,
          program,
          module || '',
          topic || '',
          skill || '',
          description || null,
          isActive,
          status,
          createdBy,
        ]
      );

      return rowToCard(cards[0]);
    });
  },

  async update(clinicalCardId, fields) {
    return withTransaction(async (tx) => {
      const current = await this.findById(clinicalCardId);
      if (!current) return null;

      const allowedCardFields = [
        'title',
        'category',
        'difficulty',
        'description',
        'program',
        'module',
        'topic',
        'skill',
        'institution_id',
        'status',
        'image_url',
        'file_url',
        'file_kind',
        'is_active',
      ];

      const cardSets = [];
      const cardParams = [];
      let i = 1;

      for (const [key, value] of Object.entries(fields)) {
        if (allowedCardFields.includes(key) && value !== undefined) {
          cardSets.push(`${key} = $${i++}`);
          cardParams.push(value);
        }
      }

      if (cardSets.length) {
        cardParams.push(clinicalCardId);
        await tx.query(
          `UPDATE clinical_reference_cards SET ${cardSets.join(', ')} WHERE clinical_card_id = $${i}`,
          cardParams
        );
      }

      const nextTitle = fields.title ?? current.title;
      const nextDescription = fields.description ?? current.description;
      const nextCategory = cleanCategory(fields.category, fields.module ?? current.category ?? current.module);
      const nextStatus = fields.status ?? (Object.prototype.hasOwnProperty.call(fields, 'is_active') ? (fields.is_active ? 'published' : 'draft') : current.status);
      const nextImageUrl = fields.image_url ?? fields.file_url ?? current.image_url ?? current.file_url;

      await tx.query(
        `UPDATE medical_graphics
         SET title = $1,
             description = $2,
             category = $3,
             tags = $4,
             status = $5,
             file_url = $6,
             thumbnail_url = $7
         WHERE graphic_id = $8`,
        [
          nextTitle,
          nextDescription,
          nextCategory || null,
          [nextCategory].filter(Boolean),
          nextStatus,
          nextImageUrl || null,
          nextImageUrl || null,
          current.graphic_id,
        ]
      );

      return this.findById(clinicalCardId);
    });
  },

  async setFile(clinicalCardId, { fileUrl, fileKind, thumbnailUrl = null }) {
    return this.update(clinicalCardId, {
      image_url: fileUrl,
      file_url: fileUrl,
      file_kind: fileKind,
      thumbnail_url: thumbnailUrl,
    });
  },

  async delete(clinicalCardId) {
    return withTransaction(async (tx) => {
      const current = await this.findById(clinicalCardId);
      if (!current) return;
      await tx.query('DELETE FROM medical_graphics WHERE graphic_id = $1', [current.graphic_id]);
    });
  },
};
