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

export default router;
