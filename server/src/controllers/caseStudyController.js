import { CaseStudy } from '../models/CaseStudy.js';
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

export const listCaseStudies = asyncHandler(async (req, res) => {
  const cases = await CaseStudy.listForStudent(req.user.sub);
  const subscription = await resolveStudentSubscriptionAccess(req.user);
  res.json({ cases, subscription });
});

export const getCaseStudy = asyncHandler(async (req, res) => {
  const subscription = await assertSubscription(req, res);
  if (!subscription) return;

  const payload = await CaseStudy.startPayload(req.user.sub, req.params.caseId);
  if (!payload) return res.status(404).json({ error: 'Kenya EMS case not found.' });
  if (payload.caseStudy.status === 'locked') {
    return res.status(403).json({ error: 'This Kenya EMS case is currently locked.' });
  }

  res.json(payload);
});

export const submitCaseStudy = asyncHandler(async (req, res) => {
  const subscription = await assertSubscription(req, res);
  if (!subscription) return;

  const result = await CaseStudy.submitAttempt({
    studentId: req.user.sub,
    caseId: req.params.caseId,
    answers: req.body.answers || {},
  });
  if (!result) return res.status(404).json({ error: 'Kenya EMS case not found.' });

  await Notification.create({
    userId: req.user.sub,
    type: 'grade',
    title: 'Kenya EMS case submitted',
    message: `You scored ${result.attempt.percentage}% in ${result.caseStudy.title}.`,
  });

  res.json(result);
});

export const getCaseStudyAttemptReview = asyncHandler(async (req, res) => {
  const attempt = await CaseStudy.attemptReview(req.user.sub, req.params.attemptId);
  if (!attempt) return res.status(404).json({ error: 'Attempt not found.' });

  res.json({
    attempt,
    review: attempt.review_payload || [],
  });
});
