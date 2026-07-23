import 'dotenv/config';
import { normalizePhone, slugifyAccountRef } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';
import { StudentSubscription } from '../models/StudentSubscription.js';
import { Institution } from '../models/Institution.js';
import { SubscriptionEvent } from '../models/SubscriptionEvent.js';
import { PaymentAttempt } from '../models/PaymentAttempt.js';

const BASE =
  process.env.MPESA_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64');

  const res = await fetch(`${BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) throw new Error(`Daraja token request failed: ${res.status}`);
  const data = await res.json();

  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (Number(data.expires_in) - 60) * 1000;
  return cachedToken;
}

async function mpesaInitiatePayment({ phone, amount, accountRef, description }) {
  const usingPlaceholderCreds =
    !process.env.MPESA_CONSUMER_KEY || process.env.MPESA_CONSUMER_KEY === 'your_consumer_key';

  if (usingPlaceholderCreds && process.env.NODE_ENV !== 'production') {
    logger.warn('M-Pesa credentials are placeholders — simulating STK push for local development.');
    return {
      checkoutRequestId: `SIMULATED-${Date.now()}`,
      merchantRequestId: `SIMULATED-${Date.now()}`,
      simulated: true,
      provider: 'mpesa',
    };
  }

  const token = await getAccessToken();
  const shortcode = process.env.MPESA_SHORTCODE;
  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const password = Buffer.from(`${shortcode}${process.env.MPESA_PASSKEY}${timestamp}`).toString('base64');

  const res = await fetch(`${BASE}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.max(1, Math.round(amount)),
      PartyA: normalizePhone(phone),
      PartyB: shortcode,
      PhoneNumber: normalizePhone(phone),
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: slugifyAccountRef(accountRef),
      TransactionDesc: (description || 'MedPro purchase').slice(0, 13),
    }),
  });

  const data = await res.json();
  if (data.ResponseCode !== '0') {
    throw new Error(data.errorMessage || data.ResponseDescription || 'STK push failed');
  }

  return {
    checkoutRequestId: data.CheckoutRequestID,
    merchantRequestId: data.MerchantRequestID,
    provider: 'mpesa',
  };
}

export async function initiatePayment({ provider = 'mpesa', phone, amount, accountRef, description }) {
  if (provider !== 'mpesa') {
    throw new Error(`Unsupported payment provider: ${provider}`);
  }
  return mpesaInitiatePayment({ phone, amount, accountRef, description });
}

export function parseCallback(body) {
  const cb = body?.Body?.stkCallback;
  if (!cb) return null;

  const result = {
    checkoutRequestId: cb.CheckoutRequestID,
    success: cb.ResultCode === 0,
    resultDesc: cb.ResultDesc,
    mpesaReceipt: null,
    amount: null,
    phone: null,
  };

  for (const item of cb.CallbackMetadata?.Item || []) {
    if (item.Name === 'MpesaReceiptNumber') result.mpesaReceipt = item.Value;
    if (item.Name === 'Amount') result.amount = Number(item.Value);
    if (item.Name === 'PhoneNumber') result.phone = String(item.Value);
  }
  return result;
}

export async function verifyPayment({ transaction, callbackResult, attempt }) {
  if (!transaction) {
    return { ok: false, reason: 'Unknown transaction.' };
  }

  if (transaction.status === 'completed') {
    return { ok: false, reason: 'Transaction already completed.' };
  }

  if (!callbackResult?.success) {
    return { ok: false, reason: callbackResult?.resultDesc || 'Payment not successful.' };
  }

  if (!callbackResult.mpesaReceipt) {
    return { ok: false, reason: 'Missing transaction reference.' };
  }

  if (Number(callbackResult.amount) !== Number(transaction.amount)) {
    return { ok: false, reason: 'Payment amount does not match expected subscription amount.' };
  }

  if (attempt?.expected_amount && Number(attempt.expected_amount) !== Number(callbackResult.amount)) {
    return { ok: false, reason: 'Verified amount does not match the recorded payment attempt.' };
  }

  if (attempt?.phone && callbackResult.phone) {
    const expectedPhone = normalizePhone(attempt.phone);
    const actualPhone = normalizePhone(callbackResult.phone);
    if (expectedPhone !== actualPhone) {
      return { ok: false, reason: 'Payment ownership could not be verified.' };
    }
  }

  return { ok: true };
}

export async function activateSubscription({ plan, transaction, actorUserId, actorInstitutionId }) {
  let subscriptionRecord = null;

  if (transaction.transaction_type === 'student_subscription') {
    subscriptionRecord = await StudentSubscription.createForDays({
      studentId: transaction.student_id,
      amount: transaction.amount,
      durationDays: Number(plan.duration_days || 30),
    });
  } else if (transaction.transaction_type === 'institution_subscription') {
    subscriptionRecord = await Institution.addSubscriptionForDays(transaction.institution_id, {
      amount: transaction.amount,
      durationDays: Number(plan.duration_days || 365),
    });
  } else {
    throw new Error(`Unsupported subscription transaction type: ${transaction.transaction_type}`);
  }

  await SubscriptionEvent.create({
    planId: plan.plan_id,
    studentId: transaction.student_id,
    institutionId: transaction.institution_id,
    transactionId: transaction.transaction_id,
    eventType: 'activated',
    status: 'success',
    details: {
      transactionType: transaction.transaction_type,
      amount: transaction.amount,
      expiresAt: subscriptionRecord.expires_at,
    },
    createdBy: actorUserId || null,
  });

  return subscriptionRecord;
}

export async function handleCallback({ paymentModel, subscriptionPlan, transaction, callbackResult }) {
  const attempt = await PaymentAttempt.findByCheckoutRequestId(callbackResult.checkoutRequestId);
  const verification = await verifyPayment({ transaction, callbackResult, attempt });

  if (attempt) {
    await PaymentAttempt.updateStatus(attempt.attempt_id, {
      status: verification.ok ? 'verified' : 'failed',
      verifiedAmount: callbackResult.amount,
      rawCallback: callbackResult,
    });
  }

  if (!verification.ok) {
    await SubscriptionEvent.create({
      planId: subscriptionPlan?.plan_id,
      studentId: transaction?.student_id,
      institutionId: transaction?.institution_id,
      transactionId: transaction?.transaction_id,
      eventType: 'verification_failed',
      status: 'failed',
      details: { reason: verification.reason, callbackResult },
    });
    return verification;
  }

  const completed = await paymentModel.markCompleted(callbackResult.checkoutRequestId, { mpesaCode: callbackResult.mpesaReceipt });
  await activateSubscription({
    plan: subscriptionPlan,
    transaction: completed,
    actorUserId: completed.student_id,
    actorInstitutionId: completed.institution_id,
  });
  return { ok: true, transaction: completed };
}

export async function recordPaymentAttempt({
  transactionId,
  planId,
  provider,
  paymentResponse,
  ownerUserId,
  ownerInstitutionId,
  expectedAmount,
  phone,
}) {
  return PaymentAttempt.create({
    transactionId,
    planId,
    provider,
    providerReference: paymentResponse.merchantRequestId,
    checkoutRequestId: paymentResponse.checkoutRequestId,
    ownerUserId,
    ownerInstitutionId,
    expectedAmount,
    phone,
    rawRequest: paymentResponse,
  });
}

export const ACCESS_DURATION_HOURS = {
  worksheet: 48,
  flashcard_deck: 48,
  graphic: 24,
  assessment: 72,
  elibrary_resource: 24 * 365 * 10,
};

export const DEFAULT_STUDENT_SUBSCRIPTION_PRICE_KES = 300;
export const DEFAULT_STUDENT_SUBSCRIPTION_DAYS = 30;

export async function stkPush(args) {
  return initiatePayment({ provider: 'mpesa', ...args });
}
