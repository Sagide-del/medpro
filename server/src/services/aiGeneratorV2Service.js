import { randomUUID } from 'crypto';
import { query, withTransaction } from '../config/database.js';

// V2 is the durable path. Set the variable to "false" for an emergency rollback.
export const AI_GENERATOR_V2_ENABLED = process.env.AI_GENERATOR_V2_ENABLED !== 'false';

function expiresAt() {
  return new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
}

export async function createPersistentJob({ id = randomUUID(), adminId, contentType, title, request, source }) {
  const { rows } = await query(
    `INSERT INTO ai_generation_jobs
      (id, admin_id, content_type, title, request_json, source_type, source_url, source_excerpt, citation, kenya_specific, county, historical_year, extended_processing, expires_at)
     VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING *`,
    [id, adminId, contentType, title, JSON.stringify(request || {}), source?.type || null, source?.url || null, source?.excerpt || null, source?.citation || null, !!request?.kenyaSpecific, request?.county || null, request?.historicalYear || null, !!request?.extendedProcessing, expiresAt()]
  );
  return rows[0];
}

export async function updatePersistentJob(id, patch = {}) {
  const fields = [];
  const values = [];
  let index = 1;
  for (const [key, value] of Object.entries(patch)) {
    const column = { status: 'status', result: 'result_json', title: 'title', contentType: 'content_type' }[key];
    if (!column || value === undefined) continue;
    fields.push(`${column} = $${index++}${column.endsWith('_json') ? '::jsonb' : ''}`);
    values.push(column.endsWith('_json') ? JSON.stringify(value || {}) : value);
  }
  if (!fields.length) return getPersistentJob(id);
  values.push(id);
  const { rows } = await query(`UPDATE ai_generation_jobs SET ${fields.join(', ')}, updated_at = now() WHERE id = $${index} RETURNING *`, values);
  return rows[0] || null;
}

export async function getPersistentJob(id, adminId) {
  const params = [id];
  const owner = adminId ? ' AND admin_id = $2' : '';
  if (adminId) params.push(adminId);
  const { rows } = await query(`SELECT * FROM ai_generation_jobs WHERE id = $1${owner} AND expires_at > now()`, params);
  return rows[0] || null;
}

export async function listPersistentJobs(adminId) {
  const { rows } = await query(
    `SELECT j.*, u.full_name AS admin_name,
            COUNT(r.id)::int AS review_count,
            COUNT(r.id) FILTER (WHERE r.decision = 'approved')::int AS approved_count
     FROM ai_generation_jobs j
     JOIN users u ON u.user_id = j.admin_id
     LEFT JOIN ai_review_decisions r ON r.job_id = j.id
     WHERE j.expires_at > now() AND ($1::uuid IS NULL OR j.admin_id = $1::uuid)
     GROUP BY j.id, u.full_name
     ORDER BY j.created_at DESC`,
    [adminId || null]
  );
  return rows;
}

export async function listMasterContent({ contentType, status } = {}) {
  const values = [];
  const filters = [];
  if (contentType) { values.push(contentType); filters.push(`p.content_type = $${values.length}`); }
  if (status) { values.push(status); filters.push(`p.status = $${values.length}`); }
  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const { rows } = await query(`
    SELECT p.id, p.title, p.content_type, p.destination_key, p.program, p.topic, p.source_citation,
           p.status, p.published_at, p.created_at, u.full_name AS published_by_name
    FROM ai_published_content p
    LEFT JOIN users u ON u.user_id = p.created_by
    ${where}
    ORDER BY p.published_at DESC NULLS LAST, p.created_at DESC`, values);
  return rows;
}

export async function saveReviewDecisions(jobId, adminId, decisions = [], items = []) {
  return withTransaction(async (tx) => {
    const itemIds = new Set(items.map((item) => String(item.id)));
    for (const item of decisions) {
      if (items.length && !itemIds.has(String(item.itemId))) {
        throw new Error(`Review item ${item.itemId} does not belong to this generation job.`);
      }
      if (!['approved', 'rejected', 'needs_review'].includes(item.decision)) {
        throw new Error('Review decision must be approved, rejected, or needs_review.');
      }
      if (!['skip', 'override', 'merge'].includes(item.duplicateAction || 'skip')) {
        throw new Error('Duplicate action must be skip, override, or merge.');
      }
      await tx.query(
        `INSERT INTO ai_review_decisions (job_id, admin_id, item_id, decision, duplicate_action, similarity_score, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (job_id, item_id) DO UPDATE SET decision = EXCLUDED.decision, duplicate_action = EXCLUDED.duplicate_action, similarity_score = EXCLUDED.similarity_score, notes = EXCLUDED.notes`,
        [jobId, adminId, String(item.itemId), item.decision || 'needs_review', item.duplicateAction || 'skip', item.similarityScore ?? null, item.notes || null]
      );
    }
    const { rows } = await tx.query(`SELECT * FROM ai_review_decisions WHERE job_id = $1 ORDER BY created_at`, [jobId]);
    return rows;
  });
}

function words(value) {
  return new Set(String(value || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((word) => word.length > 2));
}

function similarity(left, right) {
  const a = words(left);
  const b = words(right);
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter((word) => b.has(word)).length;
  return intersection / new Set([...a, ...b]).size;
}

export async function findDuplicates(items = []) {
  const { rows } = await query(`
    SELECT bank_question_id AS id, prompt AS text FROM question_bank WHERE prompt IS NOT NULL
    UNION ALL
    SELECT id, question_text AS text FROM mcq_questions WHERE question_text IS NOT NULL
    LIMIT 10000
  `);
  return items.map((item) => {
    const text = item.question || item.prompt || item.title || '';
    let best = null;
    for (const row of rows) {
      const score = similarity(text, row.text);
      if (!best || score > best.similarityScore) best = { existingId: row.id, similarityScore: Number(score.toFixed(4)) };
    }
    return { itemId: String(item.id), duplicate: best?.similarityScore >= 0.72, ...best };
  });
}

export async function publishApproved({ job, adminId, decisions, items }) {
  const approved = items.filter((item) => decisions.get(String(item.id))?.decision === 'approved');
  if (!approved.length) throw new Error('Approve at least one item before publishing.');
  return withTransaction(async (tx) => {
    const published = [];
    const destination = {
      question_bank: 'questions',
      exam_mock: 'mock_exams',
      mock_exam: 'mock_exams',
      exam_mcq: 'mcq_exams',
      exam: 'mcq_exams',
      simulation: 'simulations',
      case_study: 'kenya_cases',
      kenya_case: 'kenya_cases',
      essay: 'essays',
      learning_path: 'learning_paths',
      cheat_sheet: 'cheat_sheets',
    }[job.request_json?.publishDestination] || job.content_type;
    for (const item of approved) {
      const decision = decisions.get(String(item.id));
      if (decision.duplicate && decision.duplicateAction === 'skip') continue;
      const { rows } = await tx.query(
        `INSERT INTO ai_published_content (job_id, source_item_id, content_type, destination_key, title, program, topic, content_json, source_citation, source_metadata, status, published_at, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10::jsonb,'published',now(),$11)
         ON CONFLICT (job_id, source_item_id) DO UPDATE SET content_json = EXCLUDED.content_json, title = EXCLUDED.title, destination_key = EXCLUDED.destination_key, status = 'published', published_at = now()
         RETURNING *`,
        [job.id, String(item.id), job.content_type, destination, item.title || item.question || job.title, job.request_json?.audience || null, item.topic || job.request_json?.topic || null, JSON.stringify(item), job.citation || null, JSON.stringify({ sourceType: job.source_type, sourceUrl: job.source_url, sourceExcerpt: job.source_excerpt, citation: job.citation }), adminId]
      );
      published.push(rows[0]);
      await tx.query(
        `INSERT INTO content_registry (content_type, destination_key, content_id, program, source_citation, source_job_id, published_by, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'published')
         ON CONFLICT (source_job_id, content_id) DO UPDATE SET status = 'published', published_at = now(), published_by = EXCLUDED.published_by`,
        [job.content_type, destination, rows[0].id, job.request_json?.audience || null, job.citation || null, job.id, adminId]
      );
      await tx.query(
        `INSERT INTO content_audit_log (content_id, action, admin_id, job_id, changes)
         VALUES ($1,'publish',$2,$3,$4::jsonb)`,
        [rows[0].id, adminId, job.id, JSON.stringify({ destination, sourceItemId: String(item.id), duplicateAction: decision.duplicateAction || 'skip' })]
      );
    }
    await tx.query(`UPDATE ai_generation_jobs SET status = 'published', updated_at = now() WHERE id = $1`, [job.id]);
    return published;
  });
}
