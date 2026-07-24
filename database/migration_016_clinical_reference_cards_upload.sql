ALTER TABLE IF EXISTS clinical_reference_cards
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

UPDATE clinical_reference_cards
SET category = COALESCE(NULLIF(category, ''), NULLIF(module, '')),
    image_url = COALESCE(NULLIF(image_url, ''), NULLIF(file_url, '')),
    is_active = CASE WHEN status = 'published' THEN true ELSE false END;

CREATE INDEX IF NOT EXISTS idx_clinical_reference_cards_category_active
  ON clinical_reference_cards (category, is_active, created_at DESC);
