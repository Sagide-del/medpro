import 'dotenv/config';
import { Payment } from '../models/Payment.js';
import { PaymentAttempt } from '../models/PaymentAttempt.js';
import { SubscriptionPlan } from '../models/SubscriptionPlan.js';
import { handleCallback as finalizeSubscriptionPayment } from './paymentService.js';
import { logger } from '../utils/logger.js';

const DEFAULT_TILL_NUMBER = '4382411';
const DEFAULT_REFERENCE_PREFIX = 'MPH';

function trimEnv(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function getTillNumber() {
  return trimEnv(process.env.TATUA_TILL_NUMBER) || DEFAULT_TILL_NUMBER;
}

function getReferencePrefix() {
  return trimEnv(process.env.TATUA_REFERENCE_PREFIX) || DEFAULT_REFERENCE_PREFIX;
}

function makeReference({ studentId }) {
  const seed = `${getReferencePrefix()}-${Date.now().toString(36)}-${String(studentId || '').slice(-6)}`;
  return seed.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 30);
}

function normalizeWebhookPayload(body = {}) {
  const payload = body.payment || body.data || body;
  return {
    event: String(payload.event || body.event || '').trim().toLowerCase(),
    transId: payload.transId || body.transId || null,
    shortcode: String(payload.shortcode || body.shortcode || '').trim(),
    phone: payload.phone || body.phone || payload.customer?.phone || null,
    amount: Number(payload.amount ?? body.amount ?? 0),
    billRef: payload.billRef || body.billRef || null,
    firstName: payload.firstName || body.firstName || null,
    middleName: payload.middleName || body.middleName || null,
    lastName: payload.lastName || body.lastName || null,
    timestamp: payload.timestamp || body.timestamp || null,
    raw: body,
  };
}

function verifyWebhookPayload(transaction, paymentAttempt, webhookPayload) {
  if (!transaction) return { ok: false, reason: 'Unknown transaction.' };
  if (!paymentAttempt) return { ok: false, reason: 'Unknown payment attempt.' };
  if (transaction.status === 'completed') return { ok: false, reason: 'Transaction already completed.' };
  if (webhookPayload.event !== 'payment.received') {
    return { ok: false, reason: `Unsupported Tatua event: ${webhookPayload.event || 'unknown'}.` };
  }
  if (!webhookPayload.billRef && !webhookPayload.transId) {
    return { ok: false, reason: 'Missing Tatua payment reference.' };
  }
  if (Number(transaction.amount) !== Number(webhookPayload.amount)) {
    return { ok: false, reason: 'Payment amount does not match expected subscription amount.' };
  }
  if (paymentAttempt.expected_amount && Number(paymentAttempt.expected_amount) !== Number(webhookPayload.amount)) {
    return { ok: false, reason: 'Verified amount does not match the recorded payment attempt.' };
  }
  if (paymentAttempt.phone && webhookPayload.phone) {
    const expected = String(paymentAttempt.phone).replace(/\D/g, '');
    const actual = String(webhookPayload.phone).replace(/\D/g, '');
    if (expected.slice(-9) !== actual.slice(-9)) {
      return { ok: false, reason: 'Payment ownership could not be verified.' };
    }
  }
  return { ok: true };
}

export async function createPayment({ amount, currency = 'KES', studentId, phone, name }) {
  const reference = makeReference({ studentId });
  logger.info({
    provider: 'tatua',
    tillNumber: getTillNumber(),
    amount,
    currency,
    hasPhone: Boolean(phone),
    hasName: Boolean(name),
    reference,
  });

  return {
    provider: 'tatua',
    paymentReference: reference,
    checkoutRequestId: reference,
    billRef: reference,
    tillNumber: getTillNumber(),
    amount: Number(amount),
    currency,
    instructions: `Pay KES ${Number(amount).toLocaleString('en-KE')} to Till ${getTillNumber()} and use reference ${reference}.`,
    raw: {
      provider: 'tatua',
      tillNumber: getTillNumber(),
      reference,
    },
  };
}

export async function handleWebhook(reqBody) {
  const webhookPayload = normalizeWebhookPayload(reqBody);
  if (webhookPayload.event !== 'payment.received') {
    return { ok: false, status: 400, reason: `Unsupported Tatua event: ${webhookPayload.event || 'unknown'}.` };
  }

  if (trimEnv(process.env.TATUA_TILL_NUMBER) && webhookPayload.shortcode && webhookPayload.shortcode !== trimEnv(process.env.TATUA_TILL_NUMBER)) {
    return { ok: false, status: 400, reason: 'Tatua shortcode mismatch.' };
  }

  const checkoutId = webhookPayload.billRef || webhookPayload.transId;
  const attempt = await PaymentAttempt.findByCheckoutRequestId(checkoutId);
  const transaction = attempt?.transaction_id
    ? await Payment.findById(attempt.transaction_id)
    : await Payment.findByCheckoutId(checkoutId);

  const verification = verifyWebhookPayload(transaction, attempt, webhookPayload);

  if (attempt) {
    await PaymentAttempt.updateStatus(attempt.attempt_id, {
      status: verification.ok ? 'verified' : 'failed',
      verifiedAmount: webhookPayload.amount,
      rawCallback: webhookPayload.raw,
    });
  }

  if (!verification.ok) {
    return {
      ok: false,
      status: verification.reason === 'Transaction already completed.' ? 200 : 400,
      reason: verification.reason,
    };
  }

  const plan = await SubscriptionPlan.findActiveByCode('student_monthly');
  const result = await finalizeSubscriptionPayment({
    paymentModel: Payment,
    subscriptionPlan: plan,
    transaction,
    callbackResult: {
      checkoutRequestId: checkoutId,
      success: true,
      mpesaReceipt: webhookPayload.transId || webhookPayload.billRef || checkoutId,
      amount: webhookPayload.amount,
      phone: webhookPayload.phone,
    },
  });

  return { ok: true, status: 200, result };
}
