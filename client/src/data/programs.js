export const PROGRAMS = ['EMT', 'Paramedic', 'Nursing'];
export function normalizeProgram(value) {
  const program = String(value || '').trim().toLowerCase();
  if (program.includes('nurs')) return 'Nursing';
  return program.includes('paramedic') ? 'Paramedic' : 'EMT';
}
