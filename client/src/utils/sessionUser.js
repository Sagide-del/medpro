import { normalizeProgram } from '../data/programs.js';

export function restoreSessionUser(saved, token) {
  if (!saved) return null;
  try {
    const user=JSON.parse(saved);
    let program=user.program;
    // Restore the enrollment carried by the login token, not the old local track override.
    // Authorization remains on the server; client-side decoding is only for display.
    try {
      const encoded=token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
      const claims=JSON.parse(atob(encoded));
      if (claims.role==='student' && user.role==='student') program=claims.program || 'EMT';
    } catch { /* A missing token is handled by the sign-in guard. */ }
    return {...user,program:normalizeProgram(program)};
  } catch {return null;}
}
