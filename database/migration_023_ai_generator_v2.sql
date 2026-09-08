CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS ai_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  request_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_type TEXT,
  source_url TEXT,
  source_excerpt TEXT,
  citation TEXT,
  kenya_specific BOOLEAN NOT NULL DEFAULT false,
  county TEXT,
  historical_year INTEGER CHECK (historical_year IS NULL OR historical_year BETWEEN 1990 AND 2027),
  extended_processing BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '90 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_review_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES ai_generation_jobs(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected', 'needs_review')),
  duplicate_action TEXT NOT NULL DEFAULT 'skip' CHECK (duplicate_action IN ('skip', 'override', 'merge')),
  similarity_score NUMERIC(5,4),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (job_id, item_id)
);

CREATE TABLE IF NOT EXISTS ai_published_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES ai_generation_jobs(id) ON DELETE RESTRICT,
  source_item_id TEXT NOT NULL,
  content_type TEXT NOT NULL,
  title TEXT NOT NULL,
  program TEXT,
  topic TEXT,
  content_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_citation TEXT,
  created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (job_id, source_item_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_generation_jobs_admin ON ai_generation_jobs(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_generation_jobs_expiry ON ai_generation_jobs(expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_generation_jobs_type ON ai_generation_jobs(content_type, status);
CREATE INDEX IF NOT EXISTS idx_ai_review_decisions_job ON ai_review_decisions(job_id, decision);
CREATE INDEX IF NOT EXISTS idx_ai_published_content_type ON ai_published_content(content_type, created_at DESC);
