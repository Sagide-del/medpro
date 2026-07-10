-- MedPro seed data — Developed by SA Technologies
-- Run after schema.sql. Password for ALL seeded users: "Password123!"
-- (bcrypt hash, cost 10 — same hash reused across demo accounts)

-- ---------- Institutions ----------
INSERT INTO institutions (name, short_code, contact_email, contact_phone, address) VALUES
('Kenya Red Cross Training Institute', 'KRCTI',  'admin@krcti.ac.ke',      '+254700000001', 'South C, Nairobi'),
('St. John''s University',             'STJ',    'admin@stjohns.ac.ke',    '+254700000002', 'Nairobi'),
('Maseno University',                  'MASENO', 'admin@maseno.ac.ke',     '+254700000003', 'Kisumu'),
('University of Nairobi',              'UON',    'admin@uonbi.ac.ke',      '+254700000004', 'Nairobi'),
('JKUAT',                              'JKUAT',  'admin@jkuat.ac.ke',      '+254700000005', 'Juja'),
('Strathmore University',              'STRATH', 'admin@strathmore.edu',   '+254700000006', 'Nairobi');

INSERT INTO institution_subscriptions (institution_id, plan, status, max_students, amount, expires_at) VALUES
(1, 'enterprise',   'active', 1000, 850000, now() + interval '30 days'),
(2, 'professional', 'active',  500, 620000, now() + interval '200 days'),
(3, 'professional', 'active',  500, 450000, now() + interval '150 days'),
(4, 'basic',        'active',  300, 320000, now() + interval '90 days'),
(5, 'basic',        'active',  200, 180000, now() + interval '60 days'),
(6, 'trial',        'trial',    50,      0, now() + interval '14 days');

-- ---------- Users (all roles). Password: Password123! ----------
INSERT INTO users (full_name, email, phone, password_hash, role, status) VALUES
('SA Technologies Admin', 'admin@satechnologies.co.ke', '+254748519923',
 '$2b$10$zD3yfEdWO0FUy8q/MD13je2NxFwMlDJypqf9geq/5ooLU1dzo7gPm', 'super_admin', 'active');

INSERT INTO users (institution_id, reg_number, full_name, email, phone, password_hash, role, program, year_of_study) VALUES
(1, NULL, 'Grace Wanjiru', 'admin@krcti.ac.ke', '0711000001',
 '$2b$10$zD3yfEdWO0FUy8q/MD13je2NxFwMlDJypqf9geq/5ooLU1dzo7gPm', 'institution_admin', NULL, NULL),
(1, NULL, 'Prof. Maina', 'prof.maina@krcti.ac.ke', '0745678901',
 '$2b$10$zD3yfEdWO0FUy8q/MD13je2NxFwMlDJypqf9geq/5ooLU1dzo7gPm', 'teacher', NULL, NULL),
(2, NULL, 'Dr. Otieno', 'otieno@stjohns.ac.ke', '0745678902',
 '$2b$10$zD3yfEdWO0FUy8q/MD13je2NxFwMlDJypqf9geq/5ooLU1dzo7gPm', 'teacher', NULL, NULL),
(1, 'KRCTI-2026-0123', 'John Doe',     'john.doe@krcti.ac.ke',    '0712345678',
 '$2b$10$zD3yfEdWO0FUy8q/MD13je2NxFwMlDJypqf9geq/5ooLU1dzo7gPm', 'student', 'Diploma in Paramedicine', 2),
(2, 'STJ-2025-0456',   'Sarah Lee',    'sarah.lee@stjohns.ac.ke', '0723456789',
 '$2b$10$zD3yfEdWO0FUy8q/MD13je2NxFwMlDJypqf9geq/5ooLU1dzo7gPm', 'student', 'BSc Emergency Medicine', 3),
(3, 'MAS-2026-0789',   'Michael Brown','m.brown@maseno.ac.ke',    '0734567890',
 '$2b$10$zD3yfEdWO0FUy8q/MD13je2NxFwMlDJypqf9geq/5ooLU1dzo7gPm', 'student', 'Diploma in EMS', 1),
(1, 'KRCTI-2026-0234', 'Amina Yusuf',  'amina.yusuf@krcti.ac.ke', '0712345699',
 '$2b$10$zD3yfEdWO0FUy8q/MD13je2NxFwMlDJypqf9geq/5ooLU1dzo7gPm', 'student', 'Diploma in Paramedicine', 1);

-- Independent student with no institution — demonstrates the Ksh 500/month
-- personal assessment subscription paywall (every seeded institution above
-- has an active/trial site-license, so their students are unlocked for free).
INSERT INTO users (institution_id, reg_number, full_name, email, phone, password_hash, role, program, year_of_study) VALUES
(NULL, NULL, 'Peter Kamau', 'peter.kamau@gmail.com', '0798765432',
 '$2b$10$zD3yfEdWO0FUy8q/MD13je2NxFwMlDJypqf9geq/5ooLU1dzo7gPm', 'student', 'Independent EMT-B candidate', NULL);

-- ---------- Groups ----------
INSERT INTO groups (group_id, institution_id, teacher_id, name, description)
SELECT uuid_generate_v4(), 1, u.user_id, 'Paramedicine Year 2 - Section A', 'Prof. Maina''s Year 2 cohort'
FROM users u WHERE u.email = 'prof.maina@krcti.ac.ke';

INSERT INTO group_members (group_id, student_id)
SELECT g.group_id, u.user_id FROM groups g, users u
WHERE g.name = 'Paramedicine Year 2 - Section A' AND u.email IN ('john.doe@krcti.ac.ke', 'amina.yusuf@krcti.ac.ke');

-- ---------- Worksheets (Ksh 10) ----------
INSERT INTO worksheets (worksheet_id, title, description, category, difficulty, bloom_level, price, time_limit_minutes, total_points, passing_score_pct, status, uploaded_by, purchase_count)
SELECT uuid_generate_v4(), 'ECG Interpretation', 'Rhythm strips, axis, and STEMI recognition', 'Cardiology', 'intermediate', 'analyze', 10, 30, 50, 70, 'published', u.user_id, 720
FROM users u WHERE u.role = 'super_admin';

INSERT INTO worksheets (worksheet_id, title, description, category, difficulty, bloom_level, price, time_limit_minutes, total_points, passing_score_pct, status, uploaded_by, purchase_count)
SELECT uuid_generate_v4(), 'Trauma Assessment', 'Primary and secondary survey drills', 'Trauma', 'intermediate', 'apply', 10, 25, 40, 70, 'published', u.user_id, 520
FROM users u WHERE u.role = 'super_admin';

INSERT INTO worksheet_questions (worksheet_id, question_type, prompt, correct_answer, options, points, position)
SELECT w.worksheet_id, 'mcq', 'A regular narrow-complex rhythm at 150 bpm with no visible P waves is most consistent with:', 'SVT',
       '["Sinus tachycardia","SVT","Ventricular tachycardia","Atrial fibrillation"]'::jsonb, 10, 0
FROM worksheets w WHERE w.title = 'ECG Interpretation';

INSERT INTO worksheet_questions (worksheet_id, question_type, prompt, correct_answer, options, points, position)
SELECT w.worksheet_id, 'short_answer', 'List the components of the primary survey (in order).', 'Airway, Breathing, Circulation, Disability, Exposure', NULL, 15, 0
FROM worksheets w WHERE w.title = 'Trauma Assessment';

-- ---------- Flashcard decks (Ksh 10) ----------
INSERT INTO flashcard_decks (deck_id, title, description, category, difficulty, price, card_count, status, uploaded_by, purchase_count)
SELECT uuid_generate_v4(), 'Pharmacology Master', '100 high-yield pharmacology cards for EMS providers', 'Pharmacology', 'intermediate', 10, 3, 'published', u.user_id, 850
FROM users u WHERE u.role = 'super_admin';

INSERT INTO flashcard_decks (deck_id, title, description, category, difficulty, price, card_count, status, uploaded_by, purchase_count)
SELECT uuid_generate_v4(), 'ACLS Algorithms', 'Advanced cardiac life support decision trees', 'Cardiology', 'advanced', 10, 2, 'published', u.user_id, 580
FROM users u WHERE u.role = 'super_admin';

INSERT INTO flashcards (deck_id, front, back, position)
SELECT d.deck_id, 'First-line drug for anaphylaxis?', 'Epinephrine 0.3-0.5mg IM (1:1000), lateral thigh', 0 FROM flashcard_decks d WHERE d.title = 'Pharmacology Master';
INSERT INTO flashcards (deck_id, front, back, position)
SELECT d.deck_id, 'Reversal agent for opioid overdose?', 'Naloxone (Narcan)', 1 FROM flashcard_decks d WHERE d.title = 'Pharmacology Master';
INSERT INTO flashcards (deck_id, front, back, position)
SELECT d.deck_id, 'Dose of Aspirin for suspected ACS?', '324mg (4x81mg) chewed', 2 FROM flashcard_decks d WHERE d.title = 'Pharmacology Master';
INSERT INTO flashcards (deck_id, front, back, position)
SELECT d.deck_id, 'First step for pulseless V-Tach/V-Fib?', 'Immediate defibrillation + high-quality CPR', 0 FROM flashcard_decks d WHERE d.title = 'ACLS Algorithms';
INSERT INTO flashcards (deck_id, front, back, position)
SELECT d.deck_id, 'Dose of Epinephrine in cardiac arrest?', '1mg IV/IO every 3-5 minutes', 1 FROM flashcard_decks d WHERE d.title = 'ACLS Algorithms';

-- ---------- Medical graphics (Ksh 10) ----------
INSERT INTO medical_graphics (graphic_id, title, description, category, graphic_type, tags, price, interactive_features, status, uploaded_by, view_count, purchase_count)
SELECT uuid_generate_v4(), 'Heart Anatomy 3D', 'Interactive 3D heart model with labels', 'Cardiology', '3D Anatomy',
       ARRAY['heart','anatomy','cardiology'], 10, '{"rotation_3d": true, "labels_toggle": true}'::jsonb, 'published', u.user_id, 2345, 650
FROM users u WHERE u.role = 'super_admin';

INSERT INTO medical_graphics (graphic_id, title, description, category, graphic_type, tags, price, interactive_features, status, uploaded_by, view_count, purchase_count)
SELECT uuid_generate_v4(), 'STEMI ECG Strip', 'Anteroseptal STEMI with hover annotations', 'Cardiology', 'ECG Strip',
       ARRAY['ecg','stemi','cardiology'], 10, '{"hover_annotations": true, "zoom_pan": true}'::jsonb, 'published', u.user_id, 1876, 410
FROM users u WHERE u.role = 'super_admin';

-- ---------- Assessments: quiz, exam, and a Clinical Judgment scenario ----------
INSERT INTO assessments (assessment_id, type, title, description, category, difficulty, bloom_level, time_limit_minutes, total_points, passing_score_pct, status, created_by, institution_id)
SELECT uuid_generate_v4(), 'quiz', 'Airway Management Quiz', 'Quick check on airway adjuncts and techniques', 'Airway', 'beginner', 'remember', 15, 30, 70, 'published', u.user_id, 1
FROM users u WHERE u.email = 'prof.maina@krcti.ac.ke';

INSERT INTO assessment_questions (assessment_id, question_type, prompt, correct_answer, options, points, position)
SELECT a.assessment_id, 'mcq', 'Which airway adjunct is contraindicated in a conscious patient with an intact gag reflex?', 'Oropharyngeal airway (OPA)',
       '["Nasopharyngeal airway (NPA)","Oropharyngeal airway (OPA)","Bag-valve-mask","Non-rebreather mask"]'::jsonb, 10, 0
FROM assessments a WHERE a.title = 'Airway Management Quiz';

INSERT INTO assessments (assessment_id, type, title, description, category, difficulty, bloom_level, time_limit_minutes, total_points, passing_score_pct, clinical_judgment_steps, status, created_by, institution_id)
SELECT uuid_generate_v4(), 'scenario', 'Anaphylaxis in the Field', 'Full prehospital scenario with branching decisions, scored against the NCSBN Clinical Judgment Model', 'Pharmacology', 'advanced', 'evaluate', 40, 60, 75,
       '["recognize_cues","analyze_cues","prioritize_hypotheses","generate_solutions","take_action","evaluate_outcomes"]'::jsonb,
       'published', u.user_id, NULL
FROM users u WHERE u.role = 'super_admin';

INSERT INTO assessment_questions (assessment_id, question_type, clinical_step, prompt, correct_answer, points, position)
SELECT a.assessment_id, 'scenario_step', 'recognize_cues', 'A 24-year-old develops hives, facial swelling, and stridor minutes after a bee sting. What cues indicate a life threat?', 'Stridor and facial/airway swelling indicate impending airway compromise', 10, 0
FROM assessments a WHERE a.title = 'Anaphylaxis in the Field';
INSERT INTO assessment_questions (assessment_id, question_type, clinical_step, prompt, correct_answer, points, position)
SELECT a.assessment_id, 'scenario_step', 'take_action', 'What is the immediate priority intervention?', 'Administer IM epinephrine 0.3-0.5mg and prepare to manage the airway', 15, 1
FROM assessments a WHERE a.title = 'Anaphylaxis in the Field';

-- ---------- Logbook + entries ----------
INSERT INTO logbooks (logbook_id, student_id, title, required_entries)
SELECT uuid_generate_v4(), u.user_id, 'Clinical Logbook - Year 2', 20 FROM users u WHERE u.email = 'john.doe@krcti.ac.ke';

INSERT INTO logbook_entries (logbook_id, student_id, patient_scenario, skills_performed, reflection, status, submitted_at)
SELECT l.logbook_id, l.student_id, '58yo male, chest pain radiating to left arm, diaphoretic. 12-lead showed anteroseptal STEMI.',
       ARRAY['12-lead ECG acquisition','IV access','Aspirin administration'],
       'Recognized STEMI criteria quickly; would improve on-scene time next time.', 'approved', now() - interval '10 days'
FROM logbooks l;

-- ---------- Videos ----------
INSERT INTO videos (student_id, title, description, skill_category, file_url, status, uploaded_at)
SELECT u.user_id, 'Two-Person CPR Demonstration', 'BLS skills check-off recording', 'BLS/CPR', '/uploads/videos/demo-cpr.mp4', 'approved', now() - interval '15 days'
FROM users u WHERE u.email = 'sarah.lee@stjohns.ac.ke';

-- ---------- Sample completed transactions (last 6 months) ----------
INSERT INTO revenue_transactions (student_id, institution_id, item_type, item_id, transaction_type, amount, payment_method, mpesa_code, status, transaction_date)
SELECT u.user_id, u.institution_id, 'flashcard_deck', d.deck_id, 'flashcard_deck', d.price, 'mpesa', 'QGH7' || substr(md5(random()::text), 1, 6), 'completed', now() - (random() * interval '180 days')
FROM users u CROSS JOIN flashcard_decks d WHERE u.role = 'student';

INSERT INTO revenue_transactions (student_id, institution_id, item_type, item_id, transaction_type, amount, payment_method, mpesa_code, status, transaction_date)
SELECT u.user_id, u.institution_id, 'worksheet', w.worksheet_id, 'worksheet', w.price, 'mpesa', 'QGH7' || substr(md5(random()::text), 1, 6), 'completed', now() - (random() * interval '180 days')
FROM users u CROSS JOIN worksheets w WHERE u.role = 'student';

INSERT INTO revenue_transactions (student_id, institution_id, item_type, item_id, transaction_type, amount, payment_method, mpesa_code, status, transaction_date)
SELECT u.user_id, u.institution_id, 'graphic', g.graphic_id, 'graphic', g.price, 'mpesa', 'QGH7' || substr(md5(random()::text), 1, 6), 'completed', now() - (random() * interval '180 days')
FROM users u CROSS JOIN medical_graphics g WHERE u.role = 'student';

INSERT INTO revenue_transactions (institution_id, item_type, transaction_type, amount, payment_method, status, transaction_date) VALUES
(1, 'subscription', 'institution_subscription', 850000, 'bank', 'completed', now() - interval '5 months'),
(2, 'subscription', 'institution_subscription', 620000, 'bank', 'completed', now() - interval '4 months'),
(3, 'subscription', 'institution_subscription', 450000, 'bank', 'completed', now() - interval '3 months'),
(4, 'subscription', 'institution_subscription', 320000, 'bank', 'completed', now() - interval '2 months'),
(5, 'subscription', 'institution_subscription', 180000, 'bank', 'completed', now() - interval '1 month');

-- ---------- Sample notifications ----------
INSERT INTO notifications (user_id, type, title, message)
SELECT u.user_id, 'payment', 'Purchase confirmed', 'Your purchase of "Pharmacology Master" was successful.'
FROM users u WHERE u.email = 'john.doe@krcti.ac.ke';

-- ---------- E-Library (Ksh 20 for high-value resources; some free) ----------
INSERT INTO elibrary_resources (title, description, category, author, price, is_premium, status, uploaded_by)
SELECT 'Prehospital Trauma Life Support — Field Guide', 'Quick-reference field guide covering primary/secondary survey and trauma triage.', 'Trauma', 'PHTLS Committee', 20, true, 'published', u.user_id
FROM users u WHERE u.role = 'super_admin';

INSERT INTO elibrary_resources (title, description, category, author, price, is_premium, status, uploaded_by)
SELECT 'ACLS Drug Dosage Card', 'Laminated-style quick card of resuscitation drug doses and intervals.', 'Cardiology', 'SA Technologies', 20, true, 'published', u.user_id
FROM users u WHERE u.role = 'super_admin';

INSERT INTO elibrary_resources (title, description, category, author, price, is_premium, status, uploaded_by)
SELECT 'EMS Documentation Basics', 'Free introductory guide to patient care report writing.', 'Operations', 'SA Technologies', 0, false, 'published', u.user_id
FROM users u WHERE u.role = 'super_admin';

-- ---------- Research (free to browse) ----------
-- Real, publicly resolvable sources (PubMed / PMC — NIH National Library of
-- Medicine). No placeholder/fake links: every external_url here opens a real
-- article. Curated items are pre-published by super_admin; the last row
-- demonstrates a student submission still awaiting teacher review (draft).
INSERT INTO research_items (title, authors, abstract, category, publication_date, external_url, status, uploaded_by)
SELECT 'Underuse of Epinephrine for the Treatment of Anaphylaxis in the Prehospital Setting', 'Various (NIH/NLM, PMC)', 'Examines how often EMS providers and dispatchers under-treat anaphylaxis with epinephrine before hospital arrival, and what drives the gap.', 'Pharmacology', '2022-04-01', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9033371/', 'published', u.user_id
FROM users u WHERE u.role = 'super_admin';

INSERT INTO research_items (title, authors, abstract, category, publication_date, external_url, status, uploaded_by)
SELECT 'Strategies to Teach the National Council of State Boards of Nursing Clinical Judgment Model', 'Dickison, P. et al.', 'Practical strategies for teaching the 6-step NCSBN Clinical Judgment Model in health-professions education.', 'Education', '2019-12-01', 'https://pubmed.ncbi.nlm.nih.gov/31856142/', 'published', u.user_id
FROM users u WHERE u.role = 'super_admin';

INSERT INTO research_items (title, authors, abstract, category, publication_date, external_url, status, uploaded_by)
SELECT 'A Call for Spaced Repetition in Medical Education', 'Various (NIH/NLM, PMC)', 'Makes the case for spaced-repetition scheduling — the same principle behind MedPro''s flashcard engine — as a core strategy in medical curricula.', 'Education', '2024-01-01', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10842980/', 'published', u.user_id
FROM users u WHERE u.role = 'super_admin';

INSERT INTO research_items (title, authors, abstract, category, publication_date, external_url, status, uploaded_by)
SELECT 'Emergency Medical Services (EMS) Training in Kenya: Findings and Recommendations from an Educational Assessment', 'Aga Khan University / international EMS educators', 'A 2016 educational assessment of EMS training standards, provider levels, and curricula across Kenya, with recommendations for standardisation.', 'EMS Systems', '2018-11-01', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6234130/', 'published', u.user_id
FROM users u WHERE u.role = 'super_admin';

INSERT INTO research_items (title, authors, abstract, category, publication_date, external_url, status, uploaded_by)
SELECT 'The Evolving Role of Paramedicine Educators: A Scoping Review', 'Various (NIH/NLM, PMC)', 'Scoping review of how the paramedicine educator role is shifting alongside community-oriented, out-of-hospital care models.', 'Education', '2025-01-01', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12033909/', 'published', u.user_id
FROM users u WHERE u.role = 'super_admin';

-- Demo: a student-submitted case write-up, still pending teacher review.
INSERT INTO research_items (title, authors, abstract, category, external_url, status, uploaded_by)
SELECT 'Field Case Review: Delayed Recognition of Compensated Shock in a Trauma Call', 'John Doe (KRCTI, Year 2)', 'Student case write-up from a supervised field placement, reviewing cue recognition timing against the NCSBN Clinical Judgment Model.', 'Student Research', NULL, 'draft', u.user_id
FROM users u WHERE u.email = 'john.doe@krcti.ac.ke';

-- ---------- Sample group alert ----------
INSERT INTO group_alerts (group_id, sender_id, title, message, channel, recipient_count)
SELECT g.group_id, g.teacher_id, 'Group discussion Thursday', 'Reminder: case review discussion this Thursday 4pm in the skills lab. Bring your logbook.', 'all', 2
FROM groups g WHERE g.name = 'Paramedicine Year 2 - Section A';
