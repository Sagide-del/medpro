import { Router } from 'express';
import { Group } from '../models/Group.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import { asyncHandler } from '../utils/helpers.js';

const router = Router();

router.get('/', authenticate, requireRole('teacher'), asyncHandler(async (req, res) => {
  const groups = await Group.listByTeacher(req.user.sub);
  res.json({ groups });
}));

router.get('/mine', authenticate, requireRole('student'), asyncHandler(async (req, res) => {
  const groups = await Group.listByStudent(req.user.sub);
  res.json({ groups });
}));

router.post('/', authenticate, requireRole('teacher'), asyncHandler(async (req, res) => {
  const group = await Group.create({ ...req.body, teacherId: req.user.sub, institutionId: req.user.institutionId });
  res.status(201).json({ group });
}));

router.get('/:id/members', authenticate, requireRole('teacher', 'institution_admin', 'super_admin'), asyncHandler(async (req, res) => {
  const members = await Group.members(req.params.id);
  res.json({ members });
}));

router.post('/:id/members', authenticate, requireRole('teacher'), asyncHandler(async (req, res) => {
  const member = await Group.addMember(req.params.id, req.body.studentId);
  res.status(201).json({ member });
}));

router.delete('/:id/members/:studentId', authenticate, requireRole('teacher'), asyncHandler(async (req, res) => {
  await Group.removeMember(req.params.id, req.params.studentId);
  res.status(204).end();
}));

router.delete('/:id', authenticate, requireRole('teacher'), asyncHandler(async (req, res) => {
  await Group.delete(req.params.id);
  res.status(204).end();
}));

export default router;
