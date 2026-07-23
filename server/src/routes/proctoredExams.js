import { Router } from 'express';
import {
  activeCandidates,
  createExam,
  examReports,
  listExams,
  logExamActivity,
  releaseResults,
  startExam,
  submitExam,
} from '../controllers/proctoredExamController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = Router();

router.get('/', authenticate, requireRole('student', 'teacher', 'institution_admin', 'super_admin'), listExams);
router.post('/', authenticate, requireRole('teacher', 'institution_admin', 'super_admin'), createExam);
router.post('/:examId/start', authenticate, requireRole('student'), startExam);
router.post('/:examId/submit', authenticate, requireRole('student'), submitExam);
router.post('/:examId/activity', authenticate, requireRole('student', 'teacher', 'institution_admin', 'super_admin'), logExamActivity);
router.post('/:examId/release-results', authenticate, requireRole('teacher', 'institution_admin', 'super_admin'), releaseResults);
router.get('/:examId/candidates', authenticate, requireRole('teacher', 'institution_admin', 'super_admin'), activeCandidates);
router.get('/reports/institution', authenticate, requireRole('teacher', 'institution_admin', 'super_admin'), examReports);

export default router;
