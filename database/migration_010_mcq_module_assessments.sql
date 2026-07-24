CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS mcq_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(160) NOT NULL,
  description TEXT,
  order_number INTEGER NOT NULL UNIQUE,
  passing_score INTEGER NOT NULL DEFAULT 90,
  total_questions INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mcq_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES mcq_modules(id) ON DELETE CASCADE,
  topic VARCHAR(160) NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option VARCHAR(20) NOT NULL CHECK (correct_option IN ('option_a', 'option_b', 'option_c', 'option_d')),
  explanation TEXT NOT NULL,
  difficulty VARCHAR(40) NOT NULL DEFAULT 'intermediate',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS student_mcq_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES mcq_modules(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  percentage INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  wrong_answers INTEGER NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT false,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  review_payload JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS student_module_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES mcq_modules(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('locked', 'available', 'completed')),
  score INTEGER,
  completed_at TIMESTAMPTZ,
  UNIQUE (student_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_mcq_questions_module ON mcq_questions(module_id);
CREATE INDEX IF NOT EXISTS idx_student_mcq_attempts_student ON student_mcq_attempts(student_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_mcq_attempts_module ON student_mcq_attempts(module_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_module_progress_student ON student_module_progress(student_id, status);
