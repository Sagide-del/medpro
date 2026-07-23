import { query } from '../config/database.js';

export const PaymentAttempt = {
  async create({
    transactionId,
    planId,
    provider = 'mpesa',
    providerReference,
    checkoutRequestId,
    ownerUserId,
    ownerInstitutionId,
    expectedAmount,
    phone,
    rawRequest = {},
  }) {
    const { rows } = await query(
      `INSERT INTO payment_attempts
       (transaction_id, plan_id, provider, provider_reference, checkout_request_id, owner_user_id, owner_institution_id, expected_amount, phone, raw_request)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        transactionId,
        planId || null,
        provider,
        providerReference || null,
        checkoutRequestId || null,
        ownerUserId || null,
        ownerInstitutionId || null,
        expectedAmount,
        phone || null,
        rawRequest,
      ]
    );
    return rows[0];
  },

  async findByCheckoutRequestId(checkoutRequestId) {
    const { rows } = await query(
      `SELECT * FROM payment_attempts WHERE checkout_request_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [checkoutRequestId]
    );
    return rows[0] || null;
  },

  async updateStatus(attemptId, { status, verifiedAmount, rawCallback = {} }) {
    const { rows } = await query(
      `UPDATE payment_attempts
       SET status = COALESCE($2, status),
           verified_amount = COALESCE($3, verified_amount),
           raw_callback = CASE
             WHEN $4::jsonb = '{}'::jsonb THEN raw_callback
             ELSE raw_callback || $4::jsonb
           END
       WHERE attempt_id = $1
       RETURNING *`,
      [attemptId, status || null, verifiedAmount ?? null, rawCallback]
    );
    return rows[0] || null;
  },
};
