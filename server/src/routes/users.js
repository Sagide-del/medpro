import { Router } from 'express';
import { listUsers, createUser, updateUser, suspendUser, reactivateUser, deleteUser, changeUserRole } from '../controllers/adminController.js';
import { User } from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import { validate } from '../middleware/validation.js';
import { asyncHandler } from '../utils/helpers.js';

const router = Router();
router.use(authenticate, requireRole('super_admin', 'institution_admin', 'teacher'));

router.get('/', requireRole('super_admin', 'institution_admin'), listUsers);

router.get('/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  // Scope non-super-admins to their own institution so a teacher/admin at one
  // school can't look up a user record belonging to a different institution.
  if (req.user.role !== 'super_admin' && String(user.institution_id) !== String(req.user.institutionId)) {
    return res.status(403).json({ error: 'You do not have permission to view this user.' });
  }
  res.json({ user });
}));

router.post('/', requireRole('super_admin', 'institution_admin'), validate({ fullName: 'required', email: ['required', 'email'], password: 'required' }), createUser);
router.patch('/:id', requireRole('super_admin', 'institution_admin'), updateUser);
router.patch('/:id/suspend', requireRole('super_admin', 'institution_admin'), suspendUser);
router.patch('/:id/reactivate', requireRole('super_admin', 'institution_admin'), reactivateUser);
router.patch('/:id/role', requireRole('super_admin'), changeUserRole);
router.delete('/:id', requireRole('super_admin'), deleteUser);

export default router;
