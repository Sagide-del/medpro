import { Router } from 'express';
import multer from 'multer';
import { randomUUID, createHash } from 'node:crypto';
import { query, withTransaction } from '../config/database.js';
import { asyncHandler } from '../utils/helpers.js';
import { requireRole } from '../middleware/roleCheck.js';
import { ragEnabled, ragError, ragRequest, sourceScope, readableScopes, sourceTypes, retrieveSources } from '../services/ragService.js';

const router = Router();
router.use(requireRole('teacher', 'institution_admin', 'super_admin'));
router.get('/config', (_req, res) => res.json({ enabled: ragEnabled() }));
router.use((_req, _res, next) => next(ragEnabled() ? undefined : ragError('Source retrieval is not enabled.', 503)));
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024, files: 1 } });

router.get('/sources', asyncHandler(async (req, res) => {
  const { rows } = await query(`SELECT id,filename,program,subject,source_type,version,status,error,page_count,chunk_count,created_at,
    (scope_key=$2) AS can_manage FROM rag_sources WHERE scope_key=ANY($1::text[]) ORDER BY created_at DESC LIMIT 200`,
  [readableScopes(req.user), sourceScope(req.user)]);
  res.json({ sources: rows, canApprove: ['super_admin', 'institution_admin'].includes(req.user.role) });
}));
router.post('/sources', upload.single('file'), asyncHandler(async (req, res) => {
  const { program, subject, sourceType, version } = req.body;
  if (!req.file || req.file.buffer.subarray(0, 5).toString() !== '%PDF-') throw ragError('Upload a PDF file, up to 20 MB.');
  if (!['EMT', 'Paramedic', 'both'].includes(program) || !sourceTypes.includes(sourceType) ||
      !String(subject || '').trim() || !String(version || '').trim() || subject.length > 200 || version.length > 100) {
    throw ragError('Provide a pathway, subject, source type and document edition/version.');
  }
  const id = randomUUID();
  const hash = createHash('sha256').update(req.file.buffer).digest('hex');
  const { rows } = await query(`INSERT INTO rag_sources(id,scope_key,filename,file_hash,source_type,program,subject,version,created_by)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT DO NOTHING RETURNING id`,
  [id, sourceScope(req.user), req.file.originalname.slice(0, 255), hash, sourceType, program, subject.trim(), version.trim(), req.user.sub]);
  if (!rows.length) throw ragError('This document and classification already exist. Check the source library.', 409);
  try {
    await ragRequest(`/files/${id}`, { method: 'PUT', bytes: req.file.buffer });
    await withTransaction(async (db) => {
      await db.query("UPDATE rag_sources SET status='uploaded',updated_at=now() WHERE id=$1", [id]);
      await db.query("INSERT INTO rag_source_events(source_id,actor_id,action) VALUES($1,$2,'uploaded')", [id, req.user.sub]);
    });
  } catch (error) {
    await query('DELETE FROM rag_sources WHERE id=$1', [id]);
    throw error;
  }
  res.status(201).json({ id, status: 'uploaded' });
}));
router.post('/sources/:id/:action', requireRole('institution_admin', 'super_admin'), asyncHandler(async (req, res) => {
  if (!['approve', 'withdraw', 'retry'].includes(req.params.action)) throw ragError('Unknown source action.');
  if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) throw ragError('Invalid source identifier.');
  const source = await withTransaction(async (db) => {
    const { rows } = await db.query('SELECT * FROM rag_sources WHERE id=$1 AND scope_key=$2 FOR UPDATE', [req.params.id, sourceScope(req.user)]);
    const row = rows[0];
    if (!row) throw ragError('Source not found in your administration scope.', 404);
    const action = req.params.action;
    if (action === 'approve' && row.status !== 'uploaded') throw ragError('Only uploaded sources can be approved.', 409);
    if (action === 'retry' && (row.status !== 'failed' || !row.approved_by)) throw ragError('Only approved failed sources can be retried.', 409);
    const { rows: updated } = await db.query(`UPDATE rag_sources SET status=$2, error=NULL,
      approved_by=CASE WHEN $3='approve' THEN $4 ELSE approved_by END,
      approved_at=CASE WHEN $3='approve' THEN now() ELSE approved_at END,updated_at=now() WHERE id=$1 RETURNING id,status`,
    [row.id, action === 'withdraw' ? 'withdrawn' : 'queued', action, req.user.sub]);
    await db.query('INSERT INTO rag_source_events(source_id,actor_id,action) VALUES($1,$2,$3)', [row.id, req.user.sub, action]);
    if (action === 'withdraw') {
      const { rows: removed } = await db.query(`UPDATE ai_published_content SET status='withdrawn'
        WHERE (source_metadata->'reference'->>'document_id'=$1 OR source_metadata->'references' @> $2::jsonb)
        AND status='published' RETURNING id,job_id`, [String(row.id), JSON.stringify([{ document_id: row.id }])]);
      for (const item of removed) {
        await db.query("UPDATE content_registry SET status='withdrawn' WHERE content_id=$1", [item.id]);
        await db.query(`INSERT INTO content_audit_log(content_id,action,admin_id,job_id,changes)
          VALUES($1,'source_withdrawn',$2,$3,$4::jsonb)`, [item.id, req.user.sub, item.job_id, JSON.stringify({ sourceId: row.id })]);
      }
    }
    return updated[0];
  });
  res.json(source);
}));
router.post('/retrieve', asyncHandler(async (req, res) => res.json({ chunks: await retrieveSources(req.user, req.body) })));
export default router;
