import { Router } from 'express';
import { Notification } from '../models/Notification.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/helpers.js';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  const unreadOnly = req.query.unread === 'true';
  const notifications = await Notification.listForUser(req.user.sub, { unreadOnly });
  res.json({ notifications });
}));

router.get('/unread-count', asyncHandler(async (req, res) => {
  const count = await Notification.unreadCount(req.user.sub);
  res.json({ count });
}));

router.patch('/:id/read', asyncHandler(async (req, res) => {
  const notification = await Notification.markRead(req.params.id, req.user.sub);
  res.json({ notification });
}));

router.patch('/read-all', asyncHandler(async (req, res) => {
  await Notification.markAllRead(req.user.sub);
  res.json({ ok: true });
}));

export default router;
