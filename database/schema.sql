-- ============================================================
-- MedPro — EMS/Paramedicine Education Platform
-- Database Schema (PostgreSQL 14+)
-- Developed by SA Technologies
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------- ENUMS ----------
CREATE TYPE user_role          AS ENUM ('super_admin', 'institution_admin', 'teacher', 'student');
CREATE TYPE user_status        AS ENUM ('active', 'suspended', 'pending', 'deleted');
CREATE TYPE plan_type          AS ENUM ('trial', 'basic', 'professional', 'enterprise');
CREATE TYPE sub_status         AS ENUM ('trial', 'active', 'expiring', 'expired', 'cancelled');
CREATE TYPE difficulty_level   AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE bloom_level        AS ENUM ('remember', 'understand', 'apply', 'analyze', 'evaluate', 'create');
CREATE TYPE assessment_type    AS ENUM ('quiz', 'scenario', 'exam');
CREATE TYPE attempt_status     AS ENUM ('in_progress', 'submitted', 'graded');
CREATE TYPE question_type      AS ENUM ('mcq', 'short_answer', 'fill_blank', 'scenario_step');
CREATE TYPE content_status     AS ENUM ('draft', 'published');
CREATE TYPE txn_type           AS ENUM ('institution_subscription', 'student_subscription', 'worksheet', 'flashcard_deck', 'graphic', 'assessment', 'elibrary_resource');
CREATE TYPE txn_status         AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE payment_method     AS ENUM ('mpesa', 'bank', 'subscription', 'admin_grant');
CREATE TYPE review_status      AS ENUM ('submitted', 'approved', 'rejected', 'revision_requested');
CREATE TYPE notification_type  AS ENUM ('payment', 'grade', 'approval', 'subscription', 'system');
CREATE TYPE admin_action       AS ENUM ('upload', 'edit', 'delete', 'publish', 'manage_user', 'manage_institution', 'refund', 'login', 'settings', 'grade', 'approve');

-- ---------- INSTITUTIONS ----------
CREATE TABLE institutions (
  institution_id SERIAL PRIMARY KEY,
  name           VARCHAR(160) NOT NULL,
  short_code     VARCHAR(20)  UNIQUE NOT NULL,
  contact_email  VARCHAR(160),
  contact_phone  VARCHAR(30),
  address        TEXT,
  logo_url       VARCHAR(500),
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE institution_subscriptions (
  subscription_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id  INTEGER NOT NULL REFERENCES institutions(institution_id) ON DELETE CASCADE,
  plan            plan_type NOT NULL DEFAULT 'basic',
  status          sub_status NOT NULL DEFAULT 'trial',
  max_students    INTEGER NOT NULL DEFAULT 100,
  amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  starts_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_inst_sub_expiry ON institution_subscriptions (expires_at);

-- ---------- USERS ----------
CREATE TABLE users (
  user_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id INTEGER REFERENCES institutions(institution_id) ON DELETE SET NULL,
  reg_number     VARCHAR(40) UNIQUE,
  full_name      VARCHAR(160) NOT NULL,
  email          VARCHAR(160) UNIQUE NOT NULL,
  phone          VARCHAR(30),
  password_hash  VARCHAR(255) NOT NULL,
  role           user_role   NOT NULL DEFAULT 'student',
  status         user_status NOT NULL DEFAULT 'active',
  program        VARCHAR(120),
  year_of_study  SMALLINT,
  avatar_url     VARCHAR(500),
  last_active_at TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_users_institution ON users (institution_id);
CREATE INDEX idx_users_role        ON users (role);

CREATE TABLE student_subscriptions (
  subscription_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  status          sub_status NOT NULL DEFAULT 'active',
  amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  starts_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ NOT NULL
);

-- ---------- GROUPS (teacher-managed cohorts) ----------
CREATE TABLE groups (
  group_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id INTEGER REFERENCES institutions(institution_id) ON DELETE CASCADE,
  teacher_id     UUID REFERENCES users(user_id) ON DELETE SET NULL,
  name           VARCHAR(160) NOT NULL,
  description    TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE group_members (
  group_id   UUID NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (group_id, student_id)
);

-- ---------- ASSESSMENTS (quiz / scenario / exam) ----------
CREATE TABLE assessments (
  assessment_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type                  assessment_type NOT NULL DEFAULT 'quiz',
  title                 VARCHAR(200) NOT NULL,
  description           TEXT,
  category              VARCHAR(80),
  difficulty            difficulty_level DEFAULT 'intermediate',
  bloom_level           bloom_level,
  time_limit_minutes    INTEGER,
  total_points          INTEGER NOT NULL DEFAULT 0,
  passing_score_pct     INTEGER NOT NULL DEFAULT 70,
  -- for type='scenario': NCSBN 6-step Clinical Judgment Model
  -- [recognize_cues, analyze_cues, prioritize_hypotheses, generate_solutions, take_action, evaluate_outcomes]
  clinical_judgment_steps JSONB DEFAULT '[]'::jsonb,
  group_id              UUID REFERENCES groups(group_id) ON DELETE SET NULL,
  institution_id        INTEGER REFERENCES institutions(institution_id) ON DELETE SET NULL,
  status                content_status NOT NULL DEFAULT 'draft',
  created_by             UUID REFERENCES users(user_id),
  created_at             TIMESTAMPTZ DEFAULT now(),
  updated_at             TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_assessments_status ON assessments (status, type);
CREATE INDEX idx_assessments_group  ON assessments (group_id);

CREATE TABLE assessment_questions (
  question_id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id  UUID NOT NULL REFERENCES assessments(assessment_id) ON DELETE CASCADE,
  question_type  question_type NOT NULL DEFAULT 'mcq',
  clinical_step  VARCHAR(40),  -- populated when assessment.type = 'scenario'
  prompt         TEXT NOT NULL,
  options        JSONB,
  correct_answer TEXT,
  points         INTEGER NOT NULL DEFAULT 5,
  position       INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_assess_questions ON assessment_questions (assessment_id);

CREATE TABLE assessment_attempts (
  attempt_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id  UUID NOT NULL REFERENCES assessments(assessment_id) ON DELETE CASCADE,
  student_id     UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  status         attempt_status NOT NULL DEFAULT 'in_progress',
  score_pct      NUMERIC(5,2),
  points_awarded INTEGER,
  started_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at   TIMESTAMPTZ,
  graded_at      TIMESTAMPTZ
);
CREATE INDEX idx_attempts_student ON assessment_attempts (student_id);
CREATE INDEX idx_attempts_assess  ON assessment_attempts (assessment_id);

CREATE TABLE assessment_answers (
  answer_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id     UUID NOT NULL REFERENCES assessment_attempts(attempt_id) ON DELETE CASCADE,
  question_id    UUID NOT NULL REFERENCES assessment_questions(question_id) ON DELETE CASCADE,
  response       TEXT,
  is_correct     BOOLEAN,
  points_awarded INTEGER DEFAULT 0
);
CREATE INDEX idx_answers_attempt ON assessment_answers (attempt_id);

-- ---------- WORKSHEETS (premium — Ksh 10) ----------
CREATE TABLE worksheets (
  worksheet_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title              VARCHAR(200) NOT NULL,
  description        TEXT,
  category           VARCHAR(80),
  difficulty         difficulty_level DEFAULT 'intermediate',
  bloom_level        bloom_level,
  price              NUMERIC(10,2) NOT NULL DEFAULT 10,
  time_limit_minutes INTEGER,
  total_points       INTEGER NOT NULL DEFAULT 0,
  passing_score_pct  INTEGER NOT NULL DEFAULT 70,
  status             content_status NOT NULL DEFAULT 'draft',
  uploaded_by        UUID REFERENCES users(user_id),
  file_url           VARCHAR(500),
  purchase_count     INTEGER NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ DEFAULT now(),
  updated_at         TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_worksheets_status ON worksheets (status);

CREATE TABLE worksheet_questions (
  question_id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worksheet_id   UUID NOT NULL REFERENCES worksheets(worksheet_id) ON DELETE CASCADE,
  question_type  VARCHAR(30) NOT NULL DEFAULT 'short_answer',
  prompt         TEXT NOT NULL,
  correct_answer TEXT,
  options        JSONB,
  points         INTEGER NOT NULL DEFAULT 5,
  position       INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_worksheet_questions ON worksheet_questions (worksheet_id);

CREATE TABLE worksheet_submissions (
  submission_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worksheet_id  UUID NOT NULL REFERENCES worksheets(worksheet_id) ON DELETE CASCADE,
  student_id    UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  answers       JSONB NOT NULL DEFAULT '[]'::jsonb,
  score_pct     NUMERIC(5,2),
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  graded_at     TIMESTAMPTZ
);
CREATE INDEX idx_worksheet_subs_student ON worksheet_submissions (student_id);

-- ---------- FLASHCARDS (premium — Ksh 10 per deck) ----------
CREATE TABLE flashcard_decks (
  deck_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title          VARCHAR(200) NOT NULL,
  description    TEXT,
  category       VARCHAR(80),
  difficulty     difficulty_level DEFAULT 'intermediate',
  price          NUMERIC(10,2) NOT NULL DEFAULT 10,
  card_count     INTEGER NOT NULL DEFAULT 0,
  status         content_status NOT NULL DEFAULT 'draft',
  uploaded_by    UUID REFERENCES users(user_id),
  purchase_count INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_decks_status ON flashcard_decks (status);

CREATE TABLE flashcards (
  card_id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deck_id    UUID NOT NULL REFERENCES flashcard_decks(deck_id) ON DELETE CASCADE,
  front      TEXT NOT NULL,
  back       TEXT NOT NULL,
  image_url  VARCHAR(500),
  position   INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_flashcards_deck ON flashcards (deck_id);

-- SM-2 spaced repetition progress, one row per student per card
CREATE TABLE flashcard_progress (
  progress_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id       UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  card_id          UUID NOT NULL REFERENCES flashcards(card_id) ON DELETE CASCADE,
  ease_factor      NUMERIC(4,2) NOT NULL DEFAULT 2.5,
  interval_days    INTEGER NOT NULL DEFAULT 1,
  repetitions      INTEGER NOT NULL DEFAULT 0,
  next_review_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_reviewed_at TIMESTAMPTZ,
  UNIQUE (student_id, card_id)
);
CREATE INDEX idx_progress_due ON flashcard_progress (student_id, next_review_at);

-- ---------- MEDICAL GRAPHICS (premium — Ksh 10) ----------
CREATE TABLE medical_graphics (
  graphic_id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title                VARCHAR(200) NOT NULL,
  description          TEXT,
  category             VARCHAR(80),
  graphic_type         VARCHAR(40),   -- ECG Strip, 3D Anatomy, Procedure, Pathophysiology, Medication
  tags                 TEXT[],
  price                NUMERIC(10,2) NOT NULL DEFAULT 10,
  file_url             VARCHAR(500),
  thumbnail_url        VARCHAR(500),
  interactive_features JSONB DEFAULT '{}'::jsonb,  -- {hover_annotations, zoom_pan, labels_toggle, rotation_3d}
  status               content_status NOT NULL DEFAULT 'draft',
  uploaded_by          UUID REFERENCES users(user_id),
  view_count           INTEGER NOT NULL DEFAULT 0,
  purchase_count       INTEGER NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_graphics_status ON medical_graphics (status);
CREATE INDEX idx_graphics_tags   ON medical_graphics USING GIN (tags);

-- ---------- CONTENT ACCESS (generic unlock grants for premium items) ----------
CREATE TABLE content_access (
  access_id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id   UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  content_type VARCHAR(20) NOT NULL,   -- worksheet | flashcard_deck | graphic
  content_id   UUID NOT NULL,
  granted_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ NOT NULL,
  UNIQUE (student_id, content_type, content_id, granted_at)
);
CREATE INDEX idx_access_student ON content_access (student_id, content_type, expires_at);

-- ---------- LOGBOOK ----------
CREATE TABLE logbooks (
  logbook_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id       UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  title            VARCHAR(200) NOT NULL DEFAULT 'Clinical Logbook',
  required_entries INTEGER NOT NULL DEFAULT 20,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE logbook_entries (
  entry_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  logbook_id       UUID NOT NULL REFERENCES logbooks(logbook_id) ON DELETE CASCADE,
  student_id       UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  patient_scenario TEXT NOT NULL,
  skills_performed TEXT[],
  reflection       TEXT,
  file_url         VARCHAR(500),
  status           review_status NOT NULL DEFAULT 'submitted',
  reviewed_by      UUID REFERENCES users(user_id),
  review_notes     TEXT,
  submitted_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at      TIMESTAMPTZ
);
CREATE INDEX idx_logbook_entries_student ON logbook_entries (student_id);
CREATE INDEX idx_logbook_entries_status  ON logbook_entries (status);

-- ---------- VIDEOS (skills demonstration upload + teacher review) ----------
CREATE TABLE videos (
  video_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id     UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  title          VARCHAR(200) NOT NULL,
  description    TEXT,
  skill_category VARCHAR(80),
  file_url       VARCHAR(500) NOT NULL,
  thumbnail_url  VARCHAR(500),
  status         review_status NOT NULL DEFAULT 'submitted',
  reviewed_by    UUID REFERENCES users(user_id),
  review_notes   TEXT,
  uploaded_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at    TIMESTAMPTZ
);
CREATE INDEX idx_videos_student ON videos (student_id);
CREATE INDEX idx_videos_status  ON videos (status);

-- ---------- REVENUE / PAYMENTS ----------
CREATE TABLE revenue_transactions (
  transaction_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id         UUID REFERENCES users(user_id) ON DELETE SET NULL,
  institution_id     INTEGER REFERENCES institutions(institution_id) ON DELETE SET NULL,
  item_type          VARCHAR(20),      -- worksheet | flashcard_deck | graphic | assessment | subscription
  item_id            UUID,
  transaction_type   txn_type NOT NULL,
  amount             NUMERIC(12,2) NOT NULL,
  payment_method     payment_method NOT NULL DEFAULT 'mpesa',
  mpesa_code         VARCHAR(30),
  mpesa_checkout_id  VARCHAR(60),
  phone              VARCHAR(30),
  status             txn_status NOT NULL DEFAULT 'pending',
  transaction_date   TIMESTAMPTZ DEFAULT now(),
  created_at         TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_txn_status_date ON revenue_transactions (status, transaction_date);
CREATE INDEX idx_txn_institution ON revenue_transactions (institution_id);
CREATE INDEX idx_txn_checkout    ON revenue_transactions (mpesa_checkout_id);
CREATE INDEX idx_txn_student     ON revenue_transactions (student_id);

-- ---------- PERFORMANCE ----------
CREATE TABLE student_performance (
  performance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id     UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  item_type      VARCHAR(20),
  item_id        UUID,
  domain         VARCHAR(30) NOT NULL,   -- knowledge | clinical | practical
  score_pct      NUMERIC(5,2) NOT NULL,
  time_spent_sec INTEGER,
  completed_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_perf_student ON student_performance (student_id);

-- ---------- NOTIFICATIONS ----------
CREATE TABLE notifications (
  notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  type            notification_type NOT NULL DEFAULT 'system',
  title           VARCHAR(200) NOT NULL,
  message         TEXT,
  link            VARCHAR(300),
  is_read         BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_notifications_user ON notifications (user_id, is_read, created_at);

-- ---------- E-LIBRARY ----------
CREATE TABLE elibrary_resources (
  resource_id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title          VARCHAR(200) NOT NULL,
  description    TEXT,
  category       VARCHAR(80),
  author         VARCHAR(160),
  file_url       VARCHAR(500),
  thumbnail_url  VARCHAR(500),
  price          NUMERIC(10,2) NOT NULL DEFAULT 20,   -- Ksh 20 for high-value resources; 0 = free
  is_premium     BOOLEAN NOT NULL DEFAULT true,
  download_count INTEGER NOT NULL DEFAULT 0,
  status         content_status NOT NULL DEFAULT 'draft',
  uploaded_by    UUID REFERENCES users(user_id),
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_elibrary_status ON elibrary_resources (status);

-- ---------- RESEARCH ----------
CREATE TABLE research_items (
  research_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            VARCHAR(200) NOT NULL,
  authors          VARCHAR(300),
  abstract         TEXT,
  category         VARCHAR(80),
  publication_date DATE,
  external_url     VARCHAR(500),
  file_url         VARCHAR(500),
  status           content_status NOT NULL DEFAULT 'draft',
  uploaded_by      UUID REFERENCES users(user_id),
  view_count       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_research_status ON research_items (status);

-- ---------- GROUP ALERTS (teacher -> group: in-app / SMS / WhatsApp) ----------
CREATE TABLE group_alerts (
  alert_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id        UUID NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,
  sender_id       UUID REFERENCES users(user_id) ON DELETE SET NULL,
  title           VARCHAR(200) NOT NULL,
  message         TEXT NOT NULL,
  channel         VARCHAR(20) NOT NULL DEFAULT 'app',  -- app | sms | whatsapp | all
  recipient_count INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_group_alerts_group ON group_alerts (group_id, created_at);

-- ---------- AUDIT ----------
CREATE TABLE super_admin_logs (
  log_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id       UUID REFERENCES users(user_id) ON DELETE SET NULL,
  action_type    admin_action NOT NULL,
  action_details JSONB DEFAULT '{}'::jsonb,
  ip_address     VARCHAR(45),
  user_agent     VARCHAR(300),
  created_at     TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_logs_admin_date ON super_admin_logs (admin_id, created_at);

-- ---------- updated_at trigger ----------
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_touch      BEFORE UPDATE ON users             FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_inst_touch       BEFORE UPDATE ON institutions      FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_assessments_touch BEFORE UPDATE ON assessments      FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_worksheets_touch BEFORE UPDATE ON worksheets        FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_decks_touch      BEFORE UPDATE ON flashcard_decks   FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_graphics_touch   BEFORE UPDATE ON medical_graphics  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_elibrary_touch   BEFORE UPDATE ON elibrary_resources FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_research_touch   BEFORE UPDATE ON research_items    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
