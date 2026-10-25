ALTER TABLE notifications ADD COLUMN IF NOT EXISTS event_key TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_label TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_required BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
UPDATE notifications SET updated_at=COALESCE(created_at,now()) WHERE updated_at IS NULL;
ALTER TABLE notifications ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE notifications ALTER COLUMN updated_at SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS notification_event_once ON notifications(user_id,event_key) WHERE event_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS notification_action_inbox ON notifications(user_id,action_required,updated_at DESC);
