import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import { generate, predictions, recommendations, today, update, weakTopics } from '../controllers/plannerController.js';

const router = Router();
router.use(authenticate, requireRole('student'));
router.get('/predictions', predictions);
router.post('/generate', generate);
router.get('/weak-topics', weakTopics);
router.post('/update', update);
router.get('/recommendations', recommendations);
router.get('/today', today);
export default router;
