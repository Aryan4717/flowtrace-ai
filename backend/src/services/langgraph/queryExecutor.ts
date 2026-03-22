/**
 * Executes generated queries - SQL (via pg) or graph traversal.
 */
import { config } from '../../config';
import { store } from '../data/store';
import { buildGraphFromStore } from '../graph/graphBuilder';
import type { NodeType } from '../graph/graph';

const NODE_TYPES: NodeType[] = [
  'Customer',
  'SalesOrder',
  'Delivery',
  'Invoice',
  'Payment',
  'Product',
];

function getEntitiesByType(type: NodeType): string[] {
  switch (type) {
    case 'Customer':
      return Array.from(store.customers.keys());
    case 'SalesOrder':
      return Array.from(store.orders.keys());
    case 'Delivery':
      return Array.from(store.deliveries.keys());
    case 'Invoice':
      return Array.from(store.invoices.keys());
    case 'Payment':
      return Array.from(store.payments.keys());
    case 'Product':
      return Array.from(store.products.keys());
    default:
      return [];
  }
}

export interface GraphPlan {
  startType?: string;
  endType?: string;
  pathTypes?: string[];
  filters?: Record<string, unknown>;
}

export async function executeQuery(
  queryType: 'sql' | 'graph',
  generatedQuery: string | Record<string, unknown> | null
): Promise<unknown> {
  if (!generatedQuery) {
    return { rows: [], error: 'No query generated' };
  }

  if (queryType === 'sql') {
    return executeSql(generatedQuery);
  }

  if (queryType === 'graph') {
    return executeGraphPlan(generatedQuery);
  }

  return { rows: [], error: `Unknown query type: ${queryType}` };
}

async function executeSql(generatedQuery: string | Record<string, unknown>): Promise<unknown> {
  let sql: string | null = null;
  if (typeof generatedQuery === 'string') {
    try {
      const parsed = JSON.parse(generatedQuery) as { sql?: string };
      sql = parsed?.sql ?? null;
    } catch {
      sql = generatedQuery;
    }
  } else if (generatedQuery && typeof generatedQuery === 'object' && 'sql' in generatedQuery) {
    sql = String((generatedQuery as { sql: string }).sql);
  }

  if (!sql) {
    return { rows: [], error: 'No SQL in generated query' };
  }

  if (!config.databaseUrl) {
    return {
      rows: [],
      error: 'DATABASE_URL not configured. SQL execution requires PostgreSQL.',
    };
  }

  try {
    const { default: pg } = await import('pg');
    const client = new pg.Client({ connectionString: config.databaseUrl });
    await client.connect();
    try {
      const res = await client.query(sql);
      return { rows: res.rows, rowCount: res.rowCount };
    } finally {
      await client.end();
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { rows: [], error: msg };
  }
}

function executeGraphPlan(
  generatedQuery: string | Record<string, unknown>
): { paths: string[][]; entities: unknown[] } {
  const graph = buildGraphFromStore();
  let plan: GraphPlan = {};

  if (typeof generatedQuery === 'string') {
    try {
      plan = JSON.parse(generatedQuery) as GraphPlan;
    } catch {
      return { paths: [], entities: [] };
    }
  } else if (generatedQuery && typeof generatedQuery === 'object') {
    plan = generatedQuery as GraphPlan;
  }

  const startType = (plan.startType ?? 'Customer') as NodeType;
  const endType = (plan.endType ?? plan.pathTypes?.[plan.pathTypes.length - 1] ?? 'Payment') as NodeType;
  const pathTypes = plan.pathTypes ?? [startType, endType];

  const startIds = getEntitiesByType(startType);
  const endIds = getEntitiesByType(endType);

  const paths: string[][] = [];
  const seen = new Set<string>();

  for (const fromId of startIds.slice(0, 10)) {
    for (const toId of endIds.slice(0, 10)) {
      if (fromId === toId && startType === endType) {
        paths.push([fromId]);
        seen.add(fromId);
      } else {
        const path = graph.tracePath(fromId, toId, 'BFS');
        if (path) {
          const key = path.join('->');
          if (!seen.has(key)) {
            seen.add(key);
            paths.push(path);
          }
        }
      }
    }
  }

  const entities = paths.flat().slice(0, 50);
  return { paths: paths.slice(0, 20), entities };
}
