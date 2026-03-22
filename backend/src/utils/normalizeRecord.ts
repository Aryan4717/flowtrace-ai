/**
 * Normalizes raw SAP-style records: flattens nested structures,
 * converts dates to ISO, removes null/undefined, standardizes keys.
 */

const DATE_KEYS = new Set([
  'creationDate',
  'createdAt',
  'postingDate',
  'creationTime',
  'date',
]);

const FLATTEN_RENAMES: Record<string, string> = {
  creationTime: 'creationDate',
};

function extractNested(value: unknown): unknown {
  if (value == null) return value;
  if (typeof value !== 'object' || Array.isArray(value)) return value;

  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj);

  if (keys.length === 1) {
    const k = keys[0];
    if (k === 'value' || k === 'date' || k === 'content') {
      return obj[k];
    }
  }
  return value;
}

function toIsoDate(value: unknown): string {
  if (value == null) return '';
  const s = String(value).trim();
  if (!s) return '';

  // YYYYMMDD -> YYYY-MM-DD
  if (/^\d{8}$/.test(s)) {
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  }

  // /Date(ms)/
  const msMatch = s.match(/\/Date\((\d+)\)\//);
  if (msMatch) {
    return new Date(Number(msMatch[1])).toISOString();
  }

  // Already ISO or parseable
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toISOString();
}

function isDateKey(key: string): boolean {
  const lower = key.toLowerCase();
  return DATE_KEYS.has(key) || DATE_KEYS.has(lower) || lower.endsWith('date');
}

function toCamelCase(key: string): string {
  if (!key || key[0] === key[0].toLowerCase()) return key;
  return key[0].toLowerCase() + key.slice(1);
}

/**
 * Normalizes a raw SAP record: flattens nested fields (e.g. creationTime.value),
 * converts date fields to ISO strings, removes null/undefined, standardizes keys.
 */
export function normalizeRecord(
  record: Record<string, unknown>
): Record<string, unknown> {
  if (record == null || typeof record !== 'object' || Array.isArray(record)) {
    return {};
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(record)) {
    const extracted = extractNested(value);
    if (extracted === null || extracted === undefined) continue;

    const outKey = toCamelCase(FLATTEN_RENAMES[key] ?? key);
    result[outKey] = isDateKey(outKey) ? toIsoDate(extracted) : extracted;
  }

  return result;
}
