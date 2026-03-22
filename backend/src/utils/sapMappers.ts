/**
 * Safe value extraction helpers for SAP JSON mappers.
 * Handles null, undefined, and invalid values without throwing.
 */

export function safeString(value: unknown): string {
  if (value == null) return '';
  return String(value).trim();
}

export function safeNumber(value: unknown): number {
  if (value == null) return 0;
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
}

export function safeDate(value: unknown): string {
  if (value == null) return '';
  return String(value).trim();
}
