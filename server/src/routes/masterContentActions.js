import { Router } from 'express';
import { query, withTransaction } from '../config/database.js';
import { requireRole } from '../middleware/roleCheck.js';
import { asyncHandler } from '../utils/helpers.js';
import { createUploader } from '../services/storage.js';
import { ragError } from '../services/ragService.js';

const router = Router();
const { upload, urlFor } = createUploader('published-media', {
  allowedMimeTypes: ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/ogg', 'video/mp4', 'video/webm', 'image/png', 'image/jpeg', 'image/webp'],
  allowedExtensions: ['mp3', 'wav', 'm4a', 'ogg', 'mp4', 'webm', 'png', 'jpg', 'jpeg', 'webp'],
});
router.use(requireRole('teacher', 'institution_admin', 'super_admin'));
router.use('/:id', asyncHandler(async (req, _res, next) => {
  if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) throw ragError('Invalid content identifier.');
  const { rows } = await query('SELECT * FROM ai_published_content WHERE id=$1 AND ($2 OR created_by=$3)', [req.params.id, req.user.role === 'super_admin', req.user.sub]);
  if (!rows.length) throw ragError('Content not found in your administration scope.', 404);
  req.masterContent = rows[0]; next();
}));
router.get('/:id', (req, res) => res.json({ content: req.masterContent }));
router.post('/:id/unpublish', asyncHandler(async (req, res) => {
  await withTransaction(async (db) => {
    await db.query("UPDATE ai_published_content SET status='withdrawn' WHERE id=$1", [req.masterContent.id]);
    await db.query("UPDATE content_registry SET status='withdrawn' WHERE content_id=$1", [req.masterContent.id]);
    await db.query("INSERT INTO content_audit_log(content_id,action,admin_id,job_id) VALUES($1,'unpublish',$2,$3)", [req.masterContent.id, req.user.sub, req.masterContent.job_id]);
  });
  res.json({ status: 'withdrawn' });
}));
router.post('/:id/media', (req, _res, next) => {
  if (!['podcasts', 'skills_videos', 'diagrams'].includes(req.masterContent.destination_key)) return next(ragError('Media can only be attached to podcasts, skills videos or diagrams.'));
  next();
}, upload.single('file'), asyncHandler(async (req, res) => {
  const allowed = { podcasts: ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/ogg'], skills_videos: ['video/mp4', 'video/webm'], diagrams: ['image/png', 'image/jpeg', 'image/webp'] };
  if (!req.file || !allowed[req.masterContent.destination_key].includes(req.file.mimetype)) throw ragError('Choose a supported audio, video or image format for this destination.');
  const media = { media_url: urlFor(req.file), media_type: req.file.mimetype };
  await withTransaction(async (db) => {
    await db.query('UPDATE ai_published_content SET content_json=content_json || $2::jsonb WHERE id=$1', [req.masterContent.id, JSON.stringify(media)]);
    await db.query("INSERT INTO content_audit_log(content_id,action,admin_id,job_id,changes) VALUES($1,'attach_media',$2,$3,$4::jsonb)", [req.masterContent.id, req.user.sub, req.masterContent.job_id, JSON.stringify(media)]);
  });
  res.json({ media });
}));
export default router;
