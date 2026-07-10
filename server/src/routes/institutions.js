import { Router } from 'express';
import { Institution } from '../models/Institution.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole, requireOwnInstitution } from '../middleware/roleCheck.js';
import { logAdminAction } from '../middleware/audit.js';
import { asyncHandler } from '../utils/helpers.js';

const router = Router();
// Every route here requires sign-in; super_admin-only restrictions are then
// applied per-route below. GET /:id is deliberately open to institution_admin
// too (scoped to their own institution) since /admin/institution needs it.
router.use(authenticate);

router.get('/', requireRole('super_admin'), asyncHandler(async (_req, res) => {
  const institutions = await Institution.list();
  res.json({ institutions });
}));

router.get('/expiring', requireRole('super_admin'), asyncHandler(async (req, res) => {
  const days = Number(req.query.days) || 30;
  const expiring = await Institution.expiringWithin(days);
  res.json({ expiring });
}));

router.get('/:id', requireRole('super_admin', 'institution_admin'), requireOwnInstitution('id'), asyncHandler(async (req, res) => {
  const institution = await Institution.findById(req.params.id);
  if (!institution) return res.status(404).json({ error: 'Institution not found.' });
  res.json({ institution });
}));

router.post('/', requireRole('super_admin'), asyncHandler(async (req, res) => {
  const { name, shortCode, contactEmail, contactPhone, address, plan = 'trial', maxStudents = 50, amount = 0, months = 12 } = req.body;
  if (!name || !shortCode) return res.status(400).json({ error: 'Institution name and short code are required.' });

  const institution = await Institution.create({ name, shortCode: shortCode.toUpperCase(), contactEmail, contactPhone, address });
  const expiresAt = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000);
  await Institution.addSubscription(institution.institution_id, {
    plan, status: plan === 'trial' ? 'trial' : 'active', maxStudents, amount, expiresAt,
  });

  logAdminAction(req.user.sub, 'manage_institution', { action: 'create', name }, req);
  res.status(201).json({ institution });
}));

router.patch('/:id', requireRole('super_admin'), asyncHandler(async (req, res) => {
  const institution = await Institution.update(req.params.id, req.body);
  logAdminAction(req.user.sub, 'manage_institution', { action: 'update', institutionId: req.params.id }, req);
  res.json({ institution });
}));

router.post('/:id/subscription', requireRole('super_admin'), asyncHandler(async (req, res) => {
  const sub = await Institution.addSubscription(req.params.id, req.body);
  logAdminAction(req.user.sub, 'manage_institution', { action: 'subscription', institutionId: req.params.id }, req);
  res.status(201).json({ subscription: sub });
}));

export default router;
