import { MockPreTest } from '../models/MockPreTest.js';
import { Notification } from '../models/Notification.js';
import { resolveStudentSubscriptionAccess } from '../services/subscriptionAccess.js';
import { asyncHandler } from '../utils/helpers.js';

// Exams -> MCQ -> Mock Pre-Test. Purely additive feature: does not read from
// or write to the existing mcq_modules/mcq_questions/student_mcq_attempts
// tables, so the existing formal MCQ exam system is completely unaffected.

async function assertSubscription(req, res) {
  const subscription = await resolveStudentSubscriptionAccess(req.user);
  if (!subscription.allowed) {
    res.status(402).json({
      error: 'An active subscription is required to use the Mock Pre-Test.',
      code: 'SUBSCRIPTION_REQUIRED',
      subscription,
    });
    return null;
  }
  return subscription;
}

export const listMockPreTestModules = asyncHandler(async (req, res) => {
  const subscription = await resolveStudentSubscriptionAccess(req.user);
  res.json({
    modules: MockPreTest.listModules(),
    questionCountOptions: MockPreTest.QUESTION_COUNT_OPTIONS,
    subscription,
  });
});

export const startMockPreTest = asyncHandler(async (req, res) => {
  const subscription = await assertSubscription(req, res);
  if (!subscription) return;

  const { module, questionCount } = req.body || {};
  try {
    const session = MockPreTest.startTest({ module, questionCount });
    res.json(session);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Could not start the Mock Pre-Test.' });
  }
});

export const submitMockPreTest = asyncHandler(async (req, res) => {
  const subscription = await assertSubscription(req, res);
  if (!subscription) return;

  const { module, answers } = req.body || {};
  let result;
  try {
    result = MockPreTest.submitTest({ module, answers });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message || 'Could not grade the Mock Pre-Test.' });
  }

  await Notification.create({
    userId: req.user.sub,
    type: 'grade',
    title: 'Mock Pre-Test submitted',
    message: `You scored ${result.score}% (${result.correctCount}/${result.totalCount}) on the ${result.module} Mock Pre-Test.`,
  });

  res.json(result);
});
