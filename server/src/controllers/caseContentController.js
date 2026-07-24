import { query, withTransaction } from '../config/database.js';
import { asyncHandler } from '../utils/helpers.js';

const ALLOWED_BLOCK_TYPES = new Set([
  'heading',
  'paragraph',
  'statistics_table',
  'information_box',
  'patient_table',
  'question_block',
  'response_table',
  'reflection_block',
  'instruction_block',
  'dispatch',
  'table',
  'question',
  'response_field',
  'reflection',
]);

function unwrapCasePayload(body = {}) {
  if (body.case_json && typeof body.case_json === 'object') return body.case_json;
  if (body.content_json && typeof body.content_json === 'object') return body;
  if (body.caseStudy && typeof body.caseStudy === 'object') return body.caseStudy;
  return body;
}

function normalizeBlocks(blocks = []) {
  return blocks.map((block, index) => ({
    id: String(block.id || `block-${index + 1}`),
    type: String(block.type || 'paragraph'),
    level: block.level,
    text: block.text || block.content || '',
    title: block.title || '',
    headers: Array.isArray(block.headers) ? block.headers : [],
    rows: Array.isArray(block.rows) ? block.rows : [],
    options: Array.isArray(block.options) ? block.options : [],
    fields: Array.isArray(block.fields) ? block.fields : [],
    phase: block.phase || null,
    input_type: block.input_type || block.response_type || (block.type === 'multiple_choice' ? 'multiple_choice' : 'text'),
    grading: block.grading || {},
  }));
}

function validateCasePayload(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object') {
    return ['A JSON object is required.'];
  }

  if (!String(payload.title || '').trim()) errors.push('title is required');
  if (!String(payload.category || '').trim()) errors.push('category is required');
  if (!String(payload.difficulty || '').trim()) errors.push('difficulty is required');

  const contentJson = payload.content_json && typeof payload.content_json === 'object'
    ? payload.content_json
    : payload;
  const blocks = Array.isArray(contentJson.blocks) ? contentJson.blocks : [];
  if (blocks.length === 0) errors.push('content_json.blocks must contain at least one block');

  const gradingJson = payload.grading_json && typeof payload.grading_json === 'object'
    ? payload.grading_json
    : {};
  const gradingMap = gradingJson.blocks || {};

  blocks.forEach((block, index) => {
    if (!String(block.type || '').trim()) {
      errors.push(`blocks[${index}].type is required`);
      return;
    }
    if (!ALLOWED_BLOCK_TYPES.has(String(block.type))) {
      errors.push(`blocks[${index}].type "${block.type}" is not supported`);
    }
    if (!String(block.id || '').trim()) {
      errors.push(`blocks[${index}].id is required`);
    }

    const isInteractive = ['question_block', 'response_table', 'reflection_block', 'question', 'response_field', 'reflection'].includes(String(block.type));
    if (isInteractive) {
      const grading = block.grading || gradingMap[block.id] || {};
      if (!Number(grading.points || 0)) {
        errors.push(`blocks[${index}] (${block.id || block.type}) is missing grading points`);
      }
    }
  });

  return errors;
}

function normalizePayload(rawPayload, userId) {
  const payload = unwrapCasePayload(rawPayload);
  const contentJson = payload.content_json && typeof payload.content_json === 'object'
    ? payload.content_json
    : {
        ...payload,
        blocks: Array.isArray(payload.blocks) ? normalizeBlocks(payload.blocks) : [],
      };

  const gradingJson = payload.grading_json && typeof payload.grading_json === 'object'
    ? payload.grading_json
    : {
        total_points: Number(payload.total_points || contentJson.total_points || 0),
        passing_percentage: Number(payload.passing_percentage || contentJson.passing_percentage || 80),
        blocks: Array.isArray(contentJson.blocks)
          ? contentJson.blocks.reduce((acc, block) => {
              if (block.grading) acc[block.id] = block.grading;
              return acc;
            }, {})
          : {},
      };

  return {
    id: payload.id || null,
    title: String(payload.title || '').trim(),
    category: String(payload.category || '').trim(),
    difficulty: String(payload.difficulty || 'intermediate').trim(),
    content_json: {
      ...contentJson,
      blocks: normalizeBlocks(contentJson.blocks || []),
    },
    grading_json: gradingJson,
    passing_percentage: Number(payload.passing_percentage || gradingJson.passing_percentage || 80),
    is_active: Boolean(payload.is_active),
    order_number: Number.isFinite(Number(payload.order_number)) ? Number(payload.order_number) : null,
    created_by: userId,
  };
}

function caseRow(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    difficulty: row.difficulty,
    content_json: row.content_json || {},
    grading_json: row.grading_json || {},
    passing_percentage: row.passing_percentage,
    is_active: row.is_active,
    created_by: row.created_by,
    created_by_name: row.created_by_name || null,
    order_number: row.order_number,
    created_at: row.created_at,
    updated_at: row.updated_at || null,
  };
}

export const listCases = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT cs.*,
            creator.full_name AS created_by_name
     FROM case_studies cs
     LEFT JOIN users creator ON creator.user_id = cs.created_by
     ORDER BY COALESCE(cs.order_number, 9999) ASC, cs.created_at DESC`
  );
  res.json({ cases: rows.map(caseRow) });
});

export const uploadCase = asyncHandler(async (req, res) => {
  const payload = normalizePayload(req.body, req.user.sub);
  const errors = validateCasePayload(payload);
  if (errors.length) {
    return res.status(400).json({ error: 'Invalid case JSON.', details: errors });
  }

  const rows = await withTransaction(async (db) => {
    const insertOrder = Number.isFinite(payload.order_number)
      ? payload.order_number
      : await db.query(`SELECT COALESCE(MAX(order_number), 0) + 1 AS next_order FROM case_studies WHERE is_active = true`).then((result) => Number(result.rows[0]?.next_order || 1));

    const insertPayload = [
      payload.id,
      payload.title,
      payload.category,
      payload.difficulty,
      JSON.stringify(payload.content_json),
      JSON.stringify(payload.grading_json),
      payload.passing_percentage,
      payload.is_active,
      payload.created_by,
      insertOrder,
    ];

    const { rows: inserted } = await db.query(
      `INSERT INTO case_studies (
         id,
         title,
         category,
         difficulty,
         content_json,
         grading_json,
         passing_percentage,
         is_active,
         created_by,
         order_number
       )
       VALUES (COALESCE($1, gen_random_uuid()), $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         category = EXCLUDED.category,
         difficulty = EXCLUDED.difficulty,
         content_json = EXCLUDED.content_json,
         grading_json = EXCLUDED.grading_json,
         passing_percentage = EXCLUDED.passing_percentage,
         is_active = EXCLUDED.is_active,
         created_by = EXCLUDED.created_by,
         order_number = EXCLUDED.order_number
       RETURNING *`,
      insertPayload
    );
    return inserted;
  });

  res.status(201).json({
    caseStudy: caseRow(rows[0]),
    preview: rows[0]?.content_json || payload.content_json,
  });
});

export const updateCase = asyncHandler(async (req, res) => {
  const payload = normalizePayload(req.body, req.user.sub);
  const errors = validateCasePayload({ ...payload, content_json: payload.content_json, grading_json: payload.grading_json });
  if (errors.length) {
    return res.status(400).json({ error: 'Invalid case JSON.', details: errors });
  }

  const rows = await withTransaction(async (db) => {
    const { rows: currentRows } = await db.query(
      `SELECT * FROM case_studies WHERE id = $1 LIMIT 1`,
      [req.params.id]
    );
    if (!currentRows[0]) return [];

    const current = currentRows[0];
    const nextOrder = Number.isFinite(payload.order_number) ? payload.order_number : current.order_number;
    const nextActive = Object.prototype.hasOwnProperty.call(req.body, 'is_active') ? Boolean(req.body.is_active) : current.is_active;

    const { rows: updated } = await db.query(
      `UPDATE case_studies
       SET title = $1,
           category = $2,
           difficulty = $3,
           content_json = $4::jsonb,
           grading_json = $5::jsonb,
           passing_percentage = $6,
           is_active = $7,
           created_by = $8,
           order_number = $9
       WHERE id = $10
       RETURNING *`,
      [
        payload.title,
        payload.category,
        payload.difficulty,
        JSON.stringify(payload.content_json),
        JSON.stringify(payload.grading_json),
        payload.passing_percentage,
        nextActive,
        payload.created_by,
        nextOrder,
        req.params.id,
      ]
    );
    return updated;
  });

  if (!rows[0]) return res.status(404).json({ error: 'Case not found.' });
  res.json({ caseStudy: caseRow(rows[0]) });
});

export const deleteCase = asyncHandler(async (req, res) => {
  const { rowCount } = await query(`DELETE FROM case_studies WHERE id = $1`, [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Case not found.' });
  res.json({ deleted: true });
});
