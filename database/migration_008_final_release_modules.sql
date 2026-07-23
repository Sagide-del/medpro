BEGIN;

CREATE TABLE IF NOT EXISTS practical_video_assignments (
  assignment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id INTEGER REFERENCES institutions(institution_id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  instructions TEXT,
  marking_checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  assigned_scope TEXT NOT NULL DEFAULT 'student',
  due_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS practical_video_assignment_targets (
  target_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES practical_video_assignments(assignment_id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(group_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT practical_video_assignment_target_scope_chk CHECK (
    student_id IS NOT NULL OR group_id IS NOT NULL
  )
);

CREATE TABLE IF NOT EXISTS practical_video_submissions (
  submission_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES practical_video_assignments(assignment_id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(video_id) ON DELETE SET NULL,
  file_url TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  teacher_feedback TEXT,
  checklist_results JSONB NOT NULL DEFAULT '[]'::jsonb,
  reviewed_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, student_id)
);

CREATE TABLE IF NOT EXISTS hospitals (
  hospital_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id INTEGER REFERENCES institutions(institution_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  county TEXT,
  address TEXT,
  contact_person TEXT,
  contact_phone TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clinical_sites (
  site_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID NOT NULL REFERENCES hospitals(hospital_id) ON DELETE CASCADE,
  institution_id INTEGER REFERENCES institutions(institution_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  department TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clinical_rotations (
  rotation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id INTEGER REFERENCES institutions(institution_id) ON DELETE CASCADE,
  hospital_id UUID REFERENCES hospitals(hospital_id) ON DELETE SET NULL,
  site_id UUID REFERENCES clinical_sites(site_id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  department TEXT,
  starts_on DATE,
  ends_on DATE,
  supervisor_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clinical_rotation_assignments (
  assignment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rotation_id UUID NOT NULL REFERENCES clinical_rotations(rotation_id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  supervisor_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  logbook_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (rotation_id, student_id)
);

CREATE TABLE IF NOT EXISTS clinical_activity_records (
  activity_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  logbook_id UUID REFERENCES logbooks(logbook_id) ON DELETE SET NULL,
  rotation_assignment_id UUID REFERENCES clinical_rotation_assignments(assignment_id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  hospital TEXT NOT NULL,
  department TEXT,
  activity_performed TEXT NOT NULL,
  clinical_skill TEXT NOT NULL,
  hours_completed NUMERIC(5,2) NOT NULL DEFAULT 0,
  supervisor TEXT,
  comments TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  verified_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  verification_comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS communication_templates (
  template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id INTEGER REFERENCES institutions(institution_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  channel TEXT NOT NULL,
  event_type TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS communication_delivery_logs (
  log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES communication_templates(template_id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  channel TEXT NOT NULL,
  event_type TEXT NOT NULL,
  recipient TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  provider_reference TEXT,
  provider_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS communication_history (
  history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id INTEGER REFERENCES institutions(institution_id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS proctored_exams (
  exam_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id INTEGER REFERENCES institutions(institution_id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  exam_type TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  question_count INTEGER NOT NULL DEFAULT 20,
  random_questions BOOLEAN NOT NULL DEFAULT false,
  random_answer_order BOOLEAN NOT NULL DEFAULT false,
  passing_score INTEGER NOT NULL DEFAULT 50,
  result_release_mode TEXT NOT NULL DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'draft',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS proctored_exam_candidates (
  candidate_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES proctored_exams(exam_id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(group_id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'assigned',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (exam_id, student_id)
);

CREATE TABLE IF NOT EXISTS proctored_exam_attempts (
  attempt_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES proctored_exams(exam_id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  score NUMERIC(5,2),
  status TEXT NOT NULL DEFAULT 'not_started',
  suspicious_events INTEGER NOT NULL DEFAULT 0,
  auto_submitted BOOLEAN NOT NULL DEFAULT false,
  result_released BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (exam_id, student_id)
);

CREATE TABLE IF NOT EXISTS proctored_exam_activity_logs (
  activity_log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES proctored_exams(exam_id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_practical_video_assignments_institution ON practical_video_assignments(institution_id, status);
CREATE INDEX IF NOT EXISTS idx_practical_video_submissions_student ON practical_video_submissions(student_id, status);
CREATE INDEX IF NOT EXISTS idx_clinical_rotation_assignments_student ON clinical_rotation_assignments(student_id, logbook_enabled);
CREATE INDEX IF NOT EXISTS idx_clinical_activity_records_student ON clinical_activity_records(student_id, status, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_communication_delivery_logs_event ON communication_delivery_logs(event_type, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proctored_exams_institution ON proctored_exams(institution_id, status);
CREATE INDEX IF NOT EXISTS idx_proctored_exam_attempts_student ON proctored_exam_attempts(student_id, status);

COMMIT;
