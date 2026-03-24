/**
 * Query engine: routes to predefined or execution plan. In-memory only.
 */
import { store } from '../data/store';
import {
  getHighestBillingInvoices,
  getOrdersNotBilled,
  getUnpaidInvoices,
  matchPredefinedQuery,
} from './predefinedQueries';
import { executeStructuredQuery } from './structuredExecutor';
import { executeExecutionPlan, isExecutionPlan } from './executionPlan';
import type { QueryResult, StructuredQuery } from './types';

export const FILTER_PARSE_FALLBACK =
  'Try queries like: unpaid invoices, show all customers, orders for customer followed by an ID.';

export interface ExecuteInput {
  userInput?: string;
  queryType?: 'filter' | 'graph';
  generatedQuery?: string | Record<string, unknown> | null;
  structured?: StructuredQuery;
}

function runPredefined(key: string): QueryResult {
  switch (key) {
    case 'highest_billing_invoices':
      return getHighestBillingInvoices(store);
    case 'orders_not_billed':
      return getOrdersNotBilled(store);
    case 'unpaid_invoices':
      return getUnpaidInvoices(store);
    default:
      return { rows: [], rowCount: 0, error: `Unknown predefined query: ${key}` };
  }
}

/**
 * Execute a query. Uses in-memory store only.
 * Flow: optional structured (legacy) -> predefined match -> strict JSON execution plan.
 */
export function executeInMemoryQuery(input: ExecuteInput): QueryResult | { paths: string[][]; entities: unknown[] } {
  const { userInput, generatedQuery, structured } = input;

  if (structured) {
    const result = executeStructuredQuery(structured, store);
    if (result.rows.length > 0 || result.error) return result;
  }

  if (userInput) {
    const predefinedKey = matchPredefinedQuery(userInput);
    if (predefinedKey) {
      return runPredefined(predefinedKey);
    }
  }

  if (input.queryType === 'filter' && generatedQuery) {
    let obj: Record<string, unknown> | null = null;
    if (typeof generatedQuery === 'string') {
      try {
        obj = JSON.parse(generatedQuery) as Record<string, unknown>;
      } catch {
        obj = null;
      }
    } else if (generatedQuery && typeof generatedQuery === 'object') {
      obj = generatedQuery as Record<string, unknown>;
    }

    if (obj && isExecutionPlan(obj)) {
      return executeExecutionPlan(obj, store);
    }

    return {
      rows: [],
      rowCount: 0,
      error: `Could not parse filter plan. ${FILTER_PARSE_FALLBACK}`,
    };
  }

  return { rows: [], rowCount: 0, error: 'No matching query handler' };
}
