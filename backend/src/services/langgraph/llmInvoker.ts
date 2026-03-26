/**
 * LLM invoker - delegates to callLLM from llm.service.
 * Used by pipeline nodes; integrate with traceLlmCall for Langfuse observability.
 */

import { callLLM } from '../llm';

export async function invokeLlm(prompt: string): Promise<string> {
  return callLLM(prompt);
}
