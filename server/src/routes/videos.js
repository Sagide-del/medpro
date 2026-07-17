import { Router } from 'express';
import { myVideos, uploadVideo, pendingReview, reviewVideo, deleteVideo } from '../controllers/videoController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import { createUploader } from '../services/storage.js';

const { upload, urlFor } = createUploader('videos', { limits: { fileSize: 200 * 1024 * 1024 } });
const router = Router();

router.get('/', authenticate, requireRole('student'), myVideos);
router.post('/upload', authenticate, requireRole('student'), upload.single('file'), (req, res, next) => {
  req.body.fileUrl = urlFor(req.file);
  next();
}, uploadVideo);
router.get('/pending', authenticate, requireRole('teacher', 'institution_admin', 'super_admin'), pendingReview);
router.patch('/:id/review', authenticate, requireRole('teacher', 'institution_admin', 'super_admin'), reviewVideo);
router.delete('/:id', authenticate, requireRole('student', 'super_admin'), deleteVideo);

export default router;
