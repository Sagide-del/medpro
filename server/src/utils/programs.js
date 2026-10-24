export const PROGRAMS = ['EMT', 'Paramedic', 'Nursing'];
export function canonicalProgram(value) {
  const program = String(value || '').trim().toLowerCase();
  if (['nursing', 'nurse'].includes(program)) return 'Nursing';
  if (['paramedic', 'emt-paramedic'].includes(program)) return 'Paramedic';
  if (['emt', 'emt-basic', 'emt-intermediate'].includes(program)) return 'EMT';
  return null;
}

export function studentProgramSql(alias='u') {
  return `CASE WHEN lower(trim(${alias}.program)) IN ('nurse','nursing') THEN 'Nursing' WHEN lower(trim(${alias}.program)) IN ('paramedic','emt-paramedic') THEN 'Paramedic' ELSE 'EMT' END`;
}
