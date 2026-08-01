BEGIN;

CREATE TABLE IF NOT EXISTS deleted_users_audit (
  audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deleted_user_id UUID NOT NULL,
  deleted_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
  user_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  reason TEXT,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deleted_users_audit_user
  ON deleted_users_audit (deleted_user_id, deleted_at DESC);

CREATE TABLE IF NOT EXISTS communication_schedules (
  schedule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id INTEGER REFERENCES institutions(institution_id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
  channel TEXT NOT NULL,
  title TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  audience JSONB NOT NULL DEFAULT '{}'::jsonb,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_communication_schedules_status
  ON communication_schedules (status, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_communication_schedules_institution
  ON communication_schedules (institution_id, created_at DESC);

CREATE TABLE IF NOT EXISTS communication_reminder_settings (
  setting_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id INTEGER REFERENCES institutions(institution_id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_enabled BOOLEAN NOT NULL DEFAULT true,
  settings_json JSONB NOT NULL DEFAULT '{"subscription":[7,3,1],"deadline":[3,1],"rotation":[7,3,1],"inactive":[14,7,3]}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (institution_id)
);

COMMIT;
