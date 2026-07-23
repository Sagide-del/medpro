import { CommunicationAutomation } from '../models/CommunicationAutomation.js';
import { asyncHandler } from '../utils/helpers.js';

export const listAutomation = asyncHandler(async (req, res) => {
  const data = await CommunicationAutomation.listAll({
    institutionId: req.user.institutionId,
    role: req.user.role,
  });
  res.json(data);
});

export const createTemplate = asyncHandler(async (req, res) => {
  const { name, channel, eventType, body } = req.body;
  if (!name || !channel || !eventType || !body) {
    return res.status(400).json({ error: 'name, channel, eventType, and body are required.' });
  }
  const template = await CommunicationAutomation.createTemplate({
    institutionId: req.user.role === 'super_admin' ? req.body.institutionId : req.user.institutionId,
    createdBy: req.user.sub,
    ...req.body,
  });
  res.status(201).json({ template });
});

export const triggerEvent = asyncHandler(async (req, res) => {
  const { eventType, title, message, channel, recipientUserIds } = req.body;
  if (!eventType || !title || !message || !channel) {
    return res.status(400).json({ error: 'eventType, title, message, and channel are required.' });
  }
  const history = await CommunicationAutomation.triggerEvent({
    institutionId: req.user.role === 'super_admin' ? req.body.institutionId : req.user.institutionId,
    eventType,
    title,
    message,
    channel,
    recipientUserIds,
  });
  res.status(201).json({ history });
});
