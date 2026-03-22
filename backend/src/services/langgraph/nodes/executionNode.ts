import { logger } from '../../../utils/logger';
import { executeQuery } from '../queryExecutor';
import { traceNode } from '../../observability';
import type { PipelineState } from '../state';

export async function executionNode(
  state: PipelineState
): Promise<Partial<PipelineState>> {
  const { queryType, generatedQuery } = state;
  logger.info('[executionNode] input', { queryType, hasQuery: !!generatedQuery });

  if (!queryType || !generatedQuery) {
    const error = !queryType
      ? 'No query type from intent'
      : 'No query generated';
    logger.warn('[executionNode]', error);
    return {
      queryResult: { rows: [], error },
      error,
    };
  }

  return traceNode({
    nodeName: 'execution',
    input: { queryType, generatedQuery, userInput: state.userInput },
    execute: async () => {
      try {
        const queryResult = await executeQuery(queryType, generatedQuery, state.userInput);
        const hasError =
          queryResult &&
          typeof queryResult === 'object' &&
          'error' in queryResult &&
          (queryResult as { error?: string }).error;

        if (hasError) {
          logger.warn('[executionNode] execution error', hasError);
          return {
            queryResult,
            error: String(hasError),
          };
        }

        const rows = (queryResult as { rows?: unknown[] })?.rows ?? [];
        const isEmpty = !Array.isArray(rows) || rows.length === 0;

        if (isEmpty) {
          logger.info('[executionNode] empty results');
        } else {
          logger.info('[executionNode] output', {
            rowCount: Array.isArray(rows) ? rows.length : 0,
          });
        }

        return { queryResult, error: null };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error('[executionNode] error', msg);
        return {
          queryResult: { rows: [], error: msg },
          error: msg,
        };
      }
    },
    queryType,
  });
}
