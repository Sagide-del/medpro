-- Migration 022: Tatua student subscription support

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'payment_method'
      AND e.enumlabel = 'tatua'
  ) THEN
    NULL;
  ELSIF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    ALTER TYPE payment_method ADD VALUE 'tatua';
  END IF;
END $$;

INSERT INTO subscription_plans (code, name, type, price, currency, duration_days, features, is_active)
VALUES
  (
    'student_monthly',
    'Student Monthly',
    'student',
    150,
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
