// SMS / WhatsApp alert delivery — same "simulate locally, plug in real
// credentials for production" pattern as services/paymentService.js.
//
// SMS: wire up Africa's Talking (https://africastalking.com) by setting
//   AT_API_KEY and AT_USERNAME in .env and replacing sendSms's body.
// WhatsApp: wire up the WhatsApp Business Cloud API by setting
//   WHATSAPP_TOKEN and WHATSAPP_PHONE_ID in .env and replacing sendWhatsapp's body.
import 'dotenv/config';
import { logger } from '../utils/logger.js';
import { normalizePhone } from '../utils/helpers.js';

function hasCreds(...vars) {
  return vars.every((v) => process.env[v] && !process.env[v].startsWith('your_'));
}

/** Sends a single SMS. Returns { status: 'sent' | 'simulated' | 'failed' }. */
export async function sendSms(phone, message) {
  if (!hasCreds('AT_API_KEY', 'AT_USERNAME')) {
    logger.warn(`SMS credentials are placeholders — simulating SMS to ${normalizePhone(phone)}: "${message.slice(0, 60)}..."`);
    return { status: 'simulated', phone: normalizePhone(phone) };
  }

  try {
    const res = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        apiKey: process.env.AT_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        username: process.env.AT_USERNAME,
        to: `+${normalizePhone(phone)}`,
        message,
      }),
    });
    if (!res.ok) throw new Error(`Africa's Talking request failed: ${res.status}`);
    return { status: 'sent', phone: normalizePhone(phone) };
  } catch (err) {
    logger.error('sendSms failed:', err.message);
    return { status: 'failed', phone: normalizePhone(phone), error: err.message };
  }
}

/** Sends a single WhatsApp message. Returns { status: 'sent' | 'simulated' | 'failed' }. */
export async function sendWhatsapp(phone, message) {
  if (!hasCreds('WHATSAPP_TOKEN', 'WHATSAPP_PHONE_ID')) {
    logger.warn(`WhatsApp credentials are placeholders — simulating WhatsApp message to ${normalizePhone(phone)}: "${message.slice(0, 60)}..."`);
    return { status: 'simulated', phone: normalizePhone(phone) };
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: normalizePhone(phone),
        type: 'text',
        text: { body: message },
      }),
    });
    if (!res.ok) throw new Error(`WhatsApp Cloud API request failed: ${res.status}`);
    return { status: 'sent', phone: normalizePhone(phone) };
  } catch (err) {
    logger.error('sendWhatsapp failed:', err.message);
    return { status: 'failed', phone: normalizePhone(phone), error: err.message };
  }
}

/** Fans a message out to a list of { phone } recipients over the requested channel(s). */
export async function broadcast(recipients, message, channel) {
  const results = [];
  for (const r of recipients) {
    if (!r.phone) continue;
    if (channel === 'sms' || channel === 'all') results.push(await sendSms(r.phone, message));
    if (channel === 'whatsapp' || channel === 'all') results.push(await sendWhatsapp(r.phone, message));
  }
  return results;
}
