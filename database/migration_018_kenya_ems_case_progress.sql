-- Kenya EMS architecture change: case content (worksheet text, tables,
-- question prompts, hidden grading keywords) is hard-coded in React
-- (client/src/components/student/learn/kenya-ems/cases/CaseN.jsx) and backend
-- grading data (server/src/data/kenyaEmsCaseStudyData.js). This module no
-- longer reads or writes the `case_studies` / `student_case_progress` /
-- `student_case_attempts` tables at all -- those remain in place (untouched,
-- in case anything else still references them) but are no longer part of the
-- Kenya EMS request path.
--
-- This table is intentionally minimal: it stores per-student PROGRESS only --
-- which case number, what score, whether it's locked / available / completed,
-- and how many attempts -- never case content. Cases are identified by a
-- plain case_number (1-15) matching the hard-coded data's `id` field, so this
-- table needs no foreign key to any case-content table and no pre-seeding:
-- a brand new student with zero rows here still sees Case 1 available and
-- Cases 2-15 locked, because server/src/models/KenyaEmsProgress.js computes
-- that default in application code rather than requiring a pre-existing row.

CREATE TABLE IF NOT EXISTS kenya_ems_case_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  case_number INTEGER NOT NULL CHECK (case_number BETWEEN 1 AND 15),
  status VARCHAR(20) NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'available', 'completed')),
  score INTEGER NOT NULL DEFAULT 0,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, case_number)
);

CREATE INDEX IF NOT EXISTS idx_kenya_ems_case_progress_student
  ON kenya_ems_case_progress(student_id);
