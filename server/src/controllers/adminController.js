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

export const createUser = asyncHandler(async (req, res) => {
  const institutionId = req.user.role === 'institution_admin' ? req.user.institutionId : req.body.institutionId;
  const user = await User.create({ ...req.body, institutionId });
  logAdminAction(req.user.sub, 'manage_user', { action: 'create', userId: user.user_id }, req);
  res.status(201).json({ user });
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.update(req.params.id, req.body);
  logAdminAction(req.user.sub, 'manage_user', { action: 'update', userId: req.params.id }, req);
  res.json({ user });
});

export const suspendUser = asyncHandler(async (req, res) => {
  const user = await User.setStatus(req.params.id, 'suspended');
  logAdminAction(req.user.sub, 'manage_user', { action: 'suspend', userId: req.params.id }, req);
  res.json({ user });
});

export const reactivateUser = asyncHandler(async (req, res) => {
  const user = await User.setStatus(req.params.id, 'active');
  logAdminAction(req.user.sub, 'manage_user', { action: 'reactivate', userId: req.params.id }, req);
  res.json({ user });
});

export const deleteUser = asyncHandler(async (req, res) => {
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
