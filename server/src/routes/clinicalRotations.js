import { Router } from 'express';
import {
  assignStudents,
  createActivity,
  createHospital,
  createRotation,
  createSite,
  exportLogbookPdf,
  institutionDashboard,
  reviewActivity,
  reviewQueue,
  studentLogbook,
} from '../controllers/clinicalRotationController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = Router();

router.get('/dashboard', authenticate, requireRole('institution_admin', 'super_admin'), institutionDashboard);
router.post('/hospitals', authenticate, requireRole('institution_admin', 'super_admin'), createHospital);
router.post('/sites', authenticate, requireRole('institution_admin', 'super_admin'), createSite);
router.post('/rotations', authenticate, requireRole('institution_admin', 'super_admin'), createRotation);
router.post('/rotations/:rotationId/assign', authenticate, requireRole('institution_admin', 'super_admin'), assignStudents);
router.get('/my-logbook', authenticate, requireRole('student'), studentLogbook);
router.post('/activities', authenticate, requireRole('student'), createActivity);
router.get('/review-queue', authenticate, requireRole('teacher', 'institution_admin', 'super_admin'), reviewQueue);
router.patch('/activities/:activityId/review', authenticate, requireRole('teacher', 'institution_admin', 'super_admin'), reviewActivity);
router.get('/my-logbook/export.pdf', authenticate, requireRole('student'), exportLogbookPdf);

export default router;
