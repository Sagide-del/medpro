import { resolveStudentSubscriptionAccess, describePremiumFeature } from '../services/subscriptionAccess.js';

export function requirePremiumAccess(featureKey) {
  return async (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Sign in to continue.' });
    if (req.user.role !== 'student') return next();

    const subscription = await resolveStudentSubscriptionAccess(req.user);
    if (subscription.allowed) {
      req.subscriptionAccess = subscription;
      return next();
    }

    return res.status(402).json({
      error: `An active subscription is required to use ${describePremiumFeature(featureKey)}. Visit /student/subscription to renew.`,
      code: 'SUBSCRIPTION_REQUIRED',
      feature: featureKey,
      subscription,
    });
  };
}
