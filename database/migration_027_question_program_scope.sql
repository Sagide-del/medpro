-- Keep question content isolated by revision pathway.
-- Existing MCQs are the original EMT bank; new content must set program explicitly.
ALTER TABLE mcq_questions
  ADD COLUMN IF NOT EXISTS program VARCHAR(40) NOT NULL DEFAULT 'EMT';

CREATE INDEX IF NOT EXISTS idx_mcq_questions_program_topic
  ON mcq_questions(program, topic);

