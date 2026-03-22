import { logger } from '../../../utils/logger';
import { getAnswerPrompt } from '../../llm';
import { invokeLlm } from '../llmInvoker';
import { traceLlmCall } from '../../observability';
import type { PipelineState } from '../state';

export async function answerNode(
  state: PipelineState
): Promise<Partial<PipelineState>> {
  const { userInput, isValid, queryResult, error } = state;
  logger.info('[answerNode] input', {
    isValid,
    hasResult: !!queryResult,
    hasError: !!error,
  });

  if (!isValid && error) {
    logger.info('[answerNode] returning error message for invalid query');
    return {
      finalAnswer: error,
    };
  }

  if (error) {
    const fallback = `I couldn't complete your request. ${error}`;
    logger.info('[answerNode] returning error fallback');
    return { finalAnswer: fallback };
  }

  const resultError =
    queryResult &&
    typeof queryResult === 'object' &&
    'error' in queryResult &&
    (queryResult as { error?: string }).error;

  if (resultError) {
    const fallback = `Query execution failed: ${resultError}`;
    logger.info('[answerNode] returning execution error');
    return { finalAnswer: fallback };
  }

  const rows = (queryResult as { rows?: unknown[] } | undefined)?.rows;
  const paths = (queryResult as { paths?: unknown[] } | undefined)?.paths;
  const isEmpty =
    (!Array.isArray(rows) || rows.length === 0) &&
    (!Array.isArray(paths) || paths.length === 0);

  if (isEmpty) {
    logger.info('[answerNode] empty results - requesting explanation');
    const fallback =
      'No matching data found for your query. The dataset may not contain records that match your criteria.';
    return { finalAnswer: fallback };
  }

  try {
    const dataStr = JSON.stringify(queryResult, null, 2);
    const prompt = getAnswerPrompt(dataStr);
    const finalAnswer = await traceLlmCall({
      queryType: 'answer',
      input: { userInput, data: dataStr },
      prompt,
      invoke: () => invokeLlm(prompt),
      nodeName: 'answer',
    });

    logger.info('[answerNode] output', { answerLength: finalAnswer.length });
    return { finalAnswer };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('[answerNode] error', msg);
    return {
      finalAnswer: `I found data but couldn't generate an explanation: ${msg}`,
    };
  }
}
