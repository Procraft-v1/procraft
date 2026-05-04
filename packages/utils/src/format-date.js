/**
 * Lightweight ISO/date display helper — replace with Intl-based utilities per locale rollout.
 */

export function formatIsoDateShort(input) {
  if (!input) return '';
  const d = typeof input === 'string' || input instanceof Date ? new Date(input) : null;
  if (!d || Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}
