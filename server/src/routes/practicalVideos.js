import { Router } from 'express';
import {
  createAssignment,
  deleteAssignment,
  listAssignments,
  reviewQueue,
  reviewSubmission,
  submitAssignment,
  updateAssignment,
} from '../controllers/practicalVideoController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import { createUploader } from '../services/storage.js';

const router = Router();
const { upload, urlFor } = createUploader('practical-videos', { limits: { fileSize: 250 * 1024 * 1024 } });

router.get('/', authenticate, requireRole('student', 'teacher', 'institution_admin', 'super_admin'), listAssignments);
router.post('/', authenticate, requireRole('teacher', 'institution_admin', 'super_admin'), createAssignment);
router.patch('/:assignmentId', authenticate, requireRole('teacher', 'institution_admin', 'super_admin'), updateAssignment);
router.delete('/:assignmentId', authenticate, requireRole('teacher', 'institution_admin', 'super_admin'), deleteAssignment);
router.post('/:assignmentId/submit', authenticate, requireRole('student'), upload.single('file'), (req, _res, next) => {
  req.uploadedFileUrl = urlFor(req.file);
  next();
}, submitAssignment);
router.get('/review-queue/all', authenticate, requireRole('teacher', 'institution_admin', 'super_admin'), reviewQueue);
router.patch('/submissions/:submissionId/review', authenticate, requireRole('teacher', 'institution_admin', 'super_admin'), reviewSubmission);

export default router;
