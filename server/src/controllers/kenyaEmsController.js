import { KenyaEmsProgress } from '../models/KenyaEmsProgress.js';
import { Notification } from '../models/Notification.js';
import { resolveStudentSubscriptionAccess } from '../services/subscriptionAccess.js';
import { asyncHandler } from '../utils/helpers.js';

async function assertSubscription(req, res) {
  const subscription = await resolveStudentSubscriptionAccess(req.user);
  if (!subscription.allowed) {
    res.status(402).json({
      error: 'An active subscription is required to continue with Kenya EMS Cases.',
      code: 'SUBSCRIPTION_REQUIRED',
      subscription,
    });
    return null;
  }
  return subscription;
}

export const listKenyaEmsCases = asyncHandler(async (req, res) => {
  const cases = await KenyaEmsProgress.listForStudent(req.user.sub);
  const subscription = await resolveStudentSubscriptionAccess(req.user);
  res.json({ cases, subscription });
});

export const getKenyaEmsCase = asyncHandler(async (req, res) => {
  const subscription = await assertSubscription(req, res);
  if (!subscription) return;

  const caseStudy = await KenyaEmsProgress.getForStudent(req.user.sub, req.params.caseNumber);
  if (!caseStudy) return res.status(404).json({ error: 'Kenya EMS case not found.' });
  if (caseStudy.status === 'locked') {
    return res.status(403).json({ error: 'This Kenya EMS case is currently locked.' });
  }

  res.json({ caseStudy });
});

export const submitKenyaEmsCase = asyncHandler(async (req, res) => {
  const subscription = await assertSubscription(req, res);
  if (!subscription) return;

  const result = await KenyaEmsProgress.submitAttempt({
    studentId: req.user.sub,
    caseNumber: req.params.caseNumber,
    answers: req.body.answers || {},
  });
  if (!result) return res.status(404).json({ error: 'Kenya EMS case not found.' });

  await Notification.create({
    userId: req.user.sub,
    type: 'grade',
    title: 'Kenya EMS case submitted',
    message: `You scored ${result.attempt.percentage}% in ${result.title}.`,
  });

  res.json(result);
});
