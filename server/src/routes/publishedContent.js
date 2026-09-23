import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import { query } from '../config/database.js';
import { asyncHandler } from '../utils/helpers.js';
import { gradePublishedResponse } from '../services/publishedGrading.js';
import { getSignedPdfUrl } from '../services/storage.js';

const router = Router();
router.use(authenticate, requireRole('student'));
const programSql = "CASE WHEN lower(program) IN ('paramedic','emt-paramedic') THEN 'Paramedic' WHEN lower(program) IN ('emt','emt-basic','emt-intermediate') THEN 'EMT' ELSE NULL END";
router.get('/summary', asyncHandler(async (req, res) => {
  const program = req.query.program || req.user.program;
  if (!['EMT', 'Paramedic'].includes(program)) return res.status(400).json({ error: 'Select EMT or Paramedic.' });
  const { rows } = await query(`SELECT destination_key,count(*)::int AS count FROM ai_published_content
    WHERE status='published' AND (${programSql})=$1 GROUP BY destination_key`, [program]);
  res.json({ counts: Object.fromEntries(rows.map((row) => [row.destination_key, row.count])) });
}));
router.get('/responses', asyncHandler(async (req, res) => {
  const program = req.query.program || req.user.program;
  if (!['EMT', 'Paramedic'].includes(program)) return res.status(400).json({ error: 'Select EMT or Paramedic.' });
  const { rows } = await query(`SELECT id,content_id,submitted_at,grading_status,score,feedback FROM published_content_responses
    WHERE student_id=$1 AND program=$2 ORDER BY submitted_at DESC LIMIT 100`, [req.user.sub, program]);
  res.json({ submissions: rows });
}));
router.get('/activity', asyncHandler(async (req, res) => {
  const program = req.query.program || req.user.program;
  if (!['EMT', 'Paramedic'].includes(program)) return res.status(400).json({ error: 'Select EMT or Paramedic.' });
  const { rows } = await query(`SELECT a.id AS attempt_id, a.percentage AS score_pct, a.completed_at,
    m.title, 'completed' AS status FROM student_mcq_attempts a JOIN mcq_modules m ON m.id=a.module_id
    WHERE a.student_id=$1 AND m.program=$2 ORDER BY a.completed_at DESC LIMIT 100`, [req.user.sub, program]);
  const { rows: totals } = await query(`SELECT count(*)::int AS total_questions FROM mcq_questions q
    WHERE q.program=$1 AND (q.published_content_id IS NULL OR EXISTS
      (SELECT 1 FROM ai_published_content p WHERE p.id=q.published_content_id AND p.status='published'))`, [program]);
  res.json({ attempts: rows, totalQuestions: totals[0].total_questions });
}));
router.post('/:id/responses', asyncHandler(async (req, res) => {
  const { program, response, clientToken } = req.body || {};
  if (clientToken && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientToken)) return res.status(400).json({ error: 'Invalid submission token.' });
  if (!['EMT', 'Paramedic'].includes(program) || typeof response !== 'string' || !response.trim() || response.length > 20000) {
    return res.status(400).json({ error: 'Select a pathway and provide a response (up to 20,000 characters).' });
  }
  const { rows } = await query(`INSERT INTO published_content_responses (student_id, content_id, program, response, content_snapshot, client_token)
    SELECT $1, id, $3, $4, content_json, $5 FROM ai_published_content WHERE id = $2 AND status = 'published'
    AND (${programSql}) = $3 AND destination_key IN ('psychometric_clinical', 'psychometric_situational', 'psychometric_readiness')
    ON CONFLICT (student_id,client_token) DO NOTHING
    RETURNING id, submitted_at, content_snapshot`, [req.user.sub, req.params.id, program, response.trim(), clientToken || null]);
  if (!rows.length) {
    if (clientToken) {
      const existing = await query(`SELECT id,submitted_at,grading_status,score,feedback FROM published_content_responses
        WHERE student_id=$1 AND client_token=$2 AND content_id=$3 AND program=$4`, [req.user.sub, clientToken, req.params.id, program]);
      if (existing.rows.length) return res.json({ submission: existing.rows[0], status: existing.rows[0].grading_status });
    }
    return res.status(404).json({ error: 'This assessment is not available in your pathway.' });
  }
  const grade = await gradePublishedResponse(rows[0].content_snapshot, response.trim());
  await query('UPDATE published_content_responses SET grading_status=$2,score=$3,feedback=$4 WHERE id=$1', [rows[0].id, grade.status, grade.score ?? null, grade.feedback || null]);
  res.status(201).json({ submission: { id: rows[0].id, submitted_at: rows[0].submitted_at, score: grade.score, feedback: grade.feedback }, status: grade.status });
}));
router.get('/', asyncHandler(async (req, res) => {
  const program = req.query.program || req.user.program;
  if (!['EMT', 'Paramedic'].includes(program)) return res.status(400).json({ error: 'Select EMT or Paramedic.' });
  const { rows } = await query(`SELECT id, title, topic, destination_key, source_citation, published_at,
    content_json, $1::text AS program FROM ai_published_content
    WHERE status = 'published' AND (${programSql}) = $1 AND destination_key = $2
    ORDER BY published_at DESC, id LIMIT 200`, [program, req.query.destination]);
  // Assessment answers are never included in the resource feed.
  const assessment = String(req.query.destination || '').startsWith('psychometric_') || req.query.destination === 'questions';
  if (!assessment) for (const row of rows) {
    if (row.content_json.media_url) row.content_json.media_url = await getSignedPdfUrl(row.content_json.media_url, 3600);
  }
  res.json({ content: rows.map((row) => assessment ? { ...row, content_json: {
    question: row.content_json.question || row.content_json.prompt,
    scenario: row.content_json.scenario,
    options: Array.isArray(row.content_json.options) ? row.content_json.options.map((option) => typeof option === 'string' ? option : { text: option?.text || option?.label, key: option?.key }) : [],
    type: row.content_json.type || row.content_json.questionType,
  } } : row) });
}));
export default router;
