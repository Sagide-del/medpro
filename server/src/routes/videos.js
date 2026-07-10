import { Router } from 'express';
import multer from 'multer';
import { myVideos, uploadVideo, pendingReview, reviewVideo, deleteVideo } from '../controllers/videoController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const upload = multer({ dest: 'uploads/videos/', limits: { fileSize: 200 * 1024 * 1024 } });
const router = Router();

router.get('/', authenticate, requireRole('student'), myVideos);
router.post('/upload', authenticate, requireRole('student'), upload.single('file'), (req, res, next) => {
  req.body.fileUrl = `/uploads/videos/${req.file.filename}`;
  next();
}, uploadVideo);
router.get('/pending', authenticate, requireRole('teacher', 'institution_admin', 'super_admin'), pendingReview);
router.patch('/:id/review', authenticate, requireRole('teacher', 'institution_admin', 'super_admin'), reviewVideo);
router.delete('/:id', authenticate, requireRole('student', 'super_admin'), deleteVideo);

export default router;
