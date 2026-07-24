ALTER TABLE case_studies
  ADD COLUMN IF NOT EXISTS created_by UUID;
