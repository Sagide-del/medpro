CREATE TABLE IF NOT EXISTS podcast_episodes (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 seed_key TEXT UNIQUE,
 title VARCHAR(200) NOT NULL,
 topic VARCHAR(160) NOT NULL,
 program TEXT NOT NULL CHECK(program IN ('EMT','Paramedic','Nursing')),
 script TEXT NOT NULL,
 voice TEXT NOT NULL DEFAULT 'en-KE-AsiliaNeural',
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','queued','generating','ready','published','failed')),
 revision INTEGER NOT NULL DEFAULT 1,
 audio_bytes BYTEA,
 media_url TEXT,
 duration_seconds NUMERIC,
 audio_hash TEXT,
 last_error TEXT,
 created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
 client_token UUID UNIQUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 started_at TIMESTAMPTZ,
 published_at TIMESTAMPTZ,
 CHECK(octet_length(script)<=100000)
);
CREATE INDEX IF NOT EXISTS podcast_queue ON podcast_episodes(status,updated_at);
CREATE INDEX IF NOT EXISTS podcast_track ON podcast_episodes(program,status,published_at DESC);
