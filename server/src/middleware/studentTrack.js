import { canonicalProgram } from '../utils/programs.js';

export function enforceStudentTrack(req,res,next) {
  if (req.user?.role !== 'student') return next();
  const program=canonicalProgram(req.user.program) || 'EMT';
  for (const supplied of [req.query?.program,req.body?.program]) {
    if (supplied !== undefined && supplied !== '' && canonicalProgram(supplied) !== program) {
      return res.status(403).json({error:'This content belongs to a different study track. Use your account’s enrolled track.',code:'STUDY_TRACK_MISMATCH'});
    }
  }
  req.user.program=program;
  req.query.program=program;
  if (req.body && typeof req.body==='object' && !Array.isArray(req.body)) req.body.program=program;
  return next();
}
