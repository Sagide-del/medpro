import { Router } from 'express';
import {
  completeSimulationAttempt,
  myLatestSimulationResult,
  mySimulationResults,
  startSimulationAttempt,
  teacherSimulationPerformance,
} from '../controllers/simulationEngineController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = Router();

router.use(authenticate);
router.post('/attempts', requireRole('student'), startSimulationAttempt);
router.post('/attempts/:id/complete', requireRole('student'), completeSimulationAttempt);
router.get('/my-results', requireRole('student'), mySimulationResults);
router.get('/my-results/latest', requireRole('student'), myLatestSimulationResult);
router.get('/teacher/performance', requireRole('teacher'), teacherSimulationPerformance);

export default router;
