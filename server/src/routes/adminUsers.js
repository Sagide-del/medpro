import { Router } from 'express';
import { listUsers } from '../controllers/adminController.js';
import { bulkPermanentDeleteUsers, getUserHistory, permanentDeleteUser } from '../controllers/adminUsersController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = Router();

router.use(authenticate, requireRole('super_admin'));

router.get('/', listUsers);
router.post('/bulk-delete', bulkPermanentDeleteUsers);
router.get('/:id/history', getUserHistory);
router.delete('/:id/permanent', permanentDeleteUser);

export default router;
