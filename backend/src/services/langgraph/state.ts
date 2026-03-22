/**
 * LangGraph pipeline state.
 */
export interface PipelineState {
  userInput: string;
  isValid: boolean;
  queryType: 'sql' | 'graph' | null;
  generatedQuery: string | Record<string, unknown> | null;
  queryResult: unknown;
  finalAnswer: string;
  error: string | null;
}
