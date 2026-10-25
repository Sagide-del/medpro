import {syncNotificationEvents} from '../services/notificationEvents.js';
import { Router } from 'express';
import { Notification } from '../models/Notification.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../utils/helpers.js';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  await syncNotificationEvents(req.user);
  const notifications=await Notification.listForUser(req.user.sub,{unreadOnly:req.query.unread==='true'||req.query.filter==='unread',actionOnly:req.query.filter==='action'});
  res.json({notifications,counts:await Notification.summary(req.user.sub)});
}));

router.get('/unread-count', asyncHandler(async (req, res) => {
  const count = await Notification.unreadCount(req.user.sub);
  res.json({ count });
}));

router.patch('/:id/read', asyncHandler(async (req, res) => {
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id))return res.status(400).json({error:'Invalid notification identifier.'});
  const notification = await Notification.markRead(req.params.id, req.user.sub);
  if(!notification)return res.status(404).json({error:'Notification not found.'});
  res.json({ notification });
}));

router.patch('/read-all', asyncHandler(async (req, res) => {
  await Notification.markAllRead(req.user.sub);
  res.json({ ok: true });
}));

export default router;
