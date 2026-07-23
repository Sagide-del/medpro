import { StudentSubscription } from '../models/StudentSubscription.js';
import { Institution } from '../models/Institution.js';
import { SubscriptionPlan } from '../models/SubscriptionPlan.js';
import { Payment } from '../models/Payment.js';

const REMINDER_OFFSETS = [7, 3, 1];
const PREMIUM_FEATURES = {
  clinical_reference_cards: 'Clinical Reference Cards',
  assignments: 'Assignments',
  clinical_simulations: 'Clinical Simulations',
  mock_exams: 'Mock Exams',
  premium_assessments: 'Premium Assessments',
};

function toIso(value) {
  return value ? new Date(value).toISOString() : null;
}

function buildReminders(expiresAt) {
  if (!expiresAt) return [];
  const expiry = new Date(expiresAt).getTime();
  const now = Date.now();
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysLeft = Math.ceil((expiry - now) / msPerDay);

  if (daysLeft < 0) {
    return [{ offsetDays: 0, label: 'Expired', due: true }];
  }

  return REMINDER_OFFSETS.map((offsetDays) => ({
    offsetDays,
    label: `${offsetDays} day reminder`,
    due: daysLeft <= offsetDays,
  }));
}

function normalizeStatus(record, fallback = 'expired') {
  if (!record) return fallback;
  const expiry = record.expires_at ? new Date(record.expires_at).getTime() : null;
  if (expiry && expiry <= Date.now() && ['active', 'trial', 'expiring'].includes(record.status)) {
    return 'expired';
  }
  if (record.status === 'trial') return 'active';
  return record.status || fallback;
}

export async function resolveStudentSubscriptionAccess(user) {
  const plan = await SubscriptionPlan.findActiveByCode('student_monthly');
  const personalActive = await StudentSubscription.findActive(user.sub);
  if (personalActive) {
    return {
      allowed: true,
      source: 'personal',
      status: 'active',
      expiresAt: toIso(personalActive.expires_at),
      plan,
      reminders: buildReminders(personalActive.expires_at),
      premiumFeatures: Object.values(PREMIUM_FEATURES),
    };
  }

  const institutionLicence = await Institution.getCurrentLicence(user.institutionId);
  if (institutionLicence && normalizeStatus(institutionLicence) === 'active') {
    return {
      allowed: true,
      source: 'institution',
      status: 'active',
      expiresAt: toIso(institutionLicence.expires_at),
      plan: await SubscriptionPlan.findActiveByCode('institution_annual'),
      reminders: buildReminders(institutionLicence.expires_at),
      premiumFeatures: Object.values(PREMIUM_FEATURES),
    };
  }

  const latest = await StudentSubscription.latestForStudent(user.sub);
  const pendingPayment = await Payment.findLatestPendingSubscriptionTransaction({
    studentId: user.sub,
    transactionType: 'student_subscription',
  });

  if (pendingPayment) {
    return {
      allowed: false,
      source: 'personal',
      status: 'pending',
      expiresAt: null,
      plan,
      reminders: [],
      premiumFeatures: Object.values(PREMIUM_FEATURES),
    };
  }

  return {
    allowed: false,
    source: latest ? 'personal' : institutionLicence ? 'institution' : null,
    status: latest ? normalizeStatus(latest) : institutionLicence ? normalizeStatus(institutionLicence) : 'expired',
    expiresAt: toIso(latest?.expires_at || institutionLicence?.expires_at),
    plan,
    reminders: buildReminders(latest?.expires_at || institutionLicence?.expires_at),
    premiumFeatures: Object.values(PREMIUM_FEATURES),
  };
}

export async function resolveInstitutionSubscriptionAccess(institutionId) {
  const plan = await SubscriptionPlan.findActiveByCode('institution_annual');
  const licence = await Institution.getCurrentLicence(institutionId);
  const counts = await Institution.getCoverageCounts(institutionId);
  const status = normalizeStatus(licence);

  return {
    allowed: status === 'active',
    status,
    expiresAt: toIso(licence?.expires_at),
    licence,
    plan,
    reminders: buildReminders(licence?.expires_at),
    counts,
  };
}

export function describePremiumFeature(featureKey) {
  return PREMIUM_FEATURES[featureKey] || 'Premium feature';
}
