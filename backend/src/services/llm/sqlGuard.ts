/**
 * Detects SQL-like output from the LLM. Used to reject and retry with correction prompt.
 */

const SQL_KEYWORDS = [
  'SELECT',
  'INSERT',
  'UPDATE',
  'DELETE',
  'FROM',
  'WHERE',
  'JOIN',
  'LEFT JOIN',
  'RIGHT JOIN',
  'INNER JOIN',
  'OUTER JOIN',
  'DROP',
  'CREATE',
  'ALTER',
  'GROUP BY',
  'ORDER BY',
  'UNION',
  'HAVING',
];

const SQL_KEY_PATTERN = /"sql"\s*:/i;

/**
 * Returns true if the raw LLM output looks like SQL (keywords or "sql" JSON key).
 */
export function looksLikeSql(raw: string): boolean {
  if (!raw || typeof raw !== 'string') return false;

  const trimmed = raw.trim();
  if (!trimmed) return false;

  if (SQL_KEY_PATTERN.test(trimmed)) return true;

  const upper = trimmed.toUpperCase();
  for (const kw of SQL_KEYWORDS) {
    if (upper.includes(kw)) return true;
  }

  return false;
}
