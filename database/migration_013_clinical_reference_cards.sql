CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS clinical_reference_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinical_card_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  graphic_id UUID NOT NULL UNIQUE REFERENCES medical_graphics(graphic_id) ON DELETE CASCADE,
  institution_id INTEGER REFERENCES institutions(institution_id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  category VARCHAR(160),
  difficulty VARCHAR(40),
  content JSONB,
  program VARCHAR(30) NOT NULL DEFAULT 'EMT',
  module VARCHAR(120) NOT NULL DEFAULT '',
  topic VARCHAR(160) NOT NULL DEFAULT '',
  skill VARCHAR(160) NOT NULL DEFAULT '',
  description TEXT,
  file_url VARCHAR(500),
  file_kind VARCHAR(20) CHECK (file_kind IN ('pdf', 'image')),
  status content_status NOT NULL DEFAULT 'draft',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT clinical_reference_cards_program_check CHECK (program IN ('EMT', 'Paramedic'))
);

CREATE INDEX IF NOT EXISTS idx_clinical_cards_status ON clinical_reference_cards (status, program, module);
CREATE INDEX IF NOT EXISTS idx_clinical_cards_institution ON clinical_reference_cards (institution_id, status);
CREATE INDEX IF NOT EXISTS idx_clinical_cards_topic ON clinical_reference_cards (topic);
CREATE INDEX IF NOT EXISTS idx_clinical_cards_active ON clinical_reference_cards (is_active, updated_at);

DROP TRIGGER IF EXISTS trg_clinical_cards_touch ON clinical_reference_cards;
CREATE TRIGGER trg_clinical_cards_touch
BEFORE UPDATE ON clinical_reference_cards
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
