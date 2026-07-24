CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS clinical_reference_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT,
  image_url TEXT,
  graphic_id TEXT,
  institution_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE IF EXISTS clinical_reference_cards
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS difficulty TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS graphic_id TEXT,
  ADD COLUMN IF NOT EXISTS institution_id UUID,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'clinical_reference_cards'
      AND column_name = 'id'
      AND data_type IN ('text', 'character varying', 'character')
  ) THEN
    EXECUTE 'ALTER TABLE clinical_reference_cards ALTER COLUMN id TYPE UUID USING NULLIF(id::text, '''')::uuid';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'clinical_reference_cards'
      AND column_name = 'institution_id'
      AND data_type IN ('text', 'character varying', 'character')
  ) THEN
    EXECUTE 'ALTER TABLE clinical_reference_cards ALTER COLUMN institution_id TYPE UUID USING NULLIF(institution_id::text, '''')::uuid';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'clinical_reference_cards'
      AND column_name = 'graphic_id'
      AND data_type <> 'text'
  ) THEN
    EXECUTE 'ALTER TABLE clinical_reference_cards ALTER COLUMN graphic_id TYPE TEXT USING graphic_id::text';
  END IF;
END $$;

UPDATE clinical_reference_cards
SET title = COALESCE(NULLIF(title, ''), 'Clinical Reference Card'),
    category = COALESCE(NULLIF(category, ''), 'Operations'),
    graphic_id = COALESCE(NULLIF(graphic_id, ''), id::text)
WHERE TRUE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'clinical_reference_cards'
      AND column_name = 'file_url'
  ) THEN
    EXECUTE 'UPDATE clinical_reference_cards SET image_url = COALESCE(image_url, file_url) WHERE image_url IS NULL';
  END IF;
END $$;

ALTER TABLE clinical_reference_cards
  ALTER COLUMN title SET NOT NULL,
  ALTER COLUMN category SET NOT NULL,
  ALTER COLUMN image_url DROP NOT NULL,
  ALTER COLUMN id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN is_active SET DEFAULT true,
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW();
