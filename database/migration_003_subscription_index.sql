-- Migration 003: index to speed up the Ksh 500/month assessment subscription
-- lookup (StudentSubscription.findActive runs on every assessment view/attempt).
-- Additive and idempotent — safe to re-run.

CREATE INDEX IF NOT EXISTS idx_student_sub_active
  ON student_subscriptions (student_id, expires_at);
