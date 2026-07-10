// M-Pesa Daraja API service (Safaricom) — STK Push for MedPro micro-payments
// Docs: https://developer.safaricom.co.ke/APIs/MpesaExpressSimulate
import 'dotenv/config';
import { normalizePhone, slugifyAccountRef } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

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

/**
 * Initiate an STK Push. Returns { checkoutRequestId, merchantRequestId }.
 * Falls back to a simulated checkout id in development if Daraja credentials are placeholders,
 * so the purchase flow can be exercised end-to-end without live Safaricom access.
 */
export async function stkPush({ phone, amount, accountRef, description }) {
  const usingPlaceholderCreds =
    !process.env.MPESA_CONSUMER_KEY || process.env.MPESA_CONSUMER_KEY === 'your_consumer_key';

  if (usingPlaceholderCreds && process.env.NODE_ENV !== 'production') {
    logger.warn('M-Pesa credentials are placeholders — simulating STK push for local development.');
    return {
      checkoutRequestId: `SIMULATED-${Date.now()}`,
      merchantRequestId: `SIMULATED-${Date.now()}`,
      simulated: true,
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
  return { checkoutRequestId: data.CheckoutRequestID, merchantRequestId: data.MerchantRequestID };
}

/** Parse the Daraja callback body into a flat result object */
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
    if (item.Name === 'Amount') result.amount = item.Value;
    if (item.Name === 'PhoneNumber') result.phone = String(item.Value);
  }
  return result;
}

/** Access duration per content type, in hours */
export const ACCESS_DURATION_HOURS = {
  worksheet: 48,
  flashcard_deck: 48,
  graphic: 24,
  assessment: 72,
  elibrary_resource: 24 * 365 * 10, // effectively permanent — it's a download, not a rental
};

/** Ksh 500/month unlocks every published assessment for a student. */
export const ASSESSMENT_SUBSCRIPTION_PRICE_KES = 500;
export const ASSESSMENT_SUBSCRIPTION_MONTHS = 1;
