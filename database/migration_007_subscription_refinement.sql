-- Migration 007: structured SaaS subscription refinement

CREATE TABLE IF NOT EXISTS subscription_plans (
  plan_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            VARCHAR(60) NOT NULL UNIQUE,
  name            VARCHAR(160) NOT NULL,
  type            VARCHAR(30) NOT NULL,
  price           NUMERIC(12,2) NOT NULL,
  currency        VARCHAR(10) NOT NULL DEFAULT 'KES',
  duration_days   INTEGER NOT NULL,
  features        JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscription_events (
  event_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id           UUID REFERENCES subscription_plans(plan_id) ON DELETE SET NULL,
  student_id        UUID REFERENCES users(user_id) ON DELETE SET NULL,
  institution_id    INTEGER REFERENCES institutions(institution_id) ON DELETE SET NULL,
  transaction_id    UUID REFERENCES revenue_transactions(transaction_id) ON DELETE SET NULL,
  event_type        VARCHAR(40) NOT NULL,
  status            VARCHAR(30) NOT NULL DEFAULT 'recorded',
  details           JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by        UUID REFERENCES users(user_id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_attempts (
  attempt_id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id        UUID NOT NULL REFERENCES revenue_transactions(transaction_id) ON DELETE CASCADE,
  plan_id               UUID REFERENCES subscription_plans(plan_id) ON DELETE SET NULL,
  provider              VARCHAR(30) NOT NULL DEFAULT 'mpesa',
  provider_reference    VARCHAR(120),
  checkout_request_id   VARCHAR(120),
  owner_user_id         UUID REFERENCES users(user_id) ON DELETE SET NULL,
  owner_institution_id  INTEGER REFERENCES institutions(institution_id) ON DELETE SET NULL,
  expected_amount       NUMERIC(12,2) NOT NULL,
  verified_amount       NUMERIC(12,2),
  phone                 VARCHAR(30),
  status                VARCHAR(30) NOT NULL DEFAULT 'pending',
  raw_request           JSONB NOT NULL DEFAULT '{}'::jsonb,
  raw_callback          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscription_plans_type_active
  ON subscription_plans (type, is_active);

CREATE INDEX IF NOT EXISTS idx_subscription_events_student
  ON subscription_events (student_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_subscription_events_institution
  ON subscription_events (institution_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_attempts_checkout
  ON payment_attempts (checkout_request_id);

CREATE INDEX IF NOT EXISTS idx_payment_attempts_transaction
  ON payment_attempts (transaction_id);

CREATE TRIGGER trg_subscription_plans_touch
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER trg_payment_attempts_touch
  BEFORE UPDATE ON payment_attempts
  FOR EACH ROW
  EXECUTE FUNCTION touch_updated_at();

INSERT INTO subscription_plans (code, name, type, price, currency, duration_days, features, is_active)
VALUES
  (
    'student_monthly',
    'Student Monthly',
    'student',
    300,
    'KES',
    30,
    '["Clinical Reference Cards","Skill Simulations","Practice Assessments","Assignments","Mock Exams","Premium Assessments"]'::jsonb,
    true
  ),
  (
    'institution_annual',
    'Institution Annual Licence',
    'institution',
    15000,
    'KES',
    365,
    '["Clinical Reference Cards","Skill Simulations","Practice Assessments","Assignments","Mock Exams","Premium Assessments","Institution Coverage"]'::jsonb,
    true
  )
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  duration_days = EXCLUDED.duration_days,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active;
