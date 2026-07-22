CREATE TABLE IF NOT EXISTS clinical_reference_cards (
  clinical_card_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  graphic_id UUID NOT NULL UNIQUE REFERENCES medical_graphics(graphic_id) ON DELETE CASCADE,
  institution_id INTEGER REFERENCES institutions(institution_id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  program VARCHAR(30) NOT NULL CHECK (program IN ('EMT', 'Paramedic')),
  module VARCHAR(120) NOT NULL,
  topic VARCHAR(160) NOT NULL,
  skill VARCHAR(160) NOT NULL,
  description TEXT,
  difficulty difficulty_level DEFAULT 'intermediate',
  file_url VARCHAR(500),
  file_kind VARCHAR(20) CHECK (file_kind IN ('pdf', 'image')),
  status content_status NOT NULL DEFAULT 'draft',
  created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clinical_cards_status ON clinical_reference_cards (status, program, module);
CREATE INDEX IF NOT EXISTS idx_clinical_cards_institution ON clinical_reference_cards (institution_id, status);
CREATE INDEX IF NOT EXISTS idx_clinical_cards_topic ON clinical_reference_cards (topic);

DROP TRIGGER IF EXISTS trg_clinical_cards_touch ON clinical_reference_cards;
CREATE TRIGGER trg_clinical_cards_touch
BEFORE UPDATE ON clinical_reference_cards
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
