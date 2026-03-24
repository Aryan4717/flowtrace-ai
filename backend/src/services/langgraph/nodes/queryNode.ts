import { logger } from '../../../utils/logger';
import {
  getFilterPrompt,
  getGraphPrompt,
  getCorrectionPrompt,
  getJsonRetryPrompt,
  looksLikeSql,
} from '../../llm';
import { parseJsonFromLlmOutput } from '../../llm/jsonExtract';
import { isExecutionPlan } from '../../query/executionPlan';
import { FILTER_PARSE_FALLBACK } from '../../query/queryEngine';
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
  const getPrompt = effectiveType === 'filter' ? getFilterPrompt : getGraphPrompt;

  try {
    let prompt = getPrompt(userInput);
    let raw = await traceLlmCall({
      queryType: effectiveType,
      input: userInput,
      prompt,
      invoke: () => invokeLlm(prompt),
      nodeName: 'query',
    });

    if (effectiveType === 'filter' && looksLikeSql(raw)) {
      logger.warn('[queryNode] LLM returned SQL-like output, retrying with correction prompt');
      prompt = getCorrectionPrompt(userInput);
      raw = await traceLlmCall({
        queryType: effectiveType,
        input: userInput,
        prompt,
        invoke: () => invokeLlm(prompt),
        nodeName: 'query',
      });
    }

    if (effectiveType === 'filter') {
      let parsed: Record<string, unknown>;
      try {
        parsed = parseJsonFromLlmOutput(raw);
      } catch {
        logger.warn('[queryNode] JSON parse failed, retrying with JSON-only prompt');
        prompt = getJsonRetryPrompt(userInput);
        raw = await traceLlmCall({
          queryType: effectiveType,
          input: userInput,
          prompt,
          invoke: () => invokeLlm(prompt),
          nodeName: 'query',
        });
        try {
          parsed = parseJsonFromLlmOutput(raw);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          logger.error('[queryNode] invalid LLM JSON after retry', msg);
          return {
            generatedQuery: null,
            error: `Invalid LLM JSON output. ${FILTER_PARSE_FALLBACK}`,
          };
        }
      }

      if (!isExecutionPlan(parsed)) {
        logger.warn('[queryNode] parsed JSON is not a valid execution plan');
        return {
          generatedQuery: null,
          error: `Invalid execution plan. ${FILTER_PARSE_FALLBACK}`,
        };
      }

      logger.info('[queryNode] output', {
        queryType: effectiveType,
        action: parsed.action,
        entity: parsed.entity,
      });

      return { generatedQuery: parsed };
    }

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
