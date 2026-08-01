CREATE TABLE IF NOT EXISTS master_question_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL DEFAULT 'EMS_CASE',
  level TEXT NOT NULL DEFAULT 'BOTH',
  event_type TEXT,
  location TEXT,
  incident_date TIMESTAMP WITH TIME ZONE,
  difficulty TEXT NOT NULL DEFAULT 'Intermediate',
  incident_briefing TEXT,
  dispatch_info TEXT,
  patient_table JSONB NOT NULL DEFAULT '[]'::jsonb,
  stages JSONB NOT NULL DEFAULT '[]'::jsonb,
  answer_key JSONB NOT NULL DEFAULT '{}'::jsonb,
  learning_points TEXT[] NOT NULL DEFAULT '{}'::text[],
  questions JSONB NOT NULL DEFAULT '{}'::jsonb,
  image_urls TEXT[] NOT NULL DEFAULT '{}'::text[],
  status TEXT NOT NULL DEFAULT 'draft',
  created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
  school_id UUID REFERENCES institutions(institution_id) ON DELETE SET NULL,
  published_to UUID[] NOT NULL DEFAULT '{}'::uuid[],
  published_to_schools UUID[] NOT NULL DEFAULT '{}'::uuid[],
  tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  usage_count INTEGER NOT NULL DEFAULT 0,
  source_file_url TEXT,
  source_file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_master_question_bank_status
  ON master_question_bank(status);

CREATE INDEX IF NOT EXISTS idx_master_question_bank_level
  ON master_question_bank(level);

CREATE INDEX IF NOT EXISTS idx_master_question_bank_school
  ON master_question_bank(school_id);

CREATE TABLE IF NOT EXISTS teacher_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id UUID NOT NULL REFERENCES master_question_bank(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES institutions(institution_id) ON DELETE CASCADE,
  custom_title TEXT,
  custom_description TEXT,
  selected_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  custom_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  added_images TEXT[] NOT NULL DEFAULT '{}'::text[],
  school_logo TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  published_to UUID[] NOT NULL DEFAULT '{}'::uuid[],
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teacher_content_master
  ON teacher_content(master_id);

CREATE INDEX IF NOT EXISTS idx_teacher_content_teacher
  ON teacher_content(teacher_id);

CREATE INDEX IF NOT EXISTS idx_teacher_content_school
  ON teacher_content(school_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_teacher_content_unique
  ON teacher_content(master_id, teacher_id, school_id);

CREATE TABLE IF NOT EXISTS student_ems_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  content_id UUID NOT NULL,
  content_from TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'NOT_STARTED',
  current_stage INTEGER NOT NULL DEFAULT 1,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  score NUMERIC(8,2),
  completed_at TIMESTAMP WITH TIME ZONE,
  time_spent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, content_id, content_from)
);

CREATE INDEX IF NOT EXISTS idx_student_ems_progress_student
  ON student_ems_progress(student_id);

CREATE INDEX IF NOT EXISTS idx_student_ems_progress_content
  ON student_ems_progress(content_id, content_from);
