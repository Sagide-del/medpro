// Groups the flat, hard-coded section list for a Kenya EMS case into render-ready
// nodes: every `question` section is immediately followed (in the source
// worksheets) by exactly one `response` or `reflection` section that holds the
// actual input widget for that question -- this merges each pair into a single
// `qa` node so QuestionCard can render the prompt and its answer widget together
// as one card, matching the original worksheet's "question -> blank" layout.
export function groupCaseSections(sections = []) {
  const nodes = [];
  for (let index = 0; index < sections.length; index += 1) {
    const section = sections[index];
    if (section.type === 'question') {
      const next = sections[index + 1];
      if (next && (next.type === 'response' || next.type === 'reflection')) {
        nodes.push({ type: 'qa', id: section.id, question: section, answer: next });
        index += 1;
        continue;
      }
      nodes.push({ type: 'qa', id: section.id, question: section, answer: null });
      continue;
    }
    nodes.push(section);
  }
  return nodes;
}

// Every gradable answer node (response/reflection) in order -- used to compute
// "answered N of M" progress indicators.
export function gradableActivityIds(sections = []) {
  return sections
    .filter((section) => section.type === 'response' || section.type === 'reflection')
    .map((section) => section.id);
}

export function isAnswered(value) {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'object') {
    if (value.rows) {
      return Object.values(value.rows).some((row) => Object.values(row || {}).some((cell) => String(cell || '').trim().length > 0));
    }
    return Object.values(value).some((cell) => String(cell || '').trim().length > 0);
  }
  return false;
}
