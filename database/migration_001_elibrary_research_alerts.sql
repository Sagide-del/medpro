-- ============================================================
-- MedPro migration 001 — E-Library, Research, and Group Alerts
-- Additive only: safe to run against your EXISTING database
-- without dropping/recreating it.
--
-- Run once:
--   psql -U postgres -d medpro -f database/migration_001_elibrary_research_alerts.sql
-- ============================================================

-- New purchasable item type for revenue_transactions.transaction_type
ALTER TYPE txn_type ADD VALUE IF NOT EXISTS 'elibrary_resource';

-- ---------- E-LIBRARY ----------
CREATE TABLE IF NOT EXISTS elibrary_resources (
  resource_id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title          VARCHAR(200) NOT NULL,
  description    TEXT,
  category       VARCHAR(80),
  author         VARCHAR(160),
  file_url       VARCHAR(500),
  thumbnail_url  VARCHAR(500),
  price          NUMERIC(10,2) NOT NULL DEFAULT 20,   -- Ksh 20 for high-value resources; 0 = free
  is_premium     BOOLEAN NOT NULL DEFAULT true,
  download_count INTEGER NOT NULL DEFAULT 0,
  status         content_status NOT NULL DEFAULT 'draft',
  uploaded_by    UUID REFERENCES users(user_id),
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_elibrary_status ON elibrary_resources (status);

-- ---------- RESEARCH ----------
CREATE TABLE IF NOT EXISTS research_items (
  research_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            VARCHAR(200) NOT NULL,
  authors          VARCHAR(300),
  abstract         TEXT,
  category         VARCHAR(80),
  publication_date DATE,
  external_url     VARCHAR(500),
  file_url         VARCHAR(500),
  status           content_status NOT NULL DEFAULT 'draft',
  uploaded_by      UUID REFERENCES users(user_id),
  view_count       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_research_status ON research_items (status);

-- ---------- GROUP ALERTS (teacher -> group: in-app / SMS / WhatsApp) ----------
CREATE TABLE IF NOT EXISTS group_alerts (
  alert_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id        UUID NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,
  sender_id       UUID REFERENCES users(user_id) ON DELETE SET NULL,
  title           VARCHAR(200) NOT NULL,
  message         TEXT NOT NULL,
  channel         VARCHAR(20) NOT NULL DEFAULT 'app',  -- app | sms | whatsapp | all
  recipient_count INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_group_alerts_group ON group_alerts (group_id, created_at);

-- updated_at triggers (touch_updated_at() already exists from schema.sql)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_elibrary_touch') THEN
    CREATE TRIGGER trg_elibrary_touch BEFORE UPDATE ON elibrary_resources FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_research_touch') THEN
    CREATE TRIGGER trg_research_touch BEFORE UPDATE ON research_items FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
  END IF;
END $$;

-- ---------- Seed data (safe to re-run: guarded by NOT EXISTS on title) ----------
INSERT INTO elibrary_resources (title, description, category, author, price, is_premium, status, uploaded_by)
SELECT 'Prehospital Trauma Life Support — Field Guide', 'Quick-reference field guide covering primary/secondary survey and trauma triage.', 'Trauma', 'PHTLS Committee', 20, true, 'published', u.user_id
FROM users u WHERE u.role = 'super_admin'
AND NOT EXISTS (SELECT 1 FROM elibrary_resources WHERE title = 'Prehospital Trauma Life Support — Field Guide');

INSERT INTO elibrary_resources (title, description, category, author, price, is_premium, status, uploaded_by)
SELECT 'ACLS Drug Dosage Card', 'Laminated-style quick card of resuscitation drug doses and intervals.', 'Cardiology', 'SA Technologies', 20, true, 'published', u.user_id
FROM users u WHERE u.role = 'super_admin'
AND NOT EXISTS (SELECT 1 FROM elibrary_resources WHERE title = 'ACLS Drug Dosage Card');

INSERT INTO elibrary_resources (title, description, category, author, price, is_premium, status, uploaded_by)
SELECT 'EMS Documentation Basics', 'Free introductory guide to patient care report writing.', 'Operations', 'SA Technologies', 0, false, 'published', u.user_id
FROM users u WHERE u.role = 'super_admin'
AND NOT EXISTS (SELECT 1 FROM elibrary_resources WHERE title = 'EMS Documentation Basics');

INSERT INTO research_items (title, authors, abstract, category, publication_date, external_url, status, uploaded_by)
SELECT 'Prehospital Epinephrine Timing in Anaphylaxis', 'Kimani, W. et al.', 'A review of time-to-epinephrine outcomes in East African prehospital anaphylaxis cases.', 'Pharmacology', '2025-03-14', 'https://doi.org/example/anaphylaxis-timing', 'published', u.user_id
FROM users u WHERE u.role = 'super_admin'
AND NOT EXISTS (SELECT 1 FROM research_items WHERE title = 'Prehospital Epinephrine Timing in Anaphylaxis');

INSERT INTO research_items (title, authors, abstract, category, publication_date, external_url, status, uploaded_by)
SELECT 'Clinical Judgment Model Adoption in Paramedic Curricula', 'Otieno, D., Wanjiru, G.', 'Survey of NCSBN Clinical Judgment Model adoption across East African paramedicine programs.', 'Education', '2025-11-02', 'https://doi.org/example/cjm-adoption', 'published', u.user_id
FROM users u WHERE u.role = 'super_admin'
AND NOT EXISTS (SELECT 1 FROM research_items WHERE title = 'Clinical Judgment Model Adoption in Paramedic Curricula');
