import { query, withTransaction } from '../config/database.js';

function buildListQuery({ user, status, program, module, topic, search, limit = 100, offset = 0 }) {
  const conditions = [];
  const params = [];
  let i = 1;

  if (status) {
    conditions.push(`crc.status = $${i++}`);
    params.push(status);
  }
  if (program) {
    conditions.push(`crc.program = $${i++}`);
    params.push(program);
  }
  if (module) {
    conditions.push(`crc.module = $${i++}`);
    params.push(module);
  }
  if (topic) {
    conditions.push(`crc.topic = $${i++}`);
    params.push(topic);
  }
  if (search) {
    conditions.push(`(
      crc.title ILIKE $${i}
      OR crc.module ILIKE $${i}
      OR crc.topic ILIKE $${i}
      OR crc.skill ILIKE $${i}
      OR COALESCE(crc.description, '') ILIKE $${i}
    )`);
    params.push(`%${search}%`);
    i++;
  }

  if (user.role === 'student') {
    conditions.push(`crc.status = 'published'`);
    conditions.push(`(crc.institution_id IS NULL OR crc.institution_id = $${i++})`);
    params.push(user.institutionId || null);
  } else if (user.role === 'teacher') {
    conditions.push(`crc.status = 'published'`);
    conditions.push(`(crc.institution_id IS NULL OR crc.institution_id = $${i++})`);
    params.push(user.institutionId || null);
    if (user.program) {
      conditions.push(`crc.program = $${i++}`);
      params.push(user.program);
    }
  } else if (user.role === 'institution_admin') {
    conditions.push(`crc.institution_id = $${i++}`);
    params.push(user.institutionId);
  }

  return { conditions, params, nextIndex: i, limit, offset };
}

export const ClinicalReferenceCard = {
  async list(options = {}) {
    const { conditions, params, nextIndex, limit, offset } = buildListQuery(options);
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query(
      `SELECT crc.*,
              mg.price,
              mg.thumbnail_url,
              mg.view_count,
              mg.purchase_count,
              creator.full_name AS created_by_name,
              inst.name AS institution_name
       FROM clinical_reference_cards crc
       JOIN medical_graphics mg ON mg.graphic_id = crc.graphic_id
       LEFT JOIN users creator ON creator.user_id = crc.created_by
       LEFT JOIN institutions inst ON inst.institution_id = crc.institution_id
       ${where}
       ORDER BY crc.created_at DESC
       LIMIT $${nextIndex} OFFSET $${nextIndex + 1}`,
      [...params, limit, offset]
    );
    return rows;
  },

  async findById(clinicalCardId) {
    const { rows } = await query(
      `SELECT crc.*,
              mg.price,
              mg.thumbnail_url,
              mg.view_count,
              mg.purchase_count,
              creator.full_name AS created_by_name,
              inst.name AS institution_name
       FROM clinical_reference_cards crc
       JOIN medical_graphics mg ON mg.graphic_id = crc.graphic_id
       LEFT JOIN users creator ON creator.user_id = crc.created_by
       LEFT JOIN institutions inst ON inst.institution_id = crc.institution_id
       WHERE crc.clinical_card_id = $1`,
      [clinicalCardId]
    );
    return rows[0] || null;
  },

  async create({ title, program, module, topic, skill, description, difficulty = 'intermediate', institutionId, createdBy }) {
    return withTransaction(async (tx) => {
      const { rows: graphics } = await tx.query(
        `INSERT INTO medical_graphics (title, description, category, graphic_type, tags, price, status, uploaded_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING graphic_id`,
        [title, description || null, module, 'Clinical Reference Card', [program, topic, skill], 10, 'draft', createdBy]
      );

      const { rows: cards } = await tx.query(
        `INSERT INTO clinical_reference_cards
         (graphic_id, institution_id, title, program, module, topic, skill, description, difficulty, status, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'draft',$10)
         RETURNING *`,
        [graphics[0].graphic_id, institutionId || null, title, program, module, topic, skill, description || null, difficulty, createdBy]
      );

      return cards[0];
    });
  },

  async update(clinicalCardId, fields) {
    return withTransaction(async (tx) => {
      const current = await this.findById(clinicalCardId);
      if (!current) return null;

      const cardSets = [];
      const cardParams = [];
      let i = 1;
      const allowedCardFields = ['title', 'program', 'module', 'topic', 'skill', 'description', 'difficulty', 'institution_id', 'status', 'file_url', 'file_kind'];

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

      const nextProgram = fields.program ?? current.program;
      const nextTopic = fields.topic ?? current.topic;
      const nextSkill = fields.skill ?? current.skill;
      const nextTitle = fields.title ?? current.title;
      const nextDescription = fields.description ?? current.description;
      const nextModule = fields.module ?? current.module;
      const nextStatus = fields.status ?? current.status;
      const nextThumbnail = fields.thumbnail_url ?? current.thumbnail_url;
      const nextFileUrl = fields.graphic_file_url ?? fields.file_url ?? current.file_url;

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
        [nextTitle, nextDescription, nextModule, [nextProgram, nextTopic, nextSkill], nextStatus, nextFileUrl, nextThumbnail, current.graphic_id]
      );

      return this.findById(clinicalCardId);
    });
  },

  async setFile(clinicalCardId, { fileUrl, fileKind, thumbnailUrl = null }) {
    return this.update(clinicalCardId, {
      file_url: fileUrl,
      file_kind: fileKind,
      graphic_file_url: fileUrl,
      thumbnail_url: thumbnailUrl,
    });
  },

  async delete(clinicalCardId) {
    return withTransaction(async (tx) => {
      const current = await this.findById(clinicalCardId);
      if (!current) return;
      await tx.query(`DELETE FROM medical_graphics WHERE graphic_id = $1`, [current.graphic_id]);
    });
  },
};
