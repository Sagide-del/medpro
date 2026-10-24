CREATE TABLE IF NOT EXISTS ke_cases (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 case_code TEXT NOT NULL,
 program TEXT NOT NULL CHECK(program IN ('EMT','Paramedic','Nursing')),
 order_number INTEGER NOT NULL CHECK(order_number>0),
 title TEXT NOT NULL,
 document JSONB NOT NULL,
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published')),
 revision INTEGER NOT NULL DEFAULT 1,
 created_by UUID REFERENCES users(user_id),
 published_content_id UUID UNIQUE REFERENCES ai_published_content(id) ON DELETE CASCADE,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(program,case_code),
 UNIQUE(program,order_number) DEFERRABLE INITIALLY DEFERRED
);
CREATE TABLE IF NOT EXISTS ke_case_attempts (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 student_id UUID NOT NULL REFERENCES users(user_id),
 case_id UUID NOT NULL REFERENCES ke_cases(id),
 revision INTEGER NOT NULL,
 client_token UUID NOT NULL,
 responses JSONB NOT NULL,
 review JSONB NOT NULL,
 score INTEGER,
 completed BOOLEAN NOT NULL,
 submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(student_id,client_token)
);
CREATE INDEX IF NOT EXISTS ke_case_completion ON ke_case_attempts(student_id,case_id,revision,completed);
CREATE TABLE IF NOT EXISTS ke_case_drafts (
 student_id UUID NOT NULL REFERENCES users(user_id),
 case_id UUID NOT NULL REFERENCES ke_cases(id),
 revision INTEGER NOT NULL,
 responses JSONB NOT NULL,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 PRIMARY KEY(student_id,case_id,revision)
);
