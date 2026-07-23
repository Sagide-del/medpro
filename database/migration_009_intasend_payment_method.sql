BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'payment_method'
      AND e.enumlabel = 'intasend'
  ) THEN
    ALTER TYPE payment_method ADD VALUE 'intasend';
  END IF;
END $$;

COMMIT;
