CREATE TABLE IF NOT EXISTS psychometric_assignments (
 student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
 content_id UUID NOT NULL REFERENCES ai_published_content(id) ON DELETE CASCADE,
 destination_key TEXT NOT NULL,
 prompt_snapshot TEXT NOT NULL,
 assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 PRIMARY KEY(student_id,content_id)
);
CREATE INDEX IF NOT EXISTS psychometric_assignment_area ON psychometric_assignments(student_id,destination_key,assigned_at);
CREATE INDEX IF NOT EXISTS psychometric_assignment_destination ON psychometric_assignments(destination_key);
