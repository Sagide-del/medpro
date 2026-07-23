CREATE TABLE IF NOT EXISTS simulations (
  simulation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_scenario_id VARCHAR(120) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  category VARCHAR(80) NOT NULL,
  scenario_type VARCHAR(40),
  skill VARCHAR(160) NOT NULL,
  instructions TEXT,
  dispatch TEXT,
  status content_status NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS simulation_steps (
  simulation_step_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  simulation_id UUID NOT NULL REFERENCES simulations(simulation_id) ON DELETE CASCADE,
  step_key VARCHAR(120) NOT NULL,
  label TEXT NOT NULL,
  is_critical BOOLEAN NOT NULL DEFAULT false,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  is_harmful BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS simulation_attempts (
  simulation_attempt_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  simulation_id UUID NOT NULL REFERENCES simulations(simulation_id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  institution_id INTEGER REFERENCES institutions(institution_id) ON DELETE SET NULL,
  status attempt_status NOT NULL DEFAULT 'in_progress',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  graded_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS simulation_results (
  simulation_result_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  simulation_attempt_id UUID NOT NULL UNIQUE REFERENCES simulation_attempts(simulation_attempt_id) ON DELETE CASCADE,
  clinical_decision_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  critical_errors INTEGER NOT NULL DEFAULT 0,
  time_taken_seconds INTEGER NOT NULL DEFAULT 0,
  actions_completed INTEGER NOT NULL DEFAULT 0,
  protocol_compliance_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  overall_competency_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  weak_areas JSONB DEFAULT '[]'::jsonb,
  recommended_cards JSONB DEFAULT '[]'::jsonb,
  recommended_simulations JSONB DEFAULT '[]'::jsonb,
  recommendation TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_simulation_attempts_student ON simulation_attempts (student_id, status);
CREATE INDEX IF NOT EXISTS idx_simulation_attempts_institution ON simulation_attempts (institution_id, status);
CREATE INDEX IF NOT EXISTS idx_simulations_category ON simulations (category, skill);

DROP TRIGGER IF EXISTS trg_simulations_touch ON simulations;
CREATE TRIGGER trg_simulations_touch
BEFORE UPDATE ON simulations
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_simulation_results_touch ON simulation_results;
CREATE TRIGGER trg_simulation_results_touch
BEFORE UPDATE ON simulation_results
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
