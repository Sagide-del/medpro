import { query } from '../config/database.js';

export const ragEnabled = () => process.env.RAG_ENABLED === 'true';
export function ragError(message, status = 400) {
  return Object.assign(new Error(message), { status, publicMessage: message });
}

// Global sources can only be uploaded/approved by super admins. Other sources
// stay inside their institution (or private owner scope for unaffiliated users).
export function sourceScope(user) {
  if (user.role === 'super_admin') return 'global';
  return user.institutionId ? `institution:${user.institutionId}` : `user:${user.sub}`;
}
export function readableScopes(user) {
  return [...new Set(['global', sourceScope(user)])];
}
export const sourceTypes = ['protocol', 'research_article', 'textbook', 'drug_reference', 'kenya_case', 'psychometric_case'];
export const retrievalRoutes = {
  question_bank: ['protocol', 'research_article', 'textbook'],
  psychometric_clinical: ['psychometric_case'],
  psychometric_situational: ['psychometric_case'],
  psychometric_readiness: ['psychometric_case'],
  kenya_cases: ['kenya_case'],
  study_plans: ['protocol', 'research_article'],
  drug_reference: ['drug_reference'],
  clinical_protocols: ['protocol'],
  study_guides: ['protocol', 'research_article', 'textbook'],
  notes: ['protocol', 'textbook'],
  cheat_sheets: ['protocol', 'drug_reference', 'textbook'],
  podcasts: ['protocol', 'textbook'],
  flashcards: ['protocol', 'textbook'],
  mnemonics: ['protocol', 'textbook'],
  diagrams: ['protocol', 'textbook'],
  skills_videos: ['protocol', 'textbook'],
};
export function retrievalDestination(destination) {
  return ({ ems_cases: 'kenya_cases', case_study: 'kenya_cases', podcast: 'podcasts',
    study_guide: 'study_guides', clinical_protocol: 'clinical_protocols', cheat_sheet: 'cheat_sheets',
    video_script: 'skills_videos' })[destination] || destination;
}
export function normalizeRagProgram(audience) {
  if (['EMT', 'emt', 'emt-basic', 'emt-intermediate'].includes(audience)) return 'EMT';
  if (['Paramedic', 'paramedic', 'emt-paramedic'].includes(audience)) return 'Paramedic';
  throw ragError('Choose exactly EMT or Paramedic for source retrieval.');
}
export async function ragRequest(path, { body, bytes, method = 'POST' } = {}) {
  if (!ragEnabled()) throw ragError('Source retrieval is not enabled.', 503);
  if (!process.env.RAG_SERVICE_URL || !process.env.RAG_SERVICE_KEY) {
    throw ragError('Source retrieval service is not configured.', 503);
  }
  try {
    const response = await fetch(`${process.env.RAG_SERVICE_URL.replace(/\/$/, '')}${path}`, {
      method, signal: AbortSignal.timeout(120000),
      headers: { Authorization: `Bearer ${process.env.RAG_SERVICE_KEY}`, 'Content-Type': bytes ? 'application/pdf' : 'application/json' },
      body: bytes || (body ? JSON.stringify(body) : undefined),
    });
    if (!response.ok) throw new Error(`Retrieval service status ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('RAG service request failed:', error.message);
    throw ragError('Source retrieval is temporarily unavailable. Check source status and retry.', 503);
  }
}

export async function retrieveSources(user, { program, destination = 'question_bank', subject, search, limit = 12 }) {
  program = normalizeRagProgram(program);
  destination = retrievalDestination(destination);
  const types = retrievalRoutes[destination];
  if (!types) throw ragError('This destination does not have a retrieval route yet.');
  if (!String(search || '').trim()) throw ragError('Enter a topic or search query.');
  const normalizedSubject = ['all', 'All subjects', ''].includes(subject || '') ? null : subject;
  const { rows } = await query(`SELECT id,filename,version,program,subject FROM rag_sources
    WHERE status='ready' AND approved_by IS NOT NULL AND scope_key=ANY($1::text[])
    AND program IN ($2,'both') AND source_type=ANY($3::text[]) AND ($4::text IS NULL OR subject=$4)`,
  [readableScopes(user), program, types, normalizedSubject]);
  if (!rows.length) throw ragError('No approved, indexed sources match this pathway and subject. Upload and approve sources first.', 422);
  const result = await ragRequest('/retrieve', { body: {
    document_ids: rows.map((row) => row.id), query: String(search).slice(0, 1500),
    limit: Math.max(1, Math.min(Number(limit) || 12, 24)),
  } });
  // Never trust vector metadata as the authorization source.
  const allowed = new Map(rows.map((row) => [row.id, row]));
  const chunks = (result.chunks || []).filter((chunk) => allowed.has(chunk.document_id)).map((chunk) => ({
    ...chunk, source_document: allowed.get(chunk.document_id).filename,
    version: allowed.get(chunk.document_id).version,
  }));
  if (!chunks.length) throw ragError('No relevant source passages were found. Add a suitable approved source or refine the topic.', 422);
  return chunks;
}

export function validateGroundedArtifacts(items, chunks, destination) {
  const sources = new Map(chunks.map((chunk) => [chunk.chunk_id, chunk]));
  if (!Array.isArray(items) || items.length !== 1) throw ragError('Expected one complete source-grounded artifact. Retry generation.', 422);
  return items.map((item) => {
    if (!String(item.title || '').trim() || !String(item.summary || '').trim() || !Array.isArray(item.sections) || !item.sections.length) {
      throw ragError('The generated resource is incomplete.', 422);
    }
    const references = item.sections.map((section) => {
      const source = sources.get(section.chunk_id);
      const quote = String(section.evidence_quote || '').trim();
      const norm = (s) => String(s).replace(/\s+/g, ' ').trim().toLowerCase();
      if (!source || !section.heading || !section.text || quote.length < 20 || !norm(source.text).includes(norm(quote))) {
        throw ragError('A resource section failed its source-evidence check.', 422);
      }
      return { document_id: source.document_id, chunk_id: source.chunk_id, page_number: source.page_number,
        version: source.version, evidence_quote: quote,
        citation: `${source.source_document}, version ${source.version}, PDF page ${source.page_number}` };
    });
    if (destination.startsWith('psychometric_')) {
      if (!item.question || !Array.isArray(item.rubric) || !item.rubric.length ||
          item.rubric.some((row) => !row.criterion || !row.expected || !Number.isInteger(row.points) || row.points < 1 || row.points > 20)) {
        throw ragError('The assessment needs a complete scoring rubric.', 422);
      }
    }
    if (destination === 'flashcards' && (!Array.isArray(item.cards) || !item.cards.length || item.cards.some((card) => !card.front || !card.back))) {
      throw ragError('Flashcards need a front and back for every card.', 422);
    }
    return { title: String(item.title), question: item.question || item.title, summary: String(item.summary),
      type: destination.startsWith('psychometric_') ? 'short_answer' : destination,
      topic: item.topic || chunks[0]?.clinical_subject, sections: item.sections.map(({ heading, text }) => ({ heading, text })),
      ...(destination.startsWith('psychometric_') ? { rubric: item.rubric, scenario: item.summary } : {}),
      ...(destination === 'flashcards' ? { cards: item.cards.map(({ front, back }) => ({ front, back })) } : {}),
      ...(destination === 'podcasts' ? { transcript: item.sections.map((section) => `${section.heading}\n${section.text}`).join('\n\n') } : {}),
      source_reference: references[0], source_references: references,
      source_citation: [...new Set(references.map((reference) => reference.citation))].join('; '),
      validation_status: 'evidence_checked_requires_clinical_review' };
  });
}

export function validateGroundedQuestions(questions, chunks, expectedCount, types, difficulty) {
  if (!Array.isArray(questions) || questions.length !== expectedCount) throw ragError('The generated batch is incomplete. Retry generation.', 422);
  const sources = new Map(chunks.map((chunk) => [chunk.chunk_id, chunk]));
  const seen = new Set();
  return questions.map((item) => {
    const source = sources.get(item.chunk_id);
    const quote = String(item.evidence_quote || '').trim();
    const normalize = (s) => String(s).replace(/\s+/g, ' ').trim().toLowerCase();
    if (!source || quote.length < 20 || !normalize(source.text).includes(normalize(quote))) {
      throw ragError('A generated question failed its source-evidence check. Nothing was published.', 422);
    }
    const fingerprint = normalize(item.question);
    if (!fingerprint || seen.has(fingerprint) || !types.includes(item.type) || item.difficulty !== difficulty) {
      throw ragError('Generated questions did not match the requested filters or contained duplicates.', 422);
    }
    seen.add(fingerprint);
    if (!item.feedback || !Array.isArray(item.options) || ![2, 3, 4].includes(item.options.length) ||
      item.options.some((option) => typeof option !== 'string' || !option.trim()) ||
      new Set(item.options.map(normalize)).size !== item.options.length ||
      !item.options.some((option) => normalize(option) === normalize(item.answer))) {
      throw ragError('A generated question has an invalid answer or options. Retry generation.', 422);
    }
    if (item.type === 'true_false' && (item.options.length !== 2 || !['true','false'].every((value) => item.options.some((option) => normalize(option) === value)))) {
      throw ragError('True/false questions must contain True and False options.', 422);
    }
    return { ...item, source_citation: `${source.source_document}, version ${source.version}, PDF page ${source.page_number}`,
      source_reference: { document_id: source.document_id, chunk_id: source.chunk_id, page_number: source.page_number,
        version: source.version, evidence_quote: quote }, validation_status: 'evidence_checked_requires_clinical_review' };
  });
}
