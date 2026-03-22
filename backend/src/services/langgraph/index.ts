export { withNodeTracing, traceNode, type TraceNodeOptions } from '../observability';
export { keywordReject } from './guardrailKeywords';
export { pipeline, type PipelineState, PipelineAnnotation } from './pipeline';

import { pipeline } from './pipeline';

export async function runPipeline(userInput: string): Promise<{
  finalAnswer: string;
  isValid: boolean;
  queryType: 'sql' | 'graph' | null;
  error: string | null;
}> {
  const result = await pipeline.invoke({
    userInput,
    isValid: false,
    queryType: null,
    generatedQuery: null,
    queryResult: undefined,
    finalAnswer: '',
    error: null,
  });
  return {
    finalAnswer: result.finalAnswer ?? '',
    isValid: result.isValid ?? false,
    queryType: result.queryType ?? null,
    error: result.error ?? null,
  };
}
