-- MedProHub migration 019
-- Add a private PDF attachment reference to student logbooks so the
-- clinical rotation logbook can keep the physical copy and the live digital
-- activity record together.

ALTER TABLE logbooks
  ADD COLUMN IF NOT EXISTS file_url TEXT;

ALTER TABLE logbooks
  ADD COLUMN IF NOT EXISTS file_uploaded_at TIMESTAMPTZ;

