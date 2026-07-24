ALTER TABLE student_case_progress
  ADD COLUMN IF NOT EXISTS responses JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_student_case_progress_case
  ON student_case_progress(case_id, student_id);
