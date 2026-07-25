import { Router } from 'express';
import {
  listMockPreTestModules,
  startMockPreTest,
  submitMockPreTest,
} from '../controllers/mockPreTestController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = Router();

// Exams -> MCQ -> Mock Pre-Test. Entirely separate from the existing
// /api/assessments MCQ system -- no shared tables, no shared routes.
router.get('/modules', authenticate, requireRole('student'), listMockPreTestModules);
router.post('/start', authenticate, requireRole('student'), startMockPreTest);
router.post('/submit', authenticate, requireRole('student'), submitMockPreTest);

export default router;
