import { query, withTransaction } from '../config/database.js';

const CONTENT_TYPE = 'EMS_CASE';
const DEFAULT_PASS_MARK = 80;
let medprohubSchemaPromise = null;

function cleanText(value) {
  return String(value || '').trim();
}

function normalizeLower(value) {
  return cleanText(value).toLowerCase();
}

function toUuidArray(value) {
  if (Array.isArray(value)) return value.map((item) => cleanText(item)).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => cleanText(item))
      .filter(Boolean);
  }
  return [];
}

function toIntArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => Number.parseInt(item, 10))
      .filter((item) => Number.isInteger(item));
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => Number.parseInt(cleanText(item), 10))
      .filter((item) => Number.isInteger(item));
  }
  return [];
}

function toTextArray(value) {
  if (Array.isArray(value)) return value.map((item) => cleanText(item)).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => cleanText(item))
      .filter(Boolean);
  }
  return [];
}

function safeJsonParse(value, fallback = null) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function stripCodeFence(text) {
  return String(text || '')
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
}

function flattenResponseValue(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(flattenResponseValue).join(' ');
  if (typeof value === 'object') return Object.values(value).map(flattenResponseValue).join(' ');
  return String(value);
}

function normalizeDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function createBlockId(prefix, suffix) {
  return `${prefix}-${suffix}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
}

async function ensureMedprohubSchema() {
  if (!medprohubSchemaPromise) {
    medprohubSchemaPromise = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS master_question_bank (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          description TEXT,
          content_type TEXT NOT NULL DEFAULT 'EMS_CASE',
          level TEXT NOT NULL DEFAULT 'BOTH',
          event_type TEXT,
          location TEXT,
          incident_date TIMESTAMP WITH TIME ZONE,
          difficulty TEXT NOT NULL DEFAULT 'Intermediate',
          incident_briefing TEXT,
          dispatch_info TEXT,
          patient_table JSONB NOT NULL DEFAULT '[]'::jsonb,
          stages JSONB NOT NULL DEFAULT '[]'::jsonb,
          answer_key JSONB NOT NULL DEFAULT '{}'::jsonb,
          learning_points TEXT[] NOT NULL DEFAULT '{}'::text[],
          questions JSONB NOT NULL DEFAULT '{}'::jsonb,
          image_urls TEXT[] NOT NULL DEFAULT '{}'::text[],
          status TEXT NOT NULL DEFAULT 'draft',
          created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
          school_id INTEGER REFERENCES institutions(institution_id) ON DELETE SET NULL,
          published_to INTEGER[] NOT NULL DEFAULT '{}'::integer[],
          published_to_schools INTEGER[] NOT NULL DEFAULT '{}'::integer[],
          tags TEXT[] NOT NULL DEFAULT '{}'::text[],
          usage_count INTEGER NOT NULL DEFAULT 0,
          source_file_url TEXT,
          source_file_name TEXT,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `);
      await query(`CREATE INDEX IF NOT EXISTS idx_master_question_bank_status ON master_question_bank(status)`);
      await query(`CREATE INDEX IF NOT EXISTS idx_master_question_bank_level ON master_question_bank(level)`);
      await query(`CREATE INDEX IF NOT EXISTS idx_master_question_bank_school ON master_question_bank(school_id)`);
      await query(`
        CREATE TABLE IF NOT EXISTS teacher_content (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          master_id UUID NOT NULL REFERENCES master_question_bank(id) ON DELETE CASCADE,
          teacher_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
          school_id INTEGER NOT NULL REFERENCES institutions(institution_id) ON DELETE CASCADE,
          custom_title TEXT,
          custom_description TEXT,
          selected_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
          custom_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
          added_images TEXT[] NOT NULL DEFAULT '{}'::text[],
          school_logo TEXT,
          status TEXT NOT NULL DEFAULT 'draft',
          published_to INTEGER[] NOT NULL DEFAULT '{}'::integer[],
          due_date TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
      `);
      await query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_teacher_content_unique ON teacher_content(master_id, teacher_id, school_id)`);
      await query(`CREATE INDEX IF NOT EXISTS idx_teacher_content_master ON teacher_content(master_id)`);
      await query(`CREATE INDEX IF NOT EXISTS idx_teacher_content_teacher ON teacher_content(teacher_id)`);
      await query(`CREATE INDEX IF NOT EXISTS idx_teacher_content_school ON teacher_content(school_id)`);
      await query(`
        CREATE TABLE IF NOT EXISTS student_ems_progress (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
          content_id UUID NOT NULL,
          content_from TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'NOT_STARTED',
          current_stage INTEGER NOT NULL DEFAULT 1,
          answers JSONB NOT NULL DEFAULT '{}'::jsonb,
          score NUMERIC(8,2),
          completed_at TIMESTAMP WITH TIME ZONE,
          time_spent INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          UNIQUE (student_id, content_id, content_from)
        )
      `);
      await query(`CREATE INDEX IF NOT EXISTS idx_student_ems_progress_student ON student_ems_progress(student_id)`);
      await query(`CREATE INDEX IF NOT EXISTS idx_student_ems_progress_content ON student_ems_progress(content_id, content_from)`);
    })().catch((error) => {
      medprohubSchemaPromise = null;
      throw error;
    });
  }

  return medprohubSchemaPromise;
}

function makeQuestionBlock(prefix, stage, number, text, grading = {}, fields = []) {
  const activityId = createBlockId(prefix, `s${stage}-q${number}`);
  return {
    id: activityId,
    activityId,
    stage,
    type: 'question',
    level: 2,
    text,
    grading: { ...grading, points: Number(grading.points || 0) },
    fields,
  };
}

function makeResponseBlock(prefix, stage, number, fieldDefs, grading = {}, type = 'response_field', inputType = 'text') {
  const activityId = createBlockId(prefix, `s${stage}-q${number}`);
  return {
    id: `${activityId}-response`,
    activityId,
    stage,
    type,
    input_type: inputType,
    fields: fieldDefs,
    grading: { ...grading, points: Number(grading.points || 0) },
  };
}

function buildPatientRows(patientCount, eventType, location) {
  const triageCycle = ['RED', 'RED', 'YELLOW', 'YELLOW', 'GREEN', 'GREEN', 'BLACK'];
  const complaints = [
    `${eventType} related chest pain`,
    'Altered mental status',
    'Lacerations and soft tissue injury',
    'Shortness of breath',
    'Fracture with pain',
    'Ambulatory stress reaction',
    'Cardiorespiratory arrest',
  ];

  return Array.from({ length: patientCount }, (_, index) => {
    const patientNumber = index + 1;
    const complaint = complaints[index % complaints.length];
    const triage = triageCycle[index % triageCycle.length];
    const age = 18 + ((patientNumber * 3) % 42);
    const gender = patientNumber % 2 === 0 ? 'Female' : 'Male';
    const vitals = `HR ${88 + index * 2}, BP 118/76, RR ${16 + (index % 5)}, SpO2 ${96 - (index % 4)}%, GCS ${14 - (index % 3)}`;
    return [`Patient ${patientNumber}`, `${age}/${gender[0]}`, complaint, vitals, triage, location || 'Scene'];
  });
}

function buildWorksheetBlocks(input) {
  const eventType = cleanText(input.eventType || 'Mass Casualty');
  const location = cleanText(input.location || 'Nairobi, Kenya');
  const incidentDate = cleanText(input.incidentDate || new Date().toISOString().slice(0, 10));
  const difficulty = cleanText(input.difficulty || 'Intermediate');
  const level = cleanText(input.level || 'BOTH');
  const patientCount = Math.max(5, Math.min(Number(input.patientCount) || 8, 15));
  const incidentDescription = cleanText(input.incidentDescription || '');
  const title = cleanText(input.title || `${eventType} EMS Case`);
  const briefing = cleanText(
    input.incidentBriefing
    || incidentDescription
    || `An EMS team is dispatched to a ${eventType.toLowerCase()} incident in ${location}.`
  );
  const dispatch = cleanText(
    input.dispatchInfo
    || `Dispatch advises multiple casualties, request for scene safety, triage, and coordinated transport to receiving facilities.`
  );

  const patientRows = buildPatientRows(patientCount, eventType, location);
  const statsRows = [
    ['Event type', eventType],
    ['Location', location],
    ['Date', incidentDate],
    ['Difficulty', difficulty],
    ['Level', level],
    ['Estimated patients', String(patientCount)],
  ];

  const prefix = `${eventType}-${location}`.toLowerCase();
  const sections = [
    { id: createBlockId(prefix, 'title'), type: 'heading', level: 1, text: `CASE STUDY: ${title}` },
    { id: createBlockId(prefix, 'subtitle'), type: 'paragraph', text: `${location} | ${incidentDate}` },
    { id: createBlockId(prefix, 'briefing-title'), type: 'heading', level: 2, text: 'Incident Briefing' },
    { id: createBlockId(prefix, 'briefing'), type: 'paragraph', text: briefing },
    {
      id: createBlockId(prefix, 'stats-title'),
      type: 'heading',
      level: 2,
      text: 'Incident Statistics',
    },
    {
      id: createBlockId(prefix, 'stats'),
      type: 'statistics_table',
      headers: ['Metric', 'Details'],
      rows: statsRows,
    },
    {
      id: createBlockId(prefix, 'dispatch-title'),
      type: 'heading',
      level: 2,
      text: 'Dispatch Information',
    },
    {
      id: createBlockId(prefix, 'dispatch'),
      type: 'dispatch_box',
      text: dispatch,
    },
    {
      id: createBlockId(prefix, 'patients'),
      type: 'patient_table',
      headers: ['Patient', 'Age/Sex', 'Chief Complaint', 'Vitals', 'Triage', 'Location'],
      rows: patientRows,
    },
    {
      id: createBlockId(prefix, 'phase-1'),
      type: 'instruction',
      text: 'STUDENT ACTION REQUIRED - PHASE 1',
    },
    makeQuestionBlock(prefix, 1, 1, '1. Scene Size-Up & Safety: describe the immediate priorities before patient contact.', {
      points: 6,
      criteria: 'scene_safety',
      keywords: ['scene safety', 'hot zone', 'warm zone', 'cold zone', 'ppe', 'incident command'],
    }),
    makeResponseBlock(prefix, 1, 1, [
      { id: 'hot_zone', label: 'HOT ZONE', type: 'textarea', placeholder: 'Describe the hot zone' },
      { id: 'warm_zone', label: 'WARM ZONE', type: 'textarea', placeholder: 'Describe the warm zone' },
      { id: 'cold_zone', label: 'COLD ZONE', type: 'textarea', placeholder: 'Describe the cold zone' },
      { id: 'ambulance_positioning', label: 'Ambulance positioning', type: 'textarea', placeholder: 'Describe ambulance placement' },
    ], {
      points: 8,
      criteria: 'scene_safety',
      keywords: ['hot zone', 'warm zone', 'cold zone', 'ambulance', 'positioning', 'safe access'],
    }),
    makeQuestionBlock(prefix, 1, 2, '2. BSI & PPE Considerations: list the infection control and PPE measures required.', {
      points: 4,
      criteria: 'ppe',
      keywords: ['bsi', 'ppe', 'gloves', 'eye protection', 'helmet', 'vest'],
    }),
    makeResponseBlock(prefix, 1, 2, [
      { id: 'ppe', label: 'PPE / BSI measures', type: 'textarea', placeholder: 'List the PPE measures' },
    ], {
      points: 6,
      criteria: 'ppe',
      keywords: ['bsi', 'ppe', 'gloves', 'eye protection', 'helmet', 'vest', 'mask'],
    }),
    makeQuestionBlock(prefix, 1, 3, '3. Triage & Resource Assessment: what resources and command structure are needed?', {
      points: 4,
      criteria: 'resources',
      keywords: ['triage', 'resources', 'incident command', 'transport', 'ambulance', 'mutual aid'],
    }),
    makeResponseBlock(prefix, 1, 3, [
      { id: 'resources', label: 'Resources', type: 'textarea', placeholder: 'List the resources needed' },
      { id: 'command', label: 'Command', type: 'textarea', placeholder: 'Describe the command structure' },
    ], {
      points: 6,
      criteria: 'resources',
      keywords: ['triage', 'resources', 'command', 'transport', 'ambulance', 'mutual aid'],
    }),
    {
      id: createBlockId(prefix, 'phase-2'),
      type: 'instruction',
      text: 'STUDENT ACTION REQUIRED - PHASE 2',
    },
    makeQuestionBlock(prefix, 2, 1, '4. Patient Assessment: what is your primary survey sequence for the first patient?', {
      points: 5,
      criteria: 'primary_survey',
      keywords: ['airway', 'breathing', 'circulation', 'disability', 'exposure'],
    }),
    makeResponseBlock(prefix, 2, 1, [
      { id: 'primary_survey', label: 'Primary survey', type: 'textarea', placeholder: 'Describe the primary survey' },
      { id: 'secondary_survey', label: 'Secondary survey', type: 'textarea', placeholder: 'Describe the secondary survey' },
    ], {
      points: 8,
      criteria: 'assessment',
      keywords: ['airway', 'breathing', 'circulation', 'disability', 'exposure', 'secondary'],
    }),
    makeQuestionBlock(prefix, 2, 2, '5. Patient Assessment Table: assign the most appropriate triage category to each patient.', {
      points: 6,
      criteria: 'triage',
      keywords: ['red', 'yellow', 'green', 'black', 'triage'],
    }),
    makeResponseBlock(prefix, 2, 2, [
      { id: 'red_patients', label: 'RED patients', type: 'textarea', placeholder: 'List immediate patients' },
      { id: 'yellow_patients', label: 'YELLOW patients', type: 'textarea', placeholder: 'List urgent patients' },
      { id: 'green_patients', label: 'GREEN patients', type: 'textarea', placeholder: 'List delayed patients' },
      { id: 'black_patients', label: 'BLACK patients', type: 'textarea', placeholder: 'List deceased/expectant patients' },
    ], {
      points: 10,
      criteria: 'triage',
      keywords: ['red', 'yellow', 'green', 'black', 'triage', 'priority'],
    }, 'response_table'),
    makeQuestionBlock(prefix, 2, 3, '6. START Triage Decision: explain why your highest priority patients were classified as immediate.', {
      points: 4,
      criteria: 'triage_rationale',
      keywords: ['respiration', 'perfusion', 'mental status', 'airway', 'shock'],
    }),
    makeResponseBlock(prefix, 2, 3, [
      { id: 'triage_rationale', label: 'Triage rationale', type: 'textarea', placeholder: 'Explain your triage decisions' },
    ], {
      points: 6,
      criteria: 'triage_rationale',
      keywords: ['respiration', 'perfusion', 'mental status', 'airway', 'shock', 'priority'],
    }),
    makeQuestionBlock(prefix, 2, 4, '7. Reassessment: what vitals and indicators must be monitored during patient movement?', {
      points: 4,
      criteria: 'reassessment',
      keywords: ['vitals', 'gcs', 'spo2', 'blood pressure', 'respiratory rate'],
    }),
    makeResponseBlock(prefix, 2, 4, [
      { id: 'reassessment', label: 'Reassessment', type: 'textarea', placeholder: 'Describe reassessment findings' },
    ], {
      points: 6,
      criteria: 'reassessment',
      keywords: ['vitals', 'gcs', 'spo2', 'blood pressure', 'respiratory', 'reassessment'],
    }),
    makeQuestionBlock(prefix, 2, 5, '8. Transport Priority Plan: which patient goes first and where should they be transported?', {
      points: 4,
      criteria: 'transport',
      keywords: ['transport', 'destination', 'priority', 'receiving hospital', 'handover'],
    }),
    makeResponseBlock(prefix, 2, 5, [
      { id: 'transport_priority', label: 'Transport priority', type: 'textarea', placeholder: 'Describe transport priority' },
      { id: 'destination', label: 'Destination', type: 'textarea', placeholder: 'Describe destination' },
    ], {
      points: 6,
      criteria: 'transport',
      keywords: ['transport', 'destination', 'priority', 'hospital', 'handover'],
    }),
    {
      id: createBlockId(prefix, 'phase-3'),
      type: 'instruction',
      text: 'STUDENT ACTION REQUIRED - PHASE 3',
    },
    makeQuestionBlock(prefix, 3, 1, '9. En Route Care: outline immediate interventions while transporting the patient.', {
      points: 4,
      criteria: 'en_route_care',
      keywords: ['oxygen', 'monitoring', 'reassessment', 'iv', 'pain control'],
    }),
    makeResponseBlock(prefix, 3, 1, [
      { id: 'en_route_care', label: 'En route care', type: 'textarea', placeholder: 'Describe en route care' },
    ], {
      points: 6,
      criteria: 'en_route_care',
      keywords: ['oxygen', 'monitoring', 'reassessment', 'iv', 'pain', 'support'],
    }),
    makeQuestionBlock(prefix, 3, 2, '10. Communication: what should be communicated to receiving staff before arrival?', {
      points: 4,
      criteria: 'communication',
      keywords: ['handover', 'situation', 'mechanism', 'injuries', 'vitals', 'treatment'],
    }),
    makeResponseBlock(prefix, 3, 2, [
      { id: 'communication', label: 'Communications', type: 'textarea', placeholder: 'Describe the handover message' },
    ], {
      points: 6,
      criteria: 'communication',
      keywords: ['handover', 'situation', 'mechanism', 'injuries', 'vitals', 'treatment', 'sbAR'],
    }),
    makeQuestionBlock(prefix, 3, 3, '11. Scene Management: what safety or coordination issues may arise during transport operations?', {
      points: 4,
      criteria: 'operations',
      keywords: ['coordination', 'police', 'fire', 'scene safety', 'traffic', 'resources'],
    }),
    makeResponseBlock(prefix, 3, 3, [
      { id: 'operations', label: 'Operational considerations', type: 'textarea', placeholder: 'Describe operations and coordination' },
    ], {
      points: 6,
      criteria: 'operations',
      keywords: ['coordination', 'police', 'fire', 'scene safety', 'traffic', 'resources'],
    }),
    {
      id: createBlockId(prefix, 'phase-4'),
      type: 'instruction',
      text: 'STUDENT ACTION REQUIRED - PHASE 4',
    },
    makeQuestionBlock(prefix, 4, 1, '12. Handover: structure the report you would give at the receiving facility.', {
      points: 5,
      criteria: 'handover',
      keywords: ['sbar', 'mechanism', 'assessment', 'interventions', 'response'],
    }),
    makeResponseBlock(prefix, 4, 1, [
      { id: 'handover', label: 'Handover report', type: 'textarea', placeholder: 'Write the handover report' },
    ], {
      points: 6,
      criteria: 'handover',
      keywords: ['sbar', 'mechanism', 'assessment', 'interventions', 'response', 'arrival'],
    }),
    makeQuestionBlock(prefix, 4, 2, '13. Documentation: what must be documented before leaving the receiving facility?', {
      points: 4,
      criteria: 'documentation',
      keywords: ['documentation', 'times', 'vitals', 'treatment', 'signatures'],
    }),
    makeResponseBlock(prefix, 4, 2, [
      { id: 'documentation', label: 'Documentation', type: 'textarea', placeholder: 'Describe required documentation' },
    ], {
      points: 6,
      criteria: 'documentation',
      keywords: ['documentation', 'times', 'vitals', 'treatment', 'signatures', 'records'],
    }),
    {
      id: createBlockId(prefix, 'phase-5'),
      type: 'instruction',
      text: 'STUDENT ACTION REQUIRED - PHASE 5',
    },
    makeQuestionBlock(prefix, 5, 1, '14. Documentation & Debriefing: identify one strength and one improvement point from the incident.', {
      points: 4,
      criteria: 'debriefing',
      keywords: ['strength', 'improvement', 'debrief', 'lessons learned'],
    }),
    makeResponseBlock(prefix, 5, 1, [
      { id: 'debriefing', label: 'Debriefing notes', type: 'textarea', placeholder: 'Reflect on the case' },
    ], {
      points: 6,
      criteria: 'debriefing',
      keywords: ['strength', 'improvement', 'debrief', 'lessons learned', 'review'],
    }, 'reflection'),
    makeQuestionBlock(prefix, 5, 2, '15. Reflection: list two changes that would improve future EMS response to this incident type.', {
      points: 4,
      criteria: 'reflection',
      keywords: ['training', 'coordination', 'resources', 'communication', 'preparedness'],
    }),
    makeResponseBlock(prefix, 5, 2, [
      { id: 'reflection_1', label: 'Reflection 1', type: 'textarea', placeholder: 'First improvement' },
      { id: 'reflection_2', label: 'Reflection 2', type: 'textarea', placeholder: 'Second improvement' },
    ], {
      points: 6,
      criteria: 'reflection',
      keywords: ['training', 'coordination', 'resources', 'communication', 'preparedness', 'planning'],
    }, 'reflection'),
  ];

  const learningPoints = [
    `Recognize the EMS priorities for ${eventType.toLowerCase()} incidents.`,
    'Apply scene safety, triage, and transport coordination.',
    'Document and hand over patients using structured communication.',
    'Monitor vital signs and reassess during transport.',
    'Reflect on operational lessons and improvement points.',
  ];

  const gradingJson = {
    passing_percentage: input.passingScore || DEFAULT_PASS_MARK,
    total_points: sections
      .filter((block) => block.grading?.points)
      .reduce((sum, block) => sum + Number(block.grading.points || 0), 0),
    blocks: sections.reduce((acc, block) => {
      if (block.grading?.points) {
        acc[block.activityId || block.id] = {
          points: Number(block.grading.points || 0),
          criteria: block.grading.criteria || '',
          keywords: Array.isArray(block.grading.keywords) ? block.grading.keywords : [],
          correct_option: block.grading.correct_option || null,
        };
      }
      return acc;
    }, {}),
  };

  return {
    title,
    description: cleanText(input.description || `${eventType} case study for ${level} learners.`),
    content_type: CONTENT_TYPE,
    level,
    event_type: eventType,
    location,
    incident_date: incidentDate,
    difficulty,
    incident_briefing: briefing,
    dispatch_info: dispatch,
    patient_table: [{ headers: ['Patient', 'Age/Sex', 'Chief Complaint', 'Vitals', 'Triage', 'Location'], rows: patientRows }],
    stages: sections,
    answer_key: gradingJson,
    learning_points: learningPoints,
    questions: {},
    image_urls: [],
    status: 'draft',
    created_by: null,
    school_id: null,
    published_to: [],
    published_to_schools: [],
    tags: [normalizeLower(eventType), normalizeLower(location), normalizeLower(difficulty)],
    usage_count: 0,
    source_file_url: input.sourceFileUrl || null,
    source_file_name: input.sourceFileName || null,
  };
}

async function callDeepSeekGenerate(input) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return null;

  const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-v4-pro';
  const prompt = [
    'You are an expert Kenyan EMS educator. Generate a complete EMS case study based only on the provided source material.',
    'Do not hallucinate, do not invent incident details, and do not reuse generic template content.',
    `Event Type: ${input.eventType}`,
    `Location: ${input.location}`,
    `Date: ${input.incidentDate}`,
    `Description: ${input.incidentDescription}`,
    `Patient Count: ${input.patientCount}`,
    `Level: ${input.level}`,
    `Difficulty: ${input.difficulty}`,
    'Return ONLY valid JSON with the keys: title, description, incident_briefing, dispatch_info, patient_table, stages, answer_key, learning_points.',
    'stages must be an array of worksheet blocks, each block containing id, type, and the appropriate properties for the MedProHub worksheet renderer.',
    'If a detail is not present in the source, write "Not stated in source".',
  ].join('\n');

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: 'Respond only with valid JSON. No markdown, no prose.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content || '';
  const parsed = safeJsonParse(stripCodeFence(text), null);
  if (!parsed || typeof parsed !== 'object') return null;
  return parsed;
}

function normalizeGeneratedPayload(input, generated = null) {
  const fallback = buildWorksheetBlocks(input);
  const source = generated && typeof generated === 'object' ? generated : {};
  const sections = Array.isArray(source.stages)
    ? source.stages
    : Array.isArray(source.sections)
      ? source.sections
      : fallback.stages;
  const answerKey = source.answer_key && typeof source.answer_key === 'object'
    ? source.answer_key
    : fallback.answer_key;

  return {
    title: cleanText(source.title || fallback.title),
    description: cleanText(source.description || fallback.description),
    content_type: CONTENT_TYPE,
    level: cleanText(input.level || fallback.level),
    event_type: cleanText(input.eventType || fallback.event_type),
    location: cleanText(input.location || fallback.location),
    incident_date: normalizeDate(input.incidentDate) || fallback.incident_date,
    difficulty: cleanText(input.difficulty || fallback.difficulty),
    incident_briefing: cleanText(source.incident_briefing || fallback.incident_briefing),
    dispatch_info: cleanText(source.dispatch_info || fallback.dispatch_info),
    patient_table: Array.isArray(source.patient_table) ? source.patient_table : fallback.patient_table,
    stages: sections,
    answer_key: answerKey,
    learning_points: Array.isArray(source.learning_points) && source.learning_points.length ? source.learning_points : fallback.learning_points,
    questions: source.questions && typeof source.questions === 'object' ? source.questions : fallback.questions,
    image_urls: Array.isArray(source.image_urls) ? source.image_urls : fallback.image_urls,
    status: 'review',
    created_by: input.createdBy || null,
    school_id: input.schoolId || null,
    published_to: Array.isArray(input.publishedTo) ? input.publishedTo : [],
    published_to_schools: Array.isArray(input.publishedToSchools) ? toIntArray(input.publishedToSchools) : [],
    tags: Array.isArray(source.tags) ? source.tags : fallback.tags,
    usage_count: 0,
    source_file_url: input.sourceFileUrl || null,
    source_file_name: input.sourceFileName || null,
  };
}

function rowToMasterCase(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    content_type: row.content_type,
    level: row.level,
    event_type: row.event_type,
    location: row.location || '',
    incident_date: row.incident_date || null,
    difficulty: row.difficulty,
    incident_briefing: row.incident_briefing || '',
    dispatch_info: row.dispatch_info || '',
    patient_table: row.patient_table || [],
    stages: row.stages || [],
    answer_key: row.answer_key || {},
    learning_points: row.learning_points || [],
    questions: row.questions || {},
    image_urls: row.image_urls || [],
    status: row.status,
    created_by: row.created_by || null,
    created_by_name: row.created_by_name || null,
    school_id: row.school_id || null,
    published_to: row.published_to || [],
    published_to_schools: row.published_to_schools || [],
    tags: row.tags || [],
    usage_count: Number(row.usage_count || 0),
    source_file_url: row.source_file_url || null,
    source_file_name: row.source_file_name || null,
    created_at: row.created_at,
    updated_at: row.updated_at || null,
    content_json: {
      type: 'worksheet',
      sections: row.stages || [],
    },
    grading_json: row.answer_key || {},
  };
}

function rowToTeacherCase(row, masterRow = null) {
  if (!row) return null;
  const base = masterRow ? rowToMasterCase(masterRow) : null;
  const sections = Array.isArray(row.custom_questions) && row.custom_questions.length
    ? row.custom_questions
    : base?.stages || [];
  const selected = Array.isArray(row.selected_questions) && row.selected_questions.length
    ? row.selected_questions
    : sections.map((block) => block.id);

  return {
    id: row.id,
    master_id: row.master_id,
    teacher_id: row.teacher_id,
    school_id: row.school_id,
    title: row.custom_title || base?.title || '',
    description: row.custom_description || base?.description || '',
    level: base?.level || null,
    event_type: base?.event_type || null,
    location: base?.location || null,
    difficulty: base?.difficulty || null,
    status: row.status,
    selected_questions: selected,
    custom_questions: sections,
    added_images: row.added_images || [],
    school_logo: row.school_logo || null,
    published_to: row.published_to || [],
    due_date: row.due_date || null,
    created_at: row.created_at,
    updated_at: row.updated_at || null,
    content_json: {
      type: 'worksheet',
      sections,
    },
    grading_json: base?.grading_json || {},
    master_title: base?.title || null,
  };
}

function rowsToAssignmentSummary(rows, progressMap) {
  return rows.map((row) => {
    const progress = progressMap.get(`${row.content_from}:${row.content_id}`) || null;
    return {
      id: row.content_id,
      content_id: row.content_id,
      content_from: row.content_from,
      title: row.title,
      description: row.description || '',
      level: row.level,
      event_type: row.event_type,
      location: row.location,
      difficulty: row.difficulty,
      status: progress?.status || row.status || 'NOT_STARTED',
      current_stage: progress?.current_stage || 1,
      score: Number(progress?.score || 0),
      completed_at: progress?.completed_at || null,
      answer_count: progress?.answer_count || 0,
      content_json: row.content_json,
      grading_json: row.grading_json || {},
      source_title: row.source_title || null,
      school_logo: row.school_logo || null,
      due_date: row.due_date || null,
    };
  });
}

function gradingEntriesFromSections(sections = []) {
  const entries = [];
  for (const block of sections) {
    if (!block || !block.grading) continue;
    const key = block.activityId || block.id;
    entries.push([
      key,
      {
        points: Number(block.grading.points || 0),
        criteria: block.grading.criteria || '',
        keywords: Array.isArray(block.grading.keywords) ? block.grading.keywords : [],
        correct_option: block.grading.correct_option || null,
      },
    ]);
  }
  return Object.fromEntries(entries);
}

function gradeBlock(block, answer) {
  const grading = block.grading || {};
  const points = Number(grading.points || 0);
  const answerText = flattenResponseValue(answer).trim();
  const keywords = Array.isArray(grading.keywords) ? grading.keywords : [];
  const correctOption = cleanText(grading.correct_option || block.correct_option || '');

  let isCorrect = false;
  if (keywords.length) {
    const normalizedAnswer = normalizeLower(answerText);
    const matched = keywords.filter((keyword) => normalizedAnswer.includes(normalizeLower(keyword)));
    isCorrect = matched.length >= Math.max(2, Math.ceil(keywords.length * 0.4));
  } else if (correctOption) {
    isCorrect = normalizeLower(answerText) === normalizeLower(correctOption);
  } else if (points === 0) {
    isCorrect = answerText.length > 0;
  } else {
    isCorrect = answerText.length > 0;
  }

  return {
    id: block.activityId || block.id,
    title: block.text || block.title || block.id,
    stage: block.stage || 1,
    points,
    earnedPoints: isCorrect ? points : 0,
    isCorrect,
    criteria: grading.criteria || '',
    hasAnswer: answerText.length > 0,
    answer: answerText,
  };
}

async function ensureStudentProgress(db, { studentId, contentId, contentFrom, stage = 1 }) {
  await ensureMedprohubSchema();
  const { rows } = await db.query(
    `SELECT *
     FROM student_ems_progress
     WHERE student_id = $1
       AND content_id = $2
       AND content_from = $3
     LIMIT 1`,
    [studentId, contentId, contentFrom]
  );
  const existing = rows[0];
  if (existing) return existing;

  const { rows: inserted } = await db.query(
    `INSERT INTO student_ems_progress (student_id, content_id, content_from, status, current_stage, answers, score, time_spent)
     VALUES ($1, $2, $3, 'NOT_STARTED', $4, '{}'::jsonb, 0, 0)
     RETURNING *`,
    [studentId, contentId, contentFrom, stage]
  );
  return inserted[0];
}

async function loadMasterCaseById(id) {
  await ensureMedprohubSchema();
  const { rows } = await query(
    `SELECT mb.*, creator.full_name AS created_by_name
     FROM master_question_bank mb
     LEFT JOIN users creator ON creator.user_id = mb.created_by
     WHERE mb.id = $1
     LIMIT 1`,
    [id]
  );
  return rowToMasterCase(rows[0]);
}

async function loadTeacherCaseById(id) {
  await ensureMedprohubSchema();
  const { rows } = await query(
    `SELECT tc.*, mb.*, creator.full_name AS created_by_name
     FROM teacher_content tc
     INNER JOIN master_question_bank mb ON mb.id = tc.master_id
     LEFT JOIN users creator ON creator.user_id = mb.created_by
     WHERE tc.id = $1
     LIMIT 1`,
    [id]
  );
  if (!rows[0]) return null;
  return rowToTeacherCase(rows[0], rows[0]);
}

async function loadAnyAssignmentById(id) {
  const teacher = await loadTeacherCaseById(id);
  if (teacher) return { source: 'TEACHER', record: teacher };
  const master = await loadMasterCaseById(id);
  if (master) return { source: 'MASTER', record: master };
  return null;
}

function contentFilterClause({ studentId, institutionId, sourceAlias = 'mb' }) {
  const clauses = [`$1::uuid = ANY(COALESCE(${sourceAlias}.published_to, '{}'::uuid[]))`];
  if (institutionId) {
    clauses.push(`$2::int = ANY(COALESCE(${sourceAlias}.published_to_schools, '{}'::integer[]))`);
  }
  return clauses.join(' OR ');
}

export const MedProhubEmsService = {
  async generateDraft(input) {
    await ensureMedprohubSchema();
    const normalizedInput = {
      eventType: cleanText(input.eventType || 'MCI'),
      location: cleanText(input.location || 'Nairobi, Kenya'),
      incidentDate: cleanText(input.incidentDate || new Date().toISOString().slice(0, 10)),
      patientCount: Number(input.patientCount || 8),
      difficulty: cleanText(input.difficulty || 'Intermediate'),
      level: cleanText(input.level || 'BOTH'),
      incidentDescription: cleanText(input.incidentDescription || ''),
      sourceFileUrl: input.sourceFileUrl || null,
      sourceFileName: input.sourceFileName || null,
      createdBy: input.createdBy || null,
      schoolId: input.schoolId || null,
      publishedTo: toUuidArray(input.publishedTo),
      publishedToSchools: toUuidArray(input.publishedToSchools),
      description: cleanText(input.description || ''),
    };

    const aiDraft = await callDeepSeekGenerate(normalizedInput);
    const draft = normalizeGeneratedPayload(normalizedInput, aiDraft);
    const payload = {
      ...draft,
      content_type: CONTENT_TYPE,
      status: 'review',
    };

    const { rows } = await query(
      `INSERT INTO master_question_bank (
         title,
         description,
         content_type,
         level,
         event_type,
         location,
         incident_date,
         difficulty,
         incident_briefing,
         dispatch_info,
         patient_table,
         stages,
         answer_key,
         learning_points,
         questions,
         image_urls,
         status,
         created_by,
         school_id,
         published_to,
         published_to_schools,
         tags,
         usage_count,
         source_file_url,
         source_file_name
       )
       VALUES (
         $1,$2,$3,$4,$5,$6,$7::timestamptz,$8,$9,$10,$11::jsonb,$12::jsonb,$13::jsonb,$14::text[],$15::jsonb,$16::text[],$17,$18::uuid,$19::int,$20::int[],$21::int[],$22::text[],$23,$24,$25
       )
       RETURNING *`,
      [
        payload.title,
        payload.description,
        payload.content_type,
        payload.level,
        payload.event_type,
        payload.location,
        payload.incident_date,
        payload.difficulty,
        payload.incident_briefing,
        payload.dispatch_info,
        JSON.stringify(payload.patient_table),
        JSON.stringify(payload.stages),
        JSON.stringify(payload.answer_key),
        payload.learning_points,
        JSON.stringify(payload.questions || {}),
        payload.image_urls,
        payload.status,
        payload.created_by,
        payload.school_id ? Number(payload.school_id) : null,
        payload.published_to,
        payload.published_to_schools,
        payload.tags,
        payload.usage_count,
        payload.source_file_url,
        payload.source_file_name,
      ]
    );

    return rowToMasterCase(rows[0]);
  },

  async listMasterCases({ includeAll = false } = {}) {
    await ensureMedprohubSchema();
    const statusClause = includeAll ? '' : `WHERE mb.status IN ('approved', 'published', 'review')`;
    const { rows } = await query(
      `SELECT mb.*, creator.full_name AS created_by_name
       FROM master_question_bank mb
       LEFT JOIN users creator ON creator.user_id = mb.created_by
       ${statusClause}
       ORDER BY mb.created_at DESC`
    );
    return rows.map(rowToMasterCase);
  },

  async getMasterCase(id) {
    await ensureMedprohubSchema();
    return loadMasterCaseById(id);
  },

  async updateMasterCase(id, input = {}) {
    await ensureMedprohubSchema();
    const current = await loadMasterCaseById(id);
    if (!current) return null;

    const next = {
      ...current,
      ...input,
      title: cleanText(input.title ?? current.title),
      description: cleanText(input.description ?? current.description),
      level: cleanText(input.level ?? current.level),
      event_type: cleanText(input.event_type ?? input.eventType ?? current.event_type),
      location: cleanText(input.location ?? current.location),
      incident_date: normalizeDate(input.incident_date ?? input.incidentDate ?? current.incident_date) || current.incident_date,
      difficulty: cleanText(input.difficulty ?? current.difficulty),
      incident_briefing: cleanText(input.incident_briefing ?? current.incident_briefing),
      dispatch_info: cleanText(input.dispatch_info ?? current.dispatch_info),
      patient_table: Array.isArray(input.patient_table ?? input.patientTable) ? (input.patient_table ?? input.patientTable) : current.patient_table,
      stages: Array.isArray(input.stages ?? input.content_json?.sections) ? (input.stages ?? input.content_json?.sections) : current.stages,
      answer_key: input.answer_key && typeof input.answer_key === 'object' ? input.answer_key : current.answer_key,
      learning_points: Array.isArray(input.learning_points) ? input.learning_points : current.learning_points,
      questions: input.questions && typeof input.questions === 'object' ? input.questions : current.questions,
      image_urls: Array.isArray(input.image_urls) ? input.image_urls : current.image_urls,
      status: cleanText(input.status ?? current.status) || current.status,
      school_id: input.school_id ?? current.school_id,
      published_to: Array.isArray(input.published_to) ? input.published_to : current.published_to,
      published_to_schools: Array.isArray(input.published_to_schools) ? toIntArray(input.published_to_schools) : current.published_to_schools,
      tags: Array.isArray(input.tags) ? input.tags : current.tags,
      source_file_url: input.source_file_url ?? current.source_file_url,
      source_file_name: input.source_file_name ?? current.source_file_name,
    };

    const { rows } = await query(
      `UPDATE master_question_bank
       SET title = $1,
           description = $2,
           level = $3,
           event_type = $4,
           location = $5,
           incident_date = $6::timestamptz,
           difficulty = $7,
           incident_briefing = $8,
           dispatch_info = $9,
           patient_table = $10::jsonb,
           stages = $11::jsonb,
           answer_key = $12::jsonb,
           learning_points = $13::text[],
           questions = $14::jsonb,
           image_urls = $15::text[],
           status = $16,
           school_id = $17::int,
           published_to = $18::uuid[],
           published_to_schools = $19::int[],
           tags = $20::text[],
           source_file_url = $21,
           source_file_name = $22,
           updated_at = now()
       WHERE id = $23
       RETURNING *`,
      [
        next.title,
        next.description,
        next.level,
        next.event_type,
        next.location,
        next.incident_date,
        next.difficulty,
        next.incident_briefing,
        next.dispatch_info,
        JSON.stringify(next.patient_table),
        JSON.stringify(next.stages),
        JSON.stringify(next.answer_key),
        next.learning_points,
        JSON.stringify(next.questions || {}),
        next.image_urls,
        next.status,
        next.school_id == null || next.school_id === '' ? null : Number(next.school_id),
        next.published_to,
        next.published_to_schools,
        next.tags,
        next.source_file_url,
        next.source_file_name,
        id,
      ]
    );

    return rowToMasterCase(rows[0]);
  },

  async setMasterStatus(id, status) {
    await ensureMedprohubSchema();
    const { rows } = await query(
      `UPDATE master_question_bank
       SET status = $2,
           updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [id, status]
    );
    return rowToMasterCase(rows[0]);
  },

  async publishMaster(id, input = {}) {
    await ensureMedprohubSchema();
    const current = await loadMasterCaseById(id);
    if (!current) return null;

    const target = cleanText(input.publishTarget || input.target || 'selected_schools');
    let publishedTo = toUuidArray(input.studentIds || input.publishedTo);
    let publishedToSchools = toIntArray(input.schoolIds || input.publishedToSchools);

    if (target === 'all_schools') {
      const { rows: schoolRows } = await query(`SELECT institution_id FROM institutions`);
      publishedToSchools = schoolRows.map((row) => Number(row.institution_id)).filter(Number.isFinite);
    }

    const updated = await MedProhubEmsService.updateMasterCase(id, {
      status: 'published',
      published_to: publishedTo,
      published_to_schools: publishedToSchools,
    });

    return updated;
  },

  async uploadMasterImages(id, files = []) {
    await ensureMedprohubSchema();
    const urls = files.map((file) => file?.url || file?.location || file?.path || null).filter(Boolean);
    if (!urls.length) return null;

    const { rows } = await query(
      `UPDATE master_question_bank
       SET image_urls = CASE
             WHEN array_length(image_urls, 1) IS NULL THEN $2::text[]
             ELSE image_urls || $2::text[]
           END,
           updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [id, urls]
    );
    return rowToMasterCase(rows[0]);
  },

  async listTeacherBank({ teacherId, institutionId } = {}) {
    await ensureMedprohubSchema();
    void teacherId;
    void institutionId;
    const { rows } = await query(
      `SELECT mb.*, creator.full_name AS created_by_name
       FROM master_question_bank mb
       LEFT JOIN users creator ON creator.user_id = mb.created_by
       WHERE mb.status IN ('approved', 'published', 'review')
       ORDER BY mb.updated_at DESC`
    );
    return rows.map(rowToMasterCase);
  },

  async getTeacherBankItem(id) {
    await ensureMedprohubSchema();
    return loadMasterCaseById(id);
  },

  async customizeForTeacher(input = {}) {
    await ensureMedprohubSchema();
    const master = await loadMasterCaseById(input.masterId);
    if (!master) return null;

    const teacherId = input.teacherId || null;
    const schoolId = input.schoolId || null;
    const selectedQuestions = toTextArray(input.selectedQuestions || input.selected_questions || []);
    const customQuestions = Array.isArray(input.customQuestions || input.custom_questions)
      ? (input.customQuestions || input.custom_questions)
      : [];
    const addedImages = toTextArray(input.addedImages || input.added_images || []);

    const { rows } = await query(
      `INSERT INTO teacher_content (
         master_id,
         teacher_id,
         school_id,
         custom_title,
         custom_description,
         selected_questions,
         custom_questions,
         added_images,
         school_logo,
         status,
         published_to,
         due_date
       )
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::text[], $9, $10, $11::int[], $12::timestamptz)
       ON CONFLICT (master_id, teacher_id, school_id)
       DO UPDATE SET
         custom_title = EXCLUDED.custom_title,
         custom_description = EXCLUDED.custom_description,
         selected_questions = EXCLUDED.selected_questions,
         custom_questions = EXCLUDED.custom_questions,
         added_images = EXCLUDED.added_images,
         school_logo = EXCLUDED.school_logo,
         status = EXCLUDED.status,
         published_to = EXCLUDED.published_to,
         due_date = EXCLUDED.due_date,
         updated_at = now()
       RETURNING *`,
      [
        master.id,
        teacherId,
        schoolId,
        cleanText(input.customTitle || input.custom_title || master.title),
        cleanText(input.customDescription || input.custom_description || master.description),
        JSON.stringify(selectedQuestions),
        JSON.stringify(customQuestions),
        addedImages,
        input.schoolLogo || input.school_logo || null,
        cleanText(input.status || 'draft') || 'draft',
        toIntArray(input.publishedTo || input.published_to),
        normalizeDate(input.dueDate || input.due_date),
      ]
    );

    return rowToTeacherCase(rows[0], master);
  },

  async listTeacherContent({ teacherId, schoolId } = {}) {
    await ensureMedprohubSchema();
    const params = [teacherId || null, schoolId || null];
    const { rows } = await query(
      `SELECT tc.*, mb.*, creator.full_name AS created_by_name
       FROM teacher_content tc
       INNER JOIN master_question_bank mb ON mb.id = tc.master_id
       LEFT JOIN users creator ON creator.user_id = mb.created_by
       WHERE ($1::uuid IS NULL OR tc.teacher_id = $1::uuid)
         AND ($2::int IS NULL OR tc.school_id = $2::int)
       ORDER BY tc.updated_at DESC`,
      params
    );
    return rows.map((row) => rowToTeacherCase(row, row));
  },

  async publishTeacherContent(id, input = {}) {
    await ensureMedprohubSchema();
    const teacherCase = await loadTeacherCaseById(id);
    if (!teacherCase) return null;

    const publishedTo = toUuidArray(input.studentIds || input.publishedTo);
    const schoolId = input.schoolId || teacherCase.school_id || null;

    const { rows } = await query(
      `UPDATE teacher_content
       SET status = 'published',
           published_to = $2::uuid[],
           school_id = COALESCE($3::int, school_id),
           updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [id, publishedTo, schoolId]
    );

    return rowToTeacherCase(rows[0], teacherCase);
  },

  async listStudentAssignments({ studentId, institutionId } = {}) {
    await ensureMedprohubSchema();
    const masterClauses = [`mb.status = 'published'`, `$1::uuid = ANY(COALESCE(mb.published_to, '{}'::uuid[]))`];
    if (institutionId) {
      masterClauses.push(`$2::int = ANY(COALESCE(mb.published_to_schools, '{}'::integer[]))`);
    }
    const teacherClauses = [`tc.status = 'published'`, `$1::uuid = ANY(COALESCE(tc.published_to, '{}'::uuid[]))`];
    if (institutionId) {
      teacherClauses.push(`tc.school_id = $2::int`);
    }

    const [master, teacher, progress] = await Promise.all([
      query(
        `SELECT mb.id AS content_id,
                'MASTER' AS content_from,
                mb.title,
                mb.description,
                mb.level,
                mb.event_type,
                mb.location,
                mb.difficulty,
                mb.status,
                mb.stages,
                mb.answer_key,
                mb.learning_points,
                mb.image_urls,
                mb.school_id,
                mb.due_date,
                mb.created_at,
                mb.updated_at
         FROM master_question_bank mb
         WHERE ${masterClauses.join(' OR ')}
         ORDER BY mb.updated_at DESC`,
        [studentId, institutionId || null]
      ),
      query(
        `SELECT tc.id AS content_id,
                'TEACHER' AS content_from,
                COALESCE(tc.custom_title, mb.title) AS title,
                COALESCE(tc.custom_description, mb.description) AS description,
                mb.level,
                mb.event_type,
                mb.location,
                mb.difficulty,
                tc.status,
                COALESCE(NULLIF(tc.custom_questions, '[]'::jsonb), mb.stages) AS stages,
                mb.answer_key,
                mb.learning_points,
                COALESCE(tc.added_images, mb.image_urls) AS image_urls,
                tc.school_id,
                tc.due_date,
                tc.created_at,
                tc.updated_at,
                tc.school_logo
         FROM teacher_content tc
         INNER JOIN master_question_bank mb ON mb.id = tc.master_id
         WHERE ${teacherClauses.join(' OR ')}
         ORDER BY tc.updated_at DESC`,
        [studentId, institutionId || null]
      ),
      query(
        `SELECT content_id, content_from, status, current_stage, answers, score, completed_at, time_spent
         FROM student_ems_progress
         WHERE student_id = $1`,
        [studentId]
      ),
    ]);

    const progressMap = new Map(
      progress.rows.map((row) => [`${row.content_from}:${row.content_id}`, row])
    );

    const masterRows = master.rows.map((row) => ({
      content_id: row.content_id,
      content_from: row.content_from,
      title: row.title,
      description: row.description,
      level: row.level,
      event_type: row.event_type,
      location: row.location,
      difficulty: row.difficulty,
      status: row.status,
      content_json: { type: 'worksheet', sections: row.stages || [] },
      grading_json: row.answer_key || {},
      source_title: row.title,
      school_logo: null,
      due_date: row.due_date,
    }));

    const teacherRows = teacher.rows.map((row) => ({
      content_id: row.content_id,
      content_from: row.content_from,
      title: row.title,
      description: row.description,
      level: row.level,
      event_type: row.event_type,
      location: row.location,
      difficulty: row.difficulty,
      status: row.status,
      content_json: { type: 'worksheet', sections: row.stages || [] },
      grading_json: row.answer_key || {},
      source_title: row.title,
      school_logo: row.school_logo || null,
      due_date: row.due_date,
    }));

    return rowsToAssignmentSummary([...masterRows, ...teacherRows], progressMap)
      .sort((a, b) => String(a.title).localeCompare(String(b.title)));
  },

  async getStudentAssignment({ studentId, contentId }) {
    await ensureMedprohubSchema();
    const assignment = await loadAnyAssignmentById(contentId);
    if (!assignment) return null;

    const record = assignment.record;
    const contentFrom = assignment.source;
    const { rows } = await query(
      `SELECT *
       FROM student_ems_progress
       WHERE student_id = $1
         AND content_id = $2
         AND content_from = $3
       LIMIT 1`,
      [studentId, contentId, contentFrom]
    );
    const progress = rows[0] || null;
    const sections = record.content_json?.sections || record.stages || [];

    return {
      content_id: record.id,
      content_from: contentFrom,
      title: record.title,
      description: record.description,
      level: record.level,
      event_type: record.event_type,
      location: record.location,
      difficulty: record.difficulty,
      status: progress?.status || 'NOT_STARTED',
      current_stage: progress?.current_stage || 1,
      score: Number(progress?.score || 0),
      completed_at: progress?.completed_at || null,
      answers: progress?.answers || {},
      time_spent: Number(progress?.time_spent || 0),
      content_json: { type: 'worksheet', sections },
      grading_json: record.grading_json || record.answer_key || {},
      school_logo: record.school_logo || null,
    };
  },

  async saveStudentAnswer({ studentId, contentId, contentFrom, activityId, value, currentStage = 1, timeSpent = 0 }) {
    await ensureMedprohubSchema();
    return withTransaction(async (db) => {
      const assignment = await loadAnyAssignmentById(contentId);
      if (!assignment) return null;
      const source = contentFrom || assignment.source;
      const progress = await ensureStudentProgress(db, {
        studentId,
        contentId,
        contentFrom: source,
        stage: currentStage,
      });
      const answers = { ...(progress.answers || {}) };
      if (activityId) {
        answers[activityId] = value;
      }

      const { rows } = await db.query(
        `UPDATE student_ems_progress
         SET status = CASE WHEN status = 'COMPLETED' THEN status ELSE 'IN_PROGRESS' END,
             current_stage = GREATEST(current_stage, $4),
             answers = $5::jsonb,
             time_spent = GREATEST(time_spent, $6),
             updated_at = now()
         WHERE student_id = $1
           AND content_id = $2
           AND content_from = $3
         RETURNING *`,
        [studentId, contentId, source, currentStage, JSON.stringify(answers), Number(timeSpent || progress.time_spent || 0)]
      );

      return rows[0];
    });
  },

  async getStudentProgress({ studentId, contentId }) {
    await ensureMedprohubSchema();
    const assignment = await loadAnyAssignmentById(contentId);
    if (!assignment) return null;
    const contentFrom = assignment.source;
    const { rows } = await query(
      `SELECT *
       FROM student_ems_progress
       WHERE student_id = $1
         AND content_id = $2
         AND content_from = $3
       LIMIT 1`,
      [studentId, contentId, contentFrom]
    );
    const progress = rows[0];
    if (!progress) {
      return {
        status: 'NOT_STARTED',
        current_stage: 1,
        answers: {},
        score: 0,
        completed_at: null,
        time_spent: 0,
      };
    }
    return progress;
  },

  async completeStudentCase({ studentId, contentId, answers = {}, timeSpent = 0 }) {
    await ensureMedprohubSchema();
    return withTransaction(async (db) => {
      const assignment = await loadAnyAssignmentById(contentId);
      if (!assignment) return null;
      const record = assignment.record;
      const source = assignment.source;
      const sections = record.content_json?.sections || record.stages || [];
      const progress = await ensureStudentProgress(db, {
        studentId,
        contentId,
        contentFrom: source,
        stage: 1,
      });

      const scoredBlocks = sections.filter((block) => block && block.grading && (block.type === 'response_field' || block.type === 'response_table' || block.type === 'reflection'));
      const review = scoredBlocks.map((block) => gradeBlock(block, answers[block.activityId || block.id]));
      const totalPoints = review.reduce((sum, item) => sum + Number(item.points || 0), 0);
      const earnedPoints = review.reduce((sum, item) => sum + Number(item.earnedPoints || 0), 0);
      const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 100;
      const passed = percentage >= Number(record.grading_json?.passing_percentage || record.answer_key?.passing_percentage || DEFAULT_PASS_MARK);
      const now = new Date().toISOString();

      const { rows } = await db.query(
        `UPDATE student_ems_progress
         SET status = $4,
             current_stage = $5,
             answers = $6::jsonb,
             score = $7,
             completed_at = $8::timestamptz,
             time_spent = GREATEST(time_spent, $9),
             updated_at = now()
         WHERE student_id = $1
           AND content_id = $2
           AND content_from = $3
         RETURNING *`,
        [
          studentId,
          contentId,
          source,
          passed ? 'COMPLETED' : 'IN_PROGRESS',
          scoredBlocks.length ? Math.min(5, Math.max(1, Math.ceil(scoredBlocks.length / 3))) : progress.current_stage || 1,
          JSON.stringify(answers || {}),
          percentage,
          passed ? now : progress.completed_at || null,
          Number(timeSpent || progress.time_spent || 0),
        ]
      );

      return {
        assignment: {
          content_id: record.id,
          content_from: source,
          title: record.title,
          content_json: { type: 'worksheet', sections },
          grading_json: record.grading_json || record.answer_key || {},
        },
        progress: rows[0],
        review,
        score: percentage,
        total_points: totalPoints,
        passed,
        strengths: [...new Set(review.filter((item) => item.isCorrect && item.criteria).map((item) => item.criteria))],
        improvements: [...new Set(review.filter((item) => !item.isCorrect && item.criteria).map((item) => item.criteria))],
      };
    });
  },
};
