import { verifyToken } from '../config/auth.js';

/** Verifies the Bearer JWT and attaches { sub, role, name, institutionId, program } to req.user */
export function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Sign in to continue.' });
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired. Sign in again.' });
  }
}

/** Attaches req.user if a valid token is present, but does not block anonymous requests */
export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      req.user = verifyToken(token);
    } catch {
      /* ignore invalid token for optional auth */
    }
  }
  next();
}
