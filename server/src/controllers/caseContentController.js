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
  'dispatch_box',
  'instruction',
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

function extractCaseCollection(body = {}) {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body.cases)) return body.cases;
  if (Array.isArray(body.kenya_ems_cases)) return body.kenya_ems_cases;
  return null;
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

function hasStructuredWorksheetContent(contentJson = {}) {
  return Boolean(
    Array.isArray(contentJson.blocks) && contentJson.blocks.length > 0
    || Array.isArray(contentJson.sections) && contentJson.sections.length > 0
    || contentJson.type === 'worksheet'
    || typeof contentJson.source_text === 'string' && contentJson.source_text.trim()
    || Array.isArray(contentJson.activities) && contentJson.activities.length > 0
    || contentJson.incident
    || contentJson.dispatch_information
    || contentJson.scene_assessment
    || contentJson.patient_information
    || contentJson.ems_response
    || contentJson.student_tasks
    || contentJson.evaluation
  );
}

function validateCasePayload(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object') {
    return ['A JSON object is required.'];
  }

  const caseNumber = Number(payload.case_number ?? payload.order_number);
  const passingScore = Number(payload.passing_score ?? payload.passing_percentage ?? payload.grading_json?.passing_percentage ?? payload.content_json?.evaluation?.passing_percentage);

  if (!Number.isFinite(caseNumber)) errors.push('case_number is required');
  if (!String(payload.title || '').trim()) errors.push('title is required');
  if (!String(payload.category || '').trim()) errors.push('category is required');
  if (!String(payload.difficulty || '').trim()) errors.push('difficulty is required');
  if (!Number.isFinite(passingScore)) errors.push('passing_score is required');

  const contentJson = payload.content_json && typeof payload.content_json === 'object'
    ? payload.content_json
    : payload;
  const blocks = Array.isArray(contentJson.sections)
    ? contentJson.sections
    : Array.isArray(contentJson.blocks)
      ? contentJson.blocks
      : [];
  if (!hasStructuredWorksheetContent(contentJson)) {
    errors.push('content_json must contain worksheet sections');
  }
  if (String(contentJson.type || '').toLowerCase() !== 'worksheet') {
    errors.push('content_json.type must be "worksheet"');
  }
  if (!Array.isArray(contentJson.sections) || contentJson.sections.length === 0) {
    errors.push('content_json.sections must contain at least one block');
  }

  const gradingJson = payload.grading_json && typeof payload.grading_json === 'object'
    ? payload.grading_json
    : {};

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
  });

  return errors;
}

function normalizeCaseEntry(rawCase, userId) {
  const payload = normalizePayload(rawCase, userId);
  const contentJson = payload.content_json || {};

  return {
    ...payload,
    case_number: Number.isFinite(Number(payload.case_number)) ? Number(payload.case_number) : Number(payload.order_number) || null,
    content_json: contentJson,
    grading_json: payload.grading_json || {},
    order_number: Number.isFinite(Number(payload.order_number)) ? Number(payload.order_number) : Number(payload.case_number) || null,
    passing_score: Number.isFinite(Number(payload.passing_score)) ? Number(payload.passing_score) : Number(payload.passing_percentage) || null,
  };
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
        total_points: Number(
          payload.total_points
          || contentJson.total_points
          || contentJson.evaluation?.total_points
          || 0
        ),
        passing_percentage: Number(
          payload.passing_percentage
          || contentJson.passing_percentage
          || contentJson.evaluation?.passing_percentage
          || 80
        ),
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
    location: String(payload.location || '').trim(),
    incident_date: String(payload.incident_date || '').trim(),
    category: String(payload.category || '').trim(),
    difficulty: String(payload.difficulty || 'intermediate').trim(),
    description: String(payload.description || '').trim(),
    content: payload.content && typeof payload.content === 'object'
      ? payload.content
      : contentJson,
    content_json: {
      ...contentJson,
      blocks: normalizeBlocks(contentJson.blocks || []),
    },
    grading_json: gradingJson,
    case_number: Number.isFinite(Number(payload.case_number ?? payload.order_number)) ? Number(payload.case_number ?? payload.order_number) : null,
    passing_score: Number.isFinite(Number(payload.passing_score ?? payload.passing_percentage ?? gradingJson.passing_percentage)) ? Number(payload.passing_score ?? payload.passing_percentage ?? gradingJson.passing_percentage) : null,
    passing_percentage: Number(payload.passing_percentage || payload.passing_score || gradingJson.passing_percentage || 80),
    is_active: Object.prototype.hasOwnProperty.call(payload, 'is_active')
      ? Boolean(payload.is_active)
      : Object.prototype.hasOwnProperty.call(payload, 'active')
        ? Boolean(payload.active)
        : false,
    order_number: Number.isFinite(Number(payload.order_number ?? payload.case_number)) ? Number(payload.order_number ?? payload.case_number) : null,
    created_by: userId,
  };
}

function caseRow(row) {
  return {
    id: row.id,
    title: row.title,
    location: row.location,
    incident_date: row.incident_date,
    category: row.category,
    difficulty: row.difficulty,
    description: row.description,
    content: row.content || {},
    content_json: row.content_json || {},
    grading_json: row.grading_json || {},
    passing_percentage: row.passing_percentage,
    passing_score: row.passing_score ?? row.passing_percentage,
    is_active: row.is_active,
    created_by: row.created_by,
    created_by_name: row.created_by_name || null,
    order_number: row.order_number,
    case_number: row.case_number ?? row.order_number,
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
  const cases = extractCaseCollection(req.body);
  const rawCases = cases || [req.body];
  const payloads = rawCases.map((item, index) => {
    const normalized = normalizeCaseEntry(item, req.user.sub);
    const errors = validateCasePayload(normalized);
    return { normalized, errors, index };
  });

  const allErrors = payloads.flatMap(({ errors, index, normalized }) => (
    errors.map((error) => `case ${index + 1}${normalized.title ? ` (${normalized.title})` : ''}: ${error}`)
  ));
  if (allErrors.length) {
    return res.status(400).json({ error: 'Invalid case JSON.', details: allErrors });
  }

  const rows = await withTransaction(async (db) => {
    const { rows: nextOrderRows } = await db.query(
      `SELECT COALESCE(MAX(order_number), 0) AS max_order FROM case_studies`
    );
    let nextOrder = Number(nextOrderRows[0]?.max_order || 0) + 1;
    const insertedRows = [];

    for (const { normalized } of payloads) {
      const insertOrder = Number.isFinite(normalized.order_number)
        ? normalized.order_number
        : nextOrder++;

      const { rows: inserted } = await db.query(
        `INSERT INTO case_studies (
           id,
           title,
           location,
           incident_date,
           category,
           difficulty,
           description,
           content,
           content_json,
           grading_json,
           passing_percentage,
           is_active,
           created_by,
           order_number
         )
         VALUES (COALESCE($1, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10, $11, $12, $13, $14)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           location = EXCLUDED.location,
           incident_date = EXCLUDED.incident_date,
           category = EXCLUDED.category,
           difficulty = EXCLUDED.difficulty,
           description = EXCLUDED.description,
           content = EXCLUDED.content,
           content_json = EXCLUDED.content_json,
           grading_json = EXCLUDED.grading_json,
           passing_percentage = EXCLUDED.passing_percentage,
           is_active = EXCLUDED.is_active,
           created_by = EXCLUDED.created_by,
           order_number = EXCLUDED.order_number
         RETURNING *`,
        [
          normalized.id,
          normalized.title,
          normalized.location,
          normalized.incident_date,
          normalized.category,
          normalized.difficulty,
          normalized.description,
          JSON.stringify(normalized.content),
          JSON.stringify(normalized.content_json),
          JSON.stringify(normalized.grading_json),
          normalized.passing_percentage,
          normalized.is_active,
          normalized.created_by,
          insertOrder,
        ]
      );
      insertedRows.push(...inserted);
    }

    return insertedRows;
  });

  res.status(201).json({
    cases: rows.map(caseRow),
    preview: rows[0]?.content_json || payloads[0]?.normalized?.content_json || {},
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
           location = $2,
           incident_date = $3,
           category = $4,
           difficulty = $5,
           description = $6,
           content = $7::jsonb,
           content_json = $8::jsonb,
           grading_json = $9::jsonb,
           passing_percentage = $10,
           is_active = $11,
           created_by = $12,
           order_number = $13
       WHERE id = $14
       RETURNING *`,
      [
        payload.title,
        payload.location,
        payload.incident_date,
        payload.category,
        payload.difficulty,
        payload.description,
        JSON.stringify(payload.content),
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
