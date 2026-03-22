import { logger } from '../../../utils/logger';
import { getSqlPrompt, getGraphPrompt } from '../../llm';
import { invokeLlm } from '../llmInvoker';
import { traceLlmCall } from '../../observability';
import type { PipelineState } from '../state';

export async function queryNode(
  state: PipelineState
): Promise<Partial<PipelineState>> {
  const { userInput, queryType } = state;
  logger.info('[queryNode] input', { userInput, queryType });

  if (!queryType) {
    logger.warn('[queryNode] no queryType, defaulting to graph');
  }

  const effectiveType = queryType ?? 'graph';
  const getPrompt = effectiveType === 'sql' ? getSqlPrompt : getGraphPrompt;

  try {
    const prompt = getPrompt(userInput);
    const raw = await traceLlmCall({
      queryType: effectiveType,
      input: userInput,
      prompt,
      invoke: () => invokeLlm(prompt),
      nodeName: 'query',
    });

    let generatedQuery: string | Record<string, unknown> = raw;
    try {
      generatedQuery = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      generatedQuery = raw;
    }

    logger.info('[queryNode] output', {
      queryType: effectiveType,
      hasQuery: !!generatedQuery,
    });

    return { generatedQuery };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('[queryNode] error', msg);
    return {
      generatedQuery: null,
      error: `Query generation failed: ${msg}`,
    };
  }
}
