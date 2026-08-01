import 'dotenv/config';
import { logger } from '../utils/logger.js';

function hasSendGridConfig() {
  return Boolean(
    process.env.SENDGRID_API_KEY
    && process.env.SENDGRID_FROM_EMAIL
    && !process.env.SENDGRID_API_KEY.startsWith('your_')
    && !process.env.SENDGRID_FROM_EMAIL.startsWith('your_')
  );
}

export async function sendEmail({ to, subject, text, html, replyTo }) {
  if (!to) {
    return { status: 'failed', error: 'Recipient email is required.' };
  }

  if (!hasSendGridConfig()) {
    logger.warn(`Email credentials are placeholders — simulating email to ${to}: "${String(subject || text || '').slice(0, 60)}..."`);
    return { status: 'simulated', to };
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }], subject: subject || 'MedProHub notification' }],
        from: { email: process.env.SENDGRID_FROM_EMAIL },
        reply_to: replyTo ? { email: replyTo } : undefined,
        content: [
          text ? { type: 'text/plain', value: text } : null,
          html ? { type: 'text/html', value: html } : null,
        ].filter(Boolean),
      }),
    });

    if (!response.ok) {
      throw new Error(`SendGrid request failed (${response.status})`);
    }

    return { status: 'sent', to };
  } catch (error) {
    logger.error('sendEmail failed:', error.message);
    return { status: 'failed', to, error: error.message };
  }
}
