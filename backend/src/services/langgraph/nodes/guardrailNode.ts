import { logger } from '../../../utils/logger';
import { getGuardrailPrompt } from '../../llm';
import { invokeLlm } from '../llmInvoker';
import { traceLlmCall } from '../../observability';
import { keywordReject } from '../guardrailKeywords';
import type { PipelineState } from '../state';

const REJECT_MESSAGE = 'This system only supports dataset-related queries.';

const REJECT_CLASSIFICATIONS = new Set([
  'off_topic',
  'general_knowledge',
  'creative',
]);

const BORDERLINE_CONFIDENCE = 0.6;

export async function guardrailNode(
  state: PipelineState
): Promise<Partial<PipelineState>> {
  const { userInput } = state;
  logger.info('[guardrailNode] input', { userInput });

  const keywordCategory = keywordReject(userInput);
  if (keywordCategory) {
    logger.info('[guardrailNode] keyword reject', { category: keywordCategory });
    return {
      isValid: false,
      error: REJECT_MESSAGE,
    };
  }

  try {
    const prompt = getGuardrailPrompt(userInput);
    const raw = await traceLlmCall({
      queryType: 'guardrail',
      input: userInput,
      prompt,
      invoke: () => invokeLlm(prompt),
      nodeName: 'guardrail',
    });

    let classification = 'relevant';
    let confidence = 0.8;
    try {
      const parsed = JSON.parse(raw) as { classification?: string; confidence?: number };
      classification = parsed.classification ?? 'relevant';
      confidence = parsed.confidence ?? 0.8;
    } catch {
      logger.warn('[guardrailNode] failed to parse JSON, defaulting to relevant');
    }

    const isRejectClass = REJECT_CLASSIFICATIONS.has(classification);
    const isAmbiguous = classification === 'ambiguous';
    const isBorderline = classification === 'relevant' && confidence < BORDERLINE_CONFIDENCE;
    const isValid =
      classification === 'relevant' && confidence >= BORDERLINE_CONFIDENCE;

    if (isRejectClass || isAmbiguous || isBorderline) {
      logger.info('[guardrailNode] reject', {
        classification,
        confidence,
        isBorderline,
        isAmbiguous,
      });
      return {
        isValid: false,
        error: REJECT_MESSAGE,
      };
    }

    logger.info('[guardrailNode] output', {
      classification,
      confidence,
      isValid,
    });

    return {
      isValid,
      error: isValid ? null : REJECT_MESSAGE,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('[guardrailNode] error', msg);
    return {
      isValid: false,
      error: REJECT_MESSAGE,
    };
  }
}
