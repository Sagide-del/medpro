import { Router } from 'express';
import multer from 'multer';
import { myLogbook, createEntry, pendingReview, reviewEntry } from '../controllers/logbookController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const upload = multer({ dest: 'uploads/logbook/' });
const router = Router();

router.get('/', authenticate, requireRole('student'), myLogbook);
router.post('/entries', authenticate, requireRole('student'), createEntry);
router.post('/entries/upload', authenticate, requireRole('student'), upload.single('file'), (req, res) => {
  res.json({ fileUrl: `/uploads/logbook/${req.file.filename}` });
});
router.get('/entries/pending', authenticate, requireRole('teacher', 'institution_admin', 'super_admin'), pendingReview);
router.patch('/entries/:entryId/review', authenticate, requireRole('teacher', 'institution_admin', 'super_admin'), reviewEntry);

export default router;
