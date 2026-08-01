import { User } from '../models/User.js';
import { logAdminAction } from '../middleware/audit.js';
import { asyncHandler } from '../utils/helpers.js';

function requireSuperAdmin(req, res) {
  if (req.user?.role !== 'super_admin') {
    res.status(403).json({ error: 'Super admin access is required.' });
    return false;
  }
  return true;
}

export const getUserHistory = asyncHandler(async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  const history = await User.history(req.params.id);
  if (!history.user && !history.audit.length && !history.communications.length && !history.schedules.length) {
    return res.status(404).json({ error: 'User not found.' });
  }
  res.json(history);
});

export const permanentDeleteUser = asyncHandler(async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  const deleted = await User.permanentDelete(req.params.id, req.user.sub, req.body?.reason || null);
  if (!deleted) {
    return res.status(404).json({ error: 'User not found.' });
  }
  logAdminAction(req.user.sub, 'manage_user', { action: 'permanent_delete', userId: req.params.id, reason: req.body?.reason || null }, req);
  res.json({ deleted: true, userId: req.params.id });
});

export const bulkPermanentDeleteUsers = asyncHandler(async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  const userIds = Array.isArray(req.body?.userIds) ? req.body.userIds : [];
  if (!userIds.length) {
    return res.status(400).json({ error: 'userIds must be a non-empty array.' });
  }
  const deletedUsers = await User.bulkPermanentDelete(userIds, req.user.sub, req.body?.reason || null);
  logAdminAction(req.user.sub, 'manage_user', {
    action: 'bulk_permanent_delete',
    userIds,
    deletedCount: deletedUsers.length,
    reason: req.body?.reason || null,
  }, req);
  res.json({ deletedCount: deletedUsers.length, userIds: deletedUsers.map((u) => u.user_id) });
});
