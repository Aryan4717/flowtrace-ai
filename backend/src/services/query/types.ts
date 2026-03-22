/**
 * Query engine types.
 */

export type TableName =
  | 'customers'
  | 'sales_orders'
  | 'deliveries'
  | 'invoices'
  | 'payments'
  | 'products';

export type WhereOp = 'eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains';

export type AggFn = 'sum' | 'count' | 'max' | 'min';

export interface WhereClause {
  field: string;
  op: WhereOp;
  value: unknown;
}

export interface JoinClause {
  table: TableName;
  on: [string, string];
}

export interface OrderByClause {
  field: string;
  desc?: boolean;
}

export interface AggClause {
  field: string;
  fn: AggFn;
}

export interface StructuredQuery {
  from: TableName;
  join?: JoinClause[];
  where?: WhereClause[];
  groupBy?: string[];
  agg?: AggClause[];
  orderBy?: OrderByClause[];
  limit?: number;
}

export interface QueryResult {
  rows: Record<string, unknown>[];
  rowCount: number;
  error?: string;
}

export type PredefinedQueryKey =
  | 'highest_billing_invoices'
  | 'orders_not_billed'
  | 'unpaid_invoices';

export interface QueryEngineInput {
  predefinedKey?: PredefinedQueryKey;
  structured?: StructuredQuery;
  sql?: string;
  graphPlan?: {
    startType?: string;
    endType?: string;
    pathTypes?: string[];
    filters?: Record<string, unknown>;
  };
}
