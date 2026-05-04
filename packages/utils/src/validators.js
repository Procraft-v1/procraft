export function isNonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isEmailLike(value) {
  if (!isNonEmpty(value)) return false;
  const simple = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return simple.test(value.trim());
}
