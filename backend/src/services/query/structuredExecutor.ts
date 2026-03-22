/**
 * Executes structured queries against the in-memory store.
 */
import type { Customer, Delivery, Invoice, Payment, Product, SalesOrder } from '../../models';
import type {
  StructuredQuery,
  QueryResult,
  WhereOp,
  AggFn,
  TableName,
} from './types';

type StoreType = {
  customers: Map<string, Customer>;
  orders: Map<string, SalesOrder>;
  deliveries: Map<string, Delivery>;
  invoices: Map<string, Invoice>;
  payments: Map<string, Payment>;
  products: Map<string, Product>;
};

const TABLE_TO_MAP: Record<TableName, keyof StoreType> = {
  customers: 'customers',
  sales_orders: 'orders',
  deliveries: 'deliveries',
  invoices: 'invoices',
  payments: 'payments',
  products: 'products',
};

function getStoreArray(store: StoreType, table: TableName): Record<string, unknown>[] {
  const key = TABLE_TO_MAP[table];
  const map = store[key] as Map<string, unknown>;
  return Array.from(map.values()) as Record<string, unknown>[];
}

function applyWhere(row: Record<string, unknown>, field: string, op: WhereOp, value: unknown): boolean {
  const v = row[field];
  if (v === undefined) return false;

  switch (op) {
    case 'eq':
      return v === value;
    case 'gt':
      return typeof v === 'number' && typeof value === 'number' && v > value;
    case 'gte':
      return typeof v === 'number' && typeof value === 'number' && v >= value;
    case 'lt':
      return typeof v === 'number' && typeof value === 'number' && v < value;
    case 'lte':
      return typeof v === 'number' && typeof value === 'number' && v <= value;
    case 'contains':
      return typeof v === 'string' && typeof value === 'string' && v.toLowerCase().includes(value.toLowerCase());
    default:
      return false;
  }
}

function applyJoins(
  store: StoreType,
  fromTable: TableName,
  fromRows: Record<string, unknown>[],
  joinClauses: { table: TableName; on: [string, string] }[]
): Record<string, unknown>[] {
  let result = fromRows;

  for (const j of joinClauses) {
    const rightArr = getStoreArray(store, j.table);
    const [leftField, rightField] = j.on;
    const joined: Record<string, unknown>[] = [];

    for (const leftRow of result) {
      const leftVal = leftRow[leftField];
      if (leftVal == null) continue;

      const rightRow = rightArr.find((r) => r[rightField] === leftVal);
      if (rightRow) {
        joined.push({ ...leftRow, [`_${j.table}`]: rightRow });
      }
    }
    result = joined;
  }

  return result;
}

function applyAgg(
  rows: Record<string, unknown>[],
  groupBy: string[],
  agg: { field: string; fn: AggFn }[]
): Record<string, unknown>[] {
  if (groupBy.length === 0) {
    const out: Record<string, unknown> = {};
    for (const a of agg) {
      const vals = rows.map((r) => r[a.field]).filter((v) => v != null && typeof v === 'number');
      if (a.fn === 'sum') out[`${a.field}_sum`] = vals.reduce((s, x) => s + (x as number), 0);
      else if (a.fn === 'count') out[`${a.field}_count`] = vals.length;
      else if (a.fn === 'max') out[`${a.field}_max`] = vals.length ? Math.max(...(vals as number[])) : null;
      else if (a.fn === 'min') out[`${a.field}_min`] = vals.length ? Math.min(...(vals as number[])) : null;
    }
    return [out];
  }

  const groups = new Map<string, Record<string, unknown>[]>();
  for (const row of rows) {
    const key = groupBy.map((g) => String(row[g] ?? '')).join('|');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  return Array.from(groups.entries()).map(([_, groupRows]) => {
    const first = groupRows[0]!;
    const out: Record<string, unknown> = {};
    for (const g of groupBy) {
      out[g] = first[g];
    }
    for (const a of agg) {
      const vals = groupRows.map((r) => r[a.field]).filter((v) => v != null && typeof v === 'number');
      if (a.fn === 'sum') out[`${a.field}_sum`] = vals.reduce((s, x) => s + (x as number), 0);
      else if (a.fn === 'count') out[`${a.field}_count`] = vals.length;
      else if (a.fn === 'max') out[`${a.field}_max`] = vals.length ? Math.max(...(vals as number[])) : null;
      else if (a.fn === 'min') out[`${a.field}_min`] = vals.length ? Math.min(...(vals as number[])) : null;
    }
    return out;
  });
}

export function executeStructuredQuery(
  query: StructuredQuery,
  dataStore: StoreType
): QueryResult {
  try {
    let rows = getStoreArray(dataStore, query.from);

    if (query.where?.length) {
      rows = rows.filter((row) =>
        query.where!.every((w) => applyWhere(row, w.field, w.op, w.value))
      );
    }

    if (query.join?.length) {
      rows = applyJoins(dataStore, query.from, rows, query.join);
    }

    if (query.agg?.length) {
      rows = applyAgg(rows, query.groupBy ?? [], query.agg);
    }

    if (query.orderBy?.length) {
      const orderBy = [...query.orderBy].reverse();
      for (const o of orderBy) {
        rows.sort((a, b) => {
          const va = a[o.field];
          const vb = b[o.field];
          const cmp = va === vb ? 0 : (va as number) < (vb as number) ? -1 : 1;
          return o.desc ? -cmp : cmp;
        });
      }
    }

    if (query.limit != null) {
      rows = rows.slice(0, query.limit);
    }

    return { rows, rowCount: rows.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { rows: [], rowCount: 0, error: msg };
  }
}
