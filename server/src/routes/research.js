import { Router } from 'express';
import {
  listResearch,
  listMyResearch,
  listPendingResearch,
  getResearch,
  createResearch,
  setResearchFile,
  publishResearch,
  rejectResearch,
  deleteResearch,
} from '../controllers/researchController.js';
import { Research } from '../models/Research.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import { createUploader } from '../services/storage.js';

const { upload, urlFor } = createUploader('research');
const router = Router();

// Order matters: /mine and /pending must be declared before /:id.
router.get('/', optionalAuth, listResearch);
router.get('/mine', authenticate, requireRole('student'), listMyResearch);
router.get('/pending', authenticate, requireRole('teacher', 'institution_admin', 'super_admin'), listPendingResearch);
router.get('/:id', optionalAuth, getResearch);

// Students can submit their own case studies / write-ups; everything starts
// as a draft and only becomes visible platform-wide once a teacher or admin
// publishes it (see publishResearch / rejectResearch below).
router.post('/', authenticate, requireRole('super_admin', 'teacher', 'student'), createResearch);
router.patch('/:id/publish', authenticate, requireRole('super_admin', 'teacher'), publishResearch);
router.delete('/:id/reject', authenticate, requireRole('super_admin', 'teacher'), rejectResearch);
router.delete('/:id', authenticate, requireRole('super_admin'), deleteResearch);

router.post('/:id/file', authenticate, requireRole('super_admin', 'teacher', 'student'), upload.single('file'), async (req, res) => {
  const existing = await Research.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Research item not found.' });
  if (req.user.role === 'student' && String(existing.uploaded_by) !== String(req.user.sub)) {
    return res.status(403).json({ error: 'You can only attach a file to your own submission.' });
  }
  const research = await Research.setFile(req.params.id, urlFor(req.file));
  res.json({ research });
});
router.patch('/:id/file', authenticate, requireRole('super_admin', 'teacher', 'student'), setResearchFile);

export default router;
