import crypto from 'crypto';
import 'dotenv/config';
import { Payment } from '../models/Payment.js';
import { PaymentAttempt } from '../models/PaymentAttempt.js';
import { SubscriptionPlan } from '../models/SubscriptionPlan.js';
import { handleCallback as finalizeSubscriptionPayment } from './paymentService.js';
import { logger } from '../utils/logger.js';

const BASE_URL = process.env.INTASEND_BASE_URL || 'https://sandbox.intasend.com/api/v1';

function usingPlaceholders() {
  return !process.env.INTASEND_PUBLIC_KEY
    || !process.env.INTASEND_SECRET_KEY
    || process.env.INTASEND_PUBLIC_KEY === 'your_intasend_public_key'
    || process.env.INTASEND_SECRET_KEY === 'your_intasend_secret_key';
}

function normalizeWebhookPayload(body = {}) {
  const invoice = body.invoice || body.data || body;
  return {
    invoiceId: invoice.invoice_id || invoice.id || invoice.api_ref || null,
    state: String(invoice.state || invoice.status || invoice.invoice_status || '').toLowerCase(),
    value: Number(invoice.value ?? invoice.amount ?? invoice.invoice_amount ?? 0),
    account: invoice.account || invoice.phone_number || invoice.customer?.phone_number || invoice.customer?.phone || null,
    providerReference: invoice.provider_reference || invoice.tracking_id || invoice.reference || null,
    apiRef: invoice.api_ref || invoice.reference || null,
    raw: body,
  };
}

export async function createPayment({ amount, currency = 'KES', email, phone, name, apiRef, redirectUrl }) {
  if (usingPlaceholders() && process.env.NODE_ENV !== 'production') {
    logger.warn('IntaSend credentials are placeholders; simulating checkout for local development.');
    return {
      provider: 'intasend',
      checkoutRequestId: `INTASEND-SIM-${Date.now()}`,
      invoiceId: `INTASEND-SIM-${Date.now()}`,
      paymentUrl: redirectUrl || null,
      simulated: true,
      raw: { simulated: true },
    };
  }

  const res = await fetch(`${BASE_URL}/checkout/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-IntaSend-Public-Key-API': process.env.INTASEND_PUBLIC_KEY,
      Authorization: `Bearer ${process.env.INTASEND_SECRET_KEY}`,
    },
    body: JSON.stringify({
      public_key: process.env.INTASEND_PUBLIC_KEY,
      amount,
      currency,
      email,
      phone_number: phone,
      first_name: name?.split(' ')?.[0] || 'MedProHub',
      last_name: name?.split(' ')?.slice(1).join(' ') || 'Student',
      api_ref: apiRef,
      redirect_url: redirectUrl || process.env.INTASEND_REDIRECT_URL,
      host: process.env.INTASEND_HOST_URL || undefined,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || data.message || `IntaSend payment request failed (${res.status})`);
  }

  return {
    provider: 'intasend',
    checkoutRequestId: data.invoice?.invoice_id || data.invoice_id || data.id || apiRef,
    invoiceId: data.invoice?.invoice_id || data.invoice_id || data.id || apiRef,
    paymentUrl: data.url || data.invoice?.url || data.checkout_url || null,
    raw: data,
  };
}

export async function verifyPayment({ transaction, paymentAttempt, webhookPayload }) {
  if (!transaction) return { ok: false, reason: 'Unknown transaction.' };
  if (!paymentAttempt) return { ok: false, reason: 'Unknown payment attempt.' };
  if (transaction.status === 'completed') return { ok: false, reason: 'Transaction already completed.' };

  const successfulStates = ['complete', 'completed', 'paid', 'successful', 'succeeded'];
  if (!successfulStates.includes(webhookPayload.state)) {
    return { ok: false, reason: `Payment state is ${webhookPayload.state || 'unknown'}.` };
  }

  if (Number(transaction.amount) !== Number(webhookPayload.value)) {
    return { ok: false, reason: 'Payment amount does not match expected subscription amount.' };
  }

  if (paymentAttempt.expected_amount && Number(paymentAttempt.expected_amount) !== Number(webhookPayload.value)) {
    return { ok: false, reason: 'Verified amount does not match the recorded payment attempt.' };
  }

  if (paymentAttempt.phone && webhookPayload.account) {
    const normalize = (value) => String(value).replace(/\D/g, '');
    if (normalize(paymentAttempt.phone).slice(-9) !== normalize(webhookPayload.account).slice(-9)) {
      return { ok: false, reason: 'Payment ownership could not be verified.' };
    }
  }

  return { ok: true };
}

export async function handleWebhook(reqBody, signatureHeader) {
  if (process.env.INTASEND_WEBHOOK_SECRET && signatureHeader) {
    const expected = crypto
      .createHmac('sha256', process.env.INTASEND_WEBHOOK_SECRET)
      .update(JSON.stringify(reqBody))
      .digest('hex');
    if (expected !== signatureHeader) {
      return { ok: false, status: 401, reason: 'Invalid IntaSend webhook signature.' };
    }
  }

  const webhookPayload = normalizeWebhookPayload(reqBody);
  const attempt = await PaymentAttempt.findByCheckoutRequestId(webhookPayload.invoiceId);
  const transaction = attempt?.transaction_id ? await Payment.findById(attempt.transaction_id) : await Payment.findByCheckoutId(webhookPayload.invoiceId);
  const verification = await verifyPayment({ transaction, paymentAttempt: attempt, webhookPayload });

  if (attempt) {
    await PaymentAttempt.updateStatus(attempt.attempt_id, {
      status: verification.ok ? 'verified' : 'failed',
      verifiedAmount: webhookPayload.value,
      rawCallback: webhookPayload.raw,
    });
  }

  if (!verification.ok) {
    return { ok: false, status: verification.reason === 'Transaction already completed.' ? 200 : 400, reason: verification.reason };
  }

  const plan = await SubscriptionPlan.findActiveByCode('student_monthly');
  const result = await finalizeSubscriptionPayment({
    paymentModel: Payment,
    subscriptionPlan: plan,
    transaction,
    callbackResult: {
      checkoutRequestId: webhookPayload.invoiceId,
      success: true,
      mpesaReceipt: webhookPayload.providerReference || webhookPayload.apiRef || webhookPayload.invoiceId,
      amount: webhookPayload.value,
      phone: webhookPayload.account,
    },
  });

  return { ok: true, status: 200, result };
}
