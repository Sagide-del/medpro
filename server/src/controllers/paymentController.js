import { Payment } from '../models/Payment.js';
import { Worksheet } from '../models/Worksheet.js';
import { FlashcardDeck } from '../models/FlashcardDeck.js';
import { MedicalGraphic } from '../models/MedicalGraphic.js';
import { ElibraryResource } from '../models/ElibraryResource.js';
import { Notification } from '../models/Notification.js';
import { SubscriptionPlan } from '../models/SubscriptionPlan.js';
import {
  stkPush,
  parseCallback,
  initiatePayment,
  recordPaymentAttempt,
  handleCallback,
  ACCESS_DURATION_HOURS,
  DEFAULT_STUDENT_SUBSCRIPTION_PRICE_KES,
} from '../services/paymentService.js';
import { handleWebhook as handleIntaSendWebhook } from '../services/intasendService.js';
import { resolveStudentSubscriptionAccess } from '../services/subscriptionAccess.js';
import { asyncHandler } from '../utils/helpers.js';

const MODELS = { worksheet: Worksheet, flashcard_deck: FlashcardDeck, graphic: MedicalGraphic, elibrary_resource: ElibraryResource };
const ID_FIELD = { worksheet: 'worksheet_id', flashcard_deck: 'deck_id', graphic: 'graphic_id', elibrary_resource: 'resource_id' };

export const purchase = asyncHandler(async (req, res) => {
  const { itemType, itemId, phone } = req.body;
  if (!MODELS[itemType]) return res.status(400).json({ error: 'itemType must be worksheet, flashcard_deck, graphic, or elibrary_resource.' });

  const item = await MODELS[itemType].findById(itemId);
  if (!item) return res.status(404).json({ error: 'Item not found.' });

  const alreadyUnlocked = await Payment.hasActiveAccess(req.user.sub, itemType, item[ID_FIELD[itemType]]);
  if (alreadyUnlocked) return res.status(409).json({ error: 'You already have access to this item.' });

  const stk = await stkPush({
    phone,
    amount: item.price,
    accountRef: item.title,
    description: `MedPro ${itemType}`,
  });

  const txn = await Payment.createPending({
    studentId: req.user.sub,
    institutionId: req.user.institutionId,
    itemType,
    itemId: item[ID_FIELD[itemType]],
    transactionType: itemType,
    amount: item.price,
    phone,
    mpesaCheckoutId: stk.checkoutRequestId,
  });

  // In local/dev mode without real Daraja credentials, auto-complete so the flow is testable end-to-end.
  if (stk.simulated) {
    await Payment.markCompleted(stk.checkoutRequestId, { mpesaCode: `SIM${Date.now().toString().slice(-8)}` });
    await Payment.grantAccess(req.user.sub, itemType, item[ID_FIELD[itemType]], ACCESS_DURATION_HOURS[itemType] || 48);
    await MODELS[itemType].incrementPurchases(item[ID_FIELD[itemType]]);
  }

  res.status(201).json({ transaction: txn, checkoutRequestId: stk.checkoutRequestId, simulated: !!stk.simulated });
});

export const mpesaCallback = asyncHandler(async (req, res) => {
  const result = parseCallback(req.body);
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  if (!result) return;

  const txn = await Payment.findByCheckoutId(result.checkoutRequestId);
  if (!txn) return;

  if (result.success) {
    if (txn.transaction_type === 'student_subscription' || txn.transaction_type === 'institution_subscription') {
      const code = txn.transaction_type === 'student_subscription' ? 'student_monthly' : 'institution_annual';
      const plan = await SubscriptionPlan.findActiveByCode(code);
      await handleCallback({ paymentModel: Payment, subscriptionPlan: plan, transaction: txn, callbackResult: result });
    } else {
      await Payment.markCompleted(result.checkoutRequestId, { mpesaCode: result.mpesaReceipt });
      await Payment.grantAccess(txn.student_id, txn.item_type, txn.item_id, ACCESS_DURATION_HOURS[txn.item_type] || 48);
      if (MODELS[txn.item_type]) await MODELS[txn.item_type].incrementPurchases(txn.item_id);
    }
    await Notification.create({
      userId: txn.student_id,
      type: 'payment',
      title: 'Purchase confirmed',
      message: `Your payment of Ksh ${txn.amount} was successful.`,
    });
  } else {
    await Payment.markFailed(result.checkoutRequestId);
    await Notification.create({
      userId: txn.student_id,
      type: 'payment',
      title: 'Payment failed',
      message: result.resultDesc || 'Your M-Pesa payment could not be completed.',
    });
  }
});

export const paymentStatus = asyncHandler(async (req, res) => {
  const txn = await Payment.findByCheckoutId(req.params.checkoutId);
  if (!txn) return res.status(404).json({ error: 'Transaction not found.' });
  // Prevent one student from viewing another student's transaction (amount, phone, mpesa code)
  // by guessing/enumerating checkout IDs. Admins/super admins may look up any transaction.
  const isOwner = String(txn.student_id) === String(req.user.sub);
  const isStaff = ['super_admin', 'institution_admin'].includes(req.user.role);
  if (!isOwner && !isStaff) return res.status(403).json({ error: 'You do not have permission to view this transaction.' });
  res.json({ status: txn.status, transaction: txn });
});

export const myPurchaseHistory = asyncHandler(async (req, res) => {
  const rows = await Payment.historyForStudent(req.user.sub);
  res.json({ transactions: rows });
});

// Whether this student can currently open assessments — either through their
// own Ksh 500/month subscription, or for free because their institution has
// an active site-license subscription.
export const subscriptionStatus = asyncHandler(async (req, res) => {
  const subscription = await resolveStudentSubscriptionAccess(req.user);
  res.json({
    active: subscription.allowed,
    source: subscription.source,
    status: subscription.status,
    expiresAt: subscription.expiresAt,
    price: Number(subscription.plan?.price ?? DEFAULT_STUDENT_SUBSCRIPTION_PRICE_KES),
    currency: subscription.plan?.currency || 'KES',
    features: subscription.plan?.features || [],
    reminders: subscription.reminders,
    premiumFeatures: subscription.premiumFeatures,
  });
});

export const subscribeToAssessments = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  const plan = await SubscriptionPlan.findActiveByCode('student_monthly');
  if (!plan) return res.status(500).json({ error: 'Student subscription plan is not configured.' });
  const amount = Number(plan.price);

  const stk = await initiatePayment({
    provider: 'mpesa',
    phone,
    amount,
    accountRef: plan.name,
    description: 'MedPro student',
  });

  const txn = await Payment.createPending({
    studentId: req.user.sub,
    institutionId: req.user.institutionId,
    itemType: 'subscription',
    itemId: null,
    transactionType: 'student_subscription',
    amount,
    phone,
    mpesaCheckoutId: stk.checkoutRequestId,
  });
  await recordPaymentAttempt({
    transactionId: txn.transaction_id,
    planId: plan.plan_id,
    provider: stk.provider || 'mpesa',
    paymentResponse: stk,
    ownerUserId: req.user.sub,
    ownerInstitutionId: req.user.institutionId,
    expectedAmount: amount,
    phone,
  });

  if (stk.simulated) {
    await Payment.markCompleted(stk.checkoutRequestId, { mpesaCode: `SIM${Date.now().toString().slice(-8)}` });
    await handleCallback({
      paymentModel: Payment,
      subscriptionPlan: plan,
      transaction: txn,
      callbackResult: {
        checkoutRequestId: stk.checkoutRequestId,
        success: true,
        mpesaReceipt: `SIM${Date.now().toString().slice(-8)}`,
        amount,
        phone,
      },
    });
  }

  res.status(201).json({ transaction: txn, checkoutRequestId: stk.checkoutRequestId, simulated: !!stk.simulated });
});

export const intasendWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-intasend-signature'] || req.headers['x-signature'];
  const result = await handleIntaSendWebhook(req.body, signature);
  if (!result.ok) {
    return res.status(result.status || 400).json({ error: result.reason || 'Webhook verification failed.' });
  }
  return res.status(200).json({ ok: true });
});
