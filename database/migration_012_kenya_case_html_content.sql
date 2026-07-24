CREATE OR REPLACE FUNCTION medpro_escape_case_html(input_text TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT replace(replace(replace(COALESCE(input_text, ''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;');
$$;

ALTER TABLE case_studies
  ADD COLUMN IF NOT EXISTS content_html TEXT;

UPDATE case_studies
SET content_html = '<pre class="medpro-case-source">' || medpro_escape_case_html(COALESCE(content->>'source_text', description, title)) || '</pre>'
WHERE content_html IS NULL
   OR btrim(content_html) = '';
