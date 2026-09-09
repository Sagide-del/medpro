CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE ai_published_content
  ADD COLUMN IF NOT EXISTS destination_key TEXT,
  ADD COLUMN IF NOT EXISTS source_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS content_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  destination_key TEXT NOT NULL,
  content_id UUID NOT NULL,
  program TEXT,
  source_citation TEXT,
  source_job_id UUID REFERENCES ai_generation_jobs(id) ON DELETE SET NULL,
  published_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'published',
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_job_id, content_id)
);

CREATE TABLE IF NOT EXISTS content_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL,
  action TEXT NOT NULL,
  admin_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  job_id UUID REFERENCES ai_generation_jobs(id) ON DELETE SET NULL,
  changes JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_registry_lookup
  ON content_registry(content_type, destination_key, status, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_audit_content
  ON content_audit_log(content_id, created_at DESC);
