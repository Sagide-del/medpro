import { Router } from 'express';
import { dashboardOverview, auditLog, listInstitutionsAdmin } from '../controllers/adminController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = Router();
router.use(authenticate, requireRole('super_admin', 'institution_admin'));

router.get('/dashboard', dashboardOverview);
router.get('/audit-log', requireRole('super_admin'), auditLog);
router.get('/institutions', requireRole('super_admin'), listInstitutionsAdmin);

export default router;
