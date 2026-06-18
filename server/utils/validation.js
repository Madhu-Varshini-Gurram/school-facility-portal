const VALID_ROLES = ['parent', 'teacher', 'admin'];
const PUBLIC_ROLES = ['parent', 'teacher'];
const VALID_STATUSES = ['pending', 'in-progress', 'resolved'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];
const VALID_CATEGORIES = ['Sanitation', 'Electrical', 'Furniture', 'Structural', 'Safety', 'Other'];

function isNonEmptyString(val, maxLen = 500) {
  return typeof val === 'string' && val.trim().length > 0 && val.length <= maxLen;
}

function isEmail(val) {
  return typeof val === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
}

function sanitizeQueryString(val) {
  if (typeof val !== 'string' || !val.trim()) return null;
  return val.trim();
}

function isOneOf(val, allowed) {
  return typeof val === 'string' && allowed.includes(val);
}

module.exports = {
  VALID_ROLES,
  PUBLIC_ROLES,
  VALID_STATUSES,
  VALID_PRIORITIES,
  VALID_CATEGORIES,
  isNonEmptyString,
  isEmail,
  sanitizeQueryString,
  isOneOf
};
