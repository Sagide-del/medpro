import { Router } from 'express';
import {
  listCaseStudies,
  getCaseStudy,
  saveCaseStudyProgress,
  submitCaseStudy,
  getCaseStudyAttemptReview,
} from '../controllers/caseStudyController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = Router();

router.get('/', authenticate, requireRole('student'), listCaseStudies);
router.get('/attempts/:attemptId', authenticate, requireRole('student'), getCaseStudyAttemptReview);
router.get('/:caseId', authenticate, requireRole('student'), getCaseStudy);
router.post('/:caseId/progress', authenticate, requireRole('student'), saveCaseStudyProgress);
router.post('/:caseId/submit', authenticate, requireRole('student'), submitCaseStudy);

export default router;
