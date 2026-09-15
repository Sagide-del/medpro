import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import { query } from '../config/database.js';
import { asyncHandler } from '../utils/helpers.js';

const router = Router();
router.use(authenticate, requireRole('student'));
const programSql = "CASE WHEN lower(program) IN ('paramedic','emt-paramedic') THEN 'Paramedic' WHEN lower(program) IN ('emt','emt-basic','emt-intermediate') THEN 'EMT' ELSE NULL END";
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
  const { program, response } = req.body || {};
  if (!['EMT', 'Paramedic'].includes(program) || typeof response !== 'string' || !response.trim() || response.length > 20000) {
    return res.status(400).json({ error: 'Select a pathway and provide a response (up to 20,000 characters).' });
  }
  const { rows } = await query(`INSERT INTO published_content_responses (student_id, content_id, program, response)
    SELECT $1, id, $3, $4 FROM ai_published_content WHERE id = $2 AND status = 'published'
    AND (${programSql}) = $3 AND destination_key IN ('psychometric_clinical', 'psychometric_situational', 'psychometric_readiness')
    RETURNING id, submitted_at`, [req.user.sub, req.params.id, program, response.trim()]);
  if (!rows.length) return res.status(404).json({ error: 'This assessment is not available in your pathway.' });
  res.status(201).json({ submission: rows[0], status: 'awaiting_review' });
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
  res.json({ content: rows.map((row) => assessment ? { ...row, content_json: {
    question: row.content_json.question || row.content_json.prompt,
    options: Array.isArray(row.content_json.options) ? row.content_json.options.map((option) => typeof option === 'string' ? option : { text: option.text || option.label, key: option.key }) : row.content_json.options,
    type: row.content_json.type || row.content_json.questionType,
  } } : row) });
}));
export default router;
