ALTER TABLE IF EXISTS clinical_reference_cards
  ADD COLUMN IF NOT EXISTS graphic_id TEXT;

UPDATE clinical_reference_cards
SET graphic_id = COALESCE(graphic_id, id::text)
WHERE graphic_id IS NULL;
