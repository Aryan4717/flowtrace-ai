import { runPipeline } from '../langgraph';

/**
 * Process a natural-language chat message via the LangGraph pipeline.
 */
export async function chat(message: string): Promise<{
  finalAnswer: string;
  isValid: boolean;
  queryType: 'filter' | 'graph' | null;
  error: string | null;
}> {
  return runPipeline(message);
}
