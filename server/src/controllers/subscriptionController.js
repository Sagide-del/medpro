import { query } from '../config/database.js';
import { SubscriptionPlan } from '../models/SubscriptionPlan.js';
import { Payment } from '../models/Payment.js';
import { Institution } from '../models/Institution.js';
import { Notification } from '../models/Notification.js';
import { initiatePayment, recordPaymentAttempt, handleCallback } from '../services/paymentService.js';
import { createPayment as createIntaSendPayment } from '../services/intasendService.js';
import { resolveStudentSubscriptionAccess, resolveInstitutionSubscriptionAccess } from '../services/subscriptionAccess.js';
import { asyncHandler } from '../utils/helpers.js';

export const listPlans = asyncHandler(async (req, res) => {
  const includeInactive = req.user?.role === 'super_admin';
  const plans = await SubscriptionPlan.list({ includeInactive, type: req.query.type });
  res.json({ plans });
});

export const updatePlan = asyncHandler(async (req, res) => {
  const plan = await SubscriptionPlan.update(req.params.id, req.body);
  if (!plan) return res.status(404).json({ error: 'Subscription plan not found.' });
  res.json({ plan });
});

export const studentSubscriptionSummary = asyncHandler(async (req, res) => {
  const summary = await resolveStudentSubscriptionAccess(req.user);
  const transactions = await Payment.historyForStudent(req.user.sub, { limit: 20 });
  res.json({ subscription: summary, transactions });
});

export const renewStudentSubscription = asyncHandler(async (req, res) => {
  const plan = await SubscriptionPlan.findActiveByCode('student_monthly');
  if (!plan) return res.status(500).json({ error: 'Student subscription plan is not configured.' });

  const payment = await createIntaSendPayment({
    amount: Number(plan.price),
    currency: plan.currency || 'KES',
    email: req.user.email,
    phone: req.body.phone,
    name: req.user.name || req.user.full_name || 'MedProHub Student',
    apiRef: `student-sub-${req.user.sub}-${Date.now()}`,
    redirectUrl: process.env.INTASEND_REDIRECT_URL,
  });

  const transaction = await Payment.createPending({
    studentId: req.user.sub,
    institutionId: req.user.institutionId,
    itemType: 'subscription',
    itemId: null,
    transactionType: 'student_subscription',
    amount: Number(plan.price),
    phone: req.body.phone,
    mpesaCheckoutId: payment.checkoutRequestId,
    paymentMethod: 'intasend',
  });

  await recordPaymentAttempt({
    transactionId: transaction.transaction_id,
    planId: plan.plan_id,
    provider: payment.provider || 'intasend',
    paymentResponse: payment,
    ownerUserId: req.user.sub,
    ownerInstitutionId: req.user.institutionId,
    expectedAmount: Number(plan.price),
    phone: req.body.phone,
  });

  if (payment.simulated) {
    await handleCallback({
      paymentModel: Payment,
      subscriptionPlan: plan,
      transaction,
      callbackResult: {
        checkoutRequestId: payment.checkoutRequestId,
        success: true,
        mpesaReceipt: `SIM${Date.now().toString().slice(-8)}`,
        amount: Number(plan.price),
        phone: req.body.phone,
      },
    });
  }

  res.status(201).json({
    transaction,
    checkoutRequestId: payment.checkoutRequestId,
    paymentUrl: payment.paymentUrl,
    simulated: !!payment.simulated,
    provider: 'intasend',
  });
});

export const institutionLicenceSummary = asyncHandler(async (req, res) => {
  const institutionId = req.user.role === 'super_admin'
    ? Number(req.query.institutionId || req.params.institutionId)
    : req.user.institutionId;

  if (!institutionId) return res.status(400).json({ error: 'Institution is required.' });

  const subscription = await resolveInstitutionSubscriptionAccess(institutionId);
  const institution = await Institution.findById(institutionId);
  const transactions = await Payment.historyForInstitution(institutionId, { limit: 20 });
  res.json({ institution, subscription, transactions });
});

export const renewInstitutionLicence = asyncHandler(async (req, res) => {
  const institutionId = req.user.role === 'super_admin'
    ? Number(req.body.institutionId || req.params.institutionId)
    : req.user.institutionId;
  const plan = await SubscriptionPlan.findActiveByCode('institution_annual');

  if (!institutionId) return res.status(400).json({ error: 'Institution is required.' });
  if (!plan) return res.status(500).json({ error: 'Institution annual licence plan is not configured.' });

  const payment = await initiatePayment({
    provider: 'mpesa',
    phone: req.body.phone,
    amount: Number(plan.price),
    accountRef: plan.name,
    description: 'MedPro licence',
  });

  const transaction = await Payment.createPending({
    studentId: null,
    institutionId,
    itemType: 'subscription',
    itemId: null,
    transactionType: 'institution_subscription',
    amount: Number(plan.price),
    phone: req.body.phone,
    mpesaCheckoutId: payment.checkoutRequestId,
  });

  await recordPaymentAttempt({
    transactionId: transaction.transaction_id,
    planId: plan.plan_id,
    provider: payment.provider || 'mpesa',
    paymentResponse: payment,
    ownerUserId: req.user.sub,
    ownerInstitutionId: institutionId,
    expectedAmount: Number(plan.price),
    phone: req.body.phone,
  });

  if (payment.simulated) {
    await handleCallback({
      paymentModel: Payment,
      subscriptionPlan: plan,
      transaction,
      callbackResult: {
        checkoutRequestId: payment.checkoutRequestId,
        success: true,
        mpesaReceipt: `SIM${Date.now().toString().slice(-8)}`,
        amount: Number(plan.price),
        phone: req.body.phone,
      },
    });
    await Notification.create({
      userId: req.user.sub,
      type: 'subscription',
      title: 'Institution licence renewed',
      message: `Your institution licence payment of Ksh ${Number(plan.price).toLocaleString('en-KE')} was recorded successfully.`,
    });
  }

  res.status(201).json({ transaction, checkoutRequestId: payment.checkoutRequestId, simulated: !!payment.simulated });
});

export const superAdminOverview = asyncHandler(async (_req, res) => {
  const plans = await SubscriptionPlan.list({ includeInactive: true });
  const recentPayments = await Payment.listRecent({ limit: 50 });
  const { rows: subscriptionSummary } = await query(
    `SELECT transaction_type, status, COUNT(*)::int AS count, COALESCE(SUM(amount), 0) AS total
     FROM revenue_transactions
     WHERE transaction_type IN ('student_subscription', 'institution_subscription')
     GROUP BY transaction_type, status
     ORDER BY transaction_type, status`
  );
  const { rows: revenueSummary } = await query(
    `SELECT date_trunc('month', transaction_date) AS month, COALESCE(SUM(amount), 0) AS total
     FROM revenue_transactions
     WHERE status = 'completed'
       AND transaction_type IN ('student_subscription', 'institution_subscription')
     GROUP BY 1
     ORDER BY 1 DESC
     LIMIT 12`
  );
  res.json({ plans, recentPayments, subscriptionSummary, revenueSummary });
});
