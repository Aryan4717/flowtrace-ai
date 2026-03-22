/**
 * Extract graph node IDs from a query result.
 * Used to highlight relevant nodes in the graph UI.
 */
const ID_KEYS = [
  'id',
  'customerId',
  'salesOrderId',
  'deliveryId',
  'accountingDocument',
] as const;

function collectFromRow(row: unknown, ids: Set<string>): void {
  if (row === null || typeof row !== 'object') return;
  const record = row as Record<string, unknown>;
  for (const key of ID_KEYS) {
    const val = record[key];
    if (typeof val === 'string' && val.trim()) ids.add(val);
  }
}

export function extractNodeIds(queryResult: unknown): string[] {
  const ids = new Set<string>();

  if (queryResult === null || queryResult === undefined) return [];

  const obj = queryResult as Record<string, unknown>;

  if (Array.isArray(obj.rows)) {
    for (const row of obj.rows) collectFromRow(row, ids);
  }

  if (Array.isArray(obj.paths)) {
    for (const path of obj.paths) {
      if (Array.isArray(path)) {
        for (const id of path) {
          if (typeof id === 'string' && id.trim()) ids.add(id);
        }
      }
    }
  }

  if (Array.isArray(obj.entities)) {
    for (const e of obj.entities) {
      if (typeof e === 'string' && e.trim()) ids.add(e);
    }
  }

  return Array.from(ids);
}
