import { StateGraph, Annotation, START, END } from '@langchain/langgraph';
import { guardrailNode } from './nodes/guardrailNode';
import { intentNode } from './nodes/intentNode';
import { queryNode } from './nodes/queryNode';
import { executionNode } from './nodes/executionNode';
import { answerNode } from './nodes/answerNode';
import { withNodeTracing } from '../observability';

const PipelineAnnotation = Annotation.Root({
  userInput: Annotation<string>(),
  isValid: Annotation<boolean>(),
  queryType: Annotation<'filter' | 'graph' | null>(),
  generatedQuery: Annotation<string | Record<string, unknown> | null>(),
  queryResult: Annotation<unknown>(),
  finalAnswer: Annotation<string>(),
  error: Annotation<string | null>(),
});

type PipelineState = typeof PipelineAnnotation.State;

const guardedGuardrail = withNodeTracing(
  'guardrail',
  guardrailNode as (s: PipelineState) => Promise<Partial<PipelineState>>,
  'guardrail'
);
const guardedIntent = withNodeTracing(
  'intent',
  intentNode as (s: PipelineState) => Promise<Partial<PipelineState>>,
  'intent'
);
const guardedQuery = withNodeTracing(
  'query',
  queryNode as (s: PipelineState) => Promise<Partial<PipelineState>>,
  'query'
);
const guardedExecution = withNodeTracing(
  'execution',
  executionNode as (s: PipelineState) => Promise<Partial<PipelineState>>,
  'execution'
);
const guardedAnswer = withNodeTracing(
  'answer',
  answerNode as (s: PipelineState) => Promise<Partial<PipelineState>>,
  'answer'
);

function routeAfterGuardrail(state: PipelineState): 'intent' | 'answer' {
  return state.isValid ? 'intent' : 'answer';
}

export const pipeline = new StateGraph(PipelineAnnotation)
  .addNode('guardrail', guardedGuardrail)
  .addNode('intent', guardedIntent)
  .addNode('query', guardedQuery)
  .addNode('execution', guardedExecution)
  .addNode('answer', guardedAnswer)
  .addEdge(START, 'guardrail')
  .addConditionalEdges('guardrail', routeAfterGuardrail, {
    intent: 'intent',
    answer: 'answer',
  })
  .addEdge('intent', 'query')
  .addEdge('query', 'execution')
  .addEdge('execution', 'answer')
  .addEdge('answer', END)
  .compile();

export type { PipelineState };
export { PipelineAnnotation };
