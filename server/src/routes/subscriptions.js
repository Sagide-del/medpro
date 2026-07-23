import { Router } from 'express';
import {
  institutionLicenceSummary,
  listPlans,
  renewInstitutionLicence,
  renewStudentSubscription,
  studentSubscriptionSummary,
  superAdminOverview,
  updatePlan,
} from '../controllers/subscriptionController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import { validate } from '../middleware/validation.js';

const router = Router();

router.use(authenticate);

router.get('/plans', listPlans);
router.patch('/plans/:id', requireRole('super_admin'), updatePlan);

router.get('/student/current', requireRole('student'), studentSubscriptionSummary);
router.post('/student/renew', requireRole('student'), validate({ phone: 'required' }), renewStudentSubscription);

router.get('/institution/current', requireRole('institution_admin', 'super_admin'), institutionLicenceSummary);
router.post('/institution/renew', requireRole('institution_admin', 'super_admin'), validate({ phone: 'required' }), renewInstitutionLicence);

router.get('/admin/overview', requireRole('super_admin'), superAdminOverview);

export default router;
