-- Paramedic curriculum spine derived from the supplied Sanders' Paramedic
-- Textbook, 6th ed. The spine is intentionally content-light: published
-- questions and resources are attached to these scoped destinations later.
ALTER TABLE mcq_modules
  ADD COLUMN IF NOT EXISTS program VARCHAR(40) NOT NULL DEFAULT 'EMT';

ALTER TABLE mcq_modules
  DROP CONSTRAINT IF EXISTS mcq_modules_order_number_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mcq_modules_program_order
  ON mcq_modules(program, order_number);

INSERT INTO mcq_modules (program, title, description, order_number, total_questions)
VALUES
  ('Paramedic', 'Preparatory & Professional Practice', 'EMS systems, paramedic safety, public health, communications, law, ethics, and evidence-based practice. Chapters 1-8.', 1, 0),
  ('Paramedic', 'Anatomy, Physiology & Pathophysiology', 'Medical terminology, human systems, pathophysiology, and lifespan development. Chapters 9-12.', 2, 0),
  ('Paramedic', 'Pharmacology & Medication Administration', 'Principles of pharmacology, emergency medications, and medication administration. Chapters 13-14.', 3, 0),
  ('Paramedic', 'Airway & Artificial Ventilation', 'Airway management, respiration, oxygenation, and artificial ventilation. Chapter 15.', 4, 0),
  ('Paramedic', 'Patient Assessment & Clinical Decision Making', 'Therapeutic communication, history taking, primary and secondary assessment, reassessment, and clinical decisions. Chapters 16-20.', 5, 0),
  ('Paramedic', 'Cardiovascular & Medical Emergencies', 'Cardiology, respiratory, neurologic, endocrine, immune, infectious, gastrointestinal, renal, toxicology, and behavioral emergencies. Chapters 21-33.', 6, 0),
  ('Paramedic', 'Shock, Resuscitation & Trauma', 'Shock, trauma mechanisms, bleeding, burns, head, spine, chest, abdominal, and orthopaedic trauma. Chapters 34-42.', 7, 0),
  ('Paramedic', 'Special Populations & Acute Care', 'Environmental conditions, gynecology, obstetrics, neonatal care, pediatrics, geriatrics, abuse, neglect, and special challenges. Chapters 43-50.', 8, 0),
  ('Paramedic', 'Operations, Rescue & Incident Command', 'Home-care interventions, ambulance operations, incident command, rescue, crime scenes, hazardous materials, and weapons of mass destruction. Chapters 51-57.', 9, 0)
ON CONFLICT (program, order_number) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    is_active = true;

CREATE INDEX IF NOT EXISTS idx_mcq_modules_program ON mcq_modules(program);
