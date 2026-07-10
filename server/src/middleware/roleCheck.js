/** Factory: requireRole('super_admin', 'institution_admin') */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission for this action.' });
    }
    next();
  };
}

/** Allows super_admin OR institution_admin scoped to their own institution */
export function requireOwnInstitution(paramName = 'institutionId') {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Sign in to continue.' });
    if (req.user.role === 'super_admin') return next();
    const targetId = req.params[paramName] || req.body?.institutionId;
    if (req.user.role === 'institution_admin' && String(req.user.institutionId) === String(targetId)) {
      return next();
    }
    return res.status(403).json({ error: 'You do not have permission for this institution.' });
  };
}
