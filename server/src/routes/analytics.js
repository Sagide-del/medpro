import { Router } from 'express';
import { analyticsService } from '../services/analyticsService.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import { asyncHandler } from '../utils/helpers.js';

const router = Router();

router.get('/overview', authenticate, requireRole('super_admin', 'institution_admin'), asyncHandler(async (req, res) => {
  const institutionId = req.user.role === 'institution_admin' ? req.user.institutionId : undefined;
  const overview = await analyticsService.overview({ institutionId });
  res.json(overview);
}));

router.get('/revenue', authenticate, requireRole('super_admin', 'institution_admin'), asyncHandler(async (req, res) => {
  const institutionId = req.user.role === 'institution_admin' ? req.user.institutionId : undefined;
  const [byStream, byInstitution] = await Promise.all([
    analyticsService.revenueByStream({ months: Number(req.query.months) || 12, institutionId }),
    analyticsService.revenueByInstitution({ institutionId }),
  ]);
  res.json({ byStream, byInstitution });
}));

router.get('/content', authenticate, requireRole('super_admin'), asyncHandler(async (req, res) => {
  const topContent = await analyticsService.topContent({ limit: Number(req.query.limit) || 10 });
  res.json({ topContent });
}));

router.get('/students/:id/progress', authenticate, requireRole('super_admin', 'institution_admin', 'teacher', 'student'), asyncHandler(async (req, res) => {
  if (req.user.role === 'student' && req.user.sub !== req.params.id) {
    return res.status(403).json({ error: 'You can only view your own progress.' });
  }
  const progress = await analyticsService.studentProgress(req.params.id);
  res.json({ progress });
}));

router.get('/groups/:id/performance', authenticate, requireRole('teacher', 'super_admin', 'institution_admin'), asyncHandler(async (req, res) => {
  const performance = await analyticsService.classPerformance(req.params.id);
  res.json({ performance });
}));

router.get('/subscriptions/expiring', authenticate, requireRole('super_admin'), asyncHandler(async (req, res) => {
  const expiring = await analyticsService.expiringSubscriptions(Number(req.query.days) || 30);
  res.json({ expiring });
}));

router.get('/student-readiness', authenticate, requireRole('student', 'teacher', 'institution_admin', 'super_admin'), asyncHandler(async (req, res) => {
  const studentId = req.user.role === 'student' ? req.user.sub : (req.query.studentId || req.user.sub);
  const readiness = await analyticsService.studentReadiness(studentId);
  res.json({ readiness });
}));

router.get('/teacher-performance', authenticate, requireRole('teacher', 'institution_admin', 'super_admin'), asyncHandler(async (req, res) => {
  const performance = await analyticsService.teacherPerformance(req.user.sub);
  res.json({ performance });
}));

router.get('/institution-dashboard', authenticate, requireRole('institution_admin', 'super_admin'), asyncHandler(async (req, res) => {
  const institutionId = req.user.role === 'institution_admin' ? req.user.institutionId : req.query.institutionId;
  const analytics = await analyticsService.institutionAnalytics(institutionId);
  res.json({ analytics });
}));

router.get('/platform-metrics', authenticate, requireRole('super_admin'), asyncHandler(async (_req, res) => {
  const metrics = await analyticsService.platformMetrics();
  res.json({ metrics });
}));

export default router;
