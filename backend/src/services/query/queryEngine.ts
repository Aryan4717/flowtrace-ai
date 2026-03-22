/**
 * Query engine: routes to predefined or structured. In-memory only.
 */
import { store } from '../data/store';
import {
  getHighestBillingInvoices,
  getOrdersNotBilled,
  getUnpaidInvoices,
  matchPredefinedQuery,
} from './predefinedQueries';
import { executeStructuredQuery } from './structuredExecutor';
import type { QueryResult, StructuredQuery } from './types';

export interface ExecuteInput {
  userInput?: string;
  queryType?: 'sql' | 'graph';
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
 * Flow: predefined match (by userInput) -> structured.
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

  if (input.queryType === 'sql' && generatedQuery) {
    const sqlObj = typeof generatedQuery === 'string'
      ? (() => { try { return JSON.parse(generatedQuery) as Record<string, unknown>; } catch { return {}; } })()
      : (generatedQuery as Record<string, unknown>);
    if (sqlObj?.sql && userInput) {
      const predefinedKey = matchPredefinedQuery(userInput);
      if (predefinedKey) {
        return runPredefined(predefinedKey);
      }
    }
    return {
      rows: [],
      rowCount: 0,
      error: 'In-memory engine: try "highest billing", "orders not billed", or "unpaid invoices". Raw SQL is not executed.',
    };
  }

  return { rows: [], rowCount: 0, error: 'No matching query handler' };
}
