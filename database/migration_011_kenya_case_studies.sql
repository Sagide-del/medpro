CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS case_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(220) NOT NULL,
  location VARCHAR(180) NOT NULL,
  incident_date VARCHAR(120) NOT NULL,
  category VARCHAR(160) NOT NULL,
  difficulty VARCHAR(40) NOT NULL DEFAULT 'intermediate',
  description TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  order_number INTEGER NOT NULL UNIQUE,
  passing_percentage INTEGER NOT NULL DEFAULT 70,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS case_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES case_studies(id) ON DELETE CASCADE,
  phase VARCHAR(40) NOT NULL DEFAULT 'Phase 1',
  question TEXT NOT NULL,
  question_type VARCHAR(30) NOT NULL CHECK (question_type IN ('multiple_choice', 'short_answer')),
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer JSONB NOT NULL DEFAULT '{}'::jsonb,
  explanation TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS student_case_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES case_studies(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  percentage INTEGER NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT false,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  review_payload JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS student_case_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES case_studies(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('locked', 'available', 'completed')),
  score INTEGER,
  completed_at TIMESTAMPTZ,
  UNIQUE (student_id, case_id)
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'case_studies'
      AND column_name = 'date'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'case_studies'
      AND column_name = 'incident_date'
  ) THEN
    ALTER TABLE case_studies ADD COLUMN incident_date VARCHAR(120);
    EXECUTE 'UPDATE case_studies SET incident_date = "date" WHERE incident_date IS NULL';
  END IF;
END $$;

ALTER TABLE case_studies
  ADD COLUMN IF NOT EXISTS content JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS passing_percentage INTEGER NOT NULL DEFAULT 70,
  ADD COLUMN IF NOT EXISTS incident_date VARCHAR(120),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'student_case_attempts'
      AND column_name = 'completed_at'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'student_case_attempts'
      AND column_name = 'submitted_at'
  ) THEN
    ALTER TABLE student_case_attempts ADD COLUMN submitted_at TIMESTAMPTZ;
    UPDATE student_case_attempts
    SET submitted_at = completed_at
    WHERE submitted_at IS NULL;
  END IF;
END $$;

ALTER TABLE student_case_attempts
  ADD COLUMN IF NOT EXISTS submitted_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS review_payload JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

ALTER TABLE case_questions
  ADD COLUMN IF NOT EXISTS phase VARCHAR(40) NOT NULL DEFAULT 'Phase 1';

CREATE INDEX IF NOT EXISTS idx_case_questions_case ON case_questions(case_id);
CREATE INDEX IF NOT EXISTS idx_student_case_attempts_student ON student_case_attempts(student_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_case_progress_student ON student_case_progress(student_id, status);
