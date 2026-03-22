import { logger } from '../../../utils/logger';
import { getGuardrailPrompt } from '../../llm';
import { invokeLlm } from '../llmInvoker';
import { traceLlmCall } from '../../observability';
import type { PipelineState } from '../state';

export async function guardrailNode(
  state: PipelineState
): Promise<Partial<PipelineState>> {
  const { userInput } = state;
  logger.info('[guardrailNode] input', { userInput });

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

    const isValid = classification === 'relevant' && confidence >= 0.5;

    logger.info('[guardrailNode] output', {
      classification,
      confidence,
      isValid,
    });

    return {
      isValid,
      error: isValid ? null : `Query classified as ${classification} (confidence: ${confidence}). I can only answer questions about customers, orders, deliveries, invoices, and payments.`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('[guardrailNode] error', msg);
    return {
      isValid: false,
      error: `Guardrail failed: ${msg}`,
    };
  }
}
