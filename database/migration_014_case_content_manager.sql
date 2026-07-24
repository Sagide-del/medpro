ALTER TABLE case_studies
  ADD COLUMN IF NOT EXISTS content_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS grading_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(user_id),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT false;

UPDATE case_studies
SET content_json = COALESCE(NULLIF(content_json, '{}'::jsonb), COALESCE(content, '{}'::jsonb))
WHERE content_json = '{}'::jsonb OR content_json IS NULL;

UPDATE case_studies
SET grading_json = COALESCE(NULLIF(grading_json, '{}'::jsonb), '{}'::jsonb)
WHERE grading_json IS NULL;

CREATE INDEX IF NOT EXISTS idx_case_studies_active_order
  ON case_studies(is_active, order_number);
