CREATE TABLE IF NOT EXISTS rag_sources (
  id UUID PRIMARY KEY,
  scope_key TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('protocol','research_article','textbook','drug_reference','kenya_case','psychometric_case')),
  program TEXT NOT NULL CHECK (program IN ('EMT','Paramedic','both')),
  subject TEXT NOT NULL,
  version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading','uploaded','queued','indexing','ready','failed','withdrawn')),
  created_by UUID NOT NULL REFERENCES users(user_id),
  approved_by UUID REFERENCES users(user_id),
  approved_at TIMESTAMPTZ,
  page_count INTEGER NOT NULL DEFAULT 0,
  chunk_count INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (scope_key,file_hash,program,subject,source_type,version)
);
CREATE INDEX IF NOT EXISTS rag_sources_queue ON rag_sources(status,created_at);
CREATE TABLE IF NOT EXISTS rag_source_events (
  id BIGSERIAL PRIMARY KEY,
  source_id UUID NOT NULL REFERENCES rag_sources(id),
  actor_id UUID REFERENCES users(user_id),
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE published_content_responses ADD COLUMN IF NOT EXISTS grading_status TEXT NOT NULL DEFAULT 'awaiting_review';
ALTER TABLE published_content_responses ADD COLUMN IF NOT EXISTS score NUMERIC(6,2);
ALTER TABLE published_content_responses ADD COLUMN IF NOT EXISTS feedback TEXT;
ALTER TABLE published_content_responses ADD COLUMN IF NOT EXISTS content_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE published_content_responses ADD COLUMN IF NOT EXISTS client_token UUID;
CREATE UNIQUE INDEX IF NOT EXISTS published_response_idempotency ON published_content_responses(student_id,client_token);
