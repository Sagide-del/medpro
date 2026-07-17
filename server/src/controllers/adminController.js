import { User } from '../models/User.js';
import { Institution } from '../models/Institution.js';
import { analyticsService } from '../services/analyticsService.js';
import { logAdminAction } from '../middleware/audit.js';
import { asyncHandler } from '../utils/helpers.js';

export const listUsers = asyncHandler(async (req, res) => {
  const { role, status, search, page = 1, limit = 20 } = req.query;
  const institutionId = req.user.role === 'institution_admin' ? req.user.institutionId : req.query.institutionId;
  const { rows, total } = await User.list({
    role, institutionId, status, search,
    limit: Number(limit), offset: (Number(page) - 1) * Number(limit),
  });
  res.json({ users: rows, total, page: Number(page), limit: Number(limit) });
});

// institution_admin may only create teacher/student accounts within their own
// institution — without this, a request body containing `role: "super_admin"`
// (or `institutionId` pointing at another school) would be trusted verbatim
// and let a lower-privileged admin mint a super admin or cross-tenant account.
const ROLES_INSTITUTION_ADMIN_CAN_ASSIGN = ['teacher', 'student'];

export const createUser = asyncHandler(async (req, res) => {
  const institutionId = req.user.role === 'institution_admin' ? req.user.institutionId : req.body.institutionId;
  let { role } = req.body;
  if (req.user.role === 'institution_admin') {
    if (role && !ROLES_INSTITUTION_ADMIN_CAN_ASSIGN.includes(role)) {
      return res.status(403).json({ error: 'Institution admins may only create teacher or student accounts.' });
    }
    role = role || 'student';
  }
  const user = await User.create({ ...req.body, role, institutionId });
  logAdminAction(req.user.sub, 'manage_user', { action: 'create', userId: user.user_id }, req);
  res.status(201).json({ user });
});

// institution_admin may only manage users within their own institution;
// super_admin can act on anyone. Without this check an institution_admin
// could update/suspend/delete a user belonging to a different institution
// just by guessing/incrementing the user id.
async function assertCanManageUser(req, res, userId) {
  if (req.user.role === 'super_admin') return true;
  const target = await User.findById(userId);
  if (!target) {
    res.status(404).json({ error: 'User not found.' });
    return false;
  }
  if (String(target.institution_id) !== String(req.user.institutionId)) {
    res.status(403).json({ error: 'You do not have permission to manage this user.' });
    return false;
  }
  return true;
}

export const updateUser = asyncHandler(async (req, res) => {
  if (!(await assertCanManageUser(req, res, req.params.id))) return;
  const user = await User.update(req.params.id, req.body);
  logAdminAction(req.user.sub, 'manage_user', { action: 'update', userId: req.params.id }, req);
  res.json({ user });
});

export const suspendUser = asyncHandler(async (req, res) => {
  if (!(await assertCanManageUser(req, res, req.params.id))) return;
  const user = await User.setStatus(req.params.id, 'suspended');
  logAdminAction(req.user.sub, 'manage_user', { action: 'suspend', userId: req.params.id }, req);
  res.json({ user });
});

export const reactivateUser = asyncHandler(async (req, res) => {
  if (!(await assertCanManageUser(req, res, req.params.id))) return;
  const user = await User.setStatus(req.params.id, 'active');
  logAdminAction(req.user.sub, 'manage_user', { action: 'reactivate', userId: req.params.id }, req);
  res.json({ user });
});

export const deleteUser = asyncHandler(async (req, res) => {
  if (!(await assertCanManageUser(req, res, req.params.id))) return;
  await User.softDelete(req.params.id);
  logAdminAction(req.user.sub, 'manage_user', { action: 'delete', userId: req.params.id }, req);
  res.status(204).end();
});

export const changeUserRole = asyncHandler(async (req, res) => {
  const user = await User.setRole(req.params.id, req.body.role);
  logAdminAction(req.user.sub, 'manage_user', { action: 'change_role', userId: req.params.id, role: req.body.role }, req);
  res.json({ user });
});

export const dashboardOverview = asyncHandler(async (req, res) => {
  const institutionId = req.user.role === 'institution_admin' ? req.user.institutionId : undefined;
  const overview = await analyticsService.overview({ institutionId });
  res.json(overview);
});

export const auditLog = asyncHandler(async (req, res) => {
  const overview = await analyticsService.overview({});
  res.json({ recentActivity: overview.recentActivity });
});

export const listInstitutionsAdmin = asyncHandler(async (_req, res) => {
  const rows = await Institution.list();
  res.json({ institutions: rows });
});
