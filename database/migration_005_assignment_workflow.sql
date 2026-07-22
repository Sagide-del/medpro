CREATE TABLE IF NOT EXISTS question_bank (
  bank_question_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id INTEGER REFERENCES institutions(institution_id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
  program VARCHAR(30) NOT NULL CHECK (program IN ('EMT', 'Paramedic')),
  module VARCHAR(120) NOT NULL,
  topic VARCHAR(160) NOT NULL,
  skill VARCHAR(160) NOT NULL,
  difficulty difficulty_level NOT NULL DEFAULT 'intermediate',
  question_type VARCHAR(40) NOT NULL,
  prompt TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT,
  explanation TEXT,
  learning_objective TEXT,
  marking_guide TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assignments (
  assignment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  institution_id INTEGER NOT NULL REFERENCES institutions(institution_id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  program VARCHAR(30) NOT NULL CHECK (program IN ('EMT', 'Paramedic')),
  module VARCHAR(120) NOT NULL,
  topic VARCHAR(160) NOT NULL,
  skill VARCHAR(160) NOT NULL,
  difficulty difficulty_level NOT NULL DEFAULT 'intermediate',
  assignment_type VARCHAR(40) NOT NULL,
  number_of_questions INTEGER NOT NULL DEFAULT 0,
  time_limit_minutes INTEGER,
  due_date TIMESTAMPTZ,
  instructions TEXT,
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  status content_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assignment_questions (
  assignment_question_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES assignments(assignment_id) ON DELETE CASCADE,
  question_type VARCHAR(40) NOT NULL,
  prompt TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT,
  explanation TEXT,
  learning_objective TEXT,
  marking_guide TEXT,
  difficulty difficulty_level NOT NULL DEFAULT 'intermediate',
  points INTEGER NOT NULL DEFAULT 5,
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS assignment_submissions (
  submission_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES assignments(assignment_id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  status attempt_status NOT NULL DEFAULT 'in_progress',
  score_pct NUMERIC(5,2),
  points_awarded INTEGER,
  teacher_comments TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  graded_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS assignment_answers (
  assignment_answer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES assignment_submissions(submission_id) ON DELETE CASCADE,
  assignment_question_id UUID NOT NULL REFERENCES assignment_questions(assignment_question_id) ON DELETE CASCADE,
  response TEXT,
  is_correct BOOLEAN,
  points_awarded INTEGER DEFAULT 0,
  feedback TEXT
);

CREATE TABLE IF NOT EXISTS grading_feedback (
  feedback_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL UNIQUE REFERENCES assignment_submissions(submission_id) ON DELETE CASCADE,
  ai_suggested_score NUMERIC(5,2),
  ai_reasoning TEXT,
  ai_feedback TEXT,
  weak_topics JSONB DEFAULT '[]'::jsonb,
  recommended_cards JSONB DEFAULT '[]'::jsonb,
  recommended_simulations JSONB DEFAULT '[]'::jsonb,
  teacher_comments TEXT,
  released_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_generation_logs (
  log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  institution_id INTEGER REFERENCES institutions(institution_id) ON DELETE SET NULL,
  program VARCHAR(30),
  module VARCHAR(120),
  topic VARCHAR(160),
  skill VARCHAR(160),
  difficulty difficulty_level,
  question_type VARCHAR(40),
  number_of_questions INTEGER,
  prompt_payload JSONB DEFAULT '{}'::jsonb,
  generated_payload JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_question_bank_inst ON question_bank (institution_id, program, module, topic);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher ON assignments (teacher_id, institution_id, status);
CREATE INDEX IF NOT EXISTS idx_assignments_group ON assignments (group_id, due_date);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student ON assignment_submissions (student_id, status);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment ON assignment_submissions (assignment_id, status);

DROP TRIGGER IF EXISTS trg_question_bank_touch ON question_bank;
CREATE TRIGGER trg_question_bank_touch
BEFORE UPDATE ON question_bank
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_assignments_touch ON assignments;
CREATE TRIGGER trg_assignments_touch
BEFORE UPDATE ON assignments
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_grading_feedback_touch ON grading_feedback;
CREATE TRIGGER trg_grading_feedback_touch
BEFORE UPDATE ON grading_feedback
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
