-- Private source passages enable deterministic whole-book coverage, rather
-- than repeatedly retrieving the same top-ranked passages for a topic.
CREATE TABLE IF NOT EXISTS rag_source_passages (
  document_id UUID NOT NULL REFERENCES rag_sources(id) ON DELETE CASCADE,
  chunk_id TEXT NOT NULL,
  page_number INTEGER NOT NULL,
  ordinal INTEGER NOT NULL,
  chapter_title TEXT NOT NULL,
  passage_text TEXT NOT NULL,
  PRIMARY KEY(document_id, chunk_id)
);
CREATE INDEX IF NOT EXISTS rag_passages_read_order ON rag_source_passages(document_id,page_number,ordinal);
ALTER TABLE rag_sources DROP CONSTRAINT IF EXISTS rag_sources_program_check;
ALTER TABLE rag_sources ADD CONSTRAINT rag_sources_program_check CHECK(program IN ('EMT','Paramedic','Nursing','both','all'));

CREATE TABLE IF NOT EXISTS book_generation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES rag_sources(id),
  source_version TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(user_id),
  client_token UUID,
  paused BOOLEAN NOT NULL DEFAULT false,
  settings JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS book_generation_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES book_generation_runs(id) ON DELETE CASCADE,
  job_id UUID NOT NULL UNIQUE REFERENCES ai_generation_jobs(id),
  program TEXT NOT NULL,
  destination TEXT NOT NULL,
  chapter_title TEXT NOT NULL,
  first_page INTEGER NOT NULL,
  last_page INTEGER NOT NULL,
  chunk_ids TEXT[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','generating','review','failed','cancelled')),
  attempts INTEGER NOT NULL DEFAULT 0,
  generated_count INTEGER NOT NULL DEFAULT 0,
  duplicate_count INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  claim_token UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS book_generation_queue ON book_generation_tasks(status,created_at);
CREATE TABLE IF NOT EXISTS book_content_fingerprints (
  scope_key TEXT NOT NULL,
  program TEXT NOT NULL,
  destination TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  job_id UUID NOT NULL REFERENCES ai_generation_jobs(id) ON DELETE CASCADE,
  PRIMARY KEY(scope_key,program,destination,fingerprint)
);

ALTER TABLE book_generation_runs ADD COLUMN IF NOT EXISTS client_token UUID;
CREATE UNIQUE INDEX IF NOT EXISTS book_run_request_identity ON book_generation_runs(created_by,client_token);
