/**
 * Serialization helpers matching System.Text.Json output for DateTimeOffset
 * ("2026-06-11T12:34:56.789+00:00") and DateOnly ("2026-06-11").
 */

export function toDateTimeOffsetString(value: Date | string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().replace('Z', '+00:00');
}

/** TypeORM returns 'date' columns as "yyyy-MM-dd" strings already; normalize Dates defensively. */
export function toDateOnlyString(value: Date | string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  return value.toISOString().slice(0, 10);
}

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateOnly(value: string): boolean {
  if (!DATE_ONLY_PATTERN.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/** Compare two yyyy-MM-dd strings: returns negative/zero/positive like DateOnly.CompareTo. */
export function compareDateOnly(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
