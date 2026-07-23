import { Router } from 'express';
import { createTemplate, listAutomation, triggerEvent } from '../controllers/communicationController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = Router();

router.get('/', authenticate, requireRole('teacher', 'institution_admin', 'super_admin'), listAutomation);
router.post('/templates', authenticate, requireRole('teacher', 'institution_admin', 'super_admin'), createTemplate);
router.post('/trigger', authenticate, requireRole('teacher', 'institution_admin', 'super_admin'), triggerEvent);

export default router;
