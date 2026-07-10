import { Router } from 'express';
import {
  listAssessments, getAssessment, createAssessment, publishAssessment, deleteAssessment,
  startAttempt, submitAttempt, myAttempts, attemptsForAssessment, gradeManual,
} from '../controllers/assessmentController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = Router();

router.get('/', optionalAuth, listAssessments);
router.get('/my-attempts', authenticate, requireRole('student'), myAttempts);
router.get('/:id', optionalAuth, getAssessment);
router.post('/', authenticate, requireRole('teacher', 'super_admin'), createAssessment);
router.patch('/:id/publish', authenticate, requireRole('teacher', 'super_admin'), publishAssessment);
router.delete('/:id', authenticate, requireRole('teacher', 'super_admin'), deleteAssessment);

router.post('/:id/attempts', authenticate, requireRole('student'), startAttempt);
router.post('/:id/attempts/:attemptId/submit', authenticate, requireRole('student'), submitAttempt);
router.get('/:id/attempts', authenticate, requireRole('teacher', 'super_admin', 'institution_admin'), attemptsForAssessment);
router.patch('/attempts/:attemptId/grade', authenticate, requireRole('teacher', 'super_admin'), gradeManual);

export default router;
