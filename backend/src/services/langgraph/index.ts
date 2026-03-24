export { withNodeTracing, traceNode, type TraceNodeOptions } from '../observability';
export { keywordReject } from './guardrailKeywords';
export { pipeline, type PipelineState, PipelineAnnotation } from './pipeline';

import { pipeline } from './pipeline';
import { extractNodeIds } from '../../utils/extractNodeIds';

export async function runPipeline(userInput: string): Promise<{
  finalAnswer: string;
  isValid: boolean;
  queryType: 'filter' | 'graph' | null;
  error: string | null;
  highlightedNodeIds: string[];
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
    highlightedNodeIds: extractNodeIds(result.queryResult) ?? [],
  };
}
