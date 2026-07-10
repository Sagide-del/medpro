-- Migration 002: replace fake/broken research sources with real, working
-- links, and enable the student-submission workflow (draft-by-default,
-- teacher/admin publish). Additive + idempotent — safe to run against an
-- already-seeded database.
--
-- Run:  psql -U postgres -d medpro -f database/migration_002_fix_research_sources.sql

BEGIN;

-- 1. Remove the old placeholder rows that used fake "doi.org/example/..." links.
DELETE FROM research_items WHERE external_url LIKE '%doi.org/example%';

-- 2. Insert real, publicly resolvable sources (PubMed / PMC — NIH National
--    Library of Medicine) in place of them. Guarded by title so this is safe
--    to re-run.
INSERT INTO research_items (title, authors, abstract, category, publication_date, external_url, status, uploaded_by)
SELECT 'Underuse of Epinephrine for the Treatment of Anaphylaxis in the Prehospital Setting', 'Various (NIH/NLM, PMC)', 'Examines how often EMS providers and dispatchers under-treat anaphylaxis with epinephrine before hospital arrival, and what drives the gap.', 'Pharmacology', '2022-04-01', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9033371/', 'published', u.user_id
FROM users u WHERE u.role = 'super_admin'
AND NOT EXISTS (SELECT 1 FROM research_items WHERE title = 'Underuse of Epinephrine for the Treatment of Anaphylaxis in the Prehospital Setting');

INSERT INTO research_items (title, authors, abstract, category, publication_date, external_url, status, uploaded_by)
SELECT 'Strategies to Teach the National Council of State Boards of Nursing Clinical Judgment Model', 'Dickison, P. et al.', 'Practical strategies for teaching the 6-step NCSBN Clinical Judgment Model in health-professions education.', 'Education', '2019-12-01', 'https://pubmed.ncbi.nlm.nih.gov/31856142/', 'published', u.user_id
FROM users u WHERE u.role = 'super_admin'
AND NOT EXISTS (SELECT 1 FROM research_items WHERE title = 'Strategies to Teach the National Council of State Boards of Nursing Clinical Judgment Model');

INSERT INTO research_items (title, authors, abstract, category, publication_date, external_url, status, uploaded_by)
SELECT 'A Call for Spaced Repetition in Medical Education', 'Various (NIH/NLM, PMC)', 'Makes the case for spaced-repetition scheduling — the same principle behind MedPro''s flashcard engine — as a core strategy in medical curricula.', 'Education', '2024-01-01', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10842980/', 'published', u.user_id
FROM users u WHERE u.role = 'super_admin'
AND NOT EXISTS (SELECT 1 FROM research_items WHERE title = 'A Call for Spaced Repetition in Medical Education');

INSERT INTO research_items (title, authors, abstract, category, publication_date, external_url, status, uploaded_by)
SELECT 'Emergency Medical Services (EMS) Training in Kenya: Findings and Recommendations from an Educational Assessment', 'Aga Khan University / international EMS educators', 'A 2016 educational assessment of EMS training standards, provider levels, and curricula across Kenya, with recommendations for standardisation.', 'EMS Systems', '2018-11-01', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6234130/', 'published', u.user_id
FROM users u WHERE u.role = 'super_admin'
AND NOT EXISTS (SELECT 1 FROM research_items WHERE title = 'Emergency Medical Services (EMS) Training in Kenya: Findings and Recommendations from an Educational Assessment');

INSERT INTO research_items (title, authors, abstract, category, publication_date, external_url, status, uploaded_by)
SELECT 'The Evolving Role of Paramedicine Educators: A Scoping Review', 'Various (NIH/NLM, PMC)', 'Scoping review of how the paramedicine educator role is shifting alongside community-oriented, out-of-hospital care models.', 'Education', '2025-01-01', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12033909/', 'published', u.user_id
FROM users u WHERE u.role = 'super_admin'
AND NOT EXISTS (SELECT 1 FROM research_items WHERE title = 'The Evolving Role of Paramedicine Educators: A Scoping Review');

-- 3. Demo: a student-submitted case write-up, pending teacher review (only
--    inserted if the demo student account exists in this database).
INSERT INTO research_items (title, authors, abstract, category, external_url, status, uploaded_by)
SELECT 'Field Case Review: Delayed Recognition of Compensated Shock in a Trauma Call', 'John Doe (KRCTI, Year 2)', 'Student case write-up from a supervised field placement, reviewing cue recognition timing against the NCSBN Clinical Judgment Model.', 'Student Research', NULL, 'draft', u.user_id
FROM users u WHERE u.email = 'john.doe@krcti.ac.ke'
AND NOT EXISTS (SELECT 1 FROM research_items WHERE title = 'Field Case Review: Delayed Recognition of Compensated Shock in a Trauma Call');

COMMIT;
