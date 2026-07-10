import { Router } from 'express';
import { sendAlert, myAlerts, alertsForGroup } from '../controllers/alertController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = Router();

router.post('/', authenticate, requireRole('teacher'), sendAlert);
router.get('/', authenticate, requireRole('teacher'), myAlerts);
router.get('/group/:groupId', authenticate, requireRole('teacher', 'student'), alertsForGroup);

export default router;
