import { User } from '../models/User.js';
import { comparePassword, signToken } from '../config/auth.js';
import { logAdminAction } from '../middleware/audit.js';
import { asyncHandler } from '../utils/helpers.js';

function toPublicUser(user) {
  return {
    id: user.user_id,
    name: user.full_name,
    email: user.email,
    role: user.role,
    institution: user.institution_name,
    institutionId: user.institution_id,
    regNumber: user.reg_number,
    program: user.program,
  };
}

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

  const user = await User.findByEmail(email);
  if (!user || user.status !== 'active' || !(await comparePassword(password, user.password_hash))) {
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  }

  const token = signToken({
    sub: user.user_id,
    role: user.role,
    name: user.full_name,
    institutionId: user.institution_id,
  });

  await User.touchLastActive(user.user_id);
  if (user.role === 'super_admin' || user.role === 'institution_admin') {
    logAdminAction(user.user_id, 'login', { email }, req);
  }

  res.json({ token, user: toPublicUser(user) });
});

export const register = asyncHandler(async (req, res) => {
  const { fullName, email, phone, password, institutionId, regNumber, program, yearOfStudy, role } = req.body;
  if (!fullName || !email || !password) {
    return res.status(400).json({ error: 'Full name, email, and password are required.' });
  }
  const existing = await User.findByEmail(email);
  if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });

  // Public self-registration is limited to students; other roles are provisioned by admins.
  // `role` is intentionally destructured above and then ignored here so a crafted
  // request body (e.g. { role: "super_admin" }) can never escalate on signup.
  void role;

  const user = await User.create({
    institutionId, regNumber, fullName, email, phone, password, role: 'student', program, yearOfStudy,
  });

  const token = signToken({ sub: user.user_id, role: user.role, name: user.full_name, institutionId: user.institution_id });
  res.status(201).json({ token, user: toPublicUser({ ...user, institution_name: null }) });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.sub);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ user: toPublicUser(user) });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Current and new password are required.' });

  const user = await User.findByEmail((await User.findById(req.user.sub)).email);
  if (!(await comparePassword(currentPassword, user.password_hash))) {
    return res.status(401).json({ error: 'Current password is incorrect.' });
  }
  await User.setPassword(user.user_id, newPassword);
  res.json({ message: 'Password updated.' });
});
