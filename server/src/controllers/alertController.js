import { Group } from '../models/Group.js';
import { GroupAlert } from '../models/GroupAlert.js';
import { Notification } from '../models/Notification.js';
import { broadcast } from '../services/notificationService.js';
import { asyncHandler } from '../utils/helpers.js';

const CHANNELS = ['app', 'sms', 'whatsapp', 'all'];

export const sendAlert = asyncHandler(async (req, res) => {
  const { groupId, title, message, channel = 'app' } = req.body;
  if (!groupId || !title || !message) return res.status(400).json({ error: 'groupId, title, and message are required.' });
  if (!CHANNELS.includes(channel)) return res.status(400).json({ error: `channel must be one of: ${CHANNELS.join(', ')}` });

  const group = await Group.findById(groupId);
  if (!group) return res.status(404).json({ error: 'Group not found.' });
  if (group.teacher_id !== req.user.sub) return res.status(403).json({ error: 'You can only message your own groups.' });

  const members = await Group.members(groupId);

  const alert = await GroupAlert.create({
    groupId, senderId: req.user.sub, title, message, channel, recipientCount: members.length,
  });

  // In-app notification fan-out
  if (channel === 'app' || channel === 'all') {
    await Promise.all(members.map((m) => Notification.create({
      userId: m.user_id,
      type: 'system',
      title: `Group alert: ${title}`,
      message,
    })));
  }

  // SMS / WhatsApp fan-out (simulated locally without real provider credentials)
  let deliveries = [];
  if (channel === 'sms' || channel === 'whatsapp' || channel === 'all') {
    deliveries = await broadcast(members, `${title}\n\n${message}`, channel === 'all' ? 'all' : channel);
  }

  res.status(201).json({ alert, recipientCount: members.length, deliveries });
});

export const myAlerts = asyncHandler(async (req, res) => {
  const alerts = await GroupAlert.listForTeacher(req.user.sub);
  res.json({ alerts });
});

export const alertsForGroup = asyncHandler(async (req, res) => {
  const alerts = await GroupAlert.listForGroup(req.params.groupId);
  res.json({ alerts });
});
