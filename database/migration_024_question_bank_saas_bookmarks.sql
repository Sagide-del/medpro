CREATE TABLE IF NOT EXISTS student_question_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES mcq_questions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_student_question_bookmarks_student
  ON student_question_bookmarks(student_id, created_at DESC);
