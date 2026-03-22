/**
 * Executes generated queries - in-memory engine (predefined/structured) or graph traversal.
 */
import { store } from '../data/store';
import { buildGraphFromStore } from '../graph/graphBuilder';
import type { NodeType } from '../graph/graph';
import { executeInMemoryQuery, matchPredefinedQuery } from '../query';

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

export function executeGraphPlan(
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

export async function executeQuery(
  queryType: 'sql' | 'graph',
  generatedQuery: string | Record<string, unknown> | null,
  userInput?: string
): Promise<unknown> {
  if (!generatedQuery) {
    return { rows: [], error: 'No query generated' };
  }

  if (userInput && matchPredefinedQuery(userInput)) {
    const inMemoryResult = executeInMemoryQuery({
      userInput,
      queryType: 'sql',
      generatedQuery,
    });
    const hasRows = 'rows' in inMemoryResult && Array.isArray(inMemoryResult.rows) && inMemoryResult.rows.length > 0;
    if (hasRows || ('error' in inMemoryResult && (inMemoryResult as { error?: string }).error)) {
      return inMemoryResult;
    }
  }

  if (queryType === 'graph') {
    const graphResult = executeGraphPlan(generatedQuery);
    const hasPaths = graphResult.paths.length > 0;
    if (hasPaths) return graphResult;
    if (userInput && matchPredefinedQuery(userInput)) {
      const fallback = executeInMemoryQuery({ userInput, queryType: 'sql', generatedQuery });
      return fallback;
    }
    return graphResult;
  }

  const inMemoryResult = executeInMemoryQuery({
    userInput,
    queryType: 'sql',
    generatedQuery,
  });

  const hasRows =
    'rows' in inMemoryResult &&
    Array.isArray(inMemoryResult.rows) &&
    inMemoryResult.rows.length > 0;

  const hasError = 'error' in inMemoryResult && (inMemoryResult as { error?: string }).error;

  if (hasRows || hasError) {
    return inMemoryResult;
  }

  const isGraphPlan =
    generatedQuery &&
    typeof generatedQuery === 'object' &&
    ('startType' in generatedQuery || 'endType' in generatedQuery || 'pathTypes' in generatedQuery);

  if (isGraphPlan) {
    return executeGraphPlan(generatedQuery);
  }

  return inMemoryResult;
}
