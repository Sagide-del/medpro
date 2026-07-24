import { Router } from 'express';
import { dashboardOverview, auditLog, listInstitutionsAdmin } from '../controllers/adminController.js';
import { listCases, uploadCase, updateCase, deleteCase } from '../controllers/caseContentController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = Router();
router.use(authenticate, requireRole('super_admin', 'institution_admin'));

router.get('/dashboard', dashboardOverview);
router.get('/audit-log', requireRole('super_admin'), auditLog);
router.get('/institutions', requireRole('super_admin'), listInstitutionsAdmin);
router.get('/cases', requireRole('super_admin'), listCases);
router.post('/cases/upload', requireRole('super_admin'), uploadCase);
router.put('/cases/:id', requireRole('super_admin'), updateCase);
router.delete('/cases/:id', requireRole('super_admin'), deleteCase);

export default router;
