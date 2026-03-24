import { logger } from '../../../utils/logger';
import { getIntentPrompt } from '../../llm';
import { invokeLlm } from '../llmInvoker';
import { traceLlmCall } from '../../observability';
import type { PipelineState } from '../state';

export async function intentNode(
  state: PipelineState
): Promise<Partial<PipelineState>> {
  const { userInput } = state;
  logger.info('[intentNode] input', { userInput });

  try {
    const prompt = getIntentPrompt(userInput);
    const raw = await traceLlmCall({
      queryType: 'intent',
      input: userInput,
      prompt,
      invoke: () => invokeLlm(prompt),
      nodeName: 'intent',
    });

    let queryType: 'filter' | 'graph' = 'graph';
    try {
      const parsed = JSON.parse(raw) as { queryType?: string };
      const qt = parsed?.queryType?.toLowerCase();
      if (qt === 'filter' || qt === 'graph') {
        queryType = qt;
      }
    } catch {
      logger.warn('[intentNode] failed to parse JSON, defaulting to graph');
    }

    logger.info('[intentNode] output', { queryType });

    return { queryType };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('[intentNode] error', msg);
    return {
      queryType: null,
      error: `Intent classification failed: ${msg}`,
    };
  }
}
