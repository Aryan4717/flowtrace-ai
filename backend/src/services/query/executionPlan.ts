/**
 * Strict JSON execution plan for in-memory queries (GET_ALL / FILTER).
 */
import type { Customer, Delivery, Invoice, Payment, Product, SalesOrder } from '../../models';
import type { QueryResult } from './types';

type StoreType = {
  customers: Map<string, Customer>;
  orders: Map<string, SalesOrder>;
  deliveries: Map<string, Delivery>;
  invoices: Map<string, Invoice>;
  payments: Map<string, Payment>;
  products: Map<string, Product>;
};

export type PlanAction = 'GET_ALL' | 'FILTER';

export type PlanEntity =
  | 'customers'
  | 'orders'
  | 'deliveries'
  | 'invoices'
  | 'payments'
  | 'products';

export type FilterOperator = 'equals' | 'not_exists';

export interface PlanFilter {
  field: string;
  operator: FilterOperator;
  /** Compared as strings after JSON parse (may be number from model). */
  value?: string | number;
}

export interface ExecutionPlan {
  action: PlanAction;
  entity: PlanEntity;
  filters: PlanFilter[];
}

const ENTITY_KEYS: PlanEntity[] = [
  'customers',
  'orders',
  'deliveries',
  'invoices',
  'payments',
  'products',
];

function isValidFilter(f: unknown): f is PlanFilter {
  if (!f || typeof f !== 'object') return false;
  const x = f as Record<string, unknown>;
  if (typeof x.field !== 'string') return false;
  if (x.operator !== 'equals' && x.operator !== 'not_exists') return false;
  if (x.operator === 'equals' && x.value !== undefined) {
    const t = typeof x.value;
    if (t !== 'string' && t !== 'number') return false;
  }
  return true;
}

export function isExecutionPlan(obj: unknown): obj is ExecutionPlan {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  if (o.action !== 'GET_ALL' && o.action !== 'FILTER') return false;
  if (typeof o.entity !== 'string' || !ENTITY_KEYS.includes(o.entity as PlanEntity)) return false;
  if (!Array.isArray(o.filters)) return false;
  return o.filters.every(isValidFilter);
}

function getRowsForEntity(store: StoreType, entity: PlanEntity): Record<string, unknown>[] {
  switch (entity) {
    case 'customers':
      return Array.from(store.customers.values()) as unknown as Record<string, unknown>[];
    case 'orders':
      return Array.from(store.orders.values()) as unknown as Record<string, unknown>[];
    case 'deliveries':
      return Array.from(store.deliveries.values()) as unknown as Record<string, unknown>[];
    case 'invoices':
      return Array.from(store.invoices.values()) as unknown as Record<string, unknown>[];
    case 'payments':
      return Array.from(store.payments.values()) as unknown as Record<string, unknown>[];
    case 'products':
      return Array.from(store.products.values()) as unknown as Record<string, unknown>[];
    default:
      return [];
  }
}

function applyFilter(
  store: StoreType,
  entity: PlanEntity,
  row: Record<string, unknown>,
  f: PlanFilter
): boolean {
  if (f.operator === 'equals') {
    const v = row[f.field];
    return String(v ?? '') === String(f.value ?? '');
  }

  if (f.operator === 'not_exists') {
    if (entity === 'invoices' && f.field === 'payment') {
      const accountingDocument = String(row.accountingDocument ?? '');
      if (!accountingDocument) return true;
      return !store.payments.has(accountingDocument);
    }
    const v = row[f.field];
    return v == null || v === '';
  }

  return true;
}

/**
 * Runs GET_ALL or FILTER against the in-memory store.
 */
export function executeExecutionPlan(plan: ExecutionPlan, dataStore: StoreType): QueryResult {
  let rows = getRowsForEntity(dataStore, plan.entity);

  if (plan.action === 'GET_ALL') {
    return { rows, rowCount: rows.length };
  }

  if (plan.action === 'FILTER') {
    rows = rows.filter((row) =>
      plan.filters.every((f) => applyFilter(dataStore, plan.entity, row, f))
    );
    return { rows, rowCount: rows.length };
  }

  return { rows: [], rowCount: 0, error: 'Unknown plan action' };
}
