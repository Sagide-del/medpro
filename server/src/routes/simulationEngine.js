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
import { requirePremiumAccess } from '../middleware/subscriptionAccess.js';

const router = Router();

router.use(authenticate);
router.post('/attempts', requireRole('student'), requirePremiumAccess('clinical_simulations'), startSimulationAttempt);
router.post('/attempts/:id/complete', requireRole('student'), requirePremiumAccess('clinical_simulations'), completeSimulationAttempt);
router.get('/my-results', requireRole('student'), requirePremiumAccess('clinical_simulations'), mySimulationResults);
router.get('/my-results/latest', requireRole('student'), requirePremiumAccess('clinical_simulations'), myLatestSimulationResult);
router.get('/teacher/performance', requireRole('teacher'), teacherSimulationPerformance);

export default router;
