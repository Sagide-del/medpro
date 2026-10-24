-- Add Nursing without rewriting any existing pathway or progress.
ALTER TABLE published_content_responses DROP CONSTRAINT IF EXISTS published_content_responses_program_check;
ALTER TABLE published_content_responses ADD CONSTRAINT published_content_responses_program_check CHECK (program IN ('EMT','Paramedic','Nursing'));
ALTER TABLE rag_sources DROP CONSTRAINT IF EXISTS rag_sources_program_check;
ALTER TABLE rag_sources ADD CONSTRAINT rag_sources_program_check CHECK (program IN ('EMT','Paramedic','Nursing','both'));

INSERT INTO mcq_modules(program,title,description,order_number,total_questions,passing_score)
VALUES
('Nursing','Nursing Fundamentals','Starter revision: person-centred care, communication, documentation, and consent.',1,0,75),
('Nursing','Patient Assessment','Starter revision: observation, reassessment, and recognition of deterioration.',2,0,75),
('Nursing','Infection Prevention','Starter revision: hand hygiene, standard precautions, and safe sharps disposal.',3,0,75),
('Nursing','Medication Safety','Starter revision: identification, checking prescriptions, and escalating concerns.',4,0,75)
ON CONFLICT(program,order_number) DO NOTHING;

-- Original educational starter questions, not a licensing exam bank.
WITH items(module_order, question_text, a, b, c, d, answer, explanation) AS (VALUES
(1,'An alert adult patient declines a non-emergency procedure. What is the most appropriate response?','Explain the procedure, explore concerns, and respect an informed refusal.','Proceed because the procedure was prescribed.','Ask a relative to consent instead.','Document agreement without discussing it.','option_a','Informed consent includes understanding, capacity, and a voluntary choice. Explore concerns, respect the decision, document accurately, and follow local escalation policies.'),
(1,'Which nursing note is most appropriate?','The patient was difficult.','The patient reported pain rated 6 out of 10 at 14:00; the nurse informed the supervising clinician.','The patient seems fine.','Medication was probably given.','option_b','Documentation should be timely, factual, specific, and distinguish patient reports from observations and actions.'),
(2,'A patient has a new change in consciousness and worsening observations. What should the student nurse do?','Wait until the next scheduled observation round.','Record the findings only at the end of the shift.','Promptly alert the supervising nurse and follow the local deterioration response protocol.','Leave the patient alone to rest.','option_c','New deterioration requires prompt assessment and escalation within the student’s scope and the institution’s protocol.'),
(2,'Why should a patient’s observations be compared with earlier measurements?','A single normal value rules out illness.','Trends can help identify changes in condition.','Previous measurements are always more accurate.','Trends replace clinical assessment.','option_b','Trends provide context and can reveal deterioration; interpret them with assessment findings, symptoms, and local escalation guidance.'),
(3,'When are standard infection prevention precautions used?','Only with patients known to have an infection.','Only during outbreaks.','Only in surgical wards.','For all patients, with protection selected according to the exposure risk.','option_d','Standard precautions apply to all patients. Hand hygiene, appropriate personal protective equipment, and safe handling practices depend on the task and exposure risk.'),
(3,'What is the safest routine action after using a needle?','Recap it using both hands.','Place it directly into an approved sharps container at the point of use.','Leave it on a tray for later disposal.','Put it into general waste.','option_b','Dispose of used sharps promptly in an approved container according to local policy. Routine recapping increases needlestick injury risk.'),
(4,'A medication prescription is unclear. What should a student nurse do?','Guess the intended dose.','Use the dose remembered from another patient.','Pause and seek clarification from the supervising nurse or authorised prescriber.','Ask the patient to choose the dose.','option_c','Do not administer against an unclear prescription. Clarify the order, follow medication policies, and work within supervised scope.'),
(4,'Which action best supports correct patient identification before medication administration?','Use the bed number alone.','Ask another patient to confirm the name.','Check approved patient identifiers against the prescription and identification record according to local policy.','Recognise the patient’s face.','option_c','Use institution-approved identifiers and verify the prescription, allergies, and relevant safety checks. Bed location alone is not an identifier.')
)
INSERT INTO mcq_questions(module_id,program,topic,question_text,option_a,option_b,option_c,option_d,correct_option,explanation,difficulty)
SELECT m.id,'Nursing',m.title,i.question_text,i.a,i.b,i.c,i.d,i.answer,i.explanation,'basic'
FROM items i JOIN mcq_modules m ON m.program='Nursing' AND m.order_number=i.module_order
WHERE NOT EXISTS(SELECT 1 FROM mcq_questions q WHERE q.module_id=m.id AND q.question_text=i.question_text);
UPDATE mcq_modules m SET total_questions=(SELECT count(*) FROM mcq_questions q WHERE q.module_id=m.id)
WHERE m.program='Nursing';
