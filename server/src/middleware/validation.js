/**
 * Lightweight body validator — no external dependency.
 * Usage: validate({ email: 'required', password: 'required' })
 * Rule values: 'required' | 'email' | 'number' | ['required','email']
 */
export function validate(rules) {
  return (req, res, next) => {
    const errors = [];
    for (const [field, rule] of Object.entries(rules)) {
      const ruleList = Array.isArray(rule) ? rule : [rule];
      const value = req.body?.[field];

      if (ruleList.includes('required') && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required.`);
        continue;
      }
      if (value === undefined || value === null || value === '') continue;

      if (ruleList.includes('email') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.push(`${field} must be a valid email address.`);
      }
      if (ruleList.includes('number') && Number.isNaN(Number(value))) {
        errors.push(`${field} must be a number.`);
      }
    }
    if (errors.length) return res.status(400).json({ error: errors[0], errors });
    next();
  };
}

export function validatePagination(req, _res, next) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  req.pagination = { page, limit, offset: (page - 1) * limit };
  next();
}
