export const PROGRAMS = ['EMT', 'Paramedic', 'Nursing'];
export function canonicalProgram(value) {
  const program = String(value || '').trim().toLowerCase();
  if (['nursing', 'nurse'].includes(program)) return 'Nursing';
  if (['paramedic', 'emt-paramedic'].includes(program)) return 'Paramedic';
  if (['emt', 'emt-basic', 'emt-intermediate'].includes(program)) return 'EMT';
  return null;
}
