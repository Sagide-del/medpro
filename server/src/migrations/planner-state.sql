CREATE TABLE IF NOT EXISTS user_study_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  topic TEXT NOT NULL, duration_minutes INTEGER NOT NULL DEFAULT 0, studied_on DATE NOT NULL DEFAULT CURRENT_DATE,
  performance NUMERIC(5,2), mood INTEGER, sleep_quality INTEGER, energy_level INTEGER, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS memory_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  topic TEXT NOT NULL, difficulty NUMERIC(5,2) NOT NULL DEFAULT 5, stability NUMERIC(8,2) NOT NULL DEFAULT 1,
  retrievability NUMERIC(6,4) NOT NULL DEFAULT 0.9, last_reviewed_at TIMESTAMPTZ, next_review_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS risk_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  topic TEXT NOT NULL, priority_score NUMERIC(6,3) NOT NULL DEFAULT 0, risk_score NUMERIC(6,3) NOT NULL DEFAULT 0,
  risk_level TEXT NOT NULL DEFAULT 'low', current_mastery NUMERIC(5,2) NOT NULL DEFAULT 0,
  predicted_mastery_date DATE, exam_date DATE, calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS study_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  plan_date DATE NOT NULL DEFAULT CURRENT_DATE, exam_date DATE, daily_study_hours NUMERIC(5,2) NOT NULL DEFAULT 1,
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb, status TEXT NOT NULL DEFAULT 'active', created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Keep ambiguous historical data as legacy; rebuild verified state from attempts.
ALTER TABLE user_study_history ADD COLUMN IF NOT EXISTS program TEXT NOT NULL DEFAULT 'legacy';
ALTER TABLE user_study_history ADD COLUMN IF NOT EXISTS attempt_id UUID;
ALTER TABLE user_study_history ADD COLUMN IF NOT EXISTS source_kind TEXT NOT NULL DEFAULT 'self_report';
CREATE UNIQUE INDEX IF NOT EXISTS planner_verified_attempt ON user_study_history(attempt_id);
ALTER TABLE memory_state ADD COLUMN IF NOT EXISTS program TEXT NOT NULL DEFAULT 'legacy';
ALTER TABLE memory_state ADD COLUMN IF NOT EXISTS fsrs_card JSONB;
ALTER TABLE memory_state DROP CONSTRAINT IF EXISTS memory_state_user_id_topic_key;
CREATE UNIQUE INDEX IF NOT EXISTS memory_user_path_topic ON memory_state(user_id,program,topic);
ALTER TABLE risk_predictions ADD COLUMN IF NOT EXISTS program TEXT NOT NULL DEFAULT 'legacy';
ALTER TABLE risk_predictions ADD COLUMN IF NOT EXISTS context_key TEXT;
ALTER TABLE risk_predictions ADD COLUMN IF NOT EXISTS prediction JSONB;
ALTER TABLE risk_predictions DROP CONSTRAINT IF EXISTS risk_predictions_user_id_topic_key;
CREATE UNIQUE INDEX IF NOT EXISTS risk_user_path_topic ON risk_predictions(user_id,program,topic);
ALTER TABLE study_plans ADD COLUMN IF NOT EXISTS program TEXT NOT NULL DEFAULT 'legacy';
ALTER TABLE study_plans DROP CONSTRAINT IF EXISTS study_plans_user_id_plan_date_key;
CREATE UNIQUE INDEX IF NOT EXISTS plan_user_path_day ON study_plans(user_id,program,plan_date);
