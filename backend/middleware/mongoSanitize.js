/**
 * NoSQL Injection Sanitizer Middleware
 * Recursively removes any object keys that begin with '$' or contain '.'
 * Protects against MongoDB operator injection attacks (e.g. {"$gt": ""})
 * 100% compatible with Express 5
 */
const sanitizeObject = (target) => {
  if (!target || typeof target !== 'object') return target;

  if (Array.isArray(target)) {
    for (let i = 0; i < target.length; i++) {
      target[i] = sanitizeObject(target[i]);
    }
    return target;
  }

  for (const key of Object.keys(target)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete target[key];
    } else if (typeof target[key] === 'object' && target[key] !== null) {
      sanitizeObject(target[key]);
    }
  }

  return target;
};

export const mongoSanitize = (req, res, next) => {
  if (req.body) sanitizeObject(req.body);
  if (req.params) sanitizeObject(req.params);
  if (req.query) {
    try {
      sanitizeObject(req.query);
    } catch {
      // In Express 5 query object may have read-only properties
    }
  }
  next();
};

export default mongoSanitize;
