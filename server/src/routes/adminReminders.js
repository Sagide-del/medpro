import { Router } from 'express';
import { getReminderSettings, sendReminders, updateReminderSettings } from '../controllers/adminCommunicationController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = Router();

router.use(authenticate, requireRole('super_admin'));

router.get('/settings', getReminderSettings);
router.put('/settings', updateReminderSettings);
router.post('/send', sendReminders);

export default router;
